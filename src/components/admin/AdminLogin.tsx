import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { AdminProfile } from '../../types/database';
import { generateOTP, sendOTPEmail } from '../../lib/otpService';
import { PgLogo } from '../common/PgLogo';

interface Props {
  onLoginSuccess: (admin: AdminProfile) => void;
  onBackToKiosk: () => void;
}

export const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onBackToKiosk }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [pendingAdmin, setPendingAdmin] = useState<AdminProfile | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setAccessDenied(false);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Please enter a valid corporate email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Server allowlist only — never trust localStorage for login
      const response = await fetch('/api/admins', { cache: 'no-store' });
      if (!response.ok) {
        toast.error('Unable to verify access. Please try again.');
        return;
      }
      const data = await response.json();
      const allAdmins: AdminProfile[] = Array.isArray(data?.admins) ? data.admins : [];
      const match = allAdmins.find((a) => a.email.toLowerCase() === cleanEmail);

      // Only IT-approved emails may receive OTP / access dashboard
      if (!match) {
        setAccessDenied(true);
        toast.error('Invalid ID — Contact to your IT Admin');
        return;
      }

      setPendingAdmin(match);

      const otp = generateOTP();
      setGeneratedOtp(otp);

      const sent = await sendOTPEmail(cleanEmail, otp, match.full_name, 'login');
      if (!sent) {
        if (match.role === 'super_admin' || cleanEmail === 'software.2040@pgel.in') {
          toast.warning('Office 365 SMTP restricted on cloud server. IT Master PIN (204020) can be used to authorize.');
          setStep('otp');
          return;
        }
        toast.error('Failed to send OTP email. Please contact IT or check internet.');
        return;
      }

      toast.success(`OTP sent to ${cleanEmail}!`);
      setStep('otp');
    } catch (err) {
      toast.error('Failed to send OTP email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.length !== 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    if (!pendingAdmin) {
      toast.error('Invalid ID — Contact to your IT Admin');
      setStep('credentials');
      return;
    }

    const isMasterCode = 
      (pendingAdmin.role === 'super_admin' || pendingAdmin.email.toLowerCase() === 'software.2040@pgel.in') && 
      enteredOtp === '204020';

    if (enteredOtp === generatedOtp || isMasterCode) {
      toast.success('Admin OTP Verified successfully!');
      onLoginSuccess(pendingAdmin);
    } else {
      toast.error('Invalid Security OTP. Please check your email or resend OTP.');
    }
  };

  const handleResendAdminOtp = async () => {
    if (!pendingAdmin) return;
    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);
    const resubmitted = await sendOTPEmail(pendingAdmin.email, newOtp, pendingAdmin.full_name, 'login');
    if (resubmitted) {
      toast.success(`New OTP sent to ${pendingAdmin.email}`);
    } else {
      if (pendingAdmin.role === 'super_admin' || pendingAdmin.email.toLowerCase() === 'software.2040@pgel.in') {
        toast.info('SMTP restricted by cloud policy. IT Master PIN: 204020');
      } else {
        toast.error('Failed to resend OTP email. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg flex items-center justify-between pt-2">
        <button
          onClick={onBackToKiosk}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← Open Feedback Form
        </button>

        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure OTP Authentication</span>
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 my-auto space-y-5"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <PgLogo className="h-14 mb-2" showText={true} />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
            Admin & HR Access Portal
          </p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin Corporate Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAccessDenied(false);
                }}
                placeholder="Enter Corporate Email Address (e.g. employee@pgel.in)"
                className={`w-full bg-slate-50 border rounded-xl p-3.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none transition-all font-mono ${
                  accessDenied ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
                }`}
              />
            </div>

            {accessDenied && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-800">
                <Ban className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold leading-relaxed">
                  <p className="font-extrabold">Invalid ID</p>
                  <p>Contact to your IT Admin for dashboard access.</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Checking Access...' : 'Send OTP & Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpVerifySubmit} className="space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                OTP Sent
              </span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Enter Admin OTP</h3>
              <p className="text-xs text-slate-500">
                Verification code sent to <strong className="text-emerald-700">{pendingAdmin?.email}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                required
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-Digit OTP"
                className="w-full bg-slate-50 border-2 border-emerald-500 rounded-2xl p-4 text-center text-2xl font-black tracking-widest text-emerald-900 font-mono focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Authorize Login</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs font-semibold pt-1">
              <span className="text-slate-400">Didn't receive OTP?</span>
              <button
                type="button"
                onClick={handleResendAdminOtp}
                className="text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Resend OTP</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>

      <div className="text-center text-[10px] text-slate-400 font-medium pb-2">
        Access is granted only by IT Admin
      </div>
    </div>
  );
};
