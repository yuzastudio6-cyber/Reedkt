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
  | 'masks'
  | 'generated_assets'
  | 'previews'
  | 'final_exports'
  | 'worker_temp'
  | 'qa_artifacts'

export type GcpProductionServiceAccountKey =
  | 'api_service'
  | 'cpu_analysis_worker'
  | 'gpu_ai_worker'
  | 'render_worker'
  | 'qa_worker'
  | 'tool_readiness_worker'

export type GcpCloudRunRuntimeKind = 'service' | 'job'

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
  'run.googleapis.com',
  'artifactregistry.googleapis.com',
  'storage.googleapis.com',
  'secretmanager.googleapis.com',
  'iam.googleapis.com',
  'cloudbuild.googleapis.com',
  'logging.googleapis.com',
  'monitoring.googleapis.com',
  'eventarc.googleapis.com',
  'pubsub.googleapis.com',
] as const

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
    displayName: 'ReeditPro production API service',
    notes: ['Cloud Run Service identity for backend API orchestration and runtime secrets.'],
  },
  {
    key: 'cpu_analysis_worker',
    envVar: 'REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-cpu-worker-sa',
    displayName: 'ReeditPro production CPU analysis worker',
    notes: ['Reads source/proxy media and writes proxy, analysis, transcript, and temp artifacts.'],
  },
  {
    key: 'gpu_ai_worker',
    envVar: 'REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-gpu-worker-sa',
    displayName: 'ReeditPro production GPU AI worker',
    notes: ['Future GPU AI recipes only; no frontend access and no unapproved provider secrets.'],
  },
  {
    key: 'render_worker',
    envVar: 'REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-render-worker-sa',
    displayName: 'ReeditPro production render worker',
    notes: ['Reads approved assets and writes previews, final exports, and render QA artifacts.'],
  },
  {
    key: 'qa_worker',
    envVar: 'REEDITPRO_QA_WORKER_SERVICE_ACCOUNT',
    accountId: 'reeditpro-qa-worker-sa',
    displayName: 'ReeditPro production QA worker',
    notes: ['Reads analysis/previews/final exports and writes QA artifacts.'],
  },
  {
    key: 'tool_readiness_worker',
    envVar: 'REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT',
    accountId: 'reeditpro-tool-readiness-sa',
    displayName: 'ReeditPro production tool readiness worker',
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

export const GCP_PRODUCTION_CLOUD_RUN_JOBS: GcpCloudRunTemplate[] = [
  {
    name: 'reeditpro-cpu-analysis-worker',
    kind: 'job',
    serviceAccountKey: 'cpu_analysis_worker',
    imageName: 'reeditpro-cpu-worker',
    cpu: 2,
    memory: '4Gi',
    parallelism: 1,
    maxRetries: 1,
    deployedByMilestone3: false,
    includesRevideo: false,
    notes: ['No GPU. Command placeholder for future CPU analysis recipes.'],
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
    maxRetries: 1,
    deployedByMilestone3: false,
    includesRevideo: false,
    notes: ['First production GPU test target is nvidia-l4 with one GPU per instance.'],
  },
  {
    name: 'reeditpro-render-worker',
    kind: 'job',
    serviceAccountKey: 'render_worker',
    imageName: 'reeditpro-render-worker',
    cpu: 2,
    memory: '4Gi',
    parallelism: 1,
    maxRetries: 1,
    deployedByMilestone3: false,
    includesRevideo: false,
    notes: ['No GPU by default; core render stack is Hyperframe + Remotion + FFmpeg + libass + OpenTimelineIO.'],
  },
  {
    name: 'reeditpro-qa-worker',
    kind: 'job',
    serviceAccountKey: 'qa_worker',
    imageName: 'reeditpro-qa-worker',
    cpu: 2,
    memory: '4Gi',
    parallelism: 1,
    maxRetries: 1,
    deployedByMilestone3: false,
    includesRevideo: false,
    notes: ['No GPU by default unless a later heavy CV QA milestone approves it.'],
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
  status: 'future_premium_evaluation_only',
  approvedForMilestone3: false,
  notes: ['Future/premium/evaluation only until region, quota, cost, model-weight, and QA approval.'],
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
