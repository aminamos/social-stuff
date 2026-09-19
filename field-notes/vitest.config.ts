import { defineConfig } from 'vitest/config'

// Minimal config: the app vite.config.ts loads @cloudflare/vite-plugin, whose
// runner worker crashes under this Node version. Unit tests don't need it.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
