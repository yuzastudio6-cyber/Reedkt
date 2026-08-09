import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  visualIntelligenceCanonicalJson,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceModelBillingSkuInternalSpendApprovalRepository,
  createVisualIntelligenceModelBillingSkuLiveAdmissionAuthorityVerificationPort,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-admission-owner'
import {
  createGoogleVertexModelBillingSkuQualificationGeneratePort,
  createVisualIntelligenceModelBillingSkuLiveExecutor,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-executor'
import {
  createVisualIntelligenceModelBillingSkuLiveGcsStore,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-gcs-store'
import {
  createVisualIntelligenceGcsProviderTrafficGuard,
} from '../visual-intelligence/visual-intelligence-provider-traffic-guard'

const EXACT_CONFIRMATION =
  'I_APPROVE_EXACTLY_FOUR_INTERNAL_GEMINI_REQUESTS_NO_RETRY'
const EXACT_PROVIDER_PRINCIPAL =
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'

if (
  process.argv.length !== 3
  || process.argv[2] !== '--execute'
  || process.env.REEDITPRO_CONFIRM_VI_MODEL_SKU_LIVE_QUALIFICATION
    !== EXACT_CONFIRMATION
) throw new Error(
  'Visual Intelligence live qualification requires exact internal paid-provider confirmation.',
)

const env = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.string()
    .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u),
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_ID: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_VERSION:
    z.coerce.number().int().positive().safe(),
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_SHA256:
    z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_ID:
    process.env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_ID,
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_VERSION:
    process.env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_VERSION,
  REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_SHA256:
    process.env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_SHA256,
})

const providerCredentials = await new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
}).getCredentials()
if (providerCredentials.client_email !== EXACT_PROVIDER_PRINCIPAL) {
  throw new Error(
    'Visual Intelligence live qualification requires the canonical API service identity.',
  )
}

const storage = new Storage({ projectId: env.GOOGLE_CLOUD_PROJECT_ID })
const store = createVisualIntelligenceModelBillingSkuLiveGcsStore({
  projectId: env.GOOGLE_CLOUD_PROJECT_ID,
  bucketName: env.GCS_CONTROL_PLANE_STATE_BUCKET,
  storage,
})
const approvalRepository =
  createVisualIntelligenceModelBillingSkuInternalSpendApprovalRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: env.GCS_CONTROL_PLANE_STATE_BUCKET,
    }),
  })
const executor = createVisualIntelligenceModelBillingSkuLiveExecutor({
  admissionReadPort: store.admissionReadPort,
  admissionAuthorityVerificationPort:
    createVisualIntelligenceModelBillingSkuLiveAdmissionAuthorityVerificationPort({
      approvalRepository,
    }),
  providerTrafficGuardPort: createVisualIntelligenceGcsProviderTrafficGuard({
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    bucketName: env.GCS_CONTROL_PLANE_STATE_BUCKET,
  }),
  generatePort: createGoogleVertexModelBillingSkuQualificationGeneratePort({
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    location: 'global',
  }),
  contextEvidenceRepository: store.contextEvidenceRepository,
  resultRepository: store.resultRepository,
  attemptStore: store.attemptStore,
  routeRegistryReadPort: store.routeRegistryReadPort,
})
const result = await executor.execute({
  admissionRef: {
    id: env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_ID,
    version: env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_VERSION,
    contentHash: env.REEDITPRO_VI_MODEL_SKU_LIVE_ADMISSION_SHA256,
  },
})

process.stdout.write(`${visualIntelligenceCanonicalJson(result)}\n`)
