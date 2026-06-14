# Reachly - AI-native Mini CRM (Backend)

Reachly is an agentic campaign copilot for e-commerce marketers. A marketer states a goal in plain English (for example, "win back lapsed shoppers who spent more than 10000") and Reachly plans the campaign end to end: it translates the goal into an audience segment, previews who will be reached, drafts channel-aware message variants, and - after human approval - dispatches through a stubbed channel service that simulates real-world delivery (async, out-of-order, retries, failures). A live funnel tracks sent -> delivered -> read -> clicked -> converted.

This repo contains the CRM API plus a separate stubbed channel service (in channel-service/).

## Why this scope
The brief allowed any one meaningful problem. I chose marketing campaign delivery + insights because it exercises the hardest part of the assignment: a realistic asynchronous delivery loop with ordering, retries, idempotency, and failure handling - not a CRUD app.

## Architecture

​
flowchart LR
M["Marketer"] --> API["CRM API"]
API -->|enqueue one job per recipient| Q["BullMQ / Redis"]
Q --> W["Dispatch Worker"]
W -->|POST /send| CH["Channel Service (stub)"]
CH -->|async delivery callbacks| R["CRM /api/receipts"]
R --> DB[("Postgres")]
API --> DB

Two services, one async callback loop:
1. The CRM API launches a campaign and enqueues one job per recipient (BullMQ + Redis).
2. The dispatch worker consumes jobs and calls the Channel Service /send.
3. The Channel Service returns 202 immediately, then asynchronously simulates the message lifecycle (queued -> sent -> delivered -> read -> clicked -> converted, or failed with retries) and calls back into the CRM /api/receipts.
4. The CRM receipt handler applies each event through an idempotent, forward-only state machine and updates analytics.

The CRM never talks to a real provider; the channel is fully swappable.

## Tech stack
- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- BullMQ + Redis (job queue / dispatch)
- Google Gemini (goal -> segment rules, message drafting, insights) with deterministic fallbacks
- Vitest (rule engine + delivery state machine tests)

## Data model
Customer, Order, Segment, Campaign, Communication, CommunicationEvent. See prisma/schema.prisma.

## Key API endpoints
- POST /api/ingest, /api/customers, /api/orders - data ingestion
- POST /api/segments/preview - rule -> audience count + sample
- POST /api/ai/segment - natural language -> validated segment rule
- POST /api/agent/run - full agentic plan (segment -> preview -> draft -> optional launch)
- POST /api/campaigns and POST /api/campaigns/:id/launch
- POST /api/receipts - channel delivery callbacks (idempotent)
- GET /api/analytics/overview, /api/analytics/insights, /api/analytics/campaigns/:id
- GET /health

## Local development
Prerequisites: Docker Desktop, Node 20+.

1. Start infra: docker compose up -d (Postgres on 5433, Redis on 6380)
2. Create .env (see the table below)
3. npm install
4. npm run prisma:migrate
5. npm run seed (about 200 customers and ~750 orders)
6. In three terminals: npm run dev (API :4000), npm run channel (:4100), npm run worker

## Environment variables
| Key | Required | Example | Notes |
| --- | --- | --- | --- |
| NODE_ENV | no | development | |
| PORT | no | 4000 | Render injects this in production |
| DATABASE_URL | yes | postgresql://... | Postgres connection string |
| REDIS_URL | yes | redis://... | BullMQ broker |
| GEMINI_API_KEY | no | ... | Falls back to deterministic logic if absent |
| GEMINI_MODEL | no | gemini-2.0-flash-lite | |
| CHANNEL_SERVICE_URL | prod | https://reachly-channel.onrender.com | CRM -> channel |
| PUBLIC_BASE_URL | prod | https://reachly-crm-api.onrender.com | Used to build the callback URL sent to the channel |

## Deployment (Render)
This repo includes render.yaml, a Blueprint that provisions Postgres, Redis, the CRM API (with the dispatch worker co-located), and the channel service.

1. Push to GitHub, then in Render: New -> Blueprint -> select this repo.
2. Provide the secret GEMINI_API_KEY when prompted.
3. After the services get their URLs, set CHANNEL_SERVICE_URL (the channel URL) and PUBLIC_BASE_URL (the CRM URL) on the CRM service, then redeploy.
4. Seed the hosted DB once from the Render shell: npm run seed.

Free-tier note: Render has no free background worker, so the dispatch worker runs in the same instance as the CRM API (via concurrently). At scale this would be a dedicated, autoscaled consumer. Free web services also sleep after inactivity; the first request wakes them.

## Testing
npm test - covers the segment rule engine and the idempotent delivery state machine (duplicate and out-of-order events).

## Design decisions and tradeoffs
- BullMQ over Kafka/SQS: right-sized for this scope; a log-based broker at higher volume.
- Idempotent, forward-only state machine keyed by a unique idempotency key per (campaign, customer) plus a per-event id, so duplicate or out-of-order callbacks never regress state.
- Human-in-the-loop agent: the AI proposes; a human approves before any send.
- Deterministic fallbacks for every AI call, so the product works even without an AI key.

See DECISIONS.md for the full list.