import assert from 'node:assert/strict'

import {
  EditSkillRuntimeDispatcher,
  SkillJobRuntimeBindingRegistry,
  createSkillCapabilityManifest,
  createSkillJobRuntimeBinding,
  hashSkillValue,
  skillManifestReference,
  type SkillJobRuntimeBinding,
  type SkillJobRuntimeBindingDefinition,
} from '../edit-skills/core'
import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import {
  BROLL_RUNTIME_BINDINGS,
  BROLL_WORK_GRAPH_JOB_DEFINITIONS,
} from '../edit-skills/b-roll/b-roll-runtime-bindings'
import {
  editSkillArtifactSchemaRegistry,
  editSkillReferenceCatalog,
  editSkillRuntimeBindingRegistry,
} from '../edit-skills/internal-fixture-runtime'

const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const assignmentHash = hashSkillValue({ assignment: 'runtime-binding-fixture' })
const range = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }

function definitionCore(definition: SkillJobRuntimeBindingDefinition) {
  return {
    schemaVersion: definition.schemaVersion,
    skillKey: definition.skillKey,
    skillVersion: definition.skillVersion,
    contractVersion: definition.contractVersion,
    manifestHash: definition.manifestHash,
    jobType: definition.jobType,
    operationId: definition.operationId,
    operationKind: definition.operationKind,
    workerClass: definition.workerClass,
    inputArtifactTypes: [...definition.inputArtifactTypes],
    outputArtifactTypes: [...definition.outputArtifactTypes],
    allowedPhases: [...definition.allowedPhases],
    qualificationRequirement: definition.qualificationRequirement,
    runtimeAdapterId: definition.runtimeAdapterId,
    bindingKind: definition.bindingKind,
    approvalRequired: definition.approvalRequired,
    qualificationRequired: definition.qualificationRequired,
    callerSelectedExecutableAllowed: definition.callerSelectedExecutableAllowed,
    mutatesOnlyAssignmentRange: definition.mutatesOnlyAssignmentRange,
    createsMedia: definition.createsMedia,
    ...(definition.providerRouteKey ? { providerRouteKey: definition.providerRouteKey } : {}),
  }
}

function bindingRegistry(input: {
  omitJob?: string
  replace?: ReadonlyMap<string, SkillJobRuntimeBinding>
  add?: SkillJobRuntimeBinding
} = {}): SkillJobRuntimeBindingRegistry {
  const registry = new SkillJobRuntimeBindingRegistry()
  for (const binding of BROLL_RUNTIME_BINDINGS) {
    if (binding.definition.jobType === input.omitJob) continue
    registry.register(input.replace?.get(binding.definition.jobType) ?? binding)
  }
  if (input.add) registry.register(input.add)
  return registry
}

function changedBinding(
  jobType: string,
  changes: Partial<ReturnType<typeof definitionCore>>,
): SkillJobRuntimeBinding {
  const existing = BROLL_RUNTIME_BINDINGS.find((binding) =>
    binding.definition.jobType === jobType)
  assert.ok(existing)
  return createSkillJobRuntimeBinding({
    definition: { ...definitionCore(existing.definition), ...changes },
    handler: existing.handler,
  })
}

function validate(registry: SkillJobRuntimeBindingRegistry, operations = editSkillReferenceCatalog) {
  registry.validateManifest({
    manifest: BROLL_CAPABILITY_MANIFEST,
    artifacts: editSkillArtifactSchemaRegistry,
    operations,
    workGraphJobs: BROLL_WORK_GRAPH_JOB_DEFINITIONS,
  })
}

assert.equal(BROLL_RUNTIME_BINDINGS.length, BROLL_CAPABILITY_MANIFEST.supportedJobTypes.length)
assert.deepEqual(
  new Set(BROLL_RUNTIME_BINDINGS.map((binding) => binding.definition.jobType)),
  new Set(BROLL_CAPABILITY_MANIFEST.supportedJobTypes.map((job) => job.jobType)),
)
validate(editSkillRuntimeBindingRegistry)

const { manifestHash: _manifestHash, ...manifestCore } = BROLL_CAPABILITY_MANIFEST
assert.equal(_manifestHash, BROLL_CAPABILITY_MANIFEST.manifestHash)
const driftManifest = createSkillCapabilityManifest({
  ...manifestCore,
  supportedJobTypes: manifestCore.supportedJobTypes.map((job, index) => index === 0
    ? { ...job, requiredArtifactTypes: ['source_inventory_v1'] }
    : job),
})
const driftRegistry = new SkillJobRuntimeBindingRegistry()
for (const binding of BROLL_RUNTIME_BINDINGS) {
  driftRegistry.register(createSkillJobRuntimeBinding({
    definition: {
      ...definitionCore(binding.definition),
      manifestHash: driftManifest.manifestHash,
    },
    handler: binding.handler,
  }))
}
assert.throws(() => driftRegistry.validateManifest({
  manifest: driftManifest,
  artifacts: editSkillArtifactSchemaRegistry,
  operations: editSkillReferenceCatalog,
  workGraphJobs: BROLL_WORK_GRAPH_JOB_DEFINITIONS,
}), /differs from its manifest job capability/u)

const dispatcher = new EditSkillRuntimeDispatcher(editSkillRuntimeBindingRegistry)
const dispatchReceipts = []
for (const binding of BROLL_RUNTIME_BINDINGS) {
  const definition = binding.definition
  const workItemCore = {
    workItemKey: `fixture-${definition.jobType}`,
    jobType: definition.jobType,
    operationId: definition.operationId,
    workerClass: definition.workerClass,
    assignmentId: 'runtime-binding-assignment',
    assignmentHash,
    manifestRef,
    authorizedRange: range,
    dependencyKeys: [],
    expectedOutputType: definition.outputArtifactTypes[0],
    maximumCreditBudget: 0,
    maximumAttempts: 1,
    required: true,
    qaLineageKeys: ['b_roll.runtime.binding_fixture'],
    ...(definition.providerRouteKey ? { providerRouteId: definition.providerRouteKey } : {}),
    callerSelectedExecutableAllowed: false as const,
    outsideAuthorizedRangeModified: false as const,
  }
  const workItem = { ...workItemCore, workItemHash: hashSkillValue(workItemCore) }
  dispatchReceipts.push(await dispatcher.executeInternalFixture({
    manifestRef,
    workItem,
    authorizedPhase: definition.allowedPhases[0],
    inputArtifactTypes: definition.inputArtifactTypes,
  }))
}
assert.equal(dispatchReceipts.length, 13)
assert.equal(new Set(dispatchReceipts.map((receipt) => receipt.receiptHash)).size, 13)
assert.equal(dispatchReceipts.every((receipt) => receipt.status === 'succeeded'), true)
assert.equal(dispatchReceipts.reduce((total, receipt) => total + receipt.providerRequestCount, 0), 0)
assert.equal(dispatchReceipts.reduce((total, receipt) => total + receipt.publicArtifactCount, 0), 0)
assert.equal(dispatchReceipts.reduce((total, receipt) => total + receipt.productionMutationCount, 0), 0)

assert.throws(
  () => validate(bindingRegistry({ omitJob: 'run_b_roll_preview_qa' })),
  /has no runtime binding/iu,
)

const unknownJobBinding = changedBinding('run_b_roll_preview_qa', {
  jobType: 'unknown_b_roll_job',
  runtimeAdapterId: 'b_roll.runtime.unknown_job.v1',
})
assert.throws(
  () => validate(bindingRegistry({ add: unknownJobBinding })),
  /has no manifest-supported job/iu,
)

const duplicateRegistry = bindingRegistry()
assert.throws(
  () => duplicateRegistry.register(BROLL_RUNTIME_BINDINGS[0]),
  /Duplicate runtime binding/iu,
)

const workerMismatch = changedBinding('run_b_roll_preview_qa', {
  workerClass: 'wrong_worker',
})
assert.throws(
  () => validate(bindingRegistry({ replace: new Map([['run_b_roll_preview_qa', workerMismatch]]) })),
  /worker class differs/iu,
)

const outputMismatch = changedBinding('run_b_roll_preview_qa', {
  outputArtifactTypes: ['b_roll_result_receipt_v1'],
})
assert.throws(
  () => validate(bindingRegistry({ replace: new Map([['run_b_roll_preview_qa', outputMismatch]]) })),
  /output differs/iu,
)

const unknownArtifact = changedBinding('run_b_roll_preview_qa', {
  inputArtifactTypes: ['unknown_runtime_artifact_v1'],
})
assert.throws(
  () => validate(bindingRegistry({ replace: new Map([['run_b_roll_preview_qa', unknownArtifact]]) })),
  /unknown artifact/iu,
)

const providerQualifications = new Map(editSkillReferenceCatalog.providerOperationQualifications)
providerQualifications.set('provider.google.generate_b_roll_candidate.v1', 'planning_qualified')
assert.throws(
  () => validate(bindingRegistry(), {
    ...editSkillReferenceCatalog,
    providerOperationQualifications: providerQualifications,
  }),
  /unqualified provider route/iu,
)

const toolOperations = new Set(editSkillReferenceCatalog.toolOperations)
toolOperations.delete('tool.ffprobe.inspect_approved_media.v1')
assert.throws(
  () => validate(bindingRegistry(), { ...editSkillReferenceCatalog, toolOperations }),
  /unknown tool operation/iu,
)

assert.throws(
  () => createSkillJobRuntimeBinding({
    definition: {
      ...definitionCore(BROLL_RUNTIME_BINDINGS[0].definition),
      callerSelectedExecutableAllowed: true as never,
    },
    handler: BROLL_RUNTIME_BINDINGS[0].handler,
  }),
)
assert.throws(
  () => createSkillJobRuntimeBinding({
    definition: {
      ...definitionCore(BROLL_RUNTIME_BINDINGS[0].definition),
      mutatesOnlyAssignmentRange: false as never,
    },
    handler: BROLL_RUNTIME_BINDINGS[0].handler,
  }),
)
assert.throws(
  () => createSkillJobRuntimeBinding({
    definition: {
      ...definitionCore(BROLL_RUNTIME_BINDINGS[0].definition),
      approvalRequired: false,
    },
    handler: BROLL_RUNTIME_BINDINGS[0].handler,
  }),
  /approval/iu,
)
assert.throws(
  () => createSkillJobRuntimeBinding({
    definition: {
      ...definitionCore(BROLL_RUNTIME_BINDINGS[0].definition),
      qualificationRequired: false as never,
    },
    handler: BROLL_RUNTIME_BINDINGS[0].handler,
  }),
)
assert.throws(
  () => createSkillJobRuntimeBinding({
    definition: {
      ...definitionCore(BROLL_RUNTIME_BINDINGS[0].definition),
      operationKind: 'no_action',
      bindingKind: 'no_action',
      createsMedia: true,
    },
    handler: BROLL_RUNTIME_BINDINGS[0].handler,
  }),
  /no-action/iu,
)
assert.throws(
  () => new SkillJobRuntimeBindingRegistry().register({
    definition: BROLL_RUNTIME_BINDINGS[0].definition,
    handler: undefined as never,
  }),
  /executable adapter/iu,
)
assert.throws(
  () => editSkillRuntimeBindingRegistry.resolve({
    manifestRef,
    jobType: 'unknown_b_roll_job',
  }),
  /unavailable/iu,
)

console.log(JSON.stringify({
  status: 'ok',
  manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
  supportedJobs: BROLL_CAPABILITY_MANIFEST.supportedJobTypes.length,
  runtimeBindings: BROLL_RUNTIME_BINDINGS.length,
  executableAdapters: BROLL_RUNTIME_BINDINGS.filter((binding) =>
    typeof binding.handler === 'function').length,
  fixtureDispatchReceipts: dispatchReceipts.length,
  fixtureProviderRequests: 0,
  adversarialCases: 14,
}, null, 2))
