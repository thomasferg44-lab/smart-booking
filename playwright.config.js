import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    // Defaults to the netlify dev port; override with BASE_URL (e.g. vite on 5180).
    baseURL: process.env.BASE_URL || 'http://localhost:8888',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
