import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  institution: String,
  qualification: String,
  fieldOfStudy: String,
  country: String,
  cricos: String,  // CRICOS provider code for Australian institutions
  startDate: Date,
  endDate: Date,
  completed: Boolean,
  transcriptUrl: String,
}, { _id: true });

const experienceSchema = new mongoose.Schema({
  employer: String,
  role: String,
  country: String,
  hoursPerWeek: String,
  startDate: Date,
  endDate: Date,
  isCurrent: Boolean,
  description: String,
  fullTime: Boolean,
}, { _id: true });

const skillsDataSchema = new mongoose.Schema({
  assessingBody: String,    // ACS, EA, VETASSESS, AHPRA, etc.
  referenceNumber: String,
  outcome: String,          // 'Suitable' | 'Not Suitable' | 'Closely Related'
  outcomeDate: Date,
  eoiSubmitted: String,     // 'yes' | 'invited' | 'no'
  eoiPoints: Number,
  eoiDate: Date,
  invitationDate: Date,
  stateNomination: String,  // 'applied' | 'granted' | 'declined'
  nominatingState: String,
}, { _id: false });

const healthDataSchema = new mongoose.Schema({
  healthStatus: String,     // 'booked' | 'completed' | 'cleared' | 'waiver'
  hapId: String,            // Health Applicant Portal ID
  healthDate: Date,
  chestXray: String,        // 'yes' | 'no'
  australiaPCC: String,     // 'applied' | 'obtained'
  homePCC: String,
  otherPCC: String,
}, { _id: false });


const travelHistorySchema = new mongoose.Schema({
  country: String,
  city: String,
  dateFrom: Date,
  dateTo: Date,
  purpose: { type: String, enum: ['TOURISM', 'STUDY', 'WORK', 'FAMILY', 'TRANSIT', 'CONFERENCE', 'MEDICAL', 'OTHER'], default: 'OTHER' },
  visaType: String,
  visaGranted: Boolean,
  visaRefused: Boolean,
  refusalReason: String,
  notes: String,
}, { _id: true });

const addressSchema = new mongoose.Schema({
  street: String,
  suburb: String,
  city: String,
  state: String,
  postcode: String,
  country: String,
  from: Date,
  to: Date,
  isCurrent: Boolean,
  type: { type: String, enum: ['HOME', 'RENTAL', 'HOSTEL', 'FAMILY', 'OTHER'], default: 'HOME' },
}, { _id: true });

// Student self-written notes — used to feed AI and provide journalling
const studentNoteSchema = new mongoose.Schema({
  title: String,
  text: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'GENERAL',         // free notes
      'STUDY_PLAN',      // studying / enrolled
      'WORK_LOG',        // work related
      'VISA_UPDATE',     // visa status changes
      'FINANCIAL',       // savings / bank
      'HEALTH',          // health and insurance
      'LEGAL',           // any legal / immigration notes
      'GOAL',            // short/long term goals
      'AI_CONTEXT',      // context specifically for AI assistant
    ],
    default: 'GENERAL',
  },
  isPinned: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: true }, // private = not shared with agent
  templateUsed: String,  // which template was used to generate this note
  aiSuggested: { type: Boolean, default: false },
  tags: [String],
  addedAt: { type: Date, default: Date.now },
  editedAt: Date,
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

const privacyConsentSchema = new mongoose.Schema({
  dataCollection: { type: Boolean, default: false },
  dataSharing: { type: Boolean, default: false },
  marketing: { type: Boolean, default: false },
  consentedAt: Date,
  consentSource: {
    type: String,
    enum: ['FORM', 'EMAIL', 'PORTAL', 'VERBAL', 'OTHER'],
    default: 'PORTAL',
  },
  notes: String,
}, { _id: false });

const retentionSchema = new mongoose.Schema({
  archiveStatus: {
    type: String,
    enum: ['ACTIVE', 'UNDER_REVIEW', 'READY_TO_ARCHIVE', 'ARCHIVED'],
    default: 'ACTIVE',
  },
  archiveEligibleAt: Date,
  archivedAt: Date,
  lastReviewedAt: Date,
  archiveReason: String,
}, { _id: false });

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
    businessName: String,
    abn: String,
    gstRegistered: { type: Boolean, default: false },
    dob: Date,
    gender: String,
    nationality: String,
    countryOfBirth: String,
    maritalStatus: String,
    onshore: { type: Boolean, default: false },
    anzscoCode: String,
    targetVisa: String,
    visaRefusalHistory: { type: String, default: 'no' },
    passportNumber: String,
    passportExpiry: Date,
    passportCountry: String,
    currentVisa: String,
    visaExpiry: Date,
    address: { street: String, suburb: String, city: String, state: String, postcode: String, country: String },
    photoUrl: String,
    signatureUrl: String,
    invoiceSettings: {
      smtp: {
        enabled: { type: Boolean, default: false },
        host: { type: String, default: '' },
        port: { type: Number, default: 587 },
        secure: { type: Boolean, default: false },
        user: { type: String, default: '' },
        passEnc: { type: String, default: '' }, // encrypted
        from: { type: String, default: '' },
      },
      payment: {
        bankName: { type: String, default: '' },
        bsb: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        accountName: { type: String, default: '' },
        payIdType: { type: String, enum: ['EMAIL', 'PHONE', ''], default: '' },
        payId: { type: String, default: '' },
        reference: { type: String, default: '' },
      },
    },
  },
  education: [educationSchema],
  experience: [experienceSchema],
  skillsData: { type: skillsDataSchema, default: () => ({}) },
  healthData: { type: healthDataSchema, default: () => ({}) },
  familyMembers: [familyMemberSchema],
  travelHistory: [travelHistorySchema],              // student's own travel history
  previousAddresses: [addressSchema],                // full address history
  studentNotes: [studentNoteSchema],                 // personal journalling + AI context
  initialStatement: String,                          // "About me" statement for AI context
  englishTest: {
    testType: { type: String, enum: ['IELTS_AC', 'IELTS_GT', 'PTE', 'TOEFL', 'OET', 'CAE', 'PEARSON', 'NAATI', 'NONE'] },
    score: String,           // overall/composite
    listening: String,
    reading: String,
    writing: String,
    speaking: String,
    trf: String,             // IELTS Test Report Form number
    testDate: Date,
    expiryDate: Date,
    testCentre: String,
    attemptNumber: Number,   // 1st, 2nd, 3rd attempt etc.
    plannedRetake: Date,     // if planning to retake
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
    // Legacy fields (kept for consultancy/application views)
    age: Number,
    englishScore: String,
    educationLevel: String,
    workExperience: Number,
    partnerPoints: Number,
    totalPoints: Number,
    // Full calculator snapshot for round-trip load/save (PR Calculator)
    english: String,
    education: String,
    ausWork: String,
    osWork: String,
    partner: String,
    ausStudy: Boolean,
    regionalStudy: Boolean,
    professionalYear: Boolean,
    naati: Boolean,
    stemDoctorate: Boolean,
    savedAt: Date,
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
  privacyConsent: { type: privacyConsentSchema, default: () => ({}) },
  retention: { type: retentionSchema, default: () => ({}) },
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  agentDisconnectedAt: Date,
  status: { type: String, enum: ['LEAD', 'ACTIVE', 'ARCHIVED', 'DISCONNECTED', 'PENDING_ACCESS'], default: 'ACTIVE' },
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
