import type {
  GcpStagingConfig,
  GcpStagingConfigInput,
  GcpStagingConfigSummary,
  GcpStagingPolicyCheck,
  GcpStagingServiceAccountKey,
} from './gcp-staging-types'

export const gcpStagingDefaultServiceAccounts: Record<GcpStagingServiceAccountKey, string> = {
  api: 'reeditpro-staging-api-sa',
  'cpu-worker': 'reeditpro-staging-cpu-worker-sa',
  'gpu-worker': 'reeditpro-staging-gpu-worker-sa',
  'render-worker': 'reeditpro-staging-render-worker-sa',
  'qa-worker': 'reeditpro-staging-qa-worker-sa',
  'tool-readiness-worker': 'reeditpro-staging-tool-readiness-sa',
}

export const gcpStagingDefaultConfig = {
  region: 'us-central1',
  artifactRegion: 'us-central1',
  bucketLocation: 'us-central1',
  environment: 'staging',
  confirmSetup: false,
  artifactRepository: 'reeditpro-staging-workers',
  imageTag: 'manual-not-set',
} as const

export const invalidDeployImageTags = new Set(['', 'manual-not-set', 'latest', 'prod', 'production'])

export function parseGcpStagingConfig(input: GcpStagingConfigInput = {}): GcpStagingConfig {
  return {
    projectId: normalizeRequired(input.projectId, 'GCP_PROJECT_ID'),
    region: normalizeLocation(input.region ?? gcpStagingDefaultConfig.region),
    artifactRegion: normalizeLocation(input.artifactRegion ?? gcpStagingDefaultConfig.artifactRegion),
    bucketLocation: normalizeLocation(input.bucketLocation ?? gcpStagingDefaultConfig.bucketLocation),
    environment: 'staging',
    confirmSetup: parseBoolean(input.confirmSetup ?? gcpStagingDefaultConfig.confirmSetup),
    artifactRepository: normalizeRequired(input.artifactRepository ?? gcpStagingDefaultConfig.artifactRepository, 'REEDITPRO_ARTIFACT_REPOSITORY'),
    imageTag: normalizeRequired(input.imageTag ?? gcpStagingDefaultConfig.imageTag, 'REEDITPRO_IMAGE_TAG'),
    serviceAccounts: {
      ...gcpStagingDefaultServiceAccounts,
      ...definedServiceAccounts(input.serviceAccounts),
    },
  }
}

export function readGcpStagingConfigFromEnv(env: NodeJS.ProcessEnv = process.env): GcpStagingConfigInput {
  return {
    projectId: env.GCP_PROJECT_ID,
    region: env.GCP_REGION,
    artifactRegion: env.GCP_ARTIFACT_REGION,
    bucketLocation: env.GCP_BUCKET_LOCATION,
    environment: env.REEDITPRO_ENV,
    confirmSetup: env.REEDITPRO_CONFIRM_STAGING_GCP_SETUP,
    artifactRepository: env.REEDITPRO_ARTIFACT_REPOSITORY,
    imageTag: env.REEDITPRO_IMAGE_TAG,
    serviceAccounts: {
      api: env.REEDITPRO_API_SERVICE_ACCOUNT,
      'cpu-worker': env.REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT,
      'gpu-worker': env.REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT,
      'render-worker': env.REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT,
      'qa-worker': env.REEDITPRO_QA_WORKER_SERVICE_ACCOUNT,
      'tool-readiness-worker': env.REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT,
    },
  }
}

export function validateGcpStagingConfig(
  input: GcpStagingConfigInput,
  options: { requireDeployReadyImageTag?: boolean; checkedInExample?: boolean } = {},
): GcpStagingPolicyCheck {
  const blockers: string[] = []
  const warnings: string[] = []
  const env = input.environment ?? gcpStagingDefaultConfig.environment
  const projectId = input.projectId?.trim() ?? ''
  const imageTag = input.imageTag?.trim() ?? gcpStagingDefaultConfig.imageTag

  if (env !== 'staging') blockers.push('REEDITPRO_ENV must be staging for Phase 22.')
  if (env === 'production') blockers.push('Production environment is rejected by staging setup.')
  if (!projectId) blockers.push('GCP_PROJECT_ID is required.')
  if (/^(production|prod)$/i.test(projectId)) blockers.push('Dangerous project id is rejected for staging.')
  if (/production/i.test(projectId)) blockers.push('Staging project id must not look like production.')
  if (!(input.region ?? gcpStagingDefaultConfig.region).trim()) blockers.push('GCP_REGION is required.')
  if (!(input.artifactRegion ?? gcpStagingDefaultConfig.artifactRegion).trim()) blockers.push('GCP_ARTIFACT_REGION is required.')
  if (!(input.bucketLocation ?? gcpStagingDefaultConfig.bucketLocation).trim()) blockers.push('GCP_BUCKET_LOCATION is required.')
  if (!(input.artifactRepository ?? gcpStagingDefaultConfig.artifactRepository).trim()) blockers.push('REEDITPRO_ARTIFACT_REPOSITORY is required.')
  if (!/staging/.test(input.artifactRepository ?? gcpStagingDefaultConfig.artifactRepository)) {
    blockers.push('Artifact Registry repository must include staging.')
  }
  if (parseBoolean(input.confirmSetup ?? false) && options.checkedInExample) {
    blockers.push('Checked-in staging env example must not enable REEDITPRO_CONFIRM_STAGING_GCP_SETUP.')
  }
  if (options.requireDeployReadyImageTag && invalidDeployImageTags.has(imageTag)) {
    blockers.push(`Image tag "${imageTag || '(empty)'}" is not allowed for push/deploy phases.`)
  }
  if (!options.requireDeployReadyImageTag && imageTag === 'manual-not-set') {
    warnings.push('Image tag is manual-not-set; this is allowed for Phase 22 planning only.')
  }
  if (imageTag && !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(imageTag)) {
    blockers.push('REEDITPRO_IMAGE_TAG must be Docker-tag safe.')
  }

  for (const [key, accountId] of Object.entries({
    ...gcpStagingDefaultServiceAccounts,
    ...definedServiceAccounts(input.serviceAccounts),
  })) {
    if (!accountId) blockers.push(`${key} service account is required.`)
    if (accountId && !accountId.includes('staging')) blockers.push(`${key} service account must include staging.`)
  }

  return { allowed: blockers.length === 0, blockers, warnings }
}

function definedServiceAccounts(
  input: GcpStagingConfigInput['serviceAccounts'],
): Partial<Record<GcpStagingServiceAccountKey, string>> {
  return Object.fromEntries(
    Object.entries(input ?? {}).filter((entry): entry is [GcpStagingServiceAccountKey, string] => Boolean(entry[1])),
  ) as Partial<Record<GcpStagingServiceAccountKey, string>>
}

export function summarizeGcpStagingConfig(config: GcpStagingConfig): GcpStagingConfigSummary {
  return {
    projectId: config.projectId,
    region: config.region,
    artifactRegion: config.artifactRegion,
    bucketLocation: config.bucketLocation,
    environment: config.environment,
    confirmSetup: config.confirmSetup,
    artifactRepository: config.artifactRepository,
    imageTag: config.imageTag,
    serviceAccountCount: Object.keys(config.serviceAccounts).length,
  }
}

function normalizeRequired(value: string | undefined, name: string): string {
  const normalized = value?.trim() ?? ''
  if (!normalized) return ''
  if (/\s/.test(normalized)) throw new Error(`${name} must not contain whitespace.`)
  return normalized
}

function normalizeLocation(value: string): string {
  return value.trim().toLowerCase()
}

function parseBoolean(value: string | boolean): boolean {
  return value === true || value === 'true'
}
