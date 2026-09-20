import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollment.service';
import { createEnrollmentSchema, updateEnrollmentSchema } from '../schemas/enrollment.schema';

export class EnrollmentController {

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parseResult = createEnrollmentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi form gagal',
          errors: parseResult.error.format()
        });
      }

      const result = await EnrollmentService.createEnrollmentAtomic(parseResult.data);
      const totalCourses = result.totalCourses || 1;
      return res.status(201).json({
        success: true,
        message: `KRS berhasil ditambahkan (${totalCourses} mata kuliah) ke 3 entitas (Students, Courses, Enrollments) dalam 1 transaksi atomik`,
        data: result
      });
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Konflik data unik: Mahasiswa sudah terdaftar pada mata kuliah yang sama di tahun ajaran & semester ini.'
        });
      }
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Pelanggaran relasi data (Foreign Key): ID Mahasiswa atau Mata Kuliah tidak valid.'
        });
      }
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = '1',
        pageSize = '10',
        search,
        quickStatus,
        quickSemester,
        sort,
        advancedFilter
      } = req.query;

      const result = await EnrollmentService.listEnrollments({
        page: Number(page),
        pageSize: Number(pageSize),
        search: search as string,
        quickStatus: quickStatus as string,
        quickSemester: quickSemester as string,
        sort: sort as string,
        advancedFilter: advancedFilter as string
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parseResult = updateEnrollmentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi input gagal',
          errors: parseResult.error.format()
        });
      }

      const updated = await EnrollmentService.updateEnrollment(id, parseResult.data);
      return res.status(200).json({
        success: true,
        message: 'Data KRS berhasil diperbarui',
        data: updated
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await EnrollmentService.deleteEnrollment(id);
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        search,
        quickStatus,
        quickSemester,
        sort,
        advancedFilter
      } = req.query;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="krs_export_${Date.now()}.csv"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Transfer-Encoding', 'chunked');

      res.write('ID,NIM,Nama Mahasiswa,Kode MK,Nama MK,SKS,Semester,Tahun Ajaran,Status,Dibuat Pada\r\n');

      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '';
        const val = String(str).replace(/"/g, '""');
        return `"${val}"`;
      };

      await EnrollmentService.streamExportCsv(
        {
          search: search as string,
          quickStatus: quickStatus as string,
          quickSemester: quickSemester as string,
          sort: sort as string,
          advancedFilter: advancedFilter as string
        },
        (stream, client) => {
          stream.on('data', (row: any) => {
            const line = [
              row.id,
              escapeCsv(row.student_nim),
              escapeCsv(row.student_name),
              escapeCsv(row.course_code),
              escapeCsv(row.course_name),
              row.credits,
              escapeCsv(row.semester),
              escapeCsv(row.academic_year),
              escapeCsv(row.status),
              escapeCsv(row.created_at)
            ].join(',') + '\r\n';

            if (!res.write(line)) {
              stream.pause();
              res.once('drain', () => stream.resume());
            }
          });

          stream.on('end', () => {
            res.end();
            client.release();
          });

          stream.on('error', (err: any) => {
            console.error('Error saat streaming CSV:', err);
            client.release();
            if (!res.headersSent) {
              res.status(500).send('Gagal mengekspor CSV');
            } else {
              res.end();
            }
          });

          req.on('close', () => {
            stream.destroy();
            client.release();
          });
        }
      );
    } catch (error: any) {
      next(error);
    }
  }

  static async listCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, limit } = req.query;
      const courses = await EnrollmentService.getCourses(
        search as string,
        limit ? Number(limit) : 50
      );
      return res.status(200).json({
        success: true,
        data: courses
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getStudentByNim(req: Request, res: Response, next: NextFunction) {
    try {
      const { nim } = req.params;
      const student = await EnrollmentService.getStudentByNim(nim);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Mahasiswa dengan NIM ${nim} tidak ditemukan`
        });
      }
      return res.status(200).json({
        success: true,
        data: student
      });
    } catch (error: any) {
      next(error);
    }
  }
}
