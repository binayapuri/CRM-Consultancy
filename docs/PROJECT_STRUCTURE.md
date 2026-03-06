# ORIVISA CRM - Project Structure

## Backend (server/)

```
server/
├── src/
│   ├── index.js          # Entry point, Express app
│   ├── launcher.js        # Port cleanup + start
│   ├── constants.js       # Visa types, services
│   ├── middleware/
│   │   └── auth.js        # JWT auth, role checks
│   ├── models/            # Mongoose schemas
│   │   ├── User.js
│   │   ├── Client.js
│   │   ├── Consultancy.js
│   │   ├── Application.js
│   │   ├── Document.js
│   │   ├── Task.js
│   │   ├── Lead.js
│   │   ├── College.js
│   │   ├── OSHC.js
│   │   ├── TrustLedger.js
│   │   ├── AuditLog.js
│   │   └── Notification.js
│   ├── routes/            # API endpoints
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── clients.js
│   │   ├── employees.js
│   │   ├── applications.js
│   │   ├── documents.js
│   │   ├── tasks.js
│   │   ├── leads.js
│   │   ├── colleges.js
│   │   ├── oshc.js
│   │   ├── trust.js
│   │   ├── audit.js
│   │   ├── notifications.js
│   │   ├── invitation.js
│   │   ├── constants.js
│   │   ├── ai.js
│   │   └── rules.js
│   └── utils/
│       └── audit.js       # Audit logging helper
└── package.json
```

## Frontend (client/)

```
client/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── store/
│   │   └── auth.ts        # Zustand auth state
│   ├── layouts/
│   │   ├── ConsultancyLayout.tsx
│   │   ├── StudentLayout.tsx
│   │   └── SuperAdminLayout.tsx
│   ├── components/
│   │   └── Notifications.tsx
│   └── pages/
│       ├── Landing.tsx
│       ├── auth/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   └── Activate.tsx
│       ├── consultancy/
│       │   ├── Dashboard.tsx
│       │   ├── Kanban.tsx
│       │   ├── Clients.tsx
│       │   ├── ClientEnroll.tsx    # Enroll form
│       │   ├── ClientDetail.tsx
│       │   ├── ClientEdit.tsx
│       │   ├── Documents.tsx
│       │   ├── Leads.tsx
│       │   ├── DailyTasks.tsx
│       │   ├── Colleges.tsx
│       │   ├── OSHC.tsx
│       │   ├── TrustLedger.tsx
│       │   ├── Employees.tsx
│       │   ├── TraceHistory.tsx
│       │   └── Profile.tsx
│       ├── student/
│       │   ├── Dashboard.tsx
│       │   ├── Profile.tsx
│       │   ├── PRCalculator.tsx
│       │   ├── MigrationCompass.tsx
│       │   ├── ConsultancySearch.tsx
│       │   └── VisaRoadmap.tsx
│       └── super/
│           ├── Dashboard.tsx
│           ├── Consultancies.tsx
│           └── Users.tsx
└── package.json
```

## API Conventions

- **Auth**: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- **Clients**: `GET/POST /api/clients`, `GET/PATCH/DELETE /api/clients/:id`
- **Enroll**: `POST /api/clients` with full profile payload
- **Employees**: `GET/POST /api/employees`, `PATCH/DELETE /api/employees/:id`
- **Audit**: `GET /api/audit` (admin only)
