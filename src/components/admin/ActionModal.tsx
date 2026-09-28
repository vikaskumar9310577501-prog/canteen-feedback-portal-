import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Camera, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { FeedbackEntry } from '../../types/database';
import { updateFeedbackAction } from '../../lib/supabase';
import { compressImage } from '../../lib/mediaUtils';

interface Props {
  isOpen: boolean;
  feedback: FeedbackEntry | null;
  adminName?: string;
  onClose: () => void;
  onActionSaved: (updatedFeedback: FeedbackEntry) => void;
}

export const ActionModal: React.FC<Props> = ({
  isOpen,
  feedback,
  adminName = 'Canteen Administrator',
  onClose,
  onActionSaved,
}) => {
  const [actionStatus, setActionStatus] = useState<'pending' | 'resolved'>('resolved');
  const [actionTaken, setActionTaken] = useState<string>('');
  const [officerName, setOfficerName] = useState<string>(adminName);
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedback) {
      setActionStatus(feedback.action_status === 'resolved' ? 'resolved' : 'resolved');
      setActionTaken(feedback.action_taken || '');
      setOfficerName(feedback.action_by || adminName);
      setEvidenceUrl(feedback.action_evidence_url || undefined);
    }
  }, [feedback, adminName]);

  if (!isOpen || !feedback) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file');
      return;
    }

    setIsProcessingImage(true);
    try {
      const compressed = await compressImage(file, 1000, 0.75);
      setEvidenceUrl(compressed);
      toast.success('Action proof photo attached');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process image');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveEvidence = () => {
    setEvidenceUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actionTaken.trim()) {
      toast.error('Please enter the description of corrective action taken.');
      return;
    }

    setIsSubmitting(true);
    try {
      const actionData = {
        action_status: actionStatus,
        action_taken: actionTaken.trim(),
        action_by: officerName.trim() || 'Canteen Admin',
        action_at: new Date().toISOString(),
        action_evidence_url: evidenceUrl,
      };

      const result = await updateFeedbackAction(feedback.id, actionData);
      if (result) {
        toast.success(
          actionStatus === 'resolved' 
            ? 'Corrective action marked as RESOLVED!' 
            : 'Action status updated.'
        );
        onActionSaved(result);
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to update action', err);
      toast.error(err?.message || 'Failed to save action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Grievance Redressal
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Take Corrective Action
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Plant: <strong>{feedback.plant_name}</strong> • Ticket: <span className="font-mono text-slate-600">#{feedback.id.slice(0, 8)}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grievance Summary Box */}
          <div className="my-4 p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-rose-900">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Employee Complaint / Remark:</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                Rating: {feedback.overall_rating} ★
              </span>
            </div>
            <p className="text-slate-800 italic font-medium leading-relaxed">
              "{feedback.remark || 'Unsatisfied rating with no written remark'}"
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Action Status Selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Resolution Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActionStatus('resolved')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    actionStatus === 'resolved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Problem Resolved</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionStatus('pending')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    actionStatus === 'pending'
                      ? 'bg-amber-50 text-amber-900 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Under Investigation</span>
                </button>
              </div>
            </div>

            {/* Officer Name */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Action Taken By (Admin / Manager Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="e.g. Vikas Kumar (Canteen In-charge)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Action Description (English Textarea) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Corrective Action Details (In English) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Max 1000 chars</span>
              </div>
              <textarea
                required
                rows={4}
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Describe corrective actions taken in English, e.g.:
• Caterer vendor notified and warning issued.
• Kitchen manager replaced the batch of food.
• Temperature sensor installed on serving counter.
• Staff counseled on hygiene and courteous behavior."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none leading-relaxed"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Official record: Explain the root cause and steps taken so the issue does not recur.
              </p>
            </div>

            {/* Evidence / Proof Photo (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resolution Proof / Evidence Photo</span>
                  <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                </label>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              {!evidenceUrl ? (
                <button
                  type="button"
                  disabled={isProcessingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>{isProcessingImage ? 'Compressing photo...' : '+ Upload Evidence Photo (Optional)'}</span>
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48 group">
                  <img
                    src={evidenceUrl}
                    alt="Action Proof Evidence"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white text-slate-800 text-[11px] font-bold rounded-lg shadow-sm cursor-pointer"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveEvidence}
                      className="px-2.5 py-1 bg-rose-600 text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isProcessingImage}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving Action...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 text-white" />
                    <span>Save Action Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
