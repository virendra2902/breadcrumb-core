'use client'

// ─────────────────────────────────────────────
// auto-breadcrumb · headless  v3.0.0
// ─────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  buildBreadcrumbsProgressive,
  generateJsonLd,
  stripLocalePrefix,
  withLocalePrefix,
  type BreadcrumbItem,
  type RouteConfig,
} from '../core'

// ─── Context ─────────────────────────────────

interface BreadcrumbContextValue {
  items: BreadcrumbItem[]
  isLoading: boolean
  history: BreadcrumbItem[][]
  locale: string | null
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

// ─── Provider ─────────────────────────────────

export interface BreadcrumbProviderProps {
  routes: RouteConfig[]
  pathname: string
  children: ReactNode
  /** Called after breadcrumbs resolve on every navigation */
  onNavigate?: (items: BreadcrumbItem[], pathname: string) => void
  /** Max navigation snapshots kept in history. Default: 20 */
  maxHistory?: number
  /**
   * v3: List of i18n locale prefixes to strip from the pathname before matching.
   * Locale is re-applied to each item's path automatically.
   * @example locales={['en', 'fr', 'de', 'ja']}
   */
  locales?: string[]
  /**
   * v3: Transform every resolved label before it is rendered.
   * Runs after async resolution and caching.
   * @example transformLabel={(label) => label.toUpperCase()}
   */
  transformLabel?: (label: string, item: Omit<BreadcrumbItem, 'label'>) => string
}

export function BreadcrumbProvider({
  routes,
  pathname,
  children,
  onNavigate,
  maxHistory = 20,
  locales,
  transformLabel,
}: BreadcrumbProviderProps) {
  const [items, setItems] = useState<BreadcrumbItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<BreadcrumbItem[][]>([])
  const [locale, setLocale] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const resolve = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)

    // Strip locale prefix before matching
    let effectivePath = pathname
    let detectedLocale: string | null = null
    if (locales && locales.length > 0) {
      const stripped = stripLocalePrefix(pathname, locales)
      effectivePath = stripped.rest
      detectedLocale = stripped.locale
    }
    setLocale(detectedLocale)

    try {
      await buildBreadcrumbsProgressive(effectivePath, routes, (progressItems) => {
        if (controller.signal.aborted) return

        // Re-apply locale to paths and run transformLabel
        const withLocale = progressItems.map((item) => {
          const localedPath = withLocalePrefix(item.path, detectedLocale)
          const transformed =
            !item.isLoading && transformLabel
              ? transformLabel(item.label, { ...item, path: localedPath })
              : item.label
          return { ...item, path: localedPath, label: transformed }
        })

        setItems(withLocale)

        // Only fire onNavigate + history when fully resolved
        if (!withLocale.some((i) => i.isLoading)) {
          setHistory((prev) => {
            const next = [...prev, withLocale]
            return next.length > maxHistory ? next.slice(-maxHistory) : next
          })
          onNavigate?.(withLocale, pathname)
          setIsLoading(false)
        }
      })
    } catch {
      // aborted
    }
  }, [pathname, routes, onNavigate, maxHistory, locales, transformLabel])

  useEffect(() => {
    resolve()
    return () => abortRef.current?.abort()
  }, [resolve])

  return (
    <BreadcrumbContext.Provider value={{ items, isLoading, history, locale }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────

function useBreadcrumbContext(): BreadcrumbContextValue {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) throw new Error('[auto-breadcrumb] Hook must be used inside <BreadcrumbProvider>.')
  return ctx
}

/** Returns the current resolved breadcrumb items */
export function useBreadcrumb(): BreadcrumbItem[] {
  return useBreadcrumbContext().items
}

/** Returns true while any async label is still resolving */
export function useBreadcrumbLoading(): boolean {
  return useBreadcrumbContext().isLoading
}

/** Returns the navigation history as snapshots of BreadcrumbItem arrays */
export function useBreadcrumbHistory(): BreadcrumbItem[][] {
  return useBreadcrumbContext().history
}

/**
 * v3: Returns the currently active (last) route item.
 * Shorthand for useBreadcrumb().at(-1).
 */
export function useActiveRoute(): BreadcrumbItem | null {
  const items = useBreadcrumbContext().items
  return items.length > 0 ? items[items.length - 1] : null
}

/**
 * v3: Returns the detected i18n locale (e.g. "fr") or null when no
 * locale prefix was found. Only relevant when `locales` prop is set.
 */
export function useBreadcrumbLocale(): string | null {
  return useBreadcrumbContext().locale
}

// ─── Component ────────────────────────────────

export interface AutoBreadcrumbProps {
  separator?: ReactNode
  maxItems?: number
  showHome?: boolean
  homeIcon?: ReactNode
  className?: string
  syncDocumentTitle?: boolean
  appName?: string
  injectJsonLd?: boolean
  baseUrl?: string
  renderItem?: (item: BreadcrumbItem, isLast: boolean) => ReactNode
  /** v3: Per-item skeleton. Receives the loading item so you can size it */
  renderItemSkeleton?: (item: BreadcrumbItem) => ReactNode
  /** Legacy: full-replacement skeleton (still supported) */
  renderSkeleton?: () => ReactNode
  ariaLabel?: string
  onItemClick?: (item: BreadcrumbItem) => boolean | void
  /**
   * v3: When true, items with isLoading=true render an inline skeleton
   * rather than blocking the entire breadcrumb. Default: true
   */
  progressiveLoading?: boolean
}

export function AutoBreadcrumb({
  separator = '/',
  maxItems,
  showHome = true,
  className,
  syncDocumentTitle = false,
  appName,
  injectJsonLd = false,
  baseUrl = '',
  renderItem,
  renderItemSkeleton,
  renderSkeleton,
  ariaLabel = 'breadcrumb',
  onItemClick,
  progressiveLoading = true,
}: AutoBreadcrumbProps) {
  const items = useBreadcrumb()
  const isLoading = useBreadcrumbLoading()

  useEffect(() => {
    if (!syncDocumentTitle || items.length === 0) return
    const ready = items.filter((i) => !i.isLoading)
    if (ready.length === 0) return
    const parts = [...ready].reverse().map((i) => i.label)
    if (appName) parts.push(appName)
    document.title = parts.join(' — ')
  }, [items, syncDocumentTitle, appName])

  // Full-replacement skeleton (legacy / no progressive)
  if (!progressiveLoading && isLoading && renderSkeleton) return <>{renderSkeleton()}</>

  let visible = items
  if (!showHome && visible[0]?.path === '/') visible = visible.slice(1)

  if (maxItems && visible.length > maxItems) {
    const head = visible.slice(0, 1)
    const tail = visible.slice(visible.length - (maxItems - 2))
    const ellipsis: BreadcrumbItem = { path: '...', label: '…', params: {}, isLast: false }
    visible = [...head, ellipsis, ...tail]
  }

  const handleClick = (item: BreadcrumbItem) => (e: React.MouseEvent) => {
    if (!onItemClick) return
    if (onItemClick(item) === false) e.preventDefault()
  }

  const defaultSkeleton = (_item: BreadcrumbItem) => (
    <span
      style={{
        display: 'inline-block',
        width: '64px',
        height: '0.75em',
        borderRadius: '4px',
        background: 'linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)',
        backgroundSize: '200% 100%',
        animation: '_bcShimmer 1.4s ease-in-out infinite',
        verticalAlign: 'middle',
      }}
    />
  )

  const skeletonRenderer = renderItemSkeleton ?? defaultSkeleton

  const defaultRenderItem = (item: BreadcrumbItem, isLast: boolean) => {
    if (item.isLoading && progressiveLoading) return skeletonRenderer(item)
    return isLast ? (
      <span aria-current="page">{item.label}</span>
    ) : (
      <a href={item.path} style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleClick(item)}>
        {item.label}
      </a>
    )
  }

  const render = renderItem ?? defaultRenderItem

  return (
    <nav aria-label={ariaLabel} className={className}>
      <style>{`@keyframes _bcShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {injectJsonLd && items.filter(i => !i.isLoading).length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: generateJsonLd(items.filter((i) => !i.isLoading), baseUrl),
          }}
        />
      )}
      <ol style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
        {visible.map((item, idx) => (
          <li key={item.path + idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {item.icon && !item.isLoading && <span aria-hidden="true">{item.icon}</span>}
            {render(item, item.isLast)}
            {idx < visible.length - 1 && (
              <span aria-hidden="true" style={{ opacity: 0.4, userSelect: 'none' }}>{separator}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
