import { pool } from './connection';

export async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Memulai migrasi database PostgreSQL...');

    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    } catch {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id BIGSERIAL PRIMARY KEY,
        nim VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id BIGSERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(120) NOT NULL,
        credits INT NOT NULL CHECK (credits >= 1 AND credits <= 6),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id BIGSERIAL PRIMARY KEY,
        student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
        course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
        academic_year VARCHAR(20) NOT NULL,
        semester VARCHAR(20) NOT NULL CHECK (semester IN ('GANJIL', 'GENAP')),
        status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
        deleted_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollments_student_course_year_sem 
      ON enrollments (student_id, course_id, academic_year, semester) 
      WHERE deleted_at IS NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_enrollments_deleted_at ON enrollments(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year ON enrollments(academic_year) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON enrollments(semester) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_enrollments_comp_sort ON enrollments(academic_year DESC, semester, status, id DESC) WHERE deleted_at IS NULL;
    `);

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_students_nim_trgm ON students USING gin (nim gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_students_name_trgm ON students USING gin (name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_courses_code_trgm ON courses USING gin (code gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_courses_name_trgm ON courses USING gin (name gin_trgm_ops);
      `);
    } catch {}

    console.log('✅ Migrasi database selesai dengan sukses!');
  } catch (error) {
    console.error('❌ Gagal menjalankan migrasi:', error);
    process.exit(1);
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  runMigration();
}
