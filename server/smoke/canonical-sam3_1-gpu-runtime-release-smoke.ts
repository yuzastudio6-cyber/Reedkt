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
  assertCanonicalSam31GpuRuntimeQualificationEvidence,
  canonicalSam31GpuRuntimeQualificationEvidenceDigest,
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
  qualificationReleaseFields,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
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

const qualificationEvidencePayload = canonicalQualificationEvidencePayload()
export const qualificationEvidence =
  assertCanonicalSam31GpuRuntimeQualificationEvidence({
    ...qualificationEvidencePayload,
    evidenceHash: canonicalSam31GpuRuntimeQualificationEvidenceDigest(
      qualificationEvidencePayload,
    ),
  })
const derivedQualification = qualificationReleaseFields(
  qualificationEvidence,
)
assert.equal(derivedQualification.qualificationRunCount, 30)
assert.equal(
  derivedQualification.eightMinuteSourceP95WallTimeMilliseconds,
  460_000,
)
assert.equal(derivedQualification.actualCudaModelInferenceMeasured, true)
assert.equal(derivedQualification.actualNvdecDecodeMeasured, true)
assert.equal(derivedQualification.cpuOnlyInferenceObserved, false)

const qualificationRecords = new Map<string, Buffer>()
const qualificationRepository =
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
    objectPort: {
      async createOnly({ objectPath, body }) {
        if (qualificationRecords.has(objectPath)) return 'already_exists' as const
        qualificationRecords.set(objectPath, Buffer.from(body))
        return 'created' as const
      },
      async readExact(objectPath) {
        const body = qualificationRecords.get(objectPath)
        return body ? Buffer.from(body) : null
      },
    },
    prefix: 'private/smoke/sam3_1/runtime-qualification/v1',
  })
const qualificationEvidenceRef =
  canonicalSam31GpuRuntimeQualificationEvidenceRef(qualificationEvidence)
assert.deepEqual(
  await qualificationRepository.persistQualifiedEvidenceCreateOnly({
    evidence: qualificationEvidence,
  }),
  qualificationEvidenceRef,
)
await qualificationRepository.persistQualifiedEvidenceCreateOnly({
  evidence: qualificationEvidence,
})
const exactQualificationReadRequest = {
  qualificationEvidenceRef,
  candidateRef: qualificationEvidence.candidateRef,
  privateArtifactIngestReceiptRef:
    qualificationEvidence.privateArtifactIngestReceiptRef,
  sourceCheckpointCompatibilityQualificationRef:
    qualificationEvidence.sourceCheckpointCompatibilityQualificationRef,
  imageSupplyChainReleaseRef:
    qualificationEvidence.imageSupplyChainReleaseRef,
  serviceIdentityRef: qualificationEvidence.serviceIdentityRef,
  immutableImageRef: qualificationEvidence.immutableImageRef,
  immutableImageDigest: qualificationEvidence.immutableImageDigest,
  scaleToZeroConfigurationRef:
    qualificationEvidence.scaleToZeroConfigurationRef,
  privateNetworkAndArtifactTransportRef:
    qualificationEvidence.privateNetworkAndArtifactTransportRef,
  route: qualificationEvidence.route,
}
assert.equal(
  (await qualificationRepository.rereadExact(
    exactQualificationReadRequest,
  ))?.evidenceHash,
  qualificationEvidence.evidenceHash,
)
assert.equal(
  (await qualificationRepository.rereadEvidenceRefExact({
    qualificationEvidenceRef,
  }))?.evidenceHash,
  qualificationEvidence.evidenceHash,
)
await assert.rejects(() => qualificationRepository.rereadExact({
  ...exactQualificationReadRequest,
  serviceIdentityRef: ref('wrong-service-identity'),
}))

for (const mutate of [
  (value: ReturnType<typeof canonicalQualificationEvidencePayload>) => {
    value.deterministicRuns[1].outputMaskSetDigestSha256 = digest('different')
  },
  (value: ReturnType<typeof canonicalQualificationEvidencePayload>) => {
    value.deterministicRuns[1].qualificationAttemptRef =
      value.deterministicRuns[0].qualificationAttemptRef
  },
  (value: ReturnType<typeof canonicalQualificationEvidencePayload>) => {
    value.deterministicRuns[1].deterministicProbeFixtureRef =
      ref('different-probe-fixture')
  },
  (value: ReturnType<typeof canonicalQualificationEvidencePayload>) => {
    value.deterministicRuns.reverse()
  },
  (value: ReturnType<typeof canonicalQualificationEvidencePayload>) => {
    value.performanceEvidence.measurements[1].fullSourceExecutionRef =
      value.performanceEvidence.measurements[0].fullSourceExecutionRef
  },
  (value: ReturnType<typeof canonicalQualificationEvidencePayload>) => {
    value.performanceEvidence.p95WallTimeMilliseconds = 459_999
  },
  (value: ReturnType<typeof canonicalQualificationEvidencePayload>) => {
    value.qualityEvidence.qualityRole =
      'l4_fallback_compared_to_approved_a100_baseline'
  },
]) {
  const invalid = structuredClone(qualificationEvidencePayload)
  mutate(invalid)
  assert.throws(() => assertCanonicalSam31GpuRuntimeQualificationEvidence({
    ...invalid,
    evidenceHash: canonicalSam31GpuRuntimeQualificationEvidenceDigest(
      invalid,
    ),
  }))
}
assert.throws(() => assertCanonicalSam31GpuRuntimeQualificationEvidence({
  ...qualificationEvidence,
  evidenceHash: digest('tampered-evidence-hash'),
}))
const [qualificationRecordPath] = qualificationRecords.keys()
assert.ok(qualificationRecordPath)
qualificationRecords.set(qualificationRecordPath, Buffer.from('{}'))
await assert.rejects(() => qualificationRepository.rereadQualifiedEvidence({
  qualificationEvidenceRef,
}))
const tampered = structuredClone(a100.observation)
tampered.authority.privateInternalQualified = true as never
assert.throws(() => assertCanonicalSam31GpuRuntimeReleaseObservation(tampered))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-release',
  checks: 42,
  sourceCandidateHash: candidate.candidateHash,
  ingestReceiptHash: ingest.ingestReceiptHash,
  a100ReleaseObservationHash: a100.observation.releaseObservationHash,
  l4ReleaseObservationHash: l4.observation.releaseObservationHash,
  privateInternalQualified: false,
  canonicalQualificationEvidenceFixtureOnly: true,
  canonicalQualificationReleaseRequiresExactReadPort: true,
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
    qualificationJobTerminalObservationRef:
      ref('sam31-runtime-release-qualification-job-terminal'),
    internalCostReceiptRef:
      ref('sam31-runtime-release-qualification-cost'),
    qualificationImageRef:
      ref('sam31-runtime-release-qualification-image'),
    qualificationImageSupplyChainReleaseRef:
      ref('sam31-runtime-release-qualification-image-release'),
    qualificationImageDigest:
      `sha256:${digest('sam31-runtime-release-qualification-image')}`,
    qualificationJobRuntimeImageDigest:
      `sha256:${digest('sam31-runtime-release-qualification-image')}`,
    qualificationJobSucceeded: false,
    qualificationJobNetworkEgressDisabled: false,
    qualificationJobAutomaticRetryCount: 0,
    qualificationRequestObjectReread: false,
    qualificationRequestCheckpointAndFixtureMountsReadOnly: false,
    qualificationResultMountCreateOnly: false,
    qualificationResultObjectCreateOnlyAndReread: false,
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
      torchcodecCudaWheelVersion: '0.10.0+cu128',
      ffmpegVersion: '8.0.3',
      ffmpegNvdecAndCuvidAvailable: true,
      gpuVideoDecodeBackendStatusVerified: true,
      cpuVideoDecodeFallbackObserved: false,
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

type QualificationEvidencePayload = Parameters<
  typeof canonicalSam31GpuRuntimeQualificationEvidenceDigest
>[0]

function canonicalQualificationEvidencePayload():
QualificationEvidencePayload {
  const deterministicProbeFixtureRef = ref(
    'sam31-runtime-qualification-probe-fixture',
  )
  const temporalMaskQualityQualificationRef = ref(
    'sam31-runtime-qualification-a100-mask-quality',
  )
  const wallTimes = [420_000, 430_000, 440_000, 450_000, 460_000]
  return {
    schemaVersion:
      'canonical-sam3_1-gpu-runtime-qualification-evidence-v1',
    source: 'canonical_server_sam3_1_gpu_runtime_qualification_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'private_runtime_qualification_evidence_ready',
    qualificationId: 'sam31-a100-runtime-qualification-fixture',
    qualificationVersion: 1,
    candidateRef: {
      schemaVersion: candidate.schemaVersion,
      candidateHash: candidate.candidateHash,
    },
    privateArtifactIngestReceiptRef: {
      id: ingest.ingestReceiptId,
      version: ingest.ingestReceiptVersion,
      contentHash: `sha256:${ingest.ingestReceiptHash}`,
    },
    sourceCheckpointCompatibilityQualificationRef:
      canonicalSam31SourceCheckpointQualificationRef(
        sourceCheckpointQualification,
      ),
    imageSupplyChainReleaseRef:
      ref('sam31-runtime-qualification-image-supply-chain'),
    serviceIdentityRef: releaseInput.serviceIdentityRef,
    immutableImageRef: releaseInput.immutableImageRef,
    immutableImageDigest: releaseInput.immutableImageDigest,
    scaleToZeroConfigurationRef: releaseInput.scaleToZeroConfigurationRef,
    privateNetworkAndArtifactTransportRef:
      releaseInput.privateNetworkAndArtifactTransportRef,
    route: {
      routeId: releaseInput.route.routeId,
      gpuProfileId: releaseInput.route.gpuProfileId,
      runtimeRegion: releaseInput.route.runtimeRegion,
      executionTarget: releaseInput.route.executionTarget,
      machineType: releaseInput.route.machineType,
      accelerator: releaseInput.route.accelerator,
    },
    driverEvidence: {
      cudaDriverRuntimeQualificationRef:
        ref('sam31-runtime-qualification-driver'),
      observedNvidiaDriverVersion: '570.211.01',
      cudaDriverLibraryMode: 'host_driver',
      loadedCudaDriverLibraryPathDigestSha256:
        digest('/usr/local/nvidia/lib64/libcuda.so.570.211.01'),
      cudaForwardCompatibilityPackageSha256:
        'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
      cudaForwardCompatibilityLibraryLoaded: false,
      hostCudaDriverLibraryLoaded: true,
      exactDriverVersionAndLoadedLibraryPathReread: true,
    },
    deterministicRuns: Array.from({ length: 30 }, (_, index) => {
      const ordinal = index + 1
      return {
        runOrdinal: ordinal,
        qualificationAttemptRef:
          ref(`sam31-runtime-qualification-attempt-${ordinal}`),
        resultAdmissionRef:
          ref(`sam31-runtime-qualification-admission-${ordinal}`),
        runtimeRequestRef:
          ref(`sam31-runtime-qualification-request-${ordinal}`),
        runtimeResponseObjectRef:
          ref(`sam31-runtime-qualification-response-${ordinal}`),
        privateOutputRereadEvidenceRef:
          ref(`sam31-runtime-qualification-output-${ordinal}`),
        attemptCostReceiptRef:
          ref(`sam31-runtime-qualification-cost-${ordinal}`),
        immutableImageDigest: releaseInput.immutableImageDigest,
        routeId: releaseInput.route.routeId,
        accelerator: releaseInput.route.accelerator,
        deterministicProbeFixtureRef,
        outputMaskSetDigestSha256:
          digest('sam31-runtime-qualification-mask-output'),
        exactResultRequestResponseOutputAndCostReread: true,
        exactToolModelAndCheckpointReread: true,
        exactPythonTorchCudaWheelAndNativeClosureReread: true,
        strictCheckpointLoadWithNoMissingOrUnexpectedKeys: true,
        actualCudaModelInferenceMeasured: true,
        actualNvdecDecodeMeasured: true,
        decodedFramesRemainedCudaResident: true,
        bfloat16AutocastMeasured: true,
        cpuOnlyInferenceObserved: false,
        quantizationOrResolutionReductionUsed: false,
        sourceResolutionAndFrameRangePreserved: true,
        terminalWorkerStoppedAndScaleBackToZeroVerified: true,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      }
    }),
    performanceEvidence: {
      eightMinuteSourcePerformanceQualificationRef:
        ref('sam31-runtime-qualification-eight-minute-performance'),
      exactEightMinuteSourceRef:
        ref('sam31-runtime-qualification-eight-minute-source'),
      sourceDurationMilliseconds: 480_000,
      sourceWidth: 3840,
      sourceHeight: 2160,
      sourceFrameCount: 11_520,
      fpsNumerator: 24,
      fpsDenominator: 1,
      measurements: wallTimes.map((wallTimeMilliseconds, index) => {
        const ordinal = index + 1
        return {
          runOrdinal: ordinal,
          fullSourceExecutionRef:
            ref(`sam31-runtime-qualification-full-source-${ordinal}`),
          completeChunkResultSetRef:
            ref(`sam31-runtime-qualification-chunks-${ordinal}`),
          terminalUsageAndCostReceiptSetRef:
            ref(`sam31-runtime-qualification-terminal-cost-${ordinal}`),
          wallTimeMilliseconds,
          coldStartAndImagePullMilliseconds: 40_000,
          modelLoadMilliseconds: 70_000,
          decodePromptPropagationAndStitchMilliseconds: 290_000,
          outputPersistenceAndExactRereadMilliseconds: 20_000,
          sourceResolutionAndCompleteFrameRangePreserved: true,
          everyChunkResultAndTerminalCostReread: true,
          allGpuCapacityStoppedAfterTerminal: true,
          customerCreditsMutated: false,
        }
      }),
      p95WallTimeMilliseconds: 460_000,
      targetWallTimeMilliseconds: 480_000,
      completeSourceIntervalCovered: true,
      automaticQualityReductionAllowed: false,
    },
    qualityEvidence: {
      temporalMaskQualityQualificationRef,
      independentTemporalMeasurementSetRef:
        ref('sam31-runtime-qualification-temporal-measurements'),
      directPrivateCompleteIntervalReviewRef:
        ref('sam31-runtime-qualification-direct-review'),
      reviewedSequenceCount: 30,
      temporalMaskFindingCount: 0,
      allMaskFramesMatchedSourceGeometry: true,
      everyExpectedFrameAndObjectReviewed: true,
      temporalStabilityThresholdsPassed: true,
      directPrivateCompleteIntervalReviewPassed: true,
      qualityRole: 'approved_a100_baseline',
      approvedA100BaselineRuntimeQualificationEvidenceRef: null,
      approvedA100BaselineRef: temporalMaskQualityQualificationRef,
      qualityEqualToOrBetterThanApprovedA100Baseline: true,
      reviewerIndependentFromRuntimeWorker: true,
      qaApprovalGranted: false,
      assetManifestMutated: false,
      renderAuthorized: false,
      publicDeliveryAuthorized: false,
      productionAuthorityGranted: false,
    },
    qualifiedAt: releaseInput.qualifiedAt,
    authority: {
      exactThirtyRunSetReread: true,
      exactEightMinutePerformanceSetReread: true,
      exactDriverAndCudaEvidenceReread: true,
      independentTemporalMaskQaReread: true,
      directCompleteIntervalReviewReread: true,
      privateRuntimeQualificationEvidenceReady: true,
      gpuJobDispatchAuthorized: false,
      customerCreditsMutated: false,
      qaApprovalGranted: false,
      publicDeliveryAuthorized: false,
      productionAuthorityGranted: false,
    },
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
