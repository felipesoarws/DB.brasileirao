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
  type FormResult={result:string;home:string;away:string;homeId:string;awayId:string;score:string;round:number|string|null};
  const formByTeam=new Map<string,FormResult[]>();
  const formMatches=seasonMatches(s).filter(m=>isFinished(m)&&m.home_score!=null&&m.away_score!=null).sort((a,b)=>Date.parse(a.kickoff_utc||a.kickoff_date||'')-Date.parse(b.kickoff_utc||b.kickoff_date||''));
  const addForm=(id:string,result:string,m:Row,home:number,away:number)=>{const homeTeam=clubs.get(String(m.canonical_home_team_id)),awayTeam=clubs.get(String(m.canonical_away_team_id));const form=formByTeam.get(id)||[];form.push({result,home:m.canonical_home_team_name||homeTeam?.canonical_team_name||homeTeam?.name||'Mandante',away:m.canonical_away_team_name||awayTeam?.canonical_team_name||awayTeam?.name||'Visitante',homeId:String(m.canonical_home_team_id),awayId:String(m.canonical_away_team_id),score:`${home}–${away}`,round:m.round??null});formByTeam.set(id,form);};
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
    standings:season?standings(season).slice(0,20):[]
  };
}

export function enrich(m:Row,clubs=teamsMap()): Row {
  const home=clubs.get(String(m.canonical_home_team_id)),away=clubs.get(String(m.canonical_away_team_id));
  return {...m,home:home??null,away:away??null,canonical_home_team_name:home?.canonical_team_name??home?.name??null,canonical_away_team_name:away?.canonical_team_name??away?.name??null};
}
