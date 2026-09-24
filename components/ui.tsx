import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import {createPortal} from 'react-dom';
import {useState,type FocusEvent,type MouseEvent} from 'react';

export type Row=Record<string,any>;

const formatDate=(m:Row)=>{
  const d=m.kickoff_utc||m.kickoff_date;
  if(!d)return 'TBD';
  const x=new Date(d);
  const options={timeZone:'America/Sao_Paulo'};
  return Number.isNaN(x.getTime())?'TBD':`${x.toLocaleDateString('pt-BR',options)} · ${m.kickoff_precision==='date'?'TBD':x.toLocaleTimeString('pt-BR',{...options,hour:'2-digit',minute:'2-digit'})}`;
};
const formatMobileDate=(m:Row)=>{
  const value=m.kickoff_utc||m.kickoff_date;
  if(!value)return {date:'TBD',time:''};
  const date=new Date(value),options={timeZone:'America/Sao_Paulo'};
  if(Number.isNaN(date.getTime()))return {date:'TBD',time:''};
  const shortDate=date.toLocaleDateString('pt-BR',{...options,day:'2-digit',month:'2-digit'});
  const time=m.kickoff_precision==='date'?'':date.toLocaleTimeString('pt-BR',{...options,hour:'2-digit',minute:'2-digit'});
  return {date:shortDate,time};
};

export function Header({title,desc,meta,browserTitle}:{title:string,desc?:string,meta?:string,browserTitle?:string}){
  return <><Head><title>{browserTitle||`${title} — Database`}</title><meta name="description" content={desc||'Base independente para explorar o Brasileirão Série A.'}/></Head><header className="page-head"><div><h1 className="page-title">{title}</h1>{desc&&<p className="desc">{desc}</p>}</div>{meta&&<span className="caption mono">{meta}</span>}</header></>;
}

export function Team({id,name,color,reverse=false}:{id:string,name:string,color?:string|null,logo?:string|null,reverse?:boolean}){
  const displayName=name.trim().replace(/(?:\s*[-–/]\s*|\s+)(?:AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/i,'').trim()||name;
  const words=displayName.split(/\s+/).filter(word=>!['da','de','do','das','dos','e'].includes(word.toLocaleLowerCase('pt-BR')));
  const ini=words.map(x=>x[0]).slice(0,2).join('');
  const shortName=words.length>1?words.map(word=>word[0]).join('').toUpperCase():words[0]?.slice(0,3).toUpperCase()||'—';
  const hasTeam=id&&id!=='null'&&id!=='undefined';
  const mark=<span className="club-mark">{ini}{hasTeam?<Image src={`/api/team-logo/${encodeURIComponent(id)}`} alt={`Escudo do ${displayName}`} width={36} height={36} sizes="36px" onError={e=>{e.currentTarget.style.display='none'}}/>:null}</span>;
  const teamColor=color&&color.toUpperCase()!=='#FFFFFF'?(color.startsWith('#')?color:`#${color}`):'var(--theme-brand-primary)';
  return <Link href={hasTeam?`/clubes/${id}`:'#'} aria-disabled={!hasTeam} aria-label={displayName} className={`team ${reverse?'team-reverse':''}`} style={{'--team':teamColor} as any}>{reverse&&<><span className="team-name">{displayName}</span><span className="team-short-name" aria-hidden="true">{shortName}</span></>}{mark}{!reverse&&<><span className="team-name">{displayName}</span><span className="team-short-name" aria-hidden="true">{shortName}</span></>}</Link>;
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
  return <div className="table-wrap match-table"><table><colgroup><col/><col/><col/><col/><col/><col/><col/></colgroup><thead><tr><th>Data</th><th className="center">Rodada</th><th className="right">Mandante</th><th className="center">Placar</th><th>Visitante</th><th>Status</th><th>Estádio</th></tr></thead><tbody>{matches.map(m=>{const hs=m.home_score,as=m.away_score,mobileDate=formatMobileDate(m);return <tr key={m.canonical_match_id}><td className="caption nowrap"><span className="match-date-full">{formatDate(m)}</span><span className="match-date-mobile"><span>{mobileDate.date}</span>{mobileDate.time&&<small>{mobileDate.time}</small>}</span></td><td className="center">{m.round??'—'}</td><td className="right"><Team reverse id={String(m.canonical_home_team_id)} name={m.canonical_home_team_name||'—'} color={m.home?.color} logo={m.home?.logo}/></td><td className="center"><Link href={`/partidas/${m.canonical_match_id}`} className="score-link numeric">{hs!=null&&as!=null?`${hs} — ${as}`:'—'}</Link></td><td><Team id={String(m.canonical_away_team_id)} name={m.canonical_away_team_name||'—'} color={m.away?.color} logo={m.away?.logo}/></td><td><Status status={m.status}/></td><td className="caption venue" title={m.venue||''}>{m.venue||'—'}</td></tr>})}</tbody></table></div>;
}

export function Kpis({items}:{items:{label:string,value:string|number,note?:string}[]}){
  return <div className="kpis card">{items.map(x=><div className="kpi" key={x.label}><label>{x.label}</label><strong className="numeric">{x.value}</strong>{x.note&&<small className="caption">{x.note}</small>}</div>)}</div>;
}

export function StandingsScope({value,onChange}:{value:'total'|'home'|'away';onChange:(value:'total'|'home'|'away')=>void}){
  return <div className="season-classification-scope" role="group" aria-label="Tipo de classificação">{([['total','Total'],['home','Casa'],['away','Fora']] as const).map(([key,label])=><button type="button" className={value===key?'active':''} aria-pressed={value===key} key={key} onClick={()=>onChange(key)}>{label}</button>)}</div>;
}

export function StandingsTable({rows}:{rows:Row[]}){
  const [hovered,setHovered]=useState<{item:Row;left:number;top:number;above:boolean}|null>(null);
  const transitionKey=rows.map(row=>`${row.canonical_team_id}:${row.points??''}:${row.played??''}:${row.wins??''}:${row.goals_for??''}:${row.goals_against??''}`).join('|');
  const openPopover=(event:MouseEvent<HTMLSpanElement>|FocusEvent<HTMLSpanElement>,item:Row)=>{
    const rect=event.currentTarget.getBoundingClientRect();
    const halfWidth=Math.min(155,Math.max(0,(window.innerWidth-24)/2));
    const isPointer=event.type==='mouseenter';
    const pointer=event as MouseEvent<HTMLSpanElement>;
    const x=isPointer?pointer.clientX:rect.left+rect.width/2;
    const y=isPointer?pointer.clientY:rect.top+rect.height/2;
    const screenX=Math.max(12+halfWidth,Math.min(window.innerWidth-12-halfWidth,x));
    const above=y>window.innerHeight-132;
    setHovered({item,left:screenX,top:above?y-112:y+12,above});
  };
  const closePopover=()=>setHovered(null);
  return <div key={transitionKey} className="table-wrap standings-table tab-content-transition"><table><colgroup><col style={{width:'5%'}}/><col style={{width:'22%'}}/><col style={{width:'24%'}}/><col style={{width:'7%'}}/><col style={{width:'5.3%'}}/><col style={{width:'5.3%'}}/><col style={{width:'5.3%'}}/><col style={{width:'5.3%'}}/><col style={{width:'6.93%'}}/><col style={{width:'6.93%'}}/><col style={{width:'6.94%'}}/></colgroup><thead><tr><th>Pos</th><th>Clube</th><th>ULT. 5</th><th className="right">PTS</th><th className="right">J</th><th className="right">V</th><th className="right">E</th><th className="right">D</th><th className="right">GP</th><th className="right">GC</th><th className="right">SG</th></tr></thead><tbody>{rows.map((r,index)=>{const isG4=index<4,isZ4=index>=Math.max(4,rows.length-4),zone=isG4?'g4':isZ4?'z4':'';return <tr key={r.canonical_team_id} className={zone?`standings-row-${zone}`:undefined} aria-label={isG4?'G4 — zona de classificação':isZ4?'Z4 — zona de rebaixamento':undefined}><td>{r.position??index+1}{zone&&<small className={`standings-zone-label standings-zone-${zone}`}>{zone.toUpperCase()}</small>}</td><td><Team id={String(r.canonical_team_id)} name={r.team_name||'—'} color={r.team?.color}/></td><td><div className="form-results" aria-label={`Últimos cinco jogos: ${(r.form||[]).map((item:Row)=>item.result).join(', ')||'sem resultados'}`}>{Array.from({length:5},(_,i)=>{const item=(r.form||[])[i],result=item?.result,label=result==='V'?'Vitória':result==='E'?'Empate':result==='D'?'Derrota':'Sem jogo';const detail=item?`${label}: ${item.home} ${item.score} ${item.away}, rodada ${item.round??'—'}`:label;const className=`form-result ${result?`form-${result.toLowerCase()}`:'form-empty'}`,props={tabIndex:item?0:-1,'aria-label':detail,onMouseEnter:item?(event:MouseEvent<HTMLAnchorElement>|FocusEvent<HTMLAnchorElement>)=>openPopover(event,item):undefined,onMouseLeave:item?closePopover:undefined,onFocus:item?(event:MouseEvent<HTMLAnchorElement>|FocusEvent<HTMLAnchorElement>)=>openPopover(event,item):undefined,onBlur:item?closePopover:undefined};return item?<Link key={i} href={`/partidas/${encodeURIComponent(item.matchId)}`} className={className} {...props}>{result}</Link>:<span key={i} className={className} aria-label={detail}>—</span>})}</div></td>{['points','played','wins','draws','losses','goals_for','goals_against','goal_difference'].map(k=><td className="right numeric" key={k}>{r[k]??'—'}</td>)}</tr>})}</tbody></table>{hovered&&typeof document!=='undefined'&&createPortal(<div className={`form-popover ${hovered.above?'form-popover-above':''}`} style={{left:hovered.left,top:hovered.top}} role="tooltip"><div className="form-popover-heading"><span>RODADA {hovered.item.round??'—'}</span><span className={`form-popover-result form-${hovered.item.result.toLowerCase()}`}>{hovered.item.result==='V'?'Vitória':hovered.item.result==='E'?'Empate':'Derrota'}</span></div><div className="form-popover-match"><div className="form-popover-team"><img src={`/api/team-logo/${encodeURIComponent(hovered.item.homeId)}`} alt=""/><span>{hovered.item.home}</span></div><strong>{hovered.item.score}</strong><div className="form-popover-team form-popover-away"><img src={`/api/team-logo/${encodeURIComponent(hovered.item.awayId)}`} alt=""/><span>{hovered.item.away}</span></div></div></div>,document.body)}</div>;
}
