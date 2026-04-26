# breadcrumb-core 🧭🧭

> Zero-config breadcrumbs from your route config — async labels, SEO JSON-LD, wildcard routes, navigation history, and adapters for React Router, Next.js, and TanStack Router.

[![npm version](https://img.shields.io/npm/v/auto-breadcrumb.svg)](https://www.npmjs.com/package/breadcrumb-core)
[![npm downloads](https://img.shields.io/npm/dm/auto-breadcrumb.svg)](https://www.npmjs.com/package/breadcrumb-core)
[![license](https://img.shields.io/npm/l/auto-breadcrumb.svg)](https://github.com/virendra2902/breadcrumb-core/blob/main/LICENSE)
[![CI](https://github.com/virendra2902/auto-breadcrumb/actions/workflows/ci.yml/badge.svg)](https://github.com/virendra2902/breadcrumb-core/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

**[🌐 Live Demo](https://virendra2902.github.io/breadcrumb-core)** · [npm](https://www.npmjs.com/package/breadcrumb-core) · [GitHub](https://github.com/virendra2902/breadcrumb-core) · [Changelog](./CHANGELOG.md)

---

## Installation

```bash
npm install breadcrumb-core
```

**Peer dependencies:** React ≥ 17

---

## Quick Start

### React Router v6

```tsx
// main.tsx
import { BrowserRouter } from 'react-router-dom'
import { BreadcrumbProvider } from 'breadcrumb-core/react-router'
import { routes } from './routes'

<BrowserRouter>
  <BreadcrumbProvider routes={routes}>
    <App />
  </BreadcrumbProvider>
</BrowserRouter>

// Any component
import { AutoBreadcrumb } from 'breadcrumb-core/react-router'
<AutoBreadcrumb separator="/" />
```

### Next.js App Router

```tsx
// app/layout.tsx
import { BreadcrumbProvider } from 'breadcrumb-core/next'
import { routes } from '@/routes'

export default function RootLayout({ children }) {
  return (
    <BreadcrumbProvider routes={routes}>
      {children}
    </BreadcrumbProvider>
  )
}

// Any page
import { AutoBreadcrumb } from 'breadcrumb-core/next'
<AutoBreadcrumb injectJsonLd syncDocumentTitle appName="MyApp" />
```

---

## Route Config

```ts
import type { RouteConfig } from 'breadcrumb-core'

const routes: RouteConfig[] = [
  { path: '/', label: 'Home' },

  { path: '/products', label: 'Products' },

  // Async label with 60s cache TTL (v2)
  {
    path: '/products/:id',
    label: async ({ params }) => fetchProductName(params.id),
    cacheTtl: 60_000,
    onMatch: ({ params }) => analytics.track('product_view', params),
  },

  // Wildcard route (v2)
  { path: '/docs/*', label: 'Docs' },

  // Optional param (v2)
  { path: '/shop/:category?', label: ({ params }) => params.category ?? 'All' },

  // Hidden from breadcrumb
  { path: '/app', label: 'App', hidden: true },

  // With icon
  { path: '/settings', label: 'Settings', icon: <GearIcon /> },
]
```

---

## v2 Features

### Wildcard routes

```ts
{ path: '/docs/*', label: 'Docs' }
// Matches /docs/intro, /docs/api/reference, etc.
// params['*'] contains the wildcard portion
```

### Cache TTL per route

```ts
{
  path: '/users/:id',
  label: async ({ params }) => fetchUser(params.id).then(u => u.name),
  cacheTtl: 30_000, // re-fetch after 30 seconds
}
```

### Invalidate cache after mutations

```ts
import { invalidateLabelCache } from 'breadcrumb-core'

await renameProduct(id, newName)
invalidateLabelCache('/products/:id', { id })
// Next navigation will re-fetch the label
```

### Analytics with `onNavigate`

```tsx
<BreadcrumbProvider
  routes={routes}
  onNavigate={(items, pathname) => {
    analytics.page(pathname, { trail: items.map(i => i.label).join(' > ') })
  }}
>
```

### Navigation history

```tsx
import { useBreadcrumbHistory } from 'breadcrumb-core/react-router'

function BackLink() {
  const history = useBreadcrumbHistory()
  const prev = history[history.length - 2]
  if (!prev) return null
  const item = prev[prev.length - 1]
  return <a href={item.path}>← Back to {item.label}</a>
}
```

### Accessible multi-nav pages

```tsx
<AutoBreadcrumb ariaLabel="Product navigation" />
<AutoBreadcrumb ariaLabel="Site navigation" />
```

### Click interception

```tsx
<AutoBreadcrumb
  onItemClick={(item) => {
    if (item.path === '/checkout') {
      showConfirmDialog()
      return false // prevent navigation
    }
  }}
/>
```

### Pill theme

```tsx
import { StyledBreadcrumb } from 'breadcrumb-core/ui'
<StyledBreadcrumb theme="pill" />
```

---

## API Reference

### `<BreadcrumbProvider>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `routes` | `RouteConfig[]` | required | Route definitions |
| `children` | `ReactNode` | required | App content |
| `onNavigate` | `(items, pathname) => void` | — | **v2** Called after each navigation |
| `maxHistory` | `number` | `20` | **v2** Max snapshots for `useBreadcrumbHistory()` |

### `<AutoBreadcrumb>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `separator` | `ReactNode` | `"/"` | Between items |
| `maxItems` | `number` | — | Collapse middle with `…` |
| `showHome` | `boolean` | `true` | Include root item |
| `className` | `string` | — | CSS class on `<nav>` |
| `syncDocumentTitle` | `boolean` | `false` | Auto-update `document.title` |
| `appName` | `string` | — | Appended to synced title |
| `injectJsonLd` | `boolean` | `false` | Inject Schema.org JSON-LD |
| `baseUrl` | `string` | `""` | Base URL for JSON-LD |
| `renderItem` | `(item, isLast) => ReactNode` | — | Custom item renderer |
| `renderSkeleton` | `() => ReactNode` | — | Loading placeholder |
| `ariaLabel` | `string` | `"breadcrumb"` | **v2** `aria-label` on `<nav>` |
| `onItemClick` | `(item) => boolean \| void` | — | **v2** Intercept clicks |

### `RouteConfig`

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string` | Express-style path. Supports `:param`, `:param?`, `*` |
| `label` | `string \| fn` | Static or async label. **v2:** fn receives `{ params, pathname }` |
| `icon` | `ReactNode` | Icon before label |
| `hidden` | `boolean` | Skip in breadcrumb |
| `cacheTtl` | `number` | **v2** Cache TTL in ms |
| `onMatch` | `fn` | **v2** Called when segment is matched |

### Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useBreadcrumb()` | `BreadcrumbItem[]` | Current items |
| `useBreadcrumbLoading()` | `boolean` | True while resolving |
| `useBreadcrumbHistory()` | `BreadcrumbItem[][]` | **v2** Navigation snapshots |

### Core utilities

```ts
import {
  matchRoute,
  buildBreadcrumbs,
  generateJsonLd,
  clearLabelCache,
  invalidateLabelCache, // v2
} from 'auto-breadcrumb'
```

---

## Migration from v1

1. **`label` function signature** — `pathname` is now available but optional. No changes needed unless you want it.
2. **All adapters now forward extra props** — `onNavigate` and `maxHistory` work on all router adapters.
3. See [CHANGELOG.md](./CHANGELOG.md) for the full list of additions.

---

## Contributing

```bash
git clone https://github.com/virendra2902/breadcrumb-core.git
cd breadcrumb-core
npm install
npm run dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT © [virendra2902](https://github.com/virendra2902)
