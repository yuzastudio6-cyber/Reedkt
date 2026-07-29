import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { SupabaseClient, User } from '@supabase/supabase-js'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import {
  clearPrivateEditAuthorityProcessStateForSmoke,
} from '../services/private-edit-authority-store'
import {
  clearPrivateExactEditPreferenceProcessStateForSmoke,
} from '../services/private-exact-edit-preference-store'
import {
  clearLocalProjectMemoryForSmoke,
} from '../services/project-service'

type JsonEnvelope = {
  data?: Record<string, unknown>
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
  warnings?: string[]
}

type JsonResponse = {
  status: number
  json: JsonEnvelope
}

const localStorageRoot =
  '/tmp/reeditpro-canonical-source-led-plan-presentation-route-smoke'
const workspaceId = 'workspace-source-led-route-smoke'
const editSessionId = 'edit-session-source-led-route-smoke'
const userId = 'user-source-led-route-smoke'
const accessToken = 'verified-source-led-route-token'
const internalServiceToken = 'source-led-route-internal-token-7Gk2Wm9Q'

await rm(localStorageRoot, { force: true, recursive: true })
clearLocalProjectMemoryForSmoke()
clearPrivateEditAuthorityProcessStateForSmoke()
clearPrivateExactEditPreferenceProcessStateForSmoke()

const sourceFixture = await createSyntheticMp4Fixture({
  localStorageRoot,
  outputPath: join(localStorageRoot, 'fixtures', 'actual-upload.mp4'),
  durationSeconds: 2,
  width: 320,
  height: 180,
  includeAudio: true,
})
assert.equal(
  sourceFixture.available,
  true,
  `Actual MP4 fixture should be available: ${sourceFixture.warnings.join('; ')}`,
)
assert.ok(sourceFixture.outputPath)
const sourceBytes = await readFile(sourceFixture.outputPath)
assert.ok(sourceBytes.byteLength > 0)

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: 'https://source-led-route-smoke.supabase.co',
  SUPABASE_ANON_KEY: 'source-led-route-smoke-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'source-led-route-smoke-service-role',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalServiceToken,
})
const routeUser = {
  id: userId,
  email: 'source-led-route-smoke@weeditpro.local',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
} as User
const server = await listen(createServer(createReeditProApiApp(env, {
  clients: {
    admin: createMembershipAdminClient([
      { workspaceId, userId, role: 'owner' },
    ]),
    public: createPublicAuthClient(new Map([[accessToken, routeUser]])),
  },
})))

try {
  const baseUrl = `http://127.0.0.1:${addressPort(server)}`
  const projectResponse = await jsonRequest({
    url: `${baseUrl}/v1/projects`,
    method: 'POST',
    idempotencyKey: 'source-led-route-project',
    body: {
      workspaceId,
      name: 'Server-derived actual upload edit',
    },
  })
  assert.equal(
    projectResponse.status,
    201,
    `Project creation should succeed: ${JSON.stringify(projectResponse.json)}`,
  )
  const project = record(projectResponse.json.data?.project)
  const projectId = requiredString(project.id, 'project id')

  const uploadIntentResponse = await jsonRequest({
    url: `${baseUrl}/v1/projects/${projectId}/upload-intents`,
    method: 'POST',
    idempotencyKey: 'source-led-route-upload-intent',
    body: {
      workspaceId,
      uploadPurpose: 'source_media',
      originalFileName: 'actual-upload.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: sourceBytes.byteLength,
    },
  })
  assert.equal(
    uploadIntentResponse.status,
    201,
    `Upload intent should succeed: ${JSON.stringify(uploadIntentResponse.json)}`,
  )
  const uploadIntent = record(uploadIntentResponse.json.data?.uploadIntent)
  const uploadTarget = record(uploadIntentResponse.json.data?.uploadTarget)
  const uploadIntentId = requiredString(uploadIntent.id, 'upload intent id')
  const uploadUrl = requiredString(uploadTarget.uploadUrl, 'upload URL')

  const objectUploadResponse = await fetch(resolveBackendUrl(baseUrl, uploadUrl), {
    method: 'PUT',
    headers: {
      'content-type': 'video/mp4',
      authorization: `Bearer ${accessToken}`,
    },
    body: sourceBytes as unknown as BodyInit,
  })
  assert.equal(
    objectUploadResponse.status,
    201,
    `Actual MP4 byte upload should succeed: ${await objectUploadResponse.text()}`,
  )

  const finalizeResponse = await jsonRequest({
    url: `${baseUrl}/v1/upload-intents/${uploadIntentId}/finalize`,
    method: 'POST',
    idempotencyKey: 'source-led-route-finalize',
    body: {
      workspaceId,
      sizeBytes: sourceBytes.byteLength,
    },
  })
  assert.equal(
    finalizeResponse.status,
    201,
    `Upload finalization should succeed: ${JSON.stringify(finalizeResponse.json)}`,
  )
  const mediaAsset = record(finalizeResponse.json.data?.mediaAsset)
  const mediaAssetId = requiredString(mediaAsset.id, 'media asset id')
  const checksumSha256 = requiredString(
    mediaAsset.checksumSha256,
    'media asset checksum',
  )
  const sourceMetadata = record(mediaAsset.sourceMetadata)
  const durationSeconds = requiredPositiveNumber(
    sourceMetadata.durationSeconds,
    'FFprobe duration',
  )
  assert.equal(mediaAsset.storageProvider, 'local_private')
  assert.equal(sourceMetadata.probeStatus, 'probed')
  assert.equal(sourceMetadata.hasVideo, true)
  assert.equal(sourceMetadata.hasAudio, true)
  assert.equal(sourceMetadata.width, 320)
  assert.equal(sourceMetadata.height, 180)
  assert.match(checksumSha256, /^[a-f0-9]{64}$/)

  const preferenceInitializeResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      '/edit-preferences/initialize',
    method: 'POST',
    idempotencyKey: 'source-led-route-preferences-initialize',
    body: { workspaceId },
  })
  assert.equal(
    preferenceInitializeResponse.status,
    201,
    `Exact preference initialization should succeed: ${JSON.stringify(preferenceInitializeResponse.json)}`,
  )
  const initializedPreference = record(
    preferenceInitializeResponse.json.data?.preferenceRecord,
  )

  const preferenceUpdateResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      '/edit-preferences',
    method: 'PATCH',
    idempotencyKey: 'source-led-route-preferences-update',
    body: {
      workspaceId,
      expectedRevision: requiredNonNegativeInteger(
        initializedPreference.recordRevision,
        'initialized preference revision',
      ),
      patch: {
        editLevel: 'basic',
        workflowType: 'simple_clean_edit',
        cleanupPreference: 'preserve_natural',
        visualPreference: 'no_extra_visuals',
        moodStyle: 'clean',
        creditPreference: 'balanced',
        targetPlatform: 'youtube',
      },
    },
  })
  assert.equal(
    preferenceUpdateResponse.status,
    200,
    `Exact preference update should succeed: ${JSON.stringify(preferenceUpdateResponse.json)}`,
  )
  const updatedPreference = record(
    preferenceUpdateResponse.json.data?.preferenceRecord,
  )

  const sourcePreparationEvidenceHash = createHash('sha256')
    .update(JSON.stringify({
      mediaAssetId,
      checksumSha256,
      sourceMetadata,
    }))
    .digest('hex')
  const preferenceEvidenceResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      '/edit-preferences/planning-evidence',
    method: 'PUT',
    idempotencyKey: 'source-led-route-preferences-evidence',
    body: {
      workspaceId,
      expectedRevision: requiredNonNegativeInteger(
        updatedPreference.recordRevision,
        'updated preference revision',
      ),
      sourcePreparation: {
        status: 'ready',
        evidenceHash: sourcePreparationEvidenceHash,
      },
      frameConfirmation: {
        status: 'confirmed',
        aspectRatio: '16:9',
        confirmationId: 'source-led-route-frame-confirmation',
      },
    },
  })
  assert.equal(
    preferenceEvidenceResponse.status,
    200,
    `Exact planning evidence should succeed: ${JSON.stringify(preferenceEvidenceResponse.json)}`,
  )
  const evidencedPreference = record(
    preferenceEvidenceResponse.json.data?.preferenceRecord,
  )
  const planning = record(evidencedPreference.planning)
  const frameConfirmation = record(planning.frameConfirmation)
  assert.equal(frameConfirmation.status, 'confirmed')
  assert.equal(frameConfirmation.aspectRatio, '16:9')

  const briefCreateResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      '/edit-brief',
    method: 'POST',
    idempotencyKey: 'source-led-route-brief-create',
    body: {
      workspaceId,
      expectedRevision: 0,
      brief: {
        goal:
          'Create a clean professional source-led edit while preserving the complete uploaded video.',
        deliverable: 'One private review-ready horizontal edit plan.',
        mustIncludeNotes: ['Preserve the uploaded speaker and source audio.'],
        avoidNotes: [
          'Do not infer cuts, transcript text, generated visuals, music, or sound effects.',
        ],
        targetPlatforms: ['youtube'],
        targetDurationMs: Math.round(durationSeconds * 1_000),
        pacingPreference: 'natural',
        captionPreference: 'minimal',
        musicPreference: 'none',
        status: 'ready',
      },
    },
  })
  assert.equal(
    briefCreateResponse.status,
    201,
    `Edit Brief creation should succeed: ${JSON.stringify(briefCreateResponse.json)}`,
  )
  const briefRevision = requiredPositiveInteger(
    briefCreateResponse.json.data?.aggregateRevision,
    'brief aggregate revision',
  )

  const markerCreateResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      '/edit-brief/markers',
    method: 'POST',
    idempotencyKey: 'source-led-route-caption-create',
    body: {
      workspaceId,
      expectedRevision: briefRevision,
      marker: {
        markerType: 'caption',
        timeKind: 'range',
        startSeconds: 0,
        endSeconds: durationSeconds,
        priority: 'must_follow',
        title: 'Confirmed exact review caption',
        note: 'Professional source review',
      },
    },
  })
  assert.equal(
    markerCreateResponse.status,
    201,
    `Caption marker creation should succeed: ${JSON.stringify(markerCreateResponse.json)}`,
  )
  const captionMarker = record(markerCreateResponse.json.data?.marker)
  const markerId = requiredString(captionMarker.id, 'caption marker id')
  assert.equal(captionMarker.timingStatus, 'display_seconds_only')

  const markerConfirmResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/edit-brief/markers/${markerId}/confirm`,
    method: 'POST',
    idempotencyKey: 'source-led-route-caption-confirm',
    body: {
      workspaceId,
      expectedRevision: requiredPositiveInteger(
        markerCreateResponse.json.data?.aggregateRevision,
        'marker aggregate revision',
      ),
    },
  })
  assert.equal(
    markerConfirmResponse.status,
    200,
    `Caption marker confirmation should succeed: ${JSON.stringify(markerConfirmResponse.json)}`,
  )
  assert.equal(record(markerConfirmResponse.json.data?.marker).status, 'confirmed')

  const presentationUrl =
    `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
    '/source-led-plan-presentations'
  const planShapedRequestResponse = await jsonRequest({
    url: presentationUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-reject-browser-plan',
    body: {
      workspaceId,
      purpose: 'present_server_derived_source_led_plan',
      orderedMediaAssetIds: [mediaAssetId],
      sourceOrderConfirmed: true,
      preserveUnanalyzedSourceRanges: true,
      canonicalPlan: { forged: true },
    },
  })
  assert.equal(
    planShapedRequestResponse.status,
    400,
    'The route must reject browser-authored plan-shaped fields.',
  )
  assert.equal(planShapedRequestResponse.json.error?.code, 'VALIDATION_FAILED')

  const presentationResponse = await jsonRequest({
    url: presentationUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-present',
    body: {
      workspaceId,
      purpose: 'present_server_derived_source_led_plan',
      orderedMediaAssetIds: [mediaAssetId],
      sourceOrderConfirmed: true,
      preserveUnanalyzedSourceRanges: true,
    },
  })
  assert.equal(
    presentationResponse.status,
    201,
    `Server plan presentation should succeed: ${JSON.stringify(presentationResponse.json)}`,
  )
  const presentation = record(
    presentationResponse.json.data?.canonicalSourceLedPlanPresentation,
  )
  assert.equal(
    presentation.schemaVersion,
    'canonical-source-led-plan-presentation-v1',
  )
  const derivation = record(presentation.derivation)
  assert.equal(derivation.sourceMetadataAuthority, 'server_reverified_finalized_upload_ffprobe')
  assert.equal(derivation.editDirectionAuthority, 'server_reverified_ready_edit_brief')
  assert.equal(derivation.exactPreferenceAuthority, 'server_reverified_exact_edit_preferences')
  assert.equal(derivation.sourceObjectReread, true)
  assert.equal(derivation.sourceCount, 1)
  assert.equal(derivation.totalFrames, Math.round(durationSeconds * 30))
  assert.equal(derivation.captionCueCount, 1)
  assert.equal(derivation.requestAcceptedBrowserPlan, false)
  assert.equal(derivation.requestAcceptedBrowserTiming, false)
  assert.equal(derivation.requestAcceptedBrowserEstimate, false)
  assert.equal(derivation.requestAcceptedBrowserWorkGraph, false)
  const publicationRequest = record(presentation.publicationRequest)
  assert.equal(publicationRequest.publicationStatus, 'published')
  const permissions = record(presentation.permissions)
  assert.equal(permissions.planPresentedForReview, true)
  assert.equal(permissions.approvalGranted, false)
  assert.equal(permissions.snapshotCreated, false)
  assert.equal(permissions.creditReserved, false)
  assert.equal(permissions.toolExecution, false)
  assert.equal(permissions.providerCall, false)
  assert.equal(permissions.render, false)
  assert.equal(permissions.delivery, false)

  const journeyResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/canonical-journey?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(
    journeyResponse.status,
    200,
    `Canonical journey recovery should succeed: ${JSON.stringify(journeyResponse.json)}`,
  )
  const journey = record(journeyResponse.json.data?.canonicalEditJourney)
  assert.equal(journey.stage, 'plan_approval_required')
  const nextAction = record(journey.nextAction)
  assert.equal(nextAction.code, 'approve_canonical_plan')
  assert.equal(record(journey.plan).status, 'presented')
  assert.equal(journey.approval, undefined)
  assert.equal(journey.execution, undefined)
  assert.equal(journey.review, undefined)

  console.log(JSON.stringify({
    ok: true,
    actualUploadedBytes: sourceBytes.byteLength,
    actualUploadSha256: checksumSha256,
    ffprobe: {
      durationSeconds,
      width: sourceMetadata.width,
      height: sourceMetadata.height,
      hasAudio: sourceMetadata.hasAudio,
    },
    sourceCount: derivation.sourceCount,
    totalFrames: derivation.totalFrames,
    captionCueCount: derivation.captionCueCount,
    browserPlanFieldsAccepted: false,
    canonicalJourneyStage: journey.stage,
    approvalGranted: false,
    toolExecution: false,
    render: false,
    delivery: false,
  }))
} finally {
  await close(server)
  await rm(localStorageRoot, { force: true, recursive: true })
}

async function jsonRequest(input: {
  url: string
  method: 'GET' | 'POST' | 'PATCH' | 'PUT'
  body?: unknown
  idempotencyKey?: string
}): Promise<JsonResponse> {
  const response = await fetch(input.url, {
    method: input.method,
    headers: {
      ...(input.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(input.idempotencyKey
        ? { 'idempotency-key': input.idempotencyKey }
        : {}),
      authorization: `Bearer ${accessToken}`,
      'x-reeditpro-internal-token': internalServiceToken,
    },
    ...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }),
  })
  return {
    status: response.status,
    json: await response.json() as JsonEnvelope,
  }
}

function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

function addressPort(server: Server): number {
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Expected a TCP server address.')
  }
  return address.port
}

function resolveBackendUrl(baseUrl: string, route: string): string {
  return route.startsWith('http') ? route : `${baseUrl}${route}`
}

function record(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function requiredString(value: unknown, label: string): string {
  assert.equal(typeof value, 'string', `${label} should be a string.`)
  assert.ok(value.length > 0, `${label} should not be empty.`)
  return value
}

function requiredPositiveNumber(value: unknown, label: string): number {
  assert.equal(typeof value, 'number', `${label} should be a number.`)
  assert.ok(Number.isFinite(value) && value > 0, `${label} should be positive.`)
  return value
}

function requiredNonNegativeInteger(value: unknown, label: string): number {
  assert.equal(typeof value, 'number', `${label} should be a number.`)
  assert.ok(
    Number.isInteger(value) && value >= 0,
    `${label} should be a non-negative integer.`,
  )
  return value
}

function requiredPositiveInteger(value: unknown, label: string): number {
  const parsed = requiredNonNegativeInteger(value, label)
  assert.ok(parsed > 0, `${label} should be positive.`)
  return parsed
}

function createMembershipAdminClient(
  memberships: Array<{ workspaceId: string; userId: string; role: string }>,
): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') {
        throw new Error(`Unexpected source-led route smoke table: ${tableName}`)
      }
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() {
          return query
        },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const membership = memberships.find((candidate) =>
            candidate.workspaceId === selectedWorkspaceId
            && candidate.userId === selectedUserId)
          return {
            data: membership
              ? {
                  workspace_id: membership.workspaceId,
                  user_id: membership.userId,
                  role: membership.role,
                }
              : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}

function createPublicAuthClient(
  usersByToken: Map<string, User>,
): SupabaseClient {
  return {
    auth: {
      async getUser(token: string) {
        const user = usersByToken.get(token)
        return {
          data: { user: user ?? null },
          error: user ? null : { message: 'invalid source-led route token' },
        }
      },
    },
  } as unknown as SupabaseClient
}
