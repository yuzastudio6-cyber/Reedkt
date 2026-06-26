#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution'
const decision =
  'trackb_media_oss_milestone4_color_image_pipeline_cpu_execution_passed_ready_for_qa'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_QA_REVIEW'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'source-target-check.json',
  'source-target-check.md',
  'package-strategy-execution.json',
  'package-strategy-execution.md',
  'dockerfile-patch-review.json',
  'dockerfile-patch-review.md',
  'build-context-command-review.json',
  'build-context-command-review.md',
  'dependency-hydration-report.json',
  'dependency-hydration-report.md',
  'build-context-generation-report.json',
  'build-context-generation-report.md',
  'generated-artifact-scan-report.json',
  'generated-artifact-scan-report.md',
  'docker-build-report.json',
  'docker-build-report.md',
  'opencolorio-proof-report.json',
  'opencolorio-proof-report.md',
  'openimageio-proof-report.json',
  'openimageio-proof-report.md',
  'synthetic-fixture-report.json',
  'synthetic-fixture-report.md',
  'runtime-boundary-verification.json',
  'runtime-boundary-verification.md',
  'cpu-latency-memory-cost-report.json',
  'cpu-latency-memory-cost-report.md',
  'artifact-cleanup-report.json',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'milestone-4-color-image-cpu-execution-status-matrix.json',
  'milestone-4-color-image-cpu-execution-status-matrix.md',
  'color-image-pipeline-cpu-execution-decision.json',
  'color-image-pipeline-cpu-execution-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]

const statusDocs = [
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const allowedChangedPrefixes = [
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-review.md',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-go-no-go-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-reconciliation/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution/',
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-milestone-4-color-image-pipeline-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-final-rollup/',
]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-closeout.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-approval-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-approval.md',
  'scripts/validation/trackb-media-oss-product-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-readiness-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-go-no-go-review.md',
  'scripts/validation/trackb-media-oss-product-beta-readiness-reconciliation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-testing-handoff-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-testing-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-activation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-internal-beta-fixture-gate-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-dry-run-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
  'package.json',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/open-source-tool-owner-registry-trackb-media-oss-steward-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-config-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-source-license-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-exact-font-asset-source-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-2-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-2-video-analysis-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-2-video-analysis-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-1-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-install-proof-milestone-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-final-rollup.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-review.md',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json',
  ...statusDocs,
])

const forbiddenOutputs = [
  'node_modules',
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function fullPath(relativePath) {
  return path.join(repoRoot, relativePath)
}

function readText(relativePath) {
  const resolved = fullPath(relativePath)
  if (!fs.existsSync(resolved)) {
    fail(`missing_file:${relativePath}`)
    return ''
  }
  return fs.readFileSync(resolved, 'utf8')
}

function readJson(relativePath) {
  const text = readText(relativePath)
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`invalid_json:${relativePath}:${error.message}`)
    return {}
  }
}

function git(args, allowFailure = false) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
      encoding: 'utf8',
    }).trim()
  } catch (error) {
    if (allowFailure) return ''
    throw error
  }
}

function requireDecision(label, report) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
}

function changedFiles() {
  return [
    ...git(['diff', '--name-only'], true).split('\n'),
    ...git(['diff', '--cached', '--name-only'], true).split('\n'),
    ...git(['diff', '--name-only', `${baseRef}...HEAD`], true).split('\n'),
  ].filter(Boolean)
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

function isGuardrailLine(line) {
  return /\b(no|not|never|blocked|without|false|remain|future-only|future only|context-only|unproven|disallowed|absent|none|not run|not approved|not accepted|until qa|pending qa|must not)\b/i.test(
    line,
  )
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-qa-review.md',
]) {
  readText(file)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:milestone-4-color-image-pipeline-cpu-execution:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  target: readJson(`${reportDir}/source-target-check.json`),
  packageStrategy: readJson(`${reportDir}/package-strategy-execution.json`),
  dockerfile: readJson(`${reportDir}/dockerfile-patch-review.json`),
  buildContext: readJson(`${reportDir}/build-context-command-review.json`),
  hydration: readJson(`${reportDir}/dependency-hydration-report.json`),
  contextGeneration: readJson(`${reportDir}/build-context-generation-report.json`),
  artifactScan: readJson(`${reportDir}/generated-artifact-scan-report.json`),
  dockerBuild: readJson(`${reportDir}/docker-build-report.json`),
  opencolorio: readJson(`${reportDir}/opencolorio-proof-report.json`),
  openimageio: readJson(`${reportDir}/openimageio-proof-report.json`),
  fixture: readJson(`${reportDir}/synthetic-fixture-report.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-verification.json`),
  cost: readJson(`${reportDir}/cpu-latency-memory-cost-report.json`),
  cleanup: readJson(`${reportDir}/artifact-cleanup-report.json`),
  safety: readJson(`${reportDir}/safety-scan-report.json`),
  matrix: readJson(`${reportDir}/milestone-4-color-image-cpu-execution-status-matrix.json`),
  decisionReport: readJson(`${reportDir}/color-image-pipeline-cpu-execution-decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

for (const pr of [
  644, 639, 635, 629, 625, 620, 615, 613, 606, 600, 592, 587, 583, 578, 574, 571,
  567, 563, 559, 557, 551, 549, 546, 545, 542,
]) {
  if (reports.source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_pr${pr}_source_evidence`)
  }
}

if (reports.source.sourceSha !== '957e8f96900e9a374a8cd7990f00e761222ebb64') {
  fail(`source_sha_drift:${reports.source.sourceSha}`)
}
if (reports.target.targetDockerfile !== 'docker/prod/cpu-worker/Dockerfile') fail('target_dockerfile_drift')
if (reports.target.targetRequirements !== 'docker/prod/cpu-worker/requirements.cpu.txt') {
  fail('target_requirements_drift')
}
if (reports.target.trackAProColorImageRuntimeUsed !== false || reports.target.aiGraphicsTargetUsed !== false) {
  fail('wrong_runtime_target_used')
}

const requirementLines = readText('docker/prod/cpu-worker/requirements.cpu.txt')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
if (!requirementLines.includes('OpenColorIO')) fail('missing_opencolorio_requirement')
if (!requirementLines.includes('OpenImageIO')) fail('missing_openimageio_requirement')
if (requirementLines.includes('PyOpenColorIO')) fail('forbidden_pyopencolorio_requirement')

if (reports.packageStrategy.requirementsPatched !== true) fail('requirements_patch_not_recorded')
if (reports.packageStrategy.packageLockMutated !== false) fail('package_lock_mutation_recorded')
if (reports.packageStrategy.unrelatedRequirementsMutated !== false) fail('unrelated_requirements_mutation_recorded')
if (reports.dockerfile.dockerfilePatched !== false) fail('dockerfile_patch_unexpected')
if (reports.buildContext.buildContextGenerationRequired !== true) fail('build_context_required_drift')
if (reports.hydration.npmCiCommand !== 'npm ci --ignore-scripts --no-audit --no-fund') {
  fail('hydration_command_drift')
}
if (reports.hydration.exitCode !== 0 || reports.hydration.packageLockMutated !== false) {
  fail('hydration_failed_or_lock_mutated')
}
if (reports.contextGeneration.distServerGenerated !== true || reports.contextGeneration.distStagingFixtureWorkerGenerated !== true) {
  fail('build_context_generation_missing')
}
if (reports.artifactScan.secretsFound !== false || reports.artifactScan.publicArtifactsFound !== false) {
  fail('artifact_scan_drift')
}
if (reports.dockerBuild.exitCode !== 0 || reports.dockerBuild.imageCreated !== true) fail('docker_build_not_passed')
if (reports.opencolorio.exitCode !== 0 || reports.opencolorio.version !== '2.5.2') {
  fail(`opencolorio_proof_drift:${reports.opencolorio.version}`)
}
if (reports.opencolorio.importPassed !== true || reports.opencolorio.apiShapePassed !== true) {
  fail('opencolorio_api_not_passed')
}
if (reports.openimageio.exitCode !== 0 || reports.openimageio.version !== '3.1.14.1') {
  fail(`openimageio_proof_drift:${reports.openimageio.version}`)
}
if (reports.openimageio.importPassed !== true || reports.openimageio.apiShapePassed !== true) {
  fail('openimageio_api_not_passed')
}
if (reports.fixture.realMediaUsed !== false || reports.fixture.fixtureCommitted !== false) fail('fixture_policy_drift')
if (reports.runtime.realMediaUsed !== false || reports.runtime.renderExportRun !== false) fail('runtime_scope_widened')
if (reports.runtime.gpuUsed !== false || reports.runtime.supabaseMutation !== false) fail('runtime_or_supabase_scope_widened')
if (reports.cleanup.imageRemoved !== true || reports.cleanup.nodeModulesPresentAfterCleanup !== false) {
  fail('cleanup_not_complete')
}
if (reports.cleanup.distServerPresentAfterCleanup !== false || reports.cleanup.distStagingFixtureWorkerPresentAfterCleanup !== false) {
  fail('build_context_cleanup_not_complete')
}
if (reports.safety.packageLockMutated !== false || reports.safety.dockerfileMutated !== false) {
  fail('protected_mutation_recorded')
}
if (reports.safety.secretsFound !== false || reports.safety.signedUrlsFound !== false) fail('secret_or_signed_url_recorded')

const matrixRows = reports.matrix.rows || []
for (const id of ['opencolorio', 'openimageio']) {
  const row = matrixRows.find((candidate) => candidate.id === id)
  if (!row) fail(`missing_matrix_row:${id}`)
  if (row?.acceptedProvenBoundedPendingQa !== true) fail(`matrix_pending_qa_drift:${id}`)
  if (row?.productReady !== false || row?.realMediaUsed !== false || row?.gpuUsed !== false) {
    fail(`matrix_scope_widened:${id}`)
  }
}

if (reports.decisionReport.nextPrompt !== nextPrompt || reports.readiness.nextPrompt !== nextPrompt) {
  fail('next_prompt_drift')
}
if (reports.readiness.readyForQaReview !== true || reports.readiness.productReady !== false) {
  fail('readiness_drift')
}
if (reports.manifest.publicArtifactsCreated !== false || reports.manifest.signedUrlsCreated !== false) {
  fail('manifest_public_artifact_drift')
}

const statusJson = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const milestone4ColorImagePipelineQaAccepted =
  statusJson.milestone4ColorImagePipelineQaReview?.decision ===
  'trackb_media_oss_milestone4_color_image_pipeline_qa_passed_ready_for_trackb_final_rollup'
const currentAcceptedCount = milestone4ColorImagePipelineQaAccepted ? 16 : 14
const currentBlockedCount = milestone4ColorImagePipelineQaAccepted ? 0 : 2
if (statusJson.counts?.ownedTools !== 16) fail('status_owned_count_drift')
if (statusJson.counts?.acceptedProvenBounded !== currentAcceptedCount) fail('status_accepted_count_drift')
if (statusJson.counts?.blockedNotInstalledProven !== currentBlockedCount) fail('status_blocked_count_drift')
if (statusJson.counts?.endToEndProductReady !== 0) fail('status_product_ready_drift')
if (statusJson.milestone4ColorImagePipelineCpuExecution?.decision !== decision) {
  fail('status_json_execution_decision_missing')
}
if (statusJson.milestone4ColorImagePipelineCpuExecution?.newProofCandidatesPendingQa !== 2) {
  fail('status_json_pending_qa_count_drift')
}

for (const file of statusDocs.filter((file) => file.endsWith('.md'))) {
  const text = readText(file)
  if (!text.includes('TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_CPU_EXECUTION')) {
    fail(`status_doc_missing_execution_marker:${file}`)
  }
  if (!text.includes(decision)) fail(`status_doc_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_doc_missing_next_prompt:${file}`)
}

for (const broadDoc of [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
]) {
  if (fs.existsSync(fullPath(broadDoc))) fail(`broad_doc_created:${broadDoc}`)
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

const protectedMustNotChange = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/ocr-runtime/requirements.ocr.txt',
]
for (const protectedFile of protectedMustNotChange) {
  const diff = git(['diff', '--', protectedFile], true)
  const stagedDiff = git(['diff', '--cached', '--', protectedFile], true)
  const branchDiff = git(['diff', `${baseRef}...HEAD`, '--', protectedFile], true)
  if (diff || stagedDiff || branchDiff) fail(`protected_file_mutated:${protectedFile}`)
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
  if (/\.(mp4|mov|wav|mp3|m4a|png|jpe?g|webp|tiff?|exr|icc|cube|ocio)$/i.test(file)) {
    fail(`media_or_color_artifact_changed:${file}`)
  }
}

const allTextFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs.filter((file) => file.endsWith('.md')),
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-qa-review.md',
]
const dangerousPatterns = [
  /40\+.*(end-to-end|end to end).*(proven|ready|installed)/i,
  /\bproduct-ready tools?:\s*[1-9]/i,
  /\b(beta|production)\s+(unlocked|enabled|ready)\b/i,
  /\bsigned url\b.*\b(created|enabled|generated)\b/i,
  /\bpublic artifact\b.*\b(created|enabled|generated)\b/i,
]
for (const file of allTextFiles) {
  const text = readText(file)
  for (const line of text.split(/\n/)) {
    if (dangerousPatterns.some((pattern) => pattern.test(line)) && !isGuardrailLine(line)) {
      fail(`dangerous_claim:${file}:${line.trim()}`)
    }
  }
  if (/sk-[A-Za-z0-9_-]{20,}|sb_secret_|service_role/i.test(text)) fail(`secret_material:${file}`)
}

if (failures.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        decision,
        failures,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      ownerId,
      tools: ['opencolorio', 'openimageio'],
      versions: {
        opencolorio: reports.opencolorio.version,
        openimageio: reports.openimageio.version,
      },
      newProofCandidatesPendingQa: 2,
      countsRemainPendingQa: {
        ownedTools: statusJson.counts?.ownedTools,
        acceptedProvenBounded: statusJson.counts?.acceptedProvenBounded,
        blockedNotInstalledProven: statusJson.counts?.blockedNotInstalledProven,
        endToEndProductReady: statusJson.counts?.endToEndProductReady,
      },
      nextPrompt,
      supabaseClassification: reports.runtime.supabaseClassification,
    },
    null,
    2,
  ),
)
