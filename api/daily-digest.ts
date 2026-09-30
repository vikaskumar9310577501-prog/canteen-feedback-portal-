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

// Bulletproof IST Time Formatter (strictly UTC + 5h 30m)
// Eliminates all server locale / ICU differences so 12:xx noon is 100% strictly PM, never AM
function formatISTTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    // Indian Standard Time is strictly UTC + 5 hours 30 minutes
    const istMs = d.getTime() + (5.5 * 60 * 60 * 1000);
    const istDate = new Date(istMs);

    const hours24 = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const ampm = hours24 >= 12 ? 'PM' : 'AM';

    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;

    const strHours = String(hours12).padStart(2, '0');
    const strMinutes = String(minutes).padStart(2, '0');

    return `${strHours}:${strMinutes} ${ampm}`;
  } catch {
    return '';
  }
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
  topUnsatisfied?: any[];
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
    topUnsatisfied = [],
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

      ${topUnsatisfied && topUnsatisfied.length > 0 ? `
        <!-- Top Unsatisfied Complaints Section -->
        <div style="margin-top: 24px; padding-top: 20px; border-top: 2px dashed #FECACA;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
            <tr>
              <td align="left" style="font-family: Arial, sans-serif; font-size: 13px; font-weight: 900; color: #991B1B; text-transform: uppercase; letter-spacing: 0.5px;">
                ⚠️ Top ${topUnsatisfied.length} Unsatisfied Employee Complaints (Action Required)
              </td>
              <td align="right">
                <span style="font-family: Arial, sans-serif; font-size: 10px; font-weight: 800; color: #991B1B; background-color: #FEE2E2; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #FECACA;">
                  Priority High
                </span>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: separate; border-spacing: 0 10px; font-family: Arial, sans-serif;">
            ${topUnsatisfied.map((item: any, idx: number) => {
              const timeFormatted = formatISTTime(item.created_at);
              const rating = item.overall_rating || 1;
              const remark = item.remark?.trim() || 'Unsatisfactory experience reported';
              const meal = item.meal_type || 'Meal';
              const isResolved = item.action_status === 'resolved';
              const statusLabel = isResolved ? 'Resolved' : 'Action Pending';
              const statusBg = isResolved ? '#DCFCE7' : '#FEE2E2';
              const statusColor = isResolved ? '#166534' : '#991B1B';

              const subScores = [];
              if (item.food_taste) subScores.push(`Taste: ${item.food_taste}★`);
              if (item.food_quality) subScores.push(`Quality: ${item.food_quality}★`);
              if (item.hygiene) subScores.push(`Hygiene: ${item.hygiene}★`);
              if (item.staff_behaviour) subScores.push(`Staff: ${item.staff_behaviour}★`);

              const empName = item.employee_name || item.emp_name;
              const empId = item.employee_id || item.emp_id || item.emp_code;
              const submitterParts: string[] = [];
              if (empName) submitterParts.push(`Employee: <strong>${empName}</strong>`);
              else submitterParts.push(`Employee: <span style="color: #64748B;">Anonymous</span>`);
              if (empId) submitterParts.push(`ID: <strong>${empId}</strong>`);
              if (item.department) submitterParts.push(`Dept: ${item.department}`);
              if (item.shift) submitterParts.push(`Shift: ${item.shift}`);

              const mediaBadges: string[] = [];
              const imgCount = Array.isArray(item.images) ? item.images.length : (item.images ? 1 : 0);
              if (imgCount > 0) {
                mediaBadges.push(`📷 ${imgCount} Photo${imgCount > 1 ? 's' : ''} Attached`);
              }
              if (item.video_url) {
                mediaBadges.push(`🎥 Video Evidence Attached`);
              }

              return `
                <tr>
                  <td style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 12px 14px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="left" style="font-size: 12px; font-weight: 800; color: #0F172A;">
                          <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; background-color: #FCA5A5; color: #7F1D1D; text-align: center; border-radius: 50%; font-size: 11px; font-weight: 900; margin-right: 6px;">${idx + 1}</span>
                          <strong>${meal}</strong> ${timeFormatted ? `(${timeFormatted})` : ''} — 
                          <span style="color: #D97706; font-weight: 800;">★ ${rating}/5</span>
                        </td>
                        <td align="right">
                          <span style="background-color: ${statusBg}; color: ${statusColor}; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
                            ${statusLabel}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 8px; font-size: 12px; color: #334155; line-height: 1.5; font-style: italic;">
                          "${remark}"
                        </td>
                      </tr>
                      ${submitterParts.length > 0 ? `
                        <tr>
                          <td colspan="2" style="padding-top: 6px; font-size: 11px; color: #475569;">
                            👤 ${submitterParts.join(' &bull; ')}
                          </td>
                        </tr>
                      ` : ''}
                      ${mediaBadges.length > 0 ? `
                        <tr>
                          <td colspan="2" style="padding-top: 6px;">
                            ${mediaBadges.map(b => `<span style="display: inline-block; background-color: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-right: 6px;">${b}</span>`).join('')}
                          </td>
                        </tr>
                      ` : ''}
                      ${subScores.length > 0 ? `
                        <tr>
                          <td colspan="2" style="padding-top: 6px; font-size: 10px; color: #64748B; font-weight: 700;">
                            Parameters: ${subScores.join(' • ')}
                          </td>
                        </tr>
                      ` : ''}
                      ${item.action_taken ? `
                        <tr>
                          <td colspan="2" style="padding-top: 6px;">
                            <div style="font-size: 11px; color: #166534; font-weight: 700; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 6px 10px;">
                              ✅ Corrective Action: ${item.action_taken}
                            </div>
                          </td>
                        </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              `;
            }).join('')}
          </table>
          <div style="margin-top: 16px; text-align: center;">
            <a href="https://canteen-feedback-portal.vercel.app" style="display: inline-block; background-color: #0284C7; color: #FFFFFF; font-size: 12px; font-weight: 800; padding: 10px 22px; border-radius: 8px; text-decoration: none; letter-spacing: 0.3px;">
              🔍 Open Admin Portal to Review & Take Action →
            </a>
          </div>
        </div>
      ` : ''}

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

    // Compute current IST date and time with 100% deterministic UTC + 5:30 math
    const nowUtcMs = Date.now();
    const nowIST = new Date(nowUtcMs + (5.5 * 60 * 60 * 1000));
    const currentHour = nowIST.getUTCHours();
    const currentMinute = nowIST.getUTCMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const todayStr = `${nowIST.getUTCFullYear()}-${String(nowIST.getUTCMonth() + 1).padStart(2, '0')}-${String(nowIST.getUTCDate()).padStart(2, '0')}`;

    if (!digestConfig.enabled && !forceSend) {
      return res.status(200).json({
        ok: true,
        message: 'Daily email digest is disabled in settings',
        sent: false,
      });
    }

    const isVercelCron = req.headers['x-vercel-cron'] === '1' || 
                         (typeof req.headers['user-agent'] === 'string' && req.headers['user-agent'].includes('vercel-cron'));

    // If running automatically via cron, verify scheduled dispatch time (unless triggered by Vercel's automated cron)
    if (!forceSend && !isTestMode && !isVercelCron) {
      const scheduledParts = (digestConfig.scheduled_time || '20:00').split(':');
      const scheduledHour = parseInt(scheduledParts[0], 10) || 20;
      const scheduledMin = parseInt(scheduledParts[1], 10) || 0;
      const currentTotalMin = currentHour * 60 + currentMinute;
      const scheduledTotalMin = scheduledHour * 60 + scheduledMin;

      if (currentTotalMin < scheduledTotalMin) {
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

    // 3. Determine active plants (load from Redis with fallback)
    let plantsList: StoredPlant[] = PLANTS_LOCAL_FALLBACK;
    try {
      const rawPlants = await redis.get('canteen:plants');
      if (rawPlants) {
        const parsed = typeof rawPlants === 'string' ? JSON.parse(rawPlants) : rawPlants;
        if (Array.isArray(parsed) && parsed.length > 0) {
          plantsList = parsed.filter((p: any) => p && p.is_active !== false);
        }
      }
    } catch (plantsErr) {
      console.warn('[daily-digest] Failed to load plants from Redis, using fallback:', plantsErr);
    }

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

      // Extract Top 5 Unsatisfied Feedbacks (sorted by priority: lowest rating, remarks, newest)
      const topUnsatisfied = plantFeedbacks
        .filter((f) => f.satisfaction_status === 'unsatisfied' || (Number(f.overall_rating) || 0) <= 2)
        .sort((a, b) => {
          const rA = Number(a.overall_rating) || 0;
          const rB = Number(b.overall_rating) || 0;
          if (rA !== rB) return rA - rB;
          const remA = a.remark?.trim() ? 1 : 0;
          const remB = b.remark?.trim() ? 1 : 0;
          if (remA !== remB) return remB - remA;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, 5);

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
        topUnsatisfied,
      });

      const subject = totalCount === 0
        ? `Daily Canteen Feedback Report - ${plantDisplayName} (${dateStr}) - 0 Responses`
        : isHighUnsatisfied
          ? `Immediate Attention Required: Canteen Feedback Improvement - ${plantDisplayName} (${dateStr})`
          : `Daily Canteen Feedback Report - ${plantDisplayName} (${dateStr})`;

      // Check if already sent today for this plant and scheduled time slot
      const scheduledTimeTag = (digestConfig.scheduled_time || '20:00').replace(':', '');
      const sentKey = `canteen:digest:sent:${plant.id}:${todayStr}:${scheduledTimeTag}`;
      const legacySentKey = `canteen:digest:sent:${plant.id}:${todayStr}`;

      if (!forceSend && !isTestMode) {
        const alreadySent = await redis.get(sentKey);
        if (alreadySent) {
          console.log(`[daily-digest] Already sent today for plant ${plantDisplayName} (Slot: ${scheduledTimeTag})`);
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

        // Mark as sent today with 24 hours expiration (only for real automated cron/digest runs, never for test or force runs)
        if (!isTestMode && !forceSend) {
          await redis.set(sentKey, new Date().toISOString(), { ex: 86400 });
          await redis.del(legacySentKey);
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
