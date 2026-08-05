import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_PROVIDER_OPERATIONS,
  BROLL_TOOL_OPERATIONS,
  createBrollAssignment,
  createBrollMasterTimingPlan,
  createBrollPlanningContext,
  createBrollPublicContextManifest,
  createBrollSourceInventory,
  createBrollTrackAllSupportRequest,
  createBrollVisualOwnershipManifest,
  createSourceMediaArtifactV1,
  type BrollSkillAssignment,
} from '../edit-skills/b-roll'
import {
  DurablePrivateEditSkillArtifactStore,
  createEditSkillPlanApproval,
  createEditSkillSupportRequest,
  createSkillAssignment,
  createSkillRouteQualificationReceipt,
  editSkillSupportAcceptanceSchema,
  hashSkillValue,
  skillManifestReference,
  type EditSkillArtifactReference,
  type EditSkillRuntime,
  type SkillAssignment,
} from '../edit-skills/core'
import { createEditSkillRuntimeRegistries } from '../edit-skills/registry'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_SAM_OPERATION_V2,
  TRACK_ALL_TOOL_OPERATIONS,
  TrackAllCanonicalPrivateExecutionCoordinator,
  assertTrackAllOwnerSupportResult,
  createTrackAllCanonicalPrivateRuntime,
  createTrackAllOwnerSupportResult,
  trackAllCrossSkillHandoffSchema,
  trackBoxSequenceSchema,
  trackAllPlanSchema,
  trackAllWorkGraphArtifactSchema,
} from '../edit-skills/track-all'
import { trackGraphV2Schema } from '../edit-skills/shared/track-graph/track-graph-schemas'
import {
  LocalPrivateTrackAllMediaSink,
  TrackAllCanonicalPrivateDeterministicOperationDriver,
} from '../edit-skills/track-all/private/canonical-private-operation-driver'
import { compileTrackAllCrossSkillHandoffs } from '../edit-skills/track-all/private/cross-skill-handoff-runtime'
import {
  TRACK_ALL_FIXTURE_SCOPE,
  createTrackAllAuthorityFixture,
  createTrackAllPriorGraphFixture,
  createTrackAllPriorRepairEvidenceFixture,
  reviseTrackAllPublicAssignment,
} from './track-all-fixtures'
import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution'
import { createPrivateOfflinePythonStructuredExecutionRuntime } from '../tool-execution/python-runner-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'

const RANGE = { startFrameInclusive: 0, endFrameExclusive: 24, fps: 24 }
const MASTER_RANGE = { startFrameInclusive: 0, endFrameExclusive: 240, fps: 24 }

export async function runBrollTrackSupportIntegration(): Promise<{
  supportRequestHash: string
  supportResultHash: string
  acceptanceHash: string
  trackAssignmentId: string
  brollAssignmentId: string
  adversarialCases: number
  captionSupportResultHash: string
  captionConsumerRuntimeReady: false
}> {
  const root = await mkdtemp(join(tmpdir(), 'reeditpro-broll-track-support-'))
  try {
    const registries = createEditSkillRuntimeRegistries()
    const artifactStore = new DurablePrivateEditSkillArtifactStore({
      rootPath: join(root, 'artifacts'),
      schemas: registries.artifactSchemaRegistry,
    })
    const operationIds = [
      ...BROLL_TOOL_OPERATIONS,
      ...TRACK_ALL_TOOL_OPERATIONS,
      TRACK_ALL_SAM_OPERATION_V2,
    ]
    const { runtime, executorRouter } = await createTrackAllCanonicalPrivateRuntime({
      artifactStore,
      privateArtifactAuthority: true,
      providerAuthority: {
        operations: new Map(BROLL_PROVIDER_OPERATIONS.map((operationId) => [
          operationId,
          'internal_execution_qualified' as const,
        ])),
      },
      toolRegistry: {
        operationIds: new Set(operationIds),
        operationQualifications: new Map(operationIds.map((operationId) => [
          operationId,
          'internal_execution_qualified' as const,
        ])),
      },
      ...registries,
    })
    const sourceBytes = Buffer.from(
      'reeditpro-track-all-owner-support-private-source-v1'.repeat(8),
      'utf8',
    )
    const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
    const sourceMedia = createSourceMediaArtifactV1({
      schemaVersion: 'source_media_artifact_v1',
      ...TRACK_ALL_FIXTURE_SCOPE,
      sourceId: 'shared-owner-support-source',
      privateObjectIdentityHash: hashSkillValue({
        sourceSha256,
        identity: 'private-owner-support-source-v1',
      }),
      objectSha256: sourceSha256,
      byteLength: sourceBytes.byteLength,
      mimeType: 'video/mp4',
      container: 'mp4',
      durationFrames: RANGE.endFrameExclusive,
      fps: RANGE.fps,
      width: 320,
      height: 180,
      provenanceVerified: true,
      rightsApproved: true,
      privacyApproved: true,
      proofClassification: 'source_verified',
      checksumReadbackVerified: true,
      privateOnly: true,
      publicDeliveryAllowed: false,
      immutable: true,
    })
    const sourceMediaRef = await artifactStore.putJson({
      artifactType: 'source_media_artifact_v1',
      value: sourceMedia,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    const broll = await createBrollTrackingFixture({ runtime, sourceMediaRef })
    const brollPlugin = runtime.pluginRegistry.resolve(
      skillManifestReference(BROLL_CAPABILITY_MANIFEST),
    )
    const brollPlan = await brollPlugin.planAssignment({ assignment: broll })
    assert.equal(brollPlan.envelope.disposition, 'needs_other_skill')
    const dependencyRequest = brollPlan.dependencyRequests[0]!
    assert.equal(dependencyRequest.dependencySkillKey, 'track_all')
    assert.equal(dependencyRequest.requiredArtifactType, 'track_graph_v1')

    const trackAssignmentId = 'track-25-owner-assignment'
    const priorGraphRef = await createTrackAllPriorGraphFixture({
      runtime,
      nextAssignmentId: trackAssignmentId,
      authorizedRange: RANGE,
      sourceSha256,
    })
    const trackFixture = await createTrackAllAuthorityFixture({
      runtime,
      assignmentId: trackAssignmentId,
      sourceChecksum: sourceSha256,
      sourceFrameChecksum: sourceSha256,
      sourceWidth: 320,
      sourceHeight: 180,
      authorizedRange: RANGE,
      analysisContextRange: RANGE,
      priorTrackGraphRefs: [priorGraphRef],
      requestedJobType: 'track_all.repair_track',
      intendedTreatment: 'repair',
      targetType: 'existing_track',
      groundingKind: 'existing_track_reference',
      groundingArtifactRef: priorGraphRef,
    })
    const repairEvidenceRef = await createTrackAllPriorRepairEvidenceFixture({
      runtime,
      fixture: trackFixture,
      trackGraphRef: priorGraphRef,
    })
    const trackAssignment = reviseTrackAllPublicAssignment(trackFixture.assignment, [
      ...trackFixture.assignment.contextArtifactRefs,
      priorGraphRef,
      repairEvidenceRef,
    ])
    assert.notEqual(trackAssignment.assignmentId, broll.assignmentId)
    const trackPlugin = runtime.pluginRegistry.resolve(
      skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
    )
    const publicPlan = await trackPlugin.planAssignment({ assignment: trackAssignment })
    const plan = trackAllPlanSchema.parse(await artifactStore.readJson({
      reference: publicPlan.payloadRef,
      ...TRACK_ALL_FIXTURE_SCOPE,
    }))
    assert.equal(plan.decision, 'repair_existing_track')
    const approval = createEditSkillPlanApproval({
      schemaVersion: 'edit-skill-plan-approval-v1',
      assignmentId: trackAssignment.assignmentId,
      assignmentHash: trackAssignment.assignmentHash,
      planId: publicPlan.envelope.planId,
      planHash: publicPlan.envelope.planHash,
      manifestRef: trackAssignment.manifestRef,
      authorizedRange: trackAssignment.authorizedRange,
      approved: true,
      approvedAt: '2026-08-05T12:00:00.000Z',
    })
    const approvedWorkGraph = await trackPlugin.compileApprovedWorkGraph({
      assignment: trackAssignment,
      plan: publicPlan,
      approval,
    })
    const pluginWorkGraph = trackAllWorkGraphArtifactSchema.parse(
      await artifactStore.readJson({
        reference: approvedWorkGraph.pluginWorkGraphRef!,
        ...TRACK_ALL_FIXTURE_SCOPE,
      }),
    )
    const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
    const pythonRuntime = await createPrivateOfflinePythonStructuredExecutionRuntime()
    await prepareOfflineRemotionDockerRuntime()
    const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
    const coordinator = new TrackAllCanonicalPrivateExecutionCoordinator({
      runtime,
      executorRouter,
      operationDriver: new TrackAllCanonicalPrivateDeterministicOperationDriver({
        artifactStore,
        approvedSourceMedia: {
          sourceSha256,
          mimeType: 'video/mp4',
          bytes: sourceBytes,
        },
        runtimes: {
          media: mediaRuntime,
          python: pythonRuntime,
          remotion: remotionRuntime,
        },
        privateMediaSink: new LocalPrivateTrackAllMediaSink({
          rootPath: join(root, 'private-media'),
        }),
        now: deterministicClock(),
      }),
      execution: {
        assignment: trackAssignment,
        publicPlan,
        plan,
        approval,
        approvedWorkGraph,
        pluginWorkGraph,
        initialArtifactRefs: [
          ...trackAssignment.contextArtifactRefs,
          ...trackAssignment.dependencyArtifactRefs,
        ],
      },
    })
    const execution = await coordinator.executeApprovedGraph()
    const handoffResult = execution.workItemResults.find((result) =>
      result.outputArtifactRefs.some((reference) =>
        reference.artifactType === 'track_all_cross_skill_handoff_v1'))
    assert.ok(handoffResult)
    const handoffRef = handoffResult.outputArtifactRefs.find((reference) =>
      reference.artifactType === 'track_all_cross_skill_handoff_v1')!
    const handoff = trackAllCrossSkillHandoffSchema.parse(await artifactStore.readJson({
      reference: handoffRef,
      ...TRACK_ALL_FIXTURE_SCOPE,
    }))
    assert.equal(handoff.consumerSkillKey, 'b_roll')
    assert.ok(handoff.trackGraphV1Ref)
    const trackGraphRef = handoff.trackGraphV1Ref
    const trackGraph = await artifactStore.readJson({
      reference: trackGraphRef,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    const supportRequest = createBrollTrackAllSupportRequest({
      assignment: broll,
      plan: brollPlan,
      dependencyRequest,
      sourceMediaRef,
      sourceMedia,
    })
    const supportRequestRef = await artifactStore.putJson({
      artifactType: 'edit_skill_support_request_v1',
      value: supportRequest,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    const skillQualificationReceipt = runtime.qualificationRegistry.resolve(
      trackAssignment.manifestRef,
    )
    const routeQualificationReceipt = runtime.routeQualificationRegistry.resolveReceipt({
      manifestRef: trackAssignment.manifestRef,
      routeKey: 'public_plugin_lifecycle_route',
      environmentClass: 'canonical_private',
    })
    assert.equal(routeQualificationReceipt.qualificationCandidateOnly, false)
    assert.equal(
      routeQualificationReceipt.qualificationStatus,
      'internal_execution_qualified',
    )
    const supportResult = createTrackAllOwnerSupportResult({
      request: supportRequest,
      supportRequestRef,
      trackAllAssignment: trackAssignment,
      trackAllPlanHash: plan.planHash,
      trackAllResultReceiptHash: execution.finalResult.receiptHash,
      skillQualificationReceipt,
      routeQualificationReceipt,
      compatibleRange: RANGE,
      producedArtifactRef: trackGraphRef,
      producedArtifact: trackGraph,
    })
    const supportResultRef = await artifactStore.putJson({
      artifactType: 'edit_skill_support_result_v1',
      value: supportResult,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    assertTrackAllOwnerSupportResult({
      request: supportRequest,
      result: supportResult,
      supportResultRef,
      producedArtifact: trackGraph,
    })
    const acceptance = editSkillSupportAcceptanceSchema.parse(
      await brollPlugin.acceptDependencyArtifact({
        assignment: broll,
        plan: brollPlan,
        request: dependencyRequest,
        artifactRef: trackGraphRef,
        supportResultRef,
      }),
    )
    assert.equal(acceptance.producerAssignmentId, trackAssignment.assignmentId)
    assert.notEqual(acceptance.producerAssignmentId, acceptance.assignmentId)
    assert.equal(acceptance.supportResultHash, supportResult.supportResultHash)
    assert.equal(acceptance.sourceSha256, sourceSha256)
    assert.equal(acceptance.productionQualified, false)

    let adversarialCases = 0
    await assert.rejects(() => brollPlugin.acceptDependencyArtifact({
      assignment: broll,
      plan: brollPlan,
      request: dependencyRequest,
      artifactRef: trackGraphRef,
    }), /authenticated Track All owner support result/iu)
    adversarialCases += 1

    const crossSourceRequest = createEditSkillSupportRequest({
      ...withoutRequestHash(supportRequest),
      requestId: 'b-roll-track-all-cross-source',
      sharedAuthority: {
        ...supportRequest.sharedAuthority,
        sourceSha256: hashSkillValue({ source: 'different' }),
      },
    })
    const crossSourceRequestRef = await artifactStore.putJson({
      artifactType: 'edit_skill_support_request_v1',
      value: crossSourceRequest,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    assert.throws(() => createTrackAllOwnerSupportResult({
      request: crossSourceRequest,
      supportRequestRef: crossSourceRequestRef,
      trackAllAssignment: trackAssignment,
      trackAllPlanHash: plan.planHash,
      trackAllResultReceiptHash: execution.finalResult.receiptHash,
      skillQualificationReceipt,
      routeQualificationReceipt,
      compatibleRange: RANGE,
      producedArtifactRef: trackGraphRef,
      producedArtifact: trackGraph,
    }), /source/iu)
    adversarialCases += 1

    const crossRangeRequest = createEditSkillSupportRequest({
      ...withoutRequestHash(supportRequest),
      requestId: 'b-roll-track-all-cross-range',
      consumer: {
        ...supportRequest.consumer,
        requestedRange: { startFrameInclusive: 0, endFrameExclusive: 48, fps: 24 },
      },
    })
    const crossRangeRequestRef = await artifactStore.putJson({
      artifactType: 'edit_skill_support_request_v1',
      value: crossRangeRequest,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    assert.throws(() => createTrackAllOwnerSupportResult({
      request: crossRangeRequest,
      supportRequestRef: crossRangeRequestRef,
      trackAllAssignment: trackAssignment,
      trackAllPlanHash: plan.planHash,
      trackAllResultReceiptHash: execution.finalResult.receiptHash,
      skillQualificationReceipt,
      routeQualificationReceipt,
      compatibleRange: RANGE,
      producedArtifactRef: trackGraphRef,
      producedArtifact: trackGraph,
    }), /range|requested/iu)
    adversarialCases += 1

    const {
      receiptHash: _routeReceiptHash,
      ...routeCore
    } = routeQualificationReceipt
    void _routeReceiptHash
    const underQualifiedRoute = createSkillRouteQualificationReceipt({
      ...routeCore,
      qualificationStatus: 'planning_qualified',
      evidenceClass: 'actual_planning_evidence',
    })
    assert.throws(() => createTrackAllOwnerSupportResult({
      request: supportRequest,
      supportRequestRef,
      trackAllAssignment: trackAssignment,
      trackAllPlanHash: plan.planHash,
      trackAllResultReceiptHash: execution.finalResult.receiptHash,
      skillQualificationReceipt,
      routeQualificationReceipt: underQualifiedRoute,
      compatibleRange: RANGE,
      producedArtifactRef: trackGraphRef,
      producedArtifact: trackGraph,
    }), /satisfy|under-qualified|qualified/iu)
    adversarialCases += 1

    await assert.rejects(() => artifactStore.putJson({
      artifactType: 'edit_skill_support_result_v1',
      value: { ...supportResult, supportResultHash: '0'.repeat(64) },
      ...TRACK_ALL_FIXTURE_SCOPE,
    }), /hash/iu)
    adversarialCases += 1

    const priorGraph = trackGraphV2Schema.parse(await artifactStore.readJson({
      reference: priorGraphRef,
      ...TRACK_ALL_FIXTURE_SCOPE,
    }))
    const boxSequences = await Promise.all(priorGraph.tracks.map(async (track) =>
      trackBoxSequenceSchema.parse(await artifactStore.readJson({
        reference: track.boxSequenceRef,
        ...TRACK_ALL_FIXTURE_SCOPE,
      }))))
    const captionDraft = compileTrackAllCrossSkillHandoffs({
      trackGraph: priorGraph,
      boxSequences,
      maskSequences: [],
      anchorGraphs: [],
      planarTrackGraphs: [],
    }).captions
    const {
      artifactHash: _captionDraftHash,
      ...captionDraftCore
    } = captionDraft
    void _captionDraftHash
    const captionCore = {
      ...captionDraftCore,
      assignmentId: trackAssignment.assignmentId,
      assignmentHash: trackAssignment.assignmentHash,
      planHash: plan.planHash,
      manifestRef: trackAssignment.manifestRef,
      authorizedRange: trackAssignment.authorizedRange,
      trackGraphV2Ref: priorGraphRef,
    }
    const captionHandoff = trackAllCrossSkillHandoffSchema.parse({
      ...captionCore,
      artifactHash: hashSkillValue(captionCore),
    })
    const captionHandoffRef = await artifactStore.putJson({
      artifactType: 'track_all_cross_skill_handoff_v1',
      value: captionHandoff,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    const captionManifestRef = {
      schemaVersion: 'edit-skill-manifest-reference-v1' as const,
      skillKey: 'captions' as const,
      skillVersion: '1.0.0',
      contractVersion: 'caption-shared-owner-integration-handoff-v1',
      manifestHash: '12f6bfbb3316d3908b65a00d637ccb0d20cdcf42311ca95a22726c3e8726bd4c',
    }
    const captionRequest = createEditSkillSupportRequest({
      schemaVersion: 'edit-skill-support-request-v1',
      requestId: 'caption-track-all-frozen-source-only-request',
      consumer: {
        skillKey: 'captions',
        manifestRef: captionManifestRef,
        assignmentId: 'caption-frozen-shared-owner-assignment',
        assignmentHash: hashSkillValue({
          captionCommit: 'a97dc0a931d6364e154f9fab2bebf488e6f708b3',
          assignment: 'caption-frozen-shared-owner-assignment',
        }),
        dependencyRequestHash: hashSkillValue({
          contract: 'caption-track-all-support-payload-v1',
          frameRange: RANGE,
        }),
        requestedRange: RANGE,
        requestedArtifactType: 'track_all_cross_skill_handoff_v1',
        requiredForPhase: 'skill_output_qa',
      },
      sharedAuthority: {
        ...TRACK_ALL_FIXTURE_SCOPE,
        editSessionId: trackAssignment.editSessionId,
        sourceSha256,
        sourceArtifactRef: sourceMediaRef,
      },
      producerSkillKey: 'track_all',
      requiredProducerRouteKey: 'public_plugin_lifecycle_route',
      minimumProducerRouteQualification: 'internal_execution_qualified',
      supportRequestOnly: true,
      executionAuthorityGranted: false,
      providerInvocationAuthorityGranted: false,
      timelineMutationAuthorityGranted: false,
      scopeExpansionAuthorityGranted: false,
    })
    const captionRequestRef = await artifactStore.putJson({
      artifactType: 'edit_skill_support_request_v1',
      value: captionRequest,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    const captionSupportResult = createTrackAllOwnerSupportResult({
      request: captionRequest,
      supportRequestRef: captionRequestRef,
      trackAllAssignment: trackAssignment,
      trackAllPlanHash: plan.planHash,
      trackAllResultReceiptHash: execution.finalResult.receiptHash,
      skillQualificationReceipt,
      routeQualificationReceipt,
      compatibleRange: RANGE,
      producedArtifactRef: captionHandoffRef,
      producedArtifact: captionHandoff,
    })
    const captionSupportResultRef = await artifactStore.putJson({
      artifactType: 'edit_skill_support_result_v1',
      value: captionSupportResult,
      ...TRACK_ALL_FIXTURE_SCOPE,
    })
    assertTrackAllOwnerSupportResult({
      request: captionRequest,
      result: captionSupportResult,
      supportResultRef: captionSupportResultRef,
      producedArtifact: captionHandoff,
    })

    return {
      supportRequestHash: supportRequest.requestHash,
      supportResultHash: supportResult.supportResultHash,
      acceptanceHash: acceptance.acceptanceHash,
      trackAssignmentId: trackAssignment.assignmentId,
      brollAssignmentId: broll.assignmentId,
      adversarialCases,
      captionSupportResultHash: captionSupportResult.supportResultHash,
      captionConsumerRuntimeReady: false,
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function createBrollTrackingFixture(input: {
  runtime: EditSkillRuntime
  sourceMediaRef: EditSkillArtifactReference
}): Promise<SkillAssignment> {
  const scope = TRACK_ALL_FIXTURE_SCOPE
  const assignmentId = 'track-25-broll-consumer-assignment'
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const context = createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ...scope,
    assignmentId,
    baseFootageStrength: 0.2,
    speakerEmotionImportance: 0.1,
    meaningfulVisualNeed: 0.95,
    userVisualPreference: 'minimal',
    claimSensitivity: 'none',
    generatedMediaWouldMislead: false,
    captionReservedZoneCount: 1,
    trackingRequired: true,
    sourceCandidates: [],
    priorConceptKeys: [],
    confirmedAspectRatio: '16:9',
    uploadedVideoEditRegionEligible: true,
    referenceDnaDoNotCopyRules: ['Do not copy exact shots.'],
  })
  const sourceInventory = createBrollSourceInventory({
    schemaVersion: 'source_inventory_v1',
    ...scope,
    editSessionId: 'track-all-session',
    assignmentId,
    editPlanVersion: 1,
    manifestRef,
    candidates: [],
  })
  const sourceInventoryRef = await input.runtime.artifactStore.putJson({
    artifactType: 'source_inventory_v1',
    value: sourceInventory,
    ...scope,
  })
  const masterTiming = createBrollMasterTimingPlan({
    schemaVersion: 'master_timing_plan_v1',
    ...scope,
    editSessionId: 'track-all-session',
    assignmentId,
    editPlanVersion: 1,
    manifestRef,
    fps: RANGE.fps,
    timelineRange: MASTER_RANGE,
    assignmentRange: RANGE,
  })
  const masterTimingRef = await input.runtime.artifactStore.putJson({
    artifactType: 'master_timing_plan_v1',
    value: masterTiming,
    ...scope,
  })
  const visualOwnership = createBrollVisualOwnershipManifest({
    schemaVersion: 'visual_ownership_manifest_v1',
    ...scope,
    editSessionId: 'track-all-session',
    assignmentId,
    editPlanVersion: 1,
    manifestRef,
    assignmentRange: RANGE,
    requestedOwnership: 'primary',
    ownershipWindows: [],
  })
  const visualOwnershipRef = await input.runtime.artifactStore.putJson({
    artifactType: 'visual_ownership_manifest_v1',
    value: visualOwnership,
    ...scope,
  })
  const specialized: BrollSkillAssignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId,
    orchestrationRunId: `pre-orchestra-${assignmentId}`,
    ...scope,
    editSessionId: 'track-all-session',
    editPlanVersion: 1,
    masterTimingHash: masterTiming.timingHash,
    masterTimingRange: MASTER_RANGE,
    segmentIds: ['segment-track-support'],
    sourceSequenceIds: [],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [sourceInventoryRef, masterTimingRef, visualOwnershipRef],
    },
    writeRangeAuthority: {
      authorizedRange: RANGE,
      outsideAuthorizedRangeModified: false,
    },
    reason: 'Request exact model-neutral speaker-safe geometry from Track All.',
    pointToProveClarifyCoverOrSupport: 'support a range-bound B-roll composition',
    expectedViewerBenefit: 'Keep the selected B-roll treatment clear of the tracked subject.',
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not infer real-world identity.'],
    permittedSourceRoutes: ['use_no_broll'],
    providerPermission: 'forbidden',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: 120,
    maximumCredits: 10,
    requiredOutputTypes: ['b_roll_plan_v1'],
    manifestRef,
  })
  const assignmentRef = await input.runtime.artifactStore.putJson({
    artifactType: 'b_roll_assignment_v1',
    value: specialized,
    ...scope,
  })
  const contextManifest = createBrollPublicContextManifest({
    context,
    editSessionId: 'track-all-session',
    editPlanVersion: 1,
    manifestRef,
    assignmentRef,
    sourceInventoryRef,
    masterTimingRef,
    visualOwnershipRef,
  })
  const contextRef = await input.runtime.artifactStore.putJson({
    artifactType: 'b_roll_context_manifest_v1',
    value: contextManifest,
    ...scope,
  })
  return createSkillAssignment({
    schemaVersion: 'edit-skill-assignment-v1',
    assignmentId,
    ...scope,
    editSessionId: 'track-all-session',
    planningRequestId: 'track-25-broll-support-request',
    manifestRef,
    authorizedRange: RANGE,
    reason: specialized.reason,
    intendedViewerBenefit: specialized.expectedViewerBenefit,
    editorialContext: 'B-roll Track All producer/consumer support integration fixture.',
    visualOwnership: 'primary',
    contextArtifactRefs: [
      assignmentRef,
      contextRef,
      sourceInventoryRef,
      masterTimingRef,
      visualOwnershipRef,
      input.sourceMediaRef,
    ],
    dependencyArtifactRefs: [],
    requestedBySkill: 'orchestra',
  })
}

function withoutRequestHash<T extends { requestHash: string }>(input: T): Omit<T, 'requestHash'> {
  const { requestHash: _requestHash, ...core } = input
  void _requestHash
  return core
}

function deterministicClock(): () => string {
  let sequence = 0
  return () => new Date(Date.UTC(2026, 7, 5, 12, 0, 0, sequence++)).toISOString()
}
