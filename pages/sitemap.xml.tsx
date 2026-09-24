import type {GetServerSideProps} from 'next';
import {gold,seasons} from '../lib/data/gold';
import {SITE_URL} from '../lib/site';

type SitemapEntry={path:string;lastmod?:string;priority:number;frequency:'daily'|'weekly'|'monthly'};
const xmlEscape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const lastModified=(value:unknown)=>{
  if(value==null||value==='')return undefined;
  const date=new Date(String(value));
  return Number.isNaN(date.getTime())?undefined:date.toISOString();
};

export default function Sitemap(){return null}

export const getServerSideProps:GetServerSideProps=async({res})=>{
  const entries=new Map<string,SitemapEntry>();
  const add=(path:string,priority:number,frequency:SitemapEntry['frequency'],lastmod?:string)=>entries.set(path,{path,priority,frequency,lastmod});
  for(const path of ['/','/temporadas','/clubes','/partidas','/confrontos','/linha-do-tempo','/recordes','/sobre','/fontes','/privacidade','/termos','/cookies'])add(path,path==='/'?1:.8,'weekly');

  const matches=gold('matches');
  const seasonUpdates=new Map<string,string>();
  const teamUpdates=new Map<string,string>();
  for(const match of matches){
    const season=String(match.season||''),matchId=String(match.canonical_match_id||'');
    const updated=lastModified(match.canonical_updated_at);
    if(season&&updated&&(!seasonUpdates.has(season)||updated>seasonUpdates.get(season)!))seasonUpdates.set(season,updated);
    if(matchId)add(`/partidas/${encodeURIComponent(matchId)}`,.55,'monthly',updated);
    for(const id of [match.canonical_home_team_id,match.canonical_away_team_id]){
      if(id==null)continue;
      const key=String(id);
      if(updated&&(!teamUpdates.has(key)||updated>teamUpdates.get(key)!))teamUpdates.set(key,updated);
    }
  }
  for(const season of seasons())add(`/temporadas/${encodeURIComponent(season)}`,.7,'weekly',seasonUpdates.get(season));
  for(const team of gold('teams')){
    const id=String(team.canonical_team_id||'');
    if(id)add(`/clubes/${encodeURIComponent(id)}`,.65,'weekly',teamUpdates.get(id));
  }

  const urls=[...entries.values()].map(entry=>`  <url><loc>${xmlEscape(new URL(entry.path,SITE_URL).toString())}</loc>${entry.lastmod?`<lastmod>${entry.lastmod}</lastmod>`:''}<changefreq>${entry.frequency}</changefreq><priority>${entry.priority.toFixed(2)}</priority></url>`).join('\n');
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();
  return {props:{}};
};
