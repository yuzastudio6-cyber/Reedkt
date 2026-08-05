import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CanonicalCaptionQualificationOwnerEvidence,
  CanonicalCaptionQualificationRunEvidence,
} from '../../src/types/canonical-caption-qualification-run-evidence'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import {
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF,
} from '../captions-specialist/caption-shared-owner-integration'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
} from '../captions-specialist/captions-specialist-integration-qualification'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionPrivateQualificationCatalogAssembly,
  createCanonicalCaptionPrivateQualificationCatalogReadPort,
  createCanonicalCaptionPrivateQualificationCatalogRepository,
  createCanonicalCaptionPrivateQualificationCatalogRequest,
  createCanonicalCaptionPrivateQualificationCatalogSource,
  parseCanonicalCaptionPrivateQualificationCatalog,
  parseCanonicalCaptionPrivateQualificationCatalogRequest,
} from '../services/canonical-caption-private-qualification-catalog-service'
import {
  createCanonicalCaptionQualificationRunEvidenceRepository,
  parseCanonicalCaptionQualificationRunEvidence,
} from '../services/canonical-caption-qualification-run-evidence-reader'
import {
  createCanonicalCaptionPrivateInternalQualificationRepository,
  createCanonicalCaptionPrivateInternalQualificationService,
  parseCanonicalCaptionPrivateInternalQualificationRecord,
} from '../services/canonical-caption-private-internal-qualification-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'

let assertions = 0
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
async function expectReject(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version = 'canonical-fixture-v1'): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}|${version}`) }
}
function runRequestRef(index: number): CaptionDomainRef {
  return ref(`caption.catalog.run-request.${index}`,
    'canonical-caption-terminal-qualification-request-v1')
}

const planningQualificationRef: CaptionDomainRef = {
  id: CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
  version: CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
  contentHash: CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
    .snapshotDigestSha256,
}
const ownerUserId = 'caption-catalog-user'
const workspaceId = 'caption-catalog-workspace'

function requiredOwners(jobType: CaptionsSupportedJobType): Array<
CanonicalCaptionQualificationOwnerEvidence['ownerKey']> {
  const owners: Array<CanonicalCaptionQualificationOwnerEvidence[
    'ownerKey']> = ['canonical_transcript']
  const binding = CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF
    .conditionalJobBindings.find((item) => item.jobType === jobType)
  for (const ownerKey of binding?.requiredOwnerKeys ?? []) {
    if (!owners.includes(ownerKey)) owners.push(ownerKey)
  }
  return owners
}

function ownerEvidence(
  runIndex: number,
  jobType: CaptionsSupportedJobType,
): CanonicalCaptionQualificationOwnerEvidence[] {
  return requiredOwners(jobType).map((ownerKey) => {
    const evidenceRef = ref(
      `caption.catalog.run-${runIndex}.${jobType}.${ownerKey}.evidence`)
    if (ownerKey === 'canonical_transcript') {
      return {
        ownerKey,
        supportRequestRef: null,
        ownerEvidenceRef: evidenceRef,
        authenticatedOwnerProjectionRef: null,
        resumeRecordRef: null,
        evidenceClass: 'canonical_transcript_authenticated_read',
        exactPersistedOwnerEvidenceReread: true,
        directPeerDispatchPerformedByCaption: false,
        runtimeOrProviderAuthorityGrantedToCaption: false,
        assetMutationAuthorityGrantedToCaption: false,
        finalQaApprovalAuthorityGrantedToCaption: false,
        billingAuthorityGrantedToCaption: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      }
    }
    return {
      ownerKey,
      supportRequestRef: ref(
        `caption.catalog.run-${runIndex}.${jobType}.${ownerKey}.request`),
      ownerEvidenceRef: evidenceRef,
      authenticatedOwnerProjectionRef: ref(
        `caption.catalog.run-${runIndex}.${jobType}.${ownerKey}.projection`),
      resumeRecordRef: ref(
        `caption.catalog.run-${runIndex}.${jobType}.${ownerKey}.resume`),
      evidenceClass: 'canonical_owner_record',
      exactPersistedOwnerEvidenceReread: true,
      directPeerDispatchPerformedByCaption: false,
      runtimeOrProviderAuthorityGrantedToCaption: false,
      assetMutationAuthorityGrantedToCaption: false,
      finalQaApprovalAuthorityGrantedToCaption: false,
      billingAuthorityGrantedToCaption: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    }
  })
}

function buildRun(
  runIndex: number,
  jobTypes: readonly CaptionsSupportedJobType[],
): CanonicalCaptionQualificationRunEvidence {
  const outputId = `caption-catalog-output-${runIndex}`
  const withoutDigest = {
    schemaVersion: 'canonical-caption-qualification-run-evidence-v1' as const,
    recordId: `caption.qualification.catalog.run.${runIndex}`,
    requestRef: runRequestRef(runIndex),
    observedAt: `2026-08-05T2${runIndex}:00:00.000Z`,
    canonicalScope: {
      ownerUserId,
      workspaceId,
      projectId: `caption-catalog-project-${runIndex}`,
      editSessionId: `caption-catalog-edit-${runIndex}`,
      planVersionId: `caption-catalog-plan-${runIndex}`,
      approvedSnapshotRef: ref(`caption-catalog-snapshot-${runIndex}`,
        'private-edit-authority-approved-snapshot-v3'),
    },
    executionPackageRef: ref(`caption-catalog-package-${runIndex}`),
    workGraphRef: ref(`caption-catalog-work-graph-${runIndex}`),
    assetManifestRef: ref(`caption-catalog-manifest-${runIndex}`),
    estimateRef: ref(`caption-catalog-estimate-${runIndex}`),
    approvalRef: ref(`caption-catalog-approval-${runIndex}`),
    creditReservationRef: ref(`caption-catalog-reservation-${runIndex}`),
    captionPlanningProjectionRef: ref(
      `caption-catalog-planning-${runIndex}`),
    captionPrivateReviewProjectionRef: ref(
      `caption-catalog-private-review-${runIndex}`),
    privateReviewAssemblyRef: ref(
      `caption-catalog-review-assembly-${runIndex}`),
    outputEvidence: {
      outputId,
      confirmedOutputFrameRef: ref(
        `caption-catalog-frame-${runIndex}`),
      renderedArtifactRef: ref(
        `caption-catalog-render-${runIndex}`, '1'),
      deterministicQaRef: ref(`caption-catalog-qa-${runIndex}`, '1'),
      qualifiedCompleteTimeVisualReviewRef: ref(
        `caption-catalog-visual-review-${runIndex}`),
      independentFinalQaRef: ref(
        `caption-catalog-final-qa-${runIndex}`),
      privateReviewDecisionRef: ref(
        `caption-catalog-review-decision-${runIndex}`),
      actualCompleteTimeVisualReviewPassed: true as const,
      independentFinalQaPassed: true as const,
      privateReviewAccepted: true as const,
    },
    jobOccurrences: jobTypes.map((jobType, jobIndex) => ({
      occurrenceId:
        `caption.catalog.run-${runIndex}.occurrence.${jobType}`,
      jobType,
      outputId,
      sceneId: jobType.includes('scene')
        ? `caption-catalog-scene-${runIndex}` : null,
      boundaryId: jobType.includes('boundary')
        || jobType.includes('transition')
        ? `caption-catalog-boundary-${runIndex}` : null,
      approvedWorkItemRef: ref(
        `caption.catalog.run-${runIndex}.work-item-${jobIndex}`),
      canonicalJobRef: ref(
        `caption.catalog.run-${runIndex}.job-${jobIndex}`),
      plannedManifestEntryRef: ref(
        `caption.catalog.run-${runIndex}.manifest-${jobIndex}`),
      adapterCompletionRef: ref(
        `caption.catalog.run-${runIndex}.completion-${jobIndex}`),
      selectedArtifactRef: ref(
        `caption.catalog.run-${runIndex}.artifact-${jobIndex}`, '1'),
      artifactQaRef: ref(
        `caption.catalog.run-${runIndex}.artifact-qa-${jobIndex}`),
      artifactReconciliationRef: ref(
        `caption.catalog.run-${runIndex}.reconciliation-${jobIndex}`),
      specialistExecutionReceiptRef: ref(
        `caption.catalog.run-${runIndex}.receipt-${jobIndex}`),
      currentCallResultPairRef: ref(
        `caption.catalog.run-${runIndex}.pair-${jobIndex}`),
      supportResumeChainRef: ref(
        `caption.catalog.run-${runIndex}.chain-${jobIndex}`),
      producedArtifactRefs: [{
        ...ref(`caption.catalog.run-${runIndex}.produced-${jobIndex}`),
        artifactType: `caption_${jobType}_result`,
        producerSkillKey: 'captions',
        privateArtifact: true as const,
        byteFreeRef: true as const,
        sourceSupportRequestRef: null,
      }],
      ownerEvidence: ownerEvidence(runIndex, jobType),
      exactApprovedWorkJobManifestAndCostLineageReread: true as const,
      exactArtifactBytesQaAndReconciliationReread: true as const,
      exactCurrentSpecialistResultHeadReread: true as const,
      resultDisposition: 'completed' as const,
      planningOnly: true as const,
      renderedMediaClaimedByPlanningJob: false as const,
      finalQaClaimedByPlanningJob: false as const,
      unresolvedBlockerCodes: [] as [],
    })),
    exactRequestScopePackageAndOutputSetBound: true as const,
    exactApprovedSnapshotAndExecutionPackageReread: true as const,
    exactAllProjectedCaptionJobsReread: true as const,
    allProjectedCaptionJobsCompleted: true as const,
    allProjectedCaptionArtifactsPersistedQaPassedAndReconciled: true as const,
    actualRequiredOwnerEvidenceReread: true as const,
    approvedCaptionRunEvidenceOnly: true as const,
    terminalJobQualificationClaimed: false as const,
    requiresMultiRunEvidenceCatalogForTerminalQualification: true as const,
    callerSuppliedEvidenceAccepted: false as const,
    browserLocalCompletionAccepted: false as const,
    sourceFixtureRelabeledAsRuntimeEvidence: false as const,
    syntheticEngineeringFixtureClaimedProfessionalAppearance: false as const,
    directPeerDispatchPerformedByCaption: false as const,
    operationOrRuntimeAuthorityGrantedToCaption: false as const,
    providerOrModelAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalAuthorityGrantedToCaption: false as const,
    creditOrBillingAuthorityGrantedToCaption: false as const,
    publicDeliveryAuthorityGrantedToCaption: false as const,
    productionAuthorityGrantedToCaption: false as const,
  }
  return parseCanonicalCaptionQualificationRunEvidence({
    ...withoutDigest,
    recordDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      recordDigestSha256: '',
    } as unknown as Record<string, unknown>, 'recordDigestSha256'),
  })
}

function createRequest(runRefs = [runRequestRef(1), runRequestRef(2)]) {
  return createCanonicalCaptionPrivateQualificationCatalogRequest({
    requestId: 'caption.private.qualification.catalog.request',
    qualificationScope: {
      ownerUserId,
      workspaceId,
      suiteId: 'caption-private-internal-suite',
    },
    sourcePlanningQualificationSnapshotRef: planningQualificationRef,
    runEvidenceRequestRefs: runRefs,
    requiredJobTypes: [...CAPTIONS_SUPPORTED_JOB_TYPES],
    privateInternalQualificationRun: true,
    multipleApprovedRunsExpected: true,
    oneAllFeatureEditRequired: false,
    callerSuppliedRunEvidenceAccepted: false,
    planningOnlyEvidenceAcceptedAsQualification: false,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    browserLocalCompletionAccepted: false,
    centralOrchestraImplemented: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    providerOrModelAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  })
}

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const objects = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      const existing = objects.get(input.objectPath)
      if (existing) {
        if (!existing.equals(input.body)) throw new Error('create-only conflict')
        return 'already_exists'
      }
      objects.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

async function persistedRunRepository(runs: readonly
CanonicalCaptionQualificationRunEvidence[]) {
  const repository = createCanonicalCaptionQualificationRunEvidenceRepository({
    objectPort: memoryObjectPort(),
    prefix: `private-internal/catalog-runs-${runs.length}-${
      runs[0]!.recordDigestSha256.slice(0, 8)}`,
  })
  for (const run of runs) {
    await repository.persistRecordCreateOnly({ record: run })
  }
  return repository
}

async function run(): Promise<void> {
  const firstJobs = CAPTIONS_SUPPORTED_JOB_TYPES.slice(0, 21)
  const secondJobs = CAPTIONS_SUPPORTED_JOB_TYPES.slice(21)
  const firstRun = buildRun(1, firstJobs)
  const secondRun = buildRun(2, secondJobs)
  const request = createRequest()
  check(request.runEvidenceRequestRefs.map((item) => item.id).join('|') ===
    [runRequestRef(1), runRequestRef(2)].sort((left, right) =>
      `${left.id}|${left.version}|${left.contentHash}` <
      `${right.id}|${right.version}|${right.contentHash}` ? -1 : 1)
      .map((item) => item.id).join('|'),
  'Catalog requests must canonicalize the exact run-request order.')

  const runRepository = await persistedRunRepository([firstRun, secondRun])
  const source = createCanonicalCaptionPrivateQualificationCatalogSource({
    runEvidenceRepository: runRepository,
  })
  const catalog = await source.readExact({ request })
  check(catalog?.counts.privateInternalQualifiedJobs === 41
    && catalog.jobQualificationEvidence.map((item) => item.jobType).join('|')
      === CAPTIONS_SUPPORTED_JOB_TYPES.join('|'),
  'Several exact approved runs must cover all 41 jobs in canonical order.')
  check(catalog?.counts.approvedRuns === 2
    && catalog.counts.distinctApprovedSnapshots === 2
    && catalog.counts.distinctReviewedOutputs === 2
    && catalog.multipleApprovedRunsAggregated
    && !catalog.oneAllFeatureEditFabricated,
  'The catalog must retain two distinct snapshots and reviewed outputs.')
  check(catalog?.ownerCoverage.map((item) => item.ownerKey).join('|') ===
    'canonical_transcript|visual_intelligence|track_all|soundsync|broll_owner'
    && catalog.ownerCoverage.every((item) =>
      item.requiredJobCount === item.coveredJobCount),
  'All five exact persisted owner-evidence classes must cover their jobs.')
  check(catalog?.gates.qualifiedCompleteTimeVisualReviewComplete
    && catalog.gates.independentFinalQaAndPrivateReviewComplete
    && catalog.gates.terminalPerJobProjectionReady
    && !catalog.gates.terminalPerJobProjectionPublished,
  'The catalog must be ready for, but not itself claim, terminal projection.')
  check(catalog?.jobQualificationEvidence.every((item) =>
    !item.planningOnlyEvidenceAcceptedAsQualification
    && item.actualApprovedRunCompleted
    && item.actualRenderedOutputReread
    && item.actualCompleteTimeVisualReviewPassed
    && item.actualIndependentFinalQaPassed
    && item.actualPrivateReviewAccepted),
  'Qualification must combine completed planning evidence with accepted output evidence.')
  check(!catalog?.syntheticEngineeringFixtureAcceptedAsProfessionalAppearance
    && !catalog?.terminalStatusClaimed
    && !catalog?.productionAuthorityGrantedToCaption,
  'The catalog must reject synthetic appearance and retain closed authority.')

  const missingRepository = await persistedRunRepository([firstRun])
  const missingSource = createCanonicalCaptionPrivateQualificationCatalogSource({
    runEvidenceRepository: missingRepository,
  })
  check(await missingSource.readExact({ request }) === null,
  'A missing approved run must leave the catalog unavailable.')

  const missingOwnerRun = buildRun(2, secondJobs)
  const brollOccurrence = missingOwnerRun.jobOccurrences.find((item) =>
    item.jobType === 'provide_caption_broll_composition_constraints')!
  brollOccurrence.ownerEvidence = brollOccurrence.ownerEvidence.filter(
    (owner) => owner.ownerKey !== 'broll_owner')
  missingOwnerRun.recordDigestSha256 = calculateSkillContractDigest(
    missingOwnerRun as unknown as Record<string, unknown>,
    'recordDigestSha256')
  const missingOwnerSource =
    createCanonicalCaptionPrivateQualificationCatalogSource({
      runEvidenceRepository: await persistedRunRepository([
        firstRun, parseCanonicalCaptionQualificationRunEvidence(
          missingOwnerRun),
      ]),
    })
  check(await missingOwnerSource.readExact({ request }) === null,
  'A required owner record missing from its exact job must fail closed.')

  const projectionOnlyRun = buildRun(2, secondJobs)
  const projectionOnly = projectionOnlyRun.jobOccurrences.find((item) =>
    item.jobType === 'provide_caption_broll_composition_constraints')!
    .ownerEvidence.find((owner) => owner.ownerKey === 'broll_owner')!
  projectionOnly.evidenceClass = 'authenticated_projection_only'
  projectionOnlyRun.recordDigestSha256 = calculateSkillContractDigest(
    projectionOnlyRun as unknown as Record<string, unknown>,
    'recordDigestSha256')
  const projectionOnlySource =
    createCanonicalCaptionPrivateQualificationCatalogSource({
      runEvidenceRepository: await persistedRunRepository([
        firstRun, parseCanonicalCaptionQualificationRunEvidence(
          projectionOnlyRun),
      ]),
    })
  await expectReject(() => projectionOnlySource.readExact({ request }))

  const crossedRun = buildRun(2, secondJobs)
  crossedRun.canonicalScope.workspaceId = 'crossed-workspace'
  crossedRun.recordDigestSha256 = calculateSkillContractDigest(
    crossedRun as unknown as Record<string, unknown>, 'recordDigestSha256')
  const crossedSource = createCanonicalCaptionPrivateQualificationCatalogSource({
    runEvidenceRepository: await persistedRunRepository([
      firstRun, parseCanonicalCaptionQualificationRunEvidence(crossedRun),
    ]),
  })
  await expectReject(() => crossedSource.readExact({ request }))

  let sourceReads = 0
  const countedSource = createCanonicalCaptionPrivateQualificationCatalogReadPort(
    async (input) => {
      sourceReads += 1
      return source.readExact(input)
    })
  const assembly = createCanonicalCaptionPrivateQualificationCatalogAssembly({
    sourceReadPort: countedSource,
    repository: createCanonicalCaptionPrivateQualificationCatalogRepository({
      objectPort: memoryObjectPort(),
      prefix: 'private-internal/caption-catalog-assembly-smoke',
    }),
  })
  const assembled = await assembly.evidenceReadPort.readExact({ request })
  check(assembled?.catalogDigestSha256 === catalog?.catalogDigestSha256
    && sourceReads === 2,
  'Catalog assembly must reread source runs twice before create-only persistence.')
  const replay = await assembly.evidenceReadPort.readExact({ request })
  check(replay?.catalogDigestSha256 === catalog?.catalogDigestSha256
    && sourceReads === 2,
  'Catalog replay must use persisted evidence without rebuilding source runs.')
  check(assembly.exactRunRecordsRereadBeforeAssembly
    && assembly.createOnlyPersistenceAndExactReread
    && !assembly.planningOnlyEvidenceAcceptedAsQualification
    && !assembly.terminalStatusClaimed,
  'Catalog assembly must preserve the closed non-terminal boundary.')

  const qualificationService =
    createCanonicalCaptionPrivateInternalQualificationService({
      catalogReadPort: assembly.evidenceReadPort,
      repository:
        createCanonicalCaptionPrivateInternalQualificationRepository({
          objectPort: memoryObjectPort(),
          prefix: 'private-internal/caption-final-qualification-smoke',
        }),
    })
  const qualified = await qualificationService.qualifyPrivateInternal(request)
  check(qualified.disposition === 'qualified_private_internal'
    && qualified.record?.currentStatus ===
      'caption_specialist_private_internal_qualified'
    && qualified.record.qualifiedJobs.length === 41
    && qualified.record.qualifiedJobs.every((item) =>
      item.status === 'qualified' && item.blockerCodes.length === 0),
  'A complete persisted catalog must publish the 41-job private qualification record.')
  check(qualified.record?.realApprovedRunsAggregated
    && qualified.record.actualRenderedOutputsReread
    && qualified.record.actualCompleteTimeVisualReviewConsumed
    && qualified.record.actualIndependentFinalQaAndPrivateReviewConsumed
    && qualified.record.finalPerJobQualificationProjectionPublished,
  'The final record must retain the complete approved-run and review lineage.')
  check(qualified.record?.privateInternalQualificationSnapshot.skillKey ===
    'captions'
    && qualified.record.privateInternalQualificationSnapshot.jobEntries
      .length === 41
    && qualified.record.privateInternalQualificationSnapshot.jobEntries
      .every((item) => item.status === 'qualified'
        && item.qualifiedModes.join('|') === 'planning|private_internal'
        && item.blockerCodes.length === 0)
    && !qualified.record.privateInternalQualificationSnapshot
      .wholeSkillQualificationClaimed
    && !qualified.record.privateInternalQualificationSnapshot
      .productionQualificationClaimed
    && qualified.record.privateInternalQualificationSnapshotRef.contentHash
      === qualified.record.privateInternalQualificationSnapshot
        .snapshotDigestSha256,
  'The final record must publish the standard 41-job private qualification snapshot.')
  check(!qualified.record?.publicProductionRequiredForThisStatus
    && !qualified.record?.centralOrchestraImplemented
    && !qualified.record?.planningOnlyEvidenceAcceptedAsQualification
    && !qualified.record?.syntheticEngineeringFixtureAcceptedAsProfessionalAppearance
    && !qualified.publicOrProductionAuthorityGranted,
  'Private qualification must not claim Orchestra, production, or synthetic appearance evidence.')
  const qualifiedReplay = await qualificationService
    .qualifyPrivateInternal(request)
  check(qualifiedReplay.record?.recordDigestSha256 ===
    qualified.record?.recordDigestSha256,
  'Private qualification replay must return the same create-only record.')

  const blockedService =
    createCanonicalCaptionPrivateInternalQualificationService({
      catalogReadPort:
        createCanonicalCaptionPrivateQualificationCatalogReadPort(
          async () => null),
      repository:
        createCanonicalCaptionPrivateInternalQualificationRepository({
          objectPort: memoryObjectPort(),
          prefix: 'private-internal/caption-final-blocked-smoke',
        }),
    })
  const blocked = await blockedService.qualifyPrivateInternal(request)
  check(blocked.disposition ===
    'blocked_missing_canonical_private_evidence'
    && blocked.record === null,
  'Missing canonical run catalog evidence must keep terminal status blocked.')

  const escalatedRecord = structuredClone(qualified.record)!
  ;(escalatedRecord as unknown as Record<string, unknown>)
    .productionAuthorityGrantedToCaption = true
  escalatedRecord.recordDigestSha256 = calculateSkillContractDigest(
    escalatedRecord as unknown as Record<string, unknown>,
    'recordDigestSha256')
  expectThrow(() => parseCanonicalCaptionPrivateInternalQualificationRecord(
    escalatedRecord))

  expectThrow(() => createCanonicalCaptionPrivateInternalQualificationService({
    catalogReadPort: {
      ...assembly.evidenceReadPort,
      readExact: assembly.evidenceReadPort.readExact,
    },
    repository:
      createCanonicalCaptionPrivateInternalQualificationRepository({
        objectPort: memoryObjectPort(),
        prefix: 'private-internal/caption-final-forged-port-smoke',
      }),
  }))

  const unstableSource = createCanonicalCaptionPrivateQualificationCatalogReadPort(
    async () => {
      const value = structuredClone(catalog)!
      if (sourceReads % 2 === 0) {
        value.observedAt = '2026-08-05T23:30:00.000Z'
        value.catalogDigestSha256 = calculateSkillContractDigest(
          value as unknown as Record<string, unknown>, 'catalogDigestSha256')
      }
      sourceReads += 1
      return value
    })
  const unstableAssembly =
    createCanonicalCaptionPrivateQualificationCatalogAssembly({
      sourceReadPort: unstableSource,
      repository: createCanonicalCaptionPrivateQualificationCatalogRepository({
        objectPort: memoryObjectPort(),
        prefix: 'private-internal/caption-catalog-unstable-smoke',
      }),
    })
  await expectReject(() => unstableAssembly.evidenceReadPort.readExact({
    request,
  }))

  const planningOnlyClaim = structuredClone(catalog)!
  ;(planningOnlyClaim as unknown as Record<string, unknown>)
    .planningOnlyEvidenceAcceptedAsQualification = true
  planningOnlyClaim.catalogDigestSha256 = calculateSkillContractDigest(
    planningOnlyClaim as unknown as Record<string, unknown>,
    'catalogDigestSha256')
  expectThrow(() => parseCanonicalCaptionPrivateQualificationCatalog(
    planningOnlyClaim))

  const unusedDeclaredRun = structuredClone(catalog)!
  unusedDeclaredRun.sourceRunEvidenceRefs[1] = ref(
    'caption.catalog.unused-run-evidence')
  unusedDeclaredRun.catalogDigestSha256 = calculateSkillContractDigest(
    unusedDeclaredRun as unknown as Record<string, unknown>,
    'catalogDigestSha256')
  expectThrow(() => parseCanonicalCaptionPrivateQualificationCatalog(
    unusedDeclaredRun))

  const unsortedRequest = structuredClone(request)
  unsortedRequest.runEvidenceRequestRefs.reverse()
  unsortedRequest.requestDigestSha256 = calculateSkillContractDigest(
    unsortedRequest as unknown as Record<string, unknown>,
    'requestDigestSha256')
  expectThrow(() => parseCanonicalCaptionPrivateQualificationCatalogRequest(
    unsortedRequest))

  const duplicateRequest = structuredClone(request)
  duplicateRequest.runEvidenceRequestRefs[1] = structuredClone(
    duplicateRequest.runEvidenceRequestRefs[0]!)
  duplicateRequest.requestDigestSha256 = calculateSkillContractDigest(
    duplicateRequest as unknown as Record<string, unknown>,
    'requestDigestSha256')
  expectThrow(() => parseCanonicalCaptionPrivateQualificationCatalogRequest(
    duplicateRequest))

  expectThrow(() => createCanonicalCaptionPrivateQualificationCatalogSource({
    runEvidenceRepository: {
      ...runRepository,
      rereadRecord: runRepository.rereadRecord,
    },
  }))
  await expectReject(() => assembly.evidenceReadPort.readExact({
    request,
    callerSuppliedRuns: [firstRun, secondRun],
  } as never))

  console.log(JSON.stringify({
    smoke: 'canonical_caption_private_qualification_catalog_service',
    status: 'passed',
    assertions,
    contractFixtureOnly: true,
    actualPrivateEvidencePublishedBySmoke: false,
    approvedRunsRequired: 2,
    captionJobsCovered: 41,
    ownerClassesCovered: 5,
    oneAllFeatureEditFabricated: false,
    planningOnlyEvidenceAcceptedAsQualification: false,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    terminalStatusClaimedByContractFixture: true,
    actualTerminalEvidencePublishedBySmoke: false,
    productionAuthorityGranted: false,
  }, null, 2))
}

void run()
