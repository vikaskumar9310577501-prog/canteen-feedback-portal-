import React, { useState } from 'react';
import { toast } from 'sonner';
import { LayoutDashboard, Lock } from 'lucide-react';
import { Plant, MealType, ShiftType, LanguageCode, SystemSettings, FeedbackEntry } from '../../types/database';
import { submitFeedback } from '../../lib/supabase';
import { sendFeedbackEmailNotification } from '../../lib/emailService';
import { LanguageSelector } from './LanguageSelector';
import { WelcomeScreen } from './WelcomeScreen';
import { EmployeeInfoStep } from './EmployeeInfoStep';
import { ContextStep } from './ContextStep';
import { QuestionCard } from './QuestionCard';
import { OptionalStep } from './OptionalStep';
import { ThankYouScreen } from './ThankYouScreen';

const SUBMITTED_FLAG_KEY = 'canteen_feedback_submitted_v1';

interface Props {
  plants: Plant[];
  settings: SystemSettings;
  onBackToDashboard?: () => void;
  onOpenAdminLogin?: () => void;
}

// 5 Active Rating Questions
const QUESTION_KEYS = [
  'food_taste',
  'food_quality',
  'staff_behaviour',
  'hygiene',
  'overall_rating',
];

const hasAlreadySubmitted = (): boolean => {
  try {
    return sessionStorage.getItem(SUBMITTED_FLAG_KEY) === '1';
  } catch {
    return false;
  }
};

const markSubmitted = () => {
  try {
    sessionStorage.setItem(SUBMITTED_FLAG_KEY, '1');
  } catch {
    // ignore
  }
};

export const FeedbackFlow: React.FC<Props> = ({ 
  plants, 
  settings, 
  onBackToDashboard,
  onOpenAdminLogin 
}) => {
  // Admin preview from dashboard can restart; public QR users stay on thank you
  const allowRestart = Boolean(onBackToDashboard);

  // Step 0: Language ... Step 10: Thank You
  const [currentStep, setCurrentStep] = useState<number>(() => (hasAlreadySubmitted() && !allowRestart ? 10 : 0));
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');

  const [employeeName, setEmployeeName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [selectedMeal, setSelectedMeal] = useState<MealType | ''>('');
  const [selectedShift, setSelectedShift] = useState<ShiftType | ''>('');
  const [selectedPlant, setSelectedPlant] = useState<string>('');

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [remark, setRemark] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRatingSelect = (qKey: string, val: number) => {
    setRatings((prev) => ({ ...prev, [qKey]: val }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const taste = ratings['food_taste'] || 4;
    const quality = ratings['food_quality'] || 4;
    const staff = ratings['staff_behaviour'] || 4;
    const hygiene = ratings['hygiene'] || 4;

    const calculatedOverall = Number(
      ((taste + quality + staff + hygiene) / 4).toFixed(2)
    );

    const chosenPlantObj = plants.find(p => p.id === selectedPlant) || plants[0];

    const payload: Omit<FeedbackEntry, 'id' | 'created_at'> = {
      language: selectedLanguage,
      plant_id: chosenPlantObj?.id || 'plant-1',
      plant_name: chosenPlantObj?.name || 'PG TECHNOPLAST',
      plant_code: chosenPlantObj?.code || '2040',
      plant_location: chosenPlantObj?.location || 'BHIWADI',
      plant_display_name: chosenPlantObj?.display_name || `${chosenPlantObj?.location || 'BHIWADI'} — ${chosenPlantObj?.name || 'PG TECHNOPLAST'} (${chosenPlantObj?.code || '2040'})`,
      meal_type: (selectedMeal || 'Lunch') as MealType,
      shift: (selectedShift || 'Morning Shift (06:00 - 14:00)') as ShiftType,
      food_taste: taste,
      food_quality: quality,
      staff_behaviour: staff,
      hygiene: hygiene,
      overall_rating: ratings['overall_rating'] || calculatedOverall,
      remark: remark.trim() || undefined,
      employee_name: employeeName.trim() || undefined,
      employee_id: employeeId.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      device_info: 'Touchscreen Terminal',
      browser: navigator.userAgent.substring(0, 80),
      submitted_from: 'Form',
    };

    try {
      await submitFeedback(payload);

      if (settings.enable_email_alerts !== false) {
        sendFeedbackEmailNotification(payload, settings.notification_email, chosenPlantObj);
      }

      markSubmitted();
      toast.success('Feedback submitted successfully!');
      setCurrentStep(10);
    } catch (err: any) {
      console.error('Feedback submit failed', err);
      toast.error(err?.message || 'Failed to submit feedback. Please check internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAll = () => {
    if (!allowRestart) return;
    try {
      sessionStorage.removeItem(SUBMITTED_FLAG_KEY);
    } catch {
      // ignore
    }
    setRatings({});
    setRemark('');
    setEmployeeName('');
    setEmployeeId('');
    setEmail('');
    setPhone('');
    setSelectedMeal('');
    setSelectedShift('');
    setSelectedPlant('');
    setCurrentStep(0);
  };

  const renderTopBar = () => {
    return (
      <div className="w-full max-w-lg mx-auto px-4 pt-3 pb-1 flex items-center justify-between z-50">
        {onBackToDashboard ? (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-extrabold shadow-sm transition-all group cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Return to Admin Dashboard</span>
          </button>
        ) : (
          <div />
        )}

        {onOpenAdminLogin && currentStep !== 10 && (
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-bold transition-all cursor-pointer ml-auto"
          >
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Admin Portal</span>
          </button>
        )}
      </div>
    );
  };

  if (currentStep === 10) {
    return (
      <div>
        {renderTopBar()}
        <ThankYouScreen onReset={handleResetAll} allowRestart={allowRestart} />
      </div>
    );
  }

  if (currentStep === 0) {
    return (
      <div>
        {renderTopBar()}
        <LanguageSelector
          onSelectLanguage={(lang) => {
            setSelectedLanguage(lang);
            setCurrentStep(1);
          }}
          onBackToDashboard={onBackToDashboard}
        />
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <div>
        {renderTopBar()}
        <WelcomeScreen
          settings={settings}
          onStart={() => setCurrentStep(2)}
          onChangeLanguage={() => setCurrentStep(0)}
          onBackToDashboard={onBackToDashboard}
        />
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div>
        {renderTopBar()}
        <EmployeeInfoStep
          employeeName={employeeName}
          employeeId={employeeId}
          email={email}
          phone={phone}
          onChangeName={setEmployeeName}
          onChangeId={setEmployeeId}
          onChangeEmail={setEmail}
          onChangePhone={setPhone}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div>
        {renderTopBar()}
        <ContextStep
          plants={plants}
          settings={settings}
          selectedMeal={selectedMeal}
          selectedShift={selectedShift}
          selectedPlant={selectedPlant}
          onChangeMeal={setSelectedMeal}
          onChangeShift={setSelectedShift}
          onChangePlant={setSelectedPlant}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      </div>
    );
  }

  if (currentStep >= 4 && currentStep <= 8) {
    const qIndex = currentStep - 4;
    const qKey = QUESTION_KEYS[qIndex];

    return (
      <div>
        {renderTopBar()}
        <QuestionCard
          questionKey={qKey}
          stepIndex={qIndex + 1}
          totalSteps={5}
          currentValue={ratings[qKey] || 0}
          onSelectRating={(val) => handleRatingSelect(qKey, val)}
          onBack={() => setCurrentStep((prev) => prev - 1)}
        />
      </div>
    );
  }

  return (
    <div>
      {renderTopBar()}
      <OptionalStep
        remark={remark}
        onChangeRemark={setRemark}
        onSubmit={handleSubmit}
        onBack={() => setCurrentStep(8)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
