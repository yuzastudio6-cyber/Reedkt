import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { editReferenceScopeHash } from '../edit-references/private-edit-reference-repository'
import { calculateEditReferenceDNAContentDigest } from '../edit-references/edit-reference-dna-synthesis'
import { runEditReferenceDNAQA } from '../edit-references/edit-reference-dna-qa'
import type { EditReferenceApiSuccess, EditReferenceDetailData, PreferenceDNAVersionRecord } from '../../src/types/edit-reference'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-gate4-'))
const workspaceId = 'workspace-edit-reference-dna-qa'
const ownerUserId = 'mock-user-runtime'

try {
  const runtime = await startRuntime(root)
  let referenceId = ''
  try {
    const created = await request<EditReferenceDetailData>(runtime.baseUrl, '/v1/edit-references', {
      method: 'POST', key: 'gate4-create-reference', body: {
        workspaceId,
        name: 'Quality-reviewed documentary DNA',
        initialGoals: ['visual_language', 'story_and_pacing'],
      },
    })
    referenceId = created.body.data.detail.reference.id
    const studyId = created.body.data.detail.study.id
    const evidence = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence`, {
      method: 'POST', key: 'gate4-add-evidence', body: {
        workspaceId,
        expectedStudyRevision: created.body.data.detail.study.revision,
        sourceType: 'manual_user_evidence',
        title: 'Measured documentary judgment',
        category: 'all_goals',
        summary: 'Use measured pacing, original evidence compositions, readable labels, restrained motion, and quiet emphasis. Never copy exact layouts, marks, timing, music, or creator identity.',
        intendedUse: 'transferable',
      },
    })
    const studied = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence-study`, {
      method: 'POST', key: 'gate4-study-evidence', body: { workspaceId, expectedStudyRevision: evidence.body.data.detail.study.revision },
    })
    const synthesized = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, {
      method: 'POST', key: 'gate4-synthesize-v1', body: { workspaceId, expectedStudyRevision: studied.body.data.detail.study.revision },
    })
    const version1 = synthesized.body.data.detail.dnaVersions[0]
    assert(version1)
    assert.equal(synthesized.body.data.detail.nextAction, 'run_preference_dna_qa')

    const deterministicInput = {
      reference: synthesized.body.data.detail.reference,
      study: synthesized.body.data.detail.study,
      dnaVersion: version1,
      evidence: synthesized.body.data.detail.evidence,
      now: '2026-07-11T15:00:00.000Z',
    }
    const deterministicFirst = runEditReferenceDNAQA(deterministicInput)
    const deterministicSecond = runEditReferenceDNAQA({ ...deterministicInput, now: '2026-07-11T16:00:00.000Z' })
    assert.notEqual(deterministicFirst.id, deterministicSecond.id)
    assert.equal(deterministicFirst.contentDigest, deterministicSecond.contentDigest)
    assert.deepEqual(deterministicFirst.checks, deterministicSecond.checks)
    assert.equal(deterministicFirst.status, 'requires_user_review')

    const missingSafety = cloneVersion(version1)
    missingSafety.rules = missingSafety.rules.filter((rule) => rule.kind !== 'do_not_copy')
    missingSafety.layers = missingSafety.layers.filter((layer) => layer.layerId !== 'do_not_copy_rules')
    missingSafety.doNotCopyRuleCount = 0
    missingSafety.contentDigest = calculateEditReferenceDNAContentDigest(missingSafety)
    const missingSafetyQA = runEditReferenceDNAQA({ ...deterministicInput, dnaVersion: missingSafety })
    assert.equal(missingSafetyQA.status, 'blocked')
    assert.equal(missingSafetyQA.checks.find((check) => check.checkId === 'do_not_copy_coverage')?.status, 'blocked')

    const copyRisk = cloneVersion(version1)
    const transferableRule = copyRisk.rules.find((rule) => rule.kind === 'must_follow')
    assert(transferableRule)
    transferableRule.statement = `${transferableRule.statement} Copy the exact shot order and use the same timing.`
    copyRisk.contentDigest = calculateEditReferenceDNAContentDigest(copyRisk)
    const copyRiskQA = runEditReferenceDNAQA({ ...deterministicInput, dnaVersion: copyRisk })
    assert.equal(copyRiskQA.status, 'blocked')
    assert.equal(copyRiskQA.checks.find((check) => check.checkId === 'copy_risk')?.status, 'blocked')

    const lowConfidence = cloneVersion(version1)
    lowConfidence.overallConfidence = 0.4
    lowConfidence.overallConfidenceBand = 'low'
    lowConfidence.contentDigest = calculateEditReferenceDNAContentDigest(lowConfidence)
    const lowConfidenceQA = runEditReferenceDNAQA({ ...deterministicInput, dnaVersion: lowConfidence })
    assert.equal(lowConfidenceQA.checks.find((check) => check.checkId === 'confidence_threshold')?.status, 'blocked')

    const sideEffect = { ...cloneVersion(version1), providerCallMade: true as false }
    const sideEffectQA = runEditReferenceDNAQA({ ...deterministicInput, dnaVersion: sideEffect })
    assert.equal(sideEffectQA.checks.find((check) => check.checkId === 'side_effect_safety')?.status, 'blocked')

    const crossTenantQA = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version1.id}/qa`, {
      method: 'POST', key: 'gate4-qa-cross-tenant', body: {
        workspaceId: 'workspace-edit-reference-dna-qa-other',
        expectedStudyRevision: synthesized.body.data.detail.study.revision,
        expectedDNAContentDigest: version1.contentDigest,
      },
    })
    assert.equal(crossTenantQA.status, 404)
    assert.equal(crossTenantQA.code, 'PREFERENCE_STUDY_NOT_FOUND')

    const wrongDigest = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version1.id}/qa`, {
      method: 'POST', key: 'gate4-qa-wrong-digest', body: {
        workspaceId,
        expectedStudyRevision: synthesized.body.data.detail.study.revision,
        expectedDNAContentDigest: '0'.repeat(64),
      },
    })
    assert.equal(wrongDigest.status, 409)
    assert.equal(wrongDigest.code, 'VERSION_CONFLICT')

    const qaPayload = {
      workspaceId,
      expectedStudyRevision: synthesized.body.data.detail.study.revision,
      expectedDNAContentDigest: version1.contentDigest,
    }
    const qualityReviewed = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version1.id}/qa`, {
      method: 'POST', key: 'gate4-qa-v1', body: qaPayload,
    })
    assert.equal(qualityReviewed.status, 201)
    assert.equal(qualityReviewed.body.data.detail.dnaQaResults.length, 1)
    const qa1 = qualityReviewed.body.data.detail.dnaQaResults[0]
    assert(qa1)
    assert.equal(qa1.status, 'requires_user_review')
    assert.equal(qa1.qaVersion, 'edit-reference-dna-qa-v1')
    assert.equal(qa1.dnaContentDigest, version1.contentDigest)
    assert.equal(qa1.checks.length, 12)
    assert.equal(qa1.blockingCheckIds.length, 0)
    assert(qa1.reviewCheckIds.includes('confidence_threshold'))
    assert.equal(qa1.contentDigest.length, 64)
    assert.equal(qualityReviewed.body.data.detail.nextAction, 'approve_preference_dna')
    assert.deepEqual(Object.values({
      providerCallMade: qa1.providerCallMade,
      modelCallMade: qa1.modelCallMade,
      fileBytesRead: qa1.fileBytesRead,
      externalUrlFetched: qa1.externalUrlFetched,
      mediaProcessingStarted: qa1.mediaProcessingStarted,
      workerJobCreated: qa1.workerJobCreated,
      generationRequestCreated: qa1.generationRequestCreated,
      renderJobCreated: qa1.renderJobCreated,
      creditReservedOrSpent: qa1.creditReservedOrSpent,
    }), Array(9).fill(false))

    const qaReplay = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version1.id}/qa`, {
      method: 'POST', key: 'gate4-qa-v1', body: qaPayload,
    })
    assert.equal(qaReplay.replayed, 'true')
    assert.deepEqual(qaReplay.body, qualityReviewed.body)

    const duplicateQA = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version1.id}/qa`, {
      method: 'POST', key: 'gate4-qa-v1-duplicate-key', body: {
        ...qaPayload,
        expectedStudyRevision: qualityReviewed.body.data.detail.study.revision,
      },
    })
    assert.equal(duplicateQA.status, 409)
    assert.equal(duplicateQA.code, 'VALIDATION_FAILED')

    const crossTenantApproval = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version1.id}/approve`, {
      method: 'POST', key: 'gate4-approve-cross-tenant', body: {
        workspaceId: 'workspace-edit-reference-dna-qa-other',
        expectedStudyRevision: qualityReviewed.body.data.detail.study.revision,
        expectedDNAContentDigest: version1.contentDigest,
        qaResultId: qa1.id,
        acknowledgeAdaptNotCopy: true,
        acknowledgeQAReview: true,
      },
    })
    assert.equal(crossTenantApproval.status, 404)
    assert.equal(crossTenantApproval.code, 'PREFERENCE_STUDY_NOT_FOUND')

    const missingReviewAcknowledgement = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version1.id}/approve`, {
      method: 'POST', key: 'gate4-approve-v1-no-review', body: {
        workspaceId,
        expectedStudyRevision: qualityReviewed.body.data.detail.study.revision,
        expectedDNAContentDigest: version1.contentDigest,
        qaResultId: qa1.id,
        acknowledgeAdaptNotCopy: true,
        acknowledgeQAReview: false,
      },
    })
    assert.equal(missingReviewAcknowledgement.status, 409)
    assert.equal(missingReviewAcknowledgement.code, 'VALIDATION_FAILED')

    const approvalPayload = {
      workspaceId,
      expectedStudyRevision: qualityReviewed.body.data.detail.study.revision,
      expectedDNAContentDigest: version1.contentDigest,
      qaResultId: qa1.id,
      acknowledgeAdaptNotCopy: true,
      acknowledgeQAReview: true,
    }
    const approved = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version1.id}/approve`, {
      method: 'POST', key: 'gate4-approve-v1', body: approvalPayload,
    })
    assert.equal(approved.body.data.detail.study.status, 'approved')
    assert.equal(approved.body.data.detail.reference.dnaStatus, 'approved')
    assert.equal(approved.body.data.detail.nextAction, 'prepare_target_application')
    const approvedV1 = approved.body.data.detail.dnaVersions.find((record) => record.version === 1)
    assert(approvedV1?.approval)
    assert.equal(approvedV1.status, 'approved')
    assert.equal(approvedV1.approval.qaResultId, qa1.id)
    assert.equal(approvedV1.approval.acknowledgedAdaptNotCopy, true)
    assert.equal(approvedV1.approval.acknowledgedQAReview, true)
    assert.equal(approved.body.data.detail.applications.length, 0)
    assert.match(approved.body.data.detail.messages.at(-1)?.content ?? '', /has not been applied to an edit/i)

    const approvalReplay = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version1.id}/approve`, {
      method: 'POST', key: 'gate4-approve-v1', body: approvalPayload,
    })
    assert.equal(approvalReplay.replayed, 'true')
    assert.deepEqual(approvalReplay.body, approved.body)

    const sourceEvidence = approved.body.data.detail.evidence.find((record) => record.sourceType === 'manual_user_evidence')
    assert(sourceEvidence)
    const corrected = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence`, {
      method: 'POST', key: 'gate4-correct-after-approval', body: {
        workspaceId,
        expectedStudyRevision: approved.body.data.detail.study.revision,
        sourceType: 'manual_user_evidence',
        title: 'Measured documentary judgment v2',
        category: 'all_goals',
        summary: 'Use deliberate pacing, original document compositions, and readable labels designed for the target edit.',
        intendedUse: 'transferable',
        supersedesEvidenceId: sourceEvidence.id,
      },
    })
    assert.equal(corrected.body.data.detail.reference.dnaStatus, 'not_generated')
    assert.equal(corrected.body.data.detail.dnaVersions.find((record) => record.version === 1)?.status, 'approved')
    const restudied = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence-study`, {
      method: 'POST', key: 'gate4-restudy-v2', body: { workspaceId, expectedStudyRevision: corrected.body.data.detail.study.revision },
    })
    const synthesizedV2 = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, {
      method: 'POST', key: 'gate4-synthesize-v2', body: { workspaceId, expectedStudyRevision: restudied.body.data.detail.study.revision },
    })
    const version2 = synthesizedV2.body.data.detail.dnaVersions.find((record) => record.version === 2)
    assert(version2)
    const qaV2 = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version2.id}/qa`, {
      method: 'POST', key: 'gate4-qa-v2', body: {
        workspaceId,
        expectedStudyRevision: synthesizedV2.body.data.detail.study.revision,
        expectedDNAContentDigest: version2.contentDigest,
      },
    })
    const qa2 = qaV2.body.data.detail.dnaQaResults.find((record) => record.dnaVersionId === version2.id)
    assert(qa2)
    const approvedV2 = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${version2.id}/approve`, {
      method: 'POST', key: 'gate4-approve-v2', body: {
        workspaceId,
        expectedStudyRevision: qaV2.body.data.detail.study.revision,
        expectedDNAContentDigest: version2.contentDigest,
        qaResultId: qa2.id,
        acknowledgeAdaptNotCopy: true,
        acknowledgeQAReview: qa2.status === 'requires_user_review',
      },
    })
    const historicalV1 = approvedV2.body.data.detail.dnaVersions.find((record) => record.version === 1)
    const activeV2 = approvedV2.body.data.detail.dnaVersions.find((record) => record.version === 2)
    assert(historicalV1?.approval && activeV2?.approval)
    assert.equal(historicalV1.status, 'superseded')
    assert(historicalV1.supersededAt)
    assert.equal(historicalV1.contentDigest, version1.contentDigest)
    assert.equal(activeV2.status, 'approved')
    assert.equal(approvedV2.body.data.detail.nextAction, 'prepare_target_application')

    for (const goal of ['visual_language', 'story_and_pacing', 'captions', 'color', 'b_roll', 'audio_and_sfx', 'graphics'] as const) {
      const goalReference = await request<EditReferenceDetailData>(runtime.baseUrl, '/v1/edit-references', {
        method: 'POST', key: `gate4-goal-${goal}-create`, body: {
          workspaceId,
          name: `Goal coverage ${goal}`,
          initialGoals: [goal],
        },
      })
      const goalStudyId = goalReference.body.data.detail.study.id
      const goalEvidence = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${goalStudyId}/evidence`, {
        method: 'POST', key: `gate4-goal-${goal}-evidence`, body: {
          workspaceId,
          expectedStudyRevision: goalReference.body.data.detail.study.revision,
          sourceType: 'manual_user_evidence',
          title: `Safe ${goal} direction`,
          category: 'all_goals',
          summary: 'Use clear, original, target-aware editing judgment with restrained craft and no copied identity or layout.',
          intendedUse: 'transferable',
        },
      })
      const goalStudied = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${goalStudyId}/evidence-study`, {
        method: 'POST', key: `gate4-goal-${goal}-study`, body: { workspaceId, expectedStudyRevision: goalEvidence.body.data.detail.study.revision },
      })
      const goalDNA = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${goalStudyId}/preference-dna`, {
        method: 'POST', key: `gate4-goal-${goal}-dna`, body: { workspaceId, expectedStudyRevision: goalStudied.body.data.detail.study.revision },
      })
      const goalVersion = goalDNA.body.data.detail.dnaVersions[0]
      assert(goalVersion)
      const goalQA = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${goalStudyId}/preference-dna/${goalVersion.id}/qa`, {
        method: 'POST', key: `gate4-goal-${goal}-qa`, body: {
          workspaceId,
          expectedStudyRevision: goalDNA.body.data.detail.study.revision,
          expectedDNAContentDigest: goalVersion.contentDigest,
        },
      })
      const goalQAResult = goalQA.body.data.detail.dnaQaResults[0]
      assert(goalQAResult)
      assert.notEqual(goalQAResult.status, 'blocked', `${goal} should be reviewable with complete goal evidence`)
      assert.equal(goalQAResult.checks.find((check) => check.checkId === 'goal_layer_coverage')?.status, 'passed')
    }

    const stored = await readFile(join(root, 'edit-reference-private', 'scopes', editReferenceScopeHash(ownerUserId, workspaceId), 'aggregate.json'), 'utf8')
    assert.match(stored, /preference_dna_qa_completed/)
    assert.match(stored, /preference_dna_version_approved/)
    assert.doesNotMatch(stored, /"(?:rawFrames|rawProviderPayload|signedUrl|apiKey|serviceRoleKey|accessToken)"\s*:/i)
  } finally {
    await runtime.close()
  }

  const restarted = await startRuntime(root)
  try {
    const loaded = await request<EditReferenceDetailData>(restarted.baseUrl, `/v1/edit-references/${referenceId}?workspaceId=${workspaceId}`)
    assert.equal(loaded.body.data.detail.dnaQaResults.length, 2)
    assert.equal(loaded.body.data.detail.dnaVersions.find((record) => record.version === 1)?.status, 'superseded')
    assert.equal(loaded.body.data.detail.dnaVersions.find((record) => record.version === 2)?.status, 'approved')
    assert.equal(loaded.body.data.detail.nextAction, 'prepare_target_application')
    assert.equal(loaded.body.data.detail.applications.length, 0)
  } finally {
    await restarted.close()
  }

  console.log('edit_reference_dna_qa_approval_passed')
} finally {
  await rm(root, { recursive: true, force: true })
}

function cloneVersion(version: PreferenceDNAVersionRecord): PreferenceDNAVersionRecord {
  return structuredClone(version)
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
