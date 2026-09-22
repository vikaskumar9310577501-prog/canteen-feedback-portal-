import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    body = body || {};

    const { to, otp, employeeName, type = 'feedback' } = body;

    if (!to || !otp) {
      return res.status(400).json({ error: 'Recipient email and OTP are required' });
    }

    // Microsoft Office 365 Transporter Configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // TLS / STARTTLS
      auth: {
        user: 'verify.software2040@pgel.in',
        pass: 'nsxfmjjkskdrbbtt',
      },
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
    });

    const isLogin = type === 'login';
    const subject = isLogin
      ? `🔒 Admin Portal Security Verification OTP: ${otp}`
      : `🔑 PG Canteen Feedback Verification OTP: ${otp}`;

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #10b981;">
          <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800;">PG Electroplast Ltd</h2>
          <p style="color: #059669; font-weight: 700; margin: 4px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
            Canteen Feedback Portal • Security OTP Verification
          </p>
        </div>

        <div style="padding: 24px 0; text-align: center;">
          <p style="color: #334155; font-size: 15px; margin-bottom: 8px;">Hello <strong>${employeeName || 'Employee'}</strong>,</p>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 24px; line-height: 1.5;">
            ${isLogin 
              ? 'Please enter the 6-digit security OTP below to authorize your Admin Portal login:' 
              : 'Please enter the 6-digit verification OTP below to verify your email address and submit your canteen feedback:'}
          </p>

          <div style="display: inline-block; background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 16px; padding: 16px 36px; letter-spacing: 10px; font-size: 36px; font-weight: 900; color: #047857; margin: 12px 0;">
            ${otp}
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; font-weight: 600;">
            ⏳ This OTP is valid for 10 minutes. Do not share this OTP code with anyone.
          </p>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
          Sent securely via Microsoft Office 365 (verify.software2040@pgel.in)<br/>
          © PG Electroplast Ltd • Official Canteen Feedback Portal
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"PG Canteen Security" <verify.software2040@pgel.in>`,
      to: to,
      subject: subject,
      html: htmlBody,
    });

    console.log('OTP Email Sent via Office 365 SMTP:', info.messageId);

    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully via Office 365 SMTP',
      messageId: info.messageId 
    });
  } catch (err: any) {
    console.error('SMTP Email Error:', err);
    return res.status(500).json({ 
      error: 'Failed to send OTP email', 
      details: err.message || err 
    });
  }
}
