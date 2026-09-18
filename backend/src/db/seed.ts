import { pool } from './connection';

export async function runSeeder(targetEnrollments = 5000000) {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    console.log(`\n======================================================`);
    console.log(`🌱 Memulai Data Seeder Kinerja Tinggi`);
    console.log(`🎯 Target enrollments: ${targetEnrollments.toLocaleString('id-ID')} baris`);
    console.log(`======================================================\n`);

    // 1. Seed Master Data Students (Minimal 50,000 data mahasiswa realistis)
    console.log('⏳ Mempersiapkan data master students...');
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
    console.log(`✅ Data students siap: ${Number(studentCountRes.rows[0].count).toLocaleString('id-ID')} baris.`);

    // 2. Seed Master Data Courses (500 mata kuliah)
    console.log('⏳ Mempersiapkan data master courses...');
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
    console.log(`✅ Data courses siap: ${Number(courseCountRes.rows[0].count).toLocaleString('id-ID')} baris.`);

    // 3. Seed Enrollments dengan Skala 5.000.000 Baris
    console.log(`⏳ Memulai pengisian ${targetEnrollments.toLocaleString('id-ID')} data enrollments (batching per 500.000 baris)...`);

    const currentEnrollmentRes = await client.query('SELECT COUNT(*) FROM enrollments WHERE deleted_at IS NULL');
    let currentCount = Number(currentEnrollmentRes.rows[0].count);
    console.log(`ℹ️ Data enrollments saat ini: ${currentCount.toLocaleString('id-ID')}`);

    const needed = targetEnrollments - currentCount;
    if (needed <= 0) {
      console.log(`✨ Jumlah data enrollments sudah memenuhi target (${currentCount.toLocaleString('id-ID')} baris). Tidak perlu insert baru.`);
      return;
    }

    const batchSize = 500000;
    const totalBatches = Math.ceil(needed / batchSize);

    // Dapatkan range ID student dan course
    const idRangeRes = await client.query(`
      SELECT 
        MIN(id) as min_student, MAX(id) as max_student,
        (SELECT MIN(id) FROM courses) as min_course,
        (SELECT MAX(id) FROM courses) as max_course
      FROM students;
    `);
    const { min_student, max_student, min_course, max_course } = idRangeRes.rows[0];

    for (let b = 0; b < totalBatches; b++) {
      const currentBatchCount = Math.min(batchSize, needed - (b * batchSize));
      const batchStart = Date.now();

      const offsetMultiplier = b * batchSize;

      await client.query(`
        INSERT INTO enrollments (student_id, course_id, academic_year, semester, status, created_at, updated_at)
        SELECT 
          ${min_student} + (((${offsetMultiplier} + i) * 17) % (${max_student} - ${min_student} + 1)) AS student_id,
          ${min_course} + (((${offsetMultiplier} + i) * 31) % (${max_course} - ${min_course} + 1)) AS course_id,
          (ARRAY['2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026'])[1 + (((${offsetMultiplier} + i) / 50000) % 5)] AS academic_year,
          (ARRAY['GANJIL', 'GENAP'])[1 + (((${offsetMultiplier} + i) / 25000) % 2)] AS semester,
          (ARRAY['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'])[1 + (((${offsetMultiplier} + i) % 4))] AS status,
          NOW() - ((${offsetMultiplier} + i) % 365 || ' days')::interval AS created_at,
          NOW() AS updated_at
        FROM generate_series(1, ${currentBatchCount}) i
        ON CONFLICT (student_id, course_id, academic_year, semester) WHERE deleted_at IS NULL DO NOTHING;
      `);

      const batchDuration = ((Date.now() - batchStart) / 1000).toFixed(2);
      const progress = (((b + 1) / totalBatches) * 100).toFixed(1);
      console.log(`  [Batch ${b + 1}/${totalBatches}] +${currentBatchCount.toLocaleString('id-ID')} data diproses (${batchDuration}s) -> Progres: ${progress}%`);
    }

    const finalCountRes = await client.query('SELECT COUNT(*) FROM enrollments WHERE deleted_at IS NULL');
    const finalCount = Number(finalCountRes.rows[0].count);
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n🎉 SEEDING SELESAI!`);
    console.log(`📊 Total baris enrollments di DB: ${finalCount.toLocaleString('id-ID')}`);
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

// Support CLI parameter: npm run db:seed -- --count=100000
if (require.main === module) {
  let target = 5000000;
  const countArg = process.argv.find(arg => arg.startsWith('--count='));
  if (countArg) {
    const val = parseInt(countArg.split('=')[1], 10);
    if (!isNaN(val) && val > 0) target = val;
  }
  runSeeder(target);
}
