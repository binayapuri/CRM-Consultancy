import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { connectDB } from '../../shared/utils/db.js';

import consultancyRoutes from './routes.js';
import clientRoutes from '../../routes/clients.js';
import applicationRoutes from '../../routes/applications.js';

dotenv.config();

const app = express();
const PORT = process.env.CONSULTANCY_API_PORT || 4003;

// Initialize core middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Connect Database
connectDB();

// Health Check
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'consultancy-api', timestamp: new Date().toISOString() }));

// Mount Domain Routes
app.use('/api/consultancies', consultancyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/applications', applicationRoutes);

import { errorHandler } from '../../shared/middleware/errorHandler.js';
app.use(errorHandler);

// Start ECS Service
app.listen(PORT, () => {
  console.log(`✓ Consultancy API running on http://localhost:${PORT}`);
});
