/** Shared marketing site navigation — keep top bar short; use “More” for the rest. */

export const MARKETING_ROUTE_LINKS = [
  { to: '/jobs', label: 'Jobs' },
  { to: '/visas', label: 'Visas' },
  { to: '/news', label: 'News' },
] as const;

/** Shown on every screen size (landing + subpages). */
export const LANDING_PRIMARY_ANCHORS = [
  { href: '/#services', label: 'Services' },
  { href: '/#pathways', label: 'PR journey' },
  { href: '/#faq', label: 'FAQ' },
] as const;

/** “More” menu — full landing sections without crowding the bar. */
export const LANDING_MORE_ANCHORS = [
  { href: '/#why', label: 'Why us' },
  { href: '/#everything', label: 'Everything included' },
  { href: '/#how', label: 'How it works' },
  { href: '/#enquiry', label: 'Partners' },
  { href: '/#news', label: 'News on home' },
] as const;

export const PR_TRACKER_REGISTER = '/register?next=/student/pr-map';
