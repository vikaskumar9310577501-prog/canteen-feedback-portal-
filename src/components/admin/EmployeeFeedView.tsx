import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Star, Building2, Utensils, Calendar, Search, Trash2, CheckSquare, Square, X, MessageSquare, AlertCircle, ThumbsUp, Lock, User, Phone, Mail,
  Camera, Video, Wrench, ShieldCheck, Clock
} from 'lucide-react';
import { FeedbackEntry, Plant, AdminProfile } from '../../types/database';
import { ConfirmModal } from '../common/ConfirmModal';
import { DateRangePicker, DateRange, isDateInRange } from '../common/DateRangePicker';
import { FeedbackDetailModal } from './FeedbackDetailModal';
import { ActionModal } from './ActionModal';

interface Props {
  feedbacks: FeedbackEntry[];
  plants?: Plant[];
  admin?: AdminProfile;
  onDeleteEntry: (id: string) => void;
  onDeleteMultipleEntries: (ids: string[]) => void;
  onUpdateEntry?: (updated: FeedbackEntry) => void;
}

export const EmployeeFeedView: React.FC<Props> = ({ 
  feedbacks, 
  admin,
  onDeleteEntry, 
  onDeleteMultipleEntries,
  onUpdateEntry,
}) => {
  const isItAdmin = !admin || admin.role === 'super_admin' || admin.role === 'it_admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFeedFilter, setActiveFeedFilter] = useState<'all' | 'latest' | 'happy' | 'poor'>('all');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Detailed Feedback Modal View State
  const [activeDetailEntry, setActiveDetailEntry] = useState<FeedbackEntry | null>(null);
  const [actionTarget, setActionTarget] = useState<FeedbackEntry | null>(null);

  // Modal Confirm Delete State
  const [individualDeleteTarget, setIndividualDeleteTarget] = useState<{ id: string; ticket?: string } | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const mostRecentDateStr = feedbacks.some(f => f.created_at?.startsWith(todayStr))
    ? todayStr
    : (feedbacks[0]?.created_at?.slice(0, 10) || todayStr);

  const isEntrySatisfied = (item: FeedbackEntry) => {
    if (item.satisfaction_status === 'satisfied') return true;
    if (item.satisfaction_status === 'unsatisfied') return false;
    return item.overall_rating >= 4.0;
  };

  const isEntryUnsatisfied = (item: FeedbackEntry) => {
    if (item.satisfaction_status === 'unsatisfied') return true;
    if (item.satisfaction_status === 'satisfied') return false;
    return item.overall_rating <= 2.5;
  };

  const getFilteredFeed = () => {
    return feedbacks.filter((item) => {
      if (activeFeedFilter === 'latest') {
        if (!item.created_at.startsWith(mostRecentDateStr)) return false;
      } else if (activeFeedFilter === 'happy') {
        if (!isEntrySatisfied(item)) return false;
      } else if (activeFeedFilter === 'poor') {
        if (!isEntryUnsatisfied(item)) return false;
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
  const latestCount = feedbacks.filter(f => f.created_at.startsWith(mostRecentDateStr)).length;
  const satisfiedCount = dateBaseFeed.filter(f => isEntrySatisfied(f)).length;
  const unsatisfiedCount = dateBaseFeed.filter(f => isEntryUnsatisfied(f)).length;

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

                  {/* Media & Action Status Indicators */}
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1">
                    {/* Media Attachments Indicator */}
                    <div className="flex items-center gap-1">
                      {item.images && item.images.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-bold inline-flex items-center gap-0.5 border border-slate-200">
                          <Camera className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{item.images.length} photo{item.images.length > 1 ? 's' : ''}</span>
                        </span>
                      )}
                      {item.video_url && (
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[9px] font-bold inline-flex items-center gap-0.5 border border-blue-200">
                          <Video className="w-2.5 h-2.5 text-blue-600" />
                          <span>Video</span>
                        </span>
                      )}
                    </div>

                    {/* Grievance Action Status */}
                    {(isUnsatisfied || item.satisfaction_status === 'unsatisfied' || item.action_status) && (
                      <div className="flex items-center gap-1 ml-auto">
                        {item.action_status === 'resolved' ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9.5px] font-black inline-flex items-center gap-1 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Action Resolved</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionTarget(item);
                            }}
                            className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-extrabold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            title="Take Corrective Action"
                          >
                            <Wrench className="w-2.5 h-2.5" />
                            <span>Take Action</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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

      {/* Modern Detailed Modal View with Photos, Video & Corrective Action */}
      <FeedbackDetailModal
        isOpen={Boolean(activeDetailEntry)}
        feedback={activeDetailEntry}
        isItAdmin={isItAdmin}
        adminName={admin?.full_name || 'Canteen Admin'}
        onClose={() => setActiveDetailEntry(null)}
        onActionSaved={(updated) => {
          setActiveDetailEntry(updated);
          if (onUpdateEntry) onUpdateEntry(updated);
        }}
      />

      {/* Quick Action Recording Modal */}
      <ActionModal
        isOpen={Boolean(actionTarget)}
        feedback={actionTarget}
        adminName={admin?.full_name || 'Canteen Admin'}
        onClose={() => setActionTarget(null)}
        onActionSaved={(updated) => {
          if (onUpdateEntry) onUpdateEntry(updated);
        }}
      />

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
