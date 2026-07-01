import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    headless: false,
    channel: 'chromium',
    launchOptions: {
      args: ['--use-gl=angle'],
    },
  },
  outputDir: 'tests/screenshots',
});
