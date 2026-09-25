import type { GetServerSideProps } from "next";
import Link from "../components/Link";
import {
  gold,
  isFinished,
  latestSeason,
  teamsMap,
  type Row,
} from "../lib/data/gold";
import { Header, Kpis } from "../components/ui";

type RecordItem = {
  id: string;
  kind: "goals" | "margin";
  title: string;
  season: number;
  value: number;
  matchId: string | null;
  homeId: string | null;
  homeName: string;
  awayId: string | null;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
};
type ClubLeader = {
  teamId: string;
  teamName: string;
  color: string | null;
  value: number;
  season: number | null;
  years: number[];
};
type ClubRecord = {
  key: string;
  title: string;
  unit: string;
  leaders: ClubLeader[];
};

function ClubRecordCard({ record }: { record: ClubRecord }) {
  return (
    <article className="card record-card club-record-card">
      <div className="club-record-heading">
        <h2>{record.title}</h2>
      </div>
      <div className="club-record-leaders">
        {record.leaders.map((leader, index) => {
          const goalDifference =
            record.key === "best-goal-difference" ||
            record.key === "worst-goal-difference";
          const value =
            goalDifference && leader.value > 0
              ? `+${leader.value}`
              : leader.value;
          const teamColor =
            leader.color && leader.color.toUpperCase() !== "#FFFFFF"
              ? leader.color.startsWith("#")
                ? leader.color
                : `#${leader.color}`
              : "var(--theme-brand-primary)";
          return (
            <div
              className="club-record-leader"
              key={`${leader.teamId}-${leader.season ?? leader.years.join("-")}`}
            >
              <span className="club-record-rank">
                {String(index + 1).padStart(2, "0")}
              </span>
              <img
                src={`/api/team-logo/${encodeURIComponent(leader.teamId)}`}
                alt=""
              />
              <Link
                className="club-record-name club-record-name-link"
                href={`/clubes/${encodeURIComponent(leader.teamId)}`}
                style={{ "--team": teamColor } as any}
              >
                {leader.teamName}
              </Link>
              <strong className={`club-record-value numeric${record.key === "worst-goal-difference" || record.key === "most-goals-against" ? " is-negative" : ""}`}>{value}</strong>
              <small className="record-season-years">
                {(leader.years.length ? leader.years : leader.season == null ? [] : [leader.season]).map((year,yearIndex)=><span key={`${year}-${yearIndex}`}>{yearIndex>0?' · ':''}<Link className="record-season-link" href={`/temporadas/${year}`}>{year}</Link></span>)}
              </small>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function MatchRecordCard({
  title,
  records,
}: {
  title: string;
  records: RecordItem[];
}) {
  return (
    <article className="card record-card club-record-card">
      <div className="club-record-heading">
        <h2>{title}</h2>
      </div>
      <div className="club-record-leaders">
        {records.map((record, index) => {
          const content = (
            <>
              <span className="club-record-rank">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="record-match-crests" aria-hidden="true">
                <img
                  src={
                    record.homeId
                      ? `/api/team-logo/${encodeURIComponent(record.homeId)}`
                      : "/favicon.png?v=20260923"
                  }
                  alt=""
                />
                <img
                  src={
                    record.awayId
                      ? `/api/team-logo/${encodeURIComponent(record.awayId)}`
                      : "/favicon.png?v=20260923"
                  }
                  alt=""
                />
              </span>
              {record.matchId?<Link className="club-record-name club-record-name-link" href={`/partidas/${record.matchId}`}>{record.homeName} × {record.awayName}</Link>:<span className="club-record-name">{record.homeName} × {record.awayName}</span>}
              <strong className="club-record-value numeric">
                {record.value}
              </strong>
              <small>
                {record.homeScore}–{record.awayScore} · <Link className="record-season-link" href={`/temporadas/${record.season}`}>{record.season}</Link>
              </small>
            </>
          );
          return (
            <div className="club-record-leader record-match-leader" key={record.id}>
              {content}
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function Records({
  records,
  clubRecords,
}: {
  records: RecordItem[];
  clubRecords: ClubRecord[];
}) {
  const topMatches = (kind: RecordItem["kind"]) =>
    records
      .filter((record) => record.kind === kind)
      .sort((a, b) => b.value - a.value || b.season - a.season)
      .slice(0, 3);
  const topGoals = topMatches("goals");
  const topMargins = topMatches("margin");
  const seasons = new Set(
    clubRecords.flatMap((record) =>
      record.leaders.flatMap((leader) =>
        leader.years.length
          ? leader.years
          : leader.season == null
            ? []
            : [leader.season],
      ),
    ),
  );
  return (
    <>
      <Header
        title="Recordes históricos"
        desc="Consulte recordes de clubes, temporadas e partidas do Brasileirão Série A, incluindo gols, vitórias, derrotas e saldos extremos."
      />
      <Kpis
        items={[
          { label: "Tipos de recorde", value: clubRecords.length + 2 },
          { label: "Temporadas analisadas", value: seasons.size },
          {
            label: "Recordes por clube/temporada",
            value: clubRecords.reduce(
              (total, record) => total + record.leaders.length,
              0,
            ),
          },
          {
            label: "Partidas destacadas",
            value: topGoals.length + topMargins.length,
          },
        ]}
      />
      <section className="section club-records-section">
        <div className="record-page-heading">
          <span className="statistics-section-icon">♜</span>
          <div>
            <h2>Clubes e temporadas</h2>
            <p className="caption">
              Três primeiras posições em cada categoria, entre temporadas
              encerradas.
            </p>
          </div>
        </div>
        <div className="club-record-grid">
          {clubRecords.map((record) => (
            <ClubRecordCard record={record} key={record.key} />
          ))}
          <MatchRecordCard
            title="Mais gols em uma partida"
            records={topGoals}
          />
          <MatchRecordCard
            title="Maior margem de vitória"
            records={topMargins}
          />
        </div>
      </section>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const teams = teamsMap();
  const matches = new Map(
    gold("matches").map((row: Row) => [
      String(row.canonical_match_id || row.match_id),
      row,
    ]),
  );
  const records: RecordItem[] = gold("historical_records")
    .map((row: Row, index: number): RecordItem => {
      const match = matches.get(String(row.match_id));
      const homeId =
        match?.canonical_home_team_id == null
          ? null
          : String(match.canonical_home_team_id);
      const awayId =
        match?.canonical_away_team_id == null
          ? null
          : String(match.canonical_away_team_id);
      const home = homeId ? teams.get(homeId) : null,
        away = awayId ? teams.get(awayId) : null;
      return {
        id: `${row.record}-${row.season}-${row.match_id || index}`,
        kind: row.record === "highest_match_goal_total" ? "goals" : "margin",
        title: String(row.record || "Recorde"),
        season: Number(row.season) || 0,
        value: Number(row.value) || 0,
        matchId: match ? String(row.match_id) : null,
        homeId,
        homeName: String(
          match?.canonical_home_team_name ||
            home?.canonical_team_name ||
            home?.name ||
            "Mandante",
        ),
        awayId,
        awayName: String(
          match?.canonical_away_team_name ||
            away?.canonical_team_name ||
            away?.name ||
            "Visitante",
        ),
        homeScore: match?.home_score == null ? null : Number(match.home_score),
        awayScore: match?.away_score == null ? null : Number(match.away_score),
      };
    })
    .filter((record) => record.season > 0 && record.value > 0);
  const standings = gold("season_standings").filter(
    (row: Row) =>
      Number(row.season) < Number(latestSeason()) && Number(row.played) > 0,
  );
  const goalDifferences = new Map<string, number>();
  const goalsConcededBySeason = new Map<string, number>();
  for (const match of gold("matches")) {
    if (
      Number(match.season) >= Number(latestSeason()) ||
      !isFinished(match) ||
      match.home_score == null ||
      match.away_score == null
    )
      continue;
    const homeId = String(match.canonical_home_team_id),
      awayId = String(match.canonical_away_team_id),
      season = String(match.season);
    const difference = Number(match.home_score) - Number(match.away_score);
    const homeKey = `${season}:${homeId}`,
      awayKey = `${season}:${awayId}`;
    goalDifferences.set(
      homeKey,
      (goalDifferences.get(homeKey) || 0) + difference,
    );
    goalDifferences.set(
      awayKey,
      (goalDifferences.get(awayKey) || 0) - difference,
    );
    const homeConcededKey = `${season}:${homeId}`;
    const awayConcededKey = `${season}:${awayId}`;
    goalsConcededBySeason.set(
      homeConcededKey,
      (goalsConcededBySeason.get(homeConcededKey) || 0) + Number(match.away_score),
    );
    goalsConcededBySeason.set(
      awayConcededKey,
      (goalsConcededBySeason.get(awayConcededKey) || 0) + Number(match.home_score),
    );
  }
  const decorateLeader = (
    teamId: string,
    value: number,
    season: number | null,
    years: number[] = [],
  ): ClubLeader => ({
    teamId,
    teamName: String(
      teams.get(teamId)?.canonical_team_name ||
        teams.get(teamId)?.name ||
        teamId,
    ),
    color:
      teams.get(teamId)?.color == null
        ? null
        : String(teams.get(teamId)?.color),
    value,
    season,
    years,
  });
  const extrema = (
    key: string,
    title: string,
    field: string,
    mode: "max" | "min",
    unit: string,
  ): ClubRecord => {
    const candidates = standings.map((row: Row) => {
      const teamId = String(row.team_id || row.canonical_team_id),
        season = String(row.season),
        matchBasedDifference = goalDifferences.get(`${season}:${teamId}`);
      const aggregateDifference =
        Number(row.goals_for ?? row.gf ?? 0) -
        Number(row.goals_against ?? row.ga ?? 0);
      return {
        row,
        value:
          field === "goal_difference"
            ? (matchBasedDifference ?? aggregateDifference)
            : field === "goals_against"
              ? (goalsConcededBySeason.get(`${season}:${teamId}`) ?? Number(row.goals_against ?? row.goals_conceded ?? row.ga ?? row.conceded ?? 0))
            : Number(row[field]) || 0,
      };
    });
    const sorted = candidates
      .filter((item) => Number.isFinite(item.value))
      .sort(
        (a, b) =>
          (mode === "max" ? b.value - a.value : a.value - b.value) ||
          Number(a.row.season) - Number(b.row.season) ||
          String(a.row.team_id || a.row.canonical_team_id).localeCompare(
            String(b.row.team_id || b.row.canonical_team_id),
          ),
      );
    const leaders = sorted
      .slice(0, 3)
      .map(({ row, value }) =>
        decorateLeader(
          String(row.team_id || row.canonical_team_id),
          value,
          Number(row.season),
        ),
      );
    return { key, title, unit, leaders };
  };
  const champions = standings
    .filter((row: Row) => Number(row.position) === 1)
    .map((row: Row) => ({
      teamId: String(row.team_id || row.canonical_team_id),
      season: Number(row.season),
    }))
    .sort((a, b) => a.season - b.season);
  const titleSeasons = new Map<string, number[]>();
  for (const champion of champions)
    titleSeasons.set(champion.teamId, [
      ...(titleSeasons.get(champion.teamId) || []),
      champion.season,
    ]);
  const titleLeaders = [...titleSeasons.entries()].map(([teamId, years]) =>
    decorateLeader(teamId, years.length, null, years),
  );
  const sortedTitleLeaders = titleLeaders.sort(
    (a, b) => b.value - a.value || a.teamName.localeCompare(b.teamName),
  );
  const championRuns: ClubLeader[] = [];
  for (const [teamId, years] of titleSeasons) {
    let run: number[] = [];
    for (const year of years) {
      if (run.length && year !== run[run.length - 1] + 1) {
        championRuns.push(decorateLeader(teamId, run.length, null, [...run]));
        run = [];
      }
      run.push(year);
    }
    if (run.length)
      championRuns.push(decorateLeader(teamId, run.length, null, [...run]));
  }
  championRuns.sort(
    (a, b) => b.value - a.value || a.teamName.localeCompare(b.teamName),
  );
  const clubRecords: ClubRecord[] = [
    {
      key: "most-championships",
      title: "Maior campeão",
      unit: "títulos",
      leaders: sortedTitleLeaders.slice(0, 3),
    },
    extrema(
      "most-goals",
      "Mais gols em uma temporada",
      "gf",
      "max",
      "gols marcados",
    ),
    extrema(
      "fewest-goals",
      "Menos gols marcados",
      "gf",
      "min",
      "gols marcados",
    ),
    extrema(
      "most-goals-against",
      "Mais gols sofridos",
      "goals_against",
      "max",
      "gols sofridos",
    ),
    extrema(
      "fewest-goals-against",
      "Menos gols sofridos",
      "goals_against",
      "min",
      "gols sofridos",
    ),
    extrema(
      "best-goal-difference",
      "Melhor saldo de gols",
      "goal_difference",
      "max",
      "saldo de gols",
    ),
    extrema(
      "worst-goal-difference",
      "Pior saldo de gols",
      "goal_difference",
      "min",
      "saldo de gols",
    ),
    extrema("most-wins", "Mais vitórias", "won", "max", "vitórias"),
    extrema("most-losses", "Mais derrotas", "lost", "max", "derrotas"),
    {
      key: "consecutive-championships",
      title: "Maior sequência de títulos seguidos",
      unit: "anos consecutivos",
      leaders: championRuns.slice(0, 3),
    },
  ];
  return { props: { records, clubRecords } };
};
