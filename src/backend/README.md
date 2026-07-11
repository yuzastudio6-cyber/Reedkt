# ReeditPro Backend Skeleton

This folder is the local/backend service skeleton for ReeditPro. It maps the current TypeScript records and Supabase migration model into services, API contracts, and orchestrators. Local/default execution stays non-production; Supabase, AI providers, Stripe, Google Cloud, storage, and render workers can only be enabled by explicit backend evidence gates.

The important rule is preserved here: generation and rendering are blocked until an edit plan is approved, a credit estimate is approved, and credits are reserved.

## Structure

- `contracts/` defines future request and response shapes.
- `services/` contains mock domain services for chat, media, planning, credits, jobs, generation, rendering, revisions, and QA.
- `orchestrators/` demonstrates the chat-native planning flow and the approved mock generation flow.
- `mock/` contains the in-memory mock database and deterministic sample data.
- `supabase/` contains placeholders only. Real Supabase clients must be added later in a secure backend/runtime context.

Everything in this folder is local/demo-safe and intentionally does not call external services.
