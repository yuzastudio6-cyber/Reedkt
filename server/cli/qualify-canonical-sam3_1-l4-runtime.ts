import { createHash, randomUUID } from 'node:crypto'

import { Storage, type File } from '@google-cloud/storage'
import type { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE,
} from '../model-artifacts/canonical-sam3_1-official-probe-fixture'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository,
  sealCanonicalSam31L4RuntimePrivateRunReceipt,
} from '../services/canonical-sam3_1-l4-runtime-qualification-run-receipt-service'
import {
  assertCanonicalSam31L4QualificationJob,
  canonicalSam31L4QualificationJobProjection,
} from '../services/canonical-sam3_1-l4-qualification-job-service'
import {
  canonicalProfessionalGpuJobLaunchSchema,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31VertexServingThirtyRunQualification,
  createCanonicalSam31VertexServingThirtyRunQualificationRepository,
  type CanonicalSam31VertexServingThirtyRunQualification,
} from '../services/canonical-sam3_1-vertex-serving-thirty-run-qualification-service'
import {
  createCanonicalSam31GcpImageSupplyChainReleaseRepository,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31GpuPrivateInputStagingEvidenceSchema,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  createCanonicalSam31GcsPrivateOutputRereadPort,
} from '../workers/masks/canonical-sam3_1-gcs-private-output-reader'
import {
  createCanonicalSam31GcsServingSemanticManifestRereadPort,
} from '../workers/masks/canonical-sam3_1-gcs-serving-semantic-manifest-reader'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  buildCanonicalSam31GpuRuntimeRequest,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  canonicalSam31GpuTaskRecordSchema,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'qualify-weeditpro-sam31-l4-heavy-fallback-private-v1' as const
const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const JOB_NAME = 'reeditpro-sam31-l4-fallback' as const
const JOB_RESOURCE =
  `projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB_NAME}` as const
const RUN_ORIGIN = 'https://run.googleapis.com' as const
const MASK_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const INVOCATION_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations' as const
const QUALIFICATION_PREFIX =
  'private/sam3_1/l4-runtime-qualification/v2' as const
const A100_SERVING_QUALIFICATION_SET_ID =
  'sam31-a100-serving-memory-safe-thirty-run-release-candidate-20260812-v1' as const
const A100_SERVING_QUALIFICATION_RECEIPT_HASH = (
  '19c341f5cd536d6851e2f2d87a5f1c610ecca846bf449a3576e65f01ae1e882c'
) as const
const RUNTIME_CHECKPOINT_OBJECT =
  'model-artifacts/sam3_1/sam3.1_multiplex.pt' as const
const CHECKPOINT_SIZE = 3_502_755_717 as const
const CHECKPOINT_MD5 = 'Q6/1VtsqiKFqA1tWG0gCkA==' as const
const CHECKPOINT_CRC32C = 'bIwyuA==' as const
const MAXIMUM_EXECUTION_WAIT_MS = 20 * 60 * 1_000
const POLL_INTERVAL_MS = 2_000
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const runOrdinalSchema = z.coerce.number().int().min(1).max(30)
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

type AuthRequest = Pick<OAuth2Client, 'request'>

async function main() {
  if (process.env.WEEDITPRO_CONFIRM_SAM31_L4_PRIVATE_QUALIFICATION !==
    CONFIRMATION) {
    throw new Error('exact_sam31_l4_qualification_confirmation_missing')
  }
  if (process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH !==
    WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE) {
    throw new Error('exact_gcp_local_operator_auth_confirmation_missing')
  }
  const qualificationId = safeId.parse(
    process.env.WEEDITPRO_SAM31_L4_QUALIFICATION_ID,
  )
  const runOrdinal = runOrdinalSchema.parse(
    process.env.WEEDITPRO_SAM31_L4_RUN_ORDINAL,
  )
  const l4ImageReleaseRef = evidenceRefSchema.parse({
    id: process.env.WEEDITPRO_SAM31_L4_IMAGE_SUPPLY_CHAIN_RELEASE_ID,
    version: 1,
    contentHash: `sha256:${sha256.parse(
      process.env.WEEDITPRO_SAM31_L4_IMAGE_SUPPLY_CHAIN_RELEASE_SHA256,
    )}`,
  })
  const l4ImageDigest = `sha256:${sha256.parse(
    process.env.WEEDITPRO_SAM31_L4_IMMUTABLE_IMAGE_SHA256,
  )}` as const
  const { authClient: auth, storage } = createWeEditProGcpLocalOperatorAuth({
    confirmation: process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  })
  const now = new Date().toISOString()
  const suffix = `${qualificationId}.run-${String(runOrdinal).padStart(2, '0')}`
  const admissionId = `sam31-l4-qualification:${suffix}`
  const invocationId = `${admissionId}.execution`

  const controlObjectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const privateObjectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: MASK_BUCKET,
  })
  const a100ReceiptRepository =
    createCanonicalSam31VertexServingThirtyRunQualificationRepository({
      objectPort: controlObjectPort,
    })
  const a100ServingQualification =
    assertExactA100ServingQualification(
      await a100ReceiptRepository.reread({
        qualificationSetId: A100_SERVING_QUALIFICATION_SET_ID,
      }),
    )
  const a100ImageDigest = a100ServingQualification.immutableImageDigest
  const l4ImageRelease =
    await createCanonicalSam31GcpImageSupplyChainReleaseRepository({ storage })
      .rereadQualifiedRelease({ releaseRef: l4ImageReleaseRef })
  if (!l4ImageRelease
    || l4ImageRelease.immutableImageDigest !== l4ImageDigest
    || l4ImageRelease.immutableImageRef.contentHash !== l4ImageDigest
    || l4ImageRelease.authority.l4RuntimeQualified
    || l4ImageRelease.authority.runtimeReleaseGranted
    || l4ImageRelease.authority.productionReady) {
    throw new Error('sam31_l4_image_supply_chain_release_changed')
  }
  const expectedL4Image =
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/`
    + `reeditpro-sam31-gpu@${l4ImageDigest}`
  const job = assertCanonicalSam31L4QualificationJob(await getJson(
    auth,
    `${RUN_ORIGIN}/v2/${JOB_RESOURCE}`,
  ), expectedL4Image)
  const beforeExecutions = await listExecutions(auth)
  if (activeExecutions(beforeExecutions).length !== 0) {
    throw new Error('sam31_l4_job_not_scaled_to_zero_before_start')
  }
  const checkpoint = await rereadRuntimeCheckpoint(storage)
  const rateRepository =
    createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
      objectPort: controlObjectPort,
    })
  const baseTask = await rereadBaselineTask(
    privateObjectPort,
    a100ServingQualification,
  )
  const l4Rate = await rateRepository.rereadApprovedCurrentRate({
    rateAuthorityRef: baseTask.fallbackRateAuthorityRef,
    routeId: 'l4_heavy_fallback',
    at: now,
  })
  if (!l4Rate) throw new Error('current_l4_rate_authority_missing')

  const refs = qualificationRefs({ qualificationId, runOrdinal, invocationId })
  const jobProjection = canonicalSam31L4QualificationJobProjection(job)
  const candidateReleaseRef = opaqueRef(
    `sam31-l4-runtime-candidate:${suffix}`,
    {
      job: jobProjection,
      checkpoint,
      imageDigest: l4ImageDigest,
      l4ImageSupplyChainReleaseRef: l4ImageReleaseRef,
      qualifiedA100ServingImageDigest: a100ImageDigest,
      qualifiedA100ServingQualificationRef:
        a100ServingQualificationRef(a100ServingQualification),
    },
  )
  const priorPrimaryQualificationNonExecutionRef = opaqueRef(
    `sam31-l4-qualification-primary-not-executed:${suffix}`,
    {
      qualificationId,
      runOrdinal,
      purpose: 'independent_l4_release_qualification_only',
      productionFallbackAdmissionGranted: false,
      a100CustomerAttemptStarted: false,
      providerOutcome: 'not_executed',
    },
  )
  const admissionPayload = {
    schemaVersion: 'canonical-sam3_1-l4-runtime-qualification-admission-v2',
    source: 'canonical_server_sam3_1_l4_runtime_qualification_owner',
    evidenceClass: 'canonical_private_reread',
    admissionId,
    qualificationId,
    runOrdinal,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'l4_heavy_fallback',
    immutableImageDigest: l4ImageDigest,
    l4ImageSupplyChainReleaseRef: l4ImageReleaseRef,
    runtimeCandidateReleaseRef: candidateReleaseRef,
    sourceCheckpointQualificationRef:
      baseTask.specializedRuntimeReleaseRef,
    qualifiedA100ServingQualificationRef:
      a100ServingQualificationRef(a100ServingQualification),
    qualifiedA100ServingImageDigest: a100ImageDigest,
    currentA100RateAuthorityRef: baseTask.primaryRateAuthorityRef,
    currentL4FallbackRateAuthorityRef: baseTask.fallbackRateAuthorityRef,
    checkpointPromotionRef: checkpoint.checkpointPromotionRef,
    cloudRunJobConfigurationRef: opaqueRef(
      `sam31-l4-job-configuration:${job.uid}`,
      jobProjection,
    ),
    deterministicProbeFixtureRef:
      baseTask.runtimeRequest.sourceMedia.gpuPreparedMaskProxyArtifactRef,
    priorPrimaryQualificationNonExecutionRef,
    privatePreReleaseQualificationOnly: true,
    userTriggeredScaleFromZero: true,
    minimumIdleInstances: 0,
    automaticRetryOrProductionFallbackAuthorized: false,
    callerModelImageRouteCommandPathUrlPriceOrCredentialsAccepted: false,
    customerEditOrCreditsUsed: false,
    qaApproved: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    admittedAt: now,
  } as const
  const admissionHash = sha256AuthorityValue(admissionPayload)
  const admission = Object.freeze({ ...admissionPayload, admissionHash })
  await persistCanonicalJsonCreateOnly({
    file: storage.bucket(CONTROL_PLANE_BUCKET).file(
      `${QUALIFICATION_PREFIX}/admissions/${admissionHash}.json`,
    ),
    value: admission,
  })
  const admissionRef = ref(admissionId, admissionHash)

  const consumptionPayload = {
    schemaVersion: 'canonical-sam3_1-l4-runtime-qualification-consumption-v1',
    source: 'canonical_server_sam3_1_l4_runtime_qualification_owner',
    admissionRef,
    runtimeCandidateReleaseRef: candidateReleaseRef,
    executionAttemptRef: refs.executionAttemptRef,
    idempotencyKey: `sam31-l4-qualification-${runOrdinal}`,
    consumedBeforeCloudJobCreation: true,
    oneAdmissionMayCreateAtMostOneCloudRunExecution: true,
    unknownOutcomeRetryAllowed: false,
    customerCreditsMutated: false,
    consumedAt: now,
  } as const
  const consumptionHash = sha256AuthorityValue(consumptionPayload)
  const consumption = Object.freeze({ ...consumptionPayload, consumptionHash })
  await persistCanonicalJsonCreateOnly({
    file: storage.bucket(CONTROL_PLANE_BUCKET).file(
      `${QUALIFICATION_PREFIX}/consumptions/${consumptionHash}.json`,
    ),
    value: consumption,
  })
  const consumptionRef = ref(admissionId, consumptionHash)

  const envelopePayload = {
    schemaVersion: 'canonical-sam3_1-l4-runtime-qualification-envelope-v1',
    source: 'canonical_server_sam3_1_l4_runtime_qualification_owner',
    invocationId,
    admissionRef,
    admissionConsumptionRef: consumptionRef,
    runtimeCandidateReleaseRef: candidateReleaseRef,
    executionAttemptRef: refs.executionAttemptRef,
    approvedSnapshotRef: refs.approvedSnapshotRef,
    confirmedOutputFrameRef: refs.confirmedOutputFrameRef,
    masterTimingRef: refs.masterTimingRef,
    approvedWorkItemRef: refs.approvedWorkItemRef,
    workerLeaseRef: refs.workerLeaseRef,
    privateWorkerRereadsExactTask: true,
    runtimeDownloadAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    createdBeforeCloudJob: true,
    createdAt: now,
  } as const
  const envelopeHash = sha256AuthorityValue(envelopePayload)
  const envelope = Object.freeze({ ...envelopePayload, envelopeHash })
  await persistCanonicalJsonCreateOnly({
    file: storage.bucket(CONTROL_PLANE_BUCKET).file(
      `${QUALIFICATION_PREFIX}/envelopes/${envelopeHash}.json`,
    ),
    value: envelope,
  })
  const envelopeRef = ref(invocationId, envelopeHash)

  const stagingEvidence = await stageOfficialProbe({
    storage,
    baseTask,
    refs,
    invocationId,
    admissionRef,
    envelopeRef,
    stagedAt: now,
  })
  const task = buildL4QualificationTask({
    baseTask,
    refs,
    invocationId,
    admissionRef,
    consumptionRef,
    envelopeRef,
    candidateReleaseRef,
    priorPrimaryQualificationNonExecutionRef,
    stagingEvidence,
    l4ImageDigest,
    l4ImageReleaseRef,
    preparedAt: now,
  })
  await persistCanonicalJsonCreateOnly({
    file: storage.bucket(MASK_BUCKET).file(
      `${INVOCATION_PREFIX}/${invocationId}/task.json`,
    ),
    value: task,
  })
  const rereadTask = assertCanonicalSam31GpuTaskRecord(
    JSON.parse((await storage.bucket(MASK_BUCKET).file(
      `${INVOCATION_PREFIX}/${invocationId}/task.json`,
    ).download())[0].toString('utf8')),
  )
  if (rereadTask.taskRecordHash !== task.taskRecordHash) {
    throw new Error('sam31_l4_task_exact_reread_changed')
  }

  const operation = await startExactlyOneQualificationExecution({
    auth,
    invocationId,
  })
  const launchedAt = new Date().toISOString()
  const cloudJobExecutionRef = opaqueRef(
    `google-cloud-run-operation:${operation.name.split('/').at(-1)}`,
    { operationName: operation.name, jobResource: JOB_RESOURCE },
  )
  const launchPayload = {
    schemaVersion: 'canonical-professional-gpu-job-launch-v1',
    source: 'canonical_professional_gpu_job_lifecycle_owner',
    launchRecordId: `${admissionId}.launch`,
    admissionRef,
    admissionConsumptionRef: consumptionRef,
    runtimeReleaseRef: candidateReleaseRef,
    executionEnvelopeRef: envelopeRef,
    toolId: 'sam3_1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'l4_heavy_fallback',
    runtimeRegion: REGION,
    executionTarget: 'google_cloud_run_l4_job',
    accelerator: 'nvidia_l4',
    immutableImageDigest: l4ImageDigest,
    cloudJobCreateRequestRef: opaqueRef(
      `sam31-l4-cloud-run-request:${suffix}`,
      { operationName: operation.name, invocationId },
    ),
    cloudJobExecutionRef,
    launchDisposition: 'job_created',
    providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed',
    createOnlyAdmissionConsumedBeforeLaunch: true,
    duplicateLaunchAllowed: false,
    unknownOutcomeRetryAllowed: false,
    noApprovedAdmissionMeansZeroGpuJobs: true,
    minimumIdleInstances: 0,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    launchedAt,
  } as const
  const launch = canonicalProfessionalGpuJobLaunchSchema.parse({
    ...launchPayload,
    launchHash: sha256AuthorityValue(launchPayload),
  })
  await persistCanonicalJsonCreateOnly({
    file: storage.bucket(CONTROL_PLANE_BUCKET).file(
      `${QUALIFICATION_PREFIX}/launches/${launch.launchHash}.json`,
    ),
    value: launch,
  })

  const terminalOperation = await waitForOperation({
    auth,
    operationName: operation.name,
  })
  const executionName = z.string().regex(
    /^projects\/reeditpro\/locations\/us-central1\/jobs\/reeditpro-sam31-l4-fallback\/executions\/[a-z0-9-]+$/u,
  ).parse((terminalOperation.response as { name?: unknown }).name)
  const execution = await waitForTerminalExecution({ auth, executionName })
  await waitForScaleZero({ auth })
  const response = await rereadWorkerResponse({
    storage,
    invocationId,
    task,
  })
  const outputPort = createCanonicalSam31GcsPrivateOutputRereadPort({
    storage,
    projectId: PROJECT_ID,
    bucketName: MASK_BUCKET,
    now: () => new Date().toISOString(),
  })
  const outputEvidence = assertCanonicalSam31PrivateOutputRereadEvidence(
    await outputPort.rereadExactPrivateOutput({
      task,
      response,
      launch,
    }),
  )
  const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: privateObjectPort,
  })
  if (await resultStore.persistPrivateOutputRereadEvidenceCreateOnly(
    invocationId,
    outputEvidence,
  ) !== 'created') {
    throw new Error('sam31_l4_output_evidence_already_exists')
  }
  const outputEvidenceRef = evidenceRefSchema.parse({
    id: `sam31-private-output-reread:${outputEvidence.runtimeResponseObjectRef.id}`,
    version: 1,
    contentHash: `sha256:${outputEvidence.evidenceHash}`,
  })
  const exactOutput = await resultStore.rereadPrivateOutputRereadEvidence(
    invocationId,
    outputEvidenceRef,
  )
  if (stableAuthorityStringify(exactOutput) !==
    stableAuthorityStringify(outputEvidence)) {
    throw new Error('sam31_l4_output_evidence_reread_changed')
  }
  const gpuEvidence = response.gpuEvidence
  if (!gpuEvidence
    || gpuEvidence.requestedAccelerator !== 'nvidia_l4'
    || !gpuEvidence.cudaKernelExecutionMeasured
    || !gpuEvidence.nvdecHardwareDecodeMeasured
    || !gpuEvidence.bfloat16AutocastUsed
    || gpuEvidence.cpuOnlyInferenceUsed) {
    throw new Error('sam31_l4_exact_gpu_execution_evidence_missing')
  }
  const semanticManifest =
    await createCanonicalSam31GcsServingSemanticManifestRereadPort({
      storage,
      projectId: PROJECT_ID,
      bucketName: MASK_BUCKET,
    }).rereadExactServingSemanticManifest({
      task,
      response,
      outputEvidence,
    })
  if (semanticManifest.semanticMaskSetDigestSha256 !==
    a100ServingQualification.semanticMaskSetDigestSha256
    || semanticManifest.propagatedFrameCount !==
      a100ServingQualification.propagatedFrameCountPerRun
    || semanticManifest.maskFileCount !==
      a100ServingQualification.maskFileCountPerRun) {
    throw new Error('sam31_l4_mask_set_differs_from_a100_serving_baseline')
  }

  const receiptPayload = {
    schemaVersion: 'canonical-sam3_1-l4-runtime-private-run-receipt-v2',
    source: 'canonical_server_sam3_1_l4_runtime_qualification_owner',
    evidenceClass: 'canonical_private_l4_cuda_execution_exact_reread',
    status: 'ready_for_terminal_cost_and_independent_mask_quality',
    qualificationId,
    runOrdinal,
    admissionRef,
    admissionConsumptionRef: consumptionRef,
    executionEnvelopeRef: envelopeRef,
    taskRef: ref(task.taskId, task.taskRecordHash),
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    cloudRunOperationName: operation.name,
    cloudRunExecutionResource: execution.name,
    currentL4FallbackRateAuthorityRef: baseTask.fallbackRateAuthorityRef,
    qualifiedA100ServingQualificationRef:
      a100ServingQualificationRef(a100ServingQualification),
    runtimeCandidateReleaseRef: candidateReleaseRef,
    checkpointPromotionRef: checkpoint.checkpointPromotionRef,
    runtimeResponseRef: opaqueRef(
      `sam31-l4-runtime-response:${invocationId}`,
      response,
    ),
    privateOutputRereadEvidenceRef: outputEvidenceRef,
    semanticManifestRef: semanticManifest.manifestRef,
    semanticMaskSetDigestSha256:
      semanticManifest.semanticMaskSetDigestSha256,
    immutableImageDigest: l4ImageDigest,
    observedAccelerator: response.gpuEvidence?.requestedAccelerator,
    observedDriverVersion: response.gpuEvidence?.observedNvidiaDriverVersion,
    observedCudaRuntimeVersion:
      response.gpuEvidence?.observedCudaRuntimeVersion,
    wallTimeMilliseconds: response.runtimeMeasurement?.wallTimeMilliseconds,
    cudaEventInferenceMilliseconds:
      response.runtimeMeasurement?.cudaEventInferenceMilliseconds,
    privateInputByteLength: task.privateInputStagingEvidence.byteLength,
    workerOutputByteLength:
      response.runtimeMeasurement?.outputByteLength,
    manifestByteLength: outputEvidence.manifestByteLength,
    combinedMaskByteLength: outputEvidence.combinedMaskByteLength,
    propagatedFrameCount: response.outputSummary?.propagatedFrameCount,
    losslessMaskPngCount: response.outputSummary?.losslessMaskPngCount,
    scaleFromZeroObserved: activeExecutions(beforeExecutions).length === 0,
    terminalWorkerStoppedAndScaleBackToZeroVerified: true,
    exactTaskResponseAndEveryOutputMaskReread: true,
    exactDeterministicProbeMaskSetMatchesA100ServingQualification: true,
    accountEffectiveRateRereadBeforeDispatch: true,
    terminalPlatformUsageAndCostReceiptPending: true,
    independentTemporalMaskQualityPending: true,
    runtimeReleaseGranted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    completedAt: new Date().toISOString(),
  } as const
  const receipt = sealCanonicalSam31L4RuntimePrivateRunReceipt(receiptPayload)
  const receiptHash = receipt.receiptHash
  await persistCanonicalJsonCreateOnly({
    file: storage.bucket(CONTROL_PLANE_BUCKET).file(
      `${QUALIFICATION_PREFIX}/run-receipts/${receiptHash}.json`,
    ),
    value: receipt,
  })
  await createCanonicalSam31L4RuntimePrivateRunReceiptRepository({
    objectPort: controlObjectPort,
  }).persistCreateOnly({ receipt })
  process.stdout.write(`${stableAuthorityStringify({
    ok: true,
    qualificationId,
    runOrdinal,
    invocationId,
    receiptHash,
    status: receipt.status,
    wallTimeMilliseconds: receipt.wallTimeMilliseconds,
    cudaEventInferenceMilliseconds: receipt.cudaEventInferenceMilliseconds,
    propagatedFrameCount: receipt.propagatedFrameCount,
    losslessMaskPngCount: receipt.losslessMaskPngCount,
    activeGpuExecutionsAfterTerminal: 0,
    runtimeReleaseGranted: false,
  })}\n`)
}

async function rereadBaselineTask(objectPort: ReturnType<
  typeof createCanonicalGcsSourceAnalysisJsonObjectPort
>, qualification: CanonicalSam31VertexServingThirtyRunQualification) {
  const baseline = qualification.deterministicRuns[1]
  if (!baseline || baseline.runOrdinal !== 2
    || baseline.terminalEvidenceMode !==
      'provider_prediction_and_private_response') {
    throw new Error('approved_a100_serving_baseline_run_missing')
  }
  const body = await objectPort.readExact(
    `${INVOCATION_PREFIX}/${baseline.invocationId}/task.json`,
  )
  if (!body) throw new Error('approved_a100_baseline_task_missing')
  const task = assertCanonicalSam31GpuTaskRecord(
    JSON.parse(body.toString('utf8')) as unknown,
  )
  if (task.taskRecordHash !== baseline.taskRef.contentHash.slice(7)
    || task.invocationId !== baseline.invocationId
    || task.runtimeRequest.dispatch.routeRole !==
      'a100_80gb_heavy_primary'
    || task.runtimeRequest.modelArtifacts.immutableImageDigest !==
      qualification.immutableImageDigest
    || task.runtimeRequest.modelArtifacts.immutableImageReleaseRef.contentHash !==
      qualification.immutableImageDigest) {
    throw new Error('approved_a100_baseline_task_changed')
  }
  return task
}

function assertExactA100ServingQualification(value: unknown) {
  const receipt =
    assertCanonicalSam31VertexServingThirtyRunQualification(value)
  if (receipt.qualificationSetId !== A100_SERVING_QUALIFICATION_SET_ID
    || receipt.receiptHash !== A100_SERVING_QUALIFICATION_RECEIPT_HASH
    || receipt.schemaVersion !==
      'canonical-sam3_1-vertex-serving-thirty-run-qualification-v2'
    || receipt.evidenceClass !==
      'canonical_private_exact_output_and_prediction_reread'
    || receipt.status !==
      'qualified_for_l4_quality_and_performance_comparison'
    || receipt.latencyReplacementQualificationId !== null
    || receipt.deterministicOutputRunCount !== 30
    || receipt.measuredPerformanceRunCount !== 30
    || receipt.recoveredOutputRunCount !== 0
    || !receipt.allThirtyDeterministicOutputsSemanticallyIdentical
    || !receipt.allThirtyPerformanceMeasurementsUseExactPredictionReceipts
    || !receipt.everyPerformanceRunUsesItsOwnPredictionReceipt
    || receipt.recoveredRunExcludedFromLatencyAndReplacedExplicitly
    || !receipt.exactTaskResponseOutputManifestAndMaskEvidenceReread
    || receipt.l4FallbackQualified
    || receipt.runtimeReleaseGranted
    || receipt.productionAuthorityGranted) {
    throw new Error('approved_a100_serving_qualification_changed')
  }
  return receipt
}

function a100ServingQualificationRef(
  receipt: CanonicalSam31VertexServingThirtyRunQualification,
) {
  return ref(receipt.qualificationSetId, receipt.receiptHash)
}

async function rereadRuntimeCheckpoint(storage: Storage) {
  const file = storage.bucket(MASK_BUCKET).file(RUNTIME_CHECKPOINT_OBJECT)
  const [metadata] = await file.getMetadata()
  const projection = {
    bucket: MASK_BUCKET,
    object: RUNTIME_CHECKPOINT_OBJECT,
    generation: String(metadata.generation ?? ''),
    size: Number(metadata.size ?? -1),
    crc32c: String(metadata.crc32c ?? ''),
    md5Hash: String(metadata.md5Hash ?? ''),
  }
  if (!/^[1-9][0-9]*$/u.test(projection.generation)
    || projection.size !== CHECKPOINT_SIZE
    || projection.crc32c !== CHECKPOINT_CRC32C
    || projection.md5Hash !== CHECKPOINT_MD5) {
    throw new Error('sam31_l4_runtime_checkpoint_promotion_changed')
  }
  return Object.freeze({
    ...projection,
    checkpointPromotionRef: opaqueRef(
      `sam31-l4-runtime-checkpoint:${projection.generation}`,
      projection,
    ),
  })
}

function qualificationRefs(input: {
  qualificationId: string
  runOrdinal: number
  invocationId: string
}) {
  const named = (name: string) => opaqueRef(
    `sam31-l4-qualification-${name}-${input.runOrdinal}`,
    { ...input, name },
  )
  return Object.freeze({
    ownerUserId: 'weeditpro-internal-qualification-owner',
    workspaceId: 'weeditpro-internal-qualification',
    projectId: 'weeditpro-sam31-runtime-qualification',
    editSessionId: `sam31-l4-qualification-session-${input.runOrdinal}`,
    editPlanId: 'sam31-runtime-qualification-plan',
    editPlanVersionId: 'sam31-runtime-qualification-plan-v1',
    outputId: 'sam31-official-probe-output',
    sceneId: 'sam31-official-probe-scene',
    approvedSnapshotRef: named('approved-snapshot'),
    confirmedOutputFrameRef: named('confirmed-output-frame'),
    masterTimingRef: named('master-timing'),
    approvedWorkItemRef: named('approved-work-item'),
    workerLeaseRef: named('worker-lease'),
    fundedReservationRef: named('zero-customer-credit-reservation'),
    executionAttemptRef: named('execution-attempt'),
    compiledIntentRef: named('compiled-intent'),
    promptApprovalRef: named('prompt-approval'),
    taskContextRef: named('task-context'),
    privateTaskInputTransportRef: named('private-input-transport'),
    privateTaskOutputTransportRef: named('private-output-transport'),
  })
}

async function stageOfficialProbe(input: {
  storage: Storage
  baseTask: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  refs: ReturnType<typeof qualificationRefs>
  invocationId: string
  admissionRef: z.infer<typeof evidenceRefSchema>
  envelopeRef: z.infer<typeof evidenceRefSchema>
  stagedAt: string
}) {
  const fixture = CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE
  const [source] = await input.storage.bucket(fixture.bucketName)
    .file(fixture.objectName).download({ validation: 'crc32c' })
  if (source.byteLength !== fixture.byteLength
    || hashBytes(source) !== fixture.sha256) {
    throw new Error('official_probe_fixture_exact_bytes_changed')
  }
  const destination = input.storage.bucket(MASK_BUCKET).file(
    `${INVOCATION_PREFIX}/${input.invocationId}/mask-proxy.mp4`,
  )
  await destination.save(source, {
    contentType: 'video/mp4',
    resumable: false,
    validation: 'crc32c',
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  const [metadata] = await destination.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const [reread] = await destination.bucket.file(
    destination.name,
    { generation },
  ).download({ validation: 'crc32c' })
  if (!/^[1-9][0-9]*$/u.test(generation) || !etag
    || reread.byteLength !== source.byteLength
    || hashBytes(reread) !== fixture.sha256) {
    throw new Error('official_probe_private_staging_exact_reread_changed')
  }
  const base: Partial<typeof input.baseTask.privateInputStagingEvidence> = {
    ...input.baseTask.privateInputStagingEvidence,
  }
  delete base.evidenceHash
  const payload = {
    ...base,
    invocationId: input.invocationId,
    stagingId: `sam31-input-staging:${input.invocationId}`,
    dispatchAdmissionRef: input.admissionRef,
    executionEnvelopeRef: input.envelopeRef,
    scope: {
      ...base.scope,
      editSessionId: input.refs.editSessionId,
      approvedSnapshotRef: input.refs.approvedSnapshotRef,
      approvedWorkItemRef: input.refs.approvedWorkItemRef,
      workerLeaseRef: input.refs.workerLeaseRef,
      executionAttemptRef: input.refs.executionAttemptRef,
    },
    privateTaskInputTransportRef: input.refs.privateTaskInputTransportRef,
    privateInvocationObjectRef: ref(
      `sam31-mask-proxy:${input.invocationId}`,
      fixture.sha256,
    ),
    storageGeneration: generation,
    storageEtagSha256: hashText(etag),
    stagedAt: input.stagedAt,
  }
  const evidenceHash = sha256AuthorityValue(payload)
  return canonicalSam31GpuPrivateInputStagingEvidenceSchema.parse({
    ...payload,
    evidenceHash,
  })
}

function buildL4QualificationTask(input: {
  baseTask: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  refs: ReturnType<typeof qualificationRefs>
  invocationId: string
  admissionRef: z.infer<typeof evidenceRefSchema>
  consumptionRef: z.infer<typeof evidenceRefSchema>
  envelopeRef: z.infer<typeof evidenceRefSchema>
  candidateReleaseRef: z.infer<typeof evidenceRefSchema>
  priorPrimaryQualificationNonExecutionRef: z.infer<typeof evidenceRefSchema>
  stagingEvidence: z.infer<
    typeof canonicalSam31GpuPrivateInputStagingEvidenceSchema
  >
  l4ImageDigest: `sha256:${string}`
  l4ImageReleaseRef: z.infer<typeof evidenceRefSchema>
  preparedAt: string
}) {
  const baseRequest = input.baseTask.runtimeRequest
  const runtimeRequest = buildCanonicalSam31GpuRuntimeRequest({
    schemaVersion: baseRequest.schemaVersion,
    operationId: baseRequest.operationId,
    dispatchAdmissionRef: input.admissionRef,
    dispatchAdmissionDigestSha256:
      input.admissionRef.contentHash.slice(7),
    scope: {
      ...baseRequest.scope,
      editSessionId: input.refs.editSessionId,
      approvedPlanSnapshotId: input.refs.approvedSnapshotRef.id,
      approvedPlanSnapshotHash:
        input.refs.approvedSnapshotRef.contentHash.slice(7),
      approvedWorkItemRef: input.refs.approvedWorkItemRef,
      workerLeaseRef: input.refs.workerLeaseRef,
      executionAttemptRef: input.refs.executionAttemptRef,
      fundedCreditReservationRef: input.refs.fundedReservationRef,
      masterTimingRef: input.refs.masterTimingRef,
    },
    dispatch: {
      routeRole: 'l4_heavy_fallback',
      gpuProfileId: 'quality_l4_user_triggered_heavy_fallback_job_v1',
      accelerator: 'nvidia_l4',
      attemptOrdinal: 2,
      priorAttemptDisposition: 'not_executed_retry_safe',
      priorAttemptDispositionRef:
        input.priorPrimaryQualificationNonExecutionRef,
      currentPrimaryAndFallbackRateAuthoritiesReread: true,
      exactPerToolEstimateApproved: true,
      userTriggeredAfterApproval: true,
      scaleFromZeroRequired: true,
      scaleBackToZeroAfterTerminalAttemptRequired: true,
      unknownPriorOutcomeMayRetryOrFallback: false,
      cpuOnlyInferenceAllowed: false,
    },
    sourceMedia: baseRequest.sourceMedia,
    approvedPrompt: {
      ...baseRequest.approvedPrompt,
      compiledIntentRef: input.refs.compiledIntentRef,
      promptApprovalRef: input.refs.promptApprovalRef,
    },
    modelArtifacts: {
      ...baseRequest.modelArtifacts,
      immutableImageReleaseRef: input.l4ImageReleaseRef,
      immutableImageDigest: input.l4ImageDigest,
    },
    settings: {
      ...baseRequest.settings,
      gpuMemoryProfileId:
        'l4_gpu_only_full_semantic_streamed_grounding_postprocess_trimmed_memory_v6',
    },
    byteFreeRequest: true,
    callerCodePathUrlCommandOrEnvironmentAccepted: false,
  })
  const runtimeHash = sha256AuthorityValue(runtimeRequest)
  const stagingRef = ref(
    input.stagingEvidence.stagingId,
    input.stagingEvidence.evidenceHash,
  )
  const basePayload: Partial<typeof input.baseTask> = { ...input.baseTask }
  delete basePayload.taskRecordHash
  const payload = {
    ...basePayload,
    taskId: `sam31-task:${input.invocationId}`,
    invocationId: input.invocationId,
    taskContextRef: input.refs.taskContextRef,
    dispatchAdmissionRef: input.admissionRef,
    admissionConsumptionRef: input.consumptionRef,
    executionEnvelopeRef: input.envelopeRef,
    runtimeReleaseRef: input.candidateReleaseRef,
    primaryRateAuthorityRef: input.baseTask.primaryRateAuthorityRef,
    fallbackRateAuthorityRef: input.baseTask.fallbackRateAuthorityRef,
    privateTaskInputTransportRef: input.refs.privateTaskInputTransportRef,
    privateTaskOutputTransportRef: input.refs.privateTaskOutputTransportRef,
    privateInputStagingEvidenceRef: stagingRef,
    privateInputStagingEvidence: input.stagingEvidence,
    runtimeRequestRef: ref(
      `sam31-runtime-request:${input.invocationId}`,
      runtimeHash,
    ),
    runtimeRequestContentSha256: runtimeHash,
    runtimeRequest,
    preparedAt: input.preparedAt,
  }
  return canonicalSam31GpuTaskRecordSchema.parse({
    ...payload,
    taskRecordHash: sha256AuthorityValue(payload),
  })
}

async function startExactlyOneQualificationExecution(input: {
  auth: AuthRequest
  invocationId: string
}) {
  const response = await input.auth.request({
    url: `${RUN_ORIGIN}/v2/${JOB_RESOURCE}:run`,
    method: 'POST',
    data: {
      overrides: {
        containerOverrides: [{
          env: [{
            name: 'REEDITPRO_GPU_INVOCATION_ID',
            value: input.invocationId,
          }],
          clearArgs: false,
        }],
        taskCount: 1,
        timeout: '3600s',
      },
    },
    timeout: 30_000,
    retry: false,
    maxRedirects: 0,
  })
  return z.object({
    name: z.string().regex(
      /^projects\/reeditpro\/locations\/us-central1\/operations\/[a-z0-9-]+$/u,
    ),
    done: z.boolean().optional(),
  }).passthrough().parse(response.data)
}

async function waitForOperation(input: {
  auth: AuthRequest
  operationName: string
}) {
  const deadline = Date.now() + MAXIMUM_EXECUTION_WAIT_MS
  while (Date.now() < deadline) {
    const operation = z.object({
      name: z.literal(input.operationName),
      done: z.boolean().optional(),
      error: z.unknown().optional(),
      response: z.unknown().optional(),
    }).passthrough().parse(await getJson(
      input.auth,
      `${RUN_ORIGIN}/v2/${input.operationName}`,
    ))
    if (operation.done) {
      if (operation.error || !operation.response) {
        throw new Error('sam31_l4_cloud_run_operation_failed')
      }
      return operation
    }
    await pause(POLL_INTERVAL_MS)
  }
  throw new Error('sam31_l4_operation_outcome_unknown_reconcile_required')
}

async function waitForTerminalExecution(input: {
  auth: AuthRequest
  executionName: string
}) {
  const deadline = Date.now() + MAXIMUM_EXECUTION_WAIT_MS
  while (Date.now() < deadline) {
    const execution = parseExecution(await getJson(
      input.auth,
      `${RUN_ORIGIN}/v2/${input.executionName}`,
    ))
    if (execution.completionTime) {
      if (!execution.startTime || execution.succeededCount !== 1
        || execution.failedCount !== 0
        || execution.cancelledCount !== 0) {
        throw new Error('sam31_l4_execution_did_not_succeed_exactly_once')
      }
      return execution
    }
    await pause(POLL_INTERVAL_MS)
  }
  throw new Error('sam31_l4_execution_outcome_unknown_reconcile_required')
}

async function waitForScaleZero(input: { auth: AuthRequest }) {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    if (activeExecutions(await listExecutions(input.auth)).length === 0) return
    await pause(POLL_INTERVAL_MS)
  }
  throw new Error('sam31_l4_scale_to_zero_not_observed')
}

async function rereadWorkerResponse(input: {
  storage: Storage
  invocationId: string
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
}) {
  const file = input.storage.bucket(MASK_BUCKET).file(
    `${INVOCATION_PREFIX}/${input.invocationId}/response.json`,
  )
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    try {
      const [metadata] = await file.getMetadata()
      const generation = String(metadata.generation ?? '')
      const size = Number(metadata.size ?? -1)
      if (!/^[1-9][0-9]*$/u.test(generation)
        || !Number.isSafeInteger(size) || size < 2 || size > 64 * 1024) {
        throw new Error('sam31_l4_worker_response_metadata_changed')
      }
      const [body] = await file.bucket.file(file.name, { generation })
        .download({ validation: 'crc32c' })
      if (body.byteLength !== size) {
        throw new Error('sam31_l4_worker_response_byte_length_changed')
      }
      const response = assertCanonicalSam31GpuRuntimeResponse({
        request: input.task.runtimeRequest,
        response: JSON.parse(body.toString('utf8')) as unknown,
      })
      if (response.status !== 'completed') {
        throw new Error(`sam31_l4_worker_failed:${response.terminalStage}`)
      }
      return response
    } catch (error) {
      if (cloudErrorCode(error) !== 404) throw error
    }
    await pause(POLL_INTERVAL_MS)
  }
  throw new Error('sam31_l4_worker_response_missing_after_terminal')
}

async function listExecutions(auth: AuthRequest) {
  const untrusted = await getJson(
    auth,
    `${RUN_ORIGIN}/v2/${JOB_RESOURCE}/executions`,
    { pageSize: 100 },
  )
  return z.object({
    executions: z.array(z.unknown()).optional(),
  }).passthrough().parse(untrusted).executions?.map(parseExecution) ?? []
}

function parseExecution(value: unknown) {
  return z.object({
    name: z.string().regex(
      /^projects\/reeditpro\/locations\/us-central1\/jobs\/reeditpro-sam31-l4-fallback\/executions\/[a-z0-9-]+$/u,
    ),
    startTime: timestamp.optional(),
    completionTime: timestamp.optional(),
    succeededCount: z.number().int().nonnegative().optional(),
    failedCount: z.number().int().nonnegative().optional(),
    cancelledCount: z.number().int().nonnegative().optional(),
  }).passthrough().transform((execution) => ({
    ...execution,
    startTime: execution.startTime ?? '',
    completionTime: execution.completionTime ?? '',
    succeededCount: execution.succeededCount ?? 0,
    failedCount: execution.failedCount ?? 0,
    cancelledCount: execution.cancelledCount ?? 0,
  })).parse(value)
}

function activeExecutions(executions: readonly ReturnType<
  typeof parseExecution
>[]) {
  return executions.filter((execution) => !execution.completionTime)
}

async function persistCanonicalJsonCreateOnly(input: {
  file: File
  value: unknown
}) {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  await input.file.save(body, {
    contentType: 'application/json',
    resumable: false,
    validation: 'crc32c',
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  const [metadata] = await input.file.getMetadata()
  const generation = String(metadata.generation ?? '')
  const [reread] = await input.file.bucket.file(
    input.file.name,
    { generation },
  ).download({ validation: 'crc32c' })
  if (!/^[1-9][0-9]*$/u.test(generation)
    || !reread.equals(body)) {
    throw new Error('qualification_record_create_only_reread_changed')
  }
}

async function getJson(
  auth: AuthRequest,
  url: string,
  params?: Readonly<Record<string, string | number>>,
) {
  const response = await auth.request({
    url,
    method: 'GET',
    params,
    timeout: 30_000,
    retry: false,
    maxRedirects: 0,
  })
  return response.data
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${sha256.parse(hash)}`,
  })
}

function opaqueRef(id: string, value: unknown) {
  return ref(id, sha256AuthorityValue(value))
}

function hashBytes(value: Buffer) {
  return createHash('sha256').update(value).digest('hex')
}

function hashText(value: string) {
  return hashBytes(Buffer.from(value, 'utf8'))
}

function pause(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'number' ? code : Number(code)
}

main().catch((error: unknown) => {
  process.stderr.write(`${stableAuthorityStringify({
    code: 'sam31_l4_private_qualification_failed',
    message: error instanceof Error ? error.message : 'unknown_error',
    runToken: randomUUID().replaceAll('-', '').slice(0, 12),
  })}\n`)
  process.exitCode = 1
})
