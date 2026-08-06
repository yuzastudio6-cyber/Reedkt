import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_CONTROLLER_VERSION,
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_VERSION,
  type CanonicalCaptionPrivateQualificationCampaignController,
  type CanonicalCaptionPrivateQualificationCampaignInput,
  type CanonicalCaptionPrivateQualificationCampaignOutcome,
  type CanonicalCaptionPrivateQualificationCampaignRunOutcome,
} from '../../src/types/canonical-caption-private-qualification-campaign'
import {
  CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_SERVICE_VERSION,
  type CanonicalCaptionPrivateInternalQualificationService,
} from '../../src/types/canonical-caption-private-internal-qualification'
import {
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_VERSION,
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_VERSION,
  type CanonicalCaptionPrivateQualificationRunController,
  type CanonicalCaptionPrivateQualificationRunControllerInput,
} from '../../src/types/canonical-caption-private-qualification-run-controller'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  parseCanonicalCaptionPrivateInternalQualificationRecord,
} from './canonical-caption-private-internal-qualification-service'
import {
  parseCanonicalCaptionPrivateQualificationCatalogRequest,
} from './canonical-caption-private-qualification-catalog-service'
import {
  parseCanonicalCaptionRealSourceInspectionProjectionRequest,
} from './canonical-caption-real-source-inspection-projection-service'
import {
  parseCanonicalCaptionTerminalQualificationRequest,
} from './canonical-caption-terminal-qualification-service'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const runInputSchema = z.object({
  inspectionRequest: z.unknown(),
  inspectionBundle: z.unknown(),
  qualificationRequest: z.unknown(),
  captionOwnedClosedDirectInspectionReceiptProvided: z.literal(true),
  exactApprovedRunRereadRequired: z.literal(true),
  callerSuppliedCanonicalAuthorityAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const campaignInputSchema = z.object({
  catalogRequest: z.unknown(),
  approvedRuns: z.array(z.unknown()).min(2).max(128),
  exactCatalogRunSetRequired: z.literal(true),
  multipleApprovedSnapshotsRequired: z.literal(true),
  oneAllFeatureEditFabricated: z.literal(false),
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
    CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_VERSION),
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

export function parseCanonicalCaptionPrivateQualificationCampaignOutcome(
  value: unknown,
): CanonicalCaptionPrivateQualificationCampaignOutcome {
  assertClosedContractTree(value,
    'Canonical Caption private qualification campaign outcome')
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
  const waitingOnRuns = parsed.disposition ===
    'waiting_for_complete_approved_runs'
  const waitingOnCatalog = parsed.disposition ===
    'waiting_for_complete_catalog_coverage'
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
    || waitingOnRuns !== !allRecorded
    || waitingOnCatalog !== (allRecorded && !qualified)
    || (record && (!sameRef(record.requestRef, parsed.catalogRequestRef)
      || record.currentStatus !==
        'caption_specialist_private_internal_qualified'))
    || parsed.runOutcomes.some((item) =>
      (item.disposition === 'approved_run_recorded') !==
        (item.qualificationRunEvidenceRef !== null))) {
    throw new Error(
      'Canonical Caption private qualification campaign outcome is invalid.')
  }
  return structuredClone({ ...parsed, qualificationRecord: record }) as
    CanonicalCaptionPrivateQualificationCampaignOutcome
}

export function createCanonicalCaptionPrivateQualificationCampaignController(
  input: {
    readonly approvedRunController:
      CanonicalCaptionPrivateQualificationRunController
    readonly qualificationService:
      CanonicalCaptionPrivateInternalQualificationService
  },
): CanonicalCaptionPrivateQualificationCampaignController {
  assertControllerDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_CONTROLLER_VERSION,
    exactCatalogRunSetRequired: true as const,
    multipleApprovedSnapshotsRequired: true as const,
    oneAllFeatureEditAllowed: false as const,
    incompleteRunOrCatalogPromotionAllowed: false as const,
    privateInternalQualificationHarnessOnly: true as const,
    async reconcileCampaign(untrusted: unknown) {
      const campaign = parseCampaignInput(untrusted)
      const runOutcomes: CanonicalCaptionPrivateQualificationCampaignRunOutcome[] =
        []
      for (const approvedRun of campaign.approvedRuns) {
        const outcome = await input.approvedRunController
          .reconcileApprovedRun(approvedRun)
        if (outcome.schemaVersion !==
          CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_OUTCOME_VERSION
          || outcome.outcomeDigestSha256 !== calculateSkillContractDigest(
            outcome as unknown as Record<string, unknown>,
            'outcomeDigestSha256')) {
          throw new Error(
            'Canonical Caption approved-run controller returned invalid evidence.')
        }
        runOutcomes.push({
          runQualificationRequestRef: qualificationRequestRef(
            approvedRun.qualificationRequest),
          approvedSnapshotRef: structuredClone(
            approvedRun.qualificationRequest.canonicalScope
              .approvedSnapshotRef),
          outputId: approvedRun.qualificationRequest.requiredOutputIds[0]!,
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
          'Canonical Caption qualification service returned invalid state.')
      }
      const qualificationRecord = qualification?.record
        ? parseCanonicalCaptionPrivateInternalQualificationRecord(
          qualification.record) : null
      const withoutDigest: Omit<
        CanonicalCaptionPrivateQualificationCampaignOutcome,
        'outcomeDigestSha256'> = {
        schemaVersion:
          CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CAMPAIGN_OUTCOME_VERSION,
        disposition: !allRecorded
          ? 'waiting_for_complete_approved_runs'
          : qualificationRecord
            ? 'qualified_private_internal'
            : 'waiting_for_complete_catalog_coverage',
        catalogRequestRef: catalogRequestRef(campaign.catalogRequest),
        runOutcomes,
        missingRunRequestRefs,
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
        parseCanonicalCaptionPrivateQualificationCampaignOutcome({
          ...withoutDigest,
          outcomeDigestSha256: calculateSkillContractDigest({
            ...withoutDigest,
            outcomeDigestSha256: '',
          } as unknown as Record<string, unknown>, 'outcomeDigestSha256'),
        }))
    },
  })
}

function parseCampaignInput(
  value: unknown,
): CanonicalCaptionPrivateQualificationCampaignInput {
  assertClosedContractTree(value,
    'Canonical Caption private qualification campaign input')
  const parsed = campaignInputSchema.parse(value)
  const catalogRequest =
    parseCanonicalCaptionPrivateQualificationCatalogRequest(
      parsed.catalogRequest)
  const approvedRuns = parsed.approvedRuns.map((item) => {
    const run = runInputSchema.parse(item)
    return {
      ...run,
      inspectionRequest:
        parseCanonicalCaptionRealSourceInspectionProjectionRequest(
          run.inspectionRequest),
      inspectionBundle: structuredClone(run.inspectionBundle),
      qualificationRequest:
        parseCanonicalCaptionTerminalQualificationRequest(
          run.qualificationRequest),
    } as CanonicalCaptionPrivateQualificationRunControllerInput
  }).sort((left, right) => compareRefs(
    qualificationRequestRef(left.qualificationRequest),
    qualificationRequestRef(right.qualificationRequest)))
  assertCampaignIdentity(catalogRequest, approvedRuns)
  return {
    ...parsed,
    catalogRequest,
    approvedRuns,
  } as CanonicalCaptionPrivateQualificationCampaignInput
}

function assertCampaignIdentity(
  catalog: CanonicalCaptionPrivateQualificationCampaignInput[
    'catalogRequest'],
  runs: CanonicalCaptionPrivateQualificationRunControllerInput[],
): void {
  const runRefs = runs.map((run) => qualificationRequestRef(
    run.qualificationRequest))
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
      'Canonical Caption qualification campaign crossed its run catalog.')
  }
}

function assertControllerDependencies(input: {
  approvedRunController: CanonicalCaptionPrivateQualificationRunController
  qualificationService: CanonicalCaptionPrivateInternalQualificationService
}): void {
  if (!input.approvedRunController
    || input.approvedRunController.schemaVersion !==
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_RUN_CONTROLLER_VERSION
    || !input.approvedRunController.closedCaptionDirectInspectionReceiptRequired
    || !input.approvedRunController.exactApprovedRunRereadRequired
    || input.approvedRunController.incompleteRunPromotionAllowed
    || typeof input.approvedRunController.reconcileApprovedRun !== 'function'
    || !input.qualificationService
    || input.qualificationService.schemaVersion !==
      CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_SERVICE_VERSION
    || typeof input.qualificationService.qualifyPrivateInternal !== 'function') {
    throw new Error(
      'Canonical Caption qualification campaign dependencies are invalid.')
  }
}

function qualificationRequestRef(
  request: CanonicalCaptionPrivateQualificationRunControllerInput[
    'qualificationRequest'],
): CaptionDomainRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function catalogRequestRef(
  request: CanonicalCaptionPrivateQualificationCampaignInput[
    'catalogRequest'],
): CaptionDomainRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function qualificationRecordRef(
  record: NonNullable<
    CanonicalCaptionPrivateQualificationCampaignOutcome[
      'qualificationRecord']>,
): CaptionDomainRef {
  return {
    id: record.recordId,
    version: record.schemaVersion,
    contentHash: record.recordDigestSha256,
  }
}

function sameRefs(
  left: readonly CaptionDomainRef[],
  right: readonly CaptionDomainRef[],
): boolean {
  return left.length === right.length
    && left.every((item, index) => sameRef(item, right[index]!))
}

function isSortedUniqueRefs(values: readonly CaptionDomainRef[]): boolean {
  if (new Set(values.map(refKey)).size !== values.length) return false
  return values.every((item, index) => index === 0
    || compareRefs(values[index - 1]!, item) < 0)
}

function compareRefs(left: CaptionDomainRef, right: CaptionDomainRef): number {
  const leftKey = refKey(left)
  const rightKey = refKey(right)
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}\u0000${value.version}\u0000${value.contentHash}`
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
