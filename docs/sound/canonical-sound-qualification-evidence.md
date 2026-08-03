# Canonical Sound qualification evidence

Status date: 2026-08-03. This report distinguishes completed implementation evidence from activation evidence that does not exist.

## Evidence summary

| Evidence area | Result | Qualification consequence |
|---|---|---|
| Skill manifest schema, hash, immutability, discovery, estimates, conflicts, ordering | passed | planning-qualified where capability routes support it |
| 24 tool manifests and per-operation policies | passed | tool operations retain their individual declared status |
| 18 route manifests and exact tool/operation/profile bindings | passed | route status is derived from required operations |
| Qualification versus runtime separation | passed | no upward inference from installation or credentials |
| Orchestra, peer, controller, and worker projections | passed | direct peer tool invocation denied |
| Canonical controller scope and ownership | passed | Sound cannot own Music, visuals, render, mux, export, or delivery |
| Real private local audio processing | passed | bounded operations are private-internal-qualified only |
| Real loop-seam crossfade path | passed | bounded 128-segment local loop profile; production deployment still blocked |
| Mirelo injected transport and private output ingestion | passed | fixture-qualified only |
| Unknown provider outcome reconciliation and idempotency | passed | blind resubmission denied |
| Legacy combined Sound/Music retirement adapter | passed | legacy surface is compatibility-fixture-only |
| Full local E2E from Orchestra through worker, real bytes, QA, handoff | passed | private/internal E2E evidence only |
| Live Mirelo private canary | not run / evidence absent | production blocked |
| Production worker deployment and health evidence | absent | production blocked |
| Deployable LGPL FFmpeg build evidence | absent | production blocked |
| Account-specific USD conversion and settlement evidence | absent | production cost settlement blocked |
| Live Supabase, public delivery, final render/export, and billing | out of Sound scope and not unlocked | remain blocked |

## Qualification rules proven by tests

- Published manifest versions are immutable and deeply frozen.
- Every route step resolves one exact registered operation and versioned profile.
- Optional route steps do not lower route qualification unless selected.
- An operation can be blocked even when another operation on the same tool is private-qualified.
- Runtime availability cannot upgrade qualification.
- Missing runtime, credential, quota, canary, input, scope, budget, rate, license, or QA evidence fails admission closed.
- The worker receives exactly one bounded operation.
- A changed tool manifest, operation version, profile, or route hash invalidates the binding.
- Provider URLs and credentials are not persisted into durable Sound artifacts.
- The source file remains byte-identical and outputs use private filesystem permissions.

## Local processing evidence

`canonical-sound-local-audio-smoke.ts` creates real approved project audio and validates analysis, extraction, trim/fade/gain, loudness normalization, resampling/channel conversion, actual loop-seam crossfade, time-stretch/pitch shift, gentle cleanup, scene-stem mixing with speech protection, transient synchronization QA, idempotent replay, immutable source bytes, media validation, checksums, and private file permissions.

The tested runtime is local development infrastructure. Its binary build/license evidence is bound as `sound.license_evidence.private_local_gpl_development_only.v1`, so the same operation cannot be admitted as production execution.

## Mirelo evidence

`canonical-sound-mirelo-smoke.ts` uses injected deterministic transport, a private visual proxy, exact Mirelo 1.6 operation/route/profile binding, preflight evidence, attempt identity, idempotency, unknown-outcome reconciliation, private output ingestion, optional carrier extraction, visual rejection, license evidence, and a separate immutable rate-card snapshot. Its adversarial cases also prove that altered visual bytes, missing rate snapshots, and hostile upload/result URL hosts fail closed before the unsafe network request can occur.

This is fixture evidence. It does not prove a valid live account, commercial approval, privacy acceptance for project media, provider retention guarantees, quota, production health, deployment, or real billing conversion.

Mirelo currently publishes SFX 1.6 API surfaces, preflight, text/video generation, editing/extension features, and pricing in provider credits. Sources reviewed on 2026-08-03:

- https://www.mirelo.ai/api-docs
- https://www.mirelo.ai/models/1-6
- https://www.mirelo.ai/pricing
- https://www.mirelo.ai/terms
- https://www.mirelo.ai/privacy
- https://www.mirelo.ai/acceptable-use-policy

The current privacy policy says certain content may be used to develop or improve the service, including model training, and provides a contact-based opt-out. It does not supply the repository with a verified, project-appropriate uploaded-asset retention duration. The provider profile therefore records retention duration as unknown and requires explicit production privacy/retention approval.

## Canonical E2E evidence

`canonical-sound-e2e-smoke.ts` proves this bounded path with real bytes:

```text
Head of Orchestra inspection
  -> canonical Sound assignment
  -> Sound controller and source-first cue decision
  -> execution-mode route re-admission
  -> one-operation worker package
  -> FFmpeg private extraction
  -> media/checksum/permission QA
  -> Head of Orchestra handoff receipt
```

The E2E test does not claim provider, deployment, final-render, public-delivery, or billing readiness.

## Remaining production activation gates

1. Review and approve the current Mirelo paid commercial terms, AUP, privacy, content-use opt-out, and project-media retention behavior.
2. Configure the server-side secret reference without exposing the value to manifests, UI, logs, or artifacts.
3. Record an account-specific provider-credit-to-USD rate snapshot. The existing snapshot records 10 provider credits per generated second and explicitly marks USD conversion unknown; it publishes no `unitCostUsd`.
4. Run the opt-in private canary with approved test media and persist its evidence privately.
5. Deploy and qualify the backend worker, storage, reconciliation, observability, and private cleanup path.
6. Produce an approved production FFmpeg LGPL build/configuration and operation-level media regression evidence.
7. Re-run security, privacy, idempotency, rate, failure, QA, and full E2E gates against the deployed environment.
8. Publish new production-qualified manifest and route versions; never mutate current evidence in place.
