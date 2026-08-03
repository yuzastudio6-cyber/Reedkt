import assert from 'node:assert/strict'

import { z } from 'zod'

import {
  EditSkillArtifactSchemaRegistry,
  EditSkillInvocationService,
  InMemoryCreateOnlyEditSkillArtifactStore,
  SkillCapabilityRegistry,
  SkillEstimatorRegistry,
  SkillJobRuntimeBindingRegistry,
  SkillQaRegistry,
  SkillQualificationRegistry,
  assertSkillAssignmentFresh,
  canonicalSkillJson,
  createSkillAssignment,
  createSkillCapabilityManifest,
  createSkillJobRuntimeBinding,
  createSkillPlanEnvelope,
  createSkillQaFinding,
  createSkillQualificationReceipt,
  createSkillResultEnvelope,
  generateSkillManifestProjection,
  hashSkillValue,
  skillManifestReference,
  validateSkillCapabilityManifests,
} from '../edit-skills/core/index'

const SHA = hashSkillValue('evidence')

function fixtureManifest() {
  return createSkillCapabilityManifest({
    schemaVersion: 'skill-capability-manifest-v1',
    skillKey: 'b_roll',
    skillVersion: '1.0.0',
    contractVersion: 'b_roll.skill_contract.v1',
    qualificationStatus: 'implementation_pending',
    skillClass: 'creative_visual_asset_skill',
    coordinationCritical: true,
    canOwnPrimaryVisual: true,
    canActAsSupport: true,
    canOperateAtVideoLevel: 'context_read_only',
    canOperateAtSceneLevel: 'bounded_plan_and_execution',
    canOperateAtBoundaryLevel: 'coordination_only',
    supportedJobTypes: ['fixture_job'],
    unsupportedJobTypes: ['unsupported_fixture_job'],
    requiredInputs: [{ key: 'source', artifactType: 'fixture_input', description: 'Input.', minimumCount: 1, maximumCount: 1 }],
    optionalInputs: [],
    requiredSceneContext: [{ key: 'scene', required: true, readScope: 'whole_video_read_only', description: 'Context.' }],
    requiredSourceEvidence: ['source_checksum'],
    visualIntelligenceRequirements: [],
    trackingRequirements: [],
    acceptedArtifactTypes: ['fixture_input'],
    producedArtifactTypes: ['fixture_output'],
    planningPhase: 'plan',
    allowedExecutionPhases: ['execute'],
    mustRunBefore: ['integrate'],
    mustRunAfter: [],
    conflictsWith: [],
    mayOverlapWith: ['captions'],
    ownershipRequirements: ['exact_range'],
    timeEstimator: 'fixture_time',
    creditEstimator: 'fixture_credit',
    attemptPolicy: {
      maximumInitialAttempts: 1,
      maximumRefinements: 0,
      automaticRetryAllowed: false,
      alternateProviderFallbackAllowed: false,
      unknownOutcomeRequiresReconciliation: true,
    },
    toolRoutes: [{ routeKey: 'fixture_tool', routeKind: 'tool', operationRef: 'tool.fixture.v1', priority: 1, requiresApproval: true, description: 'Fixture.' }],
    fallbackRoutes: [{ routeKey: 'fixture_no_action', routeKind: 'no_action', operationRef: 'no_action.fixture.v1', priority: 2, requiresApproval: false, description: 'Fixture.' }],
    lowerCostRoutes: [],
    planningQa: [{ qaKey: 'fixture_planning_qa', severity: 'blocking', description: 'Planning.' }],
    outputQa: [{ qaKey: 'fixture_output_qa', severity: 'blocking', description: 'Output.' }],
    integrationQa: [{ qaKey: 'fixture_integration_qa', severity: 'blocking', description: 'Integration.' }],
    invalidationRules: [{ ruleKey: 'range_changed', trigger: 'range_change', invalidates: ['plan'], requiresNewApproval: true }],
    revisionRules: [{ ruleKey: 'remove', changeClass: 'scope_reducing', requiresReestimate: true, requiresNewApproval: true, description: 'Remove.' }],
    qualificationFixtures: [{ fixtureKey: 'kernel_fixture', minimumStatus: 'implementation_pending', description: 'Kernel.' }],
    knownLimitations: ['Fixture only.'],
  })
}

const manifest = fixtureManifest()
assert.equal(Object.isFrozen(manifest), true)
assert.equal(Object.isFrozen(manifest.attemptPolicy), true)
assert.equal(JSON.parse(generateSkillManifestProjection(manifest)).manifestHash, manifest.manifestHash)
assert.equal(canonicalSkillJson({ b: 2, a: 1 }), '{"a":1,"b":2}')
assert.throws(() => canonicalSkillJson({ invalid: () => undefined }), /rejects function/)

const artifacts = new EditSkillArtifactSchemaRegistry()
artifacts.register('fixture_input', z.object({ value: z.string() }).strict())
artifacts.register('fixture_output', z.object({ value: z.string() }).strict())
const artifactStore = new InMemoryCreateOnlyEditSkillArtifactStore(artifacts)
const inputRef = await artifactStore.putJson({
  artifactType: 'fixture_input', ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project', value: { value: 'source' },
})
assert.deepEqual(await artifactStore.readJson({ reference: inputRef, ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project' }), { value: 'source' })
await assert.rejects(
  artifactStore.readJson({ reference: inputRef, ownerUserId: 'user', workspaceId: 'other', projectId: 'project' }),
  /Cross-tenant/,
)

const estimators = new SkillEstimatorRegistry()
estimators.registerTime('fixture_time', () => ({ minimumSeconds: 1, expectedSeconds: 2, maximumSeconds: 3, evidence: [] }))
estimators.registerCredit('fixture_credit', () => ({ minimumCredits: 1, expectedCredits: 2, maximumCredits: 3, internalToolCostOnly: true, evidence: [] }))
const qa = new SkillQaRegistry()
for (const qaKey of ['fixture_planning_qa', 'fixture_output_qa', 'fixture_integration_qa']) {
  qa.register(qaKey, () => createSkillQaFinding({
    qaKey,
    validatorVersion: `${qaKey}.v1`,
    disposition: 'pass',
    summary: 'Passed.',
    evidenceHashes: [SHA],
    observations: { fixture: true },
  }))
}

const registry = new SkillCapabilityRegistry()
registry.registerManifest(manifest)
const runtimeBindings = new SkillJobRuntimeBindingRegistry()
runtimeBindings.register(createSkillJobRuntimeBinding({
  definition: {
    schemaVersion: 'edit-skill-runtime-binding-v1',
    skillKey: manifest.skillKey,
    skillVersion: manifest.skillVersion,
    contractVersion: manifest.contractVersion,
    manifestHash: manifest.manifestHash,
    jobType: 'fixture_job',
    operationId: 'tool.fixture.v1',
    operationKind: 'tool',
    workerClass: 'fixture_worker',
    inputArtifactTypes: ['fixture_input'],
    outputArtifactTypes: ['fixture_output'],
    allowedPhases: ['execute'],
    qualificationRequirement: 'implementation_pending',
    runtimeAdapterId: 'fixture.runtime.v1',
    bindingKind: 'executable',
    approvalRequired: true,
    qualificationRequired: true,
    callerSelectedExecutableAllowed: false,
    mutatesOnlyAssignmentRange: true,
    createsMedia: false,
  },
  handler: async () => ({
    status: 'succeeded',
    outputArtifactTypes: ['fixture_output'],
    evidenceHashes: [SHA],
    providerRequestCount: 0,
    publicArtifactCount: 0,
    productionMutationCount: 0,
  }),
}))
const workGraphJobs = [{
  skillKey: manifest.skillKey,
  skillVersion: manifest.skillVersion,
  contractVersion: manifest.contractVersion,
  jobType: 'fixture_job',
  operationId: 'tool.fixture.v1',
  workerClass: 'fixture_worker',
  expectedOutputType: 'fixture_output',
}] as const
const manifestRef = skillManifestReference(manifest)
const assignment = createSkillAssignment({
  schemaVersion: 'edit-skill-assignment-v1',
  assignmentId: 'assignment', ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project',
  editSessionId: 'session', planningRequestId: 'request', manifestRef,
  authorizedRange: { startFrameInclusive: 10, endFrameExclusive: 20, fps: 24 },
  reason: 'Provide context.', intendedViewerBenefit: 'Improve comprehension.', editorialContext: 'Fixture.',
  visualOwnership: 'support', contextArtifactRefs: [inputRef], dependencyArtifactRefs: [], requestedBySkill: 'orchestra',
})
assert.throws(
  () => assertSkillAssignmentFresh({ assignment, expectedRange: { startFrameInclusive: 11, endFrameExclusive: 20, fps: 24 } }),
  /stale/,
)

registry.registerHandler({
  skillKey: 'b_roll', skillVersion: '1.0.0', handler: {
    async plan(context) {
      return createSkillPlanEnvelope({
        schemaVersion: 'edit-skill-plan-envelope-v1', planId: 'plan', assignmentId: context.assignment.assignmentId,
        assignmentHash: context.assignment.assignmentHash, manifestRef: context.assignment.manifestRef,
        authorizedRange: context.assignment.authorizedRange, disposition: 'use_skill', payloadArtifactType: 'fixture_output', payloadHash: SHA,
      })
    },
    async execute(context, plan) {
      return createSkillResultEnvelope({
        schemaVersion: 'edit-skill-result-envelope-v1', resultId: 'result', planId: plan.planId, planHash: plan.planHash,
        assignmentId: context.assignment.assignmentId, assignmentHash: context.assignment.assignmentHash,
        manifestRef: context.assignment.manifestRef, authorizedRange: context.assignment.authorizedRange,
        disposition: 'selected', resultArtifactType: 'fixture_output', resultArtifactHash: SHA,
        qaEvidenceHashes: [SHA], mutationRanges: [context.assignment.authorizedRange],
      })
    },
  },
})

const validation = validateSkillCapabilityManifests({
  registry, estimators, qa, artifacts,
  catalog: {
    jobTypes: new Set(['fixture_job']), toolOperations: new Set(['tool.fixture.v1']), providerOperations: new Set(),
    sourceOperations: new Set(), noActionOperations: new Set(['no_action.fixture.v1']),
    providerOperationQualifications: new Map(), phases: new Set(['plan', 'execute', 'integrate']),
  },
  runtimeBindings,
  workGraphJobs,
})
assert.equal(validation.manifestCount, 1)
const invocation = new EditSkillInvocationService(registry)
const plan = await invocation.plan(assignment)
assert.equal((await invocation.execute({ assignment, plan })).disposition, 'selected')

assert.throws(() => registry.registerManifest(manifest), /Duplicate/)

const receipt = createSkillQualificationReceipt({
  schemaVersion: 'skill-qualification-receipt-v1', manifestRef, qualificationStatus: 'implementation_pending',
  fixtureResults: [{ fixtureKey: 'kernel_fixture', status: 'passed', evidenceHash: SHA, summary: 'Passed.' }],
  buildEvidenceHashes: [SHA], testEvidenceHashes: [SHA], securityEvidenceHashes: [SHA], providerEvidenceHashes: [],
  issuedAt: '2026-08-03T12:00:00.000Z',
})
const qualifications = new SkillQualificationRegistry()
qualifications.register(receipt)
qualifications.assertClaim(manifestRef, 'implementation_pending')
assert.throws(() => qualifications.assertClaim(manifestRef, 'planning_qualified'), /exceeds/)
assert.throws(() => qualifications.register({ ...receipt, receiptHash: SHA }), /stale or forged/)

const { manifestHash: _manifestHash, ...manifestCore } = manifest
assert.equal(_manifestHash, manifest.manifestHash)
const cycleManifest = createSkillCapabilityManifest({ ...manifestCore, mustRunBefore: ['plan'] })
const cycleRegistry = new SkillCapabilityRegistry()
cycleRegistry.registerManifest(cycleManifest)
assert.throws(
  () => validateSkillCapabilityManifests({
    registry: cycleRegistry, estimators, qa, artifacts,
    catalog: {
      jobTypes: new Set(['fixture_job']), toolOperations: new Set(['tool.fixture.v1']), providerOperations: new Set(),
      sourceOperations: new Set(), noActionOperations: new Set(['no_action.fixture.v1']),
      providerOperationQualifications: new Map(), phases: new Set(['plan', 'execute', 'integrate']),
    },
    runtimeBindings,
    workGraphJobs,
    requireRuntimeHandlers: false,
    requireRuntimeBindings: false,
  }),
  /Cyclic/,
)

const unknownJobRegistry = new SkillCapabilityRegistry()
unknownJobRegistry.registerManifest(createSkillCapabilityManifest({ ...manifestCore, supportedJobTypes: ['not_implemented'] }))
assert.throws(
  () => validateSkillCapabilityManifests({
    registry: unknownJobRegistry, estimators, qa, artifacts,
    catalog: {
      jobTypes: new Set(['fixture_job']), toolOperations: new Set(['tool.fixture.v1']), providerOperations: new Set(),
      sourceOperations: new Set(), noActionOperations: new Set(['no_action.fixture.v1']),
      providerOperationQualifications: new Map(), phases: new Set(['plan', 'execute', 'integrate']),
    },
    runtimeBindings,
    workGraphJobs,
    requireRuntimeHandlers: false,
    requireRuntimeBindings: false,
  }),
  /unimplemented job type/,
)

console.log(JSON.stringify({ status: 'ok', manifestHash: manifest.manifestHash, assignmentHash: assignment.assignmentHash, receiptHash: receipt.receiptHash }, null, 2))
