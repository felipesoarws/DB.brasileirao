import {GetServerSideProps} from 'next';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/router';
import {seasonAnalytics,seasonMatches,seasonRoundLeaders,standings,venueStandings} from '../../lib/data/queries';
import {Header,Kpis,MatchTable,StandingsScope,StandingsTable,Team} from '../../components/ui';

type Match=Record<string,any>;
const isFinished=(match:Match)=>['finished','final','ft','status_final'].includes(String(match.status).toLowerCase());

function orderByRound(matches:Match[]){
  return [...matches].sort((a,b)=>{
    const roundA=Number(a.round),roundB=Number(b.round);
    if(Number.isFinite(roundA)&&Number.isFinite(roundB)&&roundA!==roundB)return roundA-roundB;
    if(Number.isFinite(roundA)!==Number.isFinite(roundB))return Number.isFinite(roundA)?-1:1;
    const dateA=Date.parse(a.kickoff_utc||a.kickoff_date||'');
    const dateB=Date.parse(b.kickoff_utc||b.kickoff_date||'');
    if(Number.isFinite(dateA)&&Number.isFinite(dateB)&&dateA!==dateB)return dateA-dateB;
    return String(a.canonical_match_id||'').localeCompare(String(b.canonical_match_id||''));
  });
}

function roundUrl(season:string,round:number,tab:string|null){
  const params=new URLSearchParams();
  if(tab)params.set('tab',tab);
  params.set('round',String(round));
  return `/temporadas/${encodeURIComponent(season)}?${params.toString()}`;
}

function RoundNavigation({season,round,rounds,tab,onRoundChange}:{season:string;round:number;rounds:number[];tab:string|null;onRoundChange:(round:number)=>void}){
  const router=useRouter();
  const index=rounds.indexOf(round),previous=rounds[index-1],next=rounds[index+1];
  const navigateToRound=(target:number)=>{
    const scrollY=window.scrollY;
    onRoundChange(target);
    void router.push(roundUrl(season,target,tab),undefined,{scroll:false,shallow:true}).then(()=>{
      window.requestAnimationFrame(()=>{
        window.scrollTo({top:scrollY,left:0,behavior:'auto'});
        window.setTimeout(()=>window.scrollTo({top:scrollY,left:0,behavior:'auto'}),0);
      });
    });
  };
  return <div className="season-round-nav" aria-label="Navegação entre rodadas">
    {previous?<button type="button" className="season-round-arrow" onClick={()=>navigateToRound(previous)} aria-label={`Voltar para a rodada ${previous}`} title={`Rodada ${previous}`}>←</button>:<span className="season-round-arrow is-disabled" aria-disabled="true">←</span>}
    <span className="season-round-current">Rodada <strong>{round}</strong><small>de {rounds.at(-1)||round}</small></span>
    {next?<button type="button" className="season-round-arrow" onClick={()=>navigateToRound(next)} aria-label={`Avançar para a rodada ${next}`} title={`Rodada ${next}`}>→</button>:<span className="season-round-arrow is-disabled" aria-disabled="true">→</span>}
  </div>;
}

function LeaderTable({title,metric,rows}:{title:string;metric:string;rows:any[]}){
  return <section className="card season-leader-card"><h2>{title}</h2>{rows.length?<div className="table-wrap season-leader-table"><table><colgroup><col/><col/><col/><col/></colgroup><thead><tr><th>#</th><th>Jogador</th><th>Clube</th><th className="right">{metric}</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.playerId}><td className="caption numeric">{index+1}</td><td>{row.name}</td><td>{row.teamId&&row.teamName?<Team id={row.teamId} name={row.teamName} color={row.teamColor}/>:<span className="caption">—</span>}</td><td className="right numeric"><strong>{row.value}</strong></td></tr>)}</tbody></table></div>:<p className="caption">Dados ainda não disponíveis para esta temporada.</p>}</section>;
}

const clubStatLabels:Record<string,string>={
  accurateCrosses:'Cruzamentos certos',accurateLongBalls:'Lançamentos longos certos',accuratePasses:'Passes certos',blockedShots:'Chutes bloqueados',corners:'Escanteios',crossPct:'Precisão nos cruzamentos',effectiveClearance:'Cortes',effectiveTackles:'Desarmes certos',fouls:'Faltas',interceptions:'Interceptações',longballPct:'Precisão nos lançamentos longos',offsides:'Impedimentos',pass_accuracy:'Precisão nos passes',passes:'Passes',penaltyKickGoals:'Gols de pênalti',penaltyKickShots:'Pênaltis cobrados',possession:'Posse de bola',red_cards:'Cartões vermelhos',saves:'Defesas do goleiro',shotPct:'Conversão de chutes',shots_off_target:'Chutes para fora',shots_on_target:'Chutes no alvo',tacklePct:'Precisão nos desarmes',totalClearance:'Cortes tentados',totalCrosses:'Cruzamentos',totalLongBalls:'Lançamentos longos',total_shots:'Finalizações',totalTackles:'Desarmes tentados',yellow_cards:'Cartões amarelos'
};
const percentageClubStats=new Set(['crossPct','longballPct','pass_accuracy','possession','shotPct','tacklePct']);
const ratioClubStats=new Set(['crossPct','longballPct','pass_accuracy','shotPct','tacklePct']);

function RoundGoalsChart({rows}:{rows:any[]}){
  if(!rows.length)return <div className="empty">Gols por rodada ainda não disponíveis.</div>;
  const maxGoals=Math.max(...rows.map(row=>Number(row.total_goals)||0),1);
  return <div className="round-goals-grid" role="list" aria-label="Gols marcados por rodada">{rows.map(row=>{
    const total=Number(row.total_goals)||0,average=Number(row.goals_per_match)||0,height=Math.max(4,total/maxGoals*100);
    const title=`Rodada ${row.round}: ${total} gols (${row.home_goals} mandante, ${row.away_goals} visitante), média ${average.toFixed(1)} por partida`;
    return <div className="round-goal-item" role="listitem" key={row.round} title={title} aria-label={title}><span className="round-goal-value numeric">{total}</span><div className="round-goal-track"><span style={{height:`${height}%`}}/></div><span className="round-goal-label">R{row.round}</span><span className="round-goal-average numeric">{average.toFixed(1)}</span></div>;
  })}</div>;
}

function ClubPerformanceTable({rows}:{rows:any[]}){
  if(!rows.length)return <div className="empty">Desempenho dos clubes ainda não disponível.</div>;
  return <div className="table-wrap club-performance-table"><table><colgroup><col/><col/><col/><col/><col/><col/><col/><col/></colgroup><thead><tr><th>#</th><th>Clube</th><th className="right">PTS/J</th><th className="right">Vitórias (%)</th><th className="right">V-E-D</th><th className="right">GP/GC</th><th className="right">Casa · PTS/J</th><th className="right">Fora · PTS/J</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.canonical_team_id}><td className="caption numeric">{index+1}</td><td><Team id={row.canonical_team_id} name={row.team_name} color={row.team?.color}/></td><td className="right numeric"><strong>{Number(row.points_per_game||0).toFixed(2)}</strong></td><td className="right numeric">{Number(row.win_percentage||0).toFixed(0)}%</td><td className="right numeric">{row.wins}–{row.draws}–{row.losses}</td><td className="right numeric">{Number(row.goals_for_per_match||0).toFixed(1)} / {Number(row.goals_against_per_match||0).toFixed(1)}</td><td className="right numeric club-home-away" title={`${row.home_points} pontos em ${row.home_played} jogos`}>{Number(row.home_played ? row.home_points / row.home_played : 0).toFixed(2)}<small> pts/j</small></td><td className="right numeric club-home-away" title={`${row.away_points} pontos em ${row.away_played} jogos`}>{Number(row.away_played ? row.away_points / row.away_played : 0).toFixed(2)}<small> pts/j</small></td></tr>)}</tbody></table></div>;
}

function ClubMatchStatistics({rows}:{rows:any[]}){
  const availableMetrics=[...new Set(rows.map(row=>String(row.statistic)))].sort((a,b)=>(clubStatLabels[a]||a).localeCompare(clubStatLabels[b]||b,'pt-BR'));
  const [metric,setMetric]=useState(availableMetrics.includes('possession')?'possession':availableMetrics[0]||'');
  const selectedMetric=availableMetrics.includes(metric)?metric:availableMetrics[0]||'';
  const metricRows=rows.filter(row=>row.statistic===selectedMetric).sort((a,b)=>Number(b.average)-Number(a.average));
  const maxAverage=Math.max(...metricRows.map(row=>Number(row.average)||0),1);
  const percentage=percentageClubStats.has(selectedMetric),ratio=ratioClubStats.has(selectedMetric);
  const format=(value:number)=>`${(Number(value||0)*(ratio?100:1)).toFixed(percentage?1:1)}${percentage?'%':''}`;
  if(!rows.length)return <div className="empty">Dados de jogo por clube ainda não disponíveis.</div>;
  return <div className="club-match-statistics card"><div className="club-statistics-toolbar"><div><h3>Comparativo entre clubes</h3><p className="caption">Média por partida. A amostra pode variar por time e indicador.</p></div><label>Indicador<select value={selectedMetric} onChange={event=>setMetric(event.target.value)}>{availableMetrics.map(key=><option value={key} key={key}>{clubStatLabels[key]||key}</option>)}</select></label></div><div className="table-wrap club-match-stat-table"><table><colgroup><col/><col/><col/><col/><col/><col/></colgroup><thead><tr><th>#</th><th>Clube</th><th>Média / jogo</th><th>Mediana</th><th>Faixa</th><th className="right">Amostra</th></tr></thead><tbody>{metricRows.map((row,index)=><tr key={row.canonical_team_id}><td className="caption numeric">{index+1}</td><td><Team id={row.canonical_team_id} name={row.team_name} color={row.team?.color}/></td><td><div className="club-stat-average"><strong className="numeric">{format(row.average)}</strong><span className="club-stat-track"><i style={{width:`${Math.max(2,Number(row.average)/maxAverage*100)}%`}}/></span></div></td><td className="numeric">{format(row.median)}</td><td className="numeric">{format(row.minimum)}–{format(row.maximum)}</td><td className="right numeric">{row.matches} <span className="caption">jogos</span></td></tr>)}</tbody></table></div></div>;
}

function RoundLeaders({season,rows,preview=false}:{season:string;rows:any[];preview?:boolean}){
  const visible=preview?rows.slice(0,5):rows;
  return <section className="section round-leaders-panel card"><div className="statistics-section-heading"><span className="statistics-section-icon">♛</span><div><h2>Líderes por rodada</h2><p className="caption">Clubes que terminaram cada rodada na liderança da classificação.</p></div>{preview&&<Link className="round-leaders-all" href={`/temporadas/${season}?tab=lideres`}>Ver todas as rodadas →</Link>}</div>
    {visible.length?<div className="table-wrap round-leaders-table"><table><thead><tr><th>Rodada</th><th>Clube líder</th><th className="right">PTS</th><th>Campanha (V–E–D)</th><th className="right">SG</th></tr></thead><tbody>{visible.map((row:any)=><tr key={row.round}><td><strong>Rodada {row.round}</strong></td>{row.leaders.length?<><td><div className="round-leader-list">{row.leaders.map((leader:any)=><Team key={leader.teamId} id={leader.teamId} name={leader.teamName} color={leader.teamColor}/>)}</div></td><td className="right numeric"><div className="round-leader-list">{row.leaders.map((leader:any)=><strong key={leader.teamId}>{leader.points}</strong>)}</div></td><td><div className="round-leader-list">{row.leaders.map((leader:any)=><span className="numeric" key={leader.teamId}>{leader.wins}–{leader.draws}–{leader.losses}</span>)}</div></td><td className="right numeric"><div className="round-leader-list">{row.leaders.map((leader:any)=><strong key={leader.teamId}>{leader.goalDifference>0?`+${leader.goalDifference}`:leader.goalDifference}</strong>)}</div></td></>:<><td className="caption">Não definido</td><td className="right">—</td><td>—</td><td className="right">—</td></>}</tr>)}</tbody></table></div>:<div className="empty">Não há classificação por rodada publicada para esta temporada.</div>}
  </section>;
}

export default function Season({season,table,tableHome,tableAway,matches,tab,round,rounds,analytics,roundLeaders}:any){
  const router=useRouter();
  const [scope,setScope]=useState<'total'|'home'|'away'>('total');
  const [selectedRound,setSelectedRound]=useState<number>(round);
  useEffect(()=>{
    const queryRound=Array.isArray(router.query.round)?router.query.round[0]:router.query.round;
    const parsedRound=queryRound?Number(queryRound):round;
    setSelectedRound(rounds.includes(parsedRound)?parsedRound:round);
  },[router.query.round,round,rounds]);
  useEffect(()=>{
    const queryScope=Array.isArray(router.query.scope)?router.query.scope[0]:router.query.scope;
    if(queryScope==='total'||queryScope==='home'||queryScope==='away')setScope(queryScope);
  },[router.query.scope]);
  const visibleTable=scope==='home'?tableHome:scope==='away'?tableAway:table;
  const tabs=[['overview','Visão geral'],['classificacao','Classificação'],['rodadas','Rodadas'],['estatisticas','Estatísticas'],['artilharia','Artilharia'],['lideres','Líderes por rodada']];
  const visibleMatches=matches.filter((m:Match)=>Number(m.round)===Number(selectedRound));
  const showsRound=tab==='rodadas'||tab==='partidas'||!tab||tab==='overview';
  return <>
    <Header title={`Brasileirão ${season}`} desc="Dados canônicos publicados para a temporada."/>
    <nav className="tabs">{tabs.map(([v,l])=><Link className={(tab||'overview')===v?'active':''} href={`/temporadas/${season}${v==='overview'?'':`?tab=${v}`}`} key={v}>{l}</Link>)}</nav>
    {tab!=='estatisticas'&&tab!=='artilharia'&&tab!=='lideres'&&<Kpis items={[{label:'Partidas',value:matches.length},{label:'Clubes',value:table.length},{label:'Finalizadas',value:matches.filter((m:Match)=>isFinished(m)).length},{label:'Rodadas',value:rounds.length}]}/>}
    {(tab==='classificacao'||!tab||tab==='overview')&&<section className="section"><div className="season-classification-heading"><h2>Classificação</h2><StandingsScope value={scope} onChange={setScope}/></div><StandingsTable rows={visibleTable}/></section>}
    {showsRound&&<section className="section"><div className="season-round-heading"><h2>Partidas da rodada</h2><RoundNavigation season={season} round={selectedRound} rounds={rounds} tab={tab} onRoundChange={setSelectedRound}/></div><MatchTable matches={visibleMatches}/></section>}
    {(!tab||tab==='overview')&&<RoundLeaders season={season} rows={roundLeaders} preview/>}
    {tab==='lideres'&&<RoundLeaders season={season} rows={roundLeaders}/>}
    {tab==='estatisticas'&&<>
      <section className="section season-statistics"><div className="statistics-section-heading"><span className="statistics-section-icon">◉</span><div><h2>Panorama de gols</h2><p className="caption">Resumo da temporada até as partidas finalizadas disponíveis.</p></div></div>{analytics?.stats?<><Kpis items={[{label:'Partidas finalizadas',value:analytics.stats.matches},{label:'Gols marcados',value:analytics.stats.totalGoals},{label:'Média de gols por jogo',value:analytics.stats.goalsPerMatch.toFixed(1)},{label:'Gols de mandantes',value:analytics.stats.homeGoals},{label:'Gols de visitantes',value:analytics.stats.awayGoals}]}/><div className="season-stat-grid">{[
        {label:'Mais de 1,5 gols',short:'1,5+',detail:'2 ou mais gols na partida',value:analytics.stats.over15},
        {label:'Mais de 2,5 gols',short:'2,5+',detail:'3 ou mais gols na partida',value:analytics.stats.over25},
        {label:'Mais de 3,5 gols',short:'3,5+',detail:'4 ou mais gols na partida',value:analytics.stats.over35},
        {label:'Ambos marcaram',short:'BTTS',detail:'Os dois clubes fizeram gol',value:analytics.stats.bothScored},
        {label:'Ao menos um time sem sofrer gol',short:'SG',detail:'Uma equipe terminou sem sofrer gol',value:analytics.stats.cleanSheets}
      ].map(item=>{const percent=analytics.stats.matches?Math.round(Number(item.value)/analytics.stats.matches*100):0;return <article className="card season-stat-card" key={item.label}><div className="season-stat-card-heading"><span className="season-stat-mark" aria-hidden="true">{item.short}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div></div><div className="season-stat-card-value"><strong className="numeric">{Number(item.value).toLocaleString('pt-BR')}</strong><span className="numeric">{percent}%</span></div><div className="season-stat-track" role="img" aria-label={`${percent}% das partidas`}><span style={{width:`${percent}%`}}/></div><div className="season-stat-card-foot"><span>Frequência na temporada</span><small>{analytics.stats.matches.toLocaleString('pt-BR')} jogos</small></div></article>})}</div></>:<div className="empty">Estatísticas ainda não disponíveis para esta temporada.</div>}</section>
      <section className="section statistics-panel card"><div className="statistics-section-heading"><span className="statistics-section-icon">▥</span><div><h2>Gols por rodada</h2><p className="caption">Total de gols e média por partida em cada rodada.</p></div></div><RoundGoalsChart rows={analytics?.roundGoals||[]}/></section>
      <section className="section statistics-panel card"><div className="statistics-section-heading"><span className="statistics-section-icon">♜</span><div><h2>Desempenho dos clubes</h2><p className="caption">Pontos, campanha, gols e aproveitamento separados entre casa e fora.</p></div></div><ClubPerformanceTable rows={analytics?.clubPerformance||[]}/></section>
      <section className="section statistics-panel card"><div className="statistics-section-heading"><span className="statistics-section-icon">⌁</span><div><h2>Dados de jogo por clube</h2><p className="caption">Compare os indicadores técnicos registrados para os clubes.</p></div></div><ClubMatchStatistics rows={analytics?.clubMatchStats||[]}/></section>
    </>}
    {tab==='artilharia'&&<section className="section season-leaderboards"><div className="section-heading-row"><div><h2>Artilharia {season}</h2><p className="caption">Líderes individuais publicados na base da temporada.</p></div></div><div className="grid2"><LeaderTable title="Gols" metric="Gols" rows={analytics?.scorers||[]}/><LeaderTable title="Assistências" metric="Assist." rows={analytics?.assists||[]}/></div></section>}
  </>
}

export const getServerSideProps:GetServerSideProps=async({params,query})=>{
  const season=String(params?.season);
  const matches=orderByRound(seasonMatches(season));
  const rounds=[...new Set(matches.map(m=>Number(m.round)).filter(Number.isFinite))].sort((a,b)=>a-b);
  const teamIds=new Set(matches.flatMap(m=>[m.canonical_home_team_id,m.canonical_away_team_id]).filter(id=>id!=null&&String(id)!==''));
  const gamesPerRound=teamIds.size%2===0?teamIds.size/2:0;
  const completeRounds=rounds.filter(round=>{
    const games=matches.filter(m=>Number(m.round)===round);
    return gamesPerRound>0&&games.length===gamesPerRound&&games.every(m=>isFinished(m)&&m.home_score!=null&&m.away_score!=null);
  });
  const latestCompleteRound=completeRounds.at(-1)??rounds[0]??1;
  const requestedRound=Array.isArray(query.round)?query.round[0]:query.round;
  const parsedRound=requestedRound?Number(requestedRound):NaN;
  const round=rounds.includes(parsedRound)?parsedRound:latestCompleteRound;
  const table=standings(season);
  const activeTab=Array.isArray(query.tab)?query.tab[0]:query.tab;
  const analytics=activeTab==='estatisticas'||activeTab==='artilharia'?seasonAnalytics(season):null;
  const roundLeaders=activeTab==='lideres'||!activeTab||activeTab==='overview'?seasonRoundLeaders(season):[];
  return {props:{season,table,tableHome:venueStandings(season,'home',table),tableAway:venueStandings(season,'away',table),matches,tab:activeTab||null,round,rounds,analytics,roundLeaders}};
};
