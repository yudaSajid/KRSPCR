import React, { useState } from 'react';
import { X, Filter, Plus, Trash2, Check } from 'lucide-react';
import { AdvancedFilterPayload, FilterCondition } from '../types';

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filter: AdvancedFilterPayload | null) => void;
  initialFilter: AdvancedFilterPayload | null;
}

const AVAILABLE_COLUMNS = [
  { key: 'student_nim', label: 'NIM Mahasiswa' },
  { key: 'student_name', label: 'Nama Mahasiswa' },
  { key: 'course_code', label: 'Kode Mata Kuliah' },
  { key: 'course_name', label: 'Nama Mata Kuliah' },
  { key: 'academic_year', label: 'Tahun Ajaran' },
  { key: 'semester', label: 'Semester' },
  { key: 'status', label: 'Status KRS' }
];

const OPERATORS = [
  { key: 'contains', label: 'Mengandung (contains)' },
  { key: 'startsWith', label: 'Diawali dengan (startsWith)' },
  { key: 'equal', label: 'Sama dengan (equal)' },
  { key: 'in', label: 'Salah satu dari (in)' }
];

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilter
}) => {
  const [logic, setLogic] = useState<'AND' | 'OR'>(initialFilter?.logic || 'AND');
  const [conditions, setConditions] = useState<FilterCondition[]>(
    initialFilter?.conditions && initialFilter.conditions.length > 0
      ? initialFilter.conditions
      : [{ column: 'student_nim', operator: 'contains', value: '' }]
  );

  if (!isOpen) return null;

  const handleAddCondition = () => {
    setConditions([...conditions, { column: 'student_name', operator: 'contains', value: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, field: keyof FilterCondition, val: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: val };
    setConditions(updated);
  };

  const handleApply = () => {
    const validConditions = conditions.filter((c) => c.value !== undefined && c.value.trim() !== '');
    if (validConditions.length === 0) {
      onApply(null);
    } else {
      onApply({ logic, conditions: validConditions });
    }
    onClose();
  };

  const handleReset = () => {
    setConditions([{ column: 'student_nim', operator: 'contains', value: '' }]);
    setLogic('AND');
    onApply(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-bold">Advanced Filter & Multi-Query Builder</h2>
              <p className="text-xs text-slate-300">Filter multi-kolom dengan kombinasi logika AND / OR</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Logic Toggle (AND / OR) Sesuai Bagian 4.6 & TS-10 */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-700">Kombinasi Antar Filter:</span>
            <div className="flex items-center bg-slate-200 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLogic('AND')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  logic === 'AND'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AND (Kombinasi Semua)
              </button>
              <button
                type="button"
                onClick={() => setLogic('OR')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  logic === 'OR'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OR (Salah Satu Cocok)
              </button>
            </div>
          </div>

          {/* Condition Items */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {conditions.map((cond, idx) => (
              <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <select
                  value={cond.column}
                  onChange={(e) => handleConditionChange(idx, 'column', e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-medium"
                >
                  {AVAILABLE_COLUMNS.map((col) => (
                    <option key={col.key} value={col.key}>{col.label}</option>
                  ))}
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.key} value={op.key}>{op.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Nilai pencarian..."
                  value={cond.value}
                  onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 flex-1 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-sky-200"
                />

                {conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddCondition}
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kondisi Filter</span>
          </button>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              Reset Semua Filter
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Filter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
