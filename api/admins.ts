import { Redis } from '@upstash/redis';

type AdminProfile = {
  id: string;
  employee_id?: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'hr_admin' | 'canteen_admin' | 'read_only_admin';
  location?: string;
  plant_id?: string;
  created_at?: string;
};

const LIST_KEY = 'canteen:admins:list';

/** Default IT Admin — only this email can login until IT grants more access */
const SEED_IT_ADMIN: AdminProfile = {
  id: 'admin-it-1',
  email: 'software.2040@pgel.in',
  full_name: 'IT Admin',
  role: 'super_admin',
  created_at: new Date().toISOString(),
};

/** Old seed email (SMTP mailbox) — migrate to real IT Admin login id */
const LEGACY_IT_EMAIL = 'verify.software2040@pgel.in';

function getRedis(): Redis {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Missing KV_REST_API_URL / KV_REST_API_TOKEN');
  }
  return new Redis({ url, token });
}

function parseAdmin(raw: unknown): AdminProfile | null {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || typeof value !== 'object' || !('email' in (value as object))) return null;
    return value as AdminProfile;
  } catch {
    return null;
  }
}

async function listAdmins(): Promise<AdminProfile[]> {
  const redis = getRedis();
  const rows = await redis.lrange(LIST_KEY, 0, 999);
  const seen = new Set<string>();
  const admins: AdminProfile[] = [];

  for (const row of rows || []) {
    const admin = parseAdmin(row);
    if (!admin?.email) continue;
    const key = admin.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    admins.push(admin);
  }

  if (admins.length === 0) {
    await redis.lpush(LIST_KEY, JSON.stringify(SEED_IT_ADMIN));
    return [SEED_IT_ADMIN];
  }

  // Fix mistaken seed: SMTP mailbox was stored as IT Admin login
  let changed = false;
  const migrated = admins.map((a) => {
    if (a.email.toLowerCase() === LEGACY_IT_EMAIL) {
      changed = true;
      return { ...a, email: SEED_IT_ADMIN.email, full_name: a.full_name || 'IT Admin', role: 'super_admin' as const };
    }
    return a;
  });

  const hasItAdmin = migrated.some((a) => a.email.toLowerCase() === SEED_IT_ADMIN.email);
  if (!hasItAdmin) {
    migrated.unshift(SEED_IT_ADMIN);
    changed = true;
  }

  if (changed) {
    await saveAdmins(migrated);
    return migrated;
  }

  return admins;
}

async function saveAdmins(admins: AdminProfile[]): Promise<AdminProfile[]> {
  const redis = getRedis();
  await redis.del(LIST_KEY);
  // newest first via lpush oldest→newest reverse
  for (const admin of [...admins].reverse()) {
    await redis.lpush(LIST_KEY, JSON.stringify(admin));
  }
  return admins;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    if (req.method === 'GET') {
      const admins = await listAdmins();
      return res.status(200).json({ admins, count: admins.length });
    }

    if (req.method === 'POST') {
      const admin = body.admin || body;
      if (!admin?.email || !admin?.id) {
        return res.status(400).json({ error: 'Admin id and email are required' });
      }
      const current = await listAdmins();
      const email = String(admin.email).trim().toLowerCase();
      const next = [
        { ...admin, email },
        ...current.filter((a) => a.id !== admin.id && a.email.toLowerCase() !== email),
      ];
      await saveAdmins(next);
      return res.status(201).json({ admins: next, admin: next[0] });
    }

    if (req.method === 'PUT') {
      const admin = body.admin || body;
      if (!admin?.id) {
        return res.status(400).json({ error: 'Admin id is required' });
      }
      const current = await listAdmins();
      const email = String(admin.email || '').trim().toLowerCase();
      const next = current.map((a) =>
        a.id === admin.id ? { ...a, ...admin, email: email || a.email } : a
      );
      await saveAdmins(next);
      return res.status(200).json({ admins: next });
    }

    if (req.method === 'DELETE') {
      const id = body.id ? String(body.id) : '';
      if (!id) return res.status(400).json({ error: 'Admin id is required' });

      const current = await listAdmins();
      const target = current.find((a) => a.id === id);
      // Never allow deleting the last super_admin
      if (target?.role === 'super_admin') {
        const superCount = current.filter((a) => a.role === 'super_admin').length;
        if (superCount <= 1) {
          return res.status(400).json({ error: 'Cannot remove the last IT Admin' });
        }
      }

      const next = current.filter((a) => a.id !== id);
      if (next.length === 0) {
        await saveAdmins([SEED_IT_ADMIN]);
        return res.status(200).json({ admins: [SEED_IT_ADMIN], deleted: 1 });
      }
      await saveAdmins(next);
      return res.status(200).json({ admins: next, deleted: 1 });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Admins API error:', error);
    return res.status(500).json({
      error: 'Failed to process admin request',
      details: error?.message || String(error),
    });
  }
}
