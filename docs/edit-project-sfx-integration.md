# Edit Project SFX Integration

## Purpose

RP-FIX-14 wires SoundSync SFX into the project editing workflow in mock mode. ReeditPro can now move from a project/edit plan into SFX event planning, provider routing, prompt planning, credit estimate gating, mock generation requests, mock worker jobs, mock provider adapter output, trim/hit alignment, mix planning, QA, and project/library asset decisions.

This fixes the previous product gap where Mirelo SFX V1.5 and MMAudio V were planned in the SFX stack but were not visible as part of the project editing flow.

## Project Flow

The mock project SFX path is:

```text
Project/Edit Plan
-> SFX Director Plan
-> Provider Route
-> Prompt Plan
-> Credit Estimate
-> Credit Approval + Reservation
-> Mock Generation Request
-> Mock SFX Worker Job
-> Mock Provider Adapter
-> Generated SFX Asset Metadata
-> Trim + Hit Alignment
-> Mix Plan
-> QA
-> Project Asset / Library Candidate Decision
-> Chat Status
```

The integration lives in:

- `src/backend/services/edit-project-sfx-integration-service.ts`
- `src/backend/services/edit-project-sfx-status-service.ts`
- `src/backend/orchestrators/edit-project-sfx-orchestrator.ts`
- `src/backend/mock/mock-edit-project-sfx-scenarios.ts`
- `src/components/editor/sfx/ProjectSFXIntegrationPanel.tsx`

## Provider Routing

Provider routing remains edit-layer-first and approval-gated.

Mirelo SFX V1.5 is the mock production route for important transition, title, Stroke Motion, Graphic Design, Real Motion, CTA, premium, and signature polish moments.

MMAudio V is the mock cheap draft, Basic/Pro fallback, and provider-unavailable helper route.

The internal library is the first-choice route when approved reusable sounds exist. When no approved match exists, the mock worker can fall back to MMAudio or Mirelo only if the route allows it.

No SFX remains a first-class professional decision for clean talking-head cuts, serious teaching, emotional pauses, ambience-first scenes, and any moment where sound would distract.

## Credit Gate

Project SFX generation is blocked unless:

- the edit plan is approved;
- the SFX credit estimate is approved;
- credits are reserved;
- a provider route exists;
- a prompt plan exists;
- the worker input is mock-only.

Missing credit approval or missing reservation stops before mock generation requests or mock worker execution. No real credits are reserved or spent.

## Mock Worker And Provider Adapter

The project flow calls the existing mock SFX worker skeleton after gates pass. The worker then routes through the existing provider adapter in mock mode:

- `mirelo_sfx_v1_5` uses the Mirelo mock client;
- `mmaudio_v` uses the MMAudio mock client;
- `reeditpro_internal_library` uses the internal library mock client;
- `no_sfx` blocks generation.

The adapter never calls real Mirelo or MMAudio, reads secrets, creates audio bytes, uploads files, runs Cloud Run, connects to Supabase, or renders media.

## QA And Asset Decisions

Successful mock worker runs create generated asset metadata, SFX generated asset metadata, waveform hints, trim plans, timing alignments, mix plans, and QA reports.

QA-passed sounds stay project-only by default. A sound becomes a library candidate only when mock QA and mock provenance/reuse checks allow it.

QA-failed sounds are not approved for preview/export and should be adjusted, regenerated, removed, or replaced later.

## Editor Chat

The chat-native editor now shows a compact project SFX integration panel inside the existing SFX flow. It displays:

- Mirelo SFX V1.5 as production SFX;
- MMAudio V as cheap draft/basic-pro fallback;
- internal library as first choice when available;
- no SFX as valid when sound does not improve the edit;
- a visible mock-mode note.

## Mock-Only Boundary

RP-FIX-14 is partially fixed:

- Project SFX integration works in local mock mode.
- Mirelo and MMAudio are wired into the project workflow through provider routes, prompts, jobs, the mock worker, and the mock adapter.
- Real Mirelo/MMAudio calls remain disabled.
- Real provider keys, Secret Manager, Cloud Run workers, Supabase persistence, storage uploads, real audio files, credit spending, Stripe, rendering, and mobile remain future work.

## Next Real-Execution Work

The next backend/provider milestone should add secure real-provider readiness behind worker boundaries only after provider documentation, Secret Manager references, storage paths, retries, credit spend/refund, QA/provenance policy, and deployment controls are approved.
