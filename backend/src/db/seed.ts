import { pool } from './connection';

export async function runSeeder(targetEnrollments = 5000000) {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    console.log(`\n======================================================`);
    console.log(`🌱 Memulai Data Seeder Kinerja Tinggi (TS-01: 5.000.000 Data)`);
    console.log(`🎯 Target enrollments: ${targetEnrollments.toLocaleString('id-ID')} baris`);
    console.log(`======================================================\n`);

    console.log('⏳ Mempersiapkan data master students (50.000 data)...');
    await client.query(`
      INSERT INTO students (nim, name, email)
      SELECT 
        LPAD((10000000 + s)::text, 10, '0') AS nim,
        ('Mahasiswa ' || s) AS name,
        ('mhs' || s || '@kampus.ac.id') AS email
      FROM generate_series(1, 50000) s
      ON CONFLICT (nim) DO NOTHING;
    `);
    const studentCountRes = await client.query('SELECT COUNT(*) FROM students');
    const totalStudents = Number(studentCountRes.rows[0].count);
    console.log(`✅ Data students siap: ${totalStudents.toLocaleString('id-ID')} baris.`);

    console.log('⏳ Mempersiapkan data master courses (500 mata kuliah)...');
    await client.query(`
      INSERT INTO courses (code, name, credits)
      SELECT 
        (ARRAY['IF', 'CS', 'SI', 'TI', 'EL', 'MA', 'FI', 'KU'])[1 + (c % 8)] || LPAD((100 + (c % 900))::text, 3, '0') || LPAD((c / 900)::text, 1, '') AS code,
        ('Mata Kuliah Keilmuan ' || c) AS name,
        (1 + (c % 4)) AS credits
      FROM generate_series(1, 500) c
      ON CONFLICT (code) DO NOTHING;
    `);
    const courseCountRes = await client.query('SELECT COUNT(*) FROM courses');
    const totalCourses = Number(courseCountRes.rows[0].count);
    console.log(`✅ Data courses siap: ${totalCourses.toLocaleString('id-ID')} baris.`);

    console.log('⏳ Mempersiapkan sequence mapping index...');
    await client.query(`
      DROP TABLE IF EXISTS student_seq;
      DROP TABLE IF EXISTS course_seq;

      CREATE TEMP TABLE student_seq (
        seq_id INT PRIMARY KEY, 
        student_id BIGINT, 
        student_nim VARCHAR(20), 
        student_name VARCHAR(100)
      );
      INSERT INTO student_seq (seq_id, student_id, student_nim, student_name)
      SELECT (ROW_NUMBER() OVER (ORDER BY id) - 1)::int, id, nim, name
      FROM students
      LIMIT 50000;

      CREATE TEMP TABLE course_seq (
        seq_id INT PRIMARY KEY, 
        course_id BIGINT, 
        course_code VARCHAR(20), 
        course_name VARCHAR(120)
      );
      INSERT INTO course_seq (seq_id, course_id, course_code, course_name)
      SELECT (ROW_NUMBER() OVER (ORDER BY id) - 1)::int, id, code, name
      FROM courses
      LIMIT 500;
    `);
    console.log(`✅ Sequence mapping index aktif.`);

    const currentEnrollmentRes = await client.query('SELECT COUNT(*) FROM enrollments WHERE deleted_at IS NULL');
    let currentCount = Number(currentEnrollmentRes.rows[0].count);
    console.log(`ℹ️ Data enrollments saat ini di database: ${currentCount.toLocaleString('id-ID')}`);

    const needed = targetEnrollments - currentCount;
    if (needed <= 0) {
      console.log(`✨ Jumlah data enrollments sudah memenuhi target (${currentCount.toLocaleString('id-ID')} baris). Tidak perlu insert baru.`);
      return;
    }

    console.log(`⏳ Memulai pengisian ${needed.toLocaleString('id-ID')} data enrollments (batching per 100.000 baris)...`);

    const batchSize = 100000;
    const totalBatches = Math.ceil(needed / batchSize);

    for (let b = 0; b < totalBatches; b++) {
      const currentBatchCount = Math.min(batchSize, needed - (b * batchSize));
      const batchStart = Date.now();
      const offsetMultiplier = currentCount + (b * batchSize);

      await client.query(`
        INSERT INTO enrollments (
          student_id, course_id, 
          student_nim, student_name, 
          course_code, course_name, 
          academic_year, semester, status, 
          created_at, updated_at
        )
        SELECT 
          s.student_id,
          c.course_id,
          s.student_nim,
          s.student_name,
          c.course_code,
          c.course_name,
          (ARRAY['2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026'])[1 + (term / 2)] AS academic_year,
          (ARRAY['GANJIL', 'GENAP'])[1 + (term % 2)] AS semester,
          (ARRAY['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'])[1 + (x % 4)] AS status,
          NOW() - ((x % 365) || ' days')::interval AS created_at,
          NOW() AS updated_at
        FROM (
          SELECT 
            (${offsetMultiplier} + i - 1) AS x,
            ((${offsetMultiplier} + i - 1) % 50000) AS student_seq_id,
            (((${offsetMultiplier} + i - 1) / 50000) / 10) AS term,
            (
              (
                ((${offsetMultiplier} + i - 1) % 50000) * 37 
                + (((${offsetMultiplier} + i - 1) / 50000) / 10) * 10 
                + (((${offsetMultiplier} + i - 1) / 50000) % 10)
              ) % 500
            ) AS course_seq_id
          FROM generate_series(1, ${currentBatchCount}) i
        ) gen
        JOIN student_seq s ON s.seq_id = gen.student_seq_id
        JOIN course_seq c ON c.seq_id = gen.course_seq_id
        ON CONFLICT (student_id, course_id, academic_year, semester) WHERE deleted_at IS NULL DO NOTHING;
      `);

      const batchDuration = ((Date.now() - batchStart) / 1000).toFixed(2);
      const insertedSoFar = currentCount + (b + 1) * batchSize;
      const progress = (((b + 1) / totalBatches) * 100).toFixed(1);
      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`  [Batch ${b + 1}/${totalBatches}] +${currentBatchCount.toLocaleString('id-ID')} data (${batchDuration}s) -> ${progress}% (${Math.min(insertedSoFar, targetEnrollments).toLocaleString('id-ID')} baris, elapsed: ${elapsedSec}s)`);
    }

    const finalCountRes = await client.query('SELECT COUNT(*) FROM enrollments WHERE deleted_at IS NULL');
    const finalCount = Number(finalCountRes.rows[0].count);
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n🎉 SEEDING SELESAI DENGAN SUKSES!`);
    console.log(`📊 Total baris enrollments aktif di DB: ${finalCount.toLocaleString('id-ID')}`);
    console.log(`⏱️ Waktu total: ${totalDuration} detik\n`);

  } catch (error) {
    console.error('❌ Gagal menjalankan seeder:', error);
    process.exit(1);
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  let target = 5000000;
  const countArg = process.argv.find(arg => arg.startsWith('--count='));
  if (countArg) {
    const val = parseInt(countArg.split('=')[1], 10);
    if (!isNaN(val) && val > 0) target = val;
  }
  runSeeder(target);
}
