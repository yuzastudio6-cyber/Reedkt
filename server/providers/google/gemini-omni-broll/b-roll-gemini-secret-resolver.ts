import { execFile } from 'node:child_process'

import {
  CANONICAL_GOOGLE_GEMINI_EXPECTED_SECRET_ID,
  CANONICAL_GOOGLE_GEMINI_SECRET_REFERENCE_ENV_KEY,
} from '../../../edit-architecture/canonical-provider-work-authority'

export const BROLL_GEMINI_SECRET_RESOLVER_VERSION =
  'b_roll_gemini_secret_resolver_v1' as const

export interface BrollGeminiSecretValueLoader {
  accessSecretVersion(input: { name: string }): Promise<Buffer | Uint8Array | string>
}

export interface BrollGeminiSecretResolver {
  resolveOnce(): Promise<{ apiKey: string }>
  evidence(): {
    schemaVersion: typeof BROLL_GEMINI_SECRET_RESOLVER_VERSION
    configurationKey: typeof CANONICAL_GOOGLE_GEMINI_SECRET_REFERENCE_ENV_KEY
    projectId: string
    secretId: typeof CANONICAL_GOOGLE_GEMINI_EXPECTED_SECRET_ID
    numericVersion: string
    payloadReadCount: 0 | 1
    payloadPersisted: false
    payloadLogged: false
    browserExposureAllowed: false
  }
}

const SECRET_REFERENCE = new RegExp(
  `^projects/([a-z][a-z0-9-]{4,62})/secrets/(${CANONICAL_GOOGLE_GEMINI_EXPECTED_SECRET_ID})/versions/([1-9][0-9]{0,18})$`,
  'u',
)

export function createBrollGeminiSecretResolver(input: {
  pinnedSecretVersionReference: string
  loader: BrollGeminiSecretValueLoader
}): BrollGeminiSecretResolver {
  const match = SECRET_REFERENCE.exec(input.pinnedSecretVersionReference.trim())
  if (!match) {
    throw new Error(
      `${CANONICAL_GOOGLE_GEMINI_SECRET_REFERENCE_ENV_KEY} must pin the approved Gemini secret and numeric version.`,
    )
  }
  const projectId = match[1]!
  const secretId = match[2]! as typeof CANONICAL_GOOGLE_GEMINI_EXPECTED_SECRET_ID
  const numericVersion = match[3]!
  const name = `projects/${projectId}/secrets/${secretId}/versions/${numericVersion}`
  let payloadReadCount: 0 | 1 = 0
  return {
    async resolveOnce() {
      if (payloadReadCount !== 0) {
        throw new Error('Gemini B-roll secret payload may be read only once per transport attempt.')
      }
      payloadReadCount = 1
      let raw: Buffer | Uint8Array | string
      try {
        raw = await input.loader.accessSecretVersion({ name })
      } catch {
        throw new Error('Pinned Gemini Secret Manager version could not be accessed.')
      }
      const apiKey = (typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')).trim()
      if (apiKey.length < 16 || apiKey.length > 8_192 || hasAsciiControlOrWhitespace(apiKey)) {
        throw new Error('Pinned Gemini Secret Manager payload is empty or malformed.')
      }
      return { apiKey }
    },
    evidence() {
      return {
        schemaVersion: BROLL_GEMINI_SECRET_RESOLVER_VERSION,
        configurationKey: CANONICAL_GOOGLE_GEMINI_SECRET_REFERENCE_ENV_KEY,
        projectId,
        secretId,
        numericVersion,
        payloadReadCount,
        payloadPersisted: false,
        payloadLogged: false,
        browserExposureAllowed: false,
      }
    },
  }
}

export function createBrollOwnerMachineGcloudSecretLoader(input: {
  gcloudBinary?: string
  timeoutMs?: number
  commandRunner?: (command: string, args: readonly string[]) => Promise<Buffer | Uint8Array | string>
} = {}): BrollGeminiSecretValueLoader {
  const gcloudBinary = input.gcloudBinary?.trim() || 'gcloud'
  const timeoutMs = input.timeoutMs ?? 20_000
  if (!/^[A-Za-z0-9_./-]{1,512}$/u.test(gcloudBinary) ||
    !Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) {
    throw new Error('Gemini Secret Manager loader configuration is invalid.')
  }
  const runner = input.commandRunner ?? ((command, args) =>
    runGcloud(command, args, timeoutMs))
  return {
    async accessSecretVersion({ name }) {
      const match = SECRET_REFERENCE.exec(name)
      if (!match) throw new Error('Gemini Secret Manager reference is not approved.')
      try {
        return await runner(gcloudBinary, [
          'secrets', 'versions', 'access', match[3]!,
          `--secret=${match[2]!}`,
          `--project=${match[1]!}`,
          '--quiet',
        ])
      } catch {
        throw new Error('Redacted Gemini Secret Manager command failure.')
      }
    },
  }
}

function hasAsciiControlOrWhitespace(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.codePointAt(0) ?? 0
    return code <= 32 || code === 127
  })
}

function runGcloud(
  command: string,
  args: readonly string[],
  timeoutMs: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(command, [...args], {
      encoding: 'buffer',
      maxBuffer: 64 * 1024,
      timeout: timeoutMs,
      windowsHide: true,
      env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' },
    }, (error, stdout) => {
      if (error) {
        reject(new Error('Redacted Gemini Secret Manager command failure.'))
        return
      }
      resolve(Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout))
    })
  })
}
