export const STUDENT_UI_PREFS_KEY = 'abroadup-student-ui-prefs';

export type StudentUiPrefs = {
  timezone?: string;
  currencyDisplay?: string;
  compactNav?: boolean;
  reduceMotion?: boolean;
  fontScale?: number;
  /** Display dates as DD/MM/YYYY vs MM/DD/YYYY (app surfaces can use later). */
  dateFormat?: 'DMY' | 'MDY';
  weekStartsOn?: 'monday' | 'sunday';
  /** UI language hint (currently English-only UI). */
  language?: 'en';
  /** Optional: allow anonymised usage analytics in this browser. */
  analyticsOptIn?: boolean;
  /** Stronger contrast for text and borders in the student portal. */
  highContrast?: boolean;
};

export function readStudentUiPrefs(): StudentUiPrefs {
  try {
    const raw = localStorage.getItem(STUDENT_UI_PREFS_KEY);
    return raw ? (JSON.parse(raw) as StudentUiPrefs) : {};
  } catch {
    return {};
  }
}

export function writeStudentUiPrefs(p: StudentUiPrefs) {
  localStorage.setItem(STUDENT_UI_PREFS_KEY, JSON.stringify(p));
  window.dispatchEvent(new Event('student-prefs-updated'));
}
