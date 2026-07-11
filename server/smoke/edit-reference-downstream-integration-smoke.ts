import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import type {
  EditReferenceApiSuccess,
  EditReferenceDetailData,
  PreferenceApplicationTargetContextSnapshot,
} from '../../src/types/edit-reference'
import { createDefaultMockProjectEditSessionApiClient } from '../../src/lib/project-edit-session-api-client'
import type { ProjectEditSessionBundleRecord } from '../../src/types/project-edit-session-repository'
import {
  createPreferenceApplicationDownstreamContext,
  createPreferenceApplicationQAContextSummary,
  readConnectedPreferenceApplicationContext,
} from '../../src/lib/edit-reference-downstream-context'
import { createDefaultMockProjectEditBriefApiClient } from '../../src/lib/project-edit-brief-api-client'
import {
  getProjectEditBriefBundleViaApi,
  getProjectEditBriefForSessionViaApi,
} from '../../src/lib/project-edit-brief-api-client-adapter'
import { syncPreferenceApplicationContextToProjectEditBrief } from '../../src/lib/project-edit-brief-preference-application-ui-adapter'
import { createProjectEditBriefMarkerContextPackage } from '../../src/lib/project-edit-brief-marker-context-ui-adapter'
import { createProjectEditBriefPlannerInputPackage } from '../../src/lib/project-edit-brief-plan-rules'
import { createProjectEditBriefQAPackage } from '../../src/lib/project-edit-brief-qa-rules'
import { sendProjectEditBriefMarkerChatMessageViaApi } from '../../src/lib/project-edit-brief-marker-chat-ui-adapter'
import { createStagePreferenceApplicationPlan } from '../../src/backend/project-edit-session-preference/project-edit-session-preference-application-integration-service'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-gate6-'))
const workspaceId = 'workspace-edit-reference-downstream-integration'
const projectId = 'mock-project-edit-chat-foundation'
const editSessionId = 'edit-session-youtube-wide'

try {
  const runtime = await startRuntime(root)
  let referenceId = ''
  try {
    const created = await mutation<EditReferenceDetailData>(runtime.baseUrl, '/v1/edit-references', 'gate6-create', {
      workspaceId,
      name: 'Gate 6 target-aware editorial system',
      initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'audio_and_sfx', 'b_roll', 'graphics'],
    })
    referenceId = created.detail.reference.id
    const studyId = created.detail.study.id
    const evidence = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence`, 'gate6-evidence', {
      workspaceId,
      expectedStudyRevision: created.detail.study.revision,
      sourceType: 'manual_user_evidence',
      title: 'Bounded editorial guidance',
      category: 'all_goals',
      summary: 'Use clear story hierarchy, deliberate pacing, readable captions, restrained music, original graphics, and purposeful B-roll. Never copy exact shots, layouts, timing, music, sound effects, people, logos, or creator identity.',
      intendedUse: 'transferable',
    })
    const studied = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence-study`, 'gate6-study', {
      workspaceId,
      expectedStudyRevision: evidence.detail.study.revision,
    })
    const synthesized = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, 'gate6-dna', {
      workspaceId,
      expectedStudyRevision: studied.detail.study.revision,
    })
    const dna = synthesized.detail.dnaVersions[0]
    assert(dna)
    const quality = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/qa`, 'gate6-qa', {
      workspaceId,
      expectedStudyRevision: synthesized.detail.study.revision,
      expectedDNAContentDigest: dna.contentDigest,
    })
    const qa = quality.detail.dnaQaResults[0]
    assert(qa)
    const approved = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/approve`, 'gate6-approve', {
      workspaceId,
      expectedStudyRevision: quality.detail.study.revision,
      expectedDNAContentDigest: dna.contentDigest,
      qaResultId: qa.id,
      acknowledgeAdaptNotCopy: true,
      acknowledgeQAReview: qa.status === 'requires_user_review',
    })

    const sessionClient = createDefaultMockProjectEditSessionApiClient({ projectId, preserveMockSession: false })
    const bundleResponse = await sessionClient.bundle.get<{ bundle: ProjectEditSessionBundleRecord }>(editSessionId)
    const sessionBundle = bundleResponse.data?.bundle
    assert(sessionBundle)
    const targetContext: PreferenceApplicationTargetContextSnapshot = {
      projectId,
      editSessionId,
      projectName: 'Mock Project Edit Chat Foundation',
      editName: sessionBundle.session.name,
      sourceMode: 'voice_first',
      contentType: 'documentary',
      sourceSummary: 'Founder-story source clips with spoken narrative and supporting visuals.',
      currentUserInstruction: 'Keep the founder story clear, preserve truthful source context, and let confirmed Brief markers control local creative decisions.',
      selectedEditLevel: 'ultra_premium',
      aspectRatio: '16:9',
      outputFrameConfirmed: true,
      platformTarget: 'youtube_standard',
      storyRole: 'Build a credible founder story around the target source and its own evidence',
      budgetPreference: 'cinematic',
      directives: { captions: 'adapt', music: 'adapt', sfx: 'adapt', sourceOrder: 'preserve' },
      approvedConstraints: [
        'Current user instructions and confirmed Edit Brief markers outrank reusable Preference DNA.',
        'Do not copy reference-specific shots, layouts, timing, sound, or identity.',
      ],
    }
    const prepared = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/applications`, 'gate6-prepare', {
      workspaceId,
      expectedReferenceRevision: approved.detail.reference.revision,
      expectedDNAContentDigest: dna.contentDigest,
      acknowledgeAdaptNotCopy: true,
      targetContext,
    })
    const application = prepared.detail.applications.find((candidate) => candidate.editSessionId === editSessionId)
    assert(application)
    const stagedContext = createPreferenceApplicationDownstreamContext(application, 'staged_unconfirmed')
    const approvalResetPlan = createStagePreferenceApplicationPlan({
      application,
      context: stagedContext,
      currentSession: { ...sessionBundle.session, approvalStatus: 'approved' },
      outputFrameConfirmed: true,
    })
    assert.equal(approvalResetPlan.shouldResetApproval, true)
    assert.equal(approvalResetPlan.sessionUpdates.approvalStatus, 'reset_after_revision')
    const staged = await sessionClient.preference.stageApplication<{
      session: typeof sessionBundle.session
      targetSessionReceipt: import('../../src/types/edit-reference-integration').PreferenceApplicationTargetSessionReceipt
    }>({ editSessionId, application, context: stagedContext, outputFrameConfirmed: true })
    assert.equal(staged.ok, true)
    assert(staged.data?.targetSessionReceipt)
    assert.equal(staged.data?.session.approvalStatus, sessionBundle.session.approvalStatus)
    assert.equal(readConnectedPreferenceApplicationContext(staged.data?.session), undefined)

    const mismatch = await mutationError(runtime.baseUrl, `/v1/edit-reference-applications/${application.id}/connect`, 'gate6-connect-mismatch', {
      workspaceId,
      expectedReferenceRevision: prepared.detail.reference.revision,
      expectedApplicationContentDigest: application.contentDigest,
      targetSessionReceipt: { ...staged.data!.targetSessionReceipt, editSessionId: 'another-edit-session' },
    })
    assert.equal(mismatch.status, 409)
    assert.equal(mismatch.code, 'VALIDATION_FAILED')

    const connected = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-applications/${application.id}/connect`, 'gate6-connect', {
      workspaceId,
      expectedReferenceRevision: prepared.detail.reference.revision,
      expectedApplicationContentDigest: application.contentDigest,
      targetSessionReceipt: staged.data!.targetSessionReceipt,
    })
    const connectedApplication = connected.detail.applications.find((candidate) => candidate.id === application.id)
    assert(connectedApplication?.downstreamContext)
    assert.equal(connectedApplication.targetIdentityStatus, 'verified_mock_project_edit_session')
    assert.equal(connectedApplication.targetIntegrationStatus, 'connected')
    assert.equal(connectedApplication.targetEditMutationMade, true)
    assert.equal(connectedApplication.downstreamContextWritten, true)
    assert.equal(connectedApplication.approvedPlanMutationMade, false)
    assert.deepEqual(Object.values(connectedApplication.downstreamContext.safety), Array(Object.keys(connectedApplication.downstreamContext.safety).length).fill(false))

    const activated = await sessionClient.preference.activateApplication<{ session: typeof sessionBundle.session }>({
      editSessionId,
      application: connectedApplication,
    })
    assert.equal(activated.ok, true)
    const activeContext = readConnectedPreferenceApplicationContext(activated.data?.session)
    assert(activeContext)
    assert.equal(activeContext.applicationId, application.id)
    assert(activeContext.guidance.length > 0)
    assert(activeContext.heldBack.length > 0)
    assert.equal(activeContext.precedencePolicy[0], 'safety_platform_tier_frame_credit_or_approved_constraint')
    const tamperedSession = structuredClone(activated.data!.session) as typeof sessionBundle.session
    const tamperedIntegration = tamperedSession.metadata?.editReferencePreferenceIntegration as {
      context?: { safety?: { providerCallMade?: boolean } }
    } | undefined
    if (tamperedIntegration?.context?.safety) tamperedIntegration.context.safety.providerCallMade = true
    assert.equal(readConnectedPreferenceApplicationContext(tamperedSession), undefined)

    const briefClient = createDefaultMockProjectEditBriefApiClient({ projectId, preserveMockSession: false })
    const briefResult = await getProjectEditBriefForSessionViaApi(editSessionId, briefClient)
    assert(briefResult.brief)
    const synced = await syncPreferenceApplicationContextToProjectEditBrief({
      brief: briefResult.brief,
      client: briefClient,
      context: activeContext,
    })
    assert.equal(synced.changed, true)
    assert.equal((synced.brief?.metadata?.editReferencePreferenceApplicationContext as { packageHash?: string })?.packageHash, activeContext.packageHash)

    const briefBundleResult = await getProjectEditBriefBundleViaApi(briefResult.brief.id, briefClient)
    const briefBundle = briefBundleResult.bundle
    assert(briefBundle)
    const marker = briefBundle.markers.find((candidate) => candidate.status === 'confirmed') ?? briefBundle.markers[0]
    assert(marker)
    const markerContext = createProjectEditBriefMarkerContextPackage({
      projectId,
      editSessionId,
      briefId: briefResult.brief.id,
      marker,
      nearbyMarkers: briefBundle.markers,
      preferenceApplicationContext: activeContext,
    })
    assert.equal(markerContext.preferenceApplicationId, application.id)
    assert.equal(markerContext.preferenceApplicationContextHash, activeContext.packageHash)
    assert(markerContext.promptContextLines.some((line) => line.includes('Target-adapted Edit Reference')))
    assert(markerContext.preferenceApplicationGuidance.length > 0)

    const markerChat = await sendProjectEditBriefMarkerChatMessageViaApi({
      markerId: marker.id,
      messageText: 'Keep this marker’s confirmed direction and use the reusable style only where it supports that instruction.',
      preferenceApplicationContext: activeContext,
    }, briefClient)
    assert(markerChat?.ok)
    const markerContextFromMessage = markerChat.userMessage?.metadata?.markerContextPackage as { preferenceApplicationId?: string } | undefined
    assert.equal(markerContextFromMessage?.preferenceApplicationId, application.id)

    const planPackage = createProjectEditBriefPlannerInputPackage({
      bundle: briefBundle,
      exportSettings: briefBundle.exportSettings,
      preferenceApplicationContext: activeContext,
    })
    assert.equal(planPackage.preferenceApplicationId, application.id)
    assert(planPackage.preferenceGuidance.length > 0)
    assert(planPackage.preferenceGuidance.some((item) => item.status === 'held_back_by_confirmed_marker'))
    assert(planPackage.preferenceGuidance.every((item) => item.priority === 'edit_preference_dna'))

    const qaPackage = createProjectEditBriefQAPackage({
      bundle: briefBundle,
      exportSettings: briefBundle.exportSettings,
      preferenceApplicationContext: activeContext,
    })
    assert(qaPackage.preferenceApplicationQA)
    assert.notEqual(qaPackage.preferenceApplicationQA.status, 'blocked')
    assert.equal(qaPackage.preferenceApplicationQA.applicationId, application.id)
    const directQA = createPreferenceApplicationQAContextSummary({
      context: activeContext,
      projectId,
      editSessionId,
      markers: briefBundle.markers,
    })
    assert.match(directQA.prioritySummary, /confirmed Edit Brief markers/i)
    assert.equal(createPreferenceApplicationQAContextSummary({
      context: activeContext,
      projectId: 'another-project',
      editSessionId,
      markers: briefBundle.markers,
    }).status, 'blocked')

    const replay = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-applications/${application.id}/connect`, 'gate6-connect', {
      workspaceId,
      expectedReferenceRevision: prepared.detail.reference.revision,
      expectedApplicationContentDigest: application.contentDigest,
      targetSessionReceipt: staged.data!.targetSessionReceipt,
    })
    assert.deepEqual(replay, connected)
  } finally {
    await runtime.close()
  }

  const restarted = await startRuntime(root)
  try {
    const loaded = await get<EditReferenceDetailData>(restarted.baseUrl, `/v1/edit-references/${referenceId}?workspaceId=${workspaceId}`)
    const application = loaded.detail.applications.find((candidate) => candidate.editSessionId === editSessionId)
    assert.equal(application?.targetIntegrationStatus, 'connected')
    assert.equal(application?.downstreamContext?.integrationStatus, 'connected_mock')
    assert(application?.targetSessionReceipt)
  } finally {
    await restarted.close()
  }

  console.log('edit_reference_downstream_integration_passed')
} finally {
  await rm(root, { recursive: true, force: true })
}

async function startRuntime(localStorageRoot: string) {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test', API_PORT: '8787', E2E_RUNTIME_MODE: 'local', API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local', LOCAL_STORAGE_ROOT: localStorageRoot, PROVIDER_EXECUTION_ENABLED: 'false', WORKER_RUNTIME_MODE: 'mock',
  })
  const server = createReeditProApiApp(env).listen(0, '127.0.0.1')
  await new Promise<void>((resolvePromise, reject) => {
    server.once('listening', resolvePromise)
    server.once('error', reject)
  })
  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise())),
  }
}

async function mutation<T>(baseUrl: string, path: string, key: string, body: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as EditReferenceApiSuccess<T> | { error: { code: string; message: string } }
  assert.equal(response.ok, true, JSON.stringify(payload))
  assert('ok' in payload && payload.ok)
  return payload.data
}

async function mutationError(baseUrl: string, path: string, key: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as { error: { code: string } }
  return { status: response.status, code: payload.error.code }
}

async function get<T>(baseUrl: string, path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`)
  const payload = await response.json() as EditReferenceApiSuccess<T>
  assert.equal(response.ok, true, JSON.stringify(payload))
  return payload.data
}
