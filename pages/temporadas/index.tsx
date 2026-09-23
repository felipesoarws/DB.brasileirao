import type {GetServerSideProps} from 'next';
import Link from 'next/link';
import {gold,isFinished,latestSeason,seasons,type Row} from '../../lib/data/gold';
import {standings} from '../../lib/data/queries';
import {Header as PageHeader,Team} from '../../components/ui';

type SeasonSummary={season:string;current:boolean;leader:{id:string;name:string;color:string|null}|null;champion:{id:string;name:string;color:string|null}|null;clubs:number;played:number;matches:number;goals:number;average:string|null};

function SeasonStats({row}:{row:SeasonSummary}){
  return <div className="season-card-stats">
    <div><strong>{row.clubs||'—'}</strong><span>clubes</span></div>
    <div><strong>{row.current?`${row.played}/${row.matches}`:row.played}</strong><span>partidas</span></div>
    <div><strong>{row.goals.toLocaleString('pt-BR')}</strong><span>gols</span></div>
  </div>;
}

export default function SeasonsPage({rows}:{rows:SeasonSummary[]}){
  const current=rows.find(row=>row.current);
  const archive=rows.filter(row=>!row.current);
  return <>
    <PageHeader title="Temporadas" desc="Explore a história do Brasileirão Série A, temporada por temporada." meta={`${rows.length} temporadas`}/>
    <div className="season-archive">
      {current&&<section className="season-current-card card" aria-labelledby="season-current-title">
        <div className="season-current-top"><div><span className="season-eyebrow">Temporada atual</span><h2 id="season-current-title">Brasileirão {current.season}</h2></div><span className="season-live-badge"><i/>Em andamento</span></div>
        <div className="season-current-content">
          <div className="season-current-leader"><span className="season-field-label">Líder atual</span>{current.leader?<Team id={current.leader.id} name={current.leader.name} color={current.leader.color}/>:<span className="caption">Classificação indisponível</span>}</div>
          <SeasonStats row={current}/>
          <Link className="season-open-link" href={`/temporadas/${current.season}`}>Abrir temporada <span aria-hidden="true">→</span></Link>
        </div>
      </section>}

      <section className="season-archive-section" aria-labelledby="season-archive-title">
        <div className="season-archive-heading"><div><h2 id="season-archive-title">Arquivo histórico</h2><p>Campeões e números de cada edição</p></div><span>{archive.length} edições</span></div>
        <div className="season-card-grid">
          {archive.map(row=><article className="season-card card" key={row.season}>
            <div className="season-card-top"><span className="season-card-year">{row.season}</span><span className="season-finished-badge">Finalizada</span></div>
            <div className="season-card-champion"><span className="season-field-label">Campeão</span>{row.champion?<Team id={row.champion.id} name={row.champion.name} color={row.champion.color}/>:row.leader?<Team id={row.leader.id} name={row.leader.name} color={row.leader.color}/>:<span className="caption">Não disponível</span>}</div>
            <SeasonStats row={row}/>
            <Link className="season-card-open" href={`/temporadas/${row.season}`} aria-label={`Abrir temporada ${row.season}`}>Ver temporada <span aria-hidden="true">→</span></Link>
          </article>)}
        </div>
      </section>
    </div>
  </>;
}

export const getServerSideProps:GetServerSideProps=async()=>{
  const currentSeason=latestSeason();
  const matches=gold('matches');
  const teams=gold('teams');
  const champions=new Map(gold('season_champions').map(row=>[String(row.season),String(row.canonical_team_id||row.team_id)]));
  const summaries:SeasonSummary[]=seasons().map(season=>{
    const table:Row[]=standings(season),seasonMatches=matches.filter(match=>String(match.season)===season);
    const finished=seasonMatches.filter(match=>isFinished(match)&&match.home_score!=null&&match.away_score!=null);
    const goals=finished.reduce((sum,match)=>sum+(Number(match.home_score)||0)+(Number(match.away_score)||0),0);
    const leader=table[0];
    const championId=champions.get(season);
    const teamInfo=(id:string|undefined)=>{
      if(!id)return null;
      const team=teams.find(row=>String(row.canonical_team_id)===id);
      return team?{id,name:String(team.canonical_team_name||team.name),color:team.color==null?null:String(team.color)}:null;
    };
    return {season,current:season===String(currentSeason),leader:teamInfo(leader?String(leader.canonical_team_id):undefined),champion:teamInfo(championId),clubs:table.length,played:finished.length,matches:seasonMatches.length,goals,average:finished.length?(goals/finished.length).toFixed(2):null};
  });
  return {props:{rows:summaries}};
};
