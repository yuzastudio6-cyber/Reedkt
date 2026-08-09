import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest,
  assertCanonicalSam31VertexSourceCheckpointWorkerResult,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GcsAuthenticatedTermsReadPort,
} from './canonical-sam3_1-private-artifact-ingest-repository'
import {
  createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-rate-authority-repository'
import {
  assertCanonicalSam31VertexQualificationAdmission,
  assertCanonicalSam31VertexQualificationExecution,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  createCanonicalSam31GcpQualificationPackageRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  createCanonicalSam31VertexQualificationRuntimeRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-runtime-repository'
import {
  createCanonicalSam31VertexQualificationGcsResultReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import {
  canonicalSam31VertexQualificationCostReceiptSchema,
  canonicalSam31VertexQualificationPlatformStopSchema,
  canonicalSam31VertexQualificationProviderUsageSchema,
  canonicalSam31VertexQualificationTerminalResultSchema,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-terminal-reconciliation'
import {
  createCanonicalSam31VertexQualificationReleaseOwner,
  type CanonicalSam31VertexQualificationReleaseReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import {
  assertCanonicalSam31QualificationSecurityClearance,
  sealCanonicalSam31QualificationSecurityClearance,
} from './canonical-sam3_1-source-checkpoint-qualification-release-owner'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_RUNTIME_VERSION =
  'canonical-sam3_1-vertex-qualification-release-runtime-v1' as const

const PROJECT_ID = 'reeditpro' as const
const PROJECT_NUMBER = '390722338345' as const
const REGION = 'us-central1' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const RUNTIME_PREFIX =
  'private/sam3_1/source-checkpoint-qualification/v2/runtime' as const
const RELEASE_EVIDENCE_PREFIX =
  'private/sam3_1/source-checkpoint-qualification/v2/release-evidence' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const publicationRequestSchema = z.object({
  executionRef: evidenceRefSchema.extend({ version: z.literal(2) }).strict(),
  workerResultRef: evidenceRefSchema,
  providerUsageRef: evidenceRefSchema,
  platformStopRef: evidenceRefSchema,
  currentAccountRateRef: evidenceRefSchema,
  qualificationCostReceiptRef: evidenceRefSchema,
}).strict()
type EvidenceRef = z.infer<typeof evidenceRefSchema>
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

/**
 * Read-only terminal reconciliation plus create-only release publication.
 * It never creates another Custom Job and cannot mutate a customer wallet.
 */
export function createCanonicalSam31VertexQualificationReleaseRuntime(input: {
  readonly storage?: Storage
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
  readonly requestTimeoutMilliseconds?: number
} = {}) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = boundedTimeout(input.requestTimeoutMilliseconds)
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_BUCKET,
  })
  const runtimeRepository =
    createCanonicalSam31VertexQualificationRuntimeRepository({ objectPort })
  const packageRepository =
    createCanonicalSam31GcpQualificationPackageRepository({ storage })
  const resultReadPort =
    createCanonicalSam31VertexQualificationGcsResultReadPort({ storage })
  const rateRepository =
    createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository({
      storage,
    })
  const termsReadPort = createCanonicalSam31GcsAuthenticatedTermsReadPort({
    storage,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_RUNTIME_VERSION,
    async publish(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_vertex_release_publication')
      const request = publicationRequestSchema.parse(untrusted)
      const publishedAt = timestamp.parse(now())
      const execution = assertCanonicalSam31VertexQualificationExecution(
        await runtimeRepository.executions.reread(request.executionRef),
      )
      const admission = assertCanonicalSam31VertexQualificationAdmission(
        await runtimeRepository.admissions.reread(execution.admissionRef),
      )
      const workerRequest =
        assertCanonicalSam31VertexSourceCheckpointWorkerRequest(
          await runtimeRepository.workerRequests.rereadExact(
            admission.workerRequestRef,
          ),
        )
      const workerResult =
        assertCanonicalSam31VertexSourceCheckpointWorkerResult(
          await resultReadPort.rereadExact({
            request: workerRequest,
            executionRef: request.executionRef,
          }),
        )
      assertRef(request.workerResultRef,
        `sam31-vertex-worker-result-${workerResult.resultHash.slice(0, 32)}`,
        workerResult.resultHash)
      const providerUsage = await readHashed({
        port: objectPort,
        path: runtimeRefPath('provider-usage', request.providerUsageRef),
        schema: canonicalSam31VertexQualificationProviderUsageSchema,
        hashKey: 'evidenceHash',
      })
      const platformStop = await readHashed({
        port: objectPort,
        path: `${RUNTIME_PREFIX}/platform-stop/`
          + `${request.platformStopRef.contentHash.slice(7)}.json`,
        schema: canonicalSam31VertexQualificationPlatformStopSchema,
        hashKey: 'evidenceHash',
      })
      const cost = await readHashed({
        port: objectPort,
        path: runtimeRefPath('costs', request.qualificationCostReceiptRef),
        schema: canonicalSam31VertexQualificationCostReceiptSchema,
        hashKey: 'receiptHash',
      })
      const rate = await rateRepository.reread({
        rateAuthorityRef: request.currentAccountRateRef,
        at: publishedAt,
      })
      if (!rate) throw new Error('Vertex A100 current account rate is absent.')
      const historical = await packageRepository.rereadExactWorkerRequest({
        workerRequestRef: {
          id: workerRequest.historicalPackageRequestRef.id,
          version: workerRequest.historicalPackageRequestRef.version,
          contentHash:
            workerRequest.historicalPackageRequestRef.contentHash,
        },
      })
      if (!historical) throw new Error('SAM 3.1 package request is absent.')
      const ingest = await packageRepository.rereadExactIngestReceipt({
        ingestReceiptRef: plainRef(workerRequest.ingestReceiptRef),
      })
      if (!ingest) throw new Error('SAM 3.1 ingest receipt is absent.')
      const terms = await termsReadPort.rereadAuthenticatedTermsAcceptance({
        termsAcceptanceRef: ingest.termsAcceptanceRef,
      })
      if (!terms) throw new Error('SAM 3.1 terms acceptance is absent.')
      if (
        terms.acceptanceRecordHash !== ingest.termsAcceptanceRecordHash
        || providerUsage.attemptId !== execution.attemptId
        || platformStop.attemptId !== execution.attemptId
        || cost.attemptId !== execution.attemptId
        || !sameRef(providerUsage.executionRef, request.executionRef)
        || !sameRef(platformStop.executionRef, request.executionRef)
        || !sameRef(cost.executionRef, request.executionRef)
      ) throw new Error('Vertex SAM 3.1 live evidence crossed execution.')
      const provider = await rereadProviderJob({
        auth,
        execution,
        timeout,
      })
      const cloudTerminalObservationRef = opaqueRef(
        'sam31-vertex-terminal',
        { executionRef: request.executionRef, provider },
      )
      if (
        provider.state !== 'JOB_STATE_SUCCEEDED'
        || !sameRef(cloudTerminalObservationRef,
          platformStop.cloudTerminalObservationRef)
        || !sameRef(cloudTerminalObservationRef,
          cost.cloudTerminalObservationRef)
        || stableAuthorityStringify(providerTimes(provider)) !==
          stableAuthorityStringify(providerUsage.providerTimes)
        || stableAuthorityStringify(providerUsage.providerTimes) !==
          stableAuthorityStringify(platformStop.providerTimes)
        || platformStop.activeA100GpuInstancesAfterObservation !== 0
        || cost.activeA100GpuInstancesAfterTerminalAttempt !== 0
      ) throw new Error('Vertex SAM 3.1 terminal state changed.')
      const terminal = createTerminal({
        execution,
        admission,
        workerRequestRef: admission.workerRequestRef,
        workerResultRef: request.workerResultRef,
        cloudTerminalObservationRef,
        providerUsageRef: request.providerUsageRef,
        platformStopRef: request.platformStopRef,
        currentAccountRateRef: request.currentAccountRateRef,
        costRef: request.qualificationCostReceiptRef,
        observedAt: publishedAt,
      })
      const terminalRef = ref(
        `sam31-vertex-terminal-reconciliation-${terminal.resultHash.slice(0, 32)}`,
        terminal.resultHash,
      )
      await persistExact({
        port: objectPort,
        path: terminalPath(terminal.resultHash),
        value: terminal,
      })
      const clearance = sealCanonicalSam31QualificationSecurityClearance({
        schemaVersion:
          'canonical-sam3_1-source-checkpoint-security-compliance-clearance-v1',
        source: 'canonical_sam3_1_security_legal_privacy_compliance_owner',
        evidenceClass: 'canonical_private_reread',
        clearanceId: `sam31-vertex-security-clearance-${sha256AuthorityValue({
          requestRef: admission.workerRequestRef,
          resultRef: request.workerResultRef,
          terminalRef,
        }).slice(0, 40)}`,
        clearanceVersion: 1,
        qualificationId: workerRequest.qualificationId,
        candidateRef: workerRequest.candidateRef,
        ingestReceiptRef: ref(
          ingest.ingestReceiptId,
          ingest.ingestReceiptHash,
        ),
        workerRequestRef: admission.workerRequestRef,
        termsAcceptanceRef: ingest.termsAcceptanceRef,
        reviewedEvidenceRefs: {
          legalReviewRef: terms.legalReviewRef,
          privacyReviewRef: terms.privacyReviewRef,
          tradeControlsReviewRef: terms.tradeControlsReviewRef,
          sourceLicenseReviewRef: ingest.sourceArchive.licenseRef,
          checkpointLicenseReviewRef: ingest.checkpoint.licenseRef,
          sourceMalwareScanRef: ingest.sourceArchive.malwareScanRef,
          checkpointMalwareScanRef: ingest.checkpoint.malwareScanRef,
          sourceIngestSecurityReviewRef:
            ingest.sourceArchive.securityReviewRef,
          checkpointIngestSecurityReviewRef:
            ingest.checkpoint.securityReviewRef,
          sourceCodeStaticSecurityReviewRef:
            workerRequest.sourceCodeSecurityReviewRef,
          unsignedSourceRevisionAcceptanceRef:
            ingest.sourceArchive.unsignedSourceRevisionAcceptanceRef,
          checkpointWeightsOnlyInspectionRef:
            workerRequest.checkpoint.weightsOnlyInspectionRef,
        },
        decisions: {
          sourceLicenseReviewedForApprovedUse: true,
          checkpointLicenseReviewedForApprovedUse: true,
          privacyReviewApprovedForPrivateQualification: true,
          tradeControlsReviewApprovedForPrivateQualification: true,
          sourceMalwareScanPassed: true,
          checkpointMalwareScanPassed: true,
          sourceStaticSecurityReviewPassed: true,
          checkpointStaticSecurityReviewPassed: true,
          unsignedSourceRevisionAccepted: true,
          noOpenHighOrCriticalSecurityFinding: true,
          checkpointWeightsOnlyResultMustBeCorroboratedByWorker: true,
          checkpointTensorAllowlistMustBeCorroboratedByWorker: true,
          executablePickleTrustGranted: false,
          checkpointRedistributionAuthorized: false,
        },
        authority: {
          authenticatedReviewOwnersReread: true,
          privateSourceCheckpointQualificationOnly: true,
          customerMediaProcessingAuthorized: false,
          runtimeImageReleaseAuthorized: false,
          customerCreditsMutated: false,
          customerBillingAuthorityGranted: false,
          qaApproved: false,
          publicDeliveryAuthorized: false,
          productionReady: false,
        },
        approvedAt: publishedAt,
        validUntil: new Date(Date.parse(publishedAt) + 86_400_000)
          .toISOString(),
      })
      const clearanceRef = ref(clearance.clearanceId, clearance.clearanceHash)
      await persistExact({
        port: objectPort,
        path: clearancePath(clearance.clearanceHash),
        value: clearance,
      })
      const readPort = createReleaseReadPort({
        objectPort,
        runtimeRepository,
        packageRepository,
        resultReadPort,
        rateRepository,
        request: workerRequest,
        executionRef: request.executionRef,
        terminal,
        terminalRef,
        clearance,
        clearanceRef,
      })
      const owner = createCanonicalSam31VertexQualificationReleaseOwner({
        readPort,
        releaseObjectPort: objectPort,
        now: () => publishedAt,
      })
      const release = await owner.compileAndPersist({
        qualificationId: workerRequest.qualificationId,
        workerRequestRef: admission.workerRequestRef,
        workerResultRef: request.workerResultRef,
        admissionRef: execution.admissionRef,
        executionRef: request.executionRef,
        terminalReconciliationRef: terminalRef,
        providerUsageRef: request.providerUsageRef,
        platformStopRef: request.platformStopRef,
        currentAccountRateRef: request.currentAccountRateRef,
        qualificationCostReceiptRef: request.qualificationCostReceiptRef,
        securityComplianceClearanceRef: clearanceRef,
      })
      return Object.freeze({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_RUNTIME_VERSION,
        status: 'published' as const,
        release,
        readOnlyProviderTerminalReread: true as const,
        secondCustomJobCreated: false as const,
        automaticRetryPerformed: false as const,
        customerCreditsMutated: false as const,
        imageBuildStarted: false as const,
        productionReady: false as const,
      })
    },
  })
}

function createReleaseReadPort(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  runtimeRepository: ReturnType<
    typeof createCanonicalSam31VertexQualificationRuntimeRepository
  >
  packageRepository: ReturnType<
    typeof createCanonicalSam31GcpQualificationPackageRepository
  >
  resultReadPort: ReturnType<
    typeof createCanonicalSam31VertexQualificationGcsResultReadPort
  >
  rateRepository: ReturnType<
    typeof createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository
  >
  request: ReturnType<
    typeof assertCanonicalSam31VertexSourceCheckpointWorkerRequest
  >
  executionRef: EvidenceRef
  terminal: z.infer<
    typeof canonicalSam31VertexQualificationTerminalResultSchema
  >
  terminalRef: EvidenceRef
  clearance: ReturnType<
    typeof assertCanonicalSam31QualificationSecurityClearance
  >
  clearanceRef: EvidenceRef
}): CanonicalSam31VertexQualificationReleaseReadPort {
  return Object.freeze({
    async rereadCandidate() {
      return createCanonicalSam31SourceRuntimeCandidate()
    },
    async rereadIngestReceipt() {
      return input.packageRepository.rereadExactIngestReceipt({
        ingestReceiptRef: plainRef(input.request.ingestReceiptRef),
      })
    },
    async rereadWorkerRequest() {
      return input.runtimeRepository.workerRequests.rereadExact(
        ref(input.request.qualificationId, input.request.requestHash, 2),
      )
    },
    async rereadWorkerResult() {
      return input.resultReadPort.rereadExact({
        request: input.request,
        executionRef: input.executionRef,
      })
    },
    async rereadAdmission() {
      return input.runtimeRepository.admissions.reread(
        input.terminal.admissionRef,
      )
    },
    async rereadExecution() {
      return input.runtimeRepository.executions.reread(input.executionRef)
    },
    async rereadTerminalReconciliation({ terminalReconciliationRef }: {
      readonly terminalReconciliationRef: EvidenceRef
    }) {
      if (!sameRef(terminalReconciliationRef, input.terminalRef)) return null
      return readHashed({
        port: input.objectPort,
        path: terminalPath(input.terminal.resultHash),
        schema: canonicalSam31VertexQualificationTerminalResultSchema,
        hashKey: 'resultHash',
      })
    },
    async rereadProviderUsage({ providerUsageRef }: {
      readonly providerUsageRef: EvidenceRef
    }) {
      return readHashed({
        port: input.objectPort,
        path: runtimeRefPath('provider-usage', providerUsageRef),
        schema: canonicalSam31VertexQualificationProviderUsageSchema,
        hashKey: 'evidenceHash',
      })
    },
    async rereadPlatformStop({ platformStopRef }: {
      readonly platformStopRef: EvidenceRef
    }) {
      return readHashed({
        port: input.objectPort,
        path: `${RUNTIME_PREFIX}/platform-stop/`
          + `${platformStopRef.contentHash.slice(7)}.json`,
        schema: canonicalSam31VertexQualificationPlatformStopSchema,
        hashKey: 'evidenceHash',
      })
    },
    async rereadCurrentAccountRate({ rateRef }: {
      readonly rateRef: EvidenceRef
    }) {
      return input.rateRepository.reread({
        rateAuthorityRef: rateRef,
        at: input.terminal.observedAt,
      })
    },
    async rereadQualificationCostReceipt({ costRef }: {
      readonly costRef: EvidenceRef
    }) {
      return readHashed({
        port: input.objectPort,
        path: runtimeRefPath('costs', costRef),
        schema: canonicalSam31VertexQualificationCostReceiptSchema,
        hashKey: 'receiptHash',
      })
    },
    async rereadSecurityComplianceClearance({ clearanceRef }: {
      readonly clearanceRef: EvidenceRef
    }) {
      if (!sameRef(clearanceRef, input.clearanceRef)) return null
      const value = await readJson(
        input.objectPort,
        clearancePath(input.clearance.clearanceHash),
      )
      return value === null
        ? null
        : assertCanonicalSam31QualificationSecurityClearance(value)
    },
  })
}

async function rereadProviderJob(input: {
  auth: GoogleAuthRequest
  execution: ReturnType<typeof assertCanonicalSam31VertexQualificationExecution>
  timeout: number
}) {
  const response = await input.auth.request({
    url: `${API_ORIGIN}/v1/${input.execution.customJobResourceName}`,
    method: 'GET',
    timeout: input.timeout,
    retry: false,
    maxRedirects: 0,
    responseType: 'json',
    maxContentLength: 2 * 1024 * 1024,
  })
  assertPlainSerializedData(response.data, 'sam31_vertex_release_job_read')
  return z.object({
    name: z.literal(input.execution.customJobResourceName),
    displayName: z.literal(input.execution.displayName),
    state: z.literal('JOB_STATE_SUCCEEDED'),
    createTime: timestamp,
    startTime: timestamp,
    endTime: timestamp,
  }).passthrough().parse(response.data)
}

function createTerminal(input: {
  execution: ReturnType<typeof assertCanonicalSam31VertexQualificationExecution>
  admission: ReturnType<typeof assertCanonicalSam31VertexQualificationAdmission>
  workerRequestRef: EvidenceRef
  workerResultRef: EvidenceRef
  cloudTerminalObservationRef: EvidenceRef
  providerUsageRef: EvidenceRef
  platformStopRef: EvidenceRef
  currentAccountRateRef: EvidenceRef
  costRef: EvidenceRef
  observedAt: string
}) {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-qualification-terminal-result-v1' as const,
    source:
      'canonical_server_sam3_1_vertex_qualification_terminal_reconciliation' as const,
    attemptId: input.execution.attemptId,
    admissionRef: input.execution.admissionRef,
    executionRef: ref(
      input.execution.executionId,
      input.execution.executionHash,
      2,
    ),
    workerRequestRef: input.workerRequestRef,
    disposition: 'terminal' as const,
    providerState: 'JOB_STATE_SUCCEEDED' as const,
    terminalOutcome: 'completed' as const,
    workerResultRef: input.workerResultRef,
    cloudTerminalObservationRef: input.cloudTerminalObservationRef,
    providerUsageEvidenceRef: input.providerUsageRef,
    platformStopEvidenceRef: input.platformStopRef,
    currentAccountRateAuthorityRef: input.currentAccountRateRef,
    costReceiptRef: input.costRef,
    exactWorkerResultGenerationReread: true,
    providerJobTerminalStateReread: true,
    activeA100GpuInstancesAfterObservation: 0 as const,
    sourceCheckpointQualificationEvidenceReady: true,
    checkbackAllowed: false,
    retryAllowedWithoutCanonicalReconciliation: false as const,
    minimumIdleInstances: 0 as const,
    persistentEndpointPresent: false as const,
    customerWalletLedgerReservationOrCreditMutationPerformed: false as const,
    sourceCheckpointQualificationGranted: false as const,
    runtimeReleaseGranted: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionReady: false as const,
    observedAt: input.observedAt,
  }
  return canonicalSam31VertexQualificationTerminalResultSchema.parse({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function providerTimes(value: {
  createTime: string
  startTime: string
  endTime: string
}) {
  return {
    createTime: value.createTime,
    startTime: value.startTime,
    endTime: value.endTime,
  }
}

async function readHashed<
  T extends Record<K, string>,
  K extends 'resultHash' | 'evidenceHash' | 'receiptHash',
>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  schema: z.ZodType<T>
  hashKey: K
}): Promise<T> {
  const value = await readJson(input.port, input.path)
  if (value === null) throw new Error('Vertex SAM 3.1 release evidence absent.')
  const parsed = input.schema.parse(value)
  const payload = { ...parsed } as Record<string, unknown>
  const hash = payload[input.hashKey]
  delete payload[input.hashKey]
  if (hash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex SAM 3.1 release evidence hash changed.')
  }
  return parsed
}

async function readJson(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
) {
  const body = await port.readExact(path)
  if (!body) return null
  let value: unknown
  try { value = JSON.parse(body.toString('utf8')) } catch {
    throw new Error('Vertex SAM 3.1 release evidence JSON is invalid.')
  }
  if (stableAuthorityStringify(value) !== body.toString('utf8')) {
    throw new Error('Vertex SAM 3.1 release evidence bytes changed.')
  }
  return value
}

async function persistExact(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  value: unknown
}) {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await input.port.readExact(input.path)
  if (!reread || !reread.equals(body)) {
    throw new Error('Vertex SAM 3.1 release evidence reread changed.')
  }
}

function runtimeRefPath(kind: 'provider-usage' | 'costs', refValue: EvidenceRef) {
  const digest = createHash('sha256')
    .update(stableAuthorityStringify(refValue), 'utf8')
    .digest('hex')
  return `${RUNTIME_PREFIX}/${kind}/${digest}.json`
}

function terminalPath(hash: string) {
  return `${RELEASE_EVIDENCE_PREFIX}/terminals/${hash}.json`
}

function clearancePath(hash: string) {
  return `${RELEASE_EVIDENCE_PREFIX}/clearances/${hash}.json`
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function plainRef(value: EvidenceRef) {
  return ref(
    value.id,
    value.contentHash.slice('sha256:'.length),
    value.version,
  )
}

function assertRef(
  value: EvidenceRef,
  id: string,
  hash: string,
  version = 1,
) {
  if (!sameRef(value, ref(id, hash, version))) {
    throw new Error('Vertex SAM 3.1 release input reference changed.')
  }
}

function sameRef(left: EvidenceRef, right: EvidenceRef) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function opaqueRef(id: string, value: unknown) {
  const hash = sha256AuthorityValue(value)
  return ref(`${id}.${hash.slice(0, 32)}`, hash)
}

function boundedTimeout(value = 15_000) {
  if (!Number.isInteger(value) || value < 1_000 || value > 30_000) {
    throw new Error('Vertex SAM 3.1 release timeout is invalid.')
  }
  return value
}

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_PROJECT =
  `${PROJECT_ID}:${PROJECT_NUMBER}:${REGION}` as const
