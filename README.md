# auto-breadcrumb 🧭

> Zero-config breadcrumbs from your route config — async labels, SEO JSON-LD, and adapters for React Router, Next.js, and TanStack Router.

[![npm version](https://img.shields.io/npm/v/auto-breadcrumb.svg)](https://www.npmjs.com/package/auto-breadcrumb)
[![npm downloads](https://img.shields.io/npm/dm/auto-breadcrumb.svg)](https://www.npmjs.com/package/auto-breadcrumb)
[![license](https://img.shields.io/npm/l/auto-breadcrumb.svg)](https://github.com/virendra2902/auto-breadcrumb/blob/main/LICENSE)
[![CI](https://github.com/virendra2902/auto-breadcrumb/actions/workflows/ci.yml/badge.svg)](https://github.com/virendra2902/auto-breadcrumb/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

**[🌐 Live Demo](https://virendra2902.github.io/auto-breadcrumb)** · [npm](https://www.npmjs.com/package/auto-breadcrumb) · [GitHub](https://github.com/virendra2902/auto-breadcrumb)

---

## The Problem

Every app has this pain — breadcrumbs written by hand on every page, breaking silently when routes change, dynamic segments needing their own fetch logic, and labels duplicated between your router config and your UI.

```tsx
// ❌ Before — written manually on every page
<Breadcrumb>
  <Item>Home</Item>
  <Item>Products</Item>
  <Item>{product.name}</Item>  {/* fetch this yourself */}
  <Item>Reviews</Item>
</Breadcrumb>
```

## The Solution

Define your routes once. `<AutoBreadcrumb />` handles the rest — everywhere, forever.

```tsx
// ✅ routes.ts — define once
export const routes = [
  { path: '/',                       label: 'Home' },
  { path: '/products',               label: 'Products' },
  { path: '/products/:id',           label: async ({ params }) => getProductName(params.id) },
  { path: '/products/:id/reviews',   label: 'Reviews' },
]

// ✅ Any page — zero breadcrumb code
<AutoBreadcrumb />
// → Home / Products / iPhone 15 / Reviews
```

---

## Installation

```bash
npm install auto-breadcrumb
# or
yarn add auto-breadcrumb
# or
pnpm add auto-breadcrumb
```

**Peer dependencies:** React ≥ 17

---

## Quick Start

### React Router v6

```tsx
// main.tsx
import { BrowserRouter } from 'react-router-dom'
import { BreadcrumbProvider } from 'auto-breadcrumb/react-router'
import { routes } from './routes'

<BrowserRouter>
  <BreadcrumbProvider routes={routes}>
    <App />
  </BreadcrumbProvider>
</BrowserRouter>
```

```tsx
// Any component — no imports needed beyond this one
import { AutoBreadcrumb } from 'auto-breadcrumb/react-router'

export function Header() {
  return <AutoBreadcrumb separator="/" />
}
```

### Next.js App Router

```tsx
// app/layout.tsx
import { BreadcrumbProvider } from 'auto-breadcrumb/next'
import { routes } from '@/routes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BreadcrumbProvider routes={routes}>
          {children}
        </BreadcrumbProvider>
      </body>
    </html>
  )
}
```

```tsx
// Any page
import { AutoBreadcrumb } from 'auto-breadcrumb/next'

export default function ProductPage() {
  return (
    <>
      <AutoBreadcrumb injectJsonLd syncDocumentTitle appName="MyShop" />
      <main>...</main>
    </>
  )
}
```

### TanStack Router

```tsx
// __root.tsx
import { BreadcrumbProvider } from 'auto-breadcrumb/tanstack-router'

export function RootComponent() {
  return (
    <BreadcrumbProvider routes={routes}>
      <Outlet />
    </BreadcrumbProvider>
  )
}
```

---

## Route Config

```ts
import type { RouteConfig } from 'auto-breadcrumb'

const routes: RouteConfig[] = [
  // Static label
  { path: '/', label: 'Home' },

  // Static string for a nested path
  { path: '/products', label: 'Products' },

  // Async label — fetches name, caches result
  {
    path: '/products/:id',
    label: async ({ params }) => {
      const product = await fetchProduct(params.id)
      return product.name
    },
  },

  // With icon
  { path: '/settings', label: 'Settings', icon: <GearIcon /> },

  // Hidden from breadcrumb (layout-only route)
  { path: '/app', label: 'App', hidden: true },
]
```

---

## Features

### ⚡ Async labels with cache

```ts
{
  path: '/users/:id',
  label: async ({ params }) => {
    const user = await fetchUser(params.id)
    return user.displayName
  }
}
```

Labels can be async. Results are cached by `(path, params)` — back navigation is instant. Pass `renderSkeleton` to show a placeholder while loading.

### 🔍 Schema.org JSON-LD (SEO)

```tsx
<AutoBreadcrumb injectJsonLd baseUrl="https://myapp.com" />
```

Automatically injects a `BreadcrumbList` structured data block for Google rich results. No extra libraries needed.

### 📄 Document title sync

```tsx
<AutoBreadcrumb syncDocumentTitle appName="MyApp" />
// Sets: document.title = "iPhone 15 — Products — MyApp"
```

### 🙈 Hidden segments

```ts
{ path: '/app', label: 'App', hidden: true }
// Skipped in breadcrumb, present in routing
```

### 🗜️ Smart collapsing

```tsx
<AutoBreadcrumb maxItems={4} />
// Home / Products / … / Reviews
```

### 🎨 Headless mode

```tsx
import { useBreadcrumb } from 'auto-breadcrumb/headless'

function MyBreadcrumb() {
  const items = useBreadcrumb()
  // [{ path, label, params, isLast, icon }, ...]
  return (
    <ol>
      {items.map(item => (
        <li key={item.path}>
          {item.isLast
            ? <span>{item.label}</span>
            : <a href={item.path}>{item.label}</a>}
        </li>
      ))}
    </ol>
  )
}
```

### 💅 Pre-styled component

```tsx
import { StyledBreadcrumb, BreadcrumbSkeleton } from 'auto-breadcrumb/ui'

<StyledBreadcrumb
  theme="dark"
  renderSkeleton={() => <BreadcrumbSkeleton count={3} />}
/>
```

---

## API Reference

### `<BreadcrumbProvider>`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `routes` | `RouteConfig[]` | ✅ | Route definitions |
| `children` | `ReactNode` | ✅ | App content |
| `pathname` | `string` | (core only) | Current pathname. Injected automatically by adapters |

### `<AutoBreadcrumb>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `separator` | `ReactNode` | `"/"` | Separator between items |
| `maxItems` | `number` | — | Collapse middle with `…` |
| `showHome` | `boolean` | `true` | Include root `/` item |
| `homeIcon` | `ReactNode` | — | Icon for home item |
| `className` | `string` | — | CSS class on `<nav>` |
| `syncDocumentTitle` | `boolean` | `false` | Auto-update `document.title` |
| `appName` | `string` | — | Appended to synced title |
| `injectJsonLd` | `boolean` | `false` | Inject Schema.org JSON-LD |
| `baseUrl` | `string` | `""` | Base URL for JSON-LD |
| `renderItem` | `(item, isLast) => ReactNode` | — | Custom item renderer |
| `renderSkeleton` | `() => ReactNode` | — | Shown while async labels load |

### `RouteConfig`

```ts
interface RouteConfig {
  path: string                                              // Express-style path
  label: string | (({ params: RouteParams }) =>            // Label or async fn
    string | Promise<string>)
  icon?: ReactNode                                         // Icon before label
  hidden?: boolean                                         // Skip in breadcrumb
}
```

### `BreadcrumbItem`

```ts
interface BreadcrumbItem {
  path: string
  label: string
  params: Record<string, string>
  isLast: boolean
  icon?: ReactNode
}
```

### Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useBreadcrumb()` | `BreadcrumbItem[]` | Current resolved items |
| `useBreadcrumbLoading()` | `boolean` | True while async labels resolve |

### Core utilities (framework-agnostic)

```ts
import { matchRoute, buildBreadcrumbs, generateJsonLd, clearLabelCache } from 'auto-breadcrumb'
```

---

## Comparison

| Tool | Async labels | SEO JSON-LD | Multi-router | Headless | Cache |
|------|:---:|:---:|:---:|:---:|:---:|
| **auto-breadcrumb** ✦ | ✅ | ✅ | ✅ | ✅ | ✅ |
| use-react-router-breadcrumbs | ❌ | ❌ | ❌ | ✅ | ❌ |
| antd Breadcrumb | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manual per-page | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Contributing

Contributions are welcome! Please open an issue or PR on [GitHub](https://github.com/virendra2902/auto-breadcrumb).

```bash
git clone https://github.com/virendra2902/auto-breadcrumb.git
cd auto-breadcrumb
npm install
npm run dev    # watch mode build
npm run lint   # type check
npm run build  # production build
```

---

## License

MIT © [virendra2902](https://github.com/virendra2902)
