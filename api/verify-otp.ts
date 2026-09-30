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

const ADMINS_LIST_KEY = 'canteen:admins:list';
const SEED_IT_ADMIN: AdminProfile = {
  id: 'admin-it-1',
  email: 'software.2040@pgel.in',
  full_name: 'IT Admin',
  role: 'super_admin',
  created_at: new Date().toISOString(),
};

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

async function findAuthorizedAdmin(redis: Redis, email: string): Promise<AdminProfile | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await redis.lrange(ADMINS_LIST_KEY, 0, 999);
  for (const row of rows || []) {
    const admin = parseAdmin(row);
    if (admin?.email && admin.email.trim().toLowerCase() === normalized) {
      return admin;
    }
  }

  if (normalized === SEED_IT_ADMIN.email.toLowerCase()) {
    return SEED_IT_ADMIN;
  }

  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
      }
    }
    body = body || {};

    const rawEmail = body.email;
    const rawOtp = body.otp;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(400).json({ error: 'Please enter a valid company email address.' });
    }

    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanOtp = String(rawOtp || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    const redis = getRedis();

    // 1. Verify User is authorized in Canteen Admins master data
    const admin = await findAuthorizedAdmin(redis, cleanEmail);
    if (!admin) {
      return res.status(403).json({ error: 'Please enter a valid company email address.' });
    }

    // 2. Master Emergency Code Bypass for Authorized Admins
    const isMasterCode = cleanOtp === '204020';

    if (isMasterCode) {
      // Clear any pending OTP in Redis
      await redis.del(`canteen:otp:${cleanEmail}`);
      return res.status(200).json({
        ok: true,
        message: 'Admin OTP Verified successfully!',
        admin,
      });
    }

    // 3. Fetch Stored OTP from Redis
    const otpKey = `canteen:otp:${cleanEmail}`;
    const rawData = await redis.get(otpKey);

    if (!rawData) {
      return res.status(400).json({ error: 'This OTP has expired. Please request a new OTP.' });
    }

    const stored = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const now = Date.now();

    // Check expiration
    if (!stored?.otp || (stored.expires_at && now > stored.expires_at)) {
      await redis.del(otpKey);
      return res.status(400).json({ error: 'This OTP has expired. Please request a new OTP.' });
    }

    // Check attempts limit (max 5)
    if (typeof stored.attempts === 'number' && stored.attempts >= 5) {
      await redis.del(otpKey);
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    // 4. Validate OTP Value
    if (stored.otp !== cleanOtp) {
      const updatedAttempts = (stored.attempts || 0) + 1;

      if (updatedAttempts >= 5) {
        await redis.del(otpKey);
        return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
      }

      // Calculate remaining TTL
      const remainingSeconds = Math.max(10, Math.floor((stored.expires_at - now) / 1000));
      await redis.set(
        otpKey,
        JSON.stringify({ ...stored, attempts: updatedAttempts }),
        { ex: remainingSeconds }
      );

      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // 5. Successful Verification: Delete OTP immediately (Single-Use Guarantee)
    await redis.del(otpKey);

    // Return the authorized admin profile preserving exact existing role & permissions
    return res.status(200).json({
      ok: true,
      message: 'Admin OTP Verified successfully!',
      admin,
    });
  } catch (error: any) {
    console.error('[verify-otp] Verification error:', error);
    return res.status(500).json({
      error: 'Invalid OTP. Please try again.',
    });
  }
}
