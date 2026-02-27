import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    clean: true,
    splitting: false,
    sourcemap: false,
    dts: false,
    minify: false,
});
