import Head from 'next/head';
import Link from 'next/link';
import {useState,type FocusEvent,type MouseEvent} from 'react';

export type Row=Record<string,any>;

const formatDate=(m:Row)=>{
  const d=m.kickoff_utc||m.kickoff_date;
  if(!d)return 'TBD';
  const x=new Date(d);
  const options={timeZone:'America/Sao_Paulo'};
  return Number.isNaN(x.getTime())?'TBD':`${x.toLocaleDateString('pt-BR',options)} · ${m.kickoff_precision==='date'?'TBD':x.toLocaleTimeString('pt-BR',{...options,hour:'2-digit',minute:'2-digit'})}`;
};

export function Header({title,desc,meta}:{title:string,desc?:string,meta?:string}){
  return <><Head><title>{`${title} — Brasileirão Database`}</title><meta name="description" content={desc||'Base independente para explorar o Brasileirão Série A.'}/></Head><header className="page-head"><div><h1 className="page-title">{title}</h1>{desc&&<p className="desc">{desc}</p>}</div>{meta&&<span className="caption mono">{meta}</span>}</header></>;
}

export function Team({id,name,color,reverse=false}:{id:string,name:string,color?:string|null,logo?:string|null,reverse?:boolean}){
  const ini=name.split(' ').map(x=>x[0]).slice(0,2).join('');
  const hasTeam=id&&id!=='null'&&id!=='undefined';
  const mark=<span className="club-mark">{ini}{hasTeam?<img src={`/api/team-logo/${encodeURIComponent(id)}`} alt={`Escudo do ${name}`} loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:null}</span>;
  const teamColor=color&&color.toUpperCase()!=='#FFFFFF'?(color.startsWith('#')?color:`#${color}`):'#087A46';
  return <Link href={hasTeam?`/clubes/${id}`:'#'} aria-disabled={!hasTeam} className={`team ${reverse?'team-reverse':''}`} style={{'--team':teamColor} as any}>{reverse&&<span className="team-name">{name}</span>}{mark}{!reverse&&<span className="team-name">{name}</span>}</Link>;
}

export function Status({status}:{status?:string}){
  const x=String(status||'').toLowerCase();
  const done=['finished','final','ft','status_final'].includes(x);
  const cls=done?'finished':x.includes('postponed')?'postponed':'scheduled';
  const label=done?'Finalizada':x.includes('postponed')?'Adiada':x.includes('progress')?'Em andamento':'Agendada';
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function MatchTable({matches,empty='Nenhuma partida disponível.'}:{matches:Row[],empty?:string}){
  if(!matches.length)return <div className="empty">{empty}</div>;
  return <div className="table-wrap match-table"><table><colgroup><col/><col/><col/><col/><col/><col/><col/></colgroup><thead><tr><th>Data</th><th className="center">Rodada</th><th className="right">Mandante</th><th className="center">Placar</th><th>Visitante</th><th>Status</th><th>Estádio</th></tr></thead><tbody>{matches.map(m=>{const hs=m.home_score,as=m.away_score;return <tr key={m.canonical_match_id}><td className="caption nowrap">{formatDate(m)}</td><td className="center">{m.round??'—'}</td><td className="right"><Team reverse id={String(m.canonical_home_team_id)} name={m.canonical_home_team_name||'—'} color={m.home?.color} logo={m.home?.logo}/></td><td className="center"><Link href={`/partidas/${m.canonical_match_id}`} className="score-link numeric">{hs!=null&&as!=null?`${hs} — ${as}`:'—'}</Link></td><td><Team id={String(m.canonical_away_team_id)} name={m.canonical_away_team_name||'—'} color={m.away?.color} logo={m.away?.logo}/></td><td><Status status={m.status}/></td><td className="caption venue" title={m.venue||''}>{m.venue||'—'}</td></tr>})}</tbody></table></div>;
}

export function Kpis({items}:{items:{label:string,value:string|number,note?:string}[]}){
  return <div className="kpis card">{items.map(x=><div className="kpi" key={x.label}><label>{x.label}</label><strong className="numeric">{x.value}</strong>{x.note&&<small className="caption">{x.note}</small>}</div>)}</div>;
}

export function StandingsTable({rows}:{rows:Row[]}){
  const [hovered,setHovered]=useState<{item:Row;left:number;top:number;below:boolean}|null>(null);
  const openPopover=(event:MouseEvent<HTMLSpanElement>|FocusEvent<HTMLSpanElement>,item:Row)=>{
    const rect=event.currentTarget.getBoundingClientRect();
    const halfWidth=Math.min(155,Math.max(0,(window.innerWidth-24)/2));
    setHovered({item,left:Math.max(12+halfWidth,Math.min(window.innerWidth-12-halfWidth,rect.left+rect.width/2)),top:rect.top,below:rect.top<130});
  };
  const closePopover=()=>setHovered(null);
  return <div className="table-wrap standings-table"><table><thead><tr><th>Pos</th><th>Clube</th><th>ULT. 5</th><th className="right">PTS</th><th className="right">J</th><th className="right">V</th><th className="right">E</th><th className="right">D</th><th className="right">GP</th><th className="right">GC</th><th className="right">SG</th></tr></thead><tbody>{rows.map(r=><tr key={r.canonical_team_id}><td>{r.position??'—'}</td><td><Team id={String(r.canonical_team_id)} name={r.team_name||'—'} color={r.team?.color}/></td><td><div className="form-results" aria-label={`Últimos cinco jogos: ${(r.form||[]).map((item:Row)=>item.result).join(', ')||'sem resultados'}`}>{Array.from({length:5},(_,i)=>{const item=(r.form||[])[i],result=item?.result,label=result==='V'?'Vitória':result==='E'?'Empate':result==='D'?'Derrota':'Sem jogo';const detail=item?`${label}: ${item.home} ${item.score} ${item.away}, rodada ${item.round??'—'}`:label;return <span key={i} className={`form-result ${result?`form-${result.toLowerCase()}`:'form-empty'}`} tabIndex={item?0:-1} aria-label={detail} onMouseEnter={item?event=>openPopover(event,item):undefined} onMouseLeave={item?closePopover:undefined} onFocus={item?event=>openPopover(event,item):undefined} onBlur={item?closePopover:undefined}>{result||'—'}</span>})}</div></td>{['points','played','wins','draws','losses','goals_for','goals_against','goal_difference'].map(k=><td className="right numeric" key={k}>{r[k]??'—'}</td>)}</tr>)}</tbody></table>{hovered&&<div className={`form-popover ${hovered.below?'form-popover-below':''}`} style={{left:hovered.left,top:hovered.below?hovered.top+30:undefined,bottom:hovered.below?undefined:`calc(100vh - ${hovered.top}px + 9px)`}} role="tooltip"><div className="form-popover-heading"><span>RODADA {hovered.item.round??'—'}</span><span className={`form-popover-result form-${hovered.item.result.toLowerCase()}`}>{hovered.item.result==='V'?'Vitória':hovered.item.result==='E'?'Empate':'Derrota'}</span></div><div className="form-popover-match"><div className="form-popover-team"><img src={`/api/team-logo/${encodeURIComponent(hovered.item.homeId)}`} alt=""/><span>{hovered.item.home}</span></div><strong>{hovered.item.score}</strong><div className="form-popover-team form-popover-away"><img src={`/api/team-logo/${encodeURIComponent(hovered.item.awayId)}`} alt=""/><span>{hovered.item.away}</span></div></div></div>}</div>;
}
