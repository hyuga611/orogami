import { defineConfig } from 'tsup';

// Two public entry points:
//   orogami       -> src/index.ts  (core wrap/phrases/preview; only needs budoux)
//   orogami/og    -> src/og.ts     (experimental OGP render; satori/resvg/subset-font are optional peers)
// budoux + peers are externalized automatically (deps & peerDeps), so dist keeps them as bare imports.
export default defineConfig({
  entry: ['src/index.ts', 'src/og.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: false,
});
