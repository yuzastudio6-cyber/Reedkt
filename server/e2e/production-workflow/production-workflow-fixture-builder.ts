import type { ProductionStorageBucketPurpose } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionStorageReference } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkflowScenario } from './production-workflow-scenario-types'

export interface ProductionWorkflowFixture {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId: string
  toolExecutionPlanId: string
  editPlanId: string
  sourceStorageObjectId: string
  sourceStorageRef: ProductionStorageReference
  sourceAudioArtifactId: string
  sourceVideoArtifactId: string
  proxyVideoArtifactId: string
  sourceImageArtifactId: string
  representativeFrameArtifactIds: string[]
  outputDirectory?: string
  tempFixtureLocalPaths: string[]
}

export function buildProductionWorkflowFixture(scenario: ProductionWorkflowScenario): ProductionWorkflowFixture {
  const safeId = scenario.scenarioId.replace(/[^a-z0-9_-]/gi, '-')
  const workspaceId = `workspace-e2e-${safeId}`
  const projectId = `project-e2e-${safeId}`
  const mediaAssetId = `media-e2e-${safeId}`
  const sourceStorageObjectId = `workspaces/${workspaceId}/projects/${projectId}/media/${mediaAssetId}/source/generated-fixture.mp4`

  return {
    workspaceId,
    projectId,
    mediaAssetId,
    approvedSnapshotId: `approved-snapshot-${safeId}`,
    toolExecutionPlanId: `tool-execution-${safeId}`,
    editPlanId: `edit-plan-${safeId}`,
    sourceStorageObjectId,
    sourceStorageRef: privateRef('source_media', sourceStorageObjectId),
    sourceAudioArtifactId: `extracted-audio-${safeId}`,
    sourceVideoArtifactId: `source-video-${safeId}`,
    proxyVideoArtifactId: `proxy-video-${safeId}`,
    sourceImageArtifactId: `source-image-${safeId}`,
    representativeFrameArtifactIds: [`representative-frame-${safeId}-0`],
    tempFixtureLocalPaths: [],
  }
}

export function privateRef(storageBucketPurpose: ProductionStorageBucketPurpose, storageObjectPath: string): ProductionStorageReference {
  if (/^https?:\/\//i.test(storageObjectPath) || storageObjectPath.includes('?X-Goog-Signature=')) {
    throw new Error('E2E workflow fixtures reject signed URLs and remote URLs.')
  }
  return {
    storageBucketPurpose,
    storageObjectPath,
    sourceOfTruth: true,
  }
}
