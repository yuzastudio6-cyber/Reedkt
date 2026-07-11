import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { EDIT_REFERENCE_GATE_1_SAFETY_FLAGS, type EditReferenceDetailData, type EditReferenceRecord, type PreferenceStudySessionRecord } from '../../src/types/edit-reference'
import {
  editReferenceScopeHash,
  hashEditReferenceRequest,
  PrivateEditReferenceRepository,
} from '../edit-references/private-edit-reference-repository'
import type { EditReferenceAggregate, EditReferenceRepositoryScope } from '../edit-references/edit-reference-repository'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-repository-'))
const scope: EditReferenceRepositoryScope = {
  localStorageRoot: root,
  ownerUserId: 'repository-user-a',
  workspaceId: 'repository-workspace-a',
}
const repository = new PrivateEditReferenceRepository()

try {
  assert.equal(await repository.read(scope), undefined)
  const requestHash = hashEditReferenceRequest({ name: 'Repository smoke' })
  const createInput = {
    scope,
    operation: 'repository.smoke.create',
    idempotencyKey: 'repository-create-001',
    requestHash,
    mutate: ({ aggregate, now, addAuditEvent }: Parameters<PrivateEditReferenceRepository['mutate']>[0]['mutate'] extends (context: infer C) => unknown ? C : never): EditReferenceDetailData => {
      const reference: EditReferenceRecord = {
        id: 'reference-repository-smoke', workspaceId: scope.workspaceId, name: 'Repository smoke', status: 'active',
        initialGoals: ['visual_language'], currentStudyId: 'study-repository-smoke', revision: 1, createdAt: now, updatedAt: now,
        runtimeSource: 'backend_local_private', evidenceStatus: 'not_complete', dnaStatus: 'not_generated', qaStatus: 'not_run',
      }
      const study: PreferenceStudySessionRecord = {
        id: 'study-repository-smoke', workspaceId: scope.workspaceId, editReferenceId: reference.id, title: 'Repository study',
        status: 'collecting_evidence', initialGoals: ['visual_language'], revision: 1, createdAt: now, updatedAt: now,
        runtimeSource: 'backend_local_private', evidenceStatus: 'not_complete', dnaStatus: 'not_generated', qaStatus: 'not_run',
      }
      aggregate.references.push(reference)
      aggregate.studies.push(study)
      addAuditEvent({ eventType: 'repository_smoke_created', editReferenceId: reference.id, studySessionId: study.id })
      return response(aggregate, reference, study)
    },
  }

  const created = await repository.mutate(createInput)
  assert.equal(created.replayed, false)
  assert.equal(created.data.detail.reference.id, 'reference-repository-smoke')
  const replayed = await repository.mutate(createInput)
  assert.equal(replayed.replayed, true)
  assert.deepEqual(replayed.data, created.data)
  await assert.rejects(repository.mutate({ ...createInput, requestHash: hashEditReferenceRequest({ name: 'different' }) }), (error: unknown) => {
    return error instanceof Error && error.name === 'ApiError' && 'code' in error && error.code === 'IDEMPOTENCY_CONFLICT'
  })

  const concurrentMutation = (key: string) => repository.mutate({
    scope,
    operation: 'repository.smoke.concurrent',
    idempotencyKey: key,
    requestHash: hashEditReferenceRequest({ key }),
    mutate: ({ aggregate, addAuditEvent }) => {
      const reference = aggregate.references[0]
      const study = aggregate.studies[0]
      assert(reference && study)
      addAuditEvent({ eventType: 'repository_smoke_concurrent', editReferenceId: reference.id, studySessionId: study.id })
      return response(aggregate, reference, study)
    },
  })
  await Promise.all([concurrentMutation('concurrent-a'), concurrentMutation('concurrent-b')])
  const afterConcurrency = await repository.read(scope)
  assert(afterConcurrency)
  assert.equal(afterConcurrency.revision, 3)
  assert.equal(afterConcurrency.auditEvents.filter((event) => event.eventType === 'repository_smoke_concurrent').length, 2)

  const aggregatePath = join(root, 'edit-reference-private', 'scopes', editReferenceScopeHash(scope.ownerUserId, scope.workspaceId), 'aggregate.json')
  assert.equal((await stat(aggregatePath)).mode & 0o777, 0o600)
  const persisted = await readFile(aggregatePath, 'utf8')
  const tampered = persisted.replace(/"checksumSha256": "([a-f0-9])/, (_match, first: string) => `"checksumSha256": "${first === 'a' ? 'b' : 'a'}`)
  await writeFile(aggregatePath, tampered, { mode: 0o600 })
  await assert.rejects(repository.read(scope), (error: unknown) => {
    return error instanceof Error && error.name === 'ApiError' && /integrity validation/i.test(error.message)
  })

  console.log('edit_reference_repository_passed')
} finally {
  await rm(root, { recursive: true, force: true })
}

function response(
  aggregate: EditReferenceAggregate,
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
): EditReferenceDetailData {
  return {
    detail: {
      reference,
      study,
      messages: aggregate.messages,
      evidence: [], assets: [], skillRuns: [], dnaVersions: [], dnaQaResults: [], applications: [], usageLogs: [],
      nextAction: 'answer_setup_questions',
      safety: EDIT_REFERENCE_GATE_1_SAFETY_FLAGS,
    },
    replayed: false,
  }
}
