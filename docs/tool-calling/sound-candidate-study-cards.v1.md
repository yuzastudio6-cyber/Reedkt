# Sound Candidate Study Cards v1

## Boundary

- Sound candidate study cards are planning metadata for Sound/Music/Audio and SFX/SoundSync owner-inventory tools.
- They do not create `ProductionToolId` entries and do not make any candidate selectable at runtime.
- Runtime selection still requires first-class `server/tool-registry` coverage.
- SOUND owner gates from PR #636 and PR #641 remain the source of truth for install, model, license, media, provider, and execution readiness.

## Candidate Card Source

- Cards live under `docs/tool-calling/sound-candidate-studies/`, separate from first-class `docs/tool-calling/studies/`.
- The card index is `docs/tool-calling/sound-candidate-study-cards-index.json`.
- Each card links back to PR #636 `SOUND-RUNTIME-MEDIA-GATE-0` evidence through PR #641's owner expansion matrix.

## Safety Rules

- Candidate cards must set `selectableAsRuntimeTool: false`.
- Candidate cards must keep adapter, command-intent, fixture-plan, controlled-probe, tool-execution, media-processing, worker-execution, Supabase, and beta/production flags disabled.
- Candidate cards must not add adapter contracts, command intents, fixture plans, probes, package installs, Docker changes, Supabase files, SQL, migrations, signed URLs, public artifacts, or package-lock changes.

## Next Milestones

- `SOUND-RUNTIME-MEDIA-GATE-1` for CPU worker install-plan reconciliation.
- `SOUND-RUNTIME-MEDIA-GATE-2` for model weight and provenance review.
- `SOUND-RUNTIME-MEDIA-GATE-3` for private media/file-open policy handoff.
- `REEDITPRO-TOOL-CALLING-SOUND-RUNTIME-GATE-1-RECONCILIATION` after owner gates publish promotion-ready evidence.
