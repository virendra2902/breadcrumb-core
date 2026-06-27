// auto-breadcrumb · react-router  v3.0.0

import { useLocation, Link } from 'react-router-dom'
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

/**
 * Wrap your app once — reads pathname from React Router automatically.
 * v3 extras: locales, transformLabel, onNavigate, maxHistory all supported.
 */
export function BreadcrumbProvider({ routes, children, ...rest }: BreadcrumbProviderProps) {
  const { pathname } = useLocation()
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
      <Link to={item.path}>{item.label}</Link>
    )
  return <CoreBreadcrumb {...props} renderItem={props.renderItem ?? defaultRenderer} />
}

export { useBreadcrumb, useBreadcrumbLoading, useBreadcrumbHistory, useActiveRoute, useBreadcrumbLocale }
export type { RouteConfig, BreadcrumbItem, AutoBreadcrumbProps }
