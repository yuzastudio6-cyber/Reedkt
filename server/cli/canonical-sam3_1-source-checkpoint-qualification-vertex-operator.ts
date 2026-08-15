import { z } from 'zod'

import {
  createCanonicalSam31GcpVertexQualificationRuntime,
  createCanonicalSam31VertexQualificationRuntime,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import { assertPlainSerializedData } from
  '../services/canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_OPERATOR_VERSION =
  'canonical-sam3_1-vertex-source-checkpoint-qualification-operator-v1' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_START_CONFIRMATION =
  'start-one-sam31-vertex-source-checkpoint-qualification-v1' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RECONCILE_CONFIRMATION =
  'reconcile-one-sam31-vertex-source-checkpoint-qualification-v1' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_UNKNOWN_CREATE_RECOVERY_CONFIRMATION =
  'recover-unknown-create-sam31-vertex-source-checkpoint-qualification-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveVersion = z.coerce.number().int().positive().safe()
const startEnvironmentSchema = z.object({
  confirmation: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_START_CONFIRMATION,
  ),
  attemptId: safeId,
  issuedAt: timestamp,
  historicalPackageRequestId: safeId,
  historicalPackageRequestSha256: rawSha256,
  imageSupplyChainReleaseId: safeId,
  imageSupplyChainReleaseSha256: rawSha256,
  currentAccountRateAuthorityId: safeId,
  currentAccountRateAuthorityVersion: positiveVersion,
  currentAccountRateAuthoritySha256: rawSha256,
}).strict()
const reconcileEnvironmentSchema = z.object({
  confirmation: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RECONCILE_CONFIRMATION,
  ),
  executionId: safeId,
  executionVersion: positiveVersion,
  executionSha256: rawSha256,
}).strict()
const unknownCreateRecoveryEnvironmentSchema = z.object({
  confirmation: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_UNKNOWN_CREATE_RECOVERY_CONFIRMATION,
  ),
  admissionId: safeId,
  admissionVersion: positiveVersion,
  admissionSha256: rawSha256,
  consumptionId: safeId,
  consumptionVersion: positiveVersion,
  consumptionSha256: rawSha256,
  customJobCreateRequestId: safeId,
  customJobCreateRequestVersion: positiveVersion,
  customJobCreateRequestSha256: rawSha256,
}).strict()

type Runtime = Pick<
  ReturnType<typeof createCanonicalSam31VertexQualificationRuntime>,
  'prepareAndStage' | 'admitAndStart' | 'recoverUnknownCreate' | 'reconcileOne'
>
type Environment = Readonly<Record<string, string | undefined>>

export async function startCanonicalSam31VertexQualificationFromEnvironment(
  environment: Environment,
  runtime?: Runtime,
) {
  const parsed = parseStartEnvironment(environment)
  const selectedRuntime =
    runtime ?? createCanonicalSam31GcpVertexQualificationRuntime()
  const prepared = await selectedRuntime.prepareAndStage({
    attemptId: parsed.attemptId,
    historicalPackageRequestRef: {
      id: parsed.historicalPackageRequestId,
      version: 1,
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-qualification-worker-request-v1',
      contentHash:
        `sha256:${parsed.historicalPackageRequestSha256}` as const,
    },
    issuedAt: parsed.issuedAt,
  })
  const launch = await selectedRuntime.admitAndStart({
    workerRequestRef: prepared.workerRequestRef,
    imageSupplyChainReleaseRef: {
      id: parsed.imageSupplyChainReleaseId,
      version: 1,
      contentHash: `sha256:${parsed.imageSupplyChainReleaseSha256}` as const,
    },
    currentAccountRateAuthorityRef: {
      id: parsed.currentAccountRateAuthorityId,
      version: parsed.currentAccountRateAuthorityVersion,
      contentHash:
        `sha256:${parsed.currentAccountRateAuthoritySha256}` as const,
    },
  })
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_OPERATOR_VERSION,
    action: 'start_one' as const,
    attemptId: parsed.attemptId,
    prepared,
    launch,
    callerModelCheckpointImageGpuClassPriceOrCommandAccepted: false as const,
    automaticRetryAllowed: false as const,
    customerCreditsMutated: false as const,
    sourceCheckpointQualificationGranted: false as const,
    runtimeReleaseGranted: false as const,
    productionReady: false as const,
  })
}

export async function recoverUnknownCanonicalSam31VertexQualificationFromEnvironment(
  environment: Environment,
  runtime?: Runtime,
) {
  const parsed = parseUnknownCreateRecoveryEnvironment(environment)
  const selectedRuntime =
    runtime ?? createCanonicalSam31GcpVertexQualificationRuntime()
  const launch = await selectedRuntime.recoverUnknownCreate({
    admissionRef: {
      id: parsed.admissionId,
      version: parsed.admissionVersion,
      contentHash: `sha256:${parsed.admissionSha256}` as const,
    },
    consumptionRef: {
      id: parsed.consumptionId,
      version: parsed.consumptionVersion,
      contentHash: `sha256:${parsed.consumptionSha256}` as const,
    },
    customJobCreateRequestRef: {
      id: parsed.customJobCreateRequestId,
      version: parsed.customJobCreateRequestVersion,
      contentHash: `sha256:${parsed.customJobCreateRequestSha256}` as const,
    },
  })
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_OPERATOR_VERSION,
    action: 'recover_unknown_create' as const,
    launch,
    callerModelCheckpointImageGpuClassPriceOrCommandAccepted: false as const,
    automaticRetryAllowed: false as const,
    customerCreditsMutated: false as const,
    sourceCheckpointQualificationGranted: false as const,
    runtimeReleaseGranted: false as const,
    productionReady: false as const,
  })
}

export async function reconcileCanonicalSam31VertexQualificationFromEnvironment(
  environment: Environment,
  runtime?: Runtime,
) {
  const parsed = parseReconcileEnvironment(environment)
  const selectedRuntime =
    runtime ?? createCanonicalSam31GcpVertexQualificationRuntime()
  const terminal = await selectedRuntime.reconcileOne({
    executionRef: {
      id: parsed.executionId,
      version: parsed.executionVersion,
      contentHash: `sha256:${parsed.executionSha256}` as const,
    },
  })
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_OPERATOR_VERSION,
    action: 'reconcile_one' as const,
    terminal,
    automaticRetryAllowed: false as const,
    customerCreditsMutated: false as const,
    sourceCheckpointQualificationGranted: false as const,
    runtimeReleaseGranted: false as const,
    productionReady: false as const,
  })
}

function parseStartEnvironment(environment: Environment) {
  const selectedEnvironment = {
    confirmation:
      environment.WEEDITPRO_SAM31_VERTEX_QUALIFICATION_CONFIRMATION,
    attemptId: environment.WEEDITPRO_SAM31_VERTEX_QUALIFICATION_ATTEMPT_ID,
    issuedAt: environment.WEEDITPRO_SAM31_VERTEX_QUALIFICATION_ISSUED_AT,
    historicalPackageRequestId:
      environment.WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_ID,
    historicalPackageRequestSha256:
      environment.WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_SHA256,
    imageSupplyChainReleaseId:
      environment.WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_ID,
    imageSupplyChainReleaseSha256:
      environment.WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_SHA256,
    currentAccountRateAuthorityId:
      environment.WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_ID,
    currentAccountRateAuthorityVersion:
      environment.WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_VERSION,
    currentAccountRateAuthoritySha256:
      environment.WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_SHA256,
  }
  assertPlainSerializedData(
    selectedEnvironment,
    'sam31_vertex_start_environment',
  )
  return startEnvironmentSchema.parse(selectedEnvironment)
}

function parseReconcileEnvironment(environment: Environment) {
  const selectedEnvironment = {
    confirmation:
      environment.WEEDITPRO_SAM31_VERTEX_QUALIFICATION_RECONCILE_CONFIRMATION,
    executionId: environment.WEEDITPRO_SAM31_VERTEX_EXECUTION_ID,
    executionVersion: environment.WEEDITPRO_SAM31_VERTEX_EXECUTION_VERSION,
    executionSha256: environment.WEEDITPRO_SAM31_VERTEX_EXECUTION_SHA256,
  }
  assertPlainSerializedData(
    selectedEnvironment,
    'sam31_vertex_reconcile_environment',
  )
  return reconcileEnvironmentSchema.parse(selectedEnvironment)
}

function parseUnknownCreateRecoveryEnvironment(environment: Environment) {
  const selectedEnvironment = {
    confirmation: environment
      .WEEDITPRO_SAM31_VERTEX_QUALIFICATION_UNKNOWN_CREATE_RECOVERY_CONFIRMATION,
    admissionId: environment.WEEDITPRO_SAM31_VERTEX_ADMISSION_ID,
    admissionVersion: environment.WEEDITPRO_SAM31_VERTEX_ADMISSION_VERSION,
    admissionSha256: environment.WEEDITPRO_SAM31_VERTEX_ADMISSION_SHA256,
    consumptionId: environment.WEEDITPRO_SAM31_VERTEX_CONSUMPTION_ID,
    consumptionVersion: environment.WEEDITPRO_SAM31_VERTEX_CONSUMPTION_VERSION,
    consumptionSha256: environment.WEEDITPRO_SAM31_VERTEX_CONSUMPTION_SHA256,
    customJobCreateRequestId:
      environment.WEEDITPRO_SAM31_VERTEX_CREATE_REQUEST_ID,
    customJobCreateRequestVersion:
      environment.WEEDITPRO_SAM31_VERTEX_CREATE_REQUEST_VERSION,
    customJobCreateRequestSha256:
      environment.WEEDITPRO_SAM31_VERTEX_CREATE_REQUEST_SHA256,
  }
  assertPlainSerializedData(
    selectedEnvironment,
    'sam31_vertex_unknown_create_recovery_environment',
  )
  return unknownCreateRecoveryEnvironmentSchema.parse(selectedEnvironment)
}
