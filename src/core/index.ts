// ─────────────────────────────────────────────
// auto-breadcrumb · core  v3.0.0
// Router-agnostic logic: parsing, matching, resolving, SEO
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'

// ─── Public types ────────────────────────────

export interface RouteParams {
  [key: string]: string
}

export interface RouteConfig {
  /**
   * Route matcher. Three forms supported:
   * - Express-style string: "/products/:id", "/docs/*", "/shop/:cat?"
   * - RegExp with named groups: /^\/p\/(?<id>\d+)$/
   * - Custom function: (pathname) => params object or null if no match
   */
  path: string | RegExp | ((pathname: string) => RouteParams | null)
  /** Static label or sync/async fn receiving matched params + full pathname */
  label: string | ((ctx: { params: RouteParams; pathname: string }) => string | Promise<string>)
  /** Optional icon rendered before the label */
  icon?: ReactNode
  /** When true the segment is excluded from the rendered breadcrumb */
  hidden?: boolean
  /** Cache TTL in milliseconds. Defaults to Infinity (cache forever). */
  cacheTtl?: number
  /** Called whenever this route segment is matched during navigation. */
  onMatch?: (ctx: { params: RouteParams; pathname: string }) => void
}

export interface BreadcrumbItem {
  path: string
  label: string
  params: RouteParams
  isLast: boolean
  /** True while this specific item's async label is still resolving (v3: per-item, not global) */
  isLoading?: boolean
  icon?: ReactNode
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
 * Match an Express-style STRING pattern against a concrete URL segment.
 * Supports :param, :param?, and trailing * (wildcard / splat).
 * Kept as a standalone export for string-only matching / backward compat.
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

/**
 * v3: Match a RouteConfig against a URL — dispatches across string / RegExp / function matchers.
 */
function matchSegment(
  route: RouteConfig,
  currentPath: string
): { matched: boolean; params: RouteParams } {
  const { path } = route

  if (typeof path === 'string') {
    return matchRoute(path, currentPath)
  }

  if (path instanceof RegExp) {
    const m = currentPath.match(path)
    if (!m) return { matched: false, params: {} }
    const params: RouteParams = m.groups ? { ...m.groups } : {}
    return { matched: true, params }
  }

  if (typeof path === 'function') {
    const result = path(currentPath)
    return result ? { matched: true, params: result } : { matched: false, params: {} }
  }

  return { matched: false, params: {} }
}

// ─── i18n locale prefix ───────────────────────

/**
 * v3: Strip a known locale prefix from a pathname before route matching.
 * @example
 * stripLocalePrefix('/en/products/42', ['en', 'fr', 'de'])
 * // → { locale: 'en', rest: '/products/42' }
 */
export function stripLocalePrefix(
  pathname: string,
  locales: string[]
): { locale: string | null; rest: string } {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length > 0 && locales.includes(parts[0])) {
    const locale = parts[0]
    const rest = '/' + parts.slice(1).join('/')
    return { locale, rest: rest === '/' ? '/' : rest }
  }
  return { locale: null, rest: pathname }
}

/** v3: Re-prepend a locale prefix onto a resolved breadcrumb path. */
export function withLocalePrefix(path: string, locale: string | null): string {
  if (!locale) return path
  return path === '/' ? `/${locale}` : `/${locale}${path}`
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
      const result = matchSegment(route, currentPath)
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

function cacheKey(route: RouteConfig, params: RouteParams): string {
  const id = typeof route.path === 'string' ? route.path : route.label.toString()
  return `${id}::${JSON.stringify(params)}`
}

export async function resolveLabel(
  route: RouteConfig,
  params: RouteParams,
  pathname: string
): Promise<string> {
  const key = cacheKey(route, params)
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
 * Invalidate cache for a specific route + params combination.
 * Call after mutations so the next navigation re-fetches the label.
 */
export function invalidateLabelCache(route: RouteConfig, params: RouteParams = {}): void {
  labelCache.delete(cacheKey(route, params))
}

// ─── Breadcrumb builder (blocking — v1/v2 compatible) ─────

/**
 * Build the full resolved breadcrumb list, awaiting every label before
 * returning. Kept for backward compatibility — prefer
 * `buildBreadcrumbsProgressive` for better perceived performance.
 */
export async function buildBreadcrumbs(
  pathname: string,
  routes: RouteConfig[]
): Promise<BreadcrumbItem[]> {
  let final: BreadcrumbItem[] = []
  await buildBreadcrumbsProgressive(pathname, routes, (items) => {
    final = items
  })
  return final
}

// ─── Breadcrumb builder (progressive — v3) ────

/**
 * v3: Build breadcrumbs progressively. Static labels resolve and render
 * immediately; async labels render with `isLoading: true` first, then the
 * `onUpdate` callback fires again as each one resolves independently —
 * no more "block the whole trail until the slowest label loads".
 */
export async function buildBreadcrumbsProgressive(
  pathname: string,
  routes: RouteConfig[],
  onUpdate?: (items: BreadcrumbItem[]) => void
): Promise<BreadcrumbItem[]> {
  const segments = parsePathSegments(pathname, routes)
  const visible = segments.filter((s) => s.route && !s.route.hidden)

  const items: BreadcrumbItem[] = visible.map((seg, idx) => {
    const isAsync = !!seg.route && typeof seg.route.label !== 'string'
    return {
      path: seg.path,
      label: isAsync ? '' : seg.route ? (seg.route.label as string) : seg.path,
      params: seg.params,
      isLast: idx === visible.length - 1,
      icon: seg.route?.icon,
      route: seg.route ?? undefined,
      isLoading: isAsync,
    }
  })

  onUpdate?.(items)

  await Promise.all(
    visible.map(async (seg, idx) => {
      if (!seg.route || typeof seg.route.label === 'string') return
      const label = await resolveLabel(seg.route, seg.params, seg.path)
      items[idx] = { ...items[idx], label, isLoading: false }
      onUpdate?.([...items])
    })
  )

  return items
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
