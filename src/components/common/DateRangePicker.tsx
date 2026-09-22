import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, X, ChevronDown, Check, Sparkles } from 'lucide-react';

export interface DateRange {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export const isDateInRange = (created_at: string, startDate?: string, endDate?: string): boolean => {
  if (!startDate && !endDate) return true;
  const itemDate = new Date(created_at).getTime();
  
  if (startDate) {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    if (sy && sm && sd) {
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0).getTime();
      if (itemDate < start) return false;
    }
  }
  
  if (endDate) {
    const [ey, em, ed] = endDate.split('-').map(Number);
    if (ey && em && ed) {
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime();
      if (itemDate > end) return false;
    }
  }
  
  return true;
};

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (range: DateRange) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate = '',
  endDate = '',
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleSelectExactDate = (dateStr: string) => {
    onChange({ startDate: dateStr, endDate: dateStr });
    setTempStart(dateStr);
    setTempEnd(dateStr);
    setIsOpen(false);
  };

  const handleSelectRange = (s: string, e: string) => {
    onChange({ startDate: s, endDate: e });
    setTempStart(s);
    setTempEnd(e);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange({ startDate: undefined, endDate: undefined });
    setTempStart('');
    setTempEnd('');
    setIsOpen(false);
  };

  const isFiltered = Boolean(startDate || endDate);

  const getDisplayText = () => {
    if (!startDate && !endDate) return 'Filter by Date';
    if (startDate && endDate) {
      if (startDate === endDate) {
        if (startDate === '2026-08-31') return '31 Aug (Latest)';
        if (startDate === '2026-08-26') return '26 Aug 2026';
        if (startDate === '2026-08-25') return '25 Aug 2026';
        if (startDate === '2026-08-24') return '24 Aug 2026';
        if (startDate === '2026-08-22') return '22 Aug 2026';
        if (startDate === '2026-08-21') return '21 Aug 2026';
        return formatDateDisplay(startDate);
      }
      if (startDate === '2026-08-01' && endDate === '2026-08-31') {
        return 'Full August 2026';
      }
      return `${formatDateDisplay(startDate)} — ${formatDateDisplay(endDate)}`;
    }
    if (startDate) return `From ${formatDateDisplay(startDate)}`;
    if (endDate) return `Until ${formatDateDisplay(endDate)}`;
    return 'Filter by Date';
  };

  const quickDates = [
    { label: '31 Aug (Latest Day)', value: '2026-08-31', count: 4 },
    { label: '26 Aug 2026', value: '2026-08-26', count: 4 },
    { label: '25 Aug 2026', value: '2026-08-25', count: 4 },
    { label: '24 Aug 2026', value: '2026-08-24', count: 4 },
    { label: '22 Aug 2026', value: '2026-08-22', count: 2 },
    { label: '21 Aug 2026', value: '2026-08-21', count: 2 },
  ];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
          isFiltered
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs hover:bg-emerald-100'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <CalendarIcon className={`w-3.5 h-3.5 ${isFiltered ? 'text-emerald-600' : 'text-slate-500'}`} />
        <span className="truncate max-w-[180px] sm:max-w-[220px]">{getDisplayText()}</span>
        {isFiltered ? (
          <span
            onClick={handleClear}
            className="p-0.5 hover:bg-emerald-200/60 rounded-full text-emerald-700 transition-colors ml-1 cursor-pointer"
            title="Clear Date Filter"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for outside click */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Modal */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 sm:right-auto sm:left-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Filter Feedbacks by Date</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Click any date for instant 1-click filter</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1-Click Exact Working Date Buttons */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Exact Dates (One-Click)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickDates.map((qd) => {
                    const isSelected = startDate === qd.value && endDate === qd.value;
                    return (
                      <button
                        key={qd.value}
                        type="button"
                        onClick={() => handleSelectExactDate(qd.value)}
                        className={`px-2.5 py-2 text-left rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-500/30'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span>{qd.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Month & Reset Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectRange('2026-08-01', '2026-08-31')}
                  className={`px-2.5 py-1.5 text-center rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                    startDate === '2026-08-01' && endDate === '2026-08-31'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Full August 2026 (All 20)
                </button>
                <button
                  type="button"
                  onClick={() => handleClear()}
                  className="px-2.5 py-1.5 text-center rounded-xl text-[11px] font-bold border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Clear / Show All
                </button>
              </div>

              {/* Custom Date Inputs (Instant Change) */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Custom Range (Auto-Applies Instantly)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">From Date</label>
                    <input
                      type="date"
                      value={tempStart}
                      min="2026-08-01"
                      max="2026-08-31"
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempStart(val);
                        onChange({ startDate: val || undefined, endDate: tempEnd || undefined });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 font-semibold focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">To Date</label>
                    <input
                      type="date"
                      value={tempEnd}
                      min="2026-08-01"
                      max="2026-08-31"
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempEnd(val);
                        onChange({ startDate: tempStart || undefined, endDate: val || undefined });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 font-semibold focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
