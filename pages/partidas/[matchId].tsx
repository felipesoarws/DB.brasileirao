import type {GetServerSideProps} from 'next';
import {Header,Status,Team} from '../../components/ui';

export default function Match({m,goals,timeline,lineups,stats,odds}:any){
  if(!m)return <><Header title="Partida não encontrada"/><div className="empty">A partida solicitada não está publicada na Gold.</div></>;
  const done=String(m.status).toLowerCase()==='finished';
  const teamFor=(id:string)=>id===m.canonical_home_team_id?m.home:m.away;
  return <>
    <Header title={done?'Detalhe da partida':'Prévia da partida'} desc={`ID canônico · ${m.canonical_match_id}`} meta={m.canonical_match_id}/>
    <section className="card match-detail-hero">
      <p className="caption center">{m.competition||'Brasileirão'} {m.season} · Rodada {m.round??'—'}<br/>{m.kickoff_utc||m.kickoff_date||'TBD'} · <Status status={m.status}/></p>
      <div className="match-detail-score"><Team id={String(m.canonical_home_team_id)} name={m.canonical_home_team_name} color={m.home?.color}/><strong className="numeric">{done&&m.home_score!=null?`${m.home_score} — ${m.away_score}`:'—'}</strong><Team reverse id={String(m.canonical_away_team_id)} name={m.canonical_away_team_name} color={m.away?.color}/></div>
    </section>
    {stats.length>0?<section className="section card"><h2>Resumo estatístico</h2>{stats.slice(0,12).map((s:any,i:number)=><p key={i} className="caption"><b>{s.home_value??'—'}</b> · {s.statistic_name||s.statistic_key} · <b>{s.away_value??'—'}</b></p>)}</section>:null}
    {odds.length>0?<section className="section card"><h2>Odds</h2><p className="caption">Casa {odds[0].odds_home??'—'} · Empate {odds[0].odds_draw??'—'} · Fora {odds[0].odds_away??'—'}</p></section>:null}
    {timeline.length>0?<section className="section"><h2>Timeline</h2><div className="card">{timeline.slice(0,80).map((e:any,i:number)=><p className="caption" key={i}><span className="mono">{e.minute!=null?`${e.minute}'`:'—'}</span> &nbsp; {e.text||e.event_type||'Evento'}</p>)}</div></section>:null}
    {goals.length>0?<section className="section"><h2>Gols</h2><div className="card">{goals.map((g:any,i:number)=><p key={i}>{g.minute}' · {g.player_name||'Autor indisponível'}</p>)}</div></section>:null}
    {lineups.length>0?<section className="section"><h2>Escalações</h2><div className="grid2">{[m.canonical_home_team_id,m.canonical_away_team_id].map((id:string)=>{const t=teamFor(id);return <div className="card" key={id}><h3><Team id={String(id)} name={t?.canonical_team_name||(id===m.canonical_home_team_id?m.canonical_home_team_name:m.canonical_away_team_name)} color={t?.color}/></h3>{lineups.filter((l:any)=>l.canonical_team_id===id).map((l:any,i:number)=><p key={i} className="caption">{l.shirt_number??'—'} · {l.player_name} · {l.position||'—'}</p>)}</div>})}</div></section>:null}
    <section className="section"><h2>Metadados</h2><div className="card mono caption">canonical_match_id: {m.canonical_match_id}<br/>status: {m.status||'—'}<br/>sources_count: {m.sources_count??'—'}</div></section>
  </>
}
export const getServerSideProps:GetServerSideProps=async({params})=>{const {match,related}=await import('../../lib/data/queries');const id=String(params?.matchId);return {props:{m:match(id),goals:related('goals',id),timeline:related('match_timeline',id),lineups:related('lineups',id),stats:related('statistics_by_period',id),odds:related('odds',id)}}};
