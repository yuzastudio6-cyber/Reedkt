import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
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

function qaTable(bundle: TrackaCaptionBurninBundle): string {
  return [
    '| Gate | Status | Evidence |',
    '| --- | --- | --- |',
    ...bundle.qaGates.map((gate) => `| \`${gate.gateId}\` | \`${gate.status}\` | ${gate.evidence} |`),
  ].join('\n')
}

function docsFor(bundle: TrackaCaptionBurninBundle): Record<string, string> {
  const sidecarStatus = bundle.sidecar.created ? 'created' : 'not_created'
  const sidecarPath = bundle.sidecar.localPath ?? 'not_created'
  const sidecarSha = bundle.sidecar.sha256 ?? 'not_created'
  const execution = bundle.summary.execution
  const sourceBlocker = bundle.runtimeResolution.rejectedCandidateReason

  return {
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.execution]: `# TRACKA-CAPTION-QUALITY-3R Burn-In Revalidation Execution

Status: \`${execution}\`

## Execution

Run ID: \`${bundle.runId}\`

Execution: \`${execution}\`

Confirmation env: \`${TRACKA_CAPTION_BURNIN_CONFIRM_ENV}=true\`

confirmationProvided: ${bool(bundle.summary.confirmationProvided)}

captionBurninRevalidationExecuted: ${bool(bundle.summary.captionBurninRevalidationExecuted)}

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

The guarded run used inline confirmation and created a corrected ASS sidecar from the approved #426 controlled-test caption source. It then failed closed before media processing because no clean approved private controlled-test source ref is present in the merged source evidence.

Exact blocker: \`blocked_missing_approved_private_source_ref\`

Source blocker summary: ${sourceBlocker}

No libass, FFmpeg, FFprobe, Remotion, GCS, Supabase, signed URL, public artifact, final delivery, internal beta, external beta, or production action ran.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.sidecar]: `# TRACKA-CAPTION-QUALITY-3R Approved Caption Sidecar

Status: \`${sidecarStatus}\`

## Approved Caption Source

captionSourceType: \`controlled_test_caption_copy\`

transcriptAccuracyClaim: \`false\`

captionTextQualityForControlledTest: \`pass\`

captionVisualBurnInRevalidationRequired: \`true\`

## Corrected Caption Lines

${captionLinesList()}

## Sidecar Artifact

localSidecarPath: \`${sidecarPath}\`

sidecarSha256: \`${sidecarSha}\`

sidecarSizeBytes: \`${bundle.sidecar.sizeBytes ?? 'not_created'}\`

lineCount: \`${bundle.sidecar.lineCount}\`

oldAwkwardCaptionRejected: \`true\`

## Handling Rule

The sidecar is a private local review artifact for guarded revalidation only. It is not a transcript accuracy claim, public caption, final delivery caption, signed URL source-of-truth, internal beta unlock, external beta unlock, or production artifact.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.artifactManifest]: `# TRACKA-CAPTION-QUALITY-3R Private Artifact Manifest

Status: \`${execution}\`

## Local Bundle

localBundlePath: \`${bundle.localBundlePath}\`

privateArtifactsCreated: ${bool(bundle.summary.privateArtifactsCreated)}

privateVisualArtifactsCreated: ${bool(bundle.summary.privateVisualArtifactsCreated)}

gcsAccess: ${bool(bundle.summary.gcsAccess)}

signedUrlsCreated: ${bool(bundle.summary.signedUrlsCreated)}

publicArtifactsCreated: ${bool(bundle.summary.publicArtifactsCreated)}

## Artifacts

| Artifact | Path | SHA-256 | Status |
| --- | --- | --- | --- |
| corrected ASS sidecar | \`${sidecarPath}\` | \`${sidecarSha}\` | \`${sidecarStatus}\` |
| corrected-caption preview | none | none | blocked_missing_approved_private_source_ref |
| FFprobe metadata JSON | none | none | not_run_source_ref_blocked |
| QA report JSON | \`${bundle.localBundlePath}/tracka-caption-quality-3r-qa-report.json\` | recorded locally if execution command ran | metadata_only |

## Blocker

\`blocked_missing_approved_private_source_ref\`: ${sourceBlocker}

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.qaReport]: `# TRACKA-CAPTION-QUALITY-3R QA Report

Status: \`${execution}\`

## QA Gates

${qaTable(bundle)}

## Required Follow-Up

Corrected-caption visual review remains blocked until a clean approved private source sample is supplied and a review-safe corrected-caption preview is generated.

TRACKA-CAPTION-QUALITY-4 readiness: \`${bundle.summary.trackaCaptionQuality4Readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`${bundle.summary.trackaPrivateE2eRevalidation1Readiness}\`

Internal beta readiness: \`${bundle.summary.internalBetaReadiness}\`

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.ffprobe]: `# TRACKA-CAPTION-QUALITY-3R FFprobe Validation

Status: \`not_run_source_ref_blocked\`

ffprobeValidationExecuted: false

ffmpegValidationExecuted: false

privatePreviewArtifact: \`not_created\`

Reason: \`blocked_missing_approved_private_source_ref\`

No FFprobe command ran because there is no approved clean private source/ref-produced corrected-caption preview to validate.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.localBundle]: `# TRACKA-CAPTION-QUALITY-3R Local Review Bundle

Status: \`${bundle.sidecar.created ? 'created_sidecar_only' : 'not_created'}\`

localBundlePath: \`${bundle.localBundlePath}\`

correctedAssSidecar: \`${sidecarPath}\`

correctedCaptionPreview: \`not_created\`

localReviewBundleVisualFiles: \`0\`

uploadableVisualFiles: \`0\`

The local bundle contains only corrected sidecar/report metadata when the guarded command is run. It does not contain a corrected-caption visual preview because execution is blocked by \`blocked_missing_approved_private_source_ref\`.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.uploadInstructions]: `# TRACKA-CAPTION-QUALITY-3R Upload-To-Chat Instructions

Status: \`blocked_pending_review_safe_visual_artifact\`

No corrected-caption preview file is available for upload.

## Human Action Required

Provide an approved clean private controlled-test source ref or a review-safe source sample that does not already contain the rejected #419 caption text, then rerun guarded TRACKA-CAPTION-QUALITY-3R execution.

Do not upload signed URLs, public artifacts, production files, or final delivery exports as source of truth.

## Current Local Files

| File | Upload? | Reason |
| --- | --- | --- |
| corrected ASS sidecar | optional metadata only | proves corrected caption source, but does not prove visual burn-in |
| corrected-caption preview | no | not_created |

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.nextPhase]: `# TRACKA-CAPTION-QUALITY-3R Next Phase Plan

Status: \`blocked_pending_review_safe_visual_artifact\`

## Readiness

TRACKA-CAPTION-QUALITY-4 readiness: \`${bundle.summary.trackaCaptionQuality4Readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`${bundle.summary.trackaPrivateE2eRevalidation1Readiness}\`

Internal beta readiness: \`${bundle.summary.internalBetaReadiness}\`

## Next Prompt

\`TRACKA-CAPTION-QUALITY-4 — Record corrected-caption burn-in review outcome\`

## Required Before TRACKA-CAPTION-QUALITY-4

- clean approved private source/sample ref that does not contain the rejected #419 caption text.
- corrected-caption preview generated from #426 caption source.
- FFprobe/QA metadata for the corrected-caption preview.
- uploadable review-safe visual artifact or direct representative frames/video.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.activationResults]: `# Activation Phase TRACKA-CAPTION-QUALITY-3R Results

Branch: \`${TRACKA_CAPTION_BURNIN_BRANCH}\`

PR title: \`${TRACKA_CAPTION_BURNIN_PR_TITLE}\`

Base: \`origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration\` at or after #443 merge \`e268a9e8afd5360df91653e9d2c060c05e270e43\`

Patch type: Track A corrected-caption burn-in revalidation execution.

Run ID: \`${bundle.runId}\`

Execution: \`${execution}\`

## Source-Of-Truth Audit

${sourceChainTable()}

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

libass burn-in result: \`not_run_source_ref_blocked\`

Remotion preview result: \`not_run_source_ref_blocked\`

FFmpeg/FFprobe validation: \`not_run_source_ref_blocked\`

Private artifact manifest: \`${TRACKA_CAPTION_BURNIN_DOC_PATHS.artifactManifest}\`

Local review bundle: \`${bundle.sidecar.created ? 'created_sidecar_only' : 'not_created'}\`

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
- Evidence docs: TRACKA-CAPTION-QUALITY-3R docs packet
- Blockers: blocked_missing_approved_private_source_ref, corrected-caption visual review, private E2E scope decision
- Next Supabase action: none

## Cross-Chat Impact

- Workstream updated: TRACK_A_RENDER_EXPORT
- Other workstreams affected: TRACK_B_MEDIA_PROCESSING, WORKER_RUNTIME_JOBS, COMPLIANCE_SECURITY, OBSERVABILITY_AUDIT_COST
- Contracts changed: corrected caption burn-in revalidation evidence contract only
- Handoff needed: TRACKA-CAPTION-QUALITY-4 after a review-safe corrected-caption visual artifact exists
- Duplicate risk: low; branch is dedicated to TRACKA-CAPTION-QUALITY-3R
- Next owner/prompt: TRACKA-CAPTION-QUALITY-4 — Record corrected-caption burn-in review outcome

## Known Limitations

Corrected-caption visual review is not complete. The guarded run created corrected sidecar evidence, then stopped before burn-in because no clean approved private source ref is available.

## No-Scope Statement

${TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT}
`,
    [TRACKA_CAPTION_BURNIN_DOC_PATHS.nextPrompt]: `# TRACKA-CAPTION-QUALITY-4 Record Corrected-Caption Burn-In Review Outcome

## Goal

Record the human or AI-assisted review outcome for a corrected-caption burn-in preview generated from TRACKA-CAPTION-QUALITY-3R.

## Current Source Status

TRACKA-CAPTION-QUALITY-3R currently records \`${execution}\`.

Corrected ASS sidecar status: \`${sidecarStatus}\`.

Corrected-caption visual preview status: \`not_created\`.

## Required Inputs

- corrected-caption preview file generated from the #426 controlled-test caption copy.
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

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

export async function writeTrackaCaptionBurninArtifacts(bundle: TrackaCaptionBurninBundle): Promise<void> {
  const docs = docsFor(bundle)
  for (const [filePath, contents] of Object.entries(docs)) {
    await writeText(filePath, contents)
  }

  if (bundle.sidecar.created) {
    await writeJson(path.join(bundle.localBundlePath, 'tracka-caption-quality-3r-qa-report.json'), {
      phase: 'TRACKA-CAPTION-QUALITY-3R',
      runId: bundle.runId,
      execution: bundle.summary.execution,
      qaGates: bundle.qaGates,
      noScopeStatement: TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT,
    })
    await writeJson(path.join(bundle.localBundlePath, 'tracka-caption-quality-3r-artifact-manifest.json'), {
      phase: 'TRACKA-CAPTION-QUALITY-3R',
      runId: bundle.runId,
      sidecar: bundle.sidecar,
      runtimeResolution: bundle.runtimeResolution,
      noPublicArtifacts: true,
      noSignedUrls: true,
      noFinalDelivery: true,
    })
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
      phase: 'TRACKA-CAPTION-QUALITY-3R',
      runId: getTrackaCaptionBurninRunId(),
      source: resultPath,
      contents: readFileSync(resultPath, 'utf8'),
    }
  }
  return {
    phase: 'TRACKA-CAPTION-QUALITY-3R',
    runId: getTrackaCaptionBurninRunId(),
    execution: 'blocked_pending_caption_burnin_execution_confirmation',
  }
}
