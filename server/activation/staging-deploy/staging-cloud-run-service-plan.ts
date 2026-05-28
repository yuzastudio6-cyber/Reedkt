import type { StagingCloudRunServicePlan, StagingDeployConfig, StagingDeployImageRef } from './staging-deploy-types'

export function buildStagingApiServicePlan(config: StagingDeployConfig, imageRef: StagingDeployImageRef): StagingCloudRunServicePlan {
  return {
    serviceName: 'reeditpro-staging-api',
    imageRef: imageRef.fullImageRef,
    region: config.region,
    serviceAccountEmail: `reeditpro-stg-api-sa@${config.projectId}.iam.gserviceaccount.com`,
    allowUnauthenticated: false,
    minInstances: 0,
    cpu: '1',
    memory: '1Gi',
    concurrency: 40,
    envVars: {
      REEDITPRO_ENV: 'staging',
      API_PORT: '8080',
      E2E_RUNTIME_MODE: 'mock',
      WORKER_RUNTIME_MODE: 'mock',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      STORAGE_MODE: 'local',
    },
    secretsMounted: false,
    notes: [
      'Private staging API service; no unauthenticated access by default.',
      'Mock-safe runtime because Secret Manager placeholders have zero versions.',
    ],
  }
}
