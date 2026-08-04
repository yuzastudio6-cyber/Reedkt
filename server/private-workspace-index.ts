import process from 'node:process'

process.env.REEDITPRO_DISABLE_DOTENV = 'true'

const host = normalizeLoopbackHost(process.env.REEDITPRO_PRIVATE_WORKSPACE_HOST)
if (process.env.NODE_ENV === 'production') {
  throw new Error('The private workspace API cannot start in production.')
}
if (!host) {
  throw new Error('The private workspace API must bind to an explicit loopback host.')
}

const [
  { createReeditProApiApp },
  { assertRuntimeCanStart, loadRuntimeEnv },
  { createEditBriefPrivateWorkspaceRuntimePort },
  { createEditReferencePrivateWorkspaceExactEditApplyRuntimePort },
  {
    createCanonicalDurableUploadTargetLocalRequestAuthorityFactory,
  },
  {
    createCanonicalPrivateProjectLocalRequestAuthorityFactory,
  },
] = await Promise.all([
  import('./app'),
  import('./config/env'),
  import('./services/edit-brief-private-workspace-runtime-port'),
  import('./services/edit-reference-exact-edit-apply-runtime-port'),
  import(
    './upload-target-authority/canonical-durable-upload-target-request-factory'
  ),
  import(
    './project-authority/canonical-private-project-request-authority'
  ),
])

const env = loadRuntimeEnv()
assertRuntimeCanStart(env)

const localMockBoundarySatisfied =
  env.mode !== 'local'
    ? false
    : env.allowMockWithoutSupabase
      && env.mockOnly
      && env.storageMode === 'local'
      && !env.hasSupabaseAdmin
const canonicalLoopbackSupabaseBoundarySatisfied =
  env.mode === 'local'
  && !env.allowMockWithoutSupabase
  && env.allowInternalTestExecutionWithSupabase
  && !env.mockOnly
  && env.storageMode === 'local'
  && env.hasSupabaseAdmin
  && env.hasSupabasePublic
  && env.supabaseUrl === 'http://127.0.0.1:57431'

if (
  !localMockBoundarySatisfied
  && !canonicalLoopbackSupabaseBoundarySatisfied
) {
  throw new Error('The private workspace API safety boundary is not satisfied.')
}

const privateReviewRuntimeEnabled =
  process.env.REEDITPRO_PRIVATE_WORKSPACE_ENABLE_PRIVATE_REVIEW_RUNTIME === 'true'
if (
  process.env.REEDITPRO_PRIVATE_WORKSPACE_ENABLE_PRIVATE_REVIEW_RUNTIME &&
  !privateReviewRuntimeEnabled
) {
  throw new Error(
    'The private workspace review runtime flag must be exactly "true" when provided.',
  )
}
if (privateReviewRuntimeEnabled) {
  if (!env.internalServiceToken || Buffer.byteLength(env.internalServiceToken, 'utf8') < 32) {
    throw new Error(
      'The private workspace review runtime requires a strong server-only internal service token.',
    )
  }
  await activatePrivateReviewRuntimes()
}

const durableUploadTargetRuntimeEnabled =
  process.env
    .REEDITPRO_PRIVATE_WORKSPACE_ENABLE_DURABLE_UPLOAD_TARGET_RUNTIME
    === 'true'
if (
  process.env
    .REEDITPRO_PRIVATE_WORKSPACE_ENABLE_DURABLE_UPLOAD_TARGET_RUNTIME
  && !durableUploadTargetRuntimeEnabled
) {
  throw new Error(
    'The private workspace durable upload-target runtime flag must be exactly "true" when provided.',
  )
}
const durableUploadTargetRequestAuthorityFactory =
  durableUploadTargetRuntimeEnabled
    ? createDurableUploadTargetRequestAuthorityFactory()
    : undefined
const canonicalPrivateProjectRequestAuthorityFactory =
  durableUploadTargetRuntimeEnabled
    ? createPrivateProjectRequestAuthorityFactory()
    : undefined

const app = createReeditProApiApp(env, {
  editBriefPrivateWorkspaceRuntimePort:
    createEditBriefPrivateWorkspaceRuntimePort(),
  editReferenceExactEditApplyRuntimePort:
    createEditReferencePrivateWorkspaceExactEditApplyRuntimePort({
      localStorageRoot: env.localStorageRoot,
    }),
  ...(durableUploadTargetRequestAuthorityFactory
    ? {
        canonicalDurableUploadTargetRequestAuthorityFactory:
          durableUploadTargetRequestAuthorityFactory,
      }
    : {}),
  ...(canonicalPrivateProjectRequestAuthorityFactory
    ? {
        canonicalPrivateProjectRequestAuthorityFactory,
      }
    : {}),
})
app.listen(env.apiPort, host, () => {
  console.log(`ReeditPro private API listening on http://${formatHost(host)}:${env.apiPort}.`)
  if (canonicalLoopbackSupabaseBoundarySatisfied) {
    console.log(
      'Canonical loopback Supabase authentication is active for this private process.',
    )
  }
  if (privateReviewRuntimeEnabled) {
    console.log(
      'Canonical private-review execution is active for this loopback-only process.',
    )
  }
  if (durableUploadTargetRequestAuthorityFactory) {
    console.log(
      'Encrypted restart-safe canonical upload-target recovery is active for this loopback-only process.',
    )
  }
  if (canonicalPrivateProjectRequestAuthorityFactory) {
    console.log(
      'Signed canonical project creation and authenticated RLS reads are active for this loopback-only process.',
    )
  }
})

function normalizeLoopbackHost(value: string | undefined): '127.0.0.1' | 'localhost' | '::1' | undefined {
  const normalized = value?.trim().toLowerCase().replace(/^\[|\]$/g, '')
  if (normalized === '127.0.0.1' || normalized === 'localhost' || normalized === '::1') {
    return normalized
  }
  return undefined
}

function formatHost(value: string): string {
  return value === '::1' ? '[::1]' : value
}

function createDurableUploadTargetRequestAuthorityFactory() {
  if (
    !canonicalLoopbackSupabaseBoundarySatisfied
    || env.supabaseUrl !== 'http://127.0.0.1:57431'
    || !env.supabaseAnonKey
  ) {
    throw new Error(
      'The private workspace durable upload-target runtime requires the canonical loopback Supabase boundary.',
    )
  }
  const signingSecret =
    process.env
      .REEDITPRO_PRIVATE_WORKSPACE_UPLOAD_TARGET_SIGNING_SECRET
      ?.trim()
  if (!signingSecret || Buffer.byteLength(signingSecret, 'utf8') < 32) {
    throw new Error(
      'The private workspace durable upload-target runtime requires its server-only local signing secret.',
    )
  }
  const keyMaterial = decodeExactBase64UrlKey(
    process.env.REEDITPRO_PRIVATE_WORKSPACE_UPLOAD_TARGET_KEY_BASE64URL,
  )
  try {
    return createCanonicalDurableUploadTargetLocalRequestAuthorityFactory({
      endpointOrigin: env.supabaseUrl,
      anonKey: env.supabaseAnonKey,
      localInternalSigningSecret: signingSecret,
      localCredentialKeyVersionId:
        'private_workspace_upload_target_key_v1',
      localCredentialKeyMaterial: keyMaterial,
    })
  } finally {
    keyMaterial.fill(0)
  }
}

function createPrivateProjectRequestAuthorityFactory() {
  if (
    !canonicalLoopbackSupabaseBoundarySatisfied
    || env.supabaseUrl !== 'http://127.0.0.1:57431'
    || !env.supabaseAnonKey
  ) {
    throw new Error(
      'The private workspace project authority requires the canonical loopback Supabase boundary.',
    )
  }
  const signingSecret =
    process.env
      .REEDITPRO_PRIVATE_WORKSPACE_UPLOAD_TARGET_SIGNING_SECRET
      ?.trim()
  if (!signingSecret || Buffer.byteLength(signingSecret, 'utf8') < 32) {
    throw new Error(
      'The private workspace project authority requires its server-only local signing secret.',
    )
  }
  return createCanonicalPrivateProjectLocalRequestAuthorityFactory({
    endpointOrigin: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
    localInternalSigningSecret: signingSecret,
  })
}

function decodeExactBase64UrlKey(value: string | undefined): Buffer {
  const normalized = value?.trim()
  if (!normalized || !/^[A-Za-z0-9_-]{43}$/u.test(normalized)) {
    throw new Error(
      'The private workspace durable upload-target key must be one exact unpadded 32-byte base64url value.',
    )
  }
  const decoded = Buffer.from(normalized, 'base64url')
  if (
    decoded.byteLength !== 32
    || decoded.toString('base64url') !== normalized
  ) {
    decoded.fill(0)
    throw new Error(
      'The private workspace durable upload-target key material is invalid.',
    )
  }
  return decoded
}

async function activatePrivateReviewRuntimes(): Promise<void> {
  const {
    activateCompletePrivateInternalToolRuntimeSet,
  } = await import('./tool-execution/private-internal-tool-runtime-activation')
  const report = await activateCompletePrivateInternalToolRuntimeSet()
  if (
    !report.readiness.allCanonicalToolsReady
    || !report.readiness.privateInternalExecutionReady
    || report.tools.some(
      (tool) => tool.status !== 'ready_for_private_internal_execution',
    )
  ) {
    throw new Error(
      'The private workspace did not activate every verified canonical tool runtime.',
    )
  }
}
