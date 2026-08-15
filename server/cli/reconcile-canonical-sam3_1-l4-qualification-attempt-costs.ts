import type { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository,
} from '../services/canonical-sam3_1-l4-runtime-qualification-run-receipt-service'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  createCanonicalSam31L4QualificationAttemptCostReceipt,
  createCanonicalSam31L4QualificationAttemptCostRepository,
  parseCanonicalSam31L4QualificationCloudRunTerminalExecution,
  sealCanonicalSam31L4QualificationTerminalObservation,
} from '../tool-cost-metering/canonical-sam3_1-l4-qualification-attempt-cost'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'reconcile-weeditpro-sam31-l4-thirty-run-terminal-cost-v1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const RUN_ORIGIN = 'https://run.googleapis.com' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const operationResource = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/operations\/[A-Za-z0-9._-]+$/u,
)
const executionResource = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/jobs\/reeditpro-sam31-l4-fallback\/executions\/[a-z0-9-]+$/u,
)
type AuthRequest = Pick<OAuth2Client, 'request'>

const environment = z.object({
  WEEDITPRO_SAM31_L4_TERMINAL_COST_CONFIRMATION: z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_L4_QUALIFICATION_ID: safeId,
}).strict().parse({
  WEEDITPRO_SAM31_L4_TERMINAL_COST_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_L4_TERMINAL_COST_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_L4_QUALIFICATION_ID:
    process.env.WEEDITPRO_SAM31_L4_QUALIFICATION_ID,
})

const { authClient: auth, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: CONTROL_PLANE_BUCKET,
})
const runRepository =
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository({ objectPort })
const costRepository =
  createCanonicalSam31L4QualificationAttemptCostRepository({ objectPort })
const rateRepository =
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({ objectPort })
const receipts = []

for (let runOrdinal = 1; runOrdinal <= 30; runOrdinal += 1) {
  const run = await runRepository.reread({
    qualificationId: environment.WEEDITPRO_SAM31_L4_QUALIFICATION_ID,
    runOrdinal,
  })
  if (!run) throw new Error(`sam31_l4_run_${runOrdinal}_missing`)
  const existing = await costRepository.reread({
    qualificationId: run.qualificationId,
    runOrdinal,
  })
  if (existing) {
    receipts.push(existing)
    continue
  }
  const terminal = await rereadTerminal({ auth, run })
  const recordedAt = new Date().toISOString()
  const rate = await rateRepository.rereadApprovedCurrentRate({
    rateAuthorityRef: run.currentL4FallbackRateAuthorityRef,
    routeId: 'l4_heavy_fallback',
    at: recordedAt,
  })
  if (!rate) throw new Error(`sam31_l4_run_${runOrdinal}_rate_missing`)
  const receipt = createCanonicalSam31L4QualificationAttemptCostReceipt({
    receiptId: `${run.qualificationId}.run-${String(runOrdinal)
      .padStart(2, '0')}.terminal-cost`,
    runReceipt: run,
    terminalObservation: terminal,
    currentRateAuthority: rate,
    recordedAt,
  })
  await costRepository.persistCreateOnly({ receipt })
  receipts.push(receipt)
}

const exact = receipts.length === 30
  && receipts.every((receipt, index) =>
    receipt.runOrdinal === index + 1
    && receipt.qualificationId ===
      environment.WEEDITPRO_SAM31_L4_QUALIFICATION_ID)
if (!exact) throw new Error('sam31_l4_terminal_cost_set_not_exact')
const totalCost = receipts.reduce((total, receipt) => total
  + receipt.actualInfrastructureCost.totalInfrastructureCostUsdNanos, 0)
const totalBillable = receipts.reduce((total, receipt) => total
  + receipt.actualUsage.totalBillableMilliseconds, 0)

process.stdout.write(`${stableAuthorityStringify({
  ok: true,
  qualificationId: environment.WEEDITPRO_SAM31_L4_QUALIFICATION_ID,
  terminalCostReceiptCount: receipts.length,
  totalBillableMilliseconds: totalBillable,
  totalInfrastructureCostUsdNanos: totalCost,
  exactCurrentBillingAccountPricesReread: true,
  cloudBillingInvoiceReconciliationRequired: true,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
})}\n`)

async function rereadTerminal(input: {
  auth: AuthRequest
  run: NonNullable<Awaited<ReturnType<
    typeof runRepository.reread
  >>>
}) {
  const operationResponse = await input.auth.request({
    url: `${RUN_ORIGIN}/v2/${input.run.cloudRunOperationName}`,
    method: 'GET',
    timeout: 30_000,
    retry: false,
    maxRedirects: 0,
  })
  const operation = z.object({
    name: operationResource,
    done: z.literal(true),
    response: z.object({ name: executionResource }).passthrough(),
  }).passthrough().parse(operationResponse.data)
  if (operation.name !== input.run.cloudRunOperationName
    || operation.response.name !== input.run.cloudRunExecutionResource) {
    throw new Error('sam31_l4_terminal_operation_lineage_changed')
  }
  const executionResponse = await input.auth.request({
    url: `${RUN_ORIGIN}/v2/${input.run.cloudRunExecutionResource}`,
    method: 'GET',
    timeout: 30_000,
    retry: false,
    maxRedirects: 0,
  })
  const execution =
    parseCanonicalSam31L4QualificationCloudRunTerminalExecution(
      executionResponse.data,
    )
  if (execution.name !== input.run.cloudRunExecutionResource) {
    throw new Error('sam31_l4_terminal_execution_lineage_changed')
  }
  return sealCanonicalSam31L4QualificationTerminalObservation({
    schemaVersion:
      'canonical-sam3_1-l4-qualification-terminal-observation-v1',
    source: 'google_cloud_run_v2_terminal_execution_exact_reread',
    evidenceClass: 'canonical_private_reread',
    qualificationId: input.run.qualificationId,
    runOrdinal: input.run.runOrdinal,
    cloudRunOperationResource: operation.name,
    cloudRunExecutionResource: execution.name,
    executionCreateTime: execution.createTime,
    executionStartTime: execution.startTime,
    executionCompletionTime: execution.completionTime,
    taskCount: 1,
    runningCount: 0,
    succeededCount: 1,
    failedCount: 0,
    cancelledCount: 0,
    retriedCount: 0,
    reconciling: false,
    operationDone: true,
    exactOperationAndExecutionReread: true,
    terminalWorkerStopped: true,
    activeGpuInstancesAfterTerminal: 0,
    scaleBackToZeroVerified: true,
    callerTerminalFieldsAccepted: false,
    observedAt: new Date().toISOString(),
  })
}
