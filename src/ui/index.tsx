// ─────────────────────────────────────────────
// auto-breadcrumb · ui  v3.0.0
// Pre-styled breadcrumb components — no CSS file needed
// ─────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'
import {
  AutoBreadcrumb,
  useBreadcrumb,
  useBreadcrumbLoading,
  useBreadcrumbHistory,
  useActiveRoute,
  useBreadcrumbLocale,
  type AutoBreadcrumbProps,
} from '../headless'
import type { BreadcrumbItem } from '../core'

// ─── Theme tokens ─────────────────────────────

export type BreadcrumbTheme = 'light' | 'dark' | 'minimal' | 'pill'

const themes: Record<BreadcrumbTheme, {
  linkColor: string
  currentColor: string
  separatorColor: string
  hoverColor: string
  pillBg?: string
  pillCurrentBg?: string
  pillCurrentColor?: string
}> = {
  light:   { linkColor: '#2563eb', currentColor: '#111827', separatorColor: '#9ca3af', hoverColor: '#1d4ed8' },
  dark:    { linkColor: '#93c5fd', currentColor: '#f9fafb', separatorColor: '#4b5563', hoverColor: '#bfdbfe' },
  minimal: { linkColor: 'inherit', currentColor: 'inherit', separatorColor: '#d1d5db', hoverColor: 'inherit' },
  pill:    { linkColor: '#374151', currentColor: '#ffffff',  separatorColor: 'transparent', hoverColor: '#1f2937', pillBg: '#f3f4f6', pillCurrentBg: '#111827', pillCurrentColor: '#ffffff' },
}

// ─── StyledBreadcrumb ─────────────────────────

export interface StyledBreadcrumbProps extends AutoBreadcrumbProps {
  theme?: BreadcrumbTheme
  fontSize?: CSSProperties['fontSize']
}

/**
 * Pre-styled breadcrumb. Supports light / dark / minimal / pill themes.
 * @example
 * <StyledBreadcrumb theme="pill" renderItemSkeleton={(item) => <MySpinner />} />
 */
export function StyledBreadcrumb({ theme = 'light', fontSize = '0.875rem', ...rest }: StyledBreadcrumbProps) {
  const t = themes[theme]
  const isPill = theme === 'pill'

  return (
    <AutoBreadcrumb
      separator={
        isPill ? null : <span style={{ color: t.separatorColor, userSelect: 'none', fontSize }}>/</span>
      }
      renderItem={(item, isLast) => {
        if (item.isLoading) {
          return (
            <span style={{
              display: 'inline-block',
              width: isPill ? '64px' : '56px',
              height: isPill ? '1.5rem' : '0.75em',
              borderRadius: isPill ? '999px' : '4px',
              background: 'linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)',
              backgroundSize: '200% 100%',
              animation: '_bcShimmer 1.4s ease-in-out infinite',
            }} />
          )
        }

        if (isPill) {
          return (
            <a href={item.path} style={{
              fontSize, fontFamily: 'inherit',
              color: isLast ? (t.pillCurrentColor ?? '#fff') : t.linkColor,
              background: isLast ? t.pillCurrentBg : t.pillBg,
              padding: '0.2rem 0.65rem', borderRadius: '999px',
              textDecoration: 'none', fontWeight: isLast ? 600 : 400,
              pointerEvents: isLast ? 'none' : 'auto',
            }}>
              {item.icon && <span aria-hidden="true" style={{ marginRight: '0.25rem' }}>{item.icon}</span>}
              {item.label}
            </a>
          )
        }

        return (
          <span style={{ fontSize, fontFamily: 'inherit', color: isLast ? t.currentColor : t.linkColor, fontWeight: isLast ? 500 : 400, cursor: isLast ? 'default' : 'pointer' }}>
            {item.icon && <span aria-hidden="true" style={{ marginRight: '0.25rem', verticalAlign: 'middle' }}>{item.icon}</span>}
            {item.label}
          </span>
        )
      }}
      {...rest}
    />
  )
}

// ─── CollapsibleBreadcrumb (v3) ───────────────

export interface CollapsibleBreadcrumbProps extends Omit<StyledBreadcrumbProps, 'maxItems'> {
  /**
   * v3: Max items before the middle is replaced by a "..." button that
   * expands to show all items inline. Default: 4.
   */
  collapseAt?: number
}

/**
 * v3: Like StyledBreadcrumb but collapsed items expand on click,
 * rather than just showing "…" with no interaction.
 *
 * @example
 * <CollapsibleBreadcrumb collapseAt={4} theme="light" />
 */
export function CollapsibleBreadcrumb({ collapseAt = 4, theme = 'light', fontSize = '0.875rem', ...rest }: CollapsibleBreadcrumbProps) {
  const items = useBreadcrumb()
  const [expanded, setExpanded] = useState(false)
  const t = themes[theme]

  if (items.length <= collapseAt || expanded) {
    return <StyledBreadcrumb theme={theme} fontSize={fontSize} {...rest} />
  }

  const head = items.slice(0, 1)
  const tail = items.slice(-2)
  const hidden = items.slice(1, -2)

  const sharedStyle: CSSProperties = {
    fontSize, fontFamily: 'inherit',
    color: t.linkColor, textDecoration: 'none', fontWeight: 400,
  }

  return (
    <nav aria-label={rest.ariaLabel ?? 'breadcrumb'} className={rest.className}>
      <style>{`@keyframes _bcShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
        {[...head].map((item, idx) => (
          <li key={item.path + idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a href={item.path} style={sharedStyle}>{item.label}</a>
            <span style={{ opacity: 0.4 }}>/</span>
          </li>
        ))}

        {/* Expandable ellipsis */}
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setExpanded(true)}
            title={`Show ${hidden.length} hidden items`}
            aria-label={`Show ${hidden.length} more breadcrumb items`}
            style={{
              background: '#f3f4f6', border: '1px solid #e5e7eb',
              borderRadius: '4px', padding: '0.1rem 0.5rem',
              fontSize, cursor: 'pointer', color: '#6b7280',
              lineHeight: 1, fontFamily: 'inherit',
            }}
          >
            •••
          </button>
          <span style={{ opacity: 0.4 }}>/</span>
        </li>

        {tail.map((item, idx) => (
          <li key={item.path + idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {item.isLast ? (
              <span style={{ ...sharedStyle, color: t.currentColor, fontWeight: 500 }} aria-current="page">{item.label}</span>
            ) : (
              <a href={item.path} style={sharedStyle}>{item.label}</a>
            )}
            {!item.isLast && <span style={{ opacity: 0.4 }}>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// ─── BreadcrumbSkeleton ───────────────────────

export interface BreadcrumbSkeletonProps {
  count?: number
  height?: CSSProperties['height']
}

/**
 * Full-replacement shimmer skeleton for use with renderSkeleton prop.
 * For per-item skeletons use renderItemSkeleton instead (v3).
 */
export function BreadcrumbSkeleton({ count = 3, height = '0.75rem' }: BreadcrumbSkeletonProps) {
  const widths = [48, 64, 96, 80, 72]
  return (
    <>
      <style>{`@keyframes _bcShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-block', width: widths[i % widths.length], height, borderRadius: '4px',
              background: 'linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)',
              backgroundSize: '200% 100%', animation: '_bcShimmer 1.4s ease-in-out infinite',
            }} />
            {i < count - 1 && <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>/</span>}
          </span>
        ))}
      </div>
    </>
  )
}

// ✅ CORRECT — remove StyledBreadcrumbProps from the re-export line
export { useBreadcrumb, useBreadcrumbLoading, useBreadcrumbHistory, useActiveRoute, useBreadcrumbLocale, AutoBreadcrumb }
export type { AutoBreadcrumbProps, BreadcrumbItem }
