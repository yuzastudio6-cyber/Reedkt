import { existsSync, readFileSync } from 'node:fs'
import {
  PRODUCTION_TOOL_IDS,
  getLaunchCoreProductionTools,
  getProductionToolProfile,
  getToolsWithModelWeights,
} from '../tool-registry'
import type { ProductionToolId } from '../tool-registry'
import {
  assertApiImageHasNoHeavyTools,
  assertGpuToolsStayOutOfApiImage,
  assertProductionReadinessSpecsCoverRegistry,
  assertRevideoReadinessBlocked,
  getContainerImageExpectation,
  getProductionReadinessSpec,
  productionContainerImageExpectations,
  productionToolReadinessSpecs,
  runProductionToolReadiness,
} from '../workers/production-readiness'
import type { ProductionToolReadinessSpec } from '../workers/production-readiness'

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

function repoFileExists(path: string): boolean {
  return existsSync(new URL(`../../${path}`, import.meta.url))
}

function requireSpec(toolId: ProductionToolId): ProductionToolReadinessSpec {
  const spec = getProductionReadinessSpec(toolId)

  if (!spec) {
    throw new Error(`Missing production readiness spec for ${toolId}`)
  }

  return spec
}

const requiredDockerFiles = [
  'docker/prod/README.md',
  'docker/prod/.dockerignore',
  'docker/prod/api/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/gpu-worker/Dockerfile',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/qa-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
]

for (const path of requiredDockerFiles) {
  check(repoFileExists(path), `Missing Docker template file: ${path}`)
}

const requiredBuildScripts = [
  'scripts/docker/prod/README.md',
  'scripts/docker/prod/00-print-image-config.sh',
  'scripts/docker/prod/01-build-api-image.example.sh',
  'scripts/docker/prod/02-build-cpu-worker-image.example.sh',
  'scripts/docker/prod/03-build-gpu-worker-image.example.sh',
  'scripts/docker/prod/04-build-render-worker-image.example.sh',
  'scripts/docker/prod/05-build-qa-worker-image.example.sh',
  'scripts/docker/prod/06-build-tool-readiness-image.example.sh',
  'scripts/docker/prod/07-push-images.example.sh',
]

for (const path of requiredBuildScripts) {
  check(repoFileExists(path), `Missing Docker build template script: ${path}`)
}

const buildScriptText = requiredBuildScripts.map(readRepoFile).join('\n')
const executableBuildScriptText = requiredBuildScripts
  .filter((path) => path.endsWith('.sh'))
  .map(readRepoFile)
  .join('\n')
check(!/sk-[A-Za-z0-9]|AIza[A-Za-z0-9_-]+|ghp_[A-Za-z0-9]+|xoxb-[A-Za-z0-9-]+|-----BEGIN/.test(buildScriptText), 'Docker scripts must not contain secret-looking values.')
check(!/\bgcloud\s+run\b|\bgcloud\s+deploy\b|\bgcloud\s+beta\s+run\b/i.test(executableBuildScriptText), 'Docker scripts must not deploy Cloud Run.')
check(buildScriptText.includes('manual-not-set'), 'Docker scripts must fail when REEDITPRO_IMAGE_TAG remains manual-not-set.')

const packageJson = readRepoFile('package.json')
check(packageJson.includes('smoke:prod-container-readiness'), 'package.json must expose smoke:prod-container-readiness.')
check(!packageJson.includes('docker/prod'), 'package.json must not auto-build production Dockerfiles.')
check(!packageJson.includes('scripts/docker/prod'), 'package.json must not call production Docker scripts.')

assertProductionReadinessSpecsCoverRegistry()
assertApiImageHasNoHeavyTools()
assertGpuToolsStayOutOfApiImage()
assertRevideoReadinessBlocked()

check(productionToolReadinessSpecs.length === PRODUCTION_TOOL_IDS.length, 'Readiness specs must cover every production tool.')

const specIds = new Set(productionToolReadinessSpecs.map((spec) => spec.toolId))
check(specIds.size === productionToolReadinessSpecs.length, 'Each production tool must have exactly one readiness spec.')

for (const toolId of PRODUCTION_TOOL_IDS) {
  check(specIds.has(toolId), `Every production tool must have a readiness spec: ${toolId}`)
}

for (const spec of productionToolReadinessSpecs) {
  check(PRODUCTION_TOOL_IDS.includes(spec.toolId), `Readiness spec references unknown tool ${spec.toolId}`)
}

const revideo = requireSpec('revideo')
check(revideo.evaluationOnly, 'Revideo readiness spec must be evaluation-only.')
check(!revideo.blocksProductionIfMissing, 'Revideo readiness spec must not hard-block static readiness solely for evaluation-only status.')
check(revideo.readinessStatusWhenMissing === 'evaluation_only', 'Revideo readiness status must be evaluation_only.')

const apiExpectation = getContainerImageExpectation('api')
check(Boolean(apiExpectation), 'API image expectation must exist.')
check(apiExpectation?.expectedToolIds.length === 0, 'API image must not expect heavy media/GPU/model tools.')

const gpuToolIds = productionToolReadinessSpecs
  .filter((spec) => spec.gpuRequired || spec.modelWeightChecks.length > 0)
  .map((spec) => spec.toolId)

for (const toolId of gpuToolIds) {
  const spec = requireSpec(toolId)
  check(!spec.imageRoles.includes('api'), `${toolId} must not be assigned to the API image.`)
}

for (const profile of getToolsWithModelWeights()) {
  const spec = requireSpec(profile.toolId)
  check(spec.modelWeightChecks.length > 0, `${profile.toolId} must include model weight readiness checks.`)
  check(spec.blocksProductionIfMissing, `${profile.toolId} must block production readiness until model weights are reviewed.`)
}

const dryRun = runProductionToolReadiness({ dryRun: true })
check(dryRun.dryRun, 'Readiness runner must run in dry-run mode.')
check(dryRun.results.length === PRODUCTION_TOOL_IDS.length, 'Dry-run readiness must produce one result per production tool.')
check(!dryRun.results.some((result) => result.status === 'passed'), 'Dry-run readiness must not report command/import checks as passed.')
check(dryRun.summary.launchCoreTools.length === getLaunchCoreProductionTools().length, 'Summary must surface launch-core tools.')
check(dryRun.summary.missingTools.length > 0, 'Summary must list missing launch/core tools in dry-run.')
check(dryRun.summary.futureOnlyTools.length > 0, 'Summary must list future-only tools.')
check(dryRun.summary.evaluationOnlyTools.includes('revideo'), 'Summary must list Revideo as evaluation-only.')
check(dryRun.summary.modelWeightTools.length === getToolsWithModelWeights().length, 'Summary must list model-weight tools.')
check(!dryRun.summary.productionBlockedTools.includes('revideo'), 'Summary must not list Revideo as production-blocked solely for evaluation-only status.')

const remotion = requireSpec('remotion')
check(remotion.imageRoles.includes('render_worker'), 'Remotion must be render worker readiness.')
check(remotion.nodePackageChecks.some((item) => item.importName === 'remotion'), 'Remotion readiness must be a Node package check.')

const hyperframe = requireSpec('hyperframe')
check(hyperframe.expectedWorkerTypes.includes('frontend_preview_only'), 'Hyperframe must remain preview/timeline boundary.')
check(!hyperframe.gpuRequired, 'Hyperframe must not be modeled as a heavy backend AI tool.')

check(requireSpec('ffmpeg').commandChecks.some((item) => item.command === 'ffmpeg'), 'FFmpeg readiness must include command checks.')
check(requireSpec('ffprobe').commandChecks.some((item) => item.command === 'ffprobe'), 'ffprobe readiness must include command checks.')

const libass = requireSpec('libass')
check(libass.imageRoles.includes('render_worker'), 'libass readiness must be tied to render worker support.')
check(libass.commandChecks.some((item) => item.expectedPattern === 'ass'), 'libass readiness must validate caption burn-in support.')

const renderExpectation = getContainerImageExpectation('render_worker')
check(Boolean(renderExpectation?.expectedToolIds.includes('remotion')), 'Render image expectation must include Remotion.')
check(Boolean(renderExpectation?.expectedToolIds.includes('ffmpeg')), 'Render image expectation must include FFmpeg.')
check(Boolean(renderExpectation?.expectedToolIds.includes('libass')), 'Render image expectation must include libass.')
check(Boolean(renderExpectation?.forbiddenToolIds.includes('revideo')), 'Render image expectation must exclude Revideo.')

check(productionContainerImageExpectations.length === 6, 'There must be six production container image expectations.')

for (const expectation of productionContainerImageExpectations) {
  check(repoFileExists(expectation.dockerfilePath), `${expectation.imageRole} Dockerfile must exist.`)
  for (const toolId of expectation.expectedToolIds) {
    check(Boolean(getProductionToolProfile(toolId)), `${expectation.imageRole} references unknown expected tool ${toolId}.`)
  }
}

console.log(JSON.stringify({
  ok: true,
  dockerTemplates: requiredDockerFiles.length,
  buildScripts: requiredBuildScripts.length,
  readinessSpecs: productionToolReadinessSpecs.length,
  launchCoreTools: dryRun.summary.launchCoreTools.length,
  missingTools: dryRun.summary.missingTools.length,
  futureOnlyTools: dryRun.summary.futureOnlyTools.length,
  evaluationOnlyTools: dryRun.summary.evaluationOnlyTools,
  modelWeightTools: dryRun.summary.modelWeightTools.length,
  productionBlockedTools: dryRun.summary.productionBlockedTools.length,
}, null, 2))
