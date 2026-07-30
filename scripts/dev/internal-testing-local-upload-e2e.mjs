#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')
const apiPort = Number.parseInt(process.env.REEDITPRO_LOCAL_UPLOAD_API_PORT ?? '9781', 10)
const appPort = Number.parseInt(process.env.REEDITPRO_LOCAL_UPLOAD_APP_PORT ?? '5179', 10)
const localStorageRoot = process.env.REEDITPRO_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-playwright'
const realVideoFixturePath = process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim()
const fixtureRoot = path.join(repoRoot, 'test-results', 'project-source-video-real-local-api')
const sharedSyntheticFixtureRoot = path.join(repoRoot, 'test-results', 'internal-testing-local-upload-e2e')
const sharedSyntheticFixturePath = path.join(sharedSyntheticFixtureRoot, 'internal-testing-local-upload-e2e.mp4')
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const playwrightBin = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'playwright.cmd' : 'playwright')
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx')
const canonicalV3Directory = path.join(repoRoot, 'database', 'canonical-v3-local')
const canonicalV3DatabaseUrl = 'postgresql://postgres:postgres@127.0.0.1:57432/postgres'
const canonicalV3ApiUrl = 'http://127.0.0.1:57431'
const canonicalV3User = {
  id: '11111111-1111-4111-8111-111111111111',
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  email: 'owner-a@example.test',
  password: 'Canonical-V3-Browser-Only-2026!',
  displayName: 'Owner A',
}
const args = process.argv.slice(2)
const privateReviewMode = args.includes('--private-review')
const supabaseAuthMode = args.includes('--supabase-auth')
const kimiMode = args.includes('--kimi')
const internalKimiSecretReference =
  'projects/reeditpro/secrets/reeditpro-prod-kimi-api-key/versions/2'
const internalOpenAiSecretReference =
  'projects/reeditpro/secrets/reeditpro-prod-openai-api-key/versions/2'
const unknownArgs = process.argv.slice(2).filter(
  (arg) =>
    arg !== '--private-review'
    && arg !== '--supabase-auth'
    && arg !== '--kimi',
)
if (unknownArgs.length > 0) {
  throw new Error(`Unsupported local upload E2E argument: ${unknownArgs[0]}`)
}
const playwrightSpecs = privateReviewMode
  ? ['tests/e2e/project-private-review-local-api.spec.ts']
  : [
      'tests/e2e/project-source-video-backend-upload-local-api.spec.ts',
      'tests/e2e/project-create-edit-upload-local-api.spec.ts',
    ]
const internalServiceToken = privateReviewMode || supabaseAuthMode
  ? randomBytes(32).toString('base64url')
  : ''
const uploadTargetCredentialKey = supabaseAuthMode
  ? randomBytes(32).toString('base64url')
  : ''
const apiBaseUrl = `http://127.0.0.1:${apiPort}`
const appBaseUrl = `http://127.0.0.1:${appPort}`

const children = []
const expectedServerStops = new WeakSet()
let shuttingDown = false
let serverFailure
let canonicalV3Prepared = false
let canonicalV3Runtime

function assertPort(name, value) {
  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(`${name} must be a valid TCP port.`)
  }
}

function assertExecutable(command, label) {
  const result = spawnSync(command, ['-version'], { stdio: 'ignore' })
  if (result.status !== 0) {
    throw new Error(`${label} is required for the local upload E2E verifier. Install it locally, then rerun this command.`)
  }
}

function assertVersionedExecutable(command, label) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' })
  if (result.status !== 0) {
    throw new Error(`${label} is required for the Supabase-authenticated local E2E verifier.`)
  }
}

function localOnlyCommandEnvironment(overrides = {}) {
  const environment = {
    ...process.env,
    ...overrides,
  }
  delete environment.SUPABASE_ACCESS_TOKEN
  return environment
}

function runLocalOnlyCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: localOnlyCommandEnvironment(options.env),
    encoding: options.encoding,
    stdio: options.stdio,
  })
  if (result.status !== 0) {
    throw new Error(`${options.label ?? command} failed in the canonical loopback-only Supabase harness.`)
  }
  return result
}

function readCanonicalV3Status() {
  const result = runLocalOnlyCommand(
    'supabase',
    ['--workdir', canonicalV3Directory, 'status', '--output', 'json'],
    {
      encoding: 'utf8',
      label: 'Canonical V3 local Supabase status',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  const status = JSON.parse(result.stdout)
  if (
    status.API_URL !== canonicalV3ApiUrl ||
    typeof status.ANON_KEY !== 'string' ||
    !status.ANON_KEY ||
    typeof status.JWT_SECRET !== 'string' ||
    status.JWT_SECRET.length < 32 ||
    typeof status.SERVICE_ROLE_KEY !== 'string' ||
    !status.SERVICE_ROLE_KEY
  ) {
    throw new Error('Canonical V3 local Supabase status did not match the reviewed loopback contract.')
  }
  return {
    apiUrl: status.API_URL,
    anonKey: status.ANON_KEY,
    jwtSecret: status.JWT_SECRET,
    serviceRoleKey: status.SERVICE_ROLE_KEY,
  }
}

function prepareCanonicalV3SupabaseAuth() {
  assertVersionedExecutable('supabase', 'Supabase CLI')
  assertVersionedExecutable('psql', 'PostgreSQL psql')

  const status = spawnSync(
    'supabase',
    ['--workdir', canonicalV3Directory, 'status'],
    {
      cwd: repoRoot,
      env: localOnlyCommandEnvironment(),
      stdio: 'ignore',
    },
  )
  if (status.status === 0) {
    runLocalOnlyCommand(
      'supabase',
      ['--workdir', canonicalV3Directory, 'stop', '--no-backup'],
      { label: 'Canonical V3 local Supabase restart stop', stdio: 'ignore' },
    )
  }
  runLocalOnlyCommand(
    'supabase',
    ['--workdir', canonicalV3Directory, 'start'],
    { label: 'Canonical V3 local Supabase start', stdio: 'ignore' },
  )
  runLocalOnlyCommand(
    'supabase',
    ['--workdir', canonicalV3Directory, 'db', 'reset', '--local', '--no-seed'],
    { label: 'Canonical V3 local database reset', stdio: 'ignore' },
  )
  canonicalV3Runtime = readCanonicalV3Status()
  runLocalOnlyCommand(
    tsxBin,
    [path.join(canonicalV3Directory, 'setup-local-auth-users.ts')],
    {
      env: {
        REEDITPRO_CANONICAL_V3_API_URL: canonicalV3Runtime.apiUrl,
        REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY:
          canonicalV3Runtime.serviceRoleKey,
      },
      label: 'Canonical V3 local Auth user provisioning',
      stdio: 'ignore',
    },
  )
  runLocalOnlyCommand(
    'psql',
    [
      canonicalV3DatabaseUrl,
      '-X',
      '-q',
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      path.join(canonicalV3Directory, 'tests', '_fixture.sql'),
    ],
    {
      label: 'Canonical V3 local tenant fixture',
      stdio: 'ignore',
    },
  )
  canonicalV3Prepared = true
}

async function verifyCanonicalV3PasswordAuthBoundary() {
  if (!canonicalV3Runtime) {
    throw new Error('Canonical V3 local Supabase runtime was not prepared.')
  }
  const signInResponse = await fetch(
    `${canonicalV3Runtime.apiUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        apikey: canonicalV3Runtime.anonKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: canonicalV3User.email,
        password: canonicalV3User.password,
      }),
      signal: AbortSignal.timeout(15_000),
    },
  )
  const signInPayload = await signInResponse.json().catch(() => null)
  if (
    !signInResponse.ok ||
    signInPayload?.user?.id !== canonicalV3User.id ||
    typeof signInPayload?.access_token !== 'string'
  ) {
    throw new Error(
      'Canonical V3 local password grant did not authenticate the reviewed user.',
    )
  }

  const signupResponse = await fetch(
    `${canonicalV3Runtime.apiUrl}/auth/v1/signup`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        apikey: canonicalV3Runtime.anonKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: `blocked-signup-${Date.now()}@example.test`,
        password: 'Blocked-Canonical-V3-Signup-2026!',
      }),
      signal: AbortSignal.timeout(15_000),
    },
  )
  if (signupResponse.ok) {
    throw new Error(
      'Canonical V3 local browser signup must remain disabled.',
    )
  }
  return signInPayload.access_token
}

function cleanupCanonicalV3SupabaseAuth() {
  if (!canonicalV3Prepared) return
  runLocalOnlyCommand(
    'supabase',
    ['--workdir', canonicalV3Directory, 'db', 'reset', '--local', '--no-seed'],
    { label: 'Canonical V3 local cleanup reset', stdio: 'ignore' },
  )
  canonicalV3Prepared = false
  canonicalV3Runtime = undefined
}

function assertLocalPlaywright() {
  if (!existsSync(playwrightBin)) {
    throw new Error('Local Playwright binary is missing. Run npm ci before npm run test:internal-testing:local-upload-e2e.')
  }
}

function spawnServer(label, args, env) {
  const child = spawn(npmBin, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => process.stdout.write(`[${label}] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[${label}] ${chunk}`))
  child.on('exit', (code, signal) => {
    if (shuttingDown || expectedServerStops.has(child)) return
    serverFailure = new Error(`${label} exited before verification completed (${signal ?? code}).`)
  })

  children.push(child)
  return child
}

function stopServerForRestart(child, label) {
  return new Promise((resolve, reject) => {
    if (!child || child.exitCode !== null || child.signalCode !== null) {
      resolve()
      return
    }
    expectedServerStops.add(child)
    const timeout = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
      reject(new Error(`${label} did not stop for the restart proof.`))
    }, 15_000)
    child.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })
    child.kill('SIGTERM')
  })
}

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1_000)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function waitForHttp(
  url,
  label,
  timeoutMs = privateReviewMode ? 30 * 60_000 : 60_000,
) {
  const startedAt = Date.now()
  let lastError

  while (Date.now() - startedAt < timeoutMs) {
    if (serverFailure) throw serverFailure

    try {
      const response = await fetchWithTimeout(url)
      if (response.ok) return
      lastError = new Error(`${label} returned HTTP ${response.status}.`)
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`${label} did not become ready at ${url}. ${lastError instanceof Error ? lastError.message : ''}`.trim())
}

function buildPrivateApiEnvironment() {
  return {
    NODE_ENV: 'development',
    API_PORT: String(apiPort),
    PORT: String(apiPort),
    API_ALLOWED_CORS_ORIGINS: appBaseUrl,
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: supabaseAuthMode ? 'false' : 'true',
    API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE:
      supabaseAuthMode ? 'true' : '',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: path.resolve(repoRoot, localStorageRoot),
    WORKER_RUNTIME_MODE:
      privateReviewMode || supabaseAuthMode ? 'local' : 'mock',
    REEDITPRO_DISABLE_DOTENV: 'true',
    REEDITPRO_PRIVATE_WORKSPACE_HOST: '127.0.0.1',
    REEDITPRO_PRIVATE_WORKSPACE_ENABLE_PRIVATE_REVIEW_RUNTIME:
      privateReviewMode ? 'true' : '',
    REEDITPRO_PRIVATE_WORKSPACE_ENABLE_DURABLE_UPLOAD_TARGET_RUNTIME:
      supabaseAuthMode ? 'true' : '',
    REEDITPRO_PRIVATE_WORKSPACE_UPLOAD_TARGET_SIGNING_SECRET:
      canonicalV3Runtime?.jwtSecret ?? '',
    REEDITPRO_PRIVATE_WORKSPACE_UPLOAD_TARGET_KEY_BASE64URL:
      uploadTargetCredentialKey,
    REEDITPRO_INTERNAL_SERVICE_TOKEN: internalServiceToken,
    SUPABASE_URL: canonicalV3Runtime?.apiUrl ?? '',
    SUPABASE_ANON_KEY: canonicalV3Runtime?.anonKey ?? '',
    SUPABASE_SERVICE_ROLE_KEY: canonicalV3Runtime?.serviceRoleKey ?? '',
    GOOGLE_CLOUD_PROJECT_ID: '',
    GCS_SOURCE_MEDIA_BUCKET: '',
    REEDITPRO_KIMI_RUNTIME_MODE:
      kimiMode ? 'internal_test' : 'disabled',
    GOOGLE_SECRET_KIMI_API_KEY_NAME:
      kimiMode ? internalKimiSecretReference : '',
    REEDITPRO_OPENAI_RUNTIME_MODE:
      kimiMode ? 'internal_test' : 'disabled',
    GOOGLE_SECRET_OPENAI_API_KEY_NAME:
      kimiMode ? internalOpenAiSecretReference : '',
  }
}

async function postPrivateApiJson(pathname, accessToken, idempotencyKey, body) {
  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  const envelope = await response.json().catch(() => null)
  if (!response.ok || envelope?.ok !== true) {
    throw new Error(
      `Private API ${pathname} failed during restart proof with HTTP ${response.status}.`,
    )
  }
  return envelope
}

async function verifyDurableUploadTargetApiRestart({
  accessToken,
  apiChild,
  apiEnvironment,
}) {
  const projectEnvelope = await postPrivateApiJson(
    '/v1/projects',
    accessToken,
    'canonical-upload-target-api-restart-project-key-v1',
    {
      workspaceId: canonicalV3User.workspaceId,
      name: 'Canonical upload-target API restart proof',
      description:
        'Private loopback proof only; no object bytes, editing, rendering, credits, or delivery.',
    },
  )
  const projectId = projectEnvelope?.data?.project?.id
  if (typeof projectId !== 'string' || !projectId) {
    throw new Error('Private API restart proof did not create a canonical project.')
  }
  const intentPath = `/v1/projects/${encodeURIComponent(projectId)}/upload-intents`
  const intentBody = {
    workspaceId: canonicalV3User.workspaceId,
    chatSessionId: 'canonical-upload-target-api-restart-proof',
    uploadPurpose: 'source_media',
    originalFileName: 'restart-proof-source.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: 1_024,
  }
  const intentKey = 'canonical-upload-target-api-restart-intent-key-v1'
  const first = await postPrivateApiJson(
    intentPath,
    accessToken,
    intentKey,
    intentBody,
  )
  assertCanonicalTargetDisposition(first, 'issued')

  await stopServerForRestart(apiChild, 'Private API')
  const restartedApi = spawnServer(
    'api-restarted',
    ['run', 'dev:private-workspace:api'],
    apiEnvironment,
  )
  await waitForHttp(`${apiBaseUrl}/health`, 'Restarted API')

  const replay = await postPrivateApiJson(
    intentPath,
    accessToken,
    intentKey,
    intentBody,
  )
  assertCanonicalTargetDisposition(replay, 'recovered_exact_target')
  if (
    JSON.stringify(replay.data?.uploadIntent)
      !== JSON.stringify(first.data?.uploadIntent)
    || JSON.stringify(replay.data?.uploadTarget)
      !== JSON.stringify(first.data?.uploadTarget)
  ) {
    throw new Error(
      'The restarted private API did not recover the exact upload intent and temporary target.',
    )
  }
  const uploadUrl = replay.data?.uploadTarget?.uploadUrl
  if (
    typeof uploadUrl !== 'string'
    || !/^\/v1\/upload-intents\/[^/]+\/local-object\?workspaceId=[a-f0-9-]+$/u
      .test(uploadUrl)
  ) {
    throw new Error(
      'The restart proof did not recover the exact bounded local upload route.',
    )
  }
  console.log(
    'Canonical upload-target API restart proof passed: encrypted target recovery returned the exact prior local route without a second target issuance.',
  )
  return restartedApi
}

function assertCanonicalTargetDisposition(envelope, expectedDisposition) {
  const warnings = Array.isArray(envelope?.warnings) ? envelope.warnings : []
  if (
    !warnings.includes(
      `Canonical durable target disposition: ${expectedDisposition}.`,
    )
  ) {
    throw new Error(
      `Private API upload-target disposition was not ${expectedDisposition}.`,
    )
  }
}

function runPlaywright(fixturePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(playwrightBin, [
      'test',
      ...playwrightSpecs,
      '--reporter=line',
    ], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: appBaseUrl,
        PLAYWRIGHT_REUSE_SERVER: 'true',
        PLAYWRIGHT_INTERNAL_TEST_AUTH: supabaseAuthMode ? 'false' : 'true',
        PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API: 'true',
        PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL: apiBaseUrl,
        PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT: localStorageRoot,
        PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH: fixturePath,
        PLAYWRIGHT_PRIVATE_REVIEW_LOCAL_API: privateReviewMode ? 'true' : 'false',
        PLAYWRIGHT_REAL_LOCAL_API_AUTH_MODE:
          supabaseAuthMode ? 'supabase' : 'local_test',
        PLAYWRIGHT_REAL_LOCAL_API_USER_ID: canonicalV3User.id,
        PLAYWRIGHT_REAL_LOCAL_API_WORKSPACE_ID: canonicalV3User.workspaceId,
        PLAYWRIGHT_REAL_LOCAL_API_IDENTITY_LABEL: canonicalV3User.displayName,
        PLAYWRIGHT_REAL_LOCAL_API_AUTH_EMAIL: canonicalV3User.email,
        PLAYWRIGHT_REAL_LOCAL_API_AUTH_PASSWORD: canonicalV3User.password,
        PLAYWRIGHT_CANONICAL_DURABLE_UPLOAD_TARGET_EXPECTED:
          supabaseAuthMode ? 'true' : 'false',
        PLAYWRIGHT_KIMI_CHAT_EXPECTED: kimiMode ? 'true' : 'false',
        PLAYWRIGHT_FULL_SOURCE_PRIVATE_REVIEW_EXPECTED:
          realVideoFixturePath ? 'true' : 'false',
      },
      stdio: 'inherit',
    })

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Playwright local upload E2E failed (${signal ?? code}).`))
    })
  })
}

async function cleanupRuntimeArtifacts() {
  await rm(path.join(repoRoot, localStorageRoot), { force: true, recursive: true })
  await rm(fixtureRoot, { force: true, recursive: true })
  await rm(sharedSyntheticFixtureRoot, { force: true, recursive: true })
}

async function preparePlaywrightFixture() {
  if (realVideoFixturePath) return realVideoFixturePath

  await mkdir(sharedSyntheticFixtureRoot, { recursive: true })
  const result = spawnSync('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc=size=320x180:rate=30',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:sample_rate=48000',
    '-t',
    '1',
    '-shortest',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    sharedSyntheticFixturePath,
  ], { stdio: 'pipe' })
  if (result.status !== 0) {
    throw new Error(`FFmpeg failed to create the shared local-upload E2E fixture: ${result.stderr?.toString().trim() ?? 'unknown error'}`)
  }
  const fixtureStat = await stat(sharedSyntheticFixturePath)
  if (!fixtureStat.isFile() || fixtureStat.size <= 0) {
    throw new Error('FFmpeg did not create a non-empty shared local-upload E2E fixture.')
  }
  return sharedSyntheticFixturePath
}

async function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  await new Promise((resolve) => setTimeout(resolve, 500))
  for (const child of children) {
    if (!child.killed) child.kill('SIGKILL')
  }
}

async function main() {
  assertPort('REEDITPRO_LOCAL_UPLOAD_API_PORT', apiPort)
  assertPort('REEDITPRO_LOCAL_UPLOAD_APP_PORT', appPort)
  assertLocalPlaywright()
  if (realVideoFixturePath) {
    if (!existsSync(realVideoFixturePath)) {
      throw new Error(`REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH does not exist: ${realVideoFixturePath}`)
    }
  } else {
    assertExecutable('ffmpeg', 'FFmpeg')
  }

  await cleanupRuntimeArtifacts()
  let canonicalAccessToken
  if (supabaseAuthMode) {
    prepareCanonicalV3SupabaseAuth()
    canonicalAccessToken = await verifyCanonicalV3PasswordAuthBoundary()
  }
  const playwrightFixturePath = await preparePlaywrightFixture()

  console.log('Starting ReEditPro local upload E2E verifier.')
  console.log(`API health: ${apiBaseUrl}/health`)
  console.log(`App sign-in: ${appBaseUrl}/sign-in`)
  console.log(`Storage root: ${path.resolve(repoRoot, localStorageRoot)}`)
  if (realVideoFixturePath) {
    console.log(`Real video fixture: ${playwrightFixturePath}`)
  } else {
    console.log(`Synthetic video fixture: ${playwrightFixturePath}`)
  }
  console.log(`Specs: ${playwrightSpecs.join(', ')}`)
  const providerBoundarySummary = kimiMode
    ? 'Kimi K3 is the primary Chat model and GPT-5.6 Terra is available only through the reviewed eligible-failure fallback policy; both use pinned server-only Secret Manager references. No live Qwen call is allowed.'
    : 'No provider or live Qwen call is allowed.'
  console.log(
    privateReviewMode
      ? supabaseAuthMode
        ? `Mode: real loopback Supabase password sign-in and verified bearer token + RLS workspace membership + active named-edit route + backend-private source upload + canonical plan/approval/work graph + confined private review. Project/media/execution persistence remains private local; ${providerBoundarySummary} No GCS writes, public delivery, external beta, or production.`
        : `Mode: browser-local test sign-in + active named-edit route + reviewed frontend-safe API transport + backend-local source upload + canonical plan/approval/work graph + confined private review. ${providerBoundarySummary} No Supabase writes, GCS writes, public delivery, external beta, or production.`
      : supabaseAuthMode
        ? `Mode: real loopback Supabase password sign-in + signed canonical project creation + authenticated RLS reads + encrypted restart-safe upload target + backend-private source upload + local canonical planning gates. ${providerBoundarySummary} No GCS writes, public delivery, external beta, or production.`
        : `Mode: browser-local test sign-in + active named-edit route + reviewed frontend-safe API transport + backend-local source upload + canonical plan/approval gates. ${providerBoundarySummary} No Supabase writes, GCS writes, public delivery, external beta, or production.`,
  )
  console.log(
    kimiMode
      ? 'Chat model: Kimi K3 primary with GPT-5.6 Terra eligible-failure fallback; both use pinned Google Secret Manager references and no raw key enters the browser.'
      : 'Chat model: disabled; the deterministic persisted server acknowledgement is used.',
  )

  const apiEnvironment = buildPrivateApiEnvironment()
  const apiChild = spawnServer(
    'api',
    ['run', 'dev:private-workspace:api'],
    apiEnvironment,
  )
  await waitForHttp(`${apiBaseUrl}/health`, 'API')
  if (supabaseAuthMode) {
    if (!canonicalAccessToken) {
      throw new Error(
        'Canonical upload-target API restart proof requires a verified user token.',
      )
    }
    await verifyDurableUploadTargetApiRestart({
      accessToken: canonicalAccessToken,
      apiChild,
      apiEnvironment,
    })
  }

  spawnServer('app', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort'], {
    VITE_REEDITPRO_API_BASE_URL: apiBaseUrl,
    VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD: 'true',
    VITE_REEDITPRO_LOCAL_EDIT_PREVIEW_SMOKE: 'true',
    VITE_REEDITPRO_INTERNAL_TEST_AUTH: supabaseAuthMode ? 'false' : 'true',
    VITE_REEDITPRO_AUTH_MODE: supabaseAuthMode ? 'supabase' : 'local_test',
    VITE_SUPABASE_URL: canonicalV3Runtime?.apiUrl ?? '',
    VITE_SUPABASE_ANON_KEY: canonicalV3Runtime?.anonKey ?? '',
    VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID:
      supabaseAuthMode
        ? canonicalV3User.workspaceId
        : 'workspace-internal-testing',
    VITE_REEDITPRO_LOCAL_PRIVATE_UPLOADS: 'true',
    VITE_REEDITPRO_LOCAL_TEST_BACKEND_USER_ID:
      supabaseAuthMode ? canonicalV3User.id : 'mock-user-runtime',
    VITE_REEDITPRO_API_MODE: 'frontend_safe',
  })

  await waitForHttp(`${appBaseUrl}/sign-in`, 'App')
  await runPlaywright(playwrightFixturePath)
  console.log(
    privateReviewMode
      ? `${supabaseAuthMode ? 'Supabase-authenticated local' : 'Local'} private-review E2E verifier passed: sign-in, project creation, named-edit creation, backend-local source finalization, plan creation, approval, canonical package/work execution, private media load, exact caption revision, fresh plan and reapproval, second private render, review acceptance, and verified final download succeeded.`
      : 'Local upload E2E verifier passed: sign-in, project creation, named-edit creation, backend-local source finalization, private source readback, inline Edit Brief, plan creation, approval, and reload checks succeeded.',
  )
}

try {
  await main()
} finally {
  await shutdown()
  await cleanupRuntimeArtifacts()
  cleanupCanonicalV3SupabaseAuth()
}
