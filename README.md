# Reachly — AI-Native Mini CRM (Backend + Channel Service)

Reachly is an **agentic campaign copilot**: a marketer states a goal in plain English
("win back customers who haven't ordered in 60 days with a 15% off coupon"), and the AI
plans the campaign — segments the audience, drafts channel-aware copy, previews who will
be reached, and (after human approval) dispatches and tracks the full delivery funnel.

This repository contains two independently deployable services:

| Service | Path | Responsibility |
|---|---|---|
| **CRM API** | `/` (src) | Ingestion, segmentation, AI agent, campaign launch, receipt ingestion, analytics |
| **Channel Service** | `/channel-service` | Stubbed messaging provider. Simulates delivery lifecycle and fires async callbacks |

## Tech stack
- Node.js + Express + **TypeScript**
- PostgreSQL + Prisma (typed client)
- BullMQ + Redis (ordered dispatch, retries, rate limiting, idempotency)
- Google Gemini (function-calling agent)

## Why two services
The channel is deliberately stubbed and decoupled. The CRM calls the channel's `send` API;
the channel asynchronously calls back into the CRM's `receipts` API with simulated outcomes
(delivered / failed / opened / read / clicked). This callback-driven loop mirrors how real
delivery + engagement tracking works.

## Local setup
\`\`\`bash
npm install
cp .env.example .env        # DATABASE_URL, REDIS_URL, GEMINI_API_KEY, CHANNEL_SERVICE_URL
npx prisma migrate dev
npm run seed                # ts seed via tsx — realistic customers + orders
npm run dev                 # tsx watch — CRM API on :4000
npm run build               # tsc -> dist/
# channel service (separate terminal):
cd channel-service && npm install && npm run dev   # on :4100
\`\`\`

## Key API surface
- `POST /api/customers`, `POST /api/orders` (+ bulk) — ingestion
- `POST /api/segments/preview` — rule JSON → audience count + sample
- `POST /api/ai/agent` — natural-language goal → plan (segment + draft + audience preview)
- `POST /api/campaigns/:id/launch` — enqueue dispatch
- `POST /api/receipts` — callback endpoint hit by the Channel Service
- `GET /api/analytics/campaigns/:id` — delivery funnel + AI insight