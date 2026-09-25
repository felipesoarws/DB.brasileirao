import {useEffect,useMemo,useRef,useState} from 'react';
import Link from './Link';
import type {Row} from './ui';
import {StandingsTable,Team} from './ui';

type Match=Row;
type Prediction={home:string;away:string};
type Predictions=Record<string,Prediction>;
type ScoreSide='home'|'away';

const storageKey=(season:string)=>`brasileirao-db:standings-simulation:v1:${season}`;
const isFinished=(match:Match)=>['finished','final','ft','status_final'].includes(String(match.status||'').toLowerCase());
const hasOfficialScore=(match:Match)=>isFinished(match)&&match.home_score!=null&&match.away_score!=null;
const isCancelled=(match:Match)=>['cancelled','canceled','abandoned','void'].includes(String(match.status||'').toLowerCase());
const isNotStarted=(match:Match)=>{
  if(hasOfficialScore(match)||isCancelled(match))return false;
  const status=String(match.status||'').toLowerCase().replace(/[ -]/g,'_');
  if(['live','in_progress','inprogress','1h','ht','half_time','paused'].includes(status))return false;
  if(['scheduled','not_started','upcoming','fixture','pending','postponed','status_scheduled','status_not_started','ns'].includes(status))return true;
  const kickoff=Number(match.kickoff_order);
  return Number.isFinite(kickoff)&&kickoff>Date.now();
};
const matchId=(match:Match)=>String(match.canonical_match_id||match.match_id||'');
const scoreValue=(value:unknown)=>{
  const text=String(value??'');
  return /^\d{1,2}$/.test(text)&&Number(text)<=99?Number(text):null;
};
const cleanInput=(value:string)=>value.replace(/\D/g,'').slice(0,2);
const teamAbbreviation=(name:string)=>name.trim().slice(0,3).toLocaleUpperCase('pt-BR');
const matchDay=(match:Match)=>{
  const raw=String(match.kickoff_utc||match.kickoff_date||'');
  if(!raw)return 'Data a definir';
  const value=match.kickoff_precision==='date'&&/^\d{4}-\d{2}-\d{2}$/.test(raw)?`${raw}T12:00:00Z`:raw;
  const date=new Date(value),options={timeZone:'America/Sao_Paulo'};
  if(Number.isNaN(date.getTime()))return 'Data a definir';
  const weekday=date.toLocaleDateString('pt-BR',{...options,weekday:'short'});
  const day=date.toLocaleDateString('pt-BR',{...options,day:'2-digit',month:'2-digit'});
  const time=match.kickoff_precision==='date'?'':date.toLocaleTimeString('pt-BR',{...options,hour:'2-digit',minute:'2-digit'});
  return `${weekday} · ${day}${time?` · ${time}`:''}`;
};

function readSavedPredictions(key:string,allowedIds:Set<string>):Predictions{
  try{
    const stored=localStorage.getItem(key);
    if(!stored)return {};
    const parsed=JSON.parse(stored);
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {};
    const clean:Predictions={};
    for(const [id,value] of Object.entries(parsed)){
      if(!allowedIds.has(id)||!value||typeof value!=='object')continue;
      const prediction=value as Partial<Prediction>;
      const home=cleanInput(String(prediction.home??'')),away=cleanInput(String(prediction.away??''));
      if(home||away)clean[id]={home,away};
    }
    return clean;
  }catch{return {};}
}

function persistPredictions(key:string,predictions:Predictions){
  try{localStorage.setItem(key,JSON.stringify(predictions));}catch{}
}

function simulatedStandings(table:Row[],matches:Match[],predictions:Predictions):Row[]{
  const rows=new Map<string,Row>();
  for(const row of table){
    const id=String(row.canonical_team_id||row.team_id||'');
    if(!id)continue;
    rows.set(id,{...row,canonical_team_id:id,played:Number(row.played)||0,points:Number(row.points)||0,wins:Number(row.wins??row.won)||0,draws:Number(row.draws??row.drawn)||0,losses:Number(row.losses??row.lost)||0,goals_for:Number(row.goals_for??row.gf)||0,goals_against:Number(row.goals_against??row.ga)||0,form:[]});
  }
  const formByTeam=new Map<string,Row[]>();
  const matchesWithScores=matches.flatMap(match=>{
    const id=matchId(match),actual=hasOfficialScore(match);
    const prediction=predictions[id];
    const homeGoals=actual?Number(match.home_score):scoreValue(prediction?.home);
    const awayGoals=actual?Number(match.away_score):scoreValue(prediction?.away);
    if(!id||isCancelled(match)||homeGoals==null||awayGoals==null)return [];
    return [{match,homeGoals,awayGoals,simulated:!actual}];
  }).sort((a,b)=>{
    const dateA=Number(a.match.kickoff_order),dateB=Number(b.match.kickoff_order);
    if(Number.isFinite(dateA)&&Number.isFinite(dateB)&&dateA!==dateB)return dateA-dateB;
    return Number(a.match.round||0)-Number(b.match.round||0)||matchId(a.match).localeCompare(matchId(b.match));
  });

  for(const {match,homeGoals,awayGoals,simulated} of matchesWithScores){
    const homeId=String(match.canonical_home_team_id||''),awayId=String(match.canonical_away_team_id||'');
    if(!homeId||!awayId)continue;
    const homeName=String(rows.get(homeId)?.team_name||homeId);
    const awayName=String(rows.get(awayId)?.team_name||awayId);
    const addForm=(id:string,result:string,home:number,away:number)=>{
      const entries=formByTeam.get(id)||[];
      entries.push({result,home:homeName,away:awayName,homeId,awayId,score:`${home}–${away}`,round:match.round??null,matchId:matchId(match),simulated});
      formByTeam.set(id,entries);
    };
    addForm(homeId,homeGoals>awayGoals?'V':homeGoals<awayGoals?'D':'E',homeGoals,awayGoals);
    addForm(awayId,awayGoals>homeGoals?'V':awayGoals<homeGoals?'D':'E',homeGoals,awayGoals);
    if(!simulated)continue;

    const home=rows.get(homeId)||{canonical_team_id:homeId,team_name:homeName,team:null,played:0,points:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0};
    const away=rows.get(awayId)||{canonical_team_id:awayId,team_name:awayName,team:null,played:0,points:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0};
    home.played++;away.played++;
    home.goals_for+=homeGoals;home.goals_against+=awayGoals;away.goals_for+=awayGoals;away.goals_against+=homeGoals;
    if(homeGoals>awayGoals){home.wins++;home.points+=3;away.losses++;}
    else if(homeGoals<awayGoals){away.wins++;away.points+=3;home.losses++;}
    else{home.draws++;away.draws++;home.points++;away.points++;}
    rows.set(homeId,home);rows.set(awayId,away);
  }

  const ranked:Row[]=[...rows.values()].map(row=>({...row,goal_difference:row.goals_for-row.goals_against,form:(formByTeam.get(String(row.canonical_team_id))||[]).slice(-5).reverse()}));
  return ranked
    .sort((a,b)=>b.points-a.points||b.goal_difference-a.goal_difference||b.goals_for-a.goals_for||String(a.team_name||'').localeCompare(String(b.team_name||''),'pt-BR'))
    .map((row,index)=>({...row,position:index+1}));
}

export default function SeasonSimulation({season,matches,table}:{season:string;matches:Match[];table:Row[]}){
  const key=storageKey(season);
  const rounds=useMemo(()=>[...new Set(matches.map(match=>Number(match.round)).filter(round=>Number.isFinite(round)&&round>0))].sort((a,b)=>a-b),[matches]);
  const currentRound=useMemo(()=>rounds.find(round=>matches.some(match=>Number(match.round)===round&&!hasOfficialScore(match)&&!isCancelled(match)))??rounds.at(-1)??1,[rounds,matches]);
  const [selectedRound,setSelectedRound]=useState(currentRound);
  useEffect(()=>setSelectedRound(currentRound),[currentRound]);
  const roundMatches=useMemo(()=>matches.filter(match=>Number(match.round)===selectedRound&&!isCancelled(match)),[matches,selectedRound]);
  const pendingMatches=useMemo(()=>matches.filter(match=>!hasOfficialScore(match)&&!isCancelled(match)),[matches]);
  const allowedIds=useMemo(()=>new Set(pendingMatches.map(matchId)),[pendingMatches]);
  const [predictions,setPredictions]=useState<Predictions>({});
  const [ready,setReady]=useState(false);
  const [focusedMatchTeams,setFocusedMatchTeams]=useState<string[]|null>(null);

  useEffect(()=>{
    const load=()=>readSavedPredictions(key,allowedIds);
    const saved=load();
    setPredictions(saved);
    persistPredictions(key,saved);
    setReady(true);
    const syncFromAnotherTab=(event:StorageEvent)=>{
      if(event.key===key||event.key===null)setPredictions(load());
    };
    window.addEventListener('storage',syncFromAnotherTab);
    return ()=>window.removeEventListener('storage',syncFromAnotherTab);
  },[key,allowedIds]);

  const teamNames=useMemo(()=>new Map(table.map(row=>[String(row.canonical_team_id||row.team_id||''),String(row.team_name||row.canonical_team_id||row.team_id||'')])),[table]);
  const simulatedTable=useMemo(()=>simulatedStandings(table,matches,predictions),[table,matches,predictions]);
  const previousPositions=useRef<Map<string,number>|null>(null);
  const [rankChanges,setRankChanges]=useState<Record<string,number>>({});
  useEffect(()=>{
    const current=new Map(simulatedTable.map(row=>[String(row.canonical_team_id),Number(row.position)]));
    if(previousPositions.current){
      const changes:Record<string,number>={};
      for(const [id,position] of current){
        const previous=previousPositions.current.get(id);
        if(previous!=null&&previous!==position)changes[id]=previous-position;
      }
      setRankChanges(changes);
    }
    previousPositions.current=current;
  },[simulatedTable]);
  const standingsWithMovement=useMemo(()=>simulatedTable.map(row=>({...row,simulationMovement:rankChanges[String(row.canonical_team_id)]||0,simulationMatchFocused:focusedMatchTeams?.includes(String(row.canonical_team_id))||false})),[simulatedTable,rankChanges,focusedMatchTeams]);
  const topTen=standingsWithMovement.slice(0,10);
  const remainingTeams=standingsWithMovement.slice(10);
  const completedInRound=roundMatches.filter(hasOfficialScore).length;
  const roundComplete=roundMatches.length>0&&completedInRound===roundMatches.length;
  const roundIndex=rounds.indexOf(selectedRound);

  const updateScore=(id:string,side:ScoreSide,value:string)=>{
    const updated={...(predictions[id]||{home:'',away:''}),[side]:cleanInput(value)};
    const next={...predictions};
    if(!updated.home&&!updated.away)delete next[id];
    else next[id]=updated;
    setPredictions(next);
    persistPredictions(key,next);
  };
  const clearPredictions=()=>{
    setPredictions({});
    persistPredictions(key,{});
  };
  return <div className="season-simulation section">
    <div className="season-simulation-layout">
    <section className="card season-simulation-standings season-simulation-top-ten" aria-label="Top 10 da classificação">
      <StandingsTable rows={topTen} compactColumns/>
    </section>

    <section className="card season-simulation-standings season-simulation-remaining" aria-label="Classificação do 11º até o último colocado">
      <StandingsTable rows={remainingTeams} compactColumns/>
    </section>

    <section className="card season-simulation-standings season-simulation-mobile-standings" aria-label="Classificação completa">
      <StandingsTable rows={standingsWithMovement} compactColumns/>
    </section>

    <section aria-label="Placares por rodada" className={`card season-simulation-fixtures${roundComplete?' is-round-complete':' is-round-incomplete'}`}>
      <div className="season-simulation-round-nav" aria-label="Navegação entre rodadas">
        <button type="button" className="season-round-arrow" disabled={roundIndex<=0} onClick={()=>setSelectedRound(rounds[roundIndex-1])} aria-label="Voltar uma rodada">←</button>
        <div><strong>Rodada {selectedRound}</strong><span className={`season-simulation-round-state${roundComplete?' is-complete':''}`}>{roundComplete?'Completa':`Incompleta · ${completedInRound}/${roundMatches.length} finalizadas`}</span></div>
        <button type="button" className="season-round-arrow" disabled={roundIndex<0||roundIndex>=rounds.length-1} onClick={()=>setSelectedRound(rounds[roundIndex+1])} aria-label="Avançar uma rodada">→</button>
      </div>
      {roundMatches.length?<div className="season-simulation-match-list">{roundMatches.map(match=>{
        const id=matchId(match),finished=hasOfficialScore(match),upcoming=isNotStarted(match),prediction=predictions[id]||{home:'',away:''},homeId=String(match.canonical_home_team_id||''),awayId=String(match.canonical_away_team_id||''),isComplete=scoreValue(prediction.home)!=null&&scoreValue(prediction.away)!=null;
        return <article className={`season-simulation-match${finished?' is-finished':''}${upcoming?' is-upcoming':''}${!finished&&!isComplete?' is-unpredicted':''}`} key={id}>
          <Team id={homeId} name={teamNames.get(homeId)||'Mandante'} shortNameOverride={teamAbbreviation(teamNames.get(homeId)||'Mandante')}/>
          <div className="season-simulation-score" aria-label={finished?'Placar final':isComplete?'Placar previsto completo':'Preencha o placar previsto'}>
            <time className="season-simulation-match-date" dateTime={String(match.kickoff_utc||match.kickoff_date||'')||undefined}>{matchDay(match)}</time>
            {finished?<Link href={`/partidas/${encodeURIComponent(id)}`} className="season-simulation-finished-score" aria-label={`Abrir detalhes de ${teamNames.get(homeId)||'Mandante'} ${match.home_score} a ${match.away_score} ${teamNames.get(awayId)||'Visitante'}`}><strong className="season-simulation-score-value numeric">{match.home_score}</strong><span>—</span><strong className="season-simulation-score-value numeric">{match.away_score}</strong></Link>:<><input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={prediction.home} disabled={!ready} aria-label={`${match.canonical_home_team_name||'Mandante'} gols previstos`} onFocus={()=>setFocusedMatchTeams([homeId,awayId])} onBlur={event=>{if(!event.currentTarget.parentElement?.contains(event.relatedTarget as Node|null))setFocusedMatchTeams(null);}} onChange={event=>updateScore(id,'home',event.target.value)} /><span>—</span><input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={prediction.away} disabled={!ready} aria-label={`${match.canonical_away_team_name||'Visitante'} gols previstos`} onFocus={()=>setFocusedMatchTeams([homeId,awayId])} onBlur={event=>{if(!event.currentTarget.parentElement?.contains(event.relatedTarget as Node|null))setFocusedMatchTeams(null);}} onChange={event=>updateScore(id,'away',event.target.value)} /></>}
          </div>
          <Team reverse id={awayId} name={teamNames.get(awayId)||'Visitante'} shortNameOverride={teamAbbreviation(teamNames.get(awayId)||'Visitante')}/>
        </article>;
      })}</div>:<div className="empty">Não há partidas nesta rodada para simular.</div>}
    </section>
    </div>
    <div className="season-simulation-methodology"><button type="button" className="btn season-simulation-clear" onClick={clearPredictions} disabled={Object.keys(predictions).length===0}>Limpar placares</button><p className="season-simulation-footnote">Empates ordenados por pontos, saldo de gols, gols pró e nome do clube. Previsões ficam neste dispositivo até a base publicar o placar oficial.</p></div>
  </div>;
}
