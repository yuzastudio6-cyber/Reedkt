import { z } from 'zod'

import { skillFrameRangeSchema } from '../../core/skill-assignment-schema'
import { hashSkillValue } from '../../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import {
  trackAllAssignmentSchema,
  trackAllTargetSpecificationSchema,
} from '../track-all-schemas'

const risk = z.number().min(0).max(1)
const safeId = z.string().trim().min(1).max(180)

export const trackAllShotChunkPlanningInputSchema = z.object({
  authorizedRange: skillFrameRangeSchema,
  shotBoundaries: z.array(z.number().int().nonnegative()).max(10_000),
  qualifiedMaximumFrames: z.number().int().positive().max(10_000),
  maximumChunks: z.number().int().positive().max(1_000),
  privacyRisk: risk,
  targetSpeed: risk,
  targetSizeRisk: risk,
  occlusionRisk: risk,
  cameraMotionRisk: risk,
  objectCount: z.number().int().nonnegative().max(128),
}).strict()

const chunkSchema = z.object({
  chunkId: safeId, range: skillFrameRangeSchema,
  overlapFramesBefore: z.number().int().nonnegative().max(240),
  overlapFramesAfter: z.number().int().nonnegative().max(240),
}).strict()

export const trackAllShotChunkPlanSchema = z.object({
  maximumFramesPerChunk: z.number().int().positive(),
  dynamicOverlapFrames: z.number().int().nonnegative(),
  chunks: z.array(chunkSchema).max(1_000),
  evidenceHash: skillSha256Schema,
}).strict()

export function planTrackAllShotAwareChunks(
  input: z.input<typeof trackAllShotChunkPlanningInputSchema>,
) {
  const parsed = trackAllShotChunkPlanningInputSchema.parse(input)
  const boundaries = [
    parsed.authorizedRange.startFrameInclusive,
    ...parsed.shotBoundaries.filter((frame) =>
      frame > parsed.authorizedRange.startFrameInclusive &&
      frame < parsed.authorizedRange.endFrameExclusive),
    parsed.authorizedRange.endFrameExclusive,
  ]
  const sorted = [...new Set(boundaries)].sort((left, right) => left - right)
  const riskScore = Math.max(
    parsed.privacyRisk, parsed.targetSpeed, parsed.targetSizeRisk,
    parsed.occlusionRisk, parsed.cameraMotionRisk,
    parsed.objectCount > 16 ? 0.75 : parsed.objectCount > 5 ? 0.4 : 0.15,
  )
  const dynamicOverlapFrames = Math.min(
    Math.floor(parsed.qualifiedMaximumFrames / 3),
    Math.max(12, Math.ceil(parsed.authorizedRange.fps * (0.5 + riskScore * 1.5))),
  )
  const chunks: z.infer<typeof chunkSchema>[] = []
  for (let shotIndex = 0; shotIndex < sorted.length - 1; shotIndex += 1) {
    const shotStart = sorted[shotIndex]!
    const shotEnd = sorted[shotIndex + 1]!
    let cursor = shotStart
    while (cursor < shotEnd) {
      const end = Math.min(shotEnd, cursor + parsed.qualifiedMaximumFrames)
      chunks.push({
        chunkId: `track-chunk-${chunks.length + 1}`,
        range: { startFrameInclusive: cursor, endFrameExclusive: end, fps: parsed.authorizedRange.fps },
        overlapFramesBefore: cursor === shotStart ? 0 : Math.min(dynamicOverlapFrames, cursor - shotStart),
        overlapFramesAfter: end === shotEnd ? 0 : Math.min(dynamicOverlapFrames, shotEnd - end),
      })
      cursor = end
    }
  }
  if (chunks.length > parsed.maximumChunks) throw new Error('Track All shot-aware chunk plan exceeds assignment authority.')
  const core = {
    maximumFramesPerChunk: parsed.qualifiedMaximumFrames,
    dynamicOverlapFrames,
    chunks,
  }
  return trackAllShotChunkPlanSchema.parse({ ...core, evidenceHash: hashSkillValue({ input: parsed, output: core }) })
}

export const trackAllInitializationInputSchema = z.object({
  authorizedRange: skillFrameRangeSchema,
  preferredFrame: z.number().int().nonnegative().optional(),
  candidates: z.array(z.object({
    frameIndex: z.number().int().nonnegative(), visibility: risk, targetSize: risk,
    sharpness: risk, motionBlur: risk, occlusion: risk, similarObjectAmbiguity: risk,
    edgeTruncation: risk, cameraStability: risk, textReadability: risk.optional(),
  }).strict()).min(1).max(1_000),
}).strict()

export function selectTrackAllInitializationFrame(input: z.input<typeof trackAllInitializationInputSchema>) {
  const parsed = trackAllInitializationInputSchema.parse(input)
  const inRange = parsed.candidates.filter((candidate) =>
    candidate.frameIndex >= parsed.authorizedRange.startFrameInclusive &&
    candidate.frameIndex < parsed.authorizedRange.endFrameExclusive)
  if (inRange.length === 0) {
    throw new Error('Track All initialization requires measured in-range preflight candidates.')
  }
  const candidates = inRange
  const score = (candidate: (typeof candidates)[number]) =>
    candidate.visibility * 2 + candidate.targetSize + candidate.sharpness * 2 +
    candidate.cameraStability + (candidate.textReadability ?? 0) -
    candidate.motionBlur * 2 - candidate.occlusion * 2 -
    candidate.similarObjectAmbiguity - candidate.edgeTruncation
  const preferred = parsed.preferredFrame === undefined
    ? undefined
    : candidates.find((candidate) => candidate.frameIndex === parsed.preferredFrame)
  const selected = preferred ?? [...candidates].sort((left, right) =>
    score(right) - score(left) || left.frameIndex - right.frameIndex)[0]!
  return Object.freeze({
    frameIndex: selected.frameIndex,
    score: score(selected),
    evidenceHash: hashSkillValue({ input: parsed, selectedFrame: selected.frameIndex, score: score(selected) }),
  })
}

export const trackAllMultiplexBudgetInputSchema = z.object({
  expectedObjects: z.number().int().nonnegative().max(128),
  approvedMaximumObjects: z.number().int().positive().max(128),
  chunkCount: z.number().int().nonnegative().max(1_000),
  bucketSize: z.number().int().positive().max(128),
  maximumBuckets: z.number().int().positive().max(8),
  samRequired: z.boolean(),
}).strict()

export function planTrackAllMultiplexBudget(input: z.input<typeof trackAllMultiplexBudgetInputSchema>) {
  const parsed = trackAllMultiplexBudgetInputSchema.parse(input)
  if (parsed.expectedObjects > parsed.approvedMaximumObjects) throw new Error('Track All object budget exceeds assignment authority.')
  const bucketCount = parsed.expectedObjects === 0 ? 0 : Math.ceil(parsed.expectedObjects / parsed.bucketSize)
  if (bucketCount > parsed.maximumBuckets) throw new Error('Track All multiplex budget exceeds the qualified bucket ceiling.')
  const core = {
    expectedObjects: parsed.expectedObjects,
    maximumObjects: parsed.approvedMaximumObjects,
    bucketSize: parsed.bucketSize,
    bucketCount,
    sessionCount: parsed.samRequired ? parsed.chunkCount * bucketCount : 0,
    budgetClass: parsed.expectedObjects <= 5 ? 'targeted' as const : parsed.expectedObjects <= 16 ? 'normal_multiplex' as const : 'multi_bucket' as const,
  }
  return Object.freeze({ ...core, evidenceHash: hashSkillValue({ input: parsed, output: core }) })
}

export function compileTrackAllPromptStrategy(input: {
  assignment: unknown
  target: unknown
}) {
  const assignment = trackAllAssignmentSchema.parse(input.assignment)
  const target = trackAllTargetSpecificationSchema.parse(input.target)
  if (assignment.assignmentId !== target.assignmentId) throw new Error('Track All prompt strategy rejected a foreign target.')
  const promptKinds = [...new Set(target.groundingEvidence.map((evidence) => evidence.kind))]
  const core = {
    schemaVersion: 'track_all_prompt_strategy_v1' as const,
    targetId: target.targetId,
    promptKinds,
    compiledTextConcepts: target.groundingEvidence.flatMap((evidence) =>
      evidence.kind === 'text_concept' ? [evidence.compiledConcept] : []),
    rawChatIncluded: false as const,
    callerSelectedModelIncluded: false as const,
    callerSelectedPathIncluded: false as const,
  }
  return Object.freeze({ ...core, evidenceHash: hashSkillValue(core) })
}

export function planTrackAllSessionLifecycle(input: {
  samRequired: boolean
  maximumAttempts: number
  chunkCount: number
  sessionCount: number
}) {
  const parsed = z.object({
    samRequired: z.boolean(), maximumAttempts: z.number().int().min(1).max(3),
    chunkCount: z.number().int().nonnegative(), sessionCount: z.number().int().nonnegative(),
  }).strict().parse(input)
  if (parsed.samRequired !== (parsed.sessionCount > 0)) throw new Error('Track All session lifecycle contradicts its SAM route.')
  const core = {
    oneWriterPerSession: true as const,
    mandatoryClose: true as const,
    resetBetweenConceptStages: true as const,
    propagationDirection: parsed.samRequired ? 'both' as const : 'none' as const,
    automaticUnknownOutcomeResubmission: false as const,
    maximumAttempts: parsed.maximumAttempts,
    chunkCount: parsed.chunkCount,
    sessionCount: parsed.sessionCount,
  }
  return Object.freeze({ ...core, evidenceHash: hashSkillValue(core) })
}

export const trackAllEstimateInputSchema = z.object({
  frameCount: z.number().int().nonnegative(), fps: z.number().int().positive(),
  chunkCount: z.number().int().nonnegative(), overlapFrames: z.number().int().nonnegative(),
  targetGroupCount: z.number().int().nonnegative(), objectCount: z.number().int().nonnegative(),
  bucketCount: z.number().int().nonnegative(), sessionCount: z.number().int().nonnegative(),
  bidirectionalPropagation: z.boolean(), planarGeometry: z.boolean(), ocr: z.boolean(),
  landmarks: z.boolean(), maskRefinement: z.boolean(), privacyTreatment: z.boolean(),
  previewRender: z.boolean(), qaDepth: z.enum(['planning', 'internal', 'production']),
  repairAttempts: z.number().int().min(0).max(2), noAction: z.boolean(),
}).strict()

export function estimateTrackAllPlan(input: z.input<typeof trackAllEstimateInputSchema>) {
  const parsed = trackAllEstimateInputSchema.parse(input)
  if (parsed.noAction) return Object.freeze({
    time: { minimumSeconds: 0, expectedSeconds: 0, maximumSeconds: 0 },
    credits: { minimumCredits: 0, expectedCredits: 0, maximumCredits: 0, internalToolCostOnly: true as const },
    evidenceHash: hashSkillValue(parsed),
  })
  const baseSeconds = Math.ceil(parsed.frameCount / parsed.fps)
  const expectedSeconds = baseSeconds + parsed.chunkCount * 4 + parsed.sessionCount * 18 +
    Math.ceil(parsed.overlapFrames / parsed.fps) + (parsed.bidirectionalPropagation ? 6 : 0) +
    (parsed.planarGeometry ? 8 : 0) + (parsed.ocr ? 4 : 0) +
    (parsed.landmarks ? 4 : 0) + (parsed.maskRefinement ? 6 : 0) +
    (parsed.privacyTreatment ? 20 : 0) + (parsed.previewRender ? 12 : 0) +
    parsed.repairAttempts * 10
  const expectedCredits = parsed.sessionCount * 4 + parsed.chunkCount +
    parsed.bucketCount + (parsed.privacyTreatment ? 3 : 0) +
    (parsed.previewRender ? 2 : 0) + (parsed.ocr || parsed.landmarks ? 1 : 0) +
    parsed.repairAttempts * 2
  const core = {
    time: {
      minimumSeconds: Math.max(1, Math.floor(expectedSeconds * 0.6)),
      expectedSeconds, maximumSeconds: expectedSeconds * 2,
    },
    credits: {
      minimumCredits: Math.max(1, Math.floor(expectedCredits * 0.5)),
      expectedCredits, maximumCredits: expectedCredits * 2,
      internalToolCostOnly: true as const,
    },
  }
  return Object.freeze({ ...core, evidenceHash: hashSkillValue({ input: parsed, output: core }) })
}
