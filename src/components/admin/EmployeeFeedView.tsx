import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Star, Building2, Utensils, Calendar, Search, Trash2, CheckSquare, Square, X, MessageSquare, AlertCircle, ThumbsUp, Lock, User, Phone, Mail
} from 'lucide-react';
import { FeedbackEntry, Plant, AdminProfile } from '../../types/database';
import { ConfirmModal } from '../common/ConfirmModal';
import { DateRangePicker, DateRange, isDateInRange } from '../common/DateRangePicker';

interface Props {
  feedbacks: FeedbackEntry[];
  plants?: Plant[];
  admin?: AdminProfile;
  onDeleteEntry: (id: string) => void;
  onDeleteMultipleEntries: (ids: string[]) => void;
}

export const EmployeeFeedView: React.FC<Props> = ({ 
  feedbacks, 
  admin,
  onDeleteEntry, 
  onDeleteMultipleEntries 
}) => {
  const isItAdmin = !admin || admin.role === 'super_admin' || admin.role === 'it_admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFeedFilter, setActiveFeedFilter] = useState<'all' | 'latest' | 'happy' | 'poor'>('all');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Detailed Feedback Modal View State
  const [activeDetailEntry, setActiveDetailEntry] = useState<FeedbackEntry | null>(null);

  // Modal Confirm Delete State
  const [individualDeleteTarget, setIndividualDeleteTarget] = useState<{ id: string; ticket?: string } | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  const getFilteredFeed = () => {
    return feedbacks.filter((item) => {
      if (activeFeedFilter === 'latest') {
        if (!item.created_at.startsWith('2026-08-31')) return false;
      } else if (activeFeedFilter === 'happy') {
        if (item.overall_rating < 4.0) return false;
      } else if (activeFeedFilter === 'poor') {
        if (item.overall_rating > 2.5) return false;
      }

      if (!isDateInRange(item.created_at, startDate, endDate)) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchPlant = item.plant_name?.toLowerCase().includes(q) || item.plant_display_name?.toLowerCase().includes(q);
        const matchRemark = item.remark?.toLowerCase().includes(q);
        const matchMeal = item.meal_type?.toLowerCase().includes(q);
        const matchShift = item.shift?.toLowerCase().includes(q);
        const matchTicket = item.id?.toLowerCase().includes(q);
        const matchEmpName = isItAdmin && item.employee_name?.toLowerCase().includes(q);
        const matchEmpId = isItAdmin && item.employee_id?.toLowerCase().includes(q);

        if (!matchPlant && !matchRemark && !matchMeal && !matchShift && !matchTicket && !matchEmpName && !matchEmpId) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredFeed = getFilteredFeed();
  const dateBaseFeed = feedbacks.filter(f => isDateInRange(f.created_at, startDate, endDate));
  const latestCount = feedbacks.filter(f => f.created_at.startsWith('2026-08-31')).length;
  const satisfiedCount = dateBaseFeed.filter(f => f.overall_rating >= 4.0).length;
  const unsatisfiedCount = dateBaseFeed.filter(f => f.overall_rating <= 2.5).length;

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredFeed.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFeed.map(f => f.id));
    }
  };

  const confirmIndividualDelete = () => {
    if (individualDeleteTarget) {
      onDeleteEntry(individualDeleteTarget.id);
      setSelectedIds(prev => prev.filter(item => item !== individualDeleteTarget.id));
      toast.success('Feedback entry deleted');
      setIndividualDeleteTarget(null);
    }
  };

  const confirmBulkDelete = () => {
    if (selectedIds.length > 0) {
      onDeleteMultipleEntries(selectedIds);
      toast.success(`${selectedIds.length} feedback entries deleted`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const formatTicketNumber = (id: string) => {
    if (!id) return '#FB-000';
    return `#FB-${id.slice(-5).toUpperCase()}`;
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Feed Section Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span>Employee Feedback Feed</span>
              {isItAdmin ? (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <User className="w-3 h-3 text-purple-700" />
                  <span>IT Admin (Full Identity View)</span>
                </span>
              ) : (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>HR Admin (Anonymous View)</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Real-time feed of employee feedback submissions. Showing ratings, meal categories, and suggestions.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isItAdmin ? "Search remarks, emp ID, meals, plants..." : "Search remarks, meals, plants, shifts..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Filter Pills (All, Latest, Satisfied, Unsatisfied) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto flex-wrap">
            {/* 0. All Feed */}
            <button
              onClick={() => setActiveFeedFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFeedFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Feedbacks ({feedbacks.length})
            </button>

            {/* 2. Satisfied */}
            <button
              onClick={() => setActiveFeedFilter('happy')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeFeedFilter === 'happy'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Satisfied ({satisfiedCount})</span>
            </button>

            {/* 4. Unsatisfied with Warm Red & Blinking Animation */}
            <button
              onClick={() => setActiveFeedFilter('poor')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeFeedFilter === 'poor'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-500/40'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
              </span>
              <span>Unsatisfied ({unsatisfiedCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {selectedIds.length === filteredFeed.length && filteredFeed.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All</span>
            </button>

            {selectedIds.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedIds.length})</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Main Feedback Cards Grid (4 Cards per row on desktop) */}
      {filteredFeed.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
          <div className="font-extrabold text-slate-700 text-sm">No Feedback Entries Found</div>
          <p className="text-xs text-slate-400">Try changing search keywords or adjusting the filter pill above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredFeed.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const ticketNo = formatTicketNumber(item.id);
            const isUnsatisfied = item.overall_rating <= 2.5;

            return (
              <motion.div
                key={item.id}
                layout
                onClick={() => setActiveDetailEntry(item)}
                className={`bg-white border rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2.5 cursor-pointer relative group flex flex-col justify-between ${
                  isSelected 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10' 
                    : isUnsatisfied
                      ? 'border-rose-200 hover:border-rose-400'
                      : 'border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Card Top Header: Ticket Number & Star Rating */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        onClick={(e) => toggleSelect(item.id, e)}
                        className="cursor-pointer p-0.5 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                            isUnsatisfied 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                          }`}>
                            <Utensils className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-black text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                          <span>{ticketNo}</span>
                          {isUnsatisfied && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-rose-100 text-rose-700 border border-rose-200 animate-pulse shrink-0">
                              <span className="w-1 h-1 rounded-full bg-rose-600" />
                              Unsatisfied
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5 truncate" title={item.plant_display_name || item.plant_name}>
                          <Building2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.plant_display_name || item.plant_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIndividualDeleteTarget({ id: item.id, ticket: ticketNo });
                        }}
                        className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* IT Admin vs HR Admin: Direct Submitter Info on Card */}
                  {isItAdmin ? (
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-purple-900 bg-purple-50/90 border border-purple-200/80 px-2 py-1 rounded-xl">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <User className="w-3 h-3 text-purple-700 shrink-0" />
                        <span className="truncate">{item.employee_name || 'Anonymous Employee'}</span>
                      </div>
                      {item.employee_id && (
                        <span className="font-mono text-[9px] bg-purple-200/80 text-purple-950 px-1.5 py-0.2 rounded-md shrink-0 font-black">
                          {item.employee_id}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                      <span>Employee Identity Confidential (HR View)</span>
                    </div>
                  )}

                  {/* 4 Core Parameter Ratings */}
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

                  {/* Employee Written Remark / Suggestion */}
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
                      No written remark provided
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-600 pt-2 border-t border-slate-100 mt-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 bg-slate-100/90 px-2 py-0.5 rounded-lg">
                    <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span className="text-slate-400 font-normal">• {new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  </div>
                  <span className="text-emerald-600 font-black text-[10px] group-hover:underline flex items-center gap-0.5">
                    Details →
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detailed Modal View (Fixed Viewport & Scrollable) */}
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
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                      Feedback Details
                    </h3>
                    <div className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="text-emerald-700 font-extrabold">{formatTicketNumber(activeDetailEntry.id)}</span>
                      <span>•</span>
                      <span>{new Date(activeDetailEntry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveDetailEntry(null)} 
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  title="Close Dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Content Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Overall Rating & Context */}
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

                {/* 4 Parameters Detailed Rating */}
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

                {/* Written Remark */}
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

                {/* Employee Submitter Identity (IT Admin vs HR Admin) */}
                {isItAdmin ? (
                  <div className="p-4 bg-purple-50/80 rounded-2xl space-y-2.5 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-purple-700" />
                        <span>Employee Submitter Identity (IT Admin Access)</span>
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
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Employee Identity Anonymized</div>
                      <div className="text-[11px] text-slate-500 font-normal">Confidential for HR Admin. Full employee identity is restricted to IT Admin only.</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-center shrink-0">
                Submitted on {new Date(activeDetailEntry.created_at).toLocaleString()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modals */}
      <ConfirmModal
        isOpen={Boolean(individualDeleteTarget)}
        title="Delete Feedback Entry"
        message={`Are you sure you want to delete feedback entry "${individualDeleteTarget?.ticket || 'Ticket'}"?`}
        confirmText="Delete Entry"
        onConfirm={confirmIndividualDelete}
        onClose={() => setIndividualDeleteTarget(null)}
      />

      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title="Delete Selected Submissions"
        message={`Are you sure you want to delete ${selectedIds.length} selected employee feedback submissions?`}
        confirmText={`Delete ${selectedIds.length} Entries`}
        onConfirm={confirmBulkDelete}
        onClose={() => setIsBulkDeleteModalOpen(false)}
      />
    </div>
  );
};
