import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review'
const expectedDecision = 'ffmpeg_ffprobe_system_binary_review_passed_ready_for_tracka_source_of_truth_merge'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/evidence-revalidation-report.json`,
  `${reportDir}/evidence-revalidation-report.md`,
  `${reportDir}/tracka-pr-463-reference-review.json`,
  `${reportDir}/tracka-pr-463-reference-review.md`,
  `${reportDir}/strategy-selection-review.json`,
  `${reportDir}/strategy-selection-review.md`,
  `${reportDir}/future-version-probe-scope.json`,
  `${reportDir}/future-version-probe-scope.md`,
  `${reportDir}/owner-handoff-review.json`,
  `${reportDir}/owner-handoff-review.md`,
  `${reportDir}/internal-beta-impact-review.json`,
  `${reportDir}/internal-beta-impact-review.md`,
  `${reportDir}/ffmpeg-ffprobe-system-binary-review-decision.json`,
  `${reportDir}/ffmpeg-ffprobe-system-binary-review-decision.md`,
  `${reportDir}/ffmpeg-ffprobe-system-binary-review-readiness-report.json`,
  `${reportDir}/ffmpeg-ffprobe-system-binary-review-blocker-report.json`,
  `${reportDir}/ffmpeg-ffprobe-system-binary-review-private-artifact-manifest.json`,
  `${reportDir}/ffmpeg-ffprobe-system-binary-review-validation-results.md`,
  'docs/implementation-prompts/prompt-tracka-ffmpeg-ffprobe-source-of-truth-merge.md',
]

const sourceEvidenceFiles = [
  'docs/open-source-tool-stack/duckdb-native-rebuild-qa/duckdb-native-rebuild-qa-decision.json',
  'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-decision.json',
  'docs/open-source-tool-stack/missing-optional-package-binary-execution/package-binary-execution-decision.json',
  'docs/open-source-tool-stack/missing-optional-package-binary-execution/polars-proof-report.json',
  'docs/open-source-tool-stack/open-source-tool-stack-inventory.json',
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

for (const file of [...requiredFiles, ...sourceEvidenceFiles]) {
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
  ['ffmpeg_probe_allowed', /\bffmpegVersionProbeAllowed["']?\s*[:=]\s*true\b/i],
  ['ffprobe_probe_allowed', /\bffprobeVersionProbeAllowed["']?\s*[:=]\s*true\b/i],
  ['binary_install_allowed', /\bsystemBinaryInstallAllowed["']?\s*[:=]\s*true\b/i],
  ['docker_build_allowed', /\bdockerBuildAllowed["']?\s*[:=]\s*true\b/i],
  ['container_mutation_allowed', /\bdockerContainerMutationAllowed["']?\s*[:=]\s*true\b/i],
  ['media_processing_allowed', /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i],
  ['render_export_allowed', /\brenderExportAllowed["']?\s*[:=]\s*true\b/i],
  ['worker_execution_allowed', /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['provider_execution_allowed', /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_writes_allowed', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
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

const decision = existsSync(`${reportDir}/ffmpeg-ffprobe-system-binary-review-decision.json`)
  ? readJson(`${reportDir}/ffmpeg-ffprobe-system-binary-review-decision.json`)
  : undefined
const evidence = existsSync(`${reportDir}/evidence-revalidation-report.json`)
  ? readJson(`${reportDir}/evidence-revalidation-report.json`)
  : undefined
const tracka = existsSync(`${reportDir}/tracka-pr-463-reference-review.json`)
  ? readJson(`${reportDir}/tracka-pr-463-reference-review.json`)
  : undefined
const futureScope = existsSync(`${reportDir}/future-version-probe-scope.json`)
  ? readJson(`${reportDir}/future-version-probe-scope.json`)
  : undefined
const owner = existsSync(`${reportDir}/owner-handoff-review.json`)
  ? readJson(`${reportDir}/owner-handoff-review.json`)
  : undefined
const readiness = existsSync(`${reportDir}/ffmpeg-ffprobe-system-binary-review-readiness-report.json`)
  ? readJson(`${reportDir}/ffmpeg-ffprobe-system-binary-review-readiness-report.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.ffmpegFfprobeSystemBinaryReview.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== 'TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE') {
    failures.push(`next_prompt:${decision.nextPrompt}`)
  }
  if (decision.duckdbAcceptedAsInstalledAndProven !== true) failures.push('duckdb_not_accepted')
  if (decision.polarsAcceptedAsInstalledAndProven !== true) failures.push('polars_not_accepted')
  if (decision.ffmpegAcceptedAsInstalledAndProven !== false) failures.push('ffmpeg_incorrectly_accepted')
  if (decision.ffprobeAcceptedAsInstalledAndProven !== false) failures.push('ffprobe_incorrectly_accepted')
  if (decision.futureVersionProbeApprovedNow !== false) failures.push('future_probe_approved_now')
  if (decision.trackaSourceOfTruthMergeRequired !== true) failures.push('tracka_source_truth_not_required')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
}

if (evidence?.passed !== true) failures.push('evidence_revalidation_not_passed')
if (evidence?.ffmpegStatus !== 'missing_system_binary') failures.push(`ffmpeg_status:${evidence?.ffmpegStatus}`)
if (evidence?.ffprobeStatus !== 'missing_system_binary') failures.push(`ffprobe_status:${evidence?.ffprobeStatus}`)
if (tracka?.centralSourceOfTruth !== false) failures.push('tracka_incorrectly_canonical')
if (tracka?.useAsReferenceOnly !== true) failures.push('tracka_not_reference_only')
if (futureScope?.futureVersionProbeApprovedNow !== false) failures.push('future_scope_probe_approved_now')
if (owner?.centralLaneCanProceedAlone !== false) failures.push('central_lane_can_proceed_alone')
if (owner?.trackaSourceOfTruthMergeRequired !== true) failures.push('owner_tracka_merge_not_required')
if (readiness?.readiness !== true) failures.push('readiness_not_true')

let packageLockStatus = ''
let packageJsonStatus = ''
try {
  packageLockStatus = execFileSync('git', ['status', '--short', '--', 'package-lock.json'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
  packageJsonStatus = execFileSync('git', ['status', '--short', '--', 'package.json'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
} catch (error) {
  failures.push(`git_status_failed:${error.message}`)
}
if (packageLockStatus) failures.push(`package_lock_has_git_status:${packageLockStatus}`)
if (!packageJsonStatus.includes('package.json')) {
  // package.json may be clean before commit or modified only for scripts during implementation.
}

if (failures.length) {
  console.error('Open-source FFmpeg/FFprobe system-binary review diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      duckdbAccepted: decision?.duckdbAcceptedAsInstalledAndProven,
      polarsAccepted: decision?.polarsAcceptedAsInstalledAndProven,
      ffmpegAccepted: decision?.ffmpegAcceptedAsInstalledAndProven,
      ffprobeAccepted: decision?.ffprobeAcceptedAsInstalledAndProven,
      futureVersionProbeApprovedNow: decision?.futureVersionProbeApprovedNow,
      trackaSourceOfTruthMergeRequired: decision?.trackaSourceOfTruthMergeRequired,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
