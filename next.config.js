/** @type {import('next').NextConfig} */
const tableFiles=(...tables)=>[
  './data/gold-json/_metadata.json',
  ...tables.map(table=>`./data/gold-json/${table}.json.gz`),
];

module.exports = {
  // Keep `next dev` output separate so running a production build cannot overwrite it.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    const scriptPolicy = process.env.NODE_ENV === 'production' ? "script-src 'self'" : "script-src 'self' 'unsafe-eval'";
    const httpsUpgradePolicy = process.env.NODE_ENV === 'production' ? '; upgrade-insecure-requests' : '';
    const securityHeaders = [
      { key: 'Content-Security-Policy', value: `default-src 'self'; ${scriptPolicy}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'${httpsUpgradePolicy}` },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
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
      '/sitemap.xml': tableFiles('matches','teams'),
      '/api/team-logo/[teamId]': tableFiles('teams'),
      '/api/data-status': tableFiles('matches'),
  },
};
