import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { offlineBuild } from './scripts/pwa';

export default defineConfig({
  plugins: [react(), offlineBuild()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
    clearMocks: true,
  },
});
