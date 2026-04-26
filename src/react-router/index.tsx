// ─────────────────────────────────────────────
// breadcrumb-core · react-router  v2.0.0
// React Router v6+ adapter
// ─────────────────────────────────────────────

import { useLocation, Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  BreadcrumbProvider as CoreProvider,
  AutoBreadcrumb as CoreBreadcrumb,
  useBreadcrumb,
  useBreadcrumbLoading,
  useBreadcrumbHistory,
  type AutoBreadcrumbProps,
  type BreadcrumbProviderProps as CoreProviderProps,
} from '../headless'
import type { RouteConfig, BreadcrumbItem } from '../core'

export interface BreadcrumbProviderProps
  extends Omit<CoreProviderProps, 'pathname'> { }

/**
 * Wrap your app once — reads pathname from React Router automatically.
 * Supports all v2 props: onNavigate, maxHistory.
 *
 * @example
 * <BrowserRouter>
 *   <BreadcrumbProvider routes={routes} onNavigate={(items) => analytics.track(items)}>
 *     <App />
 *   </BreadcrumbProvider>
 * </BrowserRouter>
 */
export function BreadcrumbProvider({ routes, children, ...rest }: BreadcrumbProviderProps) {
  const { pathname } = useLocation()
  return (
    <CoreProvider routes={routes} pathname={pathname} {...rest}>
      {children}
    </CoreProvider>
  )
}

/**
 * Drop-in breadcrumb using React Router's <Link>.
 * Supports all v2 props: ariaLabel, onItemClick.
 */
export function AutoBreadcrumb(props: AutoBreadcrumbProps) {
  const defaultRenderer = (item: BreadcrumbItem, isLast: boolean): ReactNode =>
    isLast ? (
      <span aria-current="page">{item.label}</span>
    ) : (
      <Link to={item.path}>{item.label}</Link>
    )

  return <CoreBreadcrumb {...props} renderItem={props.renderItem ?? defaultRenderer} />
}

export { useBreadcrumb, useBreadcrumbLoading, useBreadcrumbHistory }
export type { RouteConfig, BreadcrumbItem, AutoBreadcrumbProps }
