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
  EditReferenceListData,
} from '../../src/types/edit-reference'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-gate2-'))
const ownerUserId = 'mock-user-runtime'
const workspaceA = 'workspace-edit-reference-evidence-a'
const workspaceB = 'workspace-edit-reference-evidence-b'

try {
  const runtime = await startRuntime(root)
  let safeReferenceId = ''
  try {
    const safe = await createReference(runtime.baseUrl, workspaceA, 'Evidence-ready direction', [
      'visual_language', 'story_and_pacing', 'captions',
    ], 'gate2-create-safe')
    safeReferenceId = safe.detail.reference.id

    const manualPayload = {
      workspaceId: workspaceA,
      expectedStudyRevision: safe.detail.study.revision,
      sourceType: 'manual_user_evidence',
      title: 'Restrained evidence-first language',
      category: 'all_goals',
      summary: 'Use clear evidence cards, measured pacing, quiet transitions, readable captions, and original layouts. Never copy logos or exact publisher identity.',
      intendedUse: 'transferable',
    }
    const manual = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-add-manual', body: manualPayload,
    })
    assert.equal(manual.status, 201)
    assert.equal(manual.replayed, 'false')
    assert.equal(manual.body.data.detail.study.status, 'ready_to_study')
    assert.equal(manual.body.data.detail.study.evidenceStatus, 'ready_to_study')
    assert.equal(manual.body.data.detail.evidence.length, 1)
    assert.equal(manual.body.data.detail.evidence[0]?.confidenceBasis, 'user_asserted')
    assert.equal(manual.body.data.detail.nextAction, 'run_evidence_study')
    assert.equal(manual.body.data.detail.messages.at(-1)?.runtimeSource, 'deterministic_evidence')

    const manualReplay = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-add-manual', body: manualPayload,
    })
    assert.equal(manualReplay.replayed, 'true')
    assert.deepEqual(manualReplay.body, manual.body)

    const manualConflict = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-add-manual', body: { ...manualPayload, title: 'Changed evidence' },
    })
    assert.equal(manualConflict.status, 409)
    assert.equal(manualConflict.code, 'IDEMPOTENCY_CONFLICT')

    const studied = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/evidence-study`, {
      method: 'POST', key: 'gate2-run-safe', body: { workspaceId: workspaceA, expectedStudyRevision: manual.body.data.detail.study.revision },
    })
    assert.equal(studied.status, 201)
    assert.equal(studied.body.data.detail.study.status, 'evidence_ready')
    assert.equal(studied.body.data.detail.study.evidenceStatus, 'evidence_ready')
    assert.equal(studied.body.data.detail.nextAction, 'generate_preference_dna')
    assert.equal(studied.body.data.detail.dnaVersions.length, 0)
    assert.equal(studied.body.data.detail.dnaQaResults.length, 0)
    assert(studied.body.data.detail.skillRuns.some((run) => run.skillId === 'edit_reference.transferability.copy_safety' && run.status === 'completed'))
    assert(studied.body.data.detail.skillRuns.some((run) => run.skillId === 'edit_reference.speech_pacing.evidence' && run.status === 'blocked'))
    assert(studied.body.data.detail.skillRuns.every((run) => Object.values({
      providerCallMade: run.providerCallMade,
      modelCallMade: run.modelCallMade,
      fileBytesRead: run.fileBytesRead,
      externalUrlFetched: run.externalUrlFetched,
      mediaProcessingStarted: run.mediaProcessingStarted,
      workerJobCreated: run.workerJobCreated,
    }).every((value) => value === false)))
    assert(studied.body.data.detail.evidence.filter((record) => record.sourceType === 'derived_skill_evidence').every((record) => record.provenance.sourceEvidenceIds.length > 0))
    assert.doesNotMatch(JSON.stringify(studied.body.data.detail), /"(?:rawProviderPayload|rawFrames|signedUrl|accessToken)"\s*:/i)

    const studiedReplay = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/evidence-study`, {
      method: 'POST', key: 'gate2-run-safe', body: { workspaceId: workspaceA, expectedStudyRevision: manual.body.data.detail.study.revision },
    })
    assert.equal(studiedReplay.replayed, 'true')
    assert.deepEqual(studiedReplay.body, studied.body)
    const unchangedStudy = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/evidence-study`, {
      method: 'POST', key: 'gate2-run-safe-unchanged', body: { workspaceId: workspaceA, expectedStudyRevision: studied.body.data.detail.study.revision },
    })
    assert.equal(unchangedStudy.status, 409)
    assert.equal(unchangedStudy.code, 'VALIDATION_FAILED')

    const chatCorrectionPayload = {
      workspaceId: workspaceA,
      expectedStudyRevision: studied.body.data.detail.study.revision,
      clientMessageId: 'gate8-study-chat-correction-message',
      content: 'Keep the evidence cards restrained, but slow the reveal pace and use target-authored labels with more reading time.',
      findingCorrectionEvidenceId: manual.body.data.detail.evidence[0]!.id,
    }
    const chatCorrection = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/messages`, {
      method: 'POST', key: 'gate8-study-chat-correction', body: chatCorrectionPayload,
    })
    assert.equal(chatCorrection.body.data.detail.study.status, 'ready_to_study')
    assert.equal(chatCorrection.body.data.detail.study.evidenceStatus, 'ready_to_study')
    assert.equal(chatCorrection.body.data.detail.reference.dnaStatus, 'not_generated')
    const correctedFromChat = chatCorrection.body.data.detail.evidence.find((record) => record.supersedesEvidenceId === manual.body.data.detail.evidence[0]!.id)
    assert(correctedFromChat)
    assert.equal(correctedFromChat.sourceType, 'manual_user_evidence')
    assert.match(correctedFromChat.title, /Study Chat correction/)
    assert.match(chatCorrection.body.data.detail.messages.at(-1)?.content ?? '', /new evidence version/i)
    assert.equal(chatCorrection.body.data.detail.messages.at(-1)?.runtimeSource, 'deterministic_evidence')
    assert(chatCorrection.body.data.detail.usageLogs.some((entry) => entry.eventType === 'evidence_added'))

    const chatCorrectionReplay = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/messages`, {
      method: 'POST', key: 'gate8-study-chat-correction', body: chatCorrectionPayload,
    })
    assert.equal(chatCorrectionReplay.replayed, 'true')
    assert.deepEqual(chatCorrectionReplay.body, chatCorrection.body)
    const duplicateCorrection = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/messages`, {
      method: 'POST', key: 'gate8-study-chat-correction-new-key', body: {
        ...chatCorrectionPayload,
        expectedStudyRevision: chatCorrection.body.data.detail.study.revision,
        clientMessageId: 'gate8-study-chat-correction-duplicate',
      },
    })
    assert.equal(duplicateCorrection.status, 409)
    assert.equal(duplicateCorrection.code, 'VERSION_CONFLICT')

    const restudiedAfterChatCorrection = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${safe.detail.study.id}/evidence-study`, {
      method: 'POST', key: 'gate8-run-study-chat-correction', body: {
        workspaceId: workspaceA,
        expectedStudyRevision: chatCorrection.body.data.detail.study.revision,
      },
    })
    assert.equal(restudiedAfterChatCorrection.body.data.detail.study.status, 'evidence_ready')
    const refreshedFinding = restudiedAfterChatCorrection.body.data.detail.evidence.find((record) => (
      record.sourceType === 'derived_skill_evidence'
      && record.orchestrationId === restudiedAfterChatCorrection.body.data.detail.skillRuns.at(-1)?.orchestrationId
      && record.category === 'visual_language'
    ))
    assert.match(refreshedFinding?.summary ?? '', /slow the reveal pace/i)
    assert.doesNotMatch(refreshedFinding?.summary ?? '', /measured pacing, quiet transitions/i)

    const metadataOnly = await createReference(runtime.baseUrl, workspaceA, 'Metadata-only reference', ['visual_language'], 'gate2-create-metadata')
    const metadataPayload = {
      workspaceId: workspaceA,
      expectedStudyRevision: metadataOnly.detail.study.revision,
      sourceType: 'reference_video_metadata',
      title: 'Wide reference video',
      sourceLabel: 'Synthetic rights-safe reference',
      rightsBasis: 'reference_only',
      durationSeconds: 67,
      width: 1920,
      height: 1080,
      hasAudio: true,
    }
    const metadata = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${metadataOnly.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-add-metadata', body: metadataPayload,
    })
    assert.equal(metadata.body.data.detail.assets.length, 1)
    assert.equal(metadata.body.data.detail.assets[0]?.mediaStudyStatus, 'media_not_studied')
    assert.equal(metadata.body.data.detail.evidence[0]?.mediaMetadata?.orientation, 'landscape')
    assert.equal(metadata.body.data.detail.evidence[0]?.provenance.mediaStudyStatus, 'media_not_studied')
    const metadataStudy = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${metadataOnly.detail.study.id}/evidence-study`, {
      method: 'POST', key: 'gate2-run-metadata', body: { workspaceId: workspaceA, expectedStudyRevision: metadata.body.data.detail.study.revision },
    })
    assert.equal(metadataStudy.body.data.detail.study.status, 'needs_clarification')
    assert.equal(metadataStudy.body.data.detail.nextAction, 'add_missing_evidence')
    assert(metadataStudy.body.data.detail.evidence.some((record) => record.category === 'media_structure' && record.summary.includes('not studied')))
    assert.equal(metadataStudy.body.data.detail.evidence.some((record) => record.category === 'visual_language'), false, 'metadata must not fabricate visual observations')

    const privacyRejection = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${metadataOnly.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-privacy-reject', body: { ...metadataPayload, expectedStudyRevision: metadataStudy.body.data.detail.study.revision, signedUrl: 'https://example.test/private' },
    })
    assert.equal(privacyRejection.status, 400)
    assert.equal(privacyRejection.code, 'VALIDATION_FAILED')

    const previous = await createReference(runtime.baseUrl, workspaceA, 'Previous approved edit', ['graphics'], 'gate2-create-previous')
    const previousEvidence = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${previous.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-add-previous', body: {
        workspaceId: workspaceA,
        expectedStudyRevision: previous.detail.study.revision,
        sourceType: 'previous_approved_edit_snapshot',
        title: 'Approved product explainer',
        projectId: 'project-approved-001',
        editSessionId: 'edit-approved-001',
        approvedSnapshotId: 'snapshot-approved-001',
        rightsBasis: 'workspace_approved_edit',
      },
    })
    assert.equal(previousEvidence.body.data.detail.assets[0]?.approvedSnapshotId, 'snapshot-approved-001')
    const previousStudy = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${previous.detail.study.id}/evidence-study`, {
      method: 'POST', key: 'gate2-run-previous', body: { workspaceId: workspaceA, expectedStudyRevision: previousEvidence.body.data.detail.study.revision },
    })
    assert.equal(previousStudy.body.data.detail.study.status, 'needs_clarification')
    assert(previousStudy.body.data.detail.skillRuns.some((run) => run.status === 'blocked' && run.blockedReasons.some((reason) => reason.includes('private content remains closed'))))
    assert.doesNotMatch(JSON.stringify(previousStudy.body.data.detail), /"(?:projectHistory|sourceProjectMessages|sourceProjectAssets)"\s*:/i)

    const conflicting = await createReference(runtime.baseUrl, workspaceA, 'Conflicting pacing direction', ['story_and_pacing'], 'gate2-create-conflict')
    const restrainedEvidence = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${conflicting.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-add-restrained', body: {
        workspaceId: workspaceA,
        expectedStudyRevision: conflicting.detail.study.revision,
        sourceType: 'manual_user_evidence',
        title: 'Measured opening',
        category: 'story_and_pacing',
        summary: 'Use restrained pacing for the opening and allow evidence to breathe.',
        intendedUse: 'transferable',
      },
    })
    const rapidEvidence = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${conflicting.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-add-rapid', body: {
        workspaceId: workspaceA,
        expectedStudyRevision: restrainedEvidence.body.data.detail.study.revision,
        sourceType: 'manual_user_evidence',
        title: 'Fast development',
        category: 'story_and_pacing',
        summary: 'Use rapid pacing throughout the development section.',
        intendedUse: 'transferable',
      },
    })
    const conflictStudy = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${conflicting.detail.study.id}/evidence-study`, {
      method: 'POST', key: 'gate2-run-conflict', body: { workspaceId: workspaceA, expectedStudyRevision: rapidEvidence.body.data.detail.study.revision },
    })
    assert.equal(conflictStudy.body.data.detail.study.status, 'needs_user_review')
    assert(conflictStudy.body.data.detail.evidence.some((record) => record.title === 'Conflicting pacing direction' && record.transferability === 'requires_user_review'))
    assert(conflictStudy.body.data.detail.skillRuns.some((run) => run.toolIds.includes('deterministic_evidence_conflict_classifier') && run.status === 'blocked'))

    const risky = await createReference(runtime.baseUrl, workspaceA, 'Direct-copy risk', ['visual_language'], 'gate2-create-risk')
    const riskyEvidence = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${risky.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-add-risk', body: {
        workspaceId: workspaceA,
        expectedStudyRevision: risky.detail.study.revision,
        sourceType: 'manual_user_evidence',
        title: 'Match the reference',
        category: 'all_goals',
        summary: 'Use the same song, exact shot order, exact timecode, exact graphic layout, same brand, and use the reference video as project footage.',
        intendedUse: 'transferable',
      },
    })
    const riskyStudy = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${risky.detail.study.id}/evidence-study`, {
      method: 'POST', key: 'gate2-run-risk', body: { workspaceId: workspaceA, expectedStudyRevision: riskyEvidence.body.data.detail.study.revision },
    })
    assert.equal(riskyStudy.body.data.detail.study.status, 'needs_user_review')
    assert.equal(riskyStudy.body.data.detail.nextAction, 'review_study_findings')
    assert(riskyStudy.body.data.detail.evidence.some((record) => record.category === 'copy_safety' && record.transferability === 'do_not_copy'))
    assert(riskyStudy.body.data.detail.skillRuns.some((run) => run.skillId === 'edit_reference.transferability.copy_safety' && run.status === 'blocked' && run.blockedReasons.length === 6))

    const riskySourceId = riskyStudy.body.data.detail.evidence.find((record) => record.sourceType === 'manual_user_evidence')?.id
    assert(riskySourceId)
    const correction = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${risky.detail.study.id}/evidence`, {
      method: 'POST', key: 'gate2-correct-risk', body: {
        workspaceId: workspaceA,
        expectedStudyRevision: riskyStudy.body.data.detail.study.revision,
        sourceType: 'manual_user_evidence',
        title: 'Original editorial direction',
        category: 'all_goals',
        summary: 'Use an original shot plan, rights-cleared sound, restrained pacing, and a layout designed for the target project.',
        intendedUse: 'transferable',
        supersedesEvidenceId: riskySourceId,
      },
    })
    assert.equal(correction.body.data.detail.evidence.filter((record) => record.sourceType === 'manual_user_evidence').length, 2)
    assert.equal(correction.body.data.detail.evidence.find((record) => record.supersedesEvidenceId === riskySourceId)?.provenance.sourceEvidenceIds[0], riskySourceId)
    const correctedStudy = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${risky.detail.study.id}/evidence-study`, {
      method: 'POST', key: 'gate2-run-corrected-risk', body: { workspaceId: workspaceA, expectedStudyRevision: correction.body.data.detail.study.revision },
    })
    assert.equal(correctedStudy.body.data.detail.study.status, 'evidence_ready')
    const correctedCopyRun = correctedStudy.body.data.detail.skillRuns.filter((run) => run.skillId === 'edit_reference.transferability.copy_safety').at(-1)
    assert.equal(correctedCopyRun?.status, 'completed')

    const isolated = await requestError(runtime.baseUrl, `/v1/edit-references/${safeReferenceId}?workspaceId=${workspaceB}`)
    assert.equal(isolated.status, 404)
    assert.equal(isolated.code, 'EDIT_REFERENCE_NOT_FOUND')

    const stored = await readFile(join(root, 'edit-reference-private', 'scopes', editReferenceScopeHash(ownerUserId, workspaceA), 'aggregate.json'), 'utf8')
    assert.doesNotMatch(stored, /"(?:rawFrames|rawProviderPayload|signedUrl|apiKey|serviceRoleKey|accessToken)"\s*:/i)
  } finally {
    await runtime.close()
  }

  const restarted = await startRuntime(root)
  try {
    const list = await request<EditReferenceListData>(restarted.baseUrl, `/v1/edit-references?workspaceId=${workspaceA}`)
    assert.equal(list.body.data.references.length, 5)
    const loaded = await request<EditReferenceDetailData>(restarted.baseUrl, `/v1/edit-references/${safeReferenceId}?workspaceId=${workspaceA}`)
    assert.equal(loaded.body.data.detail.study.status, 'evidence_ready')
    assert(loaded.body.data.detail.evidence.length > 1)
    assert(loaded.body.data.detail.skillRuns.length > 0)
  } finally {
    await restarted.close()
  }

  console.log('edit_reference_evidence_study_passed')
} finally {
  await rm(root, { recursive: true, force: true })
}

async function createReference(
  baseUrl: string,
  workspaceId: string,
  name: string,
  initialGoals: string[],
  key: string,
) {
  const response = await request<EditReferenceDetailData>(baseUrl, '/v1/edit-references', {
    method: 'POST',
    key,
    body: { workspaceId, name, description: 'Gate 2 evidence study smoke fixture.', initialGoals },
  })
  return response.body.data
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

async function requestError(baseUrl: string, path: string, options?: { method: 'POST' | 'PATCH'; key: string; body: unknown }) {
  const response = await fetch(`${baseUrl}${path}`, options ? {
    method: options.method,
    headers: { 'content-type': 'application/json', 'idempotency-key': options.key },
    body: JSON.stringify(options.body),
  } : undefined)
  const body = await response.json() as { error: { code: string } }
  return { status: response.status, code: body.error.code }
}
