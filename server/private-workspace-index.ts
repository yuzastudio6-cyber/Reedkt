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
] = await Promise.all([
  import('./app'),
  import('./config/env'),
  import('./services/edit-brief-private-workspace-runtime-port'),
  import('./services/edit-reference-exact-edit-apply-runtime-port'),
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

const app = createReeditProApiApp(env, {
  editBriefPrivateWorkspaceRuntimePort:
    createEditBriefPrivateWorkspaceRuntimePort(),
  editReferenceExactEditApplyRuntimePort:
    createEditReferencePrivateWorkspaceExactEditApplyRuntimePort({
      localStorageRoot: env.localStorageRoot,
    }),
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

async function activatePrivateReviewRuntimes(): Promise<void> {
  const [
    { activatePrivateOfflineMediaBinaryRuntime },
    { activatePrivateOfflineLibassCaptionRuntime },
    {
      activatePrivateOfflineRemotionRenderRuntime,
      prepareOfflineRemotionDockerRuntime,
    },
  ] = await Promise.all([
    import('./tool-execution/media-binary-execution'),
    import('./tool-execution/libass-caption-execution'),
    import('./tool-execution/remotion-render-execution'),
  ])

  await Promise.all([
    activatePrivateOfflineMediaBinaryRuntime(),
    activatePrivateOfflineLibassCaptionRuntime(),
    (async () => {
      await prepareOfflineRemotionDockerRuntime()
      await activatePrivateOfflineRemotionRenderRuntime()
    })(),
  ])
}
