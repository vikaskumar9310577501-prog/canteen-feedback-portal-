import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Star } from 'lucide-react';
import { FeedbackEntry } from '../../types/database';

interface Props {
  alerts: FeedbackEntry[];
  onDismiss: (id: string) => void;
  onViewFeed: () => void;
}

const MAX_VISIBLE = 3;

export const LiveFeedbackPopupModal: React.FC<Props> = ({ alerts, onDismiss, onViewFeed }) => {
  const visible = alerts.slice(0, MAX_VISIBLE);

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col-reverse gap-2 w-[260px] max-w-[calc(100vw-1.5rem)] pointer-events-none">
      <AnimatePresence initial={false}>
        {visible.map((feedback) => (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto bg-white border border-emerald-400 rounded-xl shadow-lg shadow-emerald-900/10 px-2.5 py-2"
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 w-6 h-6 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>

              <button
                type="button"
                onClick={() => {
                  onDismiss(feedback.id);
                  onViewFeed();
                }}
                className="flex-1 min-w-0 text-left cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-black text-slate-900 truncate">
                    #FB-{feedback.id.slice(-5).toUpperCase()}
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    {feedback.overall_rating}
                    <Star className="w-2.5 h-2.5 fill-current" />
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                  {feedback.plant_display_name || feedback.plant_name || feedback.plant_id}
                  {feedback.meal_type ? ` · ${feedback.meal_type}` : ''}
                </p>
              </button>

              <button
                type="button"
                onClick={() => onDismiss(feedback.id)}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {alerts.length > MAX_VISIBLE && (
        <div className="pointer-events-none text-right text-[10px] font-bold text-slate-500 pr-1">
          +{alerts.length - MAX_VISIBLE} more
        </div>
      )}
    </div>
  );
};
