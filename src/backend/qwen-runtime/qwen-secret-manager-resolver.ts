import { createHash } from 'node:crypto'
import type { QwenSecretResolutionDiagnostic, QwenSecretResolutionInternalResult } from '../../types'
import { createQwenRuntimeSafetyFlags } from './qwen-runtime-config-service'
import { redactQwenSecretLikeValue } from './qwen-secret-redaction-service'

type SecretManagerClientLike = {
  accessSecretVersion(input: { name: string }): Promise<unknown[]>
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function projectIdFromEnv(env: Record<string, string | undefined>): string | undefined {
  return clean(env.GOOGLE_CLOUD_PROJECT_ID) ?? clean(env.GCLOUD_PROJECT) ?? clean(env.GOOGLE_CLOUD_PROJECT)
}

function resolveSecretVersionName(referenceName: string | undefined, env: Record<string, string | undefined>): string | undefined {
  const cleaned = clean(referenceName)
  if (!cleaned) return undefined
  if (/^projects\/[^/]+\/secrets\/[^/]+\/versions\/[^/]+$/i.test(cleaned)) return cleaned
  if (/^projects\/[^/]+\/secrets\/[^/]+$/i.test(cleaned)) return `${cleaned}/versions/latest`
  const projectId = projectIdFromEnv(env)
  return projectId ? `projects/${projectId}/secrets/${cleaned}/versions/latest` : undefined
}

function fingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12)
}

function diagnostic(input: {
  status: QwenSecretResolutionDiagnostic['status']
  symbolicName: string
  referenceNameConfigured: boolean
  valueAccessed?: boolean
  value?: string
  warning?: string
}): QwenSecretResolutionDiagnostic {
  return {
    ...createQwenRuntimeSafetyFlags(),
    status: input.status,
    symbolicName: input.symbolicName,
    referenceNameConfigured: input.referenceNameConfigured,
    valueAccessed: input.valueAccessed ?? false,
    valueLength: input.value ? input.value.length : undefined,
    redactedFingerprint: input.value ? fingerprint(input.value) : undefined,
    warning: input.warning,
  }
}

async function createSecretManagerClient(): Promise<SecretManagerClientLike> {
  // Keep Secret Manager optional in this recovery baseline. A computed module
  // identifier preserves the backend-only runtime boundary without making an
  // unavailable production SDK a compile-time or browser dependency.
  const moduleName = '@google-cloud/secret-manager'
  const mod = await import(moduleName) as {
    SecretManagerServiceClient: new () => SecretManagerClientLike
  }
  return new mod.SecretManagerServiceClient()
}

export async function resolveQwenSecretManagerValue(input: {
  symbolicName: string
  referenceName?: string
  env?: Record<string, string | undefined>
  client?: SecretManagerClientLike
}): Promise<QwenSecretResolutionInternalResult> {
  const env = input.env ?? process.env
  const referenceNameConfigured = Boolean(clean(input.referenceName))
  const versionName = resolveSecretVersionName(input.referenceName, env)
  if (!referenceNameConfigured) {
    return {
      ...diagnostic({
        status: 'blocked_missing_secret_reference',
        symbolicName: input.symbolicName,
        referenceNameConfigured: false,
        warning: `${input.symbolicName} is not configured.`,
      }),
    }
  }
  if (!versionName) {
    return {
      ...diagnostic({
        status: 'blocked_missing_project',
        symbolicName: input.symbolicName,
        referenceNameConfigured,
        warning: 'Google Cloud project ID is required to resolve a short Secret Manager secret ID.',
      }),
    }
  }

  try {
    const client = input.client ?? await createSecretManagerClient()
    const [version] = await client.accessSecretVersion({ name: versionName })
    const payload = version && typeof version === 'object' ? (version as { payload?: { data?: Uint8Array | Buffer | string | null } }).payload : undefined
    const data = payload?.data
    const value = typeof data === 'string' ? data : Buffer.from(data ?? new Uint8Array()).toString('utf8')
    if (!value.trim()) {
      return {
        ...diagnostic({
          status: 'failed_redacted',
          symbolicName: input.symbolicName,
          referenceNameConfigured,
          warning: 'Secret Manager returned an empty payload.',
        }),
      }
    }
    return {
      ...diagnostic({
        status: 'resolved_no_print',
        symbolicName: input.symbolicName,
        referenceNameConfigured,
        valueAccessed: true,
        value,
      }),
      value,
    }
  } catch (error) {
    const redacted = redactQwenSecretLikeValue(error instanceof Error ? error.message : String(error))
    return {
      ...diagnostic({
        status: 'failed_redacted',
        symbolicName: input.symbolicName,
        referenceNameConfigured,
        warning: redacted.redactedText,
      }),
    }
  }
}

export function resolveQwenDirectEnvSecretValue(input: {
  symbolicName: string
  value?: string
}): QwenSecretResolutionInternalResult {
  const value = clean(input.value)
  if (!value) {
    return {
      ...diagnostic({
        status: 'blocked_missing_secret_reference',
        symbolicName: input.symbolicName,
        referenceNameConfigured: false,
        warning: `${input.symbolicName} is not configured.`,
      }),
    }
  }

  return {
    ...diagnostic({
      status: 'resolved_no_print',
      symbolicName: input.symbolicName,
      referenceNameConfigured: true,
      valueAccessed: true,
      value,
    }),
    value,
  }
}

export function createQwenSecretResolutionPublicDiagnostic(result: QwenSecretResolutionInternalResult): QwenSecretResolutionDiagnostic {
  const publicResult = { ...result }
  delete publicResult.value
  return publicResult
}
