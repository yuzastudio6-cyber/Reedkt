#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-2-video-analysis-approval'
const decision = 'trackb_media_oss_milestone2_video_analysis_approval_passed_ready_for_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'

const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'historical-trackb-evidence-review.json',
  'historical-trackb-evidence-review.md',
  'tool-ownership-duplicate-review.json',
  'tool-ownership-duplicate-review.md',
  'package-strategy-review.json',
  'package-strategy-review.md',
  'container-worker-target-review.json',
  'container-worker-target-review.md',
  'cpu-gpu-policy.json',
  'cpu-gpu-policy.md',
  'synthetic-fixture-proof-policy.json',
  'synthetic-fixture-proof-policy.md',
  'future-verification-command-plan.json',
  'future-verification-command-plan.md',
  'cloud-runtime-cost-performance-policy.json',
  'cloud-runtime-cost-performance-policy.md',
  'milestone-2-video-analysis-approval-decision.json',
  'milestone-2-video-analysis-approval-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
].map((file) => `${reportDir}/${file}`)

const statusFiles = [
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-2-video-analysis-execution.md',
]

const failures = []
function fail(message) {
  failures.push(message)
}

function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    fail(`missing_file:${relativePath}`)
    return ''
  }
  return fs.readFileSync(fullPath, 'utf8')
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

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
}

function sameSet(actual, expected, label) {
  const actualSet = new Set(actual || [])
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
}

for (const file of [...requiredFiles, ...statusFiles]) readText(file)

const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const historical = readJson(`${reportDir}/historical-trackb-evidence-review.json`)
const ownership = readJson(`${reportDir}/tool-ownership-duplicate-review.json`)
const packages = readJson(`${reportDir}/package-strategy-review.json`)
const target = readJson(`${reportDir}/container-worker-target-review.json`)
const cpuGpu = readJson(`${reportDir}/cpu-gpu-policy.json`)
const fixtures = readJson(`${reportDir}/synthetic-fixture-proof-policy.json`)
const commands = readJson(`${reportDir}/future-verification-command-plan.json`)
const cloud = readJson(`${reportDir}/cloud-runtime-cost-performance-policy.json`)
const decisionReport = readJson(`${reportDir}/milestone-2-video-analysis-approval-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const packageJson = readJson('package.json')

for (const [label, report] of Object.entries({
  source,
  historical,
  ownership,
  packages,
  target,
  cpuGpu,
  fixtures,
  commands,
  cloud,
  decisionReport,
  readiness,
  manifest,
})) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
}

for (const pr of [563, 559, 557, 551, 549, 546, 545, 542]) {
  if (source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') fail(`missing_pr${pr}_merged_source`)
}
if (source.ownerId !== ownerId || ownership.ownerId !== ownerId || decisionReport.ownerId !== ownerId) fail('owner_id_drift')
if (ownership.duplicateMilestone2ApprovalPrFound !== false) fail('duplicate_pr_not_false')
if (ownership.pr543?.trackBDuplicate !== false) fail('pr543_duplicate_drift')

sameSet((ownership.tools || []).map((tool) => tool.id), ['opencv', 'pyav', 'pyscenedetect'], 'ownership_tools')
sameSet((packages.futurePackages || []).map((tool) => tool.tool), ['opencv', 'pyav', 'pyscenedetect'], 'package_tools')
sameSet((cpuGpu.tools || []).map((tool) => tool.id), ['opencv', 'pyav', 'pyscenedetect'], 'cpu_gpu_tools')
sameSet((fixtures.fixtures || []).map((tool) => tool.tool), ['opencv', 'pyav', 'pyscenedetect'], 'fixture_tools')
sameSet((commands.commands || []).map((tool) => tool.tool), ['opencv', 'pyav', 'pyscenedetect'], 'command_tools')
sameSet(decisionReport.tools, ['opencv', 'pyav', 'pyscenedetect'], 'decision_tools')

for (const item of packages.futurePackages || []) {
  if (!item.packageName) fail(`missing_package_name:${item.tool}`)
  if (item.alreadyDeclaredInTargetRequirements !== true) fail(`package_not_declared:${item.tool}`)
}
sameSet(
  (packages.futurePackages || []).map((item) => item.packageName),
  ['opencv-python-headless', 'av', 'scenedetect'],
  'future_package_names',
)
if (packages.targetFileForFutureExecution !== 'docker/prod/cpu-worker/requirements.cpu.txt') fail('package_target_drift')
if (target.targetDockerfile !== 'docker/prod/cpu-worker/Dockerfile') fail('target_dockerfile_drift')
if (target.targetRequirements !== 'docker/prod/cpu-worker/requirements.cpu.txt') fail('target_requirements_drift')
if (target.dockerfileMutationInThisPhase !== false || target.dockerBuildInThisPhase !== false) fail('target_scope_unblocked')

if (cpuGpu.milestone2GpuApproved !== false || cpuGpu.gpuEscalationRequiresSeparateApproval !== true) fail('gpu_policy_drift')
for (const tool of cpuGpu.tools || []) {
  if (tool.computeDefault !== 'cpu_first') fail(`not_cpu_first:${tool.id}`)
}
if (fixtures.realUserMediaAllowed !== false || fixtures.ffmpegFfprobeExecutionAllowed !== false) fail('fixture_scope_drift')
if (commands.commandsAreFutureOnly !== true || commands.commandsRunInThisPhase !== false) fail('command_phase_drift')
if (cloud.gpuApproved !== false || cloud.productRuntimeApproved !== false) fail('cloud_scope_unblocked')

if (decisionReport.nextPrompt !== nextPrompt || readiness.nextPrompt !== nextPrompt) fail('next_prompt_drift')
if (readiness.readyForMilestone2Execution !== true) fail('readiness_not_true')
for (const [key, value] of Object.entries(readiness)) {
  if (/^readyFor/.test(key) && key !== 'readyForMilestone2Execution' && value !== false) fail(`readiness_scope_unblocked:${key}`)
}
if (manifest.publicArtifactsCreated !== false || manifest.signedUrlsCreated !== false || manifest.secretPayloadAccessed !== false) fail('manifest_scope_unblocked')

const milestone2QaAccepted =
  status.milestone2QaReview?.decision ===
  'trackb_media_oss_milestone2_qa_passed_ready_for_milestone3_ocr_ml_cpu_gpu_review'
const milestone3OcrMlCpuQaAccepted =
  status.milestone3OcrMlCpuQaReview?.decision ===
  'trackb_media_oss_milestone3_ocr_ml_cpu_qa_passed_ready_for_milestone4_color_image_pipeline_approval'
if (status.counts?.ownedTools !== 16) fail('owned_count_drift')
if (milestone3OcrMlCpuQaAccepted) {
  if (status.counts?.acceptedProvenBounded !== 14) fail('accepted_count_after_milestone3_qa_drift')
  if (status.counts?.blockedNotInstalledProven !== 2) fail('blocked_count_after_milestone3_qa_drift')
} else if (milestone2QaAccepted) {
  if (status.counts?.acceptedProvenBounded !== 12) fail('accepted_count_after_qa_drift')
  if (status.counts?.blockedNotInstalledProven !== 4) fail('blocked_count_after_qa_drift')
} else {
  if (status.counts?.acceptedProvenBounded !== 9) fail('accepted_count_drift')
  if (status.counts?.blockedNotInstalledProven !== 7) fail('blocked_count_drift')
}
if (status.counts?.endToEndProductReady !== 0) fail('product_ready_count_drift')
sameSet(
  status.blockedNotInstalledProven,
  milestone3OcrMlCpuQaAccepted
    ? ['opencolorio', 'openimageio']
    : milestone2QaAccepted
    ? ['paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio']
    : ['opencv', 'pyav', 'pyscenedetect', 'paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio'],
  'status_blocked',
)
if (status.milestone2VideoAnalysisApproval?.decision !== decision) fail('missing_status_json_milestone2')

if (
  packageJson.scripts?.['trackb-media-oss:milestone-2-video-analysis-approval:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-2-video-analysis-approval-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const requirementsText = readText('docker/prod/cpu-worker/requirements.cpu.txt')
for (const pkg of ['opencv-python-headless', 'av', 'scenedetect']) {
  if (!new RegExp(`(^|\\n)${pkg}(\\n|$)`).test(requirementsText)) fail(`target_requirements_missing:${pkg}`)
}

const protectedPaths = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
]
const protectedDiff = git(['diff', '--name-only', '--', ...protectedPaths])
const protectedCachedDiff = git(['diff', '--cached', '--name-only', '--', ...protectedPaths])
if (protectedDiff || protectedCachedDiff) fail('protected_or_runtime_packaging_file_mutation')

for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}

const scanFiles = [...requiredFiles, ...statusFiles]
const forbiddenPatterns = [
  /OpenCV (was|is) installed/i,
  /PyAV (was|is) installed/i,
  /PySceneDetect (was|is) installed/i,
  /OpenCV (was|is) executed/i,
  /PyAV (was|is) executed/i,
  /PySceneDetect (was|is) executed/i,
  /GPU execution approved/i,
  /FFmpeg\/FFprobe expansion approved/i,
  /media processing\s+approved/i,
  /render\/export approved/i,
  /beta .*unlocked/i,
  /production .*unlocked/i,
  /40\\+ tools.*end-to-end.*proven/i,
  /sk-[A-Za-z0-9_-]{20,}/,
  /postgres(?:ql)?:\/\//i,
  /supabase\.co\/[A-Za-z0-9_-]{12,}/i,
]
for (const file of scanFiles) {
  const text = readText(file)
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden_text:${file}:${pattern}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  ownerId,
  tools: ['opencv', 'pyav', 'pyscenedetect'],
  targetDockerfile: target.targetDockerfile,
  targetRequirements: target.targetRequirements,
  acceptedProvenBounded: status.counts?.acceptedProvenBounded,
  blockedNotInstalledProven: status.counts?.blockedNotInstalledProven,
  endToEndProductReady: status.counts?.endToEndProductReady,
  nextPrompt,
  supabaseClassification: decisionReport.supabaseClassification,
}, null, 2))
