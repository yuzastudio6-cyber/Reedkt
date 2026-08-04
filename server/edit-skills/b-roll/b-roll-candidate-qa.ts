import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { z } from 'zod'

import {
  persistCanonicalPrivateMediaArtifact,
} from '../../services/canonical-private-media-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../../services/private-edit-authority-store'
import {
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  OFFLINE_EXACT_SOURCE_FRAME_PNG_PROFILE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest,
  type OfflineFfmpegExecutionResult,
  type OfflineFfprobeExecutionResult,
  type OfflineMediaBinaryServerInjectedInput,
  type OfflineVisualCalibrationObjectiveQaExecutionResult,
  type PrivateOfflineMediaBinaryRuntime,
} from '../../tool-execution/media-binary-execution'
import {
  brollProviderRequestPackageV5Schema,
  type BrollProviderRequestPackageV5,
} from '../../providers/google/gemini-omni-broll/b-roll-provider-authority-v5'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillFrameRangeSchema } from '../core/skill-assignment-schema'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../core/skill-capability-manifest-schema'
import {
  brollCandidateAttemptEvidenceSchema,
  type BrollCandidateAttemptEvidence,
} from './b-roll-candidate-attempt'
import {
  brollPlanArtifactSchema,
  brollPlanCoreSchema,
  brollPlanningContextCoreSchema,
  brollPlanningContextSchema,
  brollSkillAssignmentSchema,
  brollAssignmentCoreSchema,
} from './b-roll-schemas'
import type {
  BrollPlanArtifact,
  BrollPlanningContext,
  BrollSkillAssignment,
} from './b-roll-contracts'
import {
  brollCandidateRefinementAuthoritySchema,
  type BrollCandidateRefinementAuthority,
} from './mini-skills/refinement-director'
import {
  brollCandidateQaDecisionSchema,
  brollCandidateVerdictSchema,
  brollSemanticVisualObservationSchema,
  directBrollCandidateQa,
  type BrollSemanticVisualObservation,
} from './mini-skills/candidate-qa-director'

const blobRefSchema = z.object({
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict()

const mediaRefSchema = z.object({
  privateObjectIdentityHash: skillSha256Schema,
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(67_108_864),
  mimeType: z.enum(['video/mp4', 'video/x-nut']),
  frameCount: z.number().int().positive().max(240),
  frameRate: z.literal(24),
  width: z.number().int().positive().max(4_096),
  height: z.number().int().positive().max(4_096),
  audioRemoved: z.boolean(),
}).strict()

const outputQaChecksSchema = z.object({
  validMp4: z.boolean(),
  decodableStreams: z.boolean(),
  duration: z.boolean(),
  frameRate: z.boolean(),
  resolution: z.boolean(),
  notTruncated: z.boolean(),
  notFrozenOrBlack: z.boolean(),
  semanticAlignment: z.boolean(),
  generatedVisualIntegrity: z.boolean(),
  subjectObjectConsistency: z.boolean(),
  plausibleMotion: z.boolean(),
  cameraIntent: z.boolean(),
  cropSafety: z.boolean(),
  noProofMisrepresentation: z.boolean(),
  contentSafety: z.boolean(),
  audioDisposition: z.boolean(),
  privateArtifactIntegrity: z.boolean(),
}).strict()

const qaReportCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_qa_report_v1'),
  candidateSetId: skillSha256Schema,
  candidateVersionId: skillSha256Schema,
  versionNumber: z.union([z.literal(1), z.literal(2)]),
  manifestRef: skillManifestReferenceSchema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  conceptKey: z.string().trim().min(1).max(180),
  authorizedRange: skillFrameRangeSchema,
  attemptId: skillSha256Schema,
  rawCandidateSha256: skillSha256Schema,
  normalizedCandidateSha256: skillSha256Schema,
  technicalInspectionRef: blobRefSchema,
  technicalInspectionHash: skillSha256Schema,
  objectiveQaRef: blobRefSchema,
  objectiveQaHash: skillSha256Schema,
  semanticObservationRef: blobRefSchema,
  semanticObservationHash: skillSha256Schema,
  checks: outputQaChecksSchema,
  verdict: brollCandidateVerdictSchema,
  decision: brollCandidateQaDecisionSchema,
  generatedMediaTreatedAsVerifiedProof: z.literal(false),
  generatedAudioFinalMixAllowed: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
  privateInternalOnly: z.literal(true),
  productionQualifiedSemanticQa: z.literal(false),
  evaluatedAt: z.string().datetime({ offset: true }),
}).strict()

export const brollCandidateQaReportSchema = qaReportCoreSchema.extend({
  qaReportHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { qaReportHash, ...core } = value
  if (hashSkillValue(core) !== qaReportHash ||
      value.verdict !== value.decision.verdict) {
    context.addIssue({ code: 'custom', message: 'B-roll candidate QA report is invalid.' })
  }
})

export type BrollCandidateQaReport = z.infer<typeof brollCandidateQaReportSchema>

const candidateVersionCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_candidate_version_v1'),
  candidateSetId: skillSha256Schema,
  candidateVersionId: skillSha256Schema,
  versionNumber: z.union([z.literal(1), z.literal(2)]),
  priorCandidateVersionRef: blobRefSchema.nullable(),
  priorCandidateVersionHash: skillSha256Schema.nullable(),
  refinementAuthorityHash: skillSha256Schema.nullable(),
  manifestRef: skillManifestReferenceSchema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  conceptKey: z.string().trim().min(1).max(180),
  authorizedRange: skillFrameRangeSchema,
  requestPackageHash: skillSha256Schema,
  nativeAspectRatio: z.enum(['16:9', '9:16']),
  durationSeconds: z.number().int().min(3).max(10),
  attemptId: skillSha256Schema,
  attemptEvidenceHash: skillSha256Schema,
  attemptCostEvidenceHash: skillSha256Schema,
  rawCandidate: mediaRefSchema,
  normalizedCandidate: mediaRefSchema,
  qaReportRef: blobRefSchema,
  qaReportHash: skillSha256Schema,
  verdict: brollCandidateVerdictSchema,
  audioDisposition: z.enum([
    'discard',
    'retain_as_ambient_candidate',
    'extract_for_sound_skill_review',
    'retain_source_audio',
  ]),
  generatedAudioFinalMixAllowed: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
  immutable: z.literal(true),
  createdAt: z.string().datetime({ offset: true }),
}).strict()

export const brollCandidateVersionSchema = candidateVersionCoreSchema.extend({
  candidateVersionHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { candidateVersionHash, ...core } = value
  const priorPresent = Boolean(value.priorCandidateVersionRef)
  if (
    hashSkillValue(core) !== candidateVersionHash ||
    priorPresent !== Boolean(value.priorCandidateVersionHash) ||
    priorPresent !== Boolean(value.refinementAuthorityHash) ||
    (value.versionNumber === 1) === priorPresent
  ) context.addIssue({ code: 'custom', message: 'B-roll candidate version is invalid.' })
})

export type BrollCandidateVersion = z.infer<typeof brollCandidateVersionSchema>

const persistedVersionSchema = z.object({
  version: brollCandidateVersionSchema,
  versionRef: blobRefSchema,
  qaReport: brollCandidateQaReportSchema,
  qaReportRef: blobRefSchema,
}).strict()

export interface BrollCandidateQaExecutionInput {
  localStorageRoot: string
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  plan: BrollPlanArtifact
  requestPackage: BrollProviderRequestPackageV5
  attemptEvidence: BrollCandidateAttemptEvidence
  candidateBytes: Buffer | Uint8Array
  semanticObservation: BrollSemanticVisualObservation
  mediaRuntime: Pick<
    PrivateOfflineMediaBinaryRuntime,
    'executeServerInjected' | 'executeVisualCalibrationObjectiveQaServerInjected'
  >
  refinementAuthority?: BrollCandidateRefinementAuthority
  now?: () => string
}

export async function executeBrollCandidateQa(input: BrollCandidateQaExecutionInput): Promise<{
  version: BrollCandidateVersion
  versionRef: AuthorityJsonBlobRef
  qaReport: BrollCandidateQaReport
  qaReportRef: AuthorityJsonBlobRef
  replayed: boolean
}> {
  const authority = validateAuthority(input)
  const { assignment, context, plan, request, attempt, observation, candidateBytes } = authority
  const versionNumber = attempt.candidateVersionNumber
  const candidateSetId = hashSkillValue({
    domain: 'reeditpro:b-roll-candidate-set:v1',
    manifestRef: assignment.manifestRef,
    assignmentHash: assignment.assignmentHash,
    planHash: plan.planHash,
    conceptKey: plan.shotSpecification!.conceptKey,
    authorizedRange: assignment.writeRangeAuthority.authorizedRange,
  })
  const candidateVersionId = hashSkillValue({
    domain: 'reeditpro:b-roll-candidate-version:v1',
    candidateSetId,
    versionNumber,
    attemptId: attempt.attemptId,
    rawCandidateSha256: attempt.output.sha256,
  })
  const indexPath =
    `b-roll/candidate-qa/sets/${candidateSetId}/version-${versionNumber}.json`
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: `b-roll/candidate-qa/locks/${candidateSetId}-v${versionNumber}.lock`,
    operation: async () => {
      const existing = await readPersistedVersion(input.localStorageRoot, indexPath)
      if (existing) {
        if (
          existing.version.candidateVersionId !== candidateVersionId ||
          existing.version.rawCandidate.sha256 !== attempt.output.sha256 ||
          existing.qaReport.semanticObservationHash !== observation.observationHash
        ) throw new Error('B-roll candidate QA replay attempted to substitute immutable evidence.')
        return { ...existing, replayed: true }
      }
      const prior = versionNumber === 2
        ? await validateRefinementLineage({
            localStorageRoot: input.localStorageRoot,
            candidateSetId,
            assignment,
            plan,
            request,
            attempt,
            refinementAuthority: input.refinementAuthority,
            now: input.now,
          })
        : undefined
      const source = injectedSource(candidateBytes)
      const inspection = await input.mediaRuntime.executeServerInjected(
        {
          schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
          toolId: 'ffprobe',
          operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
          payload: {
            inspectionProfileId: 'source_intake_v1',
            countFrames: true,
            verifyDurationAndSync: true,
            emitMachineJsonOnly: true,
            mimeType: 'video/mp4',
            sourceByteLength: candidateBytes.byteLength,
            sourceSha256: attempt.output.sha256,
            sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
          },
        },
        source,
      )
      const expectedFrameCount = request.output.durationSeconds * 24
      const firstFrame = await extractCandidateFrame({
        runtime: input.mediaRuntime,
        source,
        candidateSetId,
        candidateVersionId,
        sourceFrameIndex: 0,
        masterFrameIndex: request.authorizedRange.startFrameInclusive,
      })
      const lastFrame = await extractCandidateFrame({
        runtime: input.mediaRuntime,
        source,
        candidateSetId,
        candidateVersionId,
        sourceFrameIndex: expectedFrameCount - 1,
        masterFrameIndex: request.authorizedRange.endFrameExclusive - 1,
      })
      const objectiveRequest = buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest({
        sourceProviderOperationId: 'provider.google.generate_b_roll_candidate.v1',
        sourceProviderOutputRole: 'provider_b_roll_candidate_video_mp4',
        visualCalibrationContextDigest: hashSkillValue({
          shotSpecification: plan.shotSpecification,
          authorizedRange: request.authorizedRange,
        }),
        scenarioKind: 'style_led_motion',
        candidate: {
          byteLength: candidateBytes.byteLength,
          sha256: attempt.output.sha256,
          privateObjectIdentityHash: attempt.output.privateObjectIdentityHash,
        },
        firstFrame: frameCommitment(firstFrame, `${candidateVersionId}-first`),
        lastFrame: frameCommitment(lastFrame, `${candidateVersionId}-last`),
      })
      const objective = await input.mediaRuntime.executeVisualCalibrationObjectiveQaServerInjected(
        objectiveRequest,
        {
          candidate: source,
          firstFrame: injectedSource(firstFrame.resultArtifact.bytes),
          lastFrame: injectedSource(lastFrame.resultArtifact.bytes),
        },
      )
      const normalized = await input.mediaRuntime.executeServerInjected(
        {
          schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
          toolId: 'ffmpeg',
          operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
          payload: {
            recipeProfileId: 'approved_trim_transcode_v1',
            timestampPolicy: 'normalize_from_zero',
            overwriteExistingArtifact: false,
            allowUnreviewedCodec: false,
            trimStartFrame: 0,
            trimEndFrameExclusive: expectedFrameCount,
            frameRate: 24,
            mimeType: 'video/mp4',
            sourceByteLength: candidateBytes.byteLength,
            sourceSha256: attempt.output.sha256,
            sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
          },
        },
        source,
      )
      if (!('resultArtifact' in normalized) ||
          !('bytes' in normalized.resultArtifact) ||
          normalized.resultArtifact.mimeType !== 'video/x-nut') {
        throw new Error('B-roll candidate normalization returned the wrong private artifact.')
      }
      const mediaFacts = deriveMediaFacts({
        inspection,
        objective,
        normalized,
        request,
        candidateBytes,
        candidateSha256: attempt.output.sha256,
      })
      const normalizedIdentity = hashSkillValue({
        domain: 'reeditpro:b-roll-normalized-generated-candidate:v1',
        candidateVersionId,
        normalizedSha256: normalized.resultArtifact.sha256,
      })
      await persistCanonicalPrivateMediaArtifact({
        localStorageRoot: input.localStorageRoot,
        privateObjectIdentityHash: normalizedIdentity,
        bytes: normalized.resultArtifact.bytes,
        expectedSha256: normalized.resultArtifact.sha256,
      })
      const technicalInspection = hashedArtifact({
        schemaVersion: 'b_roll_candidate_technical_inspection_v1',
        candidateSetId,
        candidateVersionId,
        rawCandidateSha256: attempt.output.sha256,
        ffprobeRequestHash: inspection.evidence.requestEnvelopeSha256,
        ffprobeResultHash: inspection.resultJson.sha256,
        ffmpegNormalizationRequestHash: normalized.evidence.requestEnvelopeSha256,
        normalizedCandidateSha256: normalized.resultArtifact.sha256,
        binaryVersion: inspection.evidence.binaryVersion,
        mediaFacts,
        privateInternalOnly: true,
      }, 'technicalInspectionHash')
      const objectiveDocument = objective.resultJson.document
      const objectiveEvidence = hashedArtifact({
        schemaVersion: 'b_roll_candidate_objective_qa_evidence_v1',
        candidateSetId,
        candidateVersionId,
        requestHash: objective.evidence.requestEnvelopeSha256,
        resultHash: objective.resultJson.sha256,
        attestationHash: objective.attestation.attestationHash,
        document: objectiveDocument,
        networkMode: objective.evidence.confinement.networkMode,
        readOnlyRootFilesystem: objective.evidence.confinement.readOnlyRootFilesystem,
        privateInternalOnly: true,
      }, 'objectiveQaHash')
      const [technicalInspectionRef, objectiveQaRef, semanticObservationRef] =
        await Promise.all([
          persistJson(input.localStorageRoot, technicalInspection),
          persistJson(input.localStorageRoot, objectiveEvidence),
          persistJson(input.localStorageRoot, observation),
        ])
      const fallbackExistingSourceAvailable = context.sourceCandidates.some((candidate) =>
        ['existing_project_clip', 'approved_user_asset'].includes(candidate.sourceType) &&
        candidate.provenanceVerified && candidate.rightsApproved &&
        candidate.privacyApproved && candidate.proofSafe && candidate.approvedByUser)
      const decision = directBrollCandidateQa({
        versionNumber,
        maximumRefinements: 1,
        refinementCount: (versionNumber - 1) as 0 | 1,
        technical: mediaFacts.checks,
        semantic: observation,
        audioDisposition: plan.audioDisposition,
        generatedAudioFinalMixAllowed: false,
        fallbackExistingSourceAvailable,
      })
      const qaCore = qaReportCoreSchema.parse({
        schemaVersion: 'b_roll_qa_report_v1',
        candidateSetId,
        candidateVersionId,
        versionNumber,
        manifestRef: assignment.manifestRef,
        assignmentId: assignment.assignmentId,
        assignmentHash: assignment.assignmentHash,
        planHash: plan.planHash,
        conceptKey: plan.shotSpecification!.conceptKey,
        authorizedRange: assignment.writeRangeAuthority.authorizedRange,
        attemptId: attempt.attemptId,
        rawCandidateSha256: attempt.output.sha256,
        normalizedCandidateSha256: normalized.resultArtifact.sha256,
        technicalInspectionRef,
        technicalInspectionHash: technicalInspection.technicalInspectionHash,
        objectiveQaRef,
        objectiveQaHash: objectiveEvidence.objectiveQaHash,
        semanticObservationRef,
        semanticObservationHash: observation.observationHash,
        checks: {
          validMp4: mediaFacts.checks.validMp4Container,
          decodableStreams: mediaFacts.checks.decodableStreams,
          duration: mediaFacts.checks.durationMatches,
          frameRate: mediaFacts.checks.frameRateMatches,
          resolution: mediaFacts.checks.resolutionMatches,
          notTruncated: mediaFacts.checks.notTruncated,
          notFrozenOrBlack: mediaFacts.checks.notFrozenOrBlack,
          ...observation.checks,
          audioDisposition: validAudioDisposition(plan),
          privateArtifactIntegrity: mediaFacts.checks.privateArtifactIntegrity,
        },
        verdict: decision.verdict,
        decision,
        generatedMediaTreatedAsVerifiedProof: false,
        generatedAudioFinalMixAllowed: false,
        automaticSelectionAllowed: false,
        outsideAuthorizedRangeModified: false,
        privateInternalOnly: true,
        productionQualifiedSemanticQa: false,
        evaluatedAt: (input.now ?? (() => new Date().toISOString()))(),
      })
      const qaReport = brollCandidateQaReportSchema.parse({
        ...qaCore,
        qaReportHash: hashSkillValue(qaCore),
      })
      const qaReportRef = await persistJson(input.localStorageRoot, qaReport)
      const versionCore = candidateVersionCoreSchema.parse({
        schemaVersion: 'b_roll_candidate_version_v1',
        candidateSetId,
        candidateVersionId,
        versionNumber,
        priorCandidateVersionRef: prior?.versionRef ?? null,
        priorCandidateVersionHash: prior?.version.candidateVersionHash ?? null,
        refinementAuthorityHash: input.refinementAuthority?.refinementAuthorityHash ?? null,
        manifestRef: assignment.manifestRef,
        assignmentId: assignment.assignmentId,
        assignmentHash: assignment.assignmentHash,
        planHash: plan.planHash,
        conceptKey: plan.shotSpecification!.conceptKey,
        authorizedRange: assignment.writeRangeAuthority.authorizedRange,
        requestPackageHash: request.requestPackageHash,
        nativeAspectRatio: request.output.aspectRatio,
        durationSeconds: request.output.durationSeconds,
        attemptId: attempt.attemptId,
        attemptEvidenceHash: attempt.attemptEvidenceHash,
        attemptCostEvidenceHash: attempt.cost.costEvidenceHash,
        rawCandidate: {
          privateObjectIdentityHash: attempt.output.privateObjectIdentityHash,
          sha256: attempt.output.sha256,
          byteLength: attempt.output.byteLength,
          mimeType: 'video/mp4',
          frameCount: mediaFacts.frameCount,
          frameRate: 24,
          width: mediaFacts.width,
          height: mediaFacts.height,
          audioRemoved: false,
        },
        normalizedCandidate: {
          privateObjectIdentityHash: normalizedIdentity,
          sha256: normalized.resultArtifact.sha256,
          byteLength: normalized.resultArtifact.byteLength,
          mimeType: 'video/x-nut',
          frameCount: expectedFrameCount,
          frameRate: 24,
          width: mediaFacts.width,
          height: mediaFacts.height,
          audioRemoved: true,
        },
        qaReportRef,
        qaReportHash: qaReport.qaReportHash,
        verdict: decision.verdict,
        audioDisposition: plan.audioDisposition,
        generatedAudioFinalMixAllowed: false,
        automaticSelectionAllowed: false,
        outsideAuthorizedRangeModified: false,
        immutable: true,
        createdAt: qaReport.evaluatedAt,
      })
      const version = brollCandidateVersionSchema.parse({
        ...versionCore,
        candidateVersionHash: hashSkillValue(versionCore),
      })
      const versionRef = await persistJson(input.localStorageRoot, version)
      const stored = persistedVersionSchema.parse({
        version,
        versionRef,
        qaReport,
        qaReportRef,
      })
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: indexPath,
        content: Buffer.from(`${stableAuthorityStringify(stored)}\n`, 'utf8'),
      })
      return { ...stored, replayed: false }
    },
  })
}

function validateAuthority(input: BrollCandidateQaExecutionInput) {
  const assignment = brollSkillAssignmentSchema.parse(input.assignment)
  const context = brollPlanningContextSchema.parse(input.context)
  const plan = brollPlanArtifactSchema.parse(input.plan)
  const request = brollProviderRequestPackageV5Schema.parse(input.requestPackage)
  const attempt = brollCandidateAttemptEvidenceSchema.parse(input.attemptEvidence)
  const observation = brollSemanticVisualObservationSchema.parse(input.semanticObservation)
  const candidateBytes = Buffer.isBuffer(input.candidateBytes)
    ? input.candidateBytes
    : Buffer.from(input.candidateBytes)
  const { assignmentHash, ...assignmentCore } = assignment
  const { contextHash, ...contextCore } = context
  const { planHash, ...planCore } = plan
  const shot = plan.shotSpecification
  const expectedFrames = request.output.durationSeconds * 24
  const expectedRangeFrames = request.authorizedRange.endFrameExclusive -
    request.authorizedRange.startFrameInclusive
  if (
    hashSkillValue(brollAssignmentCoreSchema.parse(assignmentCore)) !== assignmentHash ||
    hashSkillValue(brollPlanningContextCoreSchema.parse(contextCore)) !== contextHash ||
    hashSkillValue(brollPlanCoreSchema.parse(planCore)) !== planHash ||
    context.assignmentId !== assignment.assignmentId ||
    context.ownerUserId !== assignment.ownerUserId ||
    context.workspaceId !== assignment.workspaceId ||
    context.projectId !== assignment.projectId ||
    !shot || !plan.providerRequestPlanned ||
    !['generate_with_gemini_omni', 'edit_uploaded_video_with_gemini_omni'].includes(plan.decision) ||
    request.assignmentId !== assignment.assignmentId ||
    request.assignmentHash !== assignmentHash || request.planHash !== planHash ||
    hashSkillValue(request.authorizedRange) !==
      hashSkillValue(assignment.writeRangeAuthority.authorizedRange) ||
    expectedRangeFrames !== expectedFrames || shot.durationFrames !== expectedFrames ||
    shot.durationSeconds !== request.output.durationSeconds || request.authorizedRange.fps !== 24 ||
    attempt.requestPackageHash !== request.requestPackageHash ||
    attempt.assignmentHash !== assignmentHash || attempt.planHash !== planHash ||
    candidateBytes.byteLength !== attempt.output.byteLength ||
    sha256(candidateBytes) !== attempt.output.sha256 ||
    observation.candidateSha256 !== attempt.output.sha256 ||
    observation.assignmentHash !== assignmentHash || observation.planHash !== planHash ||
    observation.conceptKey !== shot.conceptKey ||
    observation.authorizedRangeHash !== hashSkillValue(request.authorizedRange) ||
    attempt.output.automaticSelectionAllowed || attempt.output.timelineMutationAllowed ||
    !attempt.output.checksumReadbackVerified
  ) throw new Error('B-roll candidate QA authority or immutable media lineage is invalid.')
  return { assignment, context, plan, request, attempt, observation, candidateBytes }
}

async function validateRefinementLineage(input: {
  localStorageRoot: string
  candidateSetId: string
  assignment: BrollSkillAssignment
  plan: BrollPlanArtifact
  request: BrollProviderRequestPackageV5
  attempt: BrollCandidateAttemptEvidence
  refinementAuthority?: BrollCandidateRefinementAuthority
  now?: () => string
}): Promise<z.infer<typeof persistedVersionSchema>> {
  const authority = brollCandidateRefinementAuthoritySchema.parse(input.refinementAuthority)
  const prior = await readPersistedVersion(
    input.localStorageRoot,
    `b-roll/candidate-qa/sets/${input.candidateSetId}/version-1.json`,
  )
  const now = (input.now ?? (() => new Date().toISOString()))()
  if (
    !prior || authority.candidateSetId !== input.candidateSetId ||
    authority.priorCandidateVersionId !== prior.version.candidateVersionId ||
    authority.priorCandidateVersionHash !== prior.version.candidateVersionHash ||
    authority.priorCandidateVersionRef.sha256 !== prior.versionRef.sha256 ||
    authority.priorQaReportHash !== prior.qaReport.qaReportHash ||
    authority.priorQaReportRef.sha256 !== prior.qaReportRef.sha256 ||
    authority.initialRequestPackageHash !== input.request.requestPackageHash ||
    authority.assignmentHash !== input.assignment.assignmentHash ||
    authority.planHash !== input.plan.planHash ||
    authority.conceptKey !== input.plan.shotSpecification!.conceptKey ||
    authority.previousInteractionIdDigest !== input.attempt.interactionIdDigest ||
    input.attempt.attemptClass !== 'refinement_injected_nonprovider' ||
    input.attempt.authorizationHash !== authority.refinementAuthorityHash ||
    Date.parse(now) < Date.parse(authority.issuedAt) ||
    Date.parse(now) >= Date.parse(authority.expiresAt)
  ) throw new Error('B-roll refinement candidate lost prior version, QA, or attempt authority.')
  return prior
}

async function extractCandidateFrame(input: {
  runtime: BrollCandidateQaExecutionInput['mediaRuntime']
  source: OfflineMediaBinaryServerInjectedInput
  candidateSetId: string
  candidateVersionId: string
  sourceFrameIndex: number
  masterFrameIndex: number
}): Promise<ExactCandidateFrameResult> {
  const selectionHash = hashSkillValue({
    candidateSetId: input.candidateSetId,
    candidateVersionId: input.candidateVersionId,
    sourceFrameIndex: input.sourceFrameIndex,
    masterFrameIndex: input.masterFrameIndex,
    frameRate: 24,
  })
  const result = await input.runtime.executeServerInjected({
    schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: {
      recipeProfileId: OFFLINE_EXACT_SOURCE_FRAME_PNG_PROFILE,
      timestampPolicy: 'select_exact_decoded_source_frame',
      overwriteExistingArtifact: false,
      allowUnreviewedCodec: false,
      sourceSequenceItemId: `broll-${input.candidateSetId.slice(0, 20)}`,
      sourceCleanupDecisionId: `broll-qa-${input.candidateVersionId.slice(0, 20)}`,
      masterFrameIndex: input.masterFrameIndex,
      sourceFrameIndex: input.sourceFrameIndex,
      frameRate: 24,
      sourceFrameSelectionDigestSha256: selectionHash,
      frameSelectionPolicy: 'approved_source_frame_ordinal_v1',
      outputContainer: 'png',
      outputCodec: 'png',
      outputPixelFormat: 'rgba',
      metadataPolicy: 'strip_all',
      preserveAudio: false,
      maximumWidth: 4096,
      maximumHeight: 4096,
      maximumPixelCount: 16_777_216,
      maximumOutputBytes: 16_777_216,
      mimeType: 'video/mp4',
      sourceByteLength: input.source.byteLength,
      sourceSha256: input.source.sha256,
      sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
    },
  }, input.source)
  if (!('resultArtifact' in result) || !('bytes' in result.resultArtifact) ||
      result.resultArtifact.mimeType !== 'image/png') {
    throw new Error('B-roll exact candidate frame extraction failed.')
  }
  return result as ExactCandidateFrameResult
}

type ExactCandidateFrameResult = OfflineFfmpegExecutionResult & {
  resultArtifact: OfflineFfmpegExecutionResult['resultArtifact'] & {
    mimeType: 'image/png'
    bytes: Buffer
    sha256: string
    byteLength: number
  }
}

function deriveMediaFacts(input: {
  inspection: OfflineFfprobeExecutionResult
  objective: OfflineVisualCalibrationObjectiveQaExecutionResult
  normalized: OfflineFfmpegExecutionResult
  request: BrollProviderRequestPackageV5
  candidateBytes: Buffer
  candidateSha256: string
}) {
  const document = input.inspection.resultJson.document as Record<string, unknown>
  const streams = Array.isArray(document.streams)
    ? document.streams as Array<Record<string, unknown>>
    : []
  const video = streams.find((stream) => stream.codecType === 'video') ?? {}
  const objective = input.objective.resultJson.document as Record<string, unknown>
  const semantic = input.normalized.evidence.semanticEvidence
  const expectedFrames = input.request.output.durationSeconds * 24
  const expectedWidth = input.request.output.aspectRatio === '16:9' ? 1280 : 720
  const expectedHeight = input.request.output.aspectRatio === '16:9' ? 720 : 1280
  const frameCount = numberFact(video.readFrameCount) ?? numberFact(objective.frameCount) ?? 0
  const width = numberFact(video.width) ?? numberFact(objective.width) ?? 0
  const height = numberFact(video.height) ?? numberFact(objective.height) ?? 0
  const fps = numberFact(video.fps) ?? 0
  const blackRatio = numberFact(objective.blackFrameRatioMillionths) ?? 1_000_000
  const frozenRatio = numberFact(objective.frozenFrameRatioMillionths) ?? 1_000_000
  const maximumFrozenRun = numberFact(objective.maximumFrozenRunFrames) ?? expectedFrames
  const motionRatio = numberFact(objective.motionSignalRatioMillionths) ?? 0
  const formatName = typeof document.formatName === 'string' ? document.formatName : ''
  const normalizedValid = semantic.outputFrameCount === expectedFrames &&
    semantic.outputContainer === 'nut' && semantic.outputVideoCodec === 'ffv1' &&
    semantic.outputProbeVerified === true && semantic.audioRemoved === true
  return {
    frameCount,
    width,
    height,
    fps,
    audioStreamCount: numberFact(objective.audioStreamCount) ?? 0,
    blackFrameRatioMillionths: blackRatio,
    frozenFrameRatioMillionths: frozenRatio,
    maximumFrozenRunFrames: maximumFrozenRun,
    motionSignalRatioMillionths: motionRatio,
    checks: {
      validMp4Container: formatName.includes('mp4') &&
        input.candidateBytes.subarray(4, 8).toString('ascii') === 'ftyp',
      decodableStreams: objective.containerIntegrity === true &&
        objective.videoStreamCount === 1 && frameCount > 0,
      durationMatches: frameCount === expectedFrames &&
        Math.abs(Number(document.durationSeconds) - input.request.output.durationSeconds) <= 1 / 24,
      frameRateMatches: fps === 24 && objective.frameRateNumerator === 24 &&
        objective.frameRateDenominator === 1,
      resolutionMatches: width === expectedWidth && height === expectedHeight,
      notTruncated: frameCount === expectedFrames,
      notFrozenOrBlack: blackRatio <= 20_000 && frozenRatio <= 670_000 &&
        maximumFrozenRun <= 47 && motionRatio >= 50_000,
      privateArtifactIntegrity: input.inspection.evidence.sourceSha256 ===
        input.candidateSha256 &&
        input.normalized.evidence.sourceSha256 === input.candidateSha256 &&
        input.normalized.evidence.resultSha256 === input.normalized.resultArtifact.sha256,
      normalizationApplied: normalizedValid,
      technicalInfrastructureAvailable: true,
    },
  }
}

function validAudioDisposition(plan: BrollPlanArtifact): boolean {
  return plan.decision === 'edit_uploaded_video_with_gemini_omni'
    ? ['discard', 'retain_as_ambient_candidate', 'extract_for_sound_skill_review', 'retain_source_audio']
        .includes(plan.audioDisposition)
    : ['discard', 'retain_as_ambient_candidate', 'extract_for_sound_skill_review']
        .includes(plan.audioDisposition)
}

function frameCommitment(
  frame: Awaited<ReturnType<typeof extractCandidateFrame>>,
  identity: string,
) {
  return {
    assetId: identity,
    assetVersionId: `${identity}-v1`,
    byteLength: frame.resultArtifact.byteLength,
    sha256: frame.resultArtifact.sha256,
    privateObjectIdentityHash: hashSkillValue({ identity, sha256: frame.resultArtifact.sha256 }),
  }
}

function injectedSource(bytes: Buffer): OfflineMediaBinaryServerInjectedInput {
  return Object.freeze({
    inputMode: 'private_verified_stream_v1' as const,
    byteLength: bytes.byteLength,
    sha256: sha256(bytes),
    async openStream() { return Readable.from(bytes) },
  })
}

function hashedArtifact<T extends Record<string, unknown>, K extends string>(
  core: T,
  hashKey: K,
): T & Record<K, string> {
  return { ...core, [hashKey]: hashSkillValue(core) } as T & Record<K, string>
}

async function persistJson(
  localStorageRoot: string,
  value: Record<string, unknown>,
): Promise<AuthorityJsonBlobRef> {
  return putPrivateAuthorityJsonBlob({
    localStorageRoot,
    value,
    maxBytes: 2 * 1024 * 1024,
  })
}

async function readPersistedVersion(
  localStorageRoot: string,
  relativePath: string,
): Promise<z.infer<typeof persistedVersionSchema> | undefined> {
  const text = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath,
  })
  if (!text) return undefined
  const stored = persistedVersionSchema.parse(JSON.parse(text))
  const [versionValue, qaValue] = await Promise.all([
    readPrivateAuthorityJsonBlob({ localStorageRoot, ref: stored.versionRef }),
    readPrivateAuthorityJsonBlob({ localStorageRoot, ref: stored.qaReportRef }),
  ])
  const version = brollCandidateVersionSchema.parse(versionValue)
  const qaReport = brollCandidateQaReportSchema.parse(qaValue)
  if (
    stableAuthorityStringify(version) !== stableAuthorityStringify(stored.version) ||
    stableAuthorityStringify(qaReport) !== stableAuthorityStringify(stored.qaReport)
  ) throw new Error('B-roll candidate version or QA report changed after immutable persistence.')
  return stored
}

function numberFact(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
