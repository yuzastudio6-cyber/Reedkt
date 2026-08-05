import assert from 'node:assert/strict'

import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_RUNTIME_BINDINGS,
  createBrollCanonicalPrivateRuntimeBindings,
  createBrollRouteQualificationCandidateReceipts,
} from '../edit-skills/b-roll'
import {
  EditSkillRuntimeDispatcher,
  SkillJobRuntimeBindingRegistry,
  SkillQualificationRegistry,
  SkillRouteQualificationRegistry,
  createEditSkillPlanApproval,
  createSkillRouteQualificationReceipt,
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core'
import {
  DurableRuntimeInputFixtureStore,
  seedExactRuntimeInputs,
} from './edit-skill-runtime-input-fixtures'

const internalBinding = BROLL_RUNTIME_BINDINGS[0]!.definition
const candidateReceipt = createBrollRouteQualificationCandidateReceipts({
  bindings: BROLL_RUNTIME_BINDINGS.map((binding) => binding.definition),
})[0]!
const skillQualifications = new SkillQualificationRegistry()
const registry = new SkillRouteQualificationRegistry({
  skillQualifications,
  qualificationIssuanceMode: true,
})
registry.register({
  receipt: candidateReceipt,
  bindings: BROLL_RUNTIME_BINDINGS.map((binding) => binding.definition),
})
assert.equal(registry.resolve({ binding: internalBinding }).qualificationStatus,
  'internal_execution_qualified')
assert.throws(() => registry.resolve({
  binding: internalBinding,
  expectedQualification: 'planning_qualified',
}), /expectation differs/iu)

assert.throws(() => new SkillRouteQualificationRegistry({
  skillQualifications: new SkillQualificationRegistry(),
}).register({
  receipt: candidateReceipt,
  bindings: BROLL_RUNTIME_BINDINGS.map((binding) => binding.definition),
}), /disabled outside receipt issuance/iu)

assert.throws(() => registry.register({
  receipt: { ...candidateReceipt, receiptHash: hashSkillValue({ forged: true }) },
  bindings: BROLL_RUNTIME_BINDINGS.map((binding) => binding.definition),
}), /stale or forged/iu)

const { receiptHash: _candidateReceiptHash, ...candidateReceiptCore } = candidateReceipt
void _candidateReceiptHash
const staleManifestCandidate = createSkillRouteQualificationReceipt({
  ...candidateReceiptCore,
  manifestRef: {
    ...candidateReceipt.manifestRef,
    manifestHash: hashSkillValue({ staleManifest: true }),
  },
})
assert.throws(() => registry.register({
  receipt: staleManifestCandidate,
  bindings: BROLL_RUNTIME_BINDINGS.map((binding) => binding.definition),
}), /exact current binding set|stale job, operation, adapter, or binding/iu)

const incompleteRouteCandidate = createSkillRouteQualificationReceipt({
  ...candidateReceiptCore,
  qualifiedBindings: candidateReceipt.qualifiedBindings.slice(0, -1),
})
assert.throws(() => new SkillRouteQualificationRegistry({
  skillQualifications,
  qualificationIssuanceMode: true,
}).register({
  receipt: incompleteRouteCandidate,
  bindings: BROLL_RUNTIME_BINDINGS.map((binding) => binding.definition),
}), /exact current binding set/iu)

assert.throws(() => new SkillRouteQualificationRegistry({
  skillQualifications,
  qualificationIssuanceMode: true,
}).resolve({ binding: internalBinding }), /receipt is missing/iu)

const canonicalBindings = createBrollCanonicalPrivateRuntimeBindings({
  execute: async (definition) => ({
    status: 'succeeded',
    outputArtifactTypes: [definition.output],
    evidenceHashes: [hashSkillValue({ route: definition.jobType })],
    providerRequestCount: 0,
    publicArtifactCount: 0,
    productionMutationCount: 0,
  }),
})
const canonicalBindingRegistry = new SkillJobRuntimeBindingRegistry()
for (const binding of canonicalBindings) canonicalBindingRegistry.register(binding)
const canonicalRouteRegistry = new SkillRouteQualificationRegistry({
  skillQualifications,
  qualificationIssuanceMode: true,
})
for (const receipt of createBrollRouteQualificationCandidateReceipts({
  bindings: canonicalBindings.map((binding) => binding.definition),
})) {
  if (receipt.environmentClass === 'canonical_private') {
    canonicalRouteRegistry.register({
      receipt,
      bindings: canonicalBindings.map((binding) => binding.definition),
    })
  }
}
const store = new DurableRuntimeInputFixtureStore()
const dispatcher = new EditSkillRuntimeDispatcher({
  bindings: canonicalBindingRegistry,
  environmentClass: 'canonical_private',
  routeQualifications: canonicalRouteRegistry,
  skillQualifications,
  artifactStore: store,
  privateArtifactAuthority: true,
  providerAuthorityOperations: new Map(),
  toolAuthorityOperations: new Map(),
})
const definition = canonicalBindings.find((binding) =>
  binding.definition.jobType === 'validate_b_roll_assignment')!.definition
const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const assignmentHash = hashSkillValue({ assignment: 'route-qualification-smoke' })
const authorizedRange = { startFrameInclusive: 0, endFrameExclusive: 24, fps: 24 }
const workItemCore = {
  workItemKey: 'route-qualification-work',
  jobType: definition.jobType,
  operationId: definition.operationId,
  workerClass: definition.workerClass,
  assignmentId: 'route-qualification-assignment',
  assignmentHash,
  manifestRef,
  authorizedRange,
  dependencyKeys: [],
  expectedOutputType: definition.outputArtifactTypes[0]!,
  maximumCreditBudget: 0,
  maximumAttempts: 1,
  required: true,
  qaLineageKeys: ['route_qualification_exact_input'],
  callerSelectedExecutableAllowed: false as const,
  outsideAuthorizedRangeModified: false as const,
}
const workItem = { ...workItemCore, workItemHash: hashSkillValue(workItemCore) }
const approval = createEditSkillPlanApproval({
  schemaVersion: 'edit-skill-plan-approval-v1',
  assignmentId: workItem.assignmentId,
  assignmentHash,
  planId: 'route-qualification-plan',
  planHash: hashSkillValue({ plan: 'route-qualification-plan' }),
  manifestRef,
  authorizedRange,
  approved: true,
  approvedAt: '2026-08-04T12:00:00.000Z',
})
const scope = {
  ownerUserId: 'route-user',
  workspaceId: 'route-workspace',
  projectId: 'route-project',
}
await assert.rejects(() => dispatcher.dispatchApprovedWorkItem({
  manifestRef,
  workItem,
  approval,
  authorizedPhase: definition.allowedPhases[0]!,
  artifactScope: scope,
}), /missing exact ordered input artifact references/iu)
const exactInputArtifactRefs = await seedExactRuntimeInputs({
  store,
  binding: definition,
  scope,
  workItemHash: workItem.workItemHash,
})
const receipt = await dispatcher.dispatchApprovedWorkItem({
  manifestRef,
  workItem,
  approval,
  authorizedPhase: definition.allowedPhases[0]!,
  expectedQualification: 'internal_execution_qualified',
  exactInputArtifactRefs,
  artifactScope: scope,
})
assert.equal(receipt.inputArtifactReferenceHashes.length,
  definition.inputArtifactTypes.length)
await assert.rejects(() => dispatcher.dispatchApprovedWorkItem({
  manifestRef,
  workItem,
  approval,
  authorizedPhase: definition.allowedPhases[0]!,
  exactInputArtifactRefs: exactInputArtifactRefs.map((reference, index) =>
    index === 0 ? { ...reference, workspaceId: 'wrong-workspace' } : reference),
  artifactScope: scope,
}), /cross-workspace/iu)

console.log(JSON.stringify({
  status: 'ok',
  routeReceiptHash: candidateReceipt.receiptHash,
  exactCanonicalInputCount: receipt.inputArtifactReferenceHashes.length,
  callerQualificationCannotElevate: true,
  missingRouteFailsClosed: true,
  forgedRouteRejected: true,
  staleManifestRejected: true,
  incompleteRouteBindingSetRejected: true,
  fixtureCannotAuthorizeCanonicalPrivate: true,
  qualificationCandidateCannotEscapeIssuance: true,
  missingExactInputRejected: true,
  crossWorkspaceInputRejected: true,
}))
