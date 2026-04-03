/** Australian visa reference content — general information only; not legal advice. */

export type AustralianVisaCategory =
  | 'Visitor & transit'
  | 'Working Holiday'
  | 'Study & training'
  | 'Graduate & post-study'
  | 'Temporary work & activity'
  | 'Employer sponsored'
  | 'Skilled migration'
  | 'Regional pathways'
  | 'Business & innovation'
  | 'Family & partner'
  | 'Parent & child'
  | 'Bridging & status'
  | 'Residency & return'
  | 'Humanitarian & protection'
  | 'Other';

export type AustralianVisaRecord = {
  slug: string;
  /** Primary subclass numbers as strings, e.g. "500" or "820/801" */
  subclasses: string[];
  title: string;
  category: AustralianVisaCategory;
  /** One-line intro */
  summary: string;
  /** Department of Home Affairs visa listing or hub URL */
  officialUrl: string;
  /** Plain-language audience */
  whoItsFor: string;
  /** Typical criteria applicants must meet (overview) */
  keyRequirements: string[];
  /** Step-style preparation checklist (not exhaustive) */
  checklist: { step: string; note?: string }[];
  /** Documents often requested (varies by case) */
  commonDocuments: string[];
  /** Conditions, caveats, or policy notes */
  conditionsNotes: string[];
  /** Optional practical tips */
  processingTips?: string[];
  relatedSlugs?: string[];
};
