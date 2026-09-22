// Sound Effects Utility for Dashboard Popup & Background Notifications

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
};

// Global listener to unlock Web Audio API context safely after user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch {
      // Ignore
    }
  };

  window.addEventListener('click', unlockAudio, { once: false, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: false, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: false, passive: true });
}

/**
 * Play a clear, loud double-chime sound effect for Dashboard Popup alerts
 */
export const playDashboardPopupSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Chime Tone 1: High crisp bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5 note
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5 note

    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Chime Tone 2: Harmonious high note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6 note

    gain2.gain.setValueAtTime(0.7, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio play exception
  }
};

/**
 * Play a distinct background tab alert sound chime
 */
export const playBackgroundTabNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 3-tone urgency chime (E5 -> G5 -> C6)
    [659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.6, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.3);
    });
  } catch (e) {
    // Background audio exception
  }
};

/**
 * Request OS Desktop Notification Permissions
 */
export const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.warn('Notification permission error', e);
      }
    }
  }
};

let titleInterval: any = null;
let originalTitle = typeof document !== 'undefined' ? document.title : 'PG Canteen Feedback Portal';

/**
 * Send OS Desktop Notification & Flash Browser Tab Title when on another tab
 */
export const sendDesktopNotification = (title: string, body: string, iconUrl?: string) => {
  // 1. Flash Browser Title bar so user notices the tab
  if (typeof document !== 'undefined') {
    if (!originalTitle || originalTitle.includes('🔔')) {
      originalTitle = 'PG Canteen Feedback Portal';
    }

    if (titleInterval) clearInterval(titleInterval);
    let flashCount = 0;
    titleInterval = setInterval(() => {
      document.title = flashCount % 2 === 0 ? `(1) 🔔 ${title}` : originalTitle;
      flashCount++;
      if (flashCount > 12) {
        clearInterval(titleInterval);
        document.title = originalTitle;
      }
    }, 800);
  }

  // 2. Trigger OS Native Desktop Notification (desktop only — Android throws Illegal constructor)
  if (typeof window !== 'undefined' && typeof Notification === 'function') {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: iconUrl || '/pg-logo.png',
          requireInteraction: true,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Desktop notification spawn error', e);
      }
    }
  }
};
