import type {APIRoute} from 'astro';
import {discoveryFiles,discoveryContent} from '../lib/discovery';
export function getStaticPaths(){return discoveryFiles.map(discovery=>({params:{discovery}}));}
export const GET:APIRoute=({params,site})=>new Response(discoveryContent(params.discovery!,site),{headers:{'Content-Type':'text/plain; charset=utf-8'}});
