import { z } from 'zod'

import {
  editSkillArtifactReferenceSchema,
  skillFrameRangeSchema,
} from '../core/skill-assignment-schema'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../core/skill-capability-manifest-schema'
import {
  brollProviderRequestPackageV5Schema,
} from '../../providers/google/gemini-omni-broll'

const identity = z.string().trim().min(1).max(240)
const timestamp = z.string().datetime({ offset: true })

const authorityBlobRefSchema = z.object({
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict()

const scopeShape = {
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  assignmentId: identity,
  assignmentHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
} as const

const tenantProjectScopeShape = {
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
} as const

function hashIssue(
  value: Record<string, unknown>,
  hashKey: string,
  context: z.RefinementCtx,
  label: string,
): void {
  const expected = value[hashKey]
  const core = { ...value }
  delete core[hashKey]
  if (typeof expected !== 'string' || hashSkillValue(core) !== expected) {
    context.addIssue({ code: 'custom', message: `${label} hash is stale or forged.` })
  }
}

const sourceMediaCoreSchema = z.object({
  schemaVersion: z.literal('source_media_artifact_v1'),
  ...tenantProjectScopeShape,
  sourceId: identity,
  privateObjectIdentityHash: skillSha256Schema,
  objectSha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(4 * 1024 * 1024 * 1024),
  mimeType: z.enum(['video/mp4', 'image/png', 'image/jpeg', 'image/webp']),
  container: z.enum(['mp4', 'png', 'jpeg', 'webp']),
  durationFrames: z.number().int().positive().max(100_000_000).nullable(),
  fps: z.number().int().min(1).max(120).nullable(),
  width: z.number().int().positive().max(16_384),
  height: z.number().int().positive().max(16_384),
  provenanceVerified: z.boolean(),
  rightsApproved: z.boolean(),
  privacyApproved: z.boolean(),
  proofClassification: z.enum(['source_verified', 'illustrative_only']),
  checksumReadbackVerified: z.literal(true),
  privateOnly: z.literal(true),
  publicDeliveryAllowed: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const video = value.mimeType === 'video/mp4'
  if (
    video !== (value.container === 'mp4') ||
    video !== (value.durationFrames !== null) ||
    video !== (value.fps !== null)
  ) context.addIssue({ code: 'custom', message: 'Source media timing/container fields are inconsistent.' })
})

export const sourceMediaArtifactV1Schema = sourceMediaCoreSchema.extend({
  artifactHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'artifactHash', context, 'Source media artifact')
})

export type SourceMediaArtifactV1 = z.infer<typeof sourceMediaArtifactV1Schema>

export function createSourceMediaArtifactV1(
  input: z.input<typeof sourceMediaCoreSchema>,
): SourceMediaArtifactV1 {
  const core = sourceMediaCoreSchema.parse(input)
  return sourceMediaArtifactV1Schema.parse({
    ...core,
    artifactHash: hashSkillValue(core),
  })
}

const approvedUserAssetCoreSchema = z.object({
  schemaVersion: z.literal('approved_user_asset_v1'),
  ...scopeShape,
  assetId: identity,
  sourceMediaRef: editSkillArtifactReferenceSchema,
  assetKind: z.enum(['image', 'video']),
  approvedUse: z.enum([
    'b_roll_source',
    'gemini_first_frame',
    'gemini_reference_image',
    'gemini_uploaded_video_edit',
  ]),
  rightsApproved: z.literal(true),
  privacyApproved: z.literal(true),
  personIdentityApproved: z.boolean(),
  proofClassification: z.enum(['source_verified', 'illustrative_only']),
  approvedByUser: z.literal(true),
  approvedAt: timestamp,
  immutable: z.literal(true),
}).strict()

export const approvedUserAssetV1Schema = approvedUserAssetCoreSchema.extend({
  approvalHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'approvalHash', context, 'Approved user asset')
})

const transcriptEvidenceCoreSchema = z.object({
  schemaVersion: z.literal('transcript_evidence_v1'),
  ...scopeShape,
  authorizedRange: skillFrameRangeSchema,
  language: z.string().trim().min(2).max(32),
  cues: z.array(z.object({
    startFrameInclusive: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
    textSha256: skillSha256Schema,
  }).strict()).max(100_000),
  readOnly: z.literal(true),
}).strict()

export const transcriptEvidenceV1Schema = transcriptEvidenceCoreSchema.extend({
  transcriptEvidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'transcriptEvidenceHash', context, 'Transcript evidence')
})

const editPreferenceCoreSchema = z.object({
  schemaVersion: z.literal('edit_preference_snapshot_v1'),
  ...scopeShape,
  editPlanVersion: z.number().int().positive(),
  visualPreference: z.enum(['balanced', 'visual_forward', 'speaker_forward', 'no_extra_visuals']),
  generatedMediaAllowed: z.boolean(),
  exactDirectiveHashes: z.array(skillSha256Schema).max(1_000),
  immutable: z.literal(true),
}).strict()

export const editPreferenceSnapshotV1Schema = editPreferenceCoreSchema.extend({
  preferenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'preferenceHash', context, 'Edit preference snapshot')
})

const referenceDnaCoreSchema = z.object({
  schemaVersion: z.literal('reference_dna_v1'),
  ...scopeShape,
  referenceArtifactHashes: z.array(skillSha256Schema).min(1).max(100),
  influenceDirectiveHashes: z.array(skillSha256Schema).max(100),
  doNotCopyRules: z.array(z.string().trim().min(1).max(2_000)).min(1).max(100),
  readOnly: z.literal(true),
}).strict()

export const referenceDnaV1Schema = referenceDnaCoreSchema.extend({
  referenceDnaHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'referenceDnaHash', context, 'Reference DNA')
})

const captionZonesCoreSchema = z.object({
  schemaVersion: z.literal('caption_reserved_zones_v1'),
  ...scopeShape,
  authorizedRange: skillFrameRangeSchema,
  zones: z.array(z.object({
    zoneId: identity,
    frameRange: skillFrameRangeSchema,
    xMillionths: z.number().int().min(0).max(1_000_000),
    yMillionths: z.number().int().min(0).max(1_000_000),
    widthMillionths: z.number().int().positive().max(1_000_000),
    heightMillionths: z.number().int().positive().max(1_000_000),
    finalOwner: z.literal('captions'),
  }).strict()).max(10_000),
  readOnly: z.literal(true),
}).strict()

export const captionReservedZonesV1Schema = captionZonesCoreSchema.extend({
  zonesHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'zonesHash', context, 'Caption reserved zones')
})

const priorBrollResultCoreSchema = z.object({
  schemaVersion: z.literal('prior_b_roll_result_v1'),
  ...scopeShape,
  priorAssignmentId: identity,
  priorPlanHash: skillSha256Schema,
  priorResultHash: skillSha256Schema,
  conceptKeys: z.array(skillIdentitySchema).max(100),
  exactRange: skillFrameRangeSchema,
  readOnly: z.literal(true),
}).strict()

export const priorBrollResultV1Schema = priorBrollResultCoreSchema.extend({
  priorResultEvidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'priorResultEvidenceHash', context, 'Prior B-roll result')
})

const restraintResultCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_restraint_result_v1'),
  ...scopeShape,
  planId: identity,
  planHash: skillSha256Schema,
  planningQaReportHash: skillSha256Schema,
  exactRange: skillFrameRangeSchema,
  decision: z.enum(['use_no_broll', 'needs_other_skill', 'needs_user_confirmation', 'blocked']),
  reasonCode: skillIdentitySchema,
  providerRequestCount: z.literal(0),
  mediaArtifactCount: z.literal(0),
  creditEstimate: z.literal(0),
  displayTreatment: z.literal('no_display'),
  outsideAuthorizedRangeModified: z.literal(false),
  immutable: z.literal(true),
}).strict()

export const brollRestraintResultSchema = restraintResultCoreSchema.extend({
  restraintResultHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'restraintResultHash', context, 'B-roll restraint result')
})

const providerRequestSpecificationCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_provider_request_specification_v1'),
  ...scopeShape,
  planId: identity,
  planHash: skillSha256Schema,
  approvedWorkGraphHash: skillSha256Schema,
  workItemKey: identity,
  workItemHash: skillSha256Schema,
  operationId: z.literal('provider.google.generate_b_roll_candidate.v1'),
  requestPackage: brollProviderRequestPackageV5Schema,
  callerSelectable: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  alternateProviderFallbackAllowed: z.literal(false),
  approved: z.literal(true),
}).strict()

export const brollProviderRequestSpecificationSchema =
  providerRequestSpecificationCoreSchema.extend({
    specificationHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    hashIssue(value, 'specificationHash', context, 'B-roll provider request specification')
    if (
      value.requestPackage.assignmentHash !== value.assignmentHash ||
      value.requestPackage.planHash !== value.planHash ||
      value.requestPackage.operationId !== value.operationId
    ) context.addIssue({ code: 'custom', message: 'Provider request specification lost exact plan lineage.' })
  })

const brollCandidateMediaManifestCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_candidate_media_manifest_v1'),
  ...scopeShape,
  planId: identity,
  planHash: skillSha256Schema,
  approvedWorkGraphHash: skillSha256Schema,
  workItemKey: identity,
  workItemHash: skillSha256Schema,
  sourceClass: z.enum([
    'gemini_omni_generated',
    'gemini_omni_uploaded_video_edit',
    'existing_project_source',
    'approved_user_asset',
  ]),
  providerOperationId: z.literal('provider.google.generate_b_roll_candidate.v1').nullable(),
  providerAttemptId: skillSha256Schema.nullable(),
  providerRoute: z.literal('gemini_omni_flash').nullable(),
  configuredModelAlias: z.literal('gemini-omni-flash-preview').nullable(),
  acceptedRuntimeModel: identity.nullable(),
  candidateVersion: z.union([z.literal(1), z.literal(2)]),
  privateObjectIdentityHash: skillSha256Schema,
  objectSha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(67_108_864),
  mimeType: z.enum(['video/mp4', 'video/x-nut']),
  container: z.enum(['mp4', 'nut']),
  durationSeconds: z.number().positive().max(10),
  frameCount: z.number().int().positive().max(240),
  fps: z.union([z.literal(24), z.literal(30)]),
  width: z.number().int().positive().max(4_096),
  height: z.number().int().positive().max(4_096),
  audioStreamPresent: z.boolean(),
  sourceArtifactHashes: z.array(skillSha256Schema).max(100),
  referenceArtifactHashes: z.array(skillSha256Schema).max(6),
  generationClassification: z.enum([
    'source_verified',
    'illustrative_generated',
    'contextual_generated',
    'provider_edited_source',
  ]),
  proofSafetyClassification: z.enum(['source_verified_not_generated_proof', 'illustrative_not_verified_proof']),
  costEvidenceRef: authorityBlobRefSchema,
  usageEvidenceRef: authorityBlobRefSchema,
  checksumReadbackVerified: z.literal(true),
  privateOnly: z.literal(true),
  publicDeliveryAllowed: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
}).strict().superRefine((value, context) => {
  const provider = value.sourceClass.startsWith('gemini_omni_')
  const providerFields = [
    value.providerOperationId,
    value.providerAttemptId,
    value.providerRoute,
    value.configuredModelAlias,
  ]
  if (
    providerFields.every((entry) => entry !== null) !== provider ||
    (value.mimeType === 'video/mp4') !== (value.container === 'mp4') ||
    value.frameCount !== Math.round(value.durationSeconds * value.fps) ||
    (provider && value.generationClassification === 'source_verified') ||
    (!provider && value.generationClassification !== 'source_verified')
  ) context.addIssue({ code: 'custom', message: 'B-roll candidate media manifest route or media facts are inconsistent.' })
})

export const brollCandidateMediaManifestSchema =
  brollCandidateMediaManifestCoreSchema.extend({
    mediaManifestHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    hashIssue(value, 'mediaManifestHash', context, 'B-roll candidate media manifest')
  })

export type BrollCandidateMediaManifest = z.infer<
  typeof brollCandidateMediaManifestSchema
>

export function createBrollCandidateMediaManifest(
  input: z.input<typeof brollCandidateMediaManifestCoreSchema>,
): BrollCandidateMediaManifest {
  const core = brollCandidateMediaManifestCoreSchema.parse(input)
  return brollCandidateMediaManifestSchema.parse({
    ...core,
    mediaManifestHash: hashSkillValue(core),
  })
}

const candidateManifestCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_candidate_manifest_v1'),
  ...scopeShape,
  planId: identity,
  planHash: skillSha256Schema,
  workItemKey: identity,
  workItemHash: skillSha256Schema,
  candidateMediaManifestHash: skillSha256Schema,
  technicalInspectionRef: authorityBlobRefSchema,
  technicalInspectionHash: skillSha256Schema,
  objectiveQaRef: authorityBlobRefSchema,
  objectiveQaHash: skillSha256Schema,
  durationSeconds: z.number().positive().max(10),
  frameCount: z.number().int().positive().max(240),
  fps: z.union([z.literal(24), z.literal(30)]),
  width: z.number().int().positive().max(4_096),
  height: z.number().int().positive().max(4_096),
  videoStreamCount: z.literal(1),
  audioStreamCount: z.number().int().nonnegative().max(32),
  blackFrameRatioMillionths: z.number().int().min(0).max(1_000_000),
  frozenFrameRatioMillionths: z.number().int().min(0).max(1_000_000),
  maximumFrozenRunFrames: z.number().int().nonnegative().max(240),
  checksumVerified: z.literal(true),
  privateIntegrityVerified: z.literal(true),
  status: z.literal('passed'),
}).strict()

export const brollCandidateManifestSchema = candidateManifestCoreSchema.extend({
  candidateManifestHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'candidateManifestHash', context, 'B-roll candidate manifest')
})

export type BrollCandidateManifest = z.infer<typeof brollCandidateManifestSchema>

export function createBrollCandidateManifest(
  input: z.input<typeof candidateManifestCoreSchema>,
): BrollCandidateManifest {
  const core = candidateManifestCoreSchema.parse(input)
  return brollCandidateManifestSchema.parse({
    ...core,
    candidateManifestHash: hashSkillValue(core),
  })
}

const existingSourceCandidateVersionCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_candidate_version_v1'),
  versionKind: z.literal('existing_source_prepared'),
  ...scopeShape,
  planId: identity,
  planHash: skillSha256Schema,
  approvedWorkGraphHash: skillSha256Schema,
  workItemKey: identity,
  workItemHash: skillSha256Schema,
  candidateMediaManifestHash: skillSha256Schema,
  sourceArtifactHash: skillSha256Schema,
  normalizedPrivateObjectIdentityHash: skillSha256Schema,
  normalizedObjectSha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(67_108_864),
  mimeType: z.literal('video/x-nut'),
  container: z.literal('nut'),
  videoCodec: z.literal('ffv1'),
  frameCount: z.number().int().positive().max(100_000_000),
  fps: z.number().int().min(1).max(60),
  exactRange: skillFrameRangeSchema,
  sourceQaReportHash: skillSha256Schema,
  automaticSelectionAllowed: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
  immutable: z.literal(true),
}).strict()

export const brollExistingSourceCandidateVersionSchema =
  existingSourceCandidateVersionCoreSchema.extend({
    candidateVersionHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    hashIssue(value, 'candidateVersionHash', context, 'Existing-source B-roll candidate version')
  })

export type BrollExistingSourceCandidateVersion = z.infer<
  typeof brollExistingSourceCandidateVersionSchema
>

export function createBrollExistingSourceCandidateVersion(
  input: z.input<typeof existingSourceCandidateVersionCoreSchema>,
): BrollExistingSourceCandidateVersion {
  const core = existingSourceCandidateVersionCoreSchema.parse(input)
  return brollExistingSourceCandidateVersionSchema.parse({
    ...core,
    candidateVersionHash: hashSkillValue(core),
  })
}

const runtimeQaReportCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_qa_report_v1'),
  ...scopeShape,
  planId: identity,
  planHash: skillSha256Schema,
  workItemKey: identity,
  workItemHash: skillSha256Schema,
  qaClass: z.enum(['source_technical', 'candidate_technical', 'candidate_semantic', 'preview_integration']),
  subjectArtifactHash: skillSha256Schema,
  validatorVersion: skillIdentitySchema,
  evidenceHashes: z.array(skillSha256Schema).min(1).max(100),
  disposition: z.enum(['passed', 'warning', 'needs_review', 'blocking', 'critical']),
  privateInternalOnly: z.literal(true),
  productionQualified: z.boolean(),
  outsideAuthorizedRangeModified: z.literal(false),
  evaluatedAt: timestamp,
}).strict()

export const brollRuntimeQaReportSchema = runtimeQaReportCoreSchema.extend({
  qaReportHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'qaReportHash', context, 'B-roll runtime QA report')
})

export type BrollRuntimeQaReport = z.infer<typeof brollRuntimeQaReportSchema>

export function createBrollRuntimeQaReport(
  input: z.input<typeof runtimeQaReportCoreSchema>,
): BrollRuntimeQaReport {
  const core = runtimeQaReportCoreSchema.parse(input)
  return brollRuntimeQaReportSchema.parse({
    ...core,
    qaReportHash: hashSkillValue(core),
  })
}

const handoffCommonShape = {
  manifestRef: skillManifestReferenceSchema,
  assignmentId: identity,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  exactRange: skillFrameRangeSchema,
  selectedNormalizedArtifactSha256: skillSha256Schema,
  outputQaHash: skillSha256Schema,
  outsideAuthorizedRangeModified: z.literal(false),
} as const

const soundHandoffCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_sound_handoff_v1'),
  ...handoffCommonShape,
  finalOwner: z.literal('sound'),
  audioDisposition: z.enum(['discard', 'retain_as_ambient_candidate', 'extract_for_sound_skill_review', 'retain_source_audio']),
  rawGeneratedOrSourceArtifactRef: z.object({
    artifactType: identity,
    privateObjectIdentityHash: skillSha256Schema.nullable(),
    sha256: skillSha256Schema,
    byteLength: z.number().int().positive().max(67_108_864),
  }).strict(),
  generatedAudioFinalMixAllowed: z.literal(false),
  brollMayMutateFinalMix: z.literal(false),
}).strict()

export const brollSoundHandoffSchema = soundHandoffCoreSchema.extend({
  handoffHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'handoffHash', context, 'B-roll sound handoff')
})

const colorHandoffCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_color_handoff_v1'),
  ...handoffCommonShape,
  finalOwner: z.literal('color'),
  colorIntent: z.string().trim().min(1).max(2_000),
  creativeColorTransformAppliedByBroll: z.literal(false),
  brollMayApplyFinalGrade: z.literal(false),
}).strict()

export const brollColorHandoffSchema = colorHandoffCoreSchema.extend({
  handoffHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'handoffHash', context, 'B-roll color handoff')
})

const transitionHandoffCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_transition_handoff_v1'),
  ...handoffCommonShape,
  finalOwner: z.literal('transition'),
  entryIntent: z.string().trim().min(1).max(2_000),
  exitIntent: z.string().trim().min(1).max(2_000),
  brollMayApplySpecializedTransition: z.literal(false),
}).strict()

export const brollTransitionHandoffSchema = transitionHandoffCoreSchema.extend({
  handoffHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  hashIssue(value, 'handoffHash', context, 'B-roll transition handoff')
})

const privatePreviewMediaCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_private_preview_media_manifest_v1'),
  ...scopeShape,
  planId: identity,
  planHash: skillSha256Schema,
  approvedWorkGraphHash: skillSha256Schema,
  workItemKey: identity,
  workItemHash: skillSha256Schema,
  layerManifestHash: skillSha256Schema,
  privateObjectIdentityHash: skillSha256Schema,
  objectSha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(32 * 1024 * 1024),
  mimeType: z.literal('video/mp4'),
  container: z.literal('mp4'),
  durationSeconds: z.number().positive().max(10),
  frameCount: z.number().int().positive().max(240),
  fps: z.union([z.literal(24), z.literal(30)]),
  width: z.number().int().positive().max(4_096),
  height: z.number().int().positive().max(4_096),
  remotionRequestHash: skillSha256Schema,
  remotionAttestationHash: skillSha256Schema,
  checksumReadbackVerified: z.literal(true),
  privateOnly: z.literal(true),
  publicDeliveryAllowed: z.literal(false),
  finalCustomerExport: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.frameCount !== Math.round(value.durationSeconds * value.fps)) {
    context.addIssue({ code: 'custom', message: 'B-roll private preview timing is inconsistent.' })
  }
})

export const brollPrivatePreviewMediaManifestSchema =
  privatePreviewMediaCoreSchema.extend({
    previewManifestHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    hashIssue(value, 'previewManifestHash', context, 'B-roll private preview media manifest')
  })

export type BrollPrivatePreviewMediaManifest = z.infer<
  typeof brollPrivatePreviewMediaManifestSchema
>

export function createBrollPrivatePreviewMediaManifest(
  input: z.input<typeof privatePreviewMediaCoreSchema>,
): BrollPrivatePreviewMediaManifest {
  const core = privatePreviewMediaCoreSchema.parse(input)
  return brollPrivatePreviewMediaManifestSchema.parse({
    ...core,
    previewManifestHash: hashSkillValue(core),
  })
}

const remotionPreviewProxyCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_remotion_preview_proxy_manifest_v1'),
  ...scopeShape,
  planId: identity,
  planHash: skillSha256Schema,
  approvedWorkGraphHash: skillSha256Schema,
  workItemKey: identity,
  workItemHash: skillSha256Schema,
  sourceNormalizedSha256: skillSha256Schema,
  privateObjectIdentityHash: skillSha256Schema,
  objectSha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(32 * 1024 * 1024),
  mimeType: z.literal('video/x-matroska'),
  container: z.literal('matroska'),
  frameCount: z.number().int().positive().max(240),
  fps: z.union([z.literal(24), z.literal(30)]),
  ffmpegRequestHash: skillSha256Schema,
  ffmpegAttestationHash: skillSha256Schema,
  checksumReadbackVerified: z.literal(true),
  technicalProxyOnly: z.literal(true),
  creativeColorTransformApplied: z.literal(false),
  audioRemoved: z.literal(true),
  privateOnly: z.literal(true),
  publicDeliveryAllowed: z.literal(false),
  finalCustomerExport: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict()

export const brollRemotionPreviewProxyManifestSchema =
  remotionPreviewProxyCoreSchema.extend({
    proxyManifestHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    hashIssue(value, 'proxyManifestHash', context, 'B-roll Remotion preview proxy manifest')
  })

export type BrollRemotionPreviewProxyManifest = z.infer<
  typeof brollRemotionPreviewProxyManifestSchema
>

export function createBrollRemotionPreviewProxyManifest(
  input: z.input<typeof remotionPreviewProxyCoreSchema>,
): BrollRemotionPreviewProxyManifest {
  const core = remotionPreviewProxyCoreSchema.parse(input)
  return brollRemotionPreviewProxyManifestSchema.parse({
    ...core,
    proxyManifestHash: hashSkillValue(core),
  })
}

const noActionResultCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_result_receipt_v1'),
  resultKind: z.literal('professional_no_action'),
  manifestRef: skillManifestReferenceSchema,
  assignmentId: identity,
  assignmentHash: skillSha256Schema,
  planId: identity,
  planHash: skillSha256Schema,
  planningQaReportHash: skillSha256Schema,
  workGraphHash: skillSha256Schema,
  exactTiming: skillFrameRangeSchema,
  decision: z.enum(['use_no_broll', 'needs_other_skill', 'needs_user_confirmation', 'blocked']),
  providerRequestCount: z.literal(0),
  mediaArtifactCount: z.literal(0),
  estimatedProviderCredits: z.literal(0),
  selectedSource: z.null(),
  displayLayer: z.null(),
  outsideAuthorizedRangeModified: z.literal(false),
  privateInternalOnly: z.literal(true),
}).strict()

export const brollCanonicalNoActionResultReceiptSchema =
  noActionResultCoreSchema.extend({
    resultHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    hashIssue(value, 'resultHash', context, 'B-roll no-action result')
  })

export type BrollCanonicalNoActionResultReceipt = z.infer<
  typeof brollCanonicalNoActionResultReceiptSchema
>

export function createBrollCanonicalNoActionResultReceipt(
  input: z.input<typeof noActionResultCoreSchema>,
): BrollCanonicalNoActionResultReceipt {
  const core = noActionResultCoreSchema.parse(input)
  return brollCanonicalNoActionResultReceiptSchema.parse({
    ...core,
    resultHash: hashSkillValue(core),
  })
}
