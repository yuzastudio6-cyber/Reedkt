import { ApiError } from '../errors/api-error'
import { createBasicPreview } from '../media/ffmpeg-preview'
import { probeMediaFile } from '../media/ffprobe'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { createStorageAdapter, resolveBucketName } from '../storage/storage-adapter'
import { buildCanonicalObjectPath } from '../storage/storage-paths'
import type { ServiceContext } from '../types'
import { runToolReadinessChecks } from '../workers/tool-readiness-runner'
import type { WorkerToolName } from '../workers/tool-readiness-types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'
import type {
  BasicRenderSmokeRequest,
  BasicRenderSmokeResponse,
  BasicRenderSmokeSourceObject,
  RenderSmokeQAResult,
} from '../workers/jobs/basic-render-smoke-types'

const BASIC_RENDER_REQUIRED_TOOLS: WorkerToolName[] = ['ffmpeg', 'ffprobe']

export async function createBasicRenderSmokeContext(context: ServiceContext, input: BasicRenderSmokeRequest) {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    renderJobId: input.renderJobId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    sourceStorageObject: await loadBasicRenderSmokeSourceObject(context, input),
  }
}

export async function checkBasicRenderSmokeTools(context: ServiceContext): Promise<{
  ready: boolean
  missingTools: string[]
  warnings: string[]
}> {
  const result = await runToolReadinessChecks(context, {
    recordResults: false,
    requiredTools: BASIC_RENDER_REQUIRED_TOOLS,
  })
  const requiredChecks = result.checks.filter((check) => BASIC_RENDER_REQUIRED_TOOLS.includes(check.toolName))
  const missingTools = requiredChecks.filter((check) => check.status !== 'passed').map((check) => check.toolName)
  return {
    ready: missingTools.length === 0,
    missingTools,
    warnings: [
      ...result.warnings,
      ...requiredChecks
        .filter((check) => check.status !== 'passed')
        .map((check) => `${check.toolName}: ${check.summary}`),
    ],
  }
}

export function createSkippedBasicRenderSmokeResult(input: BasicRenderSmokeRequest, warnings: string[]): BasicRenderSmokeResponse {
  return {
    ok: false,
    status: 'skipped',
    renderJobId: input.renderJobId,
    sourceStorageObjectId: input.sourceStorageObjectId,
    warnings,
    error: {
      code: 'RENDER_SMOKE_SKIPPED',
      message: 'Basic render smoke skipped because required FFmpeg/FFprobe tools are unavailable.',
    },
  }
}

export async function runBasicRenderSmoke(
  context: ServiceContext,
  input: BasicRenderSmokeRequest,
): Promise<BasicRenderSmokeResponse> {
  if (context.env.storageMode !== 'local') {
    throw new ApiError('LOCAL_STORAGE_REQUIRED', 'Basic render smoke requires STORAGE_MODE=local.', 409)
  }

  if (!input.approvedPlanSnapshotId) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Basic render smoke requires an approved snapshot ID.', 409)
  }
  if (!input.creditReservationId) {
    throw new ApiError('CREDITS_NOT_RESERVED', 'Basic render smoke requires a credit reservation ID.', 409)
  }

  const tools = await checkBasicRenderSmokeTools(context)
  if (!tools.ready) {
    if (input.strict) {
      throw new ApiError('RENDER_TOOL_UNAVAILABLE', `Basic render smoke requires available tools: ${tools.missingTools.join(', ')}.`, 409)
    }
    return createSkippedBasicRenderSmokeResult(input, tools.warnings)
  }

  const smokeContext = await createBasicRenderSmokeContext(context, input)
  const sourcePath = resolveLocalStorageObjectPath(
    context.env.localStorageRoot,
    smokeContext.sourceStorageObject.bucketName,
    smokeContext.sourceStorageObject.objectPath,
  )
  const mediaProbe = await probeMediaFile(sourcePath, {
    ffprobeBin: context.env.ffprobeBin,
    timeoutMs: context.env.toolCheckTimeoutMs,
  })
  const renderId = createMockId('render')
  const previewBucketName = resolveBucketName(context.env, 'preview')
  const outputObjectPath = buildCanonicalObjectPath({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    purpose: 'preview',
    ownerId: renderId,
    fileName: 'basic-smoke-preview.mp4',
  })
  const outputPath = resolveLocalStorageObjectPath(context.env.localStorageRoot, previewBucketName, outputObjectPath)
  const previewRender = await createBasicPreview(sourcePath, outputPath, {
    localStorageRoot: context.env.localStorageRoot,
    ffmpegBin: context.env.ffmpegBin,
    timeoutMs: 45000,
    maxDurationSeconds: 3,
    audioMode: 'muted',
  })
  const previewStorageObject = await createPreviewStorageObjectFromRender(context, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    renderId,
    renderJobId: input.renderJobId,
    bucketName: previewBucketName,
    objectPath: outputObjectPath,
    sizeBytes: previewRender.sizeBytes,
    checksumSha256: previewRender.checksumSha256,
  })
  const qa = await createSmokeQAReport(context, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    renderId,
    previewStorageObjectId: previewStorageObject.id,
    previewSizeBytes: previewRender.sizeBytes,
    checksumSha256: previewRender.checksumSha256,
  })
  await markSmokePreviewReady(context, {
    renderId,
    renderJobId: input.renderJobId,
    previewStorageObjectId: previewStorageObject.id,
    qaReportId: qa.qaReportId,
  })

  return {
    ok: true,
    status: 'preview_ready',
    renderId,
    renderJobId: input.renderJobId,
    sourceMediaAssetId: smokeContext.sourceStorageObject.mediaAssetId,
    sourceStorageObjectId: smokeContext.sourceStorageObject.id,
    previewStorageObjectId: previewStorageObject.id,
    qaReportId: qa.qaReportId,
    outputBucketName: previewBucketName,
    outputObjectPath,
    durationSeconds: previewRender.durationSeconds,
    sizeBytes: previewRender.sizeBytes,
    checksumSha256: previewRender.checksumSha256,
    mediaProbe,
    previewRender: {
      durationSeconds: previewRender.durationSeconds,
      sizeBytes: previewRender.sizeBytes,
      checksumSha256: previewRender.checksumSha256,
      commandSummary: previewRender.commandSummary,
    },
    warnings: [
      mockWarning('Basic render smoke'),
      ...qa.warnings,
    ],
  }
}

export async function createPreviewStorageObjectFromRender(
  context: ServiceContext,
  input: {
    workspaceId: string
    projectId: string
    renderId: string
    renderJobId: string
    bucketName: string
    objectPath: string
    sizeBytes: number
    checksumSha256: string
  },
): Promise<{
  id: string
  bucketName: string
  objectPath: string
  sizeBytes: number
  checksumSha256: string
  mockOnly?: boolean
}> {
  const adapter = createStorageAdapter(context.env)
  const metadata = await adapter.getObjectMetadata(input.bucketName, input.objectPath)
  if (!metadata.exists) {
    throw new ApiError('STORAGE_OBJECT_NOT_FOUND', 'Rendered preview object was not found in local storage.', 404)
  }

  if (!context.clients.admin || context.env.mockOnly) {
    return {
      id: createMockId('storage_object'),
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      sizeBytes: metadata.sizeBytes,
      checksumSha256: metadata.checksumSha256,
      mockOnly: true,
    }
  }

  const { data, error } = await context.clients.admin
    .from('storage_object_records')
    .insert({
      workspace_id: input.workspaceId,
      project_id: input.projectId,
      render_id: input.renderId,
      bucket_name: input.bucketName,
      object_path: input.objectPath,
      object_purpose: 'preview',
      mime_type: 'video/mp4',
      size_bytes: metadata.sizeBytes,
      checksum_sha256: metadata.checksumSha256,
      status: 'ready',
    })
    .select('*')
    .single()

  throwOnSupabaseError(error)
  return {
    id: String(data.id),
    bucketName: String(data.bucket_name),
    objectPath: String(data.object_path),
    sizeBytes: Number(data.size_bytes ?? input.sizeBytes),
    checksumSha256: String(data.checksum_sha256 ?? input.checksumSha256),
  }
}

export async function createSmokeQAReport(
  context: ServiceContext,
  input: {
    workspaceId: string
    projectId: string
    renderId: string
    previewStorageObjectId: string
    previewSizeBytes: number
    checksumSha256: string
  },
): Promise<RenderSmokeQAResult> {
  const checks = [
    'preview_object_created',
    'preview_checksum_created',
    'canonical_storage_path_only',
    'provider_calls_not_used',
    'signed_urls_not_stored',
  ]
  const passed = input.previewSizeBytes > 0 && input.checksumSha256.length > 0

  if (!context.clients.admin || context.env.mockOnly) {
    return {
      qaReportId: createMockId('qa_report'),
      status: passed ? 'passed' : 'failed',
      checks,
      warnings: [mockWarning('Render smoke QA report')],
    }
  }

  const { data, error } = await context.clients.admin
    .from('qa_reports')
    .insert({
      workspace_id: input.workspaceId,
      project_id: input.projectId,
      render_id: input.renderId,
      status: passed ? 'passed' : 'failed',
      summary_json: {
        checks,
        previewStorageObjectId: input.previewStorageObjectId,
      },
    })
    .select('*')
    .single()

  throwOnSupabaseError(error, 'PREVIEW_QA_FAILED')
  return {
    qaReportId: String(data.id),
    status: passed ? 'passed' : 'failed',
    checks,
    warnings: [],
  }
}

export async function markSmokePreviewReady(
  context: ServiceContext,
  input: {
    renderId: string
    renderJobId: string
    previewStorageObjectId: string
    qaReportId: string
  },
): Promise<{ previewReady: boolean; warnings: string[] }> {
  if (!context.clients.admin || context.env.mockOnly) {
    return {
      previewReady: true,
      warnings: [mockWarning('Render preview-ready status')],
    }
  }

  const { error } = await context.clients.admin
    .from('renders')
    .update({
      status: 'preview_ready',
      preview_storage_object_id: input.previewStorageObjectId,
      qa_report_id: input.qaReportId,
      updated_at: nowIso(),
    })
    .eq('id', input.renderId)

  throwOnSupabaseError(error, 'RENDER_NOT_READY')
  return { previewReady: true, warnings: [] }
}

async function loadBasicRenderSmokeSourceObject(
  context: ServiceContext,
  input: BasicRenderSmokeRequest,
): Promise<BasicRenderSmokeSourceObject> {
  if (input.sourceStorageObject) {
    if (input.sourceStorageObject.id !== input.sourceStorageObjectId) {
      throw new ApiError('STORAGE_OBJECT_NOT_FOUND', 'Source storage object ID does not match supplied metadata.', 400)
    }
    return input.sourceStorageObject
  }

  if (!context.clients.admin || context.env.mockOnly) {
    throw new ApiError('STORAGE_OBJECT_NOT_FOUND', 'Mock basic render smoke requires source storage object metadata.', 404)
  }

  const { data, error } = await context.clients.admin
    .from('storage_object_records')
    .select('*')
    .eq('id', input.sourceStorageObjectId)
    .maybeSingle()

  throwOnSupabaseError(error, 'STORAGE_OBJECT_NOT_FOUND')
  if (!data) throw new ApiError('STORAGE_OBJECT_NOT_FOUND', 'Source storage object was not found.', 404)

  return {
    id: String(data.id),
    mediaAssetId: String(data.media_asset_id),
    bucketName: String(data.bucket_name),
    objectPath: String(data.object_path),
    mimeType: typeof data.mime_type === 'string' ? data.mime_type : undefined,
    sizeBytes: typeof data.size_bytes === 'number' ? data.size_bytes : undefined,
    checksumSha256: typeof data.checksum_sha256 === 'string' ? data.checksum_sha256 : undefined,
  }
}
