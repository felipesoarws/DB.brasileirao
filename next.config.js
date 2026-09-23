/** @type {import('next').NextConfig} */
const tableFiles=(...tables)=>[
  './data/gold-json/_metadata.json',
  ...tables.map(table=>`./data/gold-json/${table}.json.gz`),
];

module.exports = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/': tableFiles('matches','teams','season_standings','season_champions','analytics/season_goal_stats'),
      '/temporadas': tableFiles('matches','teams','season_standings','season_champions'),
      '/temporadas/[season]': tableFiles('matches','teams','season_standings'),
      '/clubes': tableFiles('matches','teams','season_standings'),
      '/clubes/[teamId]': tableFiles('matches','teams','season_standings','season_champions','analytics/season_goal_stats'),
      '/partidas': tableFiles('matches','teams'),
      '/partidas/[matchId]': tableFiles('matches','teams','goals','match_timeline','lineups','statistics_by_period','odds'),
      '/recordes': tableFiles('historical_records','teams'),
      '/admin/qualidade': tableFiles('matches','teams','goals','lineups'),
      '/api/team-logo/[teamId]': tableFiles('teams'),
    },
  },
};
