import { z } from 'zod'

import type { SkillRouteQualificationReceipt } from '../core/skill-route-qualification'
import { skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { deepFreezeSkillValue, hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../core/skill-capability-manifest-schema'
import { TRACK_ALL_SAM_OPERATION_V2 } from './track-all-capability-manifest'
import {
  TRACK_ALL_SAM31_V2_MAXIMUM_BUCKETS_PER_SESSION,
  TRACK_ALL_SAM31_V2_MAXIMUM_FRAMES_PER_SESSION,
  TRACK_ALL_SAM31_V2_MAXIMUM_OBJECTS_PER_BUCKET,
} from './private/sam3_1-track-masklets-operation'
import {
  TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS,
  trackAllSam31V2RouteGateReportSchema,
  type TrackAllSam31V2RouteGateReport,
} from './private/sam3_1-v2-route-qualification-gate'
import {
  TRACK_ALL_SAM31_REAL_PRIVATE_DOCKER_TARGET,
  TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY,
  TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_OWNER_VERSION,
  TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION,
} from './private/sam3_1-real-private-runtime-identity'

export { createCurrentTrackAllSam31V2RouteGateReport } from './private/sam3_1-v2-route-qualification-gate'

const safeId = z.string().trim().min(1).max(180)
const unit = z.number().min(0).max(1)

const preflightCandidateSchema = z.object({
  frameIndex: z.number().int().nonnegative(),
  visibility: unit,
  normalizedTargetSize: unit,
  sharpness: unit,
  motionBlur: unit,
  edgeTruncation: unit,
  cameraStability: unit,
  cameraMotionRisk: unit,
  targetMotion: unit,
  occlusionLikelihood: unit,
  similarObjectAmbiguity: unit,
  ocrReadability: unit,
  plateScreenDocumentVisibility: unit,
  evidenceHashes: z.array(skillSha256Schema).min(1).max(20),
}).strict()

const preflightObservationCoreSchema = z.object({
  schemaVersion: z.literal('track_all_preflight_observation_v1'),
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  assignmentId: safeId,
  assignmentHash: skillSha256Schema,
  targetHash: skillSha256Schema,
  sourceChecksum: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  authorizedRangeHash: skillSha256Schema,
  candidateFrames: z.array(preflightCandidateSchema).min(1).max(1_000),
  producerAuthority: z.object({
    operationId: z.literal('track_all.observe_preflight.v1'),
    workerClass: z.literal('track_all_geometry_worker'),
    sourceEvidenceHash: skillSha256Schema,
    callerSuppliedMeasurementsAccepted: z.literal(false),
  }).strict(),
  qualificationStatus: z.enum([
    'planning_qualified',
    'internal_execution_qualified',
    'production_qualified',
  ]),
  observedAt: z.string().datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  if (value.authorizedRangeHash !== hashSkillValue(value.authorizedRange)) {
    context.addIssue({ code: 'custom', message: 'Track All preflight range hash is stale.' })
  }
  if (value.candidateFrames.some((candidate) =>
    candidate.frameIndex < value.authorizedRange.startFrameInclusive ||
    candidate.frameIndex >= value.authorizedRange.endFrameExclusive)) {
    context.addIssue({ code: 'custom', message: 'Track All preflight candidate exceeds the authorized range.' })
  }
})

export const trackAllPreflightObservationSchema =
  preflightObservationCoreSchema.extend({ observationHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { observationHash, ...core } = value
      if (hashSkillValue(core) !== observationHash) context.addIssue({
        code: 'custom', message: 'Track All preflight observation is stale or forged.',
      })
    })

export type TrackAllPreflightObservation = z.infer<
  typeof trackAllPreflightObservationSchema
>

export function createTrackAllPreflightObservation(
  input: z.input<typeof preflightObservationCoreSchema>,
): TrackAllPreflightObservation {
  const core = preflightObservationCoreSchema.parse(input)
  return deepFreezeSkillValue(trackAllPreflightObservationSchema.parse({
    ...core,
    observationHash: hashSkillValue(core),
  }))
}

const runtimeProfileCoreSchema = z.object({
  schemaVersion: z.literal('track_all_sam3_1_runtime_profile_v2'),
  operationId: z.literal(TRACK_ALL_SAM_OPERATION_V2),
  sourceRevision: z.literal('96914d2425f90a64f45ca977c2b5165418099543'),
  checkpointRevision: z.literal('daa63191845a41281374e725f4c9e51c7a824460'),
  runtimeImage: z.object({
    candidateImage: z.literal('pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca'),
    candidateBuildTarget: z.literal(
      TRACK_ALL_SAM31_REAL_PRIVATE_DOCKER_TARGET,
    ),
    immutableImageQualified: z.boolean(),
    immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u)
      .nullable(),
  }).strict(),
  realPrivateRuntime: z.object({
    workerProtocolVersion: z.literal(
      TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION,
    ),
    sessionOwnerVersion: z.literal(
      TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_OWNER_VERSION,
    ),
    runtimeAuthorityHash: z.literal(
      TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY.authorityHash,
    ),
    callerSelectedExecutableAccepted: z.literal(false),
    actualExecutionRequiresAllRouteGates: z.literal(true),
  }).strict(),
  maximumFramesPerSession: z.number().int().positive().max(10_000),
  supportedFps: z.array(z.union([
    z.literal(24), z.literal(25), z.literal(30), z.literal(50), z.literal(60),
  ])).min(1).max(5),
  maximumObjectsPerBucket: z.number().int().positive().max(128),
  maximumBucketsPerSession: z.number().int().positive().max(8),
  maximumBucketsPerPlan: z.number().int().positive().max(8),
  propagationModes: z.tuple([
    z.literal('forward'), z.literal('backward'), z.literal('bidirectional'),
  ]),
  promptModes: z.tuple([
    z.literal('text_concept'), z.literal('positive_points'),
    z.literal('negative_points'), z.literal('bounding_box'),
  ]),
  refinementModes: z.tuple([
    z.literal('positive_points'), z.literal('negative_points'),
    z.literal('bounding_box'), z.literal('object_removal'),
  ]),
  gpuRoutes: z.tuple([
    z.object({
      routeKey: z.literal('quality_a100_80gb_user_triggered_heavy_job_v1'),
      accelerator: z.literal('nvidia_a100_80gb'),
      memoryGiB: z.literal(80),
      role: z.literal('primary'),
      qualificationStatus: z.enum(['blocked', 'internal_execution_qualified', 'production_qualified']),
    }).strict(),
    z.object({
      routeKey: z.literal('quality_l4_user_triggered_heavy_fallback_job_v1'),
      accelerator: z.literal('nvidia_l4'),
      memoryGiB: z.literal(24),
      role: z.literal('classified_fallback'),
      qualificationStatus: z.enum(['blocked', 'internal_execution_qualified', 'production_qualified']),
    }).strict(),
  ]),
  memoryAdmission: z.object({
    oneWriterPerSession: z.literal(true),
    cpuFallbackAllowed: z.literal(false),
    sourceResolutionReductionAllowed: z.literal(false),
  }).strict(),
  sessionTimeoutSeconds: z.number().int().min(60).max(7_200),
  output: z.object({
    artifactType: z.literal('track_mask_chunk_manifest_v1'),
    privateCreateOnly: z.literal(true),
    publicMaskOutputAllowed: z.literal(false),
  }).strict(),
  qualification: z.object({
    environmentClass: z.enum(['internal_fixture', 'canonical_private', 'production_server']),
    status: z.enum(['blocked', 'planning_qualified', 'internal_execution_qualified', 'production_qualified']),
    routeReceiptHash: skillSha256Schema,
    routeGateReportHash: skillSha256Schema,
    internalExecutionAuthorized: z.boolean(),
    productionExecutionAuthorized: z.boolean(),
    missingGateKeys: z.array(z.enum(TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS)).max(
      TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS.length,
    ),
  }).strict(),
}).strict().superRefine((value, context) => {
  const executable = value.qualification.status === 'internal_execution_qualified' ||
    value.qualification.status === 'production_qualified'
  if (value.qualification.internalExecutionAuthorized !== executable) {
    context.addIssue({ code: 'custom', message: 'SAM profile execution authority contradicts route qualification.' })
  }
  if ((value.qualification.status === 'blocked') !== (value.qualification.missingGateKeys.length > 0)) {
    context.addIssue({ code: 'custom', message: 'SAM profile blocked gates are incoherent.' })
  }
  if (value.runtimeImage.immutableImageQualified !==
    (value.runtimeImage.immutableImageDigest !== null)) {
    context.addIssue({
      code: 'custom', message: 'SAM profile immutable image evidence is incoherent.',
    })
  }
})

export const trackAllSam31RuntimeProfileV2Schema =
  runtimeProfileCoreSchema.extend({ profileHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { profileHash, ...core } = value
      if (hashSkillValue(core) !== profileHash) context.addIssue({
        code: 'custom', message: 'Track All SAM runtime profile is stale or forged.',
      })
    })

export type TrackAllSam31RuntimeProfileV2 = z.infer<
  typeof trackAllSam31RuntimeProfileV2Schema
>

export function createTrackAllSam31RuntimeProfileV2(input: {
  routeReceipt: SkillRouteQualificationReceipt
  routeGateReport: TrackAllSam31V2RouteGateReport
}): TrackAllSam31RuntimeProfileV2 {
  const gate = trackAllSam31V2RouteGateReportSchema.parse(input.routeGateReport)
  if (input.routeReceipt.routeKey !== 'sam3_1_masklet_route') {
    throw new Error('Track All SAM profile requires the exact SAM route receipt.')
  }
  const receiptExecutable = input.routeReceipt.qualificationStatus ===
      'internal_execution_qualified' ||
    input.routeReceipt.qualificationStatus === 'production_qualified'
  const realExecutionAuthorized = receiptExecutable &&
    gate.internalExecutionAuthorized &&
    !input.routeReceipt.fixtureEvidenceOnly &&
    !input.routeReceipt.qualificationCandidateOnly
  const status = realExecutionAuthorized
    ? input.routeReceipt.qualificationStatus
    : 'blocked' as const
  const missingGateKeys = status === 'blocked'
    ? gate.findings.filter((finding) => finding.disposition === 'blocked')
      .map((finding) => finding.gateKey)
    : []
  const core = runtimeProfileCoreSchema.parse({
    schemaVersion: 'track_all_sam3_1_runtime_profile_v2',
    operationId: TRACK_ALL_SAM_OPERATION_V2,
    sourceRevision: gate.sourceRevision,
    checkpointRevision: gate.checkpointRevision,
    runtimeImage: {
      candidateImage: 'pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
      candidateBuildTarget: TRACK_ALL_SAM31_REAL_PRIVATE_DOCKER_TARGET,
      immutableImageQualified: gate.findings.some((finding) =>
        finding.gateKey === 'immutable_signed_runtime_image' && finding.disposition === 'passed'),
      immutableImageDigest: gate.runtimeImageDigest,
    },
    realPrivateRuntime: {
      workerProtocolVersion:
        TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION,
      sessionOwnerVersion:
        TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_OWNER_VERSION,
      runtimeAuthorityHash:
        TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY.authorityHash,
      callerSelectedExecutableAccepted: false,
      actualExecutionRequiresAllRouteGates: true,
    },
    maximumFramesPerSession: TRACK_ALL_SAM31_V2_MAXIMUM_FRAMES_PER_SESSION,
    supportedFps: [24, 25, 30, 50, 60],
    maximumObjectsPerBucket: TRACK_ALL_SAM31_V2_MAXIMUM_OBJECTS_PER_BUCKET,
    maximumBucketsPerSession: TRACK_ALL_SAM31_V2_MAXIMUM_BUCKETS_PER_SESSION,
    maximumBucketsPerPlan: 8,
    propagationModes: ['forward', 'backward', 'bidirectional'],
    promptModes: ['text_concept', 'positive_points', 'negative_points', 'bounding_box'],
    refinementModes: ['positive_points', 'negative_points', 'bounding_box', 'object_removal'],
    gpuRoutes: [
      {
        routeKey: 'quality_a100_80gb_user_triggered_heavy_job_v1',
        accelerator: 'nvidia_a100_80gb', memoryGiB: 80, role: 'primary',
        qualificationStatus: gate.actualA100InferenceObserved ? 'internal_execution_qualified' : 'blocked',
      },
      {
        routeKey: 'quality_l4_user_triggered_heavy_fallback_job_v1',
        accelerator: 'nvidia_l4', memoryGiB: 24, role: 'classified_fallback',
        qualificationStatus: gate.actualL4InferenceObserved ? 'internal_execution_qualified' : 'blocked',
      },
    ],
    memoryAdmission: {
      oneWriterPerSession: true,
      cpuFallbackAllowed: false,
      sourceResolutionReductionAllowed: false,
    },
    sessionTimeoutSeconds: 1_800,
    output: {
      artifactType: 'track_mask_chunk_manifest_v1',
      privateCreateOnly: true,
      publicMaskOutputAllowed: false,
    },
    qualification: {
      environmentClass: input.routeReceipt.environmentClass,
      status,
      routeReceiptHash: input.routeReceipt.receiptHash,
      routeGateReportHash: gate.reportHash,
      internalExecutionAuthorized: realExecutionAuthorized,
      productionExecutionAuthorized: realExecutionAuthorized &&
        input.routeReceipt.qualificationStatus === 'production_qualified' &&
        gate.productionExecutionAuthorized,
      missingGateKeys,
    },
  })
  return deepFreezeSkillValue(trackAllSam31RuntimeProfileV2Schema.parse({
    ...core,
    profileHash: hashSkillValue(core),
  }))
}
