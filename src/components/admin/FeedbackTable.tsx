import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  Search, Filter, Trash2, Eye, X, Star, ChevronLeft, ChevronRight, CheckSquare, Square, 
  Lock, Calendar, CheckCircle2, AlertCircle, Clock, ChevronDown
} from 'lucide-react';
import { FeedbackEntry, FeedbackFilterOptions, Plant, AdminProfile } from '../../types/database';
import { ConfirmModal } from '../common/ConfirmModal';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';

interface Props {
  feedbacks: FeedbackEntry[];
  plants: Plant[];
  admin?: AdminProfile;
  onFilterChange: (filters: FeedbackFilterOptions) => void;
  onDeleteEntry: (id: string) => void;
  onDeleteMultipleEntries: (ids: string[]) => void;
  onTriggerExport?: (format: 'csv' | 'excel' | 'pdf') => void;
}

export const FeedbackTable: React.FC<Props> = ({
  feedbacks,
  plants,
  admin,
  onFilterChange,
  onDeleteEntry,
  onDeleteMultipleEntries,
}) => {
  const isItAdmin = !admin || admin.role === 'super_admin' || admin.role === 'it_admin';
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [minRating, setMinRating] = useState<number>(0);
  const [detailEntry, setDetailEntry] = useState<FeedbackEntry | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(feedbacks.length / pageSize) || 1;
  const paginatedData = feedbacks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Modal Confirm State
  const [individualDeleteId, setIndividualDeleteId] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  const handleApplyFilter = (overrideDate?: DateRange) => {
    const isDateObj = overrideDate && typeof overrideDate === 'object' && ('startDate' in overrideDate || 'endDate' in overrideDate);
    const sDate = isDateObj ? overrideDate.startDate : startDate;
    const eDate = isDateObj ? overrideDate.endDate : endDate;
    onFilterChange({
      search,
      plantId: selectedPlant || undefined,
      mealType: (selectedMeal || undefined) as any,
      startDate: sDate,
      endDate: eDate,
      minRating: minRating > 0 ? minRating : undefined,
    });
    setCurrentPage(1);
  };

  const handleDateChange = (range: DateRange) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    handleApplyFilter(range);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedPlant('');
    setSelectedMeal('');
    setStartDate(undefined);
    setEndDate(undefined);
    setMinRating(0);
    onFilterChange({});
    setCurrentPage(1);
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPage = () => {
    const pageIds = paginatedData.map(item => item.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const confirmIndividualDelete = () => {
    if (individualDeleteId) {
      onDeleteEntry(individualDeleteId);
      setSelectedIds(prev => prev.filter(item => item !== individualDeleteId));
      toast.success('Feedback entry deleted');
      setIndividualDeleteId(null);
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

  const isAllPageSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id));

  const formatTicketNumber = (id: string) => {
    if (!id) return '#FB-000';
    return `#FB-${id.slice(-5).toUpperCase()}`;
  };

  return (
    <div className="space-y-4 font-sans">
      {/* ═══ Filter Control Bar ═══ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isItAdmin ? "Search Employee, ID, Remarks, Plants..." : "Search remarks, meals, plants..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            {/* Date / Calendar Filter */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto justify-end">
            {selectedIds.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-semibold focus:border-emerald-500 cursor-pointer"
          >
            <option value="">🏭 All Plants ({plants.length})</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || `${p.location} — ${p.name}`}
              </option>
            ))}
          </select>

          <select
            value={selectedMeal}
            onChange={(e) => setSelectedMeal(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-semibold focus:border-emerald-500 cursor-pointer"
          >
            <option value="">🍽️ All Meals</option>
            <option value="Lunch">🍱 Lunch (Afternoon)</option>
            <option value="Dinner">🍲 Dinner (Night)</option>
          </select>

          <div className="flex gap-1.5">
            <button
              onClick={() => handleApplyFilter()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-1.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Main Table (Matching User's Sample Design Aesthetic) ═══ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Beige / Cream Header Bar */}
            <thead>
              <tr className="bg-[#f5f1eb] border-b border-stone-200/90 text-[11px] font-extrabold text-stone-600 uppercase tracking-wider select-none">
                <th className="py-3 px-3.5 w-10 text-center">
                  <button onClick={toggleSelectAllPage} className="text-stone-400 hover:text-emerald-600">
                    {isAllPageSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3 px-3 text-stone-600 font-black">
                  <div className="flex items-center gap-1">
                    <span>TICKET ID</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-stone-600 font-black">EMPLOYEE</th>
                <th className="py-3 px-3 text-stone-600 font-black">PLANT</th>
                <th className="py-3 px-3 text-stone-600 font-black">MEAL</th>
                <th className="py-3 px-3 text-stone-600 font-black">STATUS / RATING</th>
                <th className="py-3 px-3 text-stone-600 font-black">SUGGESTION / REMARK</th>
                <th className="py-3 px-3 text-stone-600 font-black">DATE & TIME</th>
                <th className="py-3 px-3 text-right text-stone-600 font-black">ACTIONS</th>
              </tr>
            </thead>

            {/* Floating Table Rows */}
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400 font-medium">
                    No feedback entries match your filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((f) => {
                  const isSelected = selectedIds.includes(f.id);
                  const isUnsatisfied = f.overall_rating <= 2.5;
                  const isSatisfied = f.overall_rating >= 4.0;

                  return (
                    <tr 
                      key={f.id} 
                      className={`hover:bg-slate-50/90 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3.5 text-center">
                        <button onClick={() => toggleSelectRow(f.id)} className="text-slate-400 hover:text-emerald-600">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Ticket ID Pill (Blue pill matching sample) */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200/90 text-[#0284c7] font-black text-xs font-mono tracking-tight whitespace-nowrap shadow-2xs">
                          {formatTicketNumber(f.id)}
                        </span>
                      </td>

                      {/* Employee Details */}
                      <td className="py-3.5 px-3">
                        {isItAdmin ? (
                          <div>
                            <div className="font-extrabold text-slate-900">{f.employee_name || 'Anonymous'}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1">
                              <span>ID: {f.employee_id || 'N/A'}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-slate-600 font-bold flex items-center gap-1 text-[11px]">
                              <span>Anonymous</span>
                            </div>
                            <div className="text-[9px] text-slate-400 italic">Identity Protected</div>
                          </div>
                        )}
                      </td>

                      {/* Plant Badge (Warm Amber pill matching sample) */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 font-extrabold text-[10.5px] uppercase tracking-wide whitespace-nowrap inline-block shadow-2xs">
                          {f.plant_display_name || f.plant_name}
                        </span>
                      </td>

                      {/* Meal Type Badge (Purple pill matching sample) */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-extrabold text-[11px] uppercase tracking-wide whitespace-nowrap inline-block shadow-2xs">
                          {f.meal_type}
                        </span>
                      </td>

                      {/* Status / Rating Pill (Green / Red / Amber badge matching sample) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isUnsatisfied ? (
                          <span className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-[11px] inline-flex items-center gap-1 shadow-2xs">
                            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>{f.overall_rating} ★ UNSATISFIED</span>
                          </span>
                        ) : isSatisfied ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[11px] inline-flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{f.overall_rating} ★ SATISFIED</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-[11px] inline-flex items-center gap-1 shadow-2xs">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            <span>{f.overall_rating} ★ AVERAGE</span>
                          </span>
                        )}
                      </td>

                      {/* Suggestion / Remark */}
                      <td className="py-3.5 px-3 max-w-xs truncate text-slate-700 font-medium">
                        {f.remark ? (
                          <span className="italic">"{f.remark}"</span>
                        ) : (
                          <span className="text-slate-400 italic">No remark</span>
                        )}
                      </td>

                      {/* Date & Time (Clean Date pill matching sample) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{new Date(f.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                            {new Date(f.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </td>

                      {/* Actions (Clean rounded bordered buttons) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailEntry(f)}
                            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setIndividualDeleteId(f.id)}
                            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors shadow-2xs cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="py-3 px-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="font-semibold text-slate-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, feedbacks.length)} of {feedbacks.length}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-black text-slate-800">Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {detailEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setDetailEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Feedback Entry Detail</h3>
                <button onClick={() => setDetailEntry(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {isItAdmin ? (
                  <div className="p-3 bg-purple-50 rounded-xl space-y-1 border border-purple-200">
                    <div className="text-[10px] font-black text-purple-900 uppercase">Submitter Identity (IT Admin Access)</div>
                    <div className="font-bold text-slate-900">{detailEntry.employee_name || 'Anonymous'}</div>
                    <div className="text-slate-600 font-mono">ID: {detailEntry.employee_id || 'N/A'}</div>
                    <div className="text-slate-600 font-mono">Email: {detailEntry.email || 'N/A'}</div>
                    {detailEntry.phone && <div className="text-slate-600 font-mono">Phone: {detailEntry.phone}</div>}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-600 text-xs font-semibold">
                    🔒 Employee identity is confidential for HR Admin.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                  <div className="p-2.5 bg-slate-50 rounded-xl">Plant: {detailEntry.plant_display_name || detailEntry.plant_name}</div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">Meal: {detailEntry.meal_type}</div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">Shift: {detailEntry.shift}</div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">Overall: {detailEntry.overall_rating} ★</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800">Parameters breakdown:</div>
                  <div>Food Taste: {detailEntry.food_taste} ★</div>
                  <div>Food Quality: {detailEntry.food_quality} ★</div>
                  <div>Staff Behaviour: {detailEntry.staff_behaviour} ★</div>
                  <div>Hygiene: {detailEntry.hygiene} ★</div>
                </div>

                {detailEntry.remark && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl italic font-medium">
                    "{detailEntry.remark}"
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Deletion Modals */}
      <ConfirmModal
        isOpen={Boolean(individualDeleteId)}
        title="Delete Feedback Entry"
        message="Are you sure you want to delete this feedback log entry? This action cannot be undone."
        confirmText="Delete Entry"
        onConfirm={confirmIndividualDelete}
        onClose={() => setIndividualDeleteId(null)}
      />

      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title="Bulk Delete Selected Logs"
        message={`Are you sure you want to delete ${selectedIds.length} selected feedback log entries?`}
        confirmText={`Delete ${selectedIds.length} Logs`}
        onConfirm={confirmBulkDelete}
        onClose={() => setIsBulkDeleteModalOpen(false)}
      />
    </div>
  );
};
