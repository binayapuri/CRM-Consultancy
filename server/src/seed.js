import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Consultancy from './models/Consultancy.js';
import Client from './models/Client.js';
import Application from './models/Application.js';
import Lead from './models/Lead.js';
import College from './models/College.js';
import OSHC from './models/OSHC.js';
import Task from './models/Task.js';
import AuditLog from './models/AuditLog.js';
import Notification from './models/Notification.js';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/orivisa');
  await User.deleteMany({});
  await Consultancy.deleteMany({});
  await AuditLog.deleteMany({});
  await Notification.deleteMany({});
  await Client.deleteMany({});
  await Application.deleteMany({});
  await Lead.deleteMany({});
  await College.deleteMany({});
  await OSHC.deleteMany({});
  await Task.deleteMany({});

  const superAdmin = await User.create({
    email: 'admin@orivisa.com',
    password: 'admin123',
    role: 'SUPER_ADMIN',
    profile: { firstName: 'Super', lastName: 'Admin' },
  });

  const consultancy = await Consultancy.create({
    name: 'ORIVISA Migration',
    displayName: 'ORIVISA Migration',
    abn: '12 345 678 901',
    address: { street: '123 Collins St', city: 'Melbourne', state: 'VIC', postcode: '3000' },
    phone: '+61 3 9999 0000',
    email: 'info@orivisa.com',
    specializations: ['Student Visa', '485', 'PR', 'Skilled Migration'],
    languages: ['English', 'Hindi', 'Mandarin'],
    verified: true,
    marnNumbers: ['1234567'],
    form956Details: {
      agentName: 'Sarah Chen',
      marnNumber: '1234567',
      companyName: 'ORIVISA Migration',
      address: '123 Collins St, Melbourne VIC 3000',
      phone: '+61 3 9999 0000',
      email: 'info@orivisa.com',
    },
    miaAgreementDetails: {
      agentName: 'Sarah Chen',
      marnNumber: '1234567',
    },
    bankDetails: {
      accountName: 'ORIVISA Migration Trust Account',
      bank: 'Westpac',
      bsb: '033 001',
      accountNumber: '12345678',
    },
    rolePermissions: [
      { role: 'CONSULTANCY_ADMIN', permissions: { clients: { view: true, create: true, edit: true, delete: true }, applications: { view: true, create: true, edit: true, delete: true }, tasks: { view: true, create: true, edit: true, delete: true }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: true }, documents: { view: true, upload: true, delete: true }, trustLedger: { view: true, edit: true }, employees: { view: true, manage: true }, traceHistory: { view: true }, settings: { view: true, edit: true }, colleges: { view: true, manage: true }, oshc: { view: true, manage: true }, sponsors: { view: true, create: true, edit: true, delete: true }, sendDocuments: true, sendAdvice: true } },
      { role: 'MANAGER', permissions: { clients: { view: true, create: true, edit: true, delete: true }, applications: { view: true, create: true, edit: true, delete: true }, tasks: { view: true, create: true, edit: true, delete: true }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: true }, documents: { view: true, upload: true, delete: true }, trustLedger: { view: true, edit: true }, employees: { view: true, manage: true }, traceHistory: { view: true }, settings: { view: true, edit: true }, colleges: { view: true, manage: true }, oshc: { view: true, manage: true }, sponsors: { view: true, create: true, edit: true, delete: true }, sendDocuments: true, sendAdvice: true } },
      { role: 'AGENT', permissions: { clients: { view: true, create: true, edit: true, delete: false }, applications: { view: true, create: true, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, employees: { view: true, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: true, edit: true, delete: false }, sendDocuments: true, sendAdvice: true } },
      { role: 'SUPPORT', permissions: { clients: { view: true, create: false, edit: true, delete: false }, applications: { view: true, create: false, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, employees: { view: false, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: false, edit: true, delete: false }, sendDocuments: true, sendAdvice: false } },
    ],
    initialAdviceTemplate: {
      subject: 'Initial Advice & Fee Estimation',
      body: `Thank you for your interest in our migration services. In accordance with the MARA Code of Conduct, we provide this written estimate of fees and charges before commencing work.

This estimate is based on the information you have provided. Fees may vary depending on case complexity, additional services required, or changes in your circumstances. Government visa application charges are set by the Department of Home Affairs and may change. We will keep you informed of any variations.

If you have any questions or wish to proceed, please contact us.`,
      feeBlocks: [
        { label: 'Professional Fees', amount: 'As per quote', description: 'Preparation, lodgment, and representation. Varies by visa type and complexity.' },
        { label: 'Student Visa (500)', amount: 'AUD 710', description: 'Government visa application charge (as at 2025 - subject to change)' },
        { label: 'Temporary Graduate (485)', amount: 'AUD 1,935', description: 'Government visa application charge (as at 2025)' },
        { label: 'Skilled Independent (189)', amount: 'AUD 4,640', description: 'Government visa application charge (as at 2025)' },
        { label: 'Skills Assessment', amount: 'Varies', description: 'ACS, VETASSESS, Engineers Australia etc. - body-specific fees' },
      ],
    },
  });

  const consultancyAdmin = await User.create({
    email: 'consultancy@orivisa.com',
    password: 'admin123',
    role: 'CONSULTANCY_ADMIN',
    profile: { firstName: 'Consultancy', lastName: 'Admin', consultancyId: consultancy._id },
  });

  const agent = await User.create({
    email: 'agent@orivisa.com',
    password: 'agent123',
    role: 'AGENT',
    profile: { firstName: 'Sarah', lastName: 'Chen', marnNumber: '1234567', consultancyId: consultancy._id },
  });

  const student = await User.create({
    email: 'student@orivisa.com',
    password: 'student123',
    role: 'STUDENT',
    profile: { firstName: 'Raj', lastName: 'Kumar' },
  });

  const client = await Client.create({
    consultancyId: consultancy._id,
    userId: student._id,
    assignedAgentId: agent._id,
    profile: {
      firstName: 'Raj',
      lastName: 'Kumar',
      email: 'student@orivisa.com',
      phone: '+61 400 111 222',
      dob: new Date('1995-03-15'),
      gender: 'Male',
      nationality: 'India',
      countryOfBirth: 'India',
      maritalStatus: 'Single',
      passportNumber: 'K1234567',
      passportExpiry: new Date('2030-12-31'),
      passportCountry: 'India',
      currentVisa: '500',
      visaExpiry: new Date('2026-03-15'),
      address: { street: '45 Elizabeth St', city: 'Melbourne', state: 'VIC', postcode: '3000', country: 'Australia' },
    },
    education: [
      { institution: 'University of Melbourne', qualification: 'Master of IT', fieldOfStudy: 'Information Systems', country: 'Australia', startDate: new Date('2023-02-01'), endDate: new Date('2024-11-30'), completed: true },
      { institution: 'Anna University', qualification: 'Bachelor of Engineering', fieldOfStudy: 'Computer Science', country: 'India', startDate: new Date('2012-07-01'), endDate: new Date('2016-05-30'), completed: true },
    ],
    experience: [
      { employer: 'Tech Solutions Pty Ltd', role: 'Software Developer', country: 'Australia', startDate: new Date('2024-01-15'), endDate: null, isCurrent: true, description: 'Full-stack development', fullTime: true },
      { employer: 'Infosys', role: 'Junior Developer', country: 'India', startDate: new Date('2016-07-01'), endDate: new Date('2022-06-30'), isCurrent: false, description: 'Backend development', fullTime: true },
    ],
    englishTest: { testType: 'IELTS', score: '7.0', testDate: new Date('2022-08-15'), expiryDate: new Date('2025-08-15') },
    visaType: 'Skilled Migration (189/190/491)',
    services: [{ serviceType: 'SKILLED_MIGRATION', visaSubclass: '485', status: 'IN_PROGRESS', startedAt: new Date('2024-11-01'), notes: 'Graduate visa pathway to PR' }],
    skillAssessments: [
      { body: 'ACS', occupation: 'Software Engineer', status: 'COMPLETED', outcome: 'Positive', requestedAt: new Date('2024-10-01'), completedAt: new Date('2024-11-15'), referenceNumber: 'ACS-2024-12345' },
      { body: 'VETASSESS', occupation: 'ICT Business Analyst', status: 'PENDING', requestedAt: new Date('2025-01-10') },
    ],
    immigrationHistory: [
      { type: 'RFI', requestedBy: 'Department of Home Affairs', requestedAt: new Date('2024-12-01'), responseDue: new Date('2025-01-15'), status: 'RESPONDED', completedAt: new Date('2024-12-20'), description: 'Request for additional evidence - AFP police check' },
      { type: 'S56', requestedBy: 'Department of Home Affairs', requestedAt: new Date('2025-01-10'), responseDue: new Date('2025-02-28'), status: 'PENDING', description: 'Request for health examination' },
    ],
    pointsData: { age: 29, englishScore: 'IELTS_7', totalPoints: 75 },
    status: 'ACTIVE',
    lastActivityAt: new Date(),
  });

  await Application.create([
    { clientId: client._id, consultancyId: consultancy._id, agentId: agent._id, visaSubclass: '500', status: 'LODGED', documentChecklist: [{ name: 'CoE', required: true, uploaded: true }, { name: 'OSHC', required: true, uploaded: true }] },
    { clientId: client._id, consultancyId: consultancy._id, agentId: agent._id, visaSubclass: '485', status: 'DRAFTING', documentChecklist: [{ name: 'AFP', required: true, uploaded: false }] },
  ]);

  await Lead.create([
    { consultancyId: consultancy._id, status: 'NEW', profile: { firstName: 'Amit', lastName: 'Sharma', email: 'amit@email.com', interest: 'Student Visa' }, assignedTo: agent._id },
    { consultancyId: consultancy._id, status: 'CONTACTED', profile: { firstName: 'Wei', lastName: 'Li', email: 'wei@email.com', interest: 'PR' }, assignedTo: agent._id },
  ]);

  await College.create([
    { name: 'University of Melbourne', cricosCode: '00116K', type: 'UNIVERSITY', location: { city: 'Melbourne', state: 'VIC' } },
    { name: 'Monash University', cricosCode: '00008C', type: 'UNIVERSITY', location: { city: 'Melbourne', state: 'VIC' } },
    { name: 'TAFE NSW', cricosCode: '00591E', type: 'TAFE', location: { city: 'Sydney', state: 'NSW' } },
  ]);

  await OSHC.create([
    { provider: 'Allianz', planName: 'Standard', coverageType: 'SINGLE', pricePerMonth: 55 },
    { provider: 'BUPA', planName: 'Essential', coverageType: 'SINGLE', pricePerMonth: 52 },
    { provider: 'Medibank', planName: 'Overseas Student', coverageType: 'SINGLE', pricePerMonth: 58 },
  ]);

  await Task.create({
    consultancyId: consultancy._id,
    applicationId: (await Application.findOne())._id,
    clientId: client._id,
    title: 'Request AFP Police Check',
    type: 'DOCUMENT_REQUEST',
    status: 'PENDING',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    assignedTo: agent._id,
    dailyTaskDate: new Date(),
  });

  console.log('✓ Seed complete');
  console.log('  Super Admin: admin@orivisa.com / admin123');
  console.log('  Consultancy Admin: consultancy@orivisa.com / admin123');
  console.log('  Agent: agent@orivisa.com / agent123');
  console.log('  Student: student@orivisa.com / student123');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
