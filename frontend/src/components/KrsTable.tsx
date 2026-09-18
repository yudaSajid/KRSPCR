import React from 'react';
import { 
  ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, AlertCircle 
} from 'lucide-react';
import { EnrollmentRecord, PaginationMeta } from '../types';

interface KrsTableProps {
  data: EnrollmentRecord[];
  pagination: PaginationMeta;
  loading: boolean;
  sort: string;
  onSortChange: (newSort: string) => void;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onEdit: (record: EnrollmentRecord) => void;
  onDelete: (id: string | number) => void;
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', label: 'Draft' },
  SUBMITTED: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Diajukan' },
  APPROVED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Disetujui' },
  REJECTED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'Ditolak' }
};

export const KrsTable: React.FC<KrsTableProps> = ({
  data,
  pagination,
  loading,
  sort,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete
}) => {
  // Parse sort string, format: col1:asc,col2:desc
  const activeSorts = React.useMemo(() => {
    const map: Record<string, 'ASC' | 'DESC'> = {};
    if (!sort) return map;
    sort.split(',').forEach((item) => {
      const [col, dir] = item.split(':');
      if (col && dir) map[col] = dir.toUpperCase() as 'ASC' | 'DESC';
    });
    return map;
  }, [sort]);

  const handleHeaderClick = (colKey: string) => {
    const current = activeSorts[colKey];
    let nextSort = '';
    if (!current) {
      nextSort = `${colKey}:ASC`;
    } else if (current === 'ASC') {
      nextSort = `${colKey}:DESC`;
    } else {
      nextSort = ''; // reset
    }
    onSortChange(nextSort);
  };

  const renderSortIcon = (colKey: string) => {
    const dir = activeSorts[colKey];
    if (dir === 'ASC') return <ArrowUp className="w-3.5 h-3.5 text-sky-600 font-bold" />;
    if (dir === 'DESC') return <ArrowDown className="w-3.5 h-3.5 text-sky-600 font-bold" />;
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[380px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-2" />
            <span className="text-xs font-semibold text-slate-600">Mengambil data dari 5 juta baris...</span>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none">
              <th
                onClick={() => handleHeaderClick('student_nim')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>NIM</span>
                  {renderSortIcon('student_nim')}
                </div>
              </th>

              <th
                onClick={() => handleHeaderClick('student_name')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Mahasiswa</span>
                  {renderSortIcon('student_name')}
                </div>
              </th>

              <th
                onClick={() => handleHeaderClick('course_code')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Kode MK</span>
                  {renderSortIcon('course_code')}
                </div>
              </th>

              <th
                onClick={() => handleHeaderClick('course_name')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Mata Kuliah</span>
                  {renderSortIcon('course_name')}
                </div>
              </th>

              <th className="py-3.5 px-3 text-center">SKS</th>

              <th
                onClick={() => handleHeaderClick('semester')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Semester</span>
                  {renderSortIcon('semester')}
                </div>
              </th>

              <th
                onClick={() => handleHeaderClick('academic_year')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tahun Ajaran</span>
                  {renderSortIcon('academic_year')}
                </div>
              </th>

              <th
                onClick={() => handleHeaderClick('status')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {data.length === 0 && !loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                    <p className="font-semibold text-slate-700">Tidak ada data ditemukan</p>
                    <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau filter Anda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const badge = STATUS_BADGES[row.status] || STATUS_BADGES.DRAFT;
                return (
                  <tr key={row.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{row.student_nim}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{row.student_name}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-sky-700">{row.course_code}</td>
                    <td className="py-3 px-4 text-slate-700">{row.course_name}</td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-600">{row.credits}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                        row.semester === 'GANJIL' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'
                      }`}>
                        {row.semester}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{row.academic_year}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onEdit(row)}
                          title="Edit Data"
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(row.id)}
                          title="Hapus Data (Soft Delete)"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Pagination Footer (TS-05) */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div>
            Menampilkan baris <span className="font-semibold text-slate-900">{((pagination.page - 1) * pagination.pageSize) + (data.length > 0 ? 1 : 0)}</span> -{' '}
            <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</span> dari total{' '}
            <span className="font-bold text-sky-700">{pagination.totalItems.toLocaleString('id-ID')}</span> data
          </div>

          <div className="flex items-center gap-1.5">
            <span>Per halaman:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={pagination.page <= 1 || loading}
            title="Halaman Pertama"
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            title="Halaman Sebelumnya"
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-semibold text-slate-800 bg-white rounded-lg border border-slate-300 shadow-2xs">
            Hal. {pagination.page} / {pagination.totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            title="Halaman Selanjutnya"
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={pagination.page >= pagination.totalPages || loading}
            title="Halaman Terakhir"
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
