import { z } from 'zod'

import {
  createCanonicalGcpSam31VertexServingThirtyRunQualificationService,
} from '../services/canonical-sam3_1-vertex-serving-thirty-run-qualification-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'compile-weeditpro-sam31-a100-serving-thirty-run-qualification-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const environment = z.object({
  WEEDITPRO_SAM31_VERTEX_SERVING_THIRTY_RUN_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_SET_ID: safeId,
  WEEDITPRO_SAM31_VERTEX_SERVING_DETERMINISTIC_QUALIFICATION_ID: safeId,
  WEEDITPRO_SAM31_VERTEX_SERVING_LATENCY_REPLACEMENT_QUALIFICATION_ID:
    safeId.optional(),
}).strict().parse({
  WEEDITPRO_SAM31_VERTEX_SERVING_THIRTY_RUN_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_VERTEX_SERVING_THIRTY_RUN_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_SET_ID:
    process.env.WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_SET_ID,
  WEEDITPRO_SAM31_VERTEX_SERVING_DETERMINISTIC_QUALIFICATION_ID:
    process.env
      .WEEDITPRO_SAM31_VERTEX_SERVING_DETERMINISTIC_QUALIFICATION_ID,
  WEEDITPRO_SAM31_VERTEX_SERVING_LATENCY_REPLACEMENT_QUALIFICATION_ID:
    process.env
      .WEEDITPRO_SAM31_VERTEX_SERVING_LATENCY_REPLACEMENT_QUALIFICATION_ID,
})

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const receipt =
  await createCanonicalGcpSam31VertexServingThirtyRunQualificationService({
    storage,
  }).compile({
    qualificationSetId:
      environment.WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_SET_ID,
    deterministicQualificationId:
      environment
        .WEEDITPRO_SAM31_VERTEX_SERVING_DETERMINISTIC_QUALIFICATION_ID,
    ...(environment
      .WEEDITPRO_SAM31_VERTEX_SERVING_LATENCY_REPLACEMENT_QUALIFICATION_ID ===
        undefined
      ? {}
      : {
          latencyReplacementQualificationId:
            environment
              .WEEDITPRO_SAM31_VERTEX_SERVING_LATENCY_REPLACEMENT_QUALIFICATION_ID,
        }),
  })

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    receipt.schemaVersion.endsWith('-v2')
      ? 'weeditpro-sam3_1-a100-serving-thirty-run-qualification-receipt-v2'
      : 'weeditpro-sam3_1-a100-serving-thirty-run-qualification-receipt-v1',
  receipt,
  customerInvocationAuthorized: false,
  customerCreditsMutated: false,
  qaApproved: false,
  l4FallbackQualified: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
})}\n`)
