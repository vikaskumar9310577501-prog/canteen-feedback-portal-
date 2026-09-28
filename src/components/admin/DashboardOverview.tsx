import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  AreaChart, Area, ResponsiveContainer, 
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { 
  MessageSquare, Star, Smile, AlertCircle, Sparkles, TrendingUp, Filter, RotateCcw,
  Utensils, Sun, Moon, X, MessageSquareText, Coffee, ThumbsUp,
  Clock, Award, Flame, ShieldCheck, HeartHandshake, ChevronRight, PieChart, Check,
  Camera, Video, Wrench, FileCheck, CheckCircle2, ChevronLeft
} from 'lucide-react';
import { DashboardStats, FeedbackEntry, Plant } from '../../types/database';
import { calculateDashboardStats } from '../../lib/supabase';
import { QRCodeCard } from '../common/QRCodeCard';
import { DateRangePicker, DateRange, isDateInRange } from '../common/DateRangePicker';
import { FeedbackDetailModal } from './FeedbackDetailModal';
import { ActionModal } from './ActionModal';

interface Props {
  stats: DashboardStats;
  feedbacks: FeedbackEntry[];
  plants?: Plant[];
  isFilterOpen?: boolean;
  onCloseFilter?: () => void;
  onUpdateEntry?: (updated: FeedbackEntry) => void;
  adminName?: string;
  isItAdmin?: boolean;
}

// SVG Circular Gauge Component for Parameter Scores
const CircularGauge: React.FC<{ pct: number; color: string; size?: number }> = ({ pct, color, size = 42 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} stroke="#f1f5f9" strokeWidth={4.5} fill="none" />
      <circle
        cx={size/2} cy={size/2} r={radius}
        stroke={color}
        strokeWidth={4.5}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

export const DashboardOverview: React.FC<Props> = ({ 
  stats, 
  feedbacks, 
  plants = [],
  isFilterOpen = false,
  onCloseFilter,
  onUpdateEntry,
  adminName = 'Canteen Administrator',
  isItAdmin = true,
}) => {
  const { t } = useTranslation();
  const [kpiPortalEl, setKpiPortalEl] = useState<HTMLElement | null>(null);
  const [activeDetailEntry, setActiveDetailEntry] = useState<FeedbackEntry | null>(null);
  const [actionTarget, setActionTarget] = useState<FeedbackEntry | null>(null);
  const [trendViewMode, setTrendViewMode] = useState<'daily' | 'weekly'>('daily');
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const filterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const syncPortal = () => setKpiPortalEl(document.getElementById('dashboard-kpi-portal'));
    syncPortal();
    const id = window.setTimeout(syncPortal, 50);
    return () => window.clearTimeout(id);
  }, []);

  // Top Filter Controls (Location, Plant, Shift, Date Range)
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('all');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  // Available unique locations list strictly from active configured plants
  const availableLocations = useMemo(() => {
    if (!plants || plants.length === 0) return [];
    const activePlants = plants.filter(p => p.is_active !== false);
    const locations = activePlants.map(p => p.location).filter(Boolean);
    return Array.from(new Set(locations));
  }, [plants]);

  // Available plants list filtered by selected location
  const availablePlants = useMemo(() => {
    const activePlants = plants.filter(p => p.is_active !== false);
    if (selectedLocation === 'all') return activePlants;
    return activePlants.filter(p => p.location?.toLowerCase() === selectedLocation.toLowerCase());
  }, [plants, selectedLocation]);

  // Filtered Feedback Entries based on active Location & Plant & Date selection
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (selectedLocation !== 'all' && f.plant_location?.toLowerCase() !== selectedLocation.toLowerCase()) {
        return false;
      }
      if (selectedPlantId !== 'all' && f.plant_id !== selectedPlantId) {
        return false;
      }
      if (selectedShiftFilter !== 'all' && f.shift !== selectedShiftFilter) {
        return false;
      }
      if (!isDateInRange(f.created_at, startDate, endDate)) {
        return false;
      }
      return true;
    });
  }, [feedbacks, selectedLocation, selectedPlantId, selectedShiftFilter, startDate, endDate]);

  // Dynamically recalculated Dashboard Stats based on active filters
  const currentStats = useMemo(() => {
    return calculateDashboardStats(filteredFeedbacks);
  }, [filteredFeedbacks]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSelectedLocation('all');
    setSelectedPlantId('all');
    setSelectedShiftFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // 1. Calculate Daily Timeline Data (30-day scrollable month timeline covering full month)
  const getTimelineData = () => {
    const dateMap = new Map<string, { count: number; totalRating: number; dateObj: Date }>();

    filteredFeedbacks.forEach((f) => {
      const d = new Date(f.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = dateMap.get(key) || { count: 0, totalRating: 0, dateObj: d };
      existing.count += 1;
      existing.totalRating += f.overall_rating;
      dateMap.set(key, existing);
    });

    const result = [];
    const now = new Date();
    // 30 days continuous timeline so admin can scroll left/right through the whole month
    const totalDays = 30;

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const data = dateMap.get(key);

      const count = data ? data.count : 0;
      const avgRating = data && data.count > 0 ? Number((data.totalRating / data.count).toFixed(1)) : 0;

      result.push({
        key,
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        fullDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
        avgRating,
      });
    }

    return result;
  };

  // 2. Calculate Last 7 Weeks Feedback Data
  const getLast7WeeksData = () => {
    const result = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);

      const weekStartMs = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
      const weekEndMs = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate()).getTime() + 86400000;

      const matching = filteredFeedbacks.filter((f) => {
        const time = new Date(f.created_at).getTime();
        return time >= weekStartMs && time < weekEndMs;
      });

      const weekCount = matching.length;
      const avgRating = weekCount > 0 
        ? Number((matching.reduce((acc, f) => acc + f.overall_rating, 0) / weekCount).toFixed(1))
        : 0;

      const weekLabel = weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      result.push({ 
        week: weekLabel, 
        count: weekCount, 
        avgRating,
        fullWeek: `${weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} — ${weekEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
      });
    }
    return result;
  };

  // 3. Calculate Last 5 Months Feedback Trend Data
  const getLast5MonthsData = () => {
    const result = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = d.getTime();
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();

      const matching = filteredFeedbacks.filter((f) => {
        const time = new Date(f.created_at).getTime();
        return time >= monthStart && time < nextMonth;
      });

      const monthCount = matching.length;
      const avgRating = monthCount > 0 
        ? Number((matching.reduce((acc, f) => acc + f.overall_rating, 0) / monthCount).toFixed(1))
        : 0;

      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      result.push({ month: monthLabel, count: monthCount, avgRating });
    }
    return result;
  };

  const timelineData = useMemo(() => getTimelineData(), [filteredFeedbacks]);
  const last7WeeksData = useMemo(() => getLast7WeeksData(), [filteredFeedbacks]);
  const last5MonthsData = useMemo(() => getLast5MonthsData(), [filteredFeedbacks]);

  // Auto-scroll timeline to the right (latest date) on mount or view switch
  useEffect(() => {
    if (timelineScrollRef.current) {
      const timer = setTimeout(() => {
        if (timelineScrollRef.current) {
          timelineScrollRef.current.scrollLeft = timelineScrollRef.current.scrollWidth;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [trendViewMode, timelineData]);

  const handleScrollTimeline = (direction: 'left' | 'right') => {
    if (timelineScrollRef.current) {
      const amount = 350;
      timelineScrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  const getParameterRealOpinion = (key: 'food_taste' | 'food_quality' | 'staff_behaviour' | 'hygiene') => {
    if (!filteredFeedbacks.length) {
      return {
        avgScore: 0,
        pctScore: 0,
        statusText: 'No Data',
        statusColor: '#94A3B8',
      };
    }

    let sum = 0;
    filteredFeedbacks.forEach((f) => {
      sum += (f[key] || 3);
    });

    const total = filteredFeedbacks.length;
    const avgScore = Number((sum / total).toFixed(1));
    const pctScore = Math.round((avgScore / 5) * 100);

    let statusText = 'Excellent';
    let statusColor = '#10B981';

    if (pctScore >= 80) {
      statusText = 'Excellent';
      statusColor = '#10B981';
    } else if (pctScore >= 70) {
      statusText = 'Good';
      statusColor = '#3B82F6';
    } else if (pctScore >= 55) {
      statusText = 'Average';
      statusColor = '#F59E0B';
    } else {
      statusText = 'Poor';
      statusColor = '#EF4444';
    }

    return { avgScore, pctScore, statusText, statusColor };
  };

  // Meal-wise Analytics
  const mealAnalytics = useMemo(() => {
    const lunchEntries = filteredFeedbacks.filter(f => f.meal_type === 'Lunch');
    const dinnerEntries = filteredFeedbacks.filter(f => f.meal_type === 'Dinner');

    const calcAvg = (entries: FeedbackEntry[]) => {
      if (entries.length === 0) return 0;
      const sum = entries.reduce((acc, curr) => acc + curr.overall_rating, 0);
      return Number((sum / entries.length).toFixed(1));
    };

    return {
      lunchCount: lunchEntries.length,
      lunchAvg: calcAvg(lunchEntries),
      dinnerCount: dinnerEntries.length,
      dinnerAvg: calcAvg(dinnerEntries),
    };
  }, [filteredFeedbacks]);

  // Shift-wise Analytics
  const shiftAnalytics = useMemo(() => {
    const dayEntries = filteredFeedbacks.filter(f => f.shift.toLowerCase().includes('day'));
    const nightEntries = filteredFeedbacks.filter(f => f.shift.toLowerCase().includes('night'));

    const calcAvg = (entries: FeedbackEntry[]) => {
      if (entries.length === 0) return 0;
      const sum = entries.reduce((acc, curr) => acc + curr.overall_rating, 0);
      return Number((sum / entries.length).toFixed(1));
    };

    return {
      dayCount: dayEntries.length,
      dayAvg: calcAvg(dayEntries),
      nightCount: nightEntries.length,
      nightAvg: calcAvg(nightEntries),
    };
  }, [filteredFeedbacks]);

  // Grievances requiring corrective action
  const grievanceFeedbacks = useMemo(() => {
    return filteredFeedbacks.filter(
      f => f.satisfaction_status === 'unsatisfied' || f.overall_rating <= 2.5 || Boolean(f.action_status)
    );
  }, [filteredFeedbacks]);

  const isFilterActive = selectedLocation !== 'all' || selectedPlantId !== 'all' || selectedShiftFilter !== 'all' || Boolean(startDate || endDate);

  // Custom Tooltips for Charts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0]?.payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl text-xs font-bold border border-slate-700/80 space-y-1.5 min-w-[150px]">
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider pb-1 border-b border-slate-700/60">
            {d?.fullWeek || d?.month || label}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 text-[11px] font-medium">Submissions:</span>
            <span className="font-black text-sm" style={{ color: payload[0]?.color || '#10b981' }}>
              {payload[0].value}
            </span>
          </div>
          {typeof d?.avgRating === 'number' && d.avgRating > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300 text-[11px] font-medium">Avg Rating:</span>
              <span className="font-black text-xs text-amber-400 flex items-center gap-0.5">
                ★ {d.avgRating}/5
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const DailyChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0]?.payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl text-xs font-bold border border-slate-700/80 space-y-1.5 min-w-[170px]">
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider pb-1 border-b border-slate-700/60 flex items-center justify-between">
            <span>{d?.fullDate}</span>
            <span className="text-violet-400 font-bold">📅 {d?.dayName || 'Day'}</span>
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 text-[11px] font-medium">Submissions:</span>
            <span className="font-black text-sm text-violet-400">{d?.count || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 text-[11px] font-medium">Avg Rating:</span>
            <span className="font-black text-xs text-amber-400 flex items-center gap-0.5">
              ★ {d?.avgRating ? d.avgRating : '0.0'}/5
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans w-full max-w-[1800px] mx-auto">
      {/* Floating Filter Toolbar (Auto-closes when cursor moves away with 1.5s grace period) */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            onMouseEnter={() => {
              if (filterTimerRef.current) {
                clearTimeout(filterTimerRef.current);
                filterTimerRef.current = null;
              }
            }}
            onMouseLeave={() => {
              if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
              filterTimerRef.current = setTimeout(() => {
                if (onCloseFilter) {
                  onCloseFilter();
                }
              }, 1500);
            }}
            className="overflow-hidden z-20 relative"
          >
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 shadow-2xl text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Filter className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Filter:</span>
                  </span>

                  {/* Date Range / Calendar Filter */}
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(range) => {
                      setStartDate(range.startDate);
                      setEndDate(range.endDate);
                    }}
                  />

                  {/* Location Selector */}
                  <select
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setSelectedPlantId('all');
                    }}
                    className="bg-slate-700/80 border border-slate-600 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-100 focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="all">📍 All Locations ({availableLocations.length})</option>
                    {availableLocations.map((loc) => (
                      <option key={loc} value={loc}>📍 {loc}</option>
                    ))}
                  </select>

                  {/* Plant Selector */}
                  <select
                    value={selectedPlantId}
                    onChange={(e) => setSelectedPlantId(e.target.value)}
                    className="bg-slate-700/80 border border-slate-600 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-100 focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="all">🏭 All Plants ({availablePlants.length})</option>
                    {availablePlants.map((p) => (
                      <option key={p.id} value={p.id}>🏭 {p.display_name || p.name}</option>
                    ))}
                  </select>

                  {isFilterActive && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {onCloseFilter && (
                    <button
                      onClick={onCloseFilter}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Apply & Close Filter"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply</span>
                    </button>
                  )}

                  {onCloseFilter && (
                    <button
                      onClick={onCloseFilter}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards Portaled into Sticky Top Header Stack */}
      {kpiPortalEl &&
        createPortal(
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-11 gap-2">
            {/* KPI 1: Today's Feedback (Lavender Tint) */}
            <div
              className="relative overflow-hidden rounded-2xl p-3 h-[84px] flex flex-col justify-between border border-[#E0E0FB] bg-[#F4F4FD] shadow-2xs group hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">TODAY</span>
                <div className="w-7 h-7 rounded-xl bg-[#5C5CFF] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-none">{currentStats.todayCount}</div>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5">Live Responses</p>
              </div>
            </div>

            {/* KPI 2: Average Rating (Peach/Warm Tint) */}
            <div
              className="relative overflow-hidden rounded-2xl p-3 h-[84px] flex flex-col justify-between border border-[#F9E6D8] bg-[#FDF7F2] shadow-2xs group hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">RATING</span>
                <div className="w-7 h-7 rounded-xl bg-[#FF7A00] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-none">{currentStats.averageRating}<span className="text-xs text-slate-500 font-bold">/5</span></div>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5">Overall Average</p>
              </div>
            </div>

            {/* KPI 3: Satisfied (Mint Green Tint) */}
            <div
              className="relative overflow-hidden rounded-2xl p-3 h-[84px] flex flex-col justify-between border border-[#D5EFE3] bg-[#F2FAF6] shadow-2xs group hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">SATISFIED</span>
                <div className="w-7 h-7 rounded-xl bg-[#00C073] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-none">{currentStats.happyPercentage}%</div>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5">Satisfaction</p>
              </div>
            </div>

            {/* KPI 4: Unsatisfied (Soft Rose Tint) */}
            <div
              className="relative overflow-hidden rounded-2xl p-3 h-[84px] flex flex-col justify-between border border-[#FBD9E0] bg-[#FDF2F4] shadow-2xs group hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">UNSATISFIED</span>
                <div className="w-7 h-7 rounded-xl bg-[#FF4565] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-none">{currentStats.poorCount}</div>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5">Alerts Raised</p>
              </div>
            </div>

            {/* KPI 5: Actions Taken / Resolved (Emerald Tint) */}
            <div
              className="relative overflow-hidden rounded-2xl p-3 h-[84px] flex flex-col justify-between border border-[#A7F3D0] bg-[#ECFDF5] shadow-2xs group hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950">ACTIONS</span>
                <div className="w-7 h-7 rounded-xl bg-[#059669] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-emerald-900 leading-none">{currentStats.actionsTakenCount ?? 0}</div>
                <p className="text-[9px] font-bold text-emerald-700 mt-0.5">Resolved Issues</p>
              </div>
            </div>

            {/* KPI 6: Pending Actions (Amber / Alert Tint) */}
            <div
              className={`relative overflow-hidden rounded-2xl p-3 h-[84px] flex flex-col justify-between border shadow-2xs group hover:shadow-md transition-all duration-300 ${
                (currentStats.pendingActionsCount ?? 0) > 0
                  ? 'border-amber-300 bg-amber-50/90'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">PENDING</span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform ${
                  (currentStats.pendingActionsCount ?? 0) > 0 ? 'bg-amber-600 text-white' : 'bg-slate-400 text-white'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className={`text-xl font-black leading-none ${
                  (currentStats.pendingActionsCount ?? 0) > 0 ? 'text-amber-950' : 'text-slate-700'
                }`}>
                  {currentStats.pendingActionsCount ?? 0}
                </div>
                <p className="text-[9px] font-bold text-amber-800 mt-0.5">Needs Action</p>
              </div>
            </div>

            {/* 4 Core Circular Gauge Metrics */}
            {[
              { key: 'food_taste', title: 'TASTE', emoji: '🍲' },
              { key: 'food_quality', title: 'QUALITY', emoji: '🍱' },
              { key: 'staff_behaviour', title: 'STAFF', emoji: '👥' },
              { key: 'hygiene', title: 'HYGIENE', emoji: '✨' },
            ].map((param) => {
              const opinion = getParameterRealOpinion(param.key as any);
              return (
                <div
                  key={param.key}
                  className="relative bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-2.5 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col items-center justify-between h-[84px]"
                >
                  <div className="flex items-center gap-1 w-full justify-between">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider truncate">{param.title}</span>
                    <span className="text-xs">{param.emoji}</span>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <CircularGauge pct={opinion.pctScore} color={opinion.statusColor} size={36} />
                    <span className="absolute text-[10px] font-black text-slate-800">
                      {opinion.pctScore}%
                    </span>
                  </div>
                  <div
                    className="text-[8px] font-black uppercase tracking-tight text-center"
                    style={{ color: opinion.statusColor }}
                  >
                    {opinion.avgScore} ★ • {opinion.statusText}
                  </div>
                </div>
              );
            })}

            <QRCodeCard
              plants={plants}
              selectedPlantId={selectedPlantId}
              className="col-span-2 sm:col-span-1 lg:col-span-1"
            />
          </div>,
          kpiPortalEl
        )}

      {/* ═══ Main Trend Charts (Clean White Light Theme - Merged Daily/Weekly + Monthly) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Merged Chart 1 & 2: Daily & Weekly Trend with Scrollable Month Timeline (Col-Span 2) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          {/* Header with Title, Mode Switcher & Scroll Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-black text-violet-700 bg-violet-50 border border-violet-200/90 px-3 py-1 rounded-full shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span>{trendViewMode === 'daily' ? 'Daily Timeline' : 'Weekly Trend'}</span>
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {trendViewMode === 'daily' ? 'Daily Feedback Trend (30 Days)' : 'Weekly Aggregated Trend'}
              </h3>
            </div>

            {/* View Mode Toggle & Left/Right Scroll Arrows */}
            <div className="flex items-center gap-2">
              {/* Daily / Weekly Switcher Pills */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTrendViewMode('daily')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trendViewMode === 'daily'
                      ? 'bg-white text-violet-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setTrendViewMode('weekly')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trendViewMode === 'weekly'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Weekly
                </button>
              </div>

              {/* Scroll Controls (Active for Daily Scrollable View) */}
              {trendViewMode === 'daily' && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => handleScrollTimeline('left')}
                    title="Scroll left to see past dates"
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-bold text-slate-500 px-1 hidden sm:inline">
                    Scroll Date
                  </span>
                  <button
                    type="button"
                    onClick={() => handleScrollTimeline('right')}
                    title="Scroll right to see recent dates"
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subtext info for scroll */}
          {trendViewMode === 'daily' && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-1">
              <span>← Past Dates of the Month</span>
              <span className="font-semibold text-violet-600">👈 Scroll horizontally to inspect all 30 days 👉</span>
              <span>Today (Latest) →</span>
            </div>
          )}

          {/* Chart Rendering */}
          <div 
            ref={timelineScrollRef}
            className="w-full overflow-x-auto pb-1 pt-1 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent',
            }}
          >
            <div 
              style={{ 
                minWidth: trendViewMode === 'daily' ? '1250px' : '100%', 
                height: '215px' 
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                {trendViewMode === 'daily' ? (
                  <AreaChart data={timelineData} margin={{ top: 8, right: 24, left: -20, bottom: 2 }}>
                    <defs>
                      <linearGradient id="dailyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" strokeWidth={1} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#334155"
                      fontSize={10}
                      fontWeight={800}
                      tickLine={true}
                      axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                      interval={0}
                      tickMargin={6}
                    />
                    <YAxis
                      stroke="#334155"
                      fontSize={11}
                      fontWeight={800}
                      tickLine={true}
                      axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                      allowDecimals={false}
                      tickMargin={2}
                    />
                    <Tooltip content={<DailyChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#dailyAreaGradient)"
                      dot={{ r: 4, fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                ) : (
                  <AreaChart data={last7WeeksData} margin={{ top: 8, right: 18, left: -22, bottom: 2 }}>
                    <defs>
                      <linearGradient id="weeklyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" strokeWidth={1} vertical={false} />
                    <XAxis
                      dataKey="week"
                      stroke="#334155"
                      fontSize={10}
                      fontWeight={800}
                      tickLine={true}
                      axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                      tickMargin={4}
                    />
                    <YAxis
                      stroke="#334155"
                      fontSize={11}
                      fontWeight={800}
                      tickLine={true}
                      axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                      allowDecimals={false}
                      tickMargin={2}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#0d9488"
                      strokeWidth={3.5}
                      fillOpacity={1}
                      fill="url(#weeklyAreaGradient)"
                      dot={{ r: 4.5, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 7.5, fill: '#0d9488', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Chart 2: Monthly Trend (Col-Span 1) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-black text-orange-700 bg-orange-50 border border-orange-200/90 px-3 py-1 rounded-full shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>Monthly</span>
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Monthly Trend</h3>
            </div>
          </div>

          <div className="h-48 sm:h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last5MonthsData} margin={{ top: 8, right: 18, left: -22, bottom: 2 }}>
                <defs>
                  <linearGradient id="monthlyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" strokeWidth={1} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#334155"
                  fontSize={10}
                  fontWeight={800}
                  tickLine={true}
                  axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                  tickMargin={4}
                />
                <YAxis
                  stroke="#334155"
                  fontSize={11}
                  fontWeight={800}
                  tickLine={true}
                  axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                  allowDecimals={false}
                  tickMargin={2}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#ea580c"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#monthlyAreaGradient)"
                  dot={{ r: 4.5, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 7.5, fill: '#ea580c', stroke: '#fff', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ═══ Bottom Widgets: Meal & Shift Analysis + Live Feedback Ticker (Clean White Light Theme) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Widget 1: Meal & Shift Comparison Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                <Utensils className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Meal & Shift Metrics</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Category performance</p>
              </div>
            </div>
            <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">Analysis</span>
          </div>

          <div className="space-y-3">
            {/* Meal Comparison */}
            <div className="p-3.5 rounded-2xl border border-slate-200 space-y-2 bg-slate-50/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">🍱 Lunch vs 🍲 Dinner</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-lg font-black text-amber-600">{mealAnalytics.lunchAvg} ★</div>
                  <div className="text-[9px] font-bold text-slate-500">{mealAnalytics.lunchCount} Lunch Feedbacks</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-lg font-black text-orange-600">{mealAnalytics.dinnerAvg} ★</div>
                  <div className="text-[9px] font-bold text-slate-500">{mealAnalytics.dinnerCount} Dinner Feedbacks</div>
                </div>
              </div>
            </div>

            {/* Shift Comparison */}
            <div className="p-3.5 rounded-2xl border border-slate-200 space-y-2 bg-slate-50/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Day Shift vs <Moon className="w-3.5 h-3.5 text-indigo-500" /> Night Shift
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-lg font-black text-sky-600">{shiftAnalytics.dayAvg} ★</div>
                  <div className="text-[9px] font-bold text-slate-500">{shiftAnalytics.dayCount} Day Shift</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-lg font-black text-indigo-600">{shiftAnalytics.nightAvg} ★</div>
                  <div className="text-[9px] font-bold text-slate-500">{shiftAnalytics.nightCount} Night Shift</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Widget 2: Live Feedback Activity Stream (ANONYMOUS & PRIVATE) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20" style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1)' }}>
                <MessageSquareText className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Live Feedback Stream</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Latest employee responses & remarks</p>
              </div>
            </div>
            <span className="text-[9px] text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
              </span>
              <span>Realtime</span>
            </span>
          </div>

          {/* Feedback Ticker List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 select-none">
            {filteredFeedbacks.slice(0, 5).map((f, idx) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 bg-slate-50/90 hover:bg-slate-100/90 rounded-2xl border border-slate-200/80 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-800 font-black text-xs shrink-0 border border-emerald-200/60">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-xs truncate">
                        #FB-{f.id.slice(-5).toUpperCase()}
                      </span>
                      <span className="text-[9px] text-emerald-700 font-bold px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200/60 shrink-0">
                        {f.meal_type}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">
                        • {f.plant_name || 'Plant'}
                      </span>
                    </div>
                    {f.remark ? (
                      <p className="text-[10px] text-slate-600 font-medium italic line-clamp-1 mt-0.5">
                        "{f.remark}"
                      </p>
                    ) : (
                      <p className="text-[9px] text-slate-400 italic mt-0.5">No written remark</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 shadow-2xs ${
                    f.overall_rating >= 4 
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                      : f.overall_rating <= 2.5 
                        ? 'bg-rose-500 text-white shadow-rose-500/20' 
                        : 'bg-amber-500 text-white shadow-amber-500/20'
                  }`}>
                    {f.overall_rating}
                    <Star className="w-3 h-3 fill-current" />
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono font-bold">
                    {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
            {filteredFeedbacks.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Coffee className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">No feedback entries yet</p>
                <p className="text-[10px]">Responses will appear here in real-time as employees submit</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══ Grievance Redressal & Actions Center ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Grievances & Corrective Action Log</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {grievanceFeedbacks.length} Total
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Review complaints, track corrective actions taken in English, and review photo/video evidence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resolved: {currentStats.actionsTakenCount ?? 0}</span>
            </span>

            {(currentStats.pendingActionsCount ?? 0) > 0 ? (
              <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Action: {currentStats.pendingActionsCount}</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                0 Pending
              </span>
            )}
          </div>
        </div>

        {grievanceFeedbacks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-xs font-black text-slate-700">Zero Active Grievances</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">All canteen feedbacks in this filtered view are positive. No pending corrective actions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {grievanceFeedbacks.map((item) => {
              const isResolved = item.action_status === 'resolved';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isResolved
                      ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-50'
                      : 'bg-rose-50/40 border-rose-200/90 hover:bg-rose-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-black text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          #{item.id.slice(0, 8)}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900">
                          {item.plant_display_name || item.plant_name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          • {item.meal_type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10.5px] font-black shadow-2xs">
                        ★ {item.overall_rating}
                      </span>
                    </div>
                  </div>

                  {/* Complaint Description */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs italic text-slate-800 leading-relaxed font-medium shadow-2xs">
                    "{item.remark || 'Unsatisfied feedback submission with no written remark'}"
                  </div>

                  {/* Media attachments */}
                  {((item.images && item.images.length > 0) || item.video_url) && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.images && item.images.length > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs">
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>{item.images.length} Evidence Photo{item.images.length > 1 ? 's' : ''}</span>
                        </span>
                      )}
                      {item.video_url && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs">
                          <Video className="w-3 h-3 text-blue-600" />
                          <span>Evidence Video</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Status & Details */}
                  {isResolved ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-950 font-black">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Action Taken:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActionTarget(item)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 underline font-bold cursor-pointer"
                        >
                          Edit Action
                        </button>
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed bg-white/80 p-2 rounded-lg border border-emerald-100">
                        {item.action_taken}
                      </p>
                      <div className="text-[10px] text-slate-500 font-medium flex justify-between items-center pt-0.5">
                        <span>Action By: <strong>{item.action_by || 'Admin'}</strong></span>
                        {item.action_at && (
                          <span>{new Date(item.action_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>Awaiting Administrative Action</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setActionTarget(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Take Action</span>
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveDetailEntry(item)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View Full Details & Media Gallery</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Modern Feedback Detail Modal */}
      <FeedbackDetailModal
        isOpen={Boolean(activeDetailEntry)}
        feedback={activeDetailEntry}
        isItAdmin={isItAdmin}
        adminName={adminName}
        onClose={() => setActiveDetailEntry(null)}
        onActionSaved={(updated) => {
          setActiveDetailEntry(updated);
          if (onUpdateEntry) onUpdateEntry(updated);
        }}
      />

      {/* Action Recording Modal */}
      <ActionModal
        isOpen={Boolean(actionTarget)}
        feedback={actionTarget}
        adminName={adminName}
        onClose={() => setActionTarget(null)}
        onActionSaved={(updated) => {
          if (onUpdateEntry) onUpdateEntry(updated);
        }}
      />
    </div>
  );
};
