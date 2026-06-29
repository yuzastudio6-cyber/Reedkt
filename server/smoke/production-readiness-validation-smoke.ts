import { existsSync, readFileSync } from 'node:fs'
import {
  classifyProductionReadinessBlocker,
  buildDryRunProductionReadinessReport,
  buildUnifiedProductionReadinessReport,
  buildReadinessCommandPlans,
  buildStaticProductionReadinessReport,
  containerImageReadinessManifest,
} from '../workers/readiness-validation'
import type { ProductionRegistryWorkerType, ProductionToolId } from '../tool-registry'

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
  check(repoFileExists(path), `Missing required M12 file: ${path}`)
  return readRepoFile(path)
}

const requiredFiles = [
  'server/workers/readiness-validation/readiness-validation-types.ts',
  'server/workers/readiness-validation/readiness-validation-modes.ts',
  'server/workers/readiness-validation/readiness-validation-policy.ts',
  'server/workers/readiness-validation/container-image-readiness-manifest.ts',
  'server/workers/readiness-validation/worker-image-readiness-planner.ts',
  'server/workers/readiness-validation/unified-tool-readiness-orchestrator.ts',
  'server/workers/readiness-validation/production-readiness-report-builder.ts',
  'server/workers/readiness-validation/production-readiness-blocker-policy.ts',
  'server/workers/readiness-validation/production-readiness-summary.ts',
  'server/workers/readiness-validation/readiness-command-plan-builder.ts',
  'server/workers/readiness-validation/container-readiness-command-builder.ts',
  'server/workers/readiness-validation/index.ts',
  'server/cli/production-readiness-summary.ts',
  'server/cli/production-readiness-command-plan.ts',
]

for (const file of requiredFiles) {
  check(repoFileExists(file), `Missing M12 readiness validation file: ${file}`)
}

const staticReport = buildStaticProductionReadinessReport()
const dryRunReport = buildDryRunProductionReadinessReport()
const hostOptionalReport = buildUnifiedProductionReadinessReport({ mode: 'host_optional' })

check(staticReport.mode === 'static_only', 'Static readiness report must use static_only mode.')
check(dryRunReport.mode === 'dry_run', 'Dry-run readiness report must use dry_run mode.')
check(hostOptionalReport.mode === 'host_optional', 'Host-optional readiness report must use host_optional mode.')
check(staticReport.workerSummaries.length === 6, 'Readiness report must contain all six worker summaries.')
check(staticReport.imageSummaries.length === 6, 'Readiness report must contain all six image summaries.')
check(staticReport.toolSummaries.length > 0, 'Readiness report must contain tool summaries.')
check(hostOptionalReport.overallStatus === 'blocked', 'Host-optional readiness must not unlock production.')
check(
  hostOptionalReport.nextActions.some((action) => action.includes('bounded evidence only')),
  'Host-optional readiness must remind operators that local checks are bounded evidence only.',
)

const requiredWorkers: ProductionRegistryWorkerType[] = [
  'api_service',
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
]
for (const workerType of requiredWorkers) {
  check(staticReport.workerSummaries.some((summary) => summary.workerType === workerType), `Missing worker summary ${workerType}.`)
}

function worker(workerType: ProductionRegistryWorkerType) {
  const summary = staticReport.workerSummaries.find((item) => item.workerType === workerType)
  if (!summary) {
    throw new Error(`Missing worker summary ${workerType}.`)
  }
  return summary
}

function image(role: string) {
  const summary = staticReport.imageSummaries.find((item) => item.imageRole === role)
  if (!summary) {
    throw new Error(`Missing image summary ${role}.`)
  }
  return summary
}

check(worker('cpu_analysis_worker')?.expectedTools.includes('ffmpeg'), 'CPU worker summary must include FFmpeg.')
check(worker('cpu_analysis_worker')?.expectedTools.includes('opentimelineio'), 'CPU worker summary must include OpenTimelineIO.')
check(worker('render_worker')?.expectedTools.includes('remotion'), 'Render worker summary must include Remotion.')
check(worker('render_worker')?.expectedTools.includes('libass'), 'Render worker summary must include libass.')
check(worker('gpu_ai_worker')?.expectedTools.includes('faster_whisper'), 'GPU worker summary must include faster-whisper.')
check(worker('gpu_ai_worker')?.expectedTools.includes('deepfilternet'), 'GPU worker summary must include DeepFilterNet.')

const revideoTool = staticReport.toolSummaries.find((tool) => tool.toolId === 'revideo')
if (!revideoTool) {
  throw new Error('Report must include Revideo.')
}
check(revideoTool.status === 'evaluation_only', 'Report must mark Revideo evaluation_only.')
check(revideoTool.blockers.some((blocker) => blocker.severity === 'hard_blocker'), 'Revideo must be production-blocked.')

const modelWeightTools = staticReport.toolSummaries.filter((tool) => tool.modelWeightsRequired)
check(modelWeightTools.length > 0, 'Report must include model-weight tools.')
check(modelWeightTools.every((tool) => ['needs_model_weight_review', 'evaluation_only'].includes(tool.status)), 'Model-weight tools must need review or remain evaluation-only in M12.')
check(staticReport.modelWeightSummaries.length > 0, 'Report must include model-weight summaries.')
check(staticReport.modelWeightSummaries.every((summary) => summary.blocksProduction), 'M12 model-weight manifests must block production until reviewed.')

const apiImage = image('api')
const cpuImage = image('cpu_worker')
const renderImage = image('render_worker')
const gpuOnlyTools: ProductionToolId[] = [
  'faster_whisper',
  'birefnet',
  'sam2',
  'kornia',
  'deepfilternet',
  'demucs',
  'real_esrgan',
  'film',
]
for (const toolId of gpuOnlyTools) {
  check(!apiImage?.expectedTools.includes(toolId), `API image must not include GPU tool ${toolId}.`)
  check(!cpuImage?.expectedTools.includes(toolId), `CPU image must not include GPU tool ${toolId}.`)
  check(!renderImage?.expectedTools.includes(toolId), `Render image must not include GPU tool ${toolId}.`)
}
check(!renderImage?.expectedTools.includes('revideo'), 'Render image must keep Revideo out.')

check(
  classifyProductionReadinessBlocker({ kind: 'evaluation_only_production_execution', toolId: 'revideo' }).severity === 'hard_blocker',
  'Blocker policy must flag evaluation-only production execution.',
)
check(
  classifyProductionReadinessBlocker({ kind: 'unknown_model_weight_license', toolId: 'faster_whisper' }).severity === 'hard_blocker',
  'Blocker policy must flag unknown model-weight licenses.',
)
check(
  classifyProductionReadinessBlocker({ kind: 'non_commercial_model_weight', toolId: 'demucs' }).severity === 'hard_blocker',
  'Blocker policy must flag non-commercial model weights.',
)
check(
  classifyProductionReadinessBlocker({ kind: 'gpu_tool_on_non_gpu_worker', toolId: 'sam2', workerType: 'cpu_analysis_worker' }).severity === 'hard_blocker',
  'Blocker policy must flag GPU tool assignment to CPU workers.',
)
check(
  classifyProductionReadinessBlocker({ kind: 'required_launch_core_missing', toolId: 'ffmpeg' }).severity === 'hard_blocker',
  'Blocker policy must flag missing launch-core tools.',
)
check(
  classifyProductionReadinessBlocker({ kind: 'future_only_tool_not_installed', toolId: 'vapoursynth' }).severity === 'warning',
  'Future-only tools must be warnings, not false passes.',
)

check(staticReport.licenseSummaries.some((summary) => summary.id === 'ffmpeg_lgpl_commercial_build' && summary.status === 'pending_manual_review'), 'FFmpeg LGPL commercial verification must remain pending/manual.')
check(hostOptionalReport.licenseSummaries.some((summary) => summary.id === 'ffmpeg_lgpl_commercial_build' && summary.status === 'pending_manual_review'), 'Host-optional readiness must keep FFmpeg LGPL commercial verification pending/manual.')
check(staticReport.licenseSummaries.some((summary) => summary.id === 'libass_subtitle_support' && summary.manualReviewRequired), 'libass support must be represented as manual/pending-capable.')

const hostFfmpegTool = hostOptionalReport.toolSummaries.find((tool) => tool.toolId === 'ffmpeg')
const hostFfprobeTool = hostOptionalReport.toolSummaries.find((tool) => tool.toolId === 'ffprobe')
check(Boolean(hostFfmpegTool), 'Host-optional report must include FFmpeg.')
check(Boolean(hostFfprobeTool), 'Host-optional report must include ffprobe.')
check(hostFfmpegTool?.blockers.every((blocker) => !blocker.id.includes('required_launch_core_missing')) === true, 'Host-optional FFmpeg must not retain the missing launch-core blocker after a bounded local pass.')
check(hostFfprobeTool?.blockers.every((blocker) => !blocker.id.includes('required_launch_core_missing')) === true, 'Host-optional ffprobe must not retain the missing launch-core blocker after a bounded local pass.')

const plans = buildReadinessCommandPlans()
for (const id of [
  'static_readiness',
  'container_readiness_cpu_worker',
  'container_readiness_render_worker',
  'container_readiness_qa_worker',
  'container_readiness_gpu_worker',
]) {
  check(plans.some((plan) => plan.id === id), `Missing command plan ${id}.`)
}
check(plans.every((plan) => plan.doesNotRun.includes('no media processing')), 'Command plans must say they do not process media.')
check(plans.every((plan) => plan.doesNotRun.includes('no model downloads')), 'Command plans must say they do not download models.')
check(plans.every((plan) => plan.doesNotRun.includes('no providers')), 'Command plans must say they do not call providers.')
check(plans.every((plan) => plan.doesNotRun.includes('no deployment')), 'Command plans must say they do not deploy.')

const scripts = [
  'scripts/docker/prod/08-run-static-readiness.example.sh',
  'scripts/docker/prod/09-run-container-readiness-cpu.example.sh',
  'scripts/docker/prod/10-run-container-readiness-render.example.sh',
  'scripts/docker/prod/11-run-container-readiness-qa.example.sh',
  'scripts/docker/prod/12-run-container-readiness-gpu.example.sh',
  'scripts/docker/prod/13-run-all-container-readiness.example.sh',
]

for (const script of scripts) {
  const text = requireRead(script)
  check(text.includes('manual-not-set'), `${script} must fail on manual-not-set image tags.`)
  if (!script.includes('08-run-static')) {
    check(text.includes('REEDITPRO_CONFIRM_CONTAINER_READINESS'), `${script} must require container readiness confirmation.`)
  }
  check(!/\bgcloud\s+run\b|\bgcloud\s+deploy\b|\bgcloud\s+beta\s+run\b/i.test(text), `${script} must not deploy Cloud Run.`)
  check(!/huggingface-cli|snapshot_download|from_pretrained|wget\s|curl\s/i.test(text), `${script} must not download models.`)
  check(!/sk-[A-Za-z0-9]|AIza[A-Za-z0-9_-]+|ghp_[A-Za-z0-9]+|-----BEGIN/.test(text), `${script} must not contain real secrets.`)
}

const packageJson = requireRead('package.json')
check(packageJson.includes('smoke:prod-readiness-validation'), 'package.json must expose smoke:prod-readiness-validation.')
check(packageJson.includes('prod:readiness:summary'), 'package.json must expose prod:readiness:summary.')
check(packageJson.includes('prod:readiness:command-plan'), 'package.json must expose prod:readiness:command-plan.')
check(!/"[^"]*":\s*"[^"]*scripts\/docker\/prod\/0[1-7][^"]*"/.test(packageJson), 'npm scripts must not auto-build or auto-push production images.')
check(!/"[^"]*":\s*"[^"]*docker build[^"]*docker\/prod[^"]*"/.test(packageJson), 'npm scripts must not auto-build production Docker images.')

check(containerImageReadinessManifest.length === 6, 'Container image readiness manifest must cover six images.')
check(staticReport.commandPlans.length >= 6, 'Readiness report must include command plans.')

console.log(JSON.stringify({
  ok: true,
  mode: staticReport.mode,
  overallStatus: staticReport.overallStatus,
  workers: staticReport.workerSummaries.length,
  images: staticReport.imageSummaries.length,
  tools: staticReport.toolSummaries.length,
  modelWeightSummaries: staticReport.modelWeightSummaries.length,
  hardBlockers: staticReport.blockerSummaries.filter((blocker) => blocker.severity === 'hard_blocker').length,
  commandPlans: staticReport.commandPlans.map((plan) => plan.id),
  scripts: scripts.length,
  dockerRequired: false,
  hostToolsRequired: false,
}, null, 2))
