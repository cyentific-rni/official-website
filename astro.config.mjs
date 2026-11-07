import { defineConfig } from 'astro/config';
import {commandMode, loadProjectEnv, resolveDeployment} from './scripts/site-config.mjs';

const mode = commandMode(process.argv.slice(2), process.argv.includes('dev') ? 'development' : 'production');
const env = loadProjectEnv({mode});
const settings = resolveDeployment(env);

export default defineConfig({
  site: settings.site,
  base: settings.base,
  output: 'static',
  build: { format: 'file', inlineStylesheets: 'never' },
  compressHTML: true,
  server: { host: false, port: Number(env.PORT || 4173), allowedHosts: ['terminal.local'] },
  devToolbar: { enabled: false },
  vite: { define: { 'import.meta.env.SITE_PREVIEW': JSON.stringify(settings.preview ? 'true' : 'false') } },
  integrations: [{name: 'explicit-deployment-origin', hooks: {
    'astro:config:setup': ({command}) => {
      if (command === 'build') resolveDeployment(env, {requireSite: true});
    },
  }}],
});
