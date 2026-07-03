import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/missing-optional-package-binary-execution'
const allowedDecisions = [
  'missing_optional_package_and_binary_execution_passed_ready_for_qa',
  'missing_optional_package_execution_passed_binary_missing_ready_for_system_binary_review',
  'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts',
  'blocked_pending_duckdb_install_or_import',
  'blocked_pending_polars_install_or_import',
  'blocked_pending_package_lock_integrity',
  'blocked_pending_ffmpeg_binary_presence',
  'blocked_pending_ffprobe_binary_presence',
  'rejected_due_runtime_safety_risk',
]

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/pre-install-baseline-report.json`,
  `${reportDir}/pre-install-baseline-report.md`,
  `${reportDir}/package-install-report.json`,
  `${reportDir}/package-install-report.md`,
  `${reportDir}/post-install-npm-ci-report.json`,
  `${reportDir}/duckdb-proof-report.json`,
  `${reportDir}/polars-proof-report.json`,
  `${reportDir}/ffmpeg-version-check-report.json`,
  `${reportDir}/ffprobe-version-check-report.json`,
  `${reportDir}/package-lock-integrity-report.json`,
  `${reportDir}/package-lock-integrity-report.md`,
  `${reportDir}/side-effect-safety-report.json`,
  `${reportDir}/package-binary-execution-decision.json`,
  `${reportDir}/package-binary-execution-decision.md`,
  `${reportDir}/package-binary-execution-readiness-report.json`,
  `${reportDir}/package-binary-execution-private-artifact-manifest.json`,
  `${reportDir}/package-binary-execution-validation-results.md`,
]

const forbiddenPatterns = [
  ['worker_execution_allowed', /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['route_execution_allowed', /\brouteExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['provider_execution_allowed', /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['media_processing_allowed', /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_write_allowed', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_allowed', /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i],
  ['public_artifact_allowed', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i],
  ['signed_url_truth_allowed', /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i],
  ['raw_prompt_allowed', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['production_unlock_allowed', /\bproductionUnlockAllowed["']?\s*[:=]\s*true\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i],
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

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const sourceAudit = existsSync(`${reportDir}/source-of-truth-audit.json`) ? readJson(`${reportDir}/source-of-truth-audit.json`) : undefined
const install = existsSync(`${reportDir}/package-install-report.json`) ? readJson(`${reportDir}/package-install-report.json`) : undefined
const postCi = existsSync(`${reportDir}/post-install-npm-ci-report.json`) ? readJson(`${reportDir}/post-install-npm-ci-report.json`) : undefined
const duckdb = existsSync(`${reportDir}/duckdb-proof-report.json`) ? readJson(`${reportDir}/duckdb-proof-report.json`) : undefined
const polars = existsSync(`${reportDir}/polars-proof-report.json`) ? readJson(`${reportDir}/polars-proof-report.json`) : undefined
const ffmpeg = existsSync(`${reportDir}/ffmpeg-version-check-report.json`) ? readJson(`${reportDir}/ffmpeg-version-check-report.json`) : undefined
const ffprobe = existsSync(`${reportDir}/ffprobe-version-check-report.json`) ? readJson(`${reportDir}/ffprobe-version-check-report.json`) : undefined
const integrity = existsSync(`${reportDir}/package-lock-integrity-report.json`)
  ? readJson(`${reportDir}/package-lock-integrity-report.json`)
  : undefined
const safety = existsSync(`${reportDir}/side-effect-safety-report.json`) ? readJson(`${reportDir}/side-effect-safety-report.json`) : undefined
const decision = existsSync(`${reportDir}/package-binary-execution-decision.json`)
  ? readJson(`${reportDir}/package-binary-execution-decision.json`)
  : undefined

if (sourceAudit?.pr448Decision !== 'missing_optional_package_and_binary_approval_passed_ready_for_execution') {
  failures.push(`pr448_decision:${sourceAudit?.pr448Decision}`)
}
if (sourceAudit?.pr448ApprovalCommand !== 'npm install duckdb nodejs-polars --save-exact --ignore-scripts --no-audit --no-fund') {
  failures.push('approval_command_mismatch')
}

if (install) {
  if (install.command !== 'npm install duckdb nodejs-polars --save-exact --ignore-scripts --no-audit --no-fund') {
    failures.push('install_command_mismatch')
  }
  if (install.installAttempted !== true) failures.push('install_not_attempted')
  if (install.installExitCode !== 0) failures.push(`install_exit:${install.installExitCode}`)
  if (install.onlyApprovedDirectDependenciesAdded !== true) failures.push('direct_dependency_additions_not_scoped')
  for (const dep of ['duckdb', 'nodejs-polars']) {
    if (!install.directDependencyAdditions?.includes(dep)) failures.push(`missing_direct_dependency_addition:${dep}`)
  }
  if (install.unexpectedDirectDependencyAdditions?.length) {
    failures.push(`unexpected_direct_dependency_additions:${install.unexpectedDirectDependencyAdditions.join(',')}`)
  }
}

if (postCi?.npmCiRun !== true) failures.push('post_install_npm_ci_not_run')
if (postCi?.npmCiExitCode !== 0) failures.push(`post_install_npm_ci_exit:${postCi?.npmCiExitCode}`)

if (duckdb?.status !== 'passed' && duckdb?.status !== 'blocked_by_ignored_scripts') {
  failures.push(`duckdb_status:${duckdb?.status}`)
}
if (polars?.status !== 'passed' && polars?.status !== 'blocked_by_ignored_scripts') {
  failures.push(`polars_status:${polars?.status}`)
}
if (ffmpeg?.status !== 'passed' && ffmpeg?.status !== 'missing_system_binary') failures.push(`ffmpeg_status:${ffmpeg?.status}`)
if (ffprobe?.status !== 'passed' && ffprobe?.status !== 'missing_system_binary') failures.push(`ffprobe_status:${ffprobe?.status}`)
if (ffmpeg?.systemBinaryInstallAttempted !== false) failures.push('ffmpeg_binary_install_attempted')
if (ffprobe?.systemBinaryInstallAttempted !== false) failures.push('ffprobe_binary_install_attempted')
if (ffmpeg?.mediaProcessingAttempted !== false) failures.push('ffmpeg_media_processing_attempted')
if (ffprobe?.mediaProcessingAttempted !== false) failures.push('ffprobe_media_processing_attempted')

if (integrity?.passed !== true) failures.push('package_lock_integrity_failed')
if (integrity?.packageJsonHasOnlyApprovedDirectAdditions !== true) failures.push('integrity_direct_additions_not_scoped')
if (integrity?.packageLockHasApprovedPackages !== true) failures.push('integrity_lock_packages_missing')
if (integrity?.nodeModulesCommitted !== false) failures.push('node_modules_committed')
if (integrity?.buildOutputsCommitted !== false) failures.push('build_outputs_committed')
if (integrity?.mediaArtifactsCommitted !== false) failures.push('media_artifacts_committed')

if (safety?.passed !== true) failures.push('side_effect_safety_failed')
if (decision) {
  if (!allowedDecisions.includes(decision.decision)) failures.push(`unexpected_decision:${decision.decision}`)
  if (decision.systemBinaryInstallAttempted !== false) failures.push('decision_system_binary_install_attempted')
  if (decision.containerMutationAttempted !== false) failures.push('decision_container_mutation_attempted')
  if (decision.mediaProcessingAttempted !== false) failures.push('decision_media_processing_attempted')
  if (decision.supabaseWritesAttempted !== false) failures.push('decision_supabase_write_attempted')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
}

const packageJson = existsSync('package.json') ? readJson('package.json') : undefined
if (packageJson) {
  if (packageJson.dependencies?.duckdb === undefined) failures.push('package_json_missing_duckdb')
  if (packageJson.dependencies?.['nodejs-polars'] === undefined) failures.push('package_json_missing_nodejs_polars')
  const forbiddenDeps = ['ffmpeg', 'ffprobe', 'fluent-ffmpeg', '@ffmpeg/ffmpeg', '@ffmpeg/core']
  for (const dep of forbiddenDeps) {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep] || packageJson.optionalDependencies?.[dep]) {
      failures.push(`forbidden_dependency:${dep}`)
    }
  }
}

const packageLock = existsSync('package-lock.json') ? readJson('package-lock.json') : undefined
if (packageLock) {
  if (!packageLock.packages?.['node_modules/duckdb']) failures.push('package_lock_missing_duckdb')
  if (!packageLock.packages?.['node_modules/nodejs-polars']) failures.push('package_lock_missing_nodejs_polars')
}

const expectedPromptByDecision = {
  missing_optional_package_and_binary_execution_passed_ready_for_qa:
    'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-package-binary-qa-review.md',
  missing_optional_package_execution_passed_binary_missing_ready_for_system_binary_review:
    'docs/implementation-prompts/prompt-open-source-tool-stack-ffmpeg-ffprobe-system-binary-review.md',
  missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts:
    'docs/implementation-prompts/prompt-open-source-tool-stack-package-install-script-review.md',
}
const expectedPrompt =
  expectedPromptByDecision[decision?.decision] ??
  'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-execution-blocker-resolution.md'
if (!existsSync(expectedPrompt)) failures.push(`missing_next_prompt:${expectedPrompt}`)

if (failures.length) {
  console.error('Open-source missing optional package/binary execution diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      packageInstallExitCode: install?.installExitCode,
      duckdbStatus: duckdb?.status,
      polarsStatus: polars?.status,
      ffmpegStatus: ffmpeg?.status,
      ffprobeStatus: ffprobe?.status,
      packageLockIntegrity: integrity?.passed,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2
  )
)
