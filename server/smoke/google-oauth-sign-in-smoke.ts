import assert from 'node:assert/strict'

import { appRouterBasename, normalizeAppBasePath } from '../../src/auth/app-base-path'
import {
  buildGoogleOAuthCallbackUrl,
  readGoogleOAuthCallbackError,
  validateGoogleProviderHandoffUrl,
} from '../../src/auth/google-oauth'

const origin = 'https://app.reeditpro.com'
const callback = buildGoogleOAuthCallbackUrl({
  origin,
  appBasePath: '/Reedkt/',
  returnTo: '/projects/project-1/edits/edit-1?from=google#review',
})
assert.equal(
  callback,
  'https://app.reeditpro.com/Reedkt/sign-in?returnTo=%2Fprojects%2Fproject-1%2Fedits%2Fedit-1%3Ffrom%3Dgoogle%23review',
)
assert.equal(
  buildGoogleOAuthCallbackUrl({
    origin,
    appBasePath: '/Reedkt/',
    returnTo: 'https://evil.example/collect',
  }),
  'https://app.reeditpro.com/Reedkt/sign-in?returnTo=%2Fdashboard',
)
assert.equal(normalizeAppBasePath('/Reedkt'), '/Reedkt/')
assert.equal(normalizeAppBasePath('//evil.example'), '/')
assert.equal(appRouterBasename('/Reedkt/'), '/Reedkt')
assert.equal(appRouterBasename('/'), '/')
assert.equal(
  readGoogleOAuthCallbackError('?error=access_denied&error_description=hidden', ''),
  'Google sign-in was cancelled. Try again when you are ready.',
)
assert.equal(
  readGoogleOAuthCallbackError('', '#error=server_error&error_description=hidden'),
  'Google sign-in could not be completed. Try again, or use email and password.',
)

const trustedProviderUrl = `https://oauth-fixture.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callback)}`
assert.equal(
  validateGoogleProviderHandoffUrl({
    callback: new URL(callback),
    providerUrl: trustedProviderUrl,
    supabaseUrl: 'https://oauth-fixture.supabase.co',
  })?.toString(),
  trustedProviderUrl,
)
for (const providerUrl of [
  `https://evil.example/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callback)}`,
  `https://oauth-fixture.supabase.co/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(callback)}`,
  `https://oauth-fixture.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent('https://evil.example/sign-in')}`,
  `http://oauth-fixture.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callback)}`,
]) {
  assert.equal(validateGoogleProviderHandoffUrl({
    callback: new URL(callback),
    providerUrl,
    supabaseUrl: 'https://oauth-fixture.supabase.co',
  }), undefined)
}
const localCallback = new URL('http://127.0.0.1:5201/sign-in?returnTo=%2Fdashboard')
assert.ok(validateGoogleProviderHandoffUrl({
  callback: localCallback,
  providerUrl: `http://127.0.0.1:54321/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(localCallback.toString())}`,
  supabaseUrl: 'http://127.0.0.1:54321',
}))

process.env.VITE_SUPABASE_URL = 'https://oauth-fixture.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'fixture-public-anon-key'
const { signInWithGoogleOAuth } = await import('../../src/backend/auth/auth-client-service')
const handoff = await signInWithGoogleOAuth(callback, origin)
assert.equal(handoff.ok, true)
assert.equal(handoff.mode, 'supabase_frontend')
assert.equal(handoff.status, 'signed_out')
assert.ok(handoff.oauthRedirectUrl)
const authorizeUrl = new URL(handoff.oauthRedirectUrl)
assert.equal(authorizeUrl.origin, 'https://oauth-fixture.supabase.co')
assert.equal(authorizeUrl.pathname, '/auth/v1/authorize')
assert.equal(authorizeUrl.searchParams.get('provider'), 'google')
assert.equal(authorizeUrl.searchParams.get('redirect_to'), callback)
assert.doesNotMatch(handoff.oauthRedirectUrl, /fixture-public-anon-key/)

const crossOrigin = await signInWithGoogleOAuth(
  'https://evil.example/sign-in?returnTo=%2Fdashboard',
  origin,
)
assert.equal(crossOrigin.ok, false)
assert.match(crossOrigin.message, /return address is not trusted/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'google-oauth-sign-in',
  checks: [
    'github_pages_base_path_normalized',
    'internal_return_path_sanitized',
    'external_return_target_rejected',
    'google_provider_authorize_url_constructed_without_network_or_secret',
    'returned_provider_url_origin_provider_endpoint_and_callback_verified_before_navigation',
    'cross_origin_callback_rejected_before_provider_handoff',
    'provider_error_details_not_exposed',
  ],
}, null, 2))
