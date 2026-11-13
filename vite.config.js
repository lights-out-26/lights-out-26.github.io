import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// public/sounds/local/ holds dev-only sound overrides (see src/lib/sound.js);
// they are never shipped, so drop them from the build output.
const dropLocalSounds = {
  name: 'drop-local-sounds',
  apply: 'build',
  writeBundle(options) {
    rmSync(resolve(options.dir, 'sounds/local'), { recursive: true, force: true });
  },
};

// Relative base so the built site works from any folder or sub-path.
export default defineConfig({
  base: './',
  plugins: [react(), dropLocalSounds],
  build: {
    target: 'es2022',
    cssMinify: true,
  },
});
