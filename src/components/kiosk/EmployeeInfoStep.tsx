import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { User, IdCard, Phone, ArrowRight, Shield, ArrowLeft } from 'lucide-react';
import { fetchGoogleTransliteration } from '../../lib/transliterateHindi';

interface Props {
  employeeName: string;
  employeeId: string;
  email?: string;
  phone: string;
  onChangeName: (val: string) => void;
  onChangeId: (val: string) => void;
  onChangeEmail?: (val: string) => void;
  onChangePhone: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EmployeeInfoStep: React.FC<Props> = ({
  employeeName,
  employeeId,
  phone,
  onChangeName,
  onChangeId,
  onChangePhone,
  onNext,
  onBack,
}) => {
  const { t, i18n } = useTranslation();
  const isHindiMode = i18n.language === 'hi';

  // Word-by-word silent Hindi Transliteration for Employee Name
  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChangeName(val);

    if (isHindiMode && val.endsWith(' ')) {
      const converted = await fetchGoogleTransliteration(val.trim());
      onChangeName(converted + ' ');
    }
  };

  const handleNameBlur = async () => {
    if (isHindiMode && employeeName.trim().length > 0) {
      const converted = await fetchGoogleTransliteration(employeeName.trim());
      onChangeName(converted);
    }
  };

  // Employee ID: Silent Upper Case Conversion & space removal
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeId(e.target.value.toUpperCase().replace(/\s+/g, ''));
  };

  // Phone Number: Silent 10-digit filter
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChangePhone(digitsOnly);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeName.trim()) {
      alert(isHindiMode ? 'कृपया कर्मचारी का नाम दर्ज करें।' : 'Please enter Employee Name.');
      return;
    }
    if (!employeeId.trim()) {
      alert(isHindiMode ? 'कृपया कर्मचारी आईडी दर्ज करें।' : 'Please enter Employee ID.');
      return;
    }
    if (!phone || phone.length !== 10) {
      alert(isHindiMode ? 'कृपया 10 अंकों का वैध फोन नंबर दर्ज करें।' : 'Please enter a valid 10-digit Phone Number.');
      return;
    }

    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg mx-auto p-4 sm:p-6 select-none"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          Employee Info
        </span>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('empInfo.title')}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {t('empInfo.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('empInfo.nameLabel')}</span>
              <span className="text-rose-500">*</span>
            </label>

            <input
              type="text"
              required
              value={employeeName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              placeholder={isHindiMode ? 'अपना पूरा नाम दर्ज करें' : 'Enter Full Name'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Employee ID & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('empInfo.idLabel')}</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={handleIdChange}
                placeholder={isHindiMode ? 'कर्मचारी आईडी' : 'Enter Employee ID'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('empInfo.phoneLabel')}</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={handlePhoneChange}
                placeholder={isHindiMode ? '10 अंकों का फोन नंबर' : '10-Digit Mobile Number'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
          >
            <span>{t('empInfo.proceedBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strict Employee Data Privacy & Security</span>
        </div>
      </div>
    </motion.div>
  );
};
