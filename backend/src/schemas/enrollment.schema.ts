import { z } from 'zod';

export const studentSchema = z.object({
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
});

export const newCourseSchema = z.object({
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
});

export const existingCourseSchema = z.object({
  id: z.coerce.number().int().positive('ID mata kuliah harus berupa bilangan bulat positif'),
  code: z.string().trim().optional(),
  name: z.string().trim().optional(),
  credits: z.coerce.number().int().min(1).max(6).optional()
});

export const courseItemSchema = z.union([existingCourseSchema, newCourseSchema]);

export const createEnrollmentBatchSchema = z.object({
  student: studentSchema,
  academic_year: z.string()
    .trim()
    .regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran harus YYYY/YYYY (contoh: 2025/2026)'),
  semester: z.enum(['GANJIL', 'GENAP'], {
    errorMap: () => ({ message: "Semester harus bernilai 'GANJIL' atau 'GENAP'" })
  }),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: "Status harus salah satu dari: DRAFT, SUBMITTED, APPROVED, REJECTED" })
  }),
  courses: z.array(courseItemSchema)
    .min(1, 'Minimal harus memilih 1 mata kuliah')
}).refine((data) => {

  const ids = new Set<number>();
  const codes = new Set<string>();
  for (const c of data.courses) {
    if ('id' in c && c.id !== undefined) {
      if (ids.has(c.id)) return false;
      ids.add(c.id);
    }
    if ('code' in c && c.code) {
      const upper = c.code.toUpperCase();
      if (codes.has(upper)) return false;
      codes.add(upper);
    }
  }
  return true;
}, {
  message: 'Terdapat mata kuliah duplikat dalam daftar yang diajukan',
  path: ['courses']
});

export const createEnrollmentSchema = z.preprocess((input: any) => {
  if (input && typeof input === 'object' && input.course && input.enrollment && !input.courses) {
    return {
      student: input.student,
      academic_year: input.enrollment.academic_year,
      semester: input.enrollment.semester,
      status: input.enrollment.status,
      courses: [input.course]
    };
  }
  return input;
}, createEnrollmentBatchSchema);

export const updateEnrollmentSchema = z.object({
  student_name: z.string().trim().min(3).max(100).optional(),
  course_name: z.string().trim().min(3).max(120).optional(),
  academic_year: z.string().trim().regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran harus YYYY/YYYY').optional(),
  semester: z.enum(['GANJIL', 'GENAP']).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional()
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentBatchSchema>;
export type CourseItemInput = z.infer<typeof courseItemSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
