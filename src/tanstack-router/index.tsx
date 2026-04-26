// ─────────────────────────────────────────────
// breadcrumb-core · tanstack-router  v2.0.0
// TanStack Router v1 adapter
// Peer dep: @tanstack/react-router
// ─────────────────────────────────────────────

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
 * Wrap your root component once — reads pathname from TanStack Router.
 * Peer dependency: npm install @tanstack/react-router
 *
 * @example
 * // __root.tsx
 * import { BreadcrumbProvider } from 'auto-breadcrumb/tanstack-router'
 * export function RootComponent() {
 *   return <BreadcrumbProvider routes={routes}><Outlet /></BreadcrumbProvider>
 * }
 */
export function BreadcrumbProvider({ routes, children, ...rest }: BreadcrumbProviderProps) {
  // Dynamic require keeps @tanstack/react-router as a true peer dep —
  // users who don't use TanStack Router won't get a missing-module error
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useRouterState } = require('@tanstack/react-router') as {
    useRouterState: (opts: {
      select: (s: { location: { pathname: string } }) => string
    }) => string
  }
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <CoreProvider routes={routes} pathname={pathname} {...rest}>
      {children}
    </CoreProvider>
  )
}

/**
 * Drop-in breadcrumb for TanStack Router.
 * Pass renderItem to use TanStack's <Link> component.
 *
 * @example
 * import { Link } from '@tanstack/react-router'
 * <AutoBreadcrumb
 *   renderItem={(item, isLast) =>
 *     isLast ? <span>{item.label}</span> : <Link to={item.path}>{item.label}</Link>
 *   }
 * />
 */
export function AutoBreadcrumb(props: AutoBreadcrumbProps) {
  const defaultRenderer = (item: BreadcrumbItem, isLast: boolean): ReactNode =>
    isLast ? (
      <span aria-current="page">{item.label}</span>
    ) : (
      <a href={item.path}>{item.label}</a>
    )

  return <CoreBreadcrumb {...props} renderItem={props.renderItem ?? defaultRenderer} />
}

export { useBreadcrumb, useBreadcrumbLoading, useBreadcrumbHistory }
export type { RouteConfig, BreadcrumbItem, AutoBreadcrumbProps }
