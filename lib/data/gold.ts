import fs from 'fs';
import path from 'path';
import { gunzipSync } from 'zlib';

export type Row = Record<string, any>;
const root = path.resolve(process.cwd(), process.env.DATA_ROOT || 'data');
const goldRoot = path.resolve(root, 'gold-json');
const globalForGold = globalThis as typeof globalThis & {__brdbGoldCache?:Map<string,Row[]>;__brdbGoldVersion?:number};
const cache = globalForGold.__brdbGoldCache ?? (globalForGold.__brdbGoldCache=new Map<string,Row[]>());

/** Server-only Gold repository backed by JSON generated from Gold Parquet during build. */
export function gold(name: string): Row[] {
  const metadataPath=path.join(goldRoot,'_metadata.json');
  const version=fs.existsSync(metadataPath)?fs.statSync(metadataPath).mtimeMs:-1;
  if(globalForGold.__brdbGoldVersion!==version){cache.clear();globalForGold.__brdbGoldVersion=version;}
  if(cache.has(name))return cache.get(name)!;
  const base = path.resolve(goldRoot, name);
  if (!base.startsWith(`${goldRoot}${path.sep}`)) return [];
  const source=`${base}.json.gz`;
  if(!fs.existsSync(source))return [];
  try {
    const rows:Row[]=JSON.parse(gunzipSync(fs.readFileSync(source)).toString('utf8'));
    if(!Array.isArray(rows))throw new Error(`Gold JSON table is not an array: ${source}`);
    const data = rows.map(row => ({
      ...row,
      ...(row.canonical_team_id == null && row.team_id != null ? { canonical_team_id: String(row.team_id) } : {}),
      ...(row.canonical_match_id == null && row.match_id != null ? { canonical_match_id: String(row.match_id) } : {}),
      ...(name === 'teams' ? {
        canonical_team_id: String(row.canonical_team_id ?? row.team_id ?? row.canonical_id ?? ''),
        canonical_team_name: row.canonical_team_name ?? row.name ?? '',
        logo: row.logo ?? row.logo_url ?? null,
      } : {}),
    }));
    cache.set(name, data); return data;
  } catch (error) {
    if(process.env.NODE_ENV==='production')throw new Error(`Unable to read Gold table "${name}" from generated JSON`,{cause:error});
    return [];
  }
}
export const text = (v: unknown) => v == null || v === '' ? null : String(v);
export const num = (v: unknown) => v == null || v === '' ? null : Number(v);
export const by = (rows: Row[], key: string, value: string) => rows.filter(r => String(r[key]) === value);
export function teamsMap() { return new Map(gold('teams').filter(t => t.canonical_team_id).map(t => [String(t.canonical_team_id), t])); }
export function updatedAt() { const rows=gold('matches'); const dates=rows.map(r=>text(r.canonical_updated_at)).filter(Boolean).sort(); return dates.at(-1) || null; }
export function seasons() { return [...new Set(gold('matches').map(r=>text(r.season)).filter(Boolean))].sort().reverse() as string[]; }
export function latestSeason() { return seasons()[0] || null; }
export function formatDate(m: Row) { const d=text(m.kickoff_utc)||text(m.kickoff_date); if (!d) return 'TBD'; const x=new Date(d); if(Number.isNaN(x.getTime())) return 'TBD'; const date=x.toLocaleDateString('pt-BR'); return m.kickoff_precision==='date' ? `${date} · TBD` : `${date} · ${x.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`; }
export function isFinished(m: Row) { return ['finished','final','ft','status_final'].includes(String(m.status).toLowerCase()); }
