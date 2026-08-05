import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CanonicalCaptionQualificationRunEvidence } from
  '../../src/types/canonical-caption-qualification-run-evidence'
import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2,
} from '../captions-specialist/caption-current-job-readiness'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionQualificationRunEvidenceAssembly,
  createCanonicalCaptionQualificationRunEvidenceReadPort,
  createCanonicalCaptionQualificationRunEvidenceRepository,
  parseCanonicalCaptionQualificationRunEvidence,
  parseCanonicalCaptionQualificationRunEvidenceV1,
} from '../services/canonical-caption-qualification-run-evidence-reader'
import {
  createCanonicalCaptionTerminalQualificationRequest,
} from '../services/canonical-caption-terminal-qualification-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
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

const snapshotRef = ref('caption.run.snapshot',
  'private-edit-authority-approved-snapshot-v3')
const executionPackageRef = ref('caption.run.package',
  'canonical-approved-edit-execution-package-v1')
const outputId = 'caption-run-output'
const request = createCanonicalCaptionTerminalQualificationRequest({
  requestId: 'caption.qualification.run.request',
  canonicalScope: {
    ownerUserId: 'caption-run-user',
    workspaceId: 'caption-run-workspace',
    projectId: 'caption-run-project',
    editSessionId: 'caption-run-edit',
    planVersionId: 'caption-run-plan',
    approvedSnapshotRef: snapshotRef,
  },
  executionPackageRef,
  currentJobReadinessRef: {
    id: CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerId,
    version: CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.schemaVersion,
    contentHash:
      CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerDigestSha256,
  },
  requiredOutputIds: [outputId],
  privateInternalQualificationRun: true,
  callerSuppliedEvidenceAccepted: false,
  browserLocalCompletionAccepted: false,
  rawChatMediaBytesPathsUrlsOrCredentialsIncluded: false,
  operationOrRuntimeAuthorityGrantedToCaption: false,
  providerOrModelAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGrantedToCaption: false,
  creditOrBillingAuthorityGrantedToCaption: false,
  publicDeliveryAuthorityGrantedToCaption: false,
  productionAuthorityGrantedToCaption: false,
})

function buildRecord(): CanonicalCaptionQualificationRunEvidence {
  const requestRef = {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
  const withoutDigest = {
    schemaVersion: 'canonical-caption-qualification-run-evidence-v2' as const,
    recordId: 'caption.qualification.run.record',
    requestRef,
    observedAt: '2026-08-05T20:30:00.000Z',
    canonicalScope: structuredClone(request.canonicalScope),
    executionPackageRef,
    workGraphRef: ref('caption.run.work-graph'),
    assetManifestRef: ref('caption.run.asset-manifest'),
    estimateRef: ref('caption.run.estimate'),
    approvalRef: ref('caption.run.approval'),
    creditReservationRef: ref('caption.run.reservation'),
    captionPlanningProjectionRef: ref('caption.run.planning-projection'),
    captionPrivateReviewProjectionRef: ref(
      'caption.run.private-review-projection'),
    privateReviewAssemblyRef: ref('caption.run.private-review-assembly'),
    outputEvidence: {
      outputId,
      confirmedOutputFrameRef: ref('caption.run.output-frame'),
      renderedArtifactRef: ref('caption.run.rendered-output', '1'),
      deterministicQaRef: ref('caption.run.deterministic-qa', '1'),
      captionOwnedDirectVisualInspectionRef: ref(
        'caption.run.direct-visual-inspection'),
      qualifiedCompleteTimeVisualReviewRef: ref(
        'caption.run.complete-time-review'),
      independentFinalQaRef: ref('caption.run.independent-final-qa'),
      privateReviewDecisionRef: ref('caption.run.private-review-decision'),
      captionOwnedProfessionalAppearancePassed: true as const,
      realUploadedSourcePixelsInspected: true as const,
      syntheticEngineeringFixtureUsed: false as const,
      actualCompleteTimeVisualReviewPassed: true as const,
      independentFinalQaPassed: true as const,
      privateReviewAccepted: true as const,
    },
    jobOccurrences: [{
      occurrenceId: 'caption.run.occurrence.strategy',
      jobType: 'plan_caption_strategy' as const,
      outputId,
      sceneId: null,
      boundaryId: null,
      approvedWorkItemRef: ref('caption.run.work-item.strategy'),
      canonicalJobRef: ref('caption.run.job.strategy'),
      plannedManifestEntryRef: ref('caption.run.manifest.strategy'),
      adapterCompletionRef: ref('caption.run.completion.strategy'),
      selectedArtifactRef: ref('caption.run.artifact.strategy', '1'),
      artifactQaRef: ref('caption.run.artifact-qa.strategy'),
      artifactReconciliationRef: ref(
        'caption.run.artifact-reconciliation.strategy'),
      specialistExecutionReceiptRef: ref(
        'caption.run.execution-receipt.strategy'),
      currentCallResultPairRef: ref('caption.run.call-result.strategy'),
      supportResumeChainRef: ref('caption.run.support-chain.strategy'),
      producedArtifactRefs: [{
        ...ref('caption.run.produced.strategy'),
        artifactType: 'caption_strategy_plan',
        producerSkillKey: 'captions',
        privateArtifact: true as const,
        byteFreeRef: true as const,
        sourceSupportRequestRef: null,
      }],
      ownerEvidence: [{
        ownerKey: 'canonical_transcript' as const,
        supportRequestRef: null,
        ownerEvidenceRef: ref('caption.run.transcript-binding'),
        authenticatedOwnerProjectionRef: null,
        resumeRecordRef: null,
        evidenceClass: 'canonical_transcript_authenticated_read' as const,
        exactPersistedOwnerEvidenceReread: true as const,
        directPeerDispatchPerformedByCaption: false as const,
        runtimeOrProviderAuthorityGrantedToCaption: false as const,
        assetMutationAuthorityGrantedToCaption: false as const,
        finalQaApprovalAuthorityGrantedToCaption: false as const,
        billingAuthorityGrantedToCaption: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      }],
      exactApprovedWorkJobManifestAndCostLineageReread: true as const,
      exactArtifactBytesQaAndReconciliationReread: true as const,
      exactCurrentSpecialistResultHeadReread: true as const,
      resultDisposition: 'completed' as const,
      planningOnly: true as const,
      renderedMediaClaimedByPlanningJob: false as const,
      finalQaClaimedByPlanningJob: false as const,
      unresolvedBlockerCodes: [] as [],
    }],
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

function redigest(value: CanonicalCaptionQualificationRunEvidence):
CanonicalCaptionQualificationRunEvidence {
  value.recordDigestSha256 = calculateSkillContractDigest(
    value as unknown as Record<string, unknown>, 'recordDigestSha256')
  return value
}

function memoryObjectPort(): {
  port: CanonicalCreateOnlyJsonObjectPort
  objects: Map<string, Buffer>
} {
  const objects = new Map<string, Buffer>()
  return {
    objects,
    port: {
      async createOnly(input) {
        if (objects.has(input.objectPath)) return 'already_exists'
        objects.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(objectPath) {
        const value = objects.get(objectPath)
        return value ? Buffer.from(value) : null
      },
    },
  }
}

async function run(): Promise<void> {
  const record = buildRecord()
  check(parseCanonicalCaptionQualificationRunEvidence(record)
    .recordDigestSha256 === record.recordDigestSha256,
  'The exact closed qualification-run record must parse.')
  check(record.approvedCaptionRunEvidenceOnly
    && !record.terminalJobQualificationClaimed
    && record.requiresMultiRunEvidenceCatalogForTerminalQualification
    && record.jobOccurrences.every((item) => item.planningOnly),
  'A run record must refuse to relabel planning receipts as terminal job evidence.')
  check(!record.syntheticEngineeringFixtureClaimedProfessionalAppearance,
  'Synthetic engineering fixtures must never claim professional appearance.')
  check(record.outputEvidence.captionOwnedProfessionalAppearancePassed
    && record.outputEvidence.realUploadedSourcePixelsInspected
    && !record.outputEvidence.syntheticEngineeringFixtureUsed,
  'V2 must bind direct professional inspection of real source pixels.')

  const legacy = structuredClone(record) as unknown as Record<string, unknown>
  legacy.schemaVersion = 'canonical-caption-qualification-run-evidence-v1'
  const legacyOutput = legacy.outputEvidence as Record<string, unknown>
  delete legacyOutput.captionOwnedDirectVisualInspectionRef
  delete legacyOutput.captionOwnedProfessionalAppearancePassed
  delete legacyOutput.realUploadedSourcePixelsInspected
  delete legacyOutput.syntheticEngineeringFixtureUsed
  legacy.recordDigestSha256 = calculateSkillContractDigest(
    legacy, 'recordDigestSha256')
  check(parseCanonicalCaptionQualificationRunEvidenceV1(legacy)
    .schemaVersion === 'canonical-caption-qualification-run-evidence-v1',
  'Historical V1 records must remain strictly decodable.')
  expectThrow(() => parseCanonicalCaptionQualificationRunEvidence(legacy))

  const synthetic = structuredClone(record) as unknown as Record<
    string, unknown>
  ;(synthetic.outputEvidence as Record<string, unknown>)
    .syntheticEngineeringFixtureUsed = true
  synthetic.recordDigestSha256 = calculateSkillContractDigest(
    synthetic, 'recordDigestSha256')
  expectThrow(() => parseCanonicalCaptionQualificationRunEvidence(synthetic))

  const missingDirectInspection = structuredClone(record) as unknown as Record<
    string, unknown>
  delete (missingDirectInspection.outputEvidence as Record<string, unknown>)
    .captionOwnedDirectVisualInspectionRef
  missingDirectInspection.recordDigestSha256 = calculateSkillContractDigest(
    missingDirectInspection, 'recordDigestSha256')
  expectThrow(() => parseCanonicalCaptionQualificationRunEvidence(
    missingDirectInspection))

  const staleDigest = structuredClone(record)
  staleDigest.observedAt = '2026-08-05T20:31:00.000Z'
  expectThrow(() => parseCanonicalCaptionQualificationRunEvidence(staleDigest))

  const unsafe = structuredClone(record)
  unsafe.outputEvidence.outputId = 'https://unsafe.invalid/output'
  unsafe.jobOccurrences[0]!.outputId = unsafe.outputEvidence.outputId
  expectThrow(() => parseCanonicalCaptionQualificationRunEvidence(
    redigest(unsafe)))

  const unsupported = structuredClone(record) as unknown as Record<
    string, unknown>
  ;(unsupported.jobOccurrences as Array<Record<string, unknown>>)[0]!.jobType =
    'own_final_canvas'
  unsupported.recordDigestSha256 = calculateSkillContractDigest(
    unsupported, 'recordDigestSha256')
  expectThrow(() => parseCanonicalCaptionQualificationRunEvidence(unsupported))

  const wrongOwner = structuredClone(record)
  wrongOwner.jobOccurrences[0]!.ownerEvidence[0]!.ownerKey =
    'visual_intelligence'
  wrongOwner.jobOccurrences[0]!.ownerEvidence[0]!.evidenceClass =
    'canonical_owner_record'
  expectThrow(() => parseCanonicalCaptionQualificationRunEvidence(
    redigest(wrongOwner)))

  const duplicatedWork = structuredClone(record)
  duplicatedWork.jobOccurrences.push({
    ...structuredClone(duplicatedWork.jobOccurrences[0]!),
    occurrenceId: 'caption.run.occurrence.strategy.duplicate',
  })
  expectThrow(() => parseCanonicalCaptionQualificationRunEvidence(
    redigest(duplicatedWork)))

  const unknownKey = {
    ...structuredClone(record),
    unexpectedAuthority: false,
  }
  expectThrow(() => parseCanonicalCaptionQualificationRunEvidence(unknownKey))

  const memory = memoryObjectPort()
  const repository =
    createCanonicalCaptionQualificationRunEvidenceRepository({
      objectPort: memory.port,
      prefix: 'private-internal/caption-run-smoke',
    })
  check(await repository.persistRecordCreateOnly({ record }) === 'created',
  'The exact run record must persist create-only.')
  check(await repository.persistRecordCreateOnly({ record }) ===
    'identical_replay',
  'An identical run record replay must be byte-stable.')
  check((await repository.rereadRecord({ requestRef: record.requestRef }))
    ?.recordDigestSha256 === record.recordDigestSha256,
  'The repository must exact-reread the persisted record.')

  let sourceReads = 0
  const assemblyMemory = memoryObjectPort()
  const sourceReadPort =
    createCanonicalCaptionQualificationRunEvidenceReadPort(async () => {
      sourceReads += 1
      return structuredClone(record)
    })
  const assembly = createCanonicalCaptionQualificationRunEvidenceAssembly({
    sourceReadPort,
    repository: createCanonicalCaptionQualificationRunEvidenceRepository({
      objectPort: assemblyMemory.port,
      prefix: 'private-internal/caption-run-assembly-smoke',
    }),
  })
  const assembled = await assembly.evidenceReadPort.readExact({ request })
  check(assembled?.recordDigestSha256 === record.recordDigestSha256
    && sourceReads === 2,
  'Assembly must exact-reread the source twice before create-only persistence.')
  const replay = await assembly.evidenceReadPort.readExact({ request })
  check(replay?.recordDigestSha256 === record.recordDigestSha256
    && sourceReads === 2,
  'Assembly replay must use the persisted record without rebuilding evidence.')
  check(assembly.exactSourceRereadBeforePersistence
    && assembly.createOnlyPersistenceAndExactReread
    && !assembly.terminalJobQualificationClaimed
    && !assembly.finalQaApprovalAuthorityGrantedToCaption
    && !assembly.productionAuthorityGrantedToCaption,
  'Assembly must remain a closed evidence mount without terminal authority.')

  let unstableReads = 0
  const unstableSource =
    createCanonicalCaptionQualificationRunEvidenceReadPort(async () => {
      unstableReads += 1
      const value = structuredClone(record)
      if (unstableReads === 2) {
        value.observedAt = '2026-08-05T20:32:00.000Z'
        redigest(value)
      }
      return value
    })
  const unstableAssembly =
    createCanonicalCaptionQualificationRunEvidenceAssembly({
      sourceReadPort: unstableSource,
      repository: createCanonicalCaptionQualificationRunEvidenceRepository({
        objectPort: memoryObjectPort().port,
        prefix: 'private-internal/caption-run-unstable-smoke',
      }),
    })
  await expectReject(() => unstableAssembly.evidenceReadPort.readExact({
    request,
  }))

  const crossedRequest = createCanonicalCaptionTerminalQualificationRequest({
    ...structuredClone(request),
    requestId: 'caption.qualification.run.request.crossed',
  })
  const crossedAssembly =
    createCanonicalCaptionQualificationRunEvidenceAssembly({
      sourceReadPort,
      repository: createCanonicalCaptionQualificationRunEvidenceRepository({
        objectPort: memoryObjectPort().port,
        prefix: 'private-internal/caption-run-crossed-smoke',
      }),
    })
  await expectReject(() => crossedAssembly.evidenceReadPort.readExact({
    request: crossedRequest,
  }))

  const tamperMemory = memoryObjectPort()
  const tamperRepository =
    createCanonicalCaptionQualificationRunEvidenceRepository({
      objectPort: tamperMemory.port,
      prefix: 'private-internal/caption-run-tamper-smoke',
    })
  await tamperRepository.persistRecordCreateOnly({ record })
  const tamperPath = [...tamperMemory.objects.keys()][0]!
  const tampered = structuredClone(record)
  tampered.terminalJobQualificationClaimed = true as false
  tampered.recordDigestSha256 = calculateSkillContractDigest(
    tampered as unknown as Record<string, unknown>, 'recordDigestSha256')
  tamperMemory.objects.set(tamperPath,
    Buffer.from(JSON.stringify(tampered), 'utf8'))
  await expectReject(() => tamperRepository.rereadRecord({
    requestRef: record.requestRef,
  }))

  await expectReject(() => assembly.evidenceReadPort.readExact({
    request,
    callerSuppliedEvidence: record,
  } as never))
  expectThrow(() => createCanonicalCaptionQualificationRunEvidenceAssembly({
    sourceReadPort: {
      ...sourceReadPort,
      readExact: async () => structuredClone(record),
    },
    repository: assembly.repository,
  }))

  console.log(JSON.stringify({
    smoke: 'canonical_caption_qualification_run_evidence_reader',
    status: 'passed',
    assertions,
    approvedCaptionRunEvidenceOnly: true,
    terminalJobQualificationClaimed: false,
    sourceRereadsBeforePersistence: 2,
    syntheticEngineeringFixtureClaimedProfessionalAppearance: false,
    productionAuthorityGranted: false,
  }, null, 2))
}

void run()
