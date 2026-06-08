# Creative Graphics Capability Manifest Contract

Status: `repo_audit_passed / manifest_draft / dry_run_not_started`

Production capability enabled: `none; AI Tools creative graphics manifest contract only`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## Purpose

This contract defines the manifest shape for the AI Tools / Creative Graphics lane. The manifest is a documentation artifact only. It does not install packages, execute tools, run workers, call providers/models, render media, create public artifacts, create signed URLs, mutate Supabase, or unlock runtime.

## Manifest Schema

Each per-tool manifest must include:

- `track`
- `toolId`
- `displayName`
- `ownerWorkstream`
- `ownedCapabilities`
- `allowedInputTypes`
- `blockedInputTypes`
- `outputArtifactTypes`
- `renderReady`
- `supportsTransparencyAlpha`
- `canBeConsumedByTrackAFinalRender`
- `readyForTrackAComposition`
- `privateArtifactPolicy`
- `sourceOfTruthPolicy`
- `blockedUses`
- `packageRuntimeRequirements`
- `workerRuntimeRequirements`
- `providerRequirements`
- `supabaseArtifactRequirements`
- `gcsPrivatePathRequirements`
- `qaRequirements`
- `dryRunFixtureRequired`
- `generatedLocalFixtureRequired`
- `stagingFixtureRequired`
- `runtimeUnlockStage`
- `readinessStatus`
- `supabaseUpdateClassification`
- `nextPrompt`

## Required Policies

- `track` must be `ai_tools`.
- `ownerWorkstream` must be `AI_TOOLS_CREATIVE_GRAPHICS`.
- `runtimeUnlockStage` must remain `repo_audit_passed` for GD-1.
- `readinessStatus` must be `manifest_draft`.
- `privateArtifactPolicy` must require private artifacts only.
- `sourceOfTruthPolicy` must be `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`.
- `blockedUses` must include `public_artifact`, `final_delivery_without_track_a_validation`, `raw_prompt_worker_execution`, `signed_url_as_source_of_truth`, `provider_fallback_without_approval`, and `production_beta_unlock`.
- `readyForTrackAComposition` must remain false until dry-run and fixture gates pass.
- `supabaseUpdateClassification` must remain `docs/status only`, `docs_only`, environment `none`, SQL `none`, and migration `no`.

## Readiness Stages

Creative graphics follows the runtime unlock ladder:

`blocked -> owner_accepted -> repo_audit_passed -> dry_run_passed -> generated_local_fixture_passed -> staging_fixture_passed -> controlled_private_sample_passed -> internal_beta_candidate -> external_beta_candidate -> production_candidate`

GD-1 stops at `repo_audit_passed / manifest_draft / dry_run_not_started`.

## Boundary Fields

Track A handoff fields must describe future artifact compatibility only. Worker/tool-call fields must require structured agent findings, edit intents, approved plan snapshots, scoped tool-call manifests, and future unlock gates. Dry-run fixtures must use synthetic inputs and must not become execution approval.

Recommended next prompt: `Prompt GD-2 - Creative Graphics All-Tools Dry-Run Fixture Pack`.
