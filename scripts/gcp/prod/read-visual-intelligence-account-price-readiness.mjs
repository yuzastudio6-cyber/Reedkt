#!/usr/bin/env node

import { execFileSync } from 'node:child_process'

const projectId = 'reeditpro'
const canonicalPricingServiceAccount =
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'
const billingAccountResourceName =
  process.env.WEEDITPRO_BILLING_ACCOUNT_RESOURCE_NAME ?? ''

const exactSkuIds = [
  'EAC4-305F-1249',
  '8308-9CED-8950',
  '2737-2D33-D986',
  'E0A5-FB5D-79F4',
  '8A47-3936-DC92',
  '3CE8-93F8-3C8F',
]

if (!/^billingAccounts\/[A-Z0-9-]+$/u.test(billingAccountResourceName)) {
  emit({
    status: billingAccountResourceName.length === 0
      ? 'billing_account_not_linked'
      : 'invalid_billing_account_coordinate',
    exactSkuPriceReads: 0,
  })
  process.exit(0)
}

let exactSkuPriceReads = 0
let status = 'ready'
const credentialSource = 'canonical_api_service_account_impersonation'
let canonicalServiceAccountAccessToken
try {
  canonicalServiceAccountAccessToken = readCanonicalServiceAccountAccessToken()
} catch {
  emit({
    status: 'canonical_service_account_impersonation_permission_required',
    exactSkuPriceReads,
    credentialSource,
  })
  process.exit(0)
}

for (const skuId of exactSkuIds) {
  try {
    await readWithAccessToken(skuId, canonicalServiceAccountAccessToken)
    exactSkuPriceReads += 1
  } catch (error) {
    status = classifyHttpStatus(Number(error?.httpStatus ?? 0))
    break
  }
}

emit({ status, exactSkuPriceReads, credentialSource })

function priceUrl(skuId) {
  const coordinate = encodeURIComponent(billingAccountResourceName)
    .replace(/%2F/giu, '/')
  return `https://cloudbilling.googleapis.com/v2beta/${coordinate}/skus/${skuId}/price?currencyCode=USD`
}

function readCanonicalServiceAccountAccessToken() {
  const token = execFileSync(
    'gcloud',
    [
      'auth',
      'print-access-token',
      `--impersonate-service-account=${canonicalPricingServiceAccount}`,
      `--project=${projectId}`,
      '--quiet',
    ],
    {
      encoding: 'utf8',
      maxBuffer: 8 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000,
    },
  ).trim()
  if (token.length < 20 || token.length > 4096 || /\s/u.test(token)) {
    throw new Error('gcloud access token was unavailable')
  }
  return token
}

async function readWithAccessToken(skuId, accessToken) {
  const response = await fetch(priceUrl(skuId), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    const error = new Error('Account-effective price read failed')
    error.httpStatus = response.status
    throw error
  }
}

function classifyHttpStatus(httpStatus, {
  unavailableStatus = 'account_price_read_unavailable',
} = {}) {
  return httpStatus === 400
    ? 'account_price_read_request_rejected'
    : httpStatus === 401
      ? 'authentication_required'
      : httpStatus === 403
        ? 'billing_account_price_permission_required'
        : httpStatus === 404
          ? 'account_price_not_found'
          : unavailableStatus
}

function emit({ status, exactSkuPriceReads, credentialSource = 'none' }) {
  console.log(JSON.stringify({
    audit: 'weeditpro-gemini-account-effective-price-readiness-v1',
    status,
    credentialSource,
    expectedSkuPriceReads: exactSkuIds.length,
    exactSkuPriceReads,
    billingAccountPriceReadReady:
      status === 'ready' && exactSkuPriceReads === exactSkuIds.length,
    billingAccountResourceDisclosed: false,
    pricePayloadDisclosed: false,
    accessTokenDisclosed: false,
    canonicalPricingServiceIdentityUsed:
      status === 'ready'
      && credentialSource === 'canonical_api_service_account_impersonation',
    exactModelSkuCompatibilityQualificationObserved: false,
    stateMutated: false,
  }))
}
