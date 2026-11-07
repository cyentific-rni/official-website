import {defineConfig} from '@playwright/test';
import {commandMode, loadProjectEnv, resolveDeployment} from './scripts/site-config.mjs';

const mode = commandMode([], process.env.SITE_BUILD_MODE || 'production');
const env = loadProjectEnv({mode});
const {base} = resolveDeployment(env);
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:4329${base}`,
    reducedMotion: 'reduce',
    launchOptions: process.env.PLAYWRIGHT_CHANNEL ? {channel: process.env.PLAYWRIGHT_CHANNEL} : {},
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run preview -- --mode ${mode} --host 127.0.0.1 --port 4329 --ignore-lock`,
    url: `http://127.0.0.1:4329${base}`,
    reuseExistingServer: false,
    env: {NODE_ENV: 'production'},
    timeout: 30000,
  },
});
