import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy' },
  name: { type: String, required: true },
  cricosCode: String,
  type: { type: String, enum: ['UNIVERSITY', 'TAFE', 'VET', 'ELICOS', 'OTHER'], default: 'VET' },
  location: {
    city: String,
    state: String,
    address: String,
    postcode: String,
    campus: String,
  },
  website: String,
  phone: String,
  email: String,
  contactPerson: {
    name: String,
    role: String,
    email: String,
    phone: String,
  },
  courses: [{
    name: { type: String, required: true },
    code: String,
    duration: String,
    feeMin: Number,
    feeMax: Number,
    feePerYear: Number,
    intakeDates: [Date],
    fieldOfStudy: String,
    level: { type: String, enum: ['CERTIFICATE', 'DIPLOMA', 'BACHELOR', 'MASTER', 'PHD', 'ELICOS', 'OTHER'] },
  }],
  partnershipStatus: { type: String, enum: ['ACTIVE', 'PENDING', 'INACTIVE'], default: 'PENDING' },
  consultancyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy' }],
}, { timestamps: true });

collegeSchema.index({ consultancyId: 1 });
collegeSchema.index({ 'location.state': 1, 'location.city': 1 });
collegeSchema.index({ type: 1 });
collegeSchema.index({ name: 'text', cricosCode: 'text' });

export default mongoose.model('College', collegeSchema);
