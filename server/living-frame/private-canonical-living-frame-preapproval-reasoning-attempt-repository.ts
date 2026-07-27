import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  canonicalLivingFramePreapprovalReasoningAttemptReservationLocatorSchema,
  canonicalLivingFramePreapprovalReasoningAttemptReservationSchema,
  deriveCanonicalLivingFramePreapprovalReasoningAttemptReservationLocator,
  verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation,
  type CanonicalLivingFramePreapprovalReasoningAttemptReservation,
  type CanonicalLivingFramePreapprovalReasoningAttemptReservationLocator,
} from './canonical-living-frame-preapproval-reasoning-attempt-reservation'

const RECORD_ENVELOPE_VERSION = (
  'private-canonical-living-frame-preapproval-reasoning-attempt-envelope-v1'
) as const
const CURRENT_POINTER_VERSION = (
  'private-canonical-living-frame-preapproval-reasoning-attempt-current-v1'
) as const
const RECORD_SOURCE = (
  'private_canonical_living_frame_preapproval_reasoning_attempt_repository'
) as const
const MAX_RECORD_BYTES = 512 * 1024
const MAX_POINTER_BYTES = 32 * 1024

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const recordEnvelopeSchema = z.object({
  recordVersion: z.literal(RECORD_ENVELOPE_VERSION),
  source: z.literal(RECORD_SOURCE),
  scopeHashSha256: digestSchema,
  locatorId: safeIdentitySchema,
  reservation:
    canonicalLivingFramePreapprovalReasoningAttemptReservationSchema,
  checksumSha256: digestSchema,
}).strict()

const currentPointerSchema = z.object({
  recordVersion: z.literal(CURRENT_POINTER_VERSION),
  source: z.literal(RECORD_SOURCE),
  scopeHashSha256: digestSchema,
  locatorId: safeIdentitySchema,
  reasoningRunId: safeIdentitySchema,
  attemptId: safeIdentitySchema,
  revision: z.literal(1),
  recordDigestSha256: digestSchema,
  checksumSha256: digestSchema,
}).strict()

export interface CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope {
  readonly localStorageRoot: string
  readonly ownerUserId: string
  readonly workspaceId: string
}

export interface CanonicalLivingFramePreapprovalReasoningAttemptPersistenceResult {
  readonly locator:
    CanonicalLivingFramePreapprovalReasoningAttemptReservationLocator
  readonly reasoningRunId: string
  readonly attemptId: string
  readonly recordDigestSha256: string
  readonly disposition: 'created' | 'idempotent_replay'
  readonly persistence:
    'backend_local_private_content_addressed'
  readonly restartSafeSingleHost: true
  readonly distributedDurability: false
  readonly providerRequestCreated: false
  readonly submissionAuthorityIssued: false
  readonly providerCallMade: false
  readonly credentialReadMade: false
  readonly providerAttemptCostCreated: false
  readonly customerCreditsMutated: false
  readonly remoteMutationMade: false
}

export class PrivateCanonicalLivingFramePreapprovalReasoningAttemptRepository {
  readonly persistence =
    'backend_local_private_content_addressed' as const

  async save(input: {
    readonly scope:
      CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope
    readonly reservation:
      CanonicalLivingFramePreapprovalReasoningAttemptReservation
  }): Promise<
    CanonicalLivingFramePreapprovalReasoningAttemptPersistenceResult
  > {
    validateScope(input.scope)
    const reservation =
      verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation(
        input.reservation,
      )
    if (reservation.identity.workspaceId !== input.scope.workspaceId) {
      throw conflict(
        'canonical_living_frame_preapproval_attempt_workspace_mismatch',
      )
    }
    const locator =
      deriveCanonicalLivingFramePreapprovalReasoningAttemptReservationLocator(
        reservation,
      )
    const paths = repositoryPaths(
      input.scope,
      locator.serverOwnedLocatorId,
    )
    return withPrivateCooperativeFileLockWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: paths.lockFile,
      operation: async () => {
        const currentPointer =
          await readCurrentPointer(input.scope, locator)
        if (
          currentPointer
          && (
            currentPointer.reasoningRunId !==
              reservation.reasoningRunId
            || currentPointer.attemptId !==
              reservation.attemptControl.attemptId
            || currentPointer.recordDigestSha256 !==
              reservation.recordDigestSha256
          )
        ) {
          throw conflict(
            'canonical_living_frame_preapproval_attempt_conflict',
          )
        }
        const envelopePayload = {
          recordVersion: RECORD_ENVELOPE_VERSION,
          source: RECORD_SOURCE,
          scopeHashSha256: scopeHash(input.scope),
          locatorId: locator.serverOwnedLocatorId,
          reservation,
        }
        const envelope = recordEnvelopeSchema.parse({
          ...envelopePayload,
          checksumSha256: sha256AuthorityValue(envelopePayload),
        })
        const versionFile =
          `${paths.versionDirectory}/${reservation.recordDigestSha256}.json`
        const versionBytes = Buffer.from(
          `${stableAuthorityStringify(envelope)}\n`,
          'utf8',
        )
        if (versionBytes.byteLength > MAX_RECORD_BYTES) {
          throw conflict(
            'canonical_living_frame_preapproval_attempt_too_large',
          )
        }
        const createResult =
          await writePrivateFileCreateOnlyWithinRoot({
            rootPath: input.scope.localStorageRoot,
            relativePath: versionFile,
            content: versionBytes,
          })
        const pointerPayload = {
          recordVersion: CURRENT_POINTER_VERSION,
          source: RECORD_SOURCE,
          scopeHashSha256: scopeHash(input.scope),
          locatorId: locator.serverOwnedLocatorId,
          reasoningRunId: reservation.reasoningRunId,
          attemptId: reservation.attemptControl.attemptId,
          revision: reservation.revision,
          recordDigestSha256: reservation.recordDigestSha256,
        }
        const pointer = currentPointerSchema.parse({
          ...pointerPayload,
          checksumSha256: sha256AuthorityValue(pointerPayload),
        })
        const pointerText =
          `${stableAuthorityStringify(pointer)}\n`
        if (
          Buffer.byteLength(pointerText, 'utf8') >
            MAX_POINTER_BYTES
        ) {
          throw conflict(
            'canonical_living_frame_preapproval_attempt_pointer_too_large',
          )
        }
        await writePrivateTextFileAtomicWithinRoot({
          rootPath: input.scope.localStorageRoot,
          relativePath: paths.currentFile,
          content: pointerText,
        })
        return {
          locator,
          reasoningRunId: reservation.reasoningRunId,
          attemptId: reservation.attemptControl.attemptId,
          recordDigestSha256: reservation.recordDigestSha256,
          disposition:
            currentPointer || !createResult.created
              ? 'idempotent_replay'
              : 'created',
          persistence: this.persistence,
          restartSafeSingleHost: true,
          distributedDurability: false,
          providerRequestCreated: false,
          submissionAuthorityIssued: false,
          providerCallMade: false,
          credentialReadMade: false,
          providerAttemptCostCreated: false,
          customerCreditsMutated: false,
          remoteMutationMade: false,
        }
      },
    })
  }

  async readByServerOwnedLocator(input: {
    readonly scope:
      CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope
    readonly locator: unknown
  }): Promise<
    CanonicalLivingFramePreapprovalReasoningAttemptReservation
  > {
    validateScope(input.scope)
    const locator =
      canonicalLivingFramePreapprovalReasoningAttemptReservationLocatorSchema
        .parse(input.locator)
    const paths = repositoryPaths(
      input.scope,
      locator.serverOwnedLocatorId,
    )
    return withPrivateCooperativeFileLockWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: paths.lockFile,
      operation: async () => {
        const pointer =
          await readCurrentPointer(input.scope, locator)
        if (!pointer) throw notFound()
        const versionFile =
          `${paths.versionDirectory}/${pointer.recordDigestSha256}.json`
        const rawEnvelope =
          await readPrivateTextFileIfExistsWithinRoot({
            rootPath: input.scope.localStorageRoot,
            relativePath: versionFile,
          })
        if (
          !rawEnvelope
          || Buffer.byteLength(rawEnvelope, 'utf8') >
            MAX_RECORD_BYTES
        ) {
          throw notFound()
        }
        const envelope = parseJson(
          recordEnvelopeSchema,
          rawEnvelope,
          'canonical_living_frame_preapproval_attempt_envelope_invalid',
        )
        const { checksumSha256, ...payload } = envelope
        if (
          envelope.scopeHashSha256 !== scopeHash(input.scope)
          || envelope.locatorId !== locator.serverOwnedLocatorId
          || envelope.reservation.reasoningRunId !==
            pointer.reasoningRunId
          || envelope.reservation.attemptControl.attemptId !==
            pointer.attemptId
          || envelope.reservation.revision !== pointer.revision
          || envelope.reservation.recordDigestSha256 !==
            pointer.recordDigestSha256
          || checksumSha256 !== sha256AuthorityValue(payload)
        ) {
          throw conflict(
            'canonical_living_frame_preapproval_attempt_envelope_invalid',
          )
        }
        const reservation =
          verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation(
            envelope.reservation,
          )
        if (
          reservation.identity.workspaceId !==
            input.scope.workspaceId
          || deriveCanonicalLivingFramePreapprovalReasoningAttemptReservationLocator(
            reservation,
          ).serverOwnedLocatorId !==
            locator.serverOwnedLocatorId
        ) {
          throw notFound()
        }
        return reservation
      },
    })
  }
}

async function readCurrentPointer(
  scope:
    CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope,
  locator:
    CanonicalLivingFramePreapprovalReasoningAttemptReservationLocator,
): Promise<z.infer<typeof currentPointerSchema> | null> {
  const paths = repositoryPaths(
    scope,
    locator.serverOwnedLocatorId,
  )
  const rawPointer =
    await readPrivateTextFileIfExistsWithinRoot({
      rootPath: scope.localStorageRoot,
      relativePath: paths.currentFile,
    })
  if (!rawPointer) return null
  if (
    Buffer.byteLength(rawPointer, 'utf8') >
      MAX_POINTER_BYTES
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_attempt_pointer_invalid',
    )
  }
  const pointer = parseJson(
    currentPointerSchema,
    rawPointer,
    'canonical_living_frame_preapproval_attempt_pointer_invalid',
  )
  const { checksumSha256, ...payload } = pointer
  if (
    pointer.scopeHashSha256 !== scopeHash(scope)
    || pointer.locatorId !== locator.serverOwnedLocatorId
    || checksumSha256 !== sha256AuthorityValue(payload)
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_attempt_pointer_invalid',
    )
  }
  return pointer
}

function repositoryPaths(
  scope:
    CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope,
  locatorId: string,
) {
  const scopeDirectory =
    `canonical-living-frame-preapproval-reasoning-attempts/scopes/${scopeHash(scope)}`
  const locatorDirectory =
    `${scopeDirectory}/locators/${sha256AuthorityValue(locatorId)}`
  return {
    lockFile: `${locatorDirectory}/reservation.lock`,
    currentFile: `${locatorDirectory}/current.json`,
    versionDirectory: `${locatorDirectory}/versions`,
  }
}

function scopeHash(
  scope:
    CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope,
): string {
  return sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
  })
}

function validateScope(
  scope:
    CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope,
): void {
  if (
    !safeIdentitySchema.safeParse(scope.ownerUserId).success
    || !safeIdentitySchema.safeParse(scope.workspaceId).success
    || typeof scope.localStorageRoot !== 'string'
    || scope.localStorageRoot.trim().length < 1
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_attempt_scope_invalid',
    )
  }
}

function parseJson<T extends z.ZodType>(
  schema: T,
  value: string,
  reason: string,
): z.infer<T> {
  try {
    return schema.parse(JSON.parse(value))
  } catch {
    throw conflict(reason)
  }
}

function notFound(): ApiError {
  return new ApiError(
    'STORAGE_OBJECT_NOT_FOUND',
    'Canonical Living Frame reasoning attempt reservation was not found.',
    404,
  )
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical Living Frame reasoning attempt reservation is stale or invalid.',
    409,
    { reason },
  )
}
