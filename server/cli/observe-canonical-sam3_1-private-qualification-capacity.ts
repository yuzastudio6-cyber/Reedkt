import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GcpA100ServingCompleteSourceCapacityReadPort,
  createCanonicalSam31GcpL4CompleteSourceCapacityReadPort,
} from '../services/canonical-sam3_1-complete-source-capacity-owner'
import {
  createCanonicalSam31PrivateQualificationCapacityOwner,
  createCanonicalSam31PrivateQualificationCapacityRepository,
} from '../services/canonical-sam3_1-private-qualification-capacity-owner'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'observe-weeditpro-sam31-private-qualification-capacity-v1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const environment = z.object({
  WEEDITPRO_SAM31_PRIVATE_QUALIFICATION_CAPACITY_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_PRIVATE_QUALIFICATION_CAPACITY_OBSERVATION_ID: safeId,
}).strict().parse({
  WEEDITPRO_SAM31_PRIVATE_QUALIFICATION_CAPACITY_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_PRIVATE_QUALIFICATION_CAPACITY_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_PRIVATE_QUALIFICATION_CAPACITY_OBSERVATION_ID:
    process.env
      .WEEDITPRO_SAM31_PRIVATE_QUALIFICATION_CAPACITY_OBSERVATION_ID,
})

const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const observation = await createCanonicalSam31PrivateQualificationCapacityOwner({
  a100QuotaReadPort:
    createCanonicalSam31GcpA100ServingCompleteSourceCapacityReadPort({
      auth: authClient,
    }),
  l4QuotaReadPort: createCanonicalSam31GcpL4CompleteSourceCapacityReadPort({
    auth: authClient,
  }),
  repository: createCanonicalSam31PrivateQualificationCapacityRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: CONTROL_PLANE_BUCKET,
    }),
  }),
}).observeAndPersist({
  observationId:
    environment.WEEDITPRO_SAM31_PRIVATE_QUALIFICATION_CAPACITY_OBSERVATION_ID,
})

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-private-qualification-capacity-receipt-v1',
  observation,
  privateQualificationCapacityReady:
    observation.privateSequentialCapacityReady,
  productionConcurrencyCapacityReady:
    observation.productionConcurrencyCapacityReady,
  qualificationExecutionStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
})}\n`)
