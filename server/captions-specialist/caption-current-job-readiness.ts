import { z } from 'zod'

import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION,
  CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION_V2,
  type CaptionCurrentJobReadinessItem,
  type CaptionCurrentJobReadinessLedger,
  type CaptionCurrentJobReadinessLedgerV2,
  type CaptionCurrentOwnerMountReadiness,
} from '../../src/types/caption-current-job-readiness'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_CURRENT_INTEGRATION_READINESS_V3,
} from './caption-current-integration-readiness'
import {
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF,
} from './caption-shared-owner-integration'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST,
} from './captions-specialist-integration-manifest'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
} from './captions-specialist-integration-qualification'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import type { CaptionSharedOwnerKey } from
  '../../src/types/caption-shared-owner-integration'
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
const ownerSchema = z.enum([
  'visual_intelligence', 'canonical_transcript', 'track_all', 'soundsync',
  'broll_owner',
])
const jobSchema = z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)
const ownerMountSchema: z.ZodType<CaptionCurrentOwnerMountReadiness> = z.object({
  ownerKey: ownerSchema,
  canonicalCompositionMountImplemented: z.boolean(),
  affectedJobTypes: z.array(jobSchema).min(1).max(12),
  captionBridgeImplementationComplete: z.literal(true),
  actualAuthenticatedPrivateEvidenceConsumed: z.literal(false),
  captionMayImplementDuplicateOwner: z.literal(false),
}).strict()
const jobReadinessSchema: z.ZodType<CaptionCurrentJobReadinessItem> = z.object({
  jobType: jobSchema,
  requiredSharedOwnerKeys: z.array(ownerSchema).max(5),
  missingCanonicalOwnerMountKeys: z.array(ownerSchema).max(5),
  sourceReadiness: z.enum([
    'ready_for_private_internal_evidence_run',
    'waiting_on_canonical_owner_mount',
  ]),
  captionOwnedImplementationComplete: z.literal(true),
  planningModeQualified: z.literal(true),
  actualPrivateEvidenceAccepted: z.literal(false),
  terminalPrivateInternalQualified: z.literal(false),
  excludedFromSupportedCapabilitySurface: z.literal(false),
  duplicateSharedOwnerCreated: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const ledgerSchema: z.ZodType<CaptionCurrentJobReadinessLedger> = z.object({
  schemaVersion: z.literal(CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION),
  ledgerId: safeKey,
  ledgerDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  sourceCurrentIntegrationReadinessRef: refSchema,
  sourceIntegrationManifestRef: refSchema,
  sourcePlanningQualificationSnapshotRef: refSchema,
  ownerMounts: z.array(ownerMountSchema).length(5),
  jobs: z.array(jobReadinessSchema).length(41),
  counts: z.object({
    declaredSupportedJobs: z.literal(41),
    captionOwnedImplementationsComplete: z.literal(41),
    sourcePathsReadyForPrivateEvidenceRun: z.literal(37),
    jobsWaitingOnCanonicalOwnerMount: z.literal(4),
    terminalPrivateInternalQualifiedJobs: z.literal(0),
    excludedSupportedJobs: z.literal(0),
  }).strict(),
  currentStatus: z.literal(
    'caption_37_of_41_source_paths_ready_two_owner_mounts_pending'),
  terminalTargetStatus: z.literal(
    'caption_specialist_private_internal_qualified'),
  terminalStatusClaimed: z.literal(false),
  actualCanonicalPrivateEvidenceConsumed: z.literal(false),
  sourceFixtureRelabeledAsActualRuntimeEvidence: z.literal(false),
  publicProductionRequiredForInternalQualification: z.literal(false),
  centralOrchestraRequiredForInternalQualification: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()

const ownerOrder: CaptionSharedOwnerKey[] = [
  'visual_intelligence', 'canonical_transcript', 'track_all', 'soundsync',
  'broll_owner',
]
const canonicalOwnerMounts: Record<CaptionSharedOwnerKey, boolean> = {
  visual_intelligence: true,
  canonical_transcript: true,
  track_all: true,
  soundsync: false,
  broll_owner: false,
}

function ref(id: string, version: string, contentHash: string):
CaptionDomainRef {
  return { id, version, contentHash }
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

const readinessRef = ref(
  CAPTION_CURRENT_INTEGRATION_READINESS_V3.readinessId,
  CAPTION_CURRENT_INTEGRATION_READINESS_V3.schemaVersion,
  CAPTION_CURRENT_INTEGRATION_READINESS_V3.readinessDigestSha256)
const manifestRef = ref(
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId,
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestSchemaVersion,
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash)
const qualificationRef = ref(
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
    .snapshotDigestSha256)

function requiredOwners(jobType: CaptionsSupportedJobType):
CaptionSharedOwnerKey[] {
  return CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF
    .conditionalJobBindings.find((binding) => binding.jobType === jobType)
    ?.requiredOwnerKeys ?? []
}

function createOwnerMounts(): CaptionCurrentOwnerMountReadiness[] {
  return ownerOrder.map((ownerKey) => ({
    ownerKey,
    canonicalCompositionMountImplemented: canonicalOwnerMounts[ownerKey],
    affectedJobTypes: CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF
      .conditionalJobBindings.filter((binding) =>
        binding.requiredOwnerKeys.includes(ownerKey))
      .map((binding) => binding.jobType),
    captionBridgeImplementationComplete: true,
    actualAuthenticatedPrivateEvidenceConsumed: false,
    captionMayImplementDuplicateOwner: false,
  }))
}

function createJobs(): CaptionCurrentJobReadinessItem[] {
  return CAPTIONS_SUPPORTED_JOB_TYPES.map((jobType) => {
    const requiredSharedOwnerKeys = requiredOwners(jobType)
    const missingCanonicalOwnerMountKeys = requiredSharedOwnerKeys.filter(
      (ownerKey) => !canonicalOwnerMounts[ownerKey])
    return {
      jobType,
      requiredSharedOwnerKeys,
      missingCanonicalOwnerMountKeys,
      sourceReadiness: missingCanonicalOwnerMountKeys.length === 0
        ? 'ready_for_private_internal_evidence_run'
        : 'waiting_on_canonical_owner_mount',
      captionOwnedImplementationComplete: true,
      planningModeQualified: true,
      actualPrivateEvidenceAccepted: false,
      terminalPrivateInternalQualified: false,
      excludedFromSupportedCapabilitySurface: false,
      duplicateSharedOwnerCreated: false,
      operationOrRuntimeAuthorityGrantedToCaption: false,
      finalQaApprovalAuthorityGrantedToCaption: false,
      publicDeliveryAuthorityGrantedToCaption: false,
      productionAuthorityGrantedToCaption: false,
    }
  })
}

const expectedOwnerMounts = createOwnerMounts()
const expectedJobs = createJobs()

export function parseCaptionCurrentJobReadinessLedger(
  value: unknown,
): CaptionCurrentJobReadinessLedger {
  assertClosedContractTree(value, 'Caption current job readiness ledger')
  const parsed = ledgerSchema.parse(value)
  const ready = parsed.jobs.filter((job) =>
    job.sourceReadiness === 'ready_for_private_internal_evidence_run').length
  const waiting = parsed.jobs.filter((job) =>
    job.sourceReadiness === 'waiting_on_canonical_owner_mount').length
  if (parsed.ledgerDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'ledgerDigestSha256')
    || refKey(parsed.sourceCurrentIntegrationReadinessRef)
      !== refKey(readinessRef)
    || refKey(parsed.sourceIntegrationManifestRef) !== refKey(manifestRef)
    || refKey(parsed.sourcePlanningQualificationSnapshotRef)
      !== refKey(qualificationRef)
    || JSON.stringify(parsed.ownerMounts) !== JSON.stringify(expectedOwnerMounts)
    || JSON.stringify(parsed.jobs) !== JSON.stringify(expectedJobs)
    || ready !== parsed.counts.sourcePathsReadyForPrivateEvidenceRun
    || waiting !== parsed.counts.jobsWaitingOnCanonicalOwnerMount
    || parsed.jobs.map((job) => job.jobType).join('|')
      !== CAPTIONS_SUPPORTED_JOB_TYPES.join('|')) {
    throw new Error('Caption current job readiness ledger is inconsistent.')
  }
  return structuredClone(parsed)
}

const withoutDigest: Omit<CaptionCurrentJobReadinessLedger,
  'ledgerDigestSha256'> = {
  schemaVersion: CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION,
  ledgerId: 'captions.current.job-readiness.mount-audited',
  observedAt: '2026-08-05T23:30:00.000Z',
  sourceCurrentIntegrationReadinessRef: readinessRef,
  sourceIntegrationManifestRef: manifestRef,
  sourcePlanningQualificationSnapshotRef: qualificationRef,
  ownerMounts: expectedOwnerMounts,
  jobs: expectedJobs,
  counts: {
    declaredSupportedJobs: 41,
    captionOwnedImplementationsComplete: 41,
    sourcePathsReadyForPrivateEvidenceRun: 37,
    jobsWaitingOnCanonicalOwnerMount: 4,
    terminalPrivateInternalQualifiedJobs: 0,
    excludedSupportedJobs: 0,
  },
  currentStatus:
    'caption_37_of_41_source_paths_ready_two_owner_mounts_pending',
  terminalTargetStatus: 'caption_specialist_private_internal_qualified',
  terminalStatusClaimed: false,
  actualCanonicalPrivateEvidenceConsumed: false,
  sourceFixtureRelabeledAsActualRuntimeEvidence: false,
  publicProductionRequiredForInternalQualification: false,
  centralOrchestraRequiredForInternalQualification: false,
  centralOrchestraImplemented: false,
  browserLocalCompletionAccepted: false,
  operationOrRuntimeAuthorityGrantedToCaption: false,
  providerOrModelAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGrantedToCaption: false,
  creditOrBillingAuthorityGrantedToCaption: false,
  publicDeliveryAuthorityGrantedToCaption: false,
  productionAuthorityGrantedToCaption: false,
}

export const CAPTION_CURRENT_JOB_READINESS_LEDGER =
parseCaptionCurrentJobReadinessLedger({
  ...withoutDigest,
  ledgerDigestSha256: calculateSkillContractDigest({
    ...withoutDigest,
    ledgerDigestSha256: '',
  } as unknown as Record<string, unknown>, 'ledgerDigestSha256'),
})

const ownerCompositionRef = ref(
  'captions.shared-owner.private-composition',
  'canonical-caption-shared-owner-private-composition-v1',
  calculateSkillContractDigest({
    version: 'canonical-caption-shared-owner-private-composition-v1',
    soundOwner: 'canonical-sound-caption-owner-service-v1',
    brollOwner: 'canonical-broll-caption-owner-service-v1',
    digest: '',
  }, 'digest'))
const soundOwnerServiceRef = ref(
  'captions.shared-owner.sound-owner',
  'canonical-sound-caption-owner-service-v1',
  calculateSkillContractDigest({
    version: 'canonical-sound-caption-owner-service-v1', digest: '',
  }, 'digest'))
const brollOwnerServiceRef = ref(
  'captions.shared-owner.broll-owner',
  'canonical-broll-caption-owner-service-v1',
  calculateSkillContractDigest({
    version: 'canonical-broll-caption-owner-service-v1', digest: '',
  }, 'digest'))
const priorLedgerRef = ref(
  CAPTION_CURRENT_JOB_READINESS_LEDGER.ledgerId,
  CAPTION_CURRENT_JOB_READINESS_LEDGER.schemaVersion,
  CAPTION_CURRENT_JOB_READINESS_LEDGER.ledgerDigestSha256)
const allMounted = Object.fromEntries(ownerOrder.map((ownerKey) =>
  [ownerKey, true])) as Record<CaptionSharedOwnerKey, boolean>

function createOwnerMountsV2(): CaptionCurrentOwnerMountReadiness[] {
  return ownerOrder.map((ownerKey) => ({
    ownerKey,
    canonicalCompositionMountImplemented: allMounted[ownerKey],
    affectedJobTypes: CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF
      .conditionalJobBindings.filter((binding) =>
        binding.requiredOwnerKeys.includes(ownerKey))
      .map((binding) => binding.jobType),
    captionBridgeImplementationComplete: true,
    actualAuthenticatedPrivateEvidenceConsumed: false,
    captionMayImplementDuplicateOwner: false,
  }))
}

function createJobsV2(): CaptionCurrentJobReadinessItem[] {
  return CAPTIONS_SUPPORTED_JOB_TYPES.map((jobType) => ({
    jobType,
    requiredSharedOwnerKeys: requiredOwners(jobType),
    missingCanonicalOwnerMountKeys: [],
    sourceReadiness: 'ready_for_private_internal_evidence_run',
    captionOwnedImplementationComplete: true,
    planningModeQualified: true,
    actualPrivateEvidenceAccepted: false,
    terminalPrivateInternalQualified: false,
    excludedFromSupportedCapabilitySurface: false,
    duplicateSharedOwnerCreated: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  }))
}

const ownerMountsV2 = createOwnerMountsV2()
const jobsV2 = createJobsV2()
const ledgerSchemaV2: z.ZodType<CaptionCurrentJobReadinessLedgerV2> = z.object({
  schemaVersion: z.literal(CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION_V2),
  ledgerId: safeKey,
  ledgerDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  supersedesReadinessRef: refSchema,
  sourceCurrentIntegrationReadinessRef: refSchema,
  sourceOwnerCompositionRef: refSchema,
  soundOwnerServiceRef: refSchema,
  brollOwnerServiceRef: refSchema,
  ownerMounts: z.array(ownerMountSchema).length(5),
  jobs: z.array(jobReadinessSchema).length(41),
  counts: z.object({
    declaredSupportedJobs: z.literal(41),
    captionOwnedImplementationsComplete: z.literal(41),
    canonicalOwnerCompositionMounts: z.literal(5),
    sourcePathsReadyForPrivateEvidenceRun: z.literal(41),
    jobsWaitingOnCanonicalOwnerMount: z.literal(0),
    terminalPrivateInternalQualifiedJobs: z.literal(0),
    excludedSupportedJobs: z.literal(0),
  }).strict(),
  currentStatus: z.literal(
    'caption_41_of_41_source_paths_ready_for_private_internal_evidence'),
  actualSoundPrivateEvidenceConsumed: z.literal(false),
  actualBrollPrivateEvidenceConsumed: z.literal(false),
  directCaptionVisualInspectionCompletedForThisLedger: z.literal(false),
  independentFinalQaCompletedForThisLedger: z.literal(false),
  terminalTargetStatus: z.literal(
    'caption_specialist_private_internal_qualified'),
  terminalStatusClaimed: z.literal(false),
  sourceFixtureRelabeledAsActualRuntimeEvidence: z.literal(false),
  publicProductionRequiredForInternalQualification: z.literal(false),
  centralOrchestraRequiredForInternalQualification: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()

export function parseCaptionCurrentJobReadinessLedgerV2(
  value: unknown,
): CaptionCurrentJobReadinessLedgerV2 {
  assertClosedContractTree(value, 'Caption current job readiness ledger V2')
  const parsed = ledgerSchemaV2.parse(value)
  if (parsed.ledgerDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'ledgerDigestSha256')
    || refKey(parsed.supersedesReadinessRef) !== refKey(priorLedgerRef)
    || refKey(parsed.sourceCurrentIntegrationReadinessRef)
      !== refKey(readinessRef)
    || refKey(parsed.sourceOwnerCompositionRef) !== refKey(ownerCompositionRef)
    || refKey(parsed.soundOwnerServiceRef) !== refKey(soundOwnerServiceRef)
    || refKey(parsed.brollOwnerServiceRef) !== refKey(brollOwnerServiceRef)
    || JSON.stringify(parsed.ownerMounts) !== JSON.stringify(ownerMountsV2)
    || JSON.stringify(parsed.jobs) !== JSON.stringify(jobsV2)
    || parsed.ownerMounts.some((owner) =>
      !owner.canonicalCompositionMountImplemented)
    || parsed.jobs.some((job) =>
      job.sourceReadiness !== 'ready_for_private_internal_evidence_run'
      || job.missingCanonicalOwnerMountKeys.length > 0)) {
    throw new Error('Caption current job readiness ledger V2 is inconsistent.')
  }
  return structuredClone(parsed)
}

const withoutDigestV2: Omit<CaptionCurrentJobReadinessLedgerV2,
  'ledgerDigestSha256'> = {
  schemaVersion: CAPTION_CURRENT_JOB_READINESS_LEDGER_VERSION_V2,
  ledgerId: 'captions.current.job-readiness.all-owner-mounts-closed',
  observedAt: '2026-08-05T23:59:00.000Z',
  supersedesReadinessRef: priorLedgerRef,
  sourceCurrentIntegrationReadinessRef: readinessRef,
  sourceOwnerCompositionRef: ownerCompositionRef,
  soundOwnerServiceRef,
  brollOwnerServiceRef,
  ownerMounts: ownerMountsV2,
  jobs: jobsV2,
  counts: {
    declaredSupportedJobs: 41,
    captionOwnedImplementationsComplete: 41,
    canonicalOwnerCompositionMounts: 5,
    sourcePathsReadyForPrivateEvidenceRun: 41,
    jobsWaitingOnCanonicalOwnerMount: 0,
    terminalPrivateInternalQualifiedJobs: 0,
    excludedSupportedJobs: 0,
  },
  currentStatus:
    'caption_41_of_41_source_paths_ready_for_private_internal_evidence',
  actualSoundPrivateEvidenceConsumed: false,
  actualBrollPrivateEvidenceConsumed: false,
  directCaptionVisualInspectionCompletedForThisLedger: false,
  independentFinalQaCompletedForThisLedger: false,
  terminalTargetStatus: 'caption_specialist_private_internal_qualified',
  terminalStatusClaimed: false,
  sourceFixtureRelabeledAsActualRuntimeEvidence: false,
  publicProductionRequiredForInternalQualification: false,
  centralOrchestraRequiredForInternalQualification: false,
  centralOrchestraImplemented: false,
  browserLocalCompletionAccepted: false,
  operationOrRuntimeAuthorityGrantedToCaption: false,
  providerOrModelAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGrantedToCaption: false,
  creditOrBillingAuthorityGrantedToCaption: false,
  publicDeliveryAuthorityGrantedToCaption: false,
  productionAuthorityGrantedToCaption: false,
}

export const CAPTION_CURRENT_JOB_READINESS_LEDGER_V2 =
parseCaptionCurrentJobReadinessLedgerV2({
  ...withoutDigestV2,
  ledgerDigestSha256: calculateSkillContractDigest({
    ...withoutDigestV2,
    ledgerDigestSha256: '',
  } as unknown as Record<string, unknown>, 'ledgerDigestSha256'),
})
