import { getSupabaseClient } from '../backend/supabase/supabase-client'
import {
  REEDITPRO_QWEN_MAIN_BRAIN_LABEL,
  createReeditProQwenMainBrainSummary,
} from '../types/qwen-main-brain'
import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoLocalEditPreviewConfig,
  ProjectSourceVideoLocalEditPreviewResult,
} from '../types/project-source-video'

interface ApiEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

interface CreditApprovalData {
  creditApproval: {
    id: string
  }
}

interface CreditReservationData {
  creditReservation: {
    id: string
  }
}

interface ApprovedSnapshotData {
  approvedPlanSnapshot: {
    id: string
  }
}

interface RenderJobData {
  renderJob: {
    id: string
  }
}

interface BasicRenderSmokeData {
  result?: {
    status?: string
    output?: BasicRenderSmokeOutput
    warnings?: string[]
  }
  renderSmoke?: BasicRenderSmokeOutput
}

interface BasicRenderSmokeOutput {
  ok?: boolean
  status?: string
  renderId?: string
  renderJobId?: string
  sourceStorageObjectId?: string
  previewStorageObjectId?: string
  qaReportId?: string
  outputBucketName?: string
  outputObjectPath?: string
  durationSeconds?: number
  sizeBytes?: number
  checksumSha256?: string
  warnings?: string[]
}

export interface RunProjectSourceVideoLocalEditPreviewSmokeInput {
  apiBaseUrl: string
  editSessionId: string
  projectId: string
  workspaceId: string
  sourceVideoUploadResult: ProjectSourceVideoBackendUploadResult
  sourceVideoDurationSeconds?: number
  sourceVideoAspectRatio?: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}

const DEFAULT_WORKSPACE_ID = 'mock-workspace'

function envValue(env: Record<string, string | undefined>, key: string): string | undefined {
  const value = env[key]?.trim()
  return value ? value : undefined
}

export function createProjectSourceVideoLocalEditPreviewConfig(
  env: Record<string, string | undefined>,
): ProjectSourceVideoLocalEditPreviewConfig {
  const apiBaseUrl = envValue(env, 'VITE_REEDITPRO_API_BASE_URL') ?? envValue(env, 'VITE_API_BASE_URL')
  const enabled = envValue(env, 'VITE_REEDITPRO_LOCAL_EDIT_PREVIEW_SMOKE') === 'true'
  const workspaceId = envValue(env, 'VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID') ?? DEFAULT_WORKSPACE_ID

  if (!apiBaseUrl) {
    return {
      available: false,
      workspaceId,
      mode: 'unavailable',
      message: 'Local edit preview is unavailable until the internal API base URL is configured.',
      warnings: ['Set VITE_REEDITPRO_API_BASE_URL for internal local edit preview testing.'],
    }
  }

  if (!enabled) {
    return {
      available: false,
      apiBaseUrl,
      workspaceId,
      mode: 'unavailable',
      message: 'Local edit preview is disabled by the internal preview gate.',
      warnings: ['Set VITE_REEDITPRO_LOCAL_EDIT_PREVIEW_SMOKE=true only for explicit internal testing.'],
    }
  }

  return {
    available: true,
    apiBaseUrl,
    workspaceId,
    mode: 'mock_local_preview_smoke',
    message: 'Local edit preview smoke is available after backend-local source upload.',
    warnings: [
      'This creates mock credit approval/reservation records and an approved snapshot before running a local preview worker.',
      'This does not call Qwen, providers, Supabase writes, GCS, external beta, or production.',
    ],
  }
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

async function clientHash(value: unknown): Promise<string> {
  const text = JSON.stringify(value)
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0
  }
  return `fallback-${Math.abs(hash).toString(16)}`
}

export async function runProjectSourceVideoLocalEditPreviewSmoke(
  input: RunProjectSourceVideoLocalEditPreviewSmokeInput,
): Promise<ProjectSourceVideoLocalEditPreviewResult> {
  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const editPlanId = `edit-plan-${input.editSessionId}-local-preview`
  const creditEstimateId = `credit-estimate-${input.editSessionId}-local-preview`
  const source = input.sourceVideoUploadResult

  if (!source.mediaAssetId) {
    throw new Error('Local edit preview requires a finalized media asset id from backend-local upload.')
  }

  const commonHeaders = {
    'Content-Type': 'application/json',
    authorization: accessToken ? `Bearer ${accessToken}` : undefined,
  }

  const creditApproval = assertOk(
    await parseEnvelope<CreditApprovalData>(await fetchImpl(joinUrl(input.apiBaseUrl, `/v1/credit-estimates/${encodeURIComponent(creditEstimateId)}/approve`), {
      method: 'POST',
      headers: createHeaders({
        ...commonHeaders,
        'idempotency-key': createIdempotencyKey('local-preview-credit-approval'),
      }),
      body: JSON.stringify({ workspaceId: input.workspaceId }),
    })),
    'Mock credit estimate approval failed.',
  ).creditApproval

  const creditReservation = assertOk(
    await parseEnvelope<CreditReservationData>(await fetchImpl(joinUrl(input.apiBaseUrl, `/v1/credit-estimates/${encodeURIComponent(creditEstimateId)}/reserve`), {
      method: 'POST',
      headers: createHeaders({
        ...commonHeaders,
        'idempotency-key': createIdempotencyKey('local-preview-credit-reservation'),
      }),
      body: JSON.stringify({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editPlanId,
      }),
    })),
    'Mock credit reservation failed.',
  ).creditReservation

  const snapshotJson = {
    mode: 'internal_local_edit_preview_smoke',
    qwenMainBrain: {
      label: REEDITPRO_QWEN_MAIN_BRAIN_LABEL,
      summary: createReeditProQwenMainBrainSummary(),
      liveCallMade: false,
    },
    sourceVideo: {
      storageObjectRecordId: source.storageObjectRecordId,
      mediaAssetId: source.mediaAssetId,
      bucketName: source.bucketName,
      objectPath: source.objectPath,
      fileName: source.fileName,
      mimeType: source.mimeType,
      sizeBytes: source.sizeBytes,
      checksumSha256: source.checksumSha256,
      durationSeconds: input.sourceVideoDurationSeconds,
      aspectRatio: input.sourceVideoAspectRatio,
    },
    gates: {
      backendLocalUpload: true,
      creditEstimateApproved: true,
      creditReservationCreated: true,
      approvedSnapshotCreated: true,
      productionReady: false,
    },
  }
  const planHash = await clientHash({ editPlanId, snapshotJson })
  const creditHash = await clientHash({ creditEstimateId, creditApprovalId: creditApproval.id, creditReservationId: creditReservation.id })
  const sourceSequenceHash = await clientHash(snapshotJson.sourceVideo)
  const timingHash = await clientHash({ editSessionId: input.editSessionId, mode: 'basic_local_preview_smoke', durationSeconds: input.sourceVideoDurationSeconds })

  const approvedSnapshot = assertOk(
    await parseEnvelope<ApprovedSnapshotData>(await fetchImpl(joinUrl(input.apiBaseUrl, `/v1/edit-plans/${encodeURIComponent(editPlanId)}/approved-snapshots`), {
      method: 'POST',
      headers: createHeaders({
        ...commonHeaders,
        'idempotency-key': createIdempotencyKey('local-preview-approved-snapshot'),
      }),
      body: JSON.stringify({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        chatSessionId: input.editSessionId,
        creditEstimateId,
        creditApprovalId: creditApproval.id,
        creditReservationId: creditReservation.id,
        snapshotVersion: 1,
        snapshotJson,
        planHash,
        creditHash,
        sourceSequenceHash,
        timingHash,
      }),
    })),
    'Approved snapshot creation failed.',
  ).approvedPlanSnapshot

  const renderJob = assertOk(
    await parseEnvelope<RenderJobData>(await fetchImpl(joinUrl(input.apiBaseUrl, '/v1/render-jobs'), {
      method: 'POST',
      headers: createHeaders({
        ...commonHeaders,
        'idempotency-key': createIdempotencyKey('local-preview-render-job'),
      }),
      body: JSON.stringify({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        approvedPlanSnapshotId: approvedSnapshot.id,
        creditReservationId: creditReservation.id,
        renderType: 'preview',
        renderQualityLevel: 'internal-local-smoke',
      }),
    })),
    'Local preview render job creation failed.',
  ).renderJob

  const smokeEnvelope = await parseEnvelope<BasicRenderSmokeData>(await fetchImpl(joinUrl(input.apiBaseUrl, `/v1/render-jobs/${encodeURIComponent(renderJob.id)}/basic-smoke-preview`), {
    method: 'POST',
    headers: createHeaders({
      ...commonHeaders,
      'idempotency-key': createIdempotencyKey('local-preview-basic-smoke'),
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      sourceStorageObjectId: source.storageObjectRecordId,
      sourceStorageObject: {
        id: source.storageObjectRecordId,
        mediaAssetId: source.mediaAssetId,
        bucketName: source.bucketName,
        objectPath: source.objectPath,
        mimeType: source.mimeType,
        sizeBytes: source.sizeBytes,
        checksumSha256: source.checksumSha256,
      },
      approvedPlanSnapshotId: approvedSnapshot.id,
      creditReservationId: creditReservation.id,
      workerInstanceId: 'local-edit-preview-smoke-worker',
      strict: true,
    }),
  }))
  const smokeData = assertOk(smokeEnvelope, 'Local edit preview smoke failed.')
  const renderSmoke = smokeData.renderSmoke ?? smokeData.result?.output
  if (smokeData.result?.status !== 'completed' || renderSmoke?.status !== 'preview_ready') {
    throw new Error(renderSmoke?.status
      ? `Local edit preview ended with status ${renderSmoke.status}.`
      : 'Local edit preview did not return preview-ready output.')
  }

  return {
    status: 'preview_ready',
    approvedPlanSnapshotId: approvedSnapshot.id,
    creditApprovalId: creditApproval.id,
    creditReservationId: creditReservation.id,
    renderJobId: renderJob.id,
    renderId: renderSmoke.renderId,
    sourceStorageObjectRecordId: source.storageObjectRecordId,
    previewStorageObjectId: renderSmoke.previewStorageObjectId,
    outputBucketName: renderSmoke.outputBucketName,
    outputObjectPath: renderSmoke.outputObjectPath,
    durationSeconds: renderSmoke.durationSeconds,
    sizeBytes: renderSmoke.sizeBytes,
    checksumSha256: renderSmoke.checksumSha256,
    qwenMainBrainLabel: REEDITPRO_QWEN_MAIN_BRAIN_LABEL,
    approvedSnapshotCreated: true,
    mockCreditApprovalCreated: true,
    mockCreditReservationCreated: true,
    workerJobCreated: true,
    mediaProcessingStarted: true,
    renderJobCreated: true,
    previewOnly: true,
    providerCallMade: false,
    qwenCallMade: false,
    exportJobCreated: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
    warnings: [
      ...(smokeEnvelope.warnings ?? []),
      ...(smokeData.result?.warnings ?? []),
      ...(renderSmoke.warnings ?? []),
      'Local edit preview created a mock approved snapshot and a preview-only local render artifact; no provider, Qwen, Supabase, GCS, external beta, or production path ran.',
    ],
  }
}
