# Design Decisions & Tradeoffs

> "I'd do X at scale, but did Y for this scope" — explicit tradeoffs.

1. **Rule-based segments over free-form SQL from the LLM.**
   The AI outputs a *validated rule JSON*, which a deterministic engine compiles to SQL.
   Safer (no SQL injection / hallucinated tables), explainable, and re-runnable.

2. **Human-in-the-loop agent, not full autonomy.**
   The agent plans end-to-end but pauses for approval before spending sends.

3. **BullMQ + Redis over Kafka.**
   Gives ordering, retries, rate limiting, idempotency with minimal ops.

4. **Stubbed channel as a separate deployable service.**
   Mirrors real provider decoupling; lets me model async callbacks honestly.

5. **Append-only event log (CommunicationEvent).**
   Single source of truth for analytics + audit; stats are derived.

6. **What I deliberately did NOT build:** sales/support CRM features (deals, pipelines,
   tickets), real provider integrations, multi-tenant auth. Out of scope per the brief.