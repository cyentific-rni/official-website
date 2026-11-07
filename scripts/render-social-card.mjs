import fs from 'node:fs';
import {chromium} from '@playwright/test';

// Render a code-native sharing card using the existing brand and local font.
const logo = fs.readFileSync(new URL('../public/assets/logo-black.png', import.meta.url)).toString('base64');
const font = fs.readFileSync(new URL('../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', import.meta.url)).toString('base64');
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? {channel: process.env.PLAYWRIGHT_CHANNEL} : {});
try {
  const page = await browser.newPage({viewport: {width: 1200, height: 630}, deviceScaleFactor: 1});
  await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>
    @font-face{font-family:Manrope;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:200 800}
    *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;padding:65px 76px;background:#f5f7fa;color:#172338;font-family:Manrope,sans-serif;position:relative;overflow:hidden}
    header{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1}img{width:274px;height:96px;object-fit:contain}header span{font-size:20px;color:#56657b}
    h1{font-size:59px;font-weight:550;line-height:1.13;letter-spacing:-3px;margin:63px 0 23px;position:relative;z-index:1}h1 span{color:#4b57ac}
    p{font-size:22px;line-height:1.6;color:#56657b;max-width:720px;margin:0;position:relative;z-index:1}
    footer{position:absolute;left:76px;right:76px;bottom:55px;border-top:1px solid #d9e0ea;padding-top:24px;font-size:15px;letter-spacing:1.4px;color:#56657b}
    .network{position:absolute;width:390px;height:390px;right:-100px;top:182px;opacity:.18}
  </style><header><img alt="Cyentific" src="data:image/png;base64,${logo}"><span>cyentific.eu</span></header>
  <svg class="network" viewBox="0 0 400 400" fill="none" stroke="#6e7dc2" stroke-width="2"><circle cx="200" cy="200" r="170"/><circle cx="200" cy="200" r="105"/><path d="M70 95L200 200L320 80M200 200L350 280M200 200L90 340"/><g fill="#f5f7fa"><circle cx="70" cy="95" r="14"/><circle cx="200" cy="200" r="20"/><circle cx="320" cy="80" r="14"/><circle cx="350" cy="280" r="14"/><circle cx="90" cy="340" r="14"/></g></svg>
  <h1>Connected intelligence.<br><span>Informed action.</span></h1><p>Cyber threat intelligence, knowledge engineering<br>and interoperable security automation.</p>
  <footer>THREAT INTELLIGENCE &nbsp; / &nbsp; KNOWLEDGE ENGINEERING &nbsp; / &nbsp; SECURITY AUTOMATION</footer></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluate(image => image.decode());
  await page.screenshot({path: new URL('../public/assets/social-card.png', import.meta.url).pathname});
} finally { await browser.close(); }
