#!/usr/bin/env node

import { execFileSync } from 'node:child_process'

import { GoogleAuth } from 'google-auth-library'

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

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-billing.readonly'],
})

let exactSkuPriceReads = 0
let status = 'ready'
let credentialSource = 'application_default_credentials'
let gcloudAccessToken = null
for (const skuId of exactSkuIds) {
  try {
    if (gcloudAccessToken === null) {
      await auth.request({
        url: priceUrl(skuId),
        method: 'GET',
        params: { currencyCode: 'USD' },
        timeout: 15_000,
        retry: false,
        maxRedirects: 0,
        responseType: 'json',
        maxContentLength: 2 * 1024 * 1024,
      })
    } else {
      await readWithGcloudAccessToken(skuId, gcloudAccessToken)
    }
    exactSkuPriceReads += 1
  } catch (error) {
    const httpStatus = Number(error?.response?.status ?? error?.code ?? 0)
    const responseData = error?.response?.data
    const applicationDefaultReauthenticationRequired =
      httpStatus === 400
      && responseData?.error === 'invalid_grant'
      && responseData?.error_subtype === 'invalid_rapt'
    if (applicationDefaultReauthenticationRequired && gcloudAccessToken === null) {
      try {
        gcloudAccessToken = readGcloudAccessToken()
        credentialSource = 'gcloud_active_account_fallback'
        await readWithGcloudAccessToken(skuId, gcloudAccessToken)
        exactSkuPriceReads += 1
        continue
      } catch (fallbackError) {
        status = classifyHttpStatus(Number(fallbackError?.httpStatus ?? 0), {
          unavailableStatus: 'application_default_reauthentication_required',
        })
        break
      }
    }
    status = classifyHttpStatus(httpStatus)
    break
  }
}

emit({ status, exactSkuPriceReads, credentialSource })

function priceUrl(skuId) {
  const coordinate = encodeURIComponent(billingAccountResourceName)
    .replace(/%2F/giu, '/')
  return `https://cloudbilling.googleapis.com/v2beta/${coordinate}/skus/${skuId}/price?currencyCode=USD`
}

function readGcloudAccessToken() {
  const token = execFileSync(
    'gcloud',
    ['auth', 'print-access-token', '--quiet'],
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

async function readWithGcloudAccessToken(skuId, accessToken) {
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
    exactModelSkuCompatibilityQualificationObserved: false,
    stateMutated: false,
  }))
}
