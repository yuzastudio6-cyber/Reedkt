#!/usr/bin/env node

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
for (const skuId of exactSkuIds) {
  try {
    await auth.request({
      url: `https://cloudbilling.googleapis.com/v2beta/${billingAccountResourceName}/skus/${skuId}/price`,
      method: 'GET',
      params: { currencyCode: 'USD' },
      timeout: 15_000,
      retry: false,
      maxRedirects: 0,
      responseType: 'json',
      maxContentLength: 2 * 1024 * 1024,
    })
    exactSkuPriceReads += 1
  } catch (error) {
    const httpStatus = Number(error?.response?.status ?? 0)
    status = httpStatus === 401
      ? 'authentication_required'
      : httpStatus === 403
        ? 'billing_account_price_permission_required'
        : httpStatus === 404
          ? 'account_price_not_found'
          : 'account_price_read_unavailable'
    break
  }
}

emit({ status, exactSkuPriceReads })

function emit({ status, exactSkuPriceReads }) {
  console.log(JSON.stringify({
    audit: 'weeditpro-gemini-account-effective-price-readiness-v1',
    status,
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
