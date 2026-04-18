import { defineConfig } from 'tsup'

// Entries that are React client components / hooks must carry the
// "use client" directive in the bundled output so Next.js App Router
// and other RSC-aware bundlers know they cannot be server-rendered.
const USE_CLIENT_BANNER = { js: '"use client";' }

export default defineConfig([
  // ─── Core (no React hooks, no "use client") ──────────────────────────────
  {
    entry: {
      'core/index': 'src/core/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: {
      compilerOptions: {
        skipLibCheck: true,
      },
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
      'react',
      'react-dom',
    ],
    treeshake: true,
    outDir: 'dist',
  },

  // ─── React client bundles (need "use client") ────────────────────────────
  {
    entry: {
      'headless/index': 'src/headless/index.tsx',
      'react-router/index': 'src/react-router/index.tsx',
      'next/index': 'src/next/index.tsx',
      'ui/index': 'src/ui/index.tsx',
    },
    format: ['cjs', 'esm'],
    banner: USE_CLIENT_BANNER,
    dts: {
      compilerOptions: {
        skipLibCheck: true,
      },
    },
    splitting: false,
    sourcemap: true,
    external: [
      'react',
      'react-dom',
      'react-router-dom',
      'next',
      'next/navigation',
      'next/link',
      'next/router',
      '@tanstack/react-router',
    ],
    treeshake: true,
    outDir: 'dist',
  },

  // ─── TanStack Router adapter (separate tsconfig needed) ──────────────────
  {
    entry: {
      'tanstack-router/index': 'src/tanstack-router/index.tsx',
    },
    format: ['cjs', 'esm'],
    banner: USE_CLIENT_BANNER,
    dts: {
      resolve: false,
      compilerOptions: {
        skipLibCheck: true,
        moduleResolution: 'node' as any,
      },
    },
    tsconfig: 'tsconfig.tanstack.json',
    splitting: false,
    sourcemap: true,
    external: [
      'react',
      'react-dom',
      '@tanstack/react-router',
    ],
    treeshake: true,
    outDir: 'dist',
  },
])
