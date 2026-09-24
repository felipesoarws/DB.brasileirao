import type {GetServerSideProps} from 'next';
import {SITE_URL} from '../lib/site';

export default function Robots(){return null}

export const getServerSideProps:GetServerSideProps=async({res})=>{
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(`User-agent: *\nAllow: /\nDisallow: /api/\nAllow: /api/team-logo/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  res.end();
  return {props:{}};
};
