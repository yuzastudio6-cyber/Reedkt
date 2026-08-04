import { z } from 'zod'

import type { EditSkillArtifactReference } from '../../core/edit-skill-artifact-store'
import {
  canonicalSkillJson,
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import { editSkillArtifactReferenceSchema } from '../../core/skill-assignment-schema'
import { createSkillQaFinding } from '../../core/skill-qa-registry'
import {
  trackGraphV2Schema,
  type TrackGraphV2,
} from '../../shared/track-graph/track-graph-schemas'
import {
  cameraMotionGraphSchema,
  planarTrackGraphSchema,
  trackAllChunkSeamQaReportSchema,
  trackAllIdentityQaReportSchema,
  trackAllIntegrationQaReportSchema,
  trackAllMaskQaReportSchema,
  trackAllRepairReceiptSchema,
  trackAllTargetQaReportSchema,
  trackAllTemporalQaReportSchema,
  trackBoxSequenceSchema,
  trackIdentityLineageSchema,
  trackMaskSequenceSchema,
  trackSampleSequenceSchema,
} from '../track-all-active-artifact-contracts'
import { priorTrackRepairEvidenceSchema } from '../track-all-schemas'

const safeId = z.string().trim().min(1).max(180)
const unit = z.number().min(0).max(1)
const normalizedBox = z.object({
  x: unit,
  y: unit,
  width: z.number().gt(0).max(1),
  height: z.number().gt(0).max(1),
}).strict().superRefine((value, context) => {
  if (value.x + value.width > 1 || value.y + value.height > 1) {
    context.addIssue({ code: 'custom', message: 'QA measurement box exceeds the source frame.' })
  }
})

function measured<T extends z.ZodRawShape>(schemaVersion: string, fields: T) {
  const core = z.object({
    schemaVersion: z.literal(schemaVersion),
    evidenceArtifactHash: skillSha256Schema,
    ...fields,
  }).strict()
  return core.extend({ measurementHash: skillSha256Schema }).strict()
    .superRefine((value, context) => {
      const record = value as Readonly<Record<string, unknown>>
      const measurementHash = record.measurementHash
      const content = Object.fromEntries(
        Object.entries(record).filter(([key]) => key !== 'measurementHash'),
      )
      if (hashSkillValue(content) !== measurementHash) {
        context.addIssue({ code: 'custom', message: 'Track All QA measurement hash is stale or forged.' })
      }
    })
}

const targetMeasurementSchema = measured('track_all_target_measurement_v1', {
  targetId: safeId,
  trackId: safeId,
  observedSemanticClass: safeId,
  targetAlignment: unit,
  maximumExcludedSimilarity: unit,
  producerOperationId: z.enum([
    'visual_intelligence.inspect_track_all_target.v1',
    'track_all.internal_fixture.inspect_target.v1',
  ]),
})

const maskMeasurementSchema = measured('track_all_mask_measurement_v1', {
  trackId: safeId,
  frameIndex: z.number().int().nonnegative(),
  subjectCoverage: unit,
  backgroundLeakage: unit,
  temporalFlicker: unit,
  edgeError: unit,
  holeRatio: unit,
  fragmentCount: z.number().int().nonnegative().max(10_000),
  motionBlurScore: unit,
  dilationPixels: z.number().int().nonnegative().max(256),
  producerOperationId: z.literal('tool.opencv.measure_track_all_mask.v1'),
})

const seamMeasurementSchema = measured('track_all_chunk_seam_measurement_v1', {
  leftChunkId: safeId,
  rightChunkId: safeId,
  trackId: safeId,
  frameIndex: z.number().int().nonnegative(),
  leftBox: normalizedBox,
  rightBox: normalizedBox,
  maskIntersectionOverUnion: unit,
  producerOperationId: z.literal('tool.opencv.compare_track_all_chunk_overlap.v1'),
})

const identityMeasurementSchema = measured('track_all_identity_measurement_v1', {
  trackId: safeId,
  alternateTrackId: safeId,
  frameIndex: z.number().int().nonnegative(),
  selectedAssociationScore: unit,
  alternateAssociationScore: unit,
  producerOperationId: z.literal('tool.opencv.measure_track_all_identity_association.v1'),
})

const integrationEvidenceSchema = measured('track_all_integration_measurement_v1', {
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  sourceSha256: skillSha256Schema,
  timingHash: skillSha256Schema,
  authorizedRangeHash: skillSha256Schema,
  modifiedFrameIndices: z.array(z.number().int().nonnegative()).max(100_000),
  exclusiveVisualAssignmentIds: z.array(safeId).min(1).max(100),
  layerOrder: z.array(z.enum([
    'source', 'track_all_treatment', 'peer_visuals', 'captions',
  ])).min(1).max(4),
  outputArtifacts: z.array(z.object({
    artifactHash: skillSha256Schema,
    visibility: z.enum(['private_internal', 'public']),
  }).strict()).min(1).max(1_000),
  producerOperationId: z.literal('track_all.inspect_integration_lineage.v1'),
})

const qaInputSchema = z.object({
  trackGraph: trackGraphV2Schema,
  targetMeasurements: z.array(targetMeasurementSchema).max(10_000),
  sampleSequences: z.array(trackSampleSequenceSchema).max(10_000),
  boxSequences: z.array(trackBoxSequenceSchema).max(10_000),
  maskSequences: z.array(trackMaskSequenceSchema).max(10_000),
  maskMeasurements: z.array(maskMeasurementSchema).max(100_000),
  seamMeasurements: z.array(seamMeasurementSchema).max(100_000),
  identityLineage: trackIdentityLineageSchema,
  identityMeasurements: z.array(identityMeasurementSchema).max(100_000),
  cameraMotionGraph: cameraMotionGraphSchema.optional(),
  planarTrackGraphs: z.array(planarTrackGraphSchema).max(10_000),
  integrationEvidence: integrationEvidenceSchema,
}).strict()

type QaInput = z.infer<typeof qaInputSchema>
type QaDisposition = 'pass' | 'warning' | 'needs_review' | 'blocking' | 'critical'
type QaReport =
  | z.infer<typeof trackAllTargetQaReportSchema>
  | z.infer<typeof trackAllTemporalQaReportSchema>
  | z.infer<typeof trackAllMaskQaReportSchema>
  | z.infer<typeof trackAllChunkSeamQaReportSchema>
  | z.infer<typeof trackAllIdentityQaReportSchema>
  | z.infer<typeof trackAllIntegrationQaReportSchema>

export interface TrackAllIndependentQaBundle {
  target: z.infer<typeof trackAllTargetQaReportSchema>
  temporal: z.infer<typeof trackAllTemporalQaReportSchema>
  mask: z.infer<typeof trackAllMaskQaReportSchema>
  chunkSeam: z.infer<typeof trackAllChunkSeamQaReportSchema>
  identity: z.infer<typeof trackAllIdentityQaReportSchema>
  integration: z.infer<typeof trackAllIntegrationQaReportSchema>
  qaBundleHash: string
}

export function deriveTrackAllIndependentQa(
  input: z.input<typeof qaInputSchema>,
): TrackAllIndependentQaBundle {
  const parsed = qaInputSchema.parse(input)
  assertExactQaLineage(parsed)
  const target = deriveTargetQa(parsed)
  const temporal = deriveTemporalQa(parsed)
  const mask = deriveMaskQa(parsed)
  const chunkSeam = deriveChunkSeamQa(parsed)
  const identity = deriveIdentityQa(parsed)
  const integration = deriveIntegrationQa(parsed)
  const qaBundleHash = hashSkillValue({
    trackGraphHash: parsed.trackGraph.graphHash,
    reportHashes: [
      target.artifactHash,
      temporal.artifactHash,
      mask.artifactHash,
      chunkSeam.artifactHash,
      identity.artifactHash,
      integration.artifactHash,
    ],
  })
  return deepFreezeSkillValue({
    target,
    temporal,
    mask,
    chunkSeam,
    identity,
    integration,
    qaBundleHash,
  })
}

function deriveTargetQa(input: QaInput): TrackAllIndependentQaBundle['target'] {
  const graph = input.trackGraph
  const byTrack = new Map(input.targetMeasurements.map((value) => [value.trackId, value]))
  const exactObservations =
    byTrack.size === input.targetMeasurements.length &&
    input.targetMeasurements.every((value) =>
      graph.tracks.some((track) => track.trackId === value.trackId && track.targetId === value.targetId))
  const correctTarget = exactObservations && graph.tracks.every((track) => {
    const value = byTrack.get(track.trackId)
    return value?.observedSemanticClass === track.semanticClass && value.targetAlignment >= 0.82
  })
  const exclusionsPreserved = graph.tracks.every((track) => {
    const target = graph.targets.find((value) => value.targetId === track.targetId)!
    const measurement = byTrack.get(track.trackId)
    return target.excludeRules.length === 0 || (measurement?.maximumExcludedSimilarity ?? 1) <= 0.35
  })
  const expectedCountRespected = graph.targets.every((target) => {
    const count = graph.tracks.filter((track) => track.targetId === target.targetId).length
    return count >= target.expectedMinimumCount && count <= target.expectedMaximumCount
  })
  const findings = [
    finding(
      'track_all.qa.target',
      correctTarget ? 'pass' : 'critical',
      correctTarget ? 'Every anonymous track matches its exact grounded target.' :
        'At least one anonymous track lacks exact independently measured target alignment.',
      input.targetMeasurements.map((value) => value.measurementHash),
      { trackCount: graph.tracks.length, exactObservations, minimumAlignment: minimum(input.targetMeasurements.map((value) => value.targetAlignment)) },
    ),
    finding(
      'track_all.qa.target',
      exclusionsPreserved ? 'pass' : 'blocking',
      exclusionsPreserved ? 'Target exclusions remain below the similarity ceiling.' :
        'A forbidden or excluded target remains too similar to an accepted track.',
      targetEvidence(input),
      { maximumExcludedSimilarity: maximum(input.targetMeasurements.map((value) => value.maximumExcludedSimilarity)) },
    ),
    finding(
      'track_all.qa.target',
      expectedCountRespected ? 'pass' : 'blocking',
      expectedCountRespected ? 'Every target count is within its approved range.' :
        'At least one target count is outside its approved range.',
      [graph.graphHash],
      { targetCount: graph.targets.length, trackCount: graph.tracks.length },
    ),
  ]
  return report(trackAllTargetQaReportSchema, input, findings, {
    schemaVersion: 'track_all_target_qa_report_v1' as const,
    correctTarget,
    exclusionsPreserved,
    expectedCountRespected,
  })
}

function deriveTemporalQa(input: QaInput): TrackAllIndependentQaBundle['temporal'] {
  const boxes = new Map(input.boxSequences.map((value) => [value.trackId, value]))
  let missingSpanCount = 0
  let jumpCount = 0
  for (const track of input.trackGraph.tracks) {
    const sequence = boxes.get(track.trackId)!
    const byFrame = new Set(sequence.boxes.map((value) => value.frameIndex))
    for (const span of track.visibilitySpans) {
      if (!['active', 'partially_occluded', 'reacquired'].includes(span.state)) continue
      for (let frame = span.startFrameInclusive; frame < span.endFrameExclusive; frame += 1) {
        if (!byFrame.has(frame)) missingSpanCount += 1
      }
    }
    for (let index = 1; index < sequence.boxes.length; index += 1) {
      const previous = sequence.boxes[index - 1]!
      const current = sequence.boxes[index]!
      if (current.frameIndex === previous.frameIndex + 1 &&
        centerDistance(previous.box, current.box) > 0.25) jumpCount += 1
    }
  }
  const shotResetsValid = input.trackGraph.shots.slice(1).every((shot) =>
    input.trackGraph.tracks.every((track) => {
      const crosses = track.startFrameInclusive < shot.range.startFrameInclusive &&
        track.endFrameExclusive > shot.range.startFrameInclusive
      return !crosses || track.identitySwitchWarnings.some((warning) =>
        warning.frameIndex === shot.range.startFrameInclusive) ||
        track.visibilitySpans.some((span) =>
          span.state === 'identity_uncertain' &&
          span.startFrameInclusive <= shot.range.startFrameInclusive &&
          span.endFrameExclusive > shot.range.startFrameInclusive)
    }))
  const passed = missingSpanCount === 0 && jumpCount === 0 && shotResetsValid
  const findings = [finding(
    'track_all.qa.temporal',
    passed ? 'pass' : shotResetsValid ? 'blocking' : 'critical',
    passed ? 'Track geometry is temporally continuous and every scene cut resets or marks identity.' :
      'Temporal gaps, jumps, or an unqualified cross-shot identity were independently detected.',
    unique([
      ...input.sampleSequences.map((value) => value.artifactHash),
      ...input.boxSequences.map((value) => value.artifactHash),
      input.trackGraph.graphHash,
    ]),
    { missingSpanCount, jumpCount, shotResetsValid },
  )]
  return report(trackAllTemporalQaReportSchema, input, findings, {
    schemaVersion: 'track_all_temporal_qa_report_v1' as const,
    missingSpanCount,
    jumpCount,
    shotResetsValid,
  })
}

function deriveMaskQa(input: QaInput): TrackAllIndependentQaBundle['mask'] {
  const requiredTracks = input.trackGraph.tracks.filter((track) => track.maskSequenceRef)
    .map((track) => track.trackId)
  const measuredTracks = new Set(input.maskMeasurements.map((value) => value.trackId))
  const complete = requiredTracks.every((trackId) => measuredTracks.has(trackId))
  const coverageMinimum = minimum(input.maskMeasurements.map((value) => value.subjectCoverage))
  const leakageMaximum = maximum(input.maskMeasurements.map((value) => value.backgroundLeakage))
  const flickerMaximum = maximum(input.maskMeasurements.map((value) => value.temporalFlicker))
  const edgeMaximum = maximum(input.maskMeasurements.map((value) => value.edgeError))
  const holeMaximum = maximum(input.maskMeasurements.map((value) => value.holeRatio))
  const fragmentMaximum = maximum(input.maskMeasurements.map((value) => value.fragmentCount))
  const motionBlurCovered = input.maskMeasurements.every((value) =>
    value.motionBlurScore < 0.6 || value.dilationPixels >= 4)
  const passed = complete && coverageMinimum >= 0.9 && leakageMaximum <= 0.08 &&
    flickerMaximum <= 0.12 && edgeMaximum <= 0.12 && holeMaximum <= 0.05 &&
    fragmentMaximum <= 4 && motionBlurCovered
  const findings = [finding(
    'track_all.qa.mask',
    passed ? 'pass' : requiredTracks.some((id) => privacyTrack(input.trackGraph, id))
      ? 'critical'
      : 'blocking',
    passed ? 'Measured masks satisfy coverage, leakage, edge, hole, fragment, blur, and temporal ceilings.' :
      'At least one measured mask fails the approved quality or privacy-preserving ceiling.',
    unique([
      ...input.maskSequences.map((value) => value.artifactHash),
      ...input.maskMeasurements.map((value) => value.measurementHash),
    ]),
    { complete, coverageMinimum, leakageMaximum, flickerMaximum, edgeMaximum, holeMaximum, fragmentMaximum, motionBlurCovered },
  )]
  return report(trackAllMaskQaReportSchema, input, findings, {
    schemaVersion: 'track_all_mask_qa_report_v1' as const,
    coverageMinimum,
    leakageMaximum,
    flickerMaximum,
    motionBlurCovered,
  })
}

function deriveChunkSeamQa(input: QaInput): TrackAllIndependentQaBundle['chunkSeam'] {
  const requiredOverlapFrames = new Set(input.trackGraph.chunks.flatMap((chunk) => {
    if (!chunk.overlapRange) return []
    return Array.from(
      { length: chunk.overlapRange.endFrameExclusive - chunk.overlapRange.startFrameInclusive },
      (_, index) => chunk.overlapRange!.startFrameInclusive + index,
    )
  }))
  const measuredFrames = new Set(input.seamMeasurements.map((value) => value.frameIndex))
  const overlapComplete = [...requiredOverlapFrames].every((frame) => measuredFrames.has(frame))
  const errors = input.seamMeasurements.map((value) => Math.max(
    1 - boxIntersectionOverUnion(value.leftBox, value.rightBox),
    1 - value.maskIntersectionOverUnion,
    centerDistance(value.leftBox, value.rightBox),
  ))
  const maximumSeamError = maximum(errors)
  const uncertainSeamCount = errors.filter((error) => error > 0.25).length +
    (overlapComplete ? 0 : 1)
  const passed = overlapComplete && uncertainSeamCount === 0
  const findings = [finding(
    'track_all.qa.chunk_seam',
    passed ? 'pass' : 'blocking',
    passed ? 'Chunk overlap geometry agrees within the approved seam ceiling.' :
      'A missing or uncertain chunk-overlap seam requires repair.',
    unique(input.seamMeasurements.length > 0
      ? input.seamMeasurements.map((value) => value.measurementHash)
      : [input.trackGraph.graphHash]),
    { requiredOverlapFrameCount: requiredOverlapFrames.size, overlapComplete, maximumSeamError, uncertainSeamCount },
  )]
  return report(trackAllChunkSeamQaReportSchema, input, findings, {
    schemaVersion: 'track_all_chunk_seam_qa_report_v1' as const,
    seamCount: input.seamMeasurements.length,
    uncertainSeamCount,
    maximumSeamError,
  })
}

function deriveIdentityQa(input: QaInput): TrackAllIndependentQaBundle['identity'] {
  const warningFrames = new Set(input.trackGraph.tracks.flatMap((track) =>
    track.identitySwitchWarnings.map((warning) => `${track.trackId}:${warning.frameIndex}`)))
  const silent = input.identityMeasurements.filter((value) =>
    value.alternateAssociationScore >= value.selectedAssociationScore + 0.08 &&
    !warningFrames.has(`${value.trackId}:${value.frameIndex}`))
  const identities = input.identityLineage.identities
  const exactLineage = input.trackGraph.tracks.every((track) =>
    identities.some((identity) => identity.anonymousTrackId === track.trackId))
  const uncertainIdentityCount = identities.filter((identity) =>
    ['identity_uncertain', 'reacquisition_candidate'].includes(identity.state)).length +
    input.trackGraph.tracks.reduce((count, track) =>
      count + track.identitySwitchWarnings.length, 0)
  const shotResetCount = identities.filter((identity) =>
    identity.state === 'terminated_at_shot_boundary').length
  const passed = silent.length === 0 && exactLineage
  const findings = [finding(
    'track_all.qa.identity',
    passed ? uncertainIdentityCount > 0 ? 'warning' : 'pass' : 'critical',
    passed ? uncertainIdentityCount > 0
      ? 'Identity uncertainty is explicit and no silent switch was measured.'
      : 'Anonymous identity lineage is exact and no silent switch was measured.'
      : 'A likely identity switch is missing explicit uncertainty evidence.',
    unique([
      input.identityLineage.artifactHash,
      ...input.identityMeasurements.map((value) => value.measurementHash),
    ]),
    { exactLineage, silentSwitchCount: silent.length, uncertainIdentityCount, shotResetCount },
  )]
  return report(trackAllIdentityQaReportSchema, input, findings, {
    schemaVersion: 'track_all_identity_qa_report_v1' as const,
    silentIdentitySwitchDetected: silent.length > 0,
    uncertainIdentityCount,
    shotResetCount,
  })
}

function deriveIntegrationQa(input: QaInput): TrackAllIndependentQaBundle['integration'] {
  const graph = input.trackGraph
  const evidence = input.integrationEvidence
  const sourceAndTimingExact =
    evidence.assignmentHash === graph.assignmentHash &&
    evidence.planHash === graph.planHash &&
    evidence.sourceSha256 === graph.sourceSha256 &&
    evidence.timingHash === graph.timingHash &&
    evidence.authorizedRangeHash === graph.authorizedRangeHash
  const outsideAuthorizedRangeModified = evidence.modifiedFrameIndices.some((frame) =>
    frame < graph.authorizedRange.startFrameInclusive ||
    frame >= graph.authorizedRange.endFrameExclusive)
  const ownershipExact = evidence.exclusiveVisualAssignmentIds.length === 1 &&
    evidence.exclusiveVisualAssignmentIds[0] === graph.assignmentId
  const privateOutput = evidence.outputArtifacts.every((value) =>
    value.visibility === 'private_internal')
  const layerOrderValid = canonicalSkillJson(evidence.layerOrder) === canonicalSkillJson([
    'source', 'track_all_treatment', 'peer_visuals', 'captions',
  ])
  const cameraPlanarPassed = deriveCameraPlanarDisposition(input)
  const findings = [
    finding('track_all.qa.camera_planar', cameraPlanarPassed ? 'pass' : 'blocking',
      cameraPlanarPassed ? 'Camera and planar geometry remain stable within approved deterministic thresholds.' :
        'Camera or planar geometry exceeds its deterministic confidence or reprojection threshold.',
      cameraPlanarEvidence(input), cameraPlanarObservations(input)),
    finding('track_all.qa.exact_authorized_range', outsideAuthorizedRangeModified ? 'critical' : 'pass',
      outsideAuthorizedRangeModified ? 'An integration output modifies a frame outside authority.' :
        'Every modified frame remains inside the exact authorized range.',
      [evidence.measurementHash], { modifiedFrameCount: evidence.modifiedFrameIndices.length }),
    finding('track_all.qa.outside_range_unchanged', outsideAuthorizedRangeModified ? 'critical' : 'pass',
      outsideAuthorizedRangeModified ? 'Outside-range preservation failed.' : 'Outside-range frames remain unchanged.',
      [evidence.measurementHash], { outsideAuthorizedRangeModified }),
    finding('track_all.qa.exact_source_timing', sourceAndTimingExact ? 'pass' : 'critical',
      sourceAndTimingExact ? 'Source, assignment, plan, timing, and range hashes are exact.' :
        'Integration source, assignment, plan, timing, or range lineage differs.',
      [evidence.measurementHash, graph.graphHash], { sourceAndTimingExact }),
    finding('track_all.qa.visual_ownership', ownershipExact ? 'pass' : 'blocking',
      ownershipExact ? 'The exact Track All assignment owns the visible range.' :
        'The integration evidence contains a primary-visual ownership conflict.',
      [evidence.measurementHash], { exclusiveVisualAssignmentIds: evidence.exclusiveVisualAssignmentIds }),
    finding('track_all.qa.safe_zones_layer_order', layerOrderValid ? 'pass' : 'blocking',
      layerOrderValid ? 'The fixed layer order keeps captions above Track All treatments.' :
        'The integration layer order is not approved.',
      [evidence.measurementHash], { layerOrder: evidence.layerOrder }),
    finding('track_all.qa.private_output', privateOutput ? 'pass' : 'critical',
      privateOutput ? 'Every integration artifact remains private-internal.' :
        'A Track All integration artifact is public.',
      [evidence.measurementHash], { outputCount: evidence.outputArtifacts.length, privateOutput }),
    finding('track_all.qa.final_lineage', sourceAndTimingExact ? 'pass' : 'critical',
      sourceAndTimingExact ? 'Final lineage binds the exact graph, plan, assignment, source, and timing.' :
        'Final integration lineage is stale or forged.',
      [evidence.measurementHash, graph.graphHash], { graphHash: graph.graphHash }),
  ]
  return report(trackAllIntegrationQaReportSchema, input, findings, {
    schemaVersion: 'track_all_integration_qa_report_v1' as const,
    outsideAuthorizedRangeModified,
    sourceAndTimingExact,
    privateOutput,
    publicUrlPresent: !privateOutput,
    layerOrderValid,
  })
}

function report<S extends z.ZodTypeAny, F extends Record<string, unknown>>(
  schema: S,
  input: QaInput,
  findings: ReturnType<typeof createSkillQaFinding>[],
  fields: F,
): z.infer<S> {
  const graph = input.trackGraph
  const core = {
    ...fields,
    ownerUserId: graph.ownerUserId,
    workspaceId: graph.workspaceId,
    projectId: graph.projectId,
    editSessionId: graph.editSessionId,
    assignmentId: graph.assignmentId,
    assignmentHash: graph.assignmentHash,
    planHash: graph.planHash,
    manifestRef: graph.manifestRef,
    sourceSha256: graph.sourceSha256,
    authorizedRange: graph.authorizedRange,
    findings,
    disposition: aggregateDisposition(findings),
  }
  return schema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

function assertExactQaLineage(input: QaInput): void {
  const graph = input.trackGraph
  const artifacts = [
    ...input.sampleSequences,
    ...input.boxSequences,
    ...input.maskSequences,
    input.identityLineage,
    ...input.planarTrackGraphs,
    ...(input.cameraMotionGraph ? [input.cameraMotionGraph] : []),
  ]
  if (artifacts.some((artifact) =>
    artifact.ownerUserId !== graph.ownerUserId ||
    artifact.workspaceId !== graph.workspaceId ||
    artifact.projectId !== graph.projectId ||
    artifact.editSessionId !== graph.editSessionId ||
    artifact.assignmentId !== graph.assignmentId ||
    artifact.assignmentHash !== graph.assignmentHash ||
    artifact.planHash !== graph.planHash ||
    artifact.sourceSha256 !== graph.sourceSha256 ||
    canonicalSkillJson(artifact.authorizedRange) !== canonicalSkillJson(graph.authorizedRange))) {
    throw new Error('Track All QA artifact lineage differs from the exact Track Graph.')
  }
  uniqueBy(input.sampleSequences, (value) => value.trackId, 'sample sequence')
  uniqueBy(input.boxSequences, (value) => value.trackId, 'box sequence')
  uniqueBy(input.maskSequences, (value) => value.trackId, 'mask sequence')
  const samples = new Map(input.sampleSequences.map((value) => [value.trackId, value]))
  const boxes = new Map(input.boxSequences.map((value) => [value.trackId, value]))
  const masks = new Map(input.maskSequences.map((value) => [value.trackId, value]))
  for (const track of graph.tracks) {
    if (!samples.has(track.trackId) || boxes.get(track.trackId)?.artifactHash !== track.boxSequenceRef.sha256) {
      throw new Error(`Track All QA lacks exact samples or boxes for ${track.trackId}.`)
    }
    if (track.maskSequenceRef && masks.get(track.trackId)?.artifactHash !== track.maskSequenceRef.sha256) {
      throw new Error(`Track All QA lacks the exact private mask manifest for ${track.trackId}.`)
    }
  }
  const measurementFrames = [
    ...input.maskMeasurements,
    ...input.seamMeasurements,
    ...input.identityMeasurements,
  ].map((value) => value.frameIndex)
  if (measurementFrames.some((frame) =>
    frame < graph.authorizedRange.startFrameInclusive ||
    frame >= graph.authorizedRange.endFrameExclusive)) {
    throw new Error('Track All QA measurement exceeds the authorized range.')
  }
  const graphTrackIds = new Set(graph.tracks.map((track) => track.trackId))
  if ([
    ...input.targetMeasurements.map((value) => value.trackId),
    ...input.maskMeasurements.map((value) => value.trackId),
    ...input.seamMeasurements.map((value) => value.trackId),
    ...input.identityMeasurements.flatMap((value) => [value.trackId, value.alternateTrackId]),
  ].some((trackId) => !graphTrackIds.has(trackId))) {
    throw new Error('Track All QA measurement references an unknown anonymous track.')
  }
}

const repairDirectiveCoreSchema = z.object({
  schemaVersion: z.literal('track_all_repair_directive_v1'),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  trackGraphHash: skillSha256Schema,
  repairIndex: z.number().int().min(1).max(2),
  action: z.enum([
    'add_positive_point', 'add_negative_point', 'add_box',
    'change_initialization_frame', 'split_target', 'merge_track',
    'reassign_identity', 'expand_privacy_mask', 'local_segment_retrack',
    'reacquire_after_occlusion', 'increase_overlap', 'recalculate_homography',
    'request_manual_keyframe', 'request_user_selection',
  ]),
  repairedRange: z.object({
    startFrameInclusive: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
    fps: z.number().int().positive(),
  }).strict(),
  triggeringReportHashes: z.array(skillSha256Schema).min(1).max(20),
  manualApprovalRef: editSkillArtifactReferenceSchema.optional(),
}).strict()

const repairDirectiveSchema = repairDirectiveCoreSchema.extend({
  directiveHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { directiveHash, ...core } = value
  if (hashSkillValue(core) !== directiveHash) {
    context.addIssue({ code: 'custom', message: 'Track All repair directive hash is stale or forged.' })
  }
  if ((value.repairIndex === 2) !== Boolean(value.manualApprovalRef)) {
    context.addIssue({ code: 'custom', message: 'The second repair requires exact manual approval.' })
  }
})

export type TrackAllRepairDirective = z.infer<typeof repairDirectiveSchema>

export function directTrackAllRepair(input: {
  trackGraph: TrackGraphV2
  priorEvidence: z.input<typeof priorTrackRepairEvidenceSchema>
  qaReports: readonly QaReport[]
  manualApprovalRef?: EditSkillArtifactReference
}): TrackAllRepairDirective {
  const graph = trackGraphV2Schema.parse(input.trackGraph)
  const prior = priorTrackRepairEvidenceSchema.parse(input.priorEvidence)
  const reports = input.qaReports.map(parseQaReport)
  if (prior.repairCount >= 2) throw new Error('Track All repair ceiling reached; a third repair is impossible.')
  if (
    prior.assignmentHash !== graph.assignmentHash ||
    prior.planHash !== graph.planHash ||
    prior.trackGraphRef.artifactType !== 'track_graph_v2' ||
    prior.trackGraphRef.sha256 !== graph.graphHash ||
    prior.ownerUserId !== graph.ownerUserId ||
    prior.workspaceId !== graph.workspaceId ||
    prior.projectId !== graph.projectId ||
    prior.editSessionId !== graph.editSessionId ||
    !graph.tracks.some((track) => track.trackId === prior.trackId) ||
    prior.priorRepairReceiptRefs.length !== prior.repairCount ||
    prior.priorRepairReceiptRefs.some((ref) =>
      ref.artifactType !== 'track_all_repair_receipt_v1' ||
      ref.ownerUserId !== graph.ownerUserId || ref.workspaceId !== graph.workspaceId ||
      ref.projectId !== graph.projectId) ||
    new Set(prior.failureEvidenceHashes).size !== prior.failureEvidenceHashes.length
  ) throw new Error('Track All repair evidence does not match the exact Track Graph.')
  if (reports.some((value) =>
    value.assignmentHash !== graph.assignmentHash || value.planHash !== graph.planHash ||
    value.sourceSha256 !== graph.sourceSha256 ||
    canonicalSkillJson(value.authorizedRange) !== canonicalSkillJson(graph.authorizedRange))) {
    throw new Error('Track All repair QA lineage differs from the Track Graph.')
  }
  const failed = reports.filter((value) =>
    ['needs_review', 'blocking', 'critical'].includes(value.disposition))
  if (failed.length === 0) throw new Error('Track All cannot repair a graph whose supplied QA already passes.')
  if (failed.some((value) => !prior.failureEvidenceHashes.includes(value.artifactHash))) {
    throw new Error('Track All repair authority does not include the exact failed QA evidence.')
  }
  const repairIndex = prior.repairCount + 1
  if (repairIndex === 2) {
    const approval = input.manualApprovalRef
    if (!approval || approval.artifactType !== 'approved_user_selection_v1' ||
      approval.ownerUserId !== graph.ownerUserId ||
      approval.workspaceId !== graph.workspaceId || approval.projectId !== graph.projectId) {
      throw new Error('The second Track All repair requires exact same-tenant manual approval.')
    }
  } else if (input.manualApprovalRef) {
    throw new Error('An automatic first repair cannot consume caller-supplied manual authority.')
  }
  const action = selectRepairAction(failed, graph, prior.trackId, repairIndex)
  const core = {
    schemaVersion: 'track_all_repair_directive_v1' as const,
    assignmentHash: graph.assignmentHash,
    planHash: graph.planHash,
    trackGraphHash: graph.graphHash,
    repairIndex,
    action,
    repairedRange: graph.authorizedRange,
    triggeringReportHashes: unique(failed.map((value) => value.artifactHash)),
    ...(input.manualApprovalRef ? { manualApprovalRef: input.manualApprovalRef } : {}),
  }
  return repairDirectiveSchema.parse({ ...core, directiveHash: hashSkillValue(core) })
}

export function finalizeTrackAllRepair(input: {
  trackGraph: TrackGraphV2
  priorEvidence: z.input<typeof priorTrackRepairEvidenceSchema>
  directive: TrackAllRepairDirective
  postRepairQaReports: readonly QaReport[]
}): z.infer<typeof trackAllRepairReceiptSchema> {
  const graph = trackGraphV2Schema.parse(input.trackGraph)
  const prior = priorTrackRepairEvidenceSchema.parse(input.priorEvidence)
  const directive = repairDirectiveSchema.parse(input.directive)
  const reports = input.postRepairQaReports.map(parseQaReport)
  if (
    directive.trackGraphHash !== graph.graphHash ||
    directive.repairIndex !== prior.repairCount + 1 ||
    canonicalSkillJson(directive.repairedRange) !== canonicalSkillJson(graph.authorizedRange) ||
    reports.some((value) => value.assignmentHash !== graph.assignmentHash ||
      value.planHash !== graph.planHash || value.sourceSha256 !== graph.sourceSha256)
  ) throw new Error('Track All repair finalization lineage is stale or forged.')
  const accepted = reports.every((value) => ['pass', 'warning'].includes(value.disposition))
  const result = accepted
    ? directive.action === 'expand_privacy_mask'
      ? 'accepted_with_conservative_mask' as const
      : 'accepted' as const
    : directive.repairIndex === 1
      ? 'needs_refinement' as const
      : directive.action === 'request_user_selection'
        ? 'needs_user_selection' as const
        : 'blocked' as const
  const priorTrackGraphRef = referenceFor('track_graph_v2', graph.graphHash, graph)
  const core = {
    schemaVersion: 'track_all_repair_receipt_v1' as const,
    ownerUserId: graph.ownerUserId,
    workspaceId: graph.workspaceId,
    projectId: graph.projectId,
    editSessionId: graph.editSessionId,
    assignmentId: graph.assignmentId,
    assignmentHash: graph.assignmentHash,
    planHash: graph.planHash,
    manifestRef: graph.manifestRef,
    sourceSha256: graph.sourceSha256,
    authorizedRange: graph.authorizedRange,
    priorTrackGraphRef,
    repairIndex: directive.repairIndex,
    action: directive.action,
    repairedRange: directive.repairedRange,
    evidenceHashes: unique([
      directive.directiveHash,
      prior.evidenceHash,
      ...reports.map((value) => value.artifactHash),
    ]),
    result,
  }
  return trackAllRepairReceiptSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

function parseQaReport(value: QaReport): QaReport {
  const schemas = [
    trackAllTargetQaReportSchema,
    trackAllTemporalQaReportSchema,
    trackAllMaskQaReportSchema,
    trackAllChunkSeamQaReportSchema,
    trackAllIdentityQaReportSchema,
    trackAllIntegrationQaReportSchema,
  ]
  for (const schema of schemas) {
    const parsed = schema.safeParse(value)
    if (parsed.success) return parsed.data as QaReport
  }
  throw new Error('Unknown or forged Track All QA report supplied to repair.')
}

function selectRepairAction(
  reports: readonly QaReport[],
  graph: TrackGraphV2,
  trackId: string,
  repairIndex: number,
): TrackAllRepairDirective['action'] {
  if (repairIndex === 2) return 'request_user_selection'
  const schemaVersions = new Set(reports.map((value) => value.schemaVersion))
  const target = reports.find((value) =>
    value.schemaVersion === 'track_all_target_qa_report_v1')
  if (target?.schemaVersion === 'track_all_target_qa_report_v1') {
    if (!target.exclusionsPreserved) return 'add_negative_point'
    if (!target.expectedCountRespected) return 'add_box'
    return 'add_positive_point'
  }
  if (schemaVersions.has('track_all_identity_qa_report_v1')) return 'reassign_identity'
  if (schemaVersions.has('track_all_chunk_seam_qa_report_v1')) return 'increase_overlap'
  if (schemaVersions.has('track_all_temporal_qa_report_v1')) return 'local_segment_retrack'
  if (schemaVersions.has('track_all_mask_qa_report_v1')) {
    return privacyTrack(graph, trackId) ? 'expand_privacy_mask' : 'add_negative_point'
  }
  return 'recalculate_homography'
}

function finding(
  qaKey: string,
  disposition: QaDisposition,
  summary: string,
  evidenceHashes: readonly string[],
  observations: Readonly<Record<string, unknown>>,
) {
  return createSkillQaFinding({
    qaKey,
    validatorVersion: `${qaKey}.derived_validator.v1`,
    disposition,
    summary,
    evidenceHashes: unique(evidenceHashes.length > 0 ? evidenceHashes : [hashSkillValue({ qaKey })]),
    observations,
  })
}

function aggregateDisposition(
  findings: readonly ReturnType<typeof createSkillQaFinding>[],
): QaDisposition {
  const order: QaDisposition[] = ['pass', 'warning', 'needs_review', 'blocking', 'critical']
  return findings.reduce<QaDisposition>((current, value) =>
    order.indexOf(value.disposition) > order.indexOf(current) ? value.disposition : current,
  'pass')
}

function targetEvidence(input: QaInput): string[] {
  return unique(input.targetMeasurements.length > 0
    ? input.targetMeasurements.map((value) => value.measurementHash)
    : [input.trackGraph.graphHash])
}

function deriveCameraPlanarDisposition(input: QaInput): boolean {
  const cameraPassed = !input.cameraMotionGraph || input.cameraMotionGraph.transforms.every((value) =>
    value.confidence >= 0.7 && (!value.discontinuityWarning || value.shotReset))
  const planarPassed = input.planarTrackGraphs.every((graph) => graph.frames.every((value) =>
    value.reprojectionError <= 2.5 && value.confidence >= 0.75 &&
    value.surfaceStability >= 0.7))
  return cameraPassed && planarPassed
}

function cameraPlanarEvidence(input: QaInput): string[] {
  return unique([
    ...(input.cameraMotionGraph ? [input.cameraMotionGraph.artifactHash] : []),
    ...input.planarTrackGraphs.map((value) => value.artifactHash),
    ...(input.cameraMotionGraph || input.planarTrackGraphs.length > 0
      ? []
      : [input.trackGraph.graphHash]),
  ])
}

function cameraPlanarObservations(input: QaInput): Readonly<Record<string, unknown>> {
  const planarFrames = input.planarTrackGraphs.flatMap((value) => value.frames)
  return {
    cameraTransformCount: input.cameraMotionGraph?.transforms.length ?? 0,
    planarSurfaceCount: input.planarTrackGraphs.length,
    maximumReprojectionError: maximum(planarFrames.map((value) => value.reprojectionError)),
    minimumPlanarConfidence: minimum(planarFrames.map((value) => value.confidence)),
  }
}

function privacyTrack(graph: TrackGraphV2, trackId: string): boolean {
  const track = graph.tracks.find((value) => value.trackId === trackId)
  const target = graph.targets.find((value) => value.targetId === track?.targetId)
  return Boolean(target && target.privacyClass !== 'none')
}

function minimum(values: readonly number[]): number {
  return values.length > 0 ? Math.min(...values) : 0
}

function maximum(values: readonly number[]): number {
  return values.length > 0 ? Math.max(...values) : 0
}

function centerDistance(left: z.infer<typeof normalizedBox>, right: z.infer<typeof normalizedBox>) {
  return Math.hypot(
    left.x + left.width / 2 - (right.x + right.width / 2),
    left.y + left.height / 2 - (right.y + right.height / 2),
  )
}

function boxIntersectionOverUnion(
  left: z.infer<typeof normalizedBox>,
  right: z.infer<typeof normalizedBox>,
): number {
  const width = Math.max(0,
    Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x))
  const height = Math.max(0,
    Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y))
  const intersection = width * height
  return intersection / (left.width * left.height + right.width * right.height - intersection)
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function uniqueBy<T>(values: readonly T[], key: (value: T) => string, label: string): void {
  if (new Set(values.map(key)).size !== values.length) throw new Error(`Duplicate Track All ${label}.`)
}

function referenceFor(
  artifactType: string,
  sha256: string,
  value: { ownerUserId: string; workspaceId: string; projectId: string },
): EditSkillArtifactReference {
  return {
    artifactType,
    sha256,
    byteLength: 1,
    ownerUserId: value.ownerUserId,
    workspaceId: value.workspaceId,
    projectId: value.projectId,
  }
}
