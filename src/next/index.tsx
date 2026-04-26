'use client'

// ─────────────────────────────────────────────
// breadcrumb-core · next  v2.0.0
// Next.js App Router adapter
// ─────────────────────────────────────────────

import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
 * Wrap your root layout once — reads pathname from Next.js automatically.
 * Supports all v2 props: onNavigate, maxHistory.
 *
 * @example
 * // app/layout.tsx
 * <BreadcrumbProvider routes={routes} onNavigate={(items) => console.log(items)}>
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

/**
 * Drop-in breadcrumb using Next.js <Link>.
 * Supports all v2 props: ariaLabel, onItemClick, injectJsonLd, syncDocumentTitle.
 */
export function AutoBreadcrumb(props: AutoBreadcrumbProps) {
  const defaultRenderer = (item: BreadcrumbItem, isLast: boolean): ReactNode =>
    isLast ? (
      <span aria-current="page">{item.label}</span>
    ) : (
      <Link href={item.path}>{item.label}</Link>
    )

  return <CoreBreadcrumb {...props} renderItem={props.renderItem ?? defaultRenderer} />
}

export { useBreadcrumb, useBreadcrumbLoading, useBreadcrumbHistory }
export type { RouteConfig, BreadcrumbItem, AutoBreadcrumbProps }
