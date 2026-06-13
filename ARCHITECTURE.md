# Architecture

## Overview
Two services + Postgres + Redis. The frontend talks only to the CRM API.

\`\`\`
Marketer → React → CRM API → AI Agent (Gemini tools)
                      │
                      ├── PostgreSQL (customers, orders, segments, campaigns, communications, events)
                      ├── BullMQ/Redis → Dispatch Worker → Channel Service /send
                      └── /receipts ← async callbacks ← Channel Service
\`\`\`

## The communication lifecycle (state machine)
QUEUED → SENT → DELIVERED → READ → CLICKED → CONVERTED
FAILED is a terminal branch (with retry/backoff before it becomes terminal).

State only ever moves **forward**. Late/out-of-order callbacks cannot regress state
(e.g. a late DELIVERED will not overwrite CLICKED).

## Handling volume, ordering, retries, failures
- **Volume:** dispatch is queued (BullMQ) and rate-limited so we never flood the channel.
- **Ordering:** receipts carry timestamps + a status rank; we apply max(rank) semantics.
- **Idempotency:** every communication has an idempotencyKey; duplicate callbacks are no-ops.
- **Retries:** transient send failures retry with exponential backoff; exhausted retries → FAILED.
- **Auditability:** every state change is an append-only row in CommunicationEvent.

## Scale assumptions & tradeoffs
- Built for tens of thousands of communications per campaign in this scope.
- At production scale: move the callback firehose to Kafka, separate the read model
  (analytics) from the write model, and partition Communication by campaign.