# BIGFEW CRM Phase QA + Release Checklist

Use this checklist before promoting changes from `dev`.

## Cross-Role Smoke Checklist

- Student:
  - Login via email/password, Google OAuth, and phone OTP.
  - Profile CRUD sections save and reload correctly.
  - Invoice manager create/edit/send/download flow works.
  - Jobs browse + apply + status updates visible.
  - Community post, filter, upvote, and create post flow works.
- Consultancy Admin/Manager/Agent:
  - CRM dashboard opens without redirect loops.
  - Client details and documents load without JSON parse errors.
  - University request review actions work.
- Partner Roles:
  - University partner pending account cannot login until approved.
  - Employer and recruiter can access jobs dashboard.
  - Recruiter can create multiple employer profiles and post jobs against each profile.
- Super Admin:
  - University request final approve/reject works and activates/deactivates partner user.
  - Universities CRUD remains functional.
  - User management supports all partner roles.

## Responsive Breakpoint Checklist

- Mobile (`<768px`):
  - Student pages: dashboard, profile, invoices, jobs, community.
  - Consultancy and admin sidebars do not block content.
  - Modals remain scrollable and buttons visible.
- Tablet (`768px-1023px`):
  - Tables and cards wrap correctly.
  - Filters remain accessible.
- Desktop (`>=1024px`):
  - Main workflows render without overflow/overlap.

## API + Security Checklist

- JWT invalid/expired token returns 401 and redirects to login.
- Role mismatch redirects to user dashboard (not landing page loop).
- University onboarding approval changes `User.isActive` correctly.
- Student SMTP settings save + encrypted usage still work.
- No secrets committed to git (`.env`, private keys, credentials).

## Build + Release Checklist

- Run root build:
  - `npm run build`
- Run local dev:
  - `npm run dev`
- Validate critical APIs:
  - `/api/auth/me`
  - `/api/student/profile`
  - `/api/university-requests`
  - `/api/jobs`
  - `/api/community/posts`
- Confirm deployment config still points to HTTPS domain.

