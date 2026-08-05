import assert from 'node:assert/strict'

import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_IMPLEMENTATION_STATUS,
  BROLL_PROVIDER_OPERATIONS,
  BROLL_TOOL_OPERATIONS,
  createBrollCanonicalPrivateRuntimeBindings,
} from '../edit-skills/b-roll'
import {
  InMemoryCreateOnlyEditSkillArtifactStore,
  type EditSkillArtifactReference,
  type EditSkillArtifactStore,
} from '../edit-skills/core/edit-skill-artifact-store'
import { skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  EditSkillRuntimeUnconfiguredError,
} from '../edit-skills/core/edit-skill-runtime'
import {
  createInternalFixtureEditSkillRuntime,
} from '../edit-skills/internal-fixture-runtime'
import {
  createEditSkillRuntime,
  createEditSkillRuntimeRegistries,
} from '../edit-skills/registry'

class ExplicitDurableFixtureArtifactStore implements EditSkillArtifactStore {
  readonly storageClass = 'durable' as const
  async putJson(): Promise<EditSkillArtifactReference> {
    throw new Error('Durable fixture writes are outside this construction smoke.')
  }

  async readJson(): Promise<unknown> {
    throw new Error('Durable fixture reads are outside this construction smoke.')
  }
}

function dependencies() {
  return {
    providerAuthority: {
      operations: new Map(BROLL_PROVIDER_OPERATIONS.map((operationId) => [
        operationId,
        'internal_execution_qualified' as const,
      ])),
    },
    toolRegistry: { operationIds: new Set(BROLL_TOOL_OPERATIONS) },
    ...createEditSkillRuntimeRegistries(),
  }
}

assert.throws(
  () => createEditSkillRuntime({
    environmentClass: 'production_server',
  }),
  (error: unknown) => error instanceof EditSkillRuntimeUnconfiguredError &&
    error.code === 'edit_skill_runtime_unconfigured' &&
    /artifactStore.*providerAuthority.*toolRegistry/u.test(error.message),
)

const inMemoryDependencies = dependencies()
assert.throws(() => createEditSkillRuntime({
  environmentClass: 'production_server',
  artifactStore: new InMemoryCreateOnlyEditSkillArtifactStore(
    inMemoryDependencies.artifactSchemaRegistry,
  ),
  ...inMemoryDependencies,
}), /rejects the internal in-memory artifact store/u)

const providerMissing = dependencies()
assert.throws(() => createEditSkillRuntime({
  environmentClass: 'production_server',
  artifactStore: new ExplicitDurableFixtureArtifactStore(),
  ...providerMissing,
  providerAuthority: { operations: new Map() },
}), /provider operation .* missing or under-qualified/u)

const providerUnderQualified = dependencies()
assert.throws(() => createEditSkillRuntime({
  environmentClass: 'production_server',
  artifactStore: new ExplicitDurableFixtureArtifactStore(),
  ...providerUnderQualified,
  providerAuthority: {
    operations: new Map(BROLL_PROVIDER_OPERATIONS.map((operationId) => [
      operationId,
      'planning_qualified' as const,
    ])),
  },
}), /provider operation .* missing or under-qualified/u)

const toolMissing = dependencies()
assert.throws(() => createEditSkillRuntime({
  environmentClass: 'production_server',
  artifactStore: new ExplicitDurableFixtureArtifactStore(),
  ...toolMissing,
  toolRegistry: { operationIds: new Set() },
}), /tool operation .* is not configured/u)

const productionRuntime = createEditSkillRuntime({
  environmentClass: 'production_server',
  artifactStore: new ExplicitDurableFixtureArtifactStore(),
  ...dependencies(),
})
assert.equal(productionRuntime.status, 'configured')
assert.equal(productionRuntime.environmentClass, 'production_server')
assert.ok(
  productionRuntime.pluginRegistry.resolve(
    skillManifestReference(BROLL_CAPABILITY_MANIFEST),
  ),
)
assert.equal(productionRuntime.capabilityRegistry.listManifests().length, 1)
assert.equal(productionRuntime.runtimeBindingRegistry.list().length, 13)

const canonicalPrivateRuntime = createEditSkillRuntime({
  environmentClass: 'canonical_private',
  artifactStore: new ExplicitDurableFixtureArtifactStore(),
  additionalRuntimeBindings: createBrollCanonicalPrivateRuntimeBindings({
    execute: async () => {
      throw new Error('Construction-only runtime executor must not be invoked.')
    },
  }),
  ...dependencies(),
})
assert.equal(canonicalPrivateRuntime.environmentClass, 'canonical_private')
assert.equal(canonicalPrivateRuntime.runtimeBindingRegistry.list().length, 26)
assert.equal(canonicalPrivateRuntime.runtimeBindingRegistry.list().filter((binding) =>
  binding.definition.adapterClass === 'canonical_private_execution_adapter').length, 13)
const wrongEnvironmentDependencies = dependencies()
assert.throws(() => createEditSkillRuntime({
  environmentClass: 'internal_fixture',
  artifactStore: new InMemoryCreateOnlyEditSkillArtifactStore(
    wrongEnvironmentDependencies.artifactSchemaRegistry,
  ),
  additionalRuntimeBindings: createBrollCanonicalPrivateRuntimeBindings({
    execute: async () => {
      throw new Error('Wrong-environment runtime executor must not be invoked.')
    },
  }),
  ...wrongEnvironmentDependencies,
}), /targets another environment/u)

const internalRuntime = createInternalFixtureEditSkillRuntime()
assert.equal(internalRuntime.environmentClass, 'internal_fixture')
assert.equal(
  internalRuntime.artifactStore instanceof InMemoryCreateOnlyEditSkillArtifactStore,
  true,
)
assert.deepEqual(BROLL_IMPLEMENTATION_STATUS, {
  skillImplementation: 'complete',
  planningQualification: 'qualified',
  executionQualification: 'internal_execution_qualified',
  productionQualification: 'blocked_pending_five_live_fixtures',
  liveProvider: 'blocked_pending_explicit_canary_gates',
  publicPlugin: 'available',
  orchestraIntegration: 'not_implemented_by_design',
})

console.log(JSON.stringify({
  status: 'ok',
  productionRuntimeConfigured: true,
  missingDependenciesFailClosed: true,
  productionInMemoryRejected: true,
  providerAuthorityInjected: true,
  toolRegistryInjected: true,
  internalFixtureRuntimeExplicit: true,
  canonicalPrivateRuntimeDependencyInjected: true,
  staleImplementationPendingStatusAbsent: true,
}, null, 2))
