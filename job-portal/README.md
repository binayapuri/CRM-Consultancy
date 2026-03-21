# INSPIRE Job Portal

Standalone job portal module that integrates with the main INSPIRE API.

## Architecture

- **Backend**: Uses main INSPIRE server `/api/jobs` endpoints
- **Frontend**: Separate React app (can run on subdomain or embed in main app)

## API Endpoints (main server)

- `GET /api/jobs` - List jobs (with filters: search, location, type, visaSponsorship)
- `GET /api/jobs/:id` - Job detail
- `POST /api/jobs/:id/apply` - Apply (STUDENT)
- `GET /api/jobs/my-applications` - My applications (STUDENT)
- `GET /api/jobs/saved` - Saved jobs (STUDENT)
- `POST /api/jobs/:id/save` - Save job (STUDENT)
- `DELETE /api/jobs/:id/save` - Unsave job (STUDENT)
- `GET /api/jobs/alerts` - Job alerts (STUDENT)
- `POST /api/jobs/alerts` - Create alert (STUDENT)
- `DELETE /api/jobs/alerts/:id` - Delete alert (STUDENT)
- `GET /api/jobs/employer/dashboard` - Employer dashboard
- Recruiter multi-employer: `/api/jobs/recruiter/employers`

## Integration

1. **Same domain**: Main app `/student/jobs` links to job portal or uses shared components
2. **Subdomain**: Deploy job-portal/frontend at jobs.inspire.com
3. **Auth**: Pass JWT from main app via query param or cookie for SSO

## Setup

```bash
cd job-portal/frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:4000` to point to main INSPIRE backend.
