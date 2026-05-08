# AfCEN Asset Recycling Platform — Build Guide

**Version:** 1.0
**Last updated:** 2026-05-08
**Stack:** Next.js 15 + React 19 + Prisma 6 + PostgreSQL 16 + shadcn/ui + Tailwind v4

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start (Local Development)](#2-quick-start-local-development)
3. [Environment Variables](#3-environment-variables)
4. [Database Setup](#4-database-setup)
5. [Running the Dev Server](#5-running-the-dev-server)
6. [Project Structure](#6-project-structure)
7. [Architecture](#7-architecture)
8. [Scoring Engine](#8-scoring-engine)
9. [LLM Adapter (Sovereignty Architecture)](#9-llm-adapter-sovereignty-architecture)
10. [Document Extraction (Python Sidecar)](#10-document-extraction-python-sidecar)
11. [IC Brief Generation & Export](#11-ic-brief-generation--export)
12. [Docker Compose (Full Stack)](#12-docker-compose-full-stack)
13. [Deployment to Vercel](#13-deployment-to-vercel)
14. [Seed Data](#14-seed-data)
15. [API Reference](#15-api-reference)
16. [Brand & Design System](#16-brand--design-system)
17. [Agent Architecture (Next Phase)](#17-agent-architecture-next-phase)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18+ (recommended 20+) | Runtime |
| npm | 9+ | Package manager |
| PostgreSQL | 16 | Database |
| Python | 3.11+ | Document extraction sidecar (optional for dev) |
| Docker + Docker Compose | Latest | Full-stack local deployment (optional) |
| Git | Latest | Version control |

**Optional for AI features:**
- Anthropic API key (for Claude-based AI scoring in dev mode)
- Ollama (for sovereign/production AI scoring)

---

## 2. Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/Denohatma/afcen-platform.git
cd afcen-platform

# 2. Install dependencies (also runs prisma generate via postinstall)
npm install

# 3. Set up environment variables
cp .env.example .env   # or create .env manually (see Section 3)

# 4. Create the database
createdb afcen          # or via psql: CREATE DATABASE afcen;

# 5. Push the schema to the database
npx prisma db push

# 6. Seed with 4 reference assets
npx tsx prisma/seed.ts

# 7. Start the dev server
npm run dev
```

Open http://localhost:3000 to see the pipeline dashboard.

---

## 3. Environment Variables

Create a `.env` file in the project root:

```env
# === REQUIRED ===
DATABASE_URL="postgresql://your_user@localhost:5432/afcen"

# === LLM ADAPTER ===
# Options: "dev" (Claude API), "production" (Ollama), "sovereign-cloud" (vLLM — TBI)
AFCEN_DEPLOYMENT="dev"

# Required when AFCEN_DEPLOYMENT=dev
ANTHROPIC_API_KEY="sk-ant-api03-..."

# Required when AFCEN_DEPLOYMENT=production
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"    # optional, defaults to llama3.1:8b

# === PYTHON SIDECAR (optional for dev) ===
PYTHON_SIDECAR_URL="http://localhost:8000"
```

**For Vercel production:** Set `DATABASE_URL` to your Neon PostgreSQL connection string in the Vercel dashboard under Settings > Environment Variables.

---

## 4. Database Setup

### Local PostgreSQL

```bash
# Create the database
createdb afcen

# Push Prisma schema (creates tables without migrations)
npx prisma db push

# Seed with reference assets
npx tsx prisma/seed.ts

# Open Prisma Studio to inspect data
npx prisma studio
```

### Neon PostgreSQL (Production)

1. Create a project at https://neon.tech
2. Copy the connection string
3. Set `DATABASE_URL` in Vercel environment variables
4. Push schema: `DATABASE_URL="your_neon_url" npx prisma db push`
5. Seed: `DATABASE_URL="your_neon_url" npx tsx prisma/seed.ts`

### Schema Overview

```
Asset (1) ──→ (N) DimensionScore    [6 dimensions, unique per asset+dimension]
Asset (1) ──→ (N) Document          [uploaded files with extracted text]
Asset (1) ──→ (N) ICBrief           [versioned IC briefs]
Asset (1) ──→ (N) PathToGoAction    [recommended actions to improve score]
```

**Key enums:**
- `Sector`: POWER_HYDRO, POWER_SOLAR, POWER_THERMAL, POWER_TRANSMISSION, TRANSPORT_ROAD, TRANSPORT_RAIL, TRANSPORT_BRIDGE, TRANSPORT_PORT, MIDSTREAM_GAS, ICT_DATACENTER
- `Dimension`: REVENUE_MATURITY, DEBT_COMPLEXITY, CONCESSION_READINESS, DATA_AVAILABILITY, REGULATORY_ENVIRONMENT, MODERNISATION_RISK
- `AssetStatus`: OPERATIONAL, OPERATIONAL_BELOW_CAPACITY, MOTHBALLED, UNDER_REFURB

---

## 5. Running the Dev Server

```bash
npm run dev        # Starts Next.js with Turbopack on http://localhost:3000
```

### NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --turbopack` | Development server with HMR |
| `build` | `next build` | Production build (webpack) |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint |
| `postinstall` | `prisma generate` | Auto-generates Prisma client |

---

## 6. Project Structure

```
afcen-platform/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout (Montserrat + Lato fonts)
│   ├── globals.css                 # Tailwind v4 + AfCEN brand colors
│   ├── (dashboard)/                # Route group for dashboard pages
│   │   ├── layout.tsx              # Header with AfCEN logo + nav
│   │   ├── page.tsx                # Pipeline dashboard (asset list + chart)
│   │   └── assets/
│   │       ├── new/page.tsx        # 3-step new asset wizard
│   │       └── [id]/
│   │           ├── page.tsx        # Asset detail (scores, docs, comparables)
│   │           └── brief/page.tsx  # IC Brief viewer + generate
│   └── api/                        # API route handlers
│       ├── assets/                 # CRUD + scoring + documents + briefs
│       ├── comparables/            # Comparable asset lookup
│       └── extract/                # Python sidecar health probe
│
├── components/                     # React components
│   ├── AssetCard.tsx               # Pipeline card with composite score
│   ├── Scorecard.tsx               # 6-dimension scorecard (client component)
│   ├── InteractiveDimensionScore   # Inline edit + AI rescore dialog
│   ├── CompositeChart.tsx          # Horizontal bar chart with thresholds
│   ├── CompositeBadge.tsx          # Score badge (GO/CONDITIONAL/NO-GO colors)
│   ├── SignalBadge.tsx             # GO / CONDITIONAL / NO-GO label
│   ├── PathToGo.tsx                # Recommended actions list
│   ├── ComparablesPanel.tsx        # Side-by-side comparable assets
│   ├── DocumentUploader.tsx        # Drag & drop file upload
│   ├── DocumentsSection.tsx        # Document list with extraction status
│   ├── ICBriefPDF.tsx              # React-PDF document for server-side PDF
│   ├── ICBriefView.tsx             # Markdown brief viewer
│   └── ui/                         # shadcn/ui primitives
│
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── utils.ts                    # cn() utility (clsx + tailwind-merge)
│   ├── llm/                        # Sovereignty architecture
│   │   ├── adapter.ts              # getLLMAdapter() dispatcher
│   │   ├── claude.ts               # ClaudeAdapter (Anthropic SDK)
│   │   ├── ollama.ts               # OllamaAdapter (local inference)
│   │   └── prompts.ts              # System/user prompts for all LLM tasks
│   ├── scoring/                    # Deterministic scoring engine
│   │   ├── engine.ts               # computeComposite() weighted average
│   │   ├── weights.ts              # Dimension weights (sum to 1.0)
│   │   ├── thresholds.ts           # GO >= 7.0, CONDITIONAL >= 5.5
│   │   ├── rubrics.ts              # Score rubrics per dimension
│   │   └── labels.ts               # Human-readable labels + country flags
│   └── brief/
│       ├── generator.ts            # generateICBrief() — LLM call + DB save
│       └── template.md             # IC brief template structure
│
├── prisma/
│   ├── schema.prisma               # Data model (5 models, 7 enums)
│   ├── seed.ts                     # 4 seed assets with scores + actions
│   └── migrations/                 # Migration history
│
├── python-sidecar/                 # Document extraction service
│   ├── main.py                     # FastAPI app (/health, /extract)
│   ├── requirements.txt            # fastapi, uvicorn, unstructured
│   └── Dockerfile                  # Python 3.11 + system deps
│
├── docs/
│   ├── BUILD_GUIDE.md              # This file
│   └── agent-architecture.md       # 3-tier agent spec (26 agents)
│
├── public/                         # Static assets
│   ├── logo-icon.svg               # AfCEN globe icon
│   ├── logo-full.svg               # AfCEN full logo with text
│   └── *.png                       # PWA icons + favicons
│
├── docker-compose.yml              # Full stack: db + sidecar + ollama + app
├── Dockerfile                      # Multi-stage Next.js standalone build
├── next.config.ts                  # serverExternalPackages: @react-pdf/renderer
├── components.json                 # shadcn configuration
├── tsconfig.json                   # TypeScript config (path alias: @/* → ./*)
└── package.json                    # Dependencies and scripts
```

---

## 7. Architecture

### Data Flow

```
User → Next.js App Router → API Routes → Prisma → PostgreSQL
                                ↓
                          LLM Adapter → Claude (dev) / Ollama (prod)
                                ↓
                     Python Sidecar → unstructured (doc extraction)
```

### Key Design Decisions

1. **Server components by default.** Dashboard pages are server components that query Prisma directly. Interactive features (scorecard editing, file upload) are client components.

2. **Deterministic scoring.** The scoring engine (`lib/scoring/engine.ts`) is a pure weighted average — no LLM in the scoring path. AI only *suggests* scores; a human accepts or edits.

3. **Sovereignty architecture.** The LLM adapter (`lib/llm/adapter.ts`) dispatches to Claude in dev, Ollama in production. Sensitive data never leaves AfCEN-controlled infrastructure in production.

4. **Route groups.** The `(dashboard)` route group provides a shared layout (header + nav) without affecting the URL structure.

---

## 8. Scoring Engine

### Dimensions and Weights

| Dimension | Weight | Description |
|---|---|---|
| REVENUE_MATURITY | 0.20 | PPA quality, tariff stability, cash flow history |
| CONCESSION_READINESS | 0.20 | Legal framework, precedent, government alignment |
| DEBT_COMPLEXITY | 0.15 | Existing lender consent, structural flexibility |
| DATA_AVAILABILITY | 0.15 | Technical reports, financials, operational data |
| REGULATORY_ENVIRONMENT | 0.15 | Regulator independence, tariff regime |
| MODERNISATION_RISK | 0.15 | Refurbishment scope, cost, technical complexity |

### Signal Thresholds

| Signal | Composite Score | Meaning |
|---|---|---|
| **GO** | >= 7.0 | Deal-ready for IC concept stage |
| **CONDITIONAL** | >= 5.5 | Viable with identified remediation |
| **NO-GO** | < 5.5 | Not currently viable; defer or restructure |

### Scoring Flow

```
1. Analyst manually scores each dimension (1-10) with rationale
2. OR: AI suggests a score from uploaded documents (human reviews)
3. computeComposite() applies weights → composite score
4. signal() maps composite → GO / CONDITIONAL / NO-GO
5. Path-to-GO actions auto-linked to dimensions for improvement
```

---

## 9. LLM Adapter (Sovereignty Architecture)

The LLM adapter pattern ensures data sovereignty:

```typescript
// lib/llm/adapter.ts
getLLMAdapter() → ClaudeAdapter | OllamaAdapter | vLLMAdapter

// Dispatches based on AFCEN_DEPLOYMENT env var:
//   "dev"             → Claude API (fast, accurate, external)
//   "production"      → Ollama (local, sovereign, open-weight)
//   "sovereign-cloud" → vLLM on AfCEN infra (TBI)
```

### Adapter Interface

Both adapters implement:
- `complete(request)` — text completion
- `extractStructured(request, schema)` — JSON extraction with Zod validation

### AI Features

| Feature | Endpoint | Description |
|---|---|---|
| AI Scoring | `POST /api/assets/[id]/score-with-ai` | Scores one dimension from uploaded docs |
| IC Brief Generation | `POST /api/assets/[id]/brief` | Generates full IC concept-stage brief |

---

## 10. Document Extraction (Python Sidecar)

The Python sidecar handles document parsing — text extraction from PDF, DOCX, XLSX, TXT, CSV.

### Running Locally

```bash
cd python-sidecar
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/extract` | Extract text from uploaded file (multipart/form-data) |

### Supported Formats
- PDF (via `unstructured` + poppler + tesseract OCR)
- DOCX (via `unstructured`)
- XLSX (via `unstructured`)
- TXT, CSV (plain text decode)

**Note:** The sidecar is optional for development. Document upload works without it — files are stored but text extraction is skipped.

---

## 11. IC Brief Generation & Export

### Generation Flow

1. User clicks "Generate IC Brief" on asset detail page
2. `POST /api/assets/[id]/brief` calls `generateICBrief()`
3. LLM adapter produces markdown content following the template
4. Brief saved to `ICBrief` table with version number
5. Brief displayed in the viewer with markdown rendering

### Export Formats

| Format | Endpoint | Library |
|---|---|---|
| PDF | `GET /api/assets/[id]/brief/[version]/pdf` | `@react-pdf/renderer` (server-side) |
| DOCX | `GET /api/assets/[id]/brief/[version]/docx` | `docx` package |

### Brief Structure

1. Investment Overview
2. Strategic Rationale
3. AfCEN Scorecard Summary
4. Path to GO
5. Comparable Transactions
6. Risks & Conditions Precedent
7. Recommendation

---

## 12. Docker Compose (Full Stack)

Run the entire platform locally with Docker:

```bash
docker compose up --build
```

### Services

| Service | Image | Port | Description |
|---|---|---|---|
| `db` | `postgres:16-alpine` | 5432 | PostgreSQL (user: afcen, pass: afcen_dev) |
| `sidecar` | `./python-sidecar` | 8000 | Document extraction (health-checked) |
| `ollama` | `ollama/ollama:latest` | 11434 | Local LLM inference |
| `app` | `.` (Dockerfile) | 3000 | Next.js application |

### First Run with Docker

```bash
# Start all services
docker compose up -d

# Wait for db to be healthy, then push schema
docker compose exec app npx prisma db push

# Seed the database
docker compose exec app npx tsx prisma/seed.ts

# Pull the Ollama model (run once)
docker compose exec ollama ollama pull llama3.1:8b
```

### Dockerfile (Multi-Stage Build)

```
Stage 1: deps       — install node_modules
Stage 2: builder    — next build (standalone output)
Stage 3: runner     — minimal Node.js image with standalone build
```

---

## 13. Deployment to Vercel

### Initial Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link to project
vercel link

# Set environment variables
vercel env add DATABASE_URL        # Neon PostgreSQL connection string
vercel env add AFCEN_DEPLOYMENT    # "dev" for now (Claude-based AI)
vercel env add ANTHROPIC_API_KEY   # Required if AFCEN_DEPLOYMENT=dev
```

### Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Key Configuration

- `next.config.ts` includes `serverExternalPackages: ["@react-pdf/renderer"]` for PDF generation in serverless
- `package.json` includes `"postinstall": "prisma generate"` so Prisma client is generated during Vercel build
- Prisma uses `prisma-client-js` provider (generates to `node_modules/@prisma/client` which Vercel traces automatically)
- Dashboard page uses `export const dynamic = "force-dynamic"` to prevent build-time Prisma queries

### Current Production

- **URL:** https://afcen-platform.vercel.app
- **Database:** Neon PostgreSQL
- **GitHub:** https://github.com/Denohatma/afcen-platform

---

## 14. Seed Data

The seed script (`prisma/seed.ts`) creates 4 reference assets representing different pipeline stages:

| Asset | Country | Sector | Category | Composite | Signal |
|---|---|---|---|---|---|
| Dodo HPP (Goma) | Sierra Leone | Hydro (6 MW) | Stranded Brownfield | 4.40 | NO-GO |
| Bumbuna 1 HPP | Sierra Leone | Hydro (50 MW) | Underperforming Brownfield | 5.55 | CONDITIONAL |
| Bujagali HPP | Uganda | Hydro (250 MW) | Operational IPP Refinancing | 8.10 | GO |
| Senegambia Bridge | The Gambia | Bridge (942m) | Operational Public for Concession | 7.25 | GO |

Each asset includes dimension scores with rationales, confidence levels, and Path-to-GO actions.

```bash
# Run the seed (clears existing data first)
npx tsx prisma/seed.ts
```

---

## 15. API Reference

### Assets

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assets` | List all assets with scores |
| POST | `/api/assets` | Create new asset (Zod-validated) |
| GET | `/api/assets/[id]` | Get asset with scores, docs, briefs |

### Scoring

| Method | Endpoint | Description |
|---|---|---|
| PUT | `/api/assets/[id]/scores` | Update a dimension score |
| POST | `/api/assets/[id]/score-with-ai` | AI-suggest a score for one dimension |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assets/[id]/documents` | List documents for asset |
| POST | `/api/assets/[id]/documents` | Upload document + extract text |

### IC Briefs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/assets/[id]/brief` | Generate new IC brief (increments version) |
| GET | `/api/assets/[id]/brief/[version]/pdf` | Download brief as PDF |
| GET | `/api/assets/[id]/brief/[version]/docx` | Download brief as DOCX |

### Comparables

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/comparables/[id]` | Find comparable assets (same sector first) |

---

## 16. Brand & Design System

### Colors (AfCEN Palette)

| Color | Hex | Usage |
|---|---|---|
| AfCEN Green | #228B22 | Primary, GO signals, buttons, links |
| AfCEN Blue | #00BFFF | Info panels, strategic context callouts |
| AfCEN Orange | #FF7F50 | CONDITIONAL signals, warnings |
| Red | (Tailwind default) | NO-GO signals, errors, destructive actions |

Custom color tokens are defined in `globals.css` under `@theme inline`:
- `afcen-green-50` through `afcen-green-800`
- `afcen-blue-50` through `afcen-blue-800`
- `afcen-orange-50` through `afcen-orange-800`

### Fonts

| Role | Font | Source |
|---|---|---|
| Headings | Montserrat (400–800) | Google Fonts |
| Body | Lato (400, 700) | Google Fonts |

### Logo

- Icon: `public/logo-icon.svg` (animated globe with green gradient arcs)
- Full: `public/logo-full.svg` (icon + "AfCEN" text + subtitle)

### Component Library

Built with shadcn/ui (style: `base-nova`). Available components:
`alert`, `badge`, `button`, `card`, `dialog`, `progress`, `select`, `slider`, `table`, `tabs`

---

## 17. Agent Architecture (Next Phase)

The platform is designed to support a 3-tier agent architecture for automated pre-feasibility studies. See `docs/agent-architecture.md` for the full specification.

### Summary

| Tier | Count | Role |
|---|---|---|
| Tier 1 — Domain Specialists | 14 | Extract and structure domain data (hydrology, financial, regulatory, etc.) |
| Tier 2 — Synthesis | 9 | Build pre-feasibility sections (scoring, capital stack, returns, risk register) |
| Tier 3 — Orchestration | 3 | Coordinate, validate, maintain provenance |

### Key Principle

> **LLM extracts, rules engine scores.** No agent generates scores or financial outputs via LLM. Those come from deterministic rules engines reading structured features that LLM agents produce.

### Build Sequence

- **Sprint 1:** Orchestrator + 6 core Tier 1 agents + Scoring Engine + Executive Summary
- **Sprint 2:** Remaining Tier 1 agents + Capital Stack + Returns Modeller
- **Sprint 3:** Remaining Tier 2 agents + Validator + output rendering
- **Sprint 4:** Cross-asset extension + comparables automation + user UI

---

## 18. Troubleshooting

### Prisma Issues

**"Cannot find module '@prisma/client'"**
```bash
npx prisma generate
```

**"Database does not exist"**
```bash
createdb afcen
npx prisma db push
```

**"Unique constraint failed on DimensionScore"**
Each asset can only have one score per dimension. Use `PUT /api/assets/[id]/scores` to update.

### Vercel Build Failures

**"PrismaClientInitializationError: Unable to require `libquery_engine`"**
Ensure `package.json` has `"postinstall": "prisma generate"` and the generator uses `prisma-client-js` provider (not `prisma-client`).

**"Error: Dynamic server usage" during build**
Add `export const dynamic = "force-dynamic"` to any page that queries Prisma.

### PDF Generation

**"Module not found: @react-pdf/renderer"**
Ensure `next.config.ts` has:
```typescript
serverExternalPackages: ["@react-pdf/renderer"]
```

### Document Upload

**"Extraction failed" or sidecar unreachable**
The Python sidecar is optional in dev. Documents will be stored but text won't be extracted. Start the sidecar:
```bash
cd python-sidecar && pip install -r requirements.txt && uvicorn main:app --port 8000
```

### LLM / AI Features

**"ANTHROPIC_API_KEY not set"**
Required when `AFCEN_DEPLOYMENT=dev`. Set it in `.env`.

**"Ollama connection refused"**
Start Ollama: `ollama serve` and pull the model: `ollama pull llama3.1:8b`.
