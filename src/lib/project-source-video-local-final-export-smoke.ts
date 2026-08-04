import { getSupabaseClient } from '../backend/supabase/supabase-client'
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoEditAssemblySummary,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoLocalFinalExportResult,
  ProjectSourceVideoPreviewReviewResult,
  ProjectSourceVideoProfessionalQAResult,
} from '../types/project-source-video'
import { assertProjectSourceVideoProfessionalQAPassed } from './project-source-video-professional-qa'
import { resolveReceiverSafeFetch } from './receiver-safe-fetch'

interface ApiEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

interface RenderJobData {
  renderJob: {
    id: string
  }
}

interface BasicFinalExportSmokeData {
  result?: {
    status?: string
    output?: BasicFinalExportSmokeOutput
    warnings?: string[]
  }
  finalExportSmoke?: BasicFinalExportSmokeOutput
}

interface BasicFinalExportSmokeOutput {
  ok?: boolean
  status?: string
  renderId?: string
  renderJobId?: string
  sourceStorageObjectId?: string
  finalExportStorageObjectId?: string
  qaReportId?: string
  outputBucketName?: string
  outputObjectPath?: string
  durationSeconds?: number
  sizeBytes?: number
  checksumSha256?: string
  editAssembly?: ProjectSourceVideoEditAssemblySummary
  previewReviewId?: string
  warnings?: string[]
}

export interface RunProjectSourceVideoLocalFinalExportSmokeInput {
  apiBaseUrl: string
  editPlanId: string
  projectId: string
  workspaceId: string
  previewResult: ProjectSourceVideoLocalEditPreviewResult
  previewReviewResult: ProjectSourceVideoPreviewReviewResult
  professionalQAResult: ProjectSourceVideoProfessionalQAResult
  sourceVideoUploadResult: ProjectSourceVideoBackendUploadResult
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}

async function getSupabaseAccessToken(): Promise<string | undefined> {
  const client = getSupabaseClient()
  if (!client) return undefined
  const { data } = await client.auth.getSession()
  return data.session?.access_token
}

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function createIdempotencyKey(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`
}

function createHeaders(input: Record<string, string | undefined>): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(input)) {
    if (value) headers.set(key, value)
  }
  return headers
}

async function parseEnvelope<TData>(response: Response): Promise<ApiEnvelope<TData>> {
  const payload = await response.json().catch(() => undefined)
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      error: {
        code: 'BAD_RESPONSE',
        message: 'Backend returned a non-JSON response.',
      },
    }
  }
  return payload as ApiEnvelope<TData>
}

function assertOk<TData>(envelope: ApiEnvelope<TData>, fallback: string): TData {
  if (!envelope.ok || !envelope.data) {
    throw new Error(envelope.error?.message ?? fallback)
  }
  return envelope.data
}

function createPrivateFinalExportAssembly(
  previewAssembly: ProjectSourceVideoEditAssemblySummary | undefined,
): ProjectSourceVideoEditAssemblySummary | undefined {
  if (!previewAssembly) return undefined
  const operationsApplied = [
    ...previewAssembly.operationsApplied.filter((operation) => operation !== 'preview_review_pending'),
    'approved_preview_review_carried_forward',
  ]

  return {
    ...previewAssembly,
    mode: 'private_final_export',
    operationsApplied: [...new Set(operationsApplied)],
    productReady: false,
  }
}

export async function runProjectSourceVideoLocalFinalExportSmoke(
  input: RunProjectSourceVideoLocalFinalExportSmokeInput,
): Promise<ProjectSourceVideoLocalFinalExportResult> {
  if (input.previewReviewResult.reviewStatus !== 'approved') {
    throw new Error('Final export requires an approved preview review.')
  }
  if (input.previewReviewResult.renderId !== input.previewResult.renderId) {
    throw new Error('Final export preview review must reference the current preview render.')
  }
  assertProjectSourceVideoProfessionalQAPassed(input.professionalQAResult)
  if (input.professionalQAResult.previewReviewId !== input.previewReviewResult.id) {
    throw new Error('Final export professional QA must reference the approved preview review.')
  }
  if (input.professionalQAResult.renderId !== input.previewResult.renderId) {
    throw new Error('Final export professional QA must reference the preview render.')
  }
  if (input.previewResult.sourceStorageObjectRecordId !== input.sourceVideoUploadResult.storageObjectRecordId) {
    throw new Error('Final export preview must reference the same source object selected for export.')
  }
  if (input.professionalQAResult.sourceStorageObjectRecordId !== input.sourceVideoUploadResult.storageObjectRecordId) {
    throw new Error('Final export professional QA must reference the same source object selected for export.')
  }
  if (input.professionalQAResult.briefLineage.briefFingerprint !== input.previewResult.briefLineage.briefFingerprint) {
    throw new Error('Final export professional QA must reference the same approved brief lineage as the preview.')
  }
  if (input.previewResult.editAssembly?.briefLineage.briefFingerprint !== input.previewResult.briefLineage.briefFingerprint) {
    throw new Error('Final export preview assembly must reference the approved brief lineage.')
  }
  if (!input.sourceVideoUploadResult.mediaAssetId) {
    throw new Error('Final export requires a finalized media asset id from backend-local upload.')
  }

  const fetchImpl = resolveReceiverSafeFetch(input.fetchImpl)
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const commonHeaders = {
    'Content-Type': 'application/json',
    authorization: accessToken ? `Bearer ${accessToken}` : undefined,
  }
  const editAssembly = createPrivateFinalExportAssembly(input.previewResult.editAssembly)

  const renderJob = assertOk(
    await parseEnvelope<RenderJobData>(await fetchImpl(joinUrl(input.apiBaseUrl, '/v1/render-jobs'), {
      method: 'POST',
      headers: createHeaders({
        ...commonHeaders,
        'idempotency-key': createIdempotencyKey('local-final-export-render-job'),
      }),
      body: JSON.stringify({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        approvedPlanSnapshotId: input.previewResult.approvedPlanSnapshotId,
        creditReservationId: input.previewResult.creditReservationId,
        renderType: 'export',
        renderQualityLevel: 'internal-local-final-export-smoke',
      }),
    })),
    'Local final export render job creation failed.',
  ).renderJob

  const smokeEnvelope = await parseEnvelope<BasicFinalExportSmokeData>(await fetchImpl(joinUrl(input.apiBaseUrl, `/v1/render-jobs/${encodeURIComponent(renderJob.id)}/basic-smoke-final-export`), {
    method: 'POST',
    headers: createHeaders({
      ...commonHeaders,
      'idempotency-key': createIdempotencyKey('local-final-export-basic-smoke'),
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      sourceStorageObjectId: input.sourceVideoUploadResult.storageObjectRecordId,
      sourceStorageObject: {
        id: input.sourceVideoUploadResult.storageObjectRecordId,
        mediaAssetId: input.sourceVideoUploadResult.mediaAssetId,
        bucketName: input.sourceVideoUploadResult.bucketName,
        objectPath: input.sourceVideoUploadResult.objectPath,
        mimeType: input.sourceVideoUploadResult.mimeType,
        sizeBytes: input.sourceVideoUploadResult.sizeBytes,
        checksumSha256: input.sourceVideoUploadResult.checksumSha256,
      },
      approvedPlanSnapshotId: input.previewResult.approvedPlanSnapshotId,
      creditReservationId: input.previewResult.creditReservationId,
      workerInstanceId: 'local-final-export-smoke-worker',
      strict: true,
      previewReviewId: input.previewReviewResult.id,
      previewReviewStatus: 'approved',
      professionalQAId: input.professionalQAResult.id,
      professionalQAStatus: input.professionalQAResult.status,
      editAssemblyPlan: editAssembly,
    }),
  }))
  const smokeData = assertOk(smokeEnvelope, 'Local final export smoke failed.')
  const finalExportSmoke = smokeData.finalExportSmoke ?? smokeData.result?.output
  if (finalExportSmoke?.status !== 'final_export_ready') {
    throw new Error(finalExportSmoke?.status
      ? `Local final export ended with status ${finalExportSmoke.status}.`
      : 'Local final export did not return final-export-ready output.')
  }

  return {
    status: 'final_export_ready',
    editPlanId: input.editPlanId,
    briefLineage: input.previewResult.briefLineage,
    approvedPlanSnapshotId: input.previewResult.approvedPlanSnapshotId,
    creditReservationId: input.previewResult.creditReservationId,
    renderJobId: renderJob.id,
    renderId: finalExportSmoke.renderId,
    sourceStorageObjectRecordId: input.sourceVideoUploadResult.storageObjectRecordId,
    finalExportStorageObjectId: finalExportSmoke.finalExportStorageObjectId,
    qaReportId: finalExportSmoke.qaReportId,
    outputBucketName: finalExportSmoke.outputBucketName,
    outputObjectPath: finalExportSmoke.outputObjectPath,
    durationSeconds: finalExportSmoke.durationSeconds,
    sizeBytes: finalExportSmoke.sizeBytes,
    checksumSha256: finalExportSmoke.checksumSha256,
    editAssembly: finalExportSmoke.editAssembly ?? editAssembly,
    previewReviewId: input.previewReviewResult.id,
    professionalQA: input.professionalQAResult,
    finalExportStarted: true,
    publicDeliveryEnabled: false,
    providerCallMade: false,
    qwenCallMade: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
    warnings: [
      ...(smokeEnvelope.warnings ?? []),
      ...(smokeData.result?.warnings ?? []),
      ...(finalExportSmoke.warnings ?? []),
      'Local final export created a private backend-local export artifact only; public delivery, signed URLs, providers, Qwen, Supabase, GCS, external beta, production, and billing settlement remain blocked.',
    ],
  }
}
