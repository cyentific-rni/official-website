import {spawnSync} from 'node:child_process';
import {commandMode} from './site-config.mjs';

const args = process.argv.slice(2);
const mode = commandMode(args, process.env.SITE_BUILD_MODE || 'production');
const outputFlag = args.find(arg => arg.startsWith('--outDir='));
const outputIndex = args.indexOf('--outDir');
const output = outputFlag?.slice(9) || (outputIndex < 0 ? 'dist' : args[outputIndex + 1]);
const env = {...process.env, SITE_BUILD_MODE: mode};
const buildArgs = args.some(arg => arg === '--mode' || arg.startsWith('--mode=')) ? args : ['--mode', mode, ...args];
for (const command of [
  ['node_modules/astro/bin/astro.mjs', 'build', ...buildArgs],
  ['scripts/check-build.mjs', output, '--mode', mode],
]) {
  const result = spawnSync(process.execPath, command, {env, stdio: 'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
}
