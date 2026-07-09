import { getSupabaseClient } from '../backend/supabase/supabase-client'
import {
  createProjectEditPlanBriefLineage,
  type ProjectEditPlanApprovalModel,
  type ProjectEditPlanBackendApprovalResult,
  type ProjectEditPlanBackendLocalRecord,
} from './project-edit-plan-approval'
import type { ProjectEditBriefBackendLocalRecord } from './project-edit-brief-backend-local'
import type { ProjectSourceVideoBackendUploadResult } from '../types/project-source-video'

interface ApiEnvelope<TData> {
  ok?: boolean
  data?: TData
  warnings?: string[]
  error?: {
    code?: string
    message?: string
  }
}

interface LocalEditPlanData {
  localEditPlan: ProjectEditPlanBackendLocalRecord
}

export interface ApproveProjectEditPlanBackendLocalInput {
  apiBaseUrl: string
  approvedLocalPlan: ProjectEditPlanApprovalModel
  editBrief: ProjectEditBriefBackendLocalRecord
  editSessionId: string
  projectId: string
  sourceVideoUploadResult: ProjectSourceVideoBackendUploadResult
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
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

async function getSupabaseAccessToken(): Promise<string | undefined> {
  const client = getSupabaseClient()
  if (!client) return undefined
  const { data } = await client.auth.getSession()
  return data.session?.access_token
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

export async function approveProjectEditPlanBackendLocal(
  input: ApproveProjectEditPlanBackendLocalInput,
): Promise<ProjectEditPlanBackendApprovalResult> {
  if (!input.approvedLocalPlan.approved) {
    throw new Error('Backend-local edit plan approval requires an approved local plan model.')
  }
  if (!input.editBrief.readbackVerified) {
    throw new Error('Backend-local edit plan approval requires a saved and read-back edit brief.')
  }
  if (input.editBrief.sourceStorageObjectRecordId !== input.sourceVideoUploadResult.storageObjectRecordId) {
    throw new Error('Backend-local edit plan approval requires the saved brief to reference the current source object.')
  }

  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const commonHeaders = {
    'Content-Type': 'application/json',
    authorization: accessToken ? `Bearer ${accessToken}` : undefined,
  }

  const createEnvelope = await parseEnvelope<LocalEditPlanData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/projects/${encodeURIComponent(input.projectId)}/edit-sessions/${encodeURIComponent(input.editSessionId)}/local-edit-plans`,
  ), {
    method: 'POST',
    headers: createHeaders({
      ...commonHeaders,
      'idempotency-key': createIdempotencyKey('local-edit-plan-approval'),
    }),
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      planId: input.approvedLocalPlan.planId,
      title: input.approvedLocalPlan.title,
      summary: input.approvedLocalPlan.summary,
      steps: input.approvedLocalPlan.steps,
      operationManifest: input.approvedLocalPlan.operationManifest,
      creditEstimate: input.approvedLocalPlan.creditEstimate,
      briefLineage: createProjectEditPlanBriefLineage({
        briefId: input.editBrief.id,
        briefText: input.editBrief.briefText,
        revisionNumber: input.editBrief.revisionNumber,
      }),
      source: {
        storageObjectRecordId: input.sourceVideoUploadResult.storageObjectRecordId,
        mediaAssetId: input.sourceVideoUploadResult.mediaAssetId,
        bucketName: input.sourceVideoUploadResult.bucketName,
        objectPath: input.sourceVideoUploadResult.objectPath,
        fileName: input.sourceVideoUploadResult.fileName,
        mimeType: input.sourceVideoUploadResult.mimeType,
        sizeBytes: input.sourceVideoUploadResult.sizeBytes,
        checksumSha256: input.sourceVideoUploadResult.checksumSha256,
      },
    }),
  }))
  const created = assertOk(createEnvelope, 'Backend-local edit plan approval failed.').localEditPlan
  if (!created.backendLocalPlanStored) {
    throw new Error('Backend-local edit plan approval did not return a stored plan record.')
  }

  const readbackEnvelope = await parseEnvelope<LocalEditPlanData>(await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/local-edit-plans/${encodeURIComponent(created.editPlanId)}?workspaceId=${encodeURIComponent(input.workspaceId)}`,
  ), {
    method: 'GET',
    headers: createHeaders({
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
  }))
  const readback = assertOk(readbackEnvelope, 'Backend-local edit plan readback failed.').localEditPlan

  if (
    readback.editPlanId !== created.editPlanId ||
    readback.workspaceId !== input.workspaceId ||
    !readback.backendLocalPlanStored
  ) {
    throw new Error('Backend-local edit plan readback did not match the approved plan.')
  }

  return {
    localEditPlan: {
      ...created,
      readbackVerified: true,
    },
    readback: {
      ...readback,
      readbackVerified: true,
    },
    warnings: [
      ...(createEnvelope.warnings ?? []),
      ...(readbackEnvelope.warnings ?? []),
      'Backend-local edit plan approval was read back before preview smoke; no provider, render, worker, Supabase, GCS, beta, or production work started.',
    ],
  }
}
