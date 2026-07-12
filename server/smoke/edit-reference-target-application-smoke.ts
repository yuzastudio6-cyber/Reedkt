import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { editReferenceScopeHash } from '../edit-references/private-edit-reference-repository'
import type {
  CreatePreferenceApplicationRequest,
  EditReferenceApiSuccess,
  EditReferenceDetailData,
  PreferenceApplicationListData,
  PreferenceApplicationTargetContextSnapshot,
} from '../../src/types/edit-reference'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-gate5-'))
const workspaceId = 'workspace-edit-reference-target-application'
const ownerUserId = 'mock-user-runtime'

try {
  const runtime = await startRuntime(root)
  let referenceId = ''
  let studyId = ''
  try {
    const created = await request<EditReferenceDetailData>(runtime.baseUrl, '/v1/edit-references', {
      method: 'POST', key: 'gate5-create-reference', body: {
        workspaceId,
        name: 'Target-aware editorial restraint',
        initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'audio_and_sfx', 'b_roll', 'graphics'],
      },
    })
    referenceId = created.body.data.detail.reference.id
    studyId = created.body.data.detail.study.id
    const evidence = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence`, {
      method: 'POST', key: 'gate5-add-evidence', body: {
        workspaceId,
        expectedStudyRevision: created.body.data.detail.study.revision,
        sourceType: 'manual_user_evidence',
        title: 'Editorial restraint principles',
        category: 'all_goals',
        summary: 'Use clear story hierarchy, deliberate pacing, readable captions, restrained music, meaning-linked sound cues, original graphics, and purposeful B-roll. Never copy exact shots, timecodes, layouts, music, sound effects, logos, people, or creator identity.',
        intendedUse: 'transferable',
      },
    })
    const studied = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence-study`, {
      method: 'POST', key: 'gate5-study-evidence', body: { workspaceId, expectedStudyRevision: evidence.body.data.detail.study.revision },
    })
    const synthesized = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, {
      method: 'POST', key: 'gate5-synthesize', body: { workspaceId, expectedStudyRevision: studied.body.data.detail.study.revision },
    })
    const dnaVersion = synthesized.body.data.detail.dnaVersions[0]
    assert(dnaVersion)

    const tutorialTarget = targetContext({
      projectId: 'project-voice-tutorial',
      editSessionId: 'edit-voice-tutorial',
      projectName: 'Creator education series',
      editName: 'Voice-first camera tutorial',
      sourceMode: 'voice_first',
      contentType: 'tutorial',
      sourceSummary: 'A presenter explains a camera workflow with screen recordings and spoken steps.',
      currentUserInstruction: 'Keep every spoken step clear, preserve source order, require captions, and avoid decorative sound effects.',
      selectedEditLevel: 'normal',
      aspectRatio: '16:9',
      platformTarget: 'youtube_standard',
      storyRole: 'Teach the workflow in the order it is demonstrated',
      budgetPreference: 'efficient',
      directives: { captions: 'required', music: 'adapt', sfx: 'avoid', sourceOrder: 'preserve' },
      approvedConstraints: ['Speech clarity outranks beat alignment.', 'Do not remove required tutorial steps.'],
    })

    const premature = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/applications`, {
      method: 'POST', key: 'gate5-premature-application', body: applicationRequest(
        synthesized.body.data.detail.reference.revision,
        dnaVersion.contentDigest,
        tutorialTarget,
      ),
    })
    assert.equal(premature.status, 409)
    assert.equal(premature.code, 'VALIDATION_FAILED')

    const qualityReviewed = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/qa`, {
      method: 'POST', key: 'gate5-qa', body: {
        workspaceId,
        expectedStudyRevision: synthesized.body.data.detail.study.revision,
        expectedDNAContentDigest: dnaVersion.contentDigest,
      },
    })
    const qaResult = qualityReviewed.body.data.detail.dnaQaResults[0]
    assert(qaResult)
    assert.notEqual(qaResult.status, 'blocked')
    const approved = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/approve`, {
      method: 'POST', key: 'gate5-approve', body: {
        workspaceId,
        expectedStudyRevision: qualityReviewed.body.data.detail.study.revision,
        expectedDNAContentDigest: dnaVersion.contentDigest,
        qaResultId: qaResult.id,
        acknowledgeAdaptNotCopy: true,
        acknowledgeQAReview: qaResult.status === 'requires_user_review',
      },
    })
    const approvedVersion = approved.body.data.detail.dnaVersions.find((record) => record.id === dnaVersion.id)
    assert(approvedVersion?.approval)

    const unconfirmedFrame = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/applications`, {
      method: 'POST', key: 'gate5-unconfirmed-frame', body: {
        ...applicationRequest(approved.body.data.detail.reference.revision, dnaVersion.contentDigest, tutorialTarget),
        targetContext: { ...tutorialTarget, outputFrameConfirmed: false },
      },
    })
    assert.equal(unconfirmedFrame.status, 400)
    assert.equal(unconfirmedFrame.code, 'VALIDATION_FAILED')

    const targetCopyRisk = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/applications`, {
      method: 'POST', key: 'gate5-target-copy-risk', body: applicationRequest(
        approved.body.data.detail.reference.revision,
        dnaVersion.contentDigest,
        { ...tutorialTarget, currentUserInstruction: 'Copy the exact shot order and use the same timing as the reference.' },
      ),
    })
    assert.equal(targetCopyRisk.status, 409)
    assert.equal(targetCopyRisk.code, 'VALIDATION_FAILED')

    const wrongDigest = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/applications`, {
      method: 'POST', key: 'gate5-wrong-digest', body: applicationRequest(
        approved.body.data.detail.reference.revision,
        '0'.repeat(64),
        tutorialTarget,
      ),
    })
    assert.equal(wrongDigest.status, 409)
    assert.equal(wrongDigest.code, 'VERSION_CONFLICT')

    const crossTenant = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/applications`, {
      method: 'POST', key: 'gate5-cross-tenant', body: {
        ...applicationRequest(approved.body.data.detail.reference.revision, dnaVersion.contentDigest, tutorialTarget),
        workspaceId: 'workspace-edit-reference-target-application-other',
      },
    })
    assert.equal(crossTenant.status, 404)
    assert.equal(crossTenant.code, 'PREFERENCE_STUDY_NOT_FOUND')

    const tutorialPayload = applicationRequest(
      approved.body.data.detail.reference.revision,
      dnaVersion.contentDigest,
      tutorialTarget,
    )
    const tutorialApplicationResult = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/applications`, {
      method: 'POST', key: 'gate5-apply-tutorial', body: tutorialPayload,
    })
    const tutorialApplication = tutorialApplicationResult.body.data.detail.applications[0]
    assert(tutorialApplication)
    assert.equal(tutorialApplication.status, 'prepared')
    assert.equal(tutorialApplication.version, 1)
    assert.equal(tutorialApplication.dnaVersionId, dnaVersion.id)
    assert.equal(tutorialApplication.dnaContentDigest, dnaVersion.contentDigest)
    assert.equal(tutorialApplication.dnaApprovalId, approvedVersion.approval.id)
    assert.equal(tutorialApplication.dnaQaResultId, qaResult.id)
    assert.equal(tutorialApplication.targetIntegrationStatus, 'not_connected')
    assert.equal(tutorialApplication.targetIdentityStatus, 'caller_confirmed_unverified')
    assert.equal(tutorialApplication.targetEditMutationMade, false)
    assert.equal(tutorialApplication.approvedPlanMutationMade, false)
    assert.equal(tutorialApplication.downstreamContextWritten, false)
    assert.equal(tutorialApplication.targetContext.outputFrameConfirmed, true)
    assert.equal(tutorialApplication.precedencePolicy[0], 'safety_platform_tier_frame_credit_or_approved_constraint')
    assert.equal(tutorialApplication.precedencePolicy.at(-1), 'approved_preference_dna')
    assert(tutorialApplication.decisions.some((decision) => decision.layerId === 'pacing_timing' && /speech meaning/i.test(decision.targetInstruction)))
    assert(tutorialApplication.decisions.some((decision) => decision.layerId === 'sfx_sound_design' && decision.decision === 'blocked_from_transfer' && decision.precedence === 'current_user_instruction'))
    assert(tutorialApplication.decisions.filter((decision) => decision.precedence === 'safety_platform_tier_frame_credit_or_approved_constraint').every((decision) => decision.layerId === 'do_not_copy_rules' || tutorialTarget.approvedConstraints.length > 0))
    assert(tutorialApplication.decisions.filter((decision) => decision.layerId === 'do_not_copy_rules').every((decision) => decision.decision === 'blocked_from_transfer'))
    assert.equal(tutorialApplication.contentDigest.length, 64)

    const tutorialReplay = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/applications`, {
      method: 'POST', key: 'gate5-apply-tutorial', body: tutorialPayload,
    })
    assert.equal(tutorialReplay.replayed, 'true')
    assert.deepEqual(tutorialReplay.body, tutorialApplicationResult.body)

    const duplicateTarget = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/applications`, {
      method: 'POST', key: 'gate5-duplicate-target', body: applicationRequest(
        tutorialApplicationResult.body.data.detail.reference.revision,
        dnaVersion.contentDigest,
        tutorialTarget,
      ),
    })
    assert.equal(duplicateTarget.status, 409)
    assert.equal(duplicateTarget.code, 'VERSION_CONFLICT')

    const montageTarget = targetContext({
      projectId: 'project-silent-lifestyle',
      editSessionId: 'edit-silent-lifestyle',
      projectName: 'Travel launch',
      editName: 'Silent lifestyle montage',
      sourceMode: 'silent_visual',
      contentType: 'lifestyle_montage',
      sourceSummary: 'A silent sequence of original travel footage with visible motion and no spoken dialogue.',
      currentUserInstruction: 'Avoid captions, let licensed music carry the arc, and use target-specific tactile sound cues.',
      selectedEditLevel: 'premium',
      aspectRatio: '9:16',
      platformTarget: 'instagram_reel',
      storyRole: 'Build anticipation and finish on the destination reveal',
      budgetPreference: 'cinematic',
      directives: { captions: 'avoid', music: 'required', sfx: 'required', sourceOrder: 'adapt' },
      approvedConstraints: ['Use only user-owned footage.', 'Keep the destination reveal as the ending.'],
    })
    const montageApplicationResult = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dnaVersion.id}/applications`, {
      method: 'POST', key: 'gate5-apply-montage', body: applicationRequest(
        tutorialApplicationResult.body.data.detail.reference.revision,
        dnaVersion.contentDigest,
        montageTarget,
      ),
    })
    const montageApplication = montageApplicationResult.body.data.detail.applications.find((record) => record.editSessionId === montageTarget.editSessionId)
    assert(montageApplication)
    assert.notEqual(montageApplication.targetContextDigest, tutorialApplication.targetContextDigest)
    assert.notEqual(montageApplication.contentDigest, tutorialApplication.contentDigest)
    assert.notDeepEqual(montageApplication.decisions, tutorialApplication.decisions)
    assert(montageApplication.decisions.some((decision) => decision.layerId === 'pacing_timing' && /visual action/i.test(decision.targetInstruction)))
    assert(montageApplication.decisions.some((decision) => decision.layerId === 'speech_caption_behavior' && decision.decision === 'blocked_from_transfer' && decision.precedence === 'current_user_instruction'))
    assert(montageApplication.decisions.some((decision) => decision.layerId === 'music_soundsync' && /structural layer/i.test(decision.targetInstruction)))
    assert.equal(montageApplicationResult.body.data.detail.study.status, 'approved')
    assert.equal(montageApplicationResult.body.data.detail.nextAction, 'prepare_target_application')
    assert.match(montageApplicationResult.body.data.detail.messages.at(-1)?.content ?? '', /has not changed/i)

    const listed = await request<PreferenceApplicationListData>(runtime.baseUrl, `/v1/edit-reference-applications?workspaceId=${workspaceId}`)
    assert.equal(listed.body.data.applications.length, 2)
    assert.deepEqual(new Set(listed.body.data.applications.map((record) => record.editSessionId)), new Set([tutorialTarget.editSessionId, montageTarget.editSessionId]))
    assert.deepEqual(Object.values(listed.body.data.safety), Array(Object.values(listed.body.data.safety).length).fill(false))

    const stored = await readFile(join(root, 'edit-reference-private', 'scopes', editReferenceScopeHash(ownerUserId, workspaceId), 'aggregate.json'), 'utf8')
    assert.match(stored, /preference_application_prepared/)
    assert.match(stored, /application_prepared/)
    assert.doesNotMatch(stored, /"(?:rawFrames|rawProviderPayload|signedUrl|apiKey|serviceRoleKey|accessToken)"\s*:/i)
  } finally {
    await runtime.close()
  }

  const restarted = await startRuntime(root)
  try {
    const loaded = await request<EditReferenceDetailData>(restarted.baseUrl, `/v1/edit-references/${referenceId}?workspaceId=${workspaceId}`)
    assert.equal(loaded.body.data.detail.applications.length, 2)
    assert.equal(loaded.body.data.detail.applications.filter((record) => record.status === 'prepared').length, 2)
    assert.equal(loaded.body.data.detail.applications.every((record) => record.targetIntegrationStatus === 'not_connected'), true)
    assert.equal(loaded.body.data.detail.study.id, studyId)
  } finally {
    await restarted.close()
  }

  console.log('edit_reference_target_application_passed')
} finally {
  await rm(root, { recursive: true, force: true })
}

function targetContext(value: Omit<PreferenceApplicationTargetContextSnapshot, 'outputFrameConfirmed'>): PreferenceApplicationTargetContextSnapshot {
  return { ...value, outputFrameConfirmed: true }
}

function applicationRequest(
  expectedReferenceRevision: number,
  expectedDNAContentDigest: string,
  targetContextValue: PreferenceApplicationTargetContextSnapshot,
): CreatePreferenceApplicationRequest {
  return {
    workspaceId,
    expectedReferenceRevision,
    expectedDNAContentDigest,
    acknowledgeAdaptNotCopy: true,
    targetContext: targetContextValue,
  }
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

async function request<T>(baseUrl: string, path: string, options?: { method: 'POST' | 'PATCH'; key: string; body: unknown }) {
  const response = await fetch(`${baseUrl}${path}`, options ? {
    method: options.method,
    headers: { 'content-type': 'application/json', 'idempotency-key': options.key },
    body: JSON.stringify(options.body),
  } : undefined)
  const body = await response.json() as EditReferenceApiSuccess<T>
  assert.equal(body.ok, true, JSON.stringify(body))
  return { status: response.status, replayed: response.headers.get('idempotency-replayed'), body }
}

async function requestError(baseUrl: string, path: string, options: { method: 'POST' | 'PATCH'; key: string; body: unknown }) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: { 'content-type': 'application/json', 'idempotency-key': options.key },
    body: JSON.stringify(options.body),
  })
  const body = await response.json() as { error: { code: string } }
  return { status: response.status, code: body.error.code }
}
