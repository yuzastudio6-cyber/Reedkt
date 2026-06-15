import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const expectedDecision = 'dependency_baseline_repair_passed_ready_for_batch_1_approval_rerun'

const requiredDocs = [
  'docs/open-source-tool-stack/dependency-baseline-repair/source-of-truth-audit.json',
  'docs/open-source-tool-stack/dependency-baseline-repair/pre-repair-reproduction.json',
  'docs/open-source-tool-stack/dependency-baseline-repair/pre-repair-reproduction.md',
  'docs/open-source-tool-stack/dependency-baseline-repair/pr-423-reference-review.json',
  'docs/open-source-tool-stack/dependency-baseline-repair/pr-423-reference-review.md',
  'docs/open-source-tool-stack/dependency-baseline-repair/repair-diff-review.json',
  'docs/open-source-tool-stack/dependency-baseline-repair/repair-diff-review.md',
  'docs/open-source-tool-stack/dependency-baseline-repair/post-repair-validation.json',
  'docs/open-source-tool-stack/dependency-baseline-repair/post-repair-validation.md',
  'docs/open-source-tool-stack/dependency-baseline-repair/dependency-baseline-repair-decision.json',
  'docs/open-source-tool-stack/dependency-baseline-repair/dependency-baseline-repair-decision.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-install-proof-approval-batch-1-rerun-after-dependency-repair.md',
]

const expectedEmnapiEntries = {
  'node_modules/@emnapi/core': {
    version: '1.11.1',
    resolved: 'https://registry.npmjs.org/@emnapi/core/-/core-1.11.1.tgz',
    integrity: 'sha512-RSvbQmHzdKzNsLYa/wHrbc3KN4sYLKAdPZxqiM2HATqv/SBk2/ENSHpvXGaLOMcsAyz0poEGqkmmKYG3OWiJEQ==',
    dev: true,
    license: 'MIT',
    optional: true,
    peer: true,
    dependencies: {
      '@emnapi/wasi-threads': '1.2.2',
      tslib: '^2.4.0',
    },
  },
  'node_modules/@emnapi/runtime': {
    version: '1.11.1',
    resolved: 'https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.11.1.tgz',
    integrity: 'sha512-vgj7R3y3Wgx24IQaGPA/R6YFXLHVMOZ0uVEyIQPaWs+rd1AzfEMXlAC22FYwO1XkKR6NPsq7mUandH8oIRdZFw==',
    license: 'MIT',
    optional: true,
    dependencies: {
      tslib: '^2.4.0',
    },
  },
  'node_modules/@emnapi/wasi-threads': {
    version: '1.2.2',
    resolved: 'https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.2.2.tgz',
    integrity: 'sha512-c95qOXkHdydNKhscBTebqEC1CVAZpyqOfVfBzQ1qgzyl3gfeldUjIggDbIZgDKsHLgnsM+igH7TJ/eAasaVuMA==',
    dev: true,
    license: 'MIT',
    optional: true,
    peer: true,
    dependencies: {
      tslib: '^2.4.0',
    },
  },
  'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/core': {
    version: '1.10.0',
    resolved: 'https://registry.npmjs.org/@emnapi/core/-/core-1.10.0.tgz',
    integrity: 'sha512-yq6OkJ4p82CAfPl0u9mQebQHKPJkY7WrIuk205cTYnYe+k2Z8YBh11FrbRG/H6ihirqcacOgl2BIO8oyMQLeXw==',
    dev: true,
    license: 'MIT',
    optional: true,
    dependencies: {
      '@emnapi/wasi-threads': '1.2.1',
      tslib: '^2.4.0',
    },
  },
  'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/runtime': {
    version: '1.10.0',
    resolved: 'https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.10.0.tgz',
    integrity: 'sha512-ewvYlk86xUoGI0zQRNq/mC+16R1QeDlKQy21Ki3oSYXNgLb45GV1P6A0M+/s6nyCuNDqe5VpaY84BzXGwVbwFA==',
    dev: true,
    license: 'MIT',
    optional: true,
    dependencies: {
      tslib: '^2.4.0',
    },
  },
  'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/wasi-threads': {
    version: '1.2.1',
    resolved: 'https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.2.1.tgz',
    integrity: 'sha512-uTII7OYF+/Mes/MrcIOYp5yOtSMLBWSIoLPpcgwipoiKbli6k322tcoFsxoIIxPDqW01SQGAgko4EzZi2BNv2w==',
    dev: true,
    license: 'MIT',
    optional: true,
    dependencies: {
      tslib: '^2.4.0',
    },
  },
}

const expectedPreRepairBlockers = [
  'missing @emnapi/runtime@1.11.1',
  'missing @emnapi/core@1.11.1',
  'invalid @emnapi/wasi-threads@1.2.1 not satisfying 1.2.2',
  'missing @emnapi/core@1.10.0',
  'missing @emnapi/runtime@1.10.0',
  'missing @emnapi/wasi-threads@1.2.1',
]

const forbiddenDependencyNames = [
  'duckdb',
  'polars',
  'ffmpeg',
  'ffprobe',
  'd3',
  'echarts',
  'vega',
  'vega-lite',
]

const falseScopeFlags = [
  'newToolDependenciesAdded',
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'providerExecutionAllowed',
  'runtimeExecutionAllowed',
  'mediaProcessingAllowed',
  'audioProcessingAllowed',
  'renderExecutionAllowed',
  'imageGenerationAllowed',
  'browserCaptureAllowed',
  'mapRenderingAllowed',
  'supabaseWritesAllowed',
  'sqlAllowed',
  'gcsUploadAllowed',
  'publicArtifactsAllowed',
  'signedUrlsAsSourceOfTruthAllowed',
  'rawPromptExecutionAllowed',
  'githubPrMergeAllowed',
  'externalBetaUnlockAllowed',
  'paidProductionUnlockAllowed',
  'productionUnlockAllowed',
]

const secretPattern = new RegExp(
  String.raw`\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|` +
    'X-' +
    String.raw`Goog-Signature=|X-` +
    String.raw`Amz-Signature=)\b`,
  'i',
)

const failures = []

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return undefined
  }
}

function gitShow(path) {
  return execFileSync('git', ['show', `${repairBaselineRef()}:${path}`], {
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  })
}

function repairBaselineRef() {
  const line = execFileSync('git', ['rev-list', '--parents', '-n', '1', 'HEAD'], {
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
  const [, firstParent] = line.split(/\s+/)
  return firstParent ?? 'HEAD'
}

function stable(value) {
  return JSON.stringify(value)
}

function changedPackageLockKeys() {
  const before = JSON.parse(gitShow('package-lock.json'))
  const after = JSON.parse(readFileSync('package-lock.json', 'utf8'))
  const topLevelKeys = new Set([...Object.keys(before), ...Object.keys(after)].filter((key) => key !== 'packages'))
  for (const key of topLevelKeys) {
    if (stable(before[key]) !== stable(after[key])) failures.push(`package_lock_top_level_changed:${key}`)
  }

  const beforePackages = before.packages ?? {}
  const afterPackages = after.packages ?? {}
  const keys = new Set([...Object.keys(beforePackages), ...Object.keys(afterPackages)])
  return [...keys].filter((key) => stable(beforePackages[key]) !== stable(afterPackages[key])).sort()
}

function assertExactPackageLockRepair() {
  const changedKeys = changedPackageLockKeys()
  const expectedKeys = Object.keys(expectedEmnapiEntries).sort()
  if (stable(changedKeys) !== stable(expectedKeys)) {
    failures.push(`package_lock_diff_not_exact:${changedKeys.join(',')}`)
  }

  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
  for (const [key, expectedEntry] of Object.entries(expectedEmnapiEntries)) {
    if (stable(lock.packages?.[key]) !== stable(expectedEntry)) failures.push(`emnapi_entry_mismatch:${key}`)
  }
}

function assertPackageJsonDependencySectionsUnchanged() {
  const before = JSON.parse(gitShow('package.json'))
  const after = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (stable(before[section] ?? {}) !== stable(after[section] ?? {})) failures.push(`package_json_dependency_section_changed:${section}`)
  }
  for (const name of forbiddenDependencyNames) {
    for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
      if (after[section]?.[name] && before[section]?.[name] !== after[section][name]) failures.push(`new_forbidden_dependency:${section}:${name}`)
    }
  }
}

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

if (secretPattern.test(docsText)) failures.push('secret_pattern_in_repair_docs')

const sourceAudit = existsSync(requiredDocs[0]) ? readJson(requiredDocs[0]) : undefined
const preRepair = existsSync(requiredDocs[1]) ? readJson(requiredDocs[1]) : undefined
const pr423Review = existsSync(requiredDocs[3]) ? readJson(requiredDocs[3]) : undefined
const repairDiff = existsSync(requiredDocs[5]) ? readJson(requiredDocs[5]) : undefined
const postRepair = existsSync(requiredDocs[7]) ? readJson(requiredDocs[7]) : undefined
const decision = existsSync(requiredDocs[9]) ? readJson(requiredDocs[9]) : undefined

for (const document of [sourceAudit, repairDiff, postRepair, decision]) {
  if (!document) continue
  if (document.decision !== expectedDecision) failures.push(`${document.schema ?? 'document'}:decision:${document.decision}`)
  for (const flag of falseScopeFlags) {
    if (document.executionScope?.[flag] !== false) failures.push(`${document.schema ?? 'document'}:${flag}_not_false`)
  }
}

if (sourceAudit) {
  for (const pr of ['421', '416', '412']) {
    const entry = sourceAudit.prEvidence?.find((item) => String(item.number) === pr)
    if (entry?.state !== 'MERGED' || !entry?.mergedAt) failures.push(`source_audit_pr_not_merged:${pr}`)
  }
  for (const pr of ['423', '420', '417', '401', '384']) {
    const entry = sourceAudit.referenceOnlyPrEvidence?.find((item) => String(item.number) === pr)
    if (!entry?.referenceOnly || entry?.canonical === true) failures.push(`source_audit_reference_pr_not_reference_only:${pr}`)
  }
  if (sourceAudit.supabaseClassification?.updateRequired !== 'no write') failures.push('source_audit_supabase_update_required_not_no_write')
  if (sourceAudit.supabaseClassification?.environmentTouched !== 'none') failures.push('source_audit_supabase_environment_not_none')
  if (sourceAudit.supabaseClassification?.sqlExecuted !== 'none') failures.push('source_audit_sql_not_none')
  if (sourceAudit.supabaseClassification?.migrationDeployed !== 'no') failures.push('source_audit_migration_not_no')
  if (sourceAudit.secretPolicy?.payloadAccessed !== false || sourceAudit.secretPolicy?.payloadPrinted !== false || sourceAudit.secretPolicy?.payloadCommitted !== false) {
    failures.push('source_audit_secret_policy_not_false')
  }
}

if (preRepair) {
  if (preRepair.result !== 'failed_without_tracked_file_mutation') failures.push(`pre_repair_result:${preRepair.result}`)
  for (const blocker of expectedPreRepairBlockers) {
    if (!preRepair.blockers?.includes(blocker)) failures.push(`pre_repair_missing_blocker:${blocker}`)
  }
}

if (pr423Review) {
  if (pr423Review.referenceOnly !== true || pr423Review.canonical !== false) failures.push('pr423_not_reference_only')
  if (pr423Review.packageJsonChangesCopied !== false) failures.push('pr423_package_json_changes_copied_not_false')
}

if (repairDiff) {
  if (repairDiff.packageJsonDependencySectionsChanged !== false) failures.push('repair_diff_package_json_dependency_sections_changed')
  if (repairDiff.newToolDependenciesAdded !== false) failures.push('repair_diff_new_tool_dependencies_added')
  if (repairDiff.allowedPackageLockMetadataOnly !== true) failures.push('repair_diff_not_metadata_only')
  const keys = new Set(repairDiff.changedPackageLockPackageKeys ?? [])
  for (const key of Object.keys(expectedEmnapiEntries)) {
    if (!keys.has(key)) failures.push(`repair_diff_missing_key:${key}`)
  }
}

if (postRepair) {
  if (postRepair.npmCiResult !== 'passed') failures.push(`post_repair_npm_ci:${postRepair.npmCiResult}`)
  if (postRepair.npmCiCommand !== 'npm ci --ignore-scripts --no-audit --no-fund') failures.push('post_repair_command_mismatch')
  if (postRepair.packageLockStatusAfterValidation !== 'modified_only_by_repair') failures.push(`post_repair_lock_status:${postRepair.packageLockStatusAfterValidation}`)
}

if (decision) {
  if (decision.readyForBatch1ApprovalRerun !== true) failures.push('decision_not_ready_for_batch_1_rerun')
  if (decision.readyForInstallProofExecution !== false) failures.push('decision_ready_for_execution_not_false')
  if (decision.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_APPROVAL_BATCH_1_RERUN_AFTER_DEPENDENCY_REPAIR') failures.push(`decision_next_prompt:${decision.nextPrompt}`)
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['dependency-baseline:repair-before-tool-batch-1:diagnostics'] !==
  'node scripts/validation/dependency-baseline-repair-before-tool-batch-1-diagnostics.mjs'
) {
  failures.push('missing_package_script:dependency-baseline:repair-before-tool-batch-1:diagnostics')
}

assertExactPackageLockRepair()
assertPackageJsonDependencySectionsUnchanged()

if (failures.length > 0) {
  console.error('Dependency baseline repair diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Dependency baseline repair diagnostics passed.')
console.log(`Decision: ${expectedDecision}`)
console.log('Next prompt: OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_APPROVAL_BATCH_1_RERUN_AFTER_DEPENDENCY_REPAIR')
