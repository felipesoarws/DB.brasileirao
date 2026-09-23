import type {GetServerSideProps} from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {useEffect,useRef,useState,type CSSProperties,type FocusEvent,type MouseEvent} from 'react';
import {gold,isFinished,latestSeason,Row} from '../../lib/data/gold';
import {teamMatches as getTeamMatches} from '../../lib/data/queries';

type SeasonRow={season:number;points:number;played:number;won:number;drawn:number;lost:number;gf:number;ga:number;position:number|null;percentage:number};
type GoalsRow={season:string;average:number;games:number};
type ChartPoint=SeasonRow&{x:number;y:number};
type VenueStats={played:number;wins:number;draws:number;losses:number;goalsFor:number;goalsAgainst:number;points:number;percentage:number};
type ClubPageProps={team:Row;stats:{matches:number;wins:number;draws:number;losses:number;goalsFor:number;goalsAgainst:number;seasons:number};history:SeasonRow[];goalsBySeason:GoalsRow[];championYears:string[];currentSeason:string|null;recentMatches:Row[];upcomingMatches:Row[];venuePerformance:{home:VenueStats;away:VenueStats}};

const metric=(value:unknown)=>Number(value)||0;
const matchDate=(match:Row)=>{
  const raw=match.kickoff_utc||match.kickoff_date;
  if(!raw)return 'Data a definir';
  const date=new Date(raw);
  if(Number.isNaN(date.getTime()))return 'Data a definir';
  const dateLabel=date.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'short',year:'numeric'});
  if(!match.kickoff_utc||match.kickoff_precision==='date')return dateLabel;
  return `${dateLabel} · ${date.toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'})}`;
};

function ClubMatchList({items,empty}:{items:Row[];empty:string}){
  if(!items.length)return <p className="club-match-empty">{empty}</p>;
  return <div className="club-match-list">{items.map(match=>{
    const homeId=String(match.canonical_home_team_id),awayId=String(match.canonical_away_team_id);
    const home=match.canonical_home_team_name||'Mandante',away=match.canonical_away_team_name||'Visitante';
    const score=match.home_score!=null&&match.away_score!=null?`${match.home_score} — ${match.away_score}`:'vs';
    return <Link className="club-match-row" href={`/partidas/${match.canonical_match_id}`} key={match.canonical_match_id}>
      <span className="club-match-meta"><span>Rodada {match.round??'—'}</span><time>{match.dateLabel}</time></span>
      <span className="club-match-scoreline">
        <span className="club-match-team"><img src={`/api/team-logo/${encodeURIComponent(homeId)}`} alt=""/><span>{home}</span></span>
        <strong>{score}</strong>
        <span className="club-match-team club-match-away"><img src={`/api/team-logo/${encodeURIComponent(awayId)}`} alt=""/><span>{away}</span></span>
      </span>
    </Link>;
  })}</div>;
}

export default function ClubPage({team,stats,history,goalsBySeason,championYears,currentSeason,recentMatches,upcomingMatches,venuePerformance}:ClubPageProps){
  const [hovered,setHovered]=useState<{kind:'goals'|'points';row:GoalsRow|ChartPoint;left:number;top:number;below:boolean}|null>(null);
  const chartContainerRef=useRef<HTMLDivElement>(null);
  const matchesPanelRef=useRef<HTMLElement>(null);
  const [matchesPanelHeight,setMatchesPanelHeight]=useState<number|null>(null);
  const [chartViewportWidth,setChartViewportWidth]=useState(640);
  useEffect(()=>{
    const container=chartContainerRef.current;
    if(!container)return;
    const observer=new ResizeObserver(entries=>{
      const width=Math.round(entries[0]?.contentRect.width||0);
      if(width>0)setChartViewportWidth(width);
    });
    observer.observe(container);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const panel=matchesPanelRef.current;
    if(!panel)return;
    const observer=new ResizeObserver(()=>setMatchesPanelHeight(Math.ceil(panel.getBoundingClientRect().height)));
    observer.observe(panel);
    return ()=>observer.disconnect();
  },[]);
  const openPopover=(event:MouseEvent<Element>|FocusEvent<Element>,kind:'goals'|'points',row:GoalsRow|ChartPoint)=>{
    const rect=event.currentTarget.getBoundingClientRect(),halfWidth=Math.min(155,Math.max(0,(window.innerWidth-24)/2));
    setHovered({kind,row,left:Math.max(12+halfWidth,Math.min(window.innerWidth-12-halfWidth,rect.left+rect.width/2)),top:rect.top,below:rect.top<130});
  };
  const closePopover=()=>setHovered(null);
  const color=team.color?`#${String(team.color).replace(/^#/,'')}`:'#087A46';
  const chartWidth=Math.max(300,chartViewportWidth),chartHeight=300,pad={top:18,right:14,bottom:32,left:38};
  const plotWidth=chartWidth-pad.left-pad.right,plotHeight=chartHeight-pad.top-pad.bottom;
  const seasonAxis=goalsBySeason.map((row,index)=>({season:row.season,index,x:pad.left+(goalsBySeason.length<2?plotWidth/2:index*plotWidth/(goalsBySeason.length-1))}));
  const seasonX=new Map(seasonAxis.map(item=>[item.season,item.x]));
  const chronological=history.slice().reverse();
  const points:ChartPoint[]=chronological.flatMap(row=>{const x=seasonX.get(String(row.season));return x==null?[]:[{x,y:pad.top+plotHeight-(row.percentage/100)*plotHeight,...row}]});
  const line=points.map(point=>`${point.x},${point.y}`).join(' ');
  const maxGoals=Math.max(...goalsBySeason.map(row=>row.average),1);

  return <>
    <Head><title>{team.name} — Brasileirão Database</title><meta name="description" content={`Estatísticas e histórico de temporadas de ${team.name} no Brasileirão Série A.`}/><link key="favicon" rel="icon" type="image/png" href={`/api/team-logo/${encodeURIComponent(team.canonical_team_id)}`}/></Head>
    <div className="club-detail" style={{'--club-color':color} as React.CSSProperties}>
      <header className="club-hero card">
        <Link className="club-back" href="/clubes" aria-label="Voltar para clubes">‹</Link>
        <img className="club-hero-logo" src={`/api/team-logo/${encodeURIComponent(team.canonical_team_id)}`} alt={`Escudo do ${team.name}`} onError={event=>{event.currentTarget.style.visibility='hidden'}}/>
        <div className="club-hero-copy"><h1>{team.name}</h1><p><strong>{stats.seasons}</strong> temporadas no Brasileirão</p>{championYears.length>0&&<p className="club-title-years"><span aria-hidden="true">🏆</span><span>Campeão em <strong>{championYears.join(', ')}</strong></span></p>}</div>
      </header>

      <section className="club-metrics" aria-label="Estatísticas gerais">
        {[
          {label:'Jogos',value:stats.matches,kind:'neutral'},
          {label:'Vitórias',value:stats.wins,kind:'win'},
          {label:'Empates',value:stats.draws,kind:'draw'},
          {label:'Derrotas',value:stats.losses,kind:'loss'},
          {label:'Gols pró',value:stats.goalsFor,kind:'neutral'},
          {label:'Gols contra',value:stats.goalsAgainst,kind:'neutral'},
        ].map(item=><div className="club-metric card" key={item.label}><strong className={`club-metric-${item.kind}`}>{item.value.toLocaleString('pt-BR')}</strong><span>{item.label}</span></div>)}
      </section>

      <div className="club-history-grid">
        <section className="club-panel card" aria-labelledby="club-chart-title">
          <h2 id="club-chart-title">Aproveitamento por temporada (%)</h2>
          {points.length?<div className="club-chart-scroll" ref={chartContainerRef}><svg className="club-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="group" aria-label="Gráfico de aproveitamento percentual por temporada">
            {[0,25,50,75,100].map(value=>{const y=pad.top+plotHeight-(value/100)*plotHeight;return <g key={value}><line className={value===0?'club-chart-baseline':'club-chart-grid'} x1={pad.left} y1={y} x2={chartWidth-pad.right} y2={y}/><text className="club-chart-axis" x={pad.left-8} y={y+4} textAnchor="end">{value}</text></g>})}
            {seasonAxis.filter(item=>item.index%2===0).map(item=><text className="club-chart-season" key={item.season} x={item.x} y={chartHeight-8} textAnchor="middle">{item.season}</text>)}
            {points.length>1&&<polyline className="club-chart-line" points={line}/>}
            {points.map(point=><g key={point.season}><circle className="club-chart-point" cx={point.x} cy={point.y} r="4" tabIndex={0} aria-label={`${point.season}: ${point.percentage}% de aproveitamento`} onMouseEnter={event=>openPopover(event,'points',point)} onMouseLeave={closePopover} onFocus={event=>openPopover(event,'points',point)} onBlur={closePopover}><title>{point.season}: {point.percentage}%</title></circle><text className="club-point-value" x={point.x} y={point.y-pad.top<18?point.y+16:point.y-9} textAnchor="middle">{Math.round(point.percentage)}%</text></g>)}
          </svg></div>:<p className="club-empty">Não há temporadas disponíveis para este clube.</p>}
        </section>

        <section className="club-panel club-goals-panel card" aria-labelledby="club-goals-title">
          <h2 id="club-goals-title">Média de gols por temporada</h2>
          {goalsBySeason.length?<div className="club-chart-scroll"><svg className="club-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="group" aria-label="Média de gols por temporada">
            <line className="club-chart-baseline" x1={pad.left} y1={pad.top+plotHeight} x2={chartWidth-pad.right} y2={pad.top+plotHeight}/>
            {seasonAxis.filter(item=>item.index%2===0).map(item=><text className="club-chart-season" key={item.season} x={item.x} y={chartHeight-8} textAnchor="middle">{item.season}</text>)}
            {goalsBySeason.map(row=>{const x=seasonX.get(row.season)??pad.left,barWidth=Math.min(22,Math.max(8,plotWidth/goalsBySeason.length*.62)),height=(row.average/maxGoals)*plotHeight*.76,y=pad.top+plotHeight-height;return <g key={row.season} tabIndex={0} role="graphics-symbol" aria-label={`${row.season}: ${row.average.toFixed(1)} gols por jogo`} onMouseEnter={event=>openPopover(event,'goals',row)} onMouseLeave={closePopover} onFocus={event=>openPopover(event,'goals',row)} onBlur={closePopover}><rect className="club-goals-bar" x={x-barWidth/2} y={y} width={barWidth} height={height} rx="4" fill={color}/><text className="club-goals-value" x={x} y={y-7} textAnchor="middle">{row.average.toFixed(1)}</text></g>})}
          </svg></div>:<p className="club-empty">Não há médias disponíveis para estas temporadas.</p>}
        </section>

        <div className="club-lower-grid" style={{'--club-matches-height':matchesPanelHeight?`${matchesPanelHeight}px`:'auto'} as CSSProperties}>
          <section ref={matchesPanelRef} className="club-panel club-matches-panel card" aria-label="Partidas do clube">
            <div className="club-match-block"><h2>Últimos 5 jogos</h2><ClubMatchList items={recentMatches} empty="Nenhuma partida finalizada disponível."/></div>
            <div className="club-match-block"><h2>Próximos 5 jogos</h2><ClubMatchList items={upcomingMatches} empty="Nenhum próximo jogo disponível."/></div>
            <section className="club-venue-performance" aria-labelledby="club-venue-title">
              <div className="club-venue-heading"><h2 id="club-venue-title">Desempenho em casa e fora</h2><span>Brasileirão {currentSeason}</span></div>
              <div className="club-venue-grid">{(['home','away'] as const).map((venue)=>{const row=venuePerformance[venue];return <article className="club-venue-card" key={venue}>
                <h3>{venue==='home'?'Em casa':'Fora de casa'}</h3>
                <div className="club-venue-rate"><strong>{row.percentage}%</strong><span>aproveitamento</span></div>
                <div className="club-venue-record"><span>{row.played}J</span><span className="club-cell-win">{row.wins}V</span><span className="club-cell-draw">{row.draws}E</span><span className="club-cell-loss">{row.losses}D</span></div>
                <p>Gols <strong>{row.goalsFor}</strong> pró · <strong>{row.goalsAgainst}</strong> contra</p>
              </article>})}</div>
            </section>
          </section>
          <section className="club-panel club-table-panel club-history-panel card" aria-labelledby="club-history-title">
            <h2 id="club-history-title">Histórico por temporada</h2>
            {history.length?<div className="club-history-list" role="list" aria-label="Campanhas do clube por temporada">
              <div className="club-history-list-head" aria-hidden="true"><span>Temporada</span><span>Campanha</span><span>Saldo</span></div>
              {history.map(row=>{const difference=row.gf-row.ga,season=String(row.season),isCurrent=season===currentSeason,isChampion=championYears.includes(season);return <div className={`club-history-list-row${isCurrent?' is-current':''}${isChampion?' is-champion':''}`} key={row.season} role="listitem">
                <div className="club-history-season"><Link href={`/temporadas/${row.season}`}>{row.season}</Link><span className="club-history-position">{row.position?`${row.position}º`:'—'}</span>{isChampion&&<span className="club-history-flag club-history-flag-champion" role="img" aria-label="Campeão brasileiro" title="Campeão brasileiro">🏆</span>}</div>
                <div className="club-history-campaign"><div className="club-history-points"><strong>{row.points}</strong><span>PTS</span><small>{row.played} jogos</small></div><div className="club-history-results" aria-label={`${row.won} vitórias, ${row.drawn} empates, ${row.lost} derrotas`}><span className="club-cell-win">{row.won}V</span><span className="club-cell-draw">{row.drawn}E</span><span className="club-cell-loss">{row.lost}D</span></div></div>
                <div className={`club-history-difference ${difference>0?'is-positive':difference<0?'is-negative':''}`}><strong>{difference>0?'+':''}{difference}</strong><span>SG</span></div>
              </div>})}
            </div>:<p className="club-empty">Não há temporadas disponíveis para este clube.</p>}
          </section>
        </div>
      </div>
      {hovered&&<div className={`form-popover goals-popover ${hovered.below?'form-popover-below':''}`} style={{left:hovered.left,top:hovered.below?hovered.top+30:undefined,bottom:hovered.below?undefined:`calc(100vh - ${hovered.top}px + 9px)`}} role="tooltip"><div className="form-popover-heading"><span>TEMPORADA {hovered.row.season}</span><span className="form-popover-result goals-popover-tag">{hovered.kind==='goals'?'MÉDIA':'APROVEITAMENTO'}</span></div>{hovered.kind==='goals'?<><div className="goals-popover-average"><strong>{(hovered.row as GoalsRow).average.toFixed(1)}</strong><span>gols por jogo</span></div><div className="goals-popover-games">{(hovered.row as GoalsRow).games.toLocaleString('pt-BR')} partidas finalizadas</div></>:<><div className="goals-popover-average"><strong>{(hovered.row as ChartPoint).percentage}%</strong><span>dos pontos disputados</span></div><div className="goals-popover-games">{(hovered.row as ChartPoint).played} jogos · {(hovered.row as ChartPoint).won}V {(hovered.row as ChartPoint).drawn}E {(hovered.row as ChartPoint).lost}D</div></>}</div>}
    </div>
  </>;
}

export const getServerSideProps:GetServerSideProps<ClubPageProps>=async({params})=>{
  const teamId=String(params?.teamId||'');
  const team=gold('teams').find(row=>String(row.canonical_team_id)===teamId);
  if(!team)return {notFound:true};
  const history=gold('season_standings').filter(row=>String(row.team_id||row.canonical_team_id)===teamId).map((row:Row)=>{
    const played=metric(row.played),won=metric(row.won??row.wins),drawn=metric(row.drawn??row.draws),lost=metric(row.lost??row.losses),gf=metric(row.gf??row.goals_for),ga=metric(row.ga??row.goals_against),points=metric(row.points);
    return {season:metric(row.season),points,played,won,drawn,lost,gf,ga,position:row.position==null?null:metric(row.position),percentage:played?Math.round(points/(played*3)*1000)/10:0};
  }).sort((a,b)=>b.season-a.season);
  const goalsBySeason:GoalsRow[]=gold('analytics/season_goal_stats').filter(row=>Number(row.matches)>0).map(row=>({season:String(row.season),average:Number(Number(row.goals_per_match).toFixed(2)),games:metric(row.matches)})).sort((a,b)=>a.season.localeCompare(b.season));
  const championYears=gold('season_champions').filter(row=>String(row.team_id||row.canonical_team_id)===teamId).map(row=>String(row.season)).sort((a,b)=>Number(a)-Number(b));
  const current=latestSeason();
  const now=Date.now();
  const teamMatches=getTeamMatches(teamId);
  const currentSeasonMatches=teamMatches.filter(match=>String(match.season)===String(current)&&isFinished(match)&&match.home_score!=null&&match.away_score!=null);
  const summarizeVenue=(venue:'home'|'away'):VenueStats=>currentSeasonMatches.filter(match=>String(venue==='home'?match.canonical_home_team_id:match.canonical_away_team_id)===teamId).reduce<VenueStats>((total,match)=>{
    const home=Number(match.home_score),away=Number(match.away_score),forGoals=venue==='home'?home:away,againstGoals=venue==='home'?away:home;
    total.played++;total.goalsFor+=forGoals;total.goalsAgainst+=againstGoals;
    if(forGoals>againstGoals){total.wins++;total.points+=3;}else if(forGoals<againstGoals){total.losses++;}else{total.draws++;total.points++;}
    return total;
  },{played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,points:0,percentage:0});
  const homePerformance=summarizeVenue('home'),awayPerformance=summarizeVenue('away');
  homePerformance.percentage=homePerformance.played?Math.round(homePerformance.points/(homePerformance.played*3)*100):0;
  awayPerformance.percentage=awayPerformance.played?Math.round(awayPerformance.points/(awayPerformance.played*3)*100):0;
  const timeOf=(match:Row)=>Date.parse(match.kickoff_utc||match.kickoff_date||'');
  const recentMatches=teamMatches.filter(match=>isFinished(match)&&match.home_score!=null&&match.away_score!=null).sort((a,b)=>(timeOf(b)||0)-(timeOf(a)||0)).slice(0,5).map(match=>({...match,dateLabel:matchDate(match)}));
  const upcomingMatches=teamMatches.filter(match=>!isFinished(match)&&(!Number.isFinite(timeOf(match))||timeOf(match)>=now)).sort((a,b)=>(timeOf(a)||Infinity)-(timeOf(b)||Infinity)).slice(0,5).map(match=>({...match,dateLabel:matchDate(match)}));
  const totals=history.reduce((sum,row)=>({matches:sum.matches+row.played,wins:sum.wins+row.won,draws:sum.draws+row.drawn,losses:sum.losses+row.lost,goalsFor:sum.goalsFor+row.gf,goalsAgainst:sum.goalsAgainst+row.ga}),{matches:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0});
  return {props:{team:{canonical_team_id:String(team.canonical_team_id),name:String(team.canonical_team_name||team.name),color:team.color||null},stats:{...totals,seasons:history.length},history,goalsBySeason,championYears,currentSeason:current?String(current):null,recentMatches,upcomingMatches,venuePerformance:{home:homePerformance,away:awayPerformance}}};
};
