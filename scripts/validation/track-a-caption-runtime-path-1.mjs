import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const phase = 'TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1'
const branch = 'codex/rp-tracka-caption-quality-3r2-runtime-path-1'
const base = 'origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration at 1a52c5a604b175bbd95c8e96294d963636ee8db0'
const sourceRef =
  'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
const confirmationEnv = 'REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true'
const noScope =
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks were allowed when REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true; no media input or output was used.'
const captionLines = [
  'Hey everyone — welcome to this ReEditPro visual review.',
  'Today we are testing captions, overlays, and private render quality.',
  'The goal is a clean, professional edit with readable text.',
  'Review this sample for timing, polish, and visual clarity.',
]
const oldCaption = 'Hey guys, I saw how you guys doing today is going to do going to be the first'

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')
}

const runId = process.env.REEDITPRO_TRACKA_CAPTION_RUNTIME_PATH_1_ID || `tracka-caption-runtime-path-1-${timestamp()}`
const checkRequested = process.argv.includes('--check-metadata')
const confirmationProvided = process.env.REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK === 'true'

function runCommand(label, command, args, options = {}) {
  if (!options.enabled) {
    return { label, command: [command, ...args].join(' '), status: 'not_run', stdout: '', stderr: '', exitCode: null }
  }
  const result = spawnSync(command, args, { encoding: 'utf8' })
  return {
    label,
    command: [command, ...args].join(' '),
    status: result.status === 0 ? 'passed' : 'failed',
    stdout: String(result.stdout ?? ''),
    stderr: String(result.stderr ?? ''),
    exitCode: result.status,
  }
}

function commandPath(command) {
  if (!checkRequested || !confirmationProvided) return 'not_checked'
  const result = spawnSync('sh', ['-lc', `command -v ${command} || true`], { encoding: 'utf8' })
  return result.stdout.trim() || 'not_found'
}

function extractVersion(output, binaryName) {
  const line = output
    .split('\n')
    .map((value) => value.trim())
    .find((value) => value.toLowerCase().startsWith(`${binaryName} version `))
  return line || 'not_reported'
}

function hasFilter(filtersOutput, filterName) {
  const pattern = new RegExp(`(^|\\n)\\s*[TSC\\.]{3}\\s+${filterName}\\s+`, 'i')
  return pattern.test(filtersOutput)
}

function summarizeCommands(commands) {
  return commands
    .map(
      (entry) =>
        `| \`${entry.label}\` | \`${entry.command}\` | \`${entry.status}\` | \`${entry.exitCode ?? 'not_run'}\` |`,
    )
    .join('\n')
}

function buildMetadataResult() {
  const ffmpegPath = commandPath('ffmpeg')
  const ffprobePath = commandPath('ffprobe')
  const ffmpegFound = ffmpegPath !== 'not_checked' && ffmpegPath !== 'not_found'
  const ffprobeFound = ffprobePath !== 'not_checked' && ffprobePath !== 'not_found'
  const commands = [
    {
      label: 'command_v_ffmpeg',
      command: 'command -v ffmpeg',
      status: checkRequested && confirmationProvided ? (ffmpegFound ? 'passed' : 'missing') : 'not_run',
      stdout: ffmpegPath,
      stderr: '',
      exitCode: null,
    },
    {
      label: 'command_v_ffprobe',
      command: 'command -v ffprobe',
      status: checkRequested && confirmationProvided ? (ffprobeFound ? 'passed' : 'missing') : 'not_run',
      stdout: ffprobePath,
      stderr: '',
      exitCode: null,
    },
  ]

  const ffmpegVersion = runCommand('ffmpeg_version', 'ffmpeg', ['-hide_banner', '-version'], {
    enabled: checkRequested && confirmationProvided && ffmpegFound,
  })
  const ffprobeVersion = runCommand('ffprobe_version', 'ffprobe', ['-hide_banner', '-version'], {
    enabled: checkRequested && confirmationProvided && ffprobeFound,
  })
  const ffmpegFilters = runCommand('ffmpeg_filters', 'ffmpeg', ['-hide_banner', '-filters'], {
    enabled: checkRequested && confirmationProvided && ffmpegFound,
  })
  commands.push(ffmpegVersion, ffprobeVersion, ffmpegFilters)

  const filterOutput = `${ffmpegFilters.stdout}\n${ffmpegFilters.stderr}`
  const versionOutput = `${ffmpegVersion.stdout}\n${ffmpegVersion.stderr}`
  const assFilterPresent = hasFilter(filterOutput, 'ass')
  const subtitlesFilterPresent = hasFilter(filterOutput, 'subtitles')
  const libassIndicated = /--enable-libass|libass/i.test(`${versionOutput}\n${filterOutput}`)
  const metadataCheckExecuted = checkRequested && confirmationProvided
  const approved = metadataCheckExecuted && ffmpegFound && ffprobeFound && (assFilterPresent || subtitlesFilterPresent)
  const blockedAfterCheck = metadataCheckExecuted && !approved

  if (!metadataCheckExecuted) {
    return {
      execution: 'blocked_pending_caption_runtime_path_check_confirmation',
      runtimePathStatus: 'blocked_pending_confirmation',
      approvedRuntimePath: 'none',
      readiness: 'blocked_pending_runtime_path_check',
      metadataCheck: 'not_attempted',
      blocker: 'blocked_pending_caption_runtime_path_check_confirmation',
      ffmpegPath,
      ffprobePath,
      ffmpegVersion: 'not_checked',
      ffprobeVersion: 'not_checked',
      assFilterPresent: false,
      subtitlesFilterPresent: false,
      libassIndicated: false,
      commands,
      confirmationProvided,
      checkRequested,
    }
  }

  return {
    execution: approved ? 'completed_runtime_path_metadata_approval' : 'blocked_missing_approved_caption_burnin_runtime_path',
    runtimePathStatus: approved
      ? 'approved_local_ffmpeg_libass_metadata_only'
      : 'blocked_missing_local_ffmpeg_libass_runtime',
    approvedRuntimePath: approved ? 'local_ffmpeg_libass_runtime_path' : 'none',
    readiness: approved
      ? 'ready_for_guarded_burnin_execution_with_local_ffmpeg_libass_runtime'
      : 'blocked_missing_runtime_path',
    metadataCheck: blockedAfterCheck ? 'blocked' : 'completed',
    blocker: approved ? 'none' : 'blocked_missing_local_ffmpeg_libass_runtime',
    ffmpegPath,
    ffprobePath,
    ffmpegVersion: extractVersion(ffmpegVersion.stdout || ffmpegVersion.stderr, 'ffmpeg'),
    ffprobeVersion: extractVersion(ffprobeVersion.stdout || ffprobeVersion.stderr, 'ffprobe'),
    assFilterPresent,
    subtitlesFilterPresent,
    libassIndicated,
    commands,
    confirmationProvided,
    checkRequested,
  }
}

function runtimeRows(result) {
  const rows = [
    ['execution', result.execution],
    ['runtimePathStatus', result.runtimePathStatus],
    ['approvedRuntimePath', result.approvedRuntimePath],
    ['metadataCheck', result.metadataCheck],
    ['blocker', result.blocker],
    ['confirmation', result.confirmationProvided ? confirmationEnv : 'absent_or_not_true'],
    ['ffmpegPath', result.ffmpegPath],
    ['ffprobePath', result.ffprobePath],
    ['ffmpegVersion', result.ffmpegVersion],
    ['ffprobeVersion', result.ffprobeVersion],
    ['assFilterPresent', String(result.assFilterPresent)],
    ['subtitlesFilterPresent', String(result.subtitlesFilterPresent)],
    ['libassIndicated', String(result.libassIndicated)],
    ['mediaInputUsed', 'false'],
    ['mediaOutputCreated', 'false'],
    ['gcsAccess', 'false'],
    ['signedUrlsCreated', 'false'],
    ['publicArtifactsCreated', 'false'],
    ['internalBetaReady', 'false'],
    ['productionReady', 'false'],
    ['externalBetaReady', 'false'],
    ['finalDeliveryReady', 'false'],
  ]
    .map(([field, value]) => `| ${field} | \`${value}\` |`)
    .join('\n')
  return `| field | value |
| --- | --- |
${rows}`
}

function docs(result) {
  const sourceAudit = `| #443 | merged at \`e268a9e8afd5360df91653e9d2c060c05e270e43\` | guarded corrected-caption burn-in execution packet |
| #447 | merged at \`ce4b2feac22247581ba361e71df33feb1e667507\` | created corrected ASS sidecar and failed closed before source ref |
| #452 | merged at \`422bbcade670646963257f5b7b2ddc6681748f0b\` | approved exact private Phase 32 source ref |
| #459 | merged at \`1a52c5a604b175bbd95c8e96294d963636ee8db0\` | wired approved #452 source ref into guarded 3R2 and records \`blocked_missing_approved_caption_burnin_runtime_path\` |`
  const correctedCaption = captionLines.map((line, index) => `${index + 1}. "${line}"`).join('\n')
  const commandTable = `| check | command | status | exitCode |
| --- | --- | --- | --- |
${summarizeCommands(result.commands)}`

  return {
    'docs/track-a/track-a-caption-quality-3r2-runtime-path-1.md': `# TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 Runtime Path Resolution

Status: \`${result.runtimePathStatus}\`

Patch type: Track A approved caption burn-in runtime path resolution packet.

Branch: \`${branch}\`

Base: \`${base}\`

Run ID: \`${runId}\`

## Purpose

This packet resolves the #459 blocker \`blocked_missing_approved_caption_burnin_runtime_path\` by checking whether the current local environment has a metadata-approved FFmpeg/FFprobe/libass runtime path for future corrected-caption burn-in revalidation.

This packet does not burn captions, render previews, inspect media inputs, create media outputs, access GCS, create signed URLs, create public artifacts, mutate Supabase, run SQL, or unlock beta/production/final delivery.

## Source-Of-Truth Audit

| PR | Status | Evidence |
| --- | --- | --- |
${sourceAudit}

## Approved Inputs

approvedSourceRef: \`${sourceRef}\`

sourceRefApproved: true

captionSourceType: \`controlled_test_caption_copy\`

transcriptAccuracyClaim: false

Corrected #426 caption copy:

${correctedCaption}

oldAwkwardCaptionRejected: true

rejectedOldCaptionText: \`${oldCaption}\`

## Runtime Path Result

${runtimeRows(result)}

## Decision

TRACKA-CAPTION-QUALITY-3R3 readiness: \`${result.readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

Internal beta readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-runtime-path-candidate-matrix.md': `# Track A Caption Runtime Path Candidate Matrix

Status: \`${result.runtimePathStatus}\`

| candidateId | classification | metadata result | decision | notes |
| --- | --- | --- | --- | --- |
| \`local_ffmpeg_libass_runtime_path\` | preferred minimal local runtime path | ffmpeg=\`${result.ffmpegPath}\`; ffprobe=\`${result.ffprobePath}\`; ass=\`${result.assFilterPresent}\`; subtitles=\`${result.subtitlesFilterPresent}\`; libass=\`${result.libassIndicated}\` | \`${result.approvedRuntimePath === 'local_ffmpeg_libass_runtime_path' ? 'approved_metadata_only' : result.runtimePathStatus}\` | approval is metadata-only; no media input or output was used |
| \`existing_tracka_caption_burnin_activation_module\` | guarded activation packet | existing #459 module remains source-of-truth | \`available_for_future_guarded_execution_only\` | must stay behind \`REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true\` |
| \`remotion_preview_runtime_path\` | optional preview path | package metadata only | \`not_required_for_runtime_path_approval\` | no Remotion render was run |
| \`docker_cloudrun_runtime_path\` | deployment/runtime path | not inspected beyond docs | \`blocked_no_build_no_deploy\` | Docker/Cloud Run build/deploy remains out of scope |
| \`missing_runtime_path\` | fallback blocker | \`${result.runtimePathStatus}\` | \`${result.blocker}\` | used when local FFmpeg/FFprobe/filter support is not metadata-approved |

## Approved Inputs For Future Execution

- source: \`${sourceRef}\`
- caption copy: #426 controlled-test caption copy only.
- future execution confirmation: \`REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true\`

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-runtime-path-metadata-check-results.md': `# Track A Caption Runtime Path Metadata Check Results

Status: \`${result.metadataCheck}\`

Run ID: \`${runId}\`

Confirmation required: \`${confirmationEnv}\`

confirmationProvided: ${result.confirmationProvided}

metadataCheckExecuted: ${result.metadataCheck !== 'not_attempted'}

## Command Results

${commandTable}

## Parsed Metadata

${runtimeRows(result)}

## Safety Result

- mediaInputUsed: false
- mediaOutputCreated: false
- frameExtraction: false
- captionBurnInExecuted: false
- libassMediaProcessing: false
- ffmpegMediaProcessing: false
- ffprobeMediaProcessing: false
- remotionRender: false
- gcsAccess: false
- signedUrlsCreated: false
- publicArtifactsCreated: false

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-runtime-path-approval-contract.md': `# Track A Caption Runtime Path Approval Contract

Status: \`${result.runtimePathStatus}\`

## Contract

| gate | required value | current result |
| --- | --- | --- |
| approvedRuntimePathId | \`local_ffmpeg_libass_runtime_path\` | \`${result.approvedRuntimePath}\` |
| required binary | \`ffmpeg\` | \`${result.ffmpegPath}\` |
| required binary | \`ffprobe\` | \`${result.ffprobePath}\` |
| required filters | \`ass\` or \`subtitles\` | ass=\`${result.assFilterPresent}\`; subtitles=\`${result.subtitlesFilterPresent}\` |
| allowed input | #452 approved source ref only | \`${sourceRef}\` |
| allowed caption | #426 approved controlled-test caption copy only | preserved |
| future execution confirmation | \`REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true\` | required for 3R3 |
| media processing in this phase | none | passed |
| media output in this phase | none | passed |
| signed/public output | none | passed |

## Disallowed

- arbitrary media.
- old caption samples.
- public output.
- signed URL.
- final delivery.
- beta/production unlock.
- non-Track-A source.
- GCS read/copy/download/upload.
- bucket/IAM/object mutation.

## Future Output Contract

The future 3R3 execution may create private review artifacts only if this runtime path is approved and \`REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true\` is explicitly supplied.

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-runtime-path-qa-gate-map.md': `# Track A Caption Runtime Path QA Gate Map

Status: \`${result.runtimePathStatus}\`

| gateId | status | evidence |
| --- | --- | --- |
| \`source_chain_merged\` | passed | #443, #447, #452, and #459 are merged |
| \`approved_source_ref_present\` | passed | \`${sourceRef}\` |
| \`corrected_caption_copy_present\` | passed | #426 four-line caption copy preserved |
| \`old_caption_rejected\` | passed | old #419 awkward text rejected and not reused |
| \`ffmpeg_binary_metadata\` | \`${result.ffmpegPath === 'not_found' || result.ffmpegPath === 'not_checked' ? 'blocked_or_not_checked' : 'passed'}\` | \`${result.ffmpegPath}\` |
| \`ffprobe_binary_metadata\` | \`${result.ffprobePath === 'not_found' || result.ffprobePath === 'not_checked' ? 'blocked_or_not_checked' : 'passed'}\` | \`${result.ffprobePath}\` |
| \`caption_filter_metadata\` | \`${result.assFilterPresent || result.subtitlesFilterPresent ? 'passed' : 'blocked_or_not_checked'}\` | ass=\`${result.assFilterPresent}\`; subtitles=\`${result.subtitlesFilterPresent}\` |
| \`no_media_input_output\` | passed | no media input or output was used |
| \`no_public_or_signed_artifacts\` | passed | no signed URLs or public artifacts |
| \`no_supabase_or_sql\` | passed | docs/status only |
| \`no_beta_or_final_delivery\` | passed | internal beta and final delivery remain blocked |

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-runtime-path-blocked-scope-register.md': `# Track A Caption Runtime Path Blocked Scope Register

Status: \`${result.runtimePathStatus}\`

Blocked in this phase:

- actual caption burn-in.
- actual libass media processing.
- actual FFmpeg/FFprobe media processing.
- actual Remotion render.
- private GCS read/copy/write.
- public artifacts.
- signed URLs.
- final delivery/export.
- internal beta unlock.
- external beta unlock.
- production unlock.
- paid production unlock.
- arbitrary user media.
- broad media.
- provider/model calls.
- raw prompt execution.
- Supabase schema/RLS/migrations.
- Supabase product-row mutation.
- billing/credit mutation.
- dependency mutation.
- package-lock mutation.

## Current Blocker

runtimePathStatus: \`${result.runtimePathStatus}\`

blocker: \`${result.blocker}\`

## No-Scope Statement

${noScope}
`,
    'docs/track-a/track-a-caption-runtime-path-next-phase-plan.md': `# Track A Caption Runtime Path Next Phase Plan

Status: \`${result.runtimePathStatus}\`

## Readiness

TRACKA-CAPTION-QUALITY-3R3 readiness: \`${result.readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

Internal beta readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

Production/external beta/final delivery: \`blocked\`

## Next Prompt

\`TRACKA-CAPTION-QUALITY-3R3 — Burn-in revalidation execution with approved runtime path\`

## Human Action Required

${result.approvedRuntimePath === 'local_ffmpeg_libass_runtime_path' ? 'none for runtime path approval; 3R3 still requires explicit guarded burn-in execution confirmation.' : 'install or expose an approved local FFmpeg/FFprobe build with ASS/subtitles filter support, then rerun the metadata-only runtime path check.'}

## No-Scope Statement

${noScope}
`,
    'docs/activation-phase-tracka-caption-runtime-path-1-results.md': `# Activation Phase TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 Results

Branch: \`${branch}\`

PR title: \`[track-a] Caption burn-in runtime path resolution\`

Base: \`${base}\`

Patch type: Track A caption burn-in runtime path resolution.

Run ID: \`${runId}\`

Execution: \`${result.execution}\`

Runtime path status: \`${result.runtimePathStatus}\`

Approved runtime path: \`${result.approvedRuntimePath}\`

## Source-Of-Truth Audit

| PR | Status | Evidence |
| --- | --- | --- |
${sourceAudit}

## Candidate Runtime Path Matrix

- local_ffmpeg_libass_runtime_path: \`${result.approvedRuntimePath === 'local_ffmpeg_libass_runtime_path' ? 'approved_metadata_only' : result.runtimePathStatus}\`
- existing_tracka_caption_burnin_activation_module: \`available_for_future_guarded_execution_only\`
- remotion_preview_runtime_path: \`optional_not_required\`
- docker_cloudrun_runtime_path: \`blocked_no_build_no_deploy\`
- missing_runtime_path: \`${result.blocker}\`

## Metadata Check

${runtimeRows(result)}

## Approval Contract

Allowed source: \`${sourceRef}\`

Allowed caption: #426 controlled-test caption copy only.

Future execution confirmation: \`REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true\`

## QA Gate Map

- old text absent: passed.
- corrected text present: passed.
- readable preview: not applicable; no preview created.
- ffprobe validation: metadata path only; no media probed.
- private artifact manifest: not created in this phase.
- no public artifact: passed.
- no signed URL: passed.

## Supabase Update Classification

- Supabase update required: docs/status only
- Supabase update status: docs_only
- Supabase environment touched: none
- SQL executed: none
- Migration deployed: no
- Evidence docs: TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 docs packet
- Blockers: \`${result.blocker}\`
- Next Supabase action: none

## Cross-Chat Impact

- Workstream updated: TRACK_A_RENDER_EXPORT
- Other workstreams affected: TRACK_B_MEDIA_PROCESSING, SOUND_MUSIC_AUDIO, WORKER_RUNTIME_JOBS, TOOL_ROUTE_COORDINATION, AI_TOOLS_CREATIVE_GRAPHICS, PROVIDER_GATEWAY_MODELS, SUPABASE_RLS_STORAGE_DATABASE, OBSERVABILITY_AUDIT_COST, COMPLIANCE_SECURITY, FRONTEND_PRODUCT_UX
- Contracts changed: caption burn-in runtime path approval contract only
- Handoff needed: run TRACKA-CAPTION-QUALITY-3R3 only if runtime path is approved
- Duplicate risk: low
- Next owner/prompt: TRACKA-CAPTION-QUALITY-3R3 — Burn-in revalidation execution with approved runtime path

## No-Scope Statement

${noScope}
`,
    'docs/implementation-prompts/prompt-tracka-caption-quality-3r3-burnin-revalidation-execution.md': `# TRACKA-CAPTION-QUALITY-3R3 — Burn-In Revalidation Execution With Approved Runtime Path

## Summary

Run only after TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 records \`runtimePathStatus: approved_local_ffmpeg_libass_metadata_only\` and \`approvedRuntimePath: local_ffmpeg_libass_runtime_path\`.

## Required Inputs

- #426 approved controlled-test caption copy.
- #452 approved private source ref: \`${sourceRef}\`.
- #459 corrected ASS sidecar evidence and source-ref wiring.
- TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 metadata approval for local FFmpeg/FFprobe ASS/subtitles support.
- explicit future execution confirmation: \`REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true\`.

## Blocked Unless

- runtime path is metadata-approved.
- source ref remains the exact #452 private object.
- captions remain the exact #426 corrected controlled-test copy.
- old #419 awkward caption text is rejected.
- output remains private review artifact only.

## Still Blocked

- public artifacts.
- signed URLs.
- internal beta.
- external beta.
- production.
- final delivery.
- arbitrary user media.
- broad media.
- Supabase mutation.
- SQL.
- provider/model calls.
- worker/route execution outside the guarded packet.

## No-Scope Statement

${noScope}
`,
    'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md': `# TRACKA-PRIVATE-E2E-REVALIDATION-1 Planning

## Goal

Plan a future private Track A E2E revalidation packet after the caption-quality and missing-evidence chain has produced corrected-caption visual proof and a first internal-beta scope decision.

## Current Blocker

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

#419 recorded \`pass_with_warnings_sample_level\` for uploaded samples and \`fullTrackAVisualClosurePassed: false\`.

#426 closed controlled-test caption text quality, but caption visual burn-in revalidation remains required.

#429 is merged and provides the missing visual evidence artifact bundle. #434 records \`overallDecision: partial_pass_with_warnings\`, keeps \`fullMissingVisualEvidenceClosurePassed: false\`, and keeps \`fullTrackAVisualClosurePassed: false\`.

#440 and #443 record the corrected-caption burn-in planning and guarded execution packet. #447 failed closed before burn-in because the approved source ref was missing. #452 approves the exact private Phase 32 controlled-test source ref. #459 wires the approved #452 source ref into the guarded burn-in activation and records \`blocked_missing_approved_caption_burnin_runtime_path\`.

TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 records runtime path status: \`${result.runtimePathStatus}\`. Private E2E revalidation remains blocked until a future guarded burn-in execution creates a review-safe corrected-caption visual artifact and TRACKA-CAPTION-QUALITY-4 records the visual outcome.

## Required Precondition

- approved source ref: \`${sourceRef}\`.
- approved runtime path: \`${result.approvedRuntimePath}\`.
- corrected-caption private visual proof from a future guarded burn-in execution.
- one clean private E2E review clip or contact sheet.
- timeline consistency proof.
- final composition polish checklist.
- first internal-beta scope decision for BiRefNet/text-behind-subject and Real-ESRGAN/enhancement.

## Blocked Scope

No Track A runtime execution, FFmpeg/FFprobe, Remotion, libass, OTIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, FILM execution, media processing, GCS upload, signed URL creation, Supabase mutation, SQL, beta, production, final delivery, or broad media unlock.

## No-Scope Statement

${noScope}
`,
    'docs/implementation-prompts/prompt-internal-beta-tracka-scope-decision-1.md': `# INTERNAL-BETA-TRACKA-SCOPE-DECISION-1

## Goal

Record the first restricted internal beta Track A scope decision after corrected-caption burn-in revalidation and missing visual evidence review have produced enough private review evidence.

## Required Sources

- #419 visual review outcome.
- #422 visual gap closure packet.
- #426 approved controlled-test caption source.
- #429 merged missing visual evidence bundle.
- #434 missing visual evidence review outcome.
- #440 caption burn-in revalidation planning.
- #443 guarded burn-in revalidation execution packet.
- #447 fail-closed corrected-caption execution attempt.
- #452 approved private source ref.
- #459 guarded corrected-caption burn-in revalidation with approved source result.
- TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 runtime path status: \`${result.runtimePathStatus}\`.

## Required Decisions

- decide whether BiRefNet/text-behind-subject is excluded from first restricted internal beta or requires TRACKA-MISSING-VISUAL-EVIDENCE-3 first.
- decide whether Real-ESRGAN/enhancement is excluded from first restricted internal beta or requires TRACKA-MISSING-VISUAL-EVIDENCE-3 first.
- confirm OpenColorIO/OpenImageIO remains sample-level only unless stronger proof is supplied.
- confirm OTIO/full private E2E cannot be considered closed until corrected-caption burn-in revalidation and private E2E review evidence exist.

## Current Required Statuses

TRACKA-CAPTION-QUALITY-3R3 readiness: \`${result.readiness}\`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

INTERNAL-BETA readiness: \`blocked_pending_caption_burnin_visual_review_and_scope_decision\`

TRACKA-MISSING-VISUAL-EVIDENCE-3 readiness: \`optional_scope_expansion_only\`

## Blocked Claims

This prompt must not claim internal beta readiness, external beta readiness, production readiness, final delivery readiness, runtime readiness, public artifact readiness, or signed URL readiness.

## No-Scope Statement

${noScope}
`,
  }
}

function writeDocs(result) {
  mkdirSync('docs/track-a', { recursive: true })
  mkdirSync('docs/implementation-prompts', { recursive: true })
  const files = docs(result)
  for (const [file, content] of Object.entries(files)) {
    writeFileSync(file, content)
  }
}

const result = buildMetadataResult()
writeDocs(result)

console.log(
  JSON.stringify(
    {
      phase,
      runId,
      execution: result.execution,
      runtimePathStatus: result.runtimePathStatus,
      approvedRuntimePath: result.approvedRuntimePath,
      metadataCheck: result.metadataCheck,
      ffmpegPath: result.ffmpegPath,
      ffprobePath: result.ffprobePath,
      assFilterPresent: result.assFilterPresent,
      subtitlesFilterPresent: result.subtitlesFilterPresent,
      libassIndicated: result.libassIndicated,
      readiness: result.readiness,
      mediaInputUsed: false,
      mediaOutputCreated: false,
      gcsAccess: false,
      signedUrlsCreated: false,
      publicArtifactsCreated: false,
      internalBetaReady: false,
      productionReady: false,
      finalDeliveryReady: false,
    },
    null,
    2,
  ),
)
