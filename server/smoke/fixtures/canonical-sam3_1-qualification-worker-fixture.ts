import { createHash } from 'node:crypto'

import type {
  CanonicalSam31PrivateArtifactIngestReceipt,
} from '../../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  sealCanonicalSam31SourceCheckpointQualificationWorkerResult,
  type CanonicalSam31SourceCheckpointQualificationWorkerEvidence,
} from '../../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import type {
  CanonicalSam31SourceRuntimeCandidate,
} from '../../model-artifacts/canonical-sam3_1-source-runtime-candidate'

export function createCanonicalSam31QualificationWorkerEvidenceFixture(input: {
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  readonly qualificationId: string
  readonly qualifiedAt: string
}): CanonicalSam31SourceCheckpointQualificationWorkerEvidence {
  const checkpointKeySetHash = digest('sam31-checkpoint-key-set')
  const fixtureHash = digest('sam31-fixed-person-probe-mp4')
  const qualificationImageDigest = digest('sam31-qualification-image')
  const request = createCanonicalSam31SourceCheckpointQualificationWorkerRequest({
    qualificationId: input.qualificationId,
    candidate: input.candidate,
    ingestReceipt: input.ingestReceipt,
    qualificationImage: {
      artifactRef: contentRef(
        'sam31-qualification-image', qualificationImageDigest,
      ),
      immutableImageDigest: `sha256:${qualificationImageDigest}`,
      supplyChainReleaseRef: ref('sam31-qualification-image-release'),
      dockerfileSourceRef: ref('sam31-qualification-dockerfile-source'),
      entrypointSourceRef: ref('sam31-qualification-entrypoint-source'),
      runnerSourceRef: ref('sam31-qualification-runner-source'),
    },
    patchedSourceArchiveRef: contentRef(
      'sam31-patched-source',
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    ),
    patchApplicationReceiptRef: ref('sam31-patch-application'),
    checkpointWeightsOnlyInspectionRef:
      ref('sam31-checkpoint-weights-only'),
    dependencyClosureRef: ref('sam31-dependency-closure'),
    dependencyLockSha256: digest('sam31-dependency-lock'),
    dependencyClosureReceiptSha256: digest('sam31-dependency-receipt'),
    dependencyWheelManifestSha256: digest('sam31-wheel-manifest'),
    sourceCodeSecurityReviewRef: ref('sam31-source-code-security'),
    deterministicProbeFixture: {
      artifactRef: contentRef('sam31-probe-fixture', fixtureHash),
      byteLength: 1_024,
      sha256: fixtureHash,
      width: 128,
      height: 128,
      frameCount: 3,
    },
    issuedAt: new Date(
      Math.max(0, Date.parse(input.qualifiedAt) - 60_000),
    ).toISOString(),
  })
  const deterministicOutputDigest = digest('sam31-deterministic-probe-output')
  const run = (runOrdinal: 1 | 2 | 3) => ({
    runOrdinal,
    sessionStarted: true as const,
    promptAdded: true as const,
    completeForwardPropagationExecuted: true as const,
    sessionClosed: true as const,
    emittedFrameCount: 3,
    emittedObjectCount: 1,
    outputMaskShapeMatchedProbeFrames: true as const,
    outputObjectIdsMatchedProbePrompt: true as const,
    outputMasksWereCudaTensorsBeforeDigest: true as const,
    outputDigestSha256: deterministicOutputDigest,
    wallTimeMilliseconds: 1_000,
    cudaInferenceMilliseconds: 900,
  })
  const result = sealCanonicalSam31SourceCheckpointQualificationWorkerResult({
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-qualification-worker-result-v1',
    source: 'fixed_sam3_1_a100_source_checkpoint_qualification_worker',
    evidenceClass: 'canonical_private_reread',
    qualificationId: request.qualificationId,
    qualificationVersion: 1,
    operationId: request.operationId,
    requestRef: {
      id: request.qualificationId,
      version: 1,
      schemaVersion: request.schemaVersion,
      contentHash: `sha256:${request.requestHash}`,
    },
    candidateRef: request.candidateRef,
    ingestReceiptRef: request.ingestReceiptRef,
    qualificationImage: {
      artifactRef: request.qualificationImage.artifactRef,
      immutableImageDigest:
        request.qualificationImage.immutableImageDigest,
      supplyChainReleaseRef:
        request.qualificationImage.supplyChainReleaseRef,
    },
    artifactVerification: {
      exactSourceArchiveReread: true,
      exactPatchedSourceArchiveReread: true,
      exactCheckpointRereadBeforeAndAfter: true,
      exactDependencyWheelAndNativeClosureReread: true,
      sourcePatchApplicationReceiptReread: true,
      deterministicProbeFixtureReread: true,
      weightsOnlyCheckpointInspectionExecuted: true,
      unsafeCheckpointGlobalCount: 0,
    },
    runtime: {
      executionTarget: 'google_cloud_batch_a2_ultra_job',
      machineType: 'a2-ultragpu-1g',
      accelerator: 'nvidia_a100_80gb',
      allocatedGpuCount: 1,
      observedGpuName: 'NVIDIA A100-SXM4-80GB',
      observedGpuTotalMemoryBytes: 85_899_345_920,
      baseImageDigest:
        'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
      pythonVersion: '3.12',
      torchVersion: '2.10.0+cu128',
      torchvisionVersion: '0.25.0',
      torchcodecVersion: '0.10.0',
      cudaVersion: '12.8',
      fixedBuilder: 'build_sam3_multiplex_video_predictor',
      networkEgressObserved: false,
      developerMachineExecutionObserved: false,
      cpuOnlyModelExecutionObserved: false,
      quantizationOrResolutionReductionUsed: false,
      providerInferenceExecuted: false,
      bfloat16AutocastExecuted: true,
    },
    strictLoad: {
      fixedBuilderImportedFromPinnedSource: true,
      fixedBuilderCalledExactlyOnce: true,
      checkpointLoadedExactlyOnce: true,
      strictCheckpointLoadRequested: true,
      missingCheckpointKeyCount: 0,
      unexpectedCheckpointKeyCount: 0,
      checkpointKeyCount: 257,
      modelStateKeyCount: 257,
      checkpointKeySetSha256: checkpointKeySetHash,
      modelStateKeySetSha256: checkpointKeySetHash,
      checkpointAndModelKeySetsExact: true,
    },
    deterministicRuns: [run(1), run(2), run(3)],
    deterministicOutputDigestSha256: deterministicOutputDigest,
    deterministicOutputDigestMatchedEveryRun: true,
    actualCudaModelInferenceExecuted: true,
    completedAt: input.qualifiedAt,
    authority: {
      qualificationEvidenceOnly: true,
      imageBuildStarted: false,
      productionRuntimeDispatchAuthorized: false,
      customerCreditsMutated: false,
      customerBillingAuthorityGranted: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return {
    request,
    result,
    qualificationJobRef: ref('sam31-qualification-job'),
    qualificationAttemptRef: ref('sam31-qualification-attempt'),
    qualificationResultRuntimeRef: contentRef(
      'sam31-qualification-result', result.resultHash,
    ),
    qualificationLogRef: ref('sam31-qualification-log'),
    qualificationJobTerminalObservationRef:
      ref('sam31-qualification-job-terminal-observation'),
    internalCostReceiptRef: ref('sam31-qualification-internal-cost'),
    deterministicProbeResultRef: contentRef(
      'sam31-probe-result', result.deterministicOutputDigestSha256,
    ),
    terminalJobObservation: {
      immutableImageDigest:
        request.qualificationImage.immutableImageDigest,
      jobSucceeded: true,
      networkEgressDisabled: true,
      automaticRetryCount: 0,
      requestObjectReread: true,
      requestCheckpointAndFixtureMountsReadOnly: true,
      resultMountCreateOnly: true,
      resultObjectCreateOnlyAndReread: true,
    },
    securityAndCompliance: {
      sourceLicenseReviewedForApprovedUse: true,
      checkpointLicenseReviewedForApprovedUse: true,
      privacyReviewApprovedForPrivateQualification: true,
      tradeControlsReviewApprovedForPrivateQualification: true,
      sourceMalwareScanPassed: true,
      checkpointMalwareScanPassed: true,
      sourceStaticSecurityReviewPassed: true,
      checkpointWeightsOnlyLoadPassed: true,
      checkpointTensorAndMetadataAllowlistPassed: true,
      executablePickleTrustGranted: false,
      checkpointRedistributionAuthorized: false,
    },
    qualifiedAt: input.qualifiedAt,
  }
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

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
