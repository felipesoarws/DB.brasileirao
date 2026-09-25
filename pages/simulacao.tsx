import type {GetServerSideProps} from 'next';
import SeasonSimulation from '../components/SeasonSimulation';
import {Header} from '../components/ui';
import {seasonMatches,standings} from '../lib/data/queries';
import {latestSeason} from '../lib/data/gold';
import type {Row} from '../components/ui';

export default function SimulationPage({season,matches,table}:{season:string;matches:any[];table:any[]}){
  return <>
    <Header title="Simulação da classificação atual" desc="Projete os resultados das partidas pendentes e veja como eles alterariam a classificação do Brasileirão desta temporada."/>
    {season?<SeasonSimulation season={season} matches={matches} table={table}/>:<div className="empty">Não há temporada disponível para simular.</div>}
  </>;
}

export const getServerSideProps:GetServerSideProps=async()=>{
  const season=String(latestSeason()||'');
  const matches=season?seasonMatches(season).map(match=>({
    canonical_match_id:match.canonical_match_id,
    round:match.round??null,
    status:match.status??null,
    home_score:match.home_score??null,
    away_score:match.away_score??null,
    kickoff_utc:match.kickoff_utc??null,
    kickoff_date:match.kickoff_date??null,
    kickoff_precision:match.kickoff_precision??null,
    kickoff_order:Number.isFinite(Date.parse(match.kickoff_utc||match.kickoff_date||''))?Date.parse(match.kickoff_utc||match.kickoff_date||''):null,
    canonical_home_team_id:match.canonical_home_team_id,
    canonical_away_team_id:match.canonical_away_team_id,
  })):[];
  const table:Row[]=season?(standings(season) as Row[]).map(row=>({
    canonical_team_id:row.canonical_team_id,
    position:row.position,
    team_name:row.team_name,
    points:row.points,
    played:row.played,
    wins:row.wins,
    draws:row.draws,
    losses:row.losses,
    goals_for:row.goals_for,
    goals_against:row.goals_against,
    goal_difference:row.goal_difference,
    team:row.team?{color:row.team.color??null}:null,
    form:[]
  })):[];
  return {props:{season,matches,table}};
};
