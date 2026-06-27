# breadcrumb-core 🧭

> Zero-config breadcrumbs from your route config — progressive loading, custom matchers, i18n, collapsible overflow, SEO JSON-LD, and adapters for React Router, Next.js, and TanStack Router.

[![npm version](https://img.shields.io/npm/v/breadcrumb-core.svg)](https://www.npmjs.com/package/breadcrumb-core)
[![npm downloads](https://img.shields.io/npm/dm/breadcrumb-core.svg)](https://www.npmjs.com/package/breadcrumb-core)
[![license](https://img.shields.io/npm/l/breadcrumb-core.svg)](https://github.com/virendra2902/breadcrumb-core/blob/main/LICENSE)
[![CI](https://github.com/virendra2902/breadcrumb-core/actions/workflows/ci.yml/badge.svg)](https://github.com/virendra2902/breadcrumb-core/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

**[🌐 Live Demo](https://virendra2902.github.io/breadcrumb-core)** · [npm](https://www.npmjs.com/package/breadcrumb-core) · [GitHub](https://github.com/virendra2902/breadcrumb-core) · [Changelog](./CHANGELOG.md)

---

## Installation

```bash
npm install breadcrumb-core
```

---

## Quick Start

```tsx
// main.tsx / app/layout.tsx
import { BreadcrumbProvider } from 'breadcrumb-core/react-router' // or /next, /tanstack-router
import { routes } from './routes'

<BreadcrumbProvider routes={routes}>
  <App />
</BreadcrumbProvider>

// Any page — zero breadcrumb code
import { AutoBreadcrumb } from 'breadcrumb-core/react-router'
<AutoBreadcrumb separator="/" injectJsonLd syncDocumentTitle appName="MyApp" />
// → Home / Products / iPhone 15 / Reviews
```

---

## Route Config (v3)

```ts
import type { RouteConfig } from 'breadcrumb-core'

const routes: RouteConfig[] = [
  { path: '/', label: 'Home' },

  // Standard named param
  { path: '/products', label: 'Products' },
  { path: '/products/:id', label: async ({ params }) => fetchName(params.id), cacheTtl: 60_000 },

  // Wildcard
  { path: '/docs/*', label: 'Docs' },

  // Optional param
  { path: '/shop/:category?', label: ({ params }) => params.category ?? 'All' },

  // RegExp matcher with named groups (v3)
  { path: /^\/p\/(?<id>\d+)$/, label: ({ params }) => `Product ${params.id}` },

  // Function matcher (v3)
  {
    path: (pathname) => {
      const m = pathname.match(/^\/items-(\w+)$/)
      return m ? { slug: m[1] } : null
    },
    label: ({ params }) => `Item: ${params.slug}`,
  },

  // With icon, hidden, onMatch
  { path: '/settings', label: 'Settings', icon: <GearIcon />, onMatch: ({ pathname }) => analytics.page(pathname) },
  { path: '/app', label: 'App', hidden: true },
]
```

---

## v3 Features

### Progressive per-item loading (v3)

Static labels render instantly. Async labels each show a skeleton independently and swap in as they resolve:

```tsx
// Default behaviour — nothing to change
<AutoBreadcrumb />

// Custom per-item skeleton
<AutoBreadcrumb
  renderItemSkeleton={(item) => (
    <span className="my-skeleton" style={{ width: item.isLast ? 100 : 60 }} />
  )}
/>
```

### i18n locale-prefix stripping (v3)

```tsx
// Handles /en/products/42 and /fr/products/42 with the same route definitions
<BreadcrumbProvider routes={routes} locales={['en', 'fr', 'de', 'ja']}>

// Read detected locale anywhere
import { useBreadcrumbLocale } from 'breadcrumb-core/react-router'
const locale = useBreadcrumbLocale() // → 'fr'
```

### Label transform (v3)

```tsx
// Post-process every label globally
<BreadcrumbProvider
  routes={routes}
  transformLabel={(label) => t(label)} // e.g. i18next
/>
```

### Collapsible overflow (v3)

```tsx
import { CollapsibleBreadcrumb } from 'breadcrumb-core/ui'

// Home / ••• / Reviews  — click ••• to expand inline
<CollapsibleBreadcrumb collapseAt={4} theme="light" />
```

### Active route hook (v3)

```ts
import { useActiveRoute } from 'breadcrumb-core/react-router'
const active = useActiveRoute()
// → { path, label, params, isLast, route } | null
```

### Cache invalidation after mutations

```ts
import { invalidateLabelCache } from 'breadcrumb-core'
await renameProduct(id, newName)
invalidateLabelCache(productRoute, { id })
```

### Analytics

```tsx
<BreadcrumbProvider
  routes={routes}
  onNavigate={(items, pathname) =>
    analytics.page(pathname, { trail: items.map(i => i.label).join(' > ') })
  }
/>
```

---

## API Reference

### `<BreadcrumbProvider>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `routes` | `RouteConfig[]` | required | Route definitions |
| `children` | `ReactNode` | required | App content |
| `onNavigate` | `(items, pathname) => void` | — | Called after each navigation |
| `maxHistory` | `number` | `20` | Max snapshots for `useBreadcrumbHistory()` |
| `locales` | `string[]` | — | **v3** i18n locale prefixes to strip |
| `transformLabel` | `(label, item) => string` | — | **v3** Global label transformer |

### `<AutoBreadcrumb>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `separator` | `ReactNode` | `"/"` | Between items |
| `maxItems` | `number` | — | Collapse middle with `…` (static) |
| `showHome` | `boolean` | `true` | Include root item |
| `className` | `string` | — | CSS class on `<nav>` |
| `syncDocumentTitle` | `boolean` | `false` | Auto-update `document.title` |
| `appName` | `string` | — | Appended to synced title |
| `injectJsonLd` | `boolean` | `false` | Inject Schema.org JSON-LD |
| `baseUrl` | `string` | `""` | Base URL for JSON-LD |
| `renderItem` | `(item, isLast) => ReactNode` | — | Custom item renderer |
| `renderItemSkeleton` | `(item) => ReactNode` | — | **v3** Per-item skeleton |
| `renderSkeleton` | `() => ReactNode` | — | Full-replacement skeleton (legacy) |
| `progressiveLoading` | `boolean` | `true` | **v3** Per-item async rendering |
| `ariaLabel` | `string` | `"breadcrumb"` | `aria-label` on `<nav>` |
| `onItemClick` | `(item) => boolean \| void` | — | Intercept item clicks |

### `RouteConfig`

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string \| RegExp \| fn` | **v3** string, RegExp with groups, or `(pathname) => params \| null` |
| `label` | `string \| fn` | Static or async. fn receives `{ params, pathname }` |
| `icon` | `ReactNode` | Icon before label |
| `hidden` | `boolean` | Skip in breadcrumb |
| `cacheTtl` | `number` | Cache TTL in ms |
| `onMatch` | `fn` | Called when segment is matched |

### Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useBreadcrumb()` | `BreadcrumbItem[]` | Current items (with `isLoading` per item) |
| `useBreadcrumbLoading()` | `boolean` | True while any label is resolving |
| `useBreadcrumbHistory()` | `BreadcrumbItem[][]` | Navigation snapshots |
| `useActiveRoute()` | `BreadcrumbItem \| null` | **v3** Last (current) item |
| `useBreadcrumbLocale()` | `string \| null` | **v3** Detected locale prefix |

### Core utilities

```ts
import {
  matchRoute,
  buildBreadcrumbs,
  buildBreadcrumbsProgressive, // v3
  generateJsonLd,
  clearLabelCache,
  invalidateLabelCache,
  stripLocalePrefix,            // v3
  withLocalePrefix,             // v3
} from 'breadcrumb-core'
```

### UI components

```ts
import {
  StyledBreadcrumb,        // themes: light | dark | minimal | pill
  CollapsibleBreadcrumb,   // v3: expandable ••• overflow
  BreadcrumbSkeleton,      // full-row shimmer
} from 'breadcrumb-core/ui'
```

---

## Migration

- **v1 → v3:** No breaking changes. Drop in v3 and get progressive loading automatically.
- **v2 → v3:** No breaking changes. All v2 features still work unchanged.
- See [CHANGELOG.md](./CHANGELOG.md) for the full additions per version.

---

## License

MIT © [virendra2902](https://github.com/virendra2902)
