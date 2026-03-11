import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import passport from 'passport';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import consultancyRoutes from './routes/consultancies.js';
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

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orivisa';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// API Routes
app.use('/api/auth', authRoutes);
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
