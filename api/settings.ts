import { Redis } from '@upstash/redis';

const SETTINGS_KEY = 'canteen:settings';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const redis = getRedis();

    if (req.method === 'GET') {
      const raw = await redis.get(SETTINGS_KEY);
      let settings = null;
      if (raw) {
        settings = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
      return res.status(200).json({ settings });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      const settings = body.settings || body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Settings payload is required' });
      }

      await redis.set(SETTINGS_KEY, JSON.stringify(settings));
      return res.status(200).json({ ok: true, settings });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Settings API error:', error);
    return res.status(500).json({
      error: 'Failed to process settings request',
      details: error?.message || String(error),
    });
  }
}
