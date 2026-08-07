import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_CONTROLLER_V2_VERSION,
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_V2_VERSION,
  type CanonicalCaptionPrivateQualificationCampaignControllerV2,
  type CanonicalCaptionPrivateQualificationCampaignInputV2,
  type CanonicalCaptionPrivateQualificationCampaignOutcomeV2,
  type CanonicalCaptionPrivateQualificationCampaignRunOutcomeV2,
} from '../../src/types/canonical-caption-private-qualification-campaign-v2'
import {
  CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_SERVICE_VERSION,
  type CanonicalCaptionPrivateInternalQualificationService,
} from '../../src/types/canonical-caption-private-internal-qualification'
import type {
  CanonicalCaptionPrivateQualificationRunControllerInputV2,
  CanonicalCaptionPrivateQualificationRunControllerV2,
} from '../../src/types/canonical-caption-private-qualification-run-controller-v2'
import {
  CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_REQUEST_VERSION,
} from '../../src/types/canonical-caption-broll-owner-inspection-projection'
import {
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_REQUEST_VERSION,
} from '../../src/types/canonical-caption-real-source-inspection-projection'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  parseCanonicalCaptionPrivateInternalQualificationRecord,
} from './canonical-caption-private-internal-qualification-service'
import {
  parseCanonicalCaptionPrivateQualificationCatalogRequest,
} from './canonical-caption-private-qualification-catalog-service'
import {
  canonicalCaptionQualificationRunRequestRef,
  isCanonicalCaptionPrivateQualificationRunControllerV2,
  parseCanonicalCaptionPrivateQualificationRunControllerInputV2,
  parseCanonicalCaptionPrivateQualificationRunOutcomeV2,
} from './canonical-caption-private-qualification-run-controller-v2'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const campaignInputSchema = z.object({
  catalogRequest: z.unknown(),
  approvedRuns: z.array(z.unknown()).min(2).max(128),
  exactCatalogRunSetRequired: z.literal(true),
  multipleApprovedSnapshotsRequired: z.literal(true),
  oneAllFeatureEditFabricated: z.literal(false),
  mixedInspectionLanesAllowed: z.literal(true),
  privateInternalQualificationHarnessOnly: z.literal(true),
  callerSuppliedCanonicalAuthorityAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const runOutcomeSchema = z.object({
  runQualificationRequestRef: refSchema,
  approvedSnapshotRef: refSchema,
  outputId: safeKey,
  inspectionLane: z.enum(['uploaded_source', 'broll_owner']),
  inspectionRequestRef: refSchema,
  runOutcomeDigestSha256: sha256,
  disposition: z.enum([
    'inspection_projected_waiting_for_complete_run',
    'approved_run_recorded',
  ]),
  inspectionEvidenceRef: refSchema,
  qualificationRunEvidenceRef: refSchema.nullable(),
}).strict()
const campaignOutcomeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_V2_VERSION),
  outcomeDigestSha256: sha256,
  disposition: z.enum([
    'waiting_for_complete_approved_runs',
    'waiting_for_complete_catalog_coverage',
    'qualified_private_internal',
  ]),
  catalogRequestRef: refSchema,
  runOutcomes: z.array(runOutcomeSchema).min(2).max(128),
  missingRunRequestRefs: z.array(refSchema).max(128),
  qualificationRecord: z.unknown().nullable(),
  qualificationRecordRef: refSchema.nullable(),
  everyDeclaredRunReconciled: z.boolean(),
  catalogAssemblyAndReleaseAttempted: z.boolean(),
  qualificationRecordPersistedAndExactReread: z.boolean(),
  incompleteRunOrCatalogPromoted: z.literal(false),
  exactCatalogRunSetRequired: z.literal(true),
  multipleApprovedSnapshotsRequired: z.literal(true),
  oneAllFeatureEditFabricated: z.literal(false),
  mixedInspectionLanesAllowed: z.literal(true),
  privateInternalQualificationHarnessOnly: z.literal(true),
  callerSuppliedCanonicalAuthorityAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()

const admittedCampaignControllers = new WeakSet<object>()

export function parseCanonicalCaptionPrivateQualificationCampaignOutcomeV2(
  value: unknown,
): CanonicalCaptionPrivateQualificationCampaignOutcomeV2 {
  assertClosedContractTree(value,
    'Canonical Caption private qualification campaign outcome V2')
  const parsed = campaignOutcomeSchema.parse(value)
  const record = parsed.qualificationRecord === null ? null
    : parseCanonicalCaptionPrivateInternalQualificationRecord(
      parsed.qualificationRecord)
  const recordRef = record ? qualificationRecordRef(record) : null
  const missing = parsed.runOutcomes.filter((item) =>
    item.disposition === 'inspection_projected_waiting_for_complete_run')
    .map((item) => item.runQualificationRequestRef)
  const allRecorded = missing.length === 0
  const qualified = record !== null
  if (parsed.outcomeDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'outcomeDigestSha256')
    || !isSortedUniqueRefs(parsed.runOutcomes.map((item) =>
      item.runQualificationRequestRef))
    || !sameRefs(parsed.missingRunRequestRefs, missing)
    || parsed.everyDeclaredRunReconciled !== allRecorded
    || parsed.catalogAssemblyAndReleaseAttempted !== allRecorded
    || parsed.qualificationRecordPersistedAndExactReread !== qualified
    || (recordRef === null) !== (parsed.qualificationRecordRef === null)
    || (recordRef && parsed.qualificationRecordRef
      && !sameRef(recordRef, parsed.qualificationRecordRef))
    || qualified !== (parsed.disposition === 'qualified_private_internal')
    || (parsed.disposition === 'waiting_for_complete_approved_runs')
      !== !allRecorded
    || (parsed.disposition === 'waiting_for_complete_catalog_coverage')
      !== (allRecorded && !qualified)
    || (record && (!sameRef(record.requestRef, parsed.catalogRequestRef)
      || record.currentStatus !==
        'caption_specialist_private_internal_qualified'))
    || parsed.runOutcomes.some((item) =>
      (item.disposition === 'approved_run_recorded') !==
        (item.qualificationRunEvidenceRef !== null)
      || item.inspectionLane !== inspectionLaneForRequestVersion(
        item.inspectionRequestRef.version))) {
    throw new Error(
      'Canonical Caption private qualification campaign outcome V2 invalid.')
  }
  return structuredClone({ ...parsed, qualificationRecord: record }) as
    CanonicalCaptionPrivateQualificationCampaignOutcomeV2
}

export function createCanonicalCaptionPrivateQualificationCampaignControllerV2(
  input: {
    readonly approvedRunController:
      CanonicalCaptionPrivateQualificationRunControllerV2
    readonly qualificationService:
      CanonicalCaptionPrivateInternalQualificationService
  },
): CanonicalCaptionPrivateQualificationCampaignControllerV2 {
  assertDependencies(input)
  const controller = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_CONTROLLER_V2_VERSION,
    exactCatalogRunSetRequired: true as const,
    multipleApprovedSnapshotsRequired: true as const,
    oneAllFeatureEditAllowed: false as const,
    mixedInspectionLanesAllowed: true as const,
    incompleteRunOrCatalogPromotionAllowed: false as const,
    privateInternalQualificationHarnessOnly: true as const,
    async reconcileCampaign(untrusted: unknown) {
      const campaign = parseCampaignInput(untrusted)
      const runOutcomes:
      CanonicalCaptionPrivateQualificationCampaignRunOutcomeV2[] = []
      for (const approvedRun of campaign.approvedRuns) {
        const outcome =
          parseCanonicalCaptionPrivateQualificationRunOutcomeV2(
            await input.approvedRunController.reconcileApprovedRun(
              approvedRun))
        if (outcome.inspectionLane !== approvedRun.inspectionLane
          || !sameRef(inspectionRequestRef(
            outcome.inspectionProjection.request), inspectionRequestRef(
            approvedRun.inspectionRequest))) {
          throw new Error(
            'Canonical Caption campaign controller crossed inspection lane.')
        }
        runOutcomes.push({
          runQualificationRequestRef:
            canonicalCaptionQualificationRunRequestRef(
              approvedRun.qualificationRequest),
          approvedSnapshotRef: structuredClone(
            approvedRun.qualificationRequest.canonicalScope
              .approvedSnapshotRef),
          outputId: approvedRun.qualificationRequest.requiredOutputIds[0]!,
          inspectionLane: approvedRun.inspectionLane,
          inspectionRequestRef: inspectionRequestRef(
            approvedRun.inspectionRequest),
          runOutcomeDigestSha256: outcome.outcomeDigestSha256,
          disposition: outcome.disposition,
          inspectionEvidenceRef: structuredClone(
            outcome.inspectionEvidenceRef),
          qualificationRunEvidenceRef: outcome.qualificationRunEvidenceRef
            ? structuredClone(outcome.qualificationRunEvidenceRef) : null,
        })
      }
      const missingRunRequestRefs = runOutcomes.filter((item) =>
        item.disposition === 'inspection_projected_waiting_for_complete_run')
        .map((item) => structuredClone(item.runQualificationRequestRef))
      const allRecorded = missingRunRequestRefs.length === 0
      const qualification = allRecorded
        ? await input.qualificationService.qualifyPrivateInternal(
          campaign.catalogRequest)
        : null
      if (qualification && (!sameRef(
        catalogRequestRef(qualification.request),
        catalogRequestRef(campaign.catalogRequest))
        || qualification.currentProductStatusChanged
        || qualification.centralOrchestraImplemented
        || qualification.publicOrProductionAuthorityGranted
        || (qualification.record === null) !==
          (qualification.disposition ===
            'blocked_missing_canonical_private_evidence'))) {
        throw new Error(
          'Canonical Caption qualification service returned invalid state V2.')
      }
      const qualificationRecord = qualification?.record
        ? parseCanonicalCaptionPrivateInternalQualificationRecord(
          qualification.record) : null
      return createOutcome({
        campaign,
        runOutcomes,
        missingRunRequestRefs,
        qualificationRecord,
      })
    },
  })
  admittedCampaignControllers.add(controller)
  return controller
}

export function isCanonicalCaptionPrivateQualificationCampaignControllerV2(
  value: unknown,
): value is CanonicalCaptionPrivateQualificationCampaignControllerV2 {
  return Boolean(value && typeof value === 'object'
    && admittedCampaignControllers.has(value as object))
}

function createOutcome(input: {
  campaign: CanonicalCaptionPrivateQualificationCampaignInputV2
  runOutcomes: CanonicalCaptionPrivateQualificationCampaignRunOutcomeV2[]
  missingRunRequestRefs: CaptionDomainRef[]
  qualificationRecord:
    CanonicalCaptionPrivateQualificationCampaignOutcomeV2[
      'qualificationRecord']
}): CanonicalCaptionPrivateQualificationCampaignOutcomeV2 {
  const allRecorded = input.missingRunRequestRefs.length === 0
  const qualificationRecord = input.qualificationRecord
  const withoutDigest: Omit<
    CanonicalCaptionPrivateQualificationCampaignOutcomeV2,
    'outcomeDigestSha256'> = {
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_V2_VERSION,
    disposition: !allRecorded
      ? 'waiting_for_complete_approved_runs'
      : qualificationRecord
        ? 'qualified_private_internal'
        : 'waiting_for_complete_catalog_coverage',
    catalogRequestRef: catalogRequestRef(input.campaign.catalogRequest),
    runOutcomes: input.runOutcomes,
    missingRunRequestRefs: input.missingRunRequestRefs,
    qualificationRecord,
    qualificationRecordRef: qualificationRecord
      ? qualificationRecordRef(qualificationRecord) : null,
    everyDeclaredRunReconciled: allRecorded,
    catalogAssemblyAndReleaseAttempted: allRecorded,
    qualificationRecordPersistedAndExactReread:
      qualificationRecord !== null,
    incompleteRunOrCatalogPromoted: false,
    exactCatalogRunSetRequired: true,
    multipleApprovedSnapshotsRequired: true,
    oneAllFeatureEditFabricated: false,
    mixedInspectionLanesAllowed: true,
    privateInternalQualificationHarnessOnly: true,
    callerSuppliedCanonicalAuthorityAccepted: false,
    browserLocalCompletionAccepted: false,
    centralOrchestraImplemented: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    providerOrModelAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  }
  return Object.freeze(
    parseCanonicalCaptionPrivateQualificationCampaignOutcomeV2({
      ...withoutDigest,
      outcomeDigestSha256: calculateSkillContractDigest({
        ...withoutDigest,
        outcomeDigestSha256: '',
      } as unknown as Record<string, unknown>, 'outcomeDigestSha256'),
    }))
}

function parseCampaignInput(
  value: unknown,
): CanonicalCaptionPrivateQualificationCampaignInputV2 {
  assertClosedContractTree(value,
    'Canonical Caption private qualification campaign input V2')
  const parsed = campaignInputSchema.parse(value)
  const catalogRequest =
    parseCanonicalCaptionPrivateQualificationCatalogRequest(
      parsed.catalogRequest)
  const approvedRuns = parsed.approvedRuns.map((run) =>
    parseCanonicalCaptionPrivateQualificationRunControllerInputV2(run))
    .sort((left, right) => compareRefs(
      canonicalCaptionQualificationRunRequestRef(
        left.qualificationRequest),
      canonicalCaptionQualificationRunRequestRef(
        right.qualificationRequest)))
  assertCampaignIdentity(catalogRequest, approvedRuns)
  return {
    ...parsed,
    catalogRequest,
    approvedRuns,
  } as CanonicalCaptionPrivateQualificationCampaignInputV2
}

function assertCampaignIdentity(
  catalog: CanonicalCaptionPrivateQualificationCampaignInputV2[
    'catalogRequest'],
  runs: CanonicalCaptionPrivateQualificationRunControllerInputV2[],
): void {
  const runRefs = runs.map((run) =>
    canonicalCaptionQualificationRunRequestRef(run.qualificationRequest))
  const snapshotRefs = runs.map((run) =>
    run.qualificationRequest.canonicalScope.approvedSnapshotRef)
  if (!sameRefs(catalog.runEvidenceRequestRefs, runRefs)
    || !isSortedUniqueRefs(runRefs)
    || new Set(snapshotRefs.map(refKey)).size < 2
    || runs.some((run) => {
      const qualification = run.qualificationRequest
      const inspection = run.inspectionRequest
      return qualification.canonicalScope.ownerUserId !==
          catalog.qualificationScope.ownerUserId
        || qualification.canonicalScope.workspaceId !==
          catalog.qualificationScope.workspaceId
        || inspection.canonicalScope.ownerUserId !==
          catalog.qualificationScope.ownerUserId
        || inspection.canonicalScope.workspaceId !==
          catalog.qualificationScope.workspaceId
        || qualification.requiredOutputIds.length !== 1
        || qualification.requiredOutputIds[0] !==
          inspection.canonicalScope.outputId
        || !sameRef(qualification.canonicalScope.approvedSnapshotRef,
          inspection.canonicalScope.approvedSnapshotRef)
        || !sameRef(qualification.executionPackageRef,
          inspection.canonicalScope.executionPackageRef)
    })) {
    throw new Error(
      'Canonical Caption qualification campaign V2 crossed its run catalog.')
  }
}

function assertDependencies(input: {
  approvedRunController: CanonicalCaptionPrivateQualificationRunControllerV2
  qualificationService: CanonicalCaptionPrivateInternalQualificationService
}): void {
  if (!isCanonicalCaptionPrivateQualificationRunControllerV2(
    input.approvedRunController)
    || !input.qualificationService
    || input.qualificationService.schemaVersion !==
      CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_SERVICE_VERSION
    || typeof input.qualificationService.qualifyPrivateInternal !== 'function') {
    throw new Error(
      'Canonical Caption qualification campaign V2 dependencies invalid.')
  }
}

function catalogRequestRef(input: {
  requestId: string
  schemaVersion: string
  requestDigestSha256: string
}): CaptionDomainRef {
  return {
    id: input.requestId,
    version: input.schemaVersion,
    contentHash: input.requestDigestSha256,
  }
}

function qualificationRecordRef(input: {
  recordId: string
  schemaVersion: string
  recordDigestSha256: string
}): CaptionDomainRef {
  return {
    id: input.recordId,
    version: input.schemaVersion,
    contentHash: input.recordDigestSha256,
  }
}

function inspectionRequestRef(input: {
  requestId: string
  schemaVersion: string
  requestDigestSha256: string
}): CaptionDomainRef {
  return {
    id: input.requestId,
    version: input.schemaVersion,
    contentHash: input.requestDigestSha256,
  }
}

function inspectionLaneForRequestVersion(
  version: string,
): 'uploaded_source' | 'broll_owner' | null {
  if (version ===
    CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_REQUEST_VERSION) {
    return 'uploaded_source'
  }
  if (version === CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_REQUEST_VERSION) {
    return 'broll_owner'
  }
  return null
}

function compareRefs(left: CaptionDomainRef, right: CaptionDomainRef): number {
  const leftKey = refKey(left)
  const rightKey = refKey(right)
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
}

function isSortedUniqueRefs(values: CaptionDomainRef[]): boolean {
  return values.every((value, index) => index === 0
    || compareRefs(values[index - 1]!, value) < 0)
}

function sameRefs(left: CaptionDomainRef[], right: CaptionDomainRef[]): boolean {
  return left.length === right.length
    && left.every((value, index) => sameRef(value, right[index]!))
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}
