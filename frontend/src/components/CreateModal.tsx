import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, User, BookMarked, FileText, Sparkles } from 'lucide-react';
import { CreateKrsForm } from '../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateKrsForm) => Promise<void>;
}

export const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateKrsForm>({
    nim: '',
    studentName: '',
    studentEmail: '',
    courseCode: '',
    courseName: '',
    credits: 3,
    academicYear: '2025/2026',
    semester: 'GANJIL',
    status: 'SUBMITTED'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Validasi Ketat Sesuai Kebutuhan Bagian 5.1 & TS-03
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Validasi Mahasiswa
    const nimTrimmed = form.nim.trim();
    if (!nimTrimmed) {
      errs.nim = 'NIM wajib diisi';
    } else if (/\s/.test(nimTrimmed)) {
      errs.nim = 'NIM tidak boleh mengandung spasi';
    } else if (!/^\d+$/.test(nimTrimmed)) {
      errs.nim = 'NIM harus berupa angka saja';
    } else if (nimTrimmed.length < 8 || nimTrimmed.length > 12) {
      errs.nim = 'NIM harus terdiri dari 8-12 digit angka';
    }

    if (!form.studentName.trim()) {
      errs.studentName = 'Nama mahasiswa wajib diisi';
    } else if (form.studentName.trim().length < 3 || form.studentName.trim().length > 100) {
      errs.studentName = 'Nama mahasiswa harus antara 3 - 100 karakter';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.studentEmail.trim()) {
      errs.studentEmail = 'Email mahasiswa wajib diisi';
    } else if (!emailRegex.test(form.studentEmail.trim())) {
      errs.studentEmail = 'Format email tidak valid (contoh: mhs@kampus.ac.id)';
    }

    // 2. Validasi Mata Kuliah
    const courseCodePattern = /^[A-Z]{2,4}[0-9]{3}$/;
    if (!form.courseCode.trim()) {
      errs.courseCode = 'Kode mata kuliah wajib diisi';
    } else if (!courseCodePattern.test(form.courseCode.trim().toUpperCase())) {
      errs.courseCode = 'Format kode MK harus 2-4 huruf kapital + 3 angka (contoh: IF101, CS202)';
    }

    if (!form.courseName.trim()) {
      errs.courseName = 'Nama mata kuliah wajib diisi';
    } else if (form.courseName.trim().length < 3 || form.courseName.trim().length > 120) {
      errs.courseName = 'Nama mata kuliah harus antara 3 - 120 karakter';
    }

    const creditsNum = Number(form.credits);
    if (!creditsNum || isNaN(creditsNum)) {
      errs.credits = 'SKS wajib berupa angka';
    } else if (creditsNum < 1 || creditsNum > 6) {
      errs.credits = 'SKS harus antara 1 sampai 6';
    }

    // 3. Validasi Enrollment
    const yearPattern = /^\d{4}\/\d{4}$/;
    if (!form.academicYear.trim()) {
      errs.academicYear = 'Tahun ajaran wajib diisi';
    } else if (!yearPattern.test(form.academicYear.trim())) {
      errs.academicYear = 'Format tahun ajaran harus YYYY/YYYY (contoh: 2025/2026)';
    }

    if (!['GANJIL', 'GENAP'].includes(form.semester)) {
      errs.semester = "Semester harus 'GANJIL' atau 'GENAP'";
    }

    if (!['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].includes(form.status)) {
      errs.status = 'Status tidak valid';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...form,
        courseCode: form.courseCode.trim().toUpperCase()
      });
      onClose();
    } catch (err) {
      // Ditangani oleh parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-600 px-6 py-4.5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Formulir Rencana Studi (KRS)</h2>
              <p className="text-xs text-sky-100">
                Operasi atomik ke 3 entitas (Students, Courses, Enrollments) dalam 1 transaksi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Bagian 1: Data Mahasiswa */}
          <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <User className="w-4 h-4 text-sky-600" />
              <span>1. Data Mahasiswa (Students)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  NIM Mahasiswa (8-12 Digit) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 10001234"
                  value={form.nim}
                  onChange={(e) => setForm({ ...form, nim: e.target.value })}
                  className={`w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border ${
                    errors.nim ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-300 focus:ring-sky-200'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.nim && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.nim}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Mahasiswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border ${
                    errors.studentName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                />
                {errors.studentName && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.studentName}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Mahasiswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="contoh: budi@kampus.ac.id"
                  value={form.studentEmail}
                  onChange={(e) => setForm({ ...form, studentEmail: e.target.value })}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border ${
                    errors.studentEmail ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                />
                {errors.studentEmail && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.studentEmail}</p>}
              </div>
            </div>
          </div>

          {/* Bagian 2: Data Mata Kuliah */}
          <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <span>2. Data Mata Kuliah (Courses)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kode MK <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: IF101"
                  value={form.courseCode}
                  onChange={(e) => setForm({ ...form, courseCode: e.target.value.toUpperCase() })}
                  className={`w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border ${
                    errors.courseCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-sky-200 uppercase font-bold`}
                />
                {errors.courseCode && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.courseCode}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Mata Kuliah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Algoritma & Pemrograman"
                  value={form.courseName}
                  onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border ${
                    errors.courseName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                />
                {errors.courseName && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.courseName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Bobot SKS (1-6) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) || 0 })}
                  className={`w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border ${
                    errors.credits ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                />
                {errors.credits && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.credits}</p>}
              </div>
            </div>
          </div>

          {/* Bagian 3: Data Pengambilan KRS */}
          <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>3. Data Rencana Studi (Enrollments)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tahun Ajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="2025/2026"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border ${
                    errors.academicYear ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                />
                {errors.academicYear && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.academicYear}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Semester <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value as any })}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="GANJIL">GANJIL</option>
                  <option value="GENAP">GENAP</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Status KRS <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED (Diajukan)</option>
                  <option value="APPROVED">APPROVED (Disetujui)</option>
                  <option value="REJECTED">REJECTED (Ditolak)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan KRS (1 Transaksi)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
