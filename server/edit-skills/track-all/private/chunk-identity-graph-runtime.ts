import { z } from 'zod'

import type { EditSkillArtifactReference } from '../../core/edit-skill-artifact-store'
import {
  canonicalSkillJson,
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../../core/skill-capability-manifest-schema'
import {
  editSkillArtifactReferenceSchema,
  skillFrameRangeSchema,
} from '../../core/skill-assignment-schema'
import {
  createTrackGraphV2,
  type TrackGraphV2,
} from '../../shared/track-graph/track-graph-schemas'
import {
  trackBoxSequenceSchema,
  trackIdentityLineageSchema,
  trackMaskSequenceSchema,
  trackOcclusionEventLogSchema,
  trackSampleSequenceSchema,
} from '../track-all-active-artifact-contracts'

const safeId = z.string().trim().min(1).max(180)
const unit = z.number().min(0).max(1)
const normalizedBox = z.object({
  x: unit,
  y: unit,
  width: z.number().gt(0).max(1),
  height: z.number().gt(0).max(1),
}).strict().superRefine((value, context) => {
  if (value.x + value.width > 1 || value.y + value.height > 1) {
    context.addIssue({
      code: 'custom', message: 'Chunk observation box exceeds its source frame.',
    })
  }
})

const typedRef = (artifactType: string) =>
  editSkillArtifactReferenceSchema.extend({
    artifactType: z.literal(artifactType),
  }).strict()

const runtimeInputSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  assignmentId: safeId,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  sourceId: safeId,
  sourceSha256: skillSha256Schema,
  timingHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  shots: z.array(z.object({
    shotId: safeId,
    range: skillFrameRangeSchema,
  }).strict()).min(1).max(10_000),
  chunks: z.array(z.object({
    chunkId: safeId,
    range: skillFrameRangeSchema,
    overlapRange: skillFrameRangeSchema.optional(),
    bucketIndex: z.number().int().nonnegative().max(7),
    attemptRefHash: skillSha256Schema.optional(),
  }).strict()).min(1).max(10_000),
  targets: z.array(z.object({
    targetId: safeId,
    targetType: skillIdentitySchema,
    semanticClass: skillIdentitySchema,
    includeRules: z.array(z.string().trim().min(1).max(300)).max(100),
    excludeRules: z.array(z.string().trim().min(1).max(300)).max(100),
    privacyClass: skillIdentitySchema,
    groundingEvidenceHashes: z.array(skillSha256Schema).min(1).max(100),
    expectedMinimumCount: z.number().int().nonnegative().max(128),
    expectedMaximumCount: z.number().int().positive().max(128),
    ambiguityState: z.enum(['none', 'multiple_candidates', 'uncertain']),
    parentTargetId: safeId.optional(),
    crossShotPolicy: z.enum(['terminate', 'explicit_confidence_link']),
  }).strict()).min(1).max(1_000),
  observations: z.array(z.object({
    observationId: safeId,
    chunkId: safeId,
    bucketIndex: z.number().int().nonnegative().max(7),
    localObjectId: z.string().regex(/^object_[0-9]{3}$/u),
    targetId: safeId,
    semanticClass: skillIdentitySchema,
    samples: z.array(z.object({
      frameIndex: z.number().int().nonnegative(),
      box: normalizedBox,
      confidence: unit,
      visibility: z.enum(['active', 'partially_occluded', 'fully_occluded']),
    }).strict()).min(1).max(100_000),
    maskChunkRef: typedRef('track_mask_chunk_manifest_v1').optional(),
    explicitCrossShotLinkEvidenceHash: skillSha256Schema.optional(),
    sourceEvidenceHash: skillSha256Schema,
  }).strict()).min(1).max(10_000),
  objectBudget: z.object({
    expectedObjects: z.number().int().positive().max(128),
    maximumObjects: z.number().int().positive().max(128),
    bucketSize: z.literal(16),
    bucketCount: z.number().int().positive().max(8),
    sessionCount: z.number().int().positive().max(80_000),
  }).strict(),
  cameraNormalizationEvidenceHash: skillSha256Schema,
  runtimeAttemptRefs: z.array(editSkillArtifactReferenceSchema).max(10_000),
  finalQaRefs: z.array(editSkillArtifactReferenceSchema).min(1).max(100),
  evidenceClass: z.enum([
    'real_private_masklets',
    'injected_masklets_test_only',
  ]),
}).strict().superRefine((value, context) => {
  validateRuntimeInput(value, context)
})

type RuntimeInput = z.infer<typeof runtimeInputSchema>
type Observation = RuntimeInput['observations'][number]
type ObservationSample = Observation['samples'][number]

interface IdentityWork {
  trackId: string
  targetId: string
  semanticClass: string
  observations: Observation[]
  stitchingEvidenceHashes: string[]
  warnings: Array<{
    frameIndex: number
    confidence: number
    evidenceHash: string
  }>
  crossShotLinked: boolean
  parentTrackId?: string
  childTrackIds: string[]
}

export interface TrackAllChunkIdentityGraphResult {
  graph: TrackGraphV2
  sampleSequences: readonly unknown[]
  boxSequences: readonly unknown[]
  maskSequences: readonly unknown[]
  occlusionEventLogs: readonly unknown[]
  identityLineage: unknown
  evidenceHash: string
  identitySwitchWarningCount: number
  reentryEventCount: number
}

const ASSOCIATION_THRESHOLD = 0.55
const AMBIGUITY_MARGIN = 0.08
const MAXIMUM_REENTRY_SECONDS = 2

export function buildTrackAllChunkIdentityGraph(
  input: z.input<typeof runtimeInputSchema>,
): TrackAllChunkIdentityGraphResult {
  const parsed = runtimeInputSchema.parse(input)
  const targets = new Map(parsed.targets.map((target) => [
    target.targetId,
    target,
  ]))
  const shots = new Map(parsed.observations.map((observation) => [
    observation.observationId,
    shotForObservation(parsed, observation),
  ]))
  const prefixCounts = new Map<string, number>()
  const identities: IdentityWork[] = []
  const ordered = [...parsed.observations].sort((left, right) =>
    firstFrame(left) - firstFrame(right) ||
    left.bucketIndex - right.bucketIndex ||
    left.observationId.localeCompare(right.observationId))

  for (const observation of ordered) {
    const target = targets.get(observation.targetId)!
    const candidates = identities.flatMap((identity) => {
      if (identity.targetId !== observation.targetId ||
        identity.observations.some((previous) =>
          previous.chunkId === observation.chunkId &&
          previous.bucketIndex === observation.bucketIndex)) return []
      const previous = identity.observations.at(-1)!
      const previousShot = shots.get(previous.observationId)!
      const currentShot = shots.get(observation.observationId)!
      const crossShot = previousShot.shotId !== currentShot.shotId
      if (crossShot && (target.crossShotPolicy !== 'explicit_confidence_link' ||
        !observation.explicitCrossShotLinkEvidenceHash)) return []
      const score = associationScore(previous, observation,
        parsed.authorizedRange.fps)
      const minimum = crossShot ? 0.72 : ASSOCIATION_THRESHOLD
      return score >= minimum ? [{ identity, score, crossShot }] : []
    }).sort((left, right) => right.score - left.score ||
      left.identity.trackId.localeCompare(right.identity.trackId))

    const selected = candidates[0]
    if (!selected) {
      const prefix = trackPrefix(observation.semanticClass)
      const next = (prefixCounts.get(prefix) ?? 0) + 1
      prefixCounts.set(prefix, next)
      identities.push({
        trackId: `${prefix}_${String(next).padStart(3, '0')}`,
        targetId: observation.targetId,
        semanticClass: observation.semanticClass,
        observations: [observation],
        stitchingEvidenceHashes: [hashSkillValue({
          disposition: 'new_anonymous_identity',
          observationId: observation.observationId,
          sourceEvidenceHash: observation.sourceEvidenceHash,
        })],
        warnings: [],
        crossShotLinked: false,
        childTrackIds: [],
      })
      continue
    }
    const associationEvidenceHash = hashSkillValue({
      disposition: selected.crossShot
        ? 'explicit_cross_shot_candidate_link'
        : 'geometry_association',
      previousObservationId:
        selected.identity.observations.at(-1)!.observationId,
      observationId: observation.observationId,
      score: selected.score,
      explicitCrossShotLinkEvidenceHash:
        observation.explicitCrossShotLinkEvidenceHash ?? null,
    })
    selected.identity.observations.push(observation)
    selected.identity.stitchingEvidenceHashes.push(associationEvidenceHash)
    selected.identity.crossShotLinked ||= selected.crossShot
    const ambiguous = candidates[1] !== undefined &&
      selected.score - candidates[1].score < AMBIGUITY_MARGIN
    if (ambiguous || selected.score < 0.7 || selected.crossShot) {
      selected.identity.warnings.push({
        frameIndex: firstFrame(observation),
        confidence: Math.min(1, selected.score),
        evidenceHash: hashSkillValue({
          associationEvidenceHash,
          ambiguous,
          crossShot: selected.crossShot,
          alternateScore: candidates[1]?.score ?? null,
        }),
      })
    }
  }

  for (const target of parsed.targets) {
    const observedCount = identities.filter((identity) =>
      identity.targetId === target.targetId).length
    if (observedCount < target.expectedMinimumCount ||
      observedCount > target.expectedMaximumCount) throw new Error(
      `Track All observed count for ${target.targetId} exceeds its target authority.`,
    )
  }

  assignParentChildLineage({ identities, targets })
  const lineage = artifactLineage(parsed)
  const sampleSequences: unknown[] = []
  const boxSequences: unknown[] = []
  const maskSequences: unknown[] = []
  const occlusionEventLogs: unknown[] = []
  const projectedTracks: TrackGraphV2['tracks'] = []
  let reentryEventCount = 0

  for (const identity of identities) {
    const merged = mergeIdentitySamples(identity)
    const visibilitySpans = buildVisibilitySpans({
      timelineSamples: merged.timelineSamples,
      crossShotLinked: identity.crossShotLinked,
    })
    const sampleSequence = address({
      schemaVersion: 'track_sample_sequence_v1',
      ...lineage,
      trackId: identity.trackId,
      samples: merged.timelineSamples,
    })
    const boxSequence = address({
      schemaVersion: 'track_box_sequence_v1',
      ...lineage,
      trackId: identity.trackId,
      boxes: merged.samples.map((sample) => ({
        frameIndex: sample.frameIndex,
        box: sample.box,
        confidence: sample.confidence,
      })),
    })
    trackSampleSequenceSchema.parse(sampleSequence)
    trackBoxSequenceSchema.parse(boxSequence)
    sampleSequences.push(sampleSequence)
    boxSequences.push(boxSequence)
    const boxSequenceRef = artifactRef('track_box_sequence_v1', boxSequence,
      parsed)

    const chunkRefs = uniqueRefs(identity.observations.flatMap((observation) =>
      observation.maskChunkRef ? [observation.maskChunkRef] : []))
    let maskSequenceRef: EditSkillArtifactReference | undefined
    if (chunkRefs.length > 0) {
      const maskSequence = address({
        schemaVersion: 'track_mask_sequence_v1',
        ...lineage,
        trackId: identity.trackId,
        chunkRefs,
        privateBinaryOnly: true,
        publicMaskPublished: false,
      })
      trackMaskSequenceSchema.parse(maskSequence)
      maskSequences.push(maskSequence)
      maskSequenceRef = artifactRef(
        'track_mask_sequence_v1', maskSequence, parsed,
      )
    }

    const occlusionEvents = visibilitySpans.flatMap((span, index) => {
      const state = occlusionEventState(span.state)
      if (!state) return []
      const evidenceHash = hashSkillValue({
        trackId: identity.trackId,
        span,
        sourceEvidenceHashes: identity.observations.map((observation) =>
          observation.sourceEvidenceHash),
      })
      if (state === 'reacquired') reentryEventCount += 1
      return [{
        eventId: `event-${identity.trackId}-${index + 1}`,
        trackId: identity.trackId,
        startFrameInclusive: span.startFrameInclusive,
        endFrameExclusive: span.endFrameExclusive,
        state,
        confidence: state === 'lost' ? 0 : 0.75,
        evidenceHashes: [evidenceHash],
      }]
    })
    const occlusionEventLog = address({
      schemaVersion: 'track_occlusion_event_log_v1',
      ...lineage,
      events: occlusionEvents,
    })
    trackOcclusionEventLogSchema.parse(occlusionEventLog)
    occlusionEventLogs.push(occlusionEventLog)
    const occlusionEventLogRef = artifactRef(
      'track_occlusion_event_log_v1', occlusionEventLog, parsed,
    )
    const reentryEventHashes = occlusionEvents
      .filter((event) => event.state === 'reacquired')
      .map((event) => event.evidenceHashes[0]!)
    projectedTracks.push({
      trackId: identity.trackId,
      targetId: identity.targetId,
      semanticClass: identity.semanticClass,
      ...(identity.parentTrackId
        ? { parentTrackId: identity.parentTrackId }
        : {}),
      childTrackIds: identity.childTrackIds,
      startFrameInclusive: merged.timelineSamples[0]!.frameIndex,
      endFrameExclusive: merged.timelineSamples.at(-1)!.frameIndex + 1,
      visibilitySpans,
      boxSequenceRef,
      ...(maskSequenceRef ? { maskSequenceRef } : {}),
      confidenceSequenceHash: hashSkillValue(merged.timelineSamples),
      occlusionEventLogRef,
      reentryEventHashes,
      identitySwitchWarnings: [
        ...identity.warnings,
        ...merged.overlapWarnings,
      ],
      depthOrder: 0,
      qaRefs: [],
      repairRefs: [],
    })
  }

  const identityLineage = address({
    schemaVersion: 'track_identity_lineage_v1',
    ...lineage,
    identities: identities.map((identity) => {
      const track = projectedTracks.find((candidate) =>
        candidate.trackId === identity.trackId)!
      return {
        anonymousTrackId: identity.trackId,
        ...(identity.parentTrackId
          ? { parentTrackId: identity.parentTrackId }
          : {}),
        childTrackIds: identity.childTrackIds,
        state: track.visibilitySpans.at(-1)!.state,
        evidenceHashes: identity.stitchingEvidenceHashes,
        crossShotCertain: false,
      }
    }),
  })
  trackIdentityLineageSchema.parse(identityLineage)

  const graph = createTrackGraphV2({
    schemaVersion: 'track_graph_v2',
    modelNeutral: true,
    ...graphLineage(parsed),
    shots: parsed.shots.map((shot) => ({
      ...shot,
      sceneCutResetsIdentity: true as const,
    })),
    chunks: parsed.chunks,
    targets: parsed.targets.map(({ parentTargetId: _parentTargetId,
      crossShotPolicy: _crossShotPolicy, ...target }) => {
      void _parentTargetId
      void _crossShotPolicy
      return target
    }),
    tracks: projectedTracks,
    stitchingEvidenceHashes: identities.flatMap((identity) =>
      identity.stitchingEvidenceHashes),
    cameraNormalizationEvidenceHash:
      parsed.cameraNormalizationEvidenceHash,
    uncertaintyEventHashes: projectedTracks.flatMap((track) =>
      track.identitySwitchWarnings.map((warning) => warning.evidenceHash)),
    objectBudget: parsed.objectBudget,
    runtimeAttemptRefs: parsed.runtimeAttemptRefs,
    finalQaRefs: parsed.finalQaRefs,
    privateMaskDataPublished: false,
    outsideAuthorizedRangeModified: false,
  })
  const output = {
    graph,
    sampleSequences,
    boxSequences,
    maskSequences,
    occlusionEventLogs,
    identityLineage,
    identitySwitchWarningCount: graph.tracks.reduce((count, track) =>
      count + track.identitySwitchWarnings.length, 0),
    reentryEventCount,
  }
  return deepFreezeSkillValue({
    ...output,
    evidenceHash: hashSkillValue(output),
  })
}

function validateRuntimeInput(
  value: RuntimeInput,
  context: z.RefinementCtx,
): void {
  const contains = (range: z.infer<typeof skillFrameRangeSchema>) =>
    range.fps === value.authorizedRange.fps &&
    range.startFrameInclusive >= value.authorizedRange.startFrameInclusive &&
    range.endFrameExclusive <= value.authorizedRange.endFrameExclusive
  const targetIds = new Set(value.targets.map((target) => target.targetId))
  const chunkById = new Map(value.chunks.map((chunk) => [chunk.chunkId, chunk]))
  if (targetIds.size !== value.targets.length ||
    chunkById.size !== value.chunks.length ||
    value.shots.some((shot) => !contains(shot.range)) ||
    value.chunks.some((chunk) => !contains(chunk.range) ||
      chunk.overlapRange && !contains(chunk.overlapRange))) context.addIssue({
    code: 'custom', message: 'Chunk identity input has invalid range authority.',
  })
  for (const target of value.targets) {
    if (target.expectedMaximumCount < target.expectedMinimumCount ||
      target.parentTargetId && !targetIds.has(target.parentTargetId)) {
      context.addIssue({
        code: 'custom', message: 'Chunk identity target lineage is invalid.',
      })
    }
  }
  const observedIds = new Set<string>()
  for (const observation of value.observations) {
    const chunk = chunkById.get(observation.chunkId)
    const target = value.targets.find((candidate) =>
      candidate.targetId === observation.targetId)
    const frames = observation.samples.map((sample) => sample.frameIndex)
    const strictlyIncreasing = frames.every((frame, index) =>
      index === 0 || frame > frames[index - 1]!)
    const exactScope = chunk && target &&
      chunk.bucketIndex === observation.bucketIndex &&
      target.semanticClass === observation.semanticClass &&
      observation.samples.every((sample) =>
        sample.frameIndex >= chunk.range.startFrameInclusive &&
        sample.frameIndex < chunk.range.endFrameExclusive)
    if (observedIds.has(observation.observationId) || !strictlyIncreasing ||
      !exactScope) context.addIssue({
      code: 'custom', message: 'Chunk observation is duplicated or out of scope.',
    })
    observedIds.add(observation.observationId)
    if (observation.maskChunkRef && !sameScope(observation.maskChunkRef, value)) {
      context.addIssue({
        code: 'custom', message: 'Chunk observation mask is cross-tenant.',
      })
    }
  }
  const expectedBuckets = Math.ceil(value.objectBudget.expectedObjects / 16)
  if (value.objectBudget.expectedObjects > value.objectBudget.maximumObjects ||
    value.objectBudget.bucketCount !== expectedBuckets ||
    value.chunks.some((chunk) =>
      chunk.bucketIndex >= value.objectBudget.bucketCount)) context.addIssue({
    code: 'custom', message: 'Chunk identity multiplex budget is invalid.',
  })
  if ([...value.runtimeAttemptRefs, ...value.finalQaRefs].some((reference) =>
    !sameScope(reference, value))) context.addIssue({
    code: 'custom', message: 'Chunk identity evidence is cross-tenant.',
  })
}

function shotForObservation(input: RuntimeInput, observation: Observation) {
  const matching = input.shots.filter((shot) => observation.samples.every(
    (sample) => sample.frameIndex >= shot.range.startFrameInclusive &&
      sample.frameIndex < shot.range.endFrameExclusive,
  ))
  if (matching.length !== 1) throw new Error(
    'Chunk observation must belong to exactly one shot.',
  )
  return matching[0]!
}

function associationScore(
  previous: Observation,
  current: Observation,
  fps: number,
): number {
  const previousByFrame = new Map(previous.samples.map((sample) => [
    sample.frameIndex,
    sample,
  ]))
  const common = current.samples.flatMap((sample) => {
    const prior = previousByFrame.get(sample.frameIndex)
    return prior ? [{ prior, sample }] : []
  })
  if (common.length > 0) {
    return average(common.map(({ prior, sample }) =>
      boxIou(prior.box, sample.box) * 0.75 +
      centerSimilarity(prior.box, sample.box) * 0.25))
  }
  const prior = previous.samples.at(-1)!
  const sample = current.samples[0]!
  const gap = Math.max(0, sample.frameIndex - prior.frameIndex - 1)
  if (gap > fps * MAXIMUM_REENTRY_SECONDS) return 0
  const temporal = 1 - gap / (fps * MAXIMUM_REENTRY_SECONDS + 1)
  return centerSimilarity(prior.box, sample.box) * 0.8 * temporal + 0.1
}

function mergeIdentitySamples(identity: IdentityWork) {
  const byFrame = new Map<number, ObservationSample>()
  const overlapWarnings: IdentityWork['warnings'] = []
  for (const observation of identity.observations) {
    for (const sample of observation.samples) {
      const existing = byFrame.get(sample.frameIndex)
      if (existing && boxIou(existing.box, sample.box) < 0.45) {
        overlapWarnings.push({
          frameIndex: sample.frameIndex,
          confidence: Math.min(existing.confidence, sample.confidence),
          evidenceHash: hashSkillValue({
            trackId: identity.trackId,
            disposition: 'overlap_geometry_conflict',
            existing,
            sample,
          }),
        })
      }
      if (!existing || sample.confidence > existing.confidence) {
        byFrame.set(sample.frameIndex, sample)
      }
    }
  }
  const samples = [...byFrame.values()].sort((left, right) =>
    left.frameIndex - right.frameIndex)
  const stateByFrame = new Map(samples.map((sample) => [
    sample.frameIndex,
    { confidence: sample.confidence, visibility: sample.visibility },
  ]))
  const timelineSamples: Array<{
    frameIndex: number
    confidence: number
    visibility: TrackGraphV2['tracks'][number]['visibilitySpans'][number]['state']
  }> = []
  for (let frameIndex = samples[0]!.frameIndex;
    frameIndex <= samples.at(-1)!.frameIndex; frameIndex += 1) {
    const observed = stateByFrame.get(frameIndex)
    const previousObserved = stateByFrame.get(frameIndex - 1)
    const hadGap = !previousObserved && observed && frameIndex > samples[0]!.frameIndex
    timelineSamples.push({
      frameIndex,
      confidence: observed?.confidence ?? 0,
      visibility: !observed
        ? 'lost' as const
        : hadGap
          ? 'reacquired' as const
          : observed.visibility,
    })
  }
  return { samples, timelineSamples, overlapWarnings }
}

function buildVisibilitySpans(input: {
  timelineSamples: ReturnType<typeof mergeIdentitySamples>['timelineSamples']
  crossShotLinked: boolean
}) {
  const timeline = input.timelineSamples.map((sample) => ({ ...sample }))
  if (input.crossShotLinked && timeline.length > 0) {
    const candidate = timeline.find((sample) => sample.visibility === 'reacquired')
    if (candidate) candidate.visibility = 'identity_uncertain'
  }
  const spans: Array<{
    startFrameInclusive: number
    endFrameExclusive: number
    state: TrackGraphV2['tracks'][number]['visibilitySpans'][number]['state']
  }> = []
  for (const sample of timeline) {
    const state = sample.visibility
    const previous = spans.at(-1)
    if (previous?.state === state && previous.endFrameExclusive === sample.frameIndex) {
      previous.endFrameExclusive += 1
    } else {
      spans.push({
        startFrameInclusive: sample.frameIndex,
        endFrameExclusive: sample.frameIndex + 1,
        state,
      })
    }
  }
  return spans
}

function assignParentChildLineage(input: {
  identities: IdentityWork[]
  targets: Map<string, RuntimeInput['targets'][number]>
}): void {
  for (const child of input.identities) {
    const parentTargetId = input.targets.get(child.targetId)?.parentTargetId
    if (!parentTargetId) continue
    const candidates = input.identities.filter((candidate) =>
      candidate.targetId === parentTargetId)
    const parent = candidates.map((candidate) => ({
      candidate,
      score: lineageOverlapScore(candidate, child),
    })).sort((left, right) => right.score - left.score ||
      left.candidate.trackId.localeCompare(right.candidate.trackId))[0]
    if (!parent || parent.score <= 0) continue
    child.parentTrackId = parent.candidate.trackId
    parent.candidate.childTrackIds.push(child.trackId)
  }
}

function lineageOverlapScore(parent: IdentityWork, child: IdentityWork): number {
  const parents = parent.observations.flatMap((observation) =>
    observation.samples)
  const parentByFrame = new Map(parents.map((sample) => [
    sample.frameIndex,
    sample.box,
  ]))
  const scores = child.observations.flatMap((observation) =>
    observation.samples.flatMap((sample) => {
      const box = parentByFrame.get(sample.frameIndex)
      if (!box) return []
      const center = {
        x: sample.box.x + sample.box.width / 2,
        y: sample.box.y + sample.box.height / 2,
      }
      return [center.x >= box.x && center.x <= box.x + box.width &&
        center.y >= box.y && center.y <= box.y + box.height ? 1 : 0]
    }))
  return scores.length === 0 ? 0 : average(scores)
}

function artifactLineage(input: RuntimeInput) {
  return {
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    assignmentId: input.assignmentId,
    assignmentHash: input.assignmentHash,
    planHash: input.planHash,
    manifestRef: input.manifestRef,
    sourceSha256: input.sourceSha256,
    authorizedRange: input.authorizedRange,
  }
}

function graphLineage(input: RuntimeInput) {
  return {
    ...artifactLineage(input),
    sourceId: input.sourceId,
    timingHash: input.timingHash,
    authorizedRangeHash: hashSkillValue(input.authorizedRange),
  }
}

function address<T extends Record<string, unknown>>(core: T) {
  return { ...core, artifactHash: hashSkillValue(core) }
}

function artifactRef(
  artifactType: string,
  value: unknown,
  scope: Pick<RuntimeInput, 'ownerUserId' | 'workspaceId' | 'projectId'>,
): EditSkillArtifactReference {
  return {
    artifactType,
    sha256: hashSkillValue(value),
    byteLength: Buffer.byteLength(canonicalSkillJson(value), 'utf8'),
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
  }
}

function sameScope(
  reference: EditSkillArtifactReference,
  scope: Pick<RuntimeInput, 'ownerUserId' | 'workspaceId' | 'projectId'>,
) {
  return reference.ownerUserId === scope.ownerUserId &&
    reference.workspaceId === scope.workspaceId &&
    reference.projectId === scope.projectId
}

function uniqueRefs(references: readonly EditSkillArtifactReference[]) {
  const seen = new Set<string>()
  return references.filter((reference) => {
    const key = hashSkillValue(reference)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function firstFrame(observation: Observation) {
  return observation.samples[0]!.frameIndex
}

function trackPrefix(semanticClass: string) {
  if (semanticClass.includes('license_plate')) return 'license_plate'
  if (semanticClass.includes('phone_screen') || semanticClass === 'screen') {
    return 'phone_screen'
  }
  for (const value of ['person', 'face', 'vehicle', 'region', 'surface']) {
    if (semanticClass.includes(value)) return value
  }
  return 'object'
}

function boxIou(left: z.infer<typeof normalizedBox>, right: z.infer<typeof normalizedBox>) {
  const overlapWidth = Math.max(0,
    Math.min(left.x + left.width, right.x + right.width) -
      Math.max(left.x, right.x))
  const overlapHeight = Math.max(0,
    Math.min(left.y + left.height, right.y + right.height) -
      Math.max(left.y, right.y))
  const intersection = overlapWidth * overlapHeight
  const union = left.width * left.height + right.width * right.height -
    intersection
  return union === 0 ? 0 : intersection / union
}

function centerSimilarity(
  left: z.infer<typeof normalizedBox>,
  right: z.infer<typeof normalizedBox>,
) {
  const leftCenter = [left.x + left.width / 2, left.y + left.height / 2]
  const rightCenter = [right.x + right.width / 2, right.y + right.height / 2]
  const distance = Math.hypot(
    leftCenter[0] - rightCenter[0],
    leftCenter[1] - rightCenter[1],
  ) / Math.SQRT2
  return Math.max(0, 1 - distance)
}

function average(values: readonly number[]) {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length
}

function occlusionEventState(
  state: TrackGraphV2['tracks'][number]['visibilitySpans'][number]['state'],
) {
  return state === 'partially_occluded'
    ? 'partial_occlusion' as const
    : state === 'fully_occluded'
      ? 'full_occlusion' as const
      : state === 'lost'
        ? 'lost' as const
        : state === 'reacquired'
          ? 'reacquired' as const
          : state === 'identity_uncertain'
            ? 'reentry_candidate' as const
            : null
}
