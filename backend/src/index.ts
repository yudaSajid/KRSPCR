import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EnrollmentController } from './controllers/enrollment.controller';
import { pool } from './db/connection';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbCheck = await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: dbCheck.rowCount === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      database: 'error',
      message: error.message
    });
  }
});

app.post('/api/enrollments', EnrollmentController.create);
app.get('/api/enrollments', EnrollmentController.list);
app.get('/api/enrollments/export', EnrollmentController.exportCsv);
app.put('/api/enrollments/:id', EnrollmentController.update);
app.delete('/api/enrollments/:id', EnrollmentController.delete);

app.get('/api/courses', EnrollmentController.listCourses);
app.get('/api/students/:nim', EnrollmentController.getStudentByNim);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err);

  let statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  let message = err.message || 'Terjadi kesalahan internal pada server';

  if (err.code === '23505') {
    statusCode = 409;
    message = 'Konflik data unik: Data dengan nilai unik yang sama sudah terdaftar di sistem.';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Pelanggaran relasi data (Foreign Key): Entitas relasional tidak ditemukan.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`KRS Backend Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

export default app;
