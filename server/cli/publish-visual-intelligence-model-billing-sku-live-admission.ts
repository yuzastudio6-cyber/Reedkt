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
  createVisualIntelligenceAccountEffectiveCostOwner,
  createVisualIntelligenceGcsAccountEffectiveRateReadPort,
} from '../visual-intelligence/visual-intelligence-account-effective-cost-owner'
import {
  createVisualIntelligenceModelBillingSkuInternalSpendApprovalRepository,
  createVisualIntelligenceModelBillingSkuLiveAdmissionOwner,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-admission-owner'
import {
  createVisualIntelligenceModelBillingSkuLiveGcsStore,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-gcs-store'
import {
  createVisualIntelligenceGcsPrivateObjectReadPort,
} from '../visual-intelligence/visual-intelligence-private-object-read-port'
import {
  readVisualIntelligenceRuntimeRelease,
} from '../visual-intelligence/visual-intelligence-runtime-release'

const EXACT_CONFIRMATION =
  'I_APPROVE_ONE_EXPIRING_INTERNAL_GEMINI_QUALIFICATION_ADMISSION_NO_PROVIDER_CALL'
const EXACT_PROVIDER_PRINCIPAL =
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'

if (
  process.argv.length !== 3
  || process.argv[2] !== '--execute'
  || process.env.REEDITPRO_CONFIRM_VI_MODEL_SKU_ADMISSION
    !== EXACT_CONFIRMATION
) throw new Error(
  'Visual Intelligence admission publication requires exact internal-spend confirmation.',
)

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const bucket = z.string().regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u)
const objectName = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/@+=,-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('\\'))
const generation = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const env = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: bucket,
  REEDITPRO_VI_MODEL_SKU_AUTHORIZATION_ID: safeId,
  REEDITPRO_VI_MODEL_SKU_AUTHORIZATION_VERSION:
    z.coerce.number().int().positive().safe(),
  REEDITPRO_VI_MODEL_SKU_QUALIFICATION_ID: safeId,
  REEDITPRO_VI_MODEL_SKU_QUALIFICATION_VERSION:
    z.coerce.number().int().positive().safe(),
  REEDITPRO_VI_MODEL_SKU_AUTHORIZED_AT_ISO:
    z.string().datetime({ offset: true }),
  REEDITPRO_VI_MODEL_SKU_EXPIRES_AT_ISO:
    z.string().datetime({ offset: true }),
  REEDITPRO_VI_MODEL_SKU_MAX_INTERNAL_SPEND_USD_MICROS:
    z.coerce.number().int().positive().max(50_000_000).safe(),
  REEDITPRO_VI_RUNTIME_RELEASE_BUCKET: bucket,
  REEDITPRO_VI_RUNTIME_RELEASE_OBJECT: objectName,
  REEDITPRO_VI_RUNTIME_RELEASE_GENERATION: generation,
  REEDITPRO_VI_RUNTIME_RELEASE_ETAG: z.string().trim().min(1).max(512),
  REEDITPRO_VI_RUNTIME_RELEASE_SHA256: rawSha256,
  REEDITPRO_VI_RATE_AUTHORITY_BUCKET: bucket,
  REEDITPRO_VI_RATE_AUTHORITY_OBJECT: objectName,
  REEDITPRO_VI_RATE_AUTHORITY_GENERATION: generation,
  REEDITPRO_VI_RATE_AUTHORITY_ETAG: z.string().trim().min(1).max(512),
  REEDITPRO_VI_RATE_AUTHORITY_SHA256: rawSha256,
  REEDITPRO_VI_RATE_AUTHORITY_ID: safeId,
  REEDITPRO_VI_RATE_AUTHORITY_VERSION:
    z.coerce.number().int().positive().safe(),
  REEDITPRO_VI_RATE_AUTHORITY_DIGEST_SHA256: prefixedSha256,
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  REEDITPRO_VI_MODEL_SKU_AUTHORIZATION_ID:
    process.env.REEDITPRO_VI_MODEL_SKU_AUTHORIZATION_ID,
  REEDITPRO_VI_MODEL_SKU_AUTHORIZATION_VERSION:
    process.env.REEDITPRO_VI_MODEL_SKU_AUTHORIZATION_VERSION,
  REEDITPRO_VI_MODEL_SKU_QUALIFICATION_ID:
    process.env.REEDITPRO_VI_MODEL_SKU_QUALIFICATION_ID,
  REEDITPRO_VI_MODEL_SKU_QUALIFICATION_VERSION:
    process.env.REEDITPRO_VI_MODEL_SKU_QUALIFICATION_VERSION,
  REEDITPRO_VI_MODEL_SKU_AUTHORIZED_AT_ISO:
    process.env.REEDITPRO_VI_MODEL_SKU_AUTHORIZED_AT_ISO,
  REEDITPRO_VI_MODEL_SKU_EXPIRES_AT_ISO:
    process.env.REEDITPRO_VI_MODEL_SKU_EXPIRES_AT_ISO,
  REEDITPRO_VI_MODEL_SKU_MAX_INTERNAL_SPEND_USD_MICROS:
    process.env.REEDITPRO_VI_MODEL_SKU_MAX_INTERNAL_SPEND_USD_MICROS,
  REEDITPRO_VI_RUNTIME_RELEASE_BUCKET:
    process.env.REEDITPRO_VI_RUNTIME_RELEASE_BUCKET,
  REEDITPRO_VI_RUNTIME_RELEASE_OBJECT:
    process.env.REEDITPRO_VI_RUNTIME_RELEASE_OBJECT,
  REEDITPRO_VI_RUNTIME_RELEASE_GENERATION:
    process.env.REEDITPRO_VI_RUNTIME_RELEASE_GENERATION,
  REEDITPRO_VI_RUNTIME_RELEASE_ETAG:
    process.env.REEDITPRO_VI_RUNTIME_RELEASE_ETAG,
  REEDITPRO_VI_RUNTIME_RELEASE_SHA256:
    process.env.REEDITPRO_VI_RUNTIME_RELEASE_SHA256,
  REEDITPRO_VI_RATE_AUTHORITY_BUCKET:
    process.env.REEDITPRO_VI_RATE_AUTHORITY_BUCKET,
  REEDITPRO_VI_RATE_AUTHORITY_OBJECT:
    process.env.REEDITPRO_VI_RATE_AUTHORITY_OBJECT,
  REEDITPRO_VI_RATE_AUTHORITY_GENERATION:
    process.env.REEDITPRO_VI_RATE_AUTHORITY_GENERATION,
  REEDITPRO_VI_RATE_AUTHORITY_ETAG:
    process.env.REEDITPRO_VI_RATE_AUTHORITY_ETAG,
  REEDITPRO_VI_RATE_AUTHORITY_SHA256:
    process.env.REEDITPRO_VI_RATE_AUTHORITY_SHA256,
  REEDITPRO_VI_RATE_AUTHORITY_ID:
    process.env.REEDITPRO_VI_RATE_AUTHORITY_ID,
  REEDITPRO_VI_RATE_AUTHORITY_VERSION:
    process.env.REEDITPRO_VI_RATE_AUTHORITY_VERSION,
  REEDITPRO_VI_RATE_AUTHORITY_DIGEST_SHA256:
    process.env.REEDITPRO_VI_RATE_AUTHORITY_DIGEST_SHA256,
})

const providerCredentials = await new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
}).getCredentials()
if (providerCredentials.client_email !== EXACT_PROVIDER_PRINCIPAL) {
  throw new Error(
    'Visual Intelligence admission publication requires the canonical API service identity.',
  )
}

const storage = new Storage({ projectId: env.GOOGLE_CLOUD_PROJECT_ID })
const privateObjectReadPort =
  createVisualIntelligenceGcsPrivateObjectReadPort({
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    storage,
  })
const runtimeRelease = await readVisualIntelligenceRuntimeRelease({
  projectId: env.GOOGLE_CLOUD_PROJECT_ID,
  bucketName: env.REEDITPRO_VI_RUNTIME_RELEASE_BUCKET,
  objectName: env.REEDITPRO_VI_RUNTIME_RELEASE_OBJECT,
  generation: env.REEDITPRO_VI_RUNTIME_RELEASE_GENERATION,
  etag: env.REEDITPRO_VI_RUNTIME_RELEASE_ETAG,
  contentSha256: env.REEDITPRO_VI_RUNTIME_RELEASE_SHA256,
  objectPort: privateObjectReadPort,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: env.GCS_CONTROL_PLANE_STATE_BUCKET,
})
const rateAuthorityRef = Object.freeze({
  id: env.REEDITPRO_VI_RATE_AUTHORITY_ID,
  version: env.REEDITPRO_VI_RATE_AUTHORITY_VERSION,
  contentHash: env.REEDITPRO_VI_RATE_AUTHORITY_DIGEST_SHA256,
})
const costPreflightOwner = createVisualIntelligenceAccountEffectiveCostOwner({
  rateAuthorityRef,
  rateReadPort: createVisualIntelligenceGcsAccountEffectiveRateReadPort({
    bucketName: env.REEDITPRO_VI_RATE_AUTHORITY_BUCKET,
    objectName: env.REEDITPRO_VI_RATE_AUTHORITY_OBJECT,
    generation: env.REEDITPRO_VI_RATE_AUTHORITY_GENERATION,
    etag: env.REEDITPRO_VI_RATE_AUTHORITY_ETAG,
    contentSha256: env.REEDITPRO_VI_RATE_AUTHORITY_SHA256,
    objectPort: privateObjectReadPort,
  }),
  objectPort,
})
const liveStore = createVisualIntelligenceModelBillingSkuLiveGcsStore({
  projectId: env.GOOGLE_CLOUD_PROJECT_ID,
  bucketName: env.GCS_CONTROL_PLANE_STATE_BUCKET,
  storage,
})
const owner = createVisualIntelligenceModelBillingSkuLiveAdmissionOwner({
  costPreflightOwner,
  approvalRepository:
    createVisualIntelligenceModelBillingSkuInternalSpendApprovalRepository({
      objectPort,
    }),
  liveStore,
})
const result = await owner.publish({
  authorizationId: env.REEDITPRO_VI_MODEL_SKU_AUTHORIZATION_ID,
  authorizationVersion: env.REEDITPRO_VI_MODEL_SKU_AUTHORIZATION_VERSION,
  qualificationId: env.REEDITPRO_VI_MODEL_SKU_QUALIFICATION_ID,
  qualificationVersion: env.REEDITPRO_VI_MODEL_SKU_QUALIFICATION_VERSION,
  issuedAtIso: env.REEDITPRO_VI_MODEL_SKU_AUTHORIZED_AT_ISO,
  expiresAtIso: env.REEDITPRO_VI_MODEL_SKU_EXPIRES_AT_ISO,
  maximumInternalProviderSpendUsdMicros:
    env.REEDITPRO_VI_MODEL_SKU_MAX_INTERNAL_SPEND_USD_MICROS,
  providerPrincipalEmail: EXACT_PROVIDER_PRINCIPAL,
  currentProcessExplicitConfirmationObserved: true,
  runtimeRelease,
})

process.stdout.write(`${visualIntelligenceCanonicalJson(result)}\n`)
