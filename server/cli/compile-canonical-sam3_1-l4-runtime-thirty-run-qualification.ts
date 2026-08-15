import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository,
} from '../services/canonical-sam3_1-l4-runtime-qualification-run-receipt-service'
import {
  createCanonicalSam31L4RuntimeThirtyRunQualificationRepository,
  createCanonicalSam31L4RuntimeThirtyRunQualificationService,
} from '../services/canonical-sam3_1-l4-runtime-thirty-run-qualification-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'compile-weeditpro-sam31-l4-thirty-run-qualification-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const environment = z.object({
  WEEDITPRO_SAM31_L4_THIRTY_RUN_CONFIRMATION: z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_L4_QUALIFICATION_SET_ID: safeId,
  WEEDITPRO_SAM31_L4_QUALIFICATION_ID: safeId,
}).strict().parse({
  WEEDITPRO_SAM31_L4_THIRTY_RUN_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_L4_THIRTY_RUN_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_L4_QUALIFICATION_SET_ID:
    process.env.WEEDITPRO_SAM31_L4_QUALIFICATION_SET_ID,
  WEEDITPRO_SAM31_L4_QUALIFICATION_ID:
    process.env.WEEDITPRO_SAM31_L4_QUALIFICATION_ID,
})

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: 'reeditpro-production-reeditpro-control-plane-state',
})
const receipt = await createCanonicalSam31L4RuntimeThirtyRunQualificationService({
  runReceiptRepository:
    createCanonicalSam31L4RuntimePrivateRunReceiptRepository({ objectPort }),
  qualificationRepository:
    createCanonicalSam31L4RuntimeThirtyRunQualificationRepository({
      objectPort,
    }),
}).compile({
  qualificationSetId:
    environment.WEEDITPRO_SAM31_L4_QUALIFICATION_SET_ID,
  qualificationId: environment.WEEDITPRO_SAM31_L4_QUALIFICATION_ID,
})

process.stdout.write(`${JSON.stringify({
  ok: true,
  qualificationSetId: receipt.qualificationSetId,
  receiptHash: receipt.receiptHash,
  runCount: receipt.runs.length,
  nearestRankP95Milliseconds: receipt.nearestRankP95Milliseconds,
  terminalCostReceiptCountPending: receipt.terminalCostReceiptCountPending,
  independentTemporalMaskQualityPending:
    receipt.independentTemporalMaskQualityPending,
  l4FallbackQualified: receipt.l4FallbackQualified,
  runtimeReleaseGranted: receipt.runtimeReleaseGranted,
})}\n`)
