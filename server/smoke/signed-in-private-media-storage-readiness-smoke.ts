import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  createSignedInPrivateMediaStorageProbePlan,
  evaluateSignedInPrivateMediaStorageReadiness,
  REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET,
  SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES,
  SIGNED_IN_PRIVATE_MEDIA_STORAGE_CONTRACT_VERSION,
  signedInPrivateMediaBucketName,
  type SignedInPrivateMediaBucketPurpose,
  type SignedInPrivateMediaStorageProbeId,
  type SignedInPrivateMediaStorageProbeResult,
} from '../config/signed-in-private-media-storage-readiness'
import { assertRuntimeCanStart, loadRuntimeEnv } from '../config/env'

const target = REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET
const plan = createSignedInPrivateMediaStorageProbePlan(target)
const mutationTokens = new Set([
  'add-iam-policy-binding',
  'create',
  'delete',
  'deploy',
  'enable',
  'remove-iam-policy-binding',
  'set-iam-policy',
  'update',
])

assert.equal(plan.length, 3 + SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES.length * 2)
assert.equal(new Set(plan.map((probe) => probe.id)).size, plan.length)
for (const probe of plan) {
  assert.equal(probe.command, 'gcloud')
  assert.equal(probe.readOnly, true)
  assert.equal(probe.args.includes(`--project=${target.projectId}`), true)
  assert.equal(probe.args.includes('--quiet'), true)
  assert.equal(probe.args.some((argument) => mutationTokens.has(argument)), false)
}

const readyResults = fixtureResults()
const ready = evaluateSignedInPrivateMediaStorageReadiness(target, readyResults)
assert.equal(ready.ok, true)
assert.equal(ready.schemaVersion, 1)
assert.equal(ready.contractVersion, SIGNED_IN_PRIVATE_MEDIA_STORAGE_CONTRACT_VERSION)
assert.equal(ready.decision, 'ready_for_same_sha_gateway_storage_configuration')
assert.equal(ready.evidenceClass, 'live_read_only_google_cloud_configuration_evidence')
assert.deepEqual(ready.blockers, [])
assert.deepEqual(Object.values(ready.gates), Object.values(ready.gates).map(() => true))
assert.equal(ready.counts.requiredGoogleApis, 2)
assert.equal(ready.counts.enabledRequiredGoogleApis, 2)
assert.equal(ready.counts.requiredBuckets, 8)
assert.equal(ready.counts.resolvedBuckets, 8)
assert.equal(ready.counts.exactBucketConfigurations, 8)
assert.equal(ready.counts.runtimeBucketRoleBindings, 8)
assert.equal(ready.counts.publicBucketPrincipalBindings, 0)
assert.equal(ready.boundaries.readOnly, true)
assert.equal(ready.boundaries.objectWritten, false)
assert.equal(ready.boundaries.signedUrlCreated, false)
assert.equal(ready.boundaries.resumableSessionCreated, false)
assert.equal(ready.boundaries.cloudMutated, false)
assert.equal(ready.boundaries.largeMediaDistributedFinalizationVerified, false)
assert.equal(ready.boundaries.productionReady, false)

const caseNormalizedCors = evaluateSignedInPrivateMediaStorageReadiness(target, readyResults.map((result) =>
  result.id === 'bucket_source-media'
    ? passed(result.id, bucketFixture('source-media', {
        cors: [{
          origin: [target.appOrigin],
          method: ['get', 'head', 'put'],
          responseHeader: [
            'content-range',
            'content-type',
            'etag',
            'range',
            'X-Goog-Generation',
            'X-Goog-Hash',
            'X-Goog-If-Generation-Match',
            'X-Goog-Metageneration',
          ],
          maxAgeSeconds: 3_600,
        }],
      }))
    : result))
assert.equal(caseNormalizedCors.ok, true)

const missingCors = evaluateSignedInPrivateMediaStorageReadiness(target, readyResults.map((result) =>
  result.id === 'bucket_source-media'
    ? passed(result.id, bucketFixture('source-media', { cors: [] }))
    : result))
assert.equal(missingCors.ok, false)
assert.equal(missingCors.gates.sourceBucketCorsExact, false)
assert.ok(missingCors.blockers.includes('sourceBucketCorsExact'))

const unboundedLifecycle = evaluateSignedInPrivateMediaStorageReadiness(target, readyResults.map((result) =>
  result.id === 'bucket_worker-temp'
    ? passed(result.id, bucketFixture('worker-temp', {
        lifecycle: { rule: [{ action: { type: 'Delete' }, condition: { age: 30 } }] },
      }))
    : result))
assert.equal(unboundedLifecycle.ok, false)
assert.equal(unboundedLifecycle.gates.allBucketsLifecycleBounded, false)

const hostileIam = evaluateSignedInPrivateMediaStorageReadiness(target, readyResults.map((result) =>
  result.id === 'bucket_iam_source-media'
    ? passed(result.id, {
        bindings: [{
          role: 'roles/storage.objectUser',
          members: [`serviceAccount:${target.runtimeServiceAccount}`, 'allUsers'],
        }],
      })
    : result))
assert.equal(hostileIam.ok, false)
assert.equal(hostileIam.gates.publicBucketPrincipalsAbsent, false)
assert.equal(hostileIam.counts.publicBucketPrincipalBindings, 1)
const hostileSerialized = JSON.stringify(hostileIam)
assert.equal(hostileSerialized.includes('allUsers'), false)
assert.equal(hostileSerialized.includes(target.runtimeServiceAccount), false)

const missingSigner = evaluateSignedInPrivateMediaStorageReadiness(target, readyResults.map((result) =>
  result.id === 'runtime_service_account_iam'
    ? passed(result.id, { bindings: [] })
    : result))
assert.equal(missingSigner.ok, false)
assert.equal(missingSigner.gates.runtimeCanSignBlob, false)

const conditionalSourceRole = evaluateSignedInPrivateMediaStorageReadiness(target, readyResults.map((result) =>
  result.id === 'bucket_iam_source-media'
    ? passed(result.id, {
        bindings: [{
          role: 'roles/storage.objectUser',
          members: [`serviceAccount:${target.runtimeServiceAccount}`],
          condition: {
            title: 'not-the-reviewed-unconditional-binding',
            expression: 'request.time < timestamp("2026-07-21T00:00:00Z")',
          },
        }],
      })
    : result))
assert.equal(conditionalSourceRole.ok, false)
assert.equal(conditionalSourceRole.gates.runtimeBucketRolesPresent, false)

const nonStandardStorage = evaluateSignedInPrivateMediaStorageReadiness(target, readyResults.map((result) =>
  result.id === 'bucket_previews'
    ? passed(result.id, bucketFixture('previews', { storageClass: 'NEARLINE' }))
    : result))
assert.equal(nonStandardStorage.ok, false)
assert.equal(nonStandardStorage.gates.allBucketsStandardStorageClass, false)

assert.throws(
  () => createSignedInPrivateMediaStorageProbePlan(
    { ...target, projectId: 'attacker-project' } as unknown as typeof target,
  ),
  /exact reviewed ReEditPro staging lane/i,
)

const productionGcs = loadRuntimeEnv(productionGcsEnvironment('disabled'))
assert.doesNotThrow(() => assertRuntimeCanStart(productionGcs))
assert.equal(productionGcs.largeMediaFinalizationMode, 'disabled')
assert.throws(
  () => assertRuntimeCanStart(loadRuntimeEnv(productionGcsEnvironment('private_local'))),
  /must not use the private single-host authority/i,
)
assert.throws(
  () => assertRuntimeCanStart(loadRuntimeEnv(productionGcsEnvironment('distributed'))),
  /not available in this source build/i,
)
const missingBucketEnvironment = productionGcsEnvironment('disabled')
delete missingBucketEnvironment.GCS_WORKER_TEMP_BUCKET
assert.throws(
  () => assertRuntimeCanStart(loadRuntimeEnv(missingBucketEnvironment)),
  /GCS_WORKER_TEMP_BUCKET/i,
)

const root = process.cwd()
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>
}
const readinessDocument = JSON.parse(readFileSync(
  join(root, 'docs/signed-in-private-media-storage-staging-readiness-2026-07-20.json'),
  'utf8',
)) as Record<string, unknown>
const readinessMarkdown = readFileSync(
  join(root, 'docs/signed-in-private-media-storage-staging-readiness-2026-07-20.md'),
  'utf8',
)
assert.equal(
  packageJson.scripts?.['smoke:signed-in-private-media-storage-readiness'],
  'tsx server/smoke/signed-in-private-media-storage-readiness-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['staging:verify-signed-in-private-media-storage-readiness'],
  'tsx server/cli/verify-signed-in-private-media-storage-readiness.ts',
)
assert.equal(
  readinessDocument.decision,
  'source_contract_ready_remote_activation_not_run_distributed_large_media_finalization_blocked',
)
assert.equal(readinessDocument.contractVersion, SIGNED_IN_PRIVATE_MEDIA_STORAGE_CONTRACT_VERSION)
assert.equal(readinessDocument.activationWorkflowDispatched, false)
assert.equal(readinessDocument.bucketCount, 8)
assert.equal(readinessDocument.gatewayStorageMode, 'gcs')
assert.equal(readinessDocument.gatewayLargeMediaFinalizationMode, 'disabled')
assert.equal(readinessDocument.maximumHostedUploadBytesWithoutDistributedFinalization, 16 * 1024 * 1024)
assert.equal(readinessDocument.remoteConfigurationVerified, false)
assert.equal(readinessDocument.largeMediaDistributedFinalizationVerified, false)
assert.match(readinessMarkdown, /rejected before an upload target or resumable credential is issued/i)
assert.match(readinessMarkdown, /No workflow was dispatched/i)

const workflow = readFileSync(
  join(root, '.github/workflows/signed-in-private-media-storage-staging-activation.yml'),
  'utf8',
)
assert.match(workflow, /ACTIVATE_REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE/)
assert.match(workflow, /ACCEPT_REEDITPRO_PRIVATE_STAGING_STORAGE_COST/)
assert.match(workflow, /source_sha/)
assert.match(workflow, /REEDITPRO_REQUIRE_PRIVATE_MEDIA_STORAGE_READY: "true"/)
assert.match(workflow, /staging:verify-signed-in-private-media-storage-readiness/)
assert.match(workflow, /reeditpro-signed-in-private-media-storage-activation-/)
assert.doesNotMatch(workflow, /allUsers|allAuthenticatedUsers/)
assert.doesNotMatch(workflow, /STRIPE_SECRET_KEY|PROVIDER_GATEWAY_SHARED_SECRET|supabase\s+(?:db|migration|link|push|reset)/i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'signed-in-private-media-storage-readiness',
  readyDecision: ready.decision,
  probeCount: plan.length,
  bucketCount: SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES.length,
  adversarialCases: [
    'missing_source_cors_rejected',
    'cors_method_and_header_case_normalized',
    'wrong_worker_temp_lifecycle_rejected',
    'public_bucket_principal_rejected_without_projection',
    'missing_runtime_sign_blob_authority_rejected',
    'conditional_runtime_bucket_role_rejected',
    'non_standard_storage_class_rejected',
    'target_substitution_rejected',
    'production_private_local_finalizer_rejected',
    'unimplemented_distributed_finalizer_mode_rejected',
    'missing_gcs_bucket_env_rejected_at_startup',
  ],
}, null, 2))

function fixtureResults(): SignedInPrivateMediaStorageProbeResult[] {
  const results: SignedInPrivateMediaStorageProbeResult[] = [
    passed('enabled_services', 'iamcredentials.googleapis.com\nstorage.googleapis.com\n'),
    passed('runtime_service_account', {
      email: target.runtimeServiceAccount,
      disabled: false,
    }),
    passed('runtime_service_account_iam', {
      bindings: [{
        role: 'roles/iam.serviceAccountTokenCreator',
        members: [`serviceAccount:${target.runtimeServiceAccount}`],
      }],
    }),
  ]
  for (const purpose of SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES) {
    results.push(
      passed(`bucket_${purpose}`, bucketFixture(purpose)),
      passed(`bucket_iam_${purpose}`, {
        bindings: [{
          role: purpose === 'source-media'
            ? 'roles/storage.objectUser'
            : 'roles/storage.objectViewer',
          members: [`serviceAccount:${target.runtimeServiceAccount}`],
        }],
      }),
    )
  }
  return results
}

function bucketFixture(
  purpose: SignedInPrivateMediaBucketPurpose,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const lifecycleAge = {
    'source-media': 30,
    'generated-assets': 14,
    'processed-media': 14,
    previews: 7,
    exports: 30,
    thumbnails: 30,
    'qa-artifacts': 14,
    'worker-temp': 1,
  }[purpose]
  return {
    name: signedInPrivateMediaBucketName(target, purpose),
    location: 'US-EAST1',
    storageClass: 'STANDARD',
    iamConfiguration: {
      uniformBucketLevelAccess: { enabled: true },
      publicAccessPrevention: 'enforced',
    },
    labels: { app: 'reeditpro', env: 'staging', lane: 'signed-in-private-media' },
    softDeletePolicy: { retentionDurationSeconds: '604800' },
    versioning: { enabled: false },
    lifecycle: { rule: [{ action: { type: 'Delete' }, condition: { age: lifecycleAge } }] },
    cors: purpose === 'source-media'
      ? [{
          origin: [target.appOrigin],
          method: ['GET', 'HEAD', 'PUT'],
          responseHeader: [
            'Content-Range',
            'Content-Type',
            'ETag',
            'Range',
            'x-goog-generation',
            'x-goog-hash',
            'x-goog-if-generation-match',
            'x-goog-metageneration',
          ],
          maxAgeSeconds: 3_600,
        }]
      : [],
    ...overrides,
  }
}

function passed(
  id: SignedInPrivateMediaStorageProbeId,
  value: string | Record<string, unknown>,
): SignedInPrivateMediaStorageProbeResult {
  const stdout = typeof value === 'string' ? value : JSON.stringify(value)
  return {
    id,
    ok: true,
    exitCode: 0,
    classification: 'passed',
    stdout,
    outputByteCount: Buffer.byteLength(stdout, 'utf8'),
  }
}

function productionGcsEnvironment(
  finalizationMode: 'disabled' | 'private_local' | 'distributed',
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    E2E_RUNTIME_MODE: 'cloud_run',
    WORKER_RUNTIME_MODE: 'disabled',
    STORAGE_MODE: 'gcs',
    REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: finalizationMode,
    REEDITPRO_DISABLE_DOTENV: 'true',
    REEDITPRO_BROWSER_API_TRANSPORT: 'google_api_gateway',
    API_ALLOWED_CORS_ORIGINS: target.appOrigin,
    REEDITPRO_INTERNAL_SERVICE_TOKEN: 'fixture-internal-service-token',
    SUPABASE_URL: 'https://fixture.supabase.co',
    SUPABASE_ANON_KEY: 'fixture-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'fixture-service-role-key',
    GOOGLE_CLOUD_PROJECT_ID: target.projectId,
    GOOGLE_CLOUD_REGION: target.region,
    GCS_DEFAULT_REGION: target.region,
    GCS_SOURCE_MEDIA_BUCKET: signedInPrivateMediaBucketName(target, 'source-media'),
    GCS_GENERATED_ASSETS_BUCKET: signedInPrivateMediaBucketName(target, 'generated-assets'),
    GCS_PROCESSED_MEDIA_BUCKET: signedInPrivateMediaBucketName(target, 'processed-media'),
    GCS_PREVIEWS_BUCKET: signedInPrivateMediaBucketName(target, 'previews'),
    GCS_EXPORTS_BUCKET: signedInPrivateMediaBucketName(target, 'exports'),
    GCS_THUMBNAILS_BUCKET: signedInPrivateMediaBucketName(target, 'thumbnails'),
    GCS_QA_ARTIFACTS_BUCKET: signedInPrivateMediaBucketName(target, 'qa-artifacts'),
    GCS_WORKER_TEMP_BUCKET: signedInPrivateMediaBucketName(target, 'worker-temp'),
  }
}
