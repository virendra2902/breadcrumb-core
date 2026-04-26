// ─────────────────────────────────────────────
// breadcrumb-core · core  v2.0.0
// Router-agnostic logic: parsing, matching, resolving, SEO
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'

// ─── Public types ────────────────────────────

export interface RouteParams {
  [key: string]: string
}

export interface RouteConfig {
  /** Express-style path — supports named params (:id), optional (:id?), wildcards (* ) */
  path: string
  /** Static label or sync/async fn receiving matched params + full pathname */
  label: string | ((ctx: { params: RouteParams; pathname: string }) => string | Promise<string>)
  /** Optional icon rendered before the label */
  icon?: ReactNode
  /** When true the segment is excluded from the rendered breadcrumb */
  hidden?: boolean
  /**
   * v2: Cache TTL in milliseconds.
   * After this duration the cached label is invalidated and re-fetched.
   * Defaults to Infinity (cache forever).
   */
  cacheTtl?: number
  /**
   * v2: Called whenever this route segment is matched during navigation.
   * Useful for analytics / side-effects.
   */
  onMatch?: (ctx: { params: RouteParams; pathname: string }) => void
}

export interface BreadcrumbItem {
  path: string
  label: string
  params: RouteParams
  isLast: boolean
  isLoading?: boolean
  icon?: ReactNode
  /** v2: The matched RouteConfig — useful for custom renders */
  route?: RouteConfig
}

// ─── Internal ────────────────────────────────

interface ParsedSegment {
  path: string
  route: RouteConfig | null
  params: RouteParams
}

interface CacheEntry {
  label: string
  ts: number
}

// ─── Route matching ───────────────────────────

/**
 * Match an Express-style pattern against a concrete URL segment.
 * Supports :param, :param?, and trailing * (wildcard / splat).
 */
export function matchRoute(
  pattern: string,
  url: string
): { matched: boolean; params: RouteParams } {
  const paramNames: string[] = []
  const hasWildcard = pattern.endsWith('*')
  const basePattern = hasWildcard ? pattern.slice(0, -1).replace(/\/$/, '') : pattern

  let regexStr = basePattern
    .replace(/[-[\]{}()+.,\\^$|#\s]/g, (c) =>
      c === ':' || c === '/' || c === '?' ? c : `\\${c}`
    )
    .replace(/:([^/?]+)\?/g, (_: string, name: string) => {
      paramNames.push(name)
      return '([^/]*)?'
    })
    .replace(/:([^/]+)/g, (_: string, name: string) => {
      paramNames.push(name)
      return '([^/]+)'
    })
    .replace(/\//g, '\\/')

  if (hasWildcard) {
    paramNames.push('*')
    regexStr += '(?:\\/(.*))?'
  }

  const regex = new RegExp(`^${regexStr}$`)
  const match = url.match(regex)
  if (!match) return { matched: false, params: {} }

  const params: RouteParams = {}
  paramNames.forEach((name, i) => {
    if (match[i + 1] !== undefined) params[name] = match[i + 1]
  })

  return { matched: true, params }
}

// ─── URL parsing ──────────────────────────────

export function parsePathSegments(
  pathname: string,
  routes: RouteConfig[]
): ParsedSegment[] {
  const cleanPath = pathname.split('?')[0].split('#')[0]
  const parts = cleanPath.split('/').filter(Boolean)
  const segments: ParsedSegment[] = []

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
        matched.onMatch?.({ params, pathname: currentPath })
        break
      }
    }

    segments.push({ path: currentPath, route: matched, params })
  }

  return segments
}

// ─── Label cache ──────────────────────────────

const labelCache = new Map<string, CacheEntry>()

function cacheKey(path: string, params: RouteParams): string {
  return `${path}::${JSON.stringify(params)}`
}

export async function resolveLabel(
  route: RouteConfig,
  params: RouteParams,
  pathname: string
): Promise<string> {
  const key = cacheKey(route.path, params)
  const ttl = route.cacheTtl ?? Infinity
  const cached = labelCache.get(key)

  if (cached) {
    const age = Date.now() - cached.ts
    if (ttl === Infinity || age < ttl) return cached.label
  }

  const label =
    typeof route.label === 'string'
      ? route.label
      : await route.label({ params, pathname })

  labelCache.set(key, { label, ts: Date.now() })
  return label
}

/** Clear the entire label cache */
export function clearLabelCache(): void {
  labelCache.clear()
}

/**
 * v2: Invalidate cache for a specific path + params combination.
 * Call after mutations so the next navigation re-fetches the label.
 * @example invalidateLabelCache('/products/:id', { id: '42' })
 */
export function invalidateLabelCache(path: string, params: RouteParams = {}): void {
  labelCache.delete(cacheKey(path, params))
}

// ─── Breadcrumb builder ───────────────────────

export async function buildBreadcrumbs(
  pathname: string,
  routes: RouteConfig[]
): Promise<BreadcrumbItem[]> {
  const segments = parsePathSegments(pathname, routes)
  const visible = segments.filter((s) => s.route && !s.route.hidden)

  return Promise.all(
    visible.map(async (seg, idx) => {
      const label = seg.route
        ? await resolveLabel(seg.route, seg.params, seg.path)
        : seg.path

      return {
        path: seg.path,
        label,
        params: seg.params,
        isLast: idx === visible.length - 1,
        icon: seg.route?.icon,
        route: seg.route ?? undefined,
      } satisfies BreadcrumbItem
    })
  )
}

// ─── SEO ─────────────────────────────────────

export function generateJsonLd(items: BreadcrumbItem[], baseUrl = ''): string {
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
