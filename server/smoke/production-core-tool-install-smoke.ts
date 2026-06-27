import { existsSync, readFileSync } from 'node:fs'
import {
  CORE_TOOL_COMMAND_CHECKS,
  CORE_TOOL_NODE_PACKAGE_CHECKS,
  CORE_TOOL_PYTHON_IMPORT_CHECKS,
  M10_CORE_CPU_RENDER_TOOL_IDS,
  M10_EXCLUDED_GPU_MODEL_TOOL_IDS,
  assertProductionReadinessSpecsCoverRegistry,
  assertRevideoReadinessBlocked,
  getContainerImageExpectation,
  getProductionReadinessSpec,
  runCoreCpuRenderReadinessChecks,
  runProductionToolReadiness,
} from '../workers/production-readiness'

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function repoFileExists(path: string): boolean {
  return existsSync(new URL(`../../${path}`, import.meta.url))
}

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

function requireRead(path: string): string {
  check(repoFileExists(path), `Missing required M10 file: ${path}`)
  return readRepoFile(path)
}

const requiredFiles = [
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/qa-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/render-worker/requirements.render.txt',
  'docker/prod/qa-worker/requirements.qa.txt',
  'docker/prod/tool-readiness-worker/requirements.readiness.txt',
  'docker/prod/ffmpeg-lgpl-build-policy.md',
  'docker/prod/core-tool-version-policy.md',
]

for (const file of requiredFiles) {
  check(repoFileExists(file), `Missing ${file}`)
}

const coreDockerText = [
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/qa-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
].map(readRepoFile).join('\n')

const forbiddenCoreImagePackages = [
  /torch(?:vision)?/i,
  /cuda/i,
  /faster[-_]?whisper/i,
  /\bsam2\b/i,
  /birefnet/i,
  /real[-_]?esrgan/i,
  /\bfilm\b/i,
  /demucs/i,
  /deepfilternet/i,
]

for (const forbidden of forbiddenCoreImagePackages) {
  check(!forbidden.test(coreDockerText), `M10 core Dockerfiles must not include ${forbidden}.`)
}

check(!/\brevideo\b/i.test(coreDockerText), 'M10 core Dockerfiles must not include Revideo as a core dependency.')

const cpuRequirements = requireRead('docker/prod/cpu-worker/requirements.cpu.txt')
for (const expected of ['av', 'scenedetect', 'opencv-python-headless', 'duckdb', 'polars', 'opentimelineio']) {
  check(cpuRequirements.includes(expected), `CPU requirements must include ${expected}.`)
}

const qaRequirements = requireRead('docker/prod/qa-worker/requirements.qa.txt')
for (const expected of ['opencv-python-headless', 'duckdb', 'polars', 'opentimelineio']) {
  check(qaRequirements.includes(expected), `QA requirements must include ${expected}.`)
}

const renderDocker = requireRead('docker/prod/render-worker/Dockerfile')
check(/Remotion/i.test(renderDocker), 'Render worker Dockerfile must reference Remotion policy.')
check(/ffmpeg/i.test(renderDocker), 'Render worker Dockerfile must install/reference FFmpeg.')
check(/libass/i.test(renderDocker), 'Render worker Dockerfile must install/reference libass support.')
check(!/\brevideo\b/i.test(renderDocker), 'Render worker Dockerfile must not include Revideo.')

const apiDocker = requireRead('docker/prod/api/Dockerfile')
check(!/\bapt-get\s+install[\s\S]*\bffmpeg\b/i.test(apiDocker), 'API image must not install FFmpeg.')
check(!/torch|cuda|faster[-_]?whisper|birefnet|sam2|demucs|deepfilternet/i.test(apiDocker), 'API image must remain free of GPU/model tools.')

assertProductionReadinessSpecsCoverRegistry()
assertRevideoReadinessBlocked()

const dryRun = runProductionToolReadiness({ dryRun: true })
check(dryRun.dryRun, 'Dry-run readiness must remain supported.')
check(!dryRun.results.some((result) => result.status === 'passed'), 'Dry-run readiness must not execute command/import checks.')

const dryCore = runCoreCpuRenderReadinessChecks({ realCheckMode: false })
check(!dryCore.realCheckMode, 'Core readiness dry-run should not execute checks.')
check(dryCore.results.some((result) => result.status === 'pending_manual_review'), 'Core readiness must surface pending manual review status.')

const realCore = runProductionToolReadiness({ realCheckMode: true })
check(realCore.realCheckMode === true, 'Production readiness runner must support realCheckMode.')
check(Boolean(realCore.coreToolReadiness), 'realCheckMode must include a core tool readiness report.')
check(realCore.results.length > 0, 'realCheckMode must return core CPU/render readiness results.')
check(realCore.results.every((result) => result.modelWeightChecks.length === 0), 'M10 realCheckMode must not require model weight checks.')

const realCheckedToolIds = new Set(realCore.results.map((result) => result.toolId))
for (const forbidden of M10_EXCLUDED_GPU_MODEL_TOOL_IDS) {
  check(!realCheckedToolIds.has(forbidden), `M10 realCheckMode must not include GPU/model tool ${forbidden}.`)
}

const commandTools = new Set(CORE_TOOL_COMMAND_CHECKS.map((item) => item.toolId))
check(commandTools.has('ffmpeg'), 'FFmpeg command readiness must be declared.')
check(commandTools.has('ffprobe'), 'FFprobe command readiness must be declared.')
check(CORE_TOOL_COMMAND_CHECKS.find((item) => item.toolId === 'ffmpeg')?.args.join(' ') === '-version', 'FFmpeg readiness must use version check only.')
check(CORE_TOOL_COMMAND_CHECKS.find((item) => item.toolId === 'ffprobe')?.args.join(' ') === '-version', 'FFprobe readiness must use version check only.')

const pythonImports = new Set(CORE_TOOL_PYTHON_IMPORT_CHECKS.map((item) => item.importName))
for (const expected of ['av', 'scenedetect', 'cv2', 'duckdb', 'polars', 'opentimelineio']) {
  check(pythonImports.has(expected), `Python import check must include ${expected}.`)
}

const nodePackages = new Set(CORE_TOOL_NODE_PACKAGE_CHECKS.map((item) => item.packageName))
check(nodePackages.has('sharp'), 'Node package checks must include Sharp metadata.')
check(nodePackages.has('remotion'), 'Node package checks must include Remotion metadata.')
const hyperframeNodeCheck = CORE_TOOL_NODE_PACKAGE_CHECKS.find((item) => item.toolId === 'hyperframe')
check(hyperframeNodeCheck?.sourcePath === 'server/workers/timeline/hyperframe-timeline-bridge.ts', 'Node package checks must prove the internal Hyperframe bridge source boundary.')

const revideoSpec = getProductionReadinessSpec('revideo')
check(revideoSpec?.evaluationOnly === true, 'Revideo readiness must remain evaluation-only.')
check(revideoSpec?.blocksProductionIfMissing === true, 'Revideo readiness must remain production-blocked.')

check(realCore.coreToolReadiness?.report.ffmpegLgplVerificationStatus === 'pending_manual_review', 'FFmpeg LGPL-safe verification must remain pending/manual.')
check(realCore.coreToolReadiness?.report.gpuModelToolsExcluded === true, 'Core readiness report must state GPU/model tools are excluded.')

for (const toolId of M10_CORE_CPU_RENDER_TOOL_IDS) {
  const spec = getProductionReadinessSpec(toolId)
  check(Boolean(spec), `Core M10 tool must have readiness spec: ${toolId}`)
  check(spec?.modelWeightChecks.length === 0, `Core M10 tool must not require model weights: ${toolId}`)
}

const renderExpectation = getContainerImageExpectation('render_worker')
check(Boolean(renderExpectation?.expectedToolIds.includes('remotion')), 'Render expectation must include Remotion.')
check(Boolean(renderExpectation?.expectedToolIds.includes('ffmpeg')), 'Render expectation must include FFmpeg.')
check(Boolean(renderExpectation?.expectedToolIds.includes('libass')), 'Render expectation must include libass.')
check(Boolean(renderExpectation?.forbiddenToolIds.includes('revideo')), 'Render expectation must forbid Revideo.')

const packageJson = requireRead('package.json')
check(packageJson.includes('smoke:prod-core-tool-install'), 'package.json must expose smoke:prod-core-tool-install.')
check(!packageJson.includes('docker/prod'), 'package.json must not auto-build production Docker images.')
check(!packageJson.includes('scripts/docker/prod'), 'package.json must not auto-run production Docker scripts.')

const policyText = requireRead('docker/prod/ffmpeg-lgpl-build-policy.md')
check(/pending manual/i.test(policyText), 'FFmpeg policy must mark commercial LGPL verification pending manual review.')
check(/GPL or nonfree/i.test(policyText), 'FFmpeg policy must reject unreviewed GPL/nonfree assumptions.')

console.log(JSON.stringify({
  ok: true,
  checkedFiles: requiredFiles.length,
  coreToolIds: M10_CORE_CPU_RENDER_TOOL_IDS.length,
  excludedGpuModelTools: M10_EXCLUDED_GPU_MODEL_TOOL_IDS.length,
  realCheckResults: realCore.results.length,
  localStatuses: realCore.summary.statuses,
  ffmpegStatus: realCore.coreToolReadiness?.report.ffmpegStatus,
  ffprobeStatus: realCore.coreToolReadiness?.report.ffprobeStatus,
  lgplStatus: realCore.coreToolReadiness?.report.ffmpegLgplVerificationStatus,
  libassStatus: realCore.coreToolReadiness?.report.libassSubtitleSupportStatus,
  revideoStatus: realCore.coreToolReadiness?.report.revideoStatus,
  localChecksAreInformational: true,
}, null, 2))
