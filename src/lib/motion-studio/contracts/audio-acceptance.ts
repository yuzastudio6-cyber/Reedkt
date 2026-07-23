import { z } from 'zod'

import type {
  MotionStudioAudioAcceptanceRecordV1,
  MotionStudioAudioAcceptanceChainV1,
  MotionStudioAudioInvalidationRecordV1,
  MotionStudioAudioSelectionManifestV1,
  MotionStudioIntegratedMixArtifactV1,
  MotionStudioIntegratedMixQualityReportV1,
  MotionStudioIntegratedMixRequestV1,
  MotionStudioNarrationAssemblyManifestV1,
  MotionStudioNarrationAssemblyArtifactV1,
  MotionStudioNarrationAssemblyQualityReportV1,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_AUDIO_ACCEPTANCE_RECORD_VERSION,
  MOTION_STUDIO_AUDIO_ACCEPTANCE_CHAIN_VERSION,
  MOTION_STUDIO_AUDIO_INVALIDATION_RECORD_VERSION,
  MOTION_STUDIO_AUDIO_SELECTION_MANIFEST_VERSION,
  MOTION_STUDIO_INTEGRATED_MIX_ARTIFACT_VERSION,
  MOTION_STUDIO_INTEGRATED_MIX_QA_GATES,
  MOTION_STUDIO_INTEGRATED_MIX_QUALITY_VERSION,
  MOTION_STUDIO_INTEGRATED_MIX_REQUEST_VERSION,
  MOTION_STUDIO_NARRATION_ASSEMBLY_MANIFEST_VERSION,
  MOTION_STUDIO_NARRATION_ASSEMBLY_ARTIFACT_VERSION,
  MOTION_STUDIO_NARRATION_ASSEMBLY_QA_GATES,
  MOTION_STUDIO_NARRATION_ASSEMBLY_QUALITY_VERSION,
} from '../../../types/motion-studio'
import {
  motionStudioOwnershipSchema,
  motionStudioTimingAuthoritySchema,
  motionStudioVersionReferenceSchema,
} from './schemas'

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const gitSha = z.string().regex(/^[a-f0-9]{40}$/u)
const isoDate = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = z.number().int().positive().refine(Number.isSafeInteger)
const safeText = (maximum: number) => z.string().trim().min(1).max(maximum)
  .refine((value) => !/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/iu.test(value), {
    message: 'URLs, URI payloads, and relative paths are forbidden in audio-acceptance text.',
  })

const audioRole = z.enum(['music', 'foley', 'ambience', 'exact_sfx'])
const selectableOrigin = z.enum([
  'verified_uploaded_narration',
  'provider_generated_speech',
  'verified_uploaded_music',
  'verified_uploaded_stem',
  'provider_generated_music',
  'provider_synchronized_foley',
  'licensed_or_user_owned_exact_sfx',
])

const frameRangeSchema = z.object({
  startTimingAnchorId: stableId,
  endTimingAnchorId: stableId,
  startFrame: safeInteger,
  endFrame: positiveSafeInteger,
}).strict().superRefine((value, context) => {
  if (value.endFrame <= value.startFrame) {
    context.addIssue({ code: 'custom', path: ['endFrame'], message: 'Audio frame range must advance.' })
  }
  if (value.startTimingAnchorId === value.endTimingAnchorId) {
    context.addIssue({ code: 'custom', path: ['endTimingAnchorId'], message: 'Audio frame range requires distinct timing anchors.' })
  }
})

const evidenceReferenceSchema = z.object({
  evidenceId: stableId,
  evidenceDigest: digest,
  evidenceKind: z.enum([
    'approved_dependency', 'candidate', 'candidate_review', 'objective_qa',
    'alignment', 'rights', 'consent', 'disclosure', 'provenance', 'cost',
    'private_readback',
  ]),
  immutable: z.literal(true),
}).strict()

const dependencyAcceptanceSchema = z.object({
  milestone: z.enum(['MS-012C', 'MS-012D']),
  verdict: z.literal('accepted'),
  acceptedCommitSha: gitSha,
  acceptedTreeSha: gitSha,
  acceptanceEvidenceDigest: digest,
}).strict()

export const motionStudioPrivateAudioAssetVersionV1Schema = z.object({
  assetId: stableId,
  assetVersionId: stableId,
  contentDigest: digest,
  checksumSha256: digest,
  byteLength: positiveSafeInteger.max(512 * 1024 * 1024),
  mimeType: z.literal('audio/wav'),
  codec: z.literal('pcm_s16le'),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.union([z.literal(1), z.literal(2)]),
  sampleCountPerChannel: positiveSafeInteger.max(48_000 * 60 * 180),
  durationMilliseconds: positiveSafeInteger.max(60 * 60 * 180),
  privateAsset: z.literal(true),
  createOnly: z.literal(true),
  checksumVerified: z.literal(true),
  privateReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
}).strict().superRefine((value, context) => {
  const expectedDurationMilliseconds = value.sampleCountPerChannel * 1_000 / value.sampleRateHertz
  if (Math.abs(expectedDurationMilliseconds - value.durationMilliseconds) > 1) {
    context.addIssue({ code: 'custom', path: ['durationMilliseconds'], message: 'Audio duration must match the exact PCM sample count.' })
  }
})

export const motionStudioAudioCandidateAuthorityV1Schema = z.object({
  candidateId: stableId,
  origin: selectableOrigin,
  evidenceClass: z.enum([
    'verified_private_upload',
    'persisted_private_provider_c3_readback',
    'canonical_backend_verified_provider_candidate',
  ]),
  candidateEvidence: evidenceReferenceSchema,
  reviewEvidence: evidenceReferenceSchema,
  qaEvidence: evidenceReferenceSchema,
  rightsEvidence: z.array(evidenceReferenceSchema).min(1).max(32).readonly(),
  consentEvidence: z.array(evidenceReferenceSchema).min(1).max(32).readonly(),
  disclosureEvidence: z.array(evidenceReferenceSchema).min(1).max(32).readonly(),
  provenanceEvidence: z.array(evidenceReferenceSchema).min(1).max(32).readonly(),
  costEvidence: evidenceReferenceSchema,
  reviewDecision: z.literal('pass_for_selection_review'),
  providerOutcome: z.enum(['not_applicable_verified_upload', 'completed_reconciled']),
  fixtureOrSynthetic: z.literal(false),
  stale: z.literal(false),
  unknownOutcome: z.literal(false),
  selectionEligible: z.literal(true),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const uploaded = [
    'verified_uploaded_narration', 'verified_uploaded_music',
    'verified_uploaded_stem', 'licensed_or_user_owned_exact_sfx',
  ].includes(value.origin)
  const expectedEvidenceClass = value.origin === 'provider_generated_speech'
    ? 'persisted_private_provider_c3_readback'
    : uploaded
      ? 'verified_private_upload'
      : 'canonical_backend_verified_provider_candidate'
  if (value.evidenceClass !== expectedEvidenceClass) {
    context.addIssue({ code: 'custom', path: ['evidenceClass'], message: 'Candidate evidence class must match its exact source origin.' })
  }
  if (value.providerOutcome !== (uploaded ? 'not_applicable_verified_upload' : 'completed_reconciled')) {
    context.addIssue({ code: 'custom', path: ['providerOutcome'], message: 'Provider outcome must distinguish verified uploads from reconciled provider candidates.' })
  }
  const exactKinds = [
    [value.candidateEvidence, 'candidate'],
    [value.reviewEvidence, 'candidate_review'],
    [value.qaEvidence, 'objective_qa'],
    [value.costEvidence, 'cost'],
  ] as const
  exactKinds.forEach(([reference, expectedKind]) => {
    if (reference.evidenceKind !== expectedKind) {
      context.addIssue({ code: 'custom', path: ['evidenceKind'], message: `Candidate ${expectedKind} evidence has the wrong kind.` })
    }
  })
  const groupedKinds = [
    [value.rightsEvidence, 'rights'],
    [value.consentEvidence, 'consent'],
    [value.disclosureEvidence, 'disclosure'],
    [value.provenanceEvidence, 'provenance'],
  ] as const
  groupedKinds.forEach(([references, expectedKind]) => {
    if (references.some((reference) => reference.evidenceKind !== expectedKind)) {
      context.addIssue({ code: 'custom', path: [expectedKind], message: `Candidate ${expectedKind} references must use the exact evidence kind.` })
    }
  })
  const evidenceIds = [
    value.candidateEvidence, value.reviewEvidence, value.qaEvidence,
    value.costEvidence, ...value.rightsEvidence, ...value.consentEvidence,
    ...value.disclosureEvidence, ...value.provenanceEvidence,
  ].map((reference) => reference.evidenceId)
  if (!allUnique(evidenceIds)) {
    context.addIssue({ code: 'custom', path: ['candidateEvidence'], message: 'Candidate evidence identities must be unique.' })
  }
})

const costLineageItemSchema = z.object({
  costEvidenceId: stableId,
  costEvidenceDigest: digest,
  candidateId: stableId,
  currency: z.literal('USD'),
  inheritedInternalCostMicros: safeInteger,
  providerCostIncluded: z.boolean(),
  workerInfrastructureCostIncluded: z.boolean(),
  failedAttemptCostRetained: z.literal(true),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
}).strict()

const sourceSampleRangeSchema = z.object({
  startSampleInclusive: safeInteger,
  endSampleExclusive: positiveSafeInteger,
}).strict().superRefine((value, context) => {
  if (value.endSampleExclusive <= value.startSampleInclusive) {
    context.addIssue({ code: 'custom', path: ['endSampleExclusive'], message: 'Source sample range must advance.' })
  }
})

const destinationRangeSchema = z.object({
  frameRange: frameRangeSchema,
  startSampleInclusive: safeInteger,
  endSampleExclusive: positiveSafeInteger,
}).strict().superRefine((value, context) => {
  if (value.endSampleExclusive <= value.startSampleInclusive) {
    context.addIssue({ code: 'custom', path: ['endSampleExclusive'], message: 'Destination sample range must advance.' })
  }
})

export const motionStudioSelectedNarrationTakeV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.selected-narration-take.v1'),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  selectedNarrationId: stableId,
  voiceSegmentId: stableId,
  preparedScriptSegmentId: stableId,
  selectedTakeId: stableId,
  candidateTakeIds: z.array(stableId).min(1).max(12).readonly(),
  voiceBibleArtifactVersion: motionStudioVersionReferenceSchema,
  spokenTextDigest: digest,
  pronunciationAuthorityDigest: digest,
  performanceAuthorityDigest: digest,
  assetVersion: motionStudioPrivateAudioAssetVersionV1Schema,
  sourceSampleRange: sourceSampleRangeSchema,
  destination: destinationRangeSchema,
  alignmentEvidence: evidenceReferenceSchema,
  candidateAuthority: motionStudioAudioCandidateAuthorityV1Schema,
  selectionMethod: z.literal('explicit_human_review'),
  firstOrOnlyTakeAutoSelected: z.literal(false),
  selectedByActorId: stableId,
  selectedAt: isoDate,
  decisionReason: safeText(1_000),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (!allUnique(value.candidateTakeIds) || !value.candidateTakeIds.includes(value.selectedTakeId)) {
    context.addIssue({ code: 'custom', path: ['candidateTakeIds'], message: 'Narration selection requires unique candidates and an explicitly included selected take.' })
  }
  if (value.candidateAuthority.candidateId !== value.selectedTakeId) {
    context.addIssue({ code: 'custom', path: ['candidateAuthority', 'candidateId'], message: 'Narration candidate authority must bind the selected take.' })
  }
  if (!['verified_uploaded_narration', 'provider_generated_speech'].includes(value.candidateAuthority.origin)) {
    context.addIssue({ code: 'custom', path: ['candidateAuthority', 'origin'], message: 'Narration may use only verified uploaded narration or reviewed provider speech.' })
  }
  if (value.alignmentEvidence.evidenceKind !== 'alignment') {
    context.addIssue({ code: 'custom', path: ['alignmentEvidence'], message: 'Narration selection requires exact alignment evidence.' })
  }
  if (value.sourceSampleRange.endSampleExclusive > value.assetVersion.sampleCountPerChannel) {
    context.addIssue({ code: 'custom', path: ['sourceSampleRange'], message: 'Narration source range exceeds the selected private asset.' })
  }
})

export const motionStudioSelectedAudioStemV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.selected-audio-stem.v1'),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  selectedStemId: stableId,
  role: audioRole,
  stemId: stableId,
  candidateId: stableId,
  assetVersion: motionStudioPrivateAudioAssetVersionV1Schema,
  placement: destinationRangeSchema,
  cueAuthorityIds: z.array(stableId).max(128).readonly(),
  soundEventAuthorityIds: z.array(stableId).max(256).readonly(),
  trimAuthorityDigest: digest,
  gainAndDuckingAuthorityDigest: digest,
  candidateAuthority: motionStudioAudioCandidateAuthorityV1Schema,
  selectionMethod: z.literal('explicit_human_review'),
  autoSelected: z.literal(false),
  selectedByActorId: stableId,
  selectedAt: isoDate,
  decisionReason: safeText(1_000),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.candidateAuthority.candidateId !== value.candidateId) {
    context.addIssue({ code: 'custom', path: ['candidateAuthority', 'candidateId'], message: 'Selected stem must bind its exact candidate authority.' })
  }
  const allowedOrigins = value.role === 'music'
    ? ['verified_uploaded_music', 'verified_uploaded_stem', 'provider_generated_music']
    : value.role === 'exact_sfx'
      ? ['licensed_or_user_owned_exact_sfx']
      : ['verified_uploaded_stem', 'provider_synchronized_foley']
  if (!allowedOrigins.includes(value.candidateAuthority.origin)) {
    context.addIssue({ code: 'custom', path: ['candidateAuthority', 'origin'], message: 'Selected stem origin cannot cross its approved audio role.' })
  }
  if (value.role === 'music') {
    if (value.cueAuthorityIds.length === 0 || value.soundEventAuthorityIds.length !== 0) {
      context.addIssue({ code: 'custom', path: ['cueAuthorityIds'], message: 'Selected music requires cue authority and no sound-event authority.' })
    }
  } else if (value.soundEventAuthorityIds.length === 0 || value.cueAuthorityIds.length !== 0) {
    context.addIssue({ code: 'custom', path: ['soundEventAuthorityIds'], message: 'Selected Foley, ambience, and exact SFX require sound-event authority and no music cue.' })
  }
  if (!allUnique([...value.cueAuthorityIds, ...value.soundEventAuthorityIds])) {
    context.addIssue({ code: 'custom', path: ['cueAuthorityIds'], message: 'Selected stem cue and event identities must be unique.' })
  }
})

const selectedOptionalRoleDecisionSchema = z.object({
  role: audioRole,
  decision: z.literal('selected'),
  selections: z.array(motionStudioSelectedAudioStemV1Schema).min(1).max(64).readonly(),
  decisionEvidenceId: stableId,
  decidedByActorId: stableId,
  decidedAt: isoDate,
  reason: safeText(1_000),
}).strict().superRefine((value, context) => {
  if (value.selections.some((selection) => selection.role !== value.role)) {
    context.addIssue({ code: 'custom', path: ['selections'], message: 'Optional-role selections must match the exact role decision.' })
  }
})

const notSelectedOptionalRoleDecisionSchema = z.object({
  role: audioRole,
  decision: z.literal('not_selected'),
  selections: z.array(z.never()).length(0).readonly(),
  decisionEvidenceId: stableId,
  decidedByActorId: stableId,
  decidedAt: isoDate,
  reason: safeText(1_000),
}).strict()

const notNeededOptionalRoleDecisionSchema = z.object({
  role: audioRole,
  decision: z.literal('not_needed'),
  selections: z.array(z.never()).length(0).readonly(),
  decisionEvidenceId: stableId,
  decidedByActorId: stableId,
  decidedAt: isoDate,
  reason: safeText(1_000),
}).strict()

export const motionStudioOptionalAudioRoleDecisionV1Schema = z.discriminatedUnion('decision', [
  selectedOptionalRoleDecisionSchema,
  notSelectedOptionalRoleDecisionSchema,
  notNeededOptionalRoleDecisionSchema,
])

export const motionStudioAudioSelectionManifestV1Schema:
z.ZodType<MotionStudioAudioSelectionManifestV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_AUDIO_SELECTION_MANIFEST_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  selectionManifestId: stableId,
  selectionManifestVersion: positiveSafeInteger,
  supersedesSelectionManifestId: stableId.optional(),
  dependencyAcceptance: z.array(dependencyAcceptanceSchema).length(2).readonly(),
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  approvedPlanReviewId: stableId,
  approvedCreditEstimateId: stableId,
  activeNoncommercialTestReservationId: stableId,
  preparedScriptArtifactVersion: motionStudioVersionReferenceSchema,
  voiceBibleArtifactVersion: motionStudioVersionReferenceSchema,
  musicBibleArtifactVersion: motionStudioVersionReferenceSchema,
  pictureLockArtifactVersion: motionStudioVersionReferenceSchema,
  timingAuthority: motionStudioTimingAuthoritySchema,
  approvedVoiceSegmentIds: z.array(stableId).min(1).max(512).readonly(),
  selectedNarration: z.array(motionStudioSelectedNarrationTakeV1Schema).min(1).max(512).readonly(),
  optionalRoleDecisions: z.array(motionStudioOptionalAudioRoleDecisionV1Schema).length(4).readonly(),
  musicCueAuthorityIds: z.array(stableId).max(128).readonly(),
  soundEventAuthorityIds: z.array(stableId).max(256).readonly(),
  costLineage: z.array(costLineageItemSchema).min(1).max(576).readonly(),
  inheritedInternalCostMicros: safeInteger,
  incrementalSelectionCostMicros: z.literal(0),
  totalInternalCostMicros: safeInteger,
  currency: z.literal('USD'),
  selectionMethod: z.literal('explicit_human_review'),
  firstOrOnlyTakeAutoSelected: z.literal(false),
  mixEligible: z.literal(true),
  mixEligibilityDerivedBy: z.literal('motion_studio_audio_selection_compiler_v1'),
  selectedByActorId: stableId,
  selectedAt: isoDate,
  decisionReason: safeText(1_000),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
  renderAllowed: z.literal(false),
  exportAllowed: z.literal(false),
  productReady: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const dependencyMilestones = value.dependencyAcceptance.map((item) => item.milestone)
  if (!sameSet(dependencyMilestones, ['MS-012C', 'MS-012D'])) {
    context.addIssue({ code: 'custom', path: ['dependencyAcceptance'], message: 'Audio selection requires exact accepted MS-012C and MS-012D evidence.' })
  }
  if (value.selectionManifestVersion === 1 && value.supersedesSelectionManifestId) {
    context.addIssue({ code: 'custom', path: ['supersedesSelectionManifestId'], message: 'First selection-manifest version cannot supersede another manifest.' })
  }
  if (value.selectionManifestVersion > 1 && !value.supersedesSelectionManifestId) {
    context.addIssue({ code: 'custom', path: ['supersedesSelectionManifestId'], message: 'Later selection-manifest versions require explicit supersession lineage.' })
  }
  const optionalRoles = value.optionalRoleDecisions.map((decision) => decision.role)
  if (!sameSet(optionalRoles, ['music', 'foley', 'ambience', 'exact_sfx'])) {
    context.addIssue({ code: 'custom', path: ['optionalRoleDecisions'], message: 'Every optional audio role requires exactly one explicit decision.' })
  }
  const selectedStems = value.optionalRoleDecisions.flatMap((decision) => decision.selections)
  const scopedRecords = [...value.selectedNarration, ...selectedStems]
  scopedRecords.forEach((record, index) => {
    if (!sameScope(value, record) || record.productionId !== value.productionId) {
      context.addIssue({ code: 'custom', path: ['scope', index], message: 'Every selected audio record must use the exact manifest tenant and production scope.' })
    }
  })
  const selectedNarrationIds = value.selectedNarration.map((item) => item.selectedNarrationId)
  const voiceSegmentIds = value.selectedNarration.map((item) => item.voiceSegmentId)
  const selectedTakeIds = value.selectedNarration.map((item) => item.selectedTakeId)
  if (!allUnique(selectedNarrationIds) || !allUnique(voiceSegmentIds) || !allUnique(selectedTakeIds)) {
    context.addIssue({ code: 'custom', path: ['selectedNarration'], message: 'Narration selection, segment, and take identities must be unique.' })
  }
  if (!sameSet(value.approvedVoiceSegmentIds, voiceSegmentIds)) {
    context.addIssue({ code: 'custom', path: ['approvedVoiceSegmentIds'], message: 'Every approved voice segment requires exactly one selected narration take.' })
  }
  value.selectedNarration.forEach((selection, index) => {
    if (!sameVersion(selection.voiceBibleArtifactVersion, value.voiceBibleArtifactVersion)) {
      context.addIssue({ code: 'custom', path: ['selectedNarration', index, 'voiceBibleArtifactVersion'], message: 'Narration selection must bind the exact Voice Bible version.' })
    }
    validateDestination(selection.destination, value.timingAuthority, context, ['selectedNarration', index, 'destination'])
    const previous = value.selectedNarration[index - 1]
    if (previous && selection.destination.frameRange.startFrame < previous.destination.frameRange.endFrame) {
      context.addIssue({ code: 'custom', path: ['selectedNarration', index, 'destination'], message: 'Narration selections must be ordered and non-overlapping.' })
    }
  })
  const selectedStemIds = selectedStems.map((item) => item.selectedStemId)
  const selectedCandidateIds = [
    ...selectedTakeIds,
    ...selectedStems.map((item) => item.candidateId),
  ]
  if (!allUnique(selectedStemIds) || !allUnique(selectedCandidateIds)) {
    context.addIssue({ code: 'custom', path: ['optionalRoleDecisions'], message: 'Selected stem and candidate identities must be unique.' })
  }
  selectedStems.forEach((selection, index) => {
    validateDestination(selection.placement, value.timingAuthority, context, ['optionalRoleDecisions', index, 'placement'])
  })
  const selectedMusicCues = selectedStems.flatMap((stem) => stem.role === 'music' ? stem.cueAuthorityIds : [])
  const selectedSoundEvents = selectedStems.flatMap((stem) => stem.role === 'music' ? [] : stem.soundEventAuthorityIds)
  if (!sameSet(value.musicCueAuthorityIds, selectedMusicCues) || !sameSet(value.soundEventAuthorityIds, selectedSoundEvents)) {
    context.addIssue({ code: 'custom', path: ['musicCueAuthorityIds'], message: 'Manifest cue and sound-event authority must exactly cover selected optional stems.' })
  }
  const costCandidateIds = value.costLineage.map((item) => item.candidateId)
  if (!sameSet(costCandidateIds, selectedCandidateIds)) {
    context.addIssue({ code: 'custom', path: ['costLineage'], message: 'Cost lineage must cover every selected candidate exactly once.' })
  }
  value.costLineage.forEach((cost, index) => {
    const selected = scopedRecords.find((record) =>
      'selectedTakeId' in record
        ? record.selectedTakeId === cost.candidateId
        : record.candidateId === cost.candidateId)
    if (!selected || selected.candidateAuthority.costEvidence.evidenceId !== cost.costEvidenceId ||
      selected.candidateAuthority.costEvidence.evidenceDigest !== cost.costEvidenceDigest) {
      context.addIssue({ code: 'custom', path: ['costLineage', index], message: 'Cost lineage must bind the exact selected candidate cost evidence.' })
    }
  })
  const inheritedCost = value.costLineage.reduce((sum, item) => sum + item.inheritedInternalCostMicros, 0)
  if (!Number.isSafeInteger(inheritedCost) || inheritedCost !== value.inheritedInternalCostMicros || value.totalInternalCostMicros !== inheritedCost) {
    context.addIssue({ code: 'custom', path: ['totalInternalCostMicros'], message: 'Selection cost must conserve inherited internal cost without customer-commercial additions.' })
  }
})

const narrationAssemblySegmentSchema = z.object({
  order: safeInteger,
  selectedNarrationId: stableId,
  voiceSegmentId: stableId,
  selectedTakeId: stableId,
  sourceAssetVersionId: stableId,
  sourceChecksumSha256: digest,
  sourceSampleRange: sourceSampleRangeSchema,
  destination: destinationRangeSchema,
  spokenTextDigest: digest,
  alignmentEvidenceId: stableId,
  alignmentEvidenceDigest: digest,
}).strict()

export const motionStudioNarrationAssemblyManifestV1Schema:
z.ZodType<MotionStudioNarrationAssemblyManifestV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_NARRATION_ASSEMBLY_MANIFEST_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  narrationAssemblyManifestId: stableId,
  selectionManifestId: stableId,
  selectionManifestVersion: positiveSafeInteger,
  selectionManifestDigest: digest,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  timingAuthority: motionStudioTimingAuthoritySchema,
  profileId: z.literal('motion_studio_storytelling_narration_assembly_v1'),
  profileDigest: digest,
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(1),
  codec: z.literal('pcm_s16le'),
  durationFrames: positiveSafeInteger,
  sampleCountPerChannel: positiveSafeInteger,
  segments: z.array(narrationAssemblySegmentSchema).min(1).max(512).readonly(),
  preserveApprovedSilence: z.literal(true),
  timeScaleAllowed: z.literal(false),
  hiddenCrossfadeAllowed: z.literal(false),
  overlappingNarrationAllowed: z.literal(false),
  callerProvidedFfmpegArgumentsAllowed: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.durationFrames !== value.timingAuthority.durationFrames) {
    context.addIssue({ code: 'custom', path: ['durationFrames'], message: 'Narration assembly duration must match exact Master Timing authority.' })
  }
  const expectedSamples = samplesForFrame(value.durationFrames, value.timingAuthority.frameRate)
  if (expectedSamples === null || value.sampleCountPerChannel !== expectedSamples) {
    context.addIssue({ code: 'custom', path: ['sampleCountPerChannel'], message: 'Narration assembly sample count must map exactly from approved frames.' })
  }
  const identities = value.segments.flatMap((segment) => [segment.selectedNarrationId, segment.voiceSegmentId, segment.selectedTakeId])
  if (!allUnique(identities)) {
    context.addIssue({ code: 'custom', path: ['segments'], message: 'Narration assembly segment identities must be unique.' })
  }
  value.segments.forEach((segment, index) => {
    if (segment.order !== index) {
      context.addIssue({ code: 'custom', path: ['segments', index, 'order'], message: 'Narration assembly segment order must be contiguous from zero.' })
    }
    validateDestination(segment.destination, value.timingAuthority, context, ['segments', index, 'destination'])
    const sourceLength = segment.sourceSampleRange.endSampleExclusive - segment.sourceSampleRange.startSampleInclusive
    const destinationLength = segment.destination.endSampleExclusive - segment.destination.startSampleInclusive
    if (sourceLength !== destinationLength) {
      context.addIssue({ code: 'custom', path: ['segments', index, 'sourceSampleRange'], message: 'Narration assembly forbids hidden speech time-scale or truncation.' })
    }
    const previous = value.segments[index - 1]
    if (previous && segment.destination.startSampleInclusive < previous.destination.endSampleExclusive) {
      context.addIssue({ code: 'custom', path: ['segments', index, 'destination'], message: 'Narration assembly segments must remain non-overlapping.' })
    }
  })
})

export const motionStudioNarrationAssemblyArtifactV1Schema:
z.ZodType<MotionStudioNarrationAssemblyArtifactV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_NARRATION_ASSEMBLY_ARTIFACT_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  artifactId: stableId,
  artifactVersionId: stableId,
  narrationAssemblyManifestId: stableId,
  narrationAssemblyManifestDigest: digest,
  selectionManifestId: stableId,
  selectionManifestVersion: positiveSafeInteger,
  selectionManifestDigest: digest,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  executionAttemptId: stableId,
  profileId: z.literal('motion_studio_storytelling_narration_assembly_v1'),
  profileDigest: digest,
  segmentMapDigest: digest,
  contentDigest: digest,
  checksumSha256: digest,
  byteLength: positiveSafeInteger.max(512 * 1024 * 1024),
  mimeType: z.literal('audio/wav'),
  codec: z.literal('pcm_s16le'),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(1),
  sampleCountPerChannel: positiveSafeInteger,
  durationFrames: positiveSafeInteger,
  frameRate: z.number().int().positive().max(120),
  timingAuthorityDigest: digest,
  privateAsset: z.literal(true),
  createOnly: z.literal(true),
  checksumVerified: z.literal(true),
  privateReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  qaStatus: z.literal('pending_independent_qa'),
  integratedMixInputEligible: z.literal(false),
  timelineReady: z.literal(false),
  renderReady: z.literal(false),
  exportReady: z.literal(false),
  productReady: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const expectedSamples = samplesForFrame(value.durationFrames, value.frameRate)
  if (expectedSamples === null || value.sampleCountPerChannel !== expectedSamples) {
    context.addIssue({ code: 'custom', path: ['sampleCountPerChannel'], message: 'Narration artifact sample count must map exactly from its frame authority.' })
  }
})

const narrationAssemblyQaGateResultSchema = z.object({
  gate: z.enum(MOTION_STUDIO_NARRATION_ASSEMBLY_QA_GATES),
  result: z.enum(['passed', 'failed', 'not_run']),
  blocking: z.literal(true),
  evidenceId: stableId.optional(),
  evidenceDigest: digest.optional(),
  note: safeText(1_000),
}).strict().superRefine((value, context) => {
  const hasEvidence = Boolean(value.evidenceId && value.evidenceDigest)
  if ((value.result === 'passed') !== hasEvidence) {
    context.addIssue({ code: 'custom', path: ['evidenceId'], message: 'Only evidence-backed passed narration QA gates are accepted as passed.' })
  }
})

export const motionStudioNarrationAssemblyQualityReportV1Schema:
z.ZodType<MotionStudioNarrationAssemblyQualityReportV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_NARRATION_ASSEMBLY_QUALITY_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  qualityReportId: stableId,
  narrationAssemblyManifestId: stableId,
  narrationAssemblyManifestDigest: digest,
  narrationAssemblyArtifactId: stableId,
  narrationAssemblyArtifactVersionId: stableId,
  narrationAssemblyChecksumSha256: digest,
  selectionManifestId: stableId,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  timingAuthorityDigest: digest,
  gateResults: z.array(narrationAssemblyQaGateResultSchema)
    .length(MOTION_STUDIO_NARRATION_ASSEMBLY_QA_GATES.length).readonly(),
  allBlockingGatesPassed: z.boolean(),
  integratedMixInputEligible: z.boolean(),
  manualOverrideAllowed: z.literal(false),
  timelineReady: z.literal(false),
  renderReady: z.literal(false),
  exportReady: z.literal(false),
  productReady: z.literal(false),
  reviewedAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const gates = value.gateResults.map((result) => result.gate)
  if (!sameSet(gates, MOTION_STUDIO_NARRATION_ASSEMBLY_QA_GATES)) {
    context.addIssue({ code: 'custom', path: ['gateResults'], message: 'Every narration-assembly QA gate must appear exactly once.' })
  }
  const allPassed = value.gateResults.every((result) =>
    result.result === 'passed' && Boolean(result.evidenceId) && Boolean(result.evidenceDigest))
  if (value.allBlockingGatesPassed !== allPassed || value.integratedMixInputEligible !== allPassed) {
    context.addIssue({ code: 'custom', path: ['allBlockingGatesPassed'], message: 'Narration mix eligibility must be derived from every evidence-backed blocking gate.' })
  }
})

const executionAuthoritySchema = z.object({
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  approvedPlanReviewId: stableId,
  approvedCreditEstimateId: stableId,
  activeNoncommercialTestReservationId: stableId,
  approvedWorkItemId: stableId,
  jobId: stableId,
  attemptId: stableId,
  leaseId: stableId,
  idempotencyKeyHash: digest,
  costBudgetId: stableId,
  maximumAuthorizedInternalCostMicros: positiveSafeInteger,
  currency: z.literal('USD'),
  maximumAttempts: z.literal(1),
  automaticRetry: z.literal(false),
  automaticFallback: z.literal(false),
  automaticSubstitution: z.literal(false),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationAllowed: z.literal(false),
  billingMutationAllowed: z.literal(false),
}).strict()

const integratedMixInputSchema = z.object({
  role: z.enum(['narration', 'music', 'foley', 'ambience', 'exact_sfx']),
  sourceKind: z.enum(['narration_assembly', 'selected_stem']),
  sourceId: stableId,
  assetVersionId: stableId,
  checksumSha256: digest,
  placement: destinationRangeSchema,
  cueAuthorityIds: z.array(stableId).max(128).readonly(),
  soundEventAuthorityIds: z.array(stableId).max(256).readonly(),
  rightsEvidenceIds: z.array(stableId).min(1).max(32).readonly(),
}).strict().superRefine((value, context) => {
  if (value.role === 'narration') {
    if (value.sourceKind !== 'narration_assembly' || value.cueAuthorityIds.length !== 0 || value.soundEventAuthorityIds.length !== 0) {
      context.addIssue({ code: 'custom', path: ['sourceKind'], message: 'Narration input must be the one assembly with no optional cue authority.' })
    }
  } else if (value.sourceKind !== 'selected_stem') {
    context.addIssue({ code: 'custom', path: ['sourceKind'], message: 'Optional mix inputs must come from explicitly selected stems.' })
  }
})

export const motionStudioIntegratedMixRequestV1Schema:
z.ZodType<MotionStudioIntegratedMixRequestV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_INTEGRATED_MIX_REQUEST_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  integratedMixRequestId: stableId,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  selectionManifestId: stableId,
  selectionManifestVersion: positiveSafeInteger,
  selectionManifestDigest: digest,
  narrationAssemblyManifestId: stableId,
  narrationAssemblyManifestDigest: digest,
  narrationAssemblyArtifactId: stableId,
  narrationAssemblyArtifactVersionId: stableId,
  narrationAssemblyArtifactChecksumSha256: digest,
  narrationAssemblyQualityReportId: stableId,
  narrationAssemblyQualityReportDigest: digest,
  narrationAssemblyAllBlockingGatesPassed: z.literal(true),
  timingAuthority: motionStudioTimingAuthoritySchema,
  profileId: z.literal('motion_studio_storytelling_speech_safe_mix_v1'),
  profileDigest: digest,
  execution: executionAuthoritySchema,
  inputs: z.array(integratedMixInputSchema).min(1).max(65).readonly(),
  output: z.object({
    mimeType: z.literal('audio/wav'),
    codec: z.literal('pcm_s16le'),
    sampleRateHertz: z.literal(48_000),
    channelCount: z.literal(2),
    durationFrames: positiveSafeInteger,
    sampleCountPerChannel: positiveSafeInteger,
  }).strict(),
  speechPriority: z.literal(true),
  providerNativeAudioIsolatedUnlessSelected: z.literal(true),
  callerProvidedFiltersAllowed: z.literal(false),
  callerProvidedFfmpegArgumentsAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
  videoMuxAllowed: z.literal(false),
  renderAllowed: z.literal(false),
  exportAllowed: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.execution.approvedSnapshotId !== value.approvedSnapshotId ||
    value.execution.approvedSnapshotDigest !== value.approvedSnapshotDigest) {
    context.addIssue({ code: 'custom', path: ['execution', 'approvedSnapshotId'], message: 'Mix execution must bind the request approved snapshot.' })
  }
  if (value.output.durationFrames !== value.timingAuthority.durationFrames) {
    context.addIssue({ code: 'custom', path: ['output', 'durationFrames'], message: 'Integrated mix duration must match exact Master Timing authority.' })
  }
  const expectedSamples = samplesForFrame(value.output.durationFrames, value.timingAuthority.frameRate)
  if (expectedSamples === null || value.output.sampleCountPerChannel !== expectedSamples) {
    context.addIssue({ code: 'custom', path: ['output', 'sampleCountPerChannel'], message: 'Integrated mix sample count must map exactly from approved frames.' })
  }
  const narrationInputs = value.inputs.filter((input) => input.role === 'narration')
  if (narrationInputs.length !== 1) {
    context.addIssue({ code: 'custom', path: ['inputs'], message: 'Integrated mix requires exactly one narration-assembly input.' })
  } else {
    const narration = narrationInputs[0]!
    if (narration.sourceId !== value.narrationAssemblyArtifactVersionId ||
      narration.assetVersionId !== value.narrationAssemblyArtifactVersionId ||
      narration.checksumSha256 !== value.narrationAssemblyArtifactChecksumSha256 ||
      narration.placement.frameRange.startFrame !== 0 ||
      narration.placement.frameRange.endFrame !== value.timingAuthority.durationFrames) {
      context.addIssue({ code: 'custom', path: ['inputs'], message: 'Narration assembly must cover the exact complete mix frame range.' })
    }
  }
  const sourceIds = value.inputs.map((input) => input.sourceId)
  const assetVersions = value.inputs.map((input) => input.assetVersionId)
  if (!allUnique(sourceIds) || !allUnique(assetVersions)) {
    context.addIssue({ code: 'custom', path: ['inputs'], message: 'Integrated mix inputs and asset versions must be unique.' })
  }
  value.inputs.forEach((input, index) =>
    validateDestination(input.placement, value.timingAuthority, context, ['inputs', index, 'placement']))
})

export const motionStudioIntegratedMixArtifactV1Schema:
z.ZodType<MotionStudioIntegratedMixArtifactV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_INTEGRATED_MIX_ARTIFACT_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  artifactId: stableId,
  artifactVersionId: stableId,
  integratedMixRequestId: stableId,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  selectionManifestId: stableId,
  selectionManifestDigest: digest,
  narrationAssemblyArtifactId: stableId,
  narrationAssemblyArtifactVersionId: stableId,
  narrationAssemblyArtifactChecksumSha256: digest,
  inputManifestDigest: digest,
  executionAttemptId: stableId,
  profileId: z.literal('motion_studio_storytelling_speech_safe_mix_v1'),
  profileDigest: digest,
  contentDigest: digest,
  checksumSha256: digest,
  byteLength: positiveSafeInteger.max(512 * 1024 * 1024),
  mimeType: z.literal('audio/wav'),
  codec: z.literal('pcm_s16le'),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(2),
  sampleCountPerChannel: positiveSafeInteger,
  durationFrames: positiveSafeInteger,
  frameRate: z.number().int().positive().max(120),
  timingAuthorityDigest: digest,
  privateAsset: z.literal(true),
  createOnly: z.literal(true),
  checksumVerified: z.literal(true),
  privateReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  privateReviewOnly: z.literal(true),
  finalVideoReady: z.literal(false),
  timelineReady: z.literal(false),
  exportReady: z.literal(false),
  productReady: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const expectedSamples = samplesForFrame(value.durationFrames, value.frameRate)
  if (expectedSamples === null || value.sampleCountPerChannel !== expectedSamples) {
    context.addIssue({ code: 'custom', path: ['sampleCountPerChannel'], message: 'Integrated artifact sample count must map exactly from its frame authority.' })
  }
})

const integratedMixQaGateResultSchema = z.object({
  gate: z.enum(MOTION_STUDIO_INTEGRATED_MIX_QA_GATES),
  result: z.enum(['passed', 'failed', 'not_run']),
  blocking: z.literal(true),
  evidenceId: stableId.optional(),
  evidenceDigest: digest.optional(),
  note: safeText(1_000),
}).strict().superRefine((value, context) => {
  const hasEvidence = Boolean(value.evidenceId && value.evidenceDigest)
  if ((value.result === 'passed') !== hasEvidence) {
    context.addIssue({ code: 'custom', path: ['evidenceId'], message: 'Only evidence-backed passed QA gates are accepted as passed.' })
  }
})

export const motionStudioIntegratedMixQualityReportV1Schema:
z.ZodType<MotionStudioIntegratedMixQualityReportV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_INTEGRATED_MIX_QUALITY_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  qualityReportId: stableId,
  integratedMixRequestId: stableId,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  integratedMixArtifactId: stableId,
  integratedMixArtifactVersionId: stableId,
  integratedMixChecksumSha256: digest,
  selectionManifestId: stableId,
  narrationAssemblyManifestId: stableId,
  timingAuthorityDigest: digest,
  integratedLufs: z.number().finite().min(-70).max(0),
  truePeakDbtp: z.number().finite().min(-100).max(0),
  samplePeakDbfs: z.number().finite().min(-100).max(0),
  speechPriorityRatio: z.number().finite().min(1).max(1_000_000),
  gateResults: z.array(integratedMixQaGateResultSchema).length(MOTION_STUDIO_INTEGRATED_MIX_QA_GATES.length).readonly(),
  allBlockingGatesPassed: z.boolean(),
  readyForHumanReview: z.boolean(),
  manualOverrideAllowed: z.literal(false),
  timelineReady: z.literal(false),
  finalVideoReady: z.literal(false),
  exportReady: z.literal(false),
  productReady: z.literal(false),
  reviewedAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const gates = value.gateResults.map((result) => result.gate)
  if (!sameSet(gates, MOTION_STUDIO_INTEGRATED_MIX_QA_GATES)) {
    context.addIssue({ code: 'custom', path: ['gateResults'], message: 'Every integrated-mix QA gate must appear exactly once.' })
  }
  const allPassed = value.gateResults.every((result) =>
    result.result === 'passed' && Boolean(result.evidenceId) && Boolean(result.evidenceDigest))
  if (value.allBlockingGatesPassed !== allPassed || value.readyForHumanReview !== allPassed) {
    context.addIssue({ code: 'custom', path: ['allBlockingGatesPassed'], message: 'QA readiness must be derived from every evidence-backed blocking gate.' })
  }
})

export const motionStudioAudioAcceptanceRecordV1Schema:
z.ZodType<MotionStudioAudioAcceptanceRecordV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_AUDIO_ACCEPTANCE_RECORD_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  audioAcceptanceRecordId: stableId,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  timingAuthorityDigest: digest,
  integratedMixRequestId: stableId,
  selectionManifestId: stableId,
  selectionManifestVersion: positiveSafeInteger,
  selectionManifestDigest: digest,
  narrationAssemblyManifestId: stableId,
  narrationAssemblyManifestDigest: digest,
  integratedMixArtifactId: stableId,
  integratedMixArtifactVersionId: stableId,
  integratedMixChecksumSha256: digest,
  qualityReportId: stableId,
  qualityReportDigest: digest,
  qaAllBlockingGatesPassed: z.boolean(),
  reviewerActorId: stableId,
  decision: z.enum(['accepted', 'changes_requested', 'rejected']),
  decisionReason: safeText(1_000),
  reviewedAt: isoDate,
  fineCutHandoffEligible: z.boolean(),
  manualQaOverridePerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  videoMuxPerformed: z.literal(false),
  renderPerformed: z.literal(false),
  exportPerformed: z.literal(false),
  publicDeliveryPerformed: z.literal(false),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
  productReady: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const eligible = value.decision === 'accepted' && value.qaAllBlockingGatesPassed
  if (value.fineCutHandoffEligible !== eligible) {
    context.addIssue({ code: 'custom', path: ['fineCutHandoffEligible'], message: 'Fine Cut handoff eligibility requires explicit acceptance after every blocking QA gate passed.' })
  }
  if (value.decision === 'accepted' && !value.qaAllBlockingGatesPassed) {
    context.addIssue({ code: 'custom', path: ['decision'], message: 'Human review cannot override failed or incomplete blocking QA.' })
  }
})

export const motionStudioAudioInvalidationRecordV1Schema:
z.ZodType<MotionStudioAudioInvalidationRecordV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_AUDIO_INVALIDATION_RECORD_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  invalidationId: stableId,
  previousSelectionManifestId: stableId,
  previousSelectionManifestVersion: positiveSafeInteger,
  previousSelectionManifestDigest: digest,
  previousAudioAcceptanceRecordId: stableId.optional(),
  cause: z.enum([
    'approved_snapshot_changed', 'prepared_script_changed', 'voice_bible_changed',
    'music_bible_changed', 'picture_lock_changed', 'master_timing_changed',
    'selected_take_changed', 'selected_stem_changed', 'cue_or_event_changed',
    'rights_or_consent_changed', 'review_or_qa_changed', 'mix_profile_changed',
    'cost_or_execution_authority_changed',
  ]),
  causeAuthorityId: stableId,
  previousCauseDigest: digest,
  currentCauseDigest: digest,
  affectedRecords: z.array(z.enum([
    'selection_manifest', 'narration_assembly', 'integrated_mix',
    'quality_report', 'audio_acceptance',
  ])).min(1).max(5).readonly(),
  recoveryAction: z.enum([
    'replanning_required', 'reselection_required', 'remix_required', 're_review_required',
  ]),
  unaffectedCandidateIds: z.array(stableId).max(576).readonly(),
  affectedRecordsStale: z.literal(true),
  approvedHistoryMutated: z.literal(false),
  existingPlanReviewBypassed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  renderPerformed: z.literal(false),
  exportPerformed: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.previousCauseDigest === value.currentCauseDigest) {
    context.addIssue({ code: 'custom', path: ['currentCauseDigest'], message: 'Invalidation requires a real authority-digest change.' })
  }
  if (!allUnique(value.affectedRecords) || !allUnique(value.unaffectedCandidateIds)) {
    context.addIssue({ code: 'custom', path: ['affectedRecords'], message: 'Invalidation record identities must be unique.' })
  }
  if (value.affectedRecords.includes('audio_acceptance') !== Boolean(value.previousAudioAcceptanceRecordId)) {
    context.addIssue({ code: 'custom', path: ['previousAudioAcceptanceRecordId'], message: 'Acceptance invalidation must bind the exact previous acceptance record.' })
  }
  const planningCause = [
    'approved_snapshot_changed', 'prepared_script_changed', 'picture_lock_changed', 'master_timing_changed',
  ].includes(value.cause)
  if (planningCause && value.recoveryAction !== 'replanning_required') {
    context.addIssue({ code: 'custom', path: ['recoveryAction'], message: 'Snapshot, script, picture, and timing changes must return through replanning.' })
  }
})

export const motionStudioAudioAcceptanceChainV1Schema:
z.ZodType<MotionStudioAudioAcceptanceChainV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_AUDIO_ACCEPTANCE_CHAIN_VERSION),
  moduleId: z.literal('storytelling'),
  productionId: stableId,
  selectionManifest: motionStudioAudioSelectionManifestV1Schema,
  narrationAssemblyManifest: motionStudioNarrationAssemblyManifestV1Schema,
  narrationAssemblyArtifact: motionStudioNarrationAssemblyArtifactV1Schema,
  narrationAssemblyQualityReport: motionStudioNarrationAssemblyQualityReportV1Schema,
  integratedMixRequest: motionStudioIntegratedMixRequestV1Schema,
  integratedMixArtifact: motionStudioIntegratedMixArtifactV1Schema,
  integratedMixQualityReport: motionStudioIntegratedMixQualityReportV1Schema,
  audioAcceptanceRecord: motionStudioAudioAcceptanceRecordV1Schema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const records = [
    value.selectionManifest,
    value.narrationAssemblyManifest,
    value.narrationAssemblyArtifact,
    value.narrationAssemblyQualityReport,
    value.integratedMixRequest,
    value.integratedMixArtifact,
    value.integratedMixQualityReport,
    value.audioAcceptanceRecord,
  ]
  records.forEach((record, index) => {
    if (!sameScope(value, record) || record.productionId !== value.productionId) {
      context.addIssue({ code: 'custom', path: ['scope', index], message: 'Every audio-acceptance record must use the exact chain tenant and production scope.' })
    }
  })

  const selection = value.selectionManifest
  const assembly = value.narrationAssemblyManifest
  const assemblyArtifact = value.narrationAssemblyArtifact
  const assemblyQa = value.narrationAssemblyQualityReport
  const mixRequest = value.integratedMixRequest
  const mixArtifact = value.integratedMixArtifact
  const mixQa = value.integratedMixQualityReport
  const acceptance = value.audioAcceptanceRecord

  if (assembly.selectionManifestId !== selection.selectionManifestId ||
    assembly.selectionManifestVersion !== selection.selectionManifestVersion ||
    assembly.approvedSnapshotId !== selection.approvedSnapshotId ||
    assembly.approvedSnapshotDigest !== selection.approvedSnapshotDigest ||
    assembly.timingAuthority.timingAuthorityDigest !== selection.timingAuthority.timingAuthorityDigest) {
    context.addIssue({ code: 'custom', path: ['narrationAssemblyManifest'], message: 'Narration assembly must bind the exact selection, snapshot, and timing authority.' })
  }
  if (assemblyArtifact.narrationAssemblyManifestId !== assembly.narrationAssemblyManifestId ||
    assemblyArtifact.selectionManifestId !== selection.selectionManifestId ||
    assemblyArtifact.selectionManifestVersion !== selection.selectionManifestVersion ||
    assemblyArtifact.approvedSnapshotId !== selection.approvedSnapshotId ||
    assemblyArtifact.approvedSnapshotDigest !== selection.approvedSnapshotDigest ||
    assemblyArtifact.profileId !== assembly.profileId ||
    assemblyArtifact.profileDigest !== assembly.profileDigest ||
    assemblyArtifact.timingAuthorityDigest !== selection.timingAuthority.timingAuthorityDigest) {
    context.addIssue({ code: 'custom', path: ['narrationAssemblyArtifact'], message: 'Narration artifact must bind the exact assembly, selection, snapshot, profile, and timing authority.' })
  }
  if (assemblyQa.narrationAssemblyManifestId !== assembly.narrationAssemblyManifestId ||
    assemblyQa.narrationAssemblyArtifactId !== assemblyArtifact.artifactId ||
    assemblyQa.narrationAssemblyArtifactVersionId !== assemblyArtifact.artifactVersionId ||
    assemblyQa.narrationAssemblyChecksumSha256 !== assemblyArtifact.checksumSha256 ||
    assemblyQa.selectionManifestId !== selection.selectionManifestId ||
    assemblyQa.approvedSnapshotId !== selection.approvedSnapshotId ||
    assemblyQa.approvedSnapshotDigest !== selection.approvedSnapshotDigest ||
    assemblyQa.timingAuthorityDigest !== selection.timingAuthority.timingAuthorityDigest ||
    !assemblyQa.allBlockingGatesPassed || !assemblyQa.integratedMixInputEligible) {
    context.addIssue({ code: 'custom', path: ['narrationAssemblyQualityReport'], message: 'Integrated mixing requires exact passed narration-assembly QA authority.' })
  }
  if (mixRequest.selectionManifestId !== selection.selectionManifestId ||
    mixRequest.selectionManifestVersion !== selection.selectionManifestVersion ||
    mixRequest.narrationAssemblyManifestId !== assembly.narrationAssemblyManifestId ||
    mixRequest.narrationAssemblyArtifactId !== assemblyArtifact.artifactId ||
    mixRequest.narrationAssemblyArtifactVersionId !== assemblyArtifact.artifactVersionId ||
    mixRequest.narrationAssemblyArtifactChecksumSha256 !== assemblyArtifact.checksumSha256 ||
    mixRequest.narrationAssemblyQualityReportId !== assemblyQa.qualityReportId ||
    mixRequest.approvedSnapshotId !== selection.approvedSnapshotId ||
    mixRequest.approvedSnapshotDigest !== selection.approvedSnapshotDigest ||
    mixRequest.timingAuthority.timingAuthorityDigest !== selection.timingAuthority.timingAuthorityDigest) {
    context.addIssue({ code: 'custom', path: ['integratedMixRequest'], message: 'Mix request must bind the exact approved selection and passed narration assembly.' })
  }
  if (mixArtifact.integratedMixRequestId !== mixRequest.integratedMixRequestId ||
    mixArtifact.approvedSnapshotId !== selection.approvedSnapshotId ||
    mixArtifact.approvedSnapshotDigest !== selection.approvedSnapshotDigest ||
    mixArtifact.selectionManifestId !== selection.selectionManifestId ||
    mixArtifact.narrationAssemblyArtifactId !== assemblyArtifact.artifactId ||
    mixArtifact.narrationAssemblyArtifactVersionId !== assemblyArtifact.artifactVersionId ||
    mixArtifact.narrationAssemblyArtifactChecksumSha256 !== assemblyArtifact.checksumSha256 ||
    mixArtifact.executionAttemptId !== mixRequest.execution.attemptId ||
    mixArtifact.profileId !== mixRequest.profileId ||
    mixArtifact.profileDigest !== mixRequest.profileDigest ||
    mixArtifact.timingAuthorityDigest !== selection.timingAuthority.timingAuthorityDigest) {
    context.addIssue({ code: 'custom', path: ['integratedMixArtifact'], message: 'Integrated artifact must bind the exact request, execution, input, profile, snapshot, and timing authority.' })
  }
  if (mixQa.integratedMixRequestId !== mixRequest.integratedMixRequestId ||
    mixQa.approvedSnapshotId !== selection.approvedSnapshotId ||
    mixQa.approvedSnapshotDigest !== selection.approvedSnapshotDigest ||
    mixQa.integratedMixArtifactId !== mixArtifact.artifactId ||
    mixQa.integratedMixArtifactVersionId !== mixArtifact.artifactVersionId ||
    mixQa.integratedMixChecksumSha256 !== mixArtifact.checksumSha256 ||
    mixQa.selectionManifestId !== selection.selectionManifestId ||
    mixQa.narrationAssemblyManifestId !== assembly.narrationAssemblyManifestId ||
    mixQa.timingAuthorityDigest !== selection.timingAuthority.timingAuthorityDigest ||
    !mixQa.allBlockingGatesPassed || !mixQa.readyForHumanReview) {
    context.addIssue({ code: 'custom', path: ['integratedMixQualityReport'], message: 'Audio acceptance requires exact passed integrated-mix QA authority.' })
  }
  if (acceptance.approvedSnapshotId !== selection.approvedSnapshotId ||
    acceptance.approvedSnapshotDigest !== selection.approvedSnapshotDigest ||
    acceptance.timingAuthorityDigest !== selection.timingAuthority.timingAuthorityDigest ||
    acceptance.integratedMixRequestId !== mixRequest.integratedMixRequestId ||
    acceptance.selectionManifestId !== selection.selectionManifestId ||
    acceptance.selectionManifestVersion !== selection.selectionManifestVersion ||
    acceptance.narrationAssemblyManifestId !== assembly.narrationAssemblyManifestId ||
    acceptance.integratedMixArtifactId !== mixArtifact.artifactId ||
    acceptance.integratedMixArtifactVersionId !== mixArtifact.artifactVersionId ||
    acceptance.integratedMixChecksumSha256 !== mixArtifact.checksumSha256 ||
    acceptance.qualityReportId !== mixQa.qualityReportId ||
    acceptance.qaAllBlockingGatesPassed !== mixQa.allBlockingGatesPassed) {
    context.addIssue({ code: 'custom', path: ['audioAcceptanceRecord'], message: 'Human acceptance must bind the exact passed private mix chain.' })
  }
})

function validateDestination(
  destination: {
    frameRange: { startFrame: number; endFrame: number }
    startSampleInclusive: number
    endSampleExclusive: number
  },
  timing: { frameRate: number; durationFrames: number },
  context: z.RefinementCtx,
  path: (string | number)[],
): void {
  if (destination.frameRange.endFrame > timing.durationFrames) {
    context.addIssue({ code: 'custom', path, message: 'Audio destination exceeds exact Master Timing authority.' })
    return
  }
  const expectedStart = samplesForFrame(destination.frameRange.startFrame, timing.frameRate)
  const expectedEnd = samplesForFrame(destination.frameRange.endFrame, timing.frameRate)
  if (expectedStart === null || expectedEnd === null ||
    destination.startSampleInclusive !== expectedStart || destination.endSampleExclusive !== expectedEnd) {
    context.addIssue({ code: 'custom', path, message: 'Audio destination samples must map exactly from approved frames and the 48 kHz sample clock.' })
  }
}

function samplesForFrame(frame: number, frameRate: number): number | null {
  if (!Number.isSafeInteger(frame) || !Number.isSafeInteger(frameRate) || frameRate <= 0 || 48_000 % frameRate !== 0) return null
  const value = frame * (48_000 / frameRate)
  return Number.isSafeInteger(value) ? value : null
}

function sameScope(
  left: { workspaceId: string; projectId: string; editSessionId: string },
  right: { workspaceId: string; projectId: string; editSessionId: string },
): boolean {
  return left.workspaceId === right.workspaceId &&
    left.projectId === right.projectId &&
    left.editSessionId === right.editSessionId
}

function sameVersion(
  left: { artifactId: string; versionId: string; versionNumber: number; contentDigest: string },
  right: { artifactId: string; versionId: string; versionNumber: number; contentDigest: string },
): boolean {
  return left.artifactId === right.artifactId && left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber && left.contentDigest === right.contentDigest
}

function allUnique(values: readonly (string | number)[]): boolean {
  return new Set(values).size === values.length
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return allUnique(left) && allUnique(right) && left.length === right.length &&
    left.every((value) => right.includes(value))
}
