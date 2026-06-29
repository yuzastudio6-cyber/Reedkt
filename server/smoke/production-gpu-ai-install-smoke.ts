import { existsSync, readdirSync, readFileSync } from 'node:fs'
import {
  GCP_PRODUCTION_CLOUD_RUN_JOBS,
  GCP_PRODUCTION_PREMIUM_GPU_OPTION,
} from '../config/gcp-production-config'
import {
  GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES,
  assertModelWeightManifestProductionAllowed,
  evaluateModelWeightManifestForMode,
  getExpectedModelWeightRoot,
  listGpuModelWeightManifestTemplates,
  summarizeGpuModelWeightReadiness,
  type ProductionModelWeightManifestTemplate,
} from '../model-weights'
import {
  GPU_PENDING_SOURCE_INSTALL_REVIEW,
  GPU_TOOL_PYTHON_IMPORT_CHECKS,
  M11_GPU_MODEL_WEIGHT_TOOL_IDS,
  getContainerImageExpectation,
  getProductionReadinessSpec,
  runGpuAiReadinessChecks,
} from '../workers/production-readiness'
import { getProductionToolProfile, getGpuRequiredTools } from '../tool-registry'

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
  check(repoFileExists(path), `Missing required M11 file: ${path}`)
  return readRepoFile(path)
}

const gpuDocker = requireRead('docker/prod/gpu-worker/Dockerfile')
const gpuRequirements = requireRead('docker/prod/gpu-worker/requirements.gpu.txt')
const gpuReadme = requireRead('docker/prod/gpu-worker/README.md')
const modelLayout = requireRead('docker/prod/gpu-worker/model-weight-layout.md')
const gpuVersionPolicy = requireRead('docker/prod/gpu-worker/gpu-tool-version-policy.md')

check(!/wget\s|curl\s|huggingface-cli|snapshot_download|from_pretrained|git\s+clone/i.test(gpuDocker), 'GPU Dockerfile must not include model fetch commands.')
check(!/OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|PROVIDER|SECRET_VALUE|sk-[A-Za-z0-9]/i.test(gpuDocker), 'GPU Dockerfile must not contain provider secrets.')
check(!/\brevideo\b/i.test(gpuDocker), 'GPU Dockerfile must not install Revideo.')
check(/nvidia\/cuda/i.test(gpuDocker), 'GPU Dockerfile must reference a CUDA-compatible base image policy.')
check(/nvidia-l4/i.test(gpuDocker), 'GPU Dockerfile must document NVIDIA L4 first.')

for (const expectedPath of [
  '/opt/reeditpro/model-weights/faster-whisper',
  '/opt/reeditpro/model-weights/birefnet',
  '/opt/reeditpro/model-weights/sam2',
  '/opt/reeditpro/model-weights/deepfilternet',
  '/opt/reeditpro/model-weights/demucs',
  '/opt/reeditpro/model-weights/real-esrgan',
  '/opt/reeditpro/model-weights/film',
  '/opt/reeditpro/model-weights/paddleocr',
]) {
  check(gpuDocker.includes(expectedPath) || modelLayout.includes(`${expectedPath}/`), `GPU model-weight placeholder path missing: ${expectedPath}`)
}

for (const required of [
  'torch',
  'torchvision',
  'ctranslate2',
  'faster-whisper',
  'kornia',
  'opencv-python-headless',
  'deepfilternet',
  'demucs',
]) {
  check(gpuRequirements.includes(required), `GPU requirements must include or document ${required}.`)
}

for (const planned of ['paddleocr', 'paddlepaddle-gpu']) {
  check(gpuRequirements.includes(`optional_planned: ${planned}`), `GPU requirements must document ${planned} as optional/planned.`)
}

for (const pending of ['BiRefNet', 'SAM2', 'Real-ESRGAN', 'FILM']) {
  check(gpuRequirements.includes(`pending_source_install_review: ${pending}`), `GPU requirements must mark ${pending} pending source install review.`)
}

check(gpuVersionPolicy.includes('pending source install review'), 'GPU version policy must document source install review.')
check(gpuReadme.includes('RTX PRO 6000') && gpuReadme.includes('20 CPU') && gpuReadme.includes('80Gi'), 'GPU README must keep RTX PRO 6000 future/premium/evaluation with requirements.')

const templates = listGpuModelWeightManifestTemplates()
const templateIds = new Set(templates.map((template) => template.id))
for (const required of [
  'faster_whisper_model',
  'birefnet_model',
  'sam2_checkpoint',
  'deepfilternet_model',
  'demucs_model',
  'real_esrgan_model',
  'film_model',
  'paddleocr_model',
] as const) {
  check(templateIds.has(required), `Missing model-weight manifest template ${required}.`)
}

for (const toolId of M11_GPU_MODEL_WEIGHT_TOOL_IDS) {
  check(templates.some((template) => template.toolId === toolId), `Missing model-weight manifest template for ${toolId}.`)
}

const missingManifest = evaluateModelWeightManifestForMode(undefined, 'production_ready')
check(!missingManifest.allowedForProduction, 'Missing approved model-weight manifest must block production.')

const unknownLicense = evaluateModelWeightManifestForMode(templates[0], 'production_ready')
check(!unknownLicense.allowedForProduction, 'Unknown model-weight license must block production.')

const nonCommercialTemplate: ProductionModelWeightManifestTemplate = {
  ...templates[0],
  id: 'faster_whisper_model',
  license: 'cc-by-nc',
  commercialUseAllowed: false,
  commercialUseStatus: 'blocked',
  reviewStatus: 'blocked',
}
check(!evaluateModelWeightManifestForMode(nonCommercialTemplate, 'production_ready').allowedForProduction, 'Non-commercial model weights must block production.')

let productionBlockThrew = false
try {
  assertModelWeightManifestProductionAllowed(nonCommercialTemplate)
} catch {
  productionBlockThrew = true
}
check(productionBlockThrew, 'Production assertion must block non-commercial model weights.')

const dryGpu = runGpuAiReadinessChecks()
check(dryGpu.dryRun, 'GPU readiness must default to dry-run.')
check(!dryGpu.realImportCheckMode, 'Optional real GPU import checks must be disabled by default.')
check(dryGpu.importChecks.every((result) => result.status === 'not_checked' || result.status === 'pending_manual_review'), 'Dry-run GPU readiness must not report heavy imports as executed.')
check(dryGpu.report.modelWeightBlockedTools.length >= M11_GPU_MODEL_WEIGHT_TOOL_IDS.length, 'GPU readiness summary must list model-weight blockers.')
check(dryGpu.report.pendingSourceInstallReviewTools.length === GPU_PENDING_SOURCE_INSTALL_REVIEW.length, 'GPU readiness must list pending source install review tools.')
check(summarizeGpuModelWeightReadiness().productionBlocked.length === GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES.length, 'All M11 GPU model templates should block production until reviewed.')

for (const checkDef of GPU_TOOL_PYTHON_IMPORT_CHECKS) {
  check(!['api', 'cpu_worker', 'render_worker'].includes(String(checkDef.toolId)), 'GPU import check definitions must not target API/CPU/render image roles.')
}

const apiExpectation = getContainerImageExpectation('api')
const cpuExpectation = getContainerImageExpectation('cpu_worker')
const renderExpectation = getContainerImageExpectation('render_worker')
const nonGpuImageForbiddenModelTools = M11_GPU_MODEL_WEIGHT_TOOL_IDS.filter((toolId) => toolId !== 'paddleocr')
for (const expectation of [apiExpectation, cpuExpectation, renderExpectation]) {
  check(Boolean(expectation), 'API/CPU/render container expectations must exist.')
  for (const toolId of nonGpuImageForbiddenModelTools) {
    check(!expectation?.expectedToolIds.includes(toolId), `${expectation?.imageRole} image must not expect GPU model tool ${toolId}.`)
  }
}

for (const profile of getGpuRequiredTools()) {
  check(
    profile.workerType === 'gpu_ai_worker' ||
      profile.productionStatus === 'future' ||
      profile.productionStatus === 'evaluation_only',
    `${profile.toolId} is GPU-required but not assigned to GPU/evaluation/future policy.`,
  )
}

for (const toolId of M11_GPU_MODEL_WEIGHT_TOOL_IDS) {
  const profile = getProductionToolProfile(toolId)
  const spec = getProductionReadinessSpec(toolId)
  check(Boolean(profile?.modelWeightsRequired), `${toolId} must require model weights.`)
  check(Boolean(spec?.modelWeightChecks.length), `${toolId} readiness spec must include model-weight checks.`)
}

const revideoProfile = getProductionToolProfile('revideo')
const revideoSpec = getProductionReadinessSpec('revideo')
check(revideoProfile?.productionStatus === 'evaluation_only', 'Revideo must remain evaluation-only.')
check(revideoSpec?.blocksProductionIfMissing === false, 'Revideo readiness must not hard-block static readiness solely for evaluation-only status.')

const gpuJob = GCP_PRODUCTION_CLOUD_RUN_JOBS.find((job) => job.name === 'reeditpro-gpu-ai-worker')
check(gpuJob?.gpuType === 'nvidia-l4', 'Cloud Run GPU template must use nvidia-l4 first.')
check(gpuJob?.gpuCount === 1, 'Cloud Run GPU template must use one GPU.')
check(gpuJob?.cpu === 4 && gpuJob.memory === '16Gi', 'Cloud Run L4 template must document 4 CPU and 16Gi.')
check(gpuJob?.noGpuZonalRedundancy === true, 'Cloud Run GPU template must include no-gpu-zonal-redundancy.')
check(GCP_PRODUCTION_PREMIUM_GPU_OPTION.status === 'future_premium_evaluation_only', 'RTX PRO 6000 must remain future/premium/evaluation only.')
check(GCP_PRODUCTION_PREMIUM_GPU_OPTION.minimumCpu === 20 && GCP_PRODUCTION_PREMIUM_GPU_OPTION.minimumMemory === '80Gi', 'RTX PRO 6000 requirements must stay 20 CPU and 80Gi.')

const gpuDocs = [
  'docs/google-cloud/production-gpu-worker-plan.md',
  'docs/google-cloud/production-cloud-run-job-plan.md',
  'scripts/gcp/prod/10-deploy-gpu-worker-job.example.sh',
].map(requireRead).join('\n')
check(/nvidia-l4/i.test(gpuDocs), 'GPU docs/templates must mention nvidia-l4.')
check(/no-gpu-zonal-redundancy/i.test(gpuDocs), 'GPU docs/templates must mention no-gpu-zonal-redundancy.')
check(/4 CPU|--cpu=4/i.test(gpuDocs) && /16Gi/i.test(gpuDocs), 'GPU docs/templates must document L4 CPU/memory minimum.')
check(/20 CPU/i.test(gpuDocs) && /80Gi/i.test(gpuDocs), 'GPU docs/templates must document RTX PRO 6000 requirements.')

const gpuWorkerFiles = readdirSync(new URL('../../docker/prod/gpu-worker/', import.meta.url))
check(!gpuWorkerFiles.some((file) => /\.(bin|pt|pth|safetensors|ckpt|onnx)$/i.test(file)), 'No model weight files may be committed under docker/prod/gpu-worker.')
check(getExpectedModelWeightRoot() === '/opt/reeditpro/model-weights/', 'Expected model-weight root must be locked.')

console.log(JSON.stringify({
  ok: true,
  gpuManifestTemplates: templates.length,
  gpuImportChecks: GPU_TOOL_PYTHON_IMPORT_CHECKS.length,
  pendingSourceInstallReview: GPU_PENDING_SOURCE_INSTALL_REVIEW.length,
  modelWeightBlockedTools: dryGpu.report.modelWeightBlockedTools,
  runtimeChecks: dryGpu.runtimeChecks.length,
  gpuJob: {
    gpuType: gpuJob?.gpuType,
    gpuCount: gpuJob?.gpuCount,
    cpu: gpuJob?.cpu,
    memory: gpuJob?.memory,
    noGpuZonalRedundancy: gpuJob?.noGpuZonalRedundancy,
  },
  localGpuImportsExecuted: false,
}, null, 2))
