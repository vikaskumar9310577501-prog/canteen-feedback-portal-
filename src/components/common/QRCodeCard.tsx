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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-3xl lg:max-w-4xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-6 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">Plant QR Code Generator</h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Desktop & Poster Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Generate dedicated QR codes for specific manufacturing plants</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: 2 Column Desktop Layout */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center">
            
            {/* Left Column: Form Controls & Actions (7 Cols on desktop) */}
            <div className="md:col-span-7 space-y-3.5">
              
              {/* Plant Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select Manufacturing Plant:</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {plants.length} Units Available
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={selectedPlantId}
                    onChange={(e) => setSelectedPlantId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs transition-colors pr-10"
                  >
                    <option value="all">🌐 Universal QR (All Plants available in dropdown)</option>
                    {plants.map((p) => (
                      <option key={p.id} value={p.id}>
                        📍 Plant {p.code} — {p.display_name || `${p.location} — ${p.name}`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Plant Lock Info Status Box */}
                {activePlant ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 font-medium flex items-start gap-2">
                    <div className="w-4 h-4 rounded-md bg-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-emerald-900 text-xs leading-tight">
                        Plant Locked Mode Active
                      </div>
                      <div className="text-[11px] text-emerald-800/90 leading-tight mt-0.5">
                        Scanning this QR will show <u>ONLY {activePlant.display_name}</u> in the form. Other plants will be hidden.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium flex items-start gap-2">
                    <div className="w-4 h-4 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs leading-tight">
                        Universal QR Mode Active
                      </div>
                      <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                        Employees will be able to select any active plant from the dropdown list.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Feedback URL & Copy/Open */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Direct Kiosk / Feedback URL:
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-700 shadow-2xs">
                  <span className="truncate flex-1 font-semibold text-[11px]">{generatedUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-emerald-700 font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                    title="Copy URL"
                  >
                    {hasCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(generatedUrl, '_blank')}
                    className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-all cursor-pointer shrink-0 shadow-2xs"
                    title="Open Link in New Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => downloadQrImage(generatedUrl, filename)}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-400 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download High-Res PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => printCanteenPoster(activePlant, generatedUrl)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/25"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Standee / Poster</span>
                </button>
              </div>

              {/* Setup Guidance Info Banner */}
              <div className="p-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[10.5px] text-slate-500 flex items-center gap-2">
                <span className="text-sm shrink-0">💡</span>
                <span>
                  <strong>Tip for Admin:</strong> Print standees on A4 or sunboard and place them on dining tables and canteen entrance gates.
                </span>
              </div>
            </div>

            {/* Right Column: QR Showcase Card (5 Cols on desktop) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full bg-gradient-to-b from-slate-50 to-emerald-50/40 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-xs">
                
                {/* Ready Badge */}
                <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ready to Scan</span>
                </div>

                {/* QR Code Frame with focus corners */}
                <div className="relative bg-white p-3 rounded-2xl border-2 border-emerald-500/25 shadow-md mb-2.5">
                  <img
                    src={qrImageUrl}
                    alt="Plant Canteen QR"
                    className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 object-contain rounded-xl"
                  />
                  {/* Scanner corner markers */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-600 rounded-tl pointer-events-none" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-600 rounded-tr pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-600 rounded-bl pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-600 rounded-br pointer-events-none" />
                </div>

                {/* Plant Name & Code */}
                <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight max-w-[220px] truncate">
                  {activePlant ? activePlant.display_name : 'Universal PG Canteen QR'}
                </div>
                <div className="text-[10px] text-emerald-700 font-mono font-bold mt-0.5">
                  {activePlant ? `Plant Code: ${activePlant.code}` : 'Multi-Plant Universal Access'}
                </div>
              </div>
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
