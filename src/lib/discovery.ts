import site from '../content/site.json';
import home from '../content/home.json';
import product from '../content/product.json';
import nsoar from '../content/nsoar.json';
import services from '../content/services.json';
import company from '../content/company.json';
import {isPreview} from './deployment';

export const securityExpires='2027-10-31T23:59:59Z';
export const discoveryFiles=['robots.txt','robot.txt','llms.txt','llms-full.txt','ai.txt','security.txt','.well-known/security.txt'];
export const pagePaths=['','omnires.html','nsoar.html','services.html','company.html','contact.html','privacy.html','legal.html'];
export const siteUrl=(siteOrigin:URL|undefined, path='')=>new URL(`${import.meta.env.BASE_URL}${path}`,siteOrigin).href;

export function discoveryContent(file:string,origin:URL|undefined):string {
  const url=(path='')=>siteUrl(origin,path);
  if(file==='robots.txt'||file==='robot.txt')return `User-agent: *\n${isPreview ? 'Disallow: /' : 'Allow: /'}\n\nSitemap: ${url('sitemap.xml')}\n`;
  if(file.endsWith('security.txt'))return `Contact: mailto:${site.email}\nExpires: ${securityExpires}\nPreferred-Languages: en\nCanonical: ${url('.well-known/security.txt')}\nPolicy: ${url('legal.html#security-reporting')}\n`;
  const intro=`# Cyentific\n\n> ${site.tagline} Cyber threat intelligence consultancy, security knowledge engineering and interoperable automation.\n\nCyentific is based in Cyprus. Contact: ${site.email}. Company registration: ${site.registration}.\n`;
  const links=`\n## Products and services\n\n- [OMNIRES](${url('omnires.html')}): ${product.description}\n- [NSOAR](${url('nsoar.html')}): ${nsoar.description}\n- [Consultancy](${url('services.html')}): ${services.description}\n\n## Company and contact\n\n- [Vision and public contributions](${url('company.html')}): ${company.description}\n- [Contact and Project Collaboration](${url('contact.html?interest=project-collaboration')}): Product presentations, CTI consultancy, EU and other funded projects.\n- [Privacy notice](${url('privacy.html')})\n- [Company and legal information](${url('legal.html')})\n- [Security contact](${url('.well-known/security.txt')})\n`;
  if(file==='llms.txt')return intro+links;
  const detail=`\n## OMNIRES and OMNIRES Fabric\n\n${product.description}\n\n${product.fabricDescription}\n\n${product.architecture.map(item=>`### ${item.title}\n\n${item.text}`).join('\n\n')}\n\n${product.faq.map(item=>`### ${item.question}\n\n${item.answer}`).join('\n\n')}\n\n## NSOAR\n\n${nsoar.description}\n\n[${nsoar.registry.name}](${nsoar.registry.href}): ${nsoar.registry.description}\n\n${nsoar.modules.map(item=>`### ${item.name}: ${item.verb}\n\n${item.text}`).join('\n\n')}\n\n### Connect the tools your team uses\n\n${nsoar.connections.description}\n\n${nsoar.connections.items.map(item=>`#### ${item.title}\n\n${item.text}`).join('\n\n')}\n\n${nsoar.faq.map(item=>`### ${item.question}\n\n${item.answer}`).join('\n\n')}\n\n## Consultancy engagements\n\n${services.offerings.map(item=>`### ${item.title}\n\n${item.approach}\n\nScope examples: ${item.deliverables.join('; ')}.`).join('\n\n')}\n\n## Working together\n\n${site.engagement.description}\n\n${site.engagement.responseTarget}\n\n${site.engagement.nextStep}\n\n${home.faq.map(item=>`### ${item.question}\n\n${item.answer}`).join('\n\n')}\n\n## Public technical references\n\n${company.contributions.map(item=>`- [${item.title}](${item.href}): ${item.text}`).join('\n')}\n\nProject publications identify the actual participants and authors. Website diagrams and workflow examples use fictional infrastructure. Engagement scope and commercial terms are agreed in writing.\n`;
  return intro+links+detail;
}

export function pageEntities(pathname:string,origin:URL|undefined) {
  const url=(path='')=>siteUrl(origin,path);
  const provider={'@id':url()+'#organization'};
  const faq=(items:{question:string;answer:string}[])=>({'@type':'FAQPage','@id':url(pathname.split('/').pop()||'')+'#faq',mainEntity:items.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))});
  if(pathname.endsWith('/omnires.html'))return [
    {'@type':'SoftwareApplication','@id':url('omnires.html')+'#product',name:'OMNIRES',url:url('omnires.html'),applicationCategory:'SecurityApplication',description:product.description,provider,featureList:product.architecture.slice(0,3).map(item=>item.title)},faq(product.faq)
  ];
  if(pathname.endsWith('/nsoar.html'))return [
    {'@type':'SoftwareApplication','@id':url('nsoar.html')+'#product',name:'NSOAR',url:url('nsoar.html'),applicationCategory:'SecurityApplication',description:nsoar.description,provider,featureList:nsoar.modules.map(item=>`${item.name}: ${item.verb}`)},faq(nsoar.faq)
  ];
  if(pathname.endsWith('/services.html'))return services.offerings.map(item=>({'@type':'Service','@id':url('services.html')+'#'+item.id,name:item.title,description:item.approach,url:url('services.html')+'#'+item.id,provider,serviceType:item.title}));
  if(pathname.endsWith('/')||pathname.endsWith('/index.html'))return [faq(home.faq)];
  return [];
}
