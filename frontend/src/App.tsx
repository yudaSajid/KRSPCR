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
  CheckCircle, AlertCircle, X, ShieldAlert 
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

  // 1. Debounce Search Input (350ms) Sesuai Bagian 4.4 & TS-08
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
      showToast('error', err.message || 'Gagal terhubung ke server backend');
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
      showToast('error', err.message || 'Gagal menyimpan data KRS');
      throw err;
    }
  };

  const handleUpdate = async (id: string | number, updates: any) => {
    try {
      const res = await api.updateEnrollment(id, updates);
      showToast('success', res.message || 'Data KRS berhasil diperbarui!');
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengupdate KRS');
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

    showToast('success', 'Memulai pengunduhan data streaming CSV...');
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Navbar />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Dashboard Mahasiswa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Manajemen Rencana Studi (KRS)</h2>
            <p className="text-xs text-slate-500 mt-1">
              Kelola pengambilan mata kuliah mahasiswa dengan pencarian instan dan responsif pada 5.000.000 baris data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAdvancedFilterOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                advancedFilter && advancedFilter.conditions.length > 0
                  ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Advanced Filter</span>
              {advancedFilter && advancedFilter.conditions.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
              )}
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV (5M)</span>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-200 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah KRS</span>
            </button>
          </div>
        </div>

        {/* Action Controls & Quick Filters (TS-07 & TS-08) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Live Search (3 Kolom: NIM, Nama, Kode MK) */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NIM, Nama Mahasiswa, atau Kode MK..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full text-xs pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Quick Status */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold">Status:</span>
              <select
                value={quickStatus}
                onChange={(e) => {
                  setQuickStatus(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Diajukan</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>

            {/* Quick Semester */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold">Semester:</span>
              <select
                value={quickSemester}
                onChange={(e) => {
                  setQuickSemester(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="ALL">Semua Semester</option>
                <option value="GANJIL">Ganjil</option>
                <option value="GENAP">Genap</option>
              </select>
            </div>

            <button
              onClick={() => loadData()}
              title="Refresh Data"
              className="p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
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

      {/* Modals */}
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <EditModal
        isOpen={isEditOpen}
        enrollment={selectedRecord}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleUpdate}
      />

      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        initialFilter={advancedFilter}
        onClose={() => setIsAdvancedFilterOpen(false)}
        onApply={(filter) => {
          setAdvancedFilter(filter);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
      />

      {/* Delete Confirmation Modal (TS-12) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Hapus Rencana Studi?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data enrollment ini akan di-soft delete dan disembunyikan dari tabel. Data mahasiswa dan mata kuliah induk tetap aman.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-md transition-colors"
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
