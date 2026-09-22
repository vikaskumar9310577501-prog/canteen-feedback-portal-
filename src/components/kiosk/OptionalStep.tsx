import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MessageSquare, Send, Loader2, Languages, Sparkles } from 'lucide-react';
import { fetchGoogleTransliteration } from '../../lib/transliterateHindi';

interface Props {
  remark: string;
  onChangeRemark: (val: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const OptionalStep: React.FC<Props> = ({
  remark,
  onChangeRemark,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const { t, i18n } = useTranslation();
  const [remarkLength, setRemarkLength] = useState(remark.length);
  const [isHindiTransliterationOn, setIsHindiTransliterationOn] = useState<boolean>(i18n.language === 'hi');

  const handleRemarkChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 500) {
      onChangeRemark(val);
      setRemarkLength(val.length);

      if (isHindiTransliterationOn && val.endsWith(' ')) {
        const converted = await fetchGoogleTransliteration(val.trim());
        onChangeRemark(converted + ' ');
      }
    }
  };

  const handleRemarkBlur = async () => {
    if (isHindiTransliterationOn && remark.trim().length > 0) {
      const converted = await fetchGoogleTransliteration(remark.trim());
      onChangeRemark(converted);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg mx-auto p-4 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() => setIsHindiTransliterationOn(!isHindiTransliterationOn)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
            isHindiTransliterationOn
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
          title="Toggle Phonetic Hindi Keyboard"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isHindiTransliterationOn ? 'अ / A हिन्दी टाइपिंग चालू' : 'Hindi Typing Off'}</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('optionalInfo.title')}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            {t('optionalInfo.subtitle')}
          </p>
        </div>

        {/* Suggestion Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('optionalInfo.remarkTitle')}</span>
              <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {remarkLength} / 500
            </span>
          </div>

          {isHindiTransliterationOn && (
            <div className="text-[10px] text-emerald-700 font-bold mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Phonetic Hindi: e.g. "khana bahut acha tha" → "खाना बहुत अच्छा था"</span>
            </div>
          )}

          <textarea
            rows={4}
            value={remark}
            onChange={handleRemarkChange}
            onBlur={handleRemarkBlur}
            placeholder={isHindiTransliterationOn ? 'उदा. खाना बहुत अच्छा था... (Max 500 characters)' : t('optionalInfo.remarkPlaceholder')}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
          disabled={isSubmitting}
          onClick={onSubmit}
          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>{t('optionalInfo.submitting')}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-white" />
              <span>{t('optionalInfo.submitButton')}</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};
