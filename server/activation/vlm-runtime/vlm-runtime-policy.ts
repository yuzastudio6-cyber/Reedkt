import { getApprovedVlmModelDownloadEvidence } from '../vlm-model-download'
import type {
  VlmRuntimeConfig,
  VlmRuntimeEnvValidationInput,
  VlmRuntimeValidationResult,
} from './vlm-runtime-types'

const phase39B = getApprovedVlmModelDownloadEvidence()

export const vlmRuntimeConfig: VlmRuntimeConfig = {
  phase: '39C',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  modelId: 'Qwen/Qwen3-VL-8B-Instruct',
  modelFamily: 'Qwen3-VL',
  modelRevision: phase39B.revision,
  modelGcsPath: phase39B.targetGcsPath,
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaArtifactPrefix: 'activation/phase39c/generated-vlm-runtime',
  localTempRoot: '/tmp/reeditpro-vlm-runtime/phase39c',
  stagingImagePath: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c',
  stagingCloudRunJobName: 'reeditpro-stg-vlm-runtime-phase39c',
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  requiredRuntime: 'vllm',
  requiredVllmVersion: '0.11.0',
  fallbackRuntime: 'transformers_fallback',
  approvedGpuType: 'L4',
  requiredBroadRegionAccuracyThreshold: 0.7,
  requiredLabelRecallThreshold: 0.7,
  requiredSchemaValidity: 1,
  selectedFileCount: phase39B.fileCount ?? phase39B.selectedAssets.length,
  selectedTotalSizeBytes: phase39B.selectedTotalSizeBytes ?? 0,
  aggregateSha256: phase39B.aggregateSha256 ?? '',
}

export const vlmRuntimeDoesNotDo = [
  'no real frames',
  'no real video',
  'no arbitrary images or uploaded files',
  'no raw prompt execution',
  'no Qwen/DashScope/Alibaba provider calls',
  'no Hugging Face Inference Provider calls',
  'no OpenAI-compatible VLM provider endpoints',
  'no model id runtime path that could auto-download',
  'no runtime auto-download',
  'no public buckets, public artifacts, or signed URLs',
  'no production or beta unlock',
  'no broad real-user media',
  'no Track A work',
]

export function phase39CVlmRuntimeArtifactPrefix(runId: string): string {
  if (!/^phase39c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 39C run id: ${runId}`)
  return `${vlmRuntimeConfig.qaArtifactPrefix}/${runId}`
}

export function validateVlmRuntimeExecutionEnv(input: VlmRuntimeEnvValidationInput = {}): VlmRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_VLM_RUNTIME_MODE ?? 'local'
  const stagingRequested = runtimeMode === 'staging_cloud_run_job'

  if (projectId !== vlmRuntimeConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== vlmRuntimeConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== vlmRuntimeConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== vlmRuntimeConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if ((input.privateGcsReadConfirmation ?? process.env.REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ) !== 'true') blockers.push('REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ=true is required for Phase 39C private model reads.')
  if ((input.runtimeExecuteConfirmation ?? process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE) !== 'true') blockers.push('REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE=true is required for generated VLM runtime execution.')
  if ((input.artifactUploadConfirmation ?? process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD) !== 'true') blockers.push('REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD=true is required before private Phase 39C artifact upload.')
  if ((input.modelGcsPath ?? process.env.REEDITPRO_VLM_MODEL_GCS_PATH ?? vlmRuntimeConfig.modelGcsPath) !== vlmRuntimeConfig.modelGcsPath) blockers.push('Only the verified Phase 39B private Qwen3-VL GCS path may be used.')
  if ((input.aggregateSha256 ?? process.env.REEDITPRO_VLM_AGGREGATE_SHA256 ?? vlmRuntimeConfig.aggregateSha256) !== vlmRuntimeConfig.aggregateSha256) blockers.push('VLM aggregate checksum must match Phase 39B evidence.')
  if ((input.generatedFixturesOnly ?? process.env.GENERATED_VLM_FIXTURES_ONLY ?? 'true') !== 'true') blockers.push('Generated VLM fixtures only guard must be true.')
  if ((input.rawPromptEnabled ?? process.env.RAW_VLM_PROMPT_ENABLED ?? 'false') !== 'false') blockers.push('Raw VLM prompt execution must remain disabled.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.mediaProcessingEnabled ?? process.env.MEDIA_PROCESSING_ENABLED ?? 'false') !== 'false') blockers.push('Media processing must remain disabled outside generated fixtures.')
  if ((input.realMediaInputEnabled ?? process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') !== 'false') blockers.push('Real media input must remain disabled.')
  if ((input.arbitraryMediaInputEnabled ?? process.env.ARBITRARY_MEDIA_INPUT_ENABLED ?? 'false') !== 'false') blockers.push('Arbitrary media input must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.internalBetaReady ?? process.env.REEDITPRO_INTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('Internal beta flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if ((input.publicOutputEnabled ?? process.env.PUBLIC_OUTPUT_ENABLED ?? 'false') !== 'false') blockers.push('Public output must remain disabled.')
  if ((input.trackAExecutionEnabled ?? process.env.TRACK_A_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Track A execution must remain disabled.')
  if ((input.modelIdRuntimePath ?? process.env.REEDITPRO_VLM_RUNTIME_MODEL_PATH ?? '') === vlmRuntimeConfig.modelId) blockers.push('Runtime model path cannot be the Hugging Face model id; Phase 39C must use a local model directory.')
  if (runtimeMode !== 'local' && runtimeMode !== 'staging_cloud_run_job') blockers.push('REEDITPRO_VLM_RUNTIME_MODE must be local or staging_cloud_run_job.')

  if (stagingRequested) {
    if ((input.dockerBuildConfirmation ?? process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD) !== 'true') blockers.push('REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD=true is required for staging image build.')
    if ((input.dockerPushConfirmation ?? process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH) !== 'true') blockers.push('REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH=true is required for staging image push.')
    if ((input.cloudRunJobConfirmation ?? process.env.REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB) !== 'true') blockers.push('REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB=true is required for the guarded staging Cloud Run Job path.')
    if ((input.l4GpuConfirmation ?? process.env.REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE) !== 'true') blockers.push('REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE=true is required before L4 GPU execution.')
  }

  warnings.push('Phase 39C verifies generated synthetic VLM fixtures only.')
  warnings.push('Passing Phase 39C does not approve controlled real-frame VLM until Phase 39D or planning integration until Phase 39E.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateVlmRuntimeStaticPlan(input: Partial<VlmRuntimeEnvValidationInput> = {}): VlmRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== vlmRuntimeConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== vlmRuntimeConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== vlmRuntimeConfig.env) blockers.push('Environment must be staging.')
  if (input.modelGcsPath && input.modelGcsPath !== vlmRuntimeConfig.modelGcsPath) blockers.push('Model path must be the verified Phase 39B private Qwen3-VL path.')
  if (input.modelIdRuntimePath === vlmRuntimeConfig.modelId) blockers.push('Runtime model path must be a local directory, not the model id.')
  warnings.push('Static plan/report mode does not copy model assets, run vLLM, mutate GCS, process media, or unlock beta/production.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
