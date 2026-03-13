import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The consultant
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }, // Usually startTime + 30 mins
  topic: String,
  notes: String, // Student notes before meeting
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'PENDING' },
  meetingLink: String, // Google Meet / Zoom link
  internalNotes: String // Agent's notes during/after meeting
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
