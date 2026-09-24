import { by, gold, isFinished, latestSeason, Row, teamsMap } from './gold';

export const matches = () => {
  const clubs=teamsMap();
  return gold('matches').map(m=>enrich(m,clubs));
};
export const match = (id:string) => {
  const raw=gold('matches').find(m=>String(m.canonical_match_id)===id);
  return raw?enrich(raw):null;
};
export const team = (id:string) => gold('teams').find(t=>String(t.canonical_team_id)===id) || null;
export const teamMatches = (id:string) => {
  const clubs=teamsMap();
  return gold('matches').filter(m=>String(m.canonical_home_team_id)===id||String(m.canonical_away_team_id)===id).map(m=>enrich(m,clubs));
};
export const seasonMatches = (s:string) => {
  const clubs=teamsMap();
  return gold('matches').filter(m=>String(m.season)===s).map(m=>enrich(m,clubs));
};

export const standings = (s:string) => {
  const clubs=teamsMap();
  type FormResult={result:string;home:string;away:string;homeId:string;awayId:string;score:string;round:number|string|null;matchId:string};
  const formByTeam=new Map<string,FormResult[]>();
  const formMatches=seasonMatches(s).filter(m=>isFinished(m)&&m.home_score!=null&&m.away_score!=null).sort((a,b)=>Date.parse(a.kickoff_utc||a.kickoff_date||'')-Date.parse(b.kickoff_utc||b.kickoff_date||''));
  const addForm=(id:string,result:string,m:Row,home:number,away:number)=>{const homeTeam=clubs.get(String(m.canonical_home_team_id)),awayTeam=clubs.get(String(m.canonical_away_team_id));const form=formByTeam.get(id)||[];form.push({result,home:m.canonical_home_team_name||homeTeam?.canonical_team_name||homeTeam?.name||'Mandante',away:m.canonical_away_team_name||awayTeam?.canonical_team_name||awayTeam?.name||'Visitante',homeId:String(m.canonical_home_team_id),awayId:String(m.canonical_away_team_id),score:`${home}–${away}`,round:m.round??null,matchId:String(m.canonical_match_id)});formByTeam.set(id,form);};
  for(const m of formMatches){
    const home=Number(m.home_score),away=Number(m.away_score);
    addForm(String(m.canonical_home_team_id),home>away?'V':home<away?'D':'E',m,home,away);
    addForm(String(m.canonical_away_team_id),away>home?'V':away<home?'D':'E',m,home,away);
  }
  for(const [id,form] of formByTeam)formByTeam.set(id,form.slice(-5).reverse());
  const saved=by(gold('season_standings'),'season',s);
  if(saved.length)return saved.sort((a,b)=>(a.position??99)-(b.position??99)).map(r=>{
    const id=String(r.canonical_team_id||r.team_id),club=clubs.get(id);
    return {...r,canonical_team_id:id,team_name:club?.canonical_team_name??club?.name??null,wins:r.wins??r.won,draws:r.draws??r.drawn,losses:r.losses??r.lost,goals_for:r.goals_for??r.gf,goals_against:r.goals_against??r.ga,goal_difference:r.goal_difference??(Number(r.gf)-Number(r.ga)),form:formByTeam.get(id)||[],team:club??null};
  });

  const rows=new Map<string,Row>();
  for(const m of seasonMatches(s)){
    if(!isFinished(m)||m.home_score==null||m.away_score==null)continue;
    const homeId=String(m.canonical_home_team_id),awayId=String(m.canonical_away_team_id),homeGoals=Number(m.home_score),awayGoals=Number(m.away_score);
    const home=rows.get(homeId)||{canonical_team_id:homeId,played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,points:0};
    const away=rows.get(awayId)||{canonical_team_id:awayId,played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,points:0};
    home.played++;away.played++;home.goals_for+=homeGoals;home.goals_against+=awayGoals;away.goals_for+=awayGoals;away.goals_against+=homeGoals;
    if(homeGoals>awayGoals){home.wins++;home.points+=3;away.losses++;}
    else if(homeGoals<awayGoals){away.wins++;away.points+=3;home.losses++;}
    else{home.draws++;away.draws++;home.points++;away.points++;}
    rows.set(homeId,home);rows.set(awayId,away);
  }
  const ranked:Row[]=[...rows.values()].map(r=>{const club=clubs.get(r.canonical_team_id);return {...r,goal_difference:r.goals_for-r.goals_against,team_name:club?.canonical_team_name??club?.name??null,form:formByTeam.get(r.canonical_team_id)||[],team:club??null};});
  return ranked
    .sort((a,b)=>b.points-a.points||b.goal_difference-a.goal_difference||b.goals_for-a.goals_for||(a.team_name||'').localeCompare(b.team_name||''))
    .map((r,i)=>({...r,position:i+1}));
};

export const venueStandings = (s:string,venue:'home'|'away',baseRows:Row[]=standings(s)) => {
  const clubs=teamsMap();
  const rows=new Map<string,Row>();
  const forms=new Map<string,Array<{result:string;home:string;away:string;homeId:string;awayId:string;score:string;round:number|string|null;matchId:string}>>();
  for(const row of baseRows){
    const id=String(row.canonical_team_id||row.team_id);
    rows.set(id,{...row,position:0,played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,goal_difference:0,points:0,form:[]});
  }
  const playedMatches=seasonMatches(s)
    .filter(m=>isFinished(m)&&m.home_score!=null&&m.away_score!=null)
    .sort((a,b)=>Date.parse(a.kickoff_utc||a.kickoff_date||'')-Date.parse(b.kickoff_utc||b.kickoff_date||''));
  for(const match of playedMatches){
    const homeId=String(match.canonical_home_team_id),awayId=String(match.canonical_away_team_id);
    const teamId=venue==='home'?homeId:awayId;
    const team=clubs.get(teamId);
    const row=rows.get(teamId)||{canonical_team_id:teamId,team_name:team?.canonical_team_name??team?.name??null,team:team??null};
    const homeGoals=Number(match.home_score),awayGoals=Number(match.away_score);
    const goalsFor=venue==='home'?homeGoals:awayGoals,goalsAgainst=venue==='home'?awayGoals:homeGoals;
    row.played=(row.played||0)+1;
    row.goals_for=(row.goals_for||0)+goalsFor;
    row.goals_against=(row.goals_against||0)+goalsAgainst;
    if(goalsFor>goalsAgainst){row.wins=(row.wins||0)+1;row.points=(row.points||0)+3;}
    else if(goalsFor<goalsAgainst)row.losses=(row.losses||0)+1;
    else{row.draws=(row.draws||0)+1;row.points=(row.points||0)+1;}
    row.goal_difference=row.goals_for-row.goals_against;
    rows.set(teamId,row);
    const results=forms.get(teamId)||[];
    results.push({result:goalsFor>goalsAgainst?'V':goalsFor<goalsAgainst?'D':'E',home:match.canonical_home_team_name||'Mandante',away:match.canonical_away_team_name||'Visitante',homeId,awayId,score:`${homeGoals}–${awayGoals}`,round:match.round??null,matchId:String(match.canonical_match_id)});
    forms.set(teamId,results);
  }
  const ranked:Row[]=[...rows.entries()].map(([id,row])=>({...row,form:(forms.get(id)||[]).slice(-5).reverse()}));
  return ranked
    .sort((a,b)=>b.points-a.points||b.goal_difference-a.goal_difference||b.goals_for-a.goals_for||String(a.team_name||'').localeCompare(String(b.team_name||'')))
    .map((row,index)=>({...row,position:index+1}));
};

export function seasonAnalytics(s:string){
  const stats=gold('analytics/season_goal_stats').find(row=>String(row.season)===s)||null;
  const players=new Map(gold('players').map(player=>[String(player.canonical_player_id),player]));
  const clubs=teamsMap();
  const leaders=gold('season_leaders').filter(row=>String(row.season)===s);
  const roundGoals=gold('analytics/round_goal_stats').filter(row=>String(row.season)===s).sort((a,b)=>Number(a.round)-Number(b.round));
  const clubPerformance:Row[]=gold('analytics/team_season_stats').filter(row=>String(row.season)===s).map(row=>{
    const id=String(row.canonical_team_id||row.team_id),club=clubs.get(id);
    return {...row,canonical_team_id:id,team_name:club?.canonical_team_name||club?.name||id,team:club||null};
  }).sort((a:Row,b:Row)=>Number(b.points)-Number(a.points)||Number(b.goal_difference)-Number(a.goal_difference)||Number(b.goals_for)-Number(a.goals_for));
  const clubMatchStats=gold('analytics/team_match_statistics').filter(row=>String(row.season)===s&&row.period==null).map(row=>{
    const id=String(row.canonical_team_id||row.team_id),club=clubs.get(id);
    return {...row,canonical_team_id:id,team_name:club?.canonical_team_name||club?.name||id,team:club||null};
  });
  const top=(category:string)=>{
    const unique=new Map<string,Row>();
    for(const row of leaders){
      if(row.category!==category||row.player_id==null)continue;
      const id=String(row.player_id),player=players.get(id),teamId=row.team_id==null?'':String(row.team_id),club=clubs.get(teamId);
      const candidate={playerId:id,name:String(player?.name||'Jogador'),teamId,teamName:String(club?.canonical_team_name||club?.name||''),teamColor:club?.color||null,value:Number(row.value)||0};
      const current=unique.get(id);
      if(!current||candidate.value>current.value)unique.set(id,candidate);
    }
    return [...unique.values()].sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'pt-BR')).slice(0,10);
  };
  return {stats:stats?{matches:Number(stats.matches)||0,homeGoals:Number(stats.home_goals)||0,awayGoals:Number(stats.away_goals)||0,totalGoals:Number(stats.total_goals)||0,goalsPerMatch:Number(stats.goals_per_match)||0,over15:Number(stats.over_1_5)||0,over25:Number(stats.over_2_5)||0,over35:Number(stats.over_3_5)||0,bothScored:Number(stats.both_teams_scored)||0,cleanSheets:Number(stats.clean_sheet_matches)||0}:null,roundGoals,clubPerformance,clubMatchStats,scorers:top('goals'),assists:top('assists')};
}

export function seasonRoundLeaders(s:string){
  const clubs=teamsMap();
  const seasonMatches=gold('matches').filter(row=>String(row.season)===s),matchesByRound=new Map<number,Row[]>();
  for(const match of seasonMatches){const round=Number(match.round);if(!Number.isFinite(round))continue;const roundMatches=matchesByRound.get(round)||[];roundMatches.push(match);matchesByRound.set(round,roundMatches);}
  const startedRounds=new Set([...matchesByRound.entries()].filter(([,rows])=>rows.some(row=>isFinished(row)||/live|progress|halftime|first_half|second_half/i.test(String(row.status)))).map(([round])=>round));
  const byRound=new Map<number,Row[]>();
  for(const row of gold('standings_by_round')){
    if(String(row.season)!==s)continue;
    const round=Number(row.round);
    if(!Number.isFinite(round))continue;
    const rows=byRound.get(round)||[];rows.push(row);byRound.set(round,rows);
  }
  return [...byRound.entries()].sort(([a],[b])=>a-b).map(([round,rows])=>{
    const leaders=startedRounds.has(round)?rows.filter(row=>Number(row.position)===1):[],points=Math.max(0,...leaders.map(row=>Number(row.points)||0));
    return {round,leaders:leaders.map(row=>{
      const teamId=String(row.canonical_team_id||row.team_id),club=clubs.get(teamId);
      return {teamId,teamName:String(club?.canonical_team_name||club?.name||teamId),teamColor:club?.color||null,points:Number(row.points)||points,played:Number(row.played)||0,wins:Number(row.won??row.wins)||0,draws:Number(row.drawn??row.draws)||0,losses:Number(row.lost??row.losses)||0,goalDifference:(Number(row.gf??row.goals_for)||0)-(Number(row.ga??row.goals_against)||0)};
    })};
  });
}

export type ScorePrediction={homeGoals:number;awayGoals:number;probability:number};
export type MatchScoreForecast={homeExpectedGoals:number;awayExpectedGoals:number;scores:ScorePrediction[]};

export function scorePredictions(matchId:string):MatchScoreForecast{
  const allMatches=gold('matches'),target=allMatches.find(row=>String(row.canonical_match_id)===matchId);
  if(!target)return {homeExpectedGoals:0,awayExpectedGoals:0,scores:[]};
  const season=Number(target.season),round=Number(target.round),targetTime=Date.parse(String(target.kickoff_utc||target.kickoff_date||''));
  const dateOnly=target.kickoff_precision==='date'||!target.kickoff_utc;
  const eligible=allMatches.filter(row=>{
    if(String(row.canonical_match_id)===matchId||!isFinished(row)||row.home_score==null||row.away_score==null)return false;
    const rowSeason=Number(row.season),rowRound=Number(row.round),rowTime=Date.parse(String(row.kickoff_utc||row.kickoff_date||''));
    if(Number.isFinite(targetTime)&&!dateOnly&&Number.isFinite(rowTime))return rowTime<targetTime;
    if(Number.isFinite(rowSeason)&&Number.isFinite(season)&&rowSeason!==season)return rowSeason<season;
    return Number.isFinite(rowRound)&&Number.isFinite(round)&&rowRound<round;
  }).sort((a,b)=>Number(a.season)-Number(b.season)||Number(a.round)-Number(b.round)||Date.parse(String(a.kickoff_utc||a.kickoff_date||''))-Date.parse(String(b.kickoff_utc||b.kickoff_date||'')));

  const homeId=String(target.canonical_home_team_id),awayId=String(target.canonical_away_team_id);
  const recent=(teamId:string)=>eligible.filter(row=>String(row.canonical_home_team_id)===teamId||String(row.canonical_away_team_id)===teamId).slice(-8);
  const asHome=eligible.filter(row=>String(row.canonical_home_team_id)===homeId).slice(-8);
  const asAway=eligible.filter(row=>String(row.canonical_away_team_id)===awayId).slice(-8);
  const homeRecent=recent(homeId),awayRecent=recent(awayId);
  const goalsFor=(row:Row,teamId:string)=>Number(String(row.canonical_home_team_id)===teamId?row.home_score:row.away_score)||0;
  const goalsAgainst=(row:Row,teamId:string)=>Number(String(row.canonical_home_team_id)===teamId?row.away_score:row.home_score)||0;
  const estimate=(rows:Row[],value:(row:Row)=>number,fallback:number)=>{
    const weighted=rows.reduce((acc,row,index)=>{const weight=Math.pow(.82,rows.length-index-1);return {sum:acc.sum+value(row)*weight,weight:acc.weight+weight};},{sum:0,weight:0});
    return weighted.weight?weighted.sum/weighted.weight:fallback;
  };
  const homeRecentFor=estimate(homeRecent,row=>goalsFor(row,homeId),0),homeRecentAgainst=estimate(homeRecent,row=>goalsAgainst(row,homeId),0);
  const awayRecentFor=estimate(awayRecent,row=>goalsFor(row,awayId),0),awayRecentAgainst=estimate(awayRecent,row=>goalsAgainst(row,awayId),0);
  const homeVenueFor=estimate(asHome,row=>Number(row.home_score)||0,homeRecentFor),homeVenueAgainst=estimate(asHome,row=>Number(row.away_score)||0,homeRecentAgainst);
  const awayVenueFor=estimate(asAway,row=>Number(row.away_score)||0,awayRecentFor),awayVenueAgainst=estimate(asAway,row=>Number(row.home_score)||0,awayRecentAgainst);
  const homeAttack=.58*homeRecentFor+.42*homeVenueFor;
  const homeDefense=.58*homeRecentAgainst+.42*homeVenueAgainst;
  const awayAttack=.58*awayRecentFor+.42*awayVenueFor;
  const awayDefense=.58*awayRecentAgainst+.42*awayVenueAgainst;
  let expectedHome=(homeAttack+awayDefense)/2;
  let expectedAway=(awayAttack+homeDefense)/2;
  expectedHome=Math.max(.25,Math.min(4.2,expectedHome));
  expectedAway=Math.max(.25,Math.min(4.2,expectedAway));
  const factorial=(n:number):number=>n<2?1:n*factorial(n-1);
  const poisson=(goals:number,expected:number)=>Math.exp(-expected)*Math.pow(expected,goals)/factorial(goals);
  const scores:ScorePrediction[]=Array.from({length:11},(_,homeGoals)=>Array.from({length:11},(_,awayGoals)=>({homeGoals,awayGoals,probability:poisson(homeGoals,expectedHome)*poisson(awayGoals,expectedAway)})))
    .flat().sort((a,b)=>b.probability-a.probability).slice(0,5);
  return {homeExpectedGoals:expectedHome,awayExpectedGoals:expectedAway,scores};
}

export const related = (name:string,id:string) => by(gold(name),'canonical_match_id',id);

export function dashboard() {
  const ms=matches(),now=Date.now(),dated=ms.map(m=>({m,t:Date.parse(m.kickoff_utc||m.kickoff_date||'')}));
  const season=latestSeason(),seasonRows=dated.filter(x=>String(x.m.season)===String(season));
  const finished=ms.filter(isFinished),goals=finished.reduce((n,m)=>n+(Number(m.home_score)||0)+(Number(m.away_score)||0),0);
  const goalsBySeason=gold('analytics/season_goal_stats')
    .filter(r=>Number(r.matches)>0)
    .map(r=>({season:String(r.season),games:Number(r.matches),average:Number(Number(r.goals_per_match).toFixed(2))}))
    .sort((a,b)=>a.season.localeCompare(b.season));
  const clubs=teamsMap();
  const champions:Row[]=gold('season_champions').map((c:Row)=>{
    const id=String(c.canonical_team_id||c.team_id),club=clubs.get(id);
    return {...c,canonical_team_id:id,canonical_team_name:club?.name??null,color:club?.color??null};
  }).sort((a:Row,b:Row)=>Number(b.season)-Number(a.season));
  const recent=seasonRows.filter(x=>x.t<=now&&isFinished(x.m)).sort((a,b)=>b.t-a.t).slice(0,5).map(x=>x.m);
  const upcoming=seasonRows.filter(x=>(x.t>now||!x.t)&&!isFinished(x.m)).sort((a,b)=>(a.t||Infinity)-(b.t||Infinity)).slice(0,5).map(x=>x.m);
  const seasonTable=season?standings(season):[];
  return {
    season,
    seasons:[...new Set(ms.map(m=>String(m.season)))].length,
    total:ms.length,
    goals,
    average:finished.length?(goals/finished.length).toFixed(2):null,
    goalsBySeason,
    recent,
    upcoming,
    recentRound:recent[0]?.round??null,
    upcomingRound:upcoming[0]?.round??null,
    champions,
    standings:seasonTable.slice(0,20),
    standingsHome:season?venueStandings(season,'home',seasonTable).slice(0,20):[],
    standingsAway:season?venueStandings(season,'away',seasonTable).slice(0,20):[]
  };
}

export function enrich(m:Row,clubs=teamsMap()): Row {
  const home=clubs.get(String(m.canonical_home_team_id)),away=clubs.get(String(m.canonical_away_team_id));
  return {...m,home:home??null,away:away??null,canonical_home_team_name:home?.canonical_team_name??home?.name??null,canonical_away_team_name:away?.canonical_team_name??away?.name??null};
}
