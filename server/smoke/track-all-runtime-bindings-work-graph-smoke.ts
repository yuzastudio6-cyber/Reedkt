import assert from 'node:assert/strict'

import {
  EditSkillRuntimeDispatcher,
  SkillJobRuntimeBindingRegistry,
  createEditSkillPlanApproval,
  createSkillJobRuntimeBinding,
  hashSkillValue,
  skillManifestReference,
  type EditSkillArtifactReference,
  type SkillJobRuntimeBinding,
  type SkillJobRuntimeBindingDefinition,
} from '../edit-skills/core'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_RUNTIME_BINDINGS,
  TRACK_ALL_WORK_GRAPH_JOB_DEFINITIONS,
  createPrivacyPolicySnapshot,
  createTrackAllCanonicalPrivateRuntimeBindings,
  trackAllAtomicWorkItemSchema,
  trackAllPlanSchema,
  trackAllWorkGraphArtifactSchema,
} from '../edit-skills/track-all'
import {
  TRACK_ALL_FIXTURE_SCOPE,
  createTrackAllAuthorityFixture,
  createTrackAllCaptionZonesFixture,
  createTrackAllPriorGraphFixture,
  createTrackAllPriorRepairEvidenceFixture,
  reviseTrackAllPublicAssignment,
} from './track-all-fixtures'

process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING = '1'
const { createInternalFixtureEditSkillRuntime } = await import(
  '../edit-skills/internal-fixture-runtime'
)
const runtime = createInternalFixtureEditSkillRuntime()
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const assignmentHash = hashSkillValue({ assignment: 'track-all-runtime-binding' })
const authorizedRange = { startFrameInclusive: 24, endFrameExclusive: 144, fps: 24 }

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

function registry(input: {
  omitJob?: string
  replace?: ReadonlyMap<string, SkillJobRuntimeBinding>
  add?: SkillJobRuntimeBinding
} = {}) {
  const value = new SkillJobRuntimeBindingRegistry()
  for (const binding of TRACK_ALL_RUNTIME_BINDINGS) {
    if (binding.definition.jobType === input.omitJob) continue
    value.register(input.replace?.get(binding.definition.jobType) ?? binding)
  }
  if (input.add) value.register(input.add)
  return value
}

function validate(value: SkillJobRuntimeBindingRegistry) {
  value.validateManifest({
    manifest: TRACK_ALL_CAPABILITY_MANIFEST,
    artifacts: runtime.artifactSchemaRegistry,
    operations: runtime.referenceCatalog,
    workGraphJobs: TRACK_ALL_WORK_GRAPH_JOB_DEFINITIONS,
  })
}

function changedBinding(
  jobType: string,
  changes: Partial<ReturnType<typeof definitionCore>>,
) {
  const original = TRACK_ALL_RUNTIME_BINDINGS.find((binding) =>
    binding.definition.jobType === jobType)
  assert.ok(original)
  return createSkillJobRuntimeBinding({
    definition: { ...definitionCore(original.definition), ...changes },
    handler: original.handler,
  })
}

assert.equal(TRACK_ALL_RUNTIME_BINDINGS.length, 13)
assert.deepEqual(
  new Set(TRACK_ALL_RUNTIME_BINDINGS.map((binding) => binding.definition.jobType)),
  new Set(TRACK_ALL_CAPABILITY_MANIFEST.supportedJobTypes.map((job) => job.jobType)),
)
assert.equal(TRACK_ALL_RUNTIME_BINDINGS.every((binding) =>
  binding.definition.adapterClass === 'internal_qualification_adapter' &&
  binding.definition.environmentClass === 'internal_fixture'), true)
validate(registry())

assert.throws(() => validate(registry({ omitJob: 'track_all.validate_track_graph' })),
  /has no runtime binding/iu)
assert.throws(() => validate(registry({
  add: changedBinding('track_all.validate_track_graph', {
    jobType: 'track_all.unknown_job',
    runtimeAdapterId: 'track_all.runtime.internal_qualification.unknown.v1',
  }),
})), /no manifest-supported job/iu)
const duplicate = registry()
assert.throws(() => duplicate.register(TRACK_ALL_RUNTIME_BINDINGS[0]!),
  /duplicate runtime binding/iu)
assert.throws(() => validate(registry({ replace: new Map([[
  'track_all.validate_track_graph',
  changedBinding('track_all.validate_track_graph', { workerClass: 'wrong_worker' }),
]]) })), /worker class differs/iu)
assert.throws(() => validate(registry({ replace: new Map([[
  'track_all.validate_track_graph',
  changedBinding('track_all.validate_track_graph', {
    inputArtifactTypes: ['unknown_track_all_artifact_v1'],
  }),
]]) })), /unknown artifact|differs from its manifest/iu)
assert.throws(() => validate(registry({ replace: new Map([[
  'track_all.validate_track_graph',
  changedBinding('track_all.validate_track_graph', {
    operationId: 'track_all.wrong_operation.v1',
  }),
]]) })), /operation differs/iu)
assert.throws(() => createSkillJobRuntimeBinding({
  definition: {
    ...definitionCore(TRACK_ALL_RUNTIME_BINDINGS[0]!.definition),
    callerSelectedExecutableAllowed: true as never,
  },
  handler: TRACK_ALL_RUNTIME_BINDINGS[0]!.handler,
}))
assert.throws(() => createSkillJobRuntimeBinding({
  definition: {
    ...definitionCore(TRACK_ALL_RUNTIME_BINDINGS[0]!.definition),
    approvalRequired: false,
  },
  handler: TRACK_ALL_RUNTIME_BINDINGS[0]!.handler,
}), /approval/iu)
assert.throws(() => createSkillJobRuntimeBinding({
  definition: {
    ...definitionCore(TRACK_ALL_RUNTIME_BINDINGS[0]!.definition),
    adapterClass: 'production_worker_adapter',
    environmentClass: 'production_server',
    privateArtifactRequired: true,
  },
  handler: TRACK_ALL_RUNTIME_BINDINGS[0]!.handler,
}), /production qualification/iu)

const toolOperations = new Set(runtime.referenceCatalog.toolOperations)
toolOperations.delete('tool.sam3_1.track_masklets.v2')
assert.throws(() => registry().validateManifest({
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  artifacts: runtime.artifactSchemaRegistry,
  operations: { ...runtime.referenceCatalog, toolOperations },
  workGraphJobs: TRACK_ALL_WORK_GRAPH_JOB_DEFINITIONS,
}), /unknown tool operation/iu)

const dispatcher = new EditSkillRuntimeDispatcher(registry(), 'internal_fixture')
const dispatchReceipts = []
for (const binding of TRACK_ALL_RUNTIME_BINDINGS) {
  const definition = binding.definition
  const workItemCore = {
    workItemKey: `runtime-${definition.jobType}`,
    jobType: definition.jobType,
    operationId: definition.operationId,
    workerClass: definition.workerClass,
    assignmentId: 'track-all-runtime-assignment',
    assignmentHash,
    manifestRef,
    authorizedRange,
    dependencyKeys: [],
    expectedOutputType: definition.outputArtifactTypes[0]!,
    maximumCreditBudget: 0,
    maximumAttempts: 1,
    required: true,
    qaLineageKeys: ['track_all.qa.final_lineage'],
    callerSelectedExecutableAllowed: false as const,
    outsideAuthorizedRangeModified: false as const,
  }
  const workItem = { ...workItemCore, workItemHash: hashSkillValue(workItemCore) }
  const approval = createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: workItem.assignmentId,
    assignmentHash: workItem.assignmentHash,
    planId: 'track-all-runtime-plan',
    planHash: hashSkillValue({ plan: 'track-all-runtime-plan' }),
    manifestRef,
    authorizedRange,
    approved: true,
    approvedAt: '2026-08-04T12:00:00.000Z',
  })
  dispatchReceipts.push(await dispatcher.dispatchApprovedWorkItem({
    manifestRef,
    workItem,
    approval,
    authorizedPhase: definition.allowedPhases[0]!,
    inputArtifactTypes: definition.inputArtifactTypes,
    adapterClass: 'internal_qualification_adapter',
    environmentClass: 'internal_fixture',
    runtimeQualification: 'internal_execution_qualified',
    artifactStorageClass: 'internal_in_memory',
    privateArtifactAuthority: false,
    providerAuthorityOperations: new Set(),
    toolAuthorityOperations: runtime.toolRegistry.operationIds,
  }))
}
assert.equal(dispatchReceipts.length, 13)
assert.equal(dispatchReceipts.every((value) => value.status === 'succeeded'), true)
assert.equal(dispatchReceipts.reduce((sum, value) => sum + value.providerRequestCount, 0), 0)
assert.equal(dispatchReceipts.reduce((sum, value) => sum + value.publicArtifactCount, 0), 0)
assert.equal(dispatchReceipts.reduce((sum, value) => sum + value.productionMutationCount, 0), 0)

const canonicalPrivate = createTrackAllCanonicalPrivateRuntimeBindings({
  execute: async (_jobType, definition) => ({
    status: 'failed',
    outputArtifactTypes: [definition.output],
    evidenceHashes: [hashSkillValue({ canonicalPrivate: 'unconfigured' })],
    providerRequestCount: 0,
    publicArtifactCount: 0,
    productionMutationCount: 0,
    failureCode: 'track_all_canonical_private_executor_unconfigured',
  }),
})
assert.equal(canonicalPrivate.length, 13)
assert.equal(canonicalPrivate.every((binding) =>
  binding.definition.adapterClass === 'canonical_private_execution_adapter' &&
  binding.definition.environmentClass === 'canonical_private' &&
  binding.definition.privateArtifactRequired), true)
assert.equal(runtime.runtimeBindingRegistry.list().some((binding) =>
  binding.definition.skillKey === 'track_all' &&
  binding.definition.adapterClass === 'production_worker_adapter'), false)
assert.throws(() => registry().resolve({
  manifestRef,
  jobType: 'track_all.produce_selected_target_graph',
  adapterClass: 'production_worker_adapter',
  environmentClass: 'production_server',
}), /unavailable|stale/iu)

const noAction = await compileFixture({
  assignmentId: 'work-graph-no-action',
})
assert.deepEqual(noAction.atomic.atomicWorkItems.map((item) => item.stageId), [
  'validate_assignment', 'validate_target_authority', 'no_action',
  'project_track_all_result',
])
assert.equal(noAction.atomic.atomicWorkItems.some((item) =>
  item.createsMedia || item.createsGpuWork || item.operationId.includes('sam3_1')), false)
const noActionItem = noAction.atomic.atomicWorkItems.find((item) =>
  item.stageId === 'no_action')!
assert.throws(() => trackAllAtomicWorkItemSchema.parse({
  ...noActionItem,
  createsMedia: true,
  callerSelectedExecutableAllowed: true,
}))

const selected = await compileFixture({
  assignmentId: 'work-graph-selected',
  requestedJobType: 'track_all.produce_selected_target_graph',
  intendedTreatment: 'geometry_only',
})
assertStages(selected, [
  'inspect_source', 'detect_shot_boundaries', 'estimate_camera_motion',
  'choose_initialization_frame', 'prepare_tracking_chunks',
  'allocate_multiplex_buckets', 'execute_sam_masklet_session',
  'normalize_masklets', 'stitch_chunks', 'associate_identities',
  'build_camera_motion_graph', 'build_anchor_graph', 'run_target_qa',
  'run_temporal_qa', 'run_mask_qa', 'build_track_graph',
  'prepare_composition_layer', 'project_track_all_result',
])
assert.equal(selected.atomic.atomicWorkItems.filter((item) => item.createsGpuWork).length, 1)

const privacy = await compileFixture({
  assignmentId: 'work-graph-privacy',
  requestedJobType: 'track_all.apply_privacy_redaction',
  intendedTreatment: 'privacy_redaction',
  privacyClassification: 'high_assurance',
  targetCriticality: 'privacy_critical',
  privacyCriticality: 'high',
}, true)
assertStages(privacy, [
  'build_redaction_plan', 'compile_redaction_effect',
  'render_private_redaction_preview', 'run_flattened_privacy_qa',
  'project_redaction_result',
])

const planar = await compileFixture({
  assignmentId: 'work-graph-planar',
  requestedJobType: 'track_all.track_planar_region',
  intendedTreatment: 'planar_geometry',
  targetType: 'planar_region',
})
assertStages(planar, [
  'extract_planar_features', 'calculate_homography',
  'validate_reprojection', 'build_planar_track_graph',
])
assert.equal(planar.atomic.atomicWorkItems.some((item) => item.createsGpuWork), false)

const focus = await compileFixture({
  assignmentId: 'work-graph-focus',
  requestedJobType: 'track_all.apply_tracked_focus',
  intendedTreatment: 'tracked_focus',
})
assertStages(focus, [
  'compile_focus_treatment', 'render_focus_preview', 'run_focus_integration_qa',
])

const reframe = await compileFixture({
  assignmentId: 'work-graph-reframe',
  requestedJobType: 'track_all.prepare_tracked_reframe',
  intendedTreatment: 'tracked_reframe',
})
assertStages(reframe, [
  'calculate_reframe_trajectory', 'validate_crop_and_safe_zones',
  'render_reframe_preview', 'run_reframe_integration_qa',
])

console.log(JSON.stringify({
  status: 'ok',
  manifestJobBindings: TRACK_ALL_RUNTIME_BINDINGS.length,
  internalDispatchReceiptCount: dispatchReceipts.length,
  canonicalPrivateBindingCount: canonicalPrivate.length,
  productionWorkerBindingCount: 0,
  noActionAtomicStageCount: noAction.atomic.atomicWorkItems.length,
  selectedAtomicStageCount: selected.atomic.atomicWorkItems.length,
  privacyAtomicStageCount: privacy.atomic.atomicWorkItems.length,
  planarAtomicStageCount: planar.atomic.atomicWorkItems.length,
  focusAtomicStageCount: focus.atomic.atomicWorkItems.length,
  reframeAtomicStageCount: reframe.atomic.atomicWorkItems.length,
  noActionCreatesMediaOrGpuWork: false,
  callerSelectedExecutableRejected: true,
  unknownToolOperationRejected: true,
  fixtureCannotMasqueradeAsProduction: true,
  providerRequestCount: 0,
  publicArtifactCount: 0,
  productionMutationCount: 0,
}))

async function compileFixture(
  input: Omit<Parameters<typeof createTrackAllAuthorityFixture>[0], 'runtime'>,
  withPrivacyPolicy = false,
) {
  const priorGraphRef = input.intendedTreatment === 'repair'
    ? await createTrackAllPriorGraphFixture({
        runtime, nextAssignmentId: input.assignmentId,
        ...(input.authorizedRange ? { authorizedRange: input.authorizedRange } : {}),
      })
    : undefined
  const fixture = await createTrackAllAuthorityFixture({
    runtime,
    ...input,
    ...(priorGraphRef
      ? {
          targetType: 'existing_track' as const,
          groundingKind: 'existing_track_reference' as const,
          groundingArtifactRef: priorGraphRef,
          priorTrackGraphRefs: [priorGraphRef],
        }
      : {}),
  })
  let assignment = fixture.assignment
  const extraContextRefs: EditSkillArtifactReference[] = []
  if (priorGraphRef) {
    extraContextRefs.push(
      priorGraphRef,
      await createTrackAllPriorRepairEvidenceFixture({
        runtime, fixture, trackGraphRef: priorGraphRef,
      }),
    )
  }
  if (input.intendedTreatment === 'tracked_reframe') {
    extraContextRefs.push(await createTrackAllCaptionZonesFixture({
      runtime, assignment,
      specializedAssignmentHash: fixture.specializedAssignment.assignmentHash,
    }))
  }
  if (withPrivacyPolicy) {
    const policy = createPrivacyPolicySnapshot({
      schemaVersion: 'privacy_policy_snapshot_v1',
      ...TRACK_ALL_FIXTURE_SCOPE,
      policyVersion: 1,
      failClosed: true,
      allowedTreatments: [
        'gaussian_blur', 'pixelate', 'mosaic', 'solid_fill',
        'conservative_region_cover', 'tracked_crop_exclusion',
      ],
    })
    const policyRef = await runtime.artifactStore.putJson({
      artifactType: 'privacy_policy_snapshot_v1',
      value: policy,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    extraContextRefs.push(policyRef)
  }
  if (extraContextRefs.length > 0) {
    assignment = reviseTrackAllPublicAssignment(assignment, [
      ...assignment.contextArtifactRefs, ...extraContextRefs,
    ])
  }
  const plugin = runtime.pluginRegistry.resolve(manifestRef)
  const publicPlan = await plugin.planAssignment({ assignment })
  const plan = trackAllPlanSchema.parse(await runtime.artifactStore.readJson({
    reference: publicPlan.payloadRef,
    ...TRACK_ALL_FIXTURE_SCOPE,
  }))
  const approval = createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    planId: publicPlan.envelope.planId,
    planHash: publicPlan.envelope.planHash,
    manifestRef,
    authorizedRange: assignment.authorizedRange,
    approved: true,
    approvedAt: '2026-08-04T12:00:00.000Z',
  })
  const approved = await plugin.compileApprovedWorkGraph({
    assignment,
    plan: publicPlan,
    approval,
  })
  assert.ok(approved.pluginWorkGraphRef)
  assert.equal(approved.pluginWorkGraphHash, approved.pluginWorkGraphRef.sha256)
  const atomic = trackAllWorkGraphArtifactSchema.parse(
    await runtime.artifactStore.readJson({
      reference: approved.pluginWorkGraphRef,
      ...TRACK_ALL_FIXTURE_SCOPE,
    }),
  )
  assert.equal(atomic.planHash, plan.planHash)
  assert.equal(atomic.approvedSnapshotHash, approval.approvalHash)
  assert.equal(atomic.workItemHashes.length, atomic.atomicWorkItems.length)
  assert.equal(atomic.atomicWorkItems.reduce((sum, item) =>
    sum + item.maximumCreditBudget, 0) <= atomic.maximumCreditBudget, true)
  assert.equal(approved.workItems.reduce((sum, item) =>
    sum + item.maximumCreditBudget, 0) <= plan.creditEstimate.maximumCredits, true)
  return { fixture, assignment, publicPlan, plan, approval, approved, atomic }
}

function assertStages(
  value: Awaited<ReturnType<typeof compileFixture>>,
  expected: readonly string[],
) {
  const actual = new Set(value.atomic.atomicWorkItems.map((item) => item.stageId))
  for (const stage of expected) {
    assert.equal(actual.has(stage), true,
      `Missing atomic stage ${stage} for decision ${value.plan.decision}`)
  }
}
