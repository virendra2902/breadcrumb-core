// ─────────────────────────────────────────────
// auto-breadcrumb · ui
// Pre-styled breadcrumb component (no CSS import needed)
// ─────────────────────────────────────────────

import type { CSSProperties } from 'react'
import {
  AutoBreadcrumb,
  useBreadcrumb,
  useBreadcrumbLoading,
  type AutoBreadcrumbProps,
} from '../headless'

export interface StyledBreadcrumbProps extends AutoBreadcrumbProps {
  /** Visual theme. Default: "light" */
  theme?: 'light' | 'dark' | 'minimal'
  /** Font size. Default: "0.875rem" */
  fontSize?: CSSProperties['fontSize']
}

const themes = {
  light: {
    linkColor: '#2563eb',
    currentColor: '#111827',
    separatorColor: '#9ca3af',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
  },
  dark: {
    linkColor: '#93c5fd',
    currentColor: '#f9fafb',
    separatorColor: '#4b5563',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
  },
  minimal: {
    linkColor: 'inherit',
    currentColor: 'inherit',
    separatorColor: '#d1d5db',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
  },
}

/**
 * Ready-made styled breadcrumb. Import and use — no CSS file needed.
 * Supports light / dark / minimal themes out of the box.
 *
 * @example
 * import { StyledBreadcrumb } from 'auto-breadcrumb/ui'
 * <StyledBreadcrumb theme="dark" />
 */
export function StyledBreadcrumb({
  theme = 'light',
  fontSize,
  ...rest
}: StyledBreadcrumbProps) {
  const t = themes[theme]

  return (
    <AutoBreadcrumb
      separator={
        <span style={{ color: t.separatorColor, userSelect: 'none' }}>/</span>
      }
      renderItem={(item, isLast) => (
        <span
          style={{
            fontSize: fontSize ?? t.fontSize,
            fontFamily: t.fontFamily,
            color: isLast ? t.currentColor : t.linkColor,
            fontWeight: isLast ? 500 : 400,
            textDecoration: 'none',
            cursor: isLast ? 'default' : 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {item.icon && (
            <span
              aria-hidden="true"
              style={{ marginRight: '0.25rem', verticalAlign: 'middle' }}
            >
              {item.icon}
            </span>
          )}
          {item.label}
        </span>
      )}
      {...rest}
    />
  )
}

/** Skeleton shimmer item for use with renderSkeleton */
export function BreadcrumbSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-block',
              width: i === 0 ? '3rem' : i === count - 1 ? '5rem' : '4rem',
              height: '0.75rem',
              borderRadius: '4px',
              background:
                'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
              backgroundSize: '200% 100%',
              animation: 'bc-shimmer 1.4s ease-in-out infinite',
            }}
          />
          {i < count - 1 && (
            <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>/</span>
          )}
        </span>
      ))}
      <style>{`@keyframes bc-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}

export { useBreadcrumb, useBreadcrumbLoading, AutoBreadcrumb }
export type { AutoBreadcrumbProps }
