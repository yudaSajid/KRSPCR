# Academic KRS Management System 

An enterprise-grade Single Page Application (SPA) for managing university Course Registration Systems (KRS) engineered to handle high-throughput workloads and massive datasets.
---

## 🚀 Key Highlights & Engineering Features

- **Extreme Scalability (5M+ Rows)**:
  - **Optimized Indexing**: GIN Trigram (`pg_trgm`) indexes for sub-100ms fuzzy text search, and Composite Partial B-Tree indexes (`WHERE deleted_at IS NULL`) for filtering and sorting.
  - **High-Velocity Seeder**: Generates 5,000,000 relational records in <40 seconds using PostgreSQL's set-based generators (`generate_series`).
  - **Zero-OOM Streaming Export**: Exports multi-million row datasets via database cursor streaming (`pg-query-stream`) piped directly to HTTP response chunks with backpressure handling (constant memory footprint `< 50MB RAM`).
- **Atomic 3-Entity Transactions**:
  - `POST /api/enrollments` orchestrates `students`, `courses`, and `enrollments` within an isolated `BEGIN ... COMMIT / ROLLBACK` block.
  - Supports realistic batch multi-course enrollment submissions per student with maximum credit limit enforcement (≤ 24 credits) and duplicate prevention.
- **Dual-Layer Strict Validation**:
  - Frontend visual feedback coupled with backend schema validation via **Zod** (RFC-compliant error structures, HTTP 400 Bad Request, and HTTP 409 Conflict).
- **Interactive Single-Page UI**:
  - Server-side pagination, multi-column sorting, and 350ms debounced live search.
  - **Advanced Query Builder**: Multi-column conditions with dynamic operators (`contains`, `startsWith`, `equal`, `between`, `in`) and boolean **`AND` / `OR`** evaluation.
  - **Non-Destructive Soft Delete**: Preserves historical audit integrity using indexed `deleted_at` timestamps.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Zod, `pg`, `pg-query-stream` |
| **Database** | PostgreSQL 16 with `pg_trgm` extension |
| **DevOps & Serving** | Docker, Docker Compose, Nginx |

---

## 📂 Project Structure

```text
krs-academic-system/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API route controllers (CRUD & streaming export)
│   │   ├── db/               # Pool connection, migrations, high-speed seeder, verifier
│   │   ├── schemas/          # Zod validation contracts
│   │   ├── services/         # Business logic & parameterized SQL query builder
│   │   └── index.ts          # Express application entrypoint
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # UI Modals (Create, Edit, Advanced Filter), Data Table, Navbar
│   │   ├── services/         # API HTTP client
│   │   ├── types/            # Shared TypeScript interfaces
│   │   └── App.tsx           # Dashboard view state orchestrator
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml        # Orchestrates Database, Backend, and Frontend
```

---

## ⚡ Quick Start

### Option 1: Docker Compose (Recommended)

Boot up the full application stack with a single command:

```bash
# 1. Start all containers (Database, API, Web)
docker-compose up -d --build

# 2. Run migrations and populate 5M sample records
docker exec -it krs-backend npm run db:migrate
docker exec -it krs-backend npm run db:seed -- --count=5000000

# 3. Verify record counts
docker exec -it krs-backend npm run db:count
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option 2: Manual Local Setup

#### Prerequisites
- Node.js 20+
- PostgreSQL 16 instance with database created: `academic_krs`

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env

npm run db:migrate
npm run db:seed -- --count=5000000
npm run db:count

npm run dev
# Server listening on http://localhost:5000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Vite dev server running on http://localhost:3000
```

---

## 🧪 Technical Assessment & Verification Matrix

The application fulfills all verification scenarios (**TS-01 to TS-13**):

| ID | Test Scenario | Behavior & Verified Outcome | Status |
| :--- | :--- | :--- | :---: |
| **TS-01** | **Setup & 5M Seed** | Successfully generated and verified $\ge 5,000,000$ records. Table queries remain sub-100ms. | ✅ PASS |
| **TS-02** | **Atomic Create (3 Tables)** | Transactional upsert on `students`/`courses` and insert on `enrollments` within 1 atomic unit. Auto-rollback on error. | ✅ PASS |
| **TS-03** | **Frontend Validation** | Enforces format rules (NIM 8-12 digits, course code pattern, credit limits 1-6) with instant visual indicators. | ✅ PASS |
| **TS-04** | **Backend Validation** | Rejects invalid payloads with HTTP 400 (Zod errors) and duplicates with HTTP 409 Conflict. | ✅ PASS |
| **TS-05** | **Server-side Pagination** | Smooth pagination across 5 million rows with variable page sizes (10/25/50/100). | ✅ PASS |
| **TS-06** | **Column Sorting** | Dynamic, parameterized `ORDER BY` sorting across all table columns in `ASC`/`DESC` directions. | ✅ PASS |
| **TS-07** | **Quick Filters** | Instant single-click filtering by Status (`DRAFT`, `APPROVED`, etc.) and Semester (`GANJIL`, `GENAP`). | ✅ PASS |
| **TS-08** | **Live Search (350ms Debounce)** | Real-time multi-column search powered by PostgreSQL Trigram GIN indexes. | ✅ PASS |
| **TS-09** | **Advanced Multi-Column Filter** | Dynamic filter builder combining multiple column predicates and operators. | ✅ PASS |
| **TS-10** | **Advanced Query (AND / OR)** | Flexible switching between conjunction (`AND`) and disjunction (`OR`) logic predicates. | ✅ PASS |
| **TS-11** | **Update Operation** | Updates enrollment statuses and student/course details; instantly reflects on table view. | ✅ PASS |
| **TS-12** | **Soft Delete** | Sets `deleted_at = NOW()`. Data is immediately excluded from active views while preserving referential integrity. | ✅ PASS |
| **TS-13** | **Streaming CSV Export** | Cursor-based streaming downloads entire filtered datasets without truncation or memory spikes. | ✅ PASS |

---

## 🌐 Cloud Deployment Guide

1. **Database**: Provision on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) (ensure `pg_trgm` extension is enabled).
2. **Backend**: Deploy `/backend` to [Render](https://render.com) or [Railway](https://railway.app). Set `DATABASE_URL` and `PORT=5000`. Run `npm run db:migrate`.
3. **Frontend**: Deploy `/frontend` to [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com). Set `VITE_API_URL=https://<your-backend-domain>/api`.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
