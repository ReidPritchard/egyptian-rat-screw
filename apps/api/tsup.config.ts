import { defineConfig, type Options } from 'tsup';

export default defineConfig((options: Options) => ({
  entryPoints: ['src/index.ts'],
  target: 'esnext',
  minify: false,
  sourcemap: true,
  outDir: 'dist',
  format: ['cjs'],
  clean: true,
  platform: 'node',
  noExternal: [/(?:.*)/],
  ...options,
}));
