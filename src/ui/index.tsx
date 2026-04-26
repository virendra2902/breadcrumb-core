// ─────────────────────────────────────────────
// breadcrumb-core · ui  v2.0.0
// Pre-styled breadcrumb components — no CSS file needed
// ─────────────────────────────────────────────

import type { CSSProperties } from 'react'
import {
  AutoBreadcrumb,
  useBreadcrumb,
  useBreadcrumbLoading,
  useBreadcrumbHistory,
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
  bg?: string
  pillBg?: string
  pillCurrentBg?: string
}> = {
  light: {
    linkColor: '#2563eb',
    currentColor: '#111827',
    separatorColor: '#9ca3af',
    hoverColor: '#1d4ed8',
  },
  dark: {
    linkColor: '#93c5fd',
    currentColor: '#f9fafb',
    separatorColor: '#4b5563',
    hoverColor: '#bfdbfe',
  },
  minimal: {
    linkColor: 'inherit',
    currentColor: 'inherit',
    separatorColor: '#d1d5db',
    hoverColor: 'inherit',
  },
  pill: {
    linkColor: '#374151',
    currentColor: '#ffffff',
    separatorColor: 'transparent',
    hoverColor: '#1f2937',
    pillBg: '#f3f4f6',
    pillCurrentBg: '#111827',
  },
}

// ─── StyledBreadcrumb ─────────────────────────

export interface StyledBreadcrumbProps extends AutoBreadcrumbProps {
  /** Visual theme. Default: "light" */
  theme?: BreadcrumbTheme
  /** Font size. Default: "0.875rem" */
  fontSize?: CSSProperties['fontSize']
}

/**
 * Ready-made styled breadcrumb. Zero CSS imports needed.
 * Supports light / dark / minimal / pill themes.
 *
 * @example
 * import { StyledBreadcrumb } from 'auto-breadcrumb/ui'
 * <StyledBreadcrumb theme="pill" />
 */
export function StyledBreadcrumb({
  theme = 'light',
  fontSize = '0.875rem',
  ...rest
}: StyledBreadcrumbProps) {
  const t = themes[theme]
  const isPill = theme === 'pill'

  return (
    <AutoBreadcrumb
      separator={
        isPill ? null : (
          <span style={{ color: t.separatorColor, userSelect: 'none', fontSize }}>
            /
          </span>
        )
      }
      renderItem={(item, isLast) => {
        if (isPill) {
          return (
            <a
              href={item.path}
              style={{
                fontSize,
                fontFamily: 'inherit',
                color: isLast ? t.currentColor : t.linkColor,
                background: isLast ? t.pillCurrentBg : t.pillBg,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                textDecoration: 'none',
                fontWeight: isLast ? 600 : 400,
                cursor: isLast ? 'default' : 'pointer',
                pointerEvents: isLast ? 'none' : 'auto',
              }}
            >
              {item.icon && (
                <span aria-hidden="true" style={{ marginRight: '0.25rem' }}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </a>
          )
        }

        return (
          <span
            style={{
              fontSize,
              fontFamily: 'inherit',
              color: isLast ? t.currentColor : t.linkColor,
              fontWeight: isLast ? 500 : 400,
              cursor: isLast ? 'default' : 'pointer',
            }}
          >
            {item.icon && (
              <span aria-hidden="true" style={{ marginRight: '0.25rem', verticalAlign: 'middle' }}>
                {item.icon}
              </span>
            )}
            {item.label}
          </span>
        )
      }}
      {...rest}
    />
  )
}

// ─── BreadcrumbSkeleton ───────────────────────

export interface BreadcrumbSkeletonProps {
  /** Number of skeleton items to show. Default: 3 */
  count?: number
  /** Height of each skeleton bar. Default: "0.75rem" */
  height?: CSSProperties['height']
}

/**
 * Shimmer skeleton for use with renderSkeleton prop.
 *
 * @example
 * <AutoBreadcrumb renderSkeleton={() => <BreadcrumbSkeleton count={4} />} />
 */
export function BreadcrumbSkeleton({ count = 3, height = '0.75rem' }: BreadcrumbSkeletonProps) {
  const widths = [48, 64, 96, 80, 72]
  return (
    <>
      <style>{`
        @keyframes __bc_shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-block',
                width: widths[i % widths.length],
                height,
                borderRadius: '4px',
                background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                backgroundSize: '200% 100%',
                animation: '__bc_shimmer 1.4s ease-in-out infinite',
              }}
            />
            {i < count - 1 && (
              <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>/</span>
            )}
          </span>
        ))}
      </div>
    </>
  )
}

export { useBreadcrumb, useBreadcrumbLoading, useBreadcrumbHistory, AutoBreadcrumb }
export type { AutoBreadcrumbProps, BreadcrumbItem }
