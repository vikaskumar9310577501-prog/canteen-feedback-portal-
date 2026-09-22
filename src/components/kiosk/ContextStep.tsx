import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plant, MealType, ShiftType, SystemSettings } from '../../types/database';
import { ArrowLeft, ArrowRight, Building2, UtensilsCrossed } from 'lucide-react';
import { PgLogo } from '../common/PgLogo';

interface Props {
  plants: Plant[];
  settings?: SystemSettings;
  selectedPlant: string;
  selectedMeal: MealType | '';
  selectedShift: ShiftType | '';
  onChangePlant: (plantId: string) => void;
  onChangeMeal: (meal: MealType) => void;
  onChangeShift: (shift: ShiftType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ContextStep: React.FC<Props> = ({
  plants,
  selectedPlant,
  selectedMeal,
  onChangePlant,
  onChangeMeal,
  onChangeShift,
  onNext,
  onBack,
}) => {
  const { t } = useTranslation();

  const isValid = Boolean(selectedMeal && selectedPlant);

  // Guarantee 100% Unique, Complete Plants List strictly for Feedback Form
  const uniquePlants = useMemo(() => {
    const seen = new Set<string>();
    const result: Plant[] = [];

    for (const p of plants) {
      if (p.is_active === false) continue;
      const label = (p.display_name || `${p.location} — ${p.name} (${p.code})`).trim();
      const key = `${p.location}-${p.name}-${p.code}`.toLowerCase().replace(/[\s\-_()]/g, '');

      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          ...p,
          display_name: label,
        });
      }
    }

    return result;
  }, [plants]);

  // Clean Meal Selection with Auto-Shift assignment (Lunch -> Day Shift, Dinner -> Night Shift)
  const handleSelectMealType = (meal: MealType) => {
    onChangeMeal(meal);
    if (meal === 'Lunch') {
      onChangeShift('Day Shift');
    } else if (meal === 'Dinner') {
      onChangeShift('Night Shift');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col justify-between min-h-[90vh] select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>

          <PgLogo size="sm" showText={false} />

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Meal & Plant
          </span>
        </div>
      </div>

      {/* Main Selection Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 space-y-6"
      >
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Meal & Plant Selection
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Please select your meal type and manufacturing plant location
          </p>
        </div>

        {/* 1. Meal Type Selection (Lunch / Dinner) */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
            <span>Meal Type <span className="text-rose-500">*Required</span></span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSelectMealType('Lunch')}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                selectedMeal === 'Lunch'
                  ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20 text-emerald-900 font-extrabold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'
              }`}
            >
              <div className="text-3xl">🍱</div>
              <span className="text-sm font-extrabold">Lunch</span>
              <span className="text-[11px] text-emerald-700 font-semibold">Afternoon Meal</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMealType('Dinner')}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                selectedMeal === 'Dinner'
                  ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20 text-emerald-900 font-extrabold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'
              }`}
            >
              <div className="text-3xl">🍲</div>
              <span className="text-sm font-extrabold">Dinner</span>
              <span className="text-[11px] text-emerald-700 font-semibold">Night Meal</span>
            </button>
          </div>
        </div>

        {/* 2. Manufacturing Plant Selection (Supports all locations: BHIWADI, SUPA, NOIDA, etc.) */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manufacturing Plant & Location <span className="text-rose-500">*Required</span></span>
          </label>

          <select
            value={selectedPlant}
            onChange={(e) => onChangePlant(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-900 font-extrabold focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
          >
            <option value="">Select Plant Location ({uniquePlants.length} available)...</option>
            {uniquePlants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={!isValid}
          onClick={onNext}
          className={`w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isValid
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Continue to Rating</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Footer Info */}
      <div className="text-center py-2">
        <p className="text-[11px] text-slate-400 font-semibold">
          PG Electroplast Canteen Feedback System
        </p>
      </div>
    </div>
  );
};
