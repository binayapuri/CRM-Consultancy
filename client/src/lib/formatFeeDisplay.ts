/**
 * Course fees in the database are AUD. Optional display conversion is indicative only.
 * Rates are rough static multipliers from AUD (not live FX).
 */
const AUD_TO: Record<string, number> = {
  AUD: 1,
  USD: 0.65,
  NPR: 88,
  INR: 55,
  NZD: 1.08,
};

const SYMBOL: Record<string, string> = {
  AUD: 'A$',
  USD: 'US$',
  NPR: '₨',
  INR: '₹',
  NZD: 'NZ$',
};

export function effectiveAnnualFeeAud(course: {
  tuitionFee?: number;
  fees?: { amount: number }[];
}): number | null {
  if (course.tuitionFee != null && Number.isFinite(Number(course.tuitionFee))) {
    return Number(course.tuitionFee);
  }
  if (course.fees?.length) {
    const nums = course.fees.map((f) => Number(f.amount)).filter((n) => Number.isFinite(n));
    if (nums.length) return Math.min(...nums);
  }
  return null;
}

export function formatAnnualFeeDisplay(
  course: { tuitionFee?: number; fees?: { amount: number }[] },
  currencyCode: string
): string {
  const aud = effectiveAnnualFeeAud(course);
  if (aud == null) return 'Contact';

  const c = (currencyCode || 'AUD').toUpperCase();
  const mult = AUD_TO[c] ?? 1;
  const sym = SYMBOL[c] || 'A$';
  const onlyBranchFees = course.tuitionFee == null && !!course.fees?.length;

  if (c === 'AUD') {
    const prefix = onlyBranchFees ? 'From ' : '';
    return `${prefix}${sym}${Number(aud).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr`;
  }

  const converted = aud * mult;
  return `≈ ${sym}${Math.round(converted).toLocaleString()}/yr (A$${Number(aud).toLocaleString()}/yr)`;
}
