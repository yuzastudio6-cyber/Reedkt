import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/duckdb-native-rebuild-execution'
const expectedCommand = 'npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund'
const allowedDecisions = [
  'duckdb_native_rebuild_execution_passed_ready_for_qa',
  'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing',
  'blocked_pending_duckdb_native_rebuild',
  'blocked_pending_duckdb_import_or_query',
  'blocked_pending_package_lock_integrity',
  'blocked_pending_native_artifact_policy',
  'rejected_due_runtime_safety_risk',
]

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/pre-rebuild-baseline-report.json`,
  `${reportDir}/pre-rebuild-baseline-report.md`,
  `${reportDir}/duckdb-native-rebuild-report.json`,
  `${reportDir}/duckdb-native-rebuild-report.md`,
  `${reportDir}/duckdb-import-proof-report.json`,
  `${reportDir}/duckdb-synthetic-query-report.json`,
  `${reportDir}/package-lock-native-artifact-integrity-report.json`,
  `${reportDir}/package-lock-native-artifact-integrity-report.md`,
  `${reportDir}/ffmpeg-ffprobe-follow-up-report.json`,
  `${reportDir}/side-effect-safety-report.json`,
  `${reportDir}/duckdb-native-rebuild-decision.json`,
  `${reportDir}/duckdb-native-rebuild-decision.md`,
  `${reportDir}/duckdb-native-rebuild-readiness-report.json`,
  `${reportDir}/duckdb-native-rebuild-private-artifact-manifest.json`,
  `${reportDir}/duckdb-native-rebuild-validation-results.md`,
]

const failures = []
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${file}:${error.message}`)
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
  ['npm_install_attempted', /npmInstallAttempted["']?\s*[:=]\s*true/i],
  ['bare_rebuild_attempted', /bareNpmRebuildAttempted["']?\s*[:=]\s*true/i],
  ['broad_lifecycle_attempted', /broadLifecycleScriptsAttempted["']?\s*[:=]\s*true/i],
  ['polars_rerun', /polarsProofRerun["']?\s*[:=]\s*true/i],
  ['ffmpeg_probe', /ffmpegProbeRun["']?\s*[:=]\s*true/i],
  ['ffprobe_probe', /ffprobeProbeRun["']?\s*[:=]\s*true/i],
  ['system_binary_install', /systemBinaryInstallAttempted["']?\s*[:=]\s*true/i],
  ['container_mutation', /containerMutationAttempted["']?\s*[:=]\s*true/i],
  ['worker_execution', /workerExecution(?:Attempted|Allowed)["']?\s*[:=]\s*true/i],
  ['route_execution', /routeExecution(?:Attempted|Allowed)["']?\s*[:=]\s*true/i],
  ['provider_execution', /provider(?:CallsAttempted|ExecutionAllowed)["']?\s*[:=]\s*true/i],
  ['media_processing', /mediaProcessing(?:Attempted|Allowed)["']?\s*[:=]\s*true/i],
  ['supabase_write', /supabaseWrites(?:Attempted|Allowed)["']?\s*[:=]\s*true/i],
  ['gcs_upload', /gcsUpload(?:Attempted|Allowed)["']?\s*[:=]\s*true/i],
  ['public_artifact', /publicArtifacts(?:Created|Allowed)["']?\s*[:=]\s*true/i],
  ['signed_url', /signedUrls(?:Created|AsSourceOfTruthAllowed)["']?\s*[:=]\s*true/i],
  ['raw_prompt', /rawPrompts?Executed["']?\s*[:=]\s*true/i],
  ['production_unlock', /productionUnlockAllowed["']?\s*[:=]\s*true/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const source = existsSync(`${reportDir}/source-of-truth-audit.json`) ? readJson(`${reportDir}/source-of-truth-audit.json`) : undefined
const baseline = existsSync(`${reportDir}/pre-rebuild-baseline-report.json`) ? readJson(`${reportDir}/pre-rebuild-baseline-report.json`) : undefined
const rebuild = existsSync(`${reportDir}/duckdb-native-rebuild-report.json`) ? readJson(`${reportDir}/duckdb-native-rebuild-report.json`) : undefined
const importProof = existsSync(`${reportDir}/duckdb-import-proof-report.json`) ? readJson(`${reportDir}/duckdb-import-proof-report.json`) : undefined
const queryProof = existsSync(`${reportDir}/duckdb-synthetic-query-report.json`) ? readJson(`${reportDir}/duckdb-synthetic-query-report.json`) : undefined
const integrity = existsSync(`${reportDir}/package-lock-native-artifact-integrity-report.json`)
  ? readJson(`${reportDir}/package-lock-native-artifact-integrity-report.json`)
  : undefined
const followUp = existsSync(`${reportDir}/ffmpeg-ffprobe-follow-up-report.json`)
  ? readJson(`${reportDir}/ffmpeg-ffprobe-follow-up-report.json`)
  : undefined
const safety = existsSync(`${reportDir}/side-effect-safety-report.json`) ? readJson(`${reportDir}/side-effect-safety-report.json`) : undefined
const decision = existsSync(`${reportDir}/duckdb-native-rebuild-decision.json`) ? readJson(`${reportDir}/duckdb-native-rebuild-decision.json`) : undefined

if (source?.pr460EvidenceValid !== true) failures.push('pr460_source_of_truth_invalid')
if (source?.approvedDirectDependenciesValid !== true) failures.push('approved_direct_dependencies_invalid')
if (baseline?.command !== 'npm ci --ignore-scripts --no-audit --no-fund') failures.push(`baseline_command:${baseline?.command}`)
if (baseline?.npmInstallAttempted !== false) failures.push('baseline_npm_install_attempted')
if (rebuild?.command !== expectedCommand) failures.push(`rebuild_command:${rebuild?.command}`)
if (rebuild?.commandMatchesApproved !== true) failures.push('rebuild_command_not_approved')
if (integrity?.packageJsonChanged !== false) failures.push('package_json_changed')
if (integrity?.packageLockChanged !== false) failures.push('package_lock_changed')
if (integrity?.nodeModulesCommitted !== false) failures.push('node_modules_committed')
if (integrity?.nativeArtifactsCommitted !== false) failures.push('native_artifacts_committed')
if (safety?.passed !== true) failures.push('side_effect_safety_failed')
if (!allowedDecisions.includes(decision?.decision)) failures.push(`decision:${decision?.decision}`)
if (decision?.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')

if (
  decision?.decision === 'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing' ||
  decision?.decision === 'duckdb_native_rebuild_execution_passed_ready_for_qa'
) {
  if (baseline?.npmCiExitCode !== 0) failures.push(`baseline_exit:${baseline?.npmCiExitCode}`)
  if (rebuild?.rebuildExitCode !== 0) failures.push(`rebuild_exit:${rebuild?.rebuildExitCode}`)
  if (importProof?.importPassed !== true) failures.push('duckdb_import_not_passed')
  if (queryProof?.queryPassed !== true) failures.push('duckdb_query_not_passed')
  if (integrity?.passed !== true) failures.push('integrity_not_passed')
}

if (followUp?.ffmpegVersionProbeRunInThisPhase !== false) failures.push('ffmpeg_probe_run')
if (followUp?.ffprobeVersionProbeRunInThisPhase !== false) failures.push('ffprobe_probe_run')

let packageStatus = ''
try {
  packageStatus = execFileSync('git', ['status', '--short', '--', 'package-lock.json'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
} catch (error) {
  failures.push(`git_status_package_files_failed:${error.message}`)
}
if (packageStatus) failures.push(`package_files_have_git_status:${packageStatus}`)

const packageJson = readJson('package.json')
if (packageJson?.dependencies?.duckdb !== '1.4.4') failures.push(`duckdb_dependency:${packageJson?.dependencies?.duckdb}`)
if (packageJson?.dependencies?.['nodejs-polars'] !== '0.25.1') {
  failures.push(`nodejs_polars_dependency:${packageJson?.dependencies?.['nodejs-polars']}`)
}

if (failures.length) {
  console.error('Open-source DuckDB native rebuild diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      rebuildExitCode: rebuild?.rebuildExitCode,
      importPassed: importProof?.importPassed,
      queryPassed: queryProof?.queryPassed,
      ffmpegStatus: followUp?.ffmpegStatus,
      ffprobeStatus: followUp?.ffprobeStatus,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
