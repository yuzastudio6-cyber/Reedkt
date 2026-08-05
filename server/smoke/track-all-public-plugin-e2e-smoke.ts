import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import {
  createEditSkillPlanApproval,
  createEditSkillWorkResult,
  createSkillQaFinding,
  hashSkillValue,
  skillManifestReference,
  type EditSkillArtifactReference,
  type EditSkillPublicPlan,
  type EditSkillRuntime,
  type EditSkillWorkResult,
  type SkillAssignment,
} from '../edit-skills/core'
import {
  createTrackGraphV2,
  projectTrackGraphV1,
} from '../edit-skills/shared/track-graph/track-graph-schemas'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  createPrivacyPolicySnapshot,
  createTrackAllResultReceipt,
  createVisualIntelligenceTargetEvidence,
  trackAllPlanSchema,
  type TrackAllPlan,
} from '../edit-skills/track-all'
import {
  TRACK_ALL_FIXTURE_SCOPE,
  createTrackAllAuthorityFixture,
  createTrackAllCaptionZonesFixture,
  createTrackAllPriorGraphFixture,
  createTrackAllPriorRepairEvidenceFixture,
  reviseTrackAllPublicAssignment,
  type TrackAllAuthorityFixture,
} from './track-all-fixtures'

process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING = '1'
const { createInternalFixtureEditSkillRuntime } = await import(
  '../edit-skills/internal-fixture-runtime'
)

const runtime = createInternalFixtureEditSkillRuntime()
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const plugin = runtime.pluginRegistry.resolve(manifestRef)
const scope = TRACK_ALL_FIXTURE_SCOPE
const zeroActions = { providerRequestCount: 0, publicArtifactCount: 0, productionMutationCount: 0 }
const sourceText = await readFile(fileURLToPath(import.meta.url), 'utf8')
const importSpecifiers = [...sourceText.matchAll(/from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/gu)]
  .map((match) => match[1] ?? match[2] ?? '')
assert.equal(importSpecifiers.some((specifier) =>
  specifier.includes('/private/') || specifier.includes('planning-mini-skills') ||
  specifier.includes('qa-repair-runtime') || specifier.includes('sam3_1_request_compiler')), false)
let adversarialPublicBoundaryRejections = 0

interface ScenarioResult {
  key: string
  decision: TrackAllPlan['decision']
  receiptHash: string
  resultHash: string
  workItemCount: number
  dispatchReceiptCount: number
  handoffKind: 'b_roll' | 'captions' | 'render'
  acceptedArtifactTypes: string[]
}

const results: ScenarioResult[] = []

results.push(await executeScenario({
  key: 'no-action',
  fixture: await createTrackAllAuthorityFixture({
    runtime, assignmentId: 'public-no-action',
  }),
}))

results.push(await executeScenario({
  key: 'selected-plate',
  fixture: await createTrackAllAuthorityFixture({
    runtime, assignmentId: 'public-selected-plate',
    requestedJobType: 'track_all.produce_selected_target_graph',
    intendedTreatment: 'geometry_only', targetSemanticClass: 'license_plate',
    targetDescription: 'The selected license plate.',
  }),
}))

const conceptFixture = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'public-all-faces-dependency',
  requestedJobType: 'track_all.produce_concept_instance_graph',
  intendedTreatment: 'geometry_only', targetType: 'concept_group',
  targetSemanticClass: 'face', targetDescription: 'All faces except the presenter.',
  groundingKind: 'text_concept', expectedMinimumCount: 1, expectedMaximumCount: 8,
  expectedCount: 4, maximumObjects: 16,
  editorialExclusions: ['main presenter'], targetExcludeRules: ['main presenter'],
})
const dependencyPlan = await plugin.planAssignment({ assignment: conceptFixture.assignment })
assert.equal(dependencyPlan.envelope.disposition, 'needs_other_skill')
assert.equal(dependencyPlan.dependencyRequests.length, 1)
const conceptEvidenceRef = await persistVisualIntelligenceEvidence({
  runtime, fixture: conceptFixture, semanticClass: 'face', candidateCount: 4,
})
const dependencyAcceptance = await plugin.acceptDependencyArtifact({
  assignment: conceptFixture.assignment,
  plan: dependencyPlan,
  request: dependencyPlan.dependencyRequests[0]!,
  artifactRef: conceptEvidenceRef,
})
const dependencyResult = await executePublicLifecycle({
  key: 'all-faces-dependency',
  assignment: conceptFixture.assignment,
  publicPlan: dependencyPlan,
  dependencyAcceptances: [dependencyAcceptance],
  handoffKind: 'render',
})
assert.equal(dependencyResult.decision, 'needs_visual_intelligence')

const groundedConceptAssignment = reviseTrackAllPublicAssignment(
  conceptFixture.assignment,
  [...conceptFixture.assignment.contextArtifactRefs, conceptEvidenceRef],
)
results.push(await executeScenario({
  key: 'all-faces-except-presenter', fixture: conceptFixture,
  assignment: groundedConceptAssignment,
}))

const repairAssignmentId = 'public-existing-repair'
const priorGraphRef = await createTrackAllPriorGraphFixture({
  runtime, nextAssignmentId: repairAssignmentId,
})
const repairFixture = await createTrackAllAuthorityFixture({
  runtime, assignmentId: repairAssignmentId,
  requestedJobType: 'track_all.repair_track', intendedTreatment: 'repair',
  targetType: 'existing_track', targetSemanticClass: 'person',
  targetDescription: 'Repair the exact prior anonymous person track.',
  groundingKind: 'existing_track_reference', groundingArtifactRef: priorGraphRef,
  priorTrackGraphRefs: [priorGraphRef],
})
const priorRepairEvidenceRef = await createTrackAllPriorRepairEvidenceFixture({
  runtime, fixture: repairFixture, trackGraphRef: priorGraphRef,
})
results.push(await executeScenario({
  key: 'existing-track-repair',
  fixture: repairFixture,
  extraContextRefs: [priorGraphRef, priorRepairEvidenceRef],
}))

results.push(await executeScenario({
  key: 'planar-screen',
  fixture: await createTrackAllAuthorityFixture({
    runtime, assignmentId: 'public-planar-screen',
    requestedJobType: 'track_all.track_planar_region', intendedTreatment: 'planar_geometry',
    targetType: 'planar_region', targetSemanticClass: 'phone_screen',
    targetDescription: 'The approved phone screen plane.',
  }),
}))

results.push(await executeScenario({
  key: 'freeform-room-region',
  fixture: await createTrackAllAuthorityFixture({
    runtime, assignmentId: 'public-freeform-room',
    requestedJobType: 'track_all.produce_selected_target_graph',
    intendedTreatment: 'geometry_only', targetType: 'freeform_region',
    targetSemanticClass: 'room_region', targetDescription: 'The bounded selected room region.',
  }),
}))

const privacyFixture = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'public-privacy-redaction',
  requestedJobType: 'track_all.apply_privacy_redaction',
  intendedTreatment: 'privacy_redaction', targetSemanticClass: 'face',
  targetDescription: 'The selected privacy-critical face.',
  privacyClassification: 'high_assurance', targetCriticality: 'privacy_critical',
  privacyCriticality: 'high',
})
const privacyPolicyRef = await persistPrivacyPolicy(runtime)
results.push(await executeScenario({
  key: 'privacy-redaction', fixture: privacyFixture,
  extraContextRefs: [privacyPolicyRef],
}))

results.push(await executeScenario({
  key: 'product-focus',
  fixture: await createTrackAllAuthorityFixture({
    runtime, assignmentId: 'public-product-focus',
    requestedJobType: 'track_all.apply_tracked_focus', intendedTreatment: 'tracked_focus',
    targetSemanticClass: 'product', targetDescription: 'The selected product.',
  }),
}))

const reframeFixture = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'public-speaker-reframe',
  requestedJobType: 'track_all.prepare_tracked_reframe', intendedTreatment: 'tracked_reframe',
  targetSemanticClass: 'person', targetDescription: 'The selected anonymous speaker.',
})
const captionZonesRef = await createTrackAllCaptionZonesFixture({
  runtime, assignment: reframeFixture.assignment,
  specializedAssignmentHash: reframeFixture.specializedAssignment.assignmentHash,
})
results.push(await executeScenario({
  key: 'speaker-reframe', fixture: reframeFixture,
  extraContextRefs: [captionZonesRef],
}))

results.push(await executeScenario({
  key: 'b-roll-track-graph-v1', handoffKind: 'b_roll',
  fixture: await createTrackAllAuthorityFixture({
    runtime, assignmentId: 'public-broll-handoff',
    requestedJobType: 'track_all.produce_selected_target_graph',
    intendedTreatment: 'geometry_only', targetSemanticClass: 'person',
    targetDescription: 'The anonymous presenter safe-region subject.',
  }),
}))

results.push(await executeScenario({
  key: 'captions-behind-subject', handoffKind: 'captions',
  fixture: await createTrackAllAuthorityFixture({
    runtime, assignmentId: 'public-caption-handoff',
    requestedJobType: 'track_all.produce_selected_target_graph',
    intendedTreatment: 'geometry_only', targetSemanticClass: 'person',
    targetDescription: 'The anonymous foreground caption subject.',
  }),
}))

assert.equal(results.length, 11)
assert.deepEqual(new Set(results.map((value) => value.key)), new Set([
  'no-action', 'selected-plate', 'all-faces-except-presenter',
  'existing-track-repair', 'planar-screen', 'freeform-room-region',
  'privacy-redaction', 'product-focus', 'speaker-reframe',
  'b-roll-track-graph-v1', 'captions-behind-subject',
]))
assert.equal(results.every((value) => value.workItemCount === value.dispatchReceiptCount), true)
assert.equal(results.find((value) => value.key === 'all-faces-except-presenter')?.decision, 'produce_track_graph')
assert.equal(results.find((value) => value.key === 'privacy-redaction')?.decision, 'apply_privacy_redaction')
assert.equal(results.find((value) => value.key === 'planar-screen')?.decision, 'track_planar_region')
assert.equal(results.find((value) => value.key === 'existing-track-repair')?.decision, 'repair_existing_track')
assert.equal(results.find((value) => value.key === 'product-focus')?.decision, 'apply_tracked_focus')
assert.equal(results.find((value) => value.key === 'speaker-reframe')?.decision, 'prepare_tracked_reframe')
assert.equal(results.find((value) => value.key === 'b-roll-track-graph-v1')?.acceptedArtifactTypes.includes('track_all_cross_skill_handoff_v1'), true)
assert.equal(results.find((value) => value.key === 'captions-behind-subject')?.acceptedArtifactTypes.includes('track_all_cross_skill_handoff_v1'), true)

console.log(JSON.stringify({
  status: 'ok',
  publicScenarioCount: results.length,
  dependencyLifecycleCount: 1,
  scenarioDecisions: Object.fromEntries(results.map((value) => [value.key, value.decision])),
  publicResultReceiptHashes: Object.fromEntries(results.map((value) => [value.key, value.receiptHash])),
  runtimeDispatchReceiptCount: results.reduce((sum, value) => sum + value.dispatchReceiptCount, 0),
  brollTrackGraphV1Compatibility: true,
  captionsBehindSubjectHandoff: true,
  privateMiniSkillImports: 0,
  adversarialPublicBoundaryRejections,
  injectedFixtureOnly: true,
  samInferenceExecuted: false,
  ...zeroActions,
}))

async function executeScenario(input: {
  key: string
  fixture: TrackAllAuthorityFixture
  assignment?: SkillAssignment
  extraContextRefs?: readonly EditSkillArtifactReference[]
  handoffKind?: ScenarioResult['handoffKind']
}): Promise<ScenarioResult> {
  const assignment = input.assignment ?? (input.extraContextRefs?.length
    ? reviseTrackAllPublicAssignment(input.fixture.assignment, [
        ...input.fixture.assignment.contextArtifactRefs,
        ...input.extraContextRefs,
      ])
    : input.fixture.assignment)
  const publicPlan = await plugin.planAssignment({ assignment })
  return executePublicLifecycle({
    key: input.key,
    assignment,
    publicPlan,
    dependencyAcceptances: [],
    handoffKind: input.handoffKind ?? 'render',
  })
}

async function executePublicLifecycle(input: {
  key: string
  assignment: SkillAssignment
  publicPlan: EditSkillPublicPlan
  dependencyAcceptances: Parameters<typeof plugin.finalizeSkillResult>[0]['dependencyAcceptances']
  handoffKind: ScenarioResult['handoffKind']
}): Promise<ScenarioResult> {
  const plan = trackAllPlanSchema.parse(await runtime.artifactStore.readJson({
    reference: input.publicPlan.payloadRef, ...scope,
  }))
  const approval = createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.assignment.assignmentHash,
    planId: input.publicPlan.envelope.planId,
    planHash: input.publicPlan.envelope.planHash,
    manifestRef,
    authorizedRange: input.assignment.authorizedRange,
    approved: true,
    approvedAt: '2026-08-04T12:00:00.000Z',
  })
  const graph = await plugin.compileApprovedWorkGraph({
    assignment: input.assignment, plan: input.publicPlan, approval,
  })
  assert.ok(graph.pluginWorkGraphRef)
  const outputs = await persistScenarioOutputs({
    runtime, key: input.key, assignment: input.assignment, plan,
    publicPlan: input.publicPlan, handoffKind: input.handoffKind,
  })
  const planningQaRef = input.publicPlan.evidenceRefs.find((reference) =>
    reference.artifactType === 'track_all_planning_qa_report_v1')
  assert.ok(planningQaRef)
  const workItemResults: EditSkillWorkResult[] = []
  let dispatchReceiptCount = 0
  for (const item of graph.workItems) {
    const binding = runtime.runtimeBindingRegistry.resolve({
      manifestRef, jobType: item.jobType,
      adapterClass: 'internal_qualification_adapter',
      environmentClass: 'internal_fixture',
    })
    const dispatch = await runtime.runtimeDispatcher.dispatchApprovedWorkItem({
      manifestRef, workItem: item, approval,
      authorizedPhase: binding.definition.allowedPhases[0]!,
      expectedQualification: 'internal_execution_qualified',
    })
    assert.equal(dispatch.status, 'succeeded')
    assert.equal(dispatch.providerRequestCount, 0)
    assert.equal(dispatch.publicArtifactCount, 0)
    assert.equal(dispatch.productionMutationCount, 0)
    dispatchReceiptCount += 1
    const outputRef = outputs.get(item.expectedOutputType)
    assert.ok(outputRef, `Missing ${item.expectedOutputType} for ${input.key}.`)
    const resultCore: Parameters<typeof createEditSkillWorkResult>[0] = {
      schemaVersion: 'edit-skill-work-result-v1',
      workItemKey: item.workItemKey, workItemHash: item.workItemHash,
      assignmentId: input.assignment.assignmentId,
      assignmentHash: input.assignment.assignmentHash,
      planId: input.publicPlan.envelope.planId,
      planHash: input.publicPlan.envelope.planHash,
      manifestRef, authorizedRange: input.assignment.authorizedRange,
      operationId: item.operationId, workerClass: item.workerClass,
      status: 'succeeded', outputArtifactRefs: [outputRef],
      qaLineageKeys: item.qaLineageKeys,
      qaEvidenceArtifactRefs: [planningQaRef],
      mutationRanges: item.jobType === 'track_all.apply_privacy_redaction' ||
        item.jobType === 'track_all.apply_tracked_focus' ||
        item.jobType === 'track_all.prepare_tracked_reframe'
        ? [input.assignment.authorizedRange]
        : [],
      callerSelectedExecutable: false,
      outsideAuthorizedRangeModified: false,
    }
    if (input.key === 'selected-plate' && workItemResults.length === 0) {
      const wrongQaLineage = createEditSkillWorkResult({
        ...resultCore, qaLineageKeys: ['track_all.qa.forged_lineage'],
      })
      await assert.rejects(() => plugin.validateWorkItemResult({
        assignment: input.assignment, plan: input.publicPlan,
        workGraph: graph, result: wrongQaLineage,
      }), /differs from approved work/iu)
      const outOfRange = createEditSkillWorkResult({
        ...resultCore,
        mutationRanges: [{
          ...input.assignment.authorizedRange,
          startFrameInclusive: input.assignment.authorizedRange.startFrameInclusive - 1,
        }],
      })
      await assert.rejects(() => plugin.validateWorkItemResult({
        assignment: input.assignment, plan: input.publicPlan,
        workGraph: graph, result: outOfRange,
      }), /outside (?:its|the orchestra-)authorized range/iu)
      const crossWorkspace = createEditSkillWorkResult({
        ...resultCore,
        outputArtifactRefs: [{ ...outputRef, workspaceId: 'other-workspace' }],
      })
      await assert.rejects(() => plugin.validateWorkItemResult({
        assignment: input.assignment, plan: input.publicPlan,
        workGraph: graph, result: crossWorkspace,
      }), /cross-tenant/iu)
      const forgedQaEvidence = createEditSkillWorkResult({
        ...resultCore,
        qaEvidenceArtifactRefs: [{
          ...planningQaRef,
          sha256: hashSkillValue({ forged: 'qa-evidence' }),
        }],
      })
      await assert.rejects(() => plugin.validateWorkItemResult({
        assignment: input.assignment, plan: input.publicPlan,
        workGraph: graph, result: forgedQaEvidence,
      }), /not found|integrity/iu)
      adversarialPublicBoundaryRejections += 4
    }
    const result = createEditSkillWorkResult(resultCore)
    workItemResults.push(await plugin.validateWorkItemResult({
      assignment: input.assignment, plan: input.publicPlan, workGraph: graph, result,
    }))
  }
  if (input.key === 'all-faces-dependency') {
    await assert.rejects(() => plugin.finalizeSkillResult({
      assignment: input.assignment, plan: input.publicPlan, workGraph: graph,
      dependencyAcceptances: [
        ...input.dependencyAcceptances, ...input.dependencyAcceptances,
      ],
      workItemResults,
    }), /missing or extra dependency acceptances/iu)
    adversarialPublicBoundaryRejections += 1
  }
  if (input.key === 'selected-plate') {
    const { approvedWorkGraphHash: _approvedHash, ...graphCore } = graph
    void _approvedHash
    const staleCore = { ...graphCore, assignmentId: 'another-assignment' }
    const staleGraph = {
      ...staleCore, approvedWorkGraphHash: hashSkillValue(staleCore),
    }
    await assert.rejects(() => plugin.finalizeSkillResult({
      assignment: input.assignment, plan: input.publicPlan,
      workGraph: staleGraph,
      dependencyAcceptances: input.dependencyAcceptances,
      workItemResults,
    }), /stale assignment/iu)
    adversarialPublicBoundaryRejections += 1
  }
  const receipt = await plugin.finalizeSkillResult({
    assignment: input.assignment, plan: input.publicPlan, workGraph: graph,
    dependencyAcceptances: input.dependencyAcceptances,
    workItemResults,
  })
  assert.equal(receipt.approvedWorkGraphHash, graph.approvedWorkGraphHash)
  assert.equal(receipt.envelope.assignmentHash, input.assignment.assignmentHash)
  assert.equal(receipt.envelope.resultArtifactType, 'track_all_result_receipt_v1')
  assert.equal(receipt.envelope.mutationRanges.every((range) =>
    range.startFrameInclusive >= input.assignment.authorizedRange.startFrameInclusive &&
    range.endFrameExclusive <= input.assignment.authorizedRange.endFrameExclusive), true)
  return {
    key: input.key,
    decision: plan.decision,
    receiptHash: receipt.receiptHash,
    resultHash: receipt.envelope.resultHash,
    workItemCount: graph.workItems.length,
    dispatchReceiptCount,
    handoffKind: input.handoffKind,
    acceptedArtifactTypes: workItemResults.flatMap((result) =>
      result.outputArtifactRefs.map((reference) => reference.artifactType)),
  }
}

async function persistScenarioOutputs(input: {
  runtime: EditSkillRuntime
  key: string
  assignment: SkillAssignment
  plan: TrackAllPlan
  publicPlan: EditSkillPublicPlan
  handoffKind: ScenarioResult['handoffKind']
}): Promise<Map<string, EditSkillArtifactReference>> {
  const { assignment, plan } = input
  const range = assignment.authorizedRange
  const sourceSha256 = hashSkillValue({ source: input.key })
  const lineage = {
    ...scope, editSessionId: assignment.editSessionId,
    assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash,
    planHash: plan.planHash, manifestRef, sourceSha256, authorizedRange: range,
  }
  const persist = async (artifactType: string, value: unknown) => input.runtime.artifactStore.putJson({
    artifactType, value, ...scope,
  })
  const refs = new Map<string, EditSkillArtifactReference>()
  refs.set('track_all_plan_v1', input.publicPlan.payloadRef)
  const finding = createSkillQaFinding({
    qaKey: 'track_all.qa.public_fixture_lineage',
    validatorVersion: 'track_all.qa.public_fixture_lineage.validator.v1',
    disposition: 'pass',
    summary: 'Internal public-lifecycle fixture preserves exact range and lineage.',
    evidenceHashes: [hashSkillValue({ key: input.key, range, planHash: plan.planHash })],
    observations: { injectedFixtureOnly: true, samInferenceExecuted: false },
  })
  const temporalQaRef = await persist('track_all_temporal_qa_report_v1', addressed({
    schemaVersion: 'track_all_temporal_qa_report_v1', ...lineage,
    findings: [finding], disposition: 'pass',
    missingSpanCount: 0, jumpCount: 0, shotResetsValid: true,
  }))
  refs.set('track_all_temporal_qa_report_v1', temporalQaRef)
  const integrationQaRef = await persist('track_all_integration_qa_report_v1', addressed({
    schemaVersion: 'track_all_integration_qa_report_v1', ...lineage,
    findings: [finding], disposition: 'pass', outsideAuthorizedRangeModified: false,
    sourceAndTimingExact: true, privateOutput: true, publicUrlPresent: false,
    layerOrderValid: true,
  }))
  refs.set('track_all_integration_qa_report_v1', integrationQaRef)
  const cameraRef = await persist('camera_motion_graph_v1', addressed({
    schemaVersion: 'camera_motion_graph_v1', ...lineage,
    transforms: [{
      frameIndex: range.startFrameInclusive, motion: 'static',
      frameToFrameTransform: identity(), stabilizedTransform: identity(),
      confidence: 1, discontinuityWarning: false, shotReset: true,
    }],
  }))
  refs.set('camera_motion_graph_v1', cameraRef)
  const trackId = anonymousTrackId(input.key)
  const boxRef = await persist('track_box_sequence_v1', addressed({
    schemaVersion: 'track_box_sequence_v1', ...lineage, trackId,
    boxes: [{
      frameIndex: range.startFrameInclusive,
      box: { x: 0.25, y: 0.2, width: 0.35, height: 0.55 }, confidence: 0.96,
    }],
  }))
  const maskRef = await persist('track_mask_sequence_v1', addressed({
    schemaVersion: 'track_mask_sequence_v1', ...lineage, trackId,
    chunkRefs: [nestedRef('track_mask_chunk_manifest_v1', `${input.key}-private-mask`)],
    privateBinaryOnly: true, publicMaskPublished: false,
  }))
  const graph = createTrackGraphV2({
    schemaVersion: 'track_graph_v2', modelNeutral: true, ...lineage,
    sourceId: 'track-all-source', timingHash: hashSkillValue({ range, timing: input.key }),
    authorizedRangeHash: hashSkillValue(range),
    shots: [{ shotId: `${input.key}-shot`, range, sceneCutResetsIdentity: true }],
    chunks: plan.chunkPlan.chunks.length > 0
      ? plan.chunkPlan.chunks.map((chunk, index) => ({
          chunkId: chunk.chunkId, range: chunk.range, bucketIndex: index,
        }))
      : [{ chunkId: `${input.key}-no-action-chunk`, range, bucketIndex: 0 }],
    cameraMotionRef: cameraRef,
    targets: [{
      targetId: 'target-001', targetType: targetTypeFor(input.key),
      semanticClass: semanticClassFor(input.key), includeRules: ['exact approved target'],
      excludeRules: input.key.includes('faces') ? ['main presenter'] : [],
      privacyClass: input.key.includes('privacy') ? 'high_assurance' : 'none',
      groundingEvidenceHashes: [hashSkillValue({ grounding: input.key })],
      expectedMinimumCount: 1,
      expectedMaximumCount: input.key.includes('faces') ? 8 : 1,
      ambiguityState: 'none',
    }],
    tracks: [{
      trackId, targetId: 'target-001', semanticClass: semanticClassFor(input.key),
      childTrackIds: [], startFrameInclusive: range.startFrameInclusive,
      endFrameExclusive: range.endFrameExclusive,
      visibilitySpans: [{ ...rangeWithoutFps(range), state: 'active' }],
      boxSequenceRef: boxRef, maskSequenceRef: maskRef,
      confidenceSequenceHash: hashSkillValue({ confidence: input.key }),
      reentryEventHashes: [], identitySwitchWarnings: [], depthOrder: 1,
      qaRefs: [temporalQaRef], repairRefs: [],
    }],
    stitchingEvidenceHashes: [hashSkillValue({ stitching: input.key })],
    cameraNormalizationEvidenceHash: hashSkillValue({ camera: input.key }),
    uncertaintyEventHashes: [],
    objectBudget: {
      expectedObjects: Math.max(1, plan.objectBudget.expectedObjects),
      maximumObjects: plan.objectBudget.maximumObjects,
      bucketSize: 16,
      bucketCount: 1,
      sessionCount: plan.samWorkPlanned ? Math.max(1, plan.objectBudget.sessionCount) : 0,
    },
    runtimeAttemptRefs: [], finalQaRefs: [temporalQaRef],
    privateMaskDataPublished: false, outsideAuthorizedRangeModified: false,
  })
  const graphRef = await persist('track_graph_v2', graph)
  refs.set('track_graph_v2', graphRef)
  const graphV1Ref = await persist('track_graph_v1', projectTrackGraphV1(graph))
  const planarRef = await persist('planar_track_graph_v1', addressed({
    schemaVersion: 'planar_track_graph_v1', ...lineage,
    surfaceId: `${input.key}-surface`, surfaceClass: 'phone_screen',
    frames: [{
      frameIndex: range.startFrameInclusive,
      corners: [
        { x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 },
        { x: 0.8, y: 0.8 }, { x: 0.2, y: 0.8 },
      ],
      homography: identity(), reprojectionError: 0.2, visibility: 1,
      occlusion: 0, surfaceStability: 0.98, confidence: 0.97,
    }],
    coordinateInterpretation: 'world_relative',
  }))
  refs.set('planar_track_graph_v1', planarRef)
  const privacyQaRef = await persist('track_all_privacy_qa_report_v1', addressed({
    schemaVersion: 'track_all_privacy_qa_report_v1', ...lineage,
    findings: [finding], disposition: 'pass', sensitiveExposureDetected: false,
    lostTrackWindowsCovered: true, reflectionsInspected: true,
    flattenedPreviewRef: nestedRef('private_media_artifact_v1', `${input.key}-flattened`),
  }))
  const redactionPlanRef = await persist('tracked_redaction_plan_v1', addressed({
    schemaVersion: 'tracked_redaction_plan_v1', ...lineage, trackGraphRef: graphRef,
    treatment: 'conservative_region_cover', targetTrackIds: [trackId],
    uncertaintyBehavior: 'conservative_cover_and_review', flattenedPreviewRequired: true,
  }))
  refs.set('tracked_redaction_result_v1', await persist('tracked_redaction_result_v1', addressed({
    schemaVersion: 'tracked_redaction_result_v1', ...lineage, trackGraphRef: graphRef,
    planRef: redactionPlanRef,
    privateMediaRef: nestedRef('private_media_artifact_v1', `${input.key}-redacted`),
    privacyQaRef, noSensitiveExposure: true, publicArtifact: false,
  })))
  const focusPlanRef = await persist('tracked_focus_plan_v1', addressed({
    schemaVersion: 'tracked_focus_plan_v1', ...lineage, trackGraphRef: graphRef,
    treatment: 'subject_sharp_background_soft',
    handoffs: [{ trackId, range }],
  }))
  refs.set('tracked_focus_result_v1', await persist('tracked_focus_result_v1', addressed({
    schemaVersion: 'tracked_focus_result_v1', ...lineage, trackGraphRef: graphRef,
    planRef: focusPlanRef,
    privatePreviewRef: nestedRef('private_media_artifact_v1', `${input.key}-focus`),
    integrationQaRef, publicArtifact: false,
  })))
  const reframePlan = addressed({
    schemaVersion: 'tracked_reframe_plan_v1', ...lineage, trackGraphRef: graphRef,
    outputAspectRatio: '9:16', maximumZoom: 1.5,
    frames: [{
      frameIndex: range.startFrameInclusive,
      crop: { x: 0.2, y: 0, width: 0.6, height: 1 },
      priorityTrackIds: [trackId], headroom: 0.12, leadRoom: 0.1,
      safeZoneCollision: false, confidence: 0.95,
    }],
    lowConfidenceBehavior: 'widen_crop',
  })
  const reframePlanRef = await persist('tracked_reframe_plan_v1', reframePlan)
  refs.set('tracked_reframe_result_v1', await persist('tracked_reframe_result_v1', addressed({
    schemaVersion: 'tracked_reframe_result_v1', ...lineage, trackGraphRef: graphRef,
    planRef: reframePlanRef, trajectoryHash: reframePlan.artifactHash,
    integrationQaRef, finalRenderOwnedByTrackAll: false,
  })))
  refs.set('track_all_repair_receipt_v1', await persist('track_all_repair_receipt_v1', addressed({
    schemaVersion: 'track_all_repair_receipt_v1', ...lineage,
    priorTrackGraphRef: graphRef, repairIndex: 1, action: 'local_segment_retrack',
    repairedRange: range, evidenceHashes: [hashSkillValue({ repair: input.key })],
    result: 'accepted',
  })))
  refs.set('track_all_cross_skill_handoff_v1', await persist(
    'track_all_cross_skill_handoff_v1',
    addressed(crossSkillHandoff({
      lineage, handoffKind: input.handoffKind, trackId, graphRef, graphV1Ref, maskRef,
    })),
  ))
  refs.set('track_all_result_receipt_v1', await persist('track_all_result_receipt_v1',
    createTrackAllResultReceipt({
      schemaVersion: 'track_all_result_receipt_v1',
      resultId: `fixture-result-${input.key}`,
      assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash,
      planHash: plan.planHash, manifestRef, decision: plan.decision,
      authorizedRange: range, acceptedArtifactRefs: [],
      qaEvidenceHashes: [temporalQaRef.sha256], outsideAuthorizedRangeModified: false,
      anonymousIdentitiesOnly: true, privateArtifactsOnly: true,
      status: plan.decision === 'use_no_tracking'
        ? 'use_no_tracking'
        : plan.decision === 'needs_visual_intelligence'
          ? 'needs_visual_intelligence'
          : 'accepted',
    }),
  ))
  return refs
}

async function persistVisualIntelligenceEvidence(input: {
  runtime: EditSkillRuntime
  fixture: TrackAllAuthorityFixture
  semanticClass: string
  candidateCount: number
}) {
  const producerManifestRef = {
    schemaVersion: 'edit-skill-manifest-reference-v1' as const,
    skillKey: 'visual_intelligence', skillVersion: '1.0.0',
    contractVersion: 'visual_intelligence.skill_contract.v1',
    manifestHash: hashSkillValue({ skill: 'visual_intelligence', contract: 'v1' }),
  } as const
  const range = input.fixture.assignment.authorizedRange
  const evidence = createVisualIntelligenceTargetEvidence({
    schemaVersion: 'visual_intelligence_target_evidence_v1', ...scope,
    assignmentHash: input.fixture.specializedAssignment.assignmentHash,
    targetHash: input.fixture.target.targetHash,
    authorizedRangeHash: hashSkillValue(range), semanticClass: input.semanticClass,
    candidateRegions: Array.from({ length: input.candidateCount }, (_, index) => ({
      frameIndex: range.startFrameInclusive + index,
      box: { x: 0.05 + index * 0.1, y: 0.15, width: 0.08, height: 0.12 },
      confidence: 0.92,
    })),
    ambiguity: 'none', confidence: 0.94,
    producerSkillManifestRef: producerManifestRef,
    qualificationStatus: 'internal_execution_qualified', testOnlyInjected: true,
  })
  return input.runtime.artifactStore.putJson({
    artifactType: 'visual_intelligence_target_evidence_v1', value: evidence, ...scope,
  })
}

async function persistPrivacyPolicy(runtimeValue: EditSkillRuntime) {
  const value = createPrivacyPolicySnapshot({
    schemaVersion: 'privacy_policy_snapshot_v1', ...scope,
    policyVersion: 1, failClosed: true,
    allowedTreatments: [
      'gaussian_blur', 'pixelate', 'mosaic', 'solid_fill',
      'conservative_region_cover', 'tracked_crop_exclusion',
    ],
  })
  return runtimeValue.artifactStore.putJson({
    artifactType: 'privacy_policy_snapshot_v1', value, ...scope,
  })
}

function crossSkillHandoff(input: {
  lineage: Record<string, unknown>
  handoffKind: ScenarioResult['handoffKind']
  trackId: string
  graphRef: EditSkillArtifactReference
  graphV1Ref: EditSkillArtifactReference
  maskRef: EditSkillArtifactReference
}) {
  const base = {
    schemaVersion: 'track_all_cross_skill_handoff_v1' as const,
    ...input.lineage,
    consumerSkillKey: input.handoffKind,
    trackGraphV2Ref: input.graphRef,
    maskRefs: [input.maskRef], anchorGraphRefs: [], planarTrackRefs: [],
    geometryOnly: true as const, finalPeerDesignOwnedByTrackAll: false as const,
  }
  if (input.handoffKind === 'b_roll') return {
    ...base, trackGraphV1Ref: input.graphV1Ref,
    geometryPayload: {
      handoffKind: 'b_roll' as const, speakerSafeTrackIds: [input.trackId],
      insetSafeRegionStrategy: 'avoid_active_primary_subject_bounds' as const,
      cropGuidance: 'use_track_graph_v1_or_v2_authorized_geometry' as const,
    },
  }
  if (input.handoffKind === 'captions') return {
    ...base,
    geometryPayload: {
      handoffKind: 'captions' as const, foregroundTrackIds: [input.trackId],
      behindSubjectTrackIds: [input.trackId], faceSafeTrackIds: [input.trackId],
      occlusionOrderPolicy: 'captions_resolve_design_track_all_supplies_geometry' as const,
    },
  }
  return {
    ...base,
    geometryPayload: {
      handoffKind: 'render' as const,
      layerOrder: ['source', 'track_all_treatment', 'peer_visuals', 'captions'] as const,
      exactFrameRangeRequired: true as const,
      privateMaskResolutionRequired: true as const,
      finalRenderOwnedByTrackAll: false as const,
    },
  }
}

function addressed<T extends Record<string, unknown>>(core: T) {
  return { ...core, artifactHash: hashSkillValue(core) }
}

function nestedRef(artifactType: string, key: string): EditSkillArtifactReference {
  return {
    artifactType, sha256: hashSkillValue({ artifactType, key }), byteLength: 1_024, ...scope,
  }
}

function identity() {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1] as const
}

function rangeWithoutFps(range: SkillAssignment['authorizedRange']) {
  return {
    startFrameInclusive: range.startFrameInclusive,
    endFrameExclusive: range.endFrameExclusive,
  }
}

function anonymousTrackId(key: string) {
  if (key.includes('plate')) return 'license_plate_001'
  if (key.includes('screen')) return 'surface_001'
  if (key.includes('room')) return 'region_001'
  if (key.includes('product')) return 'object_001'
  if (key.includes('face')) return 'face_001'
  return 'person_001'
}

function semanticClassFor(key: string) {
  if (key.includes('plate')) return 'license_plate'
  if (key.includes('screen')) return 'phone_screen'
  if (key.includes('room')) return 'room_region'
  if (key.includes('product')) return 'product'
  if (key.includes('face') || key.includes('privacy')) return 'face'
  return 'person'
}

function targetTypeFor(key: string) {
  if (key.includes('faces')) return 'concept_group'
  if (key.includes('screen')) return 'planar_region'
  if (key.includes('room')) return 'freeform_region'
  if (key.includes('repair')) return 'existing_track'
  return 'selected_instance'
}
