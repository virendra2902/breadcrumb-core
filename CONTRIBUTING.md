# Contributing to auto-breadcrumb

Thanks for your interest in contributing! Here's how to get started.

## Development setup

```bash
git clone https://github.com/virendra2902/auto-breadcrumb.git
cd auto-breadcrumb
npm install
npm run dev      # watch mode — rebuilds on change
npm run lint     # TypeScript type-check
npm run build    # production build → dist/
```

## Project structure

```
src/
├── core/              # Router-agnostic logic (matching, resolving, SEO)
├── headless/          # React context, useBreadcrumb(), <AutoBreadcrumb>
├── react-router/      # React Router v6 adapter
├── next/              # Next.js App Router adapter
├── tanstack-router/   # TanStack Router v1 adapter
└── ui/                # Pre-styled component + skeleton
```

## Adding a new router adapter

1. Create `src/<router-name>/index.tsx`
2. Import `BreadcrumbProvider` and `AutoBreadcrumb` from `../headless`
3. Read the current pathname using the router's hook
4. Pass it to `<CoreProvider routes={routes} pathname={pathname}>`
5. Export the router-specific `<Link>` version of `AutoBreadcrumb`
6. Add the entry to `tsup.config.ts` and the `exports` map in `package.json`

## Pull request checklist

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds and `dist/` is not committed
- [ ] New features are documented in `README.md`
- [ ] Commits follow conventional format: `feat:`, `fix:`, `docs:`, `chore:`

## Releasing

Releases are handled via GitHub Releases. Creating a release tag triggers the `publish.yml` workflow which builds and publishes to npm automatically.
