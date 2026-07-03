import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/package-install-script-review'
const expectedDecision = 'package_install_script_review_passed_ready_for_duckdb_native_rebuild_execution'
const futureCommand = 'npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/evidence-revalidation-report.json`,
  `${reportDir}/evidence-revalidation-report.md`,
  `${reportDir}/duckdb-native-binding-blocker-analysis.json`,
  `${reportDir}/duckdb-native-binding-blocker-analysis.md`,
  `${reportDir}/lifecycle-script-safety-policy.json`,
  `${reportDir}/lifecycle-script-safety-policy.md`,
  `${reportDir}/future-duckdb-proof-plan.json`,
  `${reportDir}/future-duckdb-proof-plan.md`,
  `${reportDir}/package-artifact-policy.json`,
  `${reportDir}/package-artifact-policy.md`,
  `${reportDir}/ffmpeg-ffprobe-follow-up-classification.json`,
  `${reportDir}/ffmpeg-ffprobe-follow-up-classification.md`,
  `${reportDir}/package-install-script-review-decision.json`,
  `${reportDir}/package-install-script-review-decision.md`,
  `${reportDir}/package-install-script-review-readiness-report.json`,
  `${reportDir}/package-install-script-review-blocker-report.json`,
  `${reportDir}/package-install-script-review-private-artifact-manifest.json`,
  `${reportDir}/package-install-script-review-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-duckdb-native-rebuild-execution.md',
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
  ['lifecycle_ran', /lifecycleScriptsExecuted["']?\s*[:=]\s*true/i],
  ['native_rebuild_ran', /nativeBindingRebuildExecuted["']?\s*[:=]\s*true/i],
  ['duckdb_import_ran', /duckdbImportOrQueryExecuted["']?\s*[:=]\s*true/i],
  ['polars_rerun', /polarsProofRerun["']?\s*[:=]\s*true/i],
  ['ffmpeg_probe', /ffmpegFfprobeProbeRun["']?\s*[:=]\s*true/i],
  ['dependency_install_now', /dependencyInstallAttempted["']?\s*[:=]\s*true/i],
  ['package_lock_mutation_now', /packageLockMutationAttempted["']?\s*[:=]\s*true/i],
  ['broad_script_allowed', /broadScriptExecutionAllowed["']?\s*[:=]\s*true/i],
  ['tool_execution_allowed', /\btoolExecutionAllowed["']?\s*[:=]\s*true/i],
  ['worker_execution_allowed', /\bworkerExecutionAllowed["']?\s*[:=]\s*true/i],
  ['provider_execution_allowed', /\bproviderExecutionAllowed["']?\s*[:=]\s*true/i],
  ['supabase_write_allowed', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true/i],
  ['gcs_upload_allowed', /\bgcsUploadAllowed["']?\s*[:=]\s*true/i],
  ['public_artifact_allowed', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true/i],
  ['signed_url_allowed', /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true/i],
  ['raw_prompt_allowed', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true/i],
  ['production_unlock_allowed', /\bproductionUnlockAllowed["']?\s*[:=]\s*true/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decision = existsSync(`${reportDir}/package-install-script-review-decision.json`)
  ? readJson(`${reportDir}/package-install-script-review-decision.json`)
  : undefined
const lifecycle = existsSync(`${reportDir}/lifecycle-script-safety-policy.json`)
  ? readJson(`${reportDir}/lifecycle-script-safety-policy.json`)
  : undefined
const duckdb = existsSync(`${reportDir}/duckdb-native-binding-blocker-analysis.json`)
  ? readJson(`${reportDir}/duckdb-native-binding-blocker-analysis.json`)
  : undefined
const artifact = existsSync(`${reportDir}/package-artifact-policy.json`)
  ? readJson(`${reportDir}/package-artifact-policy.json`)
  : undefined
const evidence = existsSync(`${reportDir}/evidence-revalidation-report.json`)
  ? readJson(`${reportDir}/evidence-revalidation-report.json`)
  : undefined

if (decision?.decision !== expectedDecision) failures.push(`decision:${decision?.decision}`)
if (decision?.futureCommand !== futureCommand) failures.push(`future_command:${decision?.futureCommand}`)
if (decision?.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_EXECUTION') {
  failures.push(`next_prompt:${decision?.nextPrompt}`)
}
if (decision?.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
if (lifecycle?.packageLifecycleScriptExecutionApprovedNow !== false) failures.push('lifecycle_execution_approved_now')
if (lifecycle?.futureLifecycleScriptExecutionApproved !== true) failures.push('future_lifecycle_execution_not_approved')
if (lifecycle?.futureCommand !== futureCommand) failures.push('lifecycle_future_command_mismatch')
if (lifecycle?.packageLockMutationExpected !== false) failures.push('package_lock_mutation_expected')
if (duckdb?.packageVersion !== '1.4.4') failures.push(`duckdb_version:${duckdb?.packageVersion}`)
if (duckdb?.bindingExists !== false) failures.push('duckdb_binding_not_missing')
if (artifact?.nodeModulesCommitted !== false) failures.push('node_modules_commit_policy_invalid')
if (artifact?.nativeBinariesCommitted !== false) failures.push('native_binary_commit_policy_invalid')
if (evidence?.pr455Decision !== 'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts') {
  failures.push(`pr455_decision:${evidence?.pr455Decision}`)
}

const packageJson = readJson('package.json')
if (packageJson?.dependencies?.duckdb !== '1.4.4') failures.push(`duckdb_dependency:${packageJson?.dependencies?.duckdb}`)
if (packageJson?.dependencies?.['nodejs-polars'] !== '0.25.1') {
  failures.push(`nodejs_polars_dependency:${packageJson?.dependencies?.['nodejs-polars']}`)
}

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
  console.error('Open-source package install script review diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      futureCommand: decision?.futureCommand,
      nextPrompt: decision?.nextPrompt,
      duckdbStatus: evidence?.duckdbStatus,
      polarsStatus: evidence?.polarsStatus,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2,
  ),
)
