'use client'

// auto-breadcrumb · next  v3.0.0

import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
 * Wrap your root layout once — reads pathname from Next.js automatically.
 * v3 extras: locales, transformLabel, onNavigate, maxHistory all supported.
 *
 * @example
 * // app/[locale]/layout.tsx
 * <BreadcrumbProvider routes={routes} locales={['en','fr','de']}>
 *   {children}
 * </BreadcrumbProvider>
 */
export function BreadcrumbProvider({ routes, children, ...rest }: BreadcrumbProviderProps) {
  const pathname = usePathname()
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
      <Link href={item.path}>{item.label}</Link>
    )
  return <CoreBreadcrumb {...props} renderItem={props.renderItem ?? defaultRenderer} />
}

export { useBreadcrumb, useBreadcrumbLoading, useBreadcrumbHistory, useActiveRoute, useBreadcrumbLocale }
export type { RouteConfig, BreadcrumbItem, AutoBreadcrumbProps }
