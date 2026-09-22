import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { PG_LOGO_DATA_URI } from '../../lib/pgLogoData';

interface Props {
  onComplete: () => void;
}

export const StartScreen: React.FC<Props> = ({ onComplete }) => {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStart = () => {
    setIsPlayingVideo(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
      videoRef.current.play().catch((err) => {
        console.warn('Video play with sound fallback:', err);
        if (videoRef.current) {
          videoRef.current.play();
        }
      });
    }
  };

  const handleVideoEnded = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center select-none overflow-hidden">
      {/* ═══ 1. Clean Minimalist Start Screen (Sample UI Layout) ═══ */}
      {!isPlayingVideo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center justify-center p-6 text-center max-w-md w-full space-y-8"
        >
          {/* Official PG Logo */}
          <div className="flex items-center justify-center">
            <img
              src={PG_LOGO_DATA_URI}
              alt="PG Logo"
              className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-sm"
              loading="eager"
            />
          </div>

          {/* Title: PG CANTEEN PORTAL */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0284c7] tracking-wider uppercase font-sans">
              PG CANTEEN PORTAL
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
              PG Electroplast Ltd
            </p>
          </div>

          {/* Start App Button (Starts Video Animation with Built-in Sound) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleStart}
            className="px-8 sm:px-10 py-3 sm:py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-full font-black text-sm sm:text-base tracking-wide shadow-lg shadow-sky-500/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start App</span>
          </motion.button>
        </motion.div>
      )}

      {/* ═══ 2. Fullscreen Video Animation (Edge-to-edge seamless playback without any black side boxes) ═══ */}
      <div className={`fixed inset-0 z-50 bg-white flex items-center justify-center transition-opacity duration-300 ${
        isPlayingVideo ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <video
          ref={videoRef}
          src="/intro-animation-optimized.mp4"
          preload="auto"
          playsInline
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};
