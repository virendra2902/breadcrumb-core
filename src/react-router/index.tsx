// ─────────────────────────────────────────────
// auto-breadcrumb · react-router
// React Router v6+ adapter
// ─────────────────────────────────────────────

import { useLocation, Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  BreadcrumbProvider as CoreProvider,
  AutoBreadcrumb as CoreBreadcrumb,
  useBreadcrumb,
  useBreadcrumbLoading,
  type AutoBreadcrumbProps,
  type BreadcrumbProviderProps as CoreProviderProps,
} from '../headless'
import type { RouteConfig, BreadcrumbItem } from '../core'

export interface BreadcrumbProviderProps
  extends Omit<CoreProviderProps, 'pathname'> {}

/**
 * Wrap your app once — automatically reads pathname from React Router.
 *
 * @example
 * // main.tsx
 * import { BrowserRouter } from 'react-router-dom'
 * import { BreadcrumbProvider } from 'auto-breadcrumb/react-router'
 *
 * <BrowserRouter>
 *   <BreadcrumbProvider routes={routes}>
 *     <App />
 *   </BreadcrumbProvider>
 * </BrowserRouter>
 */
export function BreadcrumbProvider({
  routes,
  children,
}: BreadcrumbProviderProps) {
  const { pathname } = useLocation()
  return (
    <CoreProvider routes={routes} pathname={pathname}>
      {children}
    </CoreProvider>
  )
}

/**
 * Drop-in breadcrumb using React Router's <Link>.
 * Place it anywhere inside <BreadcrumbProvider>.
 *
 * @example
 * <AutoBreadcrumb separator="›" injectJsonLd syncDocumentTitle appName="Acme" />
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

export { useBreadcrumb, useBreadcrumbLoading }
export type { RouteConfig, BreadcrumbItem, AutoBreadcrumbProps }
