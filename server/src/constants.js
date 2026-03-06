export const VISA_TYPES = [
  { value: '500', label: 'Student Visa (500)' },
  { value: '485', label: 'Temporary Graduate (485)' },
  { value: '476', label: 'Skilled Recognised Graduate (476)' },
  { value: '189', label: 'Skilled Independent (189)' },
  { value: '190', label: 'Skilled Nominated (190)' },
  { value: '491', label: 'Skilled Work Regional (491)' },
  { value: '482', label: 'Temporary Skill Shortage (482)' },
  { value: '186', label: 'Employer Nominated (186)' },
  { value: '820', label: 'Partner Visa (820)' },
  { value: '801', label: 'Partner Visa (801)' },
  { value: '309', label: 'Partner Visa (309)' },
  { value: '100', label: 'Partner Visa (100)' },
  { value: '600', label: 'Visitor Visa (600)' },
  { value: '417', label: 'Working Holiday (417)' },
  { value: '462', label: 'Work and Holiday (462)' },
  { value: 'OTHER', label: 'Other' },
];

// Australian migration document types & templates (Form 956, etc.)
export const DOCUMENT_TYPES = [
  { value: 'PHOTO', label: 'Client Photo', category: 'Identity', required: false },
  { value: 'CLIENT_SIGNATURE', label: 'Client Signature', category: 'Identity', required: false },
  { value: 'PASSPORT', label: 'Passport', category: 'Identity', required: true },
  { value: 'COE', label: 'Confirmation of Enrolment (CoE)', category: 'Student', required: true },
  { value: 'OSHC', label: 'Overseas Student Health Cover', category: 'Student', required: true },
  { value: 'ENGLISH_TEST', label: 'English Test (IELTS/PTE/TOEFL)', category: 'Evidence', required: true },
  { value: 'GTE_STATEMENT', label: 'GTE / Genuine Student Statement', category: 'Student', required: true },
  { value: 'FINANCIAL_EVIDENCE', label: 'Financial Evidence', category: 'Evidence', required: true },
  { value: 'FORM_956', label: 'Form 956 - Agent Nomination', category: 'Forms', required: true },
  { value: 'FORM_956A', label: 'Form 956A - Authorised Recipient', category: 'Forms', required: false },
  { value: 'FORM_1071', label: 'Form 1071 - Health Declaration', category: 'Forms', required: false },
  { value: 'AFP_POLICE', label: 'AFP Police Check', category: 'Evidence', required: false },
  { value: 'SKILLS_ASSESSMENT', label: 'Skills Assessment', category: 'Skilled', required: false },
  { value: 'COMPLETION_LETTER', label: 'Completion Letter', category: 'Student', required: false },
  { value: 'TRANSCRIPT', label: 'Academic Transcript', category: 'Education', required: false },
  { value: 'WORK_REFERENCE', label: 'Work Experience Letter', category: 'Evidence', required: false },
  { value: 'STATE_NOMINATION', label: 'State Nomination', category: 'Skilled', required: false },
  { value: 'OTHER', label: 'Other Document', category: 'Other', required: false },
];

// Sponsor/employer document types (482, 186, 494, 407)
export const SPONSOR_DOCUMENT_TYPES = [
  { value: 'LMT', label: 'Labour Market Testing (LMT)', category: 'Sponsor', required: true },
  { value: 'GPR', label: 'Genuine Position Report (GPR)', category: 'Sponsor', required: true },
  { value: 'AMSR', label: 'Annual Market Salary Rate (AMSR)', category: 'Sponsor', required: true },
  { value: 'TRAINING_CONTRACT', label: 'Training Contract', category: 'Sponsor', required: false },
  { value: 'EMPLOYMENT_CONTRACT', label: 'Employment Contract', category: 'Sponsor', required: true },
  { value: 'ORG_CHART', label: 'Organizational Chart', category: 'Sponsor', required: true },
  { value: 'JOB_DESCRIPTION', label: 'Job Description', category: 'Sponsor', required: true },
  { value: 'BUSINESS_REGISTRATION', label: 'Business Registration', category: 'Sponsor', required: true },
  { value: 'FINANCIAL_STATEMENTS', label: 'Financial Statements', category: 'Sponsor', required: false },
  { value: 'FORM_956', label: 'Form 956 - Agent Nomination', category: 'Forms', required: true },
  { value: 'MIA_AGREEMENT', label: 'MIA Agreement', category: 'Forms', required: true },
  { value: 'OTHER', label: 'Other', category: 'Other', required: false },
];

// Maps checklist item names (from visa checklists) to document types for upload
export const CHECKLIST_TO_DOC_TYPE = {
  'CoE': 'COE', 'OSHC': 'OSHC', 'Passport': 'PASSPORT', 'English Test': 'ENGLISH_TEST',
  'GTE/GS Statement': 'GTE_STATEMENT', 'Financial Evidence': 'FINANCIAL_EVIDENCE',
  'AFP Police Check': 'AFP_POLICE', 'Skills Assessment': 'SKILLS_ASSESSMENT',
  'Completion Letter': 'COMPLETION_LETTER', 'Points Evidence': 'TRANSCRIPT',
  'State Nomination': 'STATE_NOMINATION', 'Regional Nomination': 'STATE_NOMINATION',
  'EOI': 'OTHER', 'Employment Evidence': 'WORK_REFERENCE', 'Travel Itinerary': 'OTHER',
};

export const DOCUMENT_TEMPLATES = [
  { id: 'form-956', name: 'Form 956 - Appointment of a registered migration agent', description: 'Required when engaging a migration agent. Download from Home Affairs.', url: 'https://immi.homeaffairs.gov.au/form-listing/forms/956.pdf', category: 'Forms' },
  { id: 'form-956a', name: 'Form 956A - Appointment or withdrawal of an authorised recipient', description: 'Appoint someone to receive correspondence on your behalf.', url: 'https://immi.homeaffairs.gov.au/form-listing/forms/956a.pdf', category: 'Forms' },
  { id: 'form-1071', name: 'Form 1071 - Immigration health requirements', description: 'Health declaration for visa applications.', url: 'https://immi.homeaffairs.gov.au/form-listing/forms/1071.pdf', category: 'Forms' },
  { id: 'gte-template', name: 'GTE Statement Template', description: 'Genuine Temporary Entrant / Genuine Student statement guide for Student Visa (500).', url: null, category: 'Templates' },
  { id: 'sop-template', name: 'Statement of Purpose Template', description: 'Template for visa application personal statements.', url: null, category: 'Templates' },
  { id: 'financial-template', name: 'Financial Evidence Checklist', description: 'Checklist for financial evidence requirements.', url: null, category: 'Templates' },
];

// Sample documents for all – MIA Agreement, service agreements, etc. (not personal client docs)
export const SAMPLE_DOCUMENTS = [
  { id: 'mia-agreement', name: 'MIA Migration Agent / Client Agreement', description: 'Standard service agreement template per MARA Code of Conduct. Agent and client details, fees, terms.', url: 'https://www.mara.gov.au/tools-for-registered-agents/practice-guides', category: 'Agreements' },
  { id: 'service-agreement', name: 'Service Agreement Template', description: 'Clear service agreement covering scope, fees, timelines, and Code of Conduct compliance.', url: null, category: 'Agreements' },
  { id: 'form-956', name: 'Form 956 - Agent Nomination', description: 'Required when using a registered migration agent. Download from Home Affairs.', url: 'https://immi.homeaffairs.gov.au/form-listing/forms/956.pdf', category: 'Forms' },
  { id: 'form-956a', name: 'Form 956A - Authorised Recipient', description: 'Appoint someone to receive correspondence on your behalf.', url: 'https://immi.homeaffairs.gov.au/form-listing/forms/956a.pdf', category: 'Forms' },
  { id: 'gte-guide', name: 'GTE / Genuine Student Guide', description: 'Guide for addressing Genuine Temporary Entrant criteria for Student Visa (500).', url: null, category: 'Guides' },
  { id: 'financial-guide', name: 'Financial Evidence Guide', description: 'Checklist and requirements for proving financial capacity.', url: null, category: 'Guides' },
];

// Visa checklists – downloadable per visa type (Australian visas)
export const VISA_CHECKLISTS = {
  '500': { label: 'Student Visa (500)', items: ['CoE', 'OSHC', 'Passport', 'English Test', 'GTE/GS Statement', 'Financial Evidence', 'Form 956'] },
  '485': { label: 'Temporary Graduate (485)', items: ['Passport', 'AFP Police Check', 'English Test', 'Skills Assessment', 'Completion Letter', 'Form 956'] },
  '189': { label: 'Skilled Independent (189)', items: ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'EOI', 'Form 956'] },
  '190': { label: 'Skilled Nominated (190)', items: ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'State Nomination', 'Form 956'] },
  '491': { label: 'Skilled Regional (491)', items: ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'Regional Nomination', 'Form 956'] },
  '482': { label: 'TSS (482)', items: ['Passport', 'Skills Assessment', 'English Test', 'Employment Evidence', 'Form 956'] },
  '186': { label: 'Employer Nominated (186)', items: ['Passport', 'Skills Assessment', 'English Test', 'Employment Evidence', 'Nomination Approval', 'Form 956'] },
  '600': { label: 'Visitor (600)', items: ['Passport', 'Financial Evidence', 'Travel Itinerary', 'Form 956 (if using agent)'] },
  '417': { label: 'Working Holiday (417)', items: ['Passport', 'Financial Evidence', 'Health Insurance', 'Form 956 (if using agent)'] },
  '462': { label: 'Work and Holiday (462)', items: ['Passport', 'Financial Evidence', 'Letter of Support', 'Form 956 (if using agent)'] },
};

// Default email templates (MARA-compliant, research-based)
export const EMAIL_TEMPLATES = {
  form956: {
    subject: 'Form 956 - Appointment of a Registered Migration Agent',
    bodyIntro: `As required by the Department of Home Affairs (Migration Regulations 1994), when engaging a registered migration agent you must complete Form 956 (Appointment of a registered migration agent). This form authorises your appointed representative to receive notices, make submissions, and communicate with the Department on your behalf.

Our registered agent details for the form are provided below. Please download Form 956 from the official Home Affairs website, complete all sections, sign it, and return the signed copy to us.`,
    footer: `For more information, visit: https://immi.homeaffairs.gov.au/form-listing/forms/956.pdf
MARA Consumer Guide: https://www.mara.gov.au/get-help-visa-subsite/FIles/consumer_guide_english.pdf`,
  },
  mia: {
    subject: 'Migration Agent / Client Agreement - Service Agreement',
    bodyIntro: `As required under the MARA Code of Conduct (effective 1 March 2022), we are providing you with our Migration Agent / Client Agreement. This agreement outlines:

• Scope of Services: The visa type and services we will provide
• Professional Warranties: We warrant to provide services with care and skill in accordance with migration law
• Client Responsibilities: Your obligations including providing accurate information and responding to requests
• Fee Structure: Our estimate of fees and charges (provided separately)
• Required Disclosures: Access to MARA Code of Conduct and OMARA Consumer Guide

Please review the agreement, sign it, and return the signed copy. You may also upload it via your client portal.`,
    footer: `MARA Code of Conduct: https://www.mara.gov.au/tools-for-registered-agents/code-of-conduct`,
  },
  initialAdvice: {
    subject: 'Initial Advice & Fee Estimation',
    bodyIntro: `Thank you for your interest in our migration services. In accordance with the MARA Code of Conduct, we provide this written estimate of fees and charges before commencing work.

This estimate is based on the information you have provided. Fees may vary depending on case complexity, additional services required, or changes in your circumstances. Government visa application charges are set by the Department of Home Affairs and may change. We will keep you informed of any variations.

If you have any questions or wish to proceed, please contact us.`,
    defaultFeeBlocks: [
      { label: 'Professional Fees', amount: 'As per quote', description: 'Preparation, lodgment, and representation. Varies by visa type and complexity.' },
      { label: 'Student Visa (500)', amount: 'AUD 710', description: 'Government visa application charge (as at 2025 - subject to change)' },
      { label: 'Temporary Graduate (485)', amount: 'AUD 1,935', description: 'Government visa application charge (as at 2025)' },
      { label: 'Skilled Independent (189)', amount: 'AUD 4,640', description: 'Government visa application charge (as at 2025)' },
      { label: 'Skills Assessment', amount: 'Varies', description: 'ACS, VETASSESS, Engineers Australia etc. - body-specific fees' },
    ],
  },
};

export const SERVICES = [
  { value: 'STUDENT_VISA', label: 'Student Visa Application' },
  { value: 'GRADUATE_VISA', label: 'Graduate Visa (485)' },
  { value: 'SKILLED_MIGRATION', label: 'Skilled Migration (189/190/491)' },
  { value: 'SKILL_ASSESSMENT', label: 'Skills Assessment' },
  { value: 'PARTNER_VISA', label: 'Partner Visa' },
  { value: 'EMPLOYER_SPONSORED', label: 'Employer Sponsored Visa' },
  { value: 'VISITOR_VISA', label: 'Visitor Visa' },
  { value: 'AAT_APPEAL', label: 'AAT Appeal' },
  { value: 'CITIZENSHIP', label: 'Citizenship' },
  { value: 'VISA_RENEWAL', label: 'Visa Renewal' },
  { value: 'CONSULTATION', label: 'Migration Consultation' },
  { value: 'DOCUMENT_PREP', label: 'Document Preparation' },
  { value: 'OTHER', label: 'Other Service' },
];
