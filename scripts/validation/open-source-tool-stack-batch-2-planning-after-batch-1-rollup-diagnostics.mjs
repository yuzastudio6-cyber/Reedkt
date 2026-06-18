import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/batch-2-planning-after-batch-1-rollup'
const expectedDecision = 'open_source_tool_stack_batch2_planning_passed_ready_for_owner_lane_reconciliation'
const primaryNextPrompt = 'OPEN_SOURCE_TOOL_STACK_OWNER_LANE_RECONCILIATION_AFTER_BATCH_1_ROLLUP'

const requiredFiles = [
  'source-of-truth-audit.json',
  'batch-1-closure-snapshot.json',
  'batch-1-closure-snapshot.md',
  'batch-2-candidate-inventory.json',
  'batch-2-candidate-inventory.md',
  'owner-lane-reconciliation-map.json',
  'owner-lane-reconciliation-map.md',
  'batch-2-recommended-candidate-set.json',
  'batch-2-recommended-candidate-set.md',
  'internal-beta-readiness-implication.json',
  'internal-beta-readiness-implication.md',
  'batch-2-planning-decision.json',
  'batch-2-planning-decision.md',
  'batch-2-planning-readiness-report.json',
  'batch-2-planning-private-artifact-manifest.json',
  'batch-2-planning-validation-results.md',
].map((file) => `${reportDir}/${file}`)

const requiredPromptFiles = [
  'docs/implementation-prompts/prompt-open-source-tool-stack-owner-lane-reconciliation-after-batch-1-rollup.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-batch-2-install-proof-approval.md',
  'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-open-source-batch-1.md',
  'docs/implementation-prompts/prompt-e2e-validation-queue-blocker-resolution-after-open-source-batch-1.md',
]

const failures = []
for (const file of [...requiredFiles, ...requiredPromptFiles]) {
  if (!existsSync(file)) failures.push(`missing_file:${file}`)
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function gitStatus(path) {
  return git(['status', '--short', '--', path])
}

function packageJsonAt(ref) {
  try {
    return JSON.parse(git(['show', `${ref}:package.json`]))
  } catch {
    return null
  }
}

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const closure = readJson(`${reportDir}/batch-1-closure-snapshot.json`)
const inventory = readJson(`${reportDir}/batch-2-candidate-inventory.json`)
const ownerMap = readJson(`${reportDir}/owner-lane-reconciliation-map.json`)
const recommended = readJson(`${reportDir}/batch-2-recommended-candidate-set.json`)
const beta = readJson(`${reportDir}/internal-beta-readiness-implication.json`)
const decision = readJson(`${reportDir}/batch-2-planning-decision.json`)
const readiness = readJson(`${reportDir}/batch-2-planning-readiness-report.json`)
const manifest = readJson(`${reportDir}/batch-2-planning-private-artifact-manifest.json`)

if (decision.schema !== 'reeditpro.openSourceToolStack.batch2PlanningAfterBatch1Rollup.decision.v1') {
  failures.push(`decision_schema:${decision.schema}`)
}
if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
if (decision.primaryNextPrompt !== primaryNextPrompt) failures.push(`primary_next_prompt:${decision.primaryNextPrompt}`)
if (readiness.readiness !== true) failures.push('readiness_not_true')
if (sourceAudit.expectedSourceSha !== '96b5b0e69ba69f22d778aefe748128562fc3112a') {
  failures.push(`source_sha:${sourceAudit.expectedSourceSha}`)
}
if (closure.accepted !== true) failures.push('batch1_closure_not_accepted')
if (inventory.accepted !== true) failures.push('candidate_inventory_not_accepted')
if (ownerMap.accepted !== true) failures.push('owner_lane_map_not_accepted')
if (recommended.accepted !== true) failures.push('recommended_candidate_set_not_accepted')
if (beta.accepted !== true) failures.push('internal_beta_implication_not_accepted')

const rows = Array.isArray(inventory.details?.rows) ? inventory.details.rows : []
if (rows.length !== 71) failures.push(`candidate_count:${rows.length}`)
if (!rows.some((row) => row.recommendedBatch2Status === 'owner_reconcile')) failures.push('missing_owner_reconcile_candidates')
if (!rows.some((row) => row.recommendedBatch2Status === 'provider_lane')) failures.push('missing_provider_lane_candidates')
if (!rows.some((row) => row.recommendedBatch2Status === 'runtime_lane')) failures.push('missing_runtime_lane_candidates')
for (const id of ['sharp_libvips', 'duckdb', 'polars', 'ffmpeg', 'ffprobe']) {
  const row = rows.find((entry) => entry.normalizedId === id)
  if (!row) failures.push(`missing_batch1_row:${id}`)
  else if (row.proofStatus !== 'accepted_bounded_batch1_proof') failures.push(`batch1_row_not_bounded:${id}`)
}

const lanes = Array.isArray(ownerMap.details?.lanes) ? ownerMap.details.lanes : []
for (const laneName of [
  'AI_TOOLS_CREATIVE_GRAPHICS / Worker Runtime',
  'SOUND_MUSIC_AUDIO',
  'TRACK_A_RENDER_EXPORT',
  'E2E_VALIDATION_QUEUE',
  'MODEL_PROVIDER_SUPABASE',
]) {
  if (!lanes.some((lane) => lane.lane === laneName)) failures.push(`missing_owner_lane:${laneName}`)
}

for (const field of [
  'batch2InstallProofApprovalNow',
  'internalBetaReadinessAggregationNow',
  'e2eValidationBlockerResolutionNow',
  'fortyPlusToolsEndToEndProven',
  'mediaProcessingAccepted',
  'renderExportAccepted',
  'workerRuntimeAccepted',
  'routeProviderRuntimeAccepted',
  'supabaseGcsPublicDeliveryAccepted',
  'externalBetaUnlocked',
  'productionUnlocked',
  'runtimeCommandsRunInThisPhase',
  'dockerRunInThisPhase',
  'ffmpegFfprobeRunInThisPhase',
  'npmInstallRunInThisPhase',
  'npmRebuildRunInThisPhase',
  'packageLockMutationAllowed',
]) {
  if (decision[field] !== false) failures.push(`decision_${field}_not_false`)
}

for (const field of [
  'dependencyInstallRunInThisPhase',
  'npmInstallRunInThisPhase',
  'npmRebuildRunInThisPhase',
  'packageLockMutationAllowed',
  'dockerBuildRunInThisPhase',
  'dockerRunRunInThisPhase',
  'ffmpegProbeRunInThisPhase',
  'ffprobeProbeRunInThisPhase',
  'buildContextGenerationRunInThisPhase',
  'mediaProcessingRunInThisPhase',
  'renderExportRunInThisPhase',
  'workersRoutesProvidersRunInThisPhase',
  'supabaseWritesRunInThisPhase',
  'gcsUploadRunInThisPhase',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'privatePayloadsAccessed',
  'secretsAccessed',
  'secretsPrinted',
  'secretsCommitted',
]) {
  if (manifest[field] !== false) failures.push(`manifest_${field}_not_false`)
}

if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('decision_supabase_not_no_write')
if (manifest.supabaseClassification?.sqlExecuted !== 'none') failures.push('manifest_supabase_sql_not_none')

for (const path of ['package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']) {
  const status = gitStatus(path)
  if (status) failures.push(`protected_file_changed:${path}:${status}`)
}
for (const path of ['dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker', 'node_modules']) {
  if (existsSync(path)) failures.push(`forbidden_output_present:${path}`)
  const status = gitStatus(path)
  if (status) failures.push(`forbidden_output_staged_or_tracked:${path}:${status}`)
}

const basePackageJson = packageJsonAt('origin/codex/rp-github-merge-hygiene-open-pr-stack-audit')
const localPackageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (basePackageJson) {
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(localPackageJson[key] ?? {}) !== JSON.stringify(basePackageJson[key] ?? {})) {
      failures.push(`package_dependency_section_changed:${key}`)
    }
  }
}

const docsText = requiredFiles
  .filter((file) => existsSync(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
const forbiddenPatterns = [
  ['forty_plus_end_to_end_proven', /40\+ tools (?:are )?(?:installed\/proven|end-to-end proven)/i],
  ['secret_material', /\b(AKIA[0-9A-Z]{16}|sk-(?:proj|live|test)-[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
  ['media_processing_accepted_true', /\bmediaProcessingAccepted["']?\s*[:=]\s*true\b/i],
  ['render_export_accepted_true', /\brenderExportAccepted["']?\s*[:=]\s*true\b/i],
  ['external_beta_unlocked_true', /\bexternalBetaUnlocked["']?\s*[:=]\s*true\b/i],
  ['production_unlocked_true', /\bproductionUnlocked["']?\s*[:=]\s*true\b/i],
]
for (const [label, pattern] of forbiddenPatterns) {
  if (pattern.test(docsText)) failures.push(`forbidden_pattern:${label}`)
}

if (failures.length) {
  console.error('Batch 2 planning diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.decision,
      candidateCount: rows.length,
      ownerReconcileCount: rows.filter((row) => row.recommendedBatch2Status === 'owner_reconcile').length,
      primaryNextPrompt,
      supabaseClassification: decision.supabaseClassification,
    },
    null,
    2,
  ),
)
