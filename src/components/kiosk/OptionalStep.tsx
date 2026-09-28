import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Loader2, 
  Languages, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchGoogleTransliteration } from '../../lib/transliterateHindi';
import { compressImage, readFileAsDataUrl } from '../../lib/mediaUtils';

interface Props {
  remark: string;
  onChangeRemark: (val: string) => void;
  satisfactionStatus?: 'satisfied' | 'unsatisfied';
  onChangeSatisfactionStatus: (val: 'satisfied' | 'unsatisfied') => void;
  images: string[];
  onChangeImages: (val: string[]) => void;
  videoUrl?: string;
  onChangeVideoUrl: (val?: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const OptionalStep: React.FC<Props> = ({
  remark,
  onChangeRemark,
  satisfactionStatus,
  onChangeSatisfactionStatus,
  images,
  onChangeImages,
  videoUrl,
  onChangeVideoUrl,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const { t, i18n } = useTranslation();
  const [remarkLength, setRemarkLength] = useState(remark.length);
  const [isHindiTransliterationOn, setIsHindiTransliterationOn] = useState<boolean>(i18n.language === 'hi');
  const [isProcessingMedia, setIsProcessingMedia] = useState<boolean>(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images.');
      return;
    }

    setIsProcessingMedia(true);
    const newImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, 1000, 0.75);
        newImages.push(compressed);
      }
      onChangeImages(newImages);
      toast.success(`${files.length} photo(s) added successfully.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process image');
    } finally {
      setIsProcessingMedia(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    onChangeImages(next);
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file.');
      return;
    }

    setIsProcessingMedia(true);
    try {
      const dataUrl = await readFileAsDataUrl(file, 8 * 1024 * 1024);
      onChangeVideoUrl(dataUrl);
      toast.success('Video attached successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process video. Max size is 8MB.');
    } finally {
      setIsProcessingMedia(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
    onChangeVideoUrl(undefined);
    if (videoInputRef.current) videoInputRef.current.value = '';
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() => setIsHindiTransliterationOn(!isHindiTransliterationOn)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
            isHindiTransliterationOn
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
          title="Toggle Phonetic Hindi Keyboard"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isHindiTransliterationOn ? 'अ / A हिन्दी टाइपिंग चालू' : 'Hindi Typing Off'}</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Final Step & Feedback
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Please confirm your satisfaction status, add suggestions or evidence photos/videos if needed.
          </p>
        </div>

        {/* 1. Satisfaction Status Prompt (Satisfied vs Unsatisfied) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Overall Experience / आपका अनुभव <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChangeSatisfactionStatus('satisfied')}
              className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                satisfactionStatus === 'satisfied'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-500/10'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                satisfactionStatus === 'satisfied' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-sm font-extrabold">Satisfied</div>
                <div className="text-[11px] font-medium opacity-80">संतुष्ट</div>
              </div>
              {satisfactionStatus === 'satisfied' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onChangeSatisfactionStatus('unsatisfied')}
              className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                satisfactionStatus === 'unsatisfied'
                  ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-md shadow-rose-500/10'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                satisfactionStatus === 'unsatisfied' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <ThumbsDown className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className="text-sm font-extrabold">Unsatisfied</div>
                <div className="text-[11px] font-medium opacity-80">असंतुष्ट / शिकायत</div>
              </div>
              {satisfactionStatus === 'unsatisfied' && (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
            </button>
          </div>

          {satisfactionStatus === 'unsatisfied' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 mt-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Grievance Alert:</strong> Your feedback will be flagged as an urgent complaint and forwarded to Canteen Admin & HR for corrective action.
              </span>
            </motion.div>
          )}
        </div>

        {/* 2. Photo & Video Upload */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Attach Photos / Video</span>
              <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <span className="text-[11px] text-slate-400">Photos max 5, Video max 8MB</span>
          </div>

          {/* Hidden Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageFileChange}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoFileChange}
          />

          {/* Upload Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProcessingMedia || images.length >= 5}
              onClick={() => imageInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>+ Add Photos ({images.length}/5)</span>
            </button>

            {!videoUrl ? (
              <button
                type="button"
                disabled={isProcessingMedia}
                onClick={() => videoInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Video className="w-4 h-4 text-blue-600" />
                <span>+ Add Video</span>
              </button>
            ) : null}
          </div>

          {isProcessingMedia && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold p-2 bg-emerald-50 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Processing media attachment...</span>
            </div>
          )}

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                  <img
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video Preview */}
          {videoUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video mt-2">
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors cursor-pointer"
                title="Remove Video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 3. Suggestion Textarea */}
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
            rows={3}
            value={remark}
            onChange={handleRemarkChange}
            onBlur={handleRemarkBlur}
            placeholder={isHindiTransliterationOn ? 'उदा. रोटी कच्ची थी / खाना अच्छा था... (Max 500 characters)' : t('optionalInfo.remarkPlaceholder')}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
          disabled={isSubmitting || isProcessingMedia}
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
