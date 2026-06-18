import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/batch-1-final-rollup-after-ffmpeg-ffprobe-proof'
const expectedDecision =
  'open_source_tool_stack_batch1_final_rollup_passed_media_processing_still_blocked_ready_for_batch2_planning'
const expectedFfmpegVersion = '5.1.9-0+deb12u1'
const primaryNextPrompt = 'OPEN_SOURCE_TOOL_STACK_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP'
const secondaryNextPrompt = 'PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1'

const requiredFiles = [
  'source-of-truth-audit.json',
  'evidence-revalidation-report.json',
  'evidence-revalidation-report.md',
  'batch-1-accepted-tools-matrix.json',
  'batch-1-accepted-tools-matrix.md',
  'still-blocked-scope-matrix.json',
  'still-blocked-scope-matrix.md',
  'internal-beta-impact-review.json',
  'internal-beta-impact-review.md',
  'batch-2-planning-handoff.json',
  'batch-2-planning-handoff.md',
  'batch-1-final-rollup-decision.json',
  'batch-1-final-rollup-decision.md',
  'batch-1-final-rollup-readiness-report.json',
  'batch-1-final-rollup-private-artifact-manifest.json',
  'batch-1-final-rollup-validation-results.md',
].map((file) => `${reportDir}/${file}`)

const requiredPromptFiles = [
  'docs/implementation-prompts/prompt-open-source-tool-stack-batch-2-planning-after-batch-1-rollup.md',
  'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-open-source-batch-1.md',
]

const requiredEvidence = [
  'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-decision.json',
  'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/ffmpeg-container-version-probe-report.json',
  'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/ffprobe-container-version-probe-report.json',
  'docs/open-source-tool-stack/duckdb-native-rebuild-qa/duckdb-native-rebuild-qa-decision.json',
  'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-decision.json',
  'docs/open-source-tool-stack/missing-optional-package-binary-execution/package-binary-execution-decision.json',
  'docs/open-source-tool-stack/batch-1-qa-review/batch-1-qa-review-decision.json',
  'docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json',
  'docs/open-source-tool-stack/open-source-tool-stack-inventory.json',
]

const failures = []
for (const file of [...requiredFiles, ...requiredPromptFiles, ...requiredEvidence]) {
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
const evidence = readJson(`${reportDir}/evidence-revalidation-report.json`)
const acceptedMatrix = readJson(`${reportDir}/batch-1-accepted-tools-matrix.json`)
const blockedMatrix = readJson(`${reportDir}/still-blocked-scope-matrix.json`)
const betaImpact = readJson(`${reportDir}/internal-beta-impact-review.json`)
const handoff = readJson(`${reportDir}/batch-2-planning-handoff.json`)
const decision = readJson(`${reportDir}/batch-1-final-rollup-decision.json`)
const readiness = readJson(`${reportDir}/batch-1-final-rollup-readiness-report.json`)
const privateManifest = readJson(`${reportDir}/batch-1-final-rollup-private-artifact-manifest.json`)

if (decision.schema !== 'reeditpro.openSourceToolStack.batch1FinalRollup.decision.v1') {
  failures.push(`decision_schema:${decision.schema}`)
}
if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
if (decision.primaryNextPrompt !== primaryNextPrompt) failures.push(`primary_next_prompt:${decision.primaryNextPrompt}`)
if (decision.secondaryNextPrompt !== secondaryNextPrompt) failures.push(`secondary_next_prompt:${decision.secondaryNextPrompt}`)
if (readiness.readiness !== true) failures.push('readiness_not_true')
if (sourceAudit.expectedSourceSha !== 'aed2a8ecc06b7a68a4139d38d3bb5f568a949ffc') {
  failures.push(`source_sha:${sourceAudit.expectedSourceSha}`)
}
if (evidence.accepted !== true) failures.push('evidence_revalidation_not_accepted')
if (acceptedMatrix.accepted !== true) failures.push('accepted_matrix_not_accepted')
if (blockedMatrix.accepted !== true) failures.push('blocked_matrix_not_accepted')
if (betaImpact.accepted !== true) failures.push('internal_beta_impact_not_accepted')
if (handoff.accepted !== true) failures.push('batch2_handoff_not_accepted')

const expectedAcceptedIds = [
  'sharp_libvips_import_version_probe',
  'duckdb_native_rebuild_import_query_proof',
  'polars_metadata_dataframe_proof',
  'ffmpeg_tracka_container_version_probe',
  'ffprobe_tracka_container_version_probe',
  'route_capability_manifest_validation',
  'fixture_report_validation',
  'open_source_inventory_proof_matrix_validation',
]
const rows = Array.isArray(acceptedMatrix.details?.rows) ? acceptedMatrix.details.rows : []
for (const id of expectedAcceptedIds) {
  const row = rows.find((entry) => entry.normalizedId === id)
  if (!row) failures.push(`missing_accepted_tool:${id}`)
  else if (row.accepted !== true) failures.push(`accepted_tool_not_true:${id}`)
}

const ffmpegRow = rows.find((entry) => entry.normalizedId === 'ffmpeg_tracka_container_version_probe')
const ffprobeRow = rows.find((entry) => entry.normalizedId === 'ffprobe_tracka_container_version_probe')
if (ffmpegRow?.details?.version !== expectedFfmpegVersion) failures.push(`ffmpeg_version:${ffmpegRow?.details?.version}`)
if (ffprobeRow?.details?.version !== expectedFfmpegVersion) failures.push(`ffprobe_version:${ffprobeRow?.details?.version}`)
if (ffmpegRow?.details?.containerPathOnly !== true) failures.push('ffmpeg_not_container_path_only')
if (ffprobeRow?.details?.containerPathOnly !== true) failures.push('ffprobe_not_container_path_only')
if (ffmpegRow?.details?.mediaProcessingAccepted !== false) failures.push('ffmpeg_media_processing_not_false')
if (ffprobeRow?.details?.mediaFileProbingAccepted !== false) failures.push('ffprobe_media_file_probing_not_false')

const blockedRows = Array.isArray(blockedMatrix.details?.rows) ? blockedMatrix.details.rows : []
for (const scope of [
  'media_processing',
  'media_file_probing',
  'decode_encode',
  'caption_burn_in',
  'render_export',
  'real_worker_jobs',
  'app_route_execution',
  'provider_model_calls',
  'browser_capture',
  'map_rendering',
  'supabase_writes',
  'sql',
  'gcs_upload',
  'public_artifacts',
  'signed_urls',
  'external_beta',
  'paid_production',
  'production',
  'raw_prompts',
]) {
  const row = blockedRows.find((entry) => entry.scope === scope)
  if (!row) failures.push(`missing_blocked_scope:${scope}`)
  else if (row.blocked !== true || row.acceptedForBatch1 !== false) failures.push(`scope_not_blocked:${scope}`)
}

for (const field of [
  'mediaProcessingAccepted',
  'mediaFileProbingAccepted',
  'captionBurnInAccepted',
  'renderExportAccepted',
  'externalBetaUnlocked',
  'paidProductionUnlocked',
  'productionUnlocked',
  'dockerBuildRunInThisPhase',
  'dockerRunRunInThisPhase',
  'ffmpegProbeRunInThisPhase',
  'ffprobeProbeRunInThisPhase',
  'localHostProbingRunInThisPhase',
  'buildContextGenerationRunInThisPhase',
  'mediaProcessingRunInThisPhase',
  'renderExportRunInThisPhase',
  'npmInstallRunInThisPhase',
  'npmRebuildRunInThisPhase',
  'duckdbProofRerunInThisPhase',
  'polarsProofRerunInThisPhase',
  'workerExecutionRunInThisPhase',
  'routeExecutionRunInThisPhase',
  'providerCallsRunInThisPhase',
  'browserCaptureRunInThisPhase',
  'mapRenderingRunInThisPhase',
  'supabaseWritesRunInThisPhase',
  'sqlRunInThisPhase',
  'gcsUploadRunInThisPhase',
  'publicArtifactsCreatedInThisPhase',
  'signedUrlsCreatedInThisPhase',
  'rawPromptsRunInThisPhase',
  'secretsPrintedInThisPhase',
]) {
  if (decision[field] !== false) failures.push(`decision_${field}_not_false`)
}

for (const field of [
  'dockerBuildRunInThisPhase',
  'dockerRunRunInThisPhase',
  'ffmpegProbeRunInThisPhase',
  'ffprobeProbeRunInThisPhase',
  'localHostProbingRunInThisPhase',
  'buildContextGenerationRunInThisPhase',
  'mediaProcessingRunInThisPhase',
  'renderExportRunInThisPhase',
  'npmInstallRunInThisPhase',
  'npmRebuildRunInThisPhase',
  'duckdbProofRerunInThisPhase',
  'polarsProofRerunInThisPhase',
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
  if (privateManifest[field] !== false) failures.push(`manifest_${field}_not_false`)
}

if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('decision_supabase_not_no_write')
if (decision.supabaseClassification?.environmentTouched !== 'none') failures.push('decision_supabase_environment_not_none')
if (privateManifest.supabaseClassification?.sqlExecuted !== 'none') failures.push('manifest_supabase_sql_not_none')

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
  console.error('Batch 1 final rollup diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.decision,
      acceptedTools: expectedAcceptedIds.length,
      ffmpegVersion: expectedFfmpegVersion,
      ffprobeVersion: expectedFfmpegVersion,
      primaryNextPrompt,
      secondaryNextPrompt,
      supabaseClassification: decision.supabaseClassification,
    },
    null,
    2,
  ),
)
