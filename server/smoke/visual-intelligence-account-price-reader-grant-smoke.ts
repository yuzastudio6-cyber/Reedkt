import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  'scripts/gcp/prod/18-grant-visual-intelligence-account-price-reader.sh',
  'utf8',
)
const readiness = readFileSync(
  'scripts/gcp/prod/read-visual-intelligence-account-price-readiness.mjs',
  'utf8',
)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly PROJECT_NUMBER='390722338345'",
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
  'grant-weeditpro-visual-intelligence-price-reader-v1',
  '^billingAccounts/[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$',
  'gcloud billing projects describe',
  'gcloud billing accounts add-iam-policy-binding',
  'gcloud billing accounts get-iam-policy',
  '--role=roles/billing.viewer',
  'WEEDITPRO_ACCOUNT_PRICE_READER_OPERATOR_PRINCIPAL',
  'gcloud iam service-accounts add-iam-policy-binding',
  'gcloud iam service-accounts get-iam-policy',
  '--role=roles/iam.serviceAccountTokenCreator',
  '"operatorPrincipalDisclosed":false',
  '"billingAccountResourceDisclosed":false',
  '"billingMutationAuthorityGranted":false',
  '"paymentAuthorityGranted":false',
  '"customerCreditsMutated":false',
  '"providerCallMade":false',
  '"productionAuthorityGranted":false',
] as const) assert.ok(source.includes(expected), `missing ${expected}`)

for (const forbidden of [
  /billingAccounts\/[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}/u,
  /roles\/billing\.admin/u,
  /roles\/owner/u,
  /billing accounts (?:close|create|move|update)/u,
  /billing projects (?:link|unlink)/u,
  /budgets (?:create|delete|update)/u,
  /secrets versions/u,
  /gcloud builds submit/u,
  /gcloud batch jobs submit/u,
  /gcloud run jobs execute/u,
  /gcloud[^\n]*(?:wallet|ledger)/u,
  /stripe/iu,
  /(?:curl|wget)\s/u,
] as const) assert.doesNotMatch(source, forbidden)

assert.match(readiness, /account_price_read_request_rejected/u)
assert.match(readiness, /billing_account_price_permission_required/u)
assert.doesNotMatch(readiness, /application_default_credentials/u)
assert.doesNotMatch(readiness, /new GoogleAuth/u)
assert.match(readiness, /execFileSync/u)
assert.match(readiness, /'gcloud'/u)
assert.match(readiness, /'auth',/u)
assert.match(readiness, /'print-access-token'/u)
assert.match(readiness,
  /--impersonate-service-account=\$\{canonicalPricingServiceAccount\}/u)
assert.match(readiness, /--project=\$\{projectId\}/u)
assert.match(readiness, /canonical_api_service_account_impersonation/u)
assert.match(readiness,
  /canonical_service_account_impersonation_permission_required/u)
assert.match(readiness, /canonicalPricingServiceIdentityUsed/u)
assert.match(readiness, /redirect: 'error'/u)
assert.match(readiness, /billingAccountPriceReadReady/u)
assert.doesNotMatch(readiness, /error_description/u)
assert.doesNotMatch(readiness,
  /console\.(?:log|error)\(\s*(?:canonicalServiceAccountAccessToken|accessToken|token)\b/u)
assert.doesNotMatch(readiness,
  /JSON\.stringify\([^)]*\b(?:canonicalServiceAccountAccessToken|accessToken)\b/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-account-price-reader-grant',
  productName: 'WeEditPro',
  exactReadOnlyRole: 'roles/billing.viewer',
  billingAccountCoordinatePersisted: false,
  billingAccountResourceDisclosed: false,
  billingMutationAuthorityGranted: false,
  customerCreditsMutated: false,
  providerCallMade: false,
  productionReady: false,
}, null, 2))
