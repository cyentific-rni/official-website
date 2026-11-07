import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {loadProjectEnv, resolveDeployment} from '../scripts/site-config.mjs';

test('production requires a deliberately configured HTTPS origin', () => {
  assert.throws(() => resolveDeployment({}, {requireSite: true}), /Set SITE_URL/);
  assert.throws(() => resolveDeployment({SITE_URL: 'http://example.com'}, {requireSite: true}), /HTTPS/);
  for (const SITE_URL of ['https://example.com/subdir', 'https://example.com?key=x', 'https://user:secret@example.com', 'ftp://example.com']) {
    assert.throws(() => resolveDeployment({SITE_URL}, {requireSite: true}));
  }
  assert.deepEqual(resolveDeployment({SITE_URL: 'https://example.com/', SITE_BASE: '/review/'}, {requireSite: true}), {
    site: 'https://example.com', base: '/review/', preview: false,
  });
});

test('local development and explicit review builds stay available without a public domain', () => {
  assert.equal(resolveDeployment({}).site, 'http://localhost:4173');
  assert.equal(resolveDeployment({SITE_URL: 'https://preview.invalid', SITE_PREVIEW: 'true'}, {requireSite: true}).preview, true);
  assert.throws(() => resolveDeployment({SITE_URL: 'https://example.com', SITE_BASE: '//other.example/'}));
});

test('deployment files and process settings follow environment precedence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cyentific-env-'));
  try {
    fs.writeFileSync(path.join(root, '.env'), 'SITE_URL=https://base.example\nSITE_BASE=/base/\n');
    fs.writeFileSync(path.join(root, '.env.local'), 'SITE_BASE=/local/\n');
    fs.writeFileSync(path.join(root, '.env.production'), 'SITE_URL=https://production.example\n');
    const env = loadProjectEnv({root, mode: 'production', env: {SITE_BASE: '/process/'}});
    assert.equal(env.SITE_URL, 'https://production.example');
    assert.equal(env.SITE_BASE, '/process/');
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
