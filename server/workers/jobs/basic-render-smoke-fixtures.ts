import type { ServiceContext } from '../../types'
import { createSyntheticMp4Fixture } from '../../media/test-media-fixture'
import { resolveLocalStorageObjectPath } from '../../media/local-media-paths'
import { resolveBucketName } from '../../storage/storage-adapter'
import { buildCanonicalObjectPath } from '../../storage/storage-paths'
import { createMockId } from '../../services/service-helpers'
import type { BasicRenderSmokeRequest } from './basic-render-smoke-types'

export interface BasicRenderSmokeFixture {
  request: BasicRenderSmokeRequest
  jobId: string
  idempotencyKey: string
  warnings: string[]
}

export async function createBasicRenderSmokeFixture(context: ServiceContext): Promise<BasicRenderSmokeFixture> {
  const workspaceId = 'workspace-render-smoke'
  const projectId = 'project-render-smoke'
  const uploadIntentId = createMockId('upload_intent')
  const mediaAssetId = createMockId('media_asset')
  const sourceStorageObjectId = createMockId('storage_object')
  const renderJobId = createMockId('render_job')
  const approvedPlanSnapshotId = createMockId('approved_snapshot')
  const creditReservationId = createMockId('credit_reservation')
  const bucketName = resolveBucketName(context.env, 'source_media')
  const objectPath = buildCanonicalObjectPath({
    workspaceId,
    projectId,
    purpose: 'source_media',
    ownerId: uploadIntentId,
    fileName: 'basic-render-source.mp4',
  })
  const outputPath = resolveLocalStorageObjectPath(context.env.localStorageRoot, bucketName, objectPath)
  const fixture = await createSyntheticMp4Fixture({
    outputPath,
    localStorageRoot: context.env.localStorageRoot,
    ffmpegBin: context.env.ffmpegBin,
    timeoutMs: context.env.toolCheckTimeoutMs,
  })

  if (!fixture.available || !fixture.sizeBytes || !fixture.checksumSha256) {
    return {
      request: {
        workspaceId,
        projectId,
        renderJobId,
        sourceStorageObjectId,
      approvedPlanSnapshotId,
      creditReservationId,
      strict: false,
      editAssemblyPlan: {
        planId: 'local-plan-render-smoke',
        title: 'Local render smoke edit plan',
        summary: 'Bounded internal render smoke plan for source review and clean assembly.',
        steps: [
          {
            label: 'Clean assembly',
            summary: 'Create a short internal preview artifact from the uploaded source.',
          },
        ],
        sourceAspectRatio: '16:9',
      },
    },
      jobId: renderJobId,
      idempotencyKey: 'basic-render-smoke-skipped',
      warnings: fixture.warnings,
    }
  }

  return {
    request: {
      workspaceId,
      projectId,
      renderJobId,
      sourceStorageObjectId,
      approvedPlanSnapshotId,
      creditReservationId,
      strict: true,
      editAssemblyPlan: {
        planId: 'local-plan-render-smoke',
        title: 'Local render smoke edit plan',
        summary: 'Bounded internal render smoke plan for source review and clean assembly.',
        steps: [
          {
            label: 'Clean assembly',
            summary: 'Create a short internal preview artifact from the uploaded source.',
          },
        ],
        sourceAspectRatio: '16:9',
      },
      sourceStorageObject: {
        id: sourceStorageObjectId,
        mediaAssetId,
        bucketName,
        objectPath,
        mimeType: 'video/mp4',
        sizeBytes: fixture.sizeBytes,
        checksumSha256: fixture.checksumSha256,
      },
    },
    jobId: renderJobId,
    idempotencyKey: 'basic-render-smoke',
    warnings: [],
  }
}
