import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createEditReferenceApiClient } from '../../src/lib/edit-reference-api-client'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-client-'))
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  API_PORT: '8787',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: root,
  PROVIDER_EXECUTION_ENABLED: 'false',
  WORKER_RUNTIME_MODE: 'mock',
})
const server = createReeditProApiApp(env).listen(0, '127.0.0.1')

try {
  await new Promise<void>((resolvePromise, reject) => {
    server.once('listening', resolvePromise)
    server.once('error', reject)
  })
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const client = createEditReferenceApiClient(baseUrl)
  const workspaceId = 'workspace-api-client-smoke'
  assert.equal(client.available, true)

  const empty = await client.list(workspaceId)
  assert(empty.ok)
  assert.deepEqual(empty.data.references, [])

  const created = await client.create({
    workspaceId,
    name: 'Browser client reference',
    description: 'A browser-safe contract smoke.',
    initialGoals: ['captions', 'graphics'],
  }, 'client-create-001')
  assert(created.ok)
  const referenceId = created.data.detail.reference.id
  const studyId = created.data.detail.study.id

  const loaded = await client.get(workspaceId, referenceId)
  assert(loaded.ok)
  assert.equal(loaded.data.detail.reference.id, referenceId)
  const study = await client.getStudy(workspaceId, studyId)
  assert(study.ok)
  assert.equal(study.data.messages.length, 2)
  const messageList = await client.listStudyMessages(workspaceId, studyId)
  assert(messageList.ok)
  assert.equal(messageList.data.messages.length, 2)

  const appended = await client.appendMessage(studyId, {
    workspaceId,
    expectedStudyRevision: created.data.detail.study.revision,
    clientMessageId: 'browser-client-message-001',
    content: 'Keep captions readable and never copy reference-specific type treatments.',
  }, 'client-message-001')
  assert(appended.ok)
  assert.equal(appended.data.appendedMessageIds.length, 2)
  assert.equal(appended.data.detail.messages.length, 4)

  const evidence = await client.addEvidence(studyId, {
    workspaceId,
    expectedStudyRevision: appended.data.detail.study.revision,
    sourceType: 'manual_user_evidence',
    title: 'Readable caption direction',
    category: 'all_goals',
    summary: 'Use restrained, readable captions and original graphic layouts. Never copy exact wording or brand identity.',
    intendedUse: 'transferable',
  }, 'client-evidence-001')
  assert(evidence.ok)
  assert.equal(evidence.data.detail.nextAction, 'run_evidence_study')

  const studied = await client.runEvidenceStudy(studyId, {
    workspaceId,
    expectedStudyRevision: evidence.data.detail.study.revision,
  }, 'client-evidence-study-001')
  assert(studied.ok)
  assert.equal(studied.data.detail.study.status, 'evidence_ready')
  assert(studied.data.detail.skillRuns.length > 0)

  const dna = await client.synthesizePreferenceDNA(studyId, {
    workspaceId,
    expectedStudyRevision: studied.data.detail.study.revision,
  }, 'client-dna-001')
  assert(dna.ok)
  assert.equal(dna.data.detail.dnaVersions.length, 1)
  assert.equal(dna.data.detail.nextAction, 'run_preference_dna_qa')
  const dnaVersion = dna.data.detail.dnaVersions[0]
  assert(dnaVersion)
  const qa = await client.runPreferenceDNAQA(studyId, dnaVersion.id, {
    workspaceId,
    expectedStudyRevision: dna.data.detail.study.revision,
    expectedDNAContentDigest: dnaVersion.contentDigest,
  }, 'client-dna-qa-001')
  assert(qa.ok)
  const qaResult = qa.data.detail.dnaQaResults[0]
  assert(qaResult)
  assert.equal(qa.data.detail.nextAction, 'approve_preference_dna')
  const approved = await client.approvePreferenceDNA(studyId, dnaVersion.id, {
    workspaceId,
    expectedStudyRevision: qa.data.detail.study.revision,
    expectedDNAContentDigest: dnaVersion.contentDigest,
    qaResultId: qaResult.id,
    acknowledgeAdaptNotCopy: true,
    acknowledgeQAReview: qaResult.status === 'requires_user_review',
  }, 'client-dna-approve-001')
  assert(approved.ok)
  assert.equal(approved.data.detail.reference.dnaStatus, 'approved')
  assert.equal(approved.data.detail.nextAction, 'prepare_target_application')

  const unavailable = createEditReferenceApiClient('')
  assert.equal(unavailable.available, false)
  const unavailableList = await unavailable.list(workspaceId)
  assert.equal(unavailableList.ok, false)
  if (!unavailableList.ok) assert.equal(unavailableList.code, 'EDIT_REFERENCE_BACKEND_UNAVAILABLE')
  const unavailableEvidence = await unavailable.addEvidence(studyId, {
    workspaceId,
    expectedStudyRevision: 1,
    sourceType: 'manual_user_evidence',
    title: 'Unavailable',
    category: 'all_goals',
    summary: 'This request must remain unavailable.',
    intendedUse: 'transferable',
  })
  assert.equal(unavailableEvidence.ok, false)
  const unavailableDNA = await unavailable.synthesizePreferenceDNA(studyId, { workspaceId, expectedStudyRevision: 1 })
  assert.equal(unavailableDNA.ok, false)
  const unavailableQA = await unavailable.runPreferenceDNAQA(studyId, 'dna-unavailable', {
    workspaceId, expectedStudyRevision: 1, expectedDNAContentDigest: '0'.repeat(64),
  })
  assert.equal(unavailableQA.ok, false)
  const unavailableApproval = await unavailable.approvePreferenceDNA(studyId, 'dna-unavailable', {
    workspaceId, expectedStudyRevision: 1, expectedDNAContentDigest: '0'.repeat(64), qaResultId: 'qa-unavailable',
    acknowledgeAdaptNotCopy: true, acknowledgeQAReview: false,
  })
  assert.equal(unavailableApproval.ok, false)

  console.log('edit_reference_api_client_passed')
} finally {
  await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()))
  await rm(root, { recursive: true, force: true })
}
