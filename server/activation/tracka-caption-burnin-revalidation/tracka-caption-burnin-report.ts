import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  TRACKA_CAPTION_APPROVED_RUNTIME,
  TRACKA_CAPTION_APPROVED_SOURCE_METADATA,
  TRACKA_CAPTION_BURNIN_BRANCH,
  TRACKA_CAPTION_BURNIN_CONFIRM_ENV,
  TRACKA_CAPTION_BURNIN_CORRECTED_LINES,
  TRACKA_CAPTION_BURNIN_DOC_PATHS,
  TRACKA_CAPTION_GCS_ACCESS_REPAIR_CONFIRM_ENV,
  TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT,
  TRACKA_CAPTION_BURNIN_PHASE,
  TRACKA_CAPTION_BURNIN_PR_TITLE,
  TRACKA_CAPTION_BURNIN_SOURCE_CHAIN,
  TRACKA_CAPTION_LAYOUT_FIXED_LINES,
  TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE,
  TRACKA_CAPTION_LAYOUT_FIX_CONFIRM_ENV,
  TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID,
  TRACKA_CAPTION_RUNTIME_IMAGE_BUILD_CONFIRM_ENV,
  TRACKA_CAPTION_SOURCE_GCS_READ_CONFIRM_ENV,
  getTrackaCaptionBurninRunId,
} from './tracka-caption-burnin-policy'
import { buildTrackaCaptionBurninBundle } from './tracka-caption-burnin-runner'
import type { TrackaCaptionBurninArtifact, TrackaCaptionBurninBundle } from './tracka-caption-burnin-types'

function bool(value: boolean): string {
  return value ? 'true' : 'false'
}

function sourceChainTable(): string {
  return [
    '| PR | Merge SHA | Evidence |',
    '| --- | --- | --- |',
    ...TRACKA_CAPTION_BURNIN_SOURCE_CHAIN.map((item) => `| #${item.pr} | \`${item.sha}\` | ${item.summary} |`),
  ].join('\n')
}

function captionLinesList(): string {
  return TRACKA_CAPTION_BURNIN_CORRECTED_LINES
    .map((line, index) => `${index + 1}. "${line}"`)
    .join('\n')
}

function layoutFixedCaptionLinesList(): string {
  return TRACKA_CAPTION_LAYOUT_FIXED_LINES
    .map((line, index) => `${index + 1}. "${line.replace(/\\N/g, '\\n')}"`)
    .join('\n')
}

function layoutProfileTable(): string {
  return [
    '| Field | Value |',
    '| --- | --- |',
    `| layoutProfile | \`${TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID}\` |`,
    `| PlayResX | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.playResX}\` |`,
    `| PlayResY | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.playResY}\` |`,
    `| Alignment | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.alignment}\` |`,
    `| MarginL | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.marginL}\` |`,
    `| MarginR | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.marginR}\` |`,
    `| MarginV | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.marginV}\` |`,
    `| Fontsize | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.fontSize}\` |`,
    `| Outline | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.outline}\` |`,
    `| Shadow | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.shadow}\` |`,
    `| Max lines | \`${TRACKA_CAPTION_LAYOUT_FIX_ASS_PROFILE.maxLines}\` |`,
  ].join('\n')
}

function metadataTable(): string {
  return [
    '| Field | Value |',
    '| --- | --- |',
    ...Object.entries(TRACKA_CAPTION_APPROVED_SOURCE_METADATA).map(([key, value]) => `| \`${key}\` | \`${value}\` |`),
  ].join('\n')
}

function runtimeTable(): string {
  return [
    '| Field | Value |',
    '| --- | --- |',
    `| runtimePathStatus | \`${TRACKA_CAPTION_APPROVED_RUNTIME.status}\` |`,
    `| approvedRuntimePath | \`${TRACKA_CAPTION_APPROVED_RUNTIME.approvedRuntimePath}\` |`,
    `| runtimeSourceProvenance | \`${TRACKA_CAPTION_APPROVED_RUNTIME.dockerfile}\` |`,
    `| runtimeImageTag | \`${TRACKA_CAPTION_APPROVED_RUNTIME.imageTag}\` |`,
    `| ffmpegPath | \`${TRACKA_CAPTION_APPROVED_RUNTIME.ffmpegPath}\` |`,
    `| ffprobePath | \`${TRACKA_CAPTION_APPROVED_RUNTIME.ffprobePath}\` |`,
    `| assFilterPresent | \`${bool(TRACKA_CAPTION_APPROVED_RUNTIME.assFilterPresent)}\` |`,
    `| subtitlesFilterPresent | \`${bool(TRACKA_CAPTION_APPROVED_RUNTIME.subtitlesFilterPresent)}\` |`,
    `| libassIndicated | \`${bool(TRACKA_CAPTION_APPROVED_RUNTIME.libassIndicated)}\` |`,
  ].join('\n')
}

function gcsAccessTable(bundle: TrackaCaptionBurninBundle): string {
  return [
    '| Field | Value |',
    '| --- | --- |',
    `| confirmationProvided | \`${bool(bundle.gcsAccessCheck.confirmationProvided)}\` |`,
    `| metadataCheckExecuted | \`${bool(bundle.gcsAccessCheck.metadataCheckExecuted)}\` |`,
    `| status | \`${bundle.gcsAccessCheck.status}\` |`,
    `| approvedSourceRef | \`${bundle.gcsAccessCheck.approvedSourceRef}\` |`,
    `| objectMetadataMatched | \`${bool(bundle.gcsAccessCheck.objectMetadataMatched)}\` |`,
    `| gcloudAccount | \`${bundle.gcsAccessCheck.gcloudAccount}\` |`,
    `| gcloudProject | \`${bundle.gcsAccessCheck.gcloudProject}\` |`,
    `| activeAccount | \`${bundle.gcsAccessCheck.activeAccount}\` |`,
    `| detail | \`${bundle.gcsAccessCheck.detail.replace(/\|/g, '/')}\` |`,
  ].join('\n')
}

function qaTable(bundle: TrackaCaptionBurninBundle): string {
  return [
    '| Gate | Status | Evidence |',
    '| --- | --- | --- |',
    ...bundle.qaGates.map((gate) => `| \`${gate.gateId}\` | \`${gate.status}\` | ${gate.evidence} |`),
  ].join('\n')
}

function artifactRow(label: string, artifact: TrackaCaptionBurninArtifact): string {
  return `| ${label} | \`${artifact.localPath ?? 'not_created'}\` | \`${artifact.sha256 ?? 'not_created'}\` | \`${artifact.sizeBytes ?? 'not_created'}\` | \`${artifact.created ? 'created' : artifact.blocker ?? 'not_created'}\` |`
}

function artifactRows(bundle: TrackaCaptionBurninBundle): string {
  return [
    '| Artifact | Path | SHA-256 | Size bytes | Status |',
    '| --- | --- | --- | --- | --- |',
    artifactRow('approved source local copy', bundle.sourceArtifact),
    artifactRow('corrected ASS sidecar', bundle.sidecar),
    artifactRow('layout-fixed corrected-caption preview MP4', bundle.previewArtifact),
    artifactRow('FFprobe metadata JSON', bundle.ffprobeArtifact),
    artifactRow('QA report JSON', bundle.qaReportArtifact),
    artifactRow('artifact manifest JSON', bundle.artifactManifestArtifact),
  ].join('\n')
}

function executionNarrative(bundle: TrackaCaptionBurninBundle): string {
  if (bundle.summary.execution === 'completed_with_caption_layout_fix_revalidation') {
    return 'The guarded run used the approved #452 private source ref, the approved #426 controlled-test caption copy, and the approved #463 repo-owned Docker FFmpeg/libass runtime path to create a private layout-fixed corrected-caption preview and FFprobe metadata. The preview is private review evidence only and is not final delivery, internal beta, external beta, or production readiness.'
  }

  return `The guarded run failed closed with \`${bundle.summary.execution}\`. It did not create a usable caption layout visual review artifact unless the artifact table explicitly lists a layout-fixed corrected-caption preview MP4 as created.`
}

function docsFor(bundle: TrackaCaptionBurninBundle): Record<string, string> {
  const execution = bundle.summary.execution
  const previewStatus = bundle.previewArtifact.created ? 'created' : bundle.previewArtifact.blocker ?? execution
  const ffprobeStatus = bundle.ffprobeArtifact.created ? 'completed' : bundle.ffprobeArtifact.blocker ?? 'not_run'

  return {
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.execution]: `# TRACKA-CAPTION-QUALITY-5 Burn-In Revalidation Execution

Status: \`${execution}\`

## Execution

Run ID: \`${bundle.runId}\`

Execution: \`${execution}\`

Confirmation env: \`${TRACKA_CAPTION_BURNIN_CONFIRM_ENV}=true\`

Layout fix confirmation env: \`${TRACKA_CAPTION_LAYOUT_FIX_CONFIRM_ENV}=true\`

Source GCS read env: \`${TRACKA_CAPTION_SOURCE_GCS_READ_CONFIRM_ENV}=true\`

GCS access repair env: \`${TRACKA_CAPTION_GCS_ACCESS_REPAIR_CONFIRM_ENV}=true\` (optional legacy repair context)

Optional runtime image build env: \`${TRACKA_CAPTION_RUNTIME_IMAGE_BUILD_CONFIRM_ENV}=true\`

confirmationProvided: ${bool(bundle.summary.confirmationProvided)}

layoutFixConfirmationProvided: ${bool(bundle.summary.layoutFixConfirmationProvided)}

sourceGcsReadConfirmationProvided: ${bool(bundle.summary.sourceGcsReadConfirmationProvided)}

gcsAccessRepairConfirmationProvided: ${bool(bundle.summary.gcsAccessRepairConfirmationProvided)}

gcsMetadataCheckStatus: \`${bundle.summary.gcsMetadataCheckStatus}\`

approvedSourceRef: \`${bundle.summary.approvedSourceRef}\`

sourceRefApproved: ${bool(bundle.summary.sourceRefApproved)}

approvedRuntimePath: \`${bundle.summary.approvedRuntimePath}\`

runtimePathApproved: ${bool(bundle.summary.runtimePathApproved)}

captionBurninRevalidationExecuted: ${bool(bundle.summary.captionBurninRevalidationExecuted)}

correctedCaptionVisualPreviewCreated: ${bool(bundle.summary.correctedCaptionVisualPreviewCreated)}

assSidecarCreated: ${bool(bundle.summary.assSidecarCreated)}

approvedSourceCopied: ${bool(bundle.summary.approvedSourceCopied)}

libassBurninExecuted: ${bool(bundle.summary.libassBurninExecuted)}

remotionPreviewExecuted: ${bool(bundle.summary.remotionPreviewExecuted)}

ffmpegValidationExecuted: ${bool(bundle.summary.ffmpegValidationExecuted)}

ffprobeValidationExecuted: ${bool(bundle.summary.ffprobeValidationExecuted)}

privateArtifactsCreated: ${bool(bundle.summary.privateArtifactsCreated)}

privateVisualArtifactsCreated: ${bool(bundle.summary.privateVisualArtifactsCreated)}

gcsAccess: ${bool(bundle.summary.gcsAccess)}

gcsAccessMode: \`${bundle.summary.gcsAccessMode}\`

## GCS Source Access Classification

${gcsAccessTable(bundle)}

signedUrlsCreated: ${bool(bundle.summary.signedUrlsCreated)}

publicArtifactsCreated: ${bool(bundle.summary.publicArtifactsCreated)}

finalDeliveryReady: ${bool(bundle.summary.finalDeliveryReady)}

internalBetaReady: ${bool(bundle.summary.internalBetaReady)}

productionReady: ${bool(bundle.summary.productionReady)}

externalBetaReady: ${bool(bundle.summary.externalBetaReady)}

## Source-Of-Truth Audit

${sourceChainTable()}

## Result

${executionNarrative(bundle)}

## Layout Fix Profile

${layoutProfileTable()}

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.layoutStyleContract]: `# TRACKA-CAPTION-QUALITY-5 Layout Style Contract

Status: \`${bundle.summary.captionLayoutFixProfileApplied ? 'applied' : 'not_applied'}\`

## Profile

${layoutProfileTable()}

## Requirements

- bottom-center subtitle-style placement.
- no absolute top/left positioning.
- safe margins encoded in ASS style.
- no more than two caption lines.
- readable white text with dark outline/shadow.
- no old #419 caption text.
- no transcript accuracy claim.

## Layout-Fixed Caption Lines

${layoutFixedCaptionLinesList()}

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.approvedSource]: `# TRACKA-CAPTION-QUALITY-5 Approved Source Input

Status: \`${bundle.approvedSourceRef.status}\`

sourceRefApproved: ${bool(bundle.approvedSourceRef.sourceRefApproved)}

approvedSourceRef: \`${bundle.approvedSourceRef.ref}\`

metadataEvidencePath: \`${bundle.approvedSourceRef.metadataEvidencePath}\`

sourceLocalCopyPath: \`${bundle.sourceArtifact.localPath ?? 'not_created'}\`

sourceLocalCopySha256: \`${bundle.sourceArtifact.sha256 ?? 'not_created'}\`

sourceLocalCopySizeBytes: \`${bundle.sourceArtifact.sizeBytes ?? 'not_created'}\`

## #452 Metadata

${metadataTable()}

## GCS Metadata Check

${gcsAccessTable(bundle)}

## Source Rules

- exact private \`gs://\` object only.
- exact metadata/copy checks require the CQ5 layout-fix, burn-in, and source-read confirmations.
- no public URL.
- no signed URL.
- no prefix-only ref.
- no local review artifact as source.
- no old-caption-burned output as source.
- no arbitrary user media claim.
- no final delivery source-of-truth claim.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.sidecar]: `# TRACKA-CAPTION-QUALITY-5 Corrected ASS Sidecar

Status: \`${bundle.sidecar.created ? 'created' : 'not_created'}\`

## Approved Caption Source

captionSourceType: \`controlled_test_caption_copy\`

transcriptAccuracyClaim: \`false\`

captionTextQualityForControlledTest: \`pass\`

captionVisualBurnInRevalidationRequired: \`true\`

## Corrected Caption Lines

${captionLinesList()}

## Layout-Fixed Caption Lines

${layoutFixedCaptionLinesList()}

## Layout Fix Profile

${layoutProfileTable()}

## Sidecar Artifact

localSidecarPath: \`${bundle.sidecar.localPath ?? 'not_created'}\`

sidecarSha256: \`${bundle.sidecar.sha256 ?? 'not_created'}\`

sidecarSizeBytes: \`${bundle.sidecar.sizeBytes ?? 'not_created'}\`

lineCount: \`${bundle.sidecar.lineCount}\`

layoutProfile: \`${bundle.sidecar.layoutProfile ?? 'not_applied'}\`

oldAwkwardCaptionRejected: \`true\`

## Handling Rule

The sidecar is a private local review artifact for guarded revalidation only. It is not a transcript accuracy claim, public caption, final delivery caption, signed URL source-of-truth, internal beta unlock, external beta unlock, or production artifact.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.artifactManifest]: `# TRACKA-CAPTION-QUALITY-5 Private Artifact Manifest

Status: \`${execution}\`

## Local Bundle

localBundlePath: \`${bundle.localBundlePath}\`

privateArtifactsCreated: ${bool(bundle.summary.privateArtifactsCreated)}

privateVisualArtifactsCreated: ${bool(bundle.summary.privateVisualArtifactsCreated)}

gcsAccess: ${bool(bundle.summary.gcsAccess)}

gcsAccessMode: \`${bundle.summary.gcsAccessMode}\`

## GCS Source Access Classification

${gcsAccessTable(bundle)}

signedUrlsCreated: ${bool(bundle.summary.signedUrlsCreated)}

publicArtifactsCreated: ${bool(bundle.summary.publicArtifactsCreated)}

finalDeliveryReady: ${bool(bundle.summary.finalDeliveryReady)}

internalBetaReady: ${bool(bundle.summary.internalBetaReady)}

## Runtime

${runtimeTable()}

## Artifacts

${artifactRows(bundle)}

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.qaReport]: `# TRACKA-CAPTION-QUALITY-5 QA Report

Status: \`${execution}\`

## QA Gates

${qaTable(bundle)}

## GCS Source Access Classification

${gcsAccessTable(bundle)}

## Runtime

${runtimeTable()}

## Required Follow-Up

Caption layout visual review remains incomplete until TRACKA-CAPTION-QUALITY-6 records the visual review outcome from the generated private preview.

TRACKA-CAPTION-QUALITY-6 readiness: \`${bundle.summary.trackaCaptionQuality6Readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`${bundle.summary.trackaPrivateE2eRevalidation1Readiness}\`

Internal beta readiness: \`${bundle.summary.internalBetaReadiness}\`

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.ffprobe]: `# TRACKA-CAPTION-QUALITY-5 FFprobe Validation

Status: \`${ffprobeStatus}\`

ffprobeValidationExecuted: ${bool(bundle.summary.ffprobeValidationExecuted)}

ffmpegValidationExecuted: ${bool(bundle.summary.ffmpegValidationExecuted)}

privatePreviewArtifact: \`${bundle.previewArtifact.localPath ?? 'not_created'}\`

ffprobeJsonPath: \`${bundle.ffprobeArtifact.localPath ?? 'not_created'}\`

ffprobeSha256: \`${bundle.ffprobeArtifact.sha256 ?? 'not_created'}\`

ffprobeSizeBytes: \`${bundle.ffprobeArtifact.sizeBytes ?? 'not_created'}\`

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.localBundle]: `# TRACKA-CAPTION-QUALITY-5 Local Review Bundle

Status: \`${bundle.previewArtifact.created ? 'created_with_private_preview' : 'not_created_or_metadata_only'}\`

localBundlePath: \`${bundle.localBundlePath}\`

approvedSourceCopy: \`${bundle.sourceArtifact.localPath ?? 'not_created'}\`

correctedAssSidecar: \`${bundle.sidecar.localPath ?? 'not_created'}\`

correctedCaptionPreview: \`${bundle.previewArtifact.localPath ?? 'not_created'}\`

ffprobeJson: \`${bundle.ffprobeArtifact.localPath ?? 'not_created'}\`

qaReportJson: \`${bundle.qaReportArtifact.localPath ?? 'not_created'}\`

artifactManifestJson: \`${bundle.artifactManifestArtifact.localPath ?? 'not_created'}\`

localReviewBundleVisualFiles: \`${bundle.previewArtifact.created ? '1' : '0'}\`

uploadableVisualFiles: \`${bundle.previewArtifact.created ? '1' : '0'}\`

The approved source copy remains private local input evidence and must not be uploaded as review output unless a future owner explicitly asks for source provenance. The layout-fixed corrected-caption preview MP4 is the review artifact for TRACKA-CAPTION-QUALITY-6.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.uploadInstructions]: `# TRACKA-CAPTION-QUALITY-5 Upload-To-Chat Instructions

Status: \`${bundle.summary.trackaCaptionQuality6Readiness}\`

## Upload Candidate Files

| File | Upload? | Reason |
| --- | --- | --- |
| \`${bundle.previewArtifact.localPath ?? 'not_created'}\` | ${bundle.previewArtifact.created ? 'yes' : 'no'} | caption layout visual review artifact |
| \`${bundle.ffprobeArtifact.localPath ?? 'not_created'}\` | optional metadata | validates private preview container/streams |
| \`${bundle.qaReportArtifact.localPath ?? 'not_created'}\` | optional metadata | records QA gate status |
| \`${bundle.artifactManifestArtifact.localPath ?? 'not_created'}\` | optional metadata | records checksums and provenance |
| \`${bundle.sidecar.localPath ?? 'not_created'}\` | optional metadata | proves approved corrected caption text |
| \`${bundle.sourceArtifact.localPath ?? 'not_created'}\` | no | approved private source input, not review output |

Do not upload signed URLs, public artifacts, production files, final delivery exports, or unrelated source media as source of truth.

## Preview Status

correctedCaptionPreview: \`${previewStatus}\`

previewSha256: \`${bundle.previewArtifact.sha256 ?? 'not_created'}\`

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.nextPhase]: `# TRACKA-CAPTION-QUALITY-5 Next Phase Plan

Status: \`${bundle.summary.trackaCaptionQuality6Readiness}\`

## Readiness

TRACKA-CAPTION-QUALITY-6 readiness: \`${bundle.summary.trackaCaptionQuality6Readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`${bundle.summary.trackaPrivateE2eRevalidation1Readiness}\`

Internal beta readiness: \`${bundle.summary.internalBetaReadiness}\`

## Next Prompt

\`TRACKA-CAPTION-QUALITY-6 — Record layout review outcome\`

## Required Before TRACKA-CAPTION-QUALITY-6

- upload the layout-fixed corrected-caption preview MP4 if it was created.
- include FFprobe/QA metadata when available.
- record whether captions are readable, timed acceptably for the controlled sample, and free of rejected #419 caption text.
- keep full Track A closure, private E2E closure, internal beta, external beta, production, and final delivery blocked unless a later owner packet explicitly records those outcomes.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.activationResults]: `# Activation Phase TRACKA-CAPTION-QUALITY-5 Results

Branch: \`${TRACKA_CAPTION_BURNIN_BRANCH}\`

PR title: \`${TRACKA_CAPTION_BURNIN_PR_TITLE}\`

Base: \`origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration\` at or after #484 merge \`cb974c7fe8c8350cfa7522ec7e736140af58583a\`

Patch type: Track A caption layout fix and corrected-caption burn-in revalidation.

Run ID: \`${bundle.runId}\`

Execution: \`${execution}\`

## Source-Of-Truth Audit

${sourceChainTable()}

## Approved Source Ref

approvedSourceRef: \`${bundle.summary.approvedSourceRef}\`

sourceRefApproved: ${bool(bundle.summary.sourceRefApproved)}

sourceLocalCopyPath: \`${bundle.sourceArtifact.localPath ?? 'not_created'}\`

gcsAccessRepairConfirmationProvided: ${bool(bundle.summary.gcsAccessRepairConfirmationProvided)}

gcsMetadataCheckStatus: \`${bundle.summary.gcsMetadataCheckStatus}\`

## GCS Source Access Classification

${gcsAccessTable(bundle)}

## Approved Runtime Path

${runtimeTable()}

## Approved Caption Source

captionSourceType: \`controlled_test_caption_copy\`

transcriptAccuracyClaim: \`false\`

captionTextQualityForControlledTest: \`pass\`

captionVisualBurnInRevalidationRequired: \`true\`

Corrected controlled-test caption copy:

${captionLinesList()}

Layout-fixed caption copy:

${layoutFixedCaptionLinesList()}

Layout fix profile: \`${TRACKA_CAPTION_LAYOUT_FIX_PROFILE_ID}\`

oldAwkwardCaptionRejected: \`true\`

## Execution Results

Corrected ASS sidecar: \`${bundle.sidecar.created ? 'created' : 'not_created'}\`

libass burn-in result: \`${bundle.summary.libassBurninExecuted ? 'completed' : 'not_run_or_blocked'}\`

Remotion preview result: \`not_run_no_approved_remotion_path\`

FFmpeg validation: \`${bundle.summary.ffmpegValidationExecuted ? 'completed' : 'not_run_or_blocked'}\`

FFprobe validation: \`${bundle.summary.ffprobeValidationExecuted ? 'completed' : 'not_run_or_blocked'}\`

Private artifact manifest: \`${TRACKA_CAPTION_BURNIN_DOC_PATHS.artifactManifest}\`

Local review bundle: \`${bundle.previewArtifact.created ? 'created_with_private_preview' : 'not_created_or_metadata_only'}\`

Upload-to-chat instructions: \`${TRACKA_CAPTION_BURNIN_DOC_PATHS.uploadInstructions}\`

## Artifacts

${artifactRows(bundle)}

## Readiness

TRACKA-CAPTION-QUALITY-6 readiness: \`${bundle.summary.trackaCaptionQuality6Readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`${bundle.summary.trackaPrivateE2eRevalidation1Readiness}\`

Internal beta readiness: \`${bundle.summary.internalBetaReadiness}\`

Production/external beta/broad media: \`blocked\`

Track A final delivery: \`blocked\`

## Supabase Update Classification

- Supabase update required: docs/status only
- Supabase update status: docs_only
- Supabase environment touched: none
- SQL executed: none
- Migration deployed: no
- Evidence docs: TRACKA-CAPTION-QUALITY-5 docs packet
- Blockers: caption layout visual review, private E2E scope decision
- Next Supabase action: none

## Cross-Chat Impact

- Workstream updated: TRACK_A_RENDER_EXPORT
- Other workstreams affected: TRACK_B_MEDIA_PROCESSING, WORKER_RUNTIME_JOBS, COMPLIANCE_SECURITY, OBSERVABILITY_AUDIT_COST
- Contracts changed: corrected caption burn-in revalidation private review artifact contract only
- Handoff needed: upload layout-fixed corrected-caption preview, then run TRACKA-CAPTION-QUALITY-6
- Duplicate risk: low; branch is dedicated to TRACKA-CAPTION-QUALITY-5
- Next owner/prompt: TRACKA-CAPTION-QUALITY-6 — Record layout review outcome

## Known Limitations

Caption layout visual review is not complete until TRACKA-CAPTION-QUALITY-6 records the visual outcome from generated review artifacts.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.nextPrompt]: `# TRACKA-CAPTION-QUALITY-6 Record Caption Layout Review Outcome

## Goal

Record the human or AI-assisted review outcome for a corrected-caption burn-in preview generated from TRACKA-CAPTION-QUALITY-5.

## Current Source Status

TRACKA-CAPTION-QUALITY-5 currently records \`${execution}\`.

Approved #452 source ref: \`${bundle.summary.approvedSourceRef}\`.

Approved #463 runtime path: \`${bundle.summary.approvedRuntimePath}\`.

Corrected ASS sidecar status: \`${bundle.sidecar.created ? 'created' : 'not_created'}\`.

Corrected-caption visual preview status: \`${previewStatus}\`.

## Required Inputs

- layout-fixed corrected-caption preview file generated from the #426 controlled-test caption copy and #452 approved source ref.
- QA/FFprobe metadata for that preview.
- checksum and provenance for the corrected ASS sidecar and preview.
- visual review notes confirming whether corrected captions are readable, safe, and free of rejected #419 caption wording.

## Blocked Claims

Do not claim full Track A closure, private E2E closure, internal beta readiness, production readiness, external beta readiness, final delivery readiness, public artifact readiness, signed URL source-of-truth, Supabase mutation, or broad runtime readiness unless a later approved phase explicitly records those outcomes.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
  }
}

async function writeText(filePath: string, contents: string): Promise<void> {
  const text = contents.endsWith('\n') ? contents : `${contents}\n`
  if (text.includes('Hey guys, I saw how you guys doing today is going to do going to be the first')) {
    throw new Error(`Rejected #419 caption text leaked into ${filePath}`)
  }
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, text)
}

export async function writeTrackaCaptionBurninArtifacts(bundle: TrackaCaptionBurninBundle): Promise<void> {
  const docs = docsFor(bundle)
  for (const [filePath, contents] of Object.entries(docs)) {
    await writeText(filePath, contents)
  }
}

export async function writeTrackaCaptionBurninReport(input: {
  execute?: boolean
  runId?: string
} = {}): Promise<TrackaCaptionBurninBundle> {
  const bundle = await buildTrackaCaptionBurninBundle({ execute: input.execute ?? false, runId: input.runId })
  await writeTrackaCaptionBurninArtifacts(bundle)
  return bundle
}

export function readTrackaCaptionBurninSummary(): Record<string, unknown> {
  const resultPath = TRACKA_CAPTION_BURNIN_DOC_PATHS.activationResults
  if (existsSync(resultPath)) {
    return {
      phase: TRACKA_CAPTION_BURNIN_PHASE,
      runId: getTrackaCaptionBurninRunId(),
      source: resultPath,
      contents: readFileSync(resultPath, 'utf8'),
    }
  }
  return {
    phase: TRACKA_CAPTION_BURNIN_PHASE,
    runId: getTrackaCaptionBurninRunId(),
    execution: 'blocked_caption_layout_fix_confirmation_missing',
  }
}
