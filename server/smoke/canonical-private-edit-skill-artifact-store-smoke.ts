import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { z } from 'zod'

import { EditSkillArtifactSchemaRegistry } from
  '../edit-skills/core/edit-skill-artifact-store'
import {
  CANONICAL_PRIVATE_EDIT_SKILL_ARTIFACT_STORE_VERSION,
  createCanonicalPrivateEditSkillArtifactStore,
} from '../services/canonical-private-edit-skill-artifact-store'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'

const root = await mkdtemp(join(
  tmpdir(),
  'reeditpro-canonical-edit-skill-artifacts-',
))
try {
  const schemas = new EditSkillArtifactSchemaRegistry()
  schemas.register('caption_broll_test_artifact_v1', z.object({
    schemaVersion: z.literal('caption_broll_test_artifact_v1'),
    ownerUserId: z.string(),
    workspaceId: z.string(),
    projectId: z.string(),
    message: z.string(),
  }).strict())
  const objectPort = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: root,
  })
  const firstStore = createCanonicalPrivateEditSkillArtifactStore({
    objectPort,
    schemas,
  })
  const scope = {
    ownerUserId: 'owner.caption-broll.restart',
    workspaceId: 'workspace.caption-broll.restart',
    projectId: 'project.caption-broll.restart',
  }
  const value = {
    schemaVersion: 'caption_broll_test_artifact_v1' as const,
    ...scope,
    message: 'Persist exact owner evidence across a worker restart.',
  }
  const reference = await firstStore.putJson({
    artifactType: value.schemaVersion,
    ...scope,
    value,
  })
  const replayReference = await firstStore.putJson({
    artifactType: value.schemaVersion,
    ...scope,
    value,
  })
  assert.deepEqual(replayReference, reference)

  const restartedStore = createCanonicalPrivateEditSkillArtifactStore({
    objectPort,
    schemas,
  })
  assert.deepEqual(await restartedStore.readJson({
    reference,
    ...scope,
  }), value)
  await assert.rejects(() => restartedStore.readJson({
    reference,
    ...scope,
    workspaceId: 'workspace.caption-broll.crossed',
  }), /cross-tenant reread/u)
  await assert.rejects(() => restartedStore.readJson({
    reference: { ...reference, sha256: '0'.repeat(64) },
    ...scope,
  }), /was not found/u)
  await assert.rejects(() => restartedStore.putJson({
    artifactType: value.schemaVersion,
    ...scope,
    value: { ...value, projectId: 'project.caption-broll.crossed' },
  }), /crossed tenant scope/u)

  console.log(JSON.stringify({
    smoke: 'canonical_private_edit_skill_artifact_store',
    status: 'passed',
    checks: 6,
    storeVersion: CANONICAL_PRIVATE_EDIT_SKILL_ARTIFACT_STORE_VERSION,
    storageClass: restartedStore.storageClass,
    createOnlyReplayVerified: true,
    restartRereadVerified: true,
    tenantScopeVerified: true,
    providerCalled: false,
    runtimeExecuted: false,
    publicDeliveryCreated: false,
    productionAuthorityGranted: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}
