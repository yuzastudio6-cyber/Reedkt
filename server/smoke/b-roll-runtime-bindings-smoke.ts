import assert from 'node:assert/strict'

import {
  EditSkillRuntimeDispatcher,
  SkillJobRuntimeBindingRegistry,
  createEditSkillPlanApproval,
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
    requiredQualification: definition.requiredQualification,
    adapterClass: definition.adapterClass,
    environmentClass: definition.environmentClass,
    runtimeAdapterId: definition.runtimeAdapterId,
    approvalRequired: definition.approvalRequired,
    providerAuthorityRequired: definition.providerAuthorityRequired,
    toolAuthorityRequired: definition.toolAuthorityRequired,
    privateArtifactRequired: definition.privateArtifactRequired,
    callerSelectedExecutableAllowed: definition.callerSelectedExecutableAllowed,
    automaticRetryAllowed: definition.automaticRetryAllowed,
    alternateProviderFallbackAllowed: definition.alternateProviderFallbackAllowed,
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
function workItemFor(definition: SkillJobRuntimeBindingDefinition) {
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
  return { ...workItemCore, workItemHash: hashSkillValue(workItemCore) }
}

function approvalFor(workItem: ReturnType<typeof workItemFor>) {
  return createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: workItem.assignmentId,
    assignmentHash: workItem.assignmentHash,
    planId: 'runtime-binding-plan',
    planHash: hashSkillValue({ plan: 'runtime-binding-plan' }),
    manifestRef,
    authorizedRange: range,
    approved: true,
    approvedAt: '2026-08-04T12:00:00.000Z',
  })
}

async function dispatchInternal(
  definition: SkillJobRuntimeBindingDefinition,
  overrides: Partial<Parameters<EditSkillRuntimeDispatcher['dispatchApprovedWorkItem']>[0]> = {},
) {
  const workItem = workItemFor(definition)
  return dispatcher.dispatchApprovedWorkItem({
    manifestRef,
    workItem,
    approval: approvalFor(workItem),
    authorizedPhase: definition.allowedPhases[0],
    inputArtifactTypes: definition.inputArtifactTypes,
    adapterClass: 'internal_qualification_adapter',
    environmentClass: 'internal_fixture',
    runtimeQualification: 'internal_execution_qualified',
    artifactStorageClass: 'internal_in_memory',
    privateArtifactAuthority: false,
    providerAuthorityOperations: editSkillReferenceCatalog.providerOperations,
    toolAuthorityOperations: editSkillReferenceCatalog.toolOperations,
    ...overrides,
  })
}

for (const binding of BROLL_RUNTIME_BINDINGS) {
  dispatchReceipts.push(await dispatchInternal(binding.definition))
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
      automaticRetryAllowed: true as never,
    },
    handler: BROLL_RUNTIME_BINDINGS[0].handler,
  }),
)
assert.throws(
  () => createSkillJobRuntimeBinding({
    definition: {
      ...definitionCore(BROLL_RUNTIME_BINDINGS[0].definition),
      operationKind: 'no_action',
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
    adapterClass: 'internal_qualification_adapter',
    environmentClass: 'internal_fixture',
  }),
  /unavailable/iu,
)

assert.throws(
  () => changedBinding('run_b_roll_preview_qa', {
    adapterClass: 'internal_qualification_adapter',
    environmentClass: 'production_server',
  }),
  /wrong environment/iu,
)
assert.throws(
  () => changedBinding('run_b_roll_preview_qa', {
    adapterClass: 'canonical_private_execution_adapter',
    environmentClass: 'canonical_private',
    privateArtifactRequired: false,
  }),
  /private artifact authority/iu,
)
assert.throws(
  () => changedBinding('run_b_roll_preview_qa', {
    adapterClass: 'production_worker_adapter',
    environmentClass: 'production_server',
    privateArtifactRequired: true,
  }),
  /production qualification/iu,
)
assert.throws(
  () => changedBinding('generate_b_roll_candidate', {
    providerAuthorityRequired: false,
  }),
  /provider authority/iu,
)
assert.throws(
  () => changedBinding('inspect_b_roll_candidate_with_ffprobe', {
    toolAuthorityRequired: false,
  }),
  /tool authority/iu,
)
assert.throws(
  () => changedBinding('run_b_roll_preview_qa', {
    alternateProviderFallbackAllowed: true as never,
  }),
)
const operationMismatch = changedBinding('run_b_roll_preview_qa', {
  operationId: 'b_roll.internal.wrong_preview_qa.v1',
})
assert.throws(
  () => validate(bindingRegistry({ replace: new Map([['run_b_roll_preview_qa', operationMismatch]]) })),
  /operation differs/iu,
)
const phaseMismatch = changedBinding('run_b_roll_preview_qa', {
  allowedPhases: ['skill_output_qa'],
})
assert.throws(
  () => validate(bindingRegistry({ replace: new Map([['run_b_roll_preview_qa', phaseMismatch]]) })),
  /differs from its manifest job capability/iu,
)
const qualificationMismatch = changedBinding('run_b_roll_preview_qa', {
  requiredQualification: 'production_qualified',
})
assert.throws(
  () => validate(bindingRegistry({ replace: new Map([['run_b_roll_preview_qa', qualificationMismatch]]) })),
  /differs from its manifest job capability|exceeds/iu,
)

const validationDefinition = BROLL_RUNTIME_BINDINGS.find((binding) =>
  binding.definition.jobType === 'validate_b_roll_assignment')!.definition
await assert.rejects(
  () => dispatchInternal(validationDefinition, { runtimeQualification: 'planning_qualified' }),
  /under-qualified/iu,
)
await assert.rejects(
  () => dispatchInternal(validationDefinition, {
    adapterClass: 'production_worker_adapter',
    environmentClass: 'production_server',
    artifactStorageClass: 'internal_in_memory',
  }),
  /unavailable or stale/iu,
)
const providerDefinition = BROLL_RUNTIME_BINDINGS.find((binding) =>
  binding.definition.jobType === 'generate_b_roll_candidate')!.definition
await assert.rejects(
  () => dispatchInternal(providerDefinition, { providerAuthorityOperations: new Set() }),
  /provider authority/iu,
)
const toolDefinition = BROLL_RUNTIME_BINDINGS.find((binding) =>
  binding.definition.jobType === 'inspect_b_roll_candidate_with_ffprobe')!.definition
await assert.rejects(
  () => dispatchInternal(toolDefinition, { toolAuthorityOperations: new Set() }),
  /tool authority/iu,
)

assert.equal(
  BROLL_RUNTIME_BINDINGS.every((binding) =>
    binding.definition.adapterClass === 'internal_qualification_adapter' &&
    binding.definition.environmentClass === 'internal_fixture'),
  true,
)
assert.equal(
  editSkillRuntimeBindingRegistry.list().some((binding) =>
    binding.definition.adapterClass === 'production_worker_adapter'),
  false,
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
  bindingClasses: ['internal_qualification_adapter'],
  productionBindings: 0,
  adversarialCases: 27,
}, null, 2))
