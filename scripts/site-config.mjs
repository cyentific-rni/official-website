import fs from 'node:fs';
import path from 'node:path';
import {parseEnv} from 'node:util';

// Vite's mode selects .env files; NODE_ENV describes runtime optimisation.
export function commandMode(args = process.argv.slice(2), fallback = 'production') {
  const index = args.findIndex(arg => arg === '--mode' || arg.startsWith('--mode='));
  const mode = index < 0 ? fallback
    : args[index].startsWith('--mode=') ? args[index].slice(7) : args[index + 1];
  if (!mode || !/^[A-Za-z0-9_-]+$/.test(mode)) throw new Error('Supply a valid --mode value.');
  return mode;
}

export function loadProjectEnv({root = process.cwd(), mode = 'development', env = process.env} = {}) {
  const settings = {};
  for (const name of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) Object.assign(settings, parseEnv(fs.readFileSync(file, 'utf8')));
  }
  return {...settings, ...env};
}

export function resolveDeployment(env, {requireSite = false} = {}) {
  const preview = env.SITE_PREVIEW === 'true';
  const configuredSite = env.SITE_URL?.trim();
  if (requireSite && !configuredSite) {
    throw new Error('Set SITE_URL to the intended public HTTPS origin before building. For a local review, set SITE_PREVIEW=true and an explicit HTTPS SITE_URL.');
  }
  const site = new URL(configuredSite || 'http://localhost:4173');
  if (!['https:', 'http:'].includes(site.protocol) || site.username || site.password || site.pathname !== '/' || site.search || site.hash) {
    throw new Error('SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment. Use SITE_BASE for a subdirectory.');
  }
  if (requireSite && !preview && site.protocol !== 'https:') {
    throw new Error('Production builds require an HTTPS SITE_URL. Use SITE_PREVIEW=true for a local review.');
  }
  const base = env.SITE_BASE?.trim() || '/';
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) {
    throw new Error('SITE_BASE must be / or a slash-delimited path such as /repository-name/.');
  }
  return {site: site.origin, base, preview};
}
