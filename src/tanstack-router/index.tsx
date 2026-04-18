// ─────────────────────────────────────────────
// auto-breadcrumb · tanstack-router
// TanStack Router v1 adapter
// ─────────────────────────────────────────────

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
 * Wrap your root component once — reads pathname from TanStack Router.
 *
 * Install peer dependency first:
 *   npm install @tanstack/react-router
 *
 * @example
 * // __root.tsx
 * import { useRouterState } from '@tanstack/react-router'
 * import { BreadcrumbProvider } from 'auto-breadcrumb/tanstack-router'
 *
 * export function RootComponent() {
 *   return (
 *     <BreadcrumbProvider routes={routes}>
 *       <Outlet />
 *     </BreadcrumbProvider>
 *   )
 * }
 *
 * Note: This component calls useRouterState internally via dynamic require.
 * It must be rendered inside a TanStack Router <RouterProvider>.
 */
export function BreadcrumbProvider({
  routes,
  children,
}: BreadcrumbProviderProps) {
  // Dynamic require keeps @tanstack/react-router as a true peer dep —
  // users who don't use TanStack Router won't get a missing-module error
  // at build time. The adapter only works when the peer is installed.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useRouterState } = require('@tanstack/react-router') as {
    useRouterState: (opts: { select: (s: { location: { pathname: string } }) => string }) => string
  }
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <CoreProvider routes={routes} pathname={pathname}>
      {children}
    </CoreProvider>
  )
}

/**
 * Drop-in breadcrumb for TanStack Router.
 * Uses a plain <a> tag — swap renderItem to use TanStack's <Link> if needed.
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

export { useBreadcrumb, useBreadcrumbLoading }
export type { RouteConfig, BreadcrumbItem, AutoBreadcrumbProps }
