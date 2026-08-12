import { defineConfig } from 'tsup';

// Two public entry points:
//   orogami       -> src/index.ts  (core wrap/phrases/preview; only needs budoux)
//   orogami/og    -> src/og.ts     (experimental OGP render; satori/resvg/subset-font are optional peers)
// The optional peers stay external — a consumer who never renders an image should
// not have to install a renderer. budoux does not, and the reason is worth stating.
//
// budoux 0.7.0 shipped module/index.js written in ESM while its own package.json
// declared the package as CommonJS. Node only loads that if it detects module
// syntax by default, which arrived in 20.19 and 22.7 — so `import 'budoux'` threw
// on 18.x, on 20.18 and on 22.0-22.6, and this package's engines >=18 was a promise
// it could not keep. Later budoux fixes the packaging, but 0.8.4 also adds
// google-artifactregistry-auth, dragging google-auth-library, gaxios and node-fetch
// into the tree of anyone who wants to wrap a line of Japanese: 39 packages.
//
// Bundling ends both problems. Tree-shaking keeps the parsers and the models and
// drops budoux's CLI and HTML paths, so dist carries no bare 'budoux' import and
// this package has no runtime dependencies at all. dist goes from 15 KB to ~715 KB,
// which is the model data — the same bytes a consumer downloaded before, minus the
// 38 other packages that used to come with them.
export default defineConfig({
  entry: ['src/index.ts', 'src/og.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  dts: true,
  clean: true,
  treeshake: true,
  noExternal: ['budoux'],
  sourcemap: false,
});
