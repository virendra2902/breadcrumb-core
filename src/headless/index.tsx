// ─────────────────────────────────────────────
// auto-breadcrumb · headless
// Framework-agnostic React context + hook + component
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
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

// ─── Provider ─────────────────────────────────

export interface BreadcrumbProviderProps {
  routes: RouteConfig[]
  /** Current pathname — each router adapter injects this automatically */
  pathname: string
  children: ReactNode
}

/**
 * Core provider. Router adapters (react-router, next, tanstack-router)
 * wrap this and pass the live pathname automatically.
 *
 * For custom integrations, use this directly:
 * @example
 * <BreadcrumbProvider routes={routes} pathname={location.pathname}>
 *   <App />
 * </BreadcrumbProvider>
 */
export function BreadcrumbProvider({
  routes,
  pathname,
  children,
}: BreadcrumbProviderProps) {
  const [items, setItems] = useState<BreadcrumbItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
      }
    } catch {
      // Navigation was aborted — ignore
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [pathname, routes])

  useEffect(() => {
    resolve()
    return () => abortRef.current?.abort()
  }, [resolve])

  return (
    <BreadcrumbContext.Provider value={{ items, isLoading }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────

function useBreadcrumbContext(): BreadcrumbContextValue {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) {
    throw new Error(
      '[auto-breadcrumb] useBreadcrumb must be used inside <BreadcrumbProvider>.'
    )
  }
  return ctx
}

/**
 * Returns the current resolved breadcrumb items.
 * Use this for fully custom renders.
 *
 * @example
 * const items = useBreadcrumb()
 * // → [{ path, label, params, isLast, icon }, ...]
 */
export function useBreadcrumb(): BreadcrumbItem[] {
  return useBreadcrumbContext().items
}

/**
 * Returns true while async labels are being resolved.
 */
export function useBreadcrumbLoading(): boolean {
  return useBreadcrumbContext().isLoading
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
}

/**
 * Drop-in breadcrumb component. Place anywhere inside <BreadcrumbProvider>.
 * Zero per-page breadcrumb code — ever.
 *
 * @example
 * <AutoBreadcrumb
 *   separator="/"
 *   injectJsonLd
 *   syncDocumentTitle
 *   appName="MyApp"
 *   renderItem={(item, isLast) =>
 *     isLast ? <span>{item.label}</span> : <a href={item.path}>{item.label}</a>
 *   }
 * />
 */
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

  // Collapse middle items when over maxItems
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

  const defaultRenderItem = (item: BreadcrumbItem, isLast: boolean) =>
    isLast ? (
      <span aria-current="page">{item.label}</span>
    ) : (
      <a href={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
        {item.label}
      </a>
    )

  const render = renderItem ?? defaultRenderItem

  return (
    <nav aria-label="breadcrumb" className={className}>
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
