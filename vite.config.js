import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
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

// A short hash of the shipped sounds. It goes on each sound's URL, so a changed
// file is fetched afresh instead of coming from the browser's cache.
const soundDir = resolve('public/sounds');
const soundHash = createHash('sha1');
for (const f of readdirSync(soundDir).filter((n) => n.endsWith('.mp3')).sort()) {
  soundHash.update(f).update(readFileSync(resolve(soundDir, f)));
}
const SOUND_VERSION = soundHash.digest('hex').slice(0, 8);

// Relative base so the built site works from any folder or sub-path.
export default defineConfig({
  base: './',
  plugins: [react(), dropLocalSounds],
  define: { __SOUND_VERSION__: JSON.stringify(SOUND_VERSION) },
  build: {
    target: 'es2022',
    cssMinify: true,
  },
});
