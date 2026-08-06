import { createHash, randomUUID } from 'node:crypto'

import { Storage, type File } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation-runtime'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'
import {
  imageSupplyChainTerminalRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainBuildRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build-runtime'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainEvidenceReadPort,
  createCanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-evidence-read'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpImageSecurityReviewRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-security-review-operator'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
  buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationFixture,
  buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
  canonicalTrackAllSam31L4TaskQaPrivateQualificationRef,
  canonicalTrackAllSam31L4TaskQaPrivateQualificationConstants,
  canonicalTrackAllSam31L4TaskQaResponseRef,
  canonicalTrackAllSam31L4TaskQaTaskRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-private-qualification'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'

const CONFIRMATION =
  'qualify-weeditpro-track-all-sam31-l4-task-qa-private-v1' as const
const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const JOB_NAME = 'reeditpro-track-all-mask-qa-l4' as const
const JOB_RESOURCE =
  `projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB_NAME}` as const
const RUN_ORIGIN = 'https://run.googleapis.com' as const
const RUN_SCOPE = 'https://www.googleapis.com/auth/cloud-platform' as const
const MASK_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const INVOCATION_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations' as const
const RECEIPT_PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/private-qualification' as const
const MAXIMUM_EXECUTION_WAIT_MS = 20 * 60 * 1_000
const POLL_INTERVAL_MS = 2_000

const supplyRefs = Object.freeze({
  imageBuildAuthorityRef: ref(
    'track-all-l4-task-qa-cloud-image-build-4fde8cf050d20138701b3209',
    '94844ecd68bcaa6ef59d1cdc492a8aa19f97ad7aa57b54bffb720952a532ce55',
  ),
  imageBuildSubmissionRef: ref(
    'track-all-l4-cloud-build-submission-4b88168ace1c6aebebc98d88',
    '4b88168ace1c6aebebc98d882f504dbe2e7061763335519cc9be7d2e23c8ea2a',
  ),
  imageBuildTerminalRef: ref(
    'track-all-l4-cloud-build-terminal-89203fdbb2b84b6bd2d2ba0b',
    'c155313e594645c5d4b4f19ec7707389112354f943d9cdf4c339b96b7b309e33',
  ),
  supplyChainAdmissionRef: ref(
    'track-all-l4-image-supply-chain-c155313e594645939ca832bc',
    'edc2eae18a4b54c5d4b4f19ec7707389112354f943d9cdf4c339b96b7b309e33',
  ),
  supplyChainSubmissionRef: ref(
    'track-all-l4-supply-chain-submission-3a1da8e6929b4749b2fbe183',
    '3a1da8e6929b4749b2fbe1833a36dbefe967549508c16aab5ae5927a7cbfc33e',
  ),
  supplyChainTerminalRef: ref(
    'track-all-l4-supply-chain-terminal-03bc47f452cfaa7310167006',
    '03bc47f452cfaa73101670060b4ff9455888f9ccea603c62939f382cde6100a9',
  ),
  sbomRef: ref(
    'sam31-spdx-sbom-54a002d01a55360282b5af48',
    '54a002d01a55360282b5af48a8e369247546f99281978bc92b96c869d40ee0ca',
  ),
  vulnerabilityScanRef: ref(
    'sam31-artifact-analysis-scan-d73c8c4809ad1a44b299b32d',
    'd73c8c4809ad1a44b299b32de0bf0a478bb90c007ebc6f90546fb651ddb3cce0',
  ),
  signatureVerificationRef: ref(
    'sam31-cosign-verification-0973464ba397fb83e73cbbc3',
    '0973464ba397fb83e73cbbc3333d1e34bf39614d97f93a321f6de2fee88dbebe',
  ),
  slsaProvenanceRef: ref(
    'sam31-slsa-v1-provenance-1d4296286547fedf72250070',
    '1d4296286547fedf72250070c7dc54b517487e3a49f3dcd9e4ccde3552135503',
  ),
  securityReviewRef: ref(
    'track-all-l4-image-security-review-d73c8c4809ad1a44b299b32d',
    'adbf5e110ab9f9f43fb7c37cca59f86c8320df474d5ae921df64d0b8b1fd3e07',
  ),
})

type AuthRequest = Pick<GoogleAuth, 'request'>

async function main() {
  if (process.env.WEEDITPRO_CONFIRM_TRACK_ALL_L4_PRIVATE_QUALIFICATION
    !== CONFIRMATION) {
    throw new Error('exact_private_l4_qualification_confirmation_missing')
  }
  const exactSupply = await rereadSupplyChainEvidence()
  if (!exactSupply) throw new Error('exact_supply_chain_evidence_missing')

  const now = new Date()
  const unique = randomUUID().replaceAll('-', '').slice(0, 20)
  const time = now.toISOString().replace(/[^0-9]/gu, '').slice(0, 17)
  const qualificationId = `weeditpro-sam31-l4-private-${time}-${unique}`
  const fixture =
    buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationFixture({
      qualificationId,
      sam31InvocationId: `${qualificationId}-sam-source`,
      l4InvocationId: `${qualificationId}-l4-qa`,
    })
  const storage = new Storage({ projectId: PROJECT_ID })
  const auth = new GoogleAuth({ scopes: [RUN_SCOPE] })
  const job = assertExactJob(await getJson(auth,
    `${RUN_ORIGIN}/v2/${JOB_RESOURCE}`))
  const beforeExecutions = await listExecutions(auth)
  if (activeExecutions(beforeExecutions).length !== 0) {
    throw new Error('l4_qualification_job_not_scaled_to_zero_before_start')
  }

  await persistFixtureCreateOnly({ storage, fixture })
  const operation = await startExactlyOneQualificationExecution({
    auth,
    l4InvocationId: fixture.l4InvocationId,
  })
  const terminalOperation = await waitForOperation({
    auth,
    operationName: operation.name,
  })
  const executionName = z.string().regex(
    /^projects\/reeditpro\/locations\/us-central1\/jobs\/reeditpro-track-all-mask-qa-l4\/executions\/[a-z0-9-]+$/u,
  ).parse((terminalOperation.response as { name?: unknown } | undefined)?.name)
  const execution = await waitForTerminalExecution({ auth, executionName })
  const workerResponse = await rereadWorkerResponse({
    storage,
    l4InvocationId: fixture.l4InvocationId,
  })
  if (
    workerResponse.requestBindingSha256 !== fixture.request.requestBindingSha256
    || workerResponse.status !== 'completed'
  ) throw new Error('l4_worker_response_did_not_complete_exact_fixture')

  const afterExecutions = await waitForScaleZero({ auth })
  const receipt = buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt({
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-private-qualification-receipt-v1',
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_private_qualification_owner',
    evidenceClass: 'canonical_private_l4_cuda_execution_and_terminal_reread',
    qualificationId,
    qualificationVersion: 1,
    disposition: 'l4_task_qa_qualified_rate_blocked',
    operationId: 'tool.kornia.refine_mask.v1',
    routeId: 'l4_standard_primary',
    supplyChainEvidence: {
      ...supplyRefs,
      exactSupplyChainRereadBeforeQualification: true,
    },
    deployment: {
      projectId: PROJECT_ID,
      region: REGION,
      jobResource: JOB_RESOURCE,
      jobUid: job.uid,
      immutableImageDigest:
        canonicalTrackAllSam31L4TaskQaPrivateQualificationConstants
          .immutableImageDigest,
      accelerator: 'nvidia_l4',
      allocatedGpuCount: 1,
      allocatedVcpuCount: 8,
      allocatedMemoryGiB: 32,
      taskCount: 1,
      parallelism: 1,
      maximumRetries: 0,
      network: 'weeditpro-gpu-private',
      subnet: 'weeditpro-gpu-private-us-central1',
      networkTag: 'weeditpro-gpu-private-no-nat',
      vpcEgress: 'all-traffic',
      privateGoogleAccessEnabled: true,
      cloudNatPresent: false,
      publicNetworkEgressAllowed: false,
      minimumIdleInstances: 0,
    },
    deterministicFixture: {
      fixtureId: fixture.fixtureId,
      fixtureDigestSha256: fixture.fixtureDigestSha256,
      width: 640,
      height: 360,
      frameCount: 8,
      subjectCount: 2,
      maskPngCount: 16,
      sam31InvocationId: fixture.sam31InvocationId,
      l4InvocationId: fixture.l4InvocationId,
      manifestRef: {
        id: 'canonical-sam3_1-mask-sequence-manifest-v1',
        version: 1,
        contentHash: fixture.request.sam31MaskManifestRef.contentHash,
      },
      requestRef: {
        id: fixture.request.l4InvocationId,
        version: 1,
        contentHash: `sha256:${fixture.request.requestBindingSha256}`,
      },
      taskObjectRef: canonicalTrackAllSam31L4TaskQaTaskRef(fixture.request),
    },
    execution: {
      cloudRunOperationName: operation.name,
      cloudRunExecutionResource: execution.name,
      executionStartTime: execution.startTime,
      executionCompletionTime: execution.completionTime,
      activeExecutionCountBeforeStart: 0,
      activeExecutionCountAfterTerminal: 0,
      executionSucceededCount: 1,
      executionFailedCount: 0,
      executionCancelledCount: 0,
      scaleFromZeroObserved: true,
      terminalWorkerStoppedAndScaleBackToZeroVerified: true,
      automaticRetryPerformed: false,
      responseObjectRef:
        canonicalTrackAllSam31L4TaskQaResponseRef(workerResponse),
    },
    workerResponse,
    pricing: {
      disposition:
        'blocked_missing_billing_account_effective_price_authority',
      accountEffectiveRateAuthorityRef: null,
      attemptCostReceiptRef: null,
      customerCreditSettlementRef: null,
      publicCatalogListPriceSubstitutionAccepted: false,
      customerCreditsMutated: false,
    },
    actualL4GpuExecutionObserved: true,
    actualKorniaCudaKernelExecutionObserved: true,
    actualOpenCvCudaCrosscheckExecutionObserved: true,
    everyFixtureMaskRereadAndMeasured: true,
    runtimeDownloadPerformed: false,
    sam31CheckpointOrModelExecuted: false,
    cpuOnlySubstantiveMaskQaUsed: false,
    customerMediaUsed: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt: execution.completionTime,
  })
  const receiptPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const receiptPath = `${RECEIPT_PREFIX}/${qualificationId}.json`
  const receiptBody = Buffer.from(stableAuthorityStringify(receipt))
  if (await receiptPort.createOnly({
    objectPath: receiptPath,
    body: receiptBody,
    contentSha256: hashBytes(receiptBody),
  }) !== 'created') throw new Error('qualification_receipt_was_not_create_only')
  const rereadBody = await receiptPort.readExact(receiptPath)
  const reread = assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt(
    JSON.parse(requireBody(rereadBody).toString('utf8')) as unknown,
  )
  if (stableAuthorityStringify(reread) !== receiptBody.toString('utf8')) {
    throw new Error('qualification_receipt_exact_reread_changed')
  }
  const receiptRef =
    canonicalTrackAllSam31L4TaskQaPrivateQualificationRef(reread)
  process.stdout.write(`${JSON.stringify({
    schemaVersion:
      'weeditpro-track-all-sam3_1-l4-private-qualification-cli-receipt-v1',
    qualificationRef: receiptRef,
    disposition: reread.disposition,
    cloudRunExecutionResource: reread.execution.cloudRunExecutionResource,
    immutableImageDigest: reread.deployment.immutableImageDigest,
    maximumObservedGpuUtilizationPercent:
      reread.workerResponse.gpuEvidence?.maximumObservedGpuUtilizationPercent,
    torchCudaKernelCount:
      reread.workerResponse.gpuEvidence?.torchCudaKernelCount,
    opencvCudaKernelCount:
      reread.workerResponse.gpuEvidence?.opencvCudaKernelCount,
    activeExecutionCountAfterTerminal: activeExecutions(afterExecutions).length,
    accountEffectivePricingReady: false,
    customerCreditsMutated: false,
    runtimeReleaseGranted: false,
    productionReady: false,
  }, null, 2)}\n`)
}

async function rereadSupplyChainEvidence() {
  const imageRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime()
  const observationRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime()
  const supplyRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainBuildRuntime()
  const securityRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpImageSecurityReviewRuntime()
  const [
    imageBuildAuthority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainAdmission,
    supplyChainSubmission,
    supplyChainTerminal,
  ] = await Promise.all([
    imageRuntime.repository.rereadBuildAuthority({
      authorityRef: supplyRefs.imageBuildAuthorityRef,
    }),
    imageRuntime.repository.rereadSubmission({
      submissionRef: supplyRefs.imageBuildSubmissionRef,
    }),
    observationRuntime.repository.rereadTerminal({
      terminalRef: supplyRefs.imageBuildTerminalRef,
    }),
    supplyRuntime.repository.rereadAdmission({
      admissionRef: supplyRefs.supplyChainAdmissionRef,
    }),
    supplyRuntime.repository.rereadSubmission({
      submissionRef: supplyRefs.supplyChainSubmissionRef,
    }),
    supplyRuntime.repository.rereadTerminalForSubmission({
      submissionRef: supplyRefs.supplyChainSubmissionRef,
    }),
  ])
  if (!imageBuildAuthority || !imageBuildSubmission || !imageBuildTerminal
    || !supplyChainAdmission || !supplyChainSubmission
    || !supplyChainTerminal
    || !sameRef(supplyRefs.imageBuildTerminalRef,
      canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(
        imageBuildTerminal,
      ))
    || !sameRef(supplyRefs.supplyChainTerminalRef,
      imageSupplyChainTerminalRef(supplyChainTerminal))) return null
  const records = {
    imageBuildAuthority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainAdmission,
    supplyChainSubmission,
    supplyChainTerminal,
  }
  return createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainEvidenceReadPort({
    ...records,
    securityReviewReadPort: securityRuntime.repository,
  }).rereadExact(
    createCanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest(
      records,
    ),
  )
}

async function persistFixtureCreateOnly(input: {
  storage: Storage
  fixture: ReturnType<
    typeof buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationFixture
  >
}) {
  const samRoot = `${INVOCATION_PREFIX}/${input.fixture.sam31InvocationId}`
  const l4Root = `${INVOCATION_PREFIX}/${input.fixture.l4InvocationId}`
  await Promise.all([
    createOnlyBinary(input.storage.bucket(MASK_BUCKET)
      .file(`${samRoot}/output/mask-manifest.json`),
    input.fixture.manifestBytes, 'application/json'),
    ...input.fixture.masks.map((mask) => createOnlyBinary(
      input.storage.bucket(MASK_BUCKET)
        .file(`${samRoot}/output/${mask.relativeFileName}`),
      mask.body,
      'image/png',
    )),
    createOnlyBinary(input.storage.bucket(MASK_BUCKET)
      .file(`${l4Root}/task-qa/task.json`),
    input.fixture.taskBytes, 'application/json'),
  ])
}

async function createOnlyBinary(
  file: File,
  body: Buffer,
  contentType: 'application/json' | 'image/png',
) {
  await file.save(body, {
    contentType,
    resumable: false,
    validation: 'crc32c',
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  const [metadata] = await file.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  if (!/^[1-9][0-9]*$/u.test(generation) || !etag
    || metadata.contentType !== contentType
    || Number(metadata.size ?? -1) !== body.byteLength) {
    throw new Error('qualification_input_object_metadata_changed')
  }
  const exactFile = file.bucket.file(file.name, { generation })
  const [reread] = await exactFile.download({ validation: 'crc32c' })
  if (hashBytes(reread) !== hashBytes(body)) {
    throw new Error('qualification_input_object_exact_reread_changed')
  }
}

async function startExactlyOneQualificationExecution(input: {
  auth: AuthRequest
  l4InvocationId: string
}) {
  const response = await input.auth.request({
    url: `${RUN_ORIGIN}/v2/${JOB_RESOURCE}:run`,
    method: 'POST',
    data: {
      overrides: {
        containerOverrides: [{
          env: [{
            name: 'REEDITPRO_GPU_INVOCATION_ID',
            value: input.l4InvocationId,
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
        throw new Error('l4_cloud_run_operation_failed')
      }
      return operation
    }
    await pause(POLL_INTERVAL_MS)
  }
  throw new Error('l4_cloud_run_operation_outcome_unknown_reconcile_required')
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
      if (!execution.startTime
        || execution.succeededCount !== 1 || execution.failedCount !== 0
        || execution.cancelledCount !== 0) {
        throw new Error('l4_cloud_run_execution_did_not_succeed_exactly_once')
      }
      return execution
    }
    await pause(POLL_INTERVAL_MS)
  }
  throw new Error('l4_cloud_run_execution_outcome_unknown_reconcile_required')
}

async function waitForScaleZero(input: { auth: AuthRequest }) {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    const executions = await listExecutions(input.auth)
    if (activeExecutions(executions).length === 0) return executions
    await pause(POLL_INTERVAL_MS)
  }
  throw new Error('l4_cloud_run_scale_to_zero_not_observed')
}

async function rereadWorkerResponse(input: {
  storage: Storage
  l4InvocationId: string
}) {
  const file = input.storage.bucket(MASK_BUCKET).file(
    `${INVOCATION_PREFIX}/${input.l4InvocationId}/task-qa/response.json`,
  )
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    try {
      const [metadata] = await file.getMetadata()
      const generation = String(metadata.generation ?? '')
      const etag = String(metadata.etag ?? '')
      const size = Number(metadata.size ?? -1)
      if (!/^[1-9][0-9]*$/u.test(generation) || !etag
        || metadata.contentType !== 'application/json'
        || !Number.isSafeInteger(size) || size < 2 || size > 16 * 1024 * 1024) {
        throw new Error('l4_worker_response_metadata_changed')
      }
      const exact = file.bucket.file(file.name, { generation })
      const [body] = await exact.download({ validation: 'crc32c' })
      if (body.byteLength !== size) {
        throw new Error('l4_worker_response_byte_length_changed')
      }
      return assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV2(
        JSON.parse(body.toString('utf8')) as unknown,
      )
    } catch (error) {
      if (cloudErrorCode(error) !== 404) throw error
    }
    await pause(POLL_INTERVAL_MS)
  }
  throw new Error('l4_worker_response_missing_after_terminal_execution')
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
      /^projects\/reeditpro\/locations\/us-central1\/jobs\/reeditpro-track-all-mask-qa-l4\/executions\/[a-z0-9-]+$/u,
    ),
    startTime: z.string().datetime({ offset: true }).optional(),
    completionTime: z.string().datetime({ offset: true }).optional(),
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

function assertExactJob(value: unknown) {
  const job = z.object({
    name: z.literal(JOB_RESOURCE),
    uid: z.string().uuid(),
    labels: z.record(z.string(), z.string()),
    template: z.object({
      parallelism: z.literal(1),
      taskCount: z.literal(1),
      template: z.object({
        containers: z.array(z.object({
          image: z.literal(
            `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa@${canonicalTrackAllSam31L4TaskQaPrivateQualificationConstants.immutableImageDigest}`,
          ),
          env: z.array(z.object({ name: z.string(), value: z.string() })
            .strict()),
          resources: z.object({
            limits: z.object({
              cpu: z.literal('8'),
              memory: z.literal('32Gi'),
              'nvidia.com/gpu': z.literal('1'),
            }).strict(),
          }).passthrough(),
          volumeMounts: z.array(z.object({
            name: z.literal('reeditpro-private-gpu-objects'),
            mountPath: z.literal('/mnt/reeditpro'),
          }).strict()).length(1),
        }).passthrough()).length(1),
        volumes: z.array(z.object({
          name: z.literal('reeditpro-private-gpu-objects'),
          gcs: z.object({
            bucket: z.literal(MASK_BUCKET),
            mountOptions: z.array(z.string()).length(3),
          }).strict(),
        }).strict()).length(1),
        maxRetries: z.literal(0),
        timeout: z.literal('3600s'),
        serviceAccount: z.literal(
          'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
        ),
        executionEnvironment: z.literal('EXECUTION_ENVIRONMENT_GEN2'),
        vpcAccess: z.object({
          egress: z.literal('ALL_TRAFFIC'),
          networkInterfaces: z.array(z.object({
            network: z.literal('weeditpro-gpu-private'),
            subnetwork: z.literal('weeditpro-gpu-private-us-central1'),
            tags: z.array(z.literal('weeditpro-gpu-private-no-nat')).length(1),
          }).strict()).length(1),
        }).strict(),
        nodeSelector: z.object({ accelerator: z.literal('nvidia-l4') })
          .strict(),
        gpuZonalRedundancyDisabled: z.literal(true),
      }).passthrough(),
    }).passthrough(),
  }).passthrough().parse(value)
  const env = Object.fromEntries(
    job.template.template.containers[0]!.env.map((item) => [
      item.name,
      item.value,
    ]),
  )
  if (stableAuthorityStringify(env) !== stableAuthorityStringify({
    REEDITPRO_ENV: 'production',
    WEEDITPRO_GPU_ACCELERATOR_CLASS: 'nvidia_l4',
    WORKER_GROUP: 'l4_standard_primary',
  }) || job.labels.app !== 'weeditpro'
    || job.labels.operation !== 'track-all-mask-qa'
    || job.labels.route !== 'l4-standard-primary'
    || job.labels.scale !== 'zero'
    || stableAuthorityStringify(
      job.template.template.volumes[0]!.gcs.mountOptions,
    ) !== stableAuthorityStringify([
      'uid=65532', 'gid=65532', 'implicit-dirs=true',
    ])) throw new Error('l4_cloud_run_job_exact_reread_changed')
  return job
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

function ref(id: string, hash: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
) {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function hashBytes(value: Buffer) {
  return createHash('sha256').update(value).digest('hex')
}

function requireBody(value: Buffer | null): Buffer {
  if (!value) throw new Error('qualification_receipt_reread_missing')
  return value
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
  process.stderr.write(`${JSON.stringify(error instanceof ApiError ? {
    code: error.code,
    message: error.message,
    details: error.details,
  } : {
    code: 'track_all_l4_private_qualification_failed',
    message: error instanceof Error ? error.message : 'unknown_error',
  })}\n`)
  process.exitCode = 1
})
