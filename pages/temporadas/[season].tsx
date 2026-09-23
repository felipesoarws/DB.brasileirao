import {GetServerSideProps} from 'next';
import Link from 'next/link';
import {seasonMatches,standings} from '../../lib/data/queries';
import {Header,Kpis,MatchTable,StandingsTable} from '../../components/ui';

export default function Season({season,table,matches,tab,round}:any){
  const tabs=[['overview','Visão geral'],['classificacao','Classificação'],['rodadas','Rodadas'],['partidas','Partidas'],['estatisticas','Estatísticas'],['artilharia','Artilharia']];
  const visibleMatches=tab==='rodadas'&&round?matches.filter((m:any)=>String(m.round)===String(round)):matches;
  return <>
    <Header title={`Brasileirão ${season}`} desc="Dados canônicos publicados para a temporada."/>
    <nav className="tabs">{tabs.map(([v,l])=><Link className={(tab||'overview')===v?'active':''} href={`/temporadas/${season}${v==='overview'?'':`?tab=${v}`}`} key={v}>{l}</Link>)}</nav>
    <Kpis items={[{label:'Partidas',value:matches.length},{label:'Clubes',value:table.length},{label:'Finalizadas',value:matches.filter((m:any)=>String(m.status).toLowerCase().includes('final')).length},{label:'Rodadas',value:new Set(matches.map((m:any)=>m.round).filter(Boolean)).size}]}/>
    {(tab==='classificacao'||!tab||tab==='overview')&&<section className="section"><h2>Classificação geral</h2><StandingsTable rows={table}/></section>}
    {(tab==='partidas'||tab==='rodadas'||!tab||tab==='overview')&&<section className="section"><h2>{tab==='rodadas'&&round?`Rodada ${round}`:'Partidas'}</h2><MatchTable matches={visibleMatches}/></section>}
  </>
}

export const getServerSideProps:GetServerSideProps=async({params,query})=>{
  const season=String(params?.season);
  return {props:{season,table:standings(season),matches:seasonMatches(season),tab:query.tab||null,round:query.round||null}};
};
