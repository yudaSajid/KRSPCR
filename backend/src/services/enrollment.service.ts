import { pool } from '../db/connection';
import QueryStream from 'pg-query-stream';
import { CreateEnrollmentInput, UpdateEnrollmentInput } from '../schemas/enrollment.schema';

export interface FilterCondition {
  column: string;
  operator: 'contains' | 'startsWith' | 'equal' | 'between' | 'in';
  value: any;
}

export interface AdvancedFilterPayload {
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  quickStatus?: string;
  quickSemester?: string;
  sort?: string; // format: col1:asc,col2:desc
  advancedFilter?: string; // JSON string of AdvancedFilterPayload
}

const COLUMN_MAP: Record<string, string> = {
  id: 'e.id',
  student_nim: 's.nim',
  student_name: 's.name',
  course_code: 'c.code',
  course_name: 'c.name',
  credits: 'c.credits',
  semester: 'e.semester',
  academic_year: 'e.academic_year',
  status: 'e.status',
  created_at: 'e.created_at'
};

export class EnrollmentService {
  /**
   * Transaksi atomik insert ke 3 tabel: students, courses, enrollments
   */
  static async createEnrollmentAtomic(input: CreateEnrollmentInput) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Upsert / Insert student
      const studentRes = await client.query(
        `INSERT INTO students (nim, name, email) 
         VALUES ($1, $2, $3)
         ON CONFLICT (nim) DO UPDATE SET 
           name = EXCLUDED.name, 
           email = EXCLUDED.email,
           updated_at = NOW()
         RETURNING id, nim, name, email`,
        [input.student.nim, input.student.name, input.student.email]
      );
      const student = studentRes.rows[0];

      // 2. Upsert / Insert course
      const courseRes = await client.query(
        `INSERT INTO courses (code, name, credits) 
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET 
           name = EXCLUDED.name, 
           credits = EXCLUDED.credits,
           updated_at = NOW()
         RETURNING id, code, name, credits`,
        [input.course.code, input.course.name, input.course.credits]
      );
      const course = courseRes.rows[0];

      // 3. Validasi Unique constraint pada enrollments aktif
      const duplicateCheck = await client.query(
        `SELECT id FROM enrollments 
         WHERE student_id = $1 AND course_id = $2 AND academic_year = $3 AND semester = $4 AND deleted_at IS NULL`,
        [student.id, course.id, input.enrollment.academic_year, input.enrollment.semester]
      );

      if (duplicateCheck.rows.length > 0) {
        const error: any = new Error('Mahasiswa dengan NIM tersebut sudah mengambil mata kuliah ini pada tahun ajaran dan semester yang sama.');
        error.statusCode = 409;
        throw error;
      }

      // 4. Insert enrollment
      const enrollmentRes = await client.query(
        `INSERT INTO enrollments (student_id, course_id, academic_year, semester, status) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, student_id, course_id, academic_year, semester, status, created_at, updated_at`,
        [student.id, course.id, input.enrollment.academic_year, input.enrollment.semester, input.enrollment.status]
      );

      await client.query('COMMIT');

      return {
        ...enrollmentRes.rows[0],
        student_nim: student.nim,
        student_name: student.name,
        course_code: course.code,
        course_name: course.name,
        credits: course.credits
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Helper untuk menyusun query WHERE clause dan parameters
   */
  private static buildWhereClause(params: ListQueryParams): { whereClause: string; values: any[] } {
    const conditions: string[] = ['e.deleted_at IS NULL'];
    const values: any[] = [];
    let paramIndex = 1;

    // Quick Filter Status
    if (params.quickStatus && params.quickStatus.trim() !== '' && params.quickStatus !== 'ALL') {
      conditions.push(`e.status = $${paramIndex++}`);
      values.push(params.quickStatus.trim());
    }

    // Quick Filter Semester
    if (params.quickSemester && params.quickSemester.trim() !== '' && params.quickSemester !== 'ALL') {
      conditions.push(`e.semester = $${paramIndex++}`);
      values.push(params.quickSemester.trim());
    }

    // Live Search pada 3 kolom utama (NIM, Nama Mahasiswa, Kode MK)
    if (params.search && params.search.trim() !== '') {
      const searchTerm = `%${params.search.trim()}%`;
      conditions.push(`(
        s.nim ILIKE $${paramIndex} OR 
        s.name ILIKE $${paramIndex} OR 
        c.code ILIKE $${paramIndex}
      )`);
      values.push(searchTerm);
      paramIndex++;
    }

    // Advanced Filter (mendukung multi filter & logika AND / OR)
    if (params.advancedFilter) {
      try {
        const parsed: AdvancedFilterPayload = JSON.parse(params.advancedFilter);
        if (parsed.conditions && parsed.conditions.length > 0) {
          const filterClauses: string[] = [];

          for (const cond of parsed.conditions) {
            const dbCol = COLUMN_MAP[cond.column];
            if (!dbCol || cond.value === undefined || cond.value === null || cond.value === '') continue;

            if (cond.operator === 'contains') {
              filterClauses.push(`${dbCol} ILIKE $${paramIndex++}`);
              values.push(`%${cond.value}%`);
            } else if (cond.operator === 'startsWith') {
              filterClauses.push(`${dbCol} ILIKE $${paramIndex++}`);
              values.push(`${cond.value}%`);
            } else if (cond.operator === 'equal') {
              filterClauses.push(`${dbCol} = $${paramIndex++}`);
              values.push(cond.value);
            } else if (cond.operator === 'between' && Array.isArray(cond.value) && cond.value.length === 2) {
              filterClauses.push(`(${dbCol} >= $${paramIndex++} AND ${dbCol} <= $${paramIndex++})`);
              values.push(cond.value[0], cond.value[1]);
            } else if (cond.operator === 'in' && Array.isArray(cond.value) && cond.value.length > 0) {
              filterClauses.push(`${dbCol} = ANY($${paramIndex++})`);
              values.push(cond.value);
            }
          }

          if (filterClauses.length > 0) {
            const joinLogic = parsed.logic === 'OR' ? ' OR ' : ' AND ';
            conditions.push(`(${filterClauses.join(joinLogic)})`);
          }
        }
      } catch (err) {
        console.warn('Invalid advanced filter payload', err);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
  }

  /**
   * Helper untuk menyusun ORDER BY clause (multi column sorting)
   */
  private static buildOrderByClause(sortParam?: string): string {
    if (!sortParam || sortParam.trim() === '') {
      return 'ORDER BY e.id DESC';
    }

    const sortClauses: string[] = [];
    const parts = sortParam.split(',');

    for (const part of parts) {
      const [col, dir] = part.split(':');
      const dbCol = COLUMN_MAP[col?.trim()];
      if (dbCol) {
        const direction = dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        sortClauses.push(`${dbCol} ${direction}`);
      }
    }

    if (sortClauses.length === 0) {
      return 'ORDER BY e.id DESC';
    }

    return `ORDER BY ${sortClauses.join(', ')}`;
  }

  /**
   * List data dengan server-side pagination, sorting, search, dan multi filter
   */
  static async listEnrollments(params: ListQueryParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    const { whereClause, values } = this.buildWhereClause(params);
    const orderByClause = this.buildOrderByClause(params.sort);

    const client = await pool.connect();
    try {
      // 1. Query total record (count)
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        ${whereClause}
      `;
      const countRes = await client.query(countQuery, values);
      const totalItems = Number(countRes.rows[0].total);

      // 2. Query paginated data
      const dataQuery = `
        SELECT 
          e.id,
          s.nim AS student_nim,
          s.name AS student_name,
          s.email AS student_email,
          c.code AS course_code,
          c.name AS course_name,
          c.credits,
          e.semester,
          e.academic_year,
          e.status,
          e.created_at,
          e.updated_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        ${whereClause}
        ${orderByClause}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;
      const dataRes = await client.query(dataQuery, [...values, pageSize, offset]);

      return {
        data: dataRes.rows,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize)
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update data enrollment dan relasi
   */
  static async updateEnrollment(id: string | number, input: UpdateEnrollmentInput) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingRes = await client.query(
        `SELECT e.id, e.student_id, e.course_id 
         FROM enrollments e 
         WHERE e.id = $1 AND e.deleted_at IS NULL`,
        [id]
      );

      if (existingRes.rows.length === 0) {
        const err: any = new Error('Data enrollment tidak ditemukan atau sudah dihapus');
        err.statusCode = 404;
        throw err;
      }

      const { student_id, course_id } = existingRes.rows[0];

      // Update student jika ada perubahan
      if (input.student_name) {
        await client.query(
          `UPDATE students SET name = $1, updated_at = NOW() WHERE id = $2`,
          [input.student_name, student_id]
        );
      }

      // Update course jika ada perubahan
      if (input.course_name) {
        await client.query(
          `UPDATE courses SET name = $1, updated_at = NOW() WHERE id = $2`,
          [input.course_name, course_id]
        );
      }

      // Update enrollment fields
      const updates: string[] = ['updated_at = NOW()'];
      const vals: any[] = [];
      let i = 1;

      if (input.academic_year) {
        updates.push(`academic_year = $${i++}`);
        vals.push(input.academic_year);
      }
      if (input.semester) {
        updates.push(`semester = $${i++}`);
        vals.push(input.semester);
      }
      if (input.status) {
        updates.push(`status = $${i++}`);
        vals.push(input.status);
      }

      vals.push(id);
      await client.query(
        `UPDATE enrollments SET ${updates.join(', ')} WHERE id = $${i}`,
        vals
      );

      await client.query('COMMIT');

      // Ambil data terbaru
      const updatedRes = await client.query(
        `SELECT 
          e.id, s.nim AS student_nim, s.name AS student_name, s.email AS student_email,
          c.code AS course_code, c.name AS course_name, c.credits,
          e.semester, e.academic_year, e.status, e.created_at, e.updated_at
         FROM enrollments e
         JOIN students s ON e.student_id = s.id
         JOIN courses c ON e.course_id = c.id
         WHERE e.id = $1`,
        [id]
      );

      return updatedRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete enrollment
   */
  static async deleteEnrollment(id: string | number) {
    const result = await pool.query(
      `UPDATE enrollments SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      const err: any = new Error('Data enrollment tidak ditemukan atau sudah dihapus');
      err.statusCode = 404;
      throw err;
    }

    return { success: true, message: 'Data enrollment berhasil dihapus (soft delete)' };
  }

  /**
   * Streaming Cursor untuk Export CSV jutaan baris data tanpa OOM
   */
  static async streamExportCsv(params: ListQueryParams, onData: (stream: QueryStream, client: any) => void) {
    const { whereClause, values } = this.buildWhereClause(params);
    const orderByClause = this.buildOrderByClause(params.sort);

    const exportQuery = `
      SELECT 
        e.id,
        s.nim AS student_nim,
        s.name AS student_name,
        c.code AS course_code,
        c.name AS course_name,
        c.credits,
        e.semester,
        e.academic_year,
        e.status,
        TO_CHAR(e.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN courses c ON e.course_id = c.id
      ${whereClause}
      ${orderByClause}
    `;

    const client = await pool.connect();
    const query = new QueryStream(exportQuery, values, { batchSize: 2000 });
    const stream = client.query(query);

    onData(stream, client);
  }
}
