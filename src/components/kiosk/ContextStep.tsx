import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plant, MealType, ShiftType, SystemSettings } from '../../types/database';
import { ArrowLeft, ArrowRight, Building2, UtensilsCrossed, Lock, CheckCircle2 } from 'lucide-react';
import { PgLogo } from '../common/PgLogo';

interface Props {
  plants: Plant[];
  lockedPlant?: Plant | null;
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
  lockedPlant,
  selectedPlant,
  selectedMeal,
  onChangePlant,
  onChangeMeal,
  onChangeShift,
  onNext,
  onBack,
}) => {
  const { t } = useTranslation();

  // Guarantee 100% Unique, Complete Plants List strictly for Feedback Form
  const uniquePlants = useMemo(() => {
    // If a plant is specifically locked via QR code, strictly show ONLY that single plant
    if (lockedPlant) {
      return [{
        ...lockedPlant,
        display_name: (lockedPlant.display_name || `${lockedPlant.location} — ${lockedPlant.name} (${lockedPlant.code})`).trim(),
      }];
    }

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
  }, [plants, lockedPlant]);

  // If locked to a single plant from QR, automatically ensure it is selected
  useEffect(() => {
    if (uniquePlants.length === 1 && selectedPlant !== uniquePlants[0].id) {
      onChangePlant(uniquePlants[0].id);
    }
  }, [uniquePlants, selectedPlant, onChangePlant]);

  const effectiveSelectedPlant = selectedPlant || (uniquePlants.length === 1 ? uniquePlants[0].id : '');
  const isValid = Boolean(selectedMeal && effectiveSelectedPlant);

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
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manufacturing Plant & Location <span className="text-rose-500">*Required</span></span>
            </label>
            {(lockedPlant || uniquePlants.length === 1) && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-emerald-600" />
                <span>Assigned to this Plant QR</span>
              </span>
            )}
          </div>

          <select
            value={effectiveSelectedPlant}
            onChange={(e) => onChangePlant(e.target.value)}
            disabled={Boolean(lockedPlant || uniquePlants.length === 1)}
            className={`w-full border rounded-2xl p-3.5 text-xs font-extrabold shadow-xs transition-all ${
              lockedPlant || uniquePlants.length === 1
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 cursor-not-allowed'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer'
            }`}
          >
            {uniquePlants.length > 1 && (
              <option value="">Select Plant Location ({uniquePlants.length} available)...</option>
            )}
            {uniquePlants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>

          {(lockedPlant || uniquePlants.length === 1) && (
            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Feedback dedicated exclusively to {uniquePlants[0]?.display_name}</span>
            </p>
          )}
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
