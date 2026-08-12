import { z } from 'zod'

import {
  createCanonicalGcpSam31VertexServingQualificationOutputService,
} from '../services/canonical-sam3_1-vertex-serving-qualification-output-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'verify-one-weeditpro-sam31-a100-serving-output-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const environment = z.object({
  WEEDITPRO_SAM31_VERTEX_SERVING_OUTPUT_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_VERTEX_SERVING_INVOCATION_ID: safeId,
}).strict().parse({
  WEEDITPRO_SAM31_VERTEX_SERVING_OUTPUT_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_VERTEX_SERVING_OUTPUT_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_VERTEX_SERVING_INVOCATION_ID:
    process.env.WEEDITPRO_SAM31_VERTEX_SERVING_INVOCATION_ID,
})
const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const output =
  await createCanonicalGcpSam31VertexServingQualificationOutputService({
    storage,
  }).verifyOne({
    invocationId:
      environment.WEEDITPRO_SAM31_VERTEX_SERVING_INVOCATION_ID,
  })

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-vertex-serving-qualification-output-receipt-v1',
  output,
  customerInvocationAuthorized: false,
  customerCreditsMutated: false,
  qaApproved: false,
  productionAuthorityGranted: false,
})}\n`)
