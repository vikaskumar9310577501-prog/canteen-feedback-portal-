import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, HeartHandshake } from 'lucide-react';

interface Props {
  /** Optional: only for admin preview kiosk — public QR users stay on thank you */
  onReset?: () => void;
  allowRestart?: boolean;
}

export const ThankYouScreen: React.FC<Props> = ({ onReset, allowRestart = false }) => {
  const { t } = useTranslation();

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#f59e0b', '#3b82f6', '#ec4899'],
    });
  }, []);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4 shadow-sm"
        >
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </motion.div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t('thankyou.title')}
        </h1>

        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          {t('thankyou.message')}
        </p>

        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-2 flex items-center justify-center gap-1.5 text-emerald-800 text-xs font-semibold">
          <HeartHandshake className="w-4 h-4" />
          <span>{t('thankyou.subtext')}</span>
        </div>

        <p className="text-slate-500 text-xs mt-2">
          You can close this page now. Thank you for your feedback.
        </p>

        {allowRestart && onReset && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onReset}
            className="w-full mt-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
          >
            <span>{t('thankyou.backHomeNow')}</span>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};
