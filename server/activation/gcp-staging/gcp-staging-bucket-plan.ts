import type {
  GcpStagingBucketPlan,
  GcpStagingBucketPurpose,
  GcpStagingConfig,
} from './gcp-staging-types'

export const gcpStagingBucketPurposes: GcpStagingBucketPurpose[] = [
  'source-media',
  'proxy-media',
  'analysis-artifacts',
  'transcripts',
  'masks',
  'generated-assets',
  'previews',
  'final-exports',
  'worker-temp',
  'qa-artifacts',
]

const lifecycleNotes: Record<GcpStagingBucketPurpose, string> = {
  'source-media': 'Private staging source media only; no arbitrary user media testing until later gates.',
  'proxy-media': 'Clean up generated proxies after staging test retention windows.',
  'analysis-artifacts': 'Retain analysis artifacts while staging QA records require them.',
  transcripts: 'May contain speech/PII; private and retention-limited.',
  masks: 'Retain only while referenced by approved staging test plans.',
  'generated-assets': 'Retain with provenance and license review metadata.',
  previews: 'Shorter preview retention; no public preview links by default.',
  'final-exports': 'Private final exports only; public delivery remains blocked.',
  'worker-temp': 'Aggressive lifecycle cleanup after short worker retry windows.',
  'qa-artifacts': 'Lifecycle cleanup after staging audit/review windows.',
}

export function buildGcpStagingBucketPlan(config: GcpStagingConfig): GcpStagingBucketPlan[] {
  return gcpStagingBucketPurposes.map((purpose) => ({
    purpose,
    bucketName: buildGcpStagingBucketName(config.projectId, purpose),
    location: config.bucketLocation,
    privateByDefault: true,
    uniformBucketLevelAccess: true,
    publicAccessPrevention: true,
    labels: {
      app: 'reeditpro',
      env: 'staging',
    },
    lifecycleNote: lifecycleNotes[purpose],
    signedUrlPersistenceAllowed: false,
    notes: [
      'Uniform bucket-level access intended.',
      'Public access prevention intended.',
      'Signed URLs are temporary only and must not be persisted as source of truth.',
    ],
  }))
}

export function buildGcpStagingBucketName(projectId: string, purpose: GcpStagingBucketPurpose): string {
  return `reeditpro-staging-${projectId}-${purpose}`
}
