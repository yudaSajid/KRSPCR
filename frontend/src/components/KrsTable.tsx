import React from 'react';
import { 
  ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, AlertCircle, BookOpen 
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

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  DRAFT: { 
    bg: 'bg-slate-100', 
    border: 'border-slate-300', 
    text: 'text-slate-700', 
    dot: 'bg-slate-400', 
    label: 'Draft' 
  },
  SUBMITTED: { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    text: 'text-blue-700', 
    dot: 'bg-blue-500 animate-pulse', 
    label: 'Diajukan' 
  },
  APPROVED: { 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200', 
    text: 'text-emerald-800', 
    dot: 'bg-emerald-500', 
    label: 'Disetujui' 
  },
  REJECTED: { 
    bg: 'bg-rose-50', 
    border: 'border-rose-200', 
    text: 'text-rose-800', 
    dot: 'bg-rose-500', 
    label: 'Ditolak' 
  }
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200'
];

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
      nextSort = '';
    }
    onSortChange(nextSort);
  };

  const renderSortIndicator = (colKey: string) => {
    const dir = activeSorts[colKey];
    if (dir === 'ASC') {
      return (
        <span className="p-0.5 rounded bg-sky-100 text-sky-700">
          <ArrowUp className="w-3 h-3 stroke-[2.5]" />
        </span>
      );
    }
    if (dir === 'DESC') {
      return (
        <span className="p-0.5 rounded bg-sky-100 text-sky-700">
          <ArrowDown className="w-3 h-3 stroke-[2.5]" />
        </span>
      );
    }
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 overflow-hidden flex flex-col transition-all">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[420px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1.5px] z-20 flex flex-col items-center justify-center animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-md shadow-sky-100 mb-3">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
            </div>
            <p className="text-xs font-bold text-slate-800">Menyaring 5.000.000 data...</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Memproses query server-side berkinerja tinggi</p>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <th
                onClick={() => handleHeaderClick('student_nim')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/90 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>NIM Mahasiswa</span>
                  {renderSortIndicator('student_nim')}
                </div>
              </th>

              <th
                onClick={() => handleHeaderClick('student_name')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/90 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Mahasiswa</span>
                  {renderSortIndicator('student_name')}
                </div>
              </th>

              <th
                onClick={() => handleHeaderClick('course_code')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/90 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Mata Kuliah</span>
                  {renderSortIndicator('course_code')}
                </div>
              </th>

              <th className="py-3.5 px-3 text-center">SKS</th>

              <th
                onClick={() => handleHeaderClick('semester')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/90 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Semester</span>
                  {renderSortIndicator('semester')}
                </div>
              </th>

              <th
                onClick={() => handleHeaderClick('academic_year')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/90 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tahun Ajaran</span>
                  {renderSortIndicator('academic_year')}
                </div>
              </th>

              <th
                onClick={() => handleHeaderClick('status')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/90 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {renderSortIndicator('status')}
                </div>
              </th>

              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {data.length === 0 && !loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="max-w-xs mx-auto flex flex-col items-center justify-center space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">Tidak ada baris data ditemukan</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Kombinasi kata kunci atau filter saat ini tidak menghasilkan data. Coba sesuaikan kata kunci atau reset filter.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const badge = STATUS_CONFIG[row.status] || STATUS_CONFIG.DRAFT;
                const avatarColor = getAvatarColor(row.student_name);
                const initial = row.student_name.replace(/Mahasiswa /i, '').charAt(0) || 'M';

                return (
                  <tr key={row.id} className="hover:bg-sky-50/40 transition-colors group">
                    {/* NIM */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/60">
                        {row.student_nim}
                      </span>
                    </td>

                    {/* Nama Mahasiswa with Initial Chip */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${avatarColor}`}>
                          {initial}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight group-hover:text-sky-700 transition-colors">
                            {row.student_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.student_email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Mata Kuliah */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2">
                        <span className="font-mono text-[11px] font-extrabold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md shrink-0">
                          {row.course_code}
                        </span>
                        <span className="text-xs font-medium text-slate-700 leading-snug">
                          {row.course_name}
                        </span>
                      </div>
                    </td>

                    {/* SKS */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {row.credits}
                      </span>
                    </td>

                    {/* Semester */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        row.semester === 'GANJIL' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : 'bg-teal-50 text-teal-700 border-teal-200'
                      }`}>
                        {row.semester}
                      </span>
                    </td>

                    {/* Tahun Ajaran */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {row.academic_year}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEdit(row)}
                          title="Ubah Data KRS"
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(row.id)}
                          title="Hapus Data (Soft Delete)"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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

      {/* Pagination Footer */}
      <div className="bg-slate-50/90 px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            Menampilkan <span className="font-bold text-slate-900">{((pagination.page - 1) * pagination.pageSize) + (data.length > 0 ? 1 : 0)}</span> -{' '}
            <span className="font-bold text-slate-900">{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</span> dari{' '}
            <span className="font-extrabold text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded-md">{pagination.totalItems.toLocaleString('id-ID')}</span> data
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Baris:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onPageChange(1)}
            disabled={pagination.page <= 1 || loading}
            title="Halaman Pertama"
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            title="Halaman Sebelumnya"
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3.5 py-1 font-bold text-slate-800 bg-white rounded-xl border border-slate-200 shadow-2xs">
            {pagination.page} / {pagination.totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            title="Halaman Selanjutnya"
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={pagination.page >= pagination.totalPages || loading}
            title="Halaman Terakhir"
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
