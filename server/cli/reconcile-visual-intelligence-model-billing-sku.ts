import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createVisualIntelligenceBigQueryBillingExportPort,
} from '../visual-intelligence/visual-intelligence-bigquery-billing-export-port'
import {
  visualIntelligenceCanonicalJson,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  reconcileVisualIntelligenceModelBillingSkuQualification,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-reconciliation'
import {
  parseVisualIntelligenceModelBillingSkuLiveExecutionReceipt,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-qualification'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'reconcile-one-weeditpro-gemini-model-billing-sku-export-v1' as const
const PROJECT_ID = 'reeditpro' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DATASET_ID = 'weeditpro_billing_export' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const environment = z.object({
  confirmation: z.literal(CONFIRMATION),
  localOperatorAuth: z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  qualificationId: safeId,
}).strict().parse({
  confirmation:
    process.env.WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_SKU_RECONCILIATION_CONFIRMATION,
  localOperatorAuth: process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  qualificationId:
    process.env.WEEDITPRO_VISUAL_INTELLIGENCE_MODEL_SKU_QUALIFICATION_ID,
})

const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.localOperatorAuth,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: CONTROL_BUCKET,
})
const identityHash = createHash('sha256')
  .update(environment.qualificationId, 'utf8').digest('hex')
const liveReceiptPath =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/'
  + `executions/${identityHash}/execution-receipt.json`
const liveReceiptBody = await objectPort.readExact(liveReceiptPath)
if (!liveReceiptBody) {
  throw new Error('Live Gemini billing qualification receipt is not ready.')
}
let liveReceiptJson: unknown
try {
  liveReceiptJson = JSON.parse(liveReceiptBody.toString('utf8')) as unknown
} catch {
  throw new Error('Live Gemini billing qualification receipt is not JSON.')
}
const liveExecution =
  parseVisualIntelligenceModelBillingSkuLiveExecutionReceipt(liveReceiptJson)
if (
  liveReceiptBody.toString('utf8')
    !== visualIntelligenceCanonicalJson(liveExecution)
) throw new Error('Live Gemini billing qualification receipt is not canonical.')

const qualification =
  await reconcileVisualIntelligenceModelBillingSkuQualification({
    liveExecution,
    billingExportPort: createVisualIntelligenceBigQueryBillingExportPort({
      projectId: PROJECT_ID,
      datasetId: DATASET_ID,
      location: 'US',
      auth: authClient,
    }),
    objectPort,
  })

process.stdout.write(`${JSON.stringify({
  qualificationId: qualification.qualificationId,
  qualificationDigestSha256: qualification.qualificationDigestSha256,
  exactModelId: qualification.exactModelId,
  rateClassCount: qualification.qualifiedRateClasses.length,
  detailedBillingExportExactReread:
    qualification.detailedBillingExportExactReread,
  exactStandardAndLongSkuMappingVerified:
    qualification.exactStandardAndLongSkuMappingVerified,
  publicListPriceUsed: qualification.publicListPriceUsed,
  customerCreditsMutated:
    qualification.walletOrCreditMutationAuthorityGranted,
  productionReady: qualification.productionReleaseAuthorityGranted,
})}\n`)
