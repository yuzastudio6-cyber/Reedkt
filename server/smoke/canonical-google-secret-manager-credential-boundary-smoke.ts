import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import {
  parseCanonicalGoogleSecretManagerReference,
  projectCanonicalGoogleSecretManagerReferenceForPublicDiagnostics,
} from '../../src/types/canonical-google-secret-manager-reference'
import {
  createQwenSecretResolutionPublicDiagnostic,
  resolveQwenDirectEnvSecretValue,
  resolveQwenSecretManagerValue,
} from '../../src/backend/qwen-runtime/qwen-secret-manager-resolver'
import { createQwenSecretManagerRuntimeSummary } from '../../src/backend/qwen-runtime/qwen-runtime-summary-service'
import { loadQwenRuntimeConfig } from '../../src/backend/qwen-runtime/qwen-runtime-config-service'
import { createQwenLiveBetaPublicReadinessReport } from '../../src/backend/qwen-runtime/qwen-live-beta-service'
import {
  evaluateCanonicalGoogleSecretManagerCredentialBoundary,
  LEGACY_DEPLOY_TIME_SECRET_ENV_BINDING_DISPOSITIONS,
  LEGACY_GITHUB_SECRET_PAYLOAD_DISPOSITIONS,
  LEGACY_LATEST_SECRET_PAYLOAD_PROBE_DISPOSITIONS,
  type CanonicalCredentialReferenceAuthoritySource,
  type CanonicalServerCredentialPurpose,
} from '../security/canonical-google-secret-manager-credential-boundary'

const repoRoot = process.cwd()
const pinnedReference =
  'projects/reeditpro-runtime/secrets/qwen-reasoning-api-key/versions/17'
const fixturePayload = 'fixture-payload-not-a-real-credential'

const acceptedReference = parseCanonicalGoogleSecretManagerReference(pinnedReference)
assert.equal(acceptedReference.ok, true)
if (!acceptedReference.ok) throw new Error('Pinned fixture reference should parse.')
assert.equal(acceptedReference.reference.version, '17')
assert.equal(
  acceptedReference.reference.pinnedPositiveVersionVerified,
  true,
)
assert.deepEqual(
  projectCanonicalGoogleSecretManagerReferenceForPublicDiagnostics(
    acceptedReference.reference,
  ),
  {
    secretId: '[REDACTED_SECRET_ID]',
    version: '17',
    pinnedPositiveVersionVerified: true,
  },
)

const rejectedReferences = [
  [undefined, 'blocked_missing_reference'],
  ['qwen-reasoning-api-key', 'blocked_short_or_name_only_reference'],
  [
    'projects/reeditpro-runtime/secrets/qwen-reasoning-api-key',
    'blocked_short_or_name_only_reference',
  ],
  [
    'projects/reeditpro-runtime/secrets/qwen-reasoning-api-key/versions/latest',
    'blocked_latest_alias',
  ],
  [
    'projects/reeditpro-runtime/secrets/qwen-reasoning-api-key/versions/0',
    'blocked_nonpositive_version',
  ],
  [
    'projects/reeditpro-runtime/secrets/qwen-reasoning-api-key/versions/-1',
    'blocked_malformed_reference',
  ],
] as const

for (const [reference, expectedStatus] of rejectedReferences) {
  const result = parseCanonicalGoogleSecretManagerReference(reference)
  assert.equal(result.ok, false)
  assert.equal(result.status, expectedStatus)
}

const unpinnedQwenConfig = loadQwenRuntimeConfig({
  REEDITPRO_QWEN_RUNTIME_MODE: 'beta_enabled',
  QWEN_REASONING_API_KEY_SECRET: 'qwen-reasoning-api-key',
  QWEN_REASONING_BASE_URL: 'https://qwen.example.invalid',
  QWEN_REASONING_MODEL_ID: 'qwen-fixture-model',
})
assert.equal(unpinnedQwenConfig.status, 'blocked_unpinned_secret_version')
assert.equal(unpinnedQwenConfig.apiKeySecretReferencePinned, false)

const pinnedQwenConfig = loadQwenRuntimeConfig({
  REEDITPRO_QWEN_RUNTIME_MODE: 'beta_enabled',
  QWEN_REASONING_API_KEY_SECRET: pinnedReference,
  QWEN_REASONING_BASE_URL: 'https://qwen.example.invalid',
  QWEN_REASONING_MODEL_ID: 'qwen-fixture-model',
})
assert.equal(pinnedQwenConfig.status, 'ready_for_secret_resolution')
assert.equal(pinnedQwenConfig.apiKeySecretReferencePinned, true)

const purposes: CanonicalServerCredentialPurpose[] = [
  'supabase_service_role_key',
  'provider_model_key',
  'internal_service_token',
  'webhook_signing_secret',
  'signing_private_key',
  'equivalent_server_secret',
]
for (const purpose of purposes) {
  const result = evaluateCanonicalGoogleSecretManagerCredentialBoundary({
    purpose,
    reference: pinnedReference,
    referenceAuthoritySource: 'server_process_configuration',
    runtimeAuthenticationMechanism:
      'application_default_credentials_workload_identity',
  })
  assert.equal(result.status, 'eligible_for_server_worker_resolution_binding')
  assert.equal(result.eligibleForServerWorkerResolutionBinding, true)
  assert.equal(result.liveResolutionAuthorized, false)
  assert.equal(result.productionReady, false)
  assert.equal(result.secretValueAccessed, false)
  assert.equal(result.secretValueLengthProjected, false)
  assert.equal(result.secretFingerprintProjected, false)
  assert.equal(result.sqlServiceRoleGrantIsCredentialStorage, false)
}

const rejectedAuthoritySources: CanonicalCredentialReferenceAuthoritySource[] = [
  'browser_body',
  'browser_header',
  'browser_query',
  'job_payload',
  'database_row',
  'github_secret',
  'direct_env_value',
  'service_account_json',
]
for (const referenceAuthoritySource of rejectedAuthoritySources) {
  const result = evaluateCanonicalGoogleSecretManagerCredentialBoundary({
    purpose: 'provider_model_key',
    reference: pinnedReference,
    referenceAuthoritySource,
    runtimeAuthenticationMechanism:
      'application_default_credentials_workload_identity',
  })
  assert.equal(result.status, 'blocked_non_server_reference_authority')
  assert.equal(result.eligibleForServerWorkerResolutionBinding, false)
  assert.equal(result.browserAuthorityAccepted, false)
  assert.equal(result.jobPayloadAuthorityAccepted, false)
  assert.equal(result.databaseSecretAuthorityAccepted, false)
  assert.equal(result.directEnvProductionAuthorityAccepted, false)
  assert.equal(result.githubSecretProductionAuthorityAccepted, false)
}

const jsonKeyResult = evaluateCanonicalGoogleSecretManagerCredentialBoundary({
  purpose: 'internal_service_token',
  reference: pinnedReference,
  referenceAuthoritySource: 'server_process_configuration',
  runtimeAuthenticationMechanism: 'service_account_json',
})
assert.equal(jsonKeyResult.status, 'blocked_service_account_json')
assert.equal(jsonKeyResult.serviceAccountJsonAccepted, false)

let secretManagerAccessCount = 0
const accessedNames: string[] = []
const secretClient = {
  async accessSecretVersion(input: { name: string }) {
    secretManagerAccessCount += 1
    accessedNames.push(input.name)
    return [{ payload: { data: Buffer.from(fixturePayload) } }]
  },
}
const resolved = await resolveQwenSecretManagerValue({
  symbolicName: 'QWEN_REASONING_API_KEY_SECRET',
  referenceName: pinnedReference,
  client: secretClient,
})
assert.equal(resolved.status, 'resolved_no_print')
assert.equal(resolved.secretAuthorityClass, 'google_secret_manager_pinned_version')
assert.equal(resolved.pinnedVersionVerified, true)
assert.equal(resolved.productionQualificationGranted, false)
assert.equal(secretManagerAccessCount, 1)
assert.deepEqual(accessedNames, [pinnedReference])

const publicDiagnostic = createQwenSecretResolutionPublicDiagnostic(resolved)
const publicJson = JSON.stringify(publicDiagnostic)
assert.equal(Object.hasOwn(publicDiagnostic, 'value'), false)
assert.equal(Object.hasOwn(publicDiagnostic, 'valueAccessed'), false)
assert.equal(Object.hasOwn(publicDiagnostic, 'valueLength'), false)
assert.equal(Object.hasOwn(publicDiagnostic, 'redactedFingerprint'), false)
assert.doesNotMatch(publicJson, new RegExp(fixturePayload))
assert.doesNotMatch(publicJson, /qwen-reasoning-api-key/)
assert.doesNotMatch(publicJson, /projects\/reeditpro-runtime/)
assert.match(publicJson, /REDACTED_SECRET_ID/)
assert.equal(publicDiagnostic.secretVersion, '17')

const publicSummary = createQwenSecretManagerRuntimeSummary(publicDiagnostic)
assert.doesNotMatch(publicSummary, /fingerprint|length|valueAccessed/i)
assert.doesNotMatch(publicSummary, new RegExp(fixturePayload))
assert.match(publicSummary, /productionQualificationGranted false/)

for (const [reference] of rejectedReferences) {
  const result = await resolveQwenSecretManagerValue({
    symbolicName: 'QWEN_REASONING_API_KEY_SECRET',
    referenceName: reference,
    client: secretClient,
  })
  assert.ok([
    'blocked_missing_secret_reference',
    'blocked_unpinned_secret_version',
  ].includes(result.status))
}
assert.equal(
  secretManagerAccessCount,
  1,
  'Rejected references must fail before a Secret Manager client call.',
)

const directEnvDefault = resolveQwenDirectEnvSecretValue({
  symbolicName: 'QWEN_REASONING_API_KEY',
  value: fixturePayload,
  env: { NODE_ENV: 'test' },
})
assert.equal(directEnvDefault.status, 'blocked_direct_env_compatibility')
assert.equal(directEnvDefault.value, undefined)

const directEnvLocal = resolveQwenDirectEnvSecretValue({
  symbolicName: 'QWEN_REASONING_API_KEY',
  value: fixturePayload,
  env: {
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    REEDITPRO_ALLOW_LOCAL_DIRECT_ENV_SECRET_COMPATIBILITY: 'true',
  },
})
assert.equal(directEnvLocal.status, 'resolved_no_print')
assert.equal(directEnvLocal.directEnvCompatibilityOnly, true)
assert.equal(directEnvLocal.productionQualificationGranted, false)

const directEnvPublicReadiness = await createQwenLiveBetaPublicReadinessReport({
  env: {
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    REEDITPRO_QWEN_RUNTIME_MODE: 'beta_enabled',
    REEDITPRO_ALLOW_LOCAL_DIRECT_ENV_SECRET_COMPATIBILITY: 'true',
    QWEN_REASONING_API_KEY: fixturePayload,
    QWEN_REASONING_BASE_URL: 'https://qwen.example.invalid',
    QWEN_REASONING_MODEL_ID: 'qwen-fixture-model',
  },
})
assert.equal(
  directEnvPublicReadiness.status,
  'blocked_noncanonical_secret_authority',
)
assert.equal(directEnvPublicReadiness.ready, false)
const directEnvReadinessJson = JSON.stringify(directEnvPublicReadiness)
assert.doesNotMatch(directEnvReadinessJson, new RegExp(fixturePayload))
assert.doesNotMatch(directEnvReadinessJson, /valueLength|redactedFingerprint/)
assert.match(directEnvReadinessJson, /productionQualificationGranted/)

for (const env of [
  {
    NODE_ENV: 'production',
    REEDITPRO_ALLOW_LOCAL_DIRECT_ENV_SECRET_COMPATIBILITY: 'true',
  },
  {
    E2E_RUNTIME_MODE: 'cloud_run',
    REEDITPRO_ALLOW_LOCAL_DIRECT_ENV_SECRET_COMPATIBILITY: 'true',
  },
  {
    WORKER_RUNTIME_MODE: 'cloud_run',
    REEDITPRO_ALLOW_LOCAL_DIRECT_ENV_SECRET_COMPATIBILITY: 'true',
  },
  {
    K_SERVICE: 'reeditpro-api',
    REEDITPRO_ALLOW_LOCAL_DIRECT_ENV_SECRET_COMPATIBILITY: 'true',
  },
]) {
  const result = resolveQwenDirectEnvSecretValue({
    symbolicName: 'QWEN_REASONING_API_KEY',
    value: fixturePayload,
    env,
  })
  assert.equal(result.status, 'blocked_direct_env_compatibility')
  assert.equal(result.value, undefined)
}

const expectedLegacyGithubPaths = readdirSync(
  join(repoRoot, '.github/workflows'),
)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => `.github/workflows/${file}`)
  .filter((path) => /\$\{\{\s*secrets\.(?:STAGING_SUPABASE_SERVICE_ROLE_KEY|QWEN_REASONING_API_KEY|PROVIDER_GATEWAY_SHARED_SECRET|WORKER_WEBHOOK_SECRET|STAGING_INTERNAL_TESTER_PASSWORD)/.test(
    readFileSync(join(repoRoot, path), 'utf8'),
  ))
  .sort()
assert.deepEqual(
  LEGACY_GITHUB_SECRET_PAYLOAD_DISPOSITIONS.map((item) => item.path).sort(),
  expectedLegacyGithubPaths,
  'Every known GitHub credential-payload workflow must have an explicit noncanonical disposition.',
)
for (const disposition of LEGACY_GITHUB_SECRET_PAYLOAD_DISPOSITIONS) {
  assert.equal(disposition.productionQualificationGranted, false)
  assert.ok(existsSync(join(repoRoot, disposition.path)))
}
for (const disposition of LEGACY_LATEST_SECRET_PAYLOAD_PROBE_DISPOSITIONS) {
  assert.equal(disposition.productionQualificationGranted, false)
  const source = readFileSync(join(repoRoot, disposition.path), 'utf8')
  assert.match(source, /latest|versions access/i)
}
for (const disposition of LEGACY_DEPLOY_TIME_SECRET_ENV_BINDING_DISPOSITIONS) {
  assert.equal(disposition.productionQualificationGranted, false)
  const source = readFileSync(join(repoRoot, disposition.path), 'utf8')
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY|REEDITPRO_INTERNAL_SERVICE_TOKEN/)
}

const resolverSource = readFileSync(
  join(repoRoot, 'src/backend/qwen-runtime/qwen-secret-manager-resolver.ts'),
  'utf8',
)
const summarySource = readFileSync(
  join(repoRoot, 'src/backend/qwen-runtime/qwen-runtime-summary-service.ts'),
  'utf8',
)
const doctorSource = readFileSync(
  join(repoRoot, 'server/cli/qwen-beta-doctor.ts'),
  'utf8',
)
assert.doesNotMatch(resolverSource, /createHash|redactedFingerprint|valueLength/)
assert.doesNotMatch(summarySource, /redactedFingerprint|valueLength/)
assert.doesNotMatch(doctorSource, /redactedFingerprint|valueLength/)

const documentation = readFileSync(
  join(repoRoot, 'docs/canonical-google-secret-manager-credential-boundary-2026-07-22.md'),
  'utf8',
)
for (const phrase of [
  'explicit positive numeric version',
  'Workload Identity',
  'service_role',
  'GitHub Secrets',
  'productionReady=false',
  'No secret\\s+value was read',
]) assert.match(documentation, new RegExp(phrase, 'i'))

const packageJson = readFileSync(join(repoRoot, 'package.json'), 'utf8')
assert.match(
  packageJson,
  /"smoke:canonical-google-secret-manager-credential-boundary": "tsx server\/smoke\/canonical-google-secret-manager-credential-boundary-smoke\.ts"/,
)

console.log(JSON.stringify({
  smoke: 'canonical-google-secret-manager-credential-boundary',
  ok: true,
  acceptedPurposes: purposes.length,
  rejectedReferenceForms: rejectedReferences.length,
  rejectedAuthoritySources: rejectedAuthoritySources.length,
  legacyGithubCredentialPaths: LEGACY_GITHUB_SECRET_PAYLOAD_DISPOSITIONS.length,
  legacyLatestPayloadProbes: LEGACY_LATEST_SECRET_PAYLOAD_PROBE_DISPOSITIONS.length,
  legacyDeployTimeSecretEnvBindings: LEGACY_DEPLOY_TIME_SECRET_ENV_BINDING_DISPOSITIONS.length,
  injectedFixtureSecretClientAccessCount: secretManagerAccessCount,
  realSecretManagerPayloadAccessCount: 0,
  secretValuePrinted: false,
  secretValueLengthProjected: false,
  secretFingerprintProjected: false,
  gcloudCommandRun: false,
  providerCallMade: false,
  remoteMutationMade: false,
  productionReady: false,
}, null, 2))
