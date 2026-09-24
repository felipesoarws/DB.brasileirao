import type {GetServerSideProps} from 'next';
import Link from 'next/link';
import {gold,isFinished,latestSeason,seasons,type Row} from '../../lib/data/gold';
import {Header,Kpis,MatchTable} from '../../components/ui';
import StyledSelect from '../../components/StyledSelect';

type MatchFilters={season:string;status:string;round:string;team:string};
type MatchPageProps={rows:Row[];seasons:string[];rounds:string[];filters:MatchFilters;page:number;pageCount:number;total:number;seasonStats:{matches:number;finished:number;goals:number}};
const pageSize=25;
const queryString=(filters:MatchFilters,page:number)=>{
  const params=new URLSearchParams({season:filters.season,status:filters.status,round:filters.round,team:filters.team,page:String(page)});
  return `/partidas?${params.toString()}`;
};

export default function MatchesPage({rows,seasons:availableSeasons,rounds,filters,page,pageCount,total,seasonStats}:MatchPageProps){
  return <>
    <Header title="Partidas" desc="Agenda e resultados do Brasileirão, temporada por temporada." meta={`${total.toLocaleString('pt-BR')} partidas encontradas`}/>
    <Kpis items={[
      {label:'Temporada',value:filters.season},
      {label:'Partidas na temporada',value:seasonStats.matches.toLocaleString('pt-BR')},
      {label:'Finalizadas',value:seasonStats.finished.toLocaleString('pt-BR')},
      {label:'Gols marcados',value:seasonStats.goals.toLocaleString('pt-BR')},
    ]}/>
    <form className="match-filters card" method="get" action="/partidas">
      <StyledSelect name="season" label="Temporada" value={filters.season} options={availableSeasons.map(season=>({value:season,label:season}))}/>
      <StyledSelect name="status" label="Situação" value={filters.status} options={[{value:'all',label:'Todas'},{value:'finished',label:'Finalizadas'},{value:'upcoming',label:'Agendadas'},{value:'postponed',label:'Adiada'}]}/>
      <StyledSelect name="round" label="Rodada" value={filters.round} options={[{value:'all',label:'Todas'},...rounds.map(round=>({value:round,label:`Rodada ${round}`}))]}/>
      <label className="match-filter-team"><span>Clube</span><input type="search" name="team" placeholder="Buscar mandante ou visitante" defaultValue={filters.team}/></label>
      <button className="btn primary" type="submit">Filtrar partidas</button>
      <Link className="match-filter-reset" href="/partidas">Limpar filtros</Link>
    </form>
    <div className="match-results-heading"><h2>Partidas {filters.season}</h2><span>{total?`${Math.min((page-1)*pageSize+1,total)}–${Math.min(page*pageSize,total)} de ${total}`:'Nenhuma partida'}</span></div>
    {rows.length?<MatchTable matches={rows}/>:<div className="empty">Nenhuma partida corresponde aos filtros selecionados.</div>}
    {pageCount>1&&<nav className="match-pagination" aria-label="Paginação das partidas">
      {page>1?<Link href={queryString(filters,page-1)} rel="prev">← Anterior</Link>:<span className="is-disabled">← Anterior</span>}
      <span>Página <strong>{page}</strong> de {pageCount}</span>
      {page<pageCount?<Link href={queryString(filters,page+1)} rel="next">Próxima →</Link>:<span className="is-disabled">Próxima →</span>}
    </nav>}
  </>;
}

export const getServerSideProps:GetServerSideProps<MatchPageProps>=async({query})=>{
  const availableSeasons=seasons();
  const requestedSeason=Array.isArray(query.season)?query.season[0]:query.season;
  const season=availableSeasons.includes(String(requestedSeason||''))?String(requestedSeason):String(latestSeason()||availableSeasons[0]||'');
  const requestedStatus=Array.isArray(query.status)?query.status[0]:query.status;
  const status=['all','finished','upcoming','postponed'].includes(String(requestedStatus))?String(requestedStatus):'all';
  const requestedRound=Array.isArray(query.round)?query.round[0]:query.round;
  const round=String(requestedRound||'all');
  const requestedTeam=Array.isArray(query.team)?query.team[0]:query.team;
  const team=String(requestedTeam||'').trim().slice(0,80);
  const requestedPage=Array.isArray(query.page)?query.page[0]:query.page;
  const parsedPage=Number(requestedPage);
  const page=Number.isFinite(parsedPage)&&parsedPage>0?Math.floor(parsedPage):1;
  const teamMap=new Map(gold('teams').map(item=>[String(item.canonical_team_id),item]));
  const seasonMatches:Row[]=gold('matches').filter(match=>String(match.season)===season);
  const rounds=[...new Set(seasonMatches.map(match=>match.round).filter(value=>value!=null).map(String))].sort((a,b)=>Number(a)-Number(b));
  const finishedMatches=seasonMatches.filter(match=>isFinished(match)&&match.home_score!=null&&match.away_score!=null);
  const seasonGoals=finishedMatches.reduce((sum,match)=>sum+(Number(match.home_score)||0)+(Number(match.away_score)||0),0);
  const normalizedTeam=team.toLocaleLowerCase('pt-BR');
  const matchTime=(match:Row)=>{
    const raw=match.kickoff_utc||match.kickoff_date;
    if(!raw)return null;
    const value=Date.parse(String(raw));
    return Number.isFinite(value)?value:null;
  };
  const todayParts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const todayPart=(type:string)=>todayParts.find(part=>part.type===type)?.value||'';
  const todayInBrazil=`${todayPart('year')}-${todayPart('month')}-${todayPart('day')}`;
  const todayStart=Date.parse(`${todayInBrazil}T00:00:00-03:00`);
  const filtered=seasonMatches.filter(match=>{
    const done=isFinished(match),postponed=String(match.status).toLowerCase().includes('postponed');
    if(status==='finished'&&!done)return false;
    if(status==='upcoming'){
      if(done||postponed)return false;
      const time=matchTime(match);
      const dateOnly=match.kickoff_precision==='date'&&match.kickoff_date?String(match.kickoff_date).slice(0,10):null;
      if(dateOnly?dateOnly<todayInBrazil:time===null||time<todayStart)return false;
    }
    if(status==='postponed'&&!postponed)return false;
    if(round!=='all'&&String(match.round)!==round)return false;
    if(normalizedTeam){
      const home=teamMap.get(String(match.canonical_home_team_id)),away=teamMap.get(String(match.canonical_away_team_id));
      const homeName=String(home?.canonical_team_name||home?.name||match.canonical_home_team_name||'').toLocaleLowerCase('pt-BR');
      const awayName=String(away?.canonical_team_name||away?.name||match.canonical_away_team_name||'').toLocaleLowerCase('pt-BR');
      if(!homeName.includes(normalizedTeam)&&!awayName.includes(normalizedTeam))return false;
    }
    return true;
  }).sort((a,b)=>{
    const aTime=matchTime(a),bTime=matchTime(b);
    const aRound=Number(a.round)||0,bRound=Number(b.round)||0;
    if(status==='all'||status==='postponed'){
      if(aRound!==bRound)return aRound-bRound;
      if(aTime===null&&bTime!==null)return 1;
      if(aTime!==null&&bTime===null)return -1;
      return aTime!==null&&bTime!==null?aTime-bTime:0;
    }
    if(status==='upcoming'){
      if(aTime===null&&bTime!==null)return 1;
      if(aTime!==null&&bTime===null)return -1;
      return aTime!==null&&bTime!==null?aTime-bTime:aRound-bRound;
    }
    if(aTime===null&&bTime!==null)return 1;
    if(aTime!==null&&bTime===null)return -1;
    if(aTime!==null&&bTime!==null&&aTime!==bTime)return bTime-aTime;
    return bRound-aRound;
  });
  const total=filtered.length,pageCount=Math.max(1,Math.ceil(total/pageSize)),safePage=Math.min(page,pageCount);
  const rows=filtered.slice((safePage-1)*pageSize,safePage*pageSize).map(match=>{
    const home=teamMap.get(String(match.canonical_home_team_id)),away=teamMap.get(String(match.canonical_away_team_id));
    return {...match,canonical_home_team_name:home?.canonical_team_name||home?.name||match.canonical_home_team_name||'—',canonical_away_team_name:away?.canonical_team_name||away?.name||match.canonical_away_team_name||'—',home:home?{color:home.color,logo:home.logo}:null,away:away?{color:away.color,logo:away.logo}:null};
  });
  return {props:{rows,seasons:availableSeasons,rounds,filters:{season,status,round,team},page:safePage,pageCount,total,seasonStats:{matches:seasonMatches.length,finished:finishedMatches.length,goals:seasonGoals}}};
};
