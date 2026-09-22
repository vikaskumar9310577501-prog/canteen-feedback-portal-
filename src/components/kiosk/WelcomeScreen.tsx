import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SystemSettings } from '../../types/database';
import { ArrowRight, Languages, Clock, LayoutDashboard } from 'lucide-react';
import { PgLogo } from '../common/PgLogo';

interface Props {
  settings: SystemSettings;
  onStart: () => void;
  onChangeLanguage: () => void;
  onBackToDashboard?: () => void;
}

export const WelcomeScreen: React.FC<Props> = ({
  settings,
  onStart,
  onChangeLanguage,
  onBackToDashboard,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/80 space-y-6"
      >
        {/* PG Logo Header */}
        <div className="flex flex-col items-center justify-center">
          <PgLogo className="h-14 sm:h-16 mb-2" showText={true} />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t('welcome.heading')}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto font-medium">
            {t('welcome.subheading')}
          </p>
        </div>

        {/* Start Button & Navigation */}
        <div className="pt-2 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{t('welcome.startButton')}</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <button
            onClick={onChangeLanguage}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {i18n.language === 'hi' ? 'Change Language (English)' : 'भाषा बदलें (हिन्दी)'}
            </span>
          </button>

          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>← Return to Admin Dashboard</span>
            </button>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('welcome.takeLessThan30s')}</span>
        </div>
      </motion.div>
    </div>
  );
};
