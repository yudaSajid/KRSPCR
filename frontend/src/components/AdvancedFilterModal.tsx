import React, { useState, useEffect } from 'react';
import { 
  X, Filter, Check, RotateCcw, User, BookOpen, Calendar, 
  Sparkles, CheckCircle2, SlidersHorizontal, Info, ChevronRight 
} from 'lucide-react';
import { AdvancedFilterPayload, FilterCondition } from '../types';

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filter: AdvancedFilterPayload | null) => void;
  initialFilter: AdvancedFilterPayload | null;
}

const ACADEMIC_YEARS = ['2025/2026', '2024/2025', '2023/2024', '2022/2023', '2021/2022'];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: 'border-slate-300 text-slate-700 hover:bg-slate-100', active: 'bg-slate-700 text-white border-slate-700 shadow-sm' },
  { value: 'SUBMITTED', label: 'Diajukan', color: 'border-sky-300 text-sky-700 hover:bg-sky-50', active: 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200' },
  { value: 'APPROVED', label: 'Disetujui', color: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50', active: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200' },
  { value: 'REJECTED', label: 'Ditolak', color: 'border-rose-300 text-rose-700 hover:bg-rose-50', active: 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200' }
];

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilter
}) => {
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  
  // Field-based states for ultra-intuitive UI
  const [nim, setNim] = useState('');
  const [nimMode, setNimMode] = useState<'contains' | 'startsWith' | 'equal'>('contains');
  const [studentName, setStudentName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [semester, setSemester] = useState<'ALL' | 'GANJIL' | 'GENAP'>('ALL');
  const [academicYear, setAcademicYear] = useState<string>('ALL');

  // Load existing filter if any
  useEffect(() => {
    if (initialFilter) {
      setLogic(initialFilter.logic || 'AND');
      const conds = initialFilter.conditions || [];
      
      conds.forEach((c) => {
        if (c.column === 'student_nim') {
          setNim(String(c.value));
          setNimMode(c.operator as any);
        } else if (c.column === 'student_name') {
          setStudentName(String(c.value));
        } else if (c.column === 'course_code') {
          setCourseCode(String(c.value));
        } else if (c.column === 'course_name') {
          setCourseName(String(c.value));
        } else if (c.column === 'credits') {
          setSelectedCredits(Number(c.value));
        } else if (c.column === 'status') {
          if (Array.isArray(c.value)) {
            setSelectedStatuses(c.value);
          } else {
            setSelectedStatuses([String(c.value)]);
          }
        } else if (c.column === 'semester') {
          setSemester(c.value as any);
        } else if (c.column === 'academic_year') {
          setAcademicYear(String(c.value));
        }
      });
    } else {
      handleResetFields();
    }
  }, [initialFilter, isOpen]);

  if (!isOpen) return null;

  const handleResetFields = () => {
    setLogic('AND');
    setNim('');
    setNimMode('contains');
    setStudentName('');
    setCourseCode('');
    setCourseName('');
    setSelectedCredits(null);
    setSelectedStatuses([]);
    setSemester('ALL');
    setAcademicYear('ALL');
  };

  const toggleStatus = (val: string) => {
    if (selectedStatuses.includes(val)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== val));
    } else {
      setSelectedStatuses([...selectedStatuses, val]);
    }
  };

  // Hitung jumlah kriteria yang aktif
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (nim.trim()) count++;
    if (studentName.trim()) count++;
    if (courseCode.trim()) count++;
    if (courseName.trim()) count++;
    if (selectedCredits !== null) count++;
    if (selectedStatuses.length > 0) count++;
    if (semester !== 'ALL') count++;
    if (academicYear !== 'ALL') count++;
    return count;
  };

  const handleApply = () => {
    const conditions: FilterCondition[] = [];

    if (nim.trim()) {
      conditions.push({ column: 'student_nim', operator: nimMode, value: nim.trim() });
    }
    if (studentName.trim()) {
      conditions.push({ column: 'student_name', operator: 'contains', value: studentName.trim() });
    }
    if (courseCode.trim()) {
      conditions.push({ column: 'course_code', operator: 'contains', value: courseCode.trim().toUpperCase() });
    }
    if (courseName.trim()) {
      conditions.push({ column: 'course_name', operator: 'contains', value: courseName.trim() });
    }
    if (selectedCredits !== null) {
      conditions.push({ column: 'credits', operator: 'equal', value: selectedCredits });
    }
    if (selectedStatuses.length > 0) {
      if (selectedStatuses.length === 1) {
        conditions.push({ column: 'status', operator: 'equal', value: selectedStatuses[0] });
      } else {
        conditions.push({ column: 'status', operator: 'in', value: selectedStatuses });
      }
    }
    if (semester !== 'ALL') {
      conditions.push({ column: 'semester', operator: 'equal', value: semester });
    }
    if (academicYear !== 'ALL') {
      conditions.push({ column: 'academic_year', operator: 'equal', value: academicYear });
    }

    if (conditions.length === 0) {
      onApply(null);
    } else {
      onApply({ logic, conditions });
    }
    onClose();
  };

  const handleClearAll = () => {
    handleResetFields();
    onApply(null);
    onClose();
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 px-6 py-4.5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Filter Lanjutan (Smart Search)</h2>
                {activeCount > 0 && (
                  <span className="text-[11px] font-extrabold bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                    {activeCount} Kriteria Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-100">Cari data KRS dengan kombinasi kriteria yang spesifik dan mudah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Pemilihan Logika Kombinasi (AND / OR) yang Jelas & Ramah */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Cara Menggabungkan Filter:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option AND */}
              <div
                onClick={() => setLogic('AND')}
                className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all flex items-start gap-3 ${
                  logic === 'AND'
                    ? 'border-sky-600 bg-sky-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  logic === 'AND' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                }`}>
                  {logic === 'AND' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Mode AND (Harus Cocok Semua)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Data harus memenuhi <strong>seluruh</strong> kriteria yang Anda tentukan di bawah.
                  </p>
                </div>
              </div>

              {/* Option OR */}
              <div
                onClick={() => setLogic('OR')}
                className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all flex items-start gap-3 ${
                  logic === 'OR'
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  logic === 'OR' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                }`}>
                  {logic === 'OR' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Mode OR (Salah Satu Cocok)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Data yang memenuhi <strong>salah satu</strong> kriteria akan langsung ditampilkan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Kartu Mahasiswa */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <User className="w-4 h-4 text-sky-600" />
              <span>Data Mahasiswa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIM Mahasiswa
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Ketik angka NIM..."
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono"
                  />
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-500 mr-1">Metode:</span>
                    {(['contains', 'startsWith', 'equal'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setNimMode(mode)}
                        className={`px-2 py-0.5 rounded-md border transition-all ${
                          nimMode === mode
                            ? 'bg-sky-100 border-sky-300 text-sky-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mode === 'contains' ? 'Mengandung' : mode === 'startsWith' ? 'Diawali' : 'Tepat Sama'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Mahasiswa
                </label>
                <input
                  type="text"
                  placeholder="Ketik nama mahasiswa..."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>
          </div>

          {/* 3. Kartu Mata Kuliah */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Data Mata Kuliah</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kode MK
                </label>
                <input
                  type="text"
                  placeholder="Contoh: IF101, CS..."
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Mata Kuliah
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Algoritma, Basis Data..."
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            {/* Seleksi SKS */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Bobot SKS:
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCredits(null)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    selectedCredits === null
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua SKS
                </button>
                {[1, 2, 3, 4, 6].map((cr) => (
                  <button
                    key={cr}
                    type="button"
                    onClick={() => setSelectedCredits(selectedCredits === cr ? null : cr)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      selectedCredits === cr
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cr} SKS
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Kartu Periode Akademik & Status KRS */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Status & Periode Akademik</span>
            </div>

            {/* Status Chips */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Status KRS (Bisa pilih lebih dari satu):
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_OPTIONS.map((st) => {
                  const isChecked = selectedStatuses.includes(st.value);
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => toggleStatus(st.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isChecked ? st.active : `${st.color} bg-white`
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Semester
                </label>
                <div className="flex items-center bg-white p-1 rounded-xl border border-slate-300 text-xs">
                  {(['ALL', 'GANJIL', 'GENAP'] as const).map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setSemester(sem)}
                      className={`flex-1 py-1 text-center font-bold rounded-lg transition-all ${
                        semester === sem
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sem === 'ALL' ? 'Semua' : sem}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tahun Ajaran
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="ALL">Semua Tahun Ajaran</option>
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Semua Filter</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Terapkan Filter {activeCount > 0 ? `(${activeCount})` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
