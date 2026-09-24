import type {NextApiRequest, NextApiResponse} from 'next';
import {team} from '../../../lib/data/queries';

const allowedHosts = new Set(['a.espncdn.com', 'a2.espncdn.com', 'upload.wikimedia.org']);
const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);
const maxLogoBytes = 2 * 1024 * 1024;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const row = team(String(req.query.teamId));
  let url: URL;
  try {
    url = new URL(String(row?.logo_url || ''));
  } catch {
    return res.status(404).end();
  }
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname) || url.port || url.username || url.password) {
    return res.status(404).end();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const upstream = await fetch(url, {method: req.method, signal: controller.signal, redirect: 'manual'});
    if (!upstream.ok || upstream.status >= 300) return res.status(404).end();

    const contentType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!allowedTypes.has(contentType)) return res.status(415).end();
    const declaredSize = Number(upstream.headers.get('content-length'));
    if (Number.isFinite(declaredSize) && declaredSize > maxLogoBytes) return res.status(413).end();
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    if (req.method === 'HEAD') return res.status(200).end();
    if (!upstream.body) return res.status(404).end();

    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxLogoBytes) {
        await reader.cancel();
        return res.status(413).end();
      }
      chunks.push(value);
    }

    const body = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), size);
    return res.status(200).send(body);
  } catch {
    return res.status(404).end();
  } finally {
    clearTimeout(timeout);
  }
}
