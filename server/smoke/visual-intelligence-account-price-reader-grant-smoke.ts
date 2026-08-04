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

assert.match(readiness, /application_default_reauthentication_required/u)
assert.match(readiness, /account_price_read_request_rejected/u)
assert.match(readiness, /billing_account_price_permission_required/u)
assert.match(readiness, /responseData\?\.error === 'invalid_grant'/u)
assert.match(readiness, /responseData\?\.error_subtype === 'invalid_rapt'/u)
assert.doesNotMatch(readiness, /error_description/u)

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
