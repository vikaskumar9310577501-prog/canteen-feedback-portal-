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

  const toYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayStr = toYMD(today);

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = toYMD(yesterday);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  const sevenDaysAgoStr = toYMD(sevenDaysAgo);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfMonthStr = toYMD(startOfMonth);

  const last30Days = new Date();
  last30Days.setDate(today.getDate() - 29);
  const last30DaysStr = toYMD(last30Days);

  const isFiltered = Boolean(startDate || endDate);

  const getDisplayText = () => {
    if (!startDate && !endDate) return 'Filter by Date';
    if (startDate && endDate) {
      if (startDate === endDate) {
        if (startDate === todayStr) return 'Today';
        if (startDate === yesterdayStr) return 'Yesterday';
        return formatDateDisplay(startDate);
      }
      if (startDate === sevenDaysAgoStr && endDate === todayStr) {
        return 'Last 7 Days';
      }
      if (startDate === startOfMonthStr && endDate === todayStr) {
        return 'This Month';
      }
      if (startDate === last30DaysStr && endDate === todayStr) {
        return 'Last 30 Days';
      }
      return `${formatDateDisplay(startDate)} — ${formatDateDisplay(endDate)}`;
    }
    if (startDate) return `From ${formatDateDisplay(startDate)}`;
    if (endDate) return `Until ${formatDateDisplay(endDate)}`;
    return 'Filter by Date';
  };

  const quickPresets = [
    { label: 'Today', start: todayStr, end: todayStr },
    { label: 'Yesterday', start: yesterdayStr, end: yesterdayStr },
    { label: 'Last 7 Days', start: sevenDaysAgoStr, end: todayStr },
    { label: 'This Month', start: startOfMonthStr, end: todayStr },
    { label: 'Last 30 Days', start: last30DaysStr, end: todayStr },
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
                    <p className="text-[10px] text-slate-500 font-medium">Click any preset for instant filter</p>
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

              {/* 1-Click Quick Preset Buttons */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Quick Presets</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickPresets.map((qp) => {
                    const isSelected = startDate === qp.start && endDate === qp.end;
                    return (
                      <button
                        key={qp.label}
                        type="button"
                        onClick={() => handleSelectRange(qp.start, qp.end)}
                        className={`px-2.5 py-2 text-left rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-500/30'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span>{qp.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleClear()}
                    className={`px-2.5 py-2 text-left rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-between ${
                      !startDate && !endDate
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    <span>All Dates</span>
                    {!startDate && !endDate && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                  </button>
                </div>
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
