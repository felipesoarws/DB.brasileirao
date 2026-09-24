import type {GetServerSideProps} from 'next';
import {useMemo,useState} from 'react';
import {gold,latestSeason,type Row} from '../../lib/data/gold';
import {standings} from '../../lib/data/queries';
import {Header,Team} from '../../components/ui';

type ClubItem={id:string;name:string;color:string|null;active:boolean;position:number|null;points:number|null;seasons:number;bestPosition:number|null};

function ClubCard({club,season}:{club:ClubItem;season:string}){
  return <article className={`club-directory-card card${club.active?' is-active':''}`}>
    <div className="club-directory-card-top"><Team id={club.id} name={club.name} color={club.color}/>{club.active?<span className="club-directory-position">{club.position?`${club.position}º`:''}</span>:<span className="club-directory-history-label">Histórico</span>}</div>
    <div className="club-directory-card-meta">{club.active?<><strong>{club.points??'—'} <small>PTS</small></strong><span>Brasileirão {season}</span></>:<><strong>{club.seasons} <small>{club.seasons===1?'temporada':'temporadas'}</small></strong><span>{club.bestPosition?`Melhor posição: ${club.bestPosition}º`:'Participação histórica'}</span></>}</div>
  </article>;
}

export default function ClubsPage({activeClubs,formerClubs,season}:{activeClubs:ClubItem[];formerClubs:ClubItem[];season:string}){
  const [query,setQuery]=useState('');
  const normalizedQuery=query.trim().toLocaleLowerCase('pt-BR');
  const matches=(club:ClubItem)=>!normalizedQuery||`${club.name} ${club.id}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery);
  const current=useMemo(()=>activeClubs.filter(matches),[activeClubs,normalizedQuery]);
  const historic=useMemo(()=>formerClubs.filter(matches),[formerClubs,normalizedQuery]);
  const totalVisible=current.length+historic.length;
  return <>
    <Header title="Clubes" desc="Consulte campanhas, títulos, partidas e estatísticas dos clubes que disputam ou já disputaram o Brasileirão Série A." meta={`${activeClubs.length} na edição ${season} · ${activeClubs.length+formerClubs.length} no acervo`}/>
    <div className="club-directory-tools">
      <label className="club-directory-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar clube" placeholder="Buscar clube pelo nome…" value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Limpar busca">×</button>}</label>
      <span className="club-directory-result-count" aria-live="polite">{totalVisible} {totalVisible===1?'clube encontrado':'clubes encontrados'}</span>
    </div>
    <div className="club-directory-results" key={normalizedQuery}>
    {current.length>0&&<section className="club-directory-section" aria-labelledby="club-current-title">
      <div className="club-directory-section-heading"><div><h2 id="club-current-title">Série A {season}</h2><p>Clubes participantes da edição atual</p></div><span>{current.length} clubes</span></div>
      <div className="club-directory-grid">{current.map(club=><ClubCard key={club.id} club={club} season={season}/>)}</div>
    </section>}
    {historic.length>0&&<section className="club-directory-section" aria-labelledby="club-history-title">
      <div className="club-directory-section-heading"><div><h2 id="club-history-title">Outros clubes do acervo</h2><p>Clubes com participações em temporadas anteriores</p></div><span>{historic.length} clubes</span></div>
      <div className="club-directory-grid">{historic.map(club=><ClubCard key={club.id} club={club} season={season}/>)}</div>
    </section>}
    {totalVisible===0&&<div className="club-directory-empty">Nenhum clube encontrado para “{query}”. Tente outra busca.</div>}
    </div>
  </>;
}

export const getServerSideProps:GetServerSideProps=async()=>{
  const season=String(latestSeason()||'');
  const teams=gold('teams');
  const currentTable:Row[]=season?standings(season):[];
  const appearances=new Map<string,{seasons:Set<string>;bestPosition:number|null}>();
  for(const row of gold('season_standings')){
    const id=String(row.canonical_team_id||row.team_id||'');
    if(!id)continue;
    const item=appearances.get(id)||{seasons:new Set<string>(),bestPosition:null};
    item.seasons.add(String(row.season));
    const position=Number(row.position);
    if(Number.isFinite(position)&&position>0)item.bestPosition=item.bestPosition===null?position:Math.min(item.bestPosition,position);
    appearances.set(id,item);
  }
  const activeClubs:ClubItem[]=currentTable.map(row=>{
    const id=String(row.canonical_team_id||row.team_id),team=teams.find(item=>String(item.canonical_team_id)===id);
    return {id,name:String(row.team_name||team?.canonical_team_name||team?.name||id),color:team?.color==null?null:String(team.color),active:true,position:Number(row.position)||null,points:Number(row.points)||0,seasons:appearances.get(id)?.seasons.size||0,bestPosition:appearances.get(id)?.bestPosition||null};
  }).sort((a,b)=>(a.position||99)-(b.position||99));
  const activeIds=new Set(activeClubs.map(club=>club.id));
  const formerClubs:ClubItem[]=teams.filter(team=>!activeIds.has(String(team.canonical_team_id))).map(team=>{
    const id=String(team.canonical_team_id),history=appearances.get(id);
    return {id,name:String(team.canonical_team_name||team.name||id),color:team.color==null?null:String(team.color),active:false,position:null,points:null,seasons:history?.seasons.size||0,bestPosition:history?.bestPosition||null};
  }).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  return {props:{activeClubs,formerClubs,season}};
};
