import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LanguageCode } from '../../types/database';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { PgLogo } from '../common/PgLogo';

interface Props {
  onSelectLanguage: (lang: LanguageCode) => void;
  onBackToDashboard?: () => void;
}

export const LanguageSelector: React.FC<Props> = ({ onSelectLanguage, onBackToDashboard }) => {
  const { i18n } = useTranslation();

  const handleSelect = (lang: LanguageCode) => {
    i18n.changeLanguage(lang);
    onSelectLanguage(lang);
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-slate-200/80 relative overflow-hidden space-y-6"
      >
        {/* Top Header with Official PG Logo */}
        <div className="flex flex-col items-center justify-center">
          <PgLogo className="h-14 sm:h-16 mb-2" showText={false} />
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest mt-1">
            Canteen Suggestion & Feedback Portal
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Choose Your Language
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            अपनी भाषा चुनें / Select your preferred language
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-2">
          {/* English Selection Card */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('en')}
            className="group relative p-6 rounded-2xl bg-slate-50/90 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between h-36 cursor-pointer"
          >
            <div className="flex items-center justify-end">
              <div className="w-8 h-8 rounded-full bg-white group-hover:bg-emerald-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-all shadow-xs border border-slate-200 group-hover:border-emerald-600">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                English
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Continue in English
              </div>
            </div>
          </motion.button>

          {/* Hindi Selection Card */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('hi')}
            className="group relative p-6 rounded-2xl bg-slate-50/90 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between h-36 cursor-pointer"
          >
            <div className="flex items-center justify-end">
              <div className="w-8 h-8 rounded-full bg-white group-hover:bg-emerald-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-all shadow-xs border border-slate-200 group-hover:border-emerald-600">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                हिन्दी
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                हिन्दी में जारी रखें
              </div>
            </div>
          </motion.button>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>← Return to Admin Dashboard</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};
