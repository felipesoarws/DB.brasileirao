import type {GetServerSideProps} from 'next';
import {useEffect,useRef,useState} from 'react';
import {gold,isFinished,teamsMap} from '../lib/data/gold';
import {Header,Kpis} from '../components/ui';
import TeamSelect from '../components/TeamSelect';

type Club={id:string;name:string;color:string|null};
type PositionPoint={round:number;position:number|null;confirmed:boolean};
type TimelineProps={clubs:Club[];seasons:string[];teamId:string;season:string;team:Club|null;points:PositionPoint[];teamCount:number;roundCount:number};

const formatRoundRanges=(rounds:number[])=>{
  const sorted=[...rounds].sort((a,b)=>a-b),ranges:Array<[number,number]>=[];
  for(const round of sorted){const last=ranges.at(-1);if(last&&round===last[1]+1)last[1]=round;else ranges.push([round,round]);}
  return ranges.map(([start,end])=>start===end?`Rodada ${start}`:`Rodadas ${start}–${end}`).join(', ');
};

function PositionChart({points,teamCount,roundCount,color}:{points:PositionPoint[];teamCount:number;roundCount:number;color:string}){
  const containerRef=useRef<HTMLDivElement>(null),[width,setWidth]=useState(1000),[hovered,setHovered]=useState<PositionPoint|null>(null);
  useEffect(()=>{const container=containerRef.current;if(!container)return;const observer=new ResizeObserver(()=>setWidth(Math.max(320,Math.round(container.clientWidth))));observer.observe(container);return()=>observer.disconnect()},[points.length]);
  const confirmedPoints=points.filter((point):point is PositionPoint&{position:number}=>point.confirmed&&point.position!==null);
  if(!confirmedPoints.length)return <div className="position-timeline-chart" ref={containerRef}><div className="empty">A temporada ainda não tem rodadas disputadas para confirmar posições.</div></div>;
  const height=390,pad={top:24,right:24,bottom:42,left:46},plotWidth=width-pad.left-pad.right,plotHeight=height-pad.top-pad.bottom;
  const x=(round:number)=>pad.left+(roundCount<=1?0:(round-1)*plotWidth/(roundCount-1));
  const y=(position:number)=>pad.top+(teamCount<=1?plotHeight/2:(position-1)*plotHeight/(teamCount-1));
  const line=confirmedPoints.map(point=>`${x(point.round)},${y(point.position)}`).join(' ');
  const yTicks=[...new Set([1,...Array.from({length:Math.floor(teamCount/5)},(_,i)=>(i+1)*5),teamCount])].filter(position=>position<=teamCount);
  const xTicks=[...new Set([1,...Array.from({length:Math.floor(roundCount/4)},(_,i)=>(i+1)*4),roundCount])].filter(round=>round<=roundCount);
  return <div className="position-timeline-chart" ref={containerRef}><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Posições confirmadas em ${confirmedPoints.length} rodadas do campeonato`}>
    {yTicks.map(position=>{const cy=y(position);return <g key={position}><line className="position-timeline-grid" x1={pad.left} y1={cy} x2={width-pad.right} y2={cy}/><text className="position-timeline-axis" x={pad.left-10} y={cy+4} textAnchor="end">{position}º</text></g>})}
    <line className="position-timeline-baseline" x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top+plotHeight}/>
    <line className="position-timeline-baseline" x1={pad.left} y1={pad.top+plotHeight} x2={width-pad.right} y2={pad.top+plotHeight}/>
    {xTicks.map(round=><text className="position-timeline-axis" key={round} x={x(round)} y={height-13} textAnchor="middle">R{round}</text>)}
    {confirmedPoints.length>1&&<polyline className="position-timeline-line" points={line} style={{stroke:color}}/>}
    {confirmedPoints.map(point=><g key={point.round} tabIndex={0} role="graphics-symbol" aria-label={`Rodada ${point.round}: ${point.position}º lugar`} onMouseEnter={()=>setHovered(point)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(point)} onBlur={()=>setHovered(null)}><circle className="position-timeline-point" cx={x(point.round)} cy={y(point.position)} r={hovered?.round===point.round?8:6} style={{fill:color}}/><title>{`Rodada ${point.round}: ${point.position}º lugar`}</title></g>)}
    {hovered&&hovered.position!==null&&(()=>{const boxWidth=170,boxHeight=30,pointX=x(hovered.round),pointY=y(hovered.position),boxX=Math.max(pad.left,Math.min(width-pad.right-boxWidth,pointX-boxWidth/2)),boxY=pointY>pad.top+boxHeight+12?pointY-boxHeight-11:pointY+11;return <g className="position-timeline-tooltip" role="tooltip" pointerEvents="none"><rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx="6"/><text x={boxX+boxWidth/2} y={boxY+19} textAnchor="middle">Rodada {hovered.round} · {hovered.position}º lugar</text></g>})()}
  </svg></div>;
}

export default function TeamTimelinePage({clubs,seasons,teamId,season,team,points,teamCount,roundCount}:TimelineProps){
  const formRef=useRef<HTMLFormElement>(null),[selectedTeamId,setSelectedTeamId]=useState(teamId),[selectedSeason,setSelectedSeason]=useState(season);
  const confirmedPoints=points.filter((point):point is PositionPoint&{position:number}=>point.confirmed&&point.position!==null),positions=confirmedPoints.map(point=>point.position),finalPosition=confirmedPoints.at(-1)?.position??null,pendingRounds=points.filter(point=>!point.confirmed).map(point=>point.round);
  const isSeasonComplete=pendingRounds.length===0;
  const color=team?.color?`#${team.color.replace(/^#/,'')}`:'#087A46';
  return <>
    <Header title="Linha do tempo" desc="Acompanhe a posição de um clube rodada a rodada até o fim do campeonato."/>
    <form ref={formRef} className="position-timeline-filters card" method="get" action="/linha-do-tempo">
      <TeamSelect name="time" label="Time" teams={clubs} value={selectedTeamId} onChange={id=>{setSelectedTeamId(id);setSelectedSeason('')}} autoSubmit/>
      <label><span>Temporada</span><select name="temporada" value={selectedSeason} onChange={event=>setSelectedSeason(event.target.value)}><option value="">Temporada mais recente</option>{seasons.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <button className="btn primary" type="submit">Ver linha do tempo</button>
    </form>
    {!team?<div className="empty">Selecione o time e a temporada para ver a evolução na classificação.</div>:<>
      <section className="position-timeline-heading card"><img src={`/api/team-logo/${encodeURIComponent(team.id)}`} alt={`Emblema do ${team.name}`}/><div><h2>{team.name}</h2><p className="caption">Brasileirão {season} · posição após cada rodada</p></div></section>
      {positions.length>0&&<Kpis items={[{label:isSeasonComplete?'Posição final':'Posição atual',value:`${finalPosition}º`},{label:'Melhor posição',value:`${Math.min(...positions)}º`},{label:'Pior posição',value:`${Math.max(...positions)}º`},{label:'Rodadas confirmadas',value:`${confirmedPoints.length} / ${roundCount}`}]}/>}
      <section className="section position-timeline-panel card"><div className="statistics-section-heading"><span className="statistics-section-icon">⌁</span><div><h2>Posição por rodada</h2><p className="caption">Eixo vertical: posição na tabela (1º lugar no topo). Eixo horizontal: rodada do campeonato.</p></div></div><PositionChart points={points} teamCount={teamCount} roundCount={roundCount} color={color}/>{pendingRounds.length>0&&<p className="position-timeline-notice"><strong>Rodadas futuras:</strong> {formatRoundRanges(pendingRounds)} ainda não disputadas; posições serão confirmadas após os jogos.</p>}</section>
    </>}
  </>;
}

export const getServerSideProps:GetServerSideProps<TimelineProps>=async({query})=>{
  const history=gold('team_position_history');
  const teamMap=teamsMap();
  const clubs=[...new Set(history.map(row=>String(row.canonical_team_id||row.team_id)).filter(id=>teamMap.has(id)))].map(id=>{const club=teamMap.get(id)!;return {id,name:String(club.canonical_team_name||club.name||id),color:club.color==null?null:String(club.color)};}).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  const allSeasons=[...new Set(history.map(row=>String(row.season)))].sort((a,b)=>Number(b)-Number(a));
  const requestedTeam=Array.isArray(query.time)?query.time[0]:query.time;
  const teamId=clubs.some(club=>club.id===requestedTeam)?String(requestedTeam):'';
  const teamSeasons=teamId?[...new Set(history.filter(row=>String(row.canonical_team_id||row.team_id)===teamId).map(row=>String(row.season)))].sort((a,b)=>Number(b)-Number(a)):allSeasons;
  const requestedSeason=Array.isArray(query.temporada)?query.temporada[0]:query.temporada;
  const season=teamSeasons.includes(String(requestedSeason||''))?String(requestedSeason):teamSeasons[0]||'';
  const seasonRows=season?history.filter(row=>String(row.season)===season):[];
  const seasonMatches=season?gold('matches').filter(row=>String(row.season)===season):[];
  const startedRounds=new Set(seasonMatches.filter(row=>isFinished(row)||/live|progress|halftime|first_half|second_half/i.test(String(row.status))).map(row=>Number(row.round)).filter(round=>Number.isFinite(round)));
  const positionsByRound=new Map(seasonRows.filter(row=>String(row.canonical_team_id||row.team_id)===teamId).map(row=>[Number(row.round),Number(row.position)]));
  const roundCount=Math.max(0,...seasonRows.map(row=>Number(row.round)||0),...seasonMatches.map(row=>Number(row.round)||0));
  const points:PositionPoint[]=teamId?Array.from({length:roundCount},(_,index)=>{const round=index+1,confirmed=startedRounds.has(round),position=confirmed?positionsByRound.get(round)??null:null;return {round,position,confirmed:confirmed&&position!==null};}):[];
  const selectedTeam=clubs.find(club=>club.id===teamId)||null;
  return {props:{clubs,seasons:teamSeasons,teamId,season,team:selectedTeam,points,teamCount:new Set(seasonRows.map(row=>String(row.canonical_team_id||row.team_id))).size,roundCount}};
};
