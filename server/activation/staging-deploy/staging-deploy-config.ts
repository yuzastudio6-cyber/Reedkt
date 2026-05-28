import type { StagingDeployConfig, StagingDeployImageRef } from './staging-deploy-types'

export const STAGING_DEPLOY_IMAGE_DIGESTS_BY_TAG = {
  'staging-local-001': {
    api: 'sha256:4dd122f3461b70a1d2ec4435eb13864b69bc6b541ceaa6497ebac68eb027c41f',
    'tool-readiness-job': 'sha256:bc993a509c8b50b8689b837690696584026fd811b0a684199643c2737f34807a',
    'cpu-analysis-job': 'sha256:9f7449c13adae80e0bc57d352f0d8665691d132c472c92e26ec877663ec30a43',
    'qa-job': 'sha256:6d3a81928873ebfaa147098cf5d7aa3d7cae203eb7f3fb8252a5df3980018125',
    'render-job': 'sha256:5e7e5e2898c7ac7a31d3910ca21462e81013b92b4da0eccd9bf9414f873d910d',
  },
  'staging-amd64-001': {
    api: 'sha256:ddb5c6d31fe738ab56291806527e1a5638d1fbfd2b08e05fafb492dc78cb05ac',
    'tool-readiness-job': 'sha256:775d0c9fffe03a3f2836e246824a5feb0b753fe3e1672f68685144fc5fc79656',
    'cpu-analysis-job': 'sha256:48362d165a07e8ab14f1debf764001e659963db6d26694fd4194446cd0ccc109',
    'qa-job': 'sha256:ee5360f68f16263fd1a8e791c577f696b688f2ed986a38029fe11803674f9c8a',
    'render-job': 'sha256:46f2d8f76b14a2fdc000c1260c9026169a28351763e9d28914046c027b9b0922',
  },
} as const

export const STAGING_DEPLOY_IMAGE_DIGESTS = STAGING_DEPLOY_IMAGE_DIGESTS_BY_TAG['staging-local-001']

const stagingImageNames = {
  api: 'reeditpro-staging-api',
  'tool-readiness-job': 'reeditpro-staging-tool-readiness-worker',
  'cpu-analysis-job': 'reeditpro-staging-cpu-worker',
  'qa-job': 'reeditpro-staging-qa-worker',
  'render-job': 'reeditpro-staging-render-worker',
} as const

export function parseStagingDeployConfig(input: {
  projectId?: string
  region?: string
  imageTag?: string
  confirmDeploy?: boolean
  env?: NodeJS.ProcessEnv
} = {}): StagingDeployConfig {
  const env = input.env ?? process.env
  return {
    projectId: input.projectId ?? env.GCP_PROJECT_ID ?? 'reeditpro',
    region: input.region ?? env.GCP_REGION ?? 'us-central1',
    environment: 'staging',
    imageTag: input.imageTag ?? env.REEDITPRO_IMAGE_TAG ?? 'staging-local-001',
    confirmDeploy: input.confirmDeploy ?? env.REEDITPRO_CONFIRM_STAGING_DEPLOY === 'true',
  }
}

export function buildStagingDeployImageRefs(config: StagingDeployConfig): StagingDeployImageRef[] {
  const imageDigests = STAGING_DEPLOY_IMAGE_DIGESTS_BY_TAG[config.imageTag as keyof typeof STAGING_DEPLOY_IMAGE_DIGESTS_BY_TAG] ?? STAGING_DEPLOY_IMAGE_DIGESTS
  return Object.entries(imageDigests).map(([targetId, digest]) => {
    const image = `us-central1-docker.pkg.dev/${config.projectId}/reeditpro-staging-workers/${stagingImageNames[targetId as keyof typeof stagingImageNames]}`
    return {
      targetId: targetId as StagingDeployImageRef['targetId'],
      image,
      digest,
      fullImageRef: `${image}@${digest}`,
    }
  })
}

export function validateStagingDeployConfig(config: StagingDeployConfig): string[] {
  const blockers: string[] = []
  if (config.projectId !== 'reeditpro') blockers.push('GCP project must be exactly reeditpro for Phase 24B.')
  if (config.region !== 'us-central1') blockers.push('GCP region must be us-central1 for Phase 24B.')
  if (config.environment !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (!(config.imageTag in STAGING_DEPLOY_IMAGE_DIGESTS_BY_TAG)) {
    blockers.push(`Image tag must be one of: ${Object.keys(STAGING_DEPLOY_IMAGE_DIGESTS_BY_TAG).join(', ')}.`)
  }
  if (/production/i.test(`${config.projectId} ${config.environment}`)) blockers.push('Production-looking project or env is forbidden.')
  return blockers
}
