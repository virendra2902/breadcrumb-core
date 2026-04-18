// ─────────────────────────────────────────────
// auto-breadcrumb · next
// Next.js App Router adapter (Client Component)
// ─────────────────────────────────────────────

import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
 * Wrap your root layout once — reads pathname from Next.js automatically.
 *
 * @example
 * // app/layout.tsx
 * import { BreadcrumbProvider } from 'auto-breadcrumb/next'
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <BreadcrumbProvider routes={routes}>
 *           {children}
 *         </BreadcrumbProvider>
 *       </body>
 *     </html>
 *   )
 * }
 */
export function BreadcrumbProvider({
  routes,
  children,
}: BreadcrumbProviderProps) {
  const pathname = usePathname()
  return (
    <CoreProvider routes={routes} pathname={pathname}>
      {children}
    </CoreProvider>
  )
}

/**
 * Drop-in breadcrumb using Next.js <Link>.
 * Place it anywhere inside <BreadcrumbProvider>.
 *
 * @example
 * // app/products/[id]/page.tsx
 * import { AutoBreadcrumb } from 'auto-breadcrumb/next'
 *
 * export default function ProductPage() {
 *   return (
 *     <>
 *       <AutoBreadcrumb injectJsonLd syncDocumentTitle appName="MyShop" />
 *       <main>...</main>
 *     </>
 *   )
 * }
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

export { useBreadcrumb, useBreadcrumbLoading }
export type { RouteConfig, BreadcrumbItem, AutoBreadcrumbProps }
