import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const candidate =
  'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')
}

const runId = process.env.REEDITPRO_TRACKA_CAPTION_SOURCE_REF_1R_ID || `tracka-caption-source-ref-1r-${timestamp()}`
const noScope =
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.'

function rejectCandidate(ref) {
  if (!ref.startsWith('gs://')) return 'blocked_not_private'
  if (ref.includes('*') || ref.endsWith('/')) return 'blocked_missing_exact_object'
  if (/https?:\/\//i.test(ref)) return 'blocked_not_private'
  if (/signature=|x-goog-signature|signed/i.test(ref)) return 'blocked_not_private'
  if (!ref.includes('/activation-real-video/phase32/')) return 'blocked_non_tracka_ref'
  if (!/\.(mp4|mov|webm)$/i.test(ref)) return 'blocked_not_visual_source'
  return null
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return 'not_reported'
}

function parseMetadata(output) {
  return {
    uri: candidate,
    size: firstMatch(output, [/Content-Length:\s*([^\n]+)/i, /Size:\s*([^\n]+)/i]),
    contentType: firstMatch(output, [/Content-Type:\s*([^\n]+)/i]),
    generation: firstMatch(output, [/Generation:\s*([^\n]+)/i]),
    metageneration: firstMatch(output, [/Metageneration:\s*([^\n]+)/i]),
    storageClass: firstMatch(output, [/Storage class:\s*([^\n]+)/i, /Storage-Class:\s*([^\n]+)/i]),
    updated: firstMatch(output, [/Update time:\s*([^\n]+)/i, /Updated:\s*([^\n]+)/i]),
    crc32c: firstMatch(output, [/Hash \(crc32c\):\s*([^\n]+)/i, /crc32c_hash:\s*([^\n]+)/i]),
    md5: firstMatch(output, [/Hash \(md5\):\s*([^\n]+)/i, /md5_hash:\s*([^\n]+)/i]),
  }
}

function classifyFailure(stderr, stdout) {
  const text = `${stderr}\n${stdout}`
  if (/denied|forbidden|permission|unauthorized|not authorized/i.test(text)) return 'blocked_access_denied'
  if (/not found|no urls matched|not exist|404/i.test(text)) return 'blocked_missing_exact_object'
  return 'blocked_metadata_check_failed'
}

function metadataRows(metadata) {
  return [
    ['objectUri', metadata.uri],
    ['size', metadata.size],
    ['contentType', metadata.contentType],
    ['generation', metadata.generation],
    ['metageneration', metadata.metageneration],
    ['storageClass', metadata.storageClass],
    ['updated', metadata.updated],
    ['crc32c', metadata.crc32c],
    ['md5', metadata.md5],
  ]
    .map(([key, value]) => `| ${key} | \`${value}\` |`)
    .join('\n')
}

function docsFor(result) {
  const approved = result.approvedPrivateSourceRefStatus === 'approved'
  const status = result.approvedPrivateSourceRefStatus
  const selected = approved ? candidate : 'none_approved'
  const readiness = approved
    ? 'ready_for_guarded_execution_with_approved_private_source_ref'
    : `blocked_${result.blocker}`
  const metadataEvidence = result.metadata
    ? `\n## Metadata Summary\n\n| field | value |\n| --- | --- |\n${metadataRows(result.metadata)}\n`
    : '\n## Metadata Summary\n\nNo object metadata is recorded because the metadata check did not approve the candidate.\n'

  return {
    'docs/track-a/track-a-caption-source-ref-1.md': `# TRACKA-CAPTION-SOURCE-REF-1 Approved Private Controlled-Test Source Ref Resolution

Status: \`${status}\`

Patch type: Track A approved private controlled-test source ref resolution.

Branch: \`codex/rp-tracka-caption-source-ref-1-approved-private-source\`

Base: \`ce4b2feac22247581ba361e71df33feb1e667507\`

Run ID: \`${runId}\`

## Purpose

TRACKA-CAPTION-QUALITY-3R created a corrected ASS sidecar from the approved #426 controlled-test caption copy, then failed closed before burn-in because no clean approved private controlled-test source ref was recorded.

This packet resolves the source-ref contract only. It records the preferred candidate, rejects unsafe source candidates, and records an exact metadata/stat result for the preferred candidate when explicitly confirmed.

## Source-Of-Truth Audit

| Source | Status | Evidence |
| --- | --- | --- |
| #447 | merged at \`ce4b2feac22247581ba361e71df33feb1e667507\` | records \`blocked_missing_approved_private_source_ref\` |
| #443 | merged | guarded burn-in packet ready for 3R |
| #426 | merged | approved controlled-test caption copy; \`transcriptAccuracyClaim: false\` |
| #429 | merged | missing visual evidence bundle; review artifacts only |
| #434 | merged | missing visual evidence review outcome; partial pass with warnings |
| #67, #75, #77, #80, #82 | historical/open evidence | cite the approved Phase 32 private source/export ref |

## Source Ref Resolution

approvedPrivateSourceRefStatus: \`${status}\`

selectedCandidate: \`${selected}\`

preferredCandidate: \`${candidate}\`

metadataConfirmationRequired: \`REEDITPRO_CONFIRM_TRACKA_CAPTION_SOURCE_REF_CHECK=true\`

metadataConfirmationCurrentState: \`${result.confirmationState}\`

metadataCheckExecuted: ${result.metadataCheckExecuted}

gcsAccess: \`${result.gcsAccess}\`

gcloudExecuted: ${result.gcloudExecuted}

sourceRefApproved: ${approved}

blocker: \`${result.blocker}\`
${metadataEvidence}
## Requirements

- exact private \`gs://\` object ref.
- controlled Track A sample source.
- not public.
- not a signed URL.
- not final delivery source-of-truth.
- not arbitrary user media.
- not old-caption-burned output if used as caption source.
- suitable for future corrected-caption private revalidation.
- bounded size and duration.
- provenance recorded.
- checksum status known or future-required.

## Decision

The Phase 32 color-corrected private export is the preferred candidate because it is repeatedly cited as the approved Phase 32 source in #67, #75, #77, #80, and #82.

TRACKA-CAPTION-QUALITY-3R2 readiness: \`${readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

Internal beta readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-source-ref-candidate-matrix.md': `# TRACKA-CAPTION-SOURCE-REF-1 Candidate Matrix

Status: \`${status}\`

## Candidate Matrix

| candidateId | source PRs | ref | classification | decision | rationale |
| --- | --- | --- | --- | --- | --- |
| \`phase32_color_corrected_source_export\` | #67, #75, #77, #80, #82 | \`${candidate}\` | exact private \`gs://\` object candidate | \`${approved ? 'approved_after_metadata_stat' : status}\` | repeatedly cited as the approved Phase 32 source; metadata/stat result recorded in this packet |
| \`phase45a_libass_burnin_preview\` | #75, #77, #429 | \`gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4\` | old-caption rendered output | \`rejected_old_caption_burned_output\` | already contains historical caption burn-in evidence and must not be used as corrected-caption source |
| \`phase45b_remotion_render_preview\` | #75, #77, #429 | \`gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4\` | old-caption rendered output | \`rejected_old_caption_burned_output\` | rendered preview evidence, not a clean source sample |
| \`phase45d_hardened_review_export\` | #80, #82, #429 | \`gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4\` | old-caption/private review export | \`rejected_old_caption_burned_output\` | review export evidence, not a clean corrected-caption source input |
| \`phase45c_otio_timeline\` | #77, #429 | \`gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json\` | exact nonvisual metadata ref | \`rejected_nonvisual_metadata_ref\` | timeline proof cannot be used as media source |
| \`phase45e_e2e_manifest\` | #82, #429 | \`gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45e/phase45e-20260531T23580/review/e2e-review-manifest.json\` | exact nonvisual metadata ref | \`rejected_nonvisual_metadata_ref\` | manifest proof cannot be used as media source |
| \`phase40d_contact_sheet\` | #68, #429 | \`gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40d/phase40d-20260531T12493/contact-sheet/pro-color-image-feature-contact-sheet.png\` | still review artifact | \`rejected_review_artifact_not_source\` | image contact sheet is visual evidence, not a source video ref |
| \`current_source_bundle_2_visual_files\` | #411, #429 | local copied review files under \`/tmp\` | local review artifacts | \`rejected_local_review_artifacts\` | local review files are not private source refs and must not become source-of-truth |

## Rejection Rules

- old-caption-burned outputs are rejected as source.
- rendered previews are rejected as source.
- final review exports are rejected as source for corrected-caption revalidation unless a later owner explicitly approves them as source inputs; this packet does not.
- nonvisual JSON metadata refs are rejected as source.
- prefix-only refs are rejected until narrowed to an exact object.
- public URLs and signed URLs are rejected.
- arbitrary user media is rejected.

## Candidate Status

approvedPrivateSourceRefStatus: \`${status}\`

preferredCandidate: \`phase32_color_corrected_source_export\`

selectedApprovedCandidate: \`${approved ? 'phase32_color_corrected_source_export' : 'none'}\`

sourceRefApproved: ${approved}

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-source-ref-approval-contract.md': `# TRACKA-CAPTION-SOURCE-REF-1 Approval Contract

Status: \`${status}\`

## Contract

An approved private controlled-test source ref for corrected-caption burn-in revalidation must satisfy all gates below.

| gate | required value | current status |
| --- | --- | --- |
| exact ref | exact private \`gs://\` object ref | ${approved ? 'passed' : 'candidate recorded'} |
| provenance | controlled Track A sample source | candidate provenance recorded from #67/#75/#77/#80/#82 |
| privacy | not public and not signed URL | public and signed URL forms rejected; exact private \`gs://\` candidate only |
| source type | clean source video, not review artifact | Phase 32 source candidate selected; old-caption outputs rejected |
| old caption exclusion | not old-caption-burned output | candidate passes by evidence review; rejected previews remain excluded |
| final delivery boundary | not final delivery source-of-truth | candidate treated as private controlled-test source only |
| arbitrary media boundary | not arbitrary user media | candidate treated as controlled Track A sample only |
| size and duration | bounded for future private revalidation | ${result.metadata?.size ? `metadata size recorded as \`${result.metadata.size}\`` : 'pending metadata confirmation'} |
| checksum | known or future-required | ${result.metadata?.crc32c !== 'not_reported' || result.metadata?.md5 !== 'not_reported' ? 'metadata hash recorded when reported by storage' : 'future-required if storage metadata does not report object hash'} |

## Preferred Candidate

candidateId: \`phase32_color_corrected_source_export\`

sourceRef: \`${candidate}\`

approvalStatus: \`${status}\`

blocker: \`${result.blocker}\`
${metadataEvidence}
## Downstream Contract

TRACKA-CAPTION-QUALITY-3R2 may consume only an approved candidate that passes this contract. TRACKA-CAPTION-QUALITY-3R2 must still run guarded corrected-caption burn-in revalidation separately and must not infer burn-in success from this packet.

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-source-ref-metadata-check-plan.md': `# TRACKA-CAPTION-SOURCE-REF-1 Metadata Check Plan

Status: \`${status}\`

metadataConfirmationCurrentState: \`${result.confirmationState}\`

gcsAccess: \`${result.gcsAccess}\`

metadataCheckExecuted: ${result.metadataCheckExecuted}

gcloudExecuted: ${result.gcloudExecuted}

## Current Run

This run used metadata/stat only for the exact preferred candidate when confirmation was present. It did not copy, download, upload, list broad prefixes, create signed URLs, mutate buckets, mutate IAM, mutate objects, or process media.

Exact metadata command shape:

\`\`\`bash
gcloud storage ls -L ${candidate}
\`\`\`

## Metadata Fields

${result.metadata ? `| field | value |\n| --- | --- |\n${metadataRows(result.metadata)}` : 'No metadata fields were recorded because the candidate was not approved.'}

## Outcomes

| condition | result |
| --- | --- |
| confirmation absent | \`blocked_pending_metadata_confirmation\` |
| exact candidate stat passes | \`approved\` |
| exact candidate access denied | \`blocked_access_denied\` |
| exact candidate missing | \`blocked_missing_exact_object\` |
| metadata command fails | \`blocked_metadata_check_failed\` |
| public, signed-only, prefix-only, or not clean source | \`blocked_no_clean_source_ref\` |

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-source-ref-gap-map.md': `# TRACKA-CAPTION-SOURCE-REF-1 Gap Map

Status: \`${status}\`

## Gaps

| gap | status | resolution |
| --- | --- | --- |
| approved private controlled-test source ref | \`${status}\` | ${approved ? 'Phase 32 source candidate approved for guarded 3R2 input' : `blocked by \`${result.blocker}\``} |
| corrected-caption burn-in revalidation | \`${readiness}\` | run TRACKA-CAPTION-QUALITY-3R2 after source approval |
| corrected-caption visual review | \`blocked_pending_review_safe_visual_artifact\` | record result after guarded burn-in creates review-safe artifact |
| private E2E revalidation | \`blocked_pending_caption_burnin_visual_review_and_scope_decision\` | wait for caption burn-in review and scope decision |
| internal beta readiness | \`blocked_pending_caption_burnin_visual_review_and_scope_decision\` | no unlock in this phase |

## Still Blocked Scope

- libass burn-in execution.
- FFmpeg/FFprobe execution.
- Remotion execution.
- Track A runtime.
- media processing.
- GCS copy/download/listing.
- signed URLs.
- public artifacts.
- Supabase mutation.
- SQL.
- internal beta.
- external beta.
- production.
- final delivery.

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-source-ref-next-phase-plan.md': `# TRACKA-CAPTION-SOURCE-REF-1 Next Phase Plan

Status: \`${status}\`

## Readiness

TRACKA-CAPTION-QUALITY-3R2 readiness: \`${readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

Internal beta readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

Production/external beta/final delivery: \`blocked\`

## Next Prompt

\`TRACKA-CAPTION-QUALITY-3R2 — Burn-in revalidation execution with approved private source ref\`

## Required Before 3R2

1. Confirm TRACKA-CAPTION-SOURCE-REF-1 selected an approved exact private source ref.
2. Pass the exact source ref and metadata evidence into TRACKA-CAPTION-QUALITY-3R2.
3. Run guarded corrected-caption burn-in only with its own future explicit confirmation.
4. Keep internal beta blocked until caption burn-in visual review and remaining scope decisions are complete.

## No-Scope Statement

${noScope}
`,
    'docs/activation-phase-tracka-caption-source-ref-1-results.md': `# Activation Phase TRACKA-CAPTION-SOURCE-REF-1 Results

Branch: \`codex/rp-tracka-caption-source-ref-1-approved-private-source\`

PR title: \`[track-a] Approved private caption source ref\`

Base: \`origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration\` at #447 merge \`ce4b2feac22247581ba361e71df33feb1e667507\`

Patch type: Track A approved private controlled-test source ref resolution.

Run ID: \`${runId}\`

## Result

approvedPrivateSourceRefStatus: \`${status}\`

selectedCandidate: \`${selected}\`

preferredCandidate: \`${candidate}\`

metadataConfirmationRequired: \`REEDITPRO_CONFIRM_TRACKA_CAPTION_SOURCE_REF_CHECK=true\`

metadataConfirmationCurrentState: \`${result.confirmationState}\`

metadataCheckExecuted: ${result.metadataCheckExecuted}

gcsAccess: \`${result.gcsAccess}\`

gcloudExecuted: ${result.gcloudExecuted}

signedUrlsCreated: false

publicArtifactsCreated: false

sourceRefApproved: ${approved}

blocker: \`${result.blocker}\`
${metadataEvidence}
## Source-Of-Truth

#447 is merged at \`ce4b2feac22247581ba361e71df33feb1e667507\` and records \`blocked_missing_approved_private_source_ref\`.

The preferred candidate is recorded because it appears as the approved Phase 32 source in #67, #75, #77, #80, and #82.

Old-caption-burned outputs are rejected as source inputs, including Phase 45A libass preview, Phase 45B Remotion preview, and Phase 45D hardened review export.

## Validation

Validation commands are recorded in the PR body after implementation.

## Supabase Update Classification

- Supabase update required: docs/status only
- Supabase update status: docs_only
- Supabase environment touched: none
- SQL executed: none
- Migration deployed: no
- Next Supabase action: none

## Readiness

TRACKA-CAPTION-QUALITY-3R2 readiness: \`${readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

Internal beta readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

Production/external beta/final delivery: \`blocked\`

## No-Scope Statement

${noScope}
`,
    'docs/implementation-prompts/prompt-tracka-caption-quality-3r2-burnin-revalidation-execution.md': `# TRACKA-CAPTION-QUALITY-3R2 — Burn-In Revalidation Execution With Approved Private Source Ref

## Summary

Run this prompt only after TRACKA-CAPTION-SOURCE-REF-1 records an approved private controlled-test source ref. If source ref status is still \`blocked_pending_metadata_confirmation\`, \`blocked_access_denied\`, \`blocked_missing_exact_object\`, \`blocked_metadata_check_failed\`, or \`blocked_no_clean_source_ref\`, stop and report the blocker.

## Required Inputs

- Approved private source ref from TRACKA-CAPTION-SOURCE-REF-1.
- #426 approved controlled-test caption copy.
- #447 corrected ASS sidecar evidence and fail-closed execution result.
- Metadata confirmation evidence for the source ref.

## Approved Source Ref Status

approvedPrivateSourceRefStatus: \`${status}\`

selectedCandidate: \`${selected}\`

sourceRefApproved: ${approved}

TRACKA-CAPTION-QUALITY-3R2 readiness: \`${readiness}\`

## Execution Boundary

TRACKA-CAPTION-QUALITY-3R2 may run guarded corrected-caption burn-in only after a separate explicit confirmation is provided. It must not use old-caption-burned outputs as source inputs.

Blocked unless explicitly confirmed:

- libass execution.
- FFmpeg/FFprobe execution.
- Remotion execution.
- Track A runtime.
- GCS read/copy/download.
- signed URLs.
- public artifacts.
- Supabase mutation.
- SQL.
- internal beta.
- external beta.
- production.
- final delivery.

## Source Ref Rules

The source ref must be exact, private, controlled Track A provenance, not public, not signed, not arbitrary user media, not old-caption-burned output, and suitable for corrected-caption private revalidation.

Preferred candidate from TRACKA-CAPTION-SOURCE-REF-1:

\`${candidate}\`

## No-Scope Statement

${noScope}
`,
  }
}

function writeDocs(result) {
  mkdirSync('docs/track-a', { recursive: true })
  mkdirSync('docs/implementation-prompts', { recursive: true })
  for (const [file, content] of Object.entries(docsFor(result))) {
    writeFileSync(file, content)
  }
}

const wantsMetadata = process.argv.includes('--check-metadata')
const confirmed = process.env.REEDITPRO_CONFIRM_TRACKA_CAPTION_SOURCE_REF_CHECK === 'true'

let result = {
  approvedPrivateSourceRefStatus: 'blocked_pending_metadata_confirmation',
  confirmationState: confirmed ? 'true' : 'absent_or_not_true',
  metadataCheckExecuted: false,
  gcsAccess: 'none',
  gcloudExecuted: false,
  sourceRefApproved: false,
  blocker: 'blocked_pending_metadata_confirmation',
  metadata: null,
}

const localRejection = rejectCandidate(candidate)
if (localRejection) {
  result = {
    ...result,
    approvedPrivateSourceRefStatus: localRejection,
    blocker: localRejection,
  }
} else if (wantsMetadata && confirmed) {
  const stat = spawnSync('gcloud', ['storage', 'ls', '-L', candidate], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  if (stat.status === 0) {
    result = {
      approvedPrivateSourceRefStatus: 'approved',
      confirmationState: 'true',
      metadataCheckExecuted: true,
      gcsAccess: 'metadata_stat_only',
      gcloudExecuted: true,
      sourceRefApproved: true,
      blocker: 'none',
      metadata: parseMetadata(stat.stdout),
    }
  } else {
    const blocker = classifyFailure(stat.stderr, stat.stdout)
    result = {
      ...result,
      approvedPrivateSourceRefStatus: blocker,
      confirmationState: 'true',
      metadataCheckExecuted: true,
      gcsAccess: 'metadata_stat_only_attempted',
      gcloudExecuted: true,
      blocker,
    }
  }
}

writeDocs(result)

console.log(JSON.stringify({
  status: result.approvedPrivateSourceRefStatus === 'approved' ? 'completed_metadata_confirmation' : 'blocked',
  phase: 'TRACKA-CAPTION-SOURCE-REF-1R',
  preferredCandidate: candidate,
  approvedPrivateSourceRefStatus: result.approvedPrivateSourceRefStatus,
  sourceRefApproved: result.sourceRefApproved,
  metadataCheckExecuted: result.metadataCheckExecuted,
  gcsAccess: result.gcsAccess,
  blocker: result.blocker,
}, null, 2))
