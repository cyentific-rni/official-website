import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const output = path.resolve(process.argv[2] || 'cyentific-website-source.zip');
const required = ['src', 'public', 'scripts', 'package.json', 'package-lock.json', 'astro.config.mjs', 'tsconfig.json', 'README.md', '.gitignore'];
const optional = ['docs', 'tests', 'playwright.config.mjs', '.vscode', '.github', '.env.example', '.nvmrc'];
const listing = spawnSync('git', ['ls-tree', '--name-only', 'HEAD'], {encoding: 'utf8'});
if (listing.status !== 0) {
  console.error('Source export requires a Git repository with a committed HEAD.');
  process.exit(1);
}
const committed = new Set(listing.stdout.trim().split('\n'));
const missing = required.filter(entry => !committed.has(entry));
if (missing.length) {
  console.error(`Commit the required source files before exporting: ${missing.join(', ')}`);
  process.exit(1);
}
const source = [...required, ...optional.filter(entry => committed.has(entry))];
const temporary = `${output}.${process.pid}.tmp`;
const result = spawnSync('git', ['archive', '--format=zip', '--prefix=cyentific-website/', `--output=${temporary}`, 'HEAD', ...source], {stdio: 'inherit'});
if (result.status !== 0) {
  fs.rmSync(temporary, {force: true});
  process.exit(result.status || 1);
}
fs.renameSync(temporary, output);
console.log(`Exported committed source at HEAD to ${output}. Uncommitted changes are excluded.`);
