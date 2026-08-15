import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcpSam31VertexServingQualificationInvocationService,
  createCanonicalSam31VertexServingQualificationInvocationRepository,
} from '../services/canonical-sam3_1-vertex-serving-qualification-invocation-service'
import {
  createCanonicalGcpSam31VertexServingQualificationOutputService,
} from '../services/canonical-sam3_1-vertex-serving-qualification-output-service'
import {
  assertCanonicalSam31VertexServingQualificationPreparation,
  createCanonicalSam31VertexServingQualificationPreparationRef,
  createCanonicalSam31VertexServingQualificationPreparationRepository,
} from '../services/canonical-sam3_1-vertex-serving-qualification-preparation-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'reconcile-one-weeditpro-sam31-a100-serving-v1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const environment = z.object({
  WEEDITPRO_SAM31_VERTEX_SERVING_RECONCILIATION_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_VERTEX_SERVING_INVOCATION_ID: safeId,
}).strict().parse({
  WEEDITPRO_SAM31_VERTEX_SERVING_RECONCILIATION_CONFIRMATION:
    process.env
      .WEEDITPRO_SAM31_VERTEX_SERVING_RECONCILIATION_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_VERTEX_SERVING_INVOCATION_ID:
    process.env.WEEDITPRO_SAM31_VERTEX_SERVING_INVOCATION_ID,
})

const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const invocationId =
  environment.WEEDITPRO_SAM31_VERTEX_SERVING_INVOCATION_ID
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: CONTROL_PLANE_BUCKET,
})
const invocationRepository =
  createCanonicalSam31VertexServingQualificationInvocationRepository({
    objectPort,
  })
const [existingAttempt, existingCallStart] = await Promise.all([
  invocationRepository.rereadAttempt({ invocationId }),
  invocationRepository.rereadCallStart({ invocationId }),
])
if (existingAttempt === null || existingCallStart === null) {
  throw new Error(
    'Vertex serving reconciliation requires a durably consumed provider call.',
  )
}
const preparation =
  assertCanonicalSam31VertexServingQualificationPreparation(
    await createCanonicalSam31VertexServingQualificationPreparationRepository({
      objectPort,
    }).reread({ invocationId }),
  )
const result =
  await createCanonicalGcpSam31VertexServingQualificationInvocationService({
    storage,
    auth: authClient,
  }).invokeOne({
    invocationId,
    qualificationPreparationRef:
      createCanonicalSam31VertexServingQualificationPreparationRef(
        preparation,
      ),
    dispatchAdmissionDigestSha256:
      preparation.dispatchAdmissionDigestSha256,
  })
const exactOutput = result.disposition === 'completed'
  ? await createCanonicalGcpSam31VertexServingQualificationOutputService({
    storage,
  }).verifyOne({ invocationId })
  : null

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-vertex-serving-qualification-reconciliation-receipt-v1',
  result,
  exactOutput,
  providerCallReissued: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
})}\n`)
