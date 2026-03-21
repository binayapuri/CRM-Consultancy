import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { connectDB } from '../../shared/utils/db.js';

import studentRoutes from './routes.js';
import appointmentsRoutes from '../../routes/appointments.js';
import offerLettersRoutes from '../../routes/offer-letters.js';
import visaTimelineRoutes from '../../routes/visa-timeline.js';

dotenv.config();

const app = express();
const PORT = process.env.STUDENT_API_PORT || 4001;

// Initialize core middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Connect Database
connectDB();

// Health Check
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'student-api', timestamp: new Date().toISOString() }));

// Mount Domain Routes
app.use('/api/student', studentRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/offer-letters', offerLettersRoutes);
app.use('/api/visa-timeline', visaTimelineRoutes);

import { errorHandler } from '../../shared/middleware/errorHandler.js';
app.use(errorHandler);

// Start ECS Service
app.listen(PORT, () => {
  console.log(`✓ Student API running on http://localhost:${PORT}`);
});
