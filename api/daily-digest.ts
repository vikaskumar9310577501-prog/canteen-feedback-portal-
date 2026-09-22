import { Redis } from '@upstash/redis';
import nodemailer from 'nodemailer';

// ─── Types ───
type StoredFeedback = {
  id: string;
  language?: string;
  plant_id?: string;
  plant_name?: string;
  plant_code?: string;
  plant_location?: string;
  plant_display_name?: string;
  meal_type?: string;
  shift?: string;
  food_taste?: number;
  food_quality?: number;
  food_quantity?: number;
  cleanliness?: number;
  staff_behaviour?: number;
  service_speed?: number;
  hygiene?: number;
  overall_rating?: number;
  remark?: string;
  employee_name?: string;
  employee_id?: string;
  created_at: string;
};

type StoredPlant = {
  id: string;
  name: string;
  code: string;
  location: string;
  display_name: string;
  is_active: boolean;
  notification_email?: string;
  to_emails?: string[];
  cc_emails?: string[];
};

type PlantDigestRecipients = {
  to_emails: string[];
  cc_emails: string[];
};

type DailyDigestSettings = {
  enabled: boolean;
  to_emails: string[];
  cc_emails: string[];
  scheduled_time: string;
  unsatisfied_threshold_alert: number;
  plant_recipients?: Record<string, PlantDigestRecipients>;
  last_sent_at?: string;
};

type SystemSettingsPayload = {
  daily_digest?: DailyDigestSettings;
  company_name?: string;
};

const FEEDBACK_KEY = 'canteen:feedback:list';
const SETTINGS_KEY = 'canteen:settings';
const PLANTS_LOCAL_FALLBACK: StoredPlant[] = [
  { id: 'plant-1', name: 'PG TECHNOPLAST', code: '2040', location: 'BHIWADI', display_name: 'BHIWADI — PGTL (2040)', is_active: true },
  { id: 'plant-2', name: 'NEXT GENERATION MANUFACTURING', code: '4020', location: 'BHIWADI', display_name: 'BHIWADI — NGM (4020)', is_active: true },
];

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
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false,
    },
  });
}

// Build Clean Executive Email (Plant-Specific)
function buildPlantExecutiveEmailHtml(params: {
  plantName: string;
  plantCode?: string;
  plantLocation: string;
  dateStr: string;
  totalCount: number;
  satisfiedCount: number;
  satisfiedPct: number;
  unsatisfiedCount: number;
  unsatisfiedPct: number;
  isHighUnsatisfied: boolean;
}): string {
  const {
    plantName,
    plantCode,
    plantLocation,
    dateStr,
    totalCount,
    satisfiedCount,
    satisfiedPct,
    unsatisfiedCount,
    unsatisfiedPct,
    isHighUnsatisfied,
  } = params;

  // Format unit tag: e.g. (NGM 4020) BHIWADI or (PGTL 2040) BHIWADI
  const locUpper = (plantLocation || 'BHIWADI').toUpperCase();
  const nameUpper = (plantName || '').toUpperCase();
  let unitTag = '';
  if (plantCode === '4020' || nameUpper.includes('NGM') || nameUpper.includes('NEXT GENERATION')) {
    unitTag = `(NGM 4020) ${locUpper}`;
  } else if (plantCode === '2040' || nameUpper.includes('PGTL') || nameUpper.includes('TECHNOPLAST')) {
    unitTag = `(PGTL 2040) ${locUpper}`;
  } else if (plantCode) {
    unitTag = `(${plantName.split('—')[0].trim()} ${plantCode}) ${locUpper}`;
  } else {
    unitTag = `(${plantName}) ${locUpper}`;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Canteen Feedback Report</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B; line-height: 1.6;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
    
    <!-- Prominent Header: DAILY CANTEEN FEEDBACK (Big & White) + Plant Tag (Outlook Compatible bgcolor) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B132B" style="width: 100%; background-color: #0B132B; border-bottom: 3px solid #0284C7;">
      <tr>
        <td bgcolor="#0B132B" style="padding: 28px 24px; background-color: #0B132B;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="vertical-align: middle;">
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 26px; font-weight: 900; color: #FFFFFF !important; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.5px;">
                  <strong style="color: #FFFFFF;">DAILY CANTEEN FEEDBACK</strong>
                </div>
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #38BDF8 !important; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                  📍 ${unitTag}
                </div>
              </td>
              <td align="right" style="vertical-align: top; white-space: nowrap;">
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #94A3B8 !important; font-weight: 600;">
                  ${dateStr}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Main Body Area -->
    <div style="padding: 28px;">

      <!-- Dear Sir Narrative Letter Header -->
      <div style="font-size: 14px; color: #1E293B; margin-bottom: 18px;">
        <p style="margin: 0 0 14px 0; font-weight: 700; font-size: 15px; color: #0F172A;">
          Dear Sir,
        </p>
      </div>

      <!-- KPI Overview Cards (Positioned Above Content) -->
      <div style="margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0;">
          <tr>
            <td style="width: 33.33%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 8px; text-align: center;">
              <div style="font-size: 26px; font-weight: 900; color: #0F172A;">${totalCount}</div>
              <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">
                Total Submissions
              </div>
            </td>
            <td style="width: 33.33%; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px 8px; text-align: center;">
              <div style="font-size: 26px; font-weight: 900; color: #16A34A;">${satisfiedPct}%</div>
              <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">
                Satisfied (${satisfiedCount})
              </div>
            </td>
            <td style="width: 33.33%; background: ${unsatisfiedCount > 0 ? '#FEF2F2' : '#F8FAFC'}; border: 1px solid ${unsatisfiedCount > 0 ? '#FECACA' : '#E2E8F0'}; border-radius: 12px; padding: 16px 8px; text-align: center;">
              <div style="font-size: 26px; font-weight: 900; color: ${unsatisfiedCount > 0 ? '#DC2626' : '#64748B'};">${unsatisfiedPct}%</div>
              <div style="font-size: 11px; font-weight: 700; color: ${unsatisfiedCount > 0 ? '#991B1B' : '#64748B'}; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">
                Unsatisfied (${unsatisfiedCount})
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Narrative Analysis Content -->
      <div style="font-size: 14px; color: #1E293B; margin-bottom: 24px; line-height: 1.7;">
        ${totalCount === 0 ? `
          <p style="margin: 0 0 14px 0;">
            As per today's canteen feedback report for <strong>${plantName}</strong>, a total of <strong>0</strong> employee feedback submissions were recorded for <strong>${dateStr}</strong>.
          </p>
          <p style="margin: 0;">
            No dissatisfaction complaints or issues were reported by employees for today's meal services. Canteen operations are continuing as per schedule.
          </p>
        ` : isHighUnsatisfied ? `
          <p style="margin: 0 0 14px 0;">
            As per today's canteen feedback report for <strong>${plantName}</strong>, employee satisfaction is very low. Out of <strong>${totalCount}</strong> responses received, <strong>${unsatisfiedCount}</strong> employees have marked the canteen service as unsatisfactory, resulting in a <strong>${unsatisfiedPct}%</strong> dissatisfaction rate (${satisfiedCount} satisfied, ${satisfiedPct}%). Key concerns highlighted include food taste, quality, portion size, cleanliness, and service speed.
          </p>
          <p style="margin: 0 0 14px 0;">
            This level of dissatisfaction is a matter of concern and requires immediate attention. Request you to review the feedback points with the catering team and take necessary corrective actions to improve food quality, hygiene standards, and overall employee experience.
          </p>
          <p style="margin: 0;">
            Please share the action plan and improvement measures at the earliest so that employee concerns can be addressed effectively.
          </p>
        ` : `
          <p style="margin: 0 0 14px 0;">
            As per today's canteen feedback report for <strong>${plantName}</strong>, employee satisfaction is healthy. Out of <strong>${totalCount}</strong> responses received, <strong>${satisfiedCount}</strong> employees have marked the canteen service as satisfactory, resulting in a <strong>${satisfiedPct}%</strong> satisfaction rate (${unsatisfiedCount} unsatisfactory, ${unsatisfiedPct}%).
          </p>
          <p style="margin: 0;">
            We request the catering and canteen operations team to maintain these quality, hygiene, and service standards consistently.
          </p>
        `}
      </div>

    </div>

    <!-- Corporate Footer -->
    <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748B;">
      <div style="font-weight: 700; color: #334155; margin-bottom: 2px;">Canteen Operations & Quality Management</div>
      <div>This is an automated operational report generated for ${plantName}. Distribution preferences are managed via Admin Portal.</div>
    </div>

  </div>
</body>
</html>
  `;
}

// ─── Main Handler ───
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    const isTestMode = body.is_test === true || req.query?.test === 'true';
    const forceSend = body.force === true || isTestMode;
    const requestedPlantId = body.plant_id ? String(body.plant_id).trim() : '';

    const redis = getRedis();

    // 1. Fetch system settings
    const rawSettings = await redis.get(SETTINGS_KEY);
    const settings: SystemSettingsPayload = rawSettings
      ? (typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings)
      : {};

    const digestConfig: DailyDigestSettings = settings.daily_digest || {
      enabled: true,
      to_emails: ['software.2040@pgel.in'],
      cc_emails: ['verify.software2040@pgel.in'],
      scheduled_time: '20:00',
      unsatisfied_threshold_alert: 20,
    };

    // Compute current IST date and time
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const currentHour = nowIST.getHours();
    const currentMinute = nowIST.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const todayStr = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;

    if (!digestConfig.enabled && !forceSend) {
      return res.status(200).json({
        ok: true,
        message: 'Daily email digest is disabled in settings',
        sent: false,
      });
    }

    // If running automatically via cron, verify scheduled dispatch time
    if (!forceSend && !isTestMode) {
      const scheduledHour = parseInt((digestConfig.scheduled_time || '20:00').split(':')[0], 10) || 20;
      if (currentHour < scheduledHour) {
        return res.status(200).json({
          ok: true,
          message: `Current IST time (${currentTimeStr}) is before scheduled dispatch time (${digestConfig.scheduled_time || '20:00'}). Will trigger at scheduled time.`,
          sent: false,
        });
      }
    }

    // 2. Fetch all feedbacks
    const rows = await redis.lrange(FEEDBACK_KEY, 0, 999);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const allRecentFeedbacks: StoredFeedback[] = [];

    for (const row of rows || []) {
      const entry = parseEntry<StoredFeedback>(row);
      if (!entry?.id) continue;
      const createdAt = new Date(String(entry.created_at)).getTime();
      if (now - createdAt <= oneDayMs) {
        allRecentFeedbacks.push(entry);
      }
    }

    // 3. Determine active plants
    let plantsList: StoredPlant[] = PLANTS_LOCAL_FALLBACK;

    // If a specific plant is requested for test
    if (requestedPlantId) {
      plantsList = plantsList.filter((p) => p.id === requestedPlantId || p.code === requestedPlantId);
      if (plantsList.length === 0) {
        plantsList = [{
          id: requestedPlantId,
          name: requestedPlantId,
          code: requestedPlantId,
          location: 'Main Block',
          display_name: requestedPlantId,
          is_active: true,
        }];
      }
    }

    const dateStr = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const transporter = getTransporter();
    const dispatchedReports: Array<{ plant: string; to: string[]; cc: string[]; status: string; messageId?: string }> = [];

    // 4. Send Isolated Email for Each Plant with 100% REAL Counts
    for (const plant of plantsList) {
      // Rigorously filter feedbacks belonging ONLY to this plant
      const targetId = (plant.id || '').toLowerCase().trim();
      const targetCode = (plant.code || '').toLowerCase().trim();
      const targetName = (plant.name || '').toLowerCase().trim();

      const plantFeedbacks = allRecentFeedbacks.filter((f) => {
        const pId = (f.plant_id || '').toLowerCase().trim();
        const pCode = (f.plant_code || '').toLowerCase().trim();
        const pName = (f.plant_name || '').toLowerCase().trim();
        const pDisp = (f.plant_display_name || '').toLowerCase().trim();

        if (targetCode && (pCode === targetCode || pId.includes(targetCode) || pName.includes(targetCode) || pDisp.includes(targetCode))) {
          return true;
        }
        if (targetId && (pId === targetId || pDisp.includes(targetId))) {
          return true;
        }
        if (targetName && (pName.includes(targetName) || pDisp.includes(targetName))) {
          return true;
        }
        return false;
      });

      // If no feedbacks for this plant and not force/test mode, skip
      if (plantFeedbacks.length === 0 && !forceSend) {
        continue;
      }

      // Determine plant-specific recipients
      const plantOverride = digestConfig.plant_recipients?.[plant.id];
      let toEmails: string[] = [];
      let ccEmails: string[] = [];

      if (Array.isArray(body.to_emails) && body.to_emails.length > 0 && isTestMode) {
        toEmails = body.to_emails;
        ccEmails = Array.isArray(body.cc_emails) ? body.cc_emails : [];
      } else if (plantOverride?.to_emails && plantOverride.to_emails.length > 0) {
        toEmails = plantOverride.to_emails;
        ccEmails = plantOverride.cc_emails || [];
      } else if (plant.to_emails && plant.to_emails.length > 0) {
        toEmails = plant.to_emails;
        ccEmails = plant.cc_emails || [];
      } else {
        toEmails = digestConfig.to_emails && digestConfig.to_emails.length > 0 ? digestConfig.to_emails : ['software.2040@pgel.in'];
        ccEmails = digestConfig.cc_emails || [];
      }

      if (toEmails.length === 0) continue;

      // Compute 100% REAL plant metrics
      const totalCount = plantFeedbacks.length;
      const satisfiedList = plantFeedbacks.filter((f) => (Number(f.overall_rating) || 0) >= 3);
      const satisfiedCount = satisfiedList.length;
      const unsatisfiedCount = totalCount - satisfiedCount;

      const satisfiedPct = totalCount > 0 ? Math.round((satisfiedCount / totalCount) * 100) : 0;
      const unsatisfiedPct = totalCount > 0 ? Math.round((unsatisfiedCount / totalCount) * 100) : 0;

      const thresholdAlert = digestConfig.unsatisfied_threshold_alert || 20;
      const isHighUnsatisfied = totalCount > 0 && (unsatisfiedPct >= thresholdAlert || unsatisfiedCount > satisfiedCount);

      const plantDisplayName = plant.display_name || `${plant.location} — ${plant.name} (${plant.code})`;

      const html = buildPlantExecutiveEmailHtml({
        plantName: plantDisplayName,
        plantCode: plant.code,
        plantLocation: plant.location,
        dateStr,
        totalCount,
        satisfiedCount,
        satisfiedPct,
        unsatisfiedCount,
        unsatisfiedPct,
        isHighUnsatisfied,
      });

      const subject = totalCount === 0
        ? `Daily Canteen Feedback Report - ${plantDisplayName} (${dateStr}) - 0 Responses`
        : isHighUnsatisfied
          ? `Immediate Attention Required: Canteen Feedback Improvement - ${plantDisplayName} (${dateStr})`
          : `Daily Canteen Feedback Report - ${plantDisplayName} (${dateStr})`;

      // Check if already sent today for this plant (prevents duplicate emails on automatic cron)
      const sentKey = `canteen:digest:sent:${plant.id}:${todayStr}`;
      if (!forceSend && !isTestMode) {
        const alreadySent = await redis.get(sentKey);
        if (alreadySent) {
          console.log(`[daily-digest] Already sent today for plant ${plantDisplayName}`);
          continue;
        }
      }

      try {
        const sendResult = await transporter.sendMail({
          from: `"Canteen Feedback Operations" <verify.software2040@pgel.in>`,
          to: toEmails.join(', '),
          cc: ccEmails.length > 0 ? ccEmails.join(', ') : undefined,
          subject,
          html,
        });

        // Mark as sent today with 48 hours expiration
        if (!isTestMode) {
          await redis.set(sentKey, new Date().toISOString(), { ex: 172800 });
        }

        console.log(`[daily-digest] Sent email for ${plantDisplayName} to:`, toEmails);
        dispatchedReports.push({
          plant: plantDisplayName,
          to: toEmails,
          cc: ccEmails,
          status: 'sent',
          messageId: sendResult.messageId,
        });
      } catch (sendErr: any) {
        console.error(`[daily-digest] Failed to send for ${plantDisplayName}:`, sendErr?.message);
        dispatchedReports.push({
          plant: plantDisplayName,
          to: toEmails,
          cc: ccEmails,
          status: 'failed: ' + (sendErr?.message || String(sendErr)),
        });
      }
    }

    // 5. Update last sent timestamp in Redis
    const updatedSettings = {
      ...settings,
      daily_digest: {
        ...digestConfig,
        last_sent_at: new Date().toISOString(),
      },
    };
    await redis.set(SETTINGS_KEY, JSON.stringify(updatedSettings));

    return res.status(200).json({
      ok: true,
      message: `Dispatched isolated daily digest emails for ${dispatchedReports.length} plant(s).`,
      dispatchedReports,
    });
  } catch (error: any) {
    console.error('[daily-digest] Error:', error);
    return res.status(500).json({
      error: 'Failed to process plant daily digest emails',
      details: error?.message || String(error),
    });
  }
}
