import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Edit3, User, BookOpen, Calendar } from 'lucide-react';
import { EnrollmentRecord } from '../types';

interface EditModalProps {
  isOpen: boolean;
  enrollment: EnrollmentRecord | null;
  onClose: () => void;
  onSubmit: (id: string | number, updates: any) => Promise<void>;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, enrollment, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    courseName: '',
    academicYear: '',
    semester: 'GANJIL',
    status: 'DRAFT'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (enrollment) {
      setFormData({
        studentName: enrollment.student_name,
        courseName: enrollment.course_name,
        academicYear: enrollment.academic_year,
        semester: enrollment.semester,
        status: enrollment.status
      });
    }
  }, [enrollment]);

  if (!isOpen || !enrollment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit(enrollment.id, {
        student_name: formData.studentName,
        course_name: formData.courseName,
        academic_year: formData.academicYear,
        semester: formData.semester,
        status: formData.status
      });
      onClose();
    } catch (err) {} finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col">
        
        <div className="bg-slate-900 px-7 sm:px-8 py-6 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">Edit Data KRS #{enrollment.id}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Perbarui data atau status KRS</p>
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-5 sm:p-6 space-y-4 flex-1">
            
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">NIM Mahasiswa:</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{enrollment.student_nim}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Kode MK:</span>
                <p className="font-mono font-bold text-sky-700 mt-0.5">{enrollment.course_code}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Mahasiswa</label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Mata Kuliah</label>
              <input
                type="text"
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tahun Ajaran</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  <option value="GANJIL">GANJIL</option>
                  <option value="GENAP">GENAP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Enrollment</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED (Diajukan)</option>
                <option value="APPROVED">APPROVED (Disetujui)</option>
                <option value="REJECTED">REJECTED (Ditolak)</option>
              </select>
            </div>
          </div>

          <div className="px-7 sm:px-8 py-5 sm:py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3.5 shrink-0 shadow-inner">
            <button
              type="button"
              onClick={onClose}
              className="px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-300 rounded-xl transition-all shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
