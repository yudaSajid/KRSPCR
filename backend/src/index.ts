import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EnrollmentController } from './controllers/enrollment.controller';
import { pool } from './db/connection';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health Check
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

// API Routes
app.post('/api/enrollments', EnrollmentController.create);
app.get('/api/enrollments', EnrollmentController.list);
app.get('/api/enrollments/export', EnrollmentController.exportCsv);
app.put('/api/enrollments/:id', EnrollmentController.update);
app.delete('/api/enrollments/:id', EnrollmentController.delete);

// Centralized Error Handling Middleware (Sesuai Kebutuhan 5.2)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err);

  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  const message = err.message || 'Terjadi kesalahan internal pada server';

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
