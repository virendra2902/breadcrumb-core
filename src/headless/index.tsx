'use client'

// ─────────────────────────────────────────────
// breadcrumb-core · headless  v2.0.0
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
  buildBreadcrumbs,
  generateJsonLd,
  type BreadcrumbItem,
  type RouteConfig,
} from '../core'

// ─── Context ─────────────────────────────────

interface BreadcrumbContextValue {
  items: BreadcrumbItem[]
  isLoading: boolean
  /** v2: Full navigation history of breadcrumb item arrays */
  history: BreadcrumbItem[][]
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

// ─── Provider ─────────────────────────────────

export interface BreadcrumbProviderProps {
  routes: RouteConfig[]
  pathname: string
  children: ReactNode
  /**
   * v2: Called after breadcrumbs resolve on every navigation.
   * Useful for analytics, logging, or syncing external state.
   */
  onNavigate?: (items: BreadcrumbItem[], pathname: string) => void
  /**
   * v2: Max number of navigation states to keep in history.
   * Defaults to 20.
   */
  maxHistory?: number
}

export function BreadcrumbProvider({
  routes,
  pathname,
  children,
  onNavigate,
  maxHistory = 20,
}: BreadcrumbProviderProps) {
  const [items, setItems] = useState<BreadcrumbItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<BreadcrumbItem[][]>([])
  const abortRef = useRef<AbortController | null>(null)

  const resolve = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    try {
      const resolved = await buildBreadcrumbs(pathname, routes)
      if (!controller.signal.aborted) {
        setItems(resolved)
        setHistory((prev) => {
          const next = [...prev, resolved]
          return next.length > maxHistory ? next.slice(next.length - maxHistory) : next
        })
        onNavigate?.(resolved, pathname)
      }
    } catch {
      // Aborted — ignore
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [pathname, routes, onNavigate, maxHistory])

  useEffect(() => {
    resolve()
    return () => abortRef.current?.abort()
  }, [resolve])

  return (
    <BreadcrumbContext.Provider value={{ items, isLoading, history }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────

function useBreadcrumbContext(): BreadcrumbContextValue {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) {
    throw new Error('[auto-breadcrumb] Hook must be used inside <BreadcrumbProvider>.')
  }
  return ctx
}

/** Returns the current resolved breadcrumb items */
export function useBreadcrumb(): BreadcrumbItem[] {
  return useBreadcrumbContext().items
}

/** Returns true while async labels are resolving */
export function useBreadcrumbLoading(): boolean {
  return useBreadcrumbContext().isLoading
}

/**
 * v2: Returns the navigation history as an array of breadcrumb item arrays.
 * Each entry is a snapshot of the breadcrumb at the time of navigation.
 * @example
 * const history = useBreadcrumbHistory()
 * const previous = history[history.length - 2]
 */
export function useBreadcrumbHistory(): BreadcrumbItem[][] {
  return useBreadcrumbContext().history
}

// ─── Component ────────────────────────────────

export interface AutoBreadcrumbProps {
  /** Element between items. Default: "/" */
  separator?: ReactNode
  /** Collapse middle items when total exceeds this number */
  maxItems?: number
  /** Whether to include the root "/" item. Default: true */
  showHome?: boolean
  /** Icon shown for the home item */
  homeIcon?: ReactNode
  /** CSS class on the <nav> wrapper */
  className?: string
  /** Sync document.title with the breadcrumb trail */
  syncDocumentTitle?: boolean
  /** App name appended to synced title: "iPhone 15 — Products — MyApp" */
  appName?: string
  /** Inject Schema.org BreadcrumbList JSON-LD for SEO */
  injectJsonLd?: boolean
  /** Base URL used in JSON-LD item URLs */
  baseUrl?: string
  /** Custom item renderer */
  renderItem?: (item: BreadcrumbItem, isLast: boolean) => ReactNode
  /** Rendered while async labels are resolving */
  renderSkeleton?: () => ReactNode
  /**
   * v2: aria-label for the <nav> element.
   * Defaults to "breadcrumb". Change when you have multiple navs on a page.
   */
  ariaLabel?: string
  /**
   * v2: Called when a breadcrumb item is clicked.
   * Return false to prevent default link navigation.
   */
  onItemClick?: (item: BreadcrumbItem) => boolean | void
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
  renderSkeleton,
  ariaLabel = 'breadcrumb',
  onItemClick,
}: AutoBreadcrumbProps) {
  const items = useBreadcrumb()
  const isLoading = useBreadcrumbLoading()

  // Sync document title
  useEffect(() => {
    if (!syncDocumentTitle || items.length === 0) return
    const parts = [...items].reverse().map((i) => i.label)
    if (appName) parts.push(appName)
    document.title = parts.join(' — ')
  }, [items, syncDocumentTitle, appName])

  if (isLoading && renderSkeleton) return <>{renderSkeleton()}</>

  let visible = items

  if (!showHome && visible[0]?.path === '/') {
    visible = visible.slice(1)
  }

  if (maxItems && visible.length > maxItems) {
    const head = visible.slice(0, 1)
    const tail = visible.slice(visible.length - (maxItems - 2))
    const ellipsis: BreadcrumbItem = {
      path: '...',
      label: '…',
      params: {},
      isLast: false,
    }
    visible = [...head, ellipsis, ...tail]
  }

  const handleClick = (item: BreadcrumbItem) => (e: React.MouseEvent) => {
    if (!onItemClick) return
    const result = onItemClick(item)
    if (result === false) e.preventDefault()
  }

  const defaultRenderItem = (item: BreadcrumbItem, isLast: boolean) =>
    isLast ? (
      <span aria-current="page">{item.label}</span>
    ) : (
      <a
        href={item.path}
        style={{ textDecoration: 'none', color: 'inherit' }}
        onClick={handleClick(item)}
      >
        {item.label}
      </a>
    )

  const render = renderItem ?? defaultRenderItem

  return (
    <nav aria-label={ariaLabel} className={className}>
      {injectJsonLd && items.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: generateJsonLd(items, baseUrl) }}
        />
      )}
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {visible.map((item, idx) => (
          <li
            key={item.path + idx}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            {render(item, item.isLast)}
            {idx < visible.length - 1 && (
              <span aria-hidden="true" style={{ opacity: 0.4, userSelect: 'none' }}>
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
