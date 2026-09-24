import type {GetServerSideProps} from 'next';
import {useState} from 'react';
import {Header,Status,Team} from '../../components/ui';
import type {Row} from '../../lib/data/gold';

type MatchEvent={teamId:string;teamName:string;minute:number|null;addedTime:number;kind:'goal'|'card';playerName:string;assistName:string|null;card:string|null;ownGoal:boolean;penalty:boolean};
type MatchStat={key:string;homeValue:number|string|null;awayValue:number|string|null};
type StatPeriod={key:string;label:string;stats:MatchStat[]};
type MatchPlayer={id:string;name:string;position:string|null;shirtNumber:number|null;starter:boolean};
type LineupTeam={id:string;name:string;color:string|null;starters:MatchPlayer[];reserves:MatchPlayer[]};
type MatchOdd={provider:string;market:string;selection:string;price:number;collectedAt:string};
type MatchPageProps={match:Row|null;events:MatchEvent[];lineups:LineupTeam[];statPeriods:StatPeriod[];odds:MatchOdd[];oddsCapturedAt:string|null;preKickoffOdds:number};

const statLabels:Record<string,string>={
  possession:'Posse de bola',total_shots:'Finalizações',shots_on_target:'Chutes no gol',shots_off_target:'Finalizações para fora',blockedShots:'Finalizações bloqueadas',shotPct:'Precisão das finalizações',
  corners:'Escanteios',offsides:'Impedimentos',penaltyKickGoals:'Gols de pênalti',penaltyKickShots:'Pênaltis cobrados',
  passes:'Passes tentados',accuratePasses:'Passes certos',pass_accuracy:'Precisão dos passes',totalCrosses:'Cruzamentos',accurateCrosses:'Cruzamentos certos',crossPct:'Precisão dos cruzamentos',totalLongBalls:'Bolas longas',accurateLongBalls:'Bolas longas certas',longballPct:'Precisão das bolas longas',
  saves:'Defesas do goleiro',effectiveTackles:'Desarmes certos',totalTackles:'Desarmes tentados',tacklePct:'Precisão dos desarmes',interceptions:'Interceptações',effectiveClearance:'Cortes eficazes',totalClearance:'Cortes',
  fouls:'Faltas cometidas',yellow_cards:'Cartões amarelos',red_cards:'Cartões vermelhos'
};
const statCategories=[
  {key:'attack',label:'Ataque',stats:['total_shots','shots_on_target','shots_off_target','blockedShots','shotPct','penaltyKickGoals','penaltyKickShots','corners','offsides']},
  {key:'possession',label:'Posse e passes',stats:['possession','passes','accuratePasses','pass_accuracy','totalCrosses','accurateCrosses','crossPct','totalLongBalls','accurateLongBalls','longballPct']},
  {key:'defense',label:'Defesa',stats:['saves','effectiveTackles','totalTackles','tacklePct','interceptions','effectiveClearance','totalClearance']},
  {key:'discipline',label:'Disciplina',stats:['fouls','yellow_cards','red_cards']}
];
const percentStats=new Set(['shotPct','pass_accuracy','crossPct','longballPct','tacklePct']);
const positionLabels:Record<string,string>={G:'Goleiro',CD:'Zagueiro',CD_L:'Zagueiro',CD_R:'Zagueiro',LB:'Lateral esquerdo',RB:'Lateral direito',DM:'Volante',CM:'Meio-campista',AM:'Meia ofensivo',LW:'Ponta esquerda',RW:'Ponta direita',CF:'Atacante',F:'Atacante'};
const formatMinute=(minute:number|null,addedTime:number)=>minute==null?'—':`${minute}${addedTime>0?`+${addedTime}`:''}′`;
const formatStat=(stat:MatchStat,key:string,side:'homeValue'|'awayValue')=>{
  const value=stat[side];
  if(value==null||value==='')return '—';
  const numeric=Number(value);
  if(!Number.isFinite(numeric))return String(value);
  if(key==='possession')return `${numeric.toFixed(1)}%`;
  if(percentStats.has(key))return `${Math.round(numeric*100)}%`;
  return Number.isInteger(numeric)?String(numeric):numeric.toFixed(1);
};

function MatchStats({periods,homeId,awayId,homeName,awayName}:{periods:StatPeriod[];homeId:string;awayId:string;homeName:string;awayName:string}){
  const available=periods.filter(period=>period.key==='summary'||period.key==='first_half'||period.key==='second_half');
  const [activeKey,setActiveKey]=useState(available.some(period=>period.key==='summary')?'summary':available[0]?.key||'summary');
  const period=available.find(item=>item.key===activeKey)||available[0];
  if(!period)return null;
  const values=new Map(period.stats.map(stat=>[stat.key,stat]));
  const statColumns=[['attack','defense'],['possession','discipline']];
  return <section className="match-detail-section card match-stats-section"><div className="match-section-heading"><div><span className="match-section-kicker">COMPARATIVO</span><h2>Estatísticas da partida</h2></div></div>
    <div className="match-stat-tabs" role="tablist" aria-label="Período das estatísticas">{available.map(item=><button type="button" role="tab" aria-selected={activeKey===item.key} className={activeKey===item.key?'is-active':''} key={item.key} onClick={()=>setActiveKey(item.key)}>{item.key==='summary'?'Jogo':item.label}</button>)}</div>
    <div className="match-stat-panel tab-content-transition" key={activeKey}>
    <div className="match-stat-legend"><span><img src={`/api/team-logo/${encodeURIComponent(homeId)}`} alt=""/>{homeName}</span><span><img src={`/api/team-logo/${encodeURIComponent(awayId)}`} alt=""/>{awayName}</span></div>
    <div className="match-stat-columns" role="tabpanel">{statColumns.map((column,index)=><div className="match-stat-column" key={`stats-column-${index}`}>
      {column.map(categoryKey=>{
        const category=statCategories.find(item=>item.key===categoryKey);
        if(!category)return null;
        const rows=category.stats.map(key=>values.get(key)).filter((value):value is MatchStat=>Boolean(value));
        if(!rows.length)return null;
        return <section className="match-stat-category" key={category.key}><h3>{category.label}</h3>{rows.map(stat=>{
          const home=Number(stat.homeValue)||0,away=Number(stat.awayValue)||0,total=home+away,homeShare=total?home/total*100:50,awayShare=total?away/total*100:50;
          return <div className="match-stat-row" key={stat.key}><div className="match-stat-values"><strong>{formatStat(stat,stat.key,'homeValue')}</strong><span>{statLabels[stat.key]||stat.key}</span><strong>{formatStat(stat,stat.key,'awayValue')}</strong></div><div className="match-stat-meter" aria-hidden="true"><i style={{width:`${homeShare}%`}}/><i style={{width:`${awayShare}%`}}/></div></div>;
        })}</section>;
      })}
    </div>)}</div>
    </div>
  </section>;
}

function MatchTimeline({events,homeId,awayId,homeName,awayName}:{events:MatchEvent[];homeId:string;awayId:string;homeName:string;awayName:string}){
  const timedEvents=events.filter(event=>event.minute!==null);
  if(!timedEvents.length)return null;
  return <section className="match-detail-section card" aria-labelledby="match-timeline-title">
    <div className="match-section-heading"><div><span className="match-section-kicker">LANCES-CHAVE</span><h2 id="match-timeline-title">Gols e cartões</h2></div></div>
    <div className="match-timeline-teams" aria-label="Times da partida"><span><img src={`/api/team-logo/${encodeURIComponent(homeId)}`} alt=""/>{homeName}</span><span><img src={`/api/team-logo/${encodeURIComponent(awayId)}`} alt=""/>{awayName}</span></div>
    <ol className="match-timeline-vertical" aria-label="Lances em ordem cronológica">{timedEvents.map((event,index)=>{
      const icon=event.kind==='goal'?'⚽':event.card==='red'?'🟥':'🟨';
      const isAway=event.teamId===awayId;
      const eventContent=<span className="match-timeline-event"><strong>{event.kind==='goal'?(event.ownGoal?'Gol contra':'Gol'):event.card==='red'?'Cartão vermelho':'Cartão amarelo'}</strong><small>{event.playerName}</small>{event.assistName&&<small className="match-timeline-assist">Assistência: {event.assistName}</small>}{event.penalty&&<small className="match-timeline-assist">Pênalti</small>}</span>;
      return <li className={`match-timeline-item${isAway?' is-away':''}`} key={`${event.kind}-${event.teamId}-${event.minute}-${event.addedTime}-${event.playerName}-${index}`}><span className="match-timeline-side-event is-home-event">{!isAway&&eventContent}</span><span className="match-timeline-middle"><time>{formatMinute(event.minute,event.addedTime)}</time><i aria-hidden="true">{icon}</i></span><span className="match-timeline-side-event is-away-event">{isAway&&eventContent}</span></li>;
    })}</ol>
  </section>;
}

function OddsPanel({odds,oddsCapturedAt,preKickoffOdds}:{odds:MatchOdd[];oddsCapturedAt:string|null;preKickoffOdds:number}){
  if(!odds.length)return null;
  const grouped=new Map<string,MatchOdd[]>();
  for(const odd of odds){const key=`${odd.provider}|${odd.market}`;grouped.set(key,[...(grouped.get(key)||[]),odd]);}
  const marketName=(market:string)=>market==='moneyline'||market==='1x2'?'Resultado':market.startsWith('total_')?`Total de gols ${market.slice(6)}`:market==='btts'?'Ambos marcam':market.replaceAll('_',' ');
  const selectionName=(selection:string)=>({home:'Mandante',away:'Visitante',draw:'Empate',over:'Acima',under:'Abaixo',yes:'Sim',no:'Não'}[selection]||selection);
  const collectionDate=oddsCapturedAt?new Date(oddsCapturedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'data indisponível';
  return <section className="match-detail-section match-odds-section card"><div className="match-section-heading"><div><span className="match-section-kicker">MERCADO</span><h2>Cotações</h2></div></div><p className="match-data-note">Não há coleta anterior ao início desta partida ({preKickoffOdds} registros pré-jogo). Valores abaixo são snapshots posteriores; última coleta: {collectionDate}.</p><p className="match-betting-notice"><strong>Aviso:</strong> apostar não é investimento. Apostas envolvem riscos e podem causar perdas financeiras.</p><div className="match-odds-grid">{[...grouped.entries()].map(([key,items])=>{const [,market]=key.split('|');return <article className="match-odd-market" key={key}><h3>{marketName(market)}</h3><div>{items.map(item=><p key={`${item.selection}-${item.collectedAt}`}><span>{selectionName(item.selection)}</span><strong>{item.price.toFixed(2)}</strong></p>)}</div></article>})}</div></section>;
}

export default function MatchDetailPage({match,events,lineups,statPeriods,odds,oddsCapturedAt,preKickoffOdds}:MatchPageProps){
  if(!match)return <><Header title="Partida não encontrada"/><div className="empty">A partida solicitada não está publicada na Gold.</div></>;
  const done=['finished','final','ft','status_final'].includes(String(match.status).toLowerCase()),homeName=String(match.canonical_home_team_name||match.home?.name||'Mandante'),awayName=String(match.canonical_away_team_name||match.away?.name||'Visitante'),competitionName=String(match.competition||'').toUpperCase()==='BRA_SERIE_A'?'Brasileirão':String(match.competition||'Brasileirão');
  const browserTitle=`${homeName} x ${awayName} — Rodada ${match.round??'—'} — Brasileirão ${match.season}`;
  const dateValue=match.kickoff_utc||match.kickoff_date;
  const matchDate=dateValue?new Date(dateValue).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'long',year:'numeric'}):'Data a definir';
  const matchTime=dateValue&&match.kickoff_precision!=='date'?new Date(dateValue).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}):null;
  const onlyDateAndVenue=Boolean(match.venue)&&!match.referee&&match.attendance==null;
  return <div className="match-detail-page">
    <Header title={done?'Detalhe da partida':'Prévia da partida'} browserTitle={browserTitle} desc={`${competitionName} ${match.season} · Rodada ${match.round??'—'}`} meta={`Partida ${match.canonical_match_id}`}/>
    <section className="match-detail-hero card" aria-label="Placar e informações da partida">
      <div className="match-detail-topline"><span>{competitionName} <i/> Temporada {match.season} <i/> Rodada {match.round??'—'}</span><Status status={match.status}/></div>
      <div className="match-detail-scoreline"><Team id={String(match.canonical_home_team_id)} name={homeName} color={match.home?.color}/><div className="match-score-center"><strong className="numeric">{done&&match.home_score!=null?`${match.home_score} — ${match.away_score}`:'—'}</strong>{done&&match.home_score_ht!=null&&match.away_score_ht!=null&&<span>Intervalo {match.home_score_ht} — {match.away_score_ht}</span>}</div><Team reverse id={String(match.canonical_away_team_id)} name={awayName} color={match.away?.color}/></div>
      <div className={`match-detail-facts${match.attendance==null?' is-without-attendance':''}${onlyDateAndVenue?' is-date-venue-only':''}`}><span><small>DATA</small><strong>{matchDate}{matchTime?` · ${matchTime}`:''}</strong></span>{match.venue&&<span><small>ESTÁDIO</small><strong>{match.venue}</strong></span>}{match.referee&&<span><small>ÁRBITRO</small><strong>{match.referee}</strong></span>}{match.attendance!=null&&<span><small>PÚBLICO</small><strong>{Number(match.attendance).toLocaleString('pt-BR')}</strong></span>}</div>
    </section>

    <div className="match-analysis-grid">
      {statPeriods.length>0&&<MatchStats periods={statPeriods} homeId={String(match.canonical_home_team_id)} awayId={String(match.canonical_away_team_id)} homeName={homeName} awayName={awayName}/>}
      <MatchTimeline events={events} homeId={String(match.canonical_home_team_id)} awayId={String(match.canonical_away_team_id)} homeName={homeName} awayName={awayName}/>
    </div>

    {lineups.length>0&&<section className="match-detail-section"><div className="match-section-heading"><div><span className="match-section-kicker">FICHA TÉCNICA</span><h2>Escalações</h2></div></div><div className="match-lineup-grid">{lineups.map(team=><article className="match-lineup-card card" key={team.id}><h3><Team id={team.id} name={team.name} color={team.color}/></h3><div className="match-lineup-subheading"><span>Titulares</span><span>{team.starters.length}</span></div><ol className="match-player-list">{team.starters.map(player=><li key={player.id}><span className="match-player-number">{player.shirtNumber??'—'}</span><strong>{player.name}</strong><small>{player.position?(positionLabels[player.position.replaceAll('-','_')]||player.position):'—'}</small></li>)}</ol><div className="match-lineup-subheading match-bench-heading"><span>Reservas relacionados</span><span>{team.reserves.length}</span></div><ol className="match-player-list match-reserve-list">{team.reserves.map(player=><li key={player.id}><span className="match-player-number">{player.shirtNumber??'—'}</span><strong>{player.name}</strong><small>{player.position?(positionLabels[player.position.replaceAll('-','_')]||player.position):'—'}</small></li>)}</ol></article>)}</div></section>}

    <OddsPanel odds={odds} oddsCapturedAt={oddsCapturedAt} preKickoffOdds={preKickoffOdds}/>
  </div>;
}

export const getServerSideProps:GetServerSideProps<MatchPageProps>=async({params})=>{
  const [{gold,teamsMap},{match:getMatch}]=await Promise.all([import('../../lib/data/gold'),import('../../lib/data/queries')]);
  const id=String(params?.matchId||'');
  const match=getMatch(id);
  if(!match)return {props:{match:null,events:[],lineups:[],statPeriods:[],odds:[],oddsCapturedAt:null,preKickoffOdds:0}};
  const players=new Map(gold('players').map(player=>[String(player.canonical_player_id),player]));
  const teamMap=teamsMap();
  const playerName=(playerId:unknown)=>String(players.get(String(playerId))?.name||'Jogador');
  const teamId=(value:unknown)=>String(value||'');
  const teamName=(value:unknown)=>{const team=teamMap.get(teamId(value));return String(team?.canonical_team_name||team?.name||'Clube');};
  const goals=gold('goals').filter(row=>String(row.canonical_match_id)===id).map((row:Row)=>({teamId:teamId(row.team_id),teamName:teamName(row.team_id),minute:row.minute==null?null:Number(row.minute),addedTime:Number(row.added_time)||0,kind:'goal' as const,playerName:playerName(row.player_id),assistName:row.assist_player_id?playerName(row.assist_player_id):null,card:null,ownGoal:Boolean(row.own_goal),penalty:Boolean(row.penalty)}));
  const rawCards=gold('cards').filter(row=>String(row.canonical_match_id)===id).sort((a:Row,b:Row)=>(Number(a.minute)||0)+(Number(a.added_time)||0)/100-((Number(b.minute)||0)+(Number(b.added_time)||0)/100));
  const seenCards=new Set<string>();
  const cards=rawCards.filter((row:Row)=>{const key=`${row.team_id}:${row.player_id}:${row.card}`;if(row.card==='red'&&seenCards.has(key))return false;if(row.card==='red')seenCards.add(key);return true;}).map((row:Row)=>({teamId:teamId(row.team_id),teamName:teamName(row.team_id),minute:row.minute==null?null:Number(row.minute),addedTime:Number(row.added_time)||0,kind:'card' as const,playerName:playerName(row.player_id),assistName:null,card:String(row.card||''),ownGoal:false,penalty:false}));
  const events:MatchEvent[]=[...goals,...cards].sort((a,b)=>(a.minute??0)*100+a.addedTime-((b.minute??0)*100+b.addedTime));
  const lineupRows=gold('lineups').filter(row=>String(row.canonical_match_id)===id&&row.player_id!=null);
  const lineups:LineupTeam[]=[String(match.canonical_home_team_id),String(match.canonical_away_team_id)].map(id=>{
    const team=teamMap.get(id),rows=lineupRows.filter(row=>String(row.team_id)===id).map((row:Row)=>({id:String(row.player_id),name:playerName(row.player_id),position:row.position==null?null:String(row.position),shirtNumber:row.shirt_number==null?null:Number(row.shirt_number),starter:Boolean(row.starter)})).sort((a,b)=>(a.shirtNumber??99)-(b.shirtNumber??99));
    return {id,name:String(team?.canonical_team_name||team?.name||id),color:team?.color==null?null:String(team.color),starters:rows.filter(player=>player.starter),reserves:rows.filter(player=>!player.starter)};
  }).filter(team=>team.starters.length>0||team.reserves.length>0);
  const rawStats=gold('match_statistics').filter(row=>String(row.canonical_match_id)===id&&row.value!=null&&row.value!=='');
  const periodList:[string,string][]=[['summary','Resumo do jogo'],['first_half','1º tempo'],['second_half','2º tempo']];
  const statPeriods:StatPeriod[]=periodList.map(([period,label])=>{
    const rows=rawStats.filter(row=>period==='summary'?row.period==null:row.period===period),byMetric=new Map<string,MatchStat>();
    for(const row of rows){const stat=byMetric.get(String(row.statistic))||{key:String(row.statistic),homeValue:null,awayValue:null};if(String(row.team_id)===String(match.canonical_home_team_id))stat.homeValue=row.value;else if(String(row.team_id)===String(match.canonical_away_team_id))stat.awayValue=row.value;byMetric.set(stat.key,stat);}
    return {key:period,label,stats:[...byMetric.values()]};
  }).filter(period=>period.stats.some(stat=>statCategories.some(category=>category.stats.includes(stat.key))));
  const rawOdds=gold('odds').filter(row=>String(row.canonical_match_id)===id&&row.price!=null&&row.price!==''&&!String(row.provider||'').toLowerCase().replace(/[\s_-]+/g,'').includes('draftkings')).sort((a:Row,b:Row)=>String(a.collected_at).localeCompare(String(b.collected_at)));
  const latestOdds=new Map<string,MatchOdd>();
  for(const row of rawOdds){const odd:MatchOdd={provider:String(row.provider||'Fonte'),market:String(row.market||'mercado'),selection:String(row.selection||''),price:Number(row.price),collectedAt:String(row.collected_at||'')};if(Number.isFinite(odd.price)&&odd.price>0)latestOdds.set(`${odd.provider}|${odd.market}|${odd.selection}`,odd);}
  const odds=[...latestOdds.values()].sort((a,b)=>a.provider.localeCompare(b.provider)||a.market.localeCompare(b.market)||a.selection.localeCompare(b.selection));
  const kickoff=Date.parse(String(match.kickoff_utc||match.kickoff_date||''));
  const preKickoffOdds=Number.isFinite(kickoff)?rawOdds.filter(row=>Date.parse(String(row.collected_at))<=kickoff).length:0;
  const oddsCapturedAt=rawOdds.map(row=>String(row.collected_at||'')).sort().at(-1)||null;
  return {props:{match,events,lineups,statPeriods,odds,oddsCapturedAt,preKickoffOdds}};
};
