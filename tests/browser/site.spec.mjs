import {test, expect} from '@playwright/test';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const paths = ['', 'omnires.html', 'nsoar.html', 'services.html', 'company.html', 'contact.html', 'privacy.html', 'legal.html', '404.html'];

async function checkAccessibility(page) {
  await page.addScriptTag({path: axePath});
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']}});
    return result.violations.map(issue => ({id: issue.id, nodes: issue.nodes.map(node => ({target: node.target, reason: node.failureSummary}))}));
  });
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

for (const width of [1440, 768, 390, 320]) {
  for (const path of paths) {
    test(`${path || 'home'} renders at ${width}px`, async ({page}) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({width, height: 1000});
      await page.goto(path || './');
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(errors).toEqual([]);
      if (width === 1440 || width === 390) await checkAccessibility(page);
    });
  }
}

test('mobile navigation and workflow remain keyboard operable', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('./');
  await page.getByRole('button', {name: 'Open navigation'}).click();
  await expect(page.getByRole('navigation', {name: 'Main navigation'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', {name: 'Open navigation'})).toBeFocused();
  await page.getByRole('tab').first().focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab').last()).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#view-act')).toBeVisible();
  for (const tab of await page.getByRole('tab').all()) {
    await tab.click();
    await checkAccessibility(page);
  }
});

test('a direct workflow link opens its panel', async ({page}) => {
  await page.goto('omnires.html#view-act');
  await expect(page.locator('#view-act')).toBeVisible();
  await expect(page.locator('#step-act')).toHaveAttribute('aria-selected', 'true');
});

test('email draft mode prepares an enquiry without transmitting it', async ({page}) => {
  const requests = [];
  page.on('request', request => { if (request.method() === 'POST') requests.push(request.url()); });
  await page.goto('contact.html?interest=nsoar');
  // Exercise draft mode even when the build has an optional endpoint configured.
  await page.locator('[data-enquiry-form]').evaluate(form => form.dataset.endpoint = '');
  await expect(page.locator('#interest')).toHaveValue('nsoar');
  await page.getByLabel('Work email').fill('review@example.com');
  await page.getByLabel('What would you like to explore?').fill('Local regression test.');
  await page.locator('[type=submit]').click();
  await expect(page.locator('[data-email-result]')).toBeVisible();
  await expect(page.locator('[data-form-feedback]')).toHaveText('Draft prepared. It has not been sent.');
  await expect(page.locator('[data-open-email]')).toHaveAttribute('href', /mailto:.*review%40example.com/);
  expect(requests).toEqual([]);
  expect(new URL(page.url()).searchParams.has('email')).toBe(false);
});

test('direct submissions preserve input after failure and reset after acceptance', async ({page}) => {
  await page.goto('contact.html');
  await page.locator('[data-enquiry-form]').evaluate(form => form.dataset.endpoint = 'https://contact.example.invalid/enquiry');
  const payloads = [];
  await page.route('https://contact.example.invalid/enquiry', async route => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({status: payloads.length === 1 ? 500 : 200, body: '{}'});
  });
  await page.getByLabel('Work email').fill('review@example.com');
  await page.getByLabel('What would you like to explore?').fill('Local mock request.');
  await page.locator('[type=submit]').click();
  await expect(page.locator('[data-form-feedback]')).toContainText('could not confirm delivery');
  await expect(page.getByLabel('Work email')).toHaveValue('review@example.com');
  await page.locator('[type=submit]').click();
  await expect(page.locator('[data-form-feedback]')).toContainText('has been sent');
  await expect(page.getByLabel('Work email')).toHaveValue('');
  expect(payloads).toHaveLength(2);
  expect(payloads[0]).toMatchObject({email: 'review@example.com', message: 'Local mock request.'});
});

test('an in-flight enquiry cannot be edited or submitted twice', async ({page}) => {
  await page.goto('contact.html?interest=nsoar');
  await page.locator('[data-enquiry-form]').evaluate(form => form.dataset.endpoint = 'https://contact.example.invalid/pending');
  let accept;
  const response = new Promise(resolve => { accept = resolve; });
  let requests = 0;
  await page.route('https://contact.example.invalid/pending', async route => {
    requests++;
    await response;
    await route.fulfill({status: 200, body: '{}'});
  });
  await page.getByLabel('Work email').fill('review@example.com');
  await page.getByLabel('What would you like to explore?').fill('Keep this enquiry stable while sending.');
  await page.locator('[type=submit]').click();
  try {
    await expect(page.locator('[data-enquiry-form]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#email')).toBeDisabled();
    await expect(page.locator('#message')).toBeDisabled();
    await expect(page.locator('#interest')).toBeDisabled();
    await expect(page.locator('[type=submit]')).toBeDisabled();
    expect(requests).toBe(1);
  } finally { accept(); }
  await expect(page.locator('[data-form-feedback]')).toContainText('has been sent');
  await expect(page.locator('#email')).toBeEnabled();
  await expect(page.locator('#email')).toHaveValue('');
});

test('product and service enquiry buttons retain their topic', async ({page}) => {
  await page.goto('nsoar.html');
  await page.locator('.navigation-cta').click();
  await expect(page.locator('#interest')).toHaveValue('nsoar');
  await page.goto('services.html');
  await page.locator('.closing .button').click();
  await expect(page.locator('#interest')).toHaveValue('cti');
  await page.goto('omnires.html');
  await page.locator('.navigation-cta').click();
  await expect(page.locator('#interest')).toHaveValue('presentation');
});

test.describe('without JavaScript', () => {
  test.use({javaScriptEnabled: false, viewport: {width: 390, height: 844}});
  test('navigation and every workflow panel are available', async ({page}) => {
    await page.goto('./');
    await expect(page.getByRole('navigation', {name: 'Main navigation'})).toBeVisible();
    await expect(page.locator('[data-menu-toggle]')).toBeHidden();
    await expect(page.locator('.workflow-panel:visible')).toHaveCount(4);
    await page.locator('[data-workflow-tab]').last().click();
    expect(new URL(page.url()).hash).toBe('#view-act');
    await expect(page.locator('#view-act')).toBeVisible();
  });
  test('enquiries fall back to email without collecting or submitting form values', async ({page}) => {
    await page.goto('contact.html');
    await expect(page.locator('[data-enquiry-fallback]')).toBeVisible();
    await expect(page.locator('[data-enquiry-fallback] a[href^="mailto:"]')).toBeVisible();
    await expect(page.locator('[data-enquiry-form]')).toBeHidden();
    await expect(page.locator('#email')).toBeDisabled();
    await expect(page.locator('#message')).toBeDisabled();
    await expect(page.locator('[data-enquiry-form] [type=submit]')).toBeDisabled();
    await expect(page.locator('[data-enquiry-form]')).toHaveAttribute('method', 'post');
    expect(new URL(page.url()).search).toBe('');
  });
});
