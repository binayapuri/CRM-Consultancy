import mongoose from 'mongoose';

const visaTimelineSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStage: { type: String, enum: ['EXPLORING', 'ENGLISH_TEST', 'SKILLS_ASSESSMENT', 'EOI_LODGED', 'INVITED', 'VISA_LODGED', 'GRANTED'], default: 'EXPLORING' },
  targetVisa: String, // e.g., '189', '190', '491', '500'
  milestones: [{
    title: String,
    description: String,
    dateCompleted: Date,
    targetDate: Date,
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'], default: 'PENDING' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' }
  }]
}, { timestamps: true });

export default mongoose.model('VisaTimeline', visaTimelineSchema);
