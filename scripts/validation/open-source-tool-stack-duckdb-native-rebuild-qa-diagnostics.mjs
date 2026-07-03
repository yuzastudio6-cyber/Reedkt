import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const reportDir = 'docs/open-source-tool-stack/duckdb-native-rebuild-qa'
const expectedDecision = 'duckdb_native_rebuild_qa_passed_ready_for_ffmpeg_ffprobe_system_binary_review'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/evidence-revalidation-report.json`,
  `${reportDir}/evidence-revalidation-report.md`,
  `${reportDir}/duckdb-proof-qa.json`,
  `${reportDir}/duckdb-proof-qa.md`,
  `${reportDir}/polars-status-qa.json`,
  `${reportDir}/polars-status-qa.md`,
  `${reportDir}/ffmpeg-ffprobe-missing-binary-qa.json`,
  `${reportDir}/ffmpeg-ffprobe-missing-binary-qa.md`,
  `${reportDir}/internal-beta-impact-review.json`,
  `${reportDir}/internal-beta-impact-review.md`,
  `${reportDir}/package-lock-native-artifact-qa.json`,
  `${reportDir}/package-lock-native-artifact-qa.md`,
  `${reportDir}/duckdb-native-rebuild-qa-decision.json`,
  `${reportDir}/duckdb-native-rebuild-qa-decision.md`,
  `${reportDir}/duckdb-native-rebuild-qa-readiness-report.json`,
  `${reportDir}/duckdb-native-rebuild-qa-blocker-report.json`,
  `${reportDir}/duckdb-native-rebuild-qa-private-artifact-manifest.json`,
  `${reportDir}/duckdb-native-rebuild-qa-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-ffmpeg-ffprobe-system-binary-review.md',
]

const sourceEvidenceFiles = [
  'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-decision.json',
  'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-report.json',
  'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-import-proof-report.json',
  'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-synthetic-query-report.json',
  'docs/open-source-tool-stack/duckdb-native-rebuild-execution/package-lock-native-artifact-integrity-report.json',
  'docs/open-source-tool-stack/duckdb-native-rebuild-execution/ffmpeg-ffprobe-follow-up-report.json',
  'docs/open-source-tool-stack/missing-optional-package-binary-execution/polars-proof-report.json',
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
  ['npm_install_allowed', /\bnpmInstallAllowed["']?\s*[:=]\s*true\b/i],
  ['npm_rebuild_allowed', /\bnpmRebuildAllowed["']?\s*[:=]\s*true\b/i],
  ['lifecycle_script_allowed', /\bpackageLifecycleScriptsAllowed["']?\s*[:=]\s*true\b/i],
  ['duckdb_import_rerun_allowed', /\bduckdbImportProofRerunAllowed["']?\s*[:=]\s*true\b/i],
  ['duckdb_query_rerun_allowed', /\bduckdbQueryProofRerunAllowed["']?\s*[:=]\s*true\b/i],
  ['polars_rerun_allowed', /\bpolarsProofRerunAllowed["']?\s*[:=]\s*true\b/i],
  ['ffmpeg_probe_allowed', /\bffmpegVersionProbeAllowed["']?\s*[:=]\s*true\b/i],
  ['ffprobe_probe_allowed', /\bffprobeVersionProbeAllowed["']?\s*[:=]\s*true\b/i],
  ['tool_execution_allowed', /\btoolExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['route_execution_allowed', /\brouteExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['worker_execution_allowed', /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['provider_execution_allowed', /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['media_processing_allowed', /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_write_allowed', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_allowed', /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i],
  ['public_artifact_allowed', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i],
  ['signed_url_truth_allowed', /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i],
  ['raw_prompt_allowed', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['production_unlock_allowed', /\bproductionUnlockAllowed["']?\s*[:=]\s*true\b/i],
  ['ffmpeg_proven_claim', /FFmpeg accepted as installed\/proven:\s*true/i],
  ['ffprobe_proven_claim', /FFprobe accepted as installed\/proven:\s*true/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decision = existsSync(`${reportDir}/duckdb-native-rebuild-qa-decision.json`)
  ? readJson(`${reportDir}/duckdb-native-rebuild-qa-decision.json`)
  : undefined
const duckdb = existsSync(`${reportDir}/duckdb-proof-qa.json`) ? readJson(`${reportDir}/duckdb-proof-qa.json`) : undefined
const polars = existsSync(`${reportDir}/polars-status-qa.json`) ? readJson(`${reportDir}/polars-status-qa.json`) : undefined
const ffmpeg = existsSync(`${reportDir}/ffmpeg-ffprobe-missing-binary-qa.json`)
  ? readJson(`${reportDir}/ffmpeg-ffprobe-missing-binary-qa.json`)
  : undefined
const internalBeta = existsSync(`${reportDir}/internal-beta-impact-review.json`)
  ? readJson(`${reportDir}/internal-beta-impact-review.json`)
  : undefined
const packageLock = existsSync(`${reportDir}/package-lock-native-artifact-qa.json`)
  ? readJson(`${reportDir}/package-lock-native-artifact-qa.json`)
  : undefined
const sourceDecision = existsSync('docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-decision.json')
  ? readJson('docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-decision.json')
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.duckdbNativeRebuildQaReview.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW') {
    failures.push(`next_prompt:${decision.nextPrompt}`)
  }
  if (decision.duckdbAcceptedAsInstalledAndProven !== true) failures.push('duckdb_not_accepted')
  if (decision.polarsAcceptedAsInstalledAndProven !== true) failures.push('polars_not_accepted')
  if (decision.ffmpegAcceptedAsInstalledAndProven !== false) failures.push('ffmpeg_incorrectly_accepted')
  if (decision.ffprobeAcceptedAsInstalledAndProven !== false) failures.push('ffprobe_incorrectly_accepted')
  for (const field of [
    'npmInstallAttempted',
    'npmRebuildAttempted',
    'packageLifecycleScriptsAttempted',
    'duckdbImportProofRerun',
    'duckdbQueryProofRerun',
    'polarsProofRerun',
    'ffmpegProbeRun',
    'ffprobeProbeRun',
    'systemBinaryInstallAttempted',
    'containerMutationAttempted',
    'mediaProcessingAttempted',
    'routeExecutionAttempted',
    'workerExecutionAttempted',
    'providerCallsAttempted',
    'supabaseWritesAttempted',
    'gcsUploadAttempted',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'rawPromptsExecuted',
    'betaProductionUnlocked',
  ]) {
    if (decision[field] !== false) failures.push(`decision_${field}_not_false`)
  }
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
  if (decision.executionScope && Object.values(decision.executionScope).some((value) => value !== false)) {
    failures.push('decision_execution_scope_not_all_false')
  }
}

if (sourceDecision?.decision !== 'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing') {
  failures.push(`source_decision:${sourceDecision?.decision}`)
}
if (duckdb?.accepted !== true) failures.push('duckdb_qa_not_accepted')
if (polars?.accepted !== true) failures.push('polars_qa_not_accepted')
if (ffmpeg?.ffmpegStatus !== 'missing_system_binary') failures.push(`ffmpeg_status:${ffmpeg?.ffmpegStatus}`)
if (ffmpeg?.ffprobeStatus !== 'missing_system_binary') failures.push(`ffprobe_status:${ffmpeg?.ffprobeStatus}`)
if (ffmpeg?.probeRunInThisPhase !== false) failures.push('ffmpeg_probe_ran')
if (internalBeta?.externalBetaAllowed !== false || internalBeta?.paidProductionAllowed !== false) {
  failures.push('internal_beta_unlock_claimed')
}
if (packageLock?.passed !== true) failures.push('package_lock_native_artifact_qa_not_passed')

let packageLockStatus = ''
try {
  packageLockStatus = execFileSync('git', ['status', '--short', '--', 'package-lock.json'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
} catch (error) {
  failures.push(`git_status_package_lock_failed:${error.message}`)
}
if (packageLockStatus) failures.push(`package_lock_has_git_status:${packageLockStatus}`)

if (failures.length) {
  console.error('Open-source DuckDB native rebuild QA diagnostics failed:')
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
      ffmpegStatus: ffmpeg?.ffmpegStatus,
      ffprobeStatus: ffmpeg?.ffprobeStatus,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
