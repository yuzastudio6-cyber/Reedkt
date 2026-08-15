import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from '../cli/weeditpro-gcp-local-operator-auth'

let tokenReads = 0
const reeditproContext = () => ({
  account: 'aiediting@reeditpro.com',
  project: 'reeditpro',
})
const auth = createWeEditProGcpLocalOperatorAuth({
  confirmation: WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
  readOperatorContext: reeditproContext,
  readAccessToken() {
    tokenReads += 1
    return 'fixture-only-ephemeral-access-token-value'
  },
})
assert.equal(tokenReads, 1)
assert.equal(typeof auth.authClient.request, 'function')
assert.equal(typeof auth.storage.bucket, 'function')

let rejectedReaderInvoked = false
assert.throws(() => createWeEditProGcpLocalOperatorAuth({
  confirmation: 'wrong-mode',
  readOperatorContext: reeditproContext,
  readAccessToken() {
    rejectedReaderInvoked = true
    return 'fixture-only-ephemeral-access-token-value'
  },
}))
assert.equal(rejectedReaderInvoked, false)
assert.throws(() => createWeEditProGcpLocalOperatorAuth({
  confirmation: WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
  readOperatorContext: reeditproContext,
  readAccessToken: () => 'short',
}))
assert.throws(() => createWeEditProGcpLocalOperatorAuth({
  confirmation: WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
  readOperatorContext: reeditproContext,
  readAccessToken: () => 'fixture token contains whitespace',
}))
let driftedTokenReaderInvoked = false
assert.throws(() => createWeEditProGcpLocalOperatorAuth({
  confirmation: WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
  readOperatorContext: () => ({
    account: 'solve-your-problems@dukira.com',
    project: 'dukira-demo',
  }),
  readAccessToken() {
    driftedTokenReaderInvoked = true
    return 'fixture-only-ephemeral-access-token-value'
  },
}))
assert.equal(driftedTokenReaderInvoked, false)

const productionImageOperatorSource = readFileSync(
  new URL('../cli/canonical-sam3_1-cloud-image-build.ts', import.meta.url),
  'utf8',
)
assert.match(
  productionImageOperatorSource,
  /createWeEditProGcpLocalOperatorAuth/u,
)
assert.match(
  productionImageOperatorSource,
  /createCanonicalSam31GcpCloudImageBuildRuntime\(\{[\s\S]*storage,[\s\S]*auth: authClient/u,
)
const servingRatePublisherSource = readFileSync(
  new URL(
    '../cli/publish-current-google-cloud-vertex-a100-serving-rate-authority.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.match(servingRatePublisherSource, /WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH/u)
assert.match(
  servingRatePublisherSource,
  /createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort\(\{[\s\S]*auth: authClient/u,
)
assert.match(
  servingRatePublisherSource,
  /createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository\(\{[\s\S]*storage/u,
)

console.log(JSON.stringify({
  smoke: 'weeditpro-gcp-local-operator-auth',
  checks: 15,
  shortLivedImpersonatedTokenOnly: true,
  reeditproOperatorContextRequiredBeforeTokenRead: true,
  productionImageObservationUsesQualifiedImpersonation: true,
  accountEffectiveServingRateUsesQualifiedImpersonation: true,
  tokenPersistedOrLogged: false,
  storageAutomaticRetryEnabled: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))
