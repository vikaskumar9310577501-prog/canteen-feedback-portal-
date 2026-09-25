// OTP Generation & Verification Engine using Microsoft Office 365 SMTP (verify.software2040@pgel.in)

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (
  recipientEmail: string,
  otp: string,
  userName: string = 'Employee',
  type: 'feedback' | 'login' = 'feedback'
): Promise<boolean> => {
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmail,
        otp: otp,
        employeeName: userName,
        type: type,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return data?.success !== false;
    }
    return false;
  } catch {
    return false;
  }
};
