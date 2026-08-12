import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from '../cli/weeditpro-gcp-local-operator-auth'

let tokenReads = 0
const auth = createWeEditProGcpLocalOperatorAuth({
  confirmation: WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
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
  readAccessToken() {
    rejectedReaderInvoked = true
    return 'fixture-only-ephemeral-access-token-value'
  },
}))
assert.equal(rejectedReaderInvoked, false)
assert.throws(() => createWeEditProGcpLocalOperatorAuth({
  confirmation: WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
  readAccessToken: () => 'short',
}))
assert.throws(() => createWeEditProGcpLocalOperatorAuth({
  confirmation: WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
  readAccessToken: () => 'fixture token contains whitespace',
}))

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
  checks: 13,
  shortLivedImpersonatedTokenOnly: true,
  productionImageObservationUsesQualifiedImpersonation: true,
  accountEffectiveServingRateUsesQualifiedImpersonation: true,
  tokenPersistedOrLogged: false,
  storageAutomaticRetryEnabled: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))
