import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  TRACKA_CAPTION_APPROVED_SOURCE_METADATA,
  TRACKA_CAPTION_BURNIN_BRANCH,
  TRACKA_CAPTION_BURNIN_CONFIRM_ENV,
  TRACKA_CAPTION_BURNIN_CORRECTED_LINES,
  TRACKA_CAPTION_BURNIN_DOC_PATHS,
  TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT,
  TRACKA_CAPTION_BURNIN_PR_TITLE,
  TRACKA_CAPTION_BURNIN_SOURCE_CHAIN,
  getTrackaCaptionBurninRunId,
} from './tracka-caption-burnin-policy'
import { buildTrackaCaptionBurninBundle } from './tracka-caption-burnin-runner'
import type { TrackaCaptionBurninBundle } from './tracka-caption-burnin-types'

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

function metadataTable(): string {
  return [
    '| Field | Value |',
    '| --- | --- |',
    ...Object.entries(TRACKA_CAPTION_APPROVED_SOURCE_METADATA).map(([key, value]) => `| \`${key}\` | \`${value}\` |`),
  ].join('\n')
}

function qaTable(bundle: TrackaCaptionBurninBundle): string {
  return [
    '| Gate | Status | Evidence |',
    '| --- | --- | --- |',
    ...bundle.qaGates.map((gate) => `| \`${gate.gateId}\` | \`${gate.status}\` | ${gate.evidence} |`),
  ].join('\n')
}

function artifactRows(bundle: TrackaCaptionBurninBundle): string {
  return [
    '| Artifact | Path | SHA-256 | Status |',
    '| --- | --- | --- | --- |',
    `| corrected ASS sidecar | \`${bundle.sidecar.localPath ?? 'not_created'}\` | \`${bundle.sidecar.sha256 ?? 'not_created'}\` | \`${bundle.sidecar.created ? 'created' : 'not_created'}\` |`,
    `| QA report JSON | \`${bundle.qaReportArtifact.localPath ?? 'not_created'}\` | \`${bundle.qaReportArtifact.sha256 ?? 'not_created'}\` | \`${bundle.qaReportArtifact.created ? 'created' : 'not_created'}\` |`,
    `| artifact manifest JSON | \`${bundle.artifactManifestArtifact.localPath ?? 'not_created'}\` | \`${bundle.artifactManifestArtifact.sha256 ?? 'not_created'}\` | \`${bundle.artifactManifestArtifact.created ? 'created' : 'not_created'}\` |`,
    '| corrected-caption preview | `not_created` | `not_created` | `blocked_missing_approved_caption_burnin_runtime_path` |',
    '| FFprobe metadata JSON | `not_created` | `not_created` | `not_run_runtime_path_blocked` |',
  ].join('\n')
}

function docsFor(bundle: TrackaCaptionBurninBundle): Record<string, string> {
  const sidecarStatus = bundle.sidecar.created ? 'created' : 'not_created'
  const execution = bundle.summary.execution
  const runtimeBlocker = bundle.runtimeResolution.rejectedCandidateReason

  return {
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.execution]: `# TRACKA-CAPTION-QUALITY-3R2 Burn-In Revalidation With Approved Source

Status: \`${execution}\`

## Execution

Run ID: \`${bundle.runId}\`

Execution: \`${execution}\`

Confirmation env: \`${TRACKA_CAPTION_BURNIN_CONFIRM_ENV}=true\`

confirmationProvided: ${bool(bundle.summary.confirmationProvided)}

approvedSourceRef: \`${bundle.summary.approvedSourceRef}\`

sourceRefApproved: ${bool(bundle.summary.sourceRefApproved)}

captionBurninRevalidationExecuted: ${bool(bundle.summary.captionBurninRevalidationExecuted)}

correctedCaptionVisualPreviewCreated: ${bool(bundle.summary.correctedCaptionVisualPreviewCreated)}

assSidecarCreated: ${bool(bundle.summary.assSidecarCreated)}

libassBurninExecuted: ${bool(bundle.summary.libassBurninExecuted)}

remotionPreviewExecuted: ${bool(bundle.summary.remotionPreviewExecuted)}

ffmpegValidationExecuted: ${bool(bundle.summary.ffmpegValidationExecuted)}

ffprobeValidationExecuted: ${bool(bundle.summary.ffprobeValidationExecuted)}

privateArtifactsCreated: ${bool(bundle.summary.privateArtifactsCreated)}

privateVisualArtifactsCreated: ${bool(bundle.summary.privateVisualArtifactsCreated)}

gcsAccess: ${bool(bundle.summary.gcsAccess)}

signedUrlsCreated: ${bool(bundle.summary.signedUrlsCreated)}

publicArtifactsCreated: ${bool(bundle.summary.publicArtifactsCreated)}

finalDeliveryReady: ${bool(bundle.summary.finalDeliveryReady)}

internalBetaReady: ${bool(bundle.summary.internalBetaReady)}

productionReady: ${bool(bundle.summary.productionReady)}

externalBetaReady: ${bool(bundle.summary.externalBetaReady)}

## Source-Of-Truth Audit

${sourceChainTable()}

## Result

The guarded run used inline confirmation, loaded the #452 approved private source-ref contract, and created a corrected ASS sidecar from the approved #426 controlled-test caption source. It then failed closed before media processing because no approved local caption burn-in runtime path is present in this environment.

Exact blocker: \`blocked_missing_approved_caption_burnin_runtime_path\`

Runtime blocker summary: ${runtimeBlocker}

No source GCS copy/download, libass, FFmpeg, FFprobe, Remotion, Supabase, signed URL, public artifact, final delivery, internal beta, external beta, or production action ran.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.approvedSource]: `# TRACKA-CAPTION-QUALITY-3R2 Approved Source Input

Status: \`${bundle.approvedSourceRef.status}\`

sourceRefApproved: ${bool(bundle.approvedSourceRef.sourceRefApproved)}

approvedSourceRef: \`${bundle.approvedSourceRef.ref}\`

metadataEvidencePath: \`${bundle.approvedSourceRef.metadataEvidencePath}\`

## #452 Metadata

${metadataTable()}

## Source Rules

- exact private \`gs://\` object only.
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
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.sidecar]: `# TRACKA-CAPTION-QUALITY-3R2 Corrected ASS Sidecar

Status: \`${sidecarStatus}\`

## Approved Caption Source

captionSourceType: \`controlled_test_caption_copy\`

transcriptAccuracyClaim: \`false\`

captionTextQualityForControlledTest: \`pass\`

captionVisualBurnInRevalidationRequired: \`true\`

## Corrected Caption Lines

${captionLinesList()}

## Sidecar Artifact

localSidecarPath: \`${bundle.sidecar.localPath ?? 'not_created'}\`

sidecarSha256: \`${bundle.sidecar.sha256 ?? 'not_created'}\`

sidecarSizeBytes: \`${bundle.sidecar.sizeBytes ?? 'not_created'}\`

lineCount: \`${bundle.sidecar.lineCount}\`

oldAwkwardCaptionRejected: \`true\`

## Handling Rule

The sidecar is a private local review artifact for guarded revalidation only. It is not a transcript accuracy claim, public caption, final delivery caption, signed URL source-of-truth, internal beta unlock, external beta unlock, or production artifact.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.artifactManifest]: `# TRACKA-CAPTION-QUALITY-3R2 Private Artifact Manifest

Status: \`${execution}\`

## Local Bundle

localBundlePath: \`${bundle.localBundlePath}\`

privateArtifactsCreated: ${bool(bundle.summary.privateArtifactsCreated)}

privateVisualArtifactsCreated: ${bool(bundle.summary.privateVisualArtifactsCreated)}

gcsAccess: ${bool(bundle.summary.gcsAccess)}

signedUrlsCreated: ${bool(bundle.summary.signedUrlsCreated)}

publicArtifactsCreated: ${bool(bundle.summary.publicArtifactsCreated)}

## Artifacts

${artifactRows(bundle)}

## Blocker

\`blocked_missing_approved_caption_burnin_runtime_path\`: ${runtimeBlocker}

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.qaReport]: `# TRACKA-CAPTION-QUALITY-3R2 QA Report

Status: \`${execution}\`

## QA Gates

${qaTable(bundle)}

## Required Follow-Up

Corrected-caption visual review remains blocked until a review-safe corrected-caption preview exists.

TRACKA-CAPTION-QUALITY-4 readiness: \`${bundle.summary.trackaCaptionQuality4Readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`${bundle.summary.trackaPrivateE2eRevalidation1Readiness}\`

Internal beta readiness: \`${bundle.summary.internalBetaReadiness}\`

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.ffprobe]: `# TRACKA-CAPTION-QUALITY-3R2 FFprobe Validation

Status: \`not_run_runtime_path_blocked\`

ffprobeValidationExecuted: false

ffmpegValidationExecuted: false

privatePreviewArtifact: \`not_created\`

Reason: \`blocked_missing_approved_caption_burnin_runtime_path\`

No FFprobe command ran because no corrected-caption preview was generated.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.localBundle]: `# TRACKA-CAPTION-QUALITY-3R2 Local Review Bundle

Status: \`${bundle.sidecar.created ? 'created_sidecar_and_json_only' : 'not_created'}\`

localBundlePath: \`${bundle.localBundlePath}\`

correctedAssSidecar: \`${bundle.sidecar.localPath ?? 'not_created'}\`

qaReportJson: \`${bundle.qaReportArtifact.localPath ?? 'not_created'}\`

artifactManifestJson: \`${bundle.artifactManifestArtifact.localPath ?? 'not_created'}\`

correctedCaptionPreview: \`not_created\`

localReviewBundleVisualFiles: \`0\`

uploadableVisualFiles: \`0\`

The local bundle contains corrected sidecar/report metadata only. It does not contain a corrected-caption visual preview because execution is blocked by \`blocked_missing_approved_caption_burnin_runtime_path\`.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.uploadInstructions]: `# TRACKA-CAPTION-QUALITY-3R2 Upload-To-Chat Instructions

Status: \`blocked_pending_review_safe_visual_artifact\`

No corrected-caption preview file is available for upload.

## Human Action Required

Do not upload the ASS/JSON files as proof of visual burn-in. They prove the corrected caption contract and fail-closed execution only. A future guarded run must create a corrected-caption preview before TRACKA-CAPTION-QUALITY-4 can record visual outcome.

Do not upload signed URLs, public artifacts, production files, or final delivery exports as source of truth.

## Current Local Files

| File | Upload? | Reason |
| --- | --- | --- |
| corrected ASS sidecar | optional metadata only | proves corrected caption source, but does not prove visual burn-in |
| QA report JSON | optional metadata only | records gate status and blocker |
| artifact manifest JSON | optional metadata only | records no visual artifact was created |
| corrected-caption preview | no | not_created |

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.nextPhase]: `# TRACKA-CAPTION-QUALITY-3R2 Next Phase Plan

Status: \`blocked_pending_review_safe_visual_artifact\`

## Readiness

TRACKA-CAPTION-QUALITY-4 readiness: \`${bundle.summary.trackaCaptionQuality4Readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`${bundle.summary.trackaPrivateE2eRevalidation1Readiness}\`

Internal beta readiness: \`${bundle.summary.internalBetaReadiness}\`

## Next Prompt

\`TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 — Resolve approved caption burn-in runtime path\`

## Required Before TRACKA-CAPTION-QUALITY-4

- approved caption burn-in runtime path with FFmpeg/libass/FFprobe support.
- corrected-caption preview generated from #426 caption source and #452 approved source ref.
- FFprobe/QA metadata for the corrected-caption preview.
- uploadable review-safe visual artifact or direct representative frames/video.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.activationResults]: `# Activation Phase TRACKA-CAPTION-QUALITY-3R2 Results

Branch: \`${TRACKA_CAPTION_BURNIN_BRANCH}\`

PR title: \`${TRACKA_CAPTION_BURNIN_PR_TITLE}\`

Base: \`origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration\` at or after #452 merge \`422bbcade670646963257f5b7b2ddc6681748f0b\`

Patch type: Track A corrected-caption burn-in revalidation with approved private source ref.

Run ID: \`${bundle.runId}\`

Execution: \`${execution}\`

## Source-Of-Truth Audit

${sourceChainTable()}

## Approved Source Ref

approvedSourceRef: \`${bundle.summary.approvedSourceRef}\`

sourceRefApproved: ${bool(bundle.summary.sourceRefApproved)}

## Approved Caption Source

captionSourceType: \`controlled_test_caption_copy\`

transcriptAccuracyClaim: \`false\`

captionTextQualityForControlledTest: \`pass\`

captionVisualBurnInRevalidationRequired: \`true\`

Corrected controlled-test caption copy:

${captionLinesList()}

oldAwkwardCaptionRejected: \`true\`

## Execution Results

Corrected ASS sidecar: \`${sidecarStatus}\`

libass burn-in result: \`not_run_runtime_path_blocked\`

Remotion preview result: \`not_run_no_approved_remotion_path\`

FFmpeg/FFprobe validation: \`not_run_runtime_path_blocked\`

Private artifact manifest: \`${TRACKA_CAPTION_BURNIN_DOC_PATHS.artifactManifest}\`

Local review bundle: \`${bundle.sidecar.created ? 'created_sidecar_and_json_only' : 'not_created'}\`

Upload-to-chat instructions: \`${TRACKA_CAPTION_BURNIN_DOC_PATHS.uploadInstructions}\`

## Readiness

TRACKA-CAPTION-QUALITY-4 readiness: \`${bundle.summary.trackaCaptionQuality4Readiness}\`

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
- Evidence docs: TRACKA-CAPTION-QUALITY-3R2 docs packet
- Blockers: blocked_missing_approved_caption_burnin_runtime_path, corrected-caption visual review, private E2E scope decision
- Next Supabase action: none

## Cross-Chat Impact

- Workstream updated: TRACK_A_RENDER_EXPORT
- Other workstreams affected: TRACK_B_MEDIA_PROCESSING, WORKER_RUNTIME_JOBS, COMPLIANCE_SECURITY, OBSERVABILITY_AUDIT_COST
- Contracts changed: corrected caption burn-in revalidation evidence contract only
- Handoff needed: resolve approved runtime path, then rerun 3R2 before TRACKA-CAPTION-QUALITY-4
- Duplicate risk: low; branch is dedicated to TRACKA-CAPTION-QUALITY-3R2
- Next owner/prompt: TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 — Resolve approved caption burn-in runtime path

## Known Limitations

Corrected-caption visual review is not complete. The guarded run created corrected sidecar evidence, then stopped before burn-in because no approved caption burn-in runtime path is available.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.nextPrompt]: `# TRACKA-CAPTION-QUALITY-4 Record Corrected-Caption Burn-In Review Outcome

## Goal

Record the human or AI-assisted review outcome for a corrected-caption burn-in preview generated from TRACKA-CAPTION-QUALITY-3R2.

## Current Source Status

TRACKA-CAPTION-QUALITY-3R2 currently records \`${execution}\`.

Approved #452 source ref: \`${bundle.summary.approvedSourceRef}\`.

Corrected ASS sidecar status: \`${sidecarStatus}\`.

Corrected-caption visual preview status: \`not_created\`.

## Required Inputs

- corrected-caption preview file generated from the #426 controlled-test caption copy and #452 approved source ref.
- QA/FFprobe metadata for that preview.
- checksum and provenance for the corrected ASS sidecar and preview.
- visual review notes confirming whether corrected captions are readable, safe, and free of the rejected #419 caption text.

## Blocked Claims

Do not claim full Track A closure, private E2E closure, internal beta readiness, production readiness, external beta readiness, final delivery readiness, public artifact readiness, signed URL source-of-truth, Supabase mutation, or runtime readiness unless a later approved phase explicitly records those outcomes.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
  }
}

async function writeText(filePath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, contents.endsWith('\n') ? contents : `${contents}\n`)
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
      phase: 'TRACKA-CAPTION-QUALITY-3R2',
      runId: getTrackaCaptionBurninRunId(),
      source: resultPath,
      contents: readFileSync(resultPath, 'utf8'),
    }
  }
  return {
    phase: 'TRACKA-CAPTION-QUALITY-3R2',
    runId: getTrackaCaptionBurninRunId(),
    execution: 'blocked_pending_caption_burnin_execution_confirmation',
  }
}
