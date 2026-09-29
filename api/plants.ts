import { Redis } from '@upstash/redis';

const PLANTS_KEY = 'canteen:plants';

function getRedis(): Redis {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Missing KV_REST_API_URL / KV_REST_API_TOKEN');
  }

  return new Redis({ url, token });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const redis = getRedis();

    if (req.method === 'GET') {
      const raw = await redis.get(PLANTS_KEY);
      let plants = null;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        plants = Array.isArray(parsed) ? parsed : null;
      }
      return res.status(200).json({ plants });
    }

    if (req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      const plants = body?.plants;
      if (!Array.isArray(plants)) {
        return res.status(400).json({ error: 'plants array is required' });
      }

      const clean = plants.filter(
        (p: any) => p && typeof p === 'object' && typeof p.id === 'string' && p.id.trim()
      );

      await redis.set(PLANTS_KEY, JSON.stringify(clean));
      return res.status(200).json({ ok: true, plants: clean });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Plants API error:', error);
    return res.status(500).json({
      error: 'Failed to process plants request',
      details: error?.message || String(error),
    });
  }
}
