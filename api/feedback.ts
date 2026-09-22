import { Redis } from '@upstash/redis';

type StoredFeedback = Record<string, unknown> & {
  id: string;
  created_at: string;
};

const LIST_KEY = 'canteen:feedback:list';
const LEGACY_KEY = 'canteen:feedbacks';

function getRedis(): Redis {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Feedback database is not configured. Missing KV_REST_API_URL / KV_REST_API_TOKEN.'
    );
  }

  return new Redis({ url, token });
}

function parseEntry(raw: unknown): StoredFeedback | null {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || typeof value !== 'object' || !('id' in (value as object))) return null;
    return value as StoredFeedback;
  } catch {
    return null;
  }
}

async function listFeedbacks(): Promise<StoredFeedback[]> {
  const redis = getRedis();
  let rows: any[] = [];

  try {
    const keyType = await redis.type(LIST_KEY);
    if (keyType === 'string') {
      const rawStr = await redis.get(LIST_KEY);
      if (rawStr) {
        const parsed = typeof rawStr === 'string' ? JSON.parse(rawStr) : rawStr;
        if (Array.isArray(parsed)) {
          await redis.del(LIST_KEY);
          for (const item of [...parsed].reverse()) {
            await redis.lpush(LIST_KEY, JSON.stringify(item));
          }
          rows = await redis.lrange(LIST_KEY, 0, 999);
        }
      }
    } else if (keyType === 'list') {
      rows = await redis.lrange(LIST_KEY, 0, 999);
    }
  } catch (e) {
    console.warn('Redis listFeedbacks error, resetting list', e);
  }

  const seen = new Set<string>();
  const entries: StoredFeedback[] = [];

  for (const row of rows || []) {
    const entry = parseEntry(row);
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    entries.push(entry);
  }

  return entries.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

async function purgeFeedbacksOlderThanHours(hours: number = 72): Promise<number> {
  const redis = getRedis();
  const existing = await listFeedbacks();
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  const kept = existing.filter((f) => new Date(String(f.created_at)).getTime() >= cutoffTime);
  const purgedCount = existing.length - kept.length;

  if (purgedCount > 0) {
    await redis.del(LIST_KEY);
    for (const entry of [...kept].reverse()) {
      await redis.lpush(LIST_KEY, JSON.stringify(entry));
    }
  }

  return purgedCount;
}

async function saveFeedback(entry: StoredFeedback): Promise<StoredFeedback> {
  const redis = getRedis();
  try {
    const keyType = await redis.type(LIST_KEY);
    if (keyType === 'string') {
      await redis.del(LIST_KEY);
    }
    await redis.lpush(LIST_KEY, JSON.stringify(entry));
  } catch (e) {
    console.warn('Save feedback Redis fallback', e);
    await redis.del(LIST_KEY);
    await redis.lpush(LIST_KEY, JSON.stringify(entry));
  }
  return entry;
}

async function removeFeedbacks(ids: string[]): Promise<number> {
  const redis = getRedis();
  const idSet = new Set(ids);
  const existing = await listFeedbacks();
  const kept = existing.filter((f) => !idSet.has(f.id));
  const deleted = existing.length - kept.length;

  await redis.del(LIST_KEY);
  // Push oldest first so newest ends at head
  for (const entry of [...kept].reverse()) {
    await redis.lpush(LIST_KEY, JSON.stringify(entry));
  }

  return deleted;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const feedbacks = await listFeedbacks();
      return res.status(200).json({ feedbacks, count: feedbacks.length });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }
      body = body || {};

      if (Array.isArray(body.feedbacks)) {
        const redis = getRedis();
        if (body.overwrite === true) {
          await redis.del(LIST_KEY);
        }
        const savedList = [];
        for (const item of body.feedbacks) {
          if (!item || typeof item !== 'object') continue;
          const id =
            typeof item.id === 'string' && item.id.trim()
              ? item.id
              : `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const created_at =
            typeof item.created_at === 'string' && item.created_at.trim()
              ? item.created_at
              : new Date().toISOString();
          savedList.push(await saveFeedback({ ...item, id, created_at }));
        }
        return res.status(201).json({ feedbacks: savedList, count: savedList.length });
      }

      const entry = body.feedback || body;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return res.status(400).json({ error: 'Feedback payload is required' });
      }

      const id =
        typeof entry.id === 'string' && entry.id.trim()
          ? entry.id
          : `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const created_at =
        typeof entry.created_at === 'string' && entry.created_at.trim()
          ? entry.created_at
          : new Date().toISOString();

      const saved = await saveFeedback({ ...entry, id, created_at });
      console.log('Feedback saved', saved.id, saved.employee_name);
      return res.status(201).json({ feedback: saved });
    }

    if (req.method === 'DELETE') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }
      body = body || {};

      const action = req.query?.action || body.action;
      if (action === 'purge_72h') {
        const hours = Number(req.query?.hours || body.hours) || 72;
        const purged = await purgeFeedbacksOlderThanHours(hours);
        return res.status(200).json({ ok: true, purged, message: `Successfully purged records older than ${hours} hours` });
      }

      const ids: string[] = Array.isArray(body.ids)
        ? body.ids.map(String)
        : body.id
          ? [String(body.id)]
          : [];

      if (ids.length === 0) {
        return res.status(400).json({ error: 'Feedback id(s) required or specify action=purge_72h' });
      }

      const deleted = await removeFeedbacks(ids);
      return res.status(200).json({ ok: true, deleted });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return res.status(500).json({
      error: 'Failed to process feedback request',
      details: error?.message || String(error),
    });
  }
}
