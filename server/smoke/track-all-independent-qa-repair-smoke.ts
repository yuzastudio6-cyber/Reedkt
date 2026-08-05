import assert from 'node:assert/strict'

import { createTrackGraphV2 } from '../edit-skills/shared/track-graph/track-graph-schemas'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import {
  cameraMotionGraphSchema,
  planarTrackGraphSchema,
  trackAllTemporalQaReportSchema,
  trackBoxSequenceSchema,
  trackIdentityLineageSchema,
  trackMaskSequenceSchema,
  trackSampleSequenceSchema,
} from '../edit-skills/track-all/track-all-active-artifact-contracts'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all/track-all-capability-manifest'
import {
  deriveTrackAllIndependentQa,
  directTrackAllRepair,
  finalizeTrackAllRepair,
} from '../edit-skills/track-all/private/qa-repair-runtime'

interface FixtureOptions {
  targetAlignment?: number
  maximumExcludedSimilarity?: number
  expectedPersonCount?: number
  boxJump?: boolean
  lowMaskTrackId?: 'person_001' | 'face_001'
  uncertainSeam?: boolean
  silentIdentitySwitch?: boolean
  planarError?: number
  outsideModifiedFrame?: number
  publicOutput?: boolean
  ownershipConflict?: boolean
  badLayerOrder?: boolean
}

const scope = {
  ownerUserId: 'qa-user',
  workspaceId: 'qa-workspace',
  projectId: 'qa-project',
}
const range = { startFrameInclusive: 0, endFrameExclusive: 24, fps: 24 }
const assignmentHash = hashSkillValue({ assignment: 'qa-repair' })
const planHash = hashSkillValue({ plan: 'qa-repair' })
const sourceSha256 = hashSkillValue({ source: 'qa-repair' })
const timingHash = hashSkillValue({ timing: range })
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const base = {
  ...scope,
  editSessionId: 'qa-session',
  assignmentId: 'qa-assignment',
  assignmentHash,
  planHash,
  manifestRef,
  sourceSha256,
  authorizedRange: range,
}
const ref = (artifactType: string, sha256: string) => ({
  artifactType,
  sha256,
  byteLength: 1_024,
  ...scope,
})
const addressed = <T extends Record<string, unknown>>(core: T) => ({
  ...core,
  artifactHash: hashSkillValue(core),
})
const measurement = <T extends Record<string, unknown>>(core: T) => ({
  ...core,
  measurementHash: hashSkillValue(core),
})

function makeFixture(options: FixtureOptions = {}) {
  const boxGeometry = (
    trackId: 'person_001' | 'face_001',
    frameIndex: number,
  ) => {
    if (options.boxJump && trackId === 'person_001' && frameIndex === 12) {
      return { x: 0.65, y: 0.18, width: 0.28, height: 0.62 }
    }
    return trackId === 'person_001'
      ? { x: 0.12 + frameIndex * 0.008, y: 0.18, width: 0.28, height: 0.62 }
      : { x: 0.18 + frameIndex * 0.008, y: 0.2, width: 0.1, height: 0.15 }
  }
  const boxes = (trackId: 'person_001' | 'face_001') =>
    trackBoxSequenceSchema.parse(addressed({
      schemaVersion: 'track_box_sequence_v1' as const,
      ...base,
      trackId,
      boxes: Array.from({ length: 24 }, (_, frameIndex) => ({
        frameIndex,
        box: boxGeometry(trackId, frameIndex),
        confidence: 0.94,
      })),
    }))
  const samples = (trackId: 'person_001' | 'face_001') =>
    trackSampleSequenceSchema.parse(addressed({
      schemaVersion: 'track_sample_sequence_v1' as const,
      ...base,
      trackId,
      samples: Array.from({ length: 24 }, (_, frameIndex) => ({
        frameIndex,
        confidence: 0.94,
        visibility: 'active' as const,
      })),
    }))
  const masks = (trackId: 'person_001' | 'face_001') =>
    trackMaskSequenceSchema.parse(addressed({
      schemaVersion: 'track_mask_sequence_v1' as const,
      ...base,
      trackId,
      chunkRefs: [ref('track_mask_chunk_manifest_v1', hashSkillValue({ trackId, mask: 1 }))],
      privateBinaryOnly: true as const,
      publicMaskPublished: false as const,
    }))
  const boxSequences = [boxes('person_001'), boxes('face_001')]
  const sampleSequences = [samples('person_001'), samples('face_001')]
  const maskSequences = [masks('person_001'), masks('face_001')]
  const cameraMotionGraph = cameraMotionGraphSchema.parse(addressed({
    schemaVersion: 'camera_motion_graph_v1' as const,
    ...base,
    transforms: Array.from({ length: 24 }, (_, frameIndex) => ({
      frameIndex,
      motion: frameIndex === 0 ? 'static' as const : 'pan' as const,
      frameToFrameTransform: [1, 0, 0.004, 0, 1, 0, 0, 0, 1] as const,
      stabilizedTransform: [1, 0, -frameIndex * 0.004, 0, 1, 0, 0, 0, 1] as const,
      confidence: 0.92,
      discontinuityWarning: false,
      shotReset: frameIndex === 0,
    })),
  }))
  const planar = planarTrackGraphSchema.parse(addressed({
    schemaVersion: 'planar_track_graph_v1' as const,
    ...base,
    surfaceId: 'screen-surface',
    surfaceClass: 'phone_screen' as const,
    frames: Array.from({ length: 24 }, (_, frameIndex) => ({
      frameIndex,
      corners: [
        { x: 0.65, y: 0.25 }, { x: 0.9, y: 0.25 },
        { x: 0.9, y: 0.65 }, { x: 0.65, y: 0.65 },
      ] as const,
      homography: [1, 0, 0, 0, 1, 0, 0, 0, 1] as const,
      reprojectionError: options.planarError ?? 0.45,
      visibility: 1,
      occlusion: 0,
      surfaceStability: 0.94,
      confidence: 0.92,
    })),
    coordinateInterpretation: 'world_relative' as const,
  }))
  const chunks = options.uncertainSeam
    ? [
        {
          chunkId: 'chunk-a',
          range: { ...range, endFrameExclusive: 14 },
          overlapRange: { ...range, startFrameInclusive: 10, endFrameExclusive: 14 },
          bucketIndex: 0,
        },
        {
          chunkId: 'chunk-b',
          range: { ...range, startFrameInclusive: 10 },
          bucketIndex: 0,
        },
      ]
    : [{ chunkId: 'chunk-a', range, bucketIndex: 0 }]
  const graph = createTrackGraphV2({
    schemaVersion: 'track_graph_v2',
    modelNeutral: true,
    ...base,
    sourceId: 'qa-source',
    timingHash,
    authorizedRangeHash: hashSkillValue(range),
    shots: [{ shotId: 'shot-a', range, sceneCutResetsIdentity: true }],
    chunks,
    cameraMotionRef: ref('camera_motion_graph_v1', hashSkillValue(cameraMotionGraph)),
    targets: [
      {
        targetId: 'person-target',
        targetType: 'selected_instance',
        semanticClass: 'person',
        includeRules: ['selected person'],
        excludeRules: ['presenter'],
        privacyClass: 'none',
        groundingEvidenceHashes: [hashSkillValue({ target: 'person' })],
        expectedMinimumCount: options.expectedPersonCount ?? 1,
        expectedMaximumCount: options.expectedPersonCount ?? 1,
        ambiguityState: 'none' as const,
      },
      {
        targetId: 'face-target',
        targetType: 'selected_instance',
        semanticClass: 'face',
        includeRules: ['selected face'],
        excludeRules: [],
        privacyClass: 'sensitive_face',
        groundingEvidenceHashes: [hashSkillValue({ target: 'face' })],
        expectedMinimumCount: 1,
        expectedMaximumCount: 1,
        ambiguityState: 'none' as const,
      },
    ],
    tracks: [
      graphTrack('person_001', 'person-target', 'person', boxSequences[0]!, maskSequences[0]!, ['face_001']),
      {
        ...graphTrack('face_001', 'face-target', 'face', boxSequences[1]!, maskSequences[1]!, []),
        parentTrackId: 'person_001',
      },
    ],
    stitchingEvidenceHashes: [hashSkillValue({ stitching: options.uncertainSeam ?? false })],
    cameraNormalizationEvidenceHash: hashSkillValue({ camera: cameraMotionGraph.artifactHash }),
    uncertaintyEventHashes: [],
    objectBudget: {
      expectedObjects: 2,
      maximumObjects: 2,
      bucketSize: 16,
      bucketCount: 1,
      sessionCount: chunks.length,
    },
    runtimeAttemptRefs: [],
    finalQaRefs: [ref('track_all_temporal_qa_report_v1', hashSkillValue({ qa: 'pending' }))],
    privateMaskDataPublished: false,
    outsideAuthorizedRangeModified: false,
  })
  const identityLineage = trackIdentityLineageSchema.parse(addressed({
    schemaVersion: 'track_identity_lineage_v1' as const,
    ...base,
    identities: [
      {
        anonymousTrackId: 'person_001',
        childTrackIds: ['face_001'],
        state: 'active' as const,
        evidenceHashes: [hashSkillValue({ identity: 'person' })],
        crossShotCertain: false as const,
      },
      {
        anonymousTrackId: 'face_001',
        parentTrackId: 'person_001',
        childTrackIds: [],
        state: 'active' as const,
        evidenceHashes: [hashSkillValue({ identity: 'face' })],
        crossShotCertain: false as const,
      },
    ],
  }))
  const targetMeasurements = [
    targetMeasurement('person-target', 'person_001', 'person',
      options.targetAlignment ?? 0.95, options.maximumExcludedSimilarity ?? 0.1),
    targetMeasurement('face-target', 'face_001', 'face', 0.96, 0),
  ]
  const maskMeasurements = (['person_001', 'face_001'] as const).map((trackId) =>
    maskMeasurement(trackId, options.lowMaskTrackId === trackId ? 0.55 : 0.96))
  const seamMeasurements = options.uncertainSeam
    ? [measurement({
        schemaVersion: 'track_all_chunk_seam_measurement_v1' as const,
        evidenceArtifactHash: hashSkillValue({ seam: 'bad' }),
        leftChunkId: 'chunk-a',
        rightChunkId: 'chunk-b',
        trackId: 'person_001',
        frameIndex: 10,
        leftBox: { x: 0.2, y: 0.2, width: 0.25, height: 0.6 },
        rightBox: { x: 0.58, y: 0.2, width: 0.25, height: 0.6 },
        maskIntersectionOverUnion: 0.22,
        producerOperationId: 'tool.opencv.compare_track_all_chunk_overlap.v1' as const,
      })]
    : []
  const identityMeasurements = [measurement({
    schemaVersion: 'track_all_identity_measurement_v1' as const,
    evidenceArtifactHash: hashSkillValue({ identity: 'crossing-measurement' }),
    trackId: 'person_001',
    alternateTrackId: 'face_001',
    frameIndex: 12,
    selectedAssociationScore: options.silentIdentitySwitch ? 0.35 : 0.93,
    alternateAssociationScore: options.silentIdentitySwitch ? 0.9 : 0.25,
    producerOperationId: 'tool.opencv.measure_track_all_identity_association.v1' as const,
  })]
  const integrationEvidence = measurement({
    schemaVersion: 'track_all_integration_measurement_v1' as const,
    evidenceArtifactHash: hashSkillValue({ integration: 'evidence' }),
    assignmentHash,
    planHash,
    sourceSha256,
    timingHash,
    authorizedRangeHash: hashSkillValue(range),
    modifiedFrameIndices: [0, 12, options.outsideModifiedFrame ?? 23],
    exclusiveVisualAssignmentIds: options.ownershipConflict
      ? ['qa-assignment', 'other-primary-assignment']
      : ['qa-assignment'],
    layerOrder: (options.badLayerOrder
      ? ['source', 'captions', 'track_all_treatment', 'peer_visuals']
      : ['source', 'track_all_treatment', 'peer_visuals', 'captions']) as Array<
        'source' | 'track_all_treatment' | 'peer_visuals' | 'captions'
      >,
    outputArtifacts: [{
      artifactHash: hashSkillValue({ output: 'qa' }),
      visibility: options.publicOutput ? 'public' as const : 'private_internal' as const,
    }],
    producerOperationId: 'track_all.inspect_integration_lineage.v1' as const,
  })
  return {
    trackGraph: graph,
    targetMeasurements,
    sampleSequences,
    boxSequences,
    maskSequences,
    maskMeasurements,
    seamMeasurements,
    identityLineage,
    identityMeasurements,
    cameraMotionGraph,
    planarTrackGraphs: [planar],
    integrationEvidence,
  }
}

const passingFixture = makeFixture()
const passing = deriveTrackAllIndependentQa(passingFixture)
assert.deepEqual(
  [passing.target, passing.temporal, passing.mask, passing.chunkSeam, passing.identity, passing.integration]
    .map((value) => value.disposition),
  ['pass', 'pass', 'pass', 'pass', 'pass', 'pass'],
)
assert.equal(passing.target.correctTarget, true)
assert.equal(passing.temporal.missingSpanCount, 0)
assert.equal(passing.temporal.jumpCount, 0)
assert.equal(passing.mask.coverageMinimum, 0.96)
assert.equal(passing.identity.silentIdentitySwitchDetected, false)

assert.throws(() => deriveTrackAllIndependentQa({
  ...passingFixture,
  passed: true,
} as never))
assert.throws(() => deriveTrackAllIndependentQa({
  ...passingFixture,
  targetMeasurements: [{
    ...passingFixture.targetMeasurements[0]!,
    targetAlignment: 0.1,
  }, passingFixture.targetMeasurements[1]!],
}))

const targetFailureFixture = makeFixture({ targetAlignment: 0.4 })
const exclusionFailureFixture = makeFixture({ maximumExcludedSimilarity: 0.8 })
const countFailureFixture = makeFixture({ expectedPersonCount: 3 })
const temporalFailureFixture = makeFixture({ boxJump: true })
const maskFailureFixture = makeFixture({ lowMaskTrackId: 'face_001' })
const nonPrivacyMaskFailureFixture = makeFixture({ lowMaskTrackId: 'person_001' })
const seamFailureFixture = makeFixture({ uncertainSeam: true })
const identityFailureFixture = makeFixture({ silentIdentitySwitch: true })
const planarFailureFixture = makeFixture({ planarError: 4 })
const integrationFailureFixture = makeFixture({
  outsideModifiedFrame: 24,
  publicOutput: true,
  ownershipConflict: true,
  badLayerOrder: true,
})
const targetFailure = deriveTrackAllIndependentQa(targetFailureFixture)
const exclusionFailure = deriveTrackAllIndependentQa(exclusionFailureFixture)
const countFailure = deriveTrackAllIndependentQa(countFailureFixture)
const temporalFailure = deriveTrackAllIndependentQa(temporalFailureFixture)
const maskFailure = deriveTrackAllIndependentQa(maskFailureFixture)
const nonPrivacyMaskFailure = deriveTrackAllIndependentQa(nonPrivacyMaskFailureFixture)
const seamFailure = deriveTrackAllIndependentQa(seamFailureFixture)
const identityFailure = deriveTrackAllIndependentQa(identityFailureFixture)
const planarFailure = deriveTrackAllIndependentQa(planarFailureFixture)
const integrationFailure = deriveTrackAllIndependentQa(integrationFailureFixture)

assert.equal(targetFailure.target.disposition, 'critical')
assert.equal(exclusionFailure.target.exclusionsPreserved, false)
assert.equal(countFailure.target.expectedCountRespected, false)
assert.equal(temporalFailure.temporal.jumpCount, 2)
assert.equal(temporalFailure.temporal.disposition, 'blocking')
assert.equal(maskFailure.mask.disposition, 'critical')
assert.equal(seamFailure.chunkSeam.uncertainSeamCount > 0, true)
assert.equal(identityFailure.identity.silentIdentitySwitchDetected, true)
assert.equal(identityFailure.identity.disposition, 'critical')
assert.equal(planarFailure.integration.disposition, 'blocking')
assert.equal(integrationFailure.integration.outsideAuthorizedRangeModified, true)
assert.equal(integrationFailure.integration.privateOutput, false)
assert.equal(integrationFailure.integration.layerOrderValid, false)
assert.equal(integrationFailure.integration.disposition, 'critical')

const inconsistent = { ...passing.temporal, disposition: 'blocking' as const }
const inconsistentCore = Object.fromEntries(
  Object.entries(inconsistent).filter(([key]) => key !== 'artifactHash'),
)
assert.throws(() => trackAllTemporalQaReportSchema.parse({
  ...inconsistentCore,
  artifactHash: hashSkillValue(inconsistentCore),
}))

const positiveDirective = repair(targetFailureFixture.trackGraph, targetFailure.target, 'person_001')
const negativeDirective = repair(exclusionFailureFixture.trackGraph, exclusionFailure.target, 'person_001')
const boxDirective = repair(countFailureFixture.trackGraph, countFailure.target, 'person_001')
const localDirective = repair(temporalFailureFixture.trackGraph, temporalFailure.temporal, 'person_001')
const privacyDirective = repair(maskFailureFixture.trackGraph, maskFailure.mask, 'face_001')
const nonPrivacyDirective = repair(nonPrivacyMaskFailureFixture.trackGraph, nonPrivacyMaskFailure.mask, 'person_001')
const seamDirective = repair(seamFailureFixture.trackGraph, seamFailure.chunkSeam, 'person_001')
const identityDirective = repair(identityFailureFixture.trackGraph, identityFailure.identity, 'person_001')
const planarDirective = repair(planarFailureFixture.trackGraph, planarFailure.integration, 'person_001')

assert.equal(positiveDirective.directive.action, 'add_positive_point')
assert.equal(negativeDirective.directive.action, 'add_negative_point')
assert.equal(boxDirective.directive.action, 'add_box')
assert.equal(localDirective.directive.action, 'local_segment_retrack')
assert.equal(privacyDirective.directive.action, 'expand_privacy_mask')
assert.equal(nonPrivacyDirective.directive.action, 'add_negative_point')
assert.equal(seamDirective.directive.action, 'increase_overlap')
assert.equal(identityDirective.directive.action, 'reassign_identity')
assert.equal(planarDirective.directive.action, 'recalculate_homography')

const repaired = finalizeTrackAllRepair({
  trackGraph: maskFailureFixture.trackGraph,
  priorEvidence: privacyDirective.priorEvidence,
  directive: privacyDirective.directive,
  postRepairQaReports: [passing.mask],
})
assert.equal(repaired.result, 'accepted_with_conservative_mask')

const secondPrior = priorEvidence(
  maskFailureFixture.trackGraph,
  'face_001',
  1,
  [maskFailure.mask.artifactHash],
  [ref('track_all_repair_receipt_v1', repaired.artifactHash)],
)
assert.throws(() => directTrackAllRepair({
  trackGraph: maskFailureFixture.trackGraph,
  priorEvidence: secondPrior,
  qaReports: [maskFailure.mask],
}))
const manualApprovalRef = ref('approved_user_selection_v1', hashSkillValue({ manual: 2 }))
const secondDirective = directTrackAllRepair({
  trackGraph: maskFailureFixture.trackGraph,
  priorEvidence: secondPrior,
  qaReports: [maskFailure.mask],
  manualApprovalRef,
})
assert.equal(secondDirective.repairIndex, 2)
assert.equal(secondDirective.action, 'request_user_selection')

const thirdPrior = priorEvidence(
  maskFailureFixture.trackGraph,
  'face_001',
  2,
  [maskFailure.mask.artifactHash],
  [
    ref('track_all_repair_receipt_v1', repaired.artifactHash),
    ref('track_all_repair_receipt_v1', hashSkillValue({ repair: 2 })),
  ],
)
assert.throws(() => directTrackAllRepair({
  trackGraph: maskFailureFixture.trackGraph,
  priorEvidence: thirdPrior,
  qaReports: [maskFailure.mask],
  manualApprovalRef,
}))

console.log(JSON.stringify({
  status: 'ok',
  qaBundleHash: passing.qaBundleHash,
  reportHashes: {
    target: passing.target.artifactHash,
    temporal: passing.temporal.artifactHash,
    mask: passing.mask.artifactHash,
    chunkSeam: passing.chunkSeam.artifactHash,
    identity: passing.identity.artifactHash,
    integration: passing.integration.artifactHash,
  },
  derivedQaKinds: 7,
  cameraPlanarFindingDerived: true,
  rawBooleanRejected: true,
  forgedMeasurementRejected: true,
  inconsistentDispositionRejected: true,
  repairActionsProven: [
    'add_positive_point', 'add_negative_point', 'add_box',
    'local_segment_retrack', 'expand_privacy_mask', 'increase_overlap',
    'reassign_identity', 'recalculate_homography', 'request_user_selection',
  ],
  acceptedConservativeRepairHash: repaired.artifactHash,
  secondRepairRequiresManualApproval: true,
  thirdRepairRejected: true,
  outsideAuthorizedRangeModified: false,
  providerRequestCount: 0,
  publicArtifactCount: 0,
  productionMutationCount: 0,
}))

function graphTrack(
  trackId: 'person_001' | 'face_001',
  targetId: string,
  semanticClass: string,
  boxSequence: ReturnType<typeof trackBoxSequenceSchema.parse>,
  maskSequence: ReturnType<typeof trackMaskSequenceSchema.parse>,
  childTrackIds: string[],
) {
  return {
    trackId,
    targetId,
    semanticClass,
    childTrackIds,
    startFrameInclusive: 0,
    endFrameExclusive: 24,
    visibilitySpans: [{ startFrameInclusive: 0, endFrameExclusive: 24, state: 'active' as const }],
    boxSequenceRef: ref('track_box_sequence_v1', hashSkillValue(boxSequence)),
    maskSequenceRef: ref('track_mask_sequence_v1', hashSkillValue(maskSequence)),
    confidenceSequenceHash: hashSkillValue({ trackId, confidence: 'qa' }),
    reentryEventHashes: [],
    identitySwitchWarnings: [],
    depthOrder: trackId === 'face_001' ? 2 : 1,
    qaRefs: [ref('track_all_target_qa_report_v1', hashSkillValue({ trackId, qa: 'pending' }))],
    repairRefs: [],
  }
}

function targetMeasurement(
  targetId: string,
  trackId: string,
  semanticClass: string,
  targetAlignment: number,
  maximumExcludedSimilarity: number,
) {
  return measurement({
    schemaVersion: 'track_all_target_measurement_v1' as const,
    evidenceArtifactHash: hashSkillValue({ targetId, evidence: 'target-inspection' }),
    targetId,
    trackId,
    observedSemanticClass: semanticClass,
    targetAlignment,
    maximumExcludedSimilarity,
    producerOperationId: 'track_all.internal_fixture.inspect_target.v1' as const,
  })
}

function maskMeasurement(trackId: string, subjectCoverage: number) {
  return measurement({
    schemaVersion: 'track_all_mask_measurement_v1' as const,
    evidenceArtifactHash: hashSkillValue({ trackId, evidence: 'mask-measurement' }),
    trackId,
    frameIndex: 12,
    subjectCoverage,
    backgroundLeakage: 0.03,
    temporalFlicker: 0.04,
    edgeError: 0.05,
    holeRatio: 0.01,
    fragmentCount: 1,
    motionBlurScore: 0.7,
    dilationPixels: 6,
    producerOperationId: 'tool.opencv.measure_track_all_mask.v1' as const,
  })
}

function priorEvidence(
  graph: ReturnType<typeof createTrackGraphV2>,
  trackId: string,
  repairCount: number,
  failureEvidenceHashes: string[],
  priorRepairReceiptRefs: ReturnType<typeof ref>[] = [],
) {
  const core = {
    schemaVersion: 'prior_track_repair_evidence_v1' as const,
    ...scope,
    editSessionId: graph.editSessionId,
    assignmentHash: graph.assignmentHash,
    planHash: graph.planHash,
    trackGraphRef: ref('track_graph_v2', graph.graphHash),
    trackId,
    repairCount,
    priorRepairReceiptRefs,
    failureEvidenceHashes,
  }
  return { ...core, evidenceHash: hashSkillValue(core) }
}

function repair(
  graph: ReturnType<typeof createTrackGraphV2>,
  report: Parameters<typeof directTrackAllRepair>[0]['qaReports'][number],
  trackId: string,
) {
  const prior = priorEvidence(graph, trackId, 0, [report.artifactHash])
  return {
    priorEvidence: prior,
    directive: directTrackAllRepair({
      trackGraph: graph,
      priorEvidence: prior,
      qaReports: [report],
    }),
  }
}
