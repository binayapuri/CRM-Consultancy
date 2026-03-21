import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { connectDB } from '../../shared/utils/db.js';

import adminRoutes from './routes.js';
import adminNewsRoutes from './news.js';

dotenv.config();

const app = express();
const PORT = process.env.ADMIN_API_PORT || 4002;

// Initialize core middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Connect Database
connectDB();

// Health Check
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'admin-api', timestamp: new Date().toISOString() }));

// Mount Domain Routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/news', adminNewsRoutes);

import { errorHandler } from '../../shared/middleware/errorHandler.js';
app.use(errorHandler);

// Start ECS Service
app.listen(PORT, () => {
  console.log(`✓ Admin API running on http://localhost:${PORT}`);
});
