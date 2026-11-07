import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('builds enforce the origin and keep contact behaviour consistent with the privacy notice', {timeout: 60000}, () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'cyentific-build-'));
  const cli = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));
  const baseEnv = {...process.env, NODE_ENV: 'production', SITE_URL: 'https://example.test', SITE_BASE: '/', SITE_PREVIEW: 'false', PUBLIC_CONTACT_ENDPOINT: '', CONTACT_PROVIDER_NAME: '', CONTACT_PROVIDER_PRIVACY_URL: ''};
  const build = settings => spawnSync(process.execPath, [cli, 'build', '--outDir', output], {env: {...baseEnv, ...settings}, encoding: 'utf8', timeout: 20000});
  const read = name => fs.readFileSync(path.join(output, name), 'utf8');
  try {
    const missingOrigin = build({SITE_URL: ''});
    assert.notEqual(missingOrigin.status, 0);
    assert.match(missingOrigin.stdout + missingOrigin.stderr, /Set SITE_URL/);

    const missingProvider = build({PUBLIC_CONTACT_ENDPOINT: 'https://contact.example.test/enquiry'});
    assert.notEqual(missingProvider.status, 0);
    assert.match(missingProvider.stdout + missingProvider.stderr, /CONTACT_PROVIDER_NAME/);

    const direct = build({PUBLIC_CONTACT_ENDPOINT: 'https://contact.example.test/enquiry', CONTACT_PROVIDER_NAME: 'Example Enquiry Service', CONTACT_PROVIDER_PRIVACY_URL: 'https://contact.example.test/privacy'});
    assert.equal(direct.status, 0, direct.stdout + direct.stderr);
    assert.match(read('contact.html'), /Send enquiry/);
    assert.match(read('privacy.html'), /processed through Example Enquiry Service/);
    assert.match(read('privacy.html'), /https:\/\/contact.example.test\/privacy/);
    assert.doesNotMatch(read('privacy.html'), /The contact form prepares an email draft/);

    const review = build({SITE_PREVIEW: 'true'});
    assert.equal(review.status, 0, review.stdout + review.stderr);
    assert.match(read('contact.html'), /Continue by email/);
    assert.match(read('privacy.html'), /The contact form prepares an email draft/);
    assert.match(read('index.html'), /name="robots" content="noindex, follow"/);
    assert.match(read('robots.txt'), /Disallow: \//);
  } finally { fs.rmSync(output, {recursive: true, force: true}); }
});

test('a custom build mode uses one environment for routes, metadata, privacy and validation', {timeout: 45000}, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cyentific-mode-'));
  const project = fileURLToPath(new URL('../', import.meta.url));
  try {
    for (const entry of ['src', 'public', 'scripts', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
      fs.cpSync(path.join(project, entry), path.join(root, entry), {recursive: true});
    }
    fs.symlinkSync(path.join(project, 'node_modules'), path.join(root, 'node_modules'), 'dir');
    fs.writeFileSync(path.join(root, '.env.production'), 'SITE_URL=https://production.example.invalid\nSITE_BASE=/\nSITE_PREVIEW=false\n');
    fs.writeFileSync(path.join(root, '.env.staging'), 'SITE_URL=https://staging.example.invalid\nSITE_BASE=/staging/\nSITE_PREVIEW=true\nPUBLIC_CONTACT_ENDPOINT=https://contact.example.invalid/enquiry\nCONTACT_PROVIDER_NAME=Staging Enquiries\nCONTACT_PROVIDER_PRIVACY_URL=https://contact.example.invalid/privacy\n');
    const env = {...process.env, NODE_ENV: 'production'};
    for (const key of ['SITE_URL', 'SITE_BASE', 'SITE_PREVIEW', 'SITE_BUILD_MODE', 'PUBLIC_CONTACT_ENDPOINT', 'CONTACT_PROVIDER_NAME', 'CONTACT_PROVIDER_PRIVACY_URL']) delete env[key];
    const result = spawnSync(process.execPath, ['scripts/build.mjs', '--mode', 'staging'], {cwd: root, env, encoding: 'utf8', timeout: 40000});
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const read = name => fs.readFileSync(path.join(root, 'dist', name), 'utf8');
    assert.match(read('index.html'), /rel="canonical" href="https:\/\/staging.example.invalid\/staging\/"/);
    assert.match(read('index.html'), /href="\/staging\/_astro\//);
    assert.match(read('index.html'), /name="robots" content="noindex, follow"/);
    assert.match(read('robots.txt'), /Disallow: \//);
    assert.match(read('contact.html'), /data-endpoint="https:\/\/contact.example.invalid\/enquiry"/);
    assert.match(read('privacy.html'), /processed through Staging Enquiries/);
    assert.doesNotMatch(read('sitemap.xml'), /production.example.invalid/);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
