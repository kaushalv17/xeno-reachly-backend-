# Channel Service (stub)

A standalone TypeScript service that simulates a messaging provider (WhatsApp/SMS/Email/RCS).

- `POST /send` — accepts `{ communicationId, recipient, channel, message, callbackUrl }`,
  immediately ACKs, then asynchronously simulates a realistic delivery lifecycle.
- Outcomes (delivered/failed/opened/read/clicked/converted) are drawn from per-channel
  probabilities with randomized delays, and POSTed back to the CRM's callback URL.

It deliberately delivers nothing real. See `src/simulator/` for the lifecycle model.