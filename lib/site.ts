export const SITE_URL=(process.env.NEXT_PUBLIC_SITE_URL||'https://brasileirao.felipesoarws.me').replace(/\/+$/,'');
export const SITE_NAME='DB.brasileirao';

export function absoluteUrl(path:string){
  const pathname=path.startsWith('/')?path:`/${path}`;
  const url=new URL(SITE_URL);
  url.pathname=pathname;
  url.search='';
  url.hash='';
  return url.toString();
}

export function jsonLd(value:unknown){
  return JSON.stringify(value).replace(/</g,'\\u003c');
}
