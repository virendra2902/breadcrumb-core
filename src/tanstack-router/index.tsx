// auto-breadcrumb · tanstack-router  v3.0.0
// Peer dep: @tanstack/react-router

import type { ReactNode } from 'react'
import {
  BreadcrumbProvider as CoreProvider,
  AutoBreadcrumb as CoreBreadcrumb,
  useBreadcrumb,
  useBreadcrumbLoading,
  useBreadcrumbHistory,
  useActiveRoute,
  useBreadcrumbLocale,
  type AutoBreadcrumbProps,
  type BreadcrumbProviderProps as CoreProviderProps,
} from '../headless'
import type { RouteConfig, BreadcrumbItem } from '../core'

export interface BreadcrumbProviderProps extends Omit<CoreProviderProps, 'pathname'> {}

export function BreadcrumbProvider({ routes, children, ...rest }: BreadcrumbProviderProps) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useRouterState } = require('@tanstack/react-router') as {
    useRouterState: (opts: { select: (s: { location: { pathname: string } }) => string }) => string
  }
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <CoreProvider routes={routes} pathname={pathname} {...rest}>
      {children}
    </CoreProvider>
  )
}

export function AutoBreadcrumb(props: AutoBreadcrumbProps) {
  const defaultRenderer = (item: BreadcrumbItem, isLast: boolean): ReactNode =>
    isLast ? (
      <span aria-current="page">{item.label}</span>
    ) : (
      <a href={item.path}>{item.label}</a>
    )
  return <CoreBreadcrumb {...props} renderItem={props.renderItem ?? defaultRenderer} />
}

export { useBreadcrumb, useBreadcrumbLoading, useBreadcrumbHistory, useActiveRoute, useBreadcrumbLocale }
export type { RouteConfig, BreadcrumbItem, AutoBreadcrumbProps }
