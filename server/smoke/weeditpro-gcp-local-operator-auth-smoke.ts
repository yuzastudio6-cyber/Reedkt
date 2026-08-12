import assert from 'node:assert/strict'

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

console.log(JSON.stringify({
  smoke: 'weeditpro-gcp-local-operator-auth',
  checks: 8,
  shortLivedImpersonatedTokenOnly: true,
  tokenPersistedOrLogged: false,
  storageAutomaticRetryEnabled: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))
