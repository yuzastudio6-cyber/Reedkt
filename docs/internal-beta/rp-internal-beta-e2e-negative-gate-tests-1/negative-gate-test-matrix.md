# RP-INTERNAL-BETA-E2E Negative Gate Test Matrix

| Gate | Evidence | Expected Result |
| --- | --- | --- |
| No generation before approval | `createInternalBetaCreditReservationRuntimeScaffold` without approval identifiers | `disabled_pending_credit_ledger_runtime_gate`; no credit mutation |
| No credits spent without reservation | `spendInternalBetaReservedCreditsRuntimeScaffold` without reservation | credit reservation required; no spend or mutation |
| No worker execution from raw chat | `enqueueInternalBetaJobRuntimeScaffold` with raw-chat payload | approved plan and credit reservation required; no job/worker execution |
| No direct provider/raw prompt execution | `prepareInternalBetaProviderPromptPayloadScaffold` | prompt plan, model policy, and cost cap required; no provider/model/raw prompt execution |
| No render/export before gates | `prepareInternalBetaRenderWorkerJobScaffold` | approved plan, reservation, manifest, cleanup required; no Remotion/FFmpeg/FFprobe/render/export |
| No public artifact or signed URL | `prepareInternalBetaPrivateArtifactAccessScaffold` | private manifest/checksum/policy required; no storage read, signed URL, or public artifact |
| Basic/Pro no-Veo | `compileEditingIntent` for Basic and Pro with Veo request | no-Veo avoid rule and QA implication retained |
| Premium Veo fallback only | `compileEditingIntent` for Premium with Veo request | final-fallback-only must-follow rule and QA implication retained |

All rows are local tests against fail-closed scaffolds or deterministic compiler output. No runtime, route, worker, provider, model, render, media, Supabase, SQL, storage, billing, signed URL, public artifact, beta unlock, production unlock, or final delivery path is enabled.
