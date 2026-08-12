import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createGoogleVertexModelBillingSkuLiveGeneratePort,
  executeVisualIntelligenceModelBillingSkuLiveQualification,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-qualification'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'execute-one-weeditpro-gemini-model-billing-sku-live-qualification-v1' as const
const PROJECT_ID = 'reeditpro' as const
const LOCATION = 'global' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const environment = z.object({
  confirmation: z.literal(CONFIRMATION),
  localOperatorAuth: z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  qualificationId: safeId,
}).strict().parse({
  confirmation:
    process.env.WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_SKU_LIVE_CONFIRMATION,
  localOperatorAuth: process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  qualificationId:
    process.env.WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_SKU_QUALIFICATION_ID,
})

const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.localOperatorAuth,
})
const result =
  await executeVisualIntelligenceModelBillingSkuLiveQualification({
    qualificationId: environment.qualificationId,
    projectId: PROJECT_ID,
    vertexLocation: LOCATION,
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: CONTROL_BUCKET,
    }),
    generatePort: createGoogleVertexModelBillingSkuLiveGeneratePort({
      projectId: PROJECT_ID,
      location: LOCATION,
      authClient,
    }),
  })

process.stdout.write(`${JSON.stringify(result)}\n`)
