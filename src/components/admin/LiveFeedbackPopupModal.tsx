import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, ArrowRight, Star, Building2, Utensils, Clock, MessageSquareText } from 'lucide-react';
import { FeedbackEntry } from '../../types/database';
import { playDashboardPopupSound } from '../../lib/soundEffects';

interface Props {
  feedback: FeedbackEntry | null;
  onClose: () => void;
  onViewFeed: () => void;
}

export const LiveFeedbackPopupModal: React.FC<Props> = ({
  feedback,
  onClose,
  onViewFeed,
}) => {
  // Play chime sound whenever a new real-time feedback popup opens (Request #2)
  useEffect(() => {
    if (feedback) {
      playDashboardPopupSound();
    }
  }, [feedback]);

  if (!feedback) return null;

  const isPositive = feedback.overall_rating >= 4.0;
  const isPoor = feedback.overall_rating <= 2.5;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 sm:p-5 bg-white border border-slate-200 rounded-3xl shadow-2xl space-y-3.5 select-none"
      >
        {/* Top Floating Alert Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-2xl ${
              isPoor ? 'bg-rose-100 text-rose-600' : isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                New Feedback Received!
              </h3>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
                LIVE REALTIME ALERT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Employee Feedback Details */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
                {feedback.employee_name ? feedback.employee_name.charAt(0) : 'E'}
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-xs">{feedback.employee_name || 'Anonymous Employee'}</div>
                <div className="text-[10px] text-slate-500 font-mono">ID: {feedback.employee_id || 'N/A'}</div>
              </div>
            </div>

            <div className={`px-2.5 py-1 rounded-xl font-extrabold text-xs flex items-center gap-1 ${
              isPoor ? 'bg-rose-100 text-rose-700' : isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <span>{feedback.overall_rating}</span>
              <Star className="w-3 h-3 fill-current" />
            </div>
          </div>

          {/* Plant & Meal */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 font-semibold">
            <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-lg truncate max-w-[200px]">
              <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{feedback.plant_display_name || feedback.plant_name}</span>
            </span>
            <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
              <Utensils className="w-3 h-3 text-emerald-600" />
              <span>{feedback.meal_type}</span>
            </span>
            <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>{feedback.shift}</span>
            </span>
          </div>

          {/* Remark Preview if present */}
          {feedback.remark && (
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 italic font-medium flex items-start gap-1.5 mt-1">
              <MessageSquareText className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="line-clamp-2">"{feedback.remark}"</span>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onViewFeed();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View Employee Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
