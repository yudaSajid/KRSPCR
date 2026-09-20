import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, User, BookMarked, Sparkles, 
  Search, Plus, Trash2, Check, RefreshCw, BookOpen, Layers
} from 'lucide-react';
import { CreateBatchKrsForm, SelectedCourseItem, CourseCatalogItem } from '../types';
import { api } from '../services/api';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBatchKrsForm) => Promise<void>;
}

export const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSubmit }) => {

  const [nim, setNim] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentLookupStatus, setStudentLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState<'GANJIL' | 'GENAP'>('GANJIL');
  const [status, setStatus] = useState<'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('SUBMITTED');

  const [selectedCourses, setSelectedCourses] = useState<SelectedCourseItem[]>([]);
  const [courseTab, setCourseTab] = useState<'catalog' | 'custom'>('catalog');

  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCourses, setCatalogCourses] = useState<CourseCatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [customCode, setCustomCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCredits, setCustomCredits] = useState(3);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCatalog('');
    } else {

      setNim('');
      setStudentName('');
      setStudentEmail('');
      setStudentLookupStatus('idle');
      setSelectedCourses([]);
      setCustomCode('');
      setCustomName('');
      setCustomCredits(3);
      setErrors({});
    }
  }, [isOpen]);

  const loadCatalog = async (search: string) => {
    try {
      setLoadingCatalog(true);
      const res = await api.getCourses(search);
      if (res.success) {
        setCatalogCourses(res.data);
      }
    } catch (err) {
      console.error('Failed to load courses catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadCatalog(catalogSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [catalogSearch, isOpen]);

  const handleNimBlur = async () => {
    const cleanNim = nim.trim();
    if (cleanNim.length >= 8) {
      try {
        setStudentLookupStatus('loading');
        const found = await api.getStudentByNim(cleanNim);
        if (found) {
          setStudentName(found.name);
          setStudentEmail(found.email);
          setStudentLookupStatus('found');
        } else {
          setStudentLookupStatus('not_found');
        }
      } catch (err) {
        setStudentLookupStatus('not_found');
      }
    } else {
      setStudentLookupStatus('idle');
    }
  };

  const toggleCatalogCourse = (course: CourseCatalogItem) => {
    const exists = selectedCourses.some(
      (c) => (c.id && c.id === course.id) || c.code.toUpperCase() === course.code.toUpperCase()
    );

    if (exists) {
      setSelectedCourses(selectedCourses.filter(
        (c) => !((c.id && c.id === course.id) || c.code.toUpperCase() === course.code.toUpperCase())
      ));
    } else {
      setSelectedCourses([
        ...selectedCourses,
        {
          id: course.id,
          code: course.code,
          name: course.name,
          credits: course.credits,
          isCustom: false
        }
      ]);
    }
  };

  const handleAddCustomCourse = () => {
    const errs: Record<string, string> = {};
    const codePattern = /^[A-Z]{2,4}[0-9]{3}$/;
    const upperCode = customCode.trim().toUpperCase();

    if (!upperCode) {
      errs.customCode = 'Kode MK wajib diisi';
    } else if (!codePattern.test(upperCode)) {
      errs.customCode = 'Format kode MK harus 2-4 huruf kapital + 3 angka (contoh: IF101)';
    }

    if (!customName.trim()) {
      errs.customName = 'Nama MK wajib diisi';
    } else if (customName.trim().length < 3) {
      errs.customName = 'Nama MK minimal 3 karakter';
    }

    if (!customCredits || customCredits < 1 || customCredits > 6) {
      errs.customCredits = 'SKS harus antara 1-6';
    }

    const isDuplicate = selectedCourses.some(
      (c) => c.code.toUpperCase() === upperCode
    );
    if (isDuplicate) {
      errs.customCode = `Mata kuliah dengan kode ${upperCode} sudah ada dalam daftar pilihan`;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.customCode;
      delete copy.customName;
      delete copy.customCredits;
      delete copy.courses;
      return copy;
    });

    setSelectedCourses([
      ...selectedCourses,
      {
        code: upperCode,
        name: customName.trim(),
        credits: Number(customCredits),
        isCustom: true
      }
    ]);

    setCustomCode('');
    setCustomName('');
    setCustomCredits(3);
  };

  const handleRemoveCourse = (index: number) => {
    setSelectedCourses(selectedCourses.filter((_, i) => i !== index));
  };

  const totalSks = selectedCourses.reduce((sum, c) => sum + Number(c.credits), 0);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const nimTrimmed = nim.trim();
    if (!nimTrimmed) {
      errs.nim = 'NIM wajib diisi';
    } else if (/\s/.test(nimTrimmed)) {
      errs.nim = 'NIM tidak boleh mengandung spasi';
    } else if (!/^\d+$/.test(nimTrimmed)) {
      errs.nim = 'NIM harus berupa angka saja';
    } else if (nimTrimmed.length < 8 || nimTrimmed.length > 12) {
      errs.nim = 'NIM harus terdiri dari 8-12 digit angka';
    }

    if (!studentName.trim()) {
      errs.studentName = 'Nama mahasiswa wajib diisi';
    } else if (studentName.trim().length < 3 || studentName.trim().length > 100) {
      errs.studentName = 'Nama mahasiswa harus antara 3 - 100 karakter';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!studentEmail.trim()) {
      errs.studentEmail = 'Email mahasiswa wajib diisi';
    } else if (!emailRegex.test(studentEmail.trim())) {
      errs.studentEmail = 'Format email tidak valid (contoh: mhs@kampus.ac.id)';
    }

    const yearPattern = /^\d{4}\/\d{4}$/;
    if (!academicYear.trim()) {
      errs.academicYear = 'Tahun ajaran wajib diisi';
    } else if (!yearPattern.test(academicYear.trim())) {
      errs.academicYear = 'Format tahun ajaran harus YYYY/YYYY (contoh: 2025/2026)';
    }

    if (selectedCourses.length === 0) {
      errs.courses = 'Minimal harus memilih 1 mata kuliah';
    } else if (totalSks > 24) {
      errs.courses = `Total SKS (${totalSks} SKS) melebihi batas maksimal 24 SKS per semester`;
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
        nim: nim.trim(),
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim(),
        academicYear: academicYear.trim(),
        semester,
        status,
        courses: selectedCourses
      });
      onClose();
    } catch (err) {} finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200/80 flex flex-col max-h-[92vh]">
        
        <div className="bg-slate-900 px-7 sm:px-8 py-4 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Formulir Rencana Studi (KRS)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pendaftaran rencana studi semester
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                    1. Data Mahasiswa (Students)
                  </h3>
                </div>
                {studentLookupStatus === 'found' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Mahasiswa Terdaftar di Sistem
                  </span>
                )}
                {studentLookupStatus === 'not_found' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 px-2.5 py-1 rounded-full shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Mahasiswa Baru (Akan Dibuat Otomatis)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIM Mahasiswa (8-12 Digit Angka) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Contoh: 10001234"
                      value={nim}
                      onChange={(e) => {
                        setNim(e.target.value);
                        if (studentLookupStatus !== 'idle') setStudentLookupStatus('idle');
                      }}
                      onBlur={handleNimBlur}
                      className={`w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 placeholder:font-normal ${
                        errors.nim ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-100 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                      } focus:outline-none focus:ring-2 transition-all`}
                    />
                    {studentLookupStatus === 'loading' && (
                      <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {errors.nim ? (
                    <p className="text-[11px] text-rose-600 mt-1.5 font-semibold">{errors.nim}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1.5">Tekan tab / pindah kolom untuk auto-fill jika NIM sudah terdaftar</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Mahasiswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap Mahasiswa"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 placeholder:font-normal ${
                      errors.studentName ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-100 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    } focus:outline-none focus:ring-2 transition-all`}
                  />
                  {errors.studentName && <p className="text-[11px] text-rose-600 mt-1.5 font-semibold">{errors.studentName}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Mahasiswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="contoh: mhs@kampus.ac.id"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 placeholder:font-normal ${
                      errors.studentEmail ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-100 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    } focus:outline-none focus:ring-2 transition-all`}
                  />
                  {errors.studentEmail && <p className="text-[11px] text-rose-600 mt-1.5 font-semibold">{errors.studentEmail}</p>}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                  2. Periode Akademik (Berlaku untuk Semua Mata Kuliah)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tahun Ajaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="2025/2026"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className={`w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 placeholder:font-normal ${
                      errors.academicYear ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-100 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    } focus:outline-none focus:ring-2 transition-all`}
                  />
                  {errors.academicYear && <p className="text-[11px] text-rose-600 mt-1.5 font-semibold">{errors.academicYear}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as any)}
                    className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    <option value="GANJIL">GANJIL</option>
                    <option value="GENAP">GENAP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Status KRS <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    <option value="SUBMITTED">SUBMITTED (Diajukan)</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="APPROVED">APPROVED (Disetujui)</option>
                    <option value="REJECTED">REJECTED (Ditolak)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                    3. Pilih Mata Kuliah (Multi-Course)
                  </h3>
                </div>

                <div className="flex items-center bg-slate-200/80 p-1.5 rounded-xl text-xs shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCourseTab('catalog')}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold transition-all ${
                      courseTab === 'catalog'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    Pilih dari Katalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseTab('custom')}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold transition-all ${
                      courseTab === 'custom'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    + Tambah MK Baru
                  </button>
                </div>
              </div>

              {courseTab === 'catalog' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari kode atau nama mata kuliah di katalog..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    {loadingCatalog && (
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {catalogCourses.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        Tidak ada mata kuliah yang cocok dengan kata kunci pencarian.
                      </div>
                    ) : (
                      catalogCourses.map((c) => {
                        const isSelected = selectedCourses.some(
                          (sc) => (sc.id && sc.id === c.id) || sc.code.toUpperCase() === c.code.toUpperCase()
                        );
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleCatalogCourse(c)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/60 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              
                              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 tracking-wider shrink-0">
                                {c.code}
                              </span>

                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug truncate">
                                  {c.name}
                                </p>
                              </div>

                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shrink-0">
                                {c.credits} SKS
                              </span>
                            </div>

                            <div className="shrink-0 pl-2">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 border border-indigo-600 px-3 py-1.5 rounded-xl shadow-xs transition-all">
                                  <Check className="w-3.5 h-3.5" />
                                  Terpilih
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs transition-all">
                                  + Pilih
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {courseTab === 'custom' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kode MK (ex: IF101) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="IF101"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        className={`w-full text-xs sm:text-sm font-mono font-bold uppercase px-3 py-2 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 placeholder:font-normal ${
                          errors.customCode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        } focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100`}
                      />
                      {errors.customCode && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.customCode}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Mata Kuliah Baru <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Pemrograman Sistem"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className={`w-full text-xs sm:text-sm px-3 py-2 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 placeholder:font-normal ${
                          errors.customName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        } focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100`}
                      />
                      {errors.customName && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.customName}</p>}
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bobot SKS (1-6) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={customCredits}
                        onChange={(e) => setCustomCredits(parseInt(e.target.value) || 1)}
                        className="w-full text-xs sm:text-sm font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                      {errors.customCredits && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.customCredits}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 pb-2">
                    <button
                      type="button"
                      onClick={handleAddCustomCourse}
                      className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambahkan ke Daftar Pilihan</span>
                    </button>
                  </div>
                </div>
              )}

              {errors.courses && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errors.courses}</span>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Mata Kuliah Terpilih ({selectedCourses.length})
                    </h4>
                    {selectedCourses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCourses([])}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline ml-1"
                      >
                        Hapus Semua
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Total Akumulasi:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border shadow-xs transition-all ${
                      totalSks > 24 
                        ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-200/60 animate-pulse'
                        : totalSks > 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}>
                      <span className="tracking-wide">{totalSks} / 24 SKS</span>
                      {totalSks > 24 && <span className="text-[10px] font-bold uppercase">(Over Limit)</span>}
                    </span>
                  </div>
                </div>

                {selectedCourses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-7 px-4 rounded-2xl border-2 border-dashed border-slate-300/80 bg-white text-center">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5 border border-slate-200/70">
                      <BookOpen className="w-5 h-5 text-slate-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Belum Ada Mata Kuliah Dipilih</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-0.5 leading-relaxed">
                      Silakan klik tombol <strong className="font-bold text-indigo-600">+ Pilih</strong> pada katalog di atas atau buat mata kuliah baru.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedCourses.map((course, idx) => (
                      <div
                        key={`${course.code}-${idx}`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                            {course.code}
                          </span>
                          <span className="font-semibold text-slate-800 truncate">{course.name}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            {course.credits} SKS
                          </span>
                          {course.isCustom && (
                            <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                              MK Baru
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCourse(idx)}
                          title="Hapus mata kuliah ini dari pilihan"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2 shrink-0 border border-transparent hover:border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-7 py-2 sm:py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-inner">
            <div className="text-xs sm:text-sm text-slate-600 w-full sm:w-auto text-center sm:text-left">
              {selectedCourses.length > 0 ? (
                <span>
                  Akan menyimpan <strong>{selectedCourses.length} baris enrollment</strong> secara atomik.
                </span>
              ) : (
                <span className="text-slate-400">Pilih minimal 1 mata kuliah untuk melanjutkan.</span>
              )}
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-end py-1.5">
              <button
                type="button"
                onClick={onClose}
                className="px-6 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-300 rounded-xl transition-all shadow-2xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedCourses.length === 0 || totalSks > 24}
                className="px-7 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting 
                    ? 'Menyimpan Transaksi...' 
                    : `Simpan KRS (${selectedCourses.length} MK • ${totalSks} SKS)`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
