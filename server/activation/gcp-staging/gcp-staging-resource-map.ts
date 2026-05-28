import type {
  GcpStagingArtifactRegistryPlan,
  GcpStagingCloudRunNamePlan,
  GcpStagingConfig,
  GcpStagingResourceMap,
  GcpStagingSecretPlan,
  GcpStagingServiceAccountKey,
  GcpStagingServiceAccountPlan,
} from './gcp-staging-types'
import { buildGcpStagingBucketPlan } from './gcp-staging-bucket-plan'
import { buildGcpStagingSecretPlan } from './gcp-staging-secret-plan'

export const gcpStagingRequiredApis = [
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

export function buildGcpStagingResourceMap(config: GcpStagingConfig): GcpStagingResourceMap {
  return {
    artifactRegistry: buildArtifactRegistryPlan(config),
    buckets: buildGcpStagingBucketPlan(config),
    serviceAccounts: buildGcpStagingServiceAccountPlan(config),
    secretPlaceholders: buildGcpStagingSecretPlan(),
    cloudRunNames: buildGcpStagingCloudRunNamePlan(),
  }
}

export function buildArtifactRegistryPlan(config: GcpStagingConfig): GcpStagingArtifactRegistryPlan {
  return {
    repository: config.artifactRepository,
    format: 'Docker',
    location: config.artifactRegion,
    description: 'Staging container images for ReeditPro activation.',
  }
}

export function buildGcpStagingServiceAccountPlan(config: GcpStagingConfig): GcpStagingServiceAccountPlan[] {
  return serviceAccountOrder.map((key) => ({
    key,
    accountId: config.serviceAccounts[key],
    emailTemplate: `${config.serviceAccounts[key]}@${config.projectId}.iam.gserviceaccount.com`,
    displayName: serviceAccountDisplayName[key],
    notes: serviceAccountNotes[key],
  }))
}

export function buildGcpStagingCloudRunNamePlan(): GcpStagingCloudRunNamePlan[] {
  return [
    cloudRunName('reeditpro-staging-api', 'service', 'api', ['Staging API service name only; not deployed in Phase 22.']),
    cloudRunName('reeditpro-staging-cpu-analysis-job', 'job', 'cpu-worker', ['Non-GPU staging job name only; deployment is Phase 24.']),
    cloudRunName('reeditpro-staging-gpu-ai-job', 'job', 'gpu-worker', ['GPU staging job name only; L4 deployment is Phase 27.']),
    cloudRunName('reeditpro-staging-render-job', 'job', 'render-worker', ['Render job name only; deployment is Phase 24.']),
    cloudRunName('reeditpro-staging-qa-job', 'job', 'qa-worker', ['QA job name only; deployment is Phase 24.']),
    cloudRunName('reeditpro-staging-tool-readiness-job', 'job', 'tool-readiness-worker', ['Readiness job name only; no source media access by default.']),
  ]
}

export function buildArtifactImageName(config: GcpStagingConfig, imageName: string): string {
  return `${config.artifactRegion}-docker.pkg.dev/${config.projectId}/${config.artifactRepository}/${imageName}:${config.imageTag}`
}

const serviceAccountOrder: GcpStagingServiceAccountKey[] = [
  'api',
  'cpu-worker',
  'gpu-worker',
  'render-worker',
  'qa-worker',
  'tool-readiness-worker',
]

const serviceAccountDisplayName: Record<GcpStagingServiceAccountKey, string> = {
  api: 'ReeditPro staging API service',
  'cpu-worker': 'ReeditPro staging CPU worker',
  'gpu-worker': 'ReeditPro staging GPU worker',
  'render-worker': 'ReeditPro staging render worker',
  'qa-worker': 'ReeditPro staging QA worker',
  'tool-readiness-worker': 'ReeditPro staging tool-readiness worker',
}

const serviceAccountNotes: Record<GcpStagingServiceAccountKey, string[]> = {
  api: ['Runtime API identity; no owner/editor and runtime secrets only.'],
  'cpu-worker': ['Reads source/proxy media and writes proxy, analysis, transcripts, and temp artifacts.'],
  'gpu-worker': ['GPU/model secrets and model paths remain blocked until later approval.'],
  'render-worker': ['Reads approved assets and writes private previews/final exports/QA artifacts.'],
  'qa-worker': ['Reads analysis/previews/final exports and writes QA artifacts.'],
  'tool-readiness-worker': ['Minimal readiness/logging access and no source media by default.'],
}

function cloudRunName(
  name: string,
  kind: GcpStagingCloudRunNamePlan['kind'],
  serviceAccountKey: GcpStagingServiceAccountKey,
  notes: string[],
): GcpStagingCloudRunNamePlan {
  return { name, kind, serviceAccountKey, deployedInPhase22: false, notes }
}

export function listGcpStagingSecretNames(secretPlan: GcpStagingSecretPlan[]): string[] {
  return secretPlan.map((secret) => secret.name)
}
