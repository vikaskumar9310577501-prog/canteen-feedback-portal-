import React, { useState, useMemo } from 'react';
import { Download, QrCode, Printer, Copy, Check, X, ExternalLink, Building2, Sparkles, Lock } from 'lucide-react';
import { Plant } from '../../types/database';
import { toast } from 'sonner';

interface Props {
  url?: string;
  plants?: Plant[];
  selectedPlantId?: string;
  className?: string;
}

const PRODUCTION_DOMAIN = 'https://canteen-feedback-portal.vercel.app';

const getBaseKioskUrl = () => {
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
    return `${window.location.origin}?mode=kiosk`;
  }
  return `${PRODUCTION_DOMAIN}?mode=kiosk`;
};

export const buildPlantKioskUrl = (plant?: Plant | null): string => {
  const base = getBaseKioskUrl();
  if (!plant) return base;
  const param = plant.code || plant.id;
  return `${base}&plant=${encodeURIComponent(param)}`;
};

const downloadQrImage = async (targetUrl: string, filename: string) => {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(targetUrl)}&color=000000&bgcolor=ffffff&margin=10`;
  try {
    const res = await fetch(qrApiUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    toast.success(`Downloaded: ${filename}`);
  } catch (err) {
    const a = document.createElement('a');
    a.href = qrApiUrl;
    a.target = '_blank';
    a.download = filename;
    a.click();
  }
};

const printCanteenPoster = (plant: Plant | null, targetUrl: string) => {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(targetUrl)}&color=000000&bgcolor=ffffff&margin=10`;
  const plantTitle = plant ? (plant.display_name || `${plant.location} — ${plant.name} (${plant.code})`) : 'All Units & Locations';
  const plantCode = plant?.code ? `Plant Code: ${plant.code}` : 'All Manufacturing Units';

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    toast.error('Pop-up blocked. Please allow pop-ups to print poster.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>PG Canteen Feedback Poster - ${plantTitle}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 98vh; text-align: center; color: #0f172a; padding: 15px; background: #ffffff; }
          .poster-border { width: 100%; max-width: 620px; border: 3px solid #059669; border-radius: 24px; padding: 32px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background: #ffffff; }
          .header-badge { display: inline-block; background: #047857; color: #ffffff; font-size: 13px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; padding: 6px 20px; border-radius: 999px; margin-bottom: 12px; }
          .company-name { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; margin-bottom: 4px; }
          .portal-title { font-size: 32px; font-weight: 900; color: #059669; letter-spacing: 0.5px; margin-bottom: 10px; }
          .plant-pill { display: inline-block; background: #f0fdf4; border: 2px solid #10b981; color: #065f46; font-size: 16px; font-weight: 800; padding: 8px 24px; border-radius: 14px; margin-bottom: 20px; }
          .qr-container { background: #ffffff; border: 3px solid #e2e8f0; border-radius: 20px; padding: 14px; display: inline-block; box-shadow: 0 6px 20px rgba(0,0,0,0.05); margin-bottom: 18px; }
          .qr-img { width: 270px; height: 270px; display: block; border-radius: 10px; }
          .scan-instruction { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
          .sub-instruction { font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 20px; }
          .steps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 480px; margin: 0 auto 20px auto; text-align: left; }
          .step-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; font-size: 12px; font-weight: 700; color: #334155; }
          .footer-note { font-size: 11px; font-weight: 700; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 14px; }
        </style>
      </head>
      <body>
        <div class="poster-border">
          <div class="header-badge">PG Electroplast Limited</div>
          <div class="company-name">Quality & Employee Care</div>
          <div class="portal-title">CANTEEN FEEDBACK PORTAL</div>
          <div class="plant-pill">📍 ${plantTitle}</div>
          
          <div class="qr-container">
            <img class="qr-img" src="${qrApiUrl}" alt="Feedback QR" />
          </div>

          <div class="scan-instruction">📱 Scan with Smartphone Camera</div>
          <div class="sub-instruction">Takes less than 30 seconds • No app or email required</div>

          <div class="steps-grid">
            <div class="step-box">1️⃣ Open phone camera & point at QR</div>
            <div class="step-box">2️⃣ Rate Taste, Quality & Hygiene</div>
          </div>

          <div class="footer-note">
            ${plantCode} • Official PG Electroplast Ltd Canteen Management System
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const PlantQRModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  plants: Plant[];
  initialPlantId?: string;
}> = ({ isOpen, onClose, plants, initialPlantId }) => {
  const [selectedPlantId, setSelectedPlantId] = useState<string>(initialPlantId || 'all');
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Sync if initialPlantId changes
  React.useEffect(() => {
    if (initialPlantId) {
      setSelectedPlantId(initialPlantId);
    }
  }, [initialPlantId]);

  const activePlant = useMemo(() => {
    if (selectedPlantId === 'all') return null;
    return plants.find((p) => p.id === selectedPlantId) || null;
  }, [plants, selectedPlantId]);

  const generatedUrl = useMemo(() => {
    return buildPlantKioskUrl(activePlant);
  }, [activePlant]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(generatedUrl)}&color=000000&bgcolor=ffffff&margin=10`;

  const filename = activePlant
    ? `canteen-qr-${activePlant.code || activePlant.id}.png`
    : `canteen-qr-universal.png`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedUrl);
    setHasCopied(true);
    toast.success('Feedback URL copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Plant QR Code Generator</span>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Desktop & Kiosk Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Generate, preview and print dedicated QR codes for manufacturing plants</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Column Desktop Layout */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Configuration & Info (7 cols on desktop) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Plant Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Select Manufacturing Plant:</span>
              </label>

              <select
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs transition-colors"
              >
                <option value="all">🌐 Universal QR (All Plants available in dropdown)</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    📍 Plant {p.code} — {p.display_name || `${p.location} — ${p.name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic lock info banner */}
            {activePlant ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 font-medium flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-extrabold text-emerald-900">Plant Locked Mode Enabled</div>
                  <div className="text-[11.5px] text-emerald-800 leading-relaxed">
                    Scanning this QR will automatically select and lock <strong>{activePlant.display_name}</strong> in the employee feedback form. Other plants will remain hidden.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-slate-200 text-slate-600 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-extrabold text-slate-800">Universal Mode (All Plants)</div>
                  <div className="text-[11.5px] text-slate-600 leading-relaxed">
                    Employees scanning this QR code will be able to choose their manufacturing plant from the full active list.
                  </div>
                </div>
              </div>
            )}

            {/* Direct URL preview box */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Direct Kiosk / Feedback Link:
              </label>
              <div className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700">
                <span className="truncate flex-1 select-all">{generatedUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-emerald-700 transition-colors shrink-0 cursor-pointer flex items-center gap-1 text-[11px] font-sans font-bold"
                  title="Copy URL"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-emerald-700 transition-colors shrink-0 cursor-pointer"
                  title="Open Link in New Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Canteen Display Guidance Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-[11.5px] text-amber-900 leading-relaxed">
              <div className="font-extrabold text-amber-950 flex items-center gap-1.5 mb-1">
                <span>💡 Recommended Canteen Deployment</span>
              </div>
              Print and place standees or posters on <strong>dining tables, canteen entry gates, and tray return stations</strong>. Employees can quickly scan with any smartphone camera without downloading any app.
            </div>
          </div>

          {/* Right Column: QR Code Preview & Action Buttons (5 cols on desktop) */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-50/80 to-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
              Live QR Preview
            </div>

            {/* QR Image Card */}
            <div className="bg-white p-3 rounded-2xl border-2 border-emerald-500/30 shadow-md">
              <img
                src={qrImageUrl}
                alt="Plant Canteen QR"
                className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl"
              />
            </div>

            {/* Plant Name & Code Badge */}
            <div className="mt-3">
              <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                {activePlant ? activePlant.display_name : 'Universal PG Canteen QR'}
              </div>
              <div className="inline-block text-[10.5px] text-emerald-800 font-mono font-bold mt-1 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {activePlant ? `URL Plant Code: ${activePlant.code}` : 'Multi-Plant Universal'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => downloadQrImage(generatedUrl, filename)}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-emerald-400"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={() => printCanteenPoster(activePlant, generatedUrl)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/25"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Poster</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const QRCodeCard: React.FC<Props> = ({ 
  url, 
  plants = [], 
  selectedPlantId = 'all',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find if currently filtered by a specific plant on Dashboard
  const matchedFilterPlant = useMemo(() => {
    if (!selectedPlantId || selectedPlantId === 'all') return null;
    return plants.find((p) => p.id === selectedPlantId) || null;
  }, [plants, selectedPlantId]);

  const targetUrl = url || buildPlantKioskUrl(matchedFilterPlant);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}&color=000000&bgcolor=ffffff`;

  const filename = matchedFilterPlant
    ? `canteen-qr-${matchedFilterPlant.code || matchedFilterPlant.id}.png`
    : `canteen-qr-universal.png`;

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className={`relative overflow-hidden rounded-2xl p-1.5 h-[84px] w-full flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-300 group border border-slate-200/90 bg-white shadow-2xs hover:shadow-md hover:border-emerald-400 ${className}`}
        title="Click to view, generate & print Plant QR Codes"
      >
        <div className="flex items-center gap-2.5 pl-1.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5" />
          </div>

          <div className="text-left">
            <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <span>{matchedFilterPlant ? `Plant ${matchedFilterPlant.code} QR` : 'Canteen QR'}</span>
              {matchedFilterPlant && <Lock className="w-2.5 h-2.5 text-emerald-600" />}
            </div>
            <div className="text-xs font-black text-slate-800 leading-tight">
              {matchedFilterPlant ? matchedFilterPlant.name : 'Plant QR Code'}
            </div>
            <div className="text-[9px] text-slate-400 font-semibold">
              Click to generate & print
            </div>
          </div>
        </div>

        <div className="relative h-full w-[70px] flex items-center justify-center shrink-0">
          <img
            src={qrImageUrl}
            alt="Canteen Feedback QR"
            className="h-full w-auto object-contain rounded-xl p-0.5 transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
            <Download className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <PlantQRModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plants={plants}
        initialPlantId={matchedFilterPlant?.id || 'all'}
      />
    </>
  );
};
