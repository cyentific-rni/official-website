import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {commandMode, loadProjectEnv, resolveDeployment} from './site-config.mjs';

const args=process.argv.slice(2);
const env=loadProjectEnv({mode:commandMode(args, process.env.SITE_BUILD_MODE || 'production')});
const deployment=resolveDeployment(env);
const root=path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : 'dist');
const base=deployment.base.replace(/\/$/,'');
const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
if(!fs.existsSync(root))throw new Error('Build first: npm run build');
const files=walk(root);
const htmlFiles=files.filter(file=>file.endsWith('.html'));
const ids=new Map();
const failures=[];
const canonicals=new Set();
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  const name=path.relative(root,file);
  const allIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  if(new Set(allIds).size!==allIds.length)failures.push(`${name}: duplicate element ID`);
  ids.set(file,new Set(allIds));
  if([...html.matchAll(/<h1(?:\s|>)/g)].length!==1)failures.push(`${name}: expected one H1`);
  if(!/<meta\s[^>]*name="description"/.test(html))failures.push(`${name}: missing description`);
  const canonical=html.match(/<link\s[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  if(!canonical||!canonical.startsWith(deployment.site+deployment.base))failures.push(`${name}: canonical differs from the configured origin or base`);
  else if(canonicals.has(canonical))failures.push(`${name}: duplicate canonical`);
  else canonicals.add(canonical);
  if(deployment.preview && !/<meta\s[^>]*name="robots"[^>]*content="noindex, follow"/.test(html))failures.push(`${name}: review pages must be noindex`);
  for(const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)){
    try{
      const schema=JSON.parse(match[1]);
      if(!schema['@graph']?.some(entity=>entity['@type']==='Organization'))failures.push(`${name}: missing organisation schema`);
      const faq=schema['@graph']?.find(entity=>entity['@type']==='FAQPage');
      if(faq&&faq.mainEntity.length!==[...html.matchAll(/<details(?:\s|>)/g)].length)failures.push(`${name}: FAQ schema differs from visible FAQ`);
    }catch{failures.push(`${name}: invalid structured data`);}
  }
  for(const image of html.matchAll(/<img\b[^>]*>/g)){
    if(!/\balt=/.test(image[0]))failures.push(`${name}: image missing alternative text`);
    if(!/\bwidth=/.test(image[0]) || !/\bheight=/.test(image[0]))failures.push(`${name}: image missing dimensions`);
  }
}
const discovery=['robots.txt','robot.txt','llms.txt','llms-full.txt','ai.txt','security.txt','.well-known/security.txt','sitemap.xml'];
for(const name of discovery){
  const file=path.join(root,name);
  if(!fs.existsSync(file))failures.push(`Missing discovery file: ${name}`);
  else if(name.endsWith('.txt')&&/^\s*</.test(fs.readFileSync(file,'utf8')))failures.push(`${name}: expected plain text`);
}
const read=name=>fs.existsSync(path.join(root,name))?fs.readFileSync(path.join(root,name),'utf8'):'';
if(read('robots.txt')!==read('robot.txt'))failures.push('Crawler aliases differ');
if(read('security.txt')!==read('.well-known/security.txt'))failures.push('Security contact aliases differ');
if(deployment.preview && !read('robots.txt').includes('Disallow: /'))failures.push('Review builds must disallow crawling');
if(!deployment.preview && !read('robots.txt').includes('Allow: /'))failures.push('Production crawler policy differs from the build mode');
const security=read('.well-known/security.txt');
const expiry=Date.parse(security.match(/^Expires: (.+)$/m)?.[1]||'');
if(!/^Contact: mailto:/m.test(security)||!/^Canonical: https:\/\//m.test(security)||!Number.isFinite(expiry)||expiry<=Date.now()||expiry>Date.now()+366*86400000)failures.push('Invalid or expired RFC 9116 security contact');
const sitemap=read('sitemap.xml');
for(const location of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g))if(!canonicals.has(location[1]))failures.push(`Sitemap URL has no matching canonical: ${location[1]}`);
if(!read('llms.txt').includes('/nsoar.html')||!read('ai.txt').includes('Project Collaboration'))failures.push('Offering summaries incomplete');
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const href=match[1];
    if(/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href))continue;
    const url=new URL(href,'https://build.local/'+path.relative(root,file));
    let local=decodeURIComponent(url.pathname);
    if(base && local.startsWith(base+'/'))local=local.slice(base.length);
    let target=path.join(root,local.replace(/^\//,''));
    if(fs.existsSync(target) && fs.statSync(target).isDirectory())target=path.join(target,'index.html');
    if(!fs.existsSync(target))failures.push(`${path.basename(file)}: missing target ${href}`);
    else if(url.hash && ids.has(target) && !ids.get(target).has(decodeURIComponent(url.hash.slice(1))))failures.push(`${path.basename(file)}: missing anchor ${href}`);
  }
}
const gzipTotal=extension=>files.filter(file=>file.endsWith(extension)).reduce((total,file)=>total+zlib.gzipSync(fs.readFileSync(file)).length,0);
const inlineScripts=new Set();
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
    if(!match[1].includes('application/ld+json') && match[2].trim())inlineScripts.add(match[2]);
  }
}
const js=gzipTotal('.js')+[...inlineScripts].reduce((total,script)=>total+zlib.gzipSync(script).length,0);
const css=gzipTotal('.css');
if(js>20*1024)failures.push('Client JavaScript exceeds the 20 KiB gzip budget');
if(css>22*1024)failures.push('CSS exceeds the 22 KiB gzip budget');
console.log(`Validated ${htmlFiles.length} pages: links, anchors, headings, metadata, structured data and discovery files.`);
console.log(`Client payload: ${(js/1024).toFixed(1)} KiB gzip JavaScript; ${(css/1024).toFixed(1)} KiB gzip CSS.`);
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
