import type { QwenSecretResolutionDiagnostic, QwenSecretResolutionInternalResult } from '../../types'
import {
  parseCanonicalGoogleSecretManagerReference,
  projectCanonicalGoogleSecretManagerReferenceForPublicDiagnostics,
  type CanonicalGoogleSecretManagerReference,
} from '../../types/canonical-google-secret-manager-reference'
import { createQwenRuntimeSafetyFlags } from './qwen-runtime-config-service'

type SecretManagerClientLike = {
  accessSecretVersion(input: { name: string }): Promise<unknown[]>
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function diagnostic(input: {
  status: QwenSecretResolutionDiagnostic['status']
  symbolicName: string
  referenceNameConfigured: boolean
  secretAuthorityClass?: QwenSecretResolutionDiagnostic['secretAuthorityClass']
  reference?: CanonicalGoogleSecretManagerReference
  directEnvCompatibilityOnly?: boolean
  valueAccessed?: boolean
  warning?: string
}): QwenSecretResolutionInternalResult {
  const publicReference = input.reference
    ? projectCanonicalGoogleSecretManagerReferenceForPublicDiagnostics(input.reference)
    : undefined
  return {
    ...createQwenRuntimeSafetyFlags(),
    status: input.status,
    symbolicName: input.symbolicName,
    referenceNameConfigured: input.referenceNameConfigured,
    secretAuthorityClass: input.secretAuthorityClass ?? 'none',
    pinnedVersionVerified: input.reference?.pinnedPositiveVersionVerified ?? false,
    directEnvCompatibilityOnly: input.directEnvCompatibilityOnly ?? false,
    productionQualificationGranted: false,
    redactedSecretId: publicReference?.secretId,
    secretVersion: publicReference?.version,
    valueAccessed: input.valueAccessed ?? false,
    warning: input.warning,
  }
}

function directEnvCompatibilityAllowed(
  env: Record<string, string | undefined>,
): boolean {
  const productionLike =
    clean(env.NODE_ENV)?.toLowerCase() === 'production'
    || clean(env.E2E_RUNTIME_MODE)?.toLowerCase() === 'cloud_run'
    || clean(env.WORKER_RUNTIME_MODE)?.toLowerCase() === 'cloud_run'
    || Boolean(clean(env.K_SERVICE))
    || Boolean(clean(env.CLOUD_RUN_JOB))
    || Boolean(clean(env.CLOUD_RUN_EXECUTION))
  return !productionLike
    && clean(env.REEDITPRO_ALLOW_LOCAL_DIRECT_ENV_SECRET_COMPATIBILITY) === 'true'
}

async function createSecretManagerClient(): Promise<SecretManagerClientLike> {
  // Keep Secret Manager optional in this recovery baseline. A computed module
  // identifier preserves the backend-only runtime boundary without making an
  // unavailable production SDK a compile-time or browser dependency.
  const moduleName = '@google-cloud/secret-manager'
  const mod = await import(/* @vite-ignore */ moduleName) as {
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
  const referenceNameConfigured = Boolean(clean(input.referenceName))
  const parsedReference = parseCanonicalGoogleSecretManagerReference(input.referenceName)
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
  if (!parsedReference.ok) {
    return {
      ...diagnostic({
        status: 'blocked_unpinned_secret_version',
        symbolicName: input.symbolicName,
        referenceNameConfigured,
        warning: `Secret Manager reference rejected: ${parsedReference.status}. An explicit positive numeric version is required.`,
      }),
    }
  }
  const reference = parsedReference.reference

  try {
    const client = input.client ?? await createSecretManagerClient()
    const [version] = await client.accessSecretVersion({ name: reference.resourceName })
    const payload = version && typeof version === 'object' ? (version as { payload?: { data?: Uint8Array | Buffer | string | null } }).payload : undefined
    const data = payload?.data
    const value = typeof data === 'string' ? data : Buffer.from(data ?? new Uint8Array()).toString('utf8')
    if (!value.trim()) {
      return {
        ...diagnostic({
          status: 'failed_redacted',
          symbolicName: input.symbolicName,
          referenceNameConfigured,
          secretAuthorityClass: 'google_secret_manager_pinned_version',
          reference,
          warning: 'Secret Manager returned an empty payload.',
        }),
      }
    }
    return {
      ...diagnostic({
        status: 'resolved_no_print',
        symbolicName: input.symbolicName,
        referenceNameConfigured,
        secretAuthorityClass: 'google_secret_manager_pinned_version',
        reference,
        valueAccessed: true,
      }),
      value,
    }
  } catch {
    return {
      ...diagnostic({
        status: 'failed_redacted',
        symbolicName: input.symbolicName,
        referenceNameConfigured,
        secretAuthorityClass: 'google_secret_manager_pinned_version',
        reference,
        warning: 'Secret Manager access failed; details were withheld.',
      }),
    }
  }
}

export function resolveQwenDirectEnvSecretValue(input: {
  symbolicName: string
  value?: string
  env?: Record<string, string | undefined>
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
  if (!directEnvCompatibilityAllowed(input.env ?? process.env)) {
    return {
      ...diagnostic({
        status: 'blocked_direct_env_compatibility',
        symbolicName: input.symbolicName,
        referenceNameConfigured: true,
        secretAuthorityClass: 'direct_env_local_internal_compatibility',
        directEnvCompatibilityOnly: true,
        warning: 'Direct environment credential input is blocked outside explicitly enabled local/internal compatibility.',
      }),
    }
  }

  return {
    ...diagnostic({
      status: 'resolved_no_print',
      symbolicName: input.symbolicName,
      referenceNameConfigured: true,
      secretAuthorityClass: 'direct_env_local_internal_compatibility',
      directEnvCompatibilityOnly: true,
      valueAccessed: true,
    }),
    value,
  }
}

export function createQwenSecretResolutionPublicDiagnostic(result: QwenSecretResolutionInternalResult): QwenSecretResolutionDiagnostic {
  return {
    ...createQwenRuntimeSafetyFlags(),
    status: result.status,
    symbolicName: result.symbolicName,
    referenceNameConfigured: result.referenceNameConfigured,
    secretAuthorityClass: result.secretAuthorityClass,
    pinnedVersionVerified: result.pinnedVersionVerified,
    directEnvCompatibilityOnly: result.directEnvCompatibilityOnly,
    productionQualificationGranted: false,
    redactedSecretId: result.redactedSecretId,
    secretVersion: result.secretVersion,
    warning: result.warning,
  }
}
