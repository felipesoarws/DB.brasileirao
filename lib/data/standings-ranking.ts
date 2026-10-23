type Row = Record<string, any>;

type Match = {
  canonical_home_team_id?: unknown;
  canonical_away_team_id?: unknown;
  home_score?: unknown;
  away_score?: unknown;
  homeGoals?: unknown;
  awayGoals?: unknown;
};

const value = (row: Row, key: string, fallback?: string) => Number(row[key] ?? (fallback ? row[fallback] : 0)) || 0;
const teamId = (row: Row) => String(row.canonical_team_id ?? row.team_id ?? '');
const primaryTieBreak = (a: Row, b: Row) =>
  value(b, 'points') - value(a, 'points') ||
  value(b, 'wins', 'won') - value(a, 'wins', 'won') ||
  value(b, 'goal_difference', 'gd') - value(a, 'goal_difference', 'gd') ||
  value(b, 'goals_for', 'gf') - value(a, 'goals_for', 'gf');

function pairKey(a: string, b: string) {
  return [a, b].sort().join('\u0000');
}

function headToHead(matches: Match[]) {
  const pairs = new Map<string, Map<string, { points: number; goalDifference: number }>>();
  for (const match of matches) {
    const homeId = String(match.canonical_home_team_id ?? ''), awayId = String(match.canonical_away_team_id ?? '');
    const homeGoals = Number(match.home_score ?? match.homeGoals), awayGoals = Number(match.away_score ?? match.awayGoals);
    if (!homeId || !awayId || homeId === awayId || !Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) continue;

    const key = pairKey(homeId, awayId);
    let pair = pairs.get(key);
    if (!pair) {
      pair = new Map([[homeId, { points: 0, goalDifference: 0 }], [awayId, { points: 0, goalDifference: 0 }]]);
      pairs.set(key, pair);
    }
    const home = pair.get(homeId)!, away = pair.get(awayId)!;
    home.goalDifference += homeGoals - awayGoals;
    away.goalDifference += awayGoals - homeGoals;
    if (homeGoals > awayGoals) home.points += 3;
    else if (homeGoals < awayGoals) away.points += 3;
    else { home.points += 1; away.points += 1; }
  }
  return pairs;
}

/** Orders a league table using the 2026 Brasileirão regulation tie-breaks. */
export function rankStandings(rows: Row[], matches: Match[] = [], options: { headToHead?: boolean; discipline?: boolean } = {}) {
  const useHeadToHead = options.headToHead !== false;
  const useDiscipline = options.discipline !== false;
  const pairs = useHeadToHead ? headToHead(matches) : new Map<string, Map<string, { points: number; goalDifference: number }>>();
  const primarySorted = [...rows].sort((a, b) => primaryTieBreak(a, b) || teamId(a).localeCompare(teamId(b)));
  const ordered: Row[] = [];

  for (let start = 0; start < primarySorted.length;) {
    let end = start + 1;
    while (end < primarySorted.length && primaryTieBreak(primarySorted[start], primarySorted[end]) === 0) end++;
    const tied = primarySorted.slice(start, end);
    let headToHeadSeparated = false;

    // CBF criterion 4 is applied only when exactly two clubs remain tied.
    if (useHeadToHead && tied.length === 2) {
      const pair = pairs.get(pairKey(teamId(tied[0]), teamId(tied[1])));
      if (pair) tied.sort((a, b) => {
        const aStats = pair.get(teamId(a)), bStats = pair.get(teamId(b));
        return (bStats?.points ?? 0) - (aStats?.points ?? 0) || (bStats?.goalDifference ?? 0) - (aStats?.goalDifference ?? 0);
      });
      if (pair) {
        const aStats = pair.get(teamId(tied[0])), bStats = pair.get(teamId(tied[1]));
        headToHeadSeparated = (aStats?.points ?? 0) !== (bStats?.points ?? 0) || (aStats?.goalDifference ?? 0) !== (bStats?.goalDifference ?? 0);
      }
    }

    if (useDiscipline && !headToHeadSeparated) {
      tied.sort((a, b) =>
        value(a, 'red_cards') - value(b, 'red_cards') ||
        value(a, 'yellow_cards') - value(b, 'yellow_cards') ||
        String(a.team_name ?? '').localeCompare(String(b.team_name ?? ''), 'pt-BR') ||
        teamId(a).localeCompare(teamId(b))
      );
    } else {
      tied.sort((a, b) => String(a.team_name ?? '').localeCompare(String(b.team_name ?? ''), 'pt-BR') || teamId(a).localeCompare(teamId(b)));
    }
    ordered.push(...tied);
    start = end;
  }

  return ordered.map((row, index) => ({ ...row, position: index + 1 }));
}
