import { getSupabaseClient } from '../backend/supabase/supabase-client'

export interface ProjectSourceVideoLocalArtifactReviewInput {
  apiBaseUrl: string
  storageObjectRecordId: string
  workspaceId: string
  fetchImpl?: typeof fetch
  getAccessToken?: () => Promise<string | undefined>
}

export interface ProjectSourceVideoLocalArtifactReviewObject {
  objectUrl: string
  mimeType: string
  sizeBytes: number
  storageObjectRecordId: string
  createdAt: string
  localObjectRouteUsed: true
  signedUrlCreated: false
  publicDeliveryEnabled: false
  providerCallMade: false
  mediaProcessingStarted: false
  supabaseWriteMade: false
  gcsWriteMade: false
  productReady: false
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

function createHeaders(input: Record<string, string | undefined>): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(input)) {
    if (value) headers.set(key, value)
  }
  return headers
}

export async function loadProjectSourceVideoLocalArtifactForReview(
  input: ProjectSourceVideoLocalArtifactReviewInput,
): Promise<ProjectSourceVideoLocalArtifactReviewObject> {
  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await (input.getAccessToken ?? getSupabaseAccessToken)()
  const response = await fetchImpl(joinUrl(
    input.apiBaseUrl,
    `/v1/storage-objects/${encodeURIComponent(input.storageObjectRecordId)}/local-object?workspaceId=${encodeURIComponent(input.workspaceId)}`,
  ), {
    method: 'GET',
    headers: createHeaders({
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    }),
  })

  if (!response.ok) {
    throw new Error(`Private artifact review fetch failed with status ${response.status}.`)
  }

  const blob = await response.blob()
  if (blob.size <= 0) {
    throw new Error('Private artifact review returned an empty object.')
  }

  return {
    objectUrl: URL.createObjectURL(blob),
    mimeType: blob.type || response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream',
    sizeBytes: blob.size,
    storageObjectRecordId: input.storageObjectRecordId,
    createdAt: new Date().toISOString(),
    localObjectRouteUsed: true,
    signedUrlCreated: false,
    publicDeliveryEnabled: false,
    providerCallMade: false,
    mediaProcessingStarted: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
  }
}

export function revokeProjectSourceVideoLocalArtifactReviewObject(
  object: ProjectSourceVideoLocalArtifactReviewObject | undefined,
): void {
  if (object?.objectUrl) URL.revokeObjectURL(object.objectUrl)
}
