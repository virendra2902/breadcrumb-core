# Changelog

All notable changes to `breadcrumb-core ` are documented here.
This project follows [Semantic Versioning](https://semver.org/).

---

## [2.0.0] — 2026-04-27

### ✨ New features

#### Wildcard / splat route support
Routes can now end with `*` to match any trailing segments:
```ts
{ path: '/docs/*', label: 'Docs' }
// Matches: /docs/getting-started, /docs/api/reference, etc.
// Wildcard segment available as params['*']
```

#### Optional route params
Named params can be made optional with `?`:
```ts
{ path: '/shop/:category?', label: ({ params }) => params.category ?? 'All' }
```

#### Cache TTL per route (`cacheTtl`)
Control how long a resolved async label is cached before being re-fetched:
```ts
{
  path: '/products/:id',
  label: async ({ params }) => fetchProductName(params.id),
  cacheTtl: 60_000, // re-fetch after 60 seconds
}
```

#### `invalidateLabelCache` utility
Imperatively invalidate a cached label after a mutation:
```ts
import { invalidateLabelCache } from 'breadcrumb-core'

await updateProduct(id, { name: 'New Name' })
invalidateLabelCache('/products/:id', { id })
```

#### `onMatch` per route
Fire a callback whenever a route segment is matched — useful for analytics:
```ts
{
  path: '/products/:id',
  label: 'Product',
  onMatch: ({ params, pathname }) => analytics.page(pathname, params),
}
```

#### `onNavigate` on `<BreadcrumbProvider>`
Fires after every navigation with the resolved items array:
```tsx
<BreadcrumbProvider
  routes={routes}
  onNavigate={(items, pathname) => {
    analytics.track('page_view', { breadcrumb: items.map(i => i.label) })
  }}
>
```

#### `useBreadcrumbHistory()` hook
Access a rolling history of breadcrumb snapshots:
```ts
const history = useBreadcrumbHistory()
const previous = history[history.length - 2]
```

#### `ariaLabel` prop on `<AutoBreadcrumb>`
Customize the `aria-label` on the `<nav>` element — important when you have multiple navs on one page:
```tsx
<AutoBreadcrumb ariaLabel="Product navigation" />
```

#### `onItemClick` prop on `<AutoBreadcrumb>`
Intercept clicks on breadcrumb items. Return `false` to prevent navigation:
```tsx
<AutoBreadcrumb onItemClick={(item) => {
  analytics.click(item.path)
  // return false to block navigation
}} />
```

#### `pill` theme in `breadcrumb-core/ui`
New pill-style visual theme:
```tsx
import { StyledBreadcrumb } from 'breadcrumb-core/ui'
<StyledBreadcrumb theme="pill" />
```

#### `route` on `BreadcrumbItem`
The matched `RouteConfig` is now attached to each `BreadcrumbItem` so custom renderers can read route metadata:
```ts
const items = useBreadcrumb()
items.forEach(item => {
  console.log(item.route?.cacheTtl)
})
```

#### `maxHistory` on `<BreadcrumbProvider>`
Control how many navigation snapshots `useBreadcrumbHistory()` retains (default: 20):
```tsx
<BreadcrumbProvider routes={routes} maxHistory={10}>
```

### 🔧 Improvements

- Label resolver now receives `pathname` (full current path) in addition to `params`
- `BreadcrumbSkeleton` now uses varied widths per item for a more natural shimmer
- `resolveLabel` now correctly handles TTL expiry with a timestamp comparison
- All adapters now forward `...rest` props so `onNavigate` / `maxHistory` pass through cleanly
- `useBreadcrumbHistory` exported from all adapter subpaths

### 💥 Breaking changes

- `label` function signature changed: `({ params })` → `({ params, pathname })`
  
  **Before:**
  ```ts
  label: ({ params }) => fetchName(params.id)
  ```
  **After (both work — `pathname` is optional to destructure):**
  ```ts
  label: ({ params }) => fetchName(params.id)           // still works
  label: ({ params, pathname }) => fetchName(params.id) // also works
  ```
  No code change required — `pathname` is additive, existing destructuring still compiles.

---

## [1.0.0] — 2026-04-26

### Initial release

- `BreadcrumbProvider` + `AutoBreadcrumb` component
- Async label resolution with cache
- Schema.org JSON-LD injection
- `document.title` sync
- `maxItems` collapsing with `…`
- Hidden route segments
- Adapters: `react-router`, `next`, `tanstack-router`, `headless`, `ui`
- `useBreadcrumb()` and `useBreadcrumbLoading()` hooks
- `StyledBreadcrumb` with light / dark / minimal themes
- `BreadcrumbSkeleton` shimmer component
