import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import type {
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechSegmentRequestV1,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechC2ExecutionAuthority,
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
} from './live-authority'
import type { MotionStudioSpeechCredentialResolver } from './live-transport'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const GOOGLE_SECRET_ID = /^[A-Za-z][A-Za-z0-9_-]{0,254}$/
type MotionStudioSpeechCredentialEvidenceClass =
  | 'google_secret_manager_live'
  | 'private_local_fixture'
interface MotionStudioSpeechGoogleSecretManagerLoaderEvidence {
  evidenceClass: MotionStudioSpeechCredentialEvidenceClass
  commandPath: string
}
const googleSecretManagerLoaders = new WeakMap<object, MotionStudioSpeechGoogleSecretManagerLoaderEvidence>()
const pinnedCredentialResolvers = new WeakMap<object, {
  bindingDigest: string
  evidenceClass: MotionStudioSpeechCredentialEvidenceClass
}>()

export const MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID = 'reeditpro' as const
export const MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID =
  'reeditpro-prod-elevenlabs-api-key' as const
export const MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION = '1' as const
export const MOTION_STUDIO_SPEECH_GCLOUD_SDK_VERSION = '558.0.0' as const
export const MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH =
  '/usr/local/Caskroom/gcloud-cli/558.0.0/google-cloud-sdk/bin/gcloud' as const
export const MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH = 5_837 as const
export const MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256 =
  'd3e6e58223cb8266424f74d964403f5779c3a6b0c44325b96d89749eef717a96' as const

const GOOGLE_SECRET_MANAGER_PROCESS_ENVIRONMENT_ALLOWLIST = Object.freeze([
  'PATH',
  'HOME',
  'USER',
  'LOGNAME',
  'TMPDIR',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
] as const)
const MAXIMUM_GOOGLE_SECRET_MANAGER_ENVIRONMENT_VALUE_LENGTH = 8_192

export interface MotionStudioSpeechSecretBindingV1 {
  schemaVersion: 'motion-studio.speech-secret-binding.v1'
  credentialReferenceId: string
  secretLocatorId: string
  secretVersionReference: string
  channel: 'server_secret_reference'
  browserExposureAllowed: false
  persistedInProject: false
  loggingAllowed: false
  bindingDigest: string
  immutable: true
}

export interface MotionStudioSpeechSecretValueLoader {
  access(input: {
    secretLocatorId: string
    secretVersionReference: string
  }): Promise<Buffer | Uint8Array | string>
}

export interface MotionStudioSpeechGoogleSecretManagerLoaderOptions {
  projectId?: typeof MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID
  timeoutMs?: number
}

export interface MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions
  extends MotionStudioSpeechGoogleSecretManagerLoaderOptions {
  gcloudBinary?: string
  commandRunner: (command: string, args: readonly string[]) => Promise<Buffer | Uint8Array | string>
}

export interface MotionStudioSpeechPinnedCredentialResolver extends MotionStudioSpeechCredentialResolver {
  describeBinding(): MotionStudioSpeechSecretBindingV1 & {
    credentialSource: 'google_secret_manager' | 'private_local_fixture'
    valueAccessed: boolean
    valueCached: false
  }
}

export function assertMotionStudioSpeechPinnedCredentialResolverBinding(input: {
  resolver: MotionStudioSpeechCredentialResolver
  credentialReferenceId: string
  credentialBindingDigest: string
  expectedValueAccessed: boolean
}): void {
  if (!SHA256.test(input.credentialBindingDigest)) {
    invalid('Speech live credential binding digest is malformed.')
  }
  const resolverEvidence = pinnedCredentialResolvers.get(input.resolver)
  if (
    !resolverEvidence || resolverEvidence.bindingDigest !== input.credentialBindingDigest ||
    resolverEvidence.evidenceClass !== 'google_secret_manager_live'
  ) {
    blocked('Speech live transport requires the exact in-process pinned credential resolver.')
  }
  const resolver = input.resolver as MotionStudioSpeechPinnedCredentialResolver
  const binding = resolver.describeBinding()
  if (
    binding.bindingDigest !== input.credentialBindingDigest ||
    binding.credentialReferenceId !== input.credentialReferenceId ||
    binding.channel !== 'server_secret_reference' || binding.browserExposureAllowed !== false ||
    binding.persistedInProject !== false || binding.loggingAllowed !== false ||
    binding.credentialSource !== 'google_secret_manager' ||
    binding.valueAccessed !== input.expectedValueAccessed || binding.valueCached !== false
  ) blocked('Speech live credential resolver state does not match its exact server-only binding.')
}

export function createMotionStudioSpeechSecretBinding(input: {
  credentialReferenceId: string
  secretLocatorId: string
  secretVersionReference: string
}): MotionStudioSpeechSecretBindingV1 {
  for (const value of [input.credentialReferenceId, input.secretLocatorId, input.secretVersionReference]) {
    if (!STABLE_ID.test(value)) invalid('Speech secret binding contains an invalid stable reference.')
  }
  const base = {
    schemaVersion: 'motion-studio.speech-secret-binding.v1' as const,
    credentialReferenceId: input.credentialReferenceId,
    secretLocatorId: input.secretLocatorId,
    secretVersionReference: input.secretVersionReference,
    channel: 'server_secret_reference' as const,
    browserExposureAllowed: false as const,
    persistedInProject: false as const,
    loggingAllowed: false as const,
    immutable: true as const,
  }
  return Object.freeze({ ...base, bindingDigest: sha256CanonicalJson(base) })
}

/**
 * Owner-machine Google Secret Manager loader for one exact, separately
 * authorized speech attempt. Construction and metadata inspection never read
 * a payload. `access()` is called only by the pinned one-read credential
 * resolver after the execution authority and transport permit have passed.
 *
 * The command is argument-only, pins the reviewed owner-machine Cloud SDK
 * version rather than its mutable convenience symlink, pins project and
 * numeric secret version, keeps stdout in bounded memory, disables prompts,
 * and converts every command failure into a redacted domain error. It never
 * logs a secret name or value.
 */
export function createMotionStudioSpeechGoogleSecretManagerValueLoader(
  input: MotionStudioSpeechGoogleSecretManagerLoaderOptions = {},
): MotionStudioSpeechSecretValueLoader {
  return createGoogleSecretManagerLoader(
    input,
    undefined,
    'google_secret_manager_live',
    MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH,
  )
}

/**
 * Test-only command seam. A loader created here is explicitly fixture-branded
 * and can never satisfy the live transport's credential-source assertion.
 */
export function createMotionStudioSpeechFixtureGoogleSecretManagerValueLoader(
  input: MotionStudioSpeechGoogleSecretManagerFixtureLoaderOptions,
): MotionStudioSpeechSecretValueLoader {
  const gcloudBinary = input.gcloudBinary?.trim() || 'gcloud'
  return createGoogleSecretManagerLoader(
    input,
    input.commandRunner,
    'private_local_fixture',
    gcloudBinary,
  )
}

export function assertMotionStudioSpeechLiveGoogleSecretManagerLoader(
  loader: MotionStudioSpeechSecretValueLoader,
): void {
  const evidence = googleSecretManagerLoaders.get(loader)
  if (
    evidence?.evidenceClass !== 'google_secret_manager_live' ||
    evidence.commandPath !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH
  ) {
    blocked('Speech live credentials require the exact Google Secret Manager loader.')
  }
}

export function assertMotionStudioSpeechFixtureGoogleSecretManagerLoader(
  loader: MotionStudioSpeechSecretValueLoader,
): void {
  if (googleSecretManagerLoaders.get(loader)?.evidenceClass !== 'private_local_fixture') {
    blocked('Speech fixture credentials require an exact fixture-branded Secret Manager loader.')
  }
}

export function assertMotionStudioSpeechLiveGoogleSecretManagerBinding(
  binding: MotionStudioSpeechSecretBindingV1,
): void {
  assertGoogleSecretBinding(binding)
  const { bindingDigest, ...bindingBase } = binding
  if (
    binding.schemaVersion !== 'motion-studio.speech-secret-binding.v1' ||
    !STABLE_ID.test(binding.credentialReferenceId) ||
    binding.channel !== 'server_secret_reference' || binding.browserExposureAllowed !== false ||
    binding.persistedInProject !== false || binding.loggingAllowed !== false || binding.immutable !== true ||
    !SHA256.test(bindingDigest) || sha256CanonicalJson(bindingBase) !== bindingDigest
  ) blocked('Speech live credential binding failed its server-only integrity check.')
}

function createGoogleSecretManagerLoader(
  input: MotionStudioSpeechGoogleSecretManagerLoaderOptions,
  commandRunner: ((command: string, args: readonly string[]) => Promise<Buffer | Uint8Array | string>) | undefined,
  evidenceClass: MotionStudioSpeechCredentialEvidenceClass,
  gcloudBinary: string,
): MotionStudioSpeechSecretValueLoader {
  const projectId = input.projectId ?? MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID
  if (projectId !== MOTION_STUDIO_SPEECH_GOOGLE_CLOUD_PROJECT_ID) {
    blocked('Speech Secret Manager loader targets the wrong Google Cloud project.')
  }
  const timeoutMs = input.timeoutMs ?? 20_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) {
    invalid('Speech Secret Manager timeout must be between one and 30 seconds.')
  }
  if (!/^[A-Za-z0-9_./-]{1,512}$/.test(gcloudBinary)) {
    invalid('Speech Secret Manager gcloud binary path is invalid.')
  }
  // Capture the allowlisted environment before construction returns. Later
  // process-environment mutation cannot redirect this loader to another user
  // configuration, command path, proxy, certificate, or credential source.
  const processEnvironment = commandRunner
    ? undefined
    : createMotionStudioSpeechGoogleSecretManagerProcessEnvironment()
  const runner = commandRunner ?? ((command: string, args: readonly string[]) => (
    executeGcloud(command, args, timeoutMs, processEnvironment!)
  ))
  const loader: MotionStudioSpeechSecretValueLoader = Object.freeze({
    async access({ secretLocatorId, secretVersionReference }: {
      secretLocatorId: string
      secretVersionReference: string
    }) {
      if (
        !GOOGLE_SECRET_ID.test(secretLocatorId) ||
        secretLocatorId !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID
      ) {
        blocked('Speech Secret Manager access must use the pinned ElevenLabs secret ID.')
      }
      if (
        !/^[1-9]\d{0,18}$/.test(secretVersionReference) ||
        secretVersionReference !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION
      ) {
        blocked('Speech Secret Manager access must use pinned numeric version 1.')
      }
      try {
        return await runner(gcloudBinary, [
          'secrets',
          'versions',
          'access',
          secretVersionReference,
          `--secret=${secretLocatorId}`,
          `--project=${projectId}`,
          '--quiet',
        ])
      } catch {
        blocked('Google Secret Manager access failed without exposing the speech credential.')
      }
    },
  })
  googleSecretManagerLoaders.set(loader, Object.freeze({ evidenceClass, commandPath: gcloudBinary }))
  return loader
}

export function createMotionStudioSpeechPinnedCredentialResolver(input: {
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  binding: MotionStudioSpeechSecretBindingV1
  loader: MotionStudioSpeechSecretValueLoader
}): MotionStudioSpeechPinnedCredentialResolver {
  assertMotionStudioSpeechLiveGoogleSecretManagerLoader(input.loader)
  assertMotionStudioSpeechLiveGoogleSecretManagerBinding(input.binding)
  return createPinnedCredentialResolver(input, 'google_secret_manager_live')
}

export function createMotionStudioSpeechFixturePinnedCredentialResolver(input: {
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  binding: MotionStudioSpeechSecretBindingV1
  loader: MotionStudioSpeechSecretValueLoader
}): MotionStudioSpeechPinnedCredentialResolver {
  if (googleSecretManagerLoaders.get(input.loader)?.evidenceClass === 'google_secret_manager_live') {
    blocked('Speech fixture credentials cannot access the live Google Secret Manager loader.')
  }
  return createPinnedCredentialResolver(input, 'private_local_fixture')
}

function createPinnedCredentialResolver(input: {
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  binding: MotionStudioSpeechSecretBindingV1
  loader: MotionStudioSpeechSecretValueLoader
}, evidenceClass: MotionStudioSpeechCredentialEvidenceClass): MotionStudioSpeechPinnedCredentialResolver {
  const authority = assertMotionStudioSpeechC2ExecutionAuthority(
    input.executionAuthority,
    input.request,
    input.capabilitySnapshot,
  )
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance(authority)
  const { binding } = input
  if (!SHA256.test(authority.authorityDigest)) invalid('Speech credential authority digest is malformed.')
  if (
    binding.schemaVersion !== 'motion-studio.speech-secret-binding.v1' ||
    !STABLE_ID.test(binding.credentialReferenceId) || !STABLE_ID.test(binding.secretLocatorId) ||
    !STABLE_ID.test(binding.secretVersionReference) ||
    binding.credentialReferenceId !== authority.credentialReferenceId ||
    binding.channel !== 'server_secret_reference' || binding.browserExposureAllowed !== false ||
    binding.persistedInProject !== false || binding.loggingAllowed !== false || binding.immutable !== true
  ) blocked('Speech credential binding does not match the exact server-only authority.')
  const { bindingDigest, ...bindingBase } = binding
  if (!SHA256.test(bindingDigest) || sha256CanonicalJson(bindingBase) !== bindingDigest || bindingDigest !== authority.credentialBindingDigest) {
    blocked('Speech credential binding digest does not match the exact execution authority.')
  }
  const frozenBinding = Object.freeze({ ...binding })
  let valueAccessed = false
  const resolver: MotionStudioSpeechPinnedCredentialResolver = {
    async resolve({ credentialReferenceId }) {
      if (credentialReferenceId !== frozenBinding.credentialReferenceId) {
        blocked('Speech credential request does not match the pinned server secret reference.')
      }
      if (valueAccessed) blocked('Speech credential value has already been accessed for this single-attempt resolver.')
      valueAccessed = true
      let raw: Buffer | Uint8Array | string
      try {
        raw = await input.loader.access({
          secretLocatorId: frozenBinding.secretLocatorId,
          secretVersionReference: frozenBinding.secretVersionReference,
        })
      } catch {
        blocked('The pinned speech provider credential could not be accessed.')
      }
      return { apiKey: validateSecretValue(raw) }
    },
    describeBinding() {
      return {
        ...frozenBinding,
        credentialSource: evidenceClass === 'google_secret_manager_live'
          ? 'google_secret_manager' as const
          : 'private_local_fixture' as const,
        valueAccessed,
        valueCached: false,
      }
    },
  }
  pinnedCredentialResolvers.set(resolver, {
    bindingDigest: frozenBinding.bindingDigest,
    evidenceClass,
  })
  return Object.freeze(resolver)
}

function assertGoogleSecretBinding(binding: MotionStudioSpeechSecretBindingV1): void {
  if (
    !GOOGLE_SECRET_ID.test(binding.secretLocatorId) ||
    binding.secretLocatorId !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_LOCATOR_ID
  ) {
    blocked('Speech live credential binding must use the pinned ElevenLabs Secret Manager ID.')
  }
  if (
    !/^[1-9]\d{0,18}$/.test(binding.secretVersionReference) ||
    binding.secretVersionReference !== MOTION_STUDIO_SPEECH_ELEVENLABS_SECRET_VERSION
  ) {
    blocked('Speech live credential binding must pin Google Secret Manager version 1.')
  }
}

function validateSecretValue(raw: Buffer | Uint8Array | string): string {
  const value = (typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')).trim()
  if (value.length < 16 || value.length > 4_096 || /\s/.test(value)) {
    blocked('The pinned speech provider secret is malformed.')
  }
  return value
}

/**
 * Builds the complete subprocess environment for the pinned Google Secret
 * Manager read. This deliberately does not inherit the parent environment:
 * provider credentials, proxy/PAC configuration, alternate project settings,
 * and unrelated process state cannot reach `gcloud` through this boundary.
 * Only operating-system lookup, user-home, locale, and temporary-directory
 * values are retained. Google auth/config overrides and certificate overrides
 * are intentionally excluded; the owner-machine CLI uses its standard
 * user-home configuration. The exact Google Cloud project is supplied as a
 * command argument, never accepted from environment state.
 */
export function createMotionStudioSpeechGoogleSecretManagerProcessEnvironment(
  source: Readonly<NodeJS.ProcessEnv> = process.env,
): NodeJS.ProcessEnv {
  const environment = Object.create(null) as NodeJS.ProcessEnv
  environment.CLOUDSDK_CORE_DISABLE_PROMPTS = '1'
  for (const key of GOOGLE_SECRET_MANAGER_PROCESS_ENVIRONMENT_ALLOWLIST) {
    const value = source[key]
    if (value === undefined || value.length === 0) continue
    if (
      value.length > MAXIMUM_GOOGLE_SECRET_MANAGER_ENVIRONMENT_VALUE_LENGTH ||
      value.includes('\0')
    ) {
      blocked('Speech Secret Manager process environment contains an unsafe allowlisted value.')
    }
    environment[key] = value
  }
  return Object.freeze(environment) as NodeJS.ProcessEnv
}

function executeGcloud(
  command: string,
  args: readonly string[],
  timeoutMs: number,
  processEnvironment: NodeJS.ProcessEnv,
): Promise<Buffer> {
  return assertPinnedGcloudBinaryIdentity(command).then(() => new Promise((resolve, reject) => {
    execFile(command, [...args], {
      encoding: 'buffer',
      maxBuffer: 64 * 1024,
      timeout: timeoutMs,
      windowsHide: true,
      env: processEnvironment,
    }, (error, stdout) => {
      if (error) {
        reject(new Error('Redacted Google Secret Manager command failure.'))
        return
      }
      resolve(Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout))
    })
  }))
}

async function assertPinnedGcloudBinaryIdentity(command: string): Promise<void> {
  if (command !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_PATH) {
    blocked('Speech Secret Manager execution requires the pinned Cloud SDK path.')
  }
  let bytes: Buffer
  try {
    bytes = await readFile(command)
  } catch {
    blocked('The pinned speech Secret Manager Cloud SDK runtime is unavailable.')
  }
  if (
    bytes.byteLength !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_BYTE_LENGTH ||
    createHash('sha256').update(bytes).digest('hex') !== MOTION_STUDIO_SPEECH_GCLOUD_BINARY_SHA256
  ) {
    blocked('The pinned speech Secret Manager Cloud SDK runtime identity changed.')
  }
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
