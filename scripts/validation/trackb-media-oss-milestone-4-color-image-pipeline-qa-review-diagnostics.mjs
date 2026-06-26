#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-4-color-image-pipeline-qa-review'
const decision =
  'trackb_media_oss_milestone4_color_image_pipeline_qa_passed_ready_for_trackb_final_rollup'
const nextPrompt = 'TRACKB_MEDIA_OSS_FINAL_ROLLUP'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'pr-648-evidence-acceptance-review.json',
  'pr-648-evidence-acceptance-review.md',
  'opencolorio-qa-review.json',
  'opencolorio-qa-review.md',
  'openimageio-qa-review.json',
  'openimageio-qa-review.md',
  'install-proof-qa-status.json',
  'install-proof-qa-status.md',
  'runtime-boundary-qa.json',
  'runtime-boundary-qa.md',
  'trackb-status-update.json',
  'trackb-status-update.md',
  'trackb-final-rollup-readiness-review.json',
  'trackb-final-rollup-readiness-review.md',
  'milestone-4-color-image-pipeline-qa-decision.json',
  'milestone-4-color-image-pipeline-qa-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]

const statusDocs = [
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/ocr-runtime/requirements.ocr.txt',
  'docker/prod/pro-color-image-runtime/Dockerfile',
]

const forbiddenOutputs = [
  'node_modules',
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]

const allowedChangedPrefixes = [
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-execution/',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-execution-diagnostics.mjs',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-execution/',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-plan.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-plan-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-execution.md',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-plan/',
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-plan.md',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-review/',
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
  'docs/open-source-tool-stack/trackb-media-oss-final-rollup/',
  'docs/open-source-tool-stack/trackb-media-oss-tool-call-beta-readiness-review/',
  'docs/open-source-tool-stack/trackb-media-oss-callable-worker-contracts-implementation/',
  'docs/open-source-tool-stack/trackb-media-oss-tool-call-beta-readiness-rerun/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-dry-run/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution/',
]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
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
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
  'package.json',
  'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-dry-run-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-config-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-source-license-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'server/smoke/trackb-media-oss-callable-worker-contracts-smoke.ts',
  'src/backend/contracts/trackb-media-oss-tool-call-contracts.ts',
  'src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/index.ts',
  'src/backend/contracts/index.ts',
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-rerun.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-dry-run.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-internal-beta-fixture-gate-review.md',
  'scripts/validation/trackb-media-oss-milestone-3-exact-font-asset-source-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-2-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-2-video-analysis-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-2-video-analysis-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-1-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-install-proof-milestone-plan-diagnostics.mjs',
  'scripts/validation/open-source-tool-owner-registry-trackb-media-oss-steward-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-final-rollup.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-review.md',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution-diagnostics.mjs',
  ...statusDocs,
])

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

function sameSet(actual, expected, label) {
  const actualSet = new Set(actual || [])
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
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
  return /\b(no|not|never|blocked|without|false|remain|future-only|future only|context-only|unproven|disallowed|absent|none|not run|not approved|not accepted|must not|separate approved)\b/i.test(
    line,
  )
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-final-rollup.md',
]) {
  readText(file)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:milestone-4-color-image-pipeline-qa-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  evidence: readJson(`${reportDir}/pr-648-evidence-acceptance-review.json`),
  ocio: readJson(`${reportDir}/opencolorio-qa-review.json`),
  oiio: readJson(`${reportDir}/openimageio-qa-review.json`),
  install: readJson(`${reportDir}/install-proof-qa-status.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-qa.json`),
  statusUpdate: readJson(`${reportDir}/trackb-status-update.json`),
  finalRollup: readJson(`${reportDir}/trackb-final-rollup-readiness-review.json`),
  decisionReport: readJson(`${reportDir}/milestone-4-color-image-pipeline-qa-decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== '9a96e4ceb3d7bc0a05fdcea4b1c2527920e51c36') {
  fail(`source_sha_drift:${reports.source.sourceSha}`)
}
if (reports.source.sourceEvidenceSha !== '957e8f96900e9a374a8cd7990f00e761222ebb64') {
  fail(`execution_source_sha_drift:${reports.source.sourceEvidenceSha}`)
}
for (const pr of [
  648, 644, 639, 635, 629, 625, 620, 615, 613, 606, 600, 592, 587, 583, 578, 574,
  571, 567, 563, 559, 557, 551, 549, 546, 545, 542,
]) {
  if (reports.source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_pr${pr}_source_evidence`)
  }
}

if (reports.evidence.pr648EvidenceAccepted !== true) fail('pr648_evidence_not_accepted')
if (reports.evidence.endToEndProductReadyAccepted !== false) fail('product_ready_evidence_accepted')
sameSet(reports.evidence.toolsAccepted, ['opencolorio', 'openimageio'], 'evidence_tools')

if (reports.ocio.version !== '2.5.2' || reports.ocio.importName !== 'PyOpenColorIO') {
  fail(`opencolorio_version_or_import_drift:${reports.ocio.version}:${reports.ocio.importName}`)
}
if (
  reports.ocio.acceptedAsBoundedCpuProof !== true ||
  reports.ocio.importPassed !== true ||
  reports.ocio.apiShapePassed !== true ||
  reports.ocio.rawConfigCreated !== true
) {
  fail('opencolorio_qa_not_accepted')
}
if (reports.ocio.realMediaUsed !== false || reports.ocio.imageProcessingRun !== false || reports.ocio.gpuUsed !== false) {
  fail('opencolorio_scope_widened')
}

if (reports.oiio.version !== '3.1.14.1' || reports.oiio.importName !== 'OpenImageIO') {
  fail(`openimageio_version_or_import_drift:${reports.oiio.version}:${reports.oiio.importName}`)
}
if (
  reports.oiio.acceptedAsBoundedCpuProof !== true ||
  reports.oiio.importPassed !== true ||
  reports.oiio.apiShapePassed !== true ||
  reports.oiio.imageSpecImageBufApiShapeProven !== true
) {
  fail('openimageio_qa_not_accepted')
}
if (
  reports.oiio.realMediaUsed !== false ||
  reports.oiio.imageProcessingRun !== false ||
  reports.oiio.fileIoUsed !== false ||
  reports.oiio.gpuUsed !== false
) {
  fail('openimageio_scope_widened')
}

const requirementLines = readText('docker/prod/cpu-worker/requirements.cpu.txt')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
if (!requirementLines.includes('OpenColorIO')) fail('missing_opencolorio_requirement')
if (!requirementLines.includes('OpenImageIO')) fail('missing_openimageio_requirement')
if (requirementLines.includes('PyOpenColorIO')) fail('forbidden_pyopencolorio_requirement')
if (reports.install.packageStatus?.packageLockMutated !== false) fail('package_lock_mutation_recorded')
if (reports.install.packageStatus?.dockerfileMutatedInQaPhase !== false) fail('dockerfile_mutation_recorded')
if (reports.install.packageStatus?.requirementsMutatedInQaPhase !== false) fail('requirements_mutation_recorded')

if (reports.statusUpdate.ownedTools !== 16) fail('owned_tool_count_drift')
if (reports.statusUpdate.acceptedProvenBoundedBeforeQa !== 14) fail('before_qa_count_drift')
if (reports.statusUpdate.newlyAcceptedProvenBoundedInQa !== 2) fail('new_qa_count_drift')
if (reports.statusUpdate.acceptedProvenBoundedTotalAfterQa !== 16) fail('accepted_total_not_16')
if (reports.statusUpdate.stillBlockedNotInstalledProvenCount !== 0) fail('blocked_total_not_0')
sameSet(reports.statusUpdate.stillBlockedNotInstalledProven, [], 'blocked_after_qa')
sameSet(
  (reports.statusUpdate.acceptedProvenBoundedAfterQa || []).map((tool) => tool.id),
  [
    'ffmpeg',
    'ffprobe',
    'sharp_libvips',
    'duckdb',
    'polars_nodejs_polars',
    'exiftool',
    'mediainfo',
    'tesseract',
    'imagemagick',
    'opencv',
    'pyav',
    'pyscenedetect',
    'paddlepaddle',
    'paddleocr',
    'opencolorio',
    'openimageio',
  ],
  'accepted_after_qa',
)

for (const report of [reports.runtime, reports.decisionReport, reports.readiness, reports.manifest]) {
  for (const [key, value] of Object.entries(report)) {
    if (key === 'qaReviewMetadataOnly') continue
    if (key === 'readyForTrackBFinalRollup') continue
    if (key === 'acceptedAllTrackBOwnedToolsAsBoundedProof') continue
    if (key === 'allOwnedToolsBoundedAcceptedProven') continue
    if (/(Accepted|Approved|Allowed|Created|Committed|RunInQaPhase|Run|Unlocked|Ready)$/.test(key)) {
      if (key === 'endToEndProductReadyTools') continue
      if (value !== false) fail(`flag_not_false:${report.schema || 'report'}:${key}:${value}`)
    }
  }
}
if (reports.decisionReport.endToEndProductReadyTools !== 0 || reports.statusUpdate.endToEndProductReadyTools !== 0) {
  fail('product_ready_not_zero')
}
if (reports.decisionReport.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')
if (reports.finalRollup.nextPrompt !== nextPrompt || reports.decisionReport.nextPrompt !== nextPrompt) {
  fail('next_prompt_drift')
}
if (reports.readiness.nextPrompt !== nextPrompt) fail('readiness_next_prompt_drift')

const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const steward = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json')
const registry = readJson('docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json')
const owner = registry.owners?.find((entry) => entry.ownerId === ownerId)
if (!owner) fail('missing_trackb_owner')
for (const [label, counts] of Object.entries({
  status: status.counts,
  steward: steward.statusCounts,
  owner: {
    ownedTools: owner?.ownedToolCount,
    acceptedProvenBounded: owner?.acceptedProvenBoundedCount,
    blockedNotInstalledProven: owner?.blockedNotInstalledProvenCount,
    endToEndProductReady: owner?.endToEndProductReadyToolCount,
  },
})) {
  if (counts?.ownedTools !== 16) fail(`${label}_owned_count_drift`)
  if (counts?.acceptedProvenBounded !== 16) fail(`${label}_accepted_count_not_16`)
  if (counts?.blockedNotInstalledProven !== 0) fail(`${label}_blocked_count_not_0`)
  if (counts?.endToEndProductReady !== 0) fail(`${label}_product_ready_not_0`)
}
sameSet(status.blockedNotInstalledProven, [], 'status_blocked')
for (const id of ['opencolorio', 'openimageio']) {
  const stewardTool = steward.ownedTools?.find((entry) => entry.id === id)
  const statusTool = status.acceptedProvenBounded?.find((entry) => entry.id === id)
  if (!stewardTool || !statusTool) fail(`missing_status_tool:${id}`)
  if (stewardTool?.status !== 'accepted_proven_bounded_milestone4_color_image_cpu') {
    fail(`steward_tool_status_drift:${id}:${stewardTool?.status}`)
  }
  if (stewardTool?.endToEndProductReady !== false || statusTool?.endToEndProductReady !== false) {
    fail(`tool_product_ready_drift:${id}`)
  }
  if (stewardTool?.imageProcessingAccepted !== false || stewardTool?.mediaProcessingAccepted !== false) {
    fail(`tool_runtime_scope_widened:${id}`)
  }
}
if (status.milestone4ColorImagePipelineQaReview?.decision !== decision) fail('status_json_qa_decision_missing')
if (steward.milestone4ColorImagePipelineQaReview?.decision !== decision) fail('steward_json_qa_decision_missing')
if (owner?.milestone4ColorImagePipelineQaReview?.decision !== decision) fail('registry_json_qa_decision_missing')

for (const file of statusDocs.filter((file) => file.endsWith('.md'))) {
  const text = readText(file)
  if (!text.includes('TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_QA_REVIEW')) {
    fail(`status_doc_missing_marker:${file}`)
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

for (const protectedFile of protectedNoDiffFiles) {
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
  'docs/implementation-prompts/prompt-trackb-media-oss-final-rollup.md',
]
const dangerousPatterns = [
  /40\+.*(end-to-end|end to end).*(proven|ready|installed)/i,
  /\bproduct-ready tools?:\s*[1-9]/i,
  /\b(all 16|16 owned).*\\b(product-ready|ready for production|runtime ready)\\b/i,
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
      acceptedMilestone4Tools: ['opencolorio', 'openimageio'],
      counts: {
        ownedTools: 16,
        acceptedProvenBounded: 16,
        blockedNotInstalledProven: 0,
        endToEndProductReady: 0,
      },
      nextPrompt,
      supabaseClassification: reports.runtime.supabaseClassification,
    },
    null,
    2,
  ),
)
