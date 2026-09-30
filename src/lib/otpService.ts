import { AdminProfile } from '../types/database';

export interface RequestOtpResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export interface VerifyOtpResponse {
  ok: boolean;
  message?: string;
  admin?: AdminProfile;
  error?: string;
}

/**
 * Request server-side generated 6-digit OTP sent via SMTP
 */
export const requestLoginOTP = async (email: string): Promise<RequestOtpResponse> => {
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || 'Unable to send OTP right now. Please try again later.',
      };
    }

    return {
      ok: true,
      message: data?.message || 'OTP has been sent to your registered email.',
    };
  } catch (err: any) {
    return {
      ok: false,
      error: 'Unable to send OTP right now. Please try again later.',
    };
  }
};

/**
 * Verify 6-digit OTP against server Redis storage
 */
export const verifyLoginOTP = async (email: string, otp: string): Promise<VerifyOtpResponse> => {
  try {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || 'Invalid OTP. Please try again.',
      };
    }

    return {
      ok: true,
      message: data?.message || 'Admin OTP Verified successfully!',
      admin: data?.admin,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: 'Invalid OTP. Please try again.',
    };
  }
};
