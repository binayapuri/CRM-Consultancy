import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();

// Get user appointments (student or agent)
router.get('/', authenticate, async (req, res) => {
  try {
    const query = req.user.role === 'STUDENT' ? { studentId: req.user.id } : { agentId: req.user.id };
    const appointments = await Appointment.find(query)
      .populate('studentId', 'profile.firstName profile.lastName')
      .populate('agentId', 'profile.firstName profile.lastName avatar')
      .populate('consultancyId', 'name displayName logo');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book an appointment (Student)
router.post('/', authenticate, async (req, res) => {
  try {
    // Basic valid booking block, checks for overlaps could go here
    const { agentId, consultancyId, startTime, topic, notes } = req.body;
    const end = new Date(startTime);
    end.setMinutes(end.getMinutes() + 30); // 30 min duration

    const appointment = new Appointment({
      studentId: req.user.id,
      agentId,
      consultancyId,
      startTime,
      endTime: end,
      topic,
      notes,
      meetingLink: 'https://meet.google.com/new' // mock link
    });
    
    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
