import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'

import {
  REEDITPRO_LIVE_GCP_RESOURCE_MAP,
  type ReeditProSecretName,
} from '../../../src/backend/cloud/live-gcp-resource-map'
import type { MotionStudioMs010BExecutionAuthorityV1 } from '../../../src/types/motion-studio'
import { validateMotionStudioMs010BExecutionAuthority } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type { MotionStudioProviderCredentialResolver } from './bounded-provider-transport'

export type MotionStudioLiveCredentialProvider = 'openai' | 'alibaba_cloud' | 'minimax'

export interface MotionStudioSecretManagerCredentialVersionBinding {
  provider: MotionStudioLiveCredentialProvider
  credentialReferenceId: string
  projectId: string
  secretName: ReeditProSecretName
  secretVersion: string
}

export interface MotionStudioSecretManagerValueLoader {
  access(input: {
    projectId: string
    secretName: ReeditProSecretName
    secretVersion: string
  }): Promise<Buffer | Uint8Array | string>
}

export interface MotionStudioSecretManagerCredentialResolver extends MotionStudioProviderCredentialResolver {
  describeBindings(): ReadonlyArray<{
    provider: MotionStudioLiveCredentialProvider
    credentialReferenceId: string
    projectId: string
    secretName: ReeditProSecretName
    secretVersion: string
    channel: 'approved_secret_manager'
    valueAccessed: false
    valueCached: false
    browserExposureAllowed: false
    loggingAllowed: false
  }>
}

const EXPECTED_SECRET_BY_PROVIDER = {
  openai: requiredProviderSecret('gpt_image_2'),
  alibaba_cloud: requiredProviderSecret('wan'),
  minimax: requiredProviderSecret('hailuo'),
} as const satisfies Record<MotionStudioLiveCredentialProvider, ReeditProSecretName>

function requiredProviderSecret(route: 'gpt_image_2' | 'wan' | 'hailuo'): ReeditProSecretName {
  const secretName = REEDITPRO_LIVE_GCP_RESOURCE_MAP.providerSecretByRoute[route]
  if (!secretName) throw new Error(`Missing fixed Secret Manager route for ${route}.`)
  return secretName
}

export function createMotionStudioSecretManagerCredentialResolver(input: {
  executionAuthority: MotionStudioMs010BExecutionAuthorityV1
  bindings: readonly MotionStudioSecretManagerCredentialVersionBinding[]
  loader: MotionStudioSecretManagerValueLoader
}): MotionStudioSecretManagerCredentialResolver {
  const authorityValidation = validateMotionStudioMs010BExecutionAuthority(input.executionAuthority)
  if (!authorityValidation.ok) {
    throw invalid(`Live execution authority is invalid: ${authorityValidation.errors.join(' ')}`)
  }
  const bindings = new Map<MotionStudioLiveCredentialProvider, MotionStudioSecretManagerCredentialVersionBinding>()
  for (const binding of input.bindings) {
    assertBinding(binding, input.executionAuthority)
    if (bindings.has(binding.provider)) throw invalid(`Duplicate ${binding.provider} Secret Manager binding.`)
    bindings.set(binding.provider, Object.freeze({ ...binding }))
  }
  for (const provider of Object.keys(EXPECTED_SECRET_BY_PROVIDER) as MotionStudioLiveCredentialProvider[]) {
    if (!bindings.has(provider)) throw blocked(`The ${provider} Secret Manager binding is missing.`)
  }

  return {
    async resolve({ provider, credentialReferenceId }) {
      const binding = bindings.get(provider)
      if (!binding || binding.credentialReferenceId !== credentialReferenceId) {
        throw blocked('The requested provider credential does not match the approved Secret Manager binding.')
      }
      let raw: Buffer | Uint8Array | string
      try {
        raw = await input.loader.access({
          projectId: binding.projectId,
          secretName: binding.secretName,
          secretVersion: binding.secretVersion,
        })
      } catch {
        throw blocked(`The approved ${provider} Secret Manager version could not be accessed.`)
      }
      return { bearerToken: validateSecretValue(raw, provider) }
    },
    describeBindings() {
      return [...bindings.values()].map((binding) => ({
        ...binding,
        channel: 'approved_secret_manager' as const,
        valueAccessed: false as const,
        valueCached: false as const,
        browserExposureAllowed: false as const,
        loggingAllowed: false as const,
      }))
    },
  }
}

/**
 * Owner-machine loader for the bounded acceptance run. It uses an argument-only
 * gcloud invocation, captures stdout in memory, and replaces every command
 * failure with a redacted error. Production Cloud Run should inject a native
 * Secret Manager loader behind the same interface.
 */
export function createOwnerMachineGcloudSecretValueLoader(input: {
  gcloudBinary?: string
  timeoutMs?: number
  commandRunner?: (command: string, args: readonly string[]) => Promise<Buffer | Uint8Array | string>
} = {}): MotionStudioSecretManagerValueLoader {
  const timeoutMs = input.timeoutMs ?? 20_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) {
    throw invalid('Secret Manager command timeout must be between 1 and 30 seconds.')
  }
  const gcloudBinary = input.gcloudBinary?.trim() || 'gcloud'
  if (!/^[A-Za-z0-9_./-]{1,512}$/.test(gcloudBinary)) throw invalid('gcloud binary path is invalid.')
  const runner = input.commandRunner ?? ((command, args) => executeGcloud(command, args, timeoutMs))
  return {
    async access({ projectId, secretName, secretVersion }) {
      assertPinnedSecretVersion(projectId, secretName, secretVersion)
      try {
        return await runner(gcloudBinary, [
          'secrets',
          'versions',
          'access',
          secretVersion,
          `--secret=${secretName}`,
          `--project=${projectId}`,
          '--quiet',
        ])
      } catch {
        throw blocked('Google Secret Manager access failed without exposing provider credentials.')
      }
    },
  }
}

function assertBinding(
  binding: MotionStudioSecretManagerCredentialVersionBinding,
  authority: MotionStudioMs010BExecutionAuthorityV1,
): void {
  assertPinnedSecretVersion(binding.projectId, binding.secretName, binding.secretVersion)
  if (binding.projectId !== REEDITPRO_LIVE_GCP_RESOURCE_MAP.projectId) {
    throw blocked('The Secret Manager credential binding targets the wrong Google Cloud project.')
  }
  if (binding.secretName !== EXPECTED_SECRET_BY_PROVIDER[binding.provider]) {
    throw blocked(`The ${binding.provider} credential binding targets an unapproved secret.`)
  }
  const authorityBinding = authority.credentialBindings.find((candidate) => candidate.provider === binding.provider)
  if (
    !authorityBinding ||
    authorityBinding.channel !== 'approved_secret_manager' ||
    authorityBinding.credentialReferenceId !== binding.credentialReferenceId ||
    authorityBinding.browserExposureAllowed !== false ||
    authorityBinding.persistedInProject !== false ||
    authorityBinding.loggingAllowed !== false
  ) {
    throw blocked(`The ${binding.provider} execution authority does not match the pinned Secret Manager binding.`)
  }
}

function assertPinnedSecretVersion(projectId: string, secretName: ReeditProSecretName, secretVersion: string): void {
  if (!/^[a-z][a-z0-9-]{4,62}$/.test(projectId)) throw invalid('Secret Manager project ID is invalid.')
  if (!Object.prototype.hasOwnProperty.call(REEDITPRO_LIVE_GCP_RESOURCE_MAP.secretNames, secretName)) {
    throw blocked('Secret Manager secret name is not present in the approved Reeditpro resource map.')
  }
  if (!/^[1-9]\d{0,18}$/.test(secretVersion)) {
    throw blocked('Secret Manager credential bindings must pin an exact numeric version.')
  }
}

function validateSecretValue(raw: Buffer | Uint8Array | string, provider: MotionStudioLiveCredentialProvider): string {
  const value = (typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')).trim()
  if (value.length < 16 || value.length > 8_192 || hasAsciiControlOrWhitespace(value)) {
    throw blocked(`The approved ${provider} Secret Manager payload is empty or malformed.`)
  }
  return value
}

function hasAsciiControlOrWhitespace(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0
    if (code <= 32 || code === 127) return true
  }
  return false
}

function executeGcloud(command: string, args: readonly string[], timeoutMs: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(command, [...args], {
      encoding: 'buffer',
      maxBuffer: 64 * 1024,
      timeout: timeoutMs,
      windowsHide: true,
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      },
    }, (error, stdout) => {
      if (error) {
        reject(new Error('Redacted Google Secret Manager command failure.'))
        return
      }
      resolve(Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout))
    })
  })
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
