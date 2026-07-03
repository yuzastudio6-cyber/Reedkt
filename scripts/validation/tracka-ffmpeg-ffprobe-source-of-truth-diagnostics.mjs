import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth'
const expectedDecision = 'tracka_ffmpeg_ffprobe_source_of_truth_reconciliation_passed_ready_for_version_probe_approval'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/pr-463-diff-review.json`,
  `${reportDir}/pr-463-diff-review.md`,
  `${reportDir}/central-presence-check.json`,
  `${reportDir}/central-presence-check.md`,
  `${reportDir}/reconciliation-method.json`,
  `${reportDir}/reconciliation-method.md`,
  `${reportDir}/ffmpeg-ffprobe-central-evidence.json`,
  `${reportDir}/ffmpeg-ffprobe-central-evidence.md`,
  `${reportDir}/future-version-probe-boundary.json`,
  `${reportDir}/future-version-probe-boundary.md`,
  `${reportDir}/owner-handoff-and-blocker-review.json`,
  `${reportDir}/owner-handoff-and-blocker-review.md`,
  `${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-decision.json`,
  `${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-decision.md`,
  `${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-readiness-report.json`,
  `${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-blocker-report.json`,
  `${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-private-artifact-manifest.json`,
  `${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-ffmpeg-ffprobe-version-probe-approval.md',
]

const failures = []

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return undefined
  }
}

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing_file:${file}`)
}

const docsText = requiredFiles
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

const forbiddenPatterns = [
  ['ffmpeg_installed_claim', /\bffmpegAcceptedAsInstalledAndProven["']?\s*[:=]\s*true\b/i],
  ['ffprobe_installed_claim', /\bffprobeAcceptedAsInstalledAndProven["']?\s*[:=]\s*true\b/i],
  ['future_probe_approved_now', /\bfutureVersionProbeApprovedNow["']?\s*[:=]\s*true\b/i],
  ['version_probe_execution_approved_now', /\bversionProbeExecutionApprovedNow["']?\s*[:=]\s*true\b/i],
  ['pr_463_replayed', /\bpr463DiffReplayed["']?\s*[:=]\s*true\b/i],
  ['pr_463_cherry_pick_used', /\bpr463ReplayCherryPickUsed["']?\s*[:=]\s*true\b/i],
  ['docker_build_allowed', /\bdockerBuildAllowed["']?\s*[:=]\s*true\b/i],
  ['docker_mutation_allowed', /\bdockerContainerMutationAllowed["']?\s*[:=]\s*true\b/i],
  ['media_processing_allowed', /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i],
  ['caption_burnin_allowed', /\bcaptionBurnInAllowed["']?\s*[:=]\s*true\b/i],
  ['render_export_allowed', /\brenderExportAllowed["']?\s*[:=]\s*true\b/i],
  ['worker_execution_allowed', /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['provider_execution_allowed', /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_writes_allowed', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
  ['sql_allowed', /\bsqlAllowed["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_allowed', /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i],
  ['public_artifacts_allowed', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i],
  ['signed_urls_allowed', /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i],
  ['raw_prompt_allowed', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['production_unlock_allowed', /\bproductionUnlockAllowed["']?\s*[:=]\s*true\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decision = existsSync(`${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-decision.json`)
  ? readJson(`${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-decision.json`)
  : undefined
const pr463 = existsSync(`${reportDir}/pr-463-diff-review.json`) ? readJson(`${reportDir}/pr-463-diff-review.json`) : undefined
const presence = existsSync(`${reportDir}/central-presence-check.json`)
  ? readJson(`${reportDir}/central-presence-check.json`)
  : undefined
const reconciliation = existsSync(`${reportDir}/reconciliation-method.json`)
  ? readJson(`${reportDir}/reconciliation-method.json`)
  : undefined
const centralEvidence = existsSync(`${reportDir}/ffmpeg-ffprobe-central-evidence.json`)
  ? readJson(`${reportDir}/ffmpeg-ffprobe-central-evidence.json`)
  : undefined
const futureBoundary = existsSync(`${reportDir}/future-version-probe-boundary.json`)
  ? readJson(`${reportDir}/future-version-probe-boundary.json`)
  : undefined
const readiness = existsSync(`${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-readiness-report.json`)
  ? readJson(`${reportDir}/tracka-ffmpeg-ffprobe-source-of-truth-readiness-report.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.trackaFfmpegFfprobeSourceOfTruth.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL') {
    failures.push(`next_prompt:${decision.nextPrompt}`)
  }
  if (decision.pr463ReferenceOnly !== true) failures.push('pr463_not_reference_only')
  if (decision.pr463ReplayCherryPickUsed !== false) failures.push('pr463_replay_used')
  if (decision.ffmpegAcceptedAsInstalledAndProven !== false) failures.push('ffmpeg_incorrectly_accepted')
  if (decision.ffprobeAcceptedAsInstalledAndProven !== false) failures.push('ffprobe_incorrectly_accepted')
  if (decision.futureVersionProbeApprovedNow !== false) failures.push('future_probe_approved_now')
  if (decision.versionProbeExecutionApprovedNow !== false) failures.push('version_probe_execution_approved_now')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
}

if (pr463?.state !== 'MERGED') failures.push(`pr463_state:${pr463?.state}`)
if (pr463?.referenceOnly !== true) failures.push('pr463_diff_not_reference_only')
if (presence?.dockerfilePresent !== true) failures.push('central_dockerfile_missing')
if (presence?.trackaRuntimePathReportsPresent !== false) failures.push('unexpected_tracka_runtime_reports_presence')
if (reconciliation?.method !== 'docs_only_central_reconciliation') failures.push(`reconciliation_method:${reconciliation?.method}`)
if (reconciliation?.pr463DiffReplayed !== false) failures.push('pr463_diff_replayed')
if (centralEvidence?.versionProbeRunInThisPhase !== false) failures.push('version_probe_run')
if (centralEvidence?.mediaProcessingRunInThisPhase !== false) failures.push('media_processing_run')
if (futureBoundary?.futureVersionProbeApprovedNow !== false) failures.push('future_boundary_probe_approved_now')
if (futureBoundary?.readyForFutureVersionProbeApprovalPacket !== true) failures.push('future_approval_packet_not_ready')
if (readiness?.readiness !== true) failures.push('readiness_not_true')

let packageLockStatus = ''
try {
  packageLockStatus = execFileSync('git', ['status', '--short', '--', 'package-lock.json'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
} catch (error) {
  failures.push(`git_status_failed:${error.message}`)
}
if (packageLockStatus) failures.push(`package_lock_has_git_status:${packageLockStatus}`)

if (failures.length) {
  console.error('Track A FFmpeg/FFprobe source-of-truth diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      reconciliationMethod: reconciliation?.method,
      centralDockerfilePresent: presence?.dockerfilePresent,
      trackaRuntimeReportsPresent: presence?.trackaRuntimePathReportsPresent,
      futureVersionProbeApprovedNow: futureBoundary?.futureVersionProbeApprovedNow,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
