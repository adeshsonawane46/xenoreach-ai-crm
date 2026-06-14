import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import dataRoutes from './routes/dataRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';

// Load environment variables
dotenv.config();

// Connect Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/data', dataRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Xeno Reach AI Backend Server is running smoothly',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 404 Route Not Found Middleware
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`👉 Access via: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
