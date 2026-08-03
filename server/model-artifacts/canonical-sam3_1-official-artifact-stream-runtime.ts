import { execFile, spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { GoogleAuth } from 'google-auth-library'

import type {
  CanonicalSam31OfficialArtifactStreamPort,
} from './canonical-sam3_1-official-artifact-publication'

export const CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_STREAM_RUNTIME_VERSION =
  'canonical-sam3_1-official-artifact-stream-runtime-v1' as const

const execFileAsync = promisify(execFile)
const EXPECTED_CLOUD_RUN_JOB =
  'weeditpro-sam31-official-artifact-ingest' as const
const SOURCE_REPOSITORY =
  'https://github.com/facebookresearch/sam3.git' as const
const SOURCE_REVISION =
  '96914d2425f90a64f45ca977c2b5165418099543' as const
const SOURCE_TREE = '573deb167702e014829a5b830de8ae62abe891d5' as const
const CHECKPOINT_REPOSITORY = 'facebook/sam3.1' as const
const CHECKPOINT_REVISION =
  'daa63191845a41281374e725f4c9e51c7a824460' as const
const CHECKPOINT_FILE = 'sam3.1_multiplex.pt' as const
const CHECKPOINT_URL =
  `https://huggingface.co/${CHECKPOINT_REPOSITORY}/resolve/${
    CHECKPOINT_REVISION
  }/${CHECKPOINT_FILE}?download=true`
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform'
const MAXIMUM_REDIRECTS = 5
const MAXIMUM_GIT_DIAGNOSTIC_BYTES = 8 * 1024
const SECRET_RESOURCE = new RegExp(
  '^projects/reeditpro/secrets/'
    + '(?:HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN)/versions/'
    + '[1-9][0-9]*$',
  'u',
)
const OFFICIAL_DOWNLOAD_HOST = /^(?:huggingface\.co|cdn-lfs(?:-[a-z0-9-]+)?\.huggingface\.co|cdn-lfs\.hf\.co|cas-bridge\.xethub\.hf\.co)$/u

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

/**
 * Opens official SAM 3.1 artifact streams only inside the dedicated Cloud Run
 * ingest job. The source tree is archived from the exact Git revision in an
 * ephemeral directory. The gated checkpoint token is read from one pinned
 * Secret Manager version and is never attached to a redirect away from the
 * official Hugging Face origin.
 */
export function createCanonicalSam31CloudOfficialArtifactStreamPort(input: {
  readonly secretResourceName: string
  readonly auth?: GoogleAuthRequest
  readonly fetchImpl?: typeof fetch
  readonly runtimeEnvironment?: Readonly<Record<string, string | undefined>>
}): CanonicalSam31OfficialArtifactStreamPort & {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_STREAM_RUNTIME_VERSION
} {
  if (!SECRET_RESOURCE.test(input.secretResourceName)) {
    throw new Error('SAM 3.1 pinned checkpoint secret reference is invalid.')
  }
  const environment = input.runtimeEnvironment ?? process.env
  const assertDedicatedCloudJob = (): void => {
    if (
      environment.CLOUD_RUN_JOB !== EXPECTED_CLOUD_RUN_JOB
      || !safeRuntimeValue(environment.CLOUD_RUN_EXECUTION)
      || environment.CLOUD_RUN_TASK_INDEX !== '0'
      || !safeRuntimeValue(environment.CLOUD_RUN_TASK_ATTEMPT)
    ) throw new Error(
      'SAM 3.1 official artifact ingest is cloud-job-only.',
    )
  }
  const fetchImpl = input.fetchImpl ?? fetch
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const port: CanonicalSam31OfficialArtifactStreamPort & {
    readonly schemaVersion:
      typeof CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_STREAM_RUNTIME_VERSION
  } = {
    schemaVersion: CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_STREAM_RUNTIME_VERSION,
    async openPinnedSourceArchive(value) {
      assertDedicatedCloudJob()
      if (
        value.repository !== SOURCE_REPOSITORY
        || value.revision !== SOURCE_REVISION
        || value.archiveFormat !== 'git_archive_tar_uncompressed'
      ) throw new Error('SAM 3.1 source request is not pinned.')
      return {
        contentType: 'application/x-tar',
        body: await openPinnedGitArchive(),
      }
    },
    async openPinnedCheckpoint(value) {
      assertDedicatedCloudJob()
      if (
        value.repository !== CHECKPOINT_REPOSITORY
        || value.revision !== CHECKPOINT_REVISION
        || value.fileName !== CHECKPOINT_FILE
        || !value.termsAcceptanceRef.contentHash.startsWith('sha256:')
      ) throw new Error('SAM 3.1 checkpoint request is not pinned.')
      const token = await accessPinnedSecret(
        auth,
        input.secretResourceName,
      )
      const response = await fetchOfficialCheckpoint(fetchImpl, token)
      return {
        contentType: 'application/octet-stream',
        body: responseBody(response),
        accessTokenReadFromPinnedSecretVersion: true,
      }
    },
  }
  return Object.freeze(port)
}

async function openPinnedGitArchive(): Promise<AsyncIterable<Uint8Array>> {
  const root = await mkdtemp(join(tmpdir(), 'weeditpro-sam31-source-'))
  try {
    await runGit(['init', '--quiet', root])
    await runGit(['-C', root, 'remote', 'add', 'origin', SOURCE_REPOSITORY])
    await runGit([
      '-C', root, 'fetch', '--quiet', '--depth=1', '--no-tags',
      'origin', SOURCE_REVISION,
    ])
    const revision = (await runGit([
      '-C', root, 'rev-parse', 'FETCH_HEAD',
    ])).trim()
    const tree = (await runGit([
      '-C', root, 'rev-parse', 'FETCH_HEAD^{tree}',
    ])).trim()
    if (revision !== SOURCE_REVISION || tree !== SOURCE_TREE) {
      throw new Error('SAM 3.1 official Git source identity changed.')
    }
    return archiveStream(root)
  } catch (error) {
    await rm(root, { recursive: true, force: true })
    throw error
  }
}

async function* archiveStream(root: string): AsyncIterable<Uint8Array> {
  const child = spawn('git', [
    '-C', root, 'archive', '--format=tar', '--prefix=sam3/', 'FETCH_HEAD',
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: safeGitEnvironment(),
  })
  const exit = new Promise<{ readonly code: number | null; readonly signal: string | null }>(
    (resolve, reject) => {
      child.once('error', reject)
      child.once('close', (code, signal) => resolve({ code, signal }))
    },
  )
  const stderr = collectBoundedDiagnostics(child.stderr)
  try {
    for await (const chunk of child.stdout) {
      if (!(chunk instanceof Uint8Array) || chunk.byteLength === 0) {
        throw new Error('SAM 3.1 Git archive stream is invalid.')
      }
      yield chunk
    }
    const outcome = await exit
    const diagnostic = await stderr
    if (outcome.code !== 0 || outcome.signal !== null) {
      throw new Error(
        diagnostic
          ? 'SAM 3.1 official source archive command failed.'
          : 'SAM 3.1 official source archive command did not complete.',
      )
    }
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await rm(root, { recursive: true, force: true })
  }
}

async function runGit(arguments_: readonly string[]): Promise<string> {
  try {
    const result = await execFileAsync('git', [...arguments_], {
      encoding: 'utf8',
      maxBuffer: MAXIMUM_GIT_DIAGNOSTIC_BYTES,
      timeout: 5 * 60 * 1000,
      env: safeGitEnvironment(),
    })
    return result.stdout
  } catch (error) {
    throw new Error('SAM 3.1 official source acquisition failed.', {
      cause: error,
    })
  }
}

function safeGitEnvironment(): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH,
    HOME: '/tmp',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0',
    GIT_ASKPASS: '/bin/false',
    GIT_SSH_COMMAND: 'false',
    LC_ALL: 'C',
  }
}

async function accessPinnedSecret(
  auth: GoogleAuthRequest,
  resourceName: string,
): Promise<string> {
  const response = await auth.request<{
    readonly payload?: { readonly data?: string }
  }>({
    url: `https://secretmanager.googleapis.com/v1/${resourceName}:access`,
    method: 'GET',
  })
  const encoded = response.data.payload?.data
  const token = encoded
    ? Buffer.from(encoded, 'base64').toString('utf8').trim()
    : ''
  if (!/^hf_[A-Za-z0-9]{20,240}$/u.test(token)) {
    throw new Error('SAM 3.1 checkpoint credential is unavailable.')
  }
  return token
}

async function fetchOfficialCheckpoint(
  fetchImpl: typeof fetch,
  token: string,
): Promise<Response> {
  let url = new URL(CHECKPOINT_URL)
  for (let redirectCount = 0; redirectCount <= MAXIMUM_REDIRECTS;
    redirectCount += 1) {
    if (
      url.protocol !== 'https:'
      || !OFFICIAL_DOWNLOAD_HOST.test(url.hostname)
    ) {
      throw new Error('SAM 3.1 checkpoint redirect host is not approved.')
    }
    const onHuggingFaceOrigin = url.origin === 'https://huggingface.co'
    const response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        Accept: 'application/octet-stream',
        'User-Agent': 'WeEditPro-SAM31-Artifact-Ingest/1.0',
        ...(onHuggingFaceOrigin
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      signal: AbortSignal.timeout(2 * 60 * 60 * 1000),
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location || redirectCount === MAXIMUM_REDIRECTS) {
        throw new Error('SAM 3.1 checkpoint redirect is invalid.')
      }
      url = new URL(location, url)
      continue
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('SAM 3.1 gated checkpoint access is not authorized.')
    }
    if (!response.ok || !response.body) {
      throw new Error('SAM 3.1 official checkpoint download failed.')
    }
    return response
  }
  throw new Error('SAM 3.1 checkpoint redirect limit was exceeded.')
}

function responseBody(response: Response): AsyncIterable<Uint8Array> {
  const body = response.body
  if (!body || typeof body[Symbol.asyncIterator] !== 'function') {
    throw new Error('SAM 3.1 checkpoint response body is unavailable.')
  }
  return body as unknown as AsyncIterable<Uint8Array>
}

async function collectBoundedDiagnostics(
  stream: AsyncIterable<Uint8Array>,
): Promise<string> {
  const chunks: Buffer[] = []
  let byteLength = 0
  for await (const chunk of stream) {
    if (!(chunk instanceof Uint8Array)) continue
    const remaining = MAXIMUM_GIT_DIAGNOSTIC_BYTES - byteLength
    if (remaining <= 0) continue
    const bounded = Buffer.from(chunk).subarray(0, remaining)
    byteLength += bounded.byteLength
    chunks.push(bounded)
  }
  return Buffer.concat(chunks).toString('utf8').trim()
}

function safeRuntimeValue(value: string | undefined): boolean {
  return Boolean(
    value
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)
    && !value.includes('..'),
  )
}
