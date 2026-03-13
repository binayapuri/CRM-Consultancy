/**
 * Returns the dashboard (or default) path for a given user role.
 * Used for redirecting logged-in users away from auth pages and for landing nav links.
 */
export function getDashboardPathForRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    case 'SPONSOR':
      return '/sponsor/dashboard';
    case 'UNIVERSITY_PARTNER':
    case 'INSURANCE_PARTNER':
    case 'EMPLOYER':
      return '/partner/applications';
    default:
      return '/consultancy/dashboard';
  }
}
