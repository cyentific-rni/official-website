import {spawnSync} from 'node:child_process';

const env = {...process.env, SITE_PREVIEW: 'true', SITE_URL: process.env.SITE_URL?.trim() || 'https://preview.invalid'};
const result = spawnSync(process.execPath, ['scripts/build.mjs', ...process.argv.slice(2)], {env, stdio: 'inherit'});
process.exit(result.status ?? 1);
