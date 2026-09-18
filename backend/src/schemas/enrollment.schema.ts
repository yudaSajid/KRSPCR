import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  student: z.object({
    nim: z.string()
      .trim()
      .min(8, 'NIM minimal 8 digit')
      .max(12, 'NIM maksimal 12 digit')
      .regex(/^\d+$/, 'NIM hanya boleh berisi angka dan tidak boleh ada spasi'),
    name: z.string()
      .trim()
      .min(3, 'Nama mahasiswa minimal 3 karakter')
      .max(100, 'Nama mahasiswa maksimal 100 karakter'),
    email: z.string()
      .trim()
      .email('Format email tidak valid')
      .max(100, 'Email maksimal 100 karakter')
  }),
  course: z.object({
    code: z.string()
      .trim()
      .regex(/^[A-Z]{2,4}[0-9]{3}$/, 'Format kode MK harus [A-Z]{2,4}[0-9]{3} (contoh: IF101)'),
    name: z.string()
      .trim()
      .min(3, 'Nama mata kuliah minimal 3 karakter')
      .max(120, 'Nama mata kuliah maksimal 120 karakter'),
    credits: z.coerce.number()
      .int('SKS harus berupa bilangan bulat')
      .min(1, 'SKS minimal 1')
      .max(6, 'SKS maksimal 6')
  }),
  enrollment: z.object({
    academic_year: z.string()
      .trim()
      .regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran harus YYYY/YYYY (contoh: 2025/2026)'),
    semester: z.enum(['GANJIL', 'GENAP'], {
      errorMap: () => ({ message: "Semester harus bernilai 'GANJIL' atau 'GENAP'" })
    }),
    status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: "Status harus salah satu dari: DRAFT, SUBMITTED, APPROVED, REJECTED" })
    })
  })
});

export const updateEnrollmentSchema = z.object({
  student_name: z.string().trim().min(3).max(100).optional(),
  course_name: z.string().trim().min(3).max(120).optional(),
  academic_year: z.string().trim().regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran harus YYYY/YYYY').optional(),
  semester: z.enum(['GANJIL', 'GENAP']).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional()
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
