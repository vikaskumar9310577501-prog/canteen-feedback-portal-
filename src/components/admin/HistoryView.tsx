import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  CalendarDays, 
  Search, 
  Star, 
  Building2, 
  Utensils, 
  User, 
  Lock, 
  X, 
  ChevronDown, 
  ChevronRight, 
  ThumbsUp, 
  AlertCircle, 
  Trash2, 
  Filter,
  CheckCircle2,
  Calendar as CalendarIcon,
  MessageSquare
} from 'lucide-react';
import { FeedbackEntry, Plant, AdminProfile } from '../../types/database';
import { ConfirmModal } from '../common/ConfirmModal';
import { DateRangePicker, DateRange, isDateInRange } from '../common/DateRangePicker';

interface Props {
  feedbacks: FeedbackEntry[];
  plants?: Plant[];
  admin?: AdminProfile;
  onDeleteEntry?: (id: string) => void;
  onDeleteMultipleEntries?: (ids: string[]) => void;
}

export const HistoryView: React.FC<Props> = ({
  feedbacks,
  plants = [],
  admin,
  onDeleteEntry,
  onDeleteMultipleEntries,
}) => {
  const isItAdmin = !admin || admin.role === 'super_admin' || admin.role === 'it_admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('all');
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Active Detail Entry for Modal
  const [activeDetailEntry, setActiveDetailEntry] = useState<FeedbackEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; ticket: string } | null>(null);

  // Group Feedbacks by Date (YYYY-MM-DD key for sorting, formatted label for display)
  const groupedHistory = useMemo(() => {
    // 1. Filter first
    const filtered = feedbacks.filter((f) => {
      if (selectedPlantId !== 'all' && f.plant_id !== selectedPlantId) return false;
      if (selectedMealType !== 'all' && f.meal_type !== selectedMealType) return false;

      // Date range filtering
      if (!isDateInRange(f.created_at, startDate, endDate)) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchPlant = f.plant_name?.toLowerCase().includes(q) || f.plant_display_name?.toLowerCase().includes(q);
        const matchRemark = f.remark?.toLowerCase().includes(q);
        const matchEmpName = f.employee_name?.toLowerCase().includes(q);
        const matchEmpId = f.employee_id?.toLowerCase().includes(q);
        const matchTicket = f.id?.toLowerCase().includes(q);
        const matchDate = new Date(f.created_at).toLocaleDateString().toLowerCase().includes(q);

        if (!matchPlant && !matchRemark && !matchEmpName && !matchEmpId && !matchTicket && !matchDate) {
          return false;
        }
      }
      return true;
    });

    // 2. Group by Date
    const map: Record<string, { dateKey: string; dateObj: Date; dateFormatted: string; entries: FeedbackEntry[] }> = {};

    filtered.forEach((item) => {
      const d = new Date(item.created_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dateFormatted = d.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      if (!map[dateKey]) {
        map[dateKey] = {
          dateKey,
          dateObj: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
          dateFormatted,
          entries: [],
        };
      }
      map[dateKey].entries.push(item);
    });

    // 3. Sort descending by date
    return Object.values(map).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [feedbacks, searchTerm, selectedPlantId, selectedMealType, startDate, endDate]);

  // Expand all dates by default on initial load
  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    groupedHistory.forEach((g, idx) => {
      // First 3 dates expanded by default
      initialExpanded[g.dateKey] = idx < 3;
    });
    setExpandedDates(prev => ({ ...initialExpanded, ...prev }));
  }, [groupedHistory.length]);

  const toggleDate = (dateKey: string) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    groupedHistory.forEach(g => { next[g.dateKey] = true; });
    setExpandedDates(next);
  };

  const collapseAll = () => {
    setExpandedDates({});
  };

  const formatTicketNumber = (id: string) => {
    if (!id) return '#FB-000';
    return `#FB-${id.slice(-5).toUpperCase()}`;
  };

  const confirmDelete = () => {
    if (deleteTarget && onDeleteEntry) {
      onDeleteEntry(deleteTarget.id);
      toast.success('Feedback entry deleted from history');
      setDeleteTarget(null);
    }
  };

  // If not IT Admin, block access gracefully
  if (!isItAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 max-w-lg mx-auto my-12 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-slate-900">IT Admin Restricted Access</h3>
        <p className="text-xs text-slate-500">
          The Date-wise Feedback History and Employee Audit Archive is restricted to IT Admin only for privacy and data governance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-2xs">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span>Daily Feedback History & Archive</span>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <User className="w-3 h-3 text-purple-700" />
                <span>IT Admin Access</span>
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Complete date-wise history of canteen feedback submissions. Tap on any date or feedback card to view complete employee info and scores.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date, employee ID, name, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Filter Controls & Collapse/Expand toggles */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date / Calendar Filter */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(range) => {
                setStartDate(range.startDate);
                setEndDate(range.endDate);
              }}
            />

            {/* Plant Filter */}
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Manufacturing Plants</option>
              {plants.map(p => (
                <option key={p.id} value={p.id}>{p.display_name || `${p.location} — ${p.name}`}</option>
              ))}
            </select>

            {/* Meal Filter */}
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Meal Types (Lunch & Dinner)</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Snacks">Snacks</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Date-wise History Cards */}
      {groupedHistory.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <CalendarDays className="w-10 h-10 mx-auto text-slate-300" />
          <div className="font-extrabold text-slate-700 text-sm">No History Records Found</div>
          <p className="text-xs text-slate-400">No feedback submissions match the selected date or search filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedHistory.map((group) => {
            const isExpanded = Boolean(expandedDates[group.dateKey]);
            const totalOnDay = group.entries.length;
            const satisfiedOnDay = group.entries.filter(e => e.overall_rating >= 4.0).length;
            const unsatisfiedOnDay = group.entries.filter(e => e.overall_rating <= 2.5).length;
            const avgRating = (group.entries.reduce((acc, curr) => acc + (curr.overall_rating || 0), 0) / totalOnDay).toFixed(1);

            return (
              <div
                key={group.dateKey}
                className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* Date Accordion Header */}
                <div
                  onClick={() => toggleDate(group.dateKey)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <span>{group.dateFormatted}</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Total {totalOnDay} {totalOnDay === 1 ? 'feedback response' : 'feedback responses'} logged
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Badges for that Day */}
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                      {totalOnDay} Total
                    </span>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{satisfiedOnDay} Satisfied</span>
                    </span>
                    {unsatisfiedOnDay > 0 && (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{unsatisfiedOnDay} Unsatisfied</span>
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{avgRating} Avg</span>
                    </span>
                  </div>
                </div>

                {/* Date Accordion Body (Cards Grid) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/40"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {group.entries.map((item) => {
                          const ticketNo = formatTicketNumber(item.id);
                          const isUnsatisfied = item.overall_rating <= 2.5;

                          return (
                            <div
                              key={item.id}
                              onClick={() => setActiveDetailEntry(item)}
                              className={`bg-white border rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2.5 cursor-pointer relative group flex flex-col justify-between ${
                                isUnsatisfied
                                  ? 'border-rose-200 hover:border-rose-400'
                                  : 'border-slate-200 hover:border-purple-400'
                              }`}
                            >
                              <div className="space-y-2.5">
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                                  <div className="min-w-0">
                                    <div className="font-black text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                                      <span>{ticketNo}</span>
                                      {isUnsatisfied && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-rose-100 text-rose-700 border border-rose-200 animate-pulse shrink-0">
                                          Unsatisfied
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5 truncate" title={item.plant_display_name || item.plant_name}>
                                      <Building2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                      <span className="truncate">{item.plant_display_name || item.plant_name}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black flex items-center gap-0.5 shadow-2xs ${
                                      item.overall_rating >= 4 
                                        ? 'bg-emerald-500 text-white' 
                                        : item.overall_rating <= 2.5 
                                          ? 'bg-rose-600 text-white' 
                                          : 'bg-amber-500 text-white'
                                    }`}>
                                      <span>{item.overall_rating}</span>
                                      <Star className="w-3 h-3 fill-current" />
                                    </span>

                                    {onDeleteEntry && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteTarget({ id: item.id, ticket: ticketNo });
                                        }}
                                        className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        title="Delete Entry"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Employee ID Badge (IT Admin) */}
                                <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-purple-900 bg-purple-50/90 border border-purple-200/80 px-2 py-1 rounded-xl">
                                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                                    <User className="w-3 h-3 text-purple-700 shrink-0" />
                                    <span className="truncate">{item.employee_name || 'Anonymous Emp'}</span>
                                  </div>
                                  {item.employee_id && (
                                    <span className="font-mono text-[9px] bg-purple-200/80 text-purple-950 px-1.5 py-0.2 rounded-md shrink-0 font-black">
                                      {item.employee_id}
                                    </span>
                                  )}
                                </div>

                                {/* 4 Parameter Ratings */}
                                <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-slate-600 bg-slate-50 p-1.5 rounded-xl border border-slate-100 text-center">
                                  <div className="p-0.5 bg-white rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[8px]">Taste</span>
                                    <strong className="text-emerald-700 text-[10px]">{item.food_taste}★</strong>
                                  </div>
                                  <div className="p-0.5 bg-white rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[8px]">Quality</span>
                                    <strong className="text-emerald-700 text-[10px]">{item.food_quality}★</strong>
                                  </div>
                                  <div className="p-0.5 bg-white rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[8px]">Staff</span>
                                    <strong className="text-emerald-700 text-[10px]">{item.staff_behaviour}★</strong>
                                  </div>
                                  <div className="p-0.5 bg-white rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[8px]">Hygiene</span>
                                    <strong className="text-emerald-700 text-[10px]">{item.hygiene}★</strong>
                                  </div>
                                </div>

                                {/* Meal & Shift Badges */}
                                <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold text-slate-600">
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-extrabold text-[10px]">
                                    🍱 {item.meal_type}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[9px]">
                                    ⏰ {item.shift}
                                  </span>
                                </div>

                                {/* Remark */}
                                {item.remark ? (
                                  <div className={`p-2.5 rounded-xl text-[11px] italic leading-snug font-medium border line-clamp-2 min-h-[38px] ${
                                    isUnsatisfied
                                      ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                                      : 'bg-emerald-50/60 border-emerald-200/70 text-slate-800'
                                  }`}>
                                    "{item.remark}"
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400 italic p-2 bg-slate-50/50 rounded-lg min-h-[38px] flex items-center">
                                    No written remark
                                  </div>
                                )}
                              </div>

                              {/* Card Footer */}
                              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 mt-1">
                                <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-purple-700 font-bold text-[9px] group-hover:underline flex items-center gap-0.5">
                                  View Full Info →
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Modal View */}
      <AnimatePresence>
        {activeDetailEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setActiveDetailEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
            >
              {/* Sticky Top Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                      Historical Feedback Entry
                    </h3>
                    <div className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="text-purple-800 font-extrabold">{formatTicketNumber(activeDetailEntry.id)}</span>
                      <span>•</span>
                      <span>{new Date(activeDetailEntry.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveDetailEntry(null)} 
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Overall Score */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">Overall Score</span>
                    <span className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs ${
                      activeDetailEntry.overall_rating >= 4 
                        ? 'bg-emerald-500 text-white' 
                        : activeDetailEntry.overall_rating <= 2.5 
                          ? 'bg-rose-600 text-white' 
                          : 'bg-amber-500 text-white'
                    }`}>
                      {activeDetailEntry.overall_rating} ★ Overall
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800 pt-1">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Manufacturing Plant:</span>
                      <span className="text-emerald-700 truncate block mt-0.5">{activeDetailEntry.plant_display_name || activeDetailEntry.plant_name}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Meal & Shift:</span>
                      <span className="truncate block mt-0.5">{activeDetailEntry.meal_type} ({activeDetailEntry.shift})</span>
                    </div>
                  </div>
                </div>

                {/* 4 Parameters */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 border border-slate-200/80">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">4 Core Parameters Score:</h4>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 font-semibold shadow-2xs">
                      <span>🍲 Food Taste:</span>
                      <strong className="text-emerald-700 font-black">{activeDetailEntry.food_taste} ★</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 font-semibold shadow-2xs">
                      <span>🍱 Food Quality:</span>
                      <strong className="text-emerald-700 font-black">{activeDetailEntry.food_quality} ★</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 font-semibold shadow-2xs">
                      <span>🤝 Staff Behavior:</span>
                      <strong className="text-emerald-700 font-black">{activeDetailEntry.staff_behaviour} ★</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 font-semibold shadow-2xs">
                      <span>✨ Hygiene:</span>
                      <strong className="text-emerald-700 font-black">{activeDetailEntry.hygiene} ★</strong>
                    </div>
                  </div>
                </div>

                {/* Remark */}
                {activeDetailEntry.remark ? (
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Written Remark / Suggestion:</span>
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 text-slate-900 rounded-2xl italic text-xs leading-relaxed border border-emerald-200 font-medium shadow-2xs">
                      "{activeDetailEntry.remark}"
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                    No written remark provided
                  </div>
                )}

                {/* Submitter Full Identity (IT Admin Access) */}
                <div className="p-4 bg-purple-50/90 rounded-2xl space-y-2.5 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-700" />
                      <span>Employee Submitter Identity (IT Admin Archive)</span>
                    </h4>
                    <span className="text-[9px] font-black px-2 py-0.5 bg-purple-200 text-purple-900 rounded-full uppercase">
                      IT Admin Only
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Employee Name:</span>
                      <strong className="text-slate-900 truncate block mt-0.5">{activeDetailEntry.employee_name || 'Anonymous'}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Employee ID:</span>
                      <strong className="text-purple-800 font-mono block mt-0.5">{activeDetailEntry.employee_id || 'N/A'}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Email Address:</span>
                      <span className="text-slate-700 font-mono text-[11px] truncate block mt-0.5">{activeDetailEntry.email || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Contact Phone:</span>
                      <span className="text-slate-700 font-mono text-[11px] block mt-0.5">{activeDetailEntry.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-center shrink-0">
                Submitted on {new Date(activeDetailEntry.created_at).toLocaleString()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Historical Feedback Entry"
        message={`Are you sure you want to delete historical feedback entry "${deleteTarget?.ticket || 'Ticket'}"?`}
        confirmText="Delete Entry"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
