import React from 'react';
import { Download } from 'lucide-react';

interface Props {
  url?: string;
}

/** Always use stable production URL so QR never points to preview/deployment URLs */
const PRODUCTION_KIOSK_URL = 'https://canteen-feedback-portal.vercel.app?mode=kiosk';

export const QRCodeCard: React.FC<Props> = ({ url }) => {
  const kioskTargetUrl = url || PRODUCTION_KIOSK_URL;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(kioskTargetUrl)}&color=000000&bgcolor=ffffff`;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `pg-canteen-feedback-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      onClick={handleDownload}
      className="relative overflow-hidden rounded-2xl p-1.5 h-[84px] w-full flex items-center justify-center cursor-pointer transition-all duration-300 group border border-slate-200/90 bg-white shadow-2xs hover:shadow-md hover:border-emerald-400"
      title={`Click to download Canteen QR Code (${kioskTargetUrl})`}
    >
      <img
        src={qrImageUrl}
        alt="Canteen Feedback QR"
        className="h-full w-auto object-contain rounded-xl p-0.5 transition-transform duration-200 group-hover:scale-105"
      />
      {/* Subtle hover download overlay indicator */}
      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
        <Download className="w-5 h-5 text-white" />
      </div>
    </div>
  );
};
