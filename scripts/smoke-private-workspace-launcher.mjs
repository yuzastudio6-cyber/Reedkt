import assert from 'node:assert/strict'
import { resolve } from 'node:path'

import {
  createPrivateWorkspaceCheckSummary,
  createPrivateWorkspaceChildEnvironments,
  createPrivateWorkspaceConfig,
} from './start-private-workspace.mjs'

const root = resolve(process.cwd())
const sourceEnv = {
  PATH: process.env.PATH ?? '',
  NODE_ENV: 'development',
  SUPABASE_SERVICE_ROLE_KEY: 'must-not-propagate',
  OPENAI_API_KEY: 'must-not-propagate',
  STRIPE_SECRET_KEY: 'must-not-propagate',
  VITE_SUPABASE_ANON_KEY: 'must-not-propagate',
}

const config = createPrivateWorkspaceConfig({ args: ['--check'], cwd: root, env: sourceEnv })
const environments = createPrivateWorkspaceChildEnvironments(config, sourceEnv)
const summary = createPrivateWorkspaceCheckSummary(config)
const reviewConfig = createPrivateWorkspaceConfig({
  args: ['--check', '--private-review'],
  cwd: root,
  env: sourceEnv,
})
const reviewEnvironments = createPrivateWorkspaceChildEnvironments(
  reviewConfig,
  sourceEnv,
)
const reviewSummary = createPrivateWorkspaceCheckSummary(reviewConfig)
const kimiConfig = createPrivateWorkspaceConfig({
  args: ['--check', '--kimi'],
  cwd: root,
  env: sourceEnv,
})
const kimiEnvironments = createPrivateWorkspaceChildEnvironments(
  kimiConfig,
  sourceEnv,
)
const kimiSummary = createPrivateWorkspaceCheckSummary(kimiConfig)

assert.equal(config.checkOnly, true)
assert.equal(config.host, '127.0.0.1')
assert.equal(config.webOrigin, 'http://127.0.0.1:5173')
assert.equal(config.apiOrigin, 'http://127.0.0.1:8787')
assert.equal(config.storageRoot, resolve(root, '.reeditpro-local-storage', 'private-workspace'))
assert.equal(environments.serverEnv.E2E_RUNTIME_MODE, 'local')
assert.equal(environments.serverEnv.WORKER_RUNTIME_MODE, 'local')
assert.equal(environments.serverEnv.API_ALLOW_MOCK_WITHOUT_SUPABASE, 'true')
assert.equal(environments.serverEnv.STORAGE_MODE, 'local')
assert.equal(environments.serverEnv.REEDITPRO_DISABLE_DOTENV, 'true')
assert.equal(environments.frontendEnv.VITE_REEDITPRO_AUTH_MODE, 'local_test')
assert.equal(environments.frontendEnv.VITE_REEDITPRO_API_MODE, 'frontend_safe')
assert.equal(environments.frontendEnv.VITE_REEDITPRO_API_BASE_URL, config.webOrigin)
assert.equal(environments.frontendEnv.REEDITPRO_PRIVATE_WORKSPACE_API_ORIGIN, config.apiOrigin)
assert.equal(environments.frontendEnv.VITE_REEDITPRO_LOCAL_PRIVATE_UPLOADS, 'true')
assert.equal(environments.serverEnv.SUPABASE_SERVICE_ROLE_KEY, '')
assert.equal(environments.serverEnv.OPENAI_API_KEY, '')
assert.equal(environments.frontendEnv.STRIPE_SECRET_KEY, '')
assert.equal(environments.frontendEnv.VITE_SUPABASE_ANON_KEY, '')
assert.equal(summary.startsProcesses, false)
assert.equal(summary.externalServices, 'disabled')
assert.equal(summary.apiBrowserTransport, 'same_origin_vite_proxy')
assert.equal(summary.privateReviewRuntime, false)
assert.equal(summary.kimiRuntime, false)
assert.equal(JSON.stringify(summary).includes('must-not-propagate'), false)
assert.equal(reviewConfig.privateReviewRuntime, true)
assert.equal(
  reviewEnvironments.serverEnv.REEDITPRO_PRIVATE_WORKSPACE_ENABLE_PRIVATE_REVIEW_RUNTIME,
  'true',
)
assert.ok(
  Buffer.byteLength(
    reviewEnvironments.serverEnv.REEDITPRO_INTERNAL_SERVICE_TOKEN,
    'utf8',
  ) >= 32,
)
assert.equal(
  reviewEnvironments.frontendEnv.REEDITPRO_INTERNAL_SERVICE_TOKEN,
  undefined,
)
assert.equal(reviewSummary.privateReviewRuntime, true)
assert.equal(kimiSummary.kimiRuntime, true)
assert.equal(kimiSummary.externalServices, 'kimi_k3_only')
assert.equal(
  kimiEnvironments.serverEnv.REEDITPRO_KIMI_RUNTIME_MODE,
  'internal_test',
)
assert.equal(
  kimiEnvironments.serverEnv.GOOGLE_SECRET_KIMI_API_KEY_NAME,
  'projects/reeditpro/secrets/reeditpro-prod-kimi-api-key/versions/2',
)
assert.equal(
  kimiEnvironments.frontendEnv.GOOGLE_SECRET_KIMI_API_KEY_NAME,
  '',
)
assert.equal(
  JSON.stringify(kimiSummary).includes('reeditpro-prod-kimi-api-key'),
  false,
)
assert.equal(
  JSON.stringify(reviewSummary).includes(
    reviewEnvironments.serverEnv.REEDITPRO_INTERNAL_SERVICE_TOKEN,
  ),
  false,
)

assert.throws(
  () => createPrivateWorkspaceConfig({ env: { NODE_ENV: 'production' } }),
  /disabled when NODE_ENV=production/i,
)
assert.throws(
  () => createPrivateWorkspaceConfig({ env: { REEDITPRO_PRIVATE_WORKSPACE_HOST: '0.0.0.0' } }),
  /loopback address/i,
)
assert.throws(
  () => createPrivateWorkspaceConfig({
    env: {
      REEDITPRO_PRIVATE_WORKSPACE_WEB_PORT: '8787',
      REEDITPRO_PRIVATE_WORKSPACE_API_PORT: '8787',
    },
  }),
  /must be different/i,
)
assert.throws(
  () => createPrivateWorkspaceConfig({ env: { REEDITPRO_PRIVATE_WORKSPACE_WEB_PORT: '70000' } }),
  /1 to 65535/i,
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'check_mode_starts_no_processes',
    'loopback_origins_only',
    'production_runtime_rejected',
    'invalid_ports_rejected',
    'isolated_local_storage_selected',
    'local_test_auth_selected',
    'frontend_safe_transport_selected',
    'same_origin_api_proxy_selected',
    'local_private_uploads_selected',
    'provider_free_local_worker_selected',
    'private_review_runtime_requires_explicit_flag',
    'kimi_runtime_requires_explicit_flag',
    'kimi_secret_reference_is_server_only',
    'private_review_internal_secret_is_server_only',
    'external_credentials_scrubbed',
    'safe_summary_contains_no_secret_values',
  ],
}))
