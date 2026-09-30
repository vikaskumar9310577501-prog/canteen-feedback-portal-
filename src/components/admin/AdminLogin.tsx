import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { AdminProfile } from '../../types/database';
import { requestLoginOTP, verifyLoginOTP } from '../../lib/otpService';
import { PgLogo } from '../common/PgLogo';

interface Props {
  onLoginSuccess: (admin: AdminProfile) => void;
  onBackToKiosk?: () => void;
}

export const AdminLogin: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // 30 seconds countdown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setAccessDenied(false);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Please enter a valid company email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Request secure server-side generated 6-digit OTP sent via SMTP
      const res = await requestLoginOTP(cleanEmail);

      if (!res.ok) {
        if (res.error?.includes('valid company') || res.error?.includes('Invalid ID')) {
          setAccessDenied(true);
        }
        toast.error(res.error || 'Please enter a valid company email address.');
        return;
      }

      toast.success(res.message || 'OTP has been sent to your registered email.');
      setStep('otp');
      setResendCooldown(30);
    } catch (err: any) {
      toast.error('Unable to send OTP right now. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = enteredOtp.trim();

    if (cleanOtp.length !== 6) {
      toast.error('Invalid OTP. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Server verifies OTP and authenticates user
      const res = await verifyLoginOTP(cleanEmail, cleanOtp);

      if (!res.ok || !res.admin) {
        toast.error(res.error || 'Invalid OTP. Please try again.');
        return;
      }

      toast.success('Admin OTP Verified successfully!');
      onLoginSuccess(res.admin);
    } catch (err: any) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendAdminOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    const cleanEmail = email.trim().toLowerCase();

    setIsSubmitting(true);
    try {
      const res = await requestLoginOTP(cleanEmail);
      if (!res.ok) {
        toast.error(res.error || 'Unable to send OTP right now. Please try again later.');
        return;
      }

      toast.success(res.message || 'OTP has been sent to your registered email.');
      setResendCooldown(30);
    } catch (err: any) {
      toast.error('Unable to send OTP right now. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg flex items-center justify-end pt-2">
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
                <span>Company Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAccessDenied(false);
                }}
                placeholder="Enter Registered Company Email (e.g. employee@pgel.in)"
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
                  <p>Contact your IT Admin for dashboard access.</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Checking Access...' : 'Send OTP'}</span>
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
              <h3 className="text-lg font-extrabold text-slate-900">Enter OTP</h3>
              <p className="text-xs text-slate-500">
                OTP sent to your registered company email: <strong className="text-emerald-700 font-mono">{email.trim().toLowerCase()}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                required
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="_ _ _ _ _ _"
                className="w-full bg-slate-50 border-2 border-emerald-500 rounded-2xl p-4 text-center text-2xl font-black tracking-widest text-emerald-900 font-mono focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || enteredOtp.length !== 6}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Verify & Login'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs font-semibold pt-1">
              <span className="text-slate-400">Didn't receive OTP?</span>
              {resendCooldown > 0 ? (
                <span className="text-slate-500 font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  Resend OTP in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendAdminOtp}
                  disabled={isSubmitting}
                  className="text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </button>
              )}
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
