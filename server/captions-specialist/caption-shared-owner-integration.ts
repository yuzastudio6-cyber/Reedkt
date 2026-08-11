import { z } from 'zod'

import {
  CAPTION_SHARED_OWNER_INTEGRATION_HANDOFF_VERSION,
  type CaptionConditionalJobOwnerBinding,
  type CaptionSharedOwnerBoundaryBinding,
  type CaptionSharedOwnerIntegrationHandoff,
  type CaptionSharedOwnerKey,
  type CaptionSharedOwnerPublicContract,
} from '../../src/types/caption-shared-owner-integration'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
} from '../../src/types/captions-specialist'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const ownerKeySchema = z.enum([
  'visual_intelligence', 'canonical_transcript', 'track_all', 'soundsync',
  'broll_owner',
])
const contractRoleSchema = z.enum([
  'initial_input', 'request_payload', 'neutral_support_request',
  'owner_result', 'caption_admission', 'caption_projection', 'qualification',
  'authenticated_read_binding',
])
const integrationModeSchema = z.enum([
  'initial_call_authenticated_input', 'hq_mediated_support_resume',
  'authenticated_owner_read_binding',
])
const jobTypeSchema = z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)

const publicContractSchema: z.ZodType<CaptionSharedOwnerPublicContract> =
z.object({
  publicTypeName: safeKey,
  schemaVersion: safeKey,
  contractRole: contractRoleSchema,
  captionParserEntrypointId: safeKey,
  artifactType: safeKey.nullable(),
  suppliedByCaption: z.boolean(),
  suppliedBySharedOwner: z.boolean(),
}).strict()

const ownerBindingSchema: z.ZodType<CaptionSharedOwnerBoundaryBinding> =
z.object({
  ownerKey: ownerKeySchema,
  integrationMode: integrationModeSchema,
  publicContracts: z.array(publicContractSchema).min(1).max(8),
  requiredArtifactTypes: z.array(safeKey).min(1).max(8),
  currentGapCodes: z.array(safeKey).min(1).max(8),
  publicCaptionBoundaryComplete: z.boolean(),
  authenticatedOwnerAdapterComplete: z.boolean(),
  authenticatedPrivateRuntimeEvidenceIntegrated: z.literal(false),
  exactCanonicalScopeRereadRequired: z.literal(true),
  exactApprovedSnapshotRereadRequired: z.literal(true),
  exactOutputFrameAndTimingMatchRequired: z.literal(true),
  rawChatMediaBytesPathsUrlsOrCredentialsAllowed: z.literal(false),
  captionMayConstructOwnerResult: z.literal(false),
  captionMayDispatchOwnerDirectly: z.literal(false),
  duplicateSharedOwnerCreated: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()

const conditionalJobBindingSchema:
z.ZodType<CaptionConditionalJobOwnerBinding> = z.object({
  jobType: jobTypeSchema,
  requiredOwnerKeys: z.array(ownerKeySchema).min(1).max(5),
  requiredArtifactTypes: z.array(safeKey).min(1).max(8),
  fallbackCode: z.literal('caption_fail_closed_without_required_integration'),
  exactOriginalCallResumeRequired: z.literal(true),
  deterministicCaptionQaStillRequired: z.literal(true),
  directVisualInspectionStillRequiredWhenMediaExists: z.literal(true),
  independentFinalQaStillRequired: z.literal(true),
  currentlyAdmitted: z.literal(false),
}).strict()

const handoffSchema: z.ZodType<CaptionSharedOwnerIntegrationHandoff> =
z.object({
  schemaVersion: z.literal(CAPTION_SHARED_OWNER_INTEGRATION_HANDOFF_VERSION),
  handoffId: safeKey,
  handoffDigestSha256: sha256,
  sourceCommitRef: refSchema,
  sourceCap20ReleaseRef: refSchema,
  sourceCap20FinalJobReportRef: refSchema,
  ownerBindings: z.array(ownerBindingSchema).length(5),
  conditionalJobBindings: z.array(conditionalJobBindingSchema).length(12),
  counts: z.object({
    sharedOwners: z.literal(5),
    conditionalJobs: z.literal(12),
    ownerBoundariesWithCompleteCaptionContracts:
      z.number().int().nonnegative().max(5),
    ownerAdaptersStillRequired: z.number().int().nonnegative().max(5),
    authenticatedPrivateIntegrationsComplete: z.literal(0),
  }).strict(),
  allConditionalJobsMappedExactlyOnce: z.literal(true),
  everyConditionalJobRetainsFailClosedFallback: z.literal(true),
  captionOwnedImplementationComplete: z.literal(true),
  sharedOwnerRuntimeIntegrationComplete: z.literal(false),
  currentAdmittedSurfaceChanged: z.literal(false),
  privateInternalSpecialistQualified: z.literal(false),
  finalGoalCompletionClaimed: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  directPeerDispatchAdded: z.literal(false),
  providerOrModelAuthorityGranted: z.literal(false),
  operationOrRuntimeAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const sourceCommitRef = {
  id: 'captions.specialist.release.cap20.a07219c141bb5f2b7628949ffcbcc7bfbfd06108',
  version: 'captions-specialist-v1',
  contentHash:
    'a94ff1204843b9d841bb361682d0a8999e89699791367dc904d6825f57e38aa4',
}
const cap20ReleaseRef = {
  id: 'captions.private.internal.release.cap20',
  version: 'caption-private-internal-release-manifest-v1',
  contentHash:
    'ea24f3593733c3f8c62a5758fdad099aa256c90dd7118903586628f453e8d8af',
}
const cap20FinalJobReportRef = {
  id: 'captions.final.job.qualification.cap20',
  version: 'caption-final-job-qualification-report-v1',
  contentHash:
    'b1444a56f07c324109b6e947ecce82c170d896909d6e11e127ea3ada7364c8b1',
}

function contract(
  publicTypeName: string,
  schemaVersion: string,
  contractRole: CaptionSharedOwnerPublicContract['contractRole'],
  captionParserEntrypointId: string,
  artifactType: string | null,
  suppliedByCaption: boolean,
  suppliedBySharedOwner: boolean,
): CaptionSharedOwnerPublicContract {
  return {
    publicTypeName, schemaVersion, contractRole, captionParserEntrypointId,
    artifactType, suppliedByCaption, suppliedBySharedOwner,
  }
}

function owner(
  ownerKey: CaptionSharedOwnerKey,
  integrationMode: CaptionSharedOwnerBoundaryBinding['integrationMode'],
  publicContracts: CaptionSharedOwnerPublicContract[],
  requiredArtifactTypes: string[],
  currentGapCodes: string[],
  publicCaptionBoundaryComplete: boolean,
  authenticatedOwnerAdapterComplete: boolean,
): CaptionSharedOwnerBoundaryBinding {
  return {
    ownerKey, integrationMode, publicContracts, requiredArtifactTypes,
    currentGapCodes, publicCaptionBoundaryComplete,
    authenticatedOwnerAdapterComplete,
    authenticatedPrivateRuntimeEvidenceIntegrated: false,
    exactCanonicalScopeRereadRequired: true,
    exactApprovedSnapshotRereadRequired: true,
    exactOutputFrameAndTimingMatchRequired: true,
    rawChatMediaBytesPathsUrlsOrCredentialsAllowed: false,
    captionMayConstructOwnerResult: false,
    captionMayDispatchOwnerDirectly: false,
    duplicateSharedOwnerCreated: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  }
}

const ownerBindings: CaptionSharedOwnerBoundaryBinding[] = [
  owner('visual_intelligence', 'hq_mediated_support_resume', [
    contract('CaptionVisualIntelligenceSupportPayload',
      'caption-visual-intelligence-support-payload-v1', 'request_payload',
      'parseCaptionVisualIntelligenceSupportPayload', null, true, false),
    contract('SkillSupportRequest', 'skill-support-request-v1',
      'neutral_support_request', 'parseSkillSupportRequest', null, true, false),
    contract('CaptionVisualIntelligenceEvidencePacket',
      'caption-visual-intelligence-evidence-packet-v1', 'owner_result',
      'parseCaptionVisualIntelligenceEvidencePacket',
      'visual_intelligence_report', false, true),
    contract('CaptionVisualOccupancyManifest',
      'caption-visual-occupancy-manifest-v1', 'caption_projection',
      'parseCaptionVisualOccupancyManifest', null, true, false),
    contract('CaptionFinalVisualHierarchy', 'caption-final-visual-hierarchy-v1',
      'caption_projection', 'parseCaptionFinalVisualHierarchy', null, true,
      false),
  ], ['visual_intelligence_report'], [
    'visual_intelligence_authenticated_private_result_not_injected',
  ], true, true),
  owner('canonical_transcript', 'initial_call_authenticated_input', [
    contract('CaptionAlignmentQualification',
      'caption-alignment-qualification-v1', 'qualification',
      'parseCaptionAlignmentQualification', null, false, true),
    contract('CaptionCanonicalTranscript', 'caption-canonical-transcript-v1',
      'initial_input', 'parseCaptionCanonicalTranscript',
      'canonical_transcript', false, true),
    contract('CaptionPhraseLineageProjection',
      'caption-phrase-lineage-projection-v1', 'caption_projection',
      'parseCaptionPhraseLineageProjection', null, true, false),
  ], ['canonical_transcript'], [
    'canonical_transcript_authenticated_read_binding_not_frozen',
    'canonical_transcript_owner_input_not_injected',
  ], true, false),
  owner('track_all', 'hq_mediated_support_resume', [
    contract('CaptionTrackAllSupportPayload',
      'caption-track-all-support-payload-v1', 'request_payload',
      'parseCaptionTrackAllSupportPayload', null, true, false),
    contract('SkillSupportRequest', 'skill-support-request-v1',
      'neutral_support_request', 'parseSkillSupportRequest', null, true, false),
    contract('CaptionTrackAllEvidencePacket',
      'caption-track-all-evidence-packet-v1', 'owner_result',
      'parseCaptionTrackAllEvidencePacket', 'track_all_mask_binding', false,
      true),
    contract('CaptionTrackAllAdmission', 'caption-track-all-admission-v1',
      'caption_admission', 'parseCaptionTrackAllAdmission', null, true, false),
  ], ['track_all_mask_binding'], [
    'track_all_authenticated_private_artifact_result_not_injected',
  ], true, true),
  owner('soundsync', 'hq_mediated_support_resume', [
    contract('CaptionSoundCueRequest', 'caption-sound-cue-request-v1',
      'request_payload', 'parseCaptionSoundCueRequest', null, true, false),
    contract('SkillSupportRequest', 'skill-support-request-v1',
      'neutral_support_request', 'parseSkillSupportRequest', null, true, false),
    contract('CaptionSoundSupportResult', 'caption-sound-support-result-v1',
      'owner_result', 'parseCaptionSoundSupportResult',
      'caption_sound_support_result', false, true),
    contract('CaptionSoundAdmission', 'caption-sound-admission-v1',
      'caption_admission', 'parseCaptionSoundAdmission', null, true, false),
  ], ['caption_sound_support_result'], [
    'soundsync_authenticated_private_result_not_injected',
  ], true, true),
  owner('broll_owner', 'authenticated_owner_read_binding', [
    contract('CaptionBrollOwnerReadBinding',
      'caption-broll-owner-read-binding-v1', 'authenticated_read_binding',
      'parseCaptionBrollOwnerReadBinding',
      'caption_broll_owner_read_binding', false, true),
  ], ['caption_broll_owner_read_binding'], [
    'broll_owner_public_request_result_adapter_not_frozen',
    'broll_owner_authenticated_private_result_not_injected',
  ], true, false),
]

function job(
  jobType: CaptionConditionalJobOwnerBinding['jobType'],
  requiredOwnerKeys: CaptionSharedOwnerKey[],
  requiredArtifactTypes: string[],
): CaptionConditionalJobOwnerBinding {
  return {
    jobType, requiredOwnerKeys, requiredArtifactTypes,
    fallbackCode: 'caption_fail_closed_without_required_integration',
    exactOriginalCallResumeRequired: true,
    deterministicCaptionQaStillRequired: true,
    directVisualInspectionStillRequiredWhenMediaExists: true,
    independentFinalQaStillRequired: true,
    currentlyAdmitted: false,
  }
}

const conditionalJobBindings: CaptionConditionalJobOwnerBinding[] = [
  job('plan_caption_blocking_preview', ['visual_intelligence'],
    ['visual_intelligence_report']),
  job('resolve_multi_track_caption_scene', ['canonical_transcript'],
    ['canonical_transcript']),
  job('resolve_spatial_typography',
    ['canonical_transcript', 'visual_intelligence'],
    ['canonical_transcript', 'visual_intelligence_report']),
  job('resolve_subject_occluded_typography', ['track_all'],
    ['track_all_mask_binding']),
  job('resolve_front_of_subject_typography', ['track_all'],
    ['track_all_mask_binding']),
  job('resolve_object_anchored_typography', ['track_all'],
    ['track_all_mask_binding']),
  job('resolve_environmental_typography', ['track_all'],
    ['track_all_mask_binding']),
  job('provide_typographic_transition_support', ['soundsync'],
    ['caption_sound_support_result']),
  job('prepare_caption_boundary_timing_requirements', ['soundsync'],
    ['caption_sound_support_result']),
  job('provide_caption_safe_region_constraints',
    ['track_all', 'visual_intelligence'],
    ['track_all_mask_binding', 'visual_intelligence_report']),
  job('provide_typographic_transition_component', ['soundsync'],
    ['caption_sound_support_result']),
  job('provide_caption_broll_composition_constraints', ['broll_owner'],
    ['caption_broll_owner_read_binding']),
]

const expectedOwnerOrder: CaptionSharedOwnerKey[] = [
  'visual_intelligence', 'canonical_transcript', 'track_all', 'soundsync',
  'broll_owner',
]
const expectedJobOrder = conditionalJobBindings.map((item) => item.jobType)

function refKey(
  value: { id: string; version: string; contentHash: string },
): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length
}

function ownerSemanticsValid(
  binding: CaptionSharedOwnerBoundaryBinding,
): boolean {
  return unique(binding.requiredArtifactTypes)
    && unique(binding.currentGapCodes)
    && unique(binding.publicContracts.map((item) =>
      `${item.publicTypeName}:${item.schemaVersion}:${item.contractRole}`))
    && binding.currentGapCodes.length > 0
    && binding.publicContracts.every((item) =>
      item.suppliedByCaption !== item.suppliedBySharedOwner)
    && binding.authenticatedOwnerAdapterComplete
      === !binding.currentGapCodes.some((code) =>
        code.includes('adapter_not_frozen')
        || code.includes('read_binding_not_frozen'))
}

export function parseCaptionSharedOwnerIntegrationHandoff(
  value: unknown,
): CaptionSharedOwnerIntegrationHandoff {
  assertClosedContractTree(value, 'Caption shared-owner integration handoff')
  const parsed = handoffSchema.parse(value)
  const expectedDigest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'handoffDigestSha256')
  const completeBoundaries = parsed.ownerBindings.filter((item) =>
    item.publicCaptionBoundaryComplete).length
  const pendingAdapters = parsed.ownerBindings.filter((item) =>
    !item.authenticatedOwnerAdapterComplete).length
  if (expectedDigest !== parsed.handoffDigestSha256
    || refKey(parsed.sourceCommitRef) !== refKey(sourceCommitRef)
    || refKey(parsed.sourceCap20ReleaseRef) !== refKey(cap20ReleaseRef)
    || refKey(parsed.sourceCap20FinalJobReportRef)
      !== refKey(cap20FinalJobReportRef)
    || parsed.ownerBindings.map((item) => item.ownerKey).join('|')
      !== expectedOwnerOrder.join('|')
    || parsed.conditionalJobBindings.map((item) => item.jobType).join('|')
      !== expectedJobOrder.join('|')
    || !parsed.ownerBindings.every(ownerSemanticsValid)
    || !parsed.conditionalJobBindings.every((item) =>
      unique(item.requiredOwnerKeys) && unique(item.requiredArtifactTypes))
    || parsed.counts.ownerBoundariesWithCompleteCaptionContracts
      !== completeBoundaries
    || parsed.counts.ownerAdaptersStillRequired !== pendingAdapters
    || new Set(parsed.conditionalJobBindings.map((item) => item.jobType)).size
      !== 12) {
    throw new Error('Caption shared-owner integration semantics are invalid.')
  }
  return structuredClone(parsed)
}

const handoffWithoutDigest: Omit<
  CaptionSharedOwnerIntegrationHandoff,
  'handoffDigestSha256'
> = {
  schemaVersion: CAPTION_SHARED_OWNER_INTEGRATION_HANDOFF_VERSION,
  handoffId: 'captions.shared-owner.integration.handoff.cap20',
  sourceCommitRef,
  sourceCap20ReleaseRef: cap20ReleaseRef,
  sourceCap20FinalJobReportRef: cap20FinalJobReportRef,
  ownerBindings,
  conditionalJobBindings,
  counts: {
    sharedOwners: 5,
    conditionalJobs: 12,
    ownerBoundariesWithCompleteCaptionContracts: ownerBindings.filter((item) =>
      item.publicCaptionBoundaryComplete).length,
    ownerAdaptersStillRequired: ownerBindings.filter((item) =>
      !item.authenticatedOwnerAdapterComplete).length,
    authenticatedPrivateIntegrationsComplete: 0,
  },
  allConditionalJobsMappedExactlyOnce: true,
  everyConditionalJobRetainsFailClosedFallback: true,
  captionOwnedImplementationComplete: true,
  sharedOwnerRuntimeIntegrationComplete: false,
  currentAdmittedSurfaceChanged: false,
  privateInternalSpecialistQualified: false,
  finalGoalCompletionClaimed: false,
  centralOrchestraImplemented: false,
  directPeerDispatchAdded: false,
  providerOrModelAuthorityGranted: false,
  operationOrRuntimeAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalAuthorityGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryAuthorityGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF =
parseCaptionSharedOwnerIntegrationHandoff({
  ...handoffWithoutDigest,
  handoffDigestSha256: calculateSkillContractDigest(
    { ...handoffWithoutDigest, handoffDigestSha256: '' },
    'handoffDigestSha256'),
})
