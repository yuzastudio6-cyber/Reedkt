import { z } from 'zod'

import {
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import {
  TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS,
  trackAllSam31V2RouteGateReportSchema,
} from './sam3_1-v2-route-qualification-gate'
import type { TrackAllSam31RealPrivateSessionOwner } from './sam3_1-real-private-session-owner'

export const TRACK_ALL_SAM31_PRIVATE_CANARY_RECEIPT_VERSION =
  'track_all_sam3_1_private_canary_receipt_v1' as const

const canaryReceiptCoreSchema = z.object({
  schemaVersion: z.literal(TRACK_ALL_SAM31_PRIVATE_CANARY_RECEIPT_VERSION),
  operationId: z.literal('tool.sam3_1.track_masklets.v2'),
  status: z.enum([
    'blocked_external_prerequisites',
    'ready_not_executed',
    'completed',
    'failed',
  ]),
  routeGateReportHash: skillSha256Schema,
  explicitExecutionAuthorityObserved: z.boolean(),
  missingGateKeys: z.array(z.enum(TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS)),
  realSessionReceiptHash: skillSha256Schema.nullable(),
  actualSamRequestCount: z.union([z.literal(0), z.literal(1)]),
  actualGpuExecutionCount: z.union([z.literal(0), z.literal(1)]),
  injectedEvidenceUsed: z.literal(false),
  paidActionOccurred: z.boolean(),
  publicArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
  productionQualified: z.literal(false),
  checkedAt: z.string().datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  const completed = value.status === 'completed'
  if (completed !== (value.explicitExecutionAuthorityObserved &&
    value.missingGateKeys.length === 0 &&
    value.realSessionReceiptHash !== null &&
    value.actualSamRequestCount === 1 &&
    value.actualGpuExecutionCount === 1)) context.addIssue({
    code: 'custom',
    message: 'SAM canary completion exceeds its exact authority or evidence.',
  })
  if (value.status === 'blocked_external_prerequisites' &&
    (value.missingGateKeys.length === 0 || value.actualSamRequestCount !== 0 ||
      value.actualGpuExecutionCount !== 0 || value.paidActionOccurred)) {
    context.addIssue({
      code: 'custom', message: 'A blocked SAM canary cannot execute or charge.',
    })
  }
})

export const trackAllSam31PrivateCanaryReceiptSchema =
  canaryReceiptCoreSchema.extend({ receiptHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { receiptHash, ...core } = value
      if (receiptHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'SAM private canary receipt is stale or forged.',
      })
    })

export type TrackAllSam31PrivateCanaryReceipt = z.infer<
  typeof trackAllSam31PrivateCanaryReceiptSchema
>

const executionAuthorityCoreSchema = z.object({
  schemaVersion: z.literal(
    'track_all_sam3_1_private_canary_execution_authority_v1',
  ),
  authorityId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,179}$/u),
  operationId: z.literal('tool.sam3_1.track_masklets.v2'),
  routeGateReportHash: skillSha256Schema,
  sessionPlanHash: skillSha256Schema,
  approvedByHumanOperator: z.literal(true),
  termsAndLegalGateReread: z.literal(true),
  privateCostAuthorized: z.literal(true),
  publicDeliveryAuthorized: z.literal(false),
  productionMutationAuthorized: z.literal(false),
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.issuedAt)) context.addIssue({
    code: 'custom', message: 'SAM canary execution authority is expired.',
  })
})

export const trackAllSam31PrivateCanaryExecutionAuthoritySchema =
  executionAuthorityCoreSchema.extend({ authorityHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { authorityHash, ...core } = value
      if (authorityHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'SAM canary execution authority is stale or forged.',
      })
    })

/** Safe, non-executing preflight used by CI and operator check mode. */
export function inspectTrackAllSam31PrivateCanary(input: {
  routeGateReport: unknown
  explicitExecutionAuthorityObserved: boolean
  checkedAt?: string
}): TrackAllSam31PrivateCanaryReceipt {
  const report = trackAllSam31V2RouteGateReportSchema.parse(
    input.routeGateReport,
  )
  const missingGateKeys = report.findings
    .filter((finding) => finding.disposition === 'blocked')
    .map((finding) => finding.gateKey)
  const ready = report.internalExecutionAuthorized &&
    report.routeQualificationStatus === 'internal_execution_qualified' &&
    missingGateKeys.length === 0
  const core = canaryReceiptCoreSchema.parse({
    schemaVersion: TRACK_ALL_SAM31_PRIVATE_CANARY_RECEIPT_VERSION,
    operationId: report.operationId,
    status: ready ? 'ready_not_executed' : 'blocked_external_prerequisites',
    routeGateReportHash: report.reportHash,
    explicitExecutionAuthorityObserved:
      input.explicitExecutionAuthorityObserved,
    missingGateKeys,
    realSessionReceiptHash: null,
    actualSamRequestCount: 0,
    actualGpuExecutionCount: 0,
    injectedEvidenceUsed: false,
    paidActionOccurred: false,
    publicArtifactCount: 0,
    productionMutationCount: 0,
    productionQualified: false,
    checkedAt: input.checkedAt ?? new Date().toISOString(),
  })
  return deepFreezeSkillValue(trackAllSam31PrivateCanaryReceiptSchema.parse({
    ...core,
    receiptHash: hashSkillValue(core),
  }))
}

/**
 * Explicit real canary entry point. The owner is nominally the gated real
 * owner (not a fixture interface), and its own route/receipt checks run again
 * before any model submission.
 */
export async function executeTrackAllSam31PrivateCanary(input: {
  routeGateReport: unknown
  executionAuthority: unknown
  owner: TrackAllSam31RealPrivateSessionOwner
  plan: unknown
  checkedAt?: string
}): Promise<TrackAllSam31PrivateCanaryReceipt> {
  const report = trackAllSam31V2RouteGateReportSchema.parse(
    input.routeGateReport,
  )
  const authority = trackAllSam31PrivateCanaryExecutionAuthoritySchema.parse(
    input.executionAuthority,
  )
  const plan = z.object({
    sessionPlanHash: skillSha256Schema,
  }).passthrough().parse(input.plan)
  const now = input.checkedAt ?? new Date().toISOString()
  const preflight = inspectTrackAllSam31PrivateCanary({
    routeGateReport: report,
    explicitExecutionAuthorityObserved: true,
    checkedAt: now,
  })
  if (preflight.status !== 'ready_not_executed' ||
    authority.routeGateReportHash !== report.reportHash ||
    authority.sessionPlanHash !== plan.sessionPlanHash ||
    Date.parse(authority.issuedAt) > Date.parse(now) ||
    Date.parse(authority.expiresAt) <= Date.parse(now)) {
    throw new Error('SAM private canary lacks exact current execution authority.')
  }
  const result = await input.owner.execute({ plan: input.plan })
  const completed = result.receipt.terminalDisposition === 'completed'
  const core = canaryReceiptCoreSchema.parse({
    schemaVersion: TRACK_ALL_SAM31_PRIVATE_CANARY_RECEIPT_VERSION,
    operationId: report.operationId,
    status: completed ? 'completed' : 'failed',
    routeGateReportHash: report.reportHash,
    explicitExecutionAuthorityObserved: true,
    missingGateKeys: [],
    realSessionReceiptHash: result.receipt.receiptHash,
    actualSamRequestCount: result.receipt.actualSamRequestCount,
    actualGpuExecutionCount: result.receipt.actualGpuExecutionCount,
    injectedEvidenceUsed: false,
    paidActionOccurred: true,
    publicArtifactCount: 0,
    productionMutationCount: 0,
    productionQualified: false,
    checkedAt: now,
  })
  return deepFreezeSkillValue(trackAllSam31PrivateCanaryReceiptSchema.parse({
    ...core,
    receiptHash: hashSkillValue(core),
  }))
}
