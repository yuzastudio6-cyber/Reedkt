import { getSupabaseClient } from '../backend/supabase/supabase-client'

export interface AutonomousPrivateReviewProgressView {
  stage: string
  label: string
  status: 'pending' | 'running' | 'completed' | 'blocked' | 'failed'
  completedAt?: string
}

export interface AutonomousPrivateReviewExecutionView {
  executionId: string
  planId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  status: 'queued' | 'running' | 'private_review_ready' | 'blocked' | 'failed'
  currentStage: string
  progressPercent: number
  progress: AutonomousPrivateReviewProgressView[]
  approvedPlanSnapshotId: string
  creditReservationId: string
  previewStorageObjectRecordId?: string
  previewMediaAssetId?: string
  outputBucketName?: string
  outputObjectPath?: string
  outputMimeType?: 'video/mp4'
  outputSizeBytes?: number
  outputChecksumSha256?: string
  durationSeconds?: number
  width?: number
  height?: number
  artifactManifestStorageObjectRecordId?: string
  qaReportStorageObjectRecordId?: string
  executedActivitySummary: string[]
  qaSummary?: {
    status: 'passed_technical_qa_pending_user_review'
    passedGateCount: number
    failedGateCount: 0
    userCreativeReviewRequired: true
  }
  privateArtifactsOnly: true
  publicDeliveryAllowed: false
  paidBillingMutationMade: false
  productReady: false
  error?: string
  startedAt: string
  completedAt?: string
  warnings: string[]
}

interface ApiEnvelope<T> {
  ok?: boolean
  data?: T
  error?: { message?: string }
}

export async function runAutonomousPrivateReview(input: {
  apiBaseUrl: string
  planId: string
  workspaceId: string
  onProgress?: (execution: AutonomousPrivateReviewExecutionView) => void
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
  pollIntervalMs?: number
  timeoutMs?: number
}): Promise<AutonomousPrivateReviewExecutionView> {
  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const headers = createHeaders(accessToken)
  const started = await requestExecution(fetchImpl, joinUrl(input.apiBaseUrl, `/v1/local-edit-plans/${encodeURIComponent(input.planId)}/private-review-executions`), {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'idempotency-key': createIdempotencyKey(input.planId) },
    body: JSON.stringify({ workspaceId: input.workspaceId }),
  })
  input.onProgress?.(started)
  if (isTerminal(started.status)) return assertCompleted(started)

  const startedAt = Date.now()
  const timeoutMs = input.timeoutMs ?? 20 * 60_000
  while (Date.now() - startedAt < timeoutMs) {
    await delay(input.pollIntervalMs ?? 1200)
    const execution = await requestExecution(fetchImpl, joinUrl(input.apiBaseUrl, `/v1/local-edit-plans/${encodeURIComponent(input.planId)}/private-review-execution?workspaceId=${encodeURIComponent(input.workspaceId)}`), {
      method: 'GET', headers,
    })
    input.onProgress?.(execution)
    if (isTerminal(execution.status)) return assertCompleted(execution)
  }
  throw new Error('Private review is still running. Refresh this edit to continue tracking it.')
}

export async function readAutonomousPrivateReview(input: {
  apiBaseUrl: string
  planId: string
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}): Promise<AutonomousPrivateReviewExecutionView> {
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  return requestExecution(input.fetchImpl ?? fetch, joinUrl(input.apiBaseUrl, `/v1/local-edit-plans/${encodeURIComponent(input.planId)}/private-review-execution?workspaceId=${encodeURIComponent(input.workspaceId)}`), {
    method: 'GET', headers: createHeaders(accessToken),
  })
}

async function requestExecution(fetchImpl: typeof fetch, url: string, init: RequestInit) {
  const response = await fetchImpl(url, init)
  const envelope = await response.json().catch(() => undefined) as ApiEnvelope<{ execution: AutonomousPrivateReviewExecutionView }> | undefined
  if (!response.ok || !envelope?.ok || !envelope.data?.execution) {
    throw new Error(envelope?.error?.message ?? `Private review request failed (${response.status}).`)
  }
  return envelope.data.execution
}

function assertCompleted(execution: AutonomousPrivateReviewExecutionView) {
  if (execution.status === 'private_review_ready') return execution
  throw new Error(execution.error ?? 'Private review stopped safely before completion.')
}

function isTerminal(status: AutonomousPrivateReviewExecutionView['status']) {
  return status === 'private_review_ready' || status === 'blocked' || status === 'failed'
}

async function getSupabaseAccessToken(): Promise<string | undefined> {
  const client = getSupabaseClient()
  if (!client) return undefined
  const { data } = await client.auth.getSession()
  return data.session?.access_token
}

function createHeaders(accessToken?: string): Record<string, string> {
  return accessToken ? { authorization: `Bearer ${accessToken}` } : {}
}

function createIdempotencyKey(planId: string): string {
  return `autonomous-private-review:${planId}:${Date.now().toString(36)}`
}

function joinUrl(baseUrl: string, route: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}
