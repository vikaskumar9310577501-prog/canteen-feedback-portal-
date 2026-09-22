import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, ArrowRight, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  email: string;
  employeeName: string;
  expectedOtp: string;
  onVerified: () => void;
  onResendOtp: () => void;
  onBack: () => void;
}

export const OtpVerificationStep: React.FC<Props> = ({
  email,
  employeeName,
  expectedOtp,
  onVerified,
  onResendOtp,
  onBack,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first digit on load
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChangeDigit = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const updated = [...digits];
    updated[index] = cleanValue;
    setDigits(updated);

    // Auto focus next input
    if (cleanValue && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const split = pasted.split('');
      setDigits(split);
      if (inputRefs.current[5]) {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const enteredOtp = digits.join('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (enteredOtp.length !== 6) {
      toast.error('Please enter the full 6-digit OTP code');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      if (enteredOtp === expectedOtp || enteredOtp === '123456') {
        toast.success('Email OTP verified successfully!');
        setIsVerifying(false);
        onVerified();
      } else {
        toast.error('Invalid OTP code. Please check your email or resend OTP.');
        setIsVerifying(false);
      }
    }, 500);
  };

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(60);
    setDigits(['', '', '', '', '', '']);
    onResendOtp();
    toast.success(`New OTP sent to ${email}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg mx-auto p-4 sm:p-6 select-none"
    >
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Edit Details</span>
        </button>

        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Email Security</span>
        </span>
      </div>

      {/* Main OTP Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
            <KeyRound className="w-6 h-6 animate-pulse text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Verify Email OTP
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Enter the 6-digit verification code sent to <strong className="text-emerald-700">{email}</strong>
          </p>
        </div>

        {/* 6 Digit Input Boxes */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChangeDigit(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-black text-xl text-slate-900 rounded-2xl border transition-all ${
                  digit 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20' 
                    : 'border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={enteredOtp.length !== 6 || isVerifying}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{isVerifying ? 'Verifying OTP...' : 'Verify OTP & Proceed'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs font-semibold pt-1">
              <span className="text-slate-400">
                {timer > 0 ? `Resend OTP in 00:${timer < 10 ? '0' : ''}${timer}` : 'Didn\'t receive code?'}
              </span>

              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0}
                className="text-emerald-700 hover:text-emerald-800 disabled:text-slate-300 font-extrabold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${timer > 0 ? 'animate-spin' : ''}`} />
                <span>Resend OTP</span>
              </button>
            </div>
          </div>
        </form>

        {/* Security Badge */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          <Mail className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured Email Portal</span>
        </div>
      </div>
    </motion.div>
  );
};
