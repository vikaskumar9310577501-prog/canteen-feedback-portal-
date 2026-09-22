import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check } from 'lucide-react';
import { PgLogo } from '../common/PgLogo';

export interface RatingOption {
  value: number;
  labelKey: string;
  emoji: string;
}

const RATING_OPTIONS: RatingOption[] = [
  { value: 5, labelKey: 'ratingOptions.very_good', emoji: '😁' },
  { value: 4, labelKey: 'ratingOptions.good', emoji: '😄' },
  { value: 3, labelKey: 'ratingOptions.average', emoji: '😐' },
  { value: 2, labelKey: 'ratingOptions.poor', emoji: '🙁' },
  { value: 1, labelKey: 'ratingOptions.very_poor', emoji: '😠' },
];

interface Props {
  stepIndex: number;
  totalSteps: number;
  questionKey: string;
  currentValue?: number;
  onSelectRating: (value: number) => void;
  onBack: () => void;
}

export const QuestionCard: React.FC<Props> = ({
  stepIndex,
  totalSteps,
  questionKey,
  currentValue,
  onSelectRating,
  onBack,
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | undefined>(currentValue);

  // Reset selected state whenever questionKey / stepIndex changes!
  useEffect(() => {
    setSelected(currentValue);
  }, [questionKey, stepIndex, currentValue]);

  const handleSelect = (val: number) => {
    setSelected(val);
    setTimeout(() => {
      onSelectRating(val);
    }, 240);
  };

  const progressPercentage = Math.round((stepIndex / totalSteps) * 100);

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col justify-between min-h-[82vh]">
      {/* Header & Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>

          <PgLogo className="h-8" showText={false} />

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            {t('questions.progress', { current: stepIndex, total: totalSteps })}
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-6 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.35 }}
            className="h-full bg-emerald-600 rounded-full"
          />
        </div>
      </div>

      {/* Main Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={questionKey}
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -25 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t(`questions.${questionKey}`)}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Select an option to advance
            </p>
          </div>

          {/* 5 Rating Option Cards */}
          <div className="space-y-2.5">
            {RATING_OPTIONS.map((opt) => {
              const isSelected = selected === opt.value;

              return (
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl filter drop-shadow-sm">{opt.emoji}</span>
                    <span className={`font-bold text-base ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {t(opt.labelKey)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {opt.value}/5
                    </span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="text-center text-slate-400 text-[11px] py-2 font-medium">
        Canteen Feedback Portal
      </div>
    </div>
  );
};
