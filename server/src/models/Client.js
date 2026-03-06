import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  institution: String,
  qualification: String,
  fieldOfStudy: String,
  country: String,
  startDate: Date,
  endDate: Date,
  completed: Boolean,
  transcriptUrl: String,
}, { _id: true });

const experienceSchema = new mongoose.Schema({
  employer: String,
  role: String,
  country: String,
  startDate: Date,
  endDate: Date,
  isCurrent: Boolean,
  description: String,
  fullTime: Boolean,
}, { _id: true });

const travelHistorySchema = new mongoose.Schema({
  country: String,
  dateFrom: Date,
  dateTo: Date,
  purpose: { type: String, enum: ['TOURISM', 'STUDY', 'WORK', 'FAMILY', 'TRANSIT', 'OTHER'], default: 'OTHER' },
  visaType: String,
  notes: String,
}, { _id: true });

const familyMemberSchema = new mongoose.Schema({
  relationship: { type: String, enum: ['SPOUSE', 'PARTNER', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'], default: 'OTHER' },
  firstName: String,
  lastName: String,
  dob: Date,
  nationality: String,
  passportNumber: String,
  passportExpiry: Date,
  includedInApplication: Boolean,
  visaStatus: String,
  notes: String,
  travelHistory: [travelHistorySchema],
}, { _id: true });

const clientSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  clientType: { type: String, enum: ['INDIVIDUAL', 'COMPANY'], default: 'INDIVIDUAL' },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }, // For 482, 186, training visas
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    dob: Date,
    gender: String,
    nationality: String,
    countryOfBirth: String,
    maritalStatus: String,
    passportNumber: String,
    passportExpiry: Date,
    passportCountry: String,
    currentVisa: String,
    visaExpiry: Date,
    address: { street: String, city: String, state: String, postcode: String, country: String },
    photoUrl: String,
    signatureUrl: String,
  },
  education: [educationSchema],
  experience: [experienceSchema],
  familyMembers: [familyMemberSchema],
  englishTest: {
    testType: String,
    score: String,
    testDate: Date,
    expiryDate: Date,
  },
  services: [{
    serviceType: String,
    visaSubclass: String,
    status: String,
    startedAt: Date,
    notes: String,
  }],
  visaType: String,
  skillAssessments: [{
    body: String,
    occupation: String,
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REFUSED'], default: 'PENDING' },
    outcome: String,
    requestedAt: Date,
    completedAt: Date,
    referenceNumber: String,
  }],
  immigrationHistory: [{
    type: { type: String, enum: ['RFI', 'S56', 'NATURAL_JUSTICE', 'ADDITIONAL_INFO', 'OTHER'] },
    requestedBy: String,
    requestedAt: Date,
    responseDue: Date,
    completedAt: Date,
    description: String,
    status: { type: String, enum: ['PENDING', 'RESPONDED', 'EXTENDED', 'CLOSED'], default: 'PENDING' },
  }],
  pointsData: {
    age: Number,
    englishScore: String,
    educationLevel: String,
    workExperience: Number,
    partnerPoints: Number,
    totalPoints: Number,
  },
  initialNotes: String,
  notes: [{
    text: String,
    type: { type: String, enum: ['GENERAL', 'DAILY_UPDATE', 'TASK_STATUS', 'COMMUNICATION', 'EXTERNAL_WORK', 'DOCUMENT', 'APPLICATION', 'OTHER'], default: 'GENERAL' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: Date,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editedAt: Date,
    isLegalAdvice: Boolean,
  }],
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  agentDisconnectedAt: Date,
  status: { type: String, enum: ['LEAD', 'ACTIVE', 'ARCHIVED', 'DISCONNECTED'], default: 'ACTIVE' },
  invitationToken: String,
  invitationSentAt: Date,
  invitationAcceptedAt: Date,
  mustChangePassword: { type: Boolean, default: false },
  lastActivityAt: Date,
}, { timestamps: true });

clientSchema.index({ consultancyId: 1, status: 1 });
clientSchema.index({ 'profile.email': 1, consultancyId: 1 });
clientSchema.index({ invitationToken: 1 });

export default mongoose.model('Client', clientSchema);
