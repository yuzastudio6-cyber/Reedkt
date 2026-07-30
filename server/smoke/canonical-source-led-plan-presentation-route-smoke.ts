import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { readdir, readFile, rm } from 'node:fs/promises'
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
import type {
  KimiK3SourceLedChatAssistantPort,
} from '../services/kimi-k3-source-led-chat-assistant'

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
let kimiK3CallCount = 0
const kimiK3SourceLedChatAssistantPort:
KimiK3SourceLedChatAssistantPort = {
  async respond(input) {
    kimiK3CallCount += 1
    assert.equal(input.workspaceId, workspaceId)
    assert.equal(input.editSessionId, editSessionId)
    if (kimiK3CallCount === 1) {
      return {
        status: 'credential_unavailable',
        routeId: 'kimi_k3_primary',
        providerModel: 'kimi-k3',
        credentialSource: 'google_secret_manager_pinned_version',
        credentialVersion: null,
        providerCallMade: false,
        modelCallMade: false,
        attemptDigestSha256: createHash('sha256')
          .update(input.clientMessageId)
          .digest('hex'),
      }
    }
    return {
      status: 'completed',
      routeId: 'kimi_k3_primary',
      providerModel: 'kimi-k3',
      credentialSource: 'google_secret_manager_pinned_version',
      credentialVersion: 2,
      providerCallMade: true,
      modelCallMade: true,
      assistantContent:
        'I saved that direction for the next server-derived plan. No editing, generation, or credits started.',
      attemptDigestSha256: createHash('sha256')
        .update(input.clientMessageId)
        .digest('hex'),
      usage: {
        promptTokens: 120,
        completionTokens: 32,
        totalTokens: 152,
      },
    }
  },
}

await removeSmokeStorageRoot()
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
  kimiK3SourceLedChatAssistantPort,
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
  const chatUrl =
    `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
    '/source-led-chat'
  const prePreferenceChatResponse = await jsonRequest({
    url: `${chatUrl}?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(
    prePreferenceChatResponse.status,
    200,
    'An empty named-edit Chat must be readable while exact preferences initialize.',
  )
  assert.equal(
    record(
      prePreferenceChatResponse.json.data?.canonicalSourceLedChat,
    ).revision,
    0,
  )

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

  const emptyChatResponse = await jsonRequest({
    url: `${chatUrl}?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(
    emptyChatResponse.status,
    200,
    `Initial named-edit Chat read should succeed: ${JSON.stringify(emptyChatResponse.json)}`,
  )
  const emptyChat = record(
    emptyChatResponse.json.data?.canonicalSourceLedChat,
  )
  assert.equal(emptyChat.revision, 0)
  assert.deepEqual(emptyChat.exchanges, [])

  const chatDirection =
    'Preserve every complete explanation from the speaker and keep each confirmed caption exactly as written.'
  const appendChatResponse = await jsonRequest({
    url: chatUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-chat-direction',
    body: {
      workspaceId,
      purpose: 'append_named_edit_planning_direction',
      clientMessageId: 'source-led-route-chat-message-1',
      message: chatDirection,
    },
  })
  assert.equal(
    appendChatResponse.status,
    201,
    `Named-edit Chat append should succeed: ${JSON.stringify(appendChatResponse.json)}`,
  )
  const appendedChat = record(
    appendChatResponse.json.data?.canonicalSourceLedChat,
  )
  const appendedExchange = record(appendChatResponse.json.data?.exchange)
  const appendedEffect = record(appendedExchange.effect)
  assert.equal(appendedChat.revision, 1)
  assert.equal(appendedChat.providerModelCalled, false)
  assert.deepEqual(appendedChat.activeInstructionHistory, [])
  assert.equal(appendedExchange.revision, 1)
  assert.equal(record(appendedExchange.userMessage).content, chatDirection)
  assert.match(
    requiredString(
      record(appendedExchange.assistantMessage).content,
      'server Chat acknowledgement',
    ),
    /could not be verified/i,
  )
  assert.equal(appendedEffect.status, 'waiting_for_ai_response')
  assert.equal(appendedEffect.activeForPlanning, false)
  assert.equal(appendedEffect.draftPlanInvalidated, true)
  assert.equal(appendedEffect.executionStarted, false)
  assert.equal(appendedEffect.creditsReservedOrSpent, false)
  assert.deepEqual(record(appendedExchange.assistantRuntime), {
    source: 'kimi_k3',
    status: 'credential_unavailable',
    routeId: 'kimi_k3_primary',
    providerModel: 'kimi-k3',
    credentialSource: 'google_secret_manager_pinned_version',
    credentialVersion: null,
    providerCallMade: false,
    modelCallMade: false,
    attemptDigestSha256: createHash('sha256')
      .update('source-led-route-chat-message-1')
      .digest('hex'),
  })
  assert.equal(kimiK3CallCount, 1)
  assert.equal(appendChatResponse.json.data?.replayed, false)

  const retryChatResponse = await jsonRequest({
    url: chatUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-chat-direction-retry',
    body: {
      workspaceId,
      purpose: 'append_named_edit_planning_direction',
      clientMessageId: 'source-led-route-chat-message-1-retry',
      message: chatDirection,
    },
  })
  assert.equal(
    retryChatResponse.status,
    201,
    `Named-edit Chat retry should succeed: ${JSON.stringify(retryChatResponse.json)}`,
  )
  const retriedChat = record(
    retryChatResponse.json.data?.canonicalSourceLedChat,
  )
  const retriedExchange = record(retryChatResponse.json.data?.exchange)
  assert.equal(retriedChat.revision, 1)
  assert.equal(retriedChat.providerModelCalled, true)
  assert.equal(
    (retriedChat.exchanges as unknown[]).length,
    1,
  )
  assert.deepEqual(retriedChat.activeInstructionHistory, [chatDirection])
  assert.equal(retriedExchange.exchangeId, appendedExchange.exchangeId)
  assert.equal(
    retriedExchange.clientMessageId,
    'source-led-route-chat-message-1',
  )
  assert.equal(record(retriedExchange.userMessage).createdAt,
    record(appendedExchange.userMessage).createdAt)
  assert.equal(record(retriedExchange.effect).status, 'applied_to_next_plan')
  assert.equal(record(retriedExchange.effect).activeForPlanning, true)
  assert.deepEqual(record(retriedExchange.assistantRuntime), {
    source: 'kimi_k3',
    status: 'completed',
    routeId: 'kimi_k3_primary',
    providerModel: 'kimi-k3',
    credentialSource: 'google_secret_manager_pinned_version',
    credentialVersion: 2,
    providerCallMade: true,
    modelCallMade: true,
    attemptDigestSha256: createHash('sha256')
      .update('source-led-route-chat-message-1-retry')
      .digest('hex'),
    usage: {
      promptTokens: 120,
      completionTokens: 32,
      totalTokens: 152,
    },
  })
  assert.equal(kimiK3CallCount, 2)
  assert.equal(retryChatResponse.json.data?.replayed, false)

  const replayedChatResponse = await jsonRequest({
    url: chatUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-chat-direction',
    body: {
      workspaceId,
      purpose: 'append_named_edit_planning_direction',
      clientMessageId: 'source-led-route-chat-message-1',
      message: chatDirection,
    },
  })
  assert.equal(replayedChatResponse.status, 200)
  assert.equal(replayedChatResponse.json.data?.replayed, true)
  assert.equal(kimiK3CallCount, 2)
  assert.equal(
    record(
      replayedChatResponse.json.data?.canonicalSourceLedChat,
    ).revision,
    1,
  )

  const persistedChatResponse = await jsonRequest({
    url: `${chatUrl}?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(persistedChatResponse.status, 200)
  const persistedChat = record(
    persistedChatResponse.json.data?.canonicalSourceLedChat,
  )
  assert.equal(persistedChat.revision, 1)
  assert.deepEqual(persistedChat.activeInstructionHistory, [chatDirection])

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
      confirmedAspectRatio: '16:9',
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
      confirmedAspectRatio: '16:9',
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
  assert.equal(
    derivation.editDirectionAuthority,
    'server_reverified_chat_preferences_and_optional_edit_brief',
  )
  assert.equal(derivation.exactPreferenceAuthority, 'server_reverified_exact_edit_preferences')
  assert.equal(
    derivation.chatDirectionAuthority,
    'server_reverified_named_edit_chat',
  )
  assert.equal(derivation.chatDirectionCount, 1)
  assert.equal(derivation.chatThreadRevision, 1)
  assert.match(
    requiredString(
      derivation.chatDirectionAuthorityDigestSha256,
      'chat direction authority digest',
    ),
    /^[a-f0-9]{64}$/,
  )
  assert.equal(derivation.confirmedAspectRatio, '16:9')
  assert.equal(derivation.sourceObjectReread, true)
  assert.equal(derivation.sourceCount, 1)
  assert.equal(derivation.totalFrames, Math.round(durationSeconds * 30))
  assert.equal(derivation.captionCueCount, 1)
  assert.equal(derivation.requestAcceptedBrowserPlan, false)
  assert.equal(derivation.requestAcceptedBrowserTiming, false)
  assert.equal(derivation.requestAcceptedBrowserEstimate, false)
  assert.equal(derivation.requestAcceptedBrowserWorkGraph, false)
  assert.equal(derivation.chatDirectionReread, true)
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
  let journeyPlan = record(journey.plan)
  assert.equal(journeyPlan.status, 'presented')
  assert.equal(journey.approval, undefined)
  assert.equal(journey.execution, undefined)
  assert.equal(journey.review, undefined)

  const stalePlanId = requiredString(journeyPlan.planId, 'stale plan id')
  const secondChatDirection =
    'Keep the pacing calm and use only source-supported visual treatment.'
  const secondChatResponse = await jsonRequest({
    url: chatUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-chat-direction-2',
    body: {
      workspaceId,
      purpose: 'append_named_edit_planning_direction',
      clientMessageId: 'source-led-route-chat-message-2',
      message: secondChatDirection,
    },
  })
  assert.equal(
    secondChatResponse.status,
    201,
    `A new direction should invalidate the presented plan: ${JSON.stringify(secondChatResponse.json)}`,
  )
  assert.equal(
    record(
      secondChatResponse.json.data?.canonicalSourceLedChat,
    ).revision,
    2,
  )
  assert.equal(kimiK3CallCount, 3)

  const staleApprovalResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/edit-plans/${stalePlanId}` +
      '/canonical-approval',
    method: 'POST',
    idempotencyKey: 'source-led-route-stale-chat-plan-approval',
    body: {
      workspaceId,
      expectedProjectId: projectId,
      expectedEditSessionId: editSessionId,
      expectedPlanVersion: requiredPositiveInteger(
        journeyPlan.planVersion,
        'stale plan version',
      ),
      expectedPlanHash: requiredString(
        journeyPlan.planHash,
        'stale plan hash',
      ),
      expectedEstimateId: requiredString(
        journeyPlan.estimateId,
        'stale estimate id',
      ),
      expectedEstimateHash: requiredString(
        journeyPlan.estimateHash,
        'stale estimate hash',
      ),
      expectedMaximumCredits: requiredNonNegativeInteger(
        journeyPlan.approvedMaximumCredits,
        'stale approved maximum credits',
      ),
    },
  })
  assert.equal(staleApprovalResponse.status, 409)
  assert.equal(
    staleApprovalResponse.json.error?.code,
    'IDEMPOTENCY_CONFLICT',
  )
  assert.match(
    staleApprovalResponse.json.error?.message ?? '',
    /chat direction changed/i,
  )

  const refreshedPresentationResponse = await jsonRequest({
    url: presentationUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-present-after-chat-change',
    body: {
      workspaceId,
      purpose: 'present_server_derived_source_led_plan',
      orderedMediaAssetIds: [mediaAssetId],
      confirmedAspectRatio: '16:9',
      sourceOrderConfirmed: true,
      preserveUnanalyzedSourceRanges: true,
    },
  })
  assert.equal(
    refreshedPresentationResponse.status,
    201,
    `A fresh plan should bind the latest Chat revision: ${JSON.stringify(refreshedPresentationResponse.json)}`,
  )
  const refreshedPresentation = record(
    refreshedPresentationResponse.json.data
      ?.canonicalSourceLedPlanPresentation,
  )
  const refreshedDerivation = record(refreshedPresentation.derivation)
  assert.equal(refreshedDerivation.chatDirectionCount, 2)
  assert.equal(refreshedDerivation.chatThreadRevision, 2)

  const refreshedJourneyResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/canonical-journey?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(refreshedJourneyResponse.status, 200)
  const refreshedJourney = record(
    refreshedJourneyResponse.json.data?.canonicalEditJourney,
  )
  assert.equal(refreshedJourney.stage, 'plan_approval_required')
  journeyPlan = record(refreshedJourney.plan)
  assert.equal(journeyPlan.status, 'presented')
  assert.notEqual(
    requiredString(journeyPlan.planId, 'fresh plan id'),
    stalePlanId,
  )

  const approvalResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/edit-plans/${requiredString(journeyPlan.planId, 'plan id')}` +
      '/canonical-approval',
    method: 'POST',
    idempotencyKey: 'source-led-route-plan-approval',
    body: {
      workspaceId,
      expectedProjectId: projectId,
      expectedEditSessionId: editSessionId,
      expectedPlanVersion: requiredPositiveInteger(
        journeyPlan.planVersion,
        'plan version',
      ),
      expectedPlanHash: requiredString(journeyPlan.planHash, 'plan hash'),
      expectedEstimateId: requiredString(
        journeyPlan.estimateId,
        'estimate id',
      ),
      expectedEstimateHash: requiredString(
        journeyPlan.estimateHash,
        'estimate hash',
      ),
      expectedMaximumCredits: requiredNonNegativeInteger(
        journeyPlan.approvedMaximumCredits,
        'approved maximum credits',
      ),
    },
  })
  assert.equal(
    approvalResponse.status,
    201,
    `Canonical plan approval should succeed: ${JSON.stringify(approvalResponse.json)}`,
  )
  const approvalReceipt = record(
    approvalResponse.json.data?.canonicalPlanApproval,
  )
  assert.equal(approvalReceipt.schemaVersion, 'canonical-plan-approval-receipt-v1')
  const approval = record(approvalReceipt.approval)
  const approvalBoundaries = record(approvalReceipt.boundaries)
  assert.equal(approvalBoundaries.approvedSnapshotAvailable, true)
  assert.equal(approvalBoundaries.syntheticPrivateCreditReservation, true)
  assert.equal(approvalBoundaries.jobExecutionStarted, false)
  assert.equal(approvalBoundaries.toolExecutionStarted, false)
  assert.equal(approvalBoundaries.renderStarted, false)

  const approvedChatMutationResponse = await jsonRequest({
    url: chatUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-chat-after-approval',
    body: {
      workspaceId,
      purpose: 'append_named_edit_planning_direction',
      clientMessageId: 'source-led-route-chat-message-after-approval',
      message: 'Silently change the approved edit.',
    },
  })
  assert.equal(approvedChatMutationResponse.status, 409)
  assert.equal(
    approvedChatMutationResponse.json.error?.code,
    'PLAN_NOT_APPROVED',
  )

  const approvedJourneyResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/canonical-journey?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(approvedJourneyResponse.status, 200)
  const approvedJourney = record(
    approvedJourneyResponse.json.data?.canonicalEditJourney,
  )
  assert.equal(approvedJourney.stage, 'approved_snapshot_available')
  const approvedJourneyApproval = record(approvedJourney.approval)
  const snapshotId = requiredString(
    approvedJourneyApproval.snapshotId,
    'approved snapshot id',
  )
  const snapshotHash = requiredString(
    approvedJourneyApproval.snapshotHash,
    'approved snapshot hash',
  )
  assert.equal(snapshotId, approval.snapshotId)
  assert.equal(snapshotHash, approval.snapshotHash)

  const packageResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/approved-snapshots/${snapshotId}` +
      '/canonical-execution-package',
    method: 'POST',
    idempotencyKey: 'source-led-route-execution-package',
    body: {
      workspaceId,
      expectedProjectId: projectId,
      expectedEditSessionId: editSessionId,
      expectedSnapshotHash: snapshotHash,
      purpose: 'request_canonical_execution_package',
    },
  })
  assert.equal(
    packageResponse.status,
    201,
    `Canonical execution package should succeed: ${JSON.stringify(packageResponse.json)}`,
  )
  const packageReceipt = record(
    packageResponse.json.data?.canonicalExecutionPackageRequest,
  )
  assert.equal(
    packageReceipt.schemaVersion,
    'canonical-execution-package-request-receipt-v1',
  )
  const executionPackage = record(packageReceipt.executionPackage)
  const packageRecordId = requiredString(
    executionPackage.packageRecordId,
    'execution package record id',
  )
  const packageHash = requiredString(
    executionPackage.packageHash,
    'execution package hash',
  )
  const packageBoundaries = record(packageReceipt.boundaries)
  assert.equal(packageBoundaries.executionPackageAvailable, true)
  assert.equal(packageBoundaries.workGraphStarted, false)
  assert.equal(packageBoundaries.workerDispatchStarted, false)
  assert.equal(packageBoundaries.renderStarted, false)

  const privatePreparationStartedAt = Date.now()
  const privatePreparationResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/edit-executions/packages/${packageRecordId}` +
      '/canonical-private-edit-preparation',
    method: 'POST',
    idempotencyKey: 'source-led-route-private-edit-preparation',
    body: {
      workspaceId,
      expectedProjectId: projectId,
      expectedEditSessionId: editSessionId,
      expectedSnapshotId: snapshotId,
      expectedSnapshotHash: snapshotHash,
      expectedPackageHash: packageHash,
      purpose: 'prepare_canonical_private_edit_review',
    },
  })
  assert.equal(
    privatePreparationResponse.status,
    202,
    `Canonical private edit preparation should acknowledge asynchronous work: ${JSON.stringify(privatePreparationResponse.json)}`,
  )
  const privatePreparationAcknowledgementMs =
    Date.now() - privatePreparationStartedAt
  assert.ok(
    privatePreparationAcknowledgementMs < 15_000,
    `Private preparation acknowledgement took ${privatePreparationAcknowledgementMs}ms.`,
  )
  const privatePreparation = record(
    privatePreparationResponse.json.data?.canonicalPrivateEditPreparation,
  )
  assert.equal(
    privatePreparation.schemaVersion,
    'canonical-private-edit-preparation-receipt-v1',
  )
  const privatePreparationProgress = record(privatePreparation.progress)
  const privatePreparationReadiness = record(privatePreparation.readiness)
  assert.equal(privatePreparation.disposition, 'in_progress')
  assert.equal(privatePreparationProgress.totalJobCount, 5)
  assert.equal(
    privatePreparationReadiness.nextRequiredGate,
    'canonical_private_work_graph_advancement',
  )
  assert.equal(privatePreparationReadiness.productReady, false)
  assert.equal(privatePreparationReadiness.externalBetaReady, false)
  assert.equal(privatePreparationReadiness.productionReady, false)

  const privateReviewJourney = await waitForPrivateReviewJourney({
    journeyUrl:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/canonical-journey?workspaceId=${encodeURIComponent(workspaceId)}`,
    timeoutMs: 30 * 60 * 1_000,
  })
  const privateReview = record(privateReviewJourney.review)
  const reviewAssemblyId = requiredString(
    privateReview.reviewAssemblyId,
    'private review assembly id',
  )
  const reviewManifestSha256 = requiredString(
    privateReview.manifestSha256,
    'private review manifest hash',
  )
  const finalArtifactSha256 = requiredString(
    privateReview.finalArtifactSha256,
    'private review artifact hash',
  )
  const reviewMediaUrl = new URL(
    `/v1/edit-executions/private-review-assemblies/${reviewAssemblyId}/media`,
    baseUrl,
  )
  reviewMediaUrl.searchParams.set('workspaceId', workspaceId)
  reviewMediaUrl.searchParams.set('expectedProjectId', projectId)
  reviewMediaUrl.searchParams.set('expectedEditSessionId', editSessionId)
  reviewMediaUrl.searchParams.set('packageRecordId', packageRecordId)
  reviewMediaUrl.searchParams.set('expectedManifestSha256', reviewManifestSha256)
  reviewMediaUrl.searchParams.set('expectedFinalArtifactSha256', finalArtifactSha256)
  reviewMediaUrl.searchParams.set(
    'purpose',
    'read_canonical_private_review_media',
  )
  const reviewMediaResponse = await fetch(reviewMediaUrl, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-reeditpro-internal-token': internalServiceToken,
    },
  })
  if (reviewMediaResponse.status !== 200) {
    throw new Error(
      `Private review media should be readable: ${await reviewMediaResponse.text()}`,
    )
  }
  assert.match(
    reviewMediaResponse.headers.get('content-type') ?? '',
    /^video\/mp4\b/,
  )
  assert.equal(
    reviewMediaResponse.headers.get('x-reeditpro-artifact-sha256'),
    finalArtifactSha256,
  )
  assert.equal(
    reviewMediaResponse.headers.get('x-reeditpro-review-manifest-sha256'),
    reviewManifestSha256,
  )
  const reviewBytes = Buffer.from(await reviewMediaResponse.arrayBuffer())
  assert.ok(reviewBytes.byteLength > 0)
  assert.equal(reviewBytes.subarray(4, 8).toString('ascii'), 'ftyp')
  assert.equal(
    createHash('sha256').update(reviewBytes).digest('hex'),
    finalArtifactSha256,
  )
  assert.notEqual(finalArtifactSha256, checksumSha256)

  const revisedCaptionText = 'Revised professional source review'
  const revisionDecisionResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/edit-executions/private-review-assemblies/` +
      `${reviewAssemblyId}/canonical-decision`,
    method: 'POST',
    idempotencyKey: 'source-led-route-caption-revision-decision',
    body: {
      workspaceId,
      expectedProjectId: projectId,
      expectedEditSessionId: editSessionId,
      packageRecordId,
      expectedManifestSha256: reviewManifestSha256,
      expectedFinalArtifactSha256: finalArtifactSha256,
      purpose: 'record_canonical_private_review_decision',
      decision: 'request_revision',
      revisionIntent: {
        summary:
          'Replace the only confirmed caption with the exact revised caption text.',
        changeCategories: ['caption'],
        mustPreserve: [
          'source_order',
          'source_meaning',
          'important_clips',
          'approved_aspect_ratio',
          'edit_preferences',
          'edit_brief',
        ],
        captionReplacementText: revisedCaptionText,
        requiresReplanning: true,
        requiresFreshEstimateAndApproval: true,
      },
    },
  })
  assert.equal(
    revisionDecisionResponse.status,
    201,
    `Caption revision decision should succeed: ${JSON.stringify(revisionDecisionResponse.json)}`,
  )
  const revisionDecision = record(
    revisionDecisionResponse.json.data?.canonicalPrivateReviewDecision,
  )
  const revisionDecisionSummary = record(revisionDecision.decision)
  assert.equal(revisionDecisionSummary.value, 'request_revision')
  assert.equal(revisionDecisionSummary.revisionRequested, true)
  assert.equal(revisionDecisionSummary.requiresReplanning, true)
  assert.equal(
    revisionDecisionSummary.requiresFreshEstimateAndApproval,
    true,
  )

  const revisionJourneyResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/canonical-journey?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(revisionJourneyResponse.status, 200)
  const revisionJourney = record(
    revisionJourneyResponse.json.data?.canonicalEditJourney,
  )
  assert.equal(revisionJourney.stage, 'revision_requested')
  const priorReviewDecision = record(revisionJourney.review)
  assert.equal(priorReviewDecision.decision, 'request_revision')
  const revisionDecisionManifestSha256 = requiredString(
    priorReviewDecision.decisionManifestSha256,
    'revision decision manifest hash',
  )

  const revisionPresentationUrl =
    `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
    '/source-led-caption-revision-plan-presentations'
  const forgedRevisionResponse = await jsonRequest({
    url: revisionPresentationUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-reject-browser-revision-plan',
    body: {
      workspaceId,
      expectedPackageRecordId: packageRecordId,
      expectedReviewAssemblyId: reviewAssemblyId,
      expectedDecisionManifestSha256:
        revisionDecisionManifestSha256,
      expectedFinalArtifactSha256: finalArtifactSha256,
      purpose:
        'present_server_derived_source_led_caption_revision',
      canonicalPlan: { forged: true },
    },
  })
  assert.equal(
    forgedRevisionResponse.status,
    400,
    'The source-led revision route must reject browser-authored plans.',
  )
  assert.equal(
    forgedRevisionResponse.json.error?.code,
    'VALIDATION_FAILED',
  )

  const revisionPresentationResponse = await jsonRequest({
    url: revisionPresentationUrl,
    method: 'POST',
    idempotencyKey: 'source-led-route-present-caption-revision',
    body: {
      workspaceId,
      expectedPackageRecordId: packageRecordId,
      expectedReviewAssemblyId: reviewAssemblyId,
      expectedDecisionManifestSha256:
        revisionDecisionManifestSha256,
      expectedFinalArtifactSha256: finalArtifactSha256,
      purpose:
        'present_server_derived_source_led_caption_revision',
    },
  })
  assert.equal(
    revisionPresentationResponse.status,
    201,
    `Server-derived revision plan should succeed: ${JSON.stringify(revisionPresentationResponse.json)}`,
  )
  const revisionPresentation = record(
    revisionPresentationResponse.json.data
      ?.canonicalSourceLedCaptionRevisionPlanPresentation,
  )
  assert.equal(
    revisionPresentation.schemaVersion,
    'canonical-source-led-caption-revision-presentation-v1',
  )
  const revisionDerivation = record(revisionPresentation.derivation)
  assert.equal(revisionDerivation.exactRevisionDecisionReread, true)
  assert.equal(revisionDerivation.priorApprovedSnapshotReread, true)
  assert.equal(revisionDerivation.finalizedSourceObjectsReread, true)
  assert.equal(revisionDerivation.exactLockedPreferencesReread, true)
  assert.equal(revisionDerivation.immutableEditBriefReread, true)
  assert.equal(revisionDerivation.exactCaptionReplacementApplied, true)
  assert.equal(revisionDerivation.browserPlanAccepted, false)
  assert.equal(revisionDerivation.browserTimingAccepted, false)
  assert.equal(revisionDerivation.browserEstimateAccepted, false)
  assert.equal(revisionDerivation.browserWorkGraphAccepted, false)
  assert.equal(
    revisionDerivation.browserCaptionTextAcceptedAtPlanning,
    false,
  )

  const replacementJourneyResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/canonical-journey?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(replacementJourneyResponse.status, 200)
  const replacementJourney = record(
    replacementJourneyResponse.json.data?.canonicalEditJourney,
  )
  assert.equal(replacementJourney.stage, 'plan_approval_required')
  const replacementPlan = record(replacementJourney.plan)
  assert.equal(
    requiredPositiveInteger(
      replacementPlan.planVersion,
      'replacement plan version',
    ),
    requiredPositiveInteger(journeyPlan.planVersion, 'prior plan version') + 1,
  )
  assert.equal(replacementPlan.status, 'presented')
  assert.equal(replacementPlan.estimateStatus, 'presented')
  assert.equal(replacementJourney.approval, undefined)
  assert.equal(replacementJourney.execution, undefined)

  const replacementApprovalResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/edit-plans/` +
      `${requiredString(replacementPlan.planId, 'replacement plan id')}` +
      '/canonical-approval',
    method: 'POST',
    idempotencyKey: 'source-led-route-replacement-plan-approval',
    body: {
      workspaceId,
      expectedProjectId: projectId,
      expectedEditSessionId: editSessionId,
      expectedPlanVersion: requiredPositiveInteger(
        replacementPlan.planVersion,
        'replacement plan version',
      ),
      expectedPlanHash: requiredString(
        replacementPlan.planHash,
        'replacement plan hash',
      ),
      expectedEstimateId: requiredString(
        replacementPlan.estimateId,
        'replacement estimate id',
      ),
      expectedEstimateHash: requiredString(
        replacementPlan.estimateHash,
        'replacement estimate hash',
      ),
      expectedMaximumCredits: requiredNonNegativeInteger(
        replacementPlan.approvedMaximumCredits,
        'replacement maximum credits',
      ),
    },
  })
  assert.equal(
    replacementApprovalResponse.status,
    201,
    `Replacement approval should succeed: ${JSON.stringify(replacementApprovalResponse.json)}`,
  )

  const replacementApprovedJourneyResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/canonical-journey?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(replacementApprovedJourneyResponse.status, 200)
  const replacementApprovedJourney = record(
    replacementApprovedJourneyResponse.json.data?.canonicalEditJourney,
  )
  assert.equal(
    replacementApprovedJourney.stage,
    'approved_snapshot_available',
  )
  const replacementJourneyApproval = record(
    replacementApprovedJourney.approval,
  )
  const replacementSnapshotId = requiredString(
    replacementJourneyApproval.snapshotId,
    'replacement snapshot id',
  )
  const replacementSnapshotHash = requiredString(
    replacementJourneyApproval.snapshotHash,
    'replacement snapshot hash',
  )
  assert.notEqual(replacementSnapshotId, snapshotId)

  const replacementPackageResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/approved-snapshots/${replacementSnapshotId}` +
      '/canonical-execution-package',
    method: 'POST',
    idempotencyKey: 'source-led-route-replacement-execution-package',
    body: {
      workspaceId,
      expectedProjectId: projectId,
      expectedEditSessionId: editSessionId,
      expectedSnapshotHash: replacementSnapshotHash,
      purpose: 'request_canonical_execution_package',
    },
  })
  assert.equal(
    replacementPackageResponse.status,
    201,
    `Replacement execution package should succeed: ${JSON.stringify(replacementPackageResponse.json)}`,
  )
  const replacementPackageReceipt = record(
    replacementPackageResponse.json.data
      ?.canonicalExecutionPackageRequest,
  )
  const replacementExecutionPackage = record(
    replacementPackageReceipt.executionPackage,
  )
  const replacementPackageRecordId = requiredString(
    replacementExecutionPackage.packageRecordId,
    'replacement package record id',
  )
  const replacementPackageHash = requiredString(
    replacementExecutionPackage.packageHash,
    'replacement package hash',
  )
  assert.notEqual(replacementPackageRecordId, packageRecordId)

  const replacementPreparationStartedAt = Date.now()
  const replacementPreparationResponse = await jsonRequest({
    url:
      `${baseUrl}/v1/edit-executions/packages/` +
      `${replacementPackageRecordId}/canonical-private-edit-preparation`,
    method: 'POST',
    idempotencyKey: 'source-led-route-replacement-private-preparation',
    body: {
      workspaceId,
      expectedProjectId: projectId,
      expectedEditSessionId: editSessionId,
      expectedSnapshotId: replacementSnapshotId,
      expectedSnapshotHash: replacementSnapshotHash,
      expectedPackageHash: replacementPackageHash,
      purpose: 'prepare_canonical_private_edit_review',
    },
  })
  assert.equal(
    replacementPreparationResponse.status,
    202,
    `Replacement preparation should acknowledge asynchronous work: ${JSON.stringify(replacementPreparationResponse.json)}`,
  )
  const replacementPreparationAcknowledgementMs =
    Date.now() - replacementPreparationStartedAt
  assert.ok(replacementPreparationAcknowledgementMs < 15_000)

  const replacementReviewJourney = await waitForPrivateReviewJourney({
    journeyUrl:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/canonical-journey?workspaceId=${encodeURIComponent(workspaceId)}`,
    timeoutMs: 30 * 60 * 1_000,
  })
  const replacementReview = record(replacementReviewJourney.review)
  const replacementReviewAssemblyId = requiredString(
    replacementReview.reviewAssemblyId,
    'replacement review assembly id',
  )
  const replacementReviewManifestSha256 = requiredString(
    replacementReview.manifestSha256,
    'replacement review manifest hash',
  )
  const replacementFinalArtifactSha256 = requiredString(
    replacementReview.finalArtifactSha256,
    'replacement final artifact hash',
  )
  assert.notEqual(replacementReviewAssemblyId, reviewAssemblyId)
  assert.notEqual(replacementFinalArtifactSha256, finalArtifactSha256)

  const replacementReviewMediaUrl = new URL(
    `/v1/edit-executions/private-review-assemblies/` +
      `${replacementReviewAssemblyId}/media`,
    baseUrl,
  )
  replacementReviewMediaUrl.searchParams.set('workspaceId', workspaceId)
  replacementReviewMediaUrl.searchParams.set(
    'expectedProjectId',
    projectId,
  )
  replacementReviewMediaUrl.searchParams.set(
    'expectedEditSessionId',
    editSessionId,
  )
  replacementReviewMediaUrl.searchParams.set(
    'packageRecordId',
    replacementPackageRecordId,
  )
  replacementReviewMediaUrl.searchParams.set(
    'expectedManifestSha256',
    replacementReviewManifestSha256,
  )
  replacementReviewMediaUrl.searchParams.set(
    'expectedFinalArtifactSha256',
    replacementFinalArtifactSha256,
  )
  replacementReviewMediaUrl.searchParams.set(
    'purpose',
    'read_canonical_private_review_media',
  )
  const replacementReviewMediaResponse = await fetch(
    replacementReviewMediaUrl,
    {
      headers: { authorization: `Bearer ${accessToken}` },
    },
  )
  assert.equal(
    replacementReviewMediaResponse.status,
    200,
    'Replacement review must be browser-readable without internal-service credentials.',
  )
  const replacementReviewBytes = Buffer.from(
    await replacementReviewMediaResponse.arrayBuffer(),
  )
  assert.equal(
    createHash('sha256').update(replacementReviewBytes).digest('hex'),
    replacementFinalArtifactSha256,
  )
  assert.equal(
    replacementReviewBytes.subarray(4, 8).toString('ascii'),
    'ftyp',
  )

  const acceptanceResponse = await browserJsonRequest({
    url:
      `${baseUrl}/v1/edit-executions/private-review-assemblies/` +
      `${replacementReviewAssemblyId}/canonical-decision`,
    method: 'POST',
    idempotencyKey: 'source-led-route-replacement-review-accept',
    body: {
      workspaceId,
      expectedProjectId: projectId,
      expectedEditSessionId: editSessionId,
      packageRecordId: replacementPackageRecordId,
      expectedManifestSha256: replacementReviewManifestSha256,
      expectedFinalArtifactSha256:
        replacementFinalArtifactSha256,
      purpose: 'record_canonical_private_review_decision',
      decision: 'accept_private_internal_review',
    },
  })
  assert.equal(
    acceptanceResponse.status,
    201,
    `Replacement private review acceptance should succeed: ${JSON.stringify(acceptanceResponse.json)}`,
  )

  const acceptedJourneyResponse = await browserJsonRequest({
    url:
      `${baseUrl}/v1/projects/${projectId}/edit-sessions/${editSessionId}` +
      `/canonical-journey?workspaceId=${encodeURIComponent(workspaceId)}`,
    method: 'GET',
  })
  assert.equal(acceptedJourneyResponse.status, 200)
  const acceptedJourney = record(
    acceptedJourneyResponse.json.data?.canonicalEditJourney,
  )
  assert.equal(acceptedJourney.stage, 'private_review_accepted')
  const acceptedReview = record(acceptedJourney.review)
  assert.equal(
    acceptedReview.decision,
    'accept_private_internal_review',
  )
  const acceptedDownload = record(
    acceptedReview.acceptedFinalDownload,
  )
  assert.equal(acceptedDownload.method, 'GET')
  const acceptedDownloadQuery = record(acceptedDownload.query)
  const acceptedDownloadUrl = new URL(
    requiredString(
      acceptedDownload.routeTemplate,
      'accepted final-download route',
    ),
    baseUrl,
  )
  for (const [key, value] of Object.entries(acceptedDownloadQuery)) {
    acceptedDownloadUrl.searchParams.set(key, requiredString(
      value,
      `accepted final-download ${key}`,
    ))
  }
  const acceptedFinalResponse = await fetch(acceptedDownloadUrl, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (acceptedFinalResponse.status !== 200) {
    throw new Error(
      `Accepted final artifact should download: ${await acceptedFinalResponse.text()}`,
    )
  }
  assert.match(
    acceptedFinalResponse.headers.get('content-type') ?? '',
    /^video\/mp4\b/,
  )
  assert.equal(
    acceptedFinalResponse.headers.get('x-reeditpro-artifact-sha256'),
    replacementFinalArtifactSha256,
  )
  assert.equal(
    acceptedFinalResponse.headers.get('x-reeditpro-review-assembly-id'),
    replacementReviewAssemblyId,
  )
  assert.equal(
    acceptedFinalResponse.headers.get(
      'x-reeditpro-review-decision-manifest-sha256',
    ),
    acceptedReview.decisionManifestSha256,
  )
  const acceptedFinalBytes = Buffer.from(
    await acceptedFinalResponse.arrayBuffer(),
  )
  assert.equal(
    createHash('sha256').update(acceptedFinalBytes).digest('hex'),
    replacementFinalArtifactSha256,
  )
  assert.equal(
    acceptedFinalBytes.subarray(4, 8).toString('ascii'),
    'ftyp',
  )

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
    initialCanonicalJourneyStage: journey.stage,
    approvedSnapshotCreated: true,
    executionPackageCreated: true,
    privatePreparationDisposition: privatePreparation.disposition,
    privatePreparationAcknowledgementMs,
    privatePreparationProgress,
    privatePreparationReadiness,
    privateReview: {
      stage: privateReviewJourney.stage,
      reviewAssemblyId,
      manifestSha256: reviewManifestSha256,
      finalArtifactSha256,
      byteLength: reviewBytes.byteLength,
      mp4HeaderVerified: true,
    },
    revision: {
      decisionRecorded: true,
      browserPlanFieldsAccepted: false,
      exactCaptionReplacementApplied: true,
      replacementPlanVersion: replacementPlan.planVersion,
      freshSnapshotCreated: true,
      replacementReviewAssemblyId,
      replacementFinalArtifactSha256,
      replacementByteLength: replacementReviewBytes.byteLength,
    },
    acceptedFinalDownload: {
      stage: acceptedJourney.stage,
      exactAcceptedDecisionRequired: true,
      browserCredentialOnly: true,
      byteLength: acceptedFinalBytes.byteLength,
      sha256: replacementFinalArtifactSha256,
      mp4HeaderVerified: true,
    },
    productionDelivery: false,
  }))
} finally {
  await close(server)
  await removeSmokeStorageRoot()
}

async function waitForPrivateReviewJourney(input: {
  journeyUrl: string
  timeoutMs: number
}): Promise<Record<string, unknown>> {
  const deadline = Date.now() + input.timeoutMs
  let lastProgress = ''
  let blockedSince: number | undefined
  while (Date.now() < deadline) {
    const response = await jsonRequest({
      url: input.journeyUrl,
      method: 'GET',
    })
    assert.equal(
      response.status,
      200,
      `Canonical journey checkback should succeed: ${JSON.stringify(response.json)}`,
    )
    const journey = record(response.json.data?.canonicalEditJourney)
    if (journey.stage === 'private_review_ready') return journey

    const progress = journey.workGraphProgress &&
      typeof journey.workGraphProgress === 'object' &&
      !Array.isArray(journey.workGraphProgress)
      ? record(journey.workGraphProgress)
      : undefined
    const progressSummary = JSON.stringify({
      stage: journey.stage,
      status: progress?.status,
      completedJobCount: progress?.completedJobCount,
      pendingJobCount: progress?.pendingJobCount,
      capabilityBlockedJobCount: progress?.capabilityBlockedJobCount,
      dependencyBlockedJobCount: progress?.dependencyBlockedJobCount,
    })
    if (progressSummary !== lastProgress) {
      console.log(`Private review checkback: ${progressSummary}`)
      lastProgress = progressSummary
    }
    if (progress?.status === 'blocked_required_jobs') {
      blockedSince ??= Date.now()
      if (Date.now() - blockedSince >= 30_000) {
        const blockedRun = await readBlockedWorkGraphRunDiagnostic()
        throw new Error(
          `Canonical private work graph blocked: ${progressSummary}; ` +
          `outcomes=${JSON.stringify(blockedRun)}`,
        )
      }
    } else {
      blockedSince = undefined
    }
    await delay(2_000)
  }
  throw new Error(
    `Canonical private review did not become ready within ${input.timeoutMs}ms.`,
  )
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function readBlockedWorkGraphRunDiagnostic(): Promise<unknown> {
  const workGraphRoot = join(
    localStorageRoot,
    'private-internal',
    'canonical-work-graph-runs',
    'v1',
  )
  const adapterRoot = join(
    localStorageRoot,
    'private-internal',
    'canonical-job-execution-adapter',
    'v1',
  )
  const runFiles = (
    await Promise.all([workGraphRoot, adapterRoot].map(async (root) => {
      const entries = await readdir(root, { recursive: true, withFileTypes: true })
        .catch(() => [])
      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => join(entry.parentPath, entry.name))
    }))
  ).flat()
  const failures: unknown[] = []
  let outcomes: unknown[] = []
  for (const filePath of runFiles.reverse()) {
    const value = JSON.parse(await readFile(filePath, 'utf8')) as {
      failure?: {
        identity?: Record<string, unknown>
        failure?: Record<string, unknown>
      }
      response?: {
        jobs?: Array<Record<string, unknown>>
      }
    }
    if (value.failure?.failure) {
      failures.push({
        operationId: value.failure.identity?.operationId,
        category: value.failure.failure.category,
        originalCode: value.failure.failure.originalCode,
        executionState: value.failure.failure.executionState,
        attemptNumber: value.failure.failure.attemptNumber,
      })
    }
    if (Array.isArray(value.response?.jobs) && outcomes.length === 0) {
      outcomes = value.response.jobs.map((job) => ({
        workItemKey: job.workItemKey,
        status: job.status,
        blockerCode: job.blockerCode,
        requiredGate: job.requiredGate,
        failureCategory: job.failureCategory,
        retryDisposition: job.retryDisposition,
        attemptNumber: job.attemptNumber,
        remainingAttempts: job.remainingAttempts,
      }))
    }
  }
  return { outcomes, failures }
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

async function browserJsonRequest(input: {
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

async function removeSmokeStorageRoot(): Promise<void> {
  let lastError: unknown
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await rm(localStorageRoot, { force: true, recursive: true })
      return
    } catch (error) {
      lastError = error
      if ((error as NodeJS.ErrnoException).code !== 'ENOTEMPTY') throw error
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw lastError
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
  if (typeof value !== 'string') {
    throw new Error(`${label} should be a string.`)
  }
  assert.ok(value.length > 0, `${label} should not be empty.`)
  return value
}

function requiredPositiveNumber(value: unknown, label: string): number {
  if (typeof value !== 'number') {
    throw new Error(`${label} should be a number.`)
  }
  assert.ok(Number.isFinite(value) && value > 0, `${label} should be positive.`)
  return value
}

function requiredNonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number') {
    throw new Error(`${label} should be a number.`)
  }
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
