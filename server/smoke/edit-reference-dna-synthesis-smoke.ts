import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { editReferenceScopeHash } from '../edit-references/private-edit-reference-repository'
import { synthesizeEditReferencePreferenceDNA } from '../edit-references/edit-reference-dna-synthesis'
import type { EditReferenceApiSuccess, EditReferenceDetailData } from '../../src/types/edit-reference'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-gate3-'))
const workspaceId = 'workspace-edit-reference-dna'
const ownerUserId = 'mock-user-runtime'

try {
  const runtime = await startRuntime(root)
  let referenceId = ''
  try {
    const created = await request<EditReferenceDetailData>(runtime.baseUrl, '/v1/edit-references', {
      method: 'POST', key: 'gate3-create-reference', body: {
        workspaceId,
        name: 'Evidence-linked documentary DNA',
        initialGoals: ['visual_language', 'story_and_pacing'],
      },
    })
    referenceId = created.body.data.detail.reference.id
    const studyId = created.body.data.detail.study.id

    const premature = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, {
      method: 'POST', key: 'gate3-premature-dna', body: { workspaceId, expectedStudyRevision: created.body.data.detail.study.revision },
    })
    assert.equal(premature.status, 409)
    assert.equal(premature.code, 'VALIDATION_FAILED')

    const evidence = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence`, {
      method: 'POST', key: 'gate3-add-evidence', body: {
        workspaceId,
        expectedStudyRevision: created.body.data.detail.study.revision,
        sourceType: 'manual_user_evidence',
        title: 'Measured evidence-led direction',
        category: 'all_goals',
        summary: 'Use measured pacing, original evidence-card compositions, readable labels, and quiet visual emphasis. Never copy exact layouts, marks, or creator identity.',
        intendedUse: 'transferable',
      },
    })
    const studied = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence-study`, {
      method: 'POST', key: 'gate3-study-evidence', body: { workspaceId, expectedStudyRevision: evidence.body.data.detail.study.revision },
    })
    assert.equal(studied.body.data.detail.nextAction, 'generate_preference_dna')

    const synthesizePayload = { workspaceId, expectedStudyRevision: studied.body.data.detail.study.revision }
    const synthesized = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, {
      method: 'POST', key: 'gate3-synthesize-dna-v1', body: synthesizePayload,
    })
    assert.equal(synthesized.status, 201)
    assert.equal(synthesized.replayed, 'false')
    assert.equal(synthesized.body.data.detail.study.status, 'dna_ready')
    assert.equal(synthesized.body.data.detail.study.dnaStatus, 'review_required')
    assert.equal(synthesized.body.data.detail.reference.dnaStatus, 'review_required')
    assert.equal(synthesized.body.data.detail.nextAction, 'review_preference_dna')
    assert.equal(synthesized.body.data.detail.dnaQaResults.length, 0)
    assert.equal(synthesized.body.data.detail.applications.length, 0)
    assert.equal(synthesized.body.data.detail.dnaVersions.length, 1)

    const version1 = synthesized.body.data.detail.dnaVersions[0]
    assert(version1)
    assert.equal(version1.version, 1)
    assert.equal(version1.status, 'review_required')
    assert.equal(version1.synthesisVersion, 'edit-reference-dna-synthesis-v1')
    assert.equal(version1.runtimeSource, 'verified_mock')
    assert.equal(version1.inputEvidenceDigest.length, 64)
    assert.equal(version1.contentDigest.length, 64)
    assert(version1.layers.length >= 6)
    assert(version1.rules.some((rule) => rule.kind === 'must_follow'))
    assert(version1.rules.some((rule) => rule.kind === 'do_not_copy'))
    assert(version1.doNotCopyRuleCount >= 5)
    assert.equal(version1.doNotCopyRuleCount, version1.rules.filter((rule) => rule.kind === 'do_not_copy').length)
    assert(version1.layers.some((layer) => layer.layerId === 'do_not_copy_rules' && layer.coverage === 'covered'))
    assert.equal(version1.adaptedNotCopied, true)
    assert.deepEqual(Object.values({
      providerCallMade: version1.providerCallMade,
      modelCallMade: version1.modelCallMade,
      mediaProcessingStarted: version1.mediaProcessingStarted,
      workerJobCreated: version1.workerJobCreated,
      generationRequestCreated: version1.generationRequestCreated,
      renderJobCreated: version1.renderJobCreated,
      creditReservedOrSpent: version1.creditReservedOrSpent,
    }), Array(7).fill(false))
    const evidenceIds = new Set(version1.inputEvidenceRevisions.map((record) => record.evidenceId))
    assert(version1.rules.every((rule) => rule.evidenceIds.every((id) => evidenceIds.has(id))))
    assert.equal(synthesized.body.data.detail.messages.at(-1)?.runtimeSource, 'deterministic_dna')
    assert.match(synthesized.body.data.detail.messages.at(-1)?.content ?? '', /nothing has been approved or applied/i)

    const deterministicInput = {
      reference: studied.body.data.detail.reference,
      study: studied.body.data.detail.study,
      evidence: studied.body.data.detail.evidence,
      skillRuns: studied.body.data.detail.skillRuns,
      existingVersions: [],
      now: '2026-07-11T12:00:00.000Z',
    }
    const deterministicFirst = synthesizeEditReferencePreferenceDNA(deterministicInput)
    const deterministicSecond = synthesizeEditReferencePreferenceDNA({
      ...deterministicInput,
      now: '2026-07-11T13:00:00.000Z',
    })
    assert.notEqual(deterministicFirst.id, deterministicSecond.id, 'version identities remain unique records')
    assert.equal(deterministicFirst.inputEvidenceDigest, deterministicSecond.inputEvidenceDigest)
    assert.equal(deterministicFirst.contentDigest, deterministicSecond.contentDigest)
    assert.deepEqual(deterministicFirst.rules, deterministicSecond.rules)
    assert.deepEqual(deterministicFirst.layers, deterministicSecond.layers)

    const replay = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, {
      method: 'POST', key: 'gate3-synthesize-dna-v1', body: synthesizePayload,
    })
    assert.equal(replay.replayed, 'true')
    assert.deepEqual(replay.body, synthesized.body)

    const unchanged = await requestError(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, {
      method: 'POST', key: 'gate3-synthesize-unchanged', body: { workspaceId, expectedStudyRevision: synthesized.body.data.detail.study.revision },
    })
    assert.equal(unchanged.status, 409)
    assert.equal(unchanged.code, 'VALIDATION_FAILED')

    const sourceEvidence = synthesized.body.data.detail.evidence.find((record) => record.sourceType === 'manual_user_evidence')
    assert(sourceEvidence)
    const corrected = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence`, {
      method: 'POST', key: 'gate3-correct-evidence', body: {
        workspaceId,
        expectedStudyRevision: synthesized.body.data.detail.study.revision,
        sourceType: 'manual_user_evidence',
        title: 'Measured evidence-led direction v2',
        category: 'all_goals',
        summary: 'Use deliberate pacing, original document compositions, readable labels, and a restrained visual hierarchy designed for the target edit.',
        intendedUse: 'transferable',
        supersedesEvidenceId: sourceEvidence.id,
      },
    })
    assert.equal(corrected.body.data.detail.reference.dnaStatus, 'not_generated')
    assert.equal(corrected.body.data.detail.nextAction, 'run_evidence_study')
    assert.equal(corrected.body.data.detail.dnaVersions.find((record) => record.version === 1)?.status, 'superseded')
    const restudied = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/evidence-study`, {
      method: 'POST', key: 'gate3-restudy-evidence', body: { workspaceId, expectedStudyRevision: corrected.body.data.detail.study.revision },
    })
    const synthesizedV2 = await request<EditReferenceDetailData>(runtime.baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, {
      method: 'POST', key: 'gate3-synthesize-dna-v2', body: { workspaceId, expectedStudyRevision: restudied.body.data.detail.study.revision },
    })
    assert.equal(synthesizedV2.body.data.detail.dnaVersions.length, 2)
    const persistedV1 = synthesizedV2.body.data.detail.dnaVersions.find((record) => record.version === 1)
    const version2 = synthesizedV2.body.data.detail.dnaVersions.find((record) => record.version === 2)
    assert(persistedV1 && version2)
    assert.equal(persistedV1.status, 'superseded')
    assert.equal(persistedV1.contentDigest, version1.contentDigest, 'superseding a version must not mutate its immutable content')
    assert.equal(version2.status, 'review_required')
    assert.notEqual(version2.inputEvidenceDigest, version1.inputEvidenceDigest)
    assert.notEqual(version2.contentDigest, version1.contentDigest)

    const stored = await readFile(join(root, 'edit-reference-private', 'scopes', editReferenceScopeHash(ownerUserId, workspaceId), 'aggregate.json'), 'utf8')
    assert.doesNotMatch(stored, /"(?:rawFrames|rawProviderPayload|signedUrl|apiKey|serviceRoleKey|accessToken)"\s*:/i)
    assert.match(stored, new RegExp(version1.contentDigest))
    assert.match(stored, new RegExp(version2.contentDigest))
    assert.match(stored, /preference_dna_version_created/)
    assert.match(stored, /preference_dna_candidate_invalidated/)
  } finally {
    await runtime.close()
  }

  const restarted = await startRuntime(root)
  try {
    const loaded = await request<EditReferenceDetailData>(restarted.baseUrl, `/v1/edit-references/${referenceId}?workspaceId=${workspaceId}`)
    assert.equal(loaded.body.data.detail.dnaVersions.length, 2)
    assert.equal(loaded.body.data.detail.dnaVersions.find((record) => record.version === 1)?.status, 'superseded')
    assert.equal(loaded.body.data.detail.dnaVersions.find((record) => record.version === 2)?.status, 'review_required')
    assert.equal(loaded.body.data.detail.nextAction, 'review_preference_dna')
  } finally {
    await restarted.close()
  }

  console.log('edit_reference_dna_synthesis_passed')
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
