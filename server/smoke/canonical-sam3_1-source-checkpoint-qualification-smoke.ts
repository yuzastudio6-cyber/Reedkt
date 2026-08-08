import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  createCanonicalSam31AuthorizedTermsAcceptance,
  prepareCanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31SourceCheckpointQualification,
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  assertCanonicalSam31SourceCheckpointQualificationWorkerResult,
  canonicalSam31SourceCheckpointQualificationRef,
  compileCanonicalSam31SourceCheckpointQualification,
  createCanonicalSam31SourceCheckpointQualificationObservation,
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  sealCanonicalSam31SourceCheckpointQualificationWorkerResult,
  type CanonicalSam31SourceCheckpointQualificationObservation,
  type CanonicalSam31SourceCheckpointQualificationWorkerEvidence,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const candidate = createCanonicalSam31SourceRuntimeCandidate()
const syntheticIngest = await createSyntheticIngest()
export const canonicalIngest = canonicalizeIngest(syntheticIngest)
const canonicalWorkerEvidence = workerEvidence()
const canonicalWorkerObservation =
  createCanonicalSam31SourceCheckpointQualificationObservation(
    canonicalWorkerEvidence,
  )
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
  observation: canonicalWorkerObservation,
  workerEvidence: canonicalWorkerEvidence,
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

const wrongRuntimeImage = {
  ...structuredClone(canonicalWorkerEvidence),
  terminalJobObservation: {
    ...canonicalWorkerEvidence.terminalJobObservation,
    immutableImageDigest:
      `sha256:${digest('wrong-qualification-image')}`,
  },
}
assert.throws(() => createCanonicalSam31SourceCheckpointQualificationObservation(
  wrongRuntimeImage,
))

const tamperedRequest = structuredClone(canonicalWorkerEvidence.request)
tamperedRequest.qualificationImage.immutableImageDigest =
  `sha256:${digest('tampered-qualification-image')}`
assert.throws(() =>
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
    tamperedRequest,
  ))

const tamperedWorkerResult = structuredClone(canonicalWorkerEvidence.result)
tamperedWorkerResult.strictLoad.checkpointLoadedExactlyOnce = false as never
assert.throws(() =>
  assertCanonicalSam31SourceCheckpointQualificationWorkerResult(
    tamperedWorkerResult,
  ))

const shortWorkerResult = structuredClone(canonicalWorkerEvidence.result)
shortWorkerResult.deterministicRuns.pop()
assert.throws(() =>
  assertCanonicalSam31SourceCheckpointQualificationWorkerResult(
    shortWorkerResult,
  ))

const cpuDecodeFallback = structuredClone(canonicalWorkerEvidence.result)
;(cpuDecodeFallback.runtime as unknown as {
  cpuVideoDecodeFallbackObserved: boolean
}).cpuVideoDecodeFallbackObserved = true
assert.throws(() =>
  assertCanonicalSam31SourceCheckpointQualificationWorkerResult(
    cpuDecodeFallback,
  ))

const cpuTorchcodecWheel = structuredClone(canonicalWorkerEvidence.result)
;(cpuTorchcodecWheel.runtime as unknown as {
  torchcodecCudaWheelVersion: string
}).torchcodecCudaWheelVersion = '0.10.0'
assert.throws(() =>
  assertCanonicalSam31SourceCheckpointQualificationWorkerResult(
    cpuTorchcodecWheel,
  ))

const staleEinops = structuredClone(canonicalWorkerEvidence.result)
;(staleEinops.runtime as unknown as {
  einopsVersion: string
}).einopsVersion = '0.8.1'
assert.throws(() =>
  assertCanonicalSam31SourceCheckpointQualificationWorkerResult(staleEinops))

const dockerfile = readFileSync(
  new URL(
    '../../docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
    import.meta.url,
  ),
  'utf8',
)
const runner = readFileSync(
  new URL(
    '../../docker/prod/gpu-worker/sam3_1/qualification_runner.py',
    import.meta.url,
  ),
  'utf8',
)
const entrypoint = readFileSync(
  new URL(
    '../../docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh',
    import.meta.url,
  ),
  'utf8',
)
assert.match(dockerfile, /source-checkpoint-qualification-only/u)
assert.match(dockerfile, /SAM31_DEPENDENCY_WHEEL_MANIFEST_SHA256/u)
assert.doesNotMatch(
  dockerfile,
  /source-checkpoint-compatibility-receipt\.json/u,
)
assert.doesNotMatch(dockerfile, /sam3\.1_multiplex\.pt/u)
assert.equal((dockerfile.match(/^RUN --network=none /gmu) ?? []).length, 0)
assert.equal((dockerfile.match(/^RUN /gmu) ?? []).length, 3)
assert.match(dockerfile, /pkgconf-3\.0\.4\.tar\.gz/u)
assert.match(
  dockerfile,
  /67dd778366d1a094f26a9bf5ad0cce1b2e25588420c49a4c9fea6452a6eef829/u,
)
assert.match(dockerfile, /\/opt\/weeditpro\/pkgconf\/bin\/pkg-config/u)
assert.match(dockerfile, /pkgconfBuiltOfflineFromPinnedSource/u)
assert.match(dockerfile, /libnpp-12-8_12\.3\.3\.100-1_amd64\.deb/u)
assert.match(dockerfile, /cuda-npp-runtime-receipt\.json/u)
assert.match(dockerfile, /\/opt\/weeditpro\/cuda-npp\/lib/u)
assert.match(dockerfile, /libnppicc\.so\.12/u)
assert.doesNotMatch(dockerfile, /(?:apt-get|curl |wget )/u)
assert.match(runner, /get_unsafe_globals_in_checkpoint/u)
assert.match(runner, /strict_checkpoint_load=True/u)
assert.match(
  runner,
  /sam3_1_real_rope_cache_from_complex_buffer_v1/u,
)
assert.match(runner, /EXPECTED_DETECTOR_ROPE_BLOCKS = tuple\(range\(32\)\)/u)
assert.match(runner, /checkpoint already contains derived real RoPE cache/u)
assert.match(runner, /len\(derived_keys\) != 64/u)
assert.match(runner, /checkpoint augmentation exceeded derived RoPE caches/u)
assert.match(runner, /learnedParameterOrCheckpointWeightSynthesized/u)
assert.match(runner, /for ordinal in range\(1, 4\)/u)
assert.match(runner, /verify_ffmpeg_nvdec_runtime\(\)/u)
assert.match(runner, /install_torchcodec_gpu_decode_guard\(\)/u)
assert.equal(
  (runner.match(/install_sam31_multiplex_session_compatibility_guard/gmu)
    ?? []).length,
  2,
)
assert.match(
  runner,
  /"offload_state_to_cpu",\s*"async_loading_frames",\s*"use_torchcodec",\s*"use_cv2",\s*"input_is_mp4",\s*"gpu_acceleration",\s*"gpu_device"/u,
)
assert.match(runner, /inspect\.Parameter\.VAR_KEYWORD/u)
assert.match(runner, /SAM 3\.1 multiplex init_state signature changed/u)
assert.match(runner, /SAM 3\.1 multiplex init_state became open-ended/u)
assert.match(runner, /core\._get_backend_details\(decoder\._decoder\)/u)
assert.match(runner, /"CPU fallback" in details/u)
assert.match(runner, /frame\.device\.type != "cuda"/u)
assert.match(runner, /"0\.10\.0\+cu128"/u)
assert.match(
  runner,
  /source-checkpoint-qualification\/v2\/attempts/u,
)
assert.match(runner, /REQUEST_PATH = QUALIFICATION_MOUNT \/ "request\/request\.json"/u)
assert.match(runner, /google_cloud_vertex_custom_job_a2_ultra/u)
assert.match(runner, /WEEDITPRO_GPU_INVOCATION_ID/u)
assert.doesNotMatch(runner, /\/mnt\/disks\/reeditpro/u)
assert.doesNotMatch(runner, /google_cloud_batch_a2_ultra_job/u)
assert.doesNotMatch(runner, /requests\.|urllib|huggingface_hub/u)
assert.match(entrypoint, /nvidia_a100_80gb/u)
assert.doesNotMatch(
  entrypoint,
  /Kernel Module\[\[:space:\]\]\*\\\(\[0-9\]\[0-9\.\]\*\\\)/u,
)
const qualificationDriverParser = entrypoint.match(
  /driver_version="\$\(\n[ ]{2}awk '\n(?<program>[\s\S]*?)\n[ ]{2}' "\$\{driver_version_file\}"\n\)"/u,
)?.groups?.program
assert.ok(
  qualificationDriverParser,
  'the exact qualification driver parser must remain testable',
)
const parseQualificationDriverVersion = (source: string) => execFileSync(
  'awk',
  [qualificationDriverParser],
  { input: source, encoding: 'utf8' },
).trim()
assert.equal(
  parseQualificationDriverVersion(
    'NVRM version: NVIDIA UNIX x86_64 Kernel Module  535.216.03  Thu Apr  3 01:14:19 UTC 2025\n',
  ),
  '535.216.03',
)
assert.equal(
  parseQualificationDriverVersion(
    'NVRM version: NVIDIA UNIX Open Kernel Module for x86_64  580.95.05  Release Build\n',
  ),
  '580.95.05',
)
assert.equal(
  parseQualificationDriverVersion(
    'NVRM version: NVIDIA UNIX Open Kernel Module for x86_64 malformed\n',
  ),
  '',
)
assert.equal(
  parseQualificationDriverVersion('compiler: gcc version 12.2.0\n'),
  '',
)
assert.match(
  entrypoint,
  /exec \/opt\/weeditpro\/python-venv\/bin\/python \\\n {2}-I -B/u,
)

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
  const hostile = structuredClone(canonicalWorkerObservation)
  mutate(hostile)
  assert.throws(() => compileCanonicalSam31SourceCheckpointQualification({
    candidate,
    ingestReceipt: canonicalIngest,
    observation: hostile,
    workerEvidence: canonicalWorkerEvidence,
  }))
}

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-checkpoint-qualification',
  checks: 63,
  syntheticStatus: synthetic.status,
  canonicalStatus: canonical.status,
  qualificationRuns:
    canonical.controlledObservation.compatibilityProbe
      .deterministicRepeatedProbeRunCount,
  a100QualificationOnly: true,
  networkEgressAllowed: false,
  strictCheckpointLoad: true,
  fixedWorkerEvidenceRequired: true,
  checkpointLoadedExactlyOnce: true,
  deterministicProbeRuns: 3,
  missingCheckpointKeyCount: 0,
  unexpectedCheckpointKeyCount: 0,
  imageBuildStarted: canonical.authority.imageBuildStarted,
  runtimeDispatchAuthorized: canonical.authority.runtimeDispatchAuthorized,
  customerCreditsMutated: canonical.authority.customerCreditsMutated,
  productionReady: canonical.authority.productionReady,
  qualificationHash: canonical.qualificationHash,
}))

function workerEvidence():
CanonicalSam31SourceCheckpointQualificationWorkerEvidence {
  const checkpointKeySetHash = digest('sam31-checkpoint-key-set')
  const sourceCheckpointKeySetHash = digest('sam31-source-checkpoint-key-set')
  const derivedRopeCacheKeySetHash = digest('sam31-derived-rope-cache-key-set')
  const fixtureHash = digest('sam31-fixed-person-probe-mp4')
  const qualificationImageDigest = digest('sam31-qualification-image')
  const request = createCanonicalSam31SourceCheckpointQualificationWorkerRequest({
    qualificationId: 'sam31-source-checkpoint-canonical-private-reread',
    candidate,
    ingestReceipt: canonicalIngest,
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
    issuedAt: '2026-08-03T21:59:00.000Z',
  })
  const deterministicOutputDigest = digest('sam31-deterministic-probe-output')
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
      torchvisionVersion: '0.25.0+cu128',
      torchcodecVersion: '0.10.0',
      torchcodecCudaWheelVersion: '0.10.0+cu128',
      einopsVersion: '0.8.2',
      pycocotoolsVersion: '2.0.11',
      ffmpegVersion: '8.0.3',
      ffmpegNvdecAndCuvidAvailable: true,
      gpuVideoDecodeBackendStatusVerified: true,
      cpuVideoDecodeFallbackObserved: false,
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
      sourceCheckpointKeyCount: 193,
      sourceCheckpointKeySetSha256: sourceCheckpointKeySetHash,
      deterministicRuntimeBufferDerivationPolicy:
        'sam3_1_real_rope_cache_from_complex_buffer_v1',
      sourceComplexRopeBufferCount: 32,
      derivedRuntimeBufferKeyCount: 64,
      derivedRuntimeBufferKeySetSha256: derivedRopeCacheKeySetHash,
      derivedRuntimeBufferValuesMatchedSourceComplexBuffers: true,
      sourceCheckpointFileMutated: false,
      learnedParameterOrCheckpointWeightSynthesized: false,
      checkpointKeyCount: 257,
      modelStateKeyCount: 257,
      checkpointKeySetSha256: checkpointKeySetHash,
      modelStateKeySetSha256: checkpointKeySetHash,
      checkpointAndModelKeySetsExact: true,
    },
    deterministicRuns: [1, 2, 3].map((runOrdinal) => ({
      runOrdinal,
      sessionStarted: true,
      promptAdded: true,
      completeForwardPropagationExecuted: true,
      sessionClosed: true,
      emittedFrameCount: 3,
      emittedObjectCount: 1,
      outputMaskShapeMatchedProbeFrames: true,
      outputObjectIdsMatchedProbePrompt: true,
      outputMasksWereCudaTensorsBeforeDigest: true,
      outputDigestSha256: deterministicOutputDigest,
      wallTimeMilliseconds: 1_000,
      cudaInferenceMilliseconds: 900,
    })) as never,
    deterministicOutputDigestSha256: deterministicOutputDigest,
    deterministicOutputDigestMatchedEveryRun: true,
    actualCudaModelInferenceExecuted: true,
    completedAt: '2026-08-03T22:00:00.000Z',
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
    qualifiedAt: '2026-08-03T22:00:00.000Z',
  }
}

function observation(
  evidenceClass:
    | 'synthetic_contract_fixture'
    | 'canonical_private_reread',
  admitted: boolean,
): CanonicalSam31SourceCheckpointQualificationObservation {
  const keySetHash = digest('sam31-checkpoint-key-set')
  const sourceKeySetHash = digest('sam31-source-checkpoint-key-set')
  const derivedKeySetHash = digest('sam31-derived-rope-cache-key-set')
  return {
    evidenceClass,
    qualificationId: `sam31-source-checkpoint-${evidenceClass}`,
    qualificationVersion: 1,
    qualificationJobRef: ref('sam31-qualification-job'),
    qualificationAttemptRef: ref('sam31-qualification-attempt'),
    qualificationResultRuntimeRef: ref('sam31-qualification-result'),
    qualificationLogRef: ref('sam31-qualification-log'),
    qualificationJobTerminalObservationRef:
      ref('sam31-qualification-job-terminal-observation'),
    internalCostReceiptRef: ref('sam31-qualification-internal-cost'),
    qualificationImageRef: ref('sam31-qualification-image'),
    qualificationImageSupplyChainReleaseRef:
      ref('sam31-qualification-image-release'),
    qualificationImageDigest:
      `sha256:${digest('sam31-qualification-image')}`,
    qualificationJobRuntimeImageDigest:
      `sha256:${digest('sam31-qualification-image')}`,
    qualificationJobSucceeded: admitted,
    qualificationJobNetworkEgressDisabled: admitted,
    qualificationJobAutomaticRetryCount: 0,
    qualificationRequestObjectReread: admitted,
    qualificationRequestCheckpointAndFixtureMountsReadOnly: admitted,
    qualificationResultMountCreateOnly: admitted,
    qualificationResultObjectCreateOnlyAndReread: admitted,
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
      torchVersion: '2.10.0+cu128',
      torchvisionVersion: '0.25.0+cu128',
      torchcodecVersion: '0.10.0',
      torchcodecCudaWheelVersion: '0.10.0+cu128',
      einopsVersion: '0.8.2',
      pycocotoolsVersion: '2.0.11',
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
      sourceCheckpointKeyCount: admitted ? 193 : 0,
      sourceCheckpointKeySetSha256: admitted
        ? sourceKeySetHash
        : '0'.repeat(64),
      deterministicRuntimeBufferDerivationPolicy: admitted
        ? 'sam3_1_real_rope_cache_from_complex_buffer_v1'
        : 'not_executed',
      sourceComplexRopeBufferCount: admitted ? 32 : 0,
      derivedRuntimeBufferKeyCount: admitted ? 64 : 0,
      derivedRuntimeBufferKeySetSha256: admitted
        ? derivedKeySetHash
        : '0'.repeat(64),
      derivedRuntimeBufferValuesMatchedSourceComplexBuffers: admitted,
      sourceCheckpointFileMutated: false,
      learnedParameterOrCheckpointWeightSynthesized: false,
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
