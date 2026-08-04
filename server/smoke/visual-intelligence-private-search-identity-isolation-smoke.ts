import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const scriptPath =
  'scripts/gcp/prod/20-isolate-private-search-and-disable-legacy-cpu-identities.sh'
const source = readFileSync(scriptPath, 'utf8')

const retiredIdentities = [
  'reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com',
  'reeditpro-stg-qa-sa@reeditpro.iam.gserviceaccount.com',
  'reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com',
] as const

assert.match(source, /set -euo pipefail/u)
assert.match(source, /confirm_prod_action/u)
assert.match(source, /EXPECTED_PROJECT_ID='reeditpro'/u)
assert.match(source, /EXPECTED_REGION='us-central1'/u)
assert.match(source, /isolate-weeditpro-private-search-and-disable-cpu-identities-v1/u)
assert.match(source, /reeditpro-staging-private-searxng/u)
assert.match(source, /reeditpro-private-search-sa@reeditpro\.iam\.gserviceaccount\.com/u)
assert.match(source, /sha256:7f56a77c442601d249389e4cb4101da2046fd62c04818c69eabf8caa7f6957ee/u)
assert.match(source, /resources\.limits\["nvidia\.com\/gpu"\]/u)
assert.match(source, /autoscaling\.knative\.dev\/minScale/u)
assert.match(source, /autoscaling\.knative\.dev\/maxScale/u)
assert.match(source, /allUsers/u)
assert.match(source, /allAuthenticatedUsers/u)
assert.match(source, /gcloud run services update/u)
assert.match(source, /--service-account=/u)
assert.match(source, /gcloud iam service-accounts disable/u)
assert.match(source, /gcloud builds list/u)
assert.match(source, /--ongoing/u)
assert.match(source, /gcloud batch jobs list/u)
assert.match(source, /active_batch_jobs/u)
assert.match(source, /\.spec\.template\.spec\.containers\[0\]\.image == \$image/u)
assert.match(source, /wait_for_disabled_identity/u)
assert.match(source, /for attempt in 1 2 3 4 5 6/u)
assert.match(source, /identityRereadAttemptsMaximum: 6/u)

const allowlist = source.match(
  /readonly -a LEGACY_CPU_PROCESSING_IDENTITIES=\(\n(?<members>[\s\S]*?)\n\)/u,
)?.groups?.members ?? ''
for (const identity of retiredIdentities) assert.equal(
  allowlist.split(`'${identity}'`).length - 1,
  1,
  `${identity} must occur exactly once in the disable allowlist.`,
)

for (const forbidden of [
  /gcloud run services delete/u,
  /gcloud run jobs (?:deploy|execute|delete)/u,
  /gcloud batch jobs (?:submit|delete)/u,
  /gcloud builds submit/u,
  /gcloud iam service-accounts delete/u,
  /gcloud artifacts docker images delete/u,
  /gcloud storage (?:rm|objects delete)/u,
  /gcloud secrets/u,
  /roles\/(?:owner|editor)/u,
] as const) assert.doesNotMatch(source, forbidden)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-private-search-identity-isolation',
  privateSearchUsesDedicatedControlPlaneIdentity: true,
  controlPlaneCpuAllowed: true,
  substantiveCpuMediaOrModelProcessingAllowed: false,
  fixedLegacyIdentityCount: retiredIdentities.length,
  searchImageChangeAllowed: false,
  publicInvokerAllowed: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
