# BIGFEW (formerly ORIVISA) - Australian Migration & Education Platform

A full-stack application bridging **students** and **consultancies** in the Australian migration ecosystem. Built with Node.js, Express, MongoDB, and React.

## Features

### Consultancy CRM (Nexus Pro)
- **Dashboard** – Overview of clients, applications, leads
- **Kanban Board** – Jira-like workflow for visa applications
- **Clients** – Client profiles with PR points
- **Documents** – Document management
- **Leads** – Lead pipeline
- **Daily Tasks** – Task sheet with date tagging
- **Colleges** – Education provider directory
- **OSHC** – Insurance provider partners
- **Trust Ledger** – OMARA-compliant client funds

### Student Portal
- **Profile** – Migration profile and details
- **PR Calculator** – Dynamic points (2025/2026 rules)
- **AI Migration Compass** – Factual info only (Section 276 compliant)
- **Consultancy Search** – Find verified agents
- **Visa Roadmap** – Step-by-step guide

### Super Admin
- Manage consultancies and users

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **State**: Zustand

## Setup (local dev)

```bash
# Install all dependencies
npm run install:all

# Seed database (requires MongoDB running)
cd server && npm run seed

# Run development (backend + frontend)
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000

## Seed Accounts

| Role   | Email              | Password   |
|--------|--------------------|------------|
| Admin  | admin@orivisa.com  | admin123   |
| Agent  | agent@orivisa.com  | agent123   |
| Student| student@orivisa.com| student123 |

## Environment

Create `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/orivisa
JWT_SECRET=your-secret-key
PORT=5000
STUDENT_SMTP_ENC_KEY=replace_with_32+_char_random_secret
```

## Dev deployment (GitHub Actions) and deploy

- Push to the `dev` branch to trigger the **Deploy (dev)** workflow and update the VPS environment.

### Student SMTP (encrypted) — required in production

Student SMTP passwords are stored encrypted (AES-256-GCM). The backend requires a stable encryption key:

- `STUDENT_SMTP_ENC_KEY` (**32+ characters**, keep stable)

Generate a key once:

```bash
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important:** Do not rotate this key after students have saved SMTP passwords, otherwise old passwords can’t be decrypted (students would need to re-save SMTP).

#### Deploy with GitHub Secrets (recommended)

If your deployment workflow builds the server `.env` from a single secret (e.g. `DEV_ENV`), add:

```
STUDENT_SMTP_ENC_KEY=<your generated key>
```

Then re-run the deploy (push to `dev`).

## Data Sovereignty

Designed for Australian deployment. Configure MongoDB and hosting in `ap-southeast-2` (Sydney) for data residency.
# CRM-Consultancy (monorepo root)
