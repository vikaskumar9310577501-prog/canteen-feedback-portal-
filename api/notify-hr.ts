import { Redis } from '@upstash/redis';
import nodemailer from 'nodemailer';

// ─── Types ───
type AdminProfile = {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'hr_admin' | 'canteen_admin' | 'read_only_admin';
  location?: string;
  plant_id?: string;
};

type StoredFeedback = Record<string, unknown> & {
  id: string;
  created_at: string;
  overall_rating?: number;
  plant_name?: string;
  plant_location?: string;
};

// ─── Redis Keys ───
const ADMINS_KEY = 'canteen:admins:list';
const FEEDBACK_KEY = 'canteen:feedback:list';
const LAST_WEEKLY_KEY = 'canteen:notify:last_weekly_sent';

function getRedis(): Redis {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Missing Redis credentials');
  return new Redis({ url, token });
}

function parseEntry<T>(raw: unknown): T | null {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || typeof value !== 'object') return null;
    return value as T;
  } catch {
    return null;
  }
}

// ─── Fetch HR admins from Redis ───
async function getHrAdmins(redis: Redis): Promise<AdminProfile[]> {
  const rows = await redis.lrange(ADMINS_KEY, 0, 999);
  const admins: AdminProfile[] = [];
  const seen = new Set<string>();

  for (const row of rows || []) {
    const admin = parseEntry<AdminProfile>(row);
    if (!admin?.email) continue;
    const key = admin.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    // Include both hr_admin and super_admin for notifications
    if (admin.role === 'hr_admin' || admin.role === 'super_admin') {
      admins.push(admin);
    }
  }

  return admins;
}

// ─── Fetch last 24 hours feedbacks ───
async function getLast24hFeedbacks(redis: Redis): Promise<StoredFeedback[]> {
  const rows = await redis.lrange(FEEDBACK_KEY, 0, 999);
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const entries: StoredFeedback[] = [];

  for (const row of rows || []) {
    const entry = parseEntry<StoredFeedback>(row);
    if (!entry?.id) continue;
    const createdAt = new Date(String(entry.created_at)).getTime();
    if (now - createdAt <= oneDayMs) {
      entries.push(entry);
    }
  }

  return entries;
}

// ─── Calculate Avg Rating ───
function calcAvgRating(feedbacks: StoredFeedback[]): number {
  if (feedbacks.length === 0) return 0;
  const sum = feedbacks.reduce((acc, f) => acc + (Number(f.overall_rating) || 0), 0);
  return Number((sum / feedbacks.length).toFixed(2));
}

// ─── Email Transporter (same SMTP as OTP) ───
function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: 'verify.software2040@pgel.in',
      pass: 'nsxfmjjkskdrbbtt',
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });
}

// ─── Build HTML Email ───
function buildEmailHtml(
  avgRating: number,
  totalFeedbacks: number,
  status: 'poor' | 'good',
  period: 'daily' | 'weekly'
): string {
  const statusColor = status === 'poor' ? '#EF4444' : '#10B981';
  const statusLabel = status === 'poor' ? '⚠️ Below Average — Needs Attention' : '✅ Good Performance';
  const periodLabel = period === 'daily' ? 'Daily Report' : 'Weekly Summary';
  const ratingStars = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid ${statusColor};">
        <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800;">PG Electroplast Ltd</h2>
        <p style="color: ${statusColor}; font-weight: 700; margin: 4px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
          Canteen Feedback • ${periodLabel}
        </p>
      </div>

      <div style="padding: 24px 0; text-align: center;">
        <div style="display: inline-block; background-color: ${status === 'poor' ? '#FEF2F2' : '#F0FDF4'}; border: 2px solid ${statusColor}; border-radius: 16px; padding: 20px 40px; margin: 12px 0;">
          <div style="font-size: 48px; font-weight: 900; color: ${statusColor}; line-height: 1;">
            ${avgRating}
          </div>
          <div style="font-size: 20px; color: ${statusColor}; margin-top: 4px; letter-spacing: 2px;">
            ${ratingStars}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600;">
            Average Rating (out of 5)
          </div>
        </div>

        <div style="margin-top: 20px;">
          <table style="margin: 0 auto; border-collapse: collapse; width: 80%;">
            <tr>
              <td style="padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; background: #f8fafc;">
                <div style="font-size: 24px; font-weight: 900; color: #0f172a;">${totalFeedbacks}</div>
                <div style="font-size: 11px; color: #64748b; font-weight: 600;">Total Feedbacks</div>
              </td>
              <td style="padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; background: ${status === 'poor' ? '#FEF2F2' : '#F0FDF4'};">
                <div style="font-size: 14px; font-weight: 800; color: ${statusColor};">${statusLabel}</div>
                <div style="font-size: 11px; color: #64748b; font-weight: 600;">Status</div>
              </td>
            </tr>
          </table>
        </div>

        ${status === 'poor' ? `
          <div style="margin-top: 20px; padding: 12px 16px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; text-align: left;">
            <p style="margin: 0; font-size: 13px; color: #991B1B; font-weight: 700;">
              ⚡ Action Required: Average rating is below 3.0. Please review canteen operations and take corrective action.
            </p>
          </div>
        ` : ''}
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
        Automated ${periodLabel} • PG Canteen Feedback Portal<br/>
        Sent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </div>
    </div>
  `;
}

// ─── Main Handler ───
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const redis = getRedis();

    // 1. Get HR admins
    const hrAdmins = await getHrAdmins(redis);
    if (hrAdmins.length === 0) {
      return res.status(200).json({ ok: true, message: 'No HR admins configured', sent: 0 });
    }

    // 2. Get last 24h feedbacks
    const recentFeedbacks = await getLast24hFeedbacks(redis);
    if (recentFeedbacks.length === 0) {
      return res.status(200).json({ ok: true, message: 'No feedbacks in last 24h', sent: 0 });
    }

    // 3. Calculate avg
    const avgRating = calcAvgRating(recentFeedbacks);
    const isBelow = avgRating < 3.0;

    // 4. Determine notification type
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    const isMonday = dayOfWeek === 1;

    let shouldSend = false;
    let period: 'daily' | 'weekly' = 'daily';

    if (isBelow) {
      // Poor performance → daily email
      shouldSend = true;
      period = 'daily';
    } else {
      // Good performance → weekly email on Monday only
      if (isMonday) {
        // Check if we already sent this week
        const lastSent = await redis.get(LAST_WEEKLY_KEY);
        const lastSentDate = lastSent ? new Date(String(lastSent)) : null;
        const todayStr = today.toISOString().split('T')[0];

        if (!lastSentDate || lastSentDate.toISOString().split('T')[0] !== todayStr) {
          shouldSend = true;
          period = 'weekly';
          await redis.set(LAST_WEEKLY_KEY, today.toISOString());
        }
      }
    }

    if (!shouldSend) {
      return res.status(200).json({
        ok: true,
        message: `Rating ${avgRating}/5 is good. Weekly email sent only on Mondays.`,
        avgRating,
        sent: 0,
      });
    }

    // 5. Send emails
    const transporter = getTransporter();
    const status = isBelow ? 'poor' : 'good';
    const html = buildEmailHtml(avgRating, recentFeedbacks.length, status, period);
    const subject = isBelow
      ? `⚠️ Canteen Alert: Low Rating ${avgRating}/5 — Immediate Attention Required`
      : `✅ Canteen Weekly Report: Rating ${avgRating}/5 — Good Performance`;

    let sentCount = 0;

    for (const admin of hrAdmins) {
      try {
        await transporter.sendMail({
          from: `"PG Canteen Reports" <verify.software2040@pgel.in>`,
          to: admin.email,
          subject,
          html,
        });
        sentCount++;
        console.log(`[notify-hr] Email sent to ${admin.email} (${period})`);
      } catch (emailErr: any) {
        console.error(`[notify-hr] Failed to send to ${admin.email}:`, emailErr?.message);
      }
    }

    return res.status(200).json({
      ok: true,
      avgRating,
      totalFeedbacks: recentFeedbacks.length,
      status,
      period,
      sentCount,
      recipients: hrAdmins.map((a) => a.email),
    });
  } catch (error: any) {
    console.error('[notify-hr] Error:', error);
    return res.status(500).json({
      error: 'Failed to process notification',
      details: error?.message || String(error),
    });
  }
}
