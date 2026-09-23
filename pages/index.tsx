import type {GetServerSideProps} from 'next';
import Link from 'next/link';
import {useState,type FocusEvent,type MouseEvent} from 'react';
import {dashboard} from '../lib/data/queries';
import {Header,Kpis,MatchTable,StandingsScope,StandingsTable,Team} from '../components/ui';

function GoalsBySeason({rows}:{rows:Array<{season:string;average:number;games:number}>}){
  const [hovered,setHovered]=useState<{row:{season:string;average:number;games:number};left:number;top:number;below:boolean}|null>(null);
  const open=(event:MouseEvent<HTMLDivElement>|FocusEvent<HTMLDivElement>,row:{season:string;average:number;games:number})=>{
    const rect=event.currentTarget.getBoundingClientRect(),halfWidth=Math.min(155,Math.max(0,(window.innerWidth-24)/2));
    setHovered({row,left:Math.max(12+halfWidth,Math.min(window.innerWidth-12-halfWidth,rect.left+rect.width/2)),top:rect.top,below:rect.top<130});
  };
  const visible=rows;
  const max=Math.max(...visible.map(row=>row.average),1);
  return <div className="season-goals-chart" role="group" aria-label="Média de gols por temporada">
    {visible.map(row=><div className="season-goals-column" key={row.season} tabIndex={0} aria-label={`${row.season}: ${row.average.toFixed(2)} gols por jogo, ${row.games} partidas`} onMouseEnter={event=>open(event,row)} onMouseLeave={()=>setHovered(null)} onFocus={event=>open(event,row)} onBlur={()=>setHovered(null)}>
      <span className="season-goals-value numeric">{row.average.toFixed(2)}</span>
      <span className="season-goals-bar" aria-hidden="true" style={{height:`${Math.max(12,(row.average/max)*70)}%`}}/>
      <span className="season-goals-label">{row.season}</span>
    </div>)}
    {hovered&&<div className={`form-popover goals-popover ${hovered.below?'form-popover-below':''}`} style={{left:hovered.left,top:hovered.below?hovered.top+30:undefined,bottom:hovered.below?undefined:`calc(100vh - ${hovered.top}px + 9px)`}} role="tooltip"><div className="form-popover-heading"><span>TEMPORADA {hovered.row.season}</span><span className="form-popover-result goals-popover-tag">MÉDIA</span></div><div className="goals-popover-average"><strong>{hovered.row.average.toFixed(2)}</strong><span>gols por jogo</span></div><div className="goals-popover-games">{hovered.row.games.toLocaleString('pt-BR')} partidas finalizadas</div></div>}
  </div>
}

export default function Home({data}:any){
  const [scope,setScope]=useState<'total'|'home'|'away'>('total');
  const titles=new Map<string,string[]>();
  const visibleStandings=scope==='home'?data.standingsHome:scope==='away'?data.standingsAway:data.standings;
  const formatCount=(value:number)=>new Intl.NumberFormat('pt-BR').format(value);
  data.champions.filter((c:any)=>c.canonical_team_id).forEach((c:any)=>titles.set(c.canonical_team_id,[...(titles.get(c.canonical_team_id)||[]),String(c.season)]));
  return <>
    <Header title="Brasileirão Série A" desc="Resultados, classificação e números da base histórica."/>
    <Kpis items={[{label:'Temporadas',value:data.seasons},{label:'Partidas cadastradas',value:formatCount(data.total)},{label:'Gols marcados',value:formatCount(data.goals)},{label:'Média histórica · gols/jogo',value:data.average||'—'}]}/>
    <section className="section"><h2>Temporada atual</h2><p className="caption">Brasileirão {data.season}</p><div style={{marginTop:20}}><div className="match-section-heading"><h3>Últimos resultados</h3>{data.recentRound&&<Link className="btn" href={`/temporadas/${data.season}?tab=rodadas&round=${data.recentRound}`}>Ver a rodada inteira</Link>}</div><MatchTable matches={data.recent}/></div><div style={{marginTop:28}}><div className="match-section-heading"><h3>Próximos jogos</h3>{data.upcomingRound&&<Link className="btn" href={`/temporadas/${data.season}?tab=rodadas&round=${data.upcomingRound}`}>Ver a rodada inteira</Link>}</div><MatchTable matches={data.upcoming} empty="Não há próximos jogos publicados."/></div></section>
    <section className="section">
      <div className="home-standings-heading"><div><h2>Classificação {data.season}</h2><p className="caption">Tabela completa, calculada com os resultados finalizados disponíveis.</p></div><div className="home-standings-controls"><StandingsScope value={scope} onChange={setScope}/><Link className="btn" href={`/temporadas/${data.season}?tab=classificacao&scope=${scope}`}>Abrir temporada</Link></div></div>
      <StandingsTable rows={visibleStandings}/>
    </section>
    <section className="section grid2 analytics-grid">
      <div className="card chart-card"><h2>Média de gols por temporada</h2><p className="caption">Gols por jogo em todas as temporadas disponíveis.</p><GoalsBySeason rows={data.goalsBySeason}/></div>
          <div className="card champions-card"><h2>Ranking de campeões</h2><p className="caption">Campeões brasileiros na era dos pontos corridos (desde 2003).</p><div className="champions-ranking">{[...titles.entries()].sort((a,b)=>b[1].length-a[1].length).slice(0,8).map(([id,years])=>{const c=data.champions.find((x:any)=>x.canonical_team_id===id);return <div className="champion-row" key={id}><Team id={id} name={c.canonical_team_name} color={c.color}/><div className="champion-title-years"><b className="numeric">{years.length}</b><small>{years.slice().sort((a,b)=>Number(a)-Number(b)).join(', ')}</small></div></div>})}</div></div>
    </section>
  </>
}
export const getServerSideProps:GetServerSideProps=async()=>({props:{data:dashboard()}});
