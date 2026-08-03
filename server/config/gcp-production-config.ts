export type GcpProductionEnvironment = 'production'

export interface GcpProductionConfigInput {
  projectId: string
  region?: string
  artifactRegion?: string
  bucketLocation?: string
  environment?: GcpProductionEnvironment
  artifactRepository?: string
  imageTag?: string
}

export type GcpProductionBucketPurpose =
  | 'source_media'
  | 'proxy_media'
  | 'analysis_artifacts'
  | 'transcripts'
  | 'model_artifacts'
  | 'image_build_inputs'
  | 'control_plane_state'
  | 'masks'
  | 'generated_assets'
  | 'previews'
  | 'final_exports'
  | 'worker_temp'
  | 'qa_artifacts'

export type GcpProductionServiceAccountKey =
  | 'api_service'
  | 'image_builder'
  | 'image_signer'
  | 'cpu_analysis_worker'
  | 'gpu_ai_worker'
  | 'render_worker'
  | 'qa_worker'
  | 'tool_readiness_worker'

export type GcpCloudRunRuntimeKind = 'service' | 'job'

export type GcpQualityFirstGpuRouteId =
  | 'a100_80gb_heavy_primary'
  | 'l4_heavy_fallback'
  | 'l4_standard_primary'

export interface GcpQualityFirstGpuRuntimeTemplate {
  routeId: GcpQualityFirstGpuRouteId
  name: string
  runtimeKind: 'google_cloud_batch_job' | 'google_cloud_run_job'
  routeRole: 'heavy_primary' | 'heavy_fallback' | 'standard_primary'
  serviceAccountKey: Extract<GcpProductionServiceAccountKey, 'gpu_ai_worker'>
  imageName: string
  region: 'us-central1'
  allowedZones: readonly ['us-central1-a', 'us-central1-c'] | readonly []
  machineType: 'a2-ultragpu-1g' | 'cloud_run_nvidia_l4'
  accelerator: 'nvidia_a100_80gb' | 'nvidia_l4'
  gpuCount: 1
  gpuMemoryGiB: 80 | 24
  cpu: 12 | 8
  memoryGiB: 170 | 32
  localScratchGiB: 375 | 0
  minimumIdleInstances: 0
  maximumConcurrentAttemptsPerInstance: 1
  maximumTaskRetries: 0
  startsOnlyFromConsumedApprovedUserAttempt: true
  stopsAtTerminalAttempt: true
  runtimeNetworkDownloadAllowed: false
  cpuOnlySubstantiveExecutionAllowed: false
  qualityReducingFallbackAllowed: false
  independentlyQualifiedReleaseRequired: true
  productionQualified: false
  notes: readonly string[]
}

export interface GcpProductionBucketTemplate {
  purpose: GcpProductionBucketPurpose
  suffix: string
  description: string
  lifecycleNote: string
}

export interface GcpProductionServiceAccountTemplate {
  key: GcpProductionServiceAccountKey
  envVar: string
  accountId: string
  displayName: string
  notes: string[]
}

export interface GcpProductionSecretPlaceholder {
  name: string
  requiredNow: boolean
  notes: string[]
}

export interface GcpCloudRunTemplate {
  name: string
  kind: GcpCloudRunRuntimeKind
  serviceAccountKey: GcpProductionServiceAccountKey
  imageName: string
  minInstances?: number
  cpu: number
  memory: string
  gpuType?: string
  gpuCount?: number
  noGpuZonalRedundancy?: boolean
  parallelism?: number
  maxRetries?: number
  deployedByMilestone3: false
  includesRevideo: false
  notes: string[]
}

export const GCP_PRODUCTION_DEFAULTS = {
  region: 'us-central1',
  artifactRegion: 'us-central1',
  bucketLocation: 'us-central1',
  environment: 'production',
  artifactRepository: 'reeditpro-workers',
  imageTag: 'manual-not-set',
} as const

export const GCP_PRODUCTION_REQUIRED_APIS = [
  'serviceusage.googleapis.com',
  'run.googleapis.com',
  'batch.googleapis.com',
  'compute.googleapis.com',
  'aiplatform.googleapis.com',
  'cloudbilling.googleapis.com',
  'artifactregistry.googleapis.com',
  'storage.googleapis.com',
  'secretmanager.googleapis.com',
  'iam.googleapis.com',
  'cloudbuild.googleapis.com',
  'cloudkms.googleapis.com',
  'containeranalysis.googleapis.com',
  'binaryauthorization.googleapis.com',
  'logging.googleapis.com',
  'monitoring.googleapis.com',
  'eventarc.googleapis.com',
  'pubsub.googleapis.com',
  'cloudtasks.googleapis.com',
  'iamcredentials.googleapis.com',
] as const

/**
 * The only active GPU placement topology for newly approved work.
 *
 * Resource names intentionally retain the legacy `reeditpro` project prefix
 * because they are compatibility coordinates in the existing Google Cloud
 * project. User-facing identity remains WeEditPro.
 */
export const GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES:
readonly GcpQualityFirstGpuRuntimeTemplate[] = Object.freeze([
  {
    routeId: 'a100_80gb_heavy_primary',
    name: 'reeditpro-sam31-a100-primary',
    runtimeKind: 'google_cloud_batch_job',
    routeRole: 'heavy_primary',
    serviceAccountKey: 'gpu_ai_worker',
    imageName: 'reeditpro-sam31-gpu',
    region: 'us-central1',
    allowedZones: ['us-central1-a', 'us-central1-c'],
    machineType: 'a2-ultragpu-1g',
    accelerator: 'nvidia_a100_80gb',
    gpuCount: 1,
    gpuMemoryGiB: 80,
    cpu: 12,
    memoryGiB: 170,
    localScratchGiB: 375,
    minimumIdleInstances: 0,
    maximumConcurrentAttemptsPerInstance: 1,
    maximumTaskRetries: 0,
    startsOnlyFromConsumedApprovedUserAttempt: true,
    stopsAtTerminalAttempt: true,
    runtimeNetworkDownloadAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    qualityReducingFallbackAllowed: false,
    independentlyQualifiedReleaseRequired: true,
    productionQualified: false,
    notes: [
      'Primary route for SAM 3.1 and every other approved heavy model or heavy processing profile.',
      'Each approved attempt creates one bounded Batch job; no idle A100 pool or prewarming is allowed.',
    ],
  },
  {
    routeId: 'l4_heavy_fallback',
    name: 'reeditpro-sam31-l4-fallback',
    runtimeKind: 'google_cloud_run_job',
    routeRole: 'heavy_fallback',
    serviceAccountKey: 'gpu_ai_worker',
    imageName: 'reeditpro-sam31-gpu',
    region: 'us-central1',
    allowedZones: [],
    machineType: 'cloud_run_nvidia_l4',
    accelerator: 'nvidia_l4',
    gpuCount: 1,
    gpuMemoryGiB: 24,
    cpu: 8,
    memoryGiB: 32,
    localScratchGiB: 0,
    minimumIdleInstances: 0,
    maximumConcurrentAttemptsPerInstance: 1,
    maximumTaskRetries: 0,
    startsOnlyFromConsumedApprovedUserAttempt: true,
    stopsAtTerminalAttempt: true,
    runtimeNetworkDownloadAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    qualityReducingFallbackAllowed: false,
    independentlyQualifiedReleaseRequired: true,
    productionQualified: false,
    notes: [
      'Heavy fallback only after a server-owned terminal pre-inference A100 failure classification.',
      'Cost preference, quantization, resolution reduction, skipped QA, or an unknown A100 outcome cannot select this route.',
    ],
  },
  {
    routeId: 'l4_standard_primary',
    name: 'reeditpro-professional-l4',
    runtimeKind: 'google_cloud_run_job',
    routeRole: 'standard_primary',
    serviceAccountKey: 'gpu_ai_worker',
    imageName: 'reeditpro-l4-media-worker',
    region: 'us-central1',
    allowedZones: [],
    machineType: 'cloud_run_nvidia_l4',
    accelerator: 'nvidia_l4',
    gpuCount: 1,
    gpuMemoryGiB: 24,
    cpu: 8,
    memoryGiB: 32,
    localScratchGiB: 0,
    minimumIdleInstances: 0,
    maximumConcurrentAttemptsPerInstance: 1,
    maximumTaskRetries: 0,
    startsOnlyFromConsumedApprovedUserAttempt: true,
    stopsAtTerminalAttempt: true,
    runtimeNetworkDownloadAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    qualityReducingFallbackAllowed: false,
    independentlyQualifiedReleaseRequired: true,
    productionQualified: false,
    notes: [
      'Primary route for approved normal GPU media processing, rendering, encoding, deterministic inspection, and QA.',
      'Substantive media work must prove an admitted CUDA, NVDEC, NVENC, or GPU-kernel path; host CPU is control-plane and bounded serialization only.',
    ],
  },
])

export const GCP_PRODUCTION_LEGACY_CLOUD_RUN_JOB_TEMPLATES = Object.freeze({
  historicalReadbackOnly: true,
  mayAuthorizeNewWork: false,
  replacementTopology:
    'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v2',
})

export const GCP_PRODUCTION_BUCKETS: GcpProductionBucketTemplate[] = [
  {
    purpose: 'source_media',
    suffix: 'source-media',
    description: 'Private user-uploaded source clips, references, and source audio.',
    lifecycleNote: 'Retain according to workspace/project media retention policy; never public.',
  },
  {
    purpose: 'proxy_media',
    suffix: 'proxy-media',
    description: 'Worker-created proxies, mezzanine files, and analysis-friendly derivatives.',
    lifecycleNote: 'Eligible for lifecycle cleanup after final export and retention window.',
  },
  {
    purpose: 'analysis_artifacts',
    suffix: 'analysis-artifacts',
    description: 'Media probe, scene, visual, color, and structured analysis outputs.',
    lifecycleNote: 'Retain while project editing history and QA audit records require it.',
  },
  {
    purpose: 'transcripts',
    suffix: 'transcripts',
    description: 'Transcript, word timing, caption draft, and alignment artifacts.',
    lifecycleNote: 'Retain with project privacy policy; may contain user speech or PII.',
  },
  {
    purpose: 'model_artifacts',
    suffix: 'model-artifacts',
    description: 'Private reviewed model checkpoints and immutable model manifests for qualified GPU runtimes.',
    lifecycleNote: 'Never public and never readable by the image builder; retain only under model-license and runtime-release policy.',
  },
  {
    purpose: 'image_build_inputs',
    suffix: 'image-build-inputs',
    description: 'Checkpoint-free, create-only private Cloud Build capsules for immutable worker images.',
    lifecycleNote: 'Generation-bound build inputs only; capsules must exclude model bytes, access tokens, and customer media.',
  },
  {
    purpose: 'control_plane_state',
    suffix: 'control-plane-state',
    description: 'Create-only backend authorities, lifecycle observations, pricing evidence, and release records.',
    lifecycleNote: 'Private immutable control-plane evidence only; never model bytes, customer media, provider payloads, or public objects.',
  },
  {
    purpose: 'masks',
    suffix: 'masks',
    description: 'Segmentation masks, alpha mattes, cutouts, and mask QA artifacts.',
    lifecycleNote: 'Retain only while masks are referenced by approved timelines or QA records.',
  },
  {
    purpose: 'generated_assets',
    suffix: 'generated-assets',
    description: 'Generated images/video assets, cards, overlays, and approved tool outputs.',
    lifecycleNote: 'Retain with provenance and license review metadata.',
  },
  {
    purpose: 'previews',
    suffix: 'previews',
    description: 'Preview renders and review outputs.',
    lifecycleNote: 'Preview lifecycle can be shorter than final exports, but never persistent signed URLs.',
  },
  {
    purpose: 'final_exports',
    suffix: 'final-exports',
    description: 'Final exports, delivery variants, thumbnails, and release packages.',
    lifecycleNote: 'Retain according to customer/project export retention policy.',
  },
  {
    purpose: 'worker_temp',
    suffix: 'worker-temp',
    description: 'Worker scratch, partial outputs, retry files, and temporary intermediates.',
    lifecycleNote: 'Use aggressive lifecycle cleanup after short worker retry windows.',
  },
  {
    purpose: 'qa_artifacts',
    suffix: 'qa-artifacts',
    description: 'QA reports, frame grabs, waveforms, diffs, logs, plots, and review manifests.',
    lifecycleNote: 'Use lifecycle cleanup after audit/review retention windows.',
  },
]

export const GCP_PRODUCTION_SERVICE_ACCOUNTS: GcpProductionServiceAccountTemplate[] = [
  {
    key: 'api_service',
    envVar: 'REEDITPRO_API_SERVICE_ACCOUNT',
    accountId: 'reeditpro-api-sa',
    displayName: 'WeEditPro production API service',
    notes: ['Cloud Run Service identity for backend API orchestration and runtime secrets.'],
  },
  {
    key: 'image_builder',
    envVar: 'REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-image-builder-sa',
    displayName: 'WeEditPro private immutable image builder',
    notes: [
      'User-specified Cloud Build identity with read-only access to checkpoint-free build capsules and write-only Artifact Registry scope.',
      'It has no model-artifact, customer-media, provider-secret, runtime-dispatch, billing, or production-release authority.',
    ],
  },
  {
    key: 'image_signer',
    envVar: 'REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-image-signer-sa',
    displayName: 'WeEditPro immutable image signer',
    notes: [
      'Reads only immutable Artifact Registry image digests and signs through the versioned SAM 3.1 Cloud KMS key.',
      'It has no image-build-input, model-artifact, customer-media, provider-secret, runtime-dispatch, billing, or production-release authority.',
    ],
  },
  {
    key: 'cpu_analysis_worker',
    envVar: 'REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-cpu-worker-sa',
    displayName: 'WeEditPro legacy analysis service identity',
    notes: [
      'Compatibility identity only. It cannot authorize fresh substantive media processing or model inference.',
      'New analysis media work is placed on the qualified L4 standard route; heavy work uses A100 primary.',
    ],
  },
  {
    key: 'gpu_ai_worker',
    envVar: 'REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-gpu-worker-sa',
    displayName: 'WeEditPro production GPU AI worker',
    notes: ['Future GPU AI recipes only; no frontend access and no unapproved provider secrets.'],
  },
  {
    key: 'render_worker',
    envVar: 'REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-render-worker-sa',
    displayName: 'WeEditPro production render worker',
    notes: ['Reads approved assets and writes previews, final exports, and render QA artifacts.'],
  },
  {
    key: 'qa_worker',
    envVar: 'REEDITPRO_QA_WORKER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-qa-worker-sa',
    displayName: 'WeEditPro production QA worker',
    notes: ['Reads analysis/previews/final exports and writes QA artifacts.'],
  },
  {
    key: 'tool_readiness_worker',
    envVar: 'REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT',
    accountId: 'reeditpro-tool-readiness-sa',
    displayName: 'WeEditPro production tool readiness worker',
    notes: ['Minimal storage/logging access; no source media access by default.'],
  },
]

export const GCP_PRODUCTION_SECRET_PLACEHOLDERS: GcpProductionSecretPlaceholder[] = [
  { name: 'SUPABASE_URL', requiredNow: true, notes: ['Backend runtime Supabase URL placeholder only.'] },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', requiredNow: true, notes: ['Service-role placeholder only; never expose to frontend.'] },
  { name: 'OPENAI_API_KEY', requiredNow: true, notes: ['Provider key placeholder only; no provider calls in Milestone 3.'] },
  { name: 'PROVIDER_GATEWAY_SHARED_SECRET', requiredNow: true, notes: ['Internal gateway auth placeholder only.'] },
  { name: 'WORKER_WEBHOOK_SECRET', requiredNow: true, notes: ['Worker webhook signing placeholder only.'] },
  { name: 'STRIPE_SECRET_KEY', requiredNow: false, notes: ['Optional billing placeholder if existing app uses Stripe.'] },
  { name: 'SFX_PROVIDER_API_KEY', requiredNow: false, notes: ['Optional future SFX provider placeholder only.'] },
  { name: 'MUSIC_PROVIDER_API_KEY', requiredNow: false, notes: ['Optional future music provider placeholder only.'] },
  { name: 'MODEL_WEIGHT_ACCESS_TOKEN', requiredNow: false, notes: ['Optional future model-weight download token placeholder only.'] },
  { name: 'HUGGINGFACE_TOKEN', requiredNow: false, notes: ['Optional future model download token placeholder only.'] },
]

export const GCP_PRODUCTION_API_SERVICE: GcpCloudRunTemplate = {
  name: 'reeditpro-api',
  kind: 'service',
  serviceAccountKey: 'api_service',
  imageName: 'reeditpro-api',
  minInstances: 0,
  cpu: 1,
  memory: '1Gi',
  deployedByMilestone3: false,
  includesRevideo: false,
  notes: ['Cloud Run Service template only; no GPU and no deployment in Milestone 3.'],
}

/**
 * Historical Milestone-3 templates retained for immutable source/readback
 * compatibility. They are not the active placement authority for a fresh
 * plan. Use GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES instead.
 */
export const GCP_PRODUCTION_CLOUD_RUN_JOBS: GcpCloudRunTemplate[] = [
  {
    name: 'reeditpro-cpu-analysis-worker',
    kind: 'job',
    serviceAccountKey: 'cpu_analysis_worker',
    imageName: 'reeditpro-cpu-worker',
    cpu: 2,
    memory: '4Gi',
    parallelism: 1,
    maxRetries: 0,
    deployedByMilestone3: false,
    includesRevideo: false,
    notes: [
      'Historical template only; it may not execute fresh substantive media or model work.',
      'Cloud Run task retries stay zero because the canonical package queue owns approved attempts.',
    ],
  },
  {
    name: 'reeditpro-gpu-ai-worker',
    kind: 'job',
    serviceAccountKey: 'gpu_ai_worker',
    imageName: 'reeditpro-gpu-worker',
    cpu: 4,
    memory: '16Gi',
    gpuType: 'nvidia-l4',
    gpuCount: 1,
    noGpuZonalRedundancy: true,
    parallelism: 1,
    maxRetries: 0,
    deployedByMilestone3: false,
    includesRevideo: false,
    notes: [
      'Historical generic L4 template only; it is not the active heavy-primary placement authority.',
      'Cloud Run task retries stay zero because the canonical package queue owns approved attempts.',
    ],
  },
  {
    name: 'reeditpro-render-worker',
    kind: 'job',
    serviceAccountKey: 'render_worker',
    imageName: 'reeditpro-render-worker',
    cpu: 2,
    memory: '4Gi',
    parallelism: 1,
    maxRetries: 0,
    deployedByMilestone3: false,
    includesRevideo: false,
    notes: [
      'Historical CPU render template only; fresh substantive rendering is assigned to the qualified L4 standard route.',
      'Cloud Run task retries stay zero because the canonical package queue owns approved attempts.',
    ],
  },
  {
    name: 'reeditpro-qa-worker',
    kind: 'job',
    serviceAccountKey: 'qa_worker',
    imageName: 'reeditpro-qa-worker',
    cpu: 2,
    memory: '4Gi',
    parallelism: 1,
    maxRetries: 0,
    deployedByMilestone3: false,
    includesRevideo: false,
    notes: [
      'Historical CPU QA template only; fresh substantive visual/media QA is assigned to the qualified L4 standard route.',
      'Cloud Run task retries stay zero because the canonical package queue owns approved attempts.',
    ],
  },
  {
    name: 'reeditpro-tool-readiness-worker',
    kind: 'job',
    serviceAccountKey: 'tool_readiness_worker',
    imageName: 'reeditpro-tool-readiness-worker',
    cpu: 1,
    memory: '2Gi',
    parallelism: 1,
    maxRetries: 0,
    deployedByMilestone3: false,
    includesRevideo: false,
    notes: ['No GPU and no source media access by default.'],
  },
]

export const GCP_PRODUCTION_PREMIUM_GPU_OPTION = {
  gpuType: 'nvidia-rtx-pro-6000',
  minimumCpu: 20,
  minimumMemory: '80Gi',
  status: 'retired_not_in_current_quality_first_policy',
  approvedForMilestone3: false,
  mayAuthorizeNewWork: false,
  notes: [
    'Historical evaluation record only. Current WeEditPro placement uses A100 80 GB and L4 exclusively.',
  ],
} as const

export const GCP_PRODUCTION_RENDER_STACK = [
  'hyperframe_preview',
  'remotion',
  'ffmpeg',
  'libass',
  'opentimelineio',
] as const

export const GCP_PRODUCTION_NON_DEPLOYED_TOOLS = ['revideo'] as const

export function getGcpProductionBucketName(
  purpose: GcpProductionBucketPurpose,
  input: GcpProductionConfigInput,
): string {
  const bucket = GCP_PRODUCTION_BUCKETS.find((item) => item.purpose === purpose)
  if (!bucket) {
    throw new Error(`Unknown GCP production bucket purpose: ${purpose}`)
  }

  const environment = input.environment ?? GCP_PRODUCTION_DEFAULTS.environment
  return `reeditpro-${environment}-${input.projectId}-${bucket.suffix}`
}

export function getGcpProductionServiceAccountEmail(
  key: GcpProductionServiceAccountKey,
  projectId: string,
): string {
  const serviceAccount = GCP_PRODUCTION_SERVICE_ACCOUNTS.find((item) => item.key === key)
  if (!serviceAccount) {
    throw new Error(`Unknown GCP production service account key: ${key}`)
  }

  return `${serviceAccount.accountId}@${projectId}.iam.gserviceaccount.com`
}

export function getGcpProductionArtifactRegistryImage(
  imageName: string,
  input: GcpProductionConfigInput,
): string {
  const artifactRegion = input.artifactRegion ?? GCP_PRODUCTION_DEFAULTS.artifactRegion
  const repository = input.artifactRepository ?? GCP_PRODUCTION_DEFAULTS.artifactRepository
  const imageTag = input.imageTag ?? GCP_PRODUCTION_DEFAULTS.imageTag
  return `${artifactRegion}-docker.pkg.dev/${input.projectId}/${repository}/${imageName}:${imageTag}`
}
