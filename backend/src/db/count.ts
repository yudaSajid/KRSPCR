import { pool } from './connection';

async function checkCounts() {
  const client = await pool.connect();
  try {
    console.log('\n🔍 Memeriksa Jumlah Baris Data (Database Verification TS-01)...\n');

    const studentCount = await client.query('SELECT COUNT(*) as count FROM students');
    const courseCount = await client.query('SELECT COUNT(*) as count FROM courses');
    const enrollmentActiveCount = await client.query('SELECT COUNT(*) as count FROM enrollments WHERE deleted_at IS NULL');
    const enrollmentSoftDeletedCount = await client.query('SELECT COUNT(*) as count FROM enrollments WHERE deleted_at IS NOT NULL');
    const enrollmentTotalCount = await client.query('SELECT COUNT(*) as count FROM enrollments');

    console.table([
      { Tabel: 'students (Mahasiswa)', 'Jumlah Baris': Number(studentCount.rows[0].count).toLocaleString('id-ID') },
      { Tabel: 'courses (Mata Kuliah)', 'Jumlah Baris': Number(courseCount.rows[0].count).toLocaleString('id-ID') },
      { Tabel: 'enrollments (Aktif)', 'Jumlah Baris': Number(enrollmentActiveCount.rows[0].count).toLocaleString('id-ID') },
      { Tabel: 'enrollments (Soft Deleted)', 'Jumlah Baris': Number(enrollmentSoftDeletedCount.rows[0].count).toLocaleString('id-ID') },
      { Tabel: 'enrollments (Total Keseluruhan)', 'Jumlah Baris': Number(enrollmentTotalCount.rows[0].count).toLocaleString('id-ID') }
    ]);

    const activeNum = Number(enrollmentActiveCount.rows[0].count);
    if (activeNum >= 5000000) {
      console.log(`\n🎉 TARGET TERPENUHI: Data enrollments aktif berjumlah ${activeNum.toLocaleString('id-ID')} baris (>= 5.000.000).`);
    } else {
      console.log(`\nℹ️ Data enrollments aktif saat ini: ${activeNum.toLocaleString('id-ID')} baris.`);
    }

  } catch (error) {
    console.error('❌ Gagal memeriksa jumlah data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCounts();
