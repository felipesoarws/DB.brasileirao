import type {GetServerSideProps} from 'next';
import {useState,type CSSProperties} from 'react';
import {gold,isFinished,type Row} from '../../lib/data/gold';
import {matches} from '../../lib/data/queries';
import {Header,MatchTable} from '../../components/ui';
import TeamSelect from '../../components/TeamSelect';
import StyledSelect from '../../components/StyledSelect';

type Club={id:string;name:string;color:string|null};
type MeetingPageProps={clubs:Club[];homeId:string;awayId:string;mode:'all'|'home'|'away';homeName:string;awayName:string;rows:Row[];totals:{played:number;homeWins:number;draws:number;awayWins:number;homeGoals:number;awayGoals:number}};

export default function HeadToHeadPage({clubs,homeId,awayId,mode,homeName,awayName,rows,totals}:MeetingPageProps){
  const [selectedHome,setSelectedHome]=useState(homeId),[selectedAway,setSelectedAway]=useState(awayId);
  const ready=Boolean(selectedHome&&selectedAway);
  const modeLabel=mode==='home'?`${homeName} como mandante`:mode==='away'?`${awayName} como mandante`:'Todos os confrontos',homeColor=clubs.find(club=>club.id===selectedHome)?.color||'var(--theme-brand-primary)',awayColor=clubs.find(club=>club.id===selectedAway)?.color||'var(--theme-text-muted)';
  return <>
    <Header title="Confronto direto" desc="Compare o histórico de partidas entre dois clubes do Brasileirão."/>
    <form className="head-to-head-filters card" method="get" action="/confrontos">
      <TeamSelect name="mandante" label="Mandante" teams={clubs} value={selectedHome} onChange={id=>{setSelectedHome(id);if(id===selectedAway)setSelectedAway('')}} autoSubmit excludeIds={selectedAway?[selectedAway]:[]}/>
      <TeamSelect name="visitante" label="Visitante" teams={clubs} value={selectedAway} onChange={setSelectedAway} autoSubmit excludeIds={selectedHome?[selectedHome]:[]}/>
      <StyledSelect name="recorte" label="Recorte do mando" value={mode} onChange={()=>window.requestAnimationFrame(()=>document.querySelector<HTMLFormElement>('.head-to-head-filters')?.requestSubmit())} options={[{value:'all',label:'Todos os confrontos'},{value:'home',label:`${homeName} como mandante`,disabled:!ready},{value:'away',label:`${awayName} como mandante`,disabled:!ready}]}/>
    </form>
    {!ready?<div className="empty">Selecione o mandante e o visitante para consultar o histórico entre eles.</div>:<>
      <div className="head-to-head-title"><div><h2>{homeName} <span>x</span> {awayName}</h2><p className="caption">{modeLabel} · partidas finalizadas</p></div><span className="caption">{totals.played} {totals.played===1?'partida':'partidas'}</span></div>
      <section className="head-to-head-summary" aria-label="Resumo do confronto" style={{'--home-team':homeColor.startsWith('#')||homeColor.startsWith('var(')?homeColor:`#${homeColor}`,'--away-team':awayColor.startsWith('#')||awayColor.startsWith('var(')?awayColor:`#${awayColor}`} as CSSProperties}>
        <article className="head-to-head-stat is-home"><span>Vitórias · {homeName}</span><strong>{totals.homeWins}</strong></article>
        <article className="head-to-head-stat is-draw"><span>Empates</span><strong>{totals.draws}</strong></article>
        <article className="head-to-head-stat is-away"><span>Vitórias · {awayName}</span><strong>{totals.awayWins}</strong></article>
        <article className="head-to-head-stat head-to-head-goals"><span>Gols no confronto</span><div><strong>{totals.homeGoals}</strong><i>–</i><strong>{totals.awayGoals}</strong></div><small><b>{homeName}</b><i>—</i><b>{awayName}</b></small></article>
      </section>
      <section className="section head-to-head-results"><div className="section-heading-row"><div><h2>Partidas do confronto</h2><p className="caption">Da mais recente à mais antiga.</p></div></div>{rows.length?<MatchTable matches={rows}/>:<div className="empty">Não há partidas finalizadas para este recorte.</div>}</section>
    </>}
  </>;
}

export const getServerSideProps:GetServerSideProps<MeetingPageProps>=async({query})=>{
  const clubs=gold('teams').map((club:Row)=>({id:String(club.canonical_team_id),name:String(club.canonical_team_name||club.name||club.canonical_team_id),color:club.color==null?null:String(club.color)})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  const requested=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]||'':value||'';
  const clubIds=new Set(clubs.map(club=>club.id));
  const rawHome=requested(query.mandante),rawAway=requested(query.visitante);
  const homeId=clubIds.has(rawHome)?rawHome:'';
  const awayId=clubIds.has(rawAway)&&rawAway!==homeId?rawAway:'';
  const modeValue=requested(query.recorte),mode:MeetingPageProps['mode']=modeValue==='home'||modeValue==='away'?modeValue:'all';
  const homeName=clubs.find(club=>club.id===homeId)?.name||'Mandante';
  const awayName=clubs.find(club=>club.id===awayId)?.name||'Visitante';
  const meetings:Row[]=homeId&&awayId?matches().filter(match=>{
    if(!isFinished(match)||match.home_score==null||match.away_score==null)return false;
    const isHome=String(match.canonical_home_team_id)===homeId&&String(match.canonical_away_team_id)===awayId;
    const isAway=String(match.canonical_home_team_id)===awayId&&String(match.canonical_away_team_id)===homeId;
    return mode==='home'?isHome:mode==='away'?isAway:isHome||isAway;
  }).sort((a,b)=>{
    const dateA=Date.parse(String(a.kickoff_utc||a.kickoff_date||'')),dateB=Date.parse(String(b.kickoff_utc||b.kickoff_date||''));
    if(Number.isFinite(dateA)&&Number.isFinite(dateB)&&dateA!==dateB)return dateB-dateA;
    return Number(b.season)-Number(a.season)||Number(b.round)-Number(a.round);
  }):[];
  const totals=meetings.reduce<MeetingPageProps['totals']>((sum,match)=>{
    const homeGoals=Number(match.home_score),awayGoals=Number(match.away_score),homeIsSelected=String(match.canonical_home_team_id)===homeId;
    const selectedGoals=homeIsSelected?homeGoals:awayGoals,opponentGoals=homeIsSelected?awayGoals:homeGoals;
    sum.homeGoals+=selectedGoals;sum.awayGoals+=opponentGoals;sum.played++;
    if(selectedGoals>opponentGoals)sum.homeWins++;else if(selectedGoals<opponentGoals)sum.awayWins++;else sum.draws++;
    return sum;
  },{played:0,homeWins:0,draws:0,awayWins:0,homeGoals:0,awayGoals:0});
  return {props:{clubs,homeId,awayId,mode,homeName,awayName,rows:meetings,totals}};
};
