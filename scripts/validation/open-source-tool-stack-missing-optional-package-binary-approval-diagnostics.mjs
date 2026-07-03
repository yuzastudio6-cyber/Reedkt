import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const reportDir = 'docs/open-source-tool-stack/missing-optional-package-binary-approval'
const expectedDecision = 'missing_optional_package_and_binary_approval_passed_ready_for_execution'
const futurePackageCommand = 'npm install duckdb nodejs-polars --save-exact --ignore-scripts --no-audit --no-fund'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/evidence-revalidation-report.json`,
  `${reportDir}/evidence-revalidation-report.md`,
  `${reportDir}/duckdb-package-approval.json`,
  `${reportDir}/duckdb-package-approval.md`,
  `${reportDir}/polars-package-approval.json`,
  `${reportDir}/polars-package-approval.md`,
  `${reportDir}/ffmpeg-ffprobe-binary-approval.json`,
  `${reportDir}/ffmpeg-ffprobe-binary-approval.md`,
  `${reportDir}/package-lock-policy.json`,
  `${reportDir}/package-lock-policy.md`,
  `${reportDir}/system-binary-worker-container-policy.json`,
  `${reportDir}/system-binary-worker-container-policy.md`,
  `${reportDir}/future-execution-scope.json`,
  `${reportDir}/future-execution-scope.md`,
  `${reportDir}/package-binary-approval-decision.json`,
  `${reportDir}/package-binary-approval-decision.md`,
  `${reportDir}/package-binary-approval-readiness-report.json`,
  `${reportDir}/package-binary-approval-blocker-report.json`,
  `${reportDir}/package-binary-approval-private-artifact-manifest.json`,
  `${reportDir}/package-binary-approval-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-package-and-binary-execution.md',
]

const requiredEvidenceFiles = [
  'docs/open-source-tool-stack/missing-optional-install-review/missing-optional-install-review-decision.json',
  'docs/open-source-tool-stack/batch-1-qa-review/batch-1-qa-review-decision.json',
  'docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
]

const forbiddenPatterns = [
  ['dependency_install_allowed', /\bdependencyInstallAllowed["']?\s*[:=]\s*true\b/i],
  ['package_install_allowed', /\bpackageInstallAllowed["']?\s*[:=]\s*true\b/i],
  ['package_lock_mutation_allowed', /\bpackageLockMutationAllowed["']?\s*[:=]\s*true\b/i],
  ['system_binary_install_allowed', /\bsystemBinaryInstallAllowed["']?\s*[:=]\s*true\b/i],
  ['container_image_mutation_allowed', /\bcontainerImageMutationAllowed["']?\s*[:=]\s*true\b/i],
  ['import_smoke_allowed', /\bimportSmokeAllowed["']?\s*[:=]\s*true\b/i],
  ['version_probe_allowed', /\bversionProbeAllowed["']?\s*[:=]\s*true\b/i],
  ['fixture_proof_allowed', /\bfixtureProofAllowed["']?\s*[:=]\s*true\b/i],
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
  ['pr384_canonical_true', /"pr384Canonical"\s*:\s*true/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
]

const failures = []

function hasApprovedPostPr455PackageState() {
  const path = 'docs/open-source-tool-stack/missing-optional-package-binary-execution/package-binary-execution-decision.json'
  if (!existsSync(path)) return false
  try {
    const document = JSON.parse(readFileSync(path, 'utf8'))
    return document.decision === 'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts'
  } catch {
    return false
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return undefined
  }
}

for (const file of [...requiredFiles, ...requiredEvidenceFiles]) {
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

const sourceAudit = existsSync(`${reportDir}/source-of-truth-audit.json`)
  ? readJson(`${reportDir}/source-of-truth-audit.json`)
  : undefined
const evidence = existsSync(`${reportDir}/evidence-revalidation-report.json`)
  ? readJson(`${reportDir}/evidence-revalidation-report.json`)
  : undefined
const duckdb = existsSync(`${reportDir}/duckdb-package-approval.json`)
  ? readJson(`${reportDir}/duckdb-package-approval.json`)
  : undefined
const polars = existsSync(`${reportDir}/polars-package-approval.json`)
  ? readJson(`${reportDir}/polars-package-approval.json`)
  : undefined
const ffmpeg = existsSync(`${reportDir}/ffmpeg-ffprobe-binary-approval.json`)
  ? readJson(`${reportDir}/ffmpeg-ffprobe-binary-approval.json`)
  : undefined
const packageLock = existsSync(`${reportDir}/package-lock-policy.json`)
  ? readJson(`${reportDir}/package-lock-policy.json`)
  : undefined
const systemBinary = existsSync(`${reportDir}/system-binary-worker-container-policy.json`)
  ? readJson(`${reportDir}/system-binary-worker-container-policy.json`)
  : undefined
const futureScope = existsSync(`${reportDir}/future-execution-scope.json`)
  ? readJson(`${reportDir}/future-execution-scope.json`)
  : undefined
const decision = existsSync(`${reportDir}/package-binary-approval-decision.json`)
  ? readJson(`${reportDir}/package-binary-approval-decision.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.missingOptionalPackageBinaryApproval.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION') {
    failures.push(`next_prompt:${decision.nextPrompt}`)
  }
  if (decision.futurePackageCommand !== futurePackageCommand) failures.push('future_package_command_mismatch')
  if (decision.packageInstallAttempted !== false) failures.push('package_install_attempted')
  if (decision.dependencyInstallAttempted !== false) failures.push('dependency_install_attempted')
  if (decision.packageLockMutationAttempted !== false) failures.push('package_lock_mutation_attempted')
  if (decision.systemBinaryInstallAttempted !== false) failures.push('system_binary_install_attempted')
  if (decision.containerImageMutationAttempted !== false) failures.push('container_image_mutation_attempted')
  if (decision.importSmokeRun !== false) failures.push('import_smoke_run')
  if (decision.versionProbeRun !== false) failures.push('version_probe_run')
  if (decision.fixtureProofRun !== false) failures.push('fixture_proof_run')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
  if (decision.executionScope && Object.values(decision.executionScope).some((value) => value !== false)) {
    failures.push('decision_execution_scope_not_all_false')
  }
}

if (sourceAudit?.pr384Canonical !== false) failures.push('pr384_not_reference_only')
if (sourceAudit?.pr401Canonical !== false) failures.push('pr401_not_reference_only')
if (sourceAudit?.pr417Canonical !== false) failures.push('pr417_not_reference_only')
if (sourceAudit?.pr420Canonical !== false) failures.push('pr420_not_reference_only')
if (sourceAudit?.pr423Canonical !== false) failures.push('pr423_not_reference_only')
if (sourceAudit?.pr425Canonical !== false) failures.push('pr425_not_reference_only')
if (sourceAudit?.pr428Canonical !== false) failures.push('pr428_not_reference_only')
if (sourceAudit?.pr432Canonical !== false) failures.push('pr432_not_reference_only')

if (evidence?.passed !== true) failures.push('evidence_revalidation_not_passed')
if (evidence?.predecessorPrsMerged !== true) failures.push('predecessor_prs_not_merged')

if (duckdb?.selectedFuturePackageCandidate !== 'duckdb') failures.push(`duckdb_candidate:${duckdb?.selectedFuturePackageCandidate}`)
if (duckdb?.futurePackageCommand !== futurePackageCommand) failures.push('duckdb_future_command_mismatch')
if (duckdb?.currentPhasePackageInstallAttempted !== false) failures.push('duckdb_current_package_install_attempted')
if (duckdb?.currentPhasePackageLockMutationAttempted !== false) failures.push('duckdb_current_lock_mutation_attempted')

if (polars?.selectedFuturePackageCandidate !== 'nodejs-polars') {
  failures.push(`polars_candidate:${polars?.selectedFuturePackageCandidate}`)
}
if (polars?.futurePackageCommand !== futurePackageCommand) failures.push('polars_future_command_mismatch')
if (polars?.currentPhasePackageInstallAttempted !== false) failures.push('polars_current_package_install_attempted')
if (polars?.currentPhasePackageLockMutationAttempted !== false) failures.push('polars_current_lock_mutation_attempted')

if (ffmpeg?.npmWrapperSelected !== false) failures.push('ffmpeg_npm_wrapper_selected')
if (ffmpeg?.repoPackageMutationPlanned !== false) failures.push('ffmpeg_repo_package_mutation_planned')
if (ffmpeg?.dockerOrContainerMutationPlannedInThisLane !== false) failures.push('container_mutation_planned')
if (ffmpeg?.currentPhaseSystemBinaryInstallAttempted !== false) failures.push('ffmpeg_binary_install_attempted')
if (ffmpeg?.currentPhaseVersionProbeAttempted !== false) failures.push('ffmpeg_probe_attempted')

if (packageLock?.packageLockUnchangedInThisApproval !== true) failures.push('package_lock_policy_not_clean')
if (packageLock?.currentPhasePackageLockMutationAttempted !== false) failures.push('package_lock_policy_mutation_attempted')
if (packageLock?.currentPhasePackageInstallAttempted !== false) failures.push('package_lock_policy_install_attempted')

if (systemBinary?.currentPhaseSystemBinaryInstallAttempted !== false) failures.push('system_binary_install_attempted_in_policy')
if (systemBinary?.currentPhaseDockerfileMutationAttempted !== false) failures.push('docker_mutation_attempted_in_policy')
if (futureScope?.currentPhaseExecutionAllowed !== false) failures.push('future_scope_execution_allowed')

const packageJson = existsSync('package.json') ? readJson('package.json') : undefined
if (packageJson) {
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies']
  const forbiddenDeps = [
    'duckdb',
    'nodejs-polars',
    'ffmpeg',
    'ffprobe',
    'fluent-ffmpeg',
    '@ffmpeg/ffmpeg',
    '@ffmpeg/core',
  ]
  const approvedPostPr455Deps = hasApprovedPostPr455PackageState() ? new Set(['duckdb', 'nodejs-polars']) : new Set()
  for (const section of sections) {
    for (const dep of forbiddenDeps) {
      if (section === 'dependencies' && approvedPostPr455Deps.has(dep)) continue
      if (packageJson[section]?.[dep]) failures.push(`forbidden_dependency_present:${section}:${dep}`)
    }
  }
  if (
    packageJson.scripts?.['open-source-tool-stack:missing-optional-package-binary-approval:diagnostics'] !==
    'node scripts/validation/open-source-tool-stack-missing-optional-package-binary-approval-diagnostics.mjs'
  ) {
    failures.push('missing_package_script:open-source-tool-stack:missing-optional-package-binary-approval:diagnostics')
  }
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
  console.error('Open-source missing optional package/binary approval diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      duckdbCandidate: duckdb?.selectedFuturePackageCandidate,
      polarsCandidate: polars?.selectedFuturePackageCandidate,
      futurePackageCommand: decision?.futurePackageCommand,
      systemBinaryCandidates: decision?.systemBinaryCandidates,
      packageLockUnchanged: packageLock?.packageLockUnchangedInThisApproval,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2
  )
)
