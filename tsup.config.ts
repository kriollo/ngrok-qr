import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    platform: 'node',
    target: 'node18',
    external: ['readline/promises', 'timers/promises'],
    clean: true,
    splitting: false,
    sourcemap: false,
    dts: false,
    minify: false,
});
