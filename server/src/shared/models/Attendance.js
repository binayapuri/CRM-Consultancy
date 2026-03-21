import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  breakMinutes: { type: Number, default: 0 },
  notes: String,
  ipAddress: String,
  location: String,
}, { timestamps: true });

attendanceSchema.index({ consultancyId: 1, date: 1 });
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
