import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import passport from 'passport';
import { configurePassport } from './config/passport.js';
import { authenticate } from './shared/middleware/auth.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import consultancyRoutes from './apps/consultancy/routes.js';
import clientRoutes from './routes/clients.js';
import applicationRoutes from './routes/applications.js';
import documentRoutes from './routes/documents.js';
import taskRoutes from './routes/tasks.js';
import leadRoutes from './routes/leads.js';
import collegeRoutes from './routes/colleges.js';
import oshcRoutes from './routes/oshc.js';
import trustRoutes from './routes/trust.js';
import aiRoutes from './routes/ai.js';
import rulesRoutes from './routes/rules.js';
import employeesRoutes from './routes/employees.js';
import auditRoutes from './routes/audit.js';
import notificationsRoutes from './routes/notifications.js';
import invitationRoutes from './routes/invitation.js';
import constantsRoutes from './routes/constants.js';
import enquiryRoutes from './routes/enquiry.js';
import messagesRoutes from './routes/messages.js';
import sponsorsRoutes from './routes/sponsors.js';
import sponsorSendRoutes from './routes/sponsor-send.js';
import clientSendRoutes from './routes/client-send.js';
import attendanceRoutes from './routes/attendance.js';
import adminRoutes from './apps/admin/routes.js';
import adminNewsRoutes from './apps/admin/news.js';
import universitiesRoutes from './routes/universities.js';
import universityRequestsRoutes from './routes/university-requests.js';
import offerLettersRoutes from './routes/offer-letters.js';
import visaTimelineRoutes from './routes/visa-timeline.js';
import documentTemplatesRoutes from './routes/document-templates.js';
import insuranceRoutes from './routes/insurance.js';
import consultancyBillingRoutes from './routes/consultancy-billing.js';
import consultancyOpsRoutes from './routes/consultancy-ops.js';
import trackingRoutes from './routes/tracking.js';
import { CampaignSchedulerService } from './shared/services/campaign-scheduler.service.js';

import communityRoutes from './routes/community.js';
import newsRoutes from './routes/news.js';
import jobsRoutes from './routes/jobs.js';
import employersRoutes from './routes/employers.js';
import appointmentsRoutes from './routes/appointments.js';
import reviewsRoutes from './routes/reviews.js';
import studentRoutes, { getPointsHandler, savePointsHandler } from './apps/student/routes.js';

dotenv.config();
configurePassport();

// Student-only role check (must run after authenticate)
const studentOnly = (req, res, next) => {
  if (req.user?.role !== 'STUDENT' && req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Student portal only' });
  }
  next();
};
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

// #region agent log — confirm if request reaches backend
app.use((req, res, next) => {
  if (req.path === '/api/student/points' || req.originalUrl?.includes('student/points')) {
    fetch('http://127.0.0.1:7746/ingest/ebf2a8b6-d58b-4377-b39c-003055b4ec8c', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6e5329' }, body: JSON.stringify({ sessionId: '6e5329', location: 'index.js:incoming', message: 'request reached backend', data: { method: req.method, path: req.path, url: req.originalUrl }, timestamp: Date.now(), hypothesisId: 'H0' }) }).catch(() => {});
  }
  next();
});
// #endregion

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orivisa';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
    CampaignSchedulerService.start();
  })
  .catch(err => console.error('MongoDB error:', err));

// API Routes — register /api/student/points explicitly first so PATCH is always matched
app.get('/api/student/points', authenticate, studentOnly, getPointsHandler);
app.patch('/api/student/points', authenticate, studentOnly, savePointsHandler);
app.patch('/api/student/points/', authenticate, studentOnly, savePointsHandler);

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/consultancies', consultancyRoutes);
app.use('/api/clients', clientSendRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/oshc', oshcRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/invitation', invitationRoutes);
app.use('/api/constants', constantsRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/sponsors', sponsorSendRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/news', adminNewsRoutes);
app.use('/api/universities', universitiesRoutes);
app.use('/api/university-requests', universityRequestsRoutes);
app.use('/api/offer-letters', offerLettersRoutes);
app.use('/api/visa-timeline', visaTimelineRoutes);
app.use('/api/document-templates', documentTemplatesRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/consultancy-billing', consultancyBillingRoutes);
app.use('/api/consultancy-ops', consultancyOpsRoutes);
app.use('/api/tracking', trackingRoutes);

app.use('/api/community', communityRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/employers', employersRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/reviews', reviewsRoutes);

import { errorHandler } from './shared/middleware/errorHandler.js';
app.use(errorHandler);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✓ ORIVISA server running on http://localhost:${PORT}`);
});
