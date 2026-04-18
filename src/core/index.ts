// ─────────────────────────────────────────────
// auto-breadcrumb · core
// Router-agnostic logic: parsing, matching, resolving, SEO
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'

// ─── Public types ────────────────────────────

export interface RouteParams {
  [key: string]: string
}

export interface RouteConfig {
  /** Express-style path, e.g. "/products/:id" */
  path: string
  /** Static label or a sync/async function receiving matched params */
  label: string | ((ctx: { params: RouteParams }) => string | Promise<string>)
  /** Optional icon rendered before the label */
  icon?: ReactNode
  /** When true the segment is excluded from the rendered breadcrumb */
  hidden?: boolean
}

export interface BreadcrumbItem {
  path: string
  label: string
  params: RouteParams
  isLast: boolean
  isLoading?: boolean
  icon?: ReactNode
}

// ─── Internal ────────────────────────────────

interface ParsedSegment {
  path: string
  route: RouteConfig | null
  params: RouteParams
}

// ─── Route matching ───────────────────────────

/**
 * Match an Express-style pattern against a concrete URL segment.
 * Returns matched status and any extracted named params.
 *
 * @example
 * matchRoute('/products/:id', '/products/42')
 * // → { matched: true, params: { id: '42' } }
 */
export function matchRoute(
  pattern: string,
  url: string
): { matched: boolean; params: RouteParams } {
  const paramNames: string[] = []

  const regexStr = pattern
    .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, (c) =>
      c === ':' || c === '/' ? c : `\\${c}`
    )
    .replace(/:([^/]+)/g, (_: string, name: string) => {
      paramNames.push(name)
      return '([^/]+)'
    })
    .replace(/\//g, '\\/')

  const regex = new RegExp(`^${regexStr}$`)
  const match = url.match(regex)

  if (!match) return { matched: false, params: {} }

  const params: RouteParams = {}
  paramNames.forEach((name, i) => {
    params[name] = match[i + 1]
  })

  return { matched: true, params }
}

// ─── URL parsing ──────────────────────────────

/**
 * Split a pathname into ancestor segments and match each to a route.
 *
 * /products/123/reviews
 * → ["/", "/products", "/products/123", "/products/123/reviews"]
 */
export function parsePathSegments(
  pathname: string,
  routes: RouteConfig[]
): ParsedSegment[] {
  const cleanPath = pathname.split('?')[0].split('#')[0]
  const parts = cleanPath.split('/').filter(Boolean)
  const segments: ParsedSegment[] = []

  // Root always first
  const rootRoute = routes.find((r) => r.path === '/') ?? null
  segments.push({ path: '/', route: rootRoute, params: {} })

  let currentPath = ''
  for (const part of parts) {
    currentPath += `/${part}`

    let matched: RouteConfig | null = null
    let params: RouteParams = {}

    for (const route of routes) {
      const result = matchRoute(route.path, currentPath)
      if (result.matched) {
        matched = route
        params = result.params
        break
      }
    }

    segments.push({ path: currentPath, route: matched, params })
  }

  return segments
}

// ─── Label resolution + cache ─────────────────

const labelCache = new Map<string, string>()

function cacheKey(path: string, params: RouteParams): string {
  return `${path}::${JSON.stringify(params)}`
}

/**
 * Resolve a label to a string.
 * Results are cached by (path, params) so back-navigation is instant.
 */
export async function resolveLabel(
  route: RouteConfig,
  params: RouteParams
): Promise<string> {
  const key = cacheKey(route.path, params)
  const cached = labelCache.get(key)
  if (cached !== undefined) return cached

  const label =
    typeof route.label === 'string'
      ? route.label
      : await route.label({ params })

  labelCache.set(key, label)
  return label
}

/** Clear the label cache — useful in tests or after user sign-out */
export function clearLabelCache(): void {
  labelCache.clear()
}

// ─── Breadcrumb builder ───────────────────────

/**
 * Build the full resolved breadcrumb list for a given pathname.
 * Hidden routes and unmatched segments are filtered out.
 */
export async function buildBreadcrumbs(
  pathname: string,
  routes: RouteConfig[]
): Promise<BreadcrumbItem[]> {
  const segments = parsePathSegments(pathname, routes)
  const visible = segments.filter((s) => s.route && !s.route.hidden)

  const items = await Promise.all(
    visible.map(async (seg, idx) => {
      const label = seg.route
        ? await resolveLabel(seg.route, seg.params)
        : seg.path

      return {
        path: seg.path,
        label,
        params: seg.params,
        isLast: idx === visible.length - 1,
        icon: seg.route?.icon,
      } satisfies BreadcrumbItem
    })
  )

  return items
}

// ─── SEO ─────────────────────────────────────

/**
 * Generate a Schema.org BreadcrumbList JSON-LD string.
 * Inject as <script type="application/ld+json"> for Google rich results.
 */
export function generateJsonLd(
  items: BreadcrumbItem[],
  baseUrl = ''
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      item: `${baseUrl}${item.path}`,
    })),
  })
}
