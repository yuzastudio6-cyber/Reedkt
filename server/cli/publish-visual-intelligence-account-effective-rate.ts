import dotenv from 'dotenv'
import { z } from 'zod'

import {
  createVisualIntelligenceAccountEffectiveRatePublisherDependencies,
} from './visual-intelligence-account-effective-rate-publisher-dependencies'
import {
  createVisualIntelligenceAccountEffectivePricingObservationPort,
  createWeEditProVisualIntelligenceAccountEffectiveRateReaderConfiguration,
} from '../visual-intelligence/visual-intelligence-account-effective-rate-read-port'
import {
  publishVisualIntelligenceAccountEffectiveRateAuthority,
} from '../visual-intelligence/visual-intelligence-account-effective-rate-publisher'
import {
  readVisualIntelligenceModelBillingSkuQualification,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification'

dotenv.config({ quiet: true })

const env = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.string()
    .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u),
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME: z.string()
    .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u),
  WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_OBJECT:
    z.string().startsWith(
      'private/visual-intelligence/qualifications/gemini-billing-sku/v1/',
    ).endsWith('.json'),
  WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_GENERATION:
    z.string().regex(/^[1-9][0-9]{0,30}$/u),
  WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_ETAG:
    z.string().min(1).max(512),
  WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_SHA256:
    z.string().regex(/^[a-f0-9]{64}$/u),
  WEEDITPRO_VISUAL_INTELLIGENCE_RATE_OBSERVATION_ID: z.string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u),
  WEEDITPRO_VISUAL_INTELLIGENCE_RATE_OBSERVATION_VERSION:
    z.coerce.number().int().positive().safe(),
}).passthrough().parse(process.env)

const dependencies =
  createVisualIntelligenceAccountEffectiveRatePublisherDependencies({
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
  })
const qualification =
  await readVisualIntelligenceModelBillingSkuQualification({
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    bucketName: env.GCS_CONTROL_PLANE_STATE_BUCKET,
    objectName:
      env.WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_OBJECT,
    generation:
      env.WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_GENERATION,
    etag:
      env.WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_ETAG,
    contentSha256:
      env.WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_SHA256,
    objectPort: dependencies.privateObjectReadPort,
  })
const configuration =
  createWeEditProVisualIntelligenceAccountEffectiveRateReaderConfiguration({
    billingAccountResourceName:
      env.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
    exactModelBillingSkuCompatibilityQualification: qualification,
  })
const pricingObservationPort =
  createVisualIntelligenceAccountEffectivePricingObservationPort({
    configuration,
    auth: dependencies.auth,
  })
const receipt =
  await publishVisualIntelligenceAccountEffectiveRateAuthority({
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    bucketName: env.GCS_CONTROL_PLANE_STATE_BUCKET,
    pricingApiObservationId:
      env.WEEDITPRO_VISUAL_INTELLIGENCE_RATE_OBSERVATION_ID,
    pricingApiObservationVersion:
      env.WEEDITPRO_VISUAL_INTELLIGENCE_RATE_OBSERVATION_VERSION,
    pricingObservationPort,
    storage: dependencies.storage,
  })

console.log(JSON.stringify(receipt, null, 2))
