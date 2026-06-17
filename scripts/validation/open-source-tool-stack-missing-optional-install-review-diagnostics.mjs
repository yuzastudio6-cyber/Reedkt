import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const reportDir = 'docs/open-source-tool-stack/missing-optional-install-review'
const expectedDecision = 'missing_optional_install_review_passed_ready_for_package_and_binary_approval'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/evidence-revalidation-report.json`,
  `${reportDir}/evidence-revalidation-report.md`,
  `${reportDir}/duckdb-install-strategy.json`,
  `${reportDir}/duckdb-install-strategy.md`,
  `${reportDir}/polars-install-strategy.json`,
  `${reportDir}/polars-install-strategy.md`,
  `${reportDir}/ffmpeg-ffprobe-install-strategy.json`,
  `${reportDir}/ffmpeg-ffprobe-install-strategy.md`,
  `${reportDir}/package-lock-dependency-policy.json`,
  `${reportDir}/package-lock-dependency-policy.md`,
  `${reportDir}/system-binary-container-policy.json`,
  `${reportDir}/system-binary-container-policy.md`,
  `${reportDir}/synthetic-proof-plan.json`,
  `${reportDir}/synthetic-proof-plan.md`,
  `${reportDir}/missing-optional-install-review-decision.json`,
  `${reportDir}/missing-optional-install-review-decision.md`,
  `${reportDir}/missing-optional-install-review-readiness-report.json`,
  `${reportDir}/missing-optional-install-review-blocker-report.json`,
  `${reportDir}/missing-optional-install-review-private-artifact-manifest.json`,
  `${reportDir}/missing-optional-install-review-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-package-and-binary-approval.md',
]

const requiredEvidenceFiles = [
  'docs/open-source-tool-stack/batch-1-qa-review/batch-1-qa-review-decision.json',
  'docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
]

const forbiddenPatterns = [
  ['dependency_install_allowed', /\bdependencyInstallAllowed["']?\s*[:=]\s*true\b/i],
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
  ['pr384_canonical', /PR #384.*canonical/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
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
const duckdb = existsSync(`${reportDir}/duckdb-install-strategy.json`)
  ? readJson(`${reportDir}/duckdb-install-strategy.json`)
  : undefined
const polars = existsSync(`${reportDir}/polars-install-strategy.json`)
  ? readJson(`${reportDir}/polars-install-strategy.json`)
  : undefined
const ffmpeg = existsSync(`${reportDir}/ffmpeg-ffprobe-install-strategy.json`)
  ? readJson(`${reportDir}/ffmpeg-ffprobe-install-strategy.json`)
  : undefined
const packageLock = existsSync(`${reportDir}/package-lock-dependency-policy.json`)
  ? readJson(`${reportDir}/package-lock-dependency-policy.json`)
  : undefined
const systemBinary = existsSync(`${reportDir}/system-binary-container-policy.json`)
  ? readJson(`${reportDir}/system-binary-container-policy.json`)
  : undefined
const proofPlan = existsSync(`${reportDir}/synthetic-proof-plan.json`)
  ? readJson(`${reportDir}/synthetic-proof-plan.json`)
  : undefined
const decision = existsSync(`${reportDir}/missing-optional-install-review-decision.json`)
  ? readJson(`${reportDir}/missing-optional-install-review-decision.json`)
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.missingOptionalInstallReview.decision.v1') {
    failures.push(`decision_schema:${decision.schema}`)
  }
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL') {
    failures.push(`next_prompt:${decision.nextPrompt}`)
  }
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
if (evidence?.passed !== true) failures.push('evidence_revalidation_not_passed')
if (duckdb?.selectedFuturePackageCandidate !== 'duckdb') failures.push(`duckdb_candidate:${duckdb?.selectedFuturePackageCandidate}`)
if (duckdb?.dependencyInstallAllowedInThisReview !== false) failures.push('duckdb_install_allowed')
if (duckdb?.packageLockMutationAllowedInThisReview !== false) failures.push('duckdb_lock_mutation_allowed')
if (polars?.selectedFuturePackageCandidate !== 'nodejs-polars') {
  failures.push(`polars_candidate:${polars?.selectedFuturePackageCandidate}`)
}
if (polars?.dependencyInstallAllowedInThisReview !== false) failures.push('polars_install_allowed')
if (polars?.packageLockMutationAllowedInThisReview !== false) failures.push('polars_lock_mutation_allowed')
if (ffmpeg?.npmWrapperSelected !== false) failures.push('ffmpeg_npm_wrapper_selected')
if (ffmpeg?.systemBinaryInstallAllowedInThisReview !== false) failures.push('ffmpeg_binary_install_allowed')
if (ffmpeg?.containerImageMutationAllowedInThisReview !== false) failures.push('container_mutation_allowed')
if (packageLock?.packageLockUnchangedInThisReview !== true) failures.push('package_lock_policy_not_clean')
if (packageLock?.newDependencyAdditionsAllowedInThisReview !== false) failures.push('new_dependency_additions_allowed')
if (systemBinary?.installAllowedInThisReview !== false) failures.push('system_binary_install_allowed_in_policy')
if (proofPlan?.proofExecutionAllowedInThisReview !== false) failures.push('proof_execution_allowed')

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
  for (const section of sections) {
    for (const dep of forbiddenDeps) {
      if (packageJson[section]?.[dep]) failures.push(`forbidden_dependency_present:${section}:${dep}`)
    }
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
  console.error('Open-source missing optional install review diagnostics failed:')
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
      systemBinaryCandidates: decision?.systemBinaryCandidates,
      packageLockUnchanged: packageLock?.packageLockUnchangedInThisReview,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2
  )
)
