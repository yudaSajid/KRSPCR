import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Edit3 } from 'lucide-react';
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
    } catch (err) {
      // Handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold">Edit Data KRS #{enrollment.id}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">NIM:</span>
              <p className="font-bold text-slate-800">{enrollment.student_nim}</p>
            </div>
            <div>
              <span className="text-slate-500">Kode MK:</span>
              <p className="font-bold text-slate-800">{enrollment.course_code}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Mahasiswa</label>
            <input
              type="text"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Mata Kuliah</label>
            <input
              type="text"
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="GANJIL">GANJIL</option>
                <option value="GENAP">GENAP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status Enrollment</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 font-semibold"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-md transition-colors flex items-center gap-2"
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
