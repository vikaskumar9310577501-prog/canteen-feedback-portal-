import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Lock, 
  Star, 
  Building2, 
  Utensils, 
  Calendar, 
  Clock, 
  ThumbsUp, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  ShieldCheck, 
  Wrench, 
  Camera,
  ExternalLink
} from 'lucide-react';
import { FeedbackEntry } from '../../types/database';
import { ActionModal } from './ActionModal';

interface Props {
  isOpen: boolean;
  feedback: FeedbackEntry | null;
  isItAdmin?: boolean;
  adminName?: string;
  onClose: () => void;
  onActionSaved?: (updatedEntry: FeedbackEntry) => void;
}

export const FeedbackDetailModal: React.FC<Props> = ({
  isOpen,
  feedback,
  isItAdmin = true,
  adminName = 'Canteen Administrator',
  onClose,
  onActionSaved,
}) => {
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [activeMediaZoom, setActiveMediaZoom] = useState<string | null>(null);

  if (!isOpen || !feedback) return null;

  const isSatisfied = feedback.satisfaction_status === 'satisfied' || 
    (!feedback.satisfaction_status && feedback.overall_rating >= 4.0);

  const isUnsatisfied = feedback.satisfaction_status === 'unsatisfied' || 
    (!feedback.satisfaction_status && feedback.overall_rating <= 2.5);

  const hasActionTaken = feedback.action_status === 'resolved';
  const hasPendingAction = feedback.action_status === 'pending' || (isUnsatisfied && !hasActionTaken);

  const formattedDate = new Date(feedback.created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(feedback.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <>
      <AnimatePresence>
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative my-6 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    #{feedback.id.slice(0, 8)}
                  </span>

                  {isUnsatisfied ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      <span>Unsatisfied / Grievance</span>
                    </span>
                  ) : isSatisfied ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-600" />
                      <span>Satisfied</span>
                    </span>
                  ) : null}

                  {hasActionTaken ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Action Resolved</span>
                    </span>
                  ) : hasPendingAction ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Action Pending</span>
                    </span>
                  ) : null}
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {feedback.plant_display_name || feedback.plant_name}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto pr-1 py-4 space-y-4 text-xs">
              {/* Corrective Action Section / Grievance Card */}
              {hasActionTaken ? (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-emerald-900 text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Corrective Action Taken (Resolved)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActionModalOpen(true)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Edit Action
                    </button>
                  </div>

                  <p className="text-slate-800 font-medium text-xs leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100">
                    {feedback.action_taken}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                    <span>Action By: <strong>{feedback.action_by || 'Admin'}</strong></span>
                    {feedback.action_at && (
                      <span>Date: {new Date(feedback.action_at).toLocaleString()}</span>
                    )}
                  </div>

                  {/* Resolution Proof Photo if available */}
                  {feedback.action_evidence_url && (
                    <div className="pt-2 border-t border-emerald-200/60">
                      <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                        Resolution Evidence Photo:
                      </span>
                      <div 
                        className="relative rounded-xl overflow-hidden border border-emerald-200 bg-white max-w-xs cursor-pointer group"
                        onClick={() => setActiveMediaZoom(feedback.action_evidence_url!)}
                      >
                        <img
                          src={feedback.action_evidence_url}
                          alt="Action Evidence"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Click to Enlarge</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : hasPendingAction ? (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-black text-amber-900 text-xs uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Action Pending for this Grievance</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      This unsatisfied feedback has not been addressed yet. Record corrective actions taken.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActionModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Take Action Now</span>
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsActionModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3 text-slate-500" />
                    <span>Log Action / Note</span>
                  </button>
                </div>
              )}

              {/* Feedback Rating Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Meal Type</span>
                  <strong className="text-slate-800 text-xs">{feedback.meal_type}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Shift</span>
                  <strong className="text-slate-800 text-xs truncate block">{feedback.shift}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Date & Time</span>
                  <strong className="text-slate-800 text-xs">{formattedDate} {formattedTime}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Overall Rating</span>
                  <strong className="text-amber-500 text-xs flex items-center gap-0.5">
                    ★ {feedback.overall_rating} / 5
                  </strong>
                </div>
              </div>

              {/* Parameter Breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Detailed Rating Breakdown:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">🍲 Taste:</span>
                    <strong className="text-slate-900">{feedback.food_taste} ★</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">🍱 Quality:</span>
                    <strong className="text-slate-900">{feedback.food_quality} ★</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">👥 Staff:</span>
                    <strong className="text-slate-900">{feedback.staff_behaviour} ★</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">✨ Hygiene:</span>
                    <strong className="text-slate-900">{feedback.hygiene} ★</strong>
                  </div>
                </div>
              </div>

              {/* Written Remark */}
              {feedback.remark ? (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Employee Remark / Suggestion:
                  </span>
                  <div className="p-3.5 bg-slate-50 text-slate-800 rounded-2xl italic text-xs leading-relaxed border border-slate-200 font-medium">
                    "{feedback.remark}"
                  </div>
                </div>
              ) : null}

              {/* Attached Photos Gallery */}
              {feedback.images && feedback.images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attached Evidence Photos ({feedback.images.length}):</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {feedback.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square cursor-pointer group"
                        onClick={() => setActiveMediaZoom(img)}
                      >
                        <img
                          src={img}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                          Click to view
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attached Video */}
              {feedback.video_url && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    <span>Attached Evidence Video:</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-60">
                    <video
                      src={feedback.video_url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Submitter Identity Box */}
              {isItAdmin ? (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-purple-900">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Employee Submitter Identity (IT Admin Access)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                      Confidential
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white rounded-lg border border-purple-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Name:</span>
                      <strong className="text-slate-900">{feedback.employee_name || 'Anonymous'}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-purple-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Employee ID:</span>
                      <strong className="text-purple-900 font-mono">{feedback.employee_id || 'N/A'}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-purple-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Email:</span>
                      <strong className="text-slate-700 font-mono text-[11px] truncate block">{feedback.email || 'N/A'}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-purple-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Phone:</span>
                      <strong className="text-slate-700 font-mono text-[11px] block">{feedback.phone || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Employee identity is anonymized and confidential for HR Admin view.</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span className="font-mono text-[10px]">
                Created: {new Date(feedback.created_at).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Media Zoom Lightbox */}
      {activeMediaZoom && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActiveMediaZoom(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setActiveMediaZoom(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white bg-black/50 rounded-full cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeMediaZoom}
              alt="Enlarged Media"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Action Recording Modal */}
      <ActionModal
        isOpen={isActionModalOpen}
        feedback={feedback}
        adminName={adminName}
        onClose={() => setIsActionModalOpen(false)}
        onActionSaved={(updated) => {
          if (onActionSaved) {
            onActionSaved(updated);
          }
        }}
      />
    </>
  );
};
