import assert from 'node:assert/strict'

import {
  completeStorytellingLibraryCreateAttempt,
  prepareStorytellingLibraryCreateAttempt,
} from '../../src/lib/motion-studio/storytelling/library-create'
import { verifySignedInStorytellingHandoffs } from '../../src/hooks/useMotionStudioStorytellingLibrary'
import { createStorytellingLibraryItems } from '../../src/lib/motion-studio/storytelling/library-model'
import {
  createLocalInternalProjectHandoff,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'

const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'user-storytelling-library-smoke',
  workspaceId: 'workspace-internal-testing',
}
const setup = {
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'preference-snapshot-storytelling-library-smoke',
} as const

const libraryIdentityFixtures = [
  createLocalInternalProjectHandoff({
    category: 'storytelling',
    editSessionId: 'ordinary-storytelling-category-edit',
    projectId: 'project-normal-storytelling-category',
    projectName: 'Normal Storytelling Video',
    workspaceId: scope.workspaceId,
  }),
  {
    ...createLocalInternalProjectHandoff({
      category: 'education_explainer',
      editSessionId: 'storytelling-edit-retained-v1',
      projectId: 'project-retained-motion',
      projectName: 'Retained Motion Story',
      workspaceId: scope.workspaceId,
    }),
    // Exercise the exact pre-discriminator V1 record. The canonical combined
    // parser normally migrates this to an explicit productWorkflow on read.
    productWorkflow: undefined,
  },
  {
    ...createLocalInternalProjectHandoff({
      category: 'documentary_case_study',
      editSessionId: 'explicit-motion-edit',
      projectId: 'project-explicit-motion',
      projectName: 'Explicit Motion Story',
      workspaceId: scope.workspaceId,
    }),
    productWorkflow: 'motion_studio.storytelling',
  } as LocalInternalProjectHandoff & { productWorkflow: 'motion_studio.storytelling' },
  {
    ...createLocalInternalProjectHandoff({
      category: 'storytelling',
      editSessionId: 'storytelling-edit-explicit-normal',
      projectId: 'project-explicit-normal',
      projectName: 'Explicit Normal Edit',
      workspaceId: scope.workspaceId,
    }),
    productWorkflow: 'video_edit',
  } as LocalInternalProjectHandoff & { productWorkflow: 'video_edit' },
]
assert.deepEqual(
  createStorytellingLibraryItems(libraryIdentityFixtures).map((item) => item.editSessionId),
  ['explicit-motion-edit'],
)
const libraryIdentityItems = createStorytellingLibraryItems(libraryIdentityFixtures, {
  allowLegacyMigration: true,
})
assert.deepEqual(
  libraryIdentityItems.map((item) => item.editSessionId).sort(),
  ['explicit-motion-edit', 'storytelling-edit-retained-v1'],
)
for (const item of libraryIdentityItems) {
  assert.equal(item.workspacePath, `/motion-studio/storytelling/projects/${item.projectId}/edits/${item.editSessionId}`)
  assert.equal(item.editorPath, item.workspacePath)
}

const signedInExplicit = libraryIdentityFixtures[2]
const signedInMissingWorkflow = libraryIdentityFixtures[1]
const signedInNormal = libraryIdentityFixtures[3]
const signedInReadCalls: string[] = []
const signedInVerification = await verifySignedInStorytellingHandoffs(
  [signedInExplicit, signedInMissingWorkflow, signedInNormal],
  async (projectId, editSessionId) => {
    signedInReadCalls.push(`${projectId}:${editSessionId}`)
    return productionReadSuccess(projectId, editSessionId)
  },
)
assert.equal(signedInVerification.state, 'ready')
assert.deepEqual(
  signedInVerification.handoffs.map((handoff) => handoff.editSessionId),
  ['explicit-motion-edit'],
  'signed-in publication must require both the parsed workflow and exact production tuple',
)
assert.match(signedInVerification.message ?? '', /need recovery/u)
assert.deepEqual(signedInReadCalls.sort(), [
  'project-explicit-motion:explicit-motion-edit',
  'project-retained-motion:storytelling-edit-retained-v1',
])

const missingWorkflowOnly = await verifySignedInStorytellingHandoffs(
  [signedInMissingWorkflow],
  async (projectId, editSessionId) => productionReadSuccess(projectId, editSessionId),
)
assert.equal(missingWorkflowOnly.state, 'unavailable')
assert.equal(missingWorkflowOnly.handoffs.length, 0)
assert.match(missingWorkflowOnly.message ?? '', /No empty library was assumed/u)

const crossedProduction = await verifySignedInStorytellingHandoffs(
  [signedInExplicit],
  async (_projectId, editSessionId) => productionReadSuccess('project-crossed', editSessionId),
)
assert.equal(crossedProduction.state, 'unavailable')
assert.equal(crossedProduction.handoffs.length, 0)

const firstAttempt = prepareStorytellingLibraryCreateAttempt({
  name: '  The   Hidden Operation  ',
  scope,
  createIntentId: () => 'intent-storytelling-library-smoke',
})
assert.equal(firstAttempt.normalizedName, 'The Hidden Operation')

let createCalls = 0
let persistCalls = 0
let firstPersistedHandoff: LocalInternalProjectHandoff | undefined
const dependencies = {
  async createBackendProject() {
    createCalls += 1
    return { status: 'created' as const, projectId: 'project-storytelling-library-smoke' }
  },
  async persistBackendHandoff(_scope: ProjectPersistenceScope, handoff: LocalInternalProjectHandoff) {
    persistCalls += 1
    firstPersistedHandoff ??= handoff
    if (persistCalls === 1) {
      return {
        ok: false,
        persisted: false,
        warnings: [],
        errorMessage: 'Injected recoverable persistence failure.',
      }
    }
    return { ok: true, persisted: true, warnings: [] }
  },
}

await assert.rejects(
  completeStorytellingLibraryCreateAttempt({
    attempt: firstAttempt,
    backendPersistenceRequired: true,
    dependencies,
    scope,
    setup,
  }),
  /Injected recoverable persistence failure/,
)
assert.equal(createCalls, 1)
assert.ok(firstAttempt.project)
assert.ok(firstAttempt.handoff)

const retryAttempt = prepareStorytellingLibraryCreateAttempt({
  name: 'The Hidden Operation',
  previous: firstAttempt,
  scope,
  createIntentId: () => 'must-not-be-used',
})
assert.equal(retryAttempt, firstAttempt)

const recovered = await completeStorytellingLibraryCreateAttempt({
  attempt: retryAttempt,
  backendPersistenceRequired: true,
  dependencies,
  scope,
  setup,
})
assert.equal(createCalls, 1, 'retry must not create a second project')
assert.equal(persistCalls, 2)
assert.equal(recovered.handoff, firstPersistedHandoff, 'retry must preserve the exact named-edit handoff')
assert.equal(recovered.project.id, 'project-storytelling-library-smoke')
assert.equal(recovered.handoff.projectId, recovered.project.id)
assert.equal(recovered.handoff.category, 'storytelling')
assert.equal(recovered.handoff.setup?.preferenceSnapshotId, setup.preferenceSnapshotId)
assert.equal(recovered.persistence, 'private_backend')

let revalidationCreateCalls = 0
let revalidationPersistCalls = 0
const rehydratedAttempt = {
  ...recovered.attempt,
  project: { ...recovered.project },
  handoff: { ...recovered.handoff },
  backendProjectRevalidationRequired: true as const,
}
await completeStorytellingLibraryCreateAttempt({
  attempt: rehydratedAttempt,
  backendPersistenceRequired: true,
  dependencies: {
    async createBackendProject() {
      revalidationCreateCalls += 1
      return { status: 'created' as const, projectId: recovered.project.id }
    },
    async persistBackendHandoff() {
      revalidationPersistCalls += 1
      return { ok: true, persisted: true, warnings: [] }
    },
  },
  scope,
  setup,
})
assert.equal(revalidationCreateCalls, 1, 'reload recovery must revalidate the exact idempotent project intent')
assert.equal(revalidationPersistCalls, 1)
assert.equal(rehydratedAttempt.backendProjectRevalidationRequired, undefined)

let mismatchedRevalidationPersistCalls = 0
await assert.rejects(
  completeStorytellingLibraryCreateAttempt({
    attempt: {
      ...recovered.attempt,
      project: { ...recovered.project },
      handoff: { ...recovered.handoff },
      backendProjectRevalidationRequired: true,
    },
    backendPersistenceRequired: true,
    dependencies: {
      async createBackendProject() {
        return { status: 'created' as const, projectId: 'different-project-after-reload' }
      },
      async persistBackendHandoff() {
        mismatchedRevalidationPersistCalls += 1
        return { ok: true, persisted: true, warnings: [] }
      },
    },
    scope,
    setup,
  }),
  /could not be revalidated/,
)
assert.equal(mismatchedRevalidationPersistCalls, 0)

let missingProjectPersistCalls = 0
const missingProjectAttempt = prepareStorytellingLibraryCreateAttempt({
  name: 'Backend required',
  scope,
  createIntentId: () => 'intent-backend-required-smoke',
})
await assert.rejects(
  completeStorytellingLibraryCreateAttempt({
    attempt: missingProjectAttempt,
    backendPersistenceRequired: true,
    dependencies: {
      async createBackendProject() {
        return { status: 'not_configured' as const }
      },
      async persistBackendHandoff() {
        missingProjectPersistCalls += 1
        return { ok: true, persisted: true, warnings: [] }
      },
    },
    scope,
    setup,
  }),
  /could not be created for this workspace/,
)
assert.equal(missingProjectPersistCalls, 0)

const localAttempt = prepareStorytellingLibraryCreateAttempt({
  name: 'Private local draft',
  scope,
  createIntentId: () => 'intent-local-storytelling-smoke',
})
let localPersistCalls = 0
const local = await completeStorytellingLibraryCreateAttempt({
  attempt: localAttempt,
  backendPersistenceRequired: false,
  dependencies: {
    async createBackendProject() {
      return { status: 'not_configured' as const }
    },
    async persistBackendHandoff() {
      localPersistCalls += 1
      return { ok: true, persisted: false, warnings: [] }
    },
  },
  scope,
  setup,
})
assert.equal(local.project.id, 'local-project-intent-local-storytelling-smoke')
assert.equal(local.persistence, 'browser_local')
assert.equal(localPersistCalls, 0, 'offline local fallback must not attempt a handoff save without a backend project')

let staleLocalCreateCalls = 0
let staleLocalPersistedHandoff: LocalInternalProjectHandoff | undefined
const staleLocalJournalAttempt = {
  ...local.attempt,
  project: { ...local.project },
  handoff: { ...local.handoff },
  backendProjectRevalidationRequired: true as const,
}
const migratedFromLocalJournal = await completeStorytellingLibraryCreateAttempt({
  attempt: staleLocalJournalAttempt,
  backendPersistenceRequired: false,
  dependencies: {
    async createBackendProject() {
      staleLocalCreateCalls += 1
      return { status: 'created' as const, projectId: 'project-now-backed-storytelling-smoke' }
    },
    async persistBackendHandoff(_scope, handoff) {
      staleLocalPersistedHandoff = handoff
      return { ok: true, persisted: true, warnings: [] }
    },
  },
  scope,
  setup,
})
assert.equal(staleLocalCreateCalls, 1, 'a restored local-only resolution must be checked against the current runtime')
assert.equal(migratedFromLocalJournal.persistence, 'private_backend')
assert.equal(migratedFromLocalJournal.project.id, 'project-now-backed-storytelling-smoke')
assert.equal(migratedFromLocalJournal.handoff.projectId, 'project-now-backed-storytelling-smoke')
assert.equal(staleLocalPersistedHandoff?.projectId, 'project-now-backed-storytelling-smoke')
assert.equal(migratedFromLocalJournal.handoff.editSessionId, local.handoff.editSessionId)

const backendWithoutReadbackAttempt = prepareStorytellingLibraryCreateAttempt({
  name: 'Backend response without readback',
  scope,
  createIntentId: () => 'intent-backend-without-readback-smoke',
})
await assert.rejects(
  completeStorytellingLibraryCreateAttempt({
    attempt: backendWithoutReadbackAttempt,
    backendPersistenceRequired: false,
    dependencies: {
      async createBackendProject() {
        return { status: 'created' as const, projectId: 'project-backend-without-readback-smoke' }
      },
      async persistBackendHandoff() {
        return {
          ok: true,
          persisted: false,
          warnings: ['Backend persistence was not configured.'],
        }
      },
    },
    scope,
    setup,
  }),
  /could not be saved for account recovery/,
)
assert.ok(backendWithoutReadbackAttempt.handoff)

const unknownBackendAttempt = prepareStorytellingLibraryCreateAttempt({
  name: 'Unknown backend outcome',
  scope,
  createIntentId: () => 'intent-unknown-backend-smoke',
})
await assert.rejects(
  completeStorytellingLibraryCreateAttempt({
    attempt: unknownBackendAttempt,
    backendPersistenceRequired: false,
    dependencies: {
      async createBackendProject() {
        return {
          status: 'failed' as const,
          errorMessage: 'Backend outcome is unknown; retry the exact intent.',
        }
      },
      async persistBackendHandoff() {
        throw new Error('Persistence must not run after an unknown project outcome.')
      },
    },
    scope,
    setup,
  }),
  /Backend outcome is unknown/,
)
assert.equal(unknownBackendAttempt.project, undefined)
assert.equal(unknownBackendAttempt.handoff, undefined)

const renamedAttempt = prepareStorytellingLibraryCreateAttempt({
  name: 'A different story',
  previous: firstAttempt,
  scope,
  createIntentId: () => 'intent-renamed-storytelling-smoke',
})
assert.notEqual(renamedAttempt, firstAttempt)
assert.equal(renamedAttempt.createIntentId, 'intent-renamed-storytelling-smoke')

const otherScopeAttempt = prepareStorytellingLibraryCreateAttempt({
  name: firstAttempt.normalizedName,
  previous: firstAttempt,
  scope: { ...scope, userId: 'different-user' },
  createIntentId: () => 'intent-different-workspace-smoke',
})
assert.notEqual(otherScopeAttempt, firstAttempt)
assert.equal(otherScopeAttempt.createIntentId, 'intent-different-workspace-smoke')
await assert.rejects(
  completeStorytellingLibraryCreateAttempt({
    attempt: firstAttempt,
    backendPersistenceRequired: true,
    dependencies,
    scope: { ...scope, userId: 'different-user' },
    setup,
  }),
  /active workspace changed/,
)

console.log(JSON.stringify({
  smoke: 'motion-studio-storytelling-library-create',
  status: 'passed',
  retainedCreateIntentAcrossRetry: true,
  exactProjectEditIdentityAcrossRetry: true,
  exactProjectIdentityRevalidatedAfterReload: true,
  mismatchedReloadIdentityFailsClosed: true,
  backendReadbackPrecedesBrowserPublication: true,
  signedInWorkflowAndProductionReverified: true,
  missingSignedInWorkflowDoesNotBecomeEmptyState: true,
  crossProjectProductionSubstitutionFailsClosed: true,
  configuredBackendFailsClosed: true,
  unknownBackendOutcomeFailsClosed: true,
  localFallbackRemainsExplicit: true,
  staleLocalJournalRevalidatesCurrentRuntime: true,
  workspaceScopeBound: true,
  providerCalls: 0,
  renderJobs: 0,
  creditMutations: 0,
}, null, 2))

function productionReadSuccess(projectId: string, editSessionId: string) {
  const now = '2026-07-22T20:00:00.000Z'
  return {
    ok: true,
    statusCode: 200,
    data: {
      production: {
        id: `production-${projectId}-${editSessionId}`,
        projectId,
        editSessionId,
        moduleId: 'storytelling' as const,
        moduleCatalogVersion: 'motion-studio-module-catalog-v1' as const,
        stageProfileId: 'motion-studio-storytelling-stage-profile-v1' as const,
        status: 'planning' as const,
        currentStage: 'director_brief' as const,
        workspaceMode: 'guided' as const,
        defaultProductionMode: 'hybrid_directed' as const,
        userFacingStrategy: "Director's Hybrid" as const,
        recordVersion: 1,
        createdAt: now,
        updatedAt: now,
        localCandidateOnly: true as const,
      },
    },
    warnings: [],
    mockOnly: false,
  }
}
