import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, FileText, Download, Printer, Calendar, Building2, CheckCircle2 
} from 'lucide-react';
import { FeedbackEntry, Plant, DashboardStats } from '../../types/database';
import { calculateDashboardStats } from '../../lib/supabase';

interface Props {
  feedbacks: FeedbackEntry[];
  plants: Plant[];
  stats: DashboardStats;
}

export const ReportGenerator: React.FC<Props> = ({ feedbacks, plants, stats }) => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'plant'>('daily');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');

  const getFilteredReportData = () => {
    const now = new Date();
    return feedbacks.filter((item) => {
      const time = new Date(item.created_at).getTime();
      if (reportType === 'daily') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (time < todayStart) return false;
      } else if (reportType === 'weekly') {
        const weekStart = now.getTime() - (7 * 86400000);
        if (time < weekStart) return false;
      } else if (reportType === 'monthly') {
        const monthStart = now.getTime() - (30 * 86400000);
        if (time < monthStart) return false;
      }

      if (reportType === 'plant' && selectedPlantId && item.plant_id !== selectedPlantId) {
        return false;
      }

      return true;
    });
  };

  const reportData = getFilteredReportData();
  const reportStats = calculateDashboardStats(reportData);

  const exportPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('CANTEEN FEEDBACK MANAGEMENT REPORT', 14, 16);
      doc.setFontSize(9);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 23);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text('1. Executive Performance Summary', 14, 38);

      autoTable(doc, {
        startY: 42,
        head: [['Total Feedbacks', 'Average Rating', 'Happy Employee %', 'Poor Feedbacks', 'Total Remarks']],
        body: [
          [
            reportData.length.toString(),
            `${reportStats.averageRating} / 5.0`,
            `${reportStats.happyPercentage}%`,
            reportStats.poorCount.toString(),
            reportStats.totalRemarks.toString(),
          ]
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 70;
      doc.text('2. Feedback Entries Log', 14, finalY + 12);

      const tableRows = reportData.map((f) => [
        new Date(f.created_at).toLocaleDateString(),
        f.employee_name || 'Anonymous',
        f.email || f.employee_id || 'N/A',
        f.plant_name || 'N/A',
        f.meal_type,
        f.shift,
        f.overall_rating.toFixed(1),
        f.remark || '-',
      ]);

      autoTable(doc, {
        startY: finalY + 16,
        head: [['Date', 'Employee', 'ID / Email', 'Plant', 'Meal', 'Shift', 'Rating', 'Remark']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 },
      });

      doc.save(`canteen-feedback-report-${reportType}-${Date.now()}.pdf`);
      toast.success('PDF report exported successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF report.');
    }
  };

  const exportExcel = () => {
    try {
      const exportData = reportData.map((f) => ({
        'Date & Time': new Date(f.created_at).toLocaleString(),
        'Employee Name': f.employee_name || 'Anonymous',
        'Employee ID': f.employee_id || 'N/A',
        'Email ID': f.email || 'N/A',
        'Phone': f.phone || 'N/A',
        'Plant': f.plant_name || 'N/A',
        'Meal Type': f.meal_type,
        'Shift': f.shift,
        'Food Taste': f.food_taste,
        'Food Quality': f.food_quality,
        'Staff Behaviour': f.staff_behaviour,
        'Hygiene': f.hygiene,
        'Overall Rating': f.overall_rating,
        'Remark': f.remark || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Canteen Feedbacks');
      XLSX.writeFile(workbook, `canteen-feedback-data-${reportType}-${Date.now()}.xlsx`);
      toast.success('Excel file exported successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export Excel.');
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Employee Name', 'ID', 'Email', 'Plant', 'Meal', 'Shift', 'Overall Rating', 'Remark'];
    const rows = reportData.map((f) => [
      `"${new Date(f.created_at).toLocaleString()}"`,
      `"${f.employee_name || 'Anonymous'}"`,
      `"${f.employee_id || ''}"`,
      `"${f.email || ''}"`,
      `"${f.plant_name || ''}"`,
      `"${f.meal_type}"`,
      `"${f.shift}"`,
      f.overall_rating,
      `"${(f.remark || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `canteen-feedback-${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Automated Report Generator</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Build executive summary reports formatted for management review and audit compliance
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'daily', label: 'Daily Report', icon: Calendar },
            { id: 'weekly', label: 'Weekly Report', icon: Calendar },
            { id: 'monthly', label: 'Monthly Report', icon: Calendar },
            { id: 'plant', label: 'Plant Wise Report', icon: Building2 },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = reportType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setReportType(type.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        {reportType === 'plant' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Target Plant</label>
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
            >
              <option value="">All Plants Combined</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={exportPDF}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export Executive PDF</span>
          </button>

          <button
            onClick={exportExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Raw CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Report Summary ({reportData.length} records selected)</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">Avg Rating: {reportStats.averageRating} / 5.0</span>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 font-semibold">Total Logs</div>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">{reportData.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 font-semibold">Average Rating</div>
            <div className="text-lg font-extrabold text-emerald-700 mt-0.5">{reportStats.averageRating}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 font-semibold">Happy %</div>
            <div className="text-lg font-extrabold text-emerald-600 mt-0.5">{reportStats.happyPercentage}%</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 font-semibold">Poor Logs</div>
            <div className="text-lg font-extrabold text-rose-600 mt-0.5">{reportStats.poorCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
