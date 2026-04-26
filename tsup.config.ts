import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      'core/index': 'src/core/index.ts',
      'react-router/index': 'src/react-router/index.tsx',
      'next/index': 'src/next/index.tsx',
      'headless/index': 'src/headless/index.tsx',
      'ui/index': 'src/ui/index.tsx',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
      'react',
      'react-dom',
      'react-router-dom',
      'next',
      'next/navigation',
      '@tanstack/react-router',
    ],
    treeshake: true,
    outDir: 'dist',
  },
  {
    entry: {
      'tanstack-router/index': 'src/tanstack-router/index.tsx',
    },
    format: ['cjs', 'esm'],
    dts: {
      resolve: false,
    },
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
