# RP-GCP-03 Provider Gateway Skeleton

## Purpose

RP-GCP-03 prepares the ReeditPro provider gateway boundary for future AI API integrations without making real provider calls.

This milestone creates the provider-gateway structure, policy contracts, mock provider clients, Secret Manager reference boundary, normalized response shapes, and dry-run behavior.

It does **not**:

- call OpenAI, Wan, Hailuo, Veo, Lyria, or any provider
- read real Secret Manager values
- store provider credentials
- deploy Cloud Run
- render media
- upload outputs
- spend credits
- bypass approved-plan or credit gates

## Gateway Role

The provider gateway is the server-side boundary for all future provider calls.

The frontend must never call provider APIs directly. Future frontend flows should call the backend/orchestrator, which validates the approved snapshot and credit reservation before a provider request can be queued.

## Required Gate Before Real Calls

A future real provider request must have:

1. `approvedPlanSnapshotId`
2. approved edit plan
3. approved credit estimate
4. active credit reservation
5. generation request ID
6. job ID
7. idempotency key
8. provider route allowed by tier/model policy
9. prompt plan from approved snapshot
10. no raw secrets or signed URLs in payload

## Provider Routing Policy

Launch policy:

- GPT-Image-2: stills, keyframes, cards, start frames, end frames
- Wan: primary animation/video route
- Hailuo: fallback/alternate animation route
- Veo: Premium-only final fallback/rescue; never Basic, never Pro, never default
- Remotion/SVG/Lottie: deterministic renderer/compositor routes

Generated AI video must not default to 1080p. AI video assets should use matching panel backgrounds by default, not transparent backgrounds.

## Secret Boundary

Database rows, provider records, job payloads, and source code may store Secret Manager reference names only.

Raw provider keys stay in Google Secret Manager and are read only by future secure backend/worker runtimes.

Current Secret Manager placeholders:

- `reeditpro-prod-openai-api-key`
- `reeditpro-prod-wan-api-key`
- `reeditpro-prod-hailuo-api-key`
- `reeditpro-prod-veo-vertex-config`
- `reeditpro-prod-lyria-api-key`
- `reeditpro-prod-provider-webhook-signing-secret`

## Mock-Only Runtime

The provider gateway skeleton returns deterministic mock responses. This lets ReeditPro test:

- route validation
- tier/model restrictions
- idempotency shape
- event payload shape
- normalized provider errors
- usage/cost metadata shape
- generated asset metadata shape

without any external network call.

## Next Milestone After RP-GCP-03

RP-PROVIDER-01 should add a secure real-provider adapter boundary and one gated image-provider smoke test behind explicit environment flags.

The first real call should be the image/keyframe route, not full AI video.
