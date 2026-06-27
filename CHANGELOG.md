# Changelog

All notable changes to `breadcrumb-core` are documented here.
This project follows [Semantic Versioning](https://semver.org/).

---

## [3.0.0] — 2026-04-27

### ✨ New features

#### Progressive per-item loading
In v1/v2 the entire breadcrumb blocked on the slowest async label. In v3, static labels render instantly and each async label resolves independently — you see `Home / Products / ▓▓▓▓ / Reviews` immediately, then the skeleton swaps to `iPhone 15 Pro` when it arrives:

```tsx
// Already on by default — nothing to change
<AutoBreadcrumb progressiveLoading />

// Custom per-item skeleton
<AutoBreadcrumb
  renderItemSkeleton={(item) => (
    <span className="skeleton" style={{ width: item.isLast ? 100 : 60 }} />
  )}
/>
```

#### Custom route matchers — RegExp & function
The `path` field now accepts three forms:

```ts
// String (unchanged)
{ path: '/products/:id', label: 'Product' }

// RegExp with named groups (v3)
{ path: /^\/p\/(?<id>\d+)$/, label: ({ params }) => `Product ${params.id}` }

// Fully custom function (v3)
{
  path: (pathname) => {
    const m = pathname.match(/^\/items-(\w+)$/)
    return m ? { slug: m[1] } : null
  },
  label: ({ params }) => `Item: ${params.slug}`,
}
```

#### i18n locale-prefix stripping
Automatically strip and re-apply locale prefixes without defining separate routes per locale:

```tsx
// Works for /en/products/42 and /fr/products/42 with the same routes
<BreadcrumbProvider routes={routes} locales={['en', 'fr', 'de', 'ja']}>

// Read the detected locale anywhere
const locale = useBreadcrumbLocale() // → 'fr'
```

#### `transformLabel` prop
Post-process every resolved label globally — useful for title-casing, translations, or appending meta:

```tsx
<BreadcrumbProvider
  routes={routes}
  transformLabel={(label) => label.toUpperCase()}
/>

// Or with i18n:
<BreadcrumbProvider
  routes={routes}
  transformLabel={(label) => t(label)}
/>
```

#### `CollapsibleBreadcrumb` component
Improves on v2's static `maxItems` — collapsed items expand inline when clicked:

```tsx
import { CollapsibleBreadcrumb } from 'breadcrumb-core/ui'

// Home / ••• / Reviews   ← click ••• to expand
<CollapsibleBreadcrumb collapseAt={4} theme="light" />
```

#### `useActiveRoute()` hook
Shorthand for `useBreadcrumb().at(-1)` — the currently active route item:

```ts
const active = useActiveRoute()
// → { path: '/products/42/reviews', label: 'Reviews', ... } | null
```

#### `useBreadcrumbLocale()` hook
Read the detected i18n locale inside any component:

```ts
const locale = useBreadcrumbLocale() // → 'en' | 'fr' | null
```

#### `buildBreadcrumbsProgressive` utility
New core function for framework-agnostic progressive resolution:

```ts
import { buildBreadcrumbsProgressive } from 'breadcrumb-core'

await buildBreadcrumbsProgressive(pathname, routes, (items) => {
  // called immediately with skeletons, then again per resolved async label
  render(items)
})
```

#### `invalidateLabelCache` accepts `RouteConfig` directly
```ts
// v2 (string path):
invalidateLabelCache('/products/:id', { id: '42' })

// v3 (RouteConfig or string path both work):
invalidateLabelCache(routes.find(r => r.path === '/products/:id')!, { id: '42' })
```

#### JSON-LD only includes resolved items
In v3, the `injectJsonLd` script only lists items that have finished resolving — no empty-label entries during progressive loading.

### 🔧 Improvements
- `progressiveLoading` defaults to `true` — existing code benefits automatically
- `renderItemSkeleton` is preferred over `renderSkeleton` for progressive UX; `renderSkeleton` still works as a full-replacement fallback
- `syncDocumentTitle` updates incrementally as labels resolve
- All adapters pass through `locales` and `transformLabel` automatically via `...rest`

### 💥 Breaking changes
None. v3 is fully backward compatible with v2. All new features are additive or opt-in.

---

## [2.0.0] — 2026-04-26

### Added
- Wildcard routes (`/docs/*`) and optional params (`:id?`)
- `cacheTtl` per route + `invalidateLabelCache()` utility
- `onMatch` per route for analytics
- `onNavigate` on `<BreadcrumbProvider>`
- `useBreadcrumbHistory()` hook
- `ariaLabel` and `onItemClick` props on `<AutoBreadcrumb>`
- `pill` theme in `/ui`
- `route` field on `BreadcrumbItem`
- `maxHistory` on `<BreadcrumbProvider>`

---

## [1.0.0] — 2026-04-26

### Initial release
- `BreadcrumbProvider` + `AutoBreadcrumb` component
- Async label resolution with cache
- Schema.org JSON-LD injection, `document.title` sync
- `maxItems` collapsing, hidden route segments
- Adapters: `react-router`, `next`, `tanstack-router`, `headless`, `ui`
- `useBreadcrumb()` and `useBreadcrumbLoading()` hooks
- `StyledBreadcrumb` with light / dark / minimal themes + `BreadcrumbSkeleton`
