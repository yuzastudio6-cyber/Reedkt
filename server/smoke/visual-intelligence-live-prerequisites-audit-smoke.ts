import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  'scripts/gcp/prod/16-audit-visual-intelligence-live-prerequisites.sh',
  'utf8',
)
const accountPriceReadinessSource = readFileSync(
  'scripts/gcp/prod/read-visual-intelligence-account-price-readiness.mjs',
  'utf8',
)

assert.match(source, /PROJECT_ID='reeditpro'/u)
assert.match(source, /REGION='us-central1'/u)
assert.match(source, /NVIDIA_A100_80GB_GPUS/u)
assert.match(source, /NVIDIA_L4_GPUS/u)
assert.match(source, /gcloud secrets versions list/u)
assert.match(source, /--filter='state=ENABLED'/u)
assert.match(source, /containerscanning\.googleapis\.com/u)
assert.match(source, /cloudbilling\.googleapis\.com/u)
assert.match(source, /gcloud billing projects describe/u)
assert.match(source,
  /read-visual-intelligence-account-price-readiness\.mjs/u)
assert.match(source, /gcloud run jobs list/u)
assert.match(source, /gcloud run services list/u)
assert.match(source, /gcloud artifacts docker images list/u)
assert.match(source, /sourceCheckpointCompatibilityReceiptObserved: false/u)
assert.match(source, /liveGeminiQualificationObserved: false/u)
assert.match(source, /liveGpuQualificationObserved: false/u)
assert.match(source, /customerCreditsMutated: false/u)
assert.match(source, /productionReady: false/u)

for (const skuId of [
  'EAC4-305F-1249',
  '8308-9CED-8950',
  '2737-2D33-D986',
  'E0A5-FB5D-79F4',
  '8A47-3936-DC92',
  '3CE8-93F8-3C8F',
] as const) assert.match(accountPriceReadinessSource, new RegExp(skuId, 'u'))
assert.match(accountPriceReadinessSource,
  /cloud-billing\.readonly/u)
assert.match(accountPriceReadinessSource, /billingAccountPriceReadReady/u)
assert.match(accountPriceReadinessSource,
  /billing_account_price_permission_required/u)
assert.match(accountPriceReadinessSource,
  /exactModelSkuCompatibilityQualificationObserved: false/u)
assert.match(accountPriceReadinessSource, /maxRedirects: 0/u)
assert.match(accountPriceReadinessSource, /retry: false/u)
assert.match(accountPriceReadinessSource, /stateMutated: false/u)
assert.doesNotMatch(accountPriceReadinessSource,
  /console\.(?:log|error)\([^)]*billingAccountResourceName/u)

for (const forbidden of [
  /secrets versions access/u,
  /gcloud services enable/u,
  /gcloud run jobs execute/u,
  /gcloud run jobs (?:create|deploy|delete|update)/u,
  /gcloud run services (?:create|deploy|delete|update)/u,
  /gcloud batch jobs (?:submit|delete)/u,
  /gcloud builds submit/u,
  /artifacts docker images delete/u,
  /\bcurl\b/u,
  /\bwget\b/u,
  /(?:^|\n)\s*docker(?:\s|$)/u,
  /\bpython(?:3)?\b/u,
] as const) assert.doesNotMatch(source, forbidden)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-live-prerequisites-audit',
  productName: 'WeEditPro',
  readOnlyCloudAudit: true,
  secretPayloadRead: false,
  gpuJobStarted: false,
  modelDownloaded: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
