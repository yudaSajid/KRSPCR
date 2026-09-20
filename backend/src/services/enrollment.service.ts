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
  sort?: string; 
  advancedFilter?: string; 
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

  static async createEnrollmentAtomic(input: CreateEnrollmentInput) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

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

      const resolvedCourses: Array<{ id: number | string; code: string; name: string; credits: number }> = [];

      for (const item of input.courses) {
        if ('id' in item && item.id !== undefined) {
          const res = await client.query(
            `SELECT id, code, name, credits FROM courses WHERE id = $1`,
            [item.id]
          );
          if (res.rows.length === 0) {
            const err: any = new Error(`Mata kuliah dengan ID ${item.id} tidak ditemukan`);
            err.statusCode = 400;
            throw err;
          }
          resolvedCourses.push(res.rows[0]);
        } else if ('code' in item && item.code) {
          const res = await client.query(
            `INSERT INTO courses (code, name, credits) 
             VALUES ($1, $2, $3)
             ON CONFLICT (code) DO UPDATE SET 
               name = EXCLUDED.name, 
               credits = EXCLUDED.credits,
               updated_at = NOW()
             RETURNING id, code, name, credits`,
            [item.code.toUpperCase(), item.name, item.credits]
          );
          resolvedCourses.push(res.rows[0]);
        }
      }

      const totalCredits = resolvedCourses.reduce((sum, c) => sum + Number(c.credits), 0);
      if (totalCredits > 24) {
        const err: any = new Error(`Total SKS (${totalCredits} SKS) melebihi batas maksimal 24 SKS per semester.`);
        err.statusCode = 400;
        throw err;
      }

      const courseIds = resolvedCourses.map(c => c.id);
      const uniqueIds = new Set(courseIds);
      if (uniqueIds.size !== courseIds.length) {
        const err: any = new Error('Terdapat mata kuliah duplikat dalam daftar yang diajukan.');
        err.statusCode = 400;
        throw err;
      }

      const conflictRes = await client.query(
        `SELECT c.code, c.name 
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.student_id = $1 
           AND e.course_id = ANY($2::bigint[]) 
           AND e.academic_year = $3 
           AND e.semester = $4 
           AND e.deleted_at IS NULL`,
        [student.id, courseIds, input.academic_year, input.semester]
      );

      if (conflictRes.rows.length > 0) {
        const conflictCourses = conflictRes.rows.map((r: any) => `${r.code} (${r.name})`).join(', ');
        const err: any = new Error(`Mahasiswa sudah mengambil mata kuliah: ${conflictCourses} pada semester ${input.semester} ${input.academic_year}.`);
        err.statusCode = 409;
        throw err;
      }

      const createdEnrollments = [];
      for (const course of resolvedCourses) {
        const enrollmentRes = await client.query(
          `INSERT INTO enrollments (
             student_id, course_id, student_nim, student_name, course_code, course_name,
             academic_year, semester, status
           ) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, student_id, course_id, student_nim, student_name, course_code, course_name, academic_year, semester, status, created_at, updated_at`,
          [student.id, course.id, student.nim, student.name, course.code, course.name, input.academic_year, input.semester, input.status]
        );

        createdEnrollments.push({
          ...enrollmentRes.rows[0],
          credits: course.credits
        });
      }

      await client.query('COMMIT');

      return {
        student,
        academic_year: input.academic_year,
        semester: input.semester,
        status: input.status,
        totalCourses: resolvedCourses.length,
        totalCredits,
        enrollments: createdEnrollments,

        ...(createdEnrollments[0] || {})
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private static buildWhereClause(params: ListQueryParams): { whereClause: string; values: any[] } {
    const conditions: string[] = ['e.deleted_at IS NULL'];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.quickStatus && params.quickStatus.trim() !== '' && params.quickStatus !== 'ALL') {
      conditions.push(`e.status = $${paramIndex++}`);
      values.push(params.quickStatus.trim());
    }

    if (params.quickSemester && params.quickSemester.trim() !== '' && params.quickSemester !== 'ALL') {
      conditions.push(`e.semester = $${paramIndex++}`);
      values.push(params.quickSemester.trim());
    }

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

  static async listEnrollments(params: ListQueryParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    const { whereClause, values } = this.buildWhereClause(params);
    const orderByClause = this.buildOrderByClause(params.sort);

    const client = await pool.connect();
    try {

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        ${whereClause}
      `;
      const countRes = await client.query(countQuery, values);
      const totalItems = Number(countRes.rows[0].total);

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

      if (input.student_name) {
        await client.query(
          `UPDATE students SET name = $1, updated_at = NOW() WHERE id = $2`,
          [input.student_name, student_id]
        );
      }

      if (input.course_name) {
        await client.query(
          `UPDATE courses SET name = $1, updated_at = NOW() WHERE id = $2`,
          [input.course_name, course_id]
        );
      }

      const updates: string[] = ['updated_at = NOW()'];
      const vals: any[] = [];
      let i = 1;

      if (input.student_name) {
        updates.push(`student_name = $${i++}`);
        vals.push(input.student_name);
      }
      if (input.course_name) {
        updates.push(`course_name = $${i++}`);
        vals.push(input.course_name);
      }
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

  static async getCourses(search?: string, limit = 50) {
    const client = await pool.connect();
    try {
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        const res = await client.query(
          `SELECT id, code, name, credits 
           FROM courses 
           WHERE code ILIKE $1 OR name ILIKE $1 
           ORDER BY code ASC 
           LIMIT $2`,
          [term, limit]
        );
        return res.rows;
      } else {
        const res = await client.query(
          `SELECT id, code, name, credits 
           FROM courses 
           ORDER BY code ASC 
           LIMIT $1`,
          [limit]
        );
        return res.rows;
      }
    } finally {
      client.release();
    }
  }

  static async getStudentByNim(nim: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT id, nim, name, email 
         FROM students 
         WHERE nim = $1`,
        [nim.trim()]
      );
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }
}
