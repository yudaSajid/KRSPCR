import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { KrsTable } from './components/KrsTable';
import { CreateModal } from './components/CreateModal';
import { EditModal } from './components/EditModal';
import { AdvancedFilterModal } from './components/AdvancedFilterModal';
import { api } from './services/api';
import { EnrollmentRecord, PaginationMeta, AdvancedFilterPayload, CreateKrsForm } from './types';
import { 
  Search, Plus, Download, SlidersHorizontal, RefreshCw, 
  CheckCircle, AlertCircle, X, ShieldAlert, Database, CheckCircle2,
  Clock, BookOpen, Filter, Sparkles 
} from 'lucide-react';

export const App: React.FC = () => {
  // State Data & Pagination
  const [data, setData] = useState<EnrollmentRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(false);

  // State Filters & Search
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [quickStatus, setQuickStatus] = useState('ALL');
  const [quickSemester, setQuickSemester] = useState('ALL');
  const [sort, setSort] = useState('id:DESC');
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilterPayload | null>(null);

  // State Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EnrollmentRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  // Toast / Alert Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // 1. Debounce Search Input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // 2. Fetch Data dari Backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getEnrollments({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch,
        quickStatus,
        quickSemester,
        sort,
        advancedFilter
      });

      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat data dari database');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, quickStatus, quickSemester, sort, advancedFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler CRUD
  const handleCreate = async (formData: CreateKrsForm) => {
    try {
      const res = await api.createEnrollment(formData);
      showToast('success', res.message || 'KRS berhasil ditambahkan ke 3 tabel secara atomik!');
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan formulir KRS');
      throw err;
    }
  };

  const handleUpdate = async (id: string | number, updates: any) => {
    try {
      const res = await api.updateEnrollment(id, updates);
      showToast('success', res.message || 'Data KRS berhasil diperbarui!');
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memperbarui data KRS');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.deleteEnrollment(deleteConfirmId);
      showToast('success', res.message || 'Data KRS berhasil dihapus (soft delete)');
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus data KRS');
    }
  };

  // Handler Export CSV Streaming (TS-13)
  const handleExport = () => {
    const exportUrl = api.getExportUrl({
      page: 1,
      pageSize: 10,
      search: debouncedSearch,
      quickStatus,
      quickSemester,
      sort,
      advancedFilter
    });

    showToast('success', 'Mengunduh stream CSV dataset dari server...');
    window.open(exportUrl, '_blank');
  };

  // Cek apakah ada filter yang sedang aktif
  const hasActiveFilters = Boolean(
    debouncedSearch ||
    quickStatus !== 'ALL' ||
    quickSemester !== 'ALL' ||
    (advancedFilter && advancedFilter.conditions.length > 0)
  );

  const resetAllFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setQuickStatus('ALL');
    setQuickSemester('ALL');
    setAdvancedFilter(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const advancedCount = advancedFilter?.conditions?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-sky-50/20 to-slate-100/90 text-slate-800">
      <Navbar />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 text-emerald-900 border-emerald-300 shadow-emerald-500/10'
                : 'bg-rose-50/95 text-rose-900 border-rose-300 shadow-rose-500/10'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Metric / Stat Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Dataset */}
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Record</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
              {pagination.totalItems.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>●</span> Indeks Server-Side Siap
            </p>
          </div>

          {/* Card 2: Halaman Aktif */}
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Halaman Aktif</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
              {pagination.page} <span className="text-xs font-normal text-slate-400">/ {pagination.totalPages || 1}</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Limit {pagination.pageSize} baris/halaman
            </p>
          </div>

          {/* Card 3: Semester Aktif */}
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Periode KRS</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
              2025/2026
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">
              Semester Ganjil Reguler
            </p>
          </div>

          {/* Card 4: Filter Status */}
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Query</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
              {hasActiveFilters ? 'Filter Terpasang' : 'Semua Data'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {advancedCount > 0 ? `${advancedCount} kriteria lanjutan` : 'Mode pencarian normal'}
            </p>
          </div>
        </div>

        {/* Action Header Banner */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Daftar Pengambilan Mata Kuliah (KRS)</h2>
              <span className="text-[11px] font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Sistem KRS berkapasitas 5 juta baris dengan live search real-time, pengurutan fleksibel, dan ekspor streaming.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tombol Advanced Filter */}
            <button
              onClick={() => setIsAdvancedFilterOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                advancedCount > 0
                  ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-200/60 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              <span>Filter Lanjutan</span>
              {advancedCount > 0 && (
                <span className="bg-sky-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                  {advancedCount}
                </span>
              )}
            </button>

            {/* Tombol Export CSV */}
            <button
              onClick={handleExport}
              title="Unduh seluruh data sesuai filter saat ini"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 transition-all shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>

            {/* Tombol Tambah KRS */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah KRS</span>
            </button>
          </div>
        </div>

        {/* Filter Controls & Live Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3.5">
            {/* Live Search Input with Debounce */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari NIM, Nama Mahasiswa, atau Kode MK..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full text-xs pl-10 pr-10 py-3 rounded-2xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  title="Hapus kata kunci pencarian"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters Group */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Quick Status */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200/80">
                <span className="font-semibold text-slate-500">Status:</span>
                <select
                  value={quickStatus}
                  onChange={(e) => {
                    setQuickStatus(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Diajukan</option>
                  <option value="APPROVED">Disetujui</option>
                  <option value="REJECTED">Ditolak</option>
                </select>
              </div>

              {/* Quick Semester */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200/80">
                <span className="font-semibold text-slate-500">Semester:</span>
                <select
                  value={quickSemester}
                  onChange={(e) => {
                    setQuickSemester(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Semester</option>
                  <option value="GANJIL">Ganjil</option>
                  <option value="GENAP">Genap</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => loadData()}
                title="Segarkan Data"
                className="p-2.5 text-slate-500 hover:text-sky-600 hover:bg-slate-50 rounded-2xl border border-slate-200 transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Active Filter Chips Bar (Jika ada filter yang aktif) */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-sky-600" />
                Filter Aktif:
              </span>

              {debouncedSearch && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-medium">
                  Cari: <strong className="font-bold">"{debouncedSearch}"</strong>
                  <button onClick={() => { setSearchInput(''); setDebouncedSearch(''); }} className="hover:text-sky-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {quickStatus !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                  Status: <strong className="font-bold">{quickStatus}</strong>
                  <button onClick={() => setQuickStatus('ALL')} className="hover:text-blue-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {quickSemester !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium">
                  Semester: <strong className="font-bold">{quickSemester}</strong>
                  <button onClick={() => setQuickSemester('ALL')} className="hover:text-indigo-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {advancedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                  Filter Lanjutan: <strong className="font-bold">{advancedCount} Kriteria (Mode {advancedFilter?.logic})</strong>
                  <button onClick={() => setAdvancedFilter(null)} className="hover:text-purple-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={resetAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline ml-1"
              >
                Hapus Semua
              </button>
            </div>
          )}
        </div>

        {/* Data Table Component */}
        <KrsTable
          data={data}
          pagination={pagination}
          loading={loading}
          sort={sort}
          onSortChange={(newSort) => {
            setSort(newSort);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
          onPageSizeChange={(newSize) => setPagination((prev) => ({ ...prev, pageSize: newSize, page: 1 }))}
          onEdit={(record) => {
            setSelectedRecord(record);
            setIsEditOpen(true);
          }}
          onDelete={(id) => setDeleteConfirmId(id)}
        />
      </main>

      {/* Modal Tambah KRS */}
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Modal Edit KRS */}
      <EditModal
        isOpen={isEditOpen}
        enrollment={selectedRecord}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleUpdate}
      />

      {/* Modal Advanced Filter */}
      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        initialFilter={advancedFilter}
        onClose={() => setIsAdvancedFilterOpen(false)}
        onApply={(filter) => {
          setAdvancedFilter(filter);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
      />

      {/* Modal Konfirmasi Hapus (Soft Delete) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100 shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Hapus Rencana Studi?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Data enrollment ini akan di-soft delete dan disembunyikan dari tabel. Data master mahasiswa dan mata kuliah induk tetap terjaga keamanannya.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-all"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
