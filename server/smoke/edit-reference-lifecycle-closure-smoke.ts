import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { editReferenceScopeHash } from '../edit-references/private-edit-reference-repository'
import type {
  EditReferenceApiSuccess,
  EditReferenceDetailData,
  PreferenceApplicationListData,
  PreferenceApplicationRecord,
} from '../../src/types/edit-reference'
import type {
  PreferenceApplicationDownstreamInvalidationReceipt,
  PreferenceApplicationTargetSessionReceipt,
} from '../../src/types/edit-reference-integration'
import { createDefaultMockProjectEditSessionApiClient } from '../../src/lib/project-edit-session-api-client'
import type { ProjectEditSessionBundleRecord } from '../../src/types/project-edit-session-repository'
import {
  createPreferenceApplicationDownstreamContext,
  readConnectedPreferenceApplicationContext,
} from '../../src/lib/edit-reference-downstream-context'
import { createPreferenceApplicationTargetContext } from '../../src/lib/project-edit-session-edit-reference-integration'
import { createDefaultMockProjectEditBriefApiClient } from '../../src/lib/project-edit-brief-api-client'
import { getProjectEditBriefForSessionViaApi } from '../../src/lib/project-edit-brief-api-client-adapter'
import {
  clearPreferenceApplicationContextFromProjectEditBrief,
  readPreferenceApplicationContextFromEditBrief,
  syncPreferenceApplicationContextToProjectEditBrief,
} from '../../src/lib/project-edit-brief-preference-application-ui-adapter'
import { createInvalidatePreferenceApplicationPlan } from '../../src/backend/project-edit-session-preference/project-edit-session-preference-application-integration-service'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-gate7-'))
const workspaceId = 'workspace-edit-reference-lifecycle-closure'
const ownerUserId = 'mock-user-runtime'
const projectId = 'mock-project-edit-chat-foundation'
const editSessionId = 'edit-session-approved-preview'

try {
  const runtime = await startRuntime(root)
  let firstReferenceId = ''
  let secondReferenceId = ''
  try {
    const first = await createApprovedReference(runtime.baseUrl, 'gate7-first', 'Measured documentary language')
    const second = await createApprovedReference(runtime.baseUrl, 'gate7-second', 'Restrained editorial clarity')
    firstReferenceId = first.detail.reference.id
    secondReferenceId = second.detail.reference.id

    const sessionClient = createDefaultMockProjectEditSessionApiClient({ projectId, preserveMockSession: false })
    const initialBundle = await sessionClient.bundle.get<{ bundle: ProjectEditSessionBundleRecord }>(editSessionId)
    assert(initialBundle.data?.bundle)
    const targetContext = createPreferenceApplicationTargetContext({
      bundle: initialBundle.data.bundle,
      currentUserInstruction: 'Protect the approved story, keep the wide frame, and use reusable style only where it supports confirmed markers.',
      outputFrameConfirmed: true,
    })

    const firstDNA = approvedDNA(first)
    const firstPrepared = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${first.detail.study.id}/preference-dna/${firstDNA.id}/applications`, 'gate7-first-prepare', {
      workspaceId,
      expectedReferenceRevision: first.detail.reference.revision,
      expectedDNAContentDigest: firstDNA.contentDigest,
      acknowledgeAdaptNotCopy: true,
      targetContext,
    })
    const firstApplication = requireApplication(firstPrepared, editSessionId)
    const firstConnected = await connectApplication(runtime.baseUrl, sessionClient, firstPrepared, firstApplication, 'gate7-first')
    assert(readConnectedPreferenceApplicationContext(firstConnected.session))
    const approvalResetPlan = createInvalidatePreferenceApplicationPlan({
      application: firstConnected.application,
      currentSession: { ...firstConnected.session, approvalStatus: 'approved' },
      reason: 'replace',
    })
    assert.equal(approvalResetPlan.shouldResetApproval, true)
    assert.equal(approvalResetPlan.sessionUpdates.approvalStatus, 'reset_after_revision')
    assert.equal(approvalResetPlan.safety.approvedPlanMutationMade, false)

    const firstCurrent = await get<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-references/${firstReferenceId}?workspaceId=${workspaceId}`)
    const firstCurrentApplication = requireApplication(firstCurrent, editSessionId)
    const invalidatedForReplacement = await sessionClient.preference.invalidateApplication<{
      invalidationReceipt: PreferenceApplicationDownstreamInvalidationReceipt
      session: ProjectEditSessionBundleRecord['session']
    }>({ editSessionId, application: firstCurrentApplication, reason: 'replace' })
    const replaceReceipt = invalidatedForReplacement.data?.invalidationReceipt
    assert(invalidatedForReplacement.ok && replaceReceipt)
    assert.equal(readConnectedPreferenceApplicationContext(invalidatedForReplacement.data?.session), undefined)
    assert.deepEqual(Object.values(replaceReceipt.safety), Array(Object.keys(replaceReceipt.safety).length).fill(false))

    const secondDNA = approvedDNA(second)
    const mismatchedReplacement = await mutationError(runtime.baseUrl, `/v1/edit-reference-studies/${second.detail.study.id}/preference-dna/${secondDNA.id}/applications`, 'gate7-replace-mismatch', {
      workspaceId,
      expectedReferenceRevision: second.detail.reference.revision,
      expectedDNAContentDigest: secondDNA.contentDigest,
      acknowledgeAdaptNotCopy: true,
      targetContext,
      replacesApplicationId: firstCurrentApplication.id,
      expectedReplacedReferenceRevision: firstCurrent.detail.reference.revision,
      invalidationReceipt: { ...replaceReceipt, contextHash: '0'.repeat(64) },
    })
    assert.equal(mismatchedReplacement.status, 409)
    assert.equal(mismatchedReplacement.code, 'VALIDATION_FAILED')

    const replacement = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${second.detail.study.id}/preference-dna/${secondDNA.id}/applications`, 'gate7-replace', {
      workspaceId,
      expectedReferenceRevision: second.detail.reference.revision,
      expectedDNAContentDigest: secondDNA.contentDigest,
      acknowledgeAdaptNotCopy: true,
      targetContext,
      replacesApplicationId: firstCurrentApplication.id,
      expectedReplacedReferenceRevision: firstCurrent.detail.reference.revision,
      invalidationReceipt: replaceReceipt,
    })
    const secondApplication = replacement.detail.applications.find((candidate) => candidate.replacesApplicationId === firstCurrentApplication.id)
    assert(secondApplication)
    assert.equal(secondApplication.version, firstCurrentApplication.version + 1)
    const historyAfterReplacement = await get<PreferenceApplicationListData>(runtime.baseUrl, `/v1/edit-reference-applications?workspaceId=${workspaceId}`)
    const replacedFirst = historyAfterReplacement.applications.find((candidate) => candidate.id === firstCurrentApplication.id)
    assert.equal(replacedFirst?.status, 'replaced')
    assert.equal(replacedFirst?.replacedByApplicationId, secondApplication.id)
    assert.equal(replacedFirst?.downstreamInvalidationReceipt?.reason, 'replace')
    assert.equal(replacedFirst?.downstreamContext?.packageHash, replaceReceipt.contextHash)
    const firstAfterReplacement = await get<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-references/${firstReferenceId}?workspaceId=${workspaceId}`)
    assert.equal(approvedDNA(firstAfterReplacement).contentDigest, firstDNA.contentDigest)
    assert.equal(approvedDNA(firstAfterReplacement).approval?.id, firstDNA.approval?.id)

    const secondConnected = await connectApplication(runtime.baseUrl, sessionClient, replacement, secondApplication, 'gate7-second')
    const secondContext = readConnectedPreferenceApplicationContext(secondConnected.session)
    assert(secondContext)
    assert.equal(secondContext.applicationId, secondApplication.id)

    const briefClient = createDefaultMockProjectEditBriefApiClient({ projectId, preserveMockSession: false })
    const briefResult = await getProjectEditBriefForSessionViaApi(editSessionId, briefClient)
    assert(briefResult.brief)
    const syncedBrief = await syncPreferenceApplicationContextToProjectEditBrief({
      brief: briefResult.brief,
      client: briefClient,
      context: secondContext,
    })
    assert.equal(readPreferenceApplicationContextFromEditBrief(syncedBrief.brief)?.applicationId, secondApplication.id)

    const secondCurrent = await get<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-references/${secondReferenceId}?workspaceId=${workspaceId}`)
    const secondCurrentApplication = requireApplication(secondCurrent, editSessionId)
    const invalidatedForRemoval = await sessionClient.preference.invalidateApplication<{
      invalidationReceipt: PreferenceApplicationDownstreamInvalidationReceipt
    }>({ editSessionId, application: secondCurrentApplication, reason: 'remove' })
    const removeReceipt = invalidatedForRemoval.data?.invalidationReceipt
    assert(invalidatedForRemoval.ok && removeReceipt)
    const crossWorkspace = await mutationError(runtime.baseUrl, `/v1/edit-reference-applications/${secondCurrentApplication.id}/clear`, 'gate7-clear-cross-workspace', {
      workspaceId: 'workspace-edit-reference-lifecycle-other',
      expectedReferenceRevision: secondCurrent.detail.reference.revision,
      expectedApplicationContentDigest: secondCurrentApplication.contentDigest,
      invalidationReceipt: removeReceipt,
    })
    assert.equal(crossWorkspace.status, 404)

    const cleared = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-applications/${secondCurrentApplication.id}/clear`, 'gate7-clear', {
      workspaceId,
      expectedReferenceRevision: secondCurrent.detail.reference.revision,
      expectedApplicationContentDigest: secondCurrentApplication.contentDigest,
      invalidationReceipt: removeReceipt,
    })
    const clearedApplication = cleared.detail.applications.find((candidate) => candidate.id === secondCurrentApplication.id)
    assert.equal(clearedApplication?.status, 'cleared')
    assert.equal(clearedApplication?.targetIntegrationStatus, 'invalidated')
    assert.equal(clearedApplication?.downstreamInvalidationReceipt?.reason, 'remove')
    assert.equal(clearedApplication?.clearedAt, clearedApplication?.invalidatedAt)
    assert(cleared.detail.usageLogs.some((entry) => entry.eventType === 'cleared'))

    const clearReplay = await mutation<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-applications/${secondCurrentApplication.id}/clear`, 'gate7-clear', {
      workspaceId,
      expectedReferenceRevision: secondCurrent.detail.reference.revision,
      expectedApplicationContentDigest: secondCurrentApplication.contentDigest,
      invalidationReceipt: removeReceipt,
    })
    assert.deepEqual(clearReplay, cleared)
    const doubleClear = await mutationError(runtime.baseUrl, `/v1/edit-reference-applications/${secondCurrentApplication.id}/clear`, 'gate7-clear-new-key', {
      workspaceId,
      expectedReferenceRevision: cleared.detail.reference.revision,
      expectedApplicationContentDigest: secondCurrentApplication.contentDigest,
      invalidationReceipt: removeReceipt,
    })
    assert.equal(doubleClear.status, 409)
    assert.equal(doubleClear.code, 'VERSION_CONFLICT')

    const clearedBrief = await clearPreferenceApplicationContextFromProjectEditBrief({
      brief: syncedBrief.brief!,
      client: briefClient,
    })
    assert.equal(clearedBrief.changed, true)
    assert.equal(readPreferenceApplicationContextFromEditBrief(clearedBrief.brief), undefined)

    const finalHistory = await get<PreferenceApplicationListData>(runtime.baseUrl, `/v1/edit-reference-applications?workspaceId=${workspaceId}`)
    assert.deepEqual(finalHistory.applications.slice().sort((left, right) => left.version - right.version).map((record) => [record.version, record.status]), [[1, 'replaced'], [2, 'cleared']])
    assert(finalHistory.applications.every((record) => record.approvedPlanMutationMade === false))
    assert(finalHistory.applications.every((record) => Object.values(record.downstreamInvalidationReceipt?.safety ?? {}).every((value) => value === false)))
  } finally {
    await runtime.close()
  }

  const restarted = await startRuntime(root)
  try {
    const history = await get<PreferenceApplicationListData>(restarted.baseUrl, `/v1/edit-reference-applications?workspaceId=${workspaceId}`)
    assert.deepEqual(history.applications.slice().sort((left, right) => left.version - right.version).map((record) => record.status), ['replaced', 'cleared'])
    const first = await get<EditReferenceDetailData>(restarted.baseUrl, `/v1/edit-references/${firstReferenceId}?workspaceId=${workspaceId}`)
    const second = await get<EditReferenceDetailData>(restarted.baseUrl, `/v1/edit-references/${secondReferenceId}?workspaceId=${workspaceId}`)
    assert(first.detail.usageLogs.some((entry) => entry.eventType === 'replaced'))
    assert(second.detail.usageLogs.some((entry) => entry.eventType === 'cleared'))
  } finally {
    await restarted.close()
  }

  const stored = await readFile(join(root, 'edit-reference-private', 'scopes', editReferenceScopeHash(ownerUserId, workspaceId), 'aggregate.json'), 'utf8')
  assert.doesNotMatch(stored, /"(?:rawFrames|rawProviderPayload|signedUrl|apiKey|serviceRoleKey|accessToken)"\s*:/i)
  assert.match(stored, /preference_application_cleared/)
  assert.match(stored, /preference_application_replaced/)
  console.log('edit_reference_lifecycle_closure_passed')
} finally {
  await rm(root, { recursive: true, force: true })
}

function approvedDNA(data: EditReferenceDetailData) {
  const dna = data.detail.dnaVersions.find((candidate) => candidate.status === 'approved')
  assert(dna)
  return dna
}

function requireApplication(data: EditReferenceDetailData, targetEditSessionId: string): PreferenceApplicationRecord {
  const application = data.detail.applications.find((candidate) => candidate.editSessionId === targetEditSessionId && candidate.status === 'prepared')
  assert(application)
  return application
}

async function createApprovedReference(baseUrl: string, keyPrefix: string, name: string): Promise<EditReferenceDetailData> {
  const created = await mutation<EditReferenceDetailData>(baseUrl, '/v1/edit-references', `${keyPrefix}-create`, {
    workspaceId,
    name,
    initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'audio_and_sfx', 'b_roll', 'graphics'],
  })
  const studyId = created.detail.study.id
  const evidence = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/evidence`, `${keyPrefix}-evidence`, {
    workspaceId,
    expectedStudyRevision: created.detail.study.revision,
    sourceType: 'manual_user_evidence',
    title: `${name} evidence`,
    category: 'all_goals',
    summary: 'Use clear hierarchy, meaning-led pacing, readable captions, restrained audio, original graphics, and purposeful B-roll. Never copy exact shots, layouts, timing, music, people, logos, sound effects, or creator identity.',
    intendedUse: 'transferable',
  })
  const studied = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/evidence-study`, `${keyPrefix}-study`, {
    workspaceId,
    expectedStudyRevision: evidence.detail.study.revision,
  })
  const synthesized = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, `${keyPrefix}-dna`, {
    workspaceId,
    expectedStudyRevision: studied.detail.study.revision,
  })
  const dna = synthesized.detail.dnaVersions[0]
  assert(dna)
  const quality = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/qa`, `${keyPrefix}-qa`, {
    workspaceId,
    expectedStudyRevision: synthesized.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
  })
  const qa = quality.detail.dnaQaResults[0]
  assert(qa)
  return mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/approve`, `${keyPrefix}-approve`, {
    workspaceId,
    expectedStudyRevision: quality.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
    qaResultId: qa.id,
    acknowledgeAdaptNotCopy: true,
    acknowledgeQAReview: qa.status === 'requires_user_review',
  })
}

async function connectApplication(
  baseUrl: string,
  sessionClient: ReturnType<typeof createDefaultMockProjectEditSessionApiClient>,
  detail: EditReferenceDetailData,
  application: PreferenceApplicationRecord,
  keyPrefix: string,
) {
  const context = createPreferenceApplicationDownstreamContext(application, 'staged_unconfirmed')
  const staged = await sessionClient.preference.stageApplication<{ targetSessionReceipt: PreferenceApplicationTargetSessionReceipt }>({
    editSessionId,
    application,
    context,
    outputFrameConfirmed: true,
  })
  assert(staged.data?.targetSessionReceipt)
  const connected = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-applications/${application.id}/connect`, `${keyPrefix}-connect`, {
    workspaceId,
    expectedReferenceRevision: detail.detail.reference.revision,
    expectedApplicationContentDigest: application.contentDigest,
    targetSessionReceipt: staged.data.targetSessionReceipt,
  })
  const connectedApplication = connected.detail.applications.find((candidate) => candidate.id === application.id)
  assert(connectedApplication)
  const activated = await sessionClient.preference.activateApplication<{ session: ProjectEditSessionBundleRecord['session'] }>({
    editSessionId,
    application: connectedApplication,
  })
  assert(activated.ok && activated.data?.session)
  return { application: connectedApplication, session: activated.data.session }
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
