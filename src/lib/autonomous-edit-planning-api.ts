import { getSupabaseClient } from '../backend/supabase/supabase-client'
import type {
  AutonomousEditOutputFrame,
  AutonomousEditPlanningAttempt,
  AutonomousEditPreferenceSnapshot,
  ProjectSourceVideoBackendUploadResult,
} from '../types'

interface ApiEnvelope<TData> {
  ok?: boolean
  data?: TData
  error?: { code?: string; message?: string }
}

export interface CreateAutonomousEditPlanInput {
  apiBaseUrl: string
  workspaceId: string
  projectId: string
  editSessionId: string
  prompt: string
  outputFrame: AutonomousEditOutputFrame
  sourceVideoUploadResult: ProjectSourceVideoBackendUploadResult
  editBrief?: {
    briefId: string
    revisionNumber: number
    briefFingerprint: string
    summary: string
  }
  preferences?: AutonomousEditPreferenceSnapshot
  referenceVideoUploadResult?: ProjectSourceVideoBackendUploadResult
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}

export async function createAutonomousEditPlan(
  input: CreateAutonomousEditPlanInput,
): Promise<AutonomousEditPlanningAttempt> {
  const mediaAssetId = input.sourceVideoUploadResult.mediaAssetId
  if (!mediaAssetId) throw new Error('Finalized source media is missing its canonical media asset ID.')
  if (input.referenceVideoUploadResult && !input.referenceVideoUploadResult.mediaAssetId) {
    throw new Error('Finalized reference media is missing its canonical media asset ID.')
  }
  const prompt = input.prompt.trim()
  if (!prompt) throw new Error('Describe the edit you want before ReEditPro builds the plan.')

  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const response = await (input.fetchImpl ?? fetch)(joinUrl(
    input.apiBaseUrl,
    `/v1/projects/${encodeURIComponent(input.projectId)}/edit-sessions/${encodeURIComponent(input.editSessionId)}/autonomous-edit-plans`,
  ), {
    method: 'POST',
    headers: createHeaders({
      'content-type': 'application/json',
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      'idempotency-key': createPlanningIdempotencyKey(input),
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      prompt,
      source: {
        storageObjectRecordId: input.sourceVideoUploadResult.storageObjectRecordId,
        mediaAssetId,
        bucketName: input.sourceVideoUploadResult.bucketName,
        objectPath: input.sourceVideoUploadResult.objectPath,
        fileName: input.sourceVideoUploadResult.fileName,
        mimeType: input.sourceVideoUploadResult.mimeType,
        sizeBytes: input.sourceVideoUploadResult.sizeBytes,
        checksumSha256: input.sourceVideoUploadResult.checksumSha256,
      },
      outputFrame: input.outputFrame,
      editBrief: input.editBrief,
      preferences: input.preferences,
      referenceSource: input.referenceVideoUploadResult ? {
        storageObjectRecordId: input.referenceVideoUploadResult.storageObjectRecordId,
        mediaAssetId: input.referenceVideoUploadResult.mediaAssetId,
        bucketName: input.referenceVideoUploadResult.bucketName,
        objectPath: input.referenceVideoUploadResult.objectPath,
        fileName: input.referenceVideoUploadResult.fileName,
        mimeType: input.referenceVideoUploadResult.mimeType,
        sizeBytes: input.referenceVideoUploadResult.sizeBytes,
        checksumSha256: input.referenceVideoUploadResult.checksumSha256,
      } : undefined,
      analysisMode: 'local_internal',
    }),
  })
  const envelope = await parseEnvelope<{ autonomousEditPlanningAttempt: AutonomousEditPlanningAttempt }>(response)
  if (!envelope.ok || !envelope.data?.autonomousEditPlanningAttempt) {
    throw new Error(envelope.error?.message ?? `Autonomous edit planning failed with HTTP ${response.status}.`)
  }
  return envelope.data.autonomousEditPlanningAttempt
}

async function getSupabaseAccessToken(): Promise<string | undefined> {
  const client = getSupabaseClient()
  if (!client) return undefined
  const { data } = await client.auth.getSession()
  return data.session?.access_token
}

function createPlanningIdempotencyKey(input: CreateAutonomousEditPlanInput): string {
  const fingerprint = [
    input.workspaceId,
    input.projectId,
    input.editSessionId,
    input.sourceVideoUploadResult.checksumSha256 ?? input.sourceVideoUploadResult.storageObjectRecordId,
    input.referenceVideoUploadResult?.checksumSha256 ?? input.referenceVideoUploadResult?.storageObjectRecordId ?? 'no-reference',
    input.prompt.trim(),
    input.editBrief?.briefFingerprint ?? 'no-brief',
    input.outputFrame.aspectRatio,
  ].join('|')
  let hash = 2166136261
  for (let index = 0; index < fingerprint.length; index += 1) {
    hash ^= fingerprint.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return `autonomous-edit-plan:${hash.toString(16).padStart(8, '0')}`
}

function createHeaders(input: Record<string, string | undefined>): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(input)) {
    if (value) headers.set(key, value)
  }
  return headers
}

function joinUrl(baseUrl: string, pathname: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${pathname.replace(/^\/+/, '')}`
}

async function parseEnvelope<TData>(response: Response): Promise<ApiEnvelope<TData>> {
  const payload = await response.json().catch(() => undefined)
  return payload && typeof payload === 'object'
    ? payload as ApiEnvelope<TData>
    : { ok: false, error: { message: 'Planning backend returned a non-JSON response.' } }
}
