import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalSam31AuthorizedTermsAcceptance,
  prepareCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateObjectReadPort,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  canonicalSam31SourceCheckpointQualificationRef,
  compileCanonicalSam31SourceCheckpointQualification,
  type CanonicalSam31SourceCheckpointQualificationObservation,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  assertCanonicalSam31GpuRuntimeReleaseObservation,
  compileCanonicalSam31GpuRuntimeRelease,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-release'

const sourceBytes = Buffer.from('synthetic SAM 3.1 source release fixture')
const checkpointBytes = Buffer.from('synthetic SAM 3.1 checkpoint fixture')
const sourceCoordinate = coordinate(
  'private/model-artifacts/sam3_1/source/release-fixture.tar',
  '1001',
  sourceBytes,
)
const checkpointCoordinate = coordinate(
  'private/model-artifacts/sam3_1/checkpoint/sam3.1_multiplex.pt',
  '1002',
  checkpointBytes,
)
const terms = createCanonicalSam31AuthorizedTermsAcceptance({
  evidenceClass: 'synthetic_contract_fixture',
  acceptanceRecordId: 'sam31-release-terms-fixture',
  acceptanceRecordVersion: 1,
  sourceRepository: 'https://github.com/facebookresearch/sam3.git',
  checkpointRepository: 'facebook/sam3.1',
  licenseIdentity: 'SAM License',
  licenseLastUpdated: '2025-11-19',
  acceptanceSurface: 'official_hugging_face_gated_repository',
  repositoryGating: 'manual',
  acceptedAt: '2026-08-02T13:00:00.000Z',
  acceptedByAuthorizedOrganizationRepresentative: true,
  authorizedRepresentativeAuthorityRereadVerified: true,
  contactInformationSharingAcceptedByAuthorizedHuman: true,
  officialRepositoryAccessGrantedAndReread: true,
  automatedAcceptanceUsed: false,
  thirdPartyMirrorUsed: false,
  approvedUseCase:
    'private_commercial_video_editing_segmentation_and_tracking',
  militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
  legalReviewRef: ref('sam31-release-legal'),
  privacyReviewRef: ref('sam31-release-privacy'),
  tradeControlsReviewRef: ref('sam31-release-trade-controls'),
  termsEvidenceRef: ref('sam31-release-terms-evidence'),
  browserOrWorkerSecretIncluded: false,
})
const readPort: CanonicalSam31PrivateObjectReadPort = {
  async readExact(input) {
    if (input.objectName === sourceCoordinate.objectName) {
      return exactRead(sourceCoordinate, sourceBytes, 'application/x-tar')
    }
    if (input.objectName === checkpointCoordinate.objectName) {
      return exactRead(
        checkpointCoordinate,
        checkpointBytes,
        'application/octet-stream',
      )
    }
    return null
  },
}
const candidate = createCanonicalSam31SourceRuntimeCandidate()
const ingest = await prepareCanonicalSam31PrivateArtifactIngestReceipt({
  ingestReceiptId: 'sam31-release-ingest-fixture',
  evidenceClass: 'synthetic_contract_fixture',
  candidate,
  termsAcceptance: terms,
  officialArtifactPublicationRef: {
    ...ref('sam31-release-official-artifact-publication'),
    schemaVersion:
      'canonical-sam3_1-official-artifact-publication-receipt-v1' as const,
  },
  sourceArchiveCoordinate: sourceCoordinate,
  sourceArchiveArtifactRef:
    contentRef('sam31-release-source', sourceCoordinate.sha256),
  sourceLicenseRef: ref('sam31-release-source-license'),
  sourceSecurityReviewRef: ref('sam31-release-source-security'),
  sourceMalwareScanRef: ref('sam31-release-source-scan'),
  sourceUnsignedRevisionAcceptanceRef:
    ref('sam31-release-source-unsigned-review'),
  checkpointCoordinate,
  checkpointArtifactRef:
    contentRef('sam31-release-checkpoint', checkpointCoordinate.sha256),
  checkpointManifestRef: ref('sam31-release-checkpoint-manifest'),
  checkpointLicenseRef: ref('sam31-release-checkpoint-license'),
  checkpointSecurityReviewRef: ref('sam31-release-checkpoint-security'),
  checkpointMalwareScanRef: ref('sam31-release-checkpoint-scan'),
  privateObjectReadPort: readPort,
  preparedAt: '2026-08-02T13:05:00.000Z',
})
const sourceCheckpointQualification =
  compileCanonicalSam31SourceCheckpointQualification({
    candidate,
    ingestReceipt: ingest,
    observation: qualificationObservation(),
  })

const releaseInput = {
  evidenceClass: 'synthetic_contract_fixture' as const,
  releaseId: 'sam31-a100-release-contract-fixture',
  releaseVersion: 1,
  route: {
    routeId: 'a100_80gb_heavy_primary' as const,
    gpuProfileId:
      'quality_a100_80gb_user_triggered_heavy_job_v1' as const,
    runtimeRegion: 'us-central1' as const,
    executionTarget: 'google_cloud_batch_a2_ultra_job' as const,
    machineType: 'a2-ultragpu-1g' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    allocatedVcpuCount: 12 as const,
    allocatedMemoryGiB: 170 as const,
    allocatedLocalScratchGiB: 375 as const,
  },
  serviceIdentityRef: ref('sam31-a100-service-identity'),
  immutableImageRef: ref('sam31-a100-image'),
  immutableImageDigest: ref('sam31-a100-image').contentHash,
  sourceAndDependencyClosureRef: ref('sam31-a100-dependency-closure'),
  sbomRef: ref('sam31-a100-sbom'),
  imageScanAndSignatureRef: ref('sam31-a100-image-scan-signature'),
  scaleToZeroConfigurationRef: ref('sam31-a100-scale-zero'),
  privateNetworkAndArtifactTransportRef:
    ref('sam31-a100-private-transport'),
  qualification: {
    sourceCheckpointCompatibilityQualificationRef:
      canonicalSam31SourceCheckpointQualificationRef(
        sourceCheckpointQualification,
      ),
    cudaDriverRuntimeQualificationRef:
      ref('sam31-a100-cuda-qualification'),
    observedNvidiaDriverVersion: '570.211.01',
    cudaDriverLibraryMode: 'host_driver' as const,
    loadedCudaDriverLibraryPathDigestSha256: digest(
      '/usr/local/nvidia/lib64/libcuda.so.570.211.01',
    ),
    cudaForwardCompatibilityPackageSha256:
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893' as const,
    cudaForwardCompatibilityLibraryLoaded: false,
    hostCudaDriverLibraryLoaded: true,
    runtimeDriverAndLibraryPathEvidenceReread: false,
    substantiveGpuExecutionQualificationRef:
      ref('sam31-a100-gpu-qualification'),
    temporalMaskQualityQualificationRef:
      ref('sam31-a100-mask-quality'),
    eightMinuteSourcePerformanceQualificationRef:
      ref('sam31-a100-performance'),
    exactToolModelAndCheckpointReread: false,
    exactPythonTorchCudaWheelAndNativeClosureReread: false,
    strictCheckpointLoadWithNoMissingOrUnexpectedKeys: false,
    actualCudaModelInferenceMeasured: false,
    actualNvdecDecodeMeasured: false,
    decodedFramesRemainedCudaResident: false,
    bfloat16AutocastMeasured: false,
    cpuOnlyInferenceObserved: false as const,
    quantizationOrResolutionReductionUsed: false as const,
    sourceResolutionAndFrameRangePreserved: false,
    temporalMaskQaPassed: false,
    directPrivateCompleteIntervalReviewPassed: false,
    qualificationRunCount: 1,
    eightMinuteSourceP95WallTimeMilliseconds: 0,
    eightMinuteSourceTargetMilliseconds: 480_000 as const,
    qualityEqualToOrBetterThanApprovedA100Baseline: false,
  },
  qualifiedAt: '2026-08-02T13:10:00.000Z',
  expiresAt: '2026-09-01T13:10:00.000Z',
}

const a100 = compileCanonicalSam31GpuRuntimeRelease({
  candidate,
  ingestReceipt: ingest,
  sourceCheckpointQualification,
  release: releaseInput,
})
assert.equal(a100.observation.status, 'contract_only')
assert.equal(a100.observation.route.accelerator, 'nvidia_a100_80gb')
assert.equal(a100.observation.authority.privateInternalQualified, false)
assert.equal(a100.runtimeRelease.status, 'contract_only')
assert.equal(
  a100.runtimeRelease.actualGpuKernelModelRenderOrHardwareCodecMeasured,
  false,
)
assert.equal(a100.runtimeRelease.minimumIdleInstances, 0)
assert.equal(a100.runtimeRelease.runtimeNetworkDownloadAllowed, false)
assert.equal(
  a100.runtimeRelease.toolOrModelArtifactReleaseRef.contentHash,
  `sha256:${ingest.ingestReceiptHash}`,
)
assert.equal(
  assertCanonicalSam31GpuRuntimeReleaseObservation(a100.observation)
    .releaseObservationHash,
  a100.observation.releaseObservationHash,
)

const l4 = compileCanonicalSam31GpuRuntimeRelease({
  candidate,
  ingestReceipt: ingest,
  sourceCheckpointQualification,
  release: {
    ...releaseInput,
    releaseId: 'sam31-l4-release-contract-fixture',
    route: {
      routeId: 'l4_heavy_fallback',
      gpuProfileId:
        'quality_l4_user_triggered_heavy_fallback_job_v1',
      runtimeRegion: 'europe-west4',
      executionTarget: 'google_cloud_run_l4_job',
      machineType: 'cloud_run_nvidia_l4',
      accelerator: 'nvidia_l4',
      allocatedVcpuCount: 8,
      allocatedMemoryGiB: 32,
      allocatedLocalScratchGiB: 0,
    },
    qualification: {
      ...releaseInput.qualification,
      observedNvidiaDriverVersion: '535.216.03',
      cudaDriverLibraryMode: 'cuda_compat_12_8',
      loadedCudaDriverLibraryPathDigestSha256: digest(
        '/usr/local/cuda-12.8/compat/libcuda.so.570.211.01',
      ),
      cudaForwardCompatibilityLibraryLoaded: true,
      hostCudaDriverLibraryLoaded: false,
    },
  },
})
assert.equal(l4.observation.route.accelerator, 'nvidia_l4')
assert.equal(
  l4.observation.qualification.cudaDriverLibraryMode,
  'cuda_compat_12_8',
)
assert.equal(l4.runtimeRelease.routeId, 'l4_heavy_fallback')
assert.deepEqual(
  l4.runtimeRelease.toolOrModelArtifactReleaseRef,
  a100.runtimeRelease.toolOrModelArtifactReleaseRef,
)
assert.notEqual(l4.runtimeRelease.releaseHash, a100.runtimeRelease.releaseHash)

assert.throws(() => compileCanonicalSam31GpuRuntimeRelease({
  candidate,
  ingestReceipt: ingest,
  sourceCheckpointQualification,
  release: {
    ...releaseInput,
    evidenceClass: 'canonical_private_reread',
  },
}))
assert.throws(() => compileCanonicalSam31GpuRuntimeRelease({
  candidate,
  ingestReceipt: ingest,
  sourceCheckpointQualification,
  release: {
    ...releaseInput,
    qualification: {
      ...releaseInput.qualification,
      observedNvidiaDriverVersion: '535.216.03',
    },
  },
}))
assert.throws(() => compileCanonicalSam31GpuRuntimeRelease({
  candidate,
  ingestReceipt: ingest,
  sourceCheckpointQualification,
  release: {
    ...releaseInput,
    qualification: {
      ...releaseInput.qualification,
      actualCudaModelInferenceMeasured: true,
    },
  },
}))
assert.throws(() => compileCanonicalSam31GpuRuntimeRelease({
  candidate,
  ingestReceipt: ingest,
  sourceCheckpointQualification,
  release: {
    ...releaseInput,
    immutableImageDigest: ref('different-image').contentHash,
  },
}))
const tampered = structuredClone(a100.observation)
tampered.authority.privateInternalQualified = true as never
assert.throws(() => assertCanonicalSam31GpuRuntimeReleaseObservation(tampered))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-release',
  checks: 23,
  sourceCandidateHash: candidate.candidateHash,
  ingestReceiptHash: ingest.ingestReceiptHash,
  a100ReleaseObservationHash: a100.observation.releaseObservationHash,
  l4ReleaseObservationHash: l4.observation.releaseObservationHash,
  privateInternalQualified: false,
  runtimeExecuted: false,
  productionQualified: false,
}))

function qualificationObservation():
CanonicalSam31SourceCheckpointQualificationObservation {
  return {
    evidenceClass: 'synthetic_contract_fixture',
    qualificationId: 'sam31-runtime-release-source-checkpoint-contract',
    qualificationVersion: 1,
    qualificationJobRef: ref('sam31-runtime-release-qualification-job'),
    qualificationAttemptRef:
      ref('sam31-runtime-release-qualification-attempt'),
    qualificationResultRuntimeRef:
      ref('sam31-runtime-release-qualification-result'),
    qualificationLogRef: ref('sam31-runtime-release-qualification-log'),
    internalCostReceiptRef:
      ref('sam31-runtime-release-qualification-cost'),
    dependencyClosureRef:
      ref('sam31-runtime-release-dependency-closure'),
    dependencyLockSha256: digest('sam31-runtime-release-lock'),
    dependencyClosureReceiptSha256:
      digest('sam31-runtime-release-dependency-receipt'),
    dependencyWheelManifestSha256:
      digest('sam31-runtime-release-wheel-manifest'),
    patchApplicationReceiptRef:
      ref('sam31-runtime-release-patch-receipt'),
    patchedSourceArchiveRef: {
      id: 'sam31-runtime-release-patched-source',
      version: 1,
      contentHash:
        'sha256:b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    },
    patchedSourceArchiveSha256:
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    sourceCodeSecurityReviewRef:
      ref('sam31-runtime-release-source-security'),
    checkpointWeightsOnlyInspectionRef:
      ref('sam31-runtime-release-weights-only'),
    deterministicProbeFixtureRef:
      ref('sam31-runtime-release-probe-fixture'),
    deterministicProbeResultRef:
      ref('sam31-runtime-release-probe-result'),
    securityAndCompliance: {
      sourceLicenseReviewedForApprovedUse: false,
      checkpointLicenseReviewedForApprovedUse: false,
      privacyReviewApprovedForPrivateQualification: false,
      tradeControlsReviewApprovedForPrivateQualification: false,
      sourceMalwareScanPassed: false,
      checkpointMalwareScanPassed: false,
      sourceStaticSecurityReviewPassed: false,
      checkpointWeightsOnlyLoadPassed: false,
      checkpointTensorAndMetadataAllowlistPassed: false,
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
      exactSourceArchiveReread: false,
      exactPatchedSourceArchiveReread: false,
      exactCheckpointRereadBeforeAndAfter: false,
      exactDependencyWheelAndNativeClosureReread: false,
      sourcePatchApplicationReceiptReread: false,
      weightsOnlyCheckpointInspectionExecuted: false,
      fixedBuilderImportedFromPinnedSource: false,
      fixedBuilderCalledExactlyOnce: false,
      checkpointLoadedExactlyOnce: false,
      strictCheckpointLoadRequested: false,
      missingCheckpointKeyCount: 0,
      unexpectedCheckpointKeyCount: 0,
      checkpointKeyCount: 0,
      modelStateKeyCount: 0,
      checkpointKeySetSha256: '0'.repeat(64),
      modelStateKeySetSha256: '0'.repeat(64),
      checkpointAndModelKeySetsExact: false,
      startSessionAddPromptPropagateAndCloseExecuted: false,
      actualCudaModelInferenceExecuted: false,
      bfloat16AutocastExecuted: false,
      outputMaskShapeMatchedProbeFrames: false,
      outputObjectIdsMatchedProbePrompt: false,
      outputMasksWereCudaTensorsBeforeSerialization: false,
      deterministicRepeatedProbeRunCount: 0,
      deterministicOutputDigestSha256: '0'.repeat(64),
      deterministicOutputDigestMatchedEveryRun: false,
      cpuOnlyModelExecutionObserved: false,
      quantizationOrResolutionReductionUsed: false,
      providerInferenceExecuted: false,
    },
    qualifiedAt: '2026-08-02T13:07:00.000Z',
  }
}

function coordinate(objectName: string, generation: string, body: Buffer) {
  return {
    projectId: 'reeditpro' as const,
    bucketName:
      'reeditpro-production-reeditpro-model-artifacts' as const,
    objectName,
    generation,
    etag: `etag-${generation}`,
    byteLength: body.byteLength,
    sha256: digest(body),
  }
}

function exactRead(
  coordinateValue: ReturnType<typeof coordinate>,
  body: Buffer,
  contentType: string,
) {
  return {
    generationBeforeRead: coordinateValue.generation,
    etagBeforeRead: coordinateValue.etag,
    contentType,
    body,
    generationAfterRead: coordinateValue.generation,
    etagAfterRead: coordinateValue.etag,
  }
}

function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function ref(id: string) {
  return { id, version: 1 as const, contentHash: `sha256:${digest(id)}` }
}

function contentRef(id: string, contentSha256: string) {
  return { id, version: 1, contentHash: `sha256:${contentSha256}` }
}
