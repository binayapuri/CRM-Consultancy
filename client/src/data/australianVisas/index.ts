export type { AustralianVisaCategory, AustralianVisaRecord } from './types';
export { AUSTRALIAN_VISAS } from './records';

import type { AustralianVisaCategory } from './types';
import { AUSTRALIAN_VISAS } from './records';

export function getVisaBySlug(slug: string | undefined) {
  if (!slug) return undefined;
  return AUSTRALIAN_VISAS.find((v) => v.slug === slug);
}

export function getVisaCategories(): AustralianVisaCategory[] {
  const set = new Set(AUSTRALIAN_VISAS.map((v) => v.category));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function searchVisas(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return AUSTRALIAN_VISAS;
  return AUSTRALIAN_VISAS.filter(
    (v) =>
      v.title.toLowerCase().includes(q) ||
      v.summary.toLowerCase().includes(q) ||
      v.subclasses.some((s) => s.toLowerCase().includes(q)) ||
      v.category.toLowerCase().includes(q)
  );
}
