import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  createCanonicalSam31AuthorizedTermsAcceptance,
  prepareCanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31SourceCheckpointQualification,
  canonicalSam31SourceCheckpointQualificationRef,
  compileCanonicalSam31SourceCheckpointQualification,
  type CanonicalSam31SourceCheckpointQualificationObservation,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const candidate = createCanonicalSam31SourceRuntimeCandidate()
const syntheticIngest = await createSyntheticIngest()
const canonicalIngest = canonicalizeIngest(syntheticIngest)
const synthetic = compileCanonicalSam31SourceCheckpointQualification({
  candidate,
  ingestReceipt: syntheticIngest,
  observation: observation('synthetic_contract_fixture', false),
})
assert.equal(synthetic.status, 'contract_only')
assert.equal(
  synthetic.authority.securityLicenseAndCompatibilityQualified,
  false,
)
assert.equal(synthetic.authority.privateImageBuildReviewEligible, false)
assert.equal(synthetic.authority.imageBuildStarted, false)
assert.equal(synthetic.authority.runtimeDispatchAuthorized, false)
assert.equal(synthetic.authority.customerCreditsMutated, false)

const canonical = compileCanonicalSam31SourceCheckpointQualification({
  candidate,
  ingestReceipt: canonicalIngest,
  observation: observation('canonical_private_reread', true),
})
assert.equal(canonical.status, 'qualified_for_private_image_build')
assert.equal(
  canonical.authority.securityLicenseAndCompatibilityQualified,
  true,
)
assert.equal(canonical.authority.privateImageBuildReviewEligible, true)
assert.equal(canonical.authority.imageBuildStarted, false)
assert.equal(canonical.authority.runtimeDispatchAuthorized, false)
assert.equal(canonical.authority.customerCreditsMutated, false)
assert.equal(
  canonical.controlledObservation.qualificationRuntime.executionTarget,
  'google_cloud_batch_a2_ultra_job',
)
assert.equal(
  canonical.controlledObservation.qualificationRuntime.accelerator,
  'nvidia_a100_80gb',
)
assert.equal(
  canonical.controlledObservation.qualificationRuntime.networkEgressAllowed,
  false,
)
assert.equal(
  canonical.controlledObservation.compatibilityProbe
    .strictCheckpointLoadRequested,
  true,
)
assert.equal(
  canonical.controlledObservation.compatibilityProbe
    .missingCheckpointKeyCount,
  0,
)
assert.equal(
  canonical.controlledObservation.compatibilityProbe
    .unexpectedCheckpointKeyCount,
  0,
)
assert.equal(
  assertCanonicalSam31SourceCheckpointQualification(canonical)
    .qualificationHash,
  canonical.qualificationHash,
)
assert.equal(
  canonicalSam31SourceCheckpointQualificationRef(canonical).contentHash,
  `sha256:${canonical.qualificationHash}`,
)

const tampered = structuredClone(canonical)
tampered.authority.runtimeDispatchAuthorized = true as never
assert.throws(() => assertCanonicalSam31SourceCheckpointQualification(
  tampered,
))

assert.throws(() => compileCanonicalSam31SourceCheckpointQualification({
    candidate,
    ingestReceipt: syntheticIngest,
    observation: observation('canonical_private_reread', true),
  }))

for (const mutate of [
  (value: CanonicalSam31SourceCheckpointQualificationObservation) => {
    value.securityAndCompliance.checkpointMalwareScanPassed = false
  },
  (value: CanonicalSam31SourceCheckpointQualificationObservation) => {
    value.securityAndCompliance.checkpointWeightsOnlyLoadPassed = false
  },
  (value: CanonicalSam31SourceCheckpointQualificationObservation) => {
    value.compatibilityProbe.strictCheckpointLoadRequested = false
  },
  (value: CanonicalSam31SourceCheckpointQualificationObservation) => {
    value.compatibilityProbe.unexpectedCheckpointKeyCount = 1
  },
  (value: CanonicalSam31SourceCheckpointQualificationObservation) => {
    value.compatibilityProbe.modelStateKeySetSha256 = 'f'.repeat(64)
  },
  (value: CanonicalSam31SourceCheckpointQualificationObservation) => {
    value.compatibilityProbe.deterministicRepeatedProbeRunCount = 2
  },
  (value: CanonicalSam31SourceCheckpointQualificationObservation) => {
    value.compatibilityProbe.deterministicOutputDigestSha256 = '0'.repeat(64)
  },
  (value: CanonicalSam31SourceCheckpointQualificationObservation) => {
    value.compatibilityProbe.actualCudaModelInferenceExecuted = false
  },
] as const) {
  const hostile = observation('canonical_private_reread', true)
  mutate(hostile)
  assert.throws(() => compileCanonicalSam31SourceCheckpointQualification({
    candidate,
    ingestReceipt: canonicalIngest,
    observation: hostile,
  }))
}

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-checkpoint-qualification',
  checks: 33,
  syntheticStatus: synthetic.status,
  canonicalStatus: canonical.status,
  qualificationRuns:
    canonical.controlledObservation.compatibilityProbe
      .deterministicRepeatedProbeRunCount,
  a100QualificationOnly: true,
  networkEgressAllowed: false,
  strictCheckpointLoad: true,
  missingCheckpointKeyCount: 0,
  unexpectedCheckpointKeyCount: 0,
  imageBuildStarted: canonical.authority.imageBuildStarted,
  runtimeDispatchAuthorized: canonical.authority.runtimeDispatchAuthorized,
  customerCreditsMutated: canonical.authority.customerCreditsMutated,
  productionReady: canonical.authority.productionReady,
  qualificationHash: canonical.qualificationHash,
}))

function observation(
  evidenceClass:
    | 'synthetic_contract_fixture'
    | 'canonical_private_reread',
  admitted: boolean,
): CanonicalSam31SourceCheckpointQualificationObservation {
  const keySetHash = digest('sam31-checkpoint-key-set')
  return {
    evidenceClass,
    qualificationId: `sam31-source-checkpoint-${evidenceClass}`,
    qualificationVersion: 1,
    qualificationJobRef: ref('sam31-qualification-job'),
    qualificationAttemptRef: ref('sam31-qualification-attempt'),
    qualificationResultRuntimeRef: ref('sam31-qualification-result'),
    qualificationLogRef: ref('sam31-qualification-log'),
    internalCostReceiptRef: ref('sam31-qualification-internal-cost'),
    dependencyClosureRef: ref('sam31-dependency-closure'),
    dependencyLockSha256: digest('sam31-dependency-lock'),
    dependencyClosureReceiptSha256: digest('sam31-dependency-receipt'),
    dependencyWheelManifestSha256: digest('sam31-wheel-manifest'),
    patchApplicationReceiptRef: ref('sam31-patch-application'),
    patchedSourceArchiveRef: contentRef(
      'sam31-patched-source',
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    ),
    patchedSourceArchiveSha256:
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    sourceCodeSecurityReviewRef: ref('sam31-source-code-security'),
    checkpointWeightsOnlyInspectionRef:
      ref('sam31-checkpoint-weights-only'),
    deterministicProbeFixtureRef: ref('sam31-probe-fixture'),
    deterministicProbeResultRef: ref('sam31-probe-result'),
    securityAndCompliance: {
      sourceLicenseReviewedForApprovedUse: admitted,
      checkpointLicenseReviewedForApprovedUse: admitted,
      privacyReviewApprovedForPrivateQualification: admitted,
      tradeControlsReviewApprovedForPrivateQualification: admitted,
      sourceMalwareScanPassed: admitted,
      checkpointMalwareScanPassed: admitted,
      sourceStaticSecurityReviewPassed: admitted,
      checkpointWeightsOnlyLoadPassed: admitted,
      checkpointTensorAndMetadataAllowlistPassed: admitted,
      executablePickleTrustGranted: false,
      checkpointRedistributionAuthorized: false,
    },
    qualificationRuntime: {
      executionTarget: 'google_cloud_batch_a2_ultra_job',
      machineType: 'a2-ultragpu-1g',
      accelerator: 'nvidia_a100_80gb',
      allocatedGpuCount: 1,
      baseImageDigest:
        'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
      pythonVersion: '3.12',
      torchVersion: '2.10.0',
      torchvisionVersion: '0.25.0',
      torchcodecVersion: '0.10.0',
      cudaVersion: '12.8',
      fixedBuilder: 'build_sam3_multiplex_video_predictor',
      networkEgressAllowed: false,
      developerMachineExecutionAllowed: false,
      callerCommandModuleClassModelOrCheckpointAccepted: false,
      sourceCheckpointAndDependencyMountsReadOnly: true,
      automaticRetryAfterUnknownOutcomeAllowed: false,
    },
    compatibilityProbe: {
      exactSourceArchiveReread: admitted,
      exactPatchedSourceArchiveReread: admitted,
      exactCheckpointRereadBeforeAndAfter: admitted,
      exactDependencyWheelAndNativeClosureReread: admitted,
      sourcePatchApplicationReceiptReread: admitted,
      weightsOnlyCheckpointInspectionExecuted: admitted,
      fixedBuilderImportedFromPinnedSource: admitted,
      fixedBuilderCalledExactlyOnce: admitted,
      checkpointLoadedExactlyOnce: admitted,
      strictCheckpointLoadRequested: admitted,
      missingCheckpointKeyCount: 0,
      unexpectedCheckpointKeyCount: 0,
      checkpointKeyCount: admitted ? 257 : 0,
      modelStateKeyCount: admitted ? 257 : 0,
      checkpointKeySetSha256: admitted ? keySetHash : '0'.repeat(64),
      modelStateKeySetSha256: admitted ? keySetHash : '0'.repeat(64),
      checkpointAndModelKeySetsExact: admitted,
      startSessionAddPromptPropagateAndCloseExecuted: admitted,
      actualCudaModelInferenceExecuted: admitted,
      bfloat16AutocastExecuted: admitted,
      outputMaskShapeMatchedProbeFrames: admitted,
      outputObjectIdsMatchedProbePrompt: admitted,
      outputMasksWereCudaTensorsBeforeSerialization: admitted,
      deterministicRepeatedProbeRunCount: admitted ? 3 : 0,
      deterministicOutputDigestSha256: admitted
        ? digest('sam31-deterministic-probe-output')
        : '0'.repeat(64),
      deterministicOutputDigestMatchedEveryRun: admitted,
      cpuOnlyModelExecutionObserved: false,
      quantizationOrResolutionReductionUsed: false,
      providerInferenceExecuted: false,
    },
    qualifiedAt: '2026-08-03T22:00:00.000Z',
  }
}

async function createSyntheticIngest() {
  const sourceBytes = Buffer.from('synthetic pinned source')
  const checkpointBytes = Buffer.from('synthetic gated checkpoint')
  const sourceCoordinate = {
    projectId: 'reeditpro' as const,
    bucketName:
      'reeditpro-production-reeditpro-model-artifacts' as const,
    objectName:
      'private/model-artifacts/sam3_1/source/fixture/sam3-source.tar',
    generation: '11',
    etag: 'source-etag',
    byteLength: sourceBytes.byteLength,
    sha256: digest(sourceBytes),
  }
  const checkpointCoordinate = {
    projectId: 'reeditpro' as const,
    bucketName:
      'reeditpro-production-reeditpro-model-artifacts' as const,
    objectName:
      'private/model-artifacts/sam3_1/checkpoint/fixture/sam3.1_multiplex.pt',
    generation: '12',
    etag: 'checkpoint-etag',
    byteLength: checkpointBytes.byteLength,
    sha256: digest(checkpointBytes),
  }
  const terms = createCanonicalSam31AuthorizedTermsAcceptance({
    evidenceClass: 'synthetic_contract_fixture',
    acceptanceRecordId: 'sam31-qualification-terms',
    acceptanceRecordVersion: 1,
    sourceRepository: 'https://github.com/facebookresearch/sam3.git',
    checkpointRepository: 'facebook/sam3.1',
    licenseIdentity: 'SAM License',
    licenseLastUpdated: '2025-11-19',
    acceptanceSurface: 'official_hugging_face_gated_repository',
    repositoryGating: 'manual',
    acceptedAt: '2026-08-03T21:00:00.000Z',
    acceptedByAuthorizedOrganizationRepresentative: true,
    authorizedRepresentativeAuthorityRereadVerified: true,
    contactInformationSharingAcceptedByAuthorizedHuman: true,
    officialRepositoryAccessGrantedAndReread: true,
    automatedAcceptanceUsed: false,
    thirdPartyMirrorUsed: false,
    approvedUseCase:
      'private_commercial_video_editing_segmentation_and_tracking',
    militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
    legalReviewRef: ref('sam31-legal'),
    privacyReviewRef: ref('sam31-privacy'),
    tradeControlsReviewRef: ref('sam31-trade'),
    termsEvidenceRef: ref('sam31-terms'),
    browserOrWorkerSecretIncluded: false,
  })
  return prepareCanonicalSam31PrivateArtifactIngestReceipt({
    ingestReceiptId: 'sam31-qualification-ingest',
    evidenceClass: 'synthetic_contract_fixture',
    candidate,
    termsAcceptance: terms,
    officialArtifactPublicationRef: {
      ...ref('sam31-official-publication'),
      schemaVersion:
        'canonical-sam3_1-official-artifact-publication-receipt-v1',
    },
    sourceArchiveCoordinate: sourceCoordinate,
    sourceArchiveArtifactRef:
      contentRef('sam31-source', sourceCoordinate.sha256),
    sourceLicenseRef: ref('sam31-source-license'),
    sourceSecurityReviewRef: ref('sam31-source-security'),
    sourceMalwareScanRef: ref('sam31-source-malware'),
    sourceUnsignedRevisionAcceptanceRef: ref('sam31-source-unsigned'),
    checkpointCoordinate,
    checkpointArtifactRef:
      contentRef('sam31-checkpoint', checkpointCoordinate.sha256),
    checkpointManifestRef: ref('sam31-checkpoint-manifest'),
    checkpointLicenseRef: ref('sam31-checkpoint-license'),
    checkpointSecurityReviewRef: ref('sam31-checkpoint-security'),
    checkpointMalwareScanRef: ref('sam31-checkpoint-malware'),
    privateObjectReadPort: {
      async readExact(coordinate) {
        const source = coordinate.objectName === sourceCoordinate.objectName
        return {
          generationBeforeRead: coordinate.generation,
          etagBeforeRead: coordinate.etag,
          contentType: source
            ? 'application/x-tar'
            : 'application/octet-stream',
          body: source ? sourceBytes : checkpointBytes,
          generationAfterRead: coordinate.generation,
          etagAfterRead: coordinate.etag,
        }
      },
    },
    preparedAt: '2026-08-03T21:05:00.000Z',
  })
}

function canonicalizeIngest(value: typeof syntheticIngest) {
  const clone = structuredClone(value)
  clone.evidenceClass = 'canonical_private_reread'
  clone.status = 'ready_for_immutable_image_build_review'
  clone.sourceArchive.coordinate.byteLength = 73_605_120
  clone.sourceArchive.coordinate.sha256 =
    '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
  clone.sourceArchive.artifactRef.contentHash =
    `sha256:${clone.sourceArchive.coordinate.sha256}`
  clone.checkpoint.coordinate.byteLength = 3_500_000_000
  clone.checkpoint.coordinate.sha256 = digest('canonical-checkpoint')
  clone.checkpoint.artifactRef.contentHash =
    `sha256:${clone.checkpoint.coordinate.sha256}`
  clone.authority.canonicalTermsAcceptanceObserved = true
  clone.authority.imageBuildReviewEligible = true
  const { ingestReceiptHash, ...payload } = clone
  assert.match(ingestReceiptHash, /^[a-f0-9]{64}$/u)
  return assertCanonicalSam31PrivateArtifactIngestReceipt({
    ...payload,
    ingestReceiptHash: sha256AuthorityValue(payload),
  })
}

function ref(id: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${digest(id)}` as const,
  }
}

function contentRef(id: string, contentHash: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${contentHash}` as const,
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
