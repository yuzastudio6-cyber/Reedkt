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
  canonicalLivingFramePreapprovalReasoningRunLocatorSchema,
  canonicalLivingFramePreapprovalReasoningRunSchema,
  deriveCanonicalLivingFramePreapprovalReasoningRunLocator,
  verifyCanonicalLivingFramePreapprovalReasoningRun,
  type CanonicalLivingFramePreapprovalReasoningRun,
  type CanonicalLivingFramePreapprovalReasoningRunLocator,
} from './canonical-living-frame-preapproval-reasoning-lifecycle'

const RUN_ENVELOPE_VERSION = (
  'private-canonical-living-frame-preapproval-reasoning-run-envelope-v1'
) as const
const CURRENT_POINTER_VERSION = (
  'private-canonical-living-frame-preapproval-reasoning-run-current-v1'
) as const
const RECORD_SOURCE = (
  'private_canonical_living_frame_preapproval_reasoning_repository'
) as const
const MAX_RUN_BYTES = 8 * 1024 * 1024
const MAX_POINTER_BYTES = 32 * 1024

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const runEnvelopeSchema = z.object({
  recordVersion: z.literal(RUN_ENVELOPE_VERSION),
  source: z.literal(RECORD_SOURCE),
  scopeHashSha256: digestSchema,
  locatorId: safeIdentitySchema,
  run: canonicalLivingFramePreapprovalReasoningRunSchema,
  checksumSha256: digestSchema,
}).strict()

const currentPointerSchema = z.object({
  recordVersion: z.literal(CURRENT_POINTER_VERSION),
  source: z.literal(RECORD_SOURCE),
  scopeHashSha256: digestSchema,
  locatorId: safeIdentitySchema,
  reasoningRunId: safeIdentitySchema,
  revision: z.literal(1),
  recordDigestSha256: digestSchema,
  checksumSha256: digestSchema,
}).strict()

export interface CanonicalLivingFramePreapprovalReasoningRepositoryScope {
  readonly localStorageRoot: string
  readonly ownerUserId: string
  readonly workspaceId: string
}

export interface CanonicalLivingFramePreapprovalReasoningPersistenceResult {
  readonly locator:
    CanonicalLivingFramePreapprovalReasoningRunLocator
  readonly reasoningRunId: string
  readonly recordDigestSha256: string
  readonly disposition: 'created' | 'idempotent_replay'
  readonly persistence:
    'backend_local_private_content_addressed'
  readonly restartSafeSingleHost: true
  readonly distributedDurability: false
  readonly providerCallMade: false
  readonly credentialReadMade: false
  readonly providerAttemptCreated: false
  readonly providerAttemptCostCreated: false
  readonly customerCreditsMutated: false
  readonly remoteMutationMade: false
}

export class PrivateCanonicalLivingFramePreapprovalReasoningRepository {
  readonly persistence =
    'backend_local_private_content_addressed' as const

  async save(input: {
    readonly scope:
      CanonicalLivingFramePreapprovalReasoningRepositoryScope
    readonly run: CanonicalLivingFramePreapprovalReasoningRun
  }): Promise<
    CanonicalLivingFramePreapprovalReasoningPersistenceResult
  > {
    validateScope(input.scope)
    const run =
      verifyCanonicalLivingFramePreapprovalReasoningRun(input.run)
    if (run.identity.workspaceId !== input.scope.workspaceId) {
      throw conflict(
        'canonical_living_frame_preapproval_reasoning_workspace_mismatch',
      )
    }
    const locator =
      deriveCanonicalLivingFramePreapprovalReasoningRunLocator(run)
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
            currentPointer.reasoningRunId !== run.reasoningRunId
            || currentPointer.recordDigestSha256 !==
              run.recordDigestSha256
          )
        ) {
          throw conflict(
            'canonical_living_frame_preapproval_reasoning_run_conflict',
          )
        }
        const envelopePayload = {
          recordVersion: RUN_ENVELOPE_VERSION,
          source: RECORD_SOURCE,
          scopeHashSha256: scopeHash(input.scope),
          locatorId: locator.serverOwnedLocatorId,
          run,
        }
        const envelope = runEnvelopeSchema.parse({
          ...envelopePayload,
          checksumSha256: sha256AuthorityValue(envelopePayload),
        })
        const versionFile =
          `${paths.versionDirectory}/${run.recordDigestSha256}.json`
        const versionBytes = Buffer.from(
          `${stableAuthorityStringify(envelope)}\n`,
          'utf8',
        )
        if (versionBytes.byteLength > MAX_RUN_BYTES) {
          throw conflict(
            'canonical_living_frame_preapproval_reasoning_run_too_large',
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
          reasoningRunId: run.reasoningRunId,
          revision: run.revision,
          recordDigestSha256: run.recordDigestSha256,
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
            'canonical_living_frame_preapproval_reasoning_pointer_too_large',
          )
        }
        await writePrivateTextFileAtomicWithinRoot({
          rootPath: input.scope.localStorageRoot,
          relativePath: paths.currentFile,
          content: pointerText,
        })
        return {
          locator,
          reasoningRunId: run.reasoningRunId,
          recordDigestSha256: run.recordDigestSha256,
          disposition:
            currentPointer || !createResult.created
              ? 'idempotent_replay'
              : 'created',
          persistence: this.persistence,
          restartSafeSingleHost: true,
          distributedDurability: false,
          providerCallMade: false,
          credentialReadMade: false,
          providerAttemptCreated: false,
          providerAttemptCostCreated: false,
          customerCreditsMutated: false,
          remoteMutationMade: false,
        }
      },
    })
  }

  async readByServerOwnedLocator(input: {
    readonly scope:
      CanonicalLivingFramePreapprovalReasoningRepositoryScope
    readonly locator: unknown
  }): Promise<CanonicalLivingFramePreapprovalReasoningRun> {
    validateScope(input.scope)
    const locator =
      canonicalLivingFramePreapprovalReasoningRunLocatorSchema.parse(
        input.locator,
      )
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
            MAX_RUN_BYTES
        ) {
          throw notFound()
        }
        const envelope = parseJson(
          runEnvelopeSchema,
          rawEnvelope,
          'canonical_living_frame_preapproval_reasoning_envelope_invalid',
        )
        const { checksumSha256, ...payload } = envelope
        if (
          envelope.scopeHashSha256 !== scopeHash(input.scope)
          || envelope.locatorId !== locator.serverOwnedLocatorId
          || envelope.run.reasoningRunId !==
            pointer.reasoningRunId
          || envelope.run.revision !== pointer.revision
          || envelope.run.recordDigestSha256 !==
            pointer.recordDigestSha256
          || checksumSha256 !== sha256AuthorityValue(payload)
        ) {
          throw conflict(
            'canonical_living_frame_preapproval_reasoning_envelope_invalid',
          )
        }
        const run =
          verifyCanonicalLivingFramePreapprovalReasoningRun(
            envelope.run,
          )
        if (
          run.identity.workspaceId !== input.scope.workspaceId
          || deriveCanonicalLivingFramePreapprovalReasoningRunLocator(
            run,
          ).serverOwnedLocatorId !==
            locator.serverOwnedLocatorId
        ) {
          throw notFound()
        }
        return run
      },
    })
  }
}

async function readCurrentPointer(
  scope: CanonicalLivingFramePreapprovalReasoningRepositoryScope,
  locator: CanonicalLivingFramePreapprovalReasoningRunLocator,
) {
  const paths = repositoryPaths(
    scope,
    locator.serverOwnedLocatorId,
  )
  const raw = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.currentFile,
  })
  if (!raw) return undefined
  if (Buffer.byteLength(raw, 'utf8') > MAX_POINTER_BYTES) {
    throw conflict(
      'canonical_living_frame_preapproval_reasoning_pointer_invalid',
    )
  }
  const pointer = parseJson(
    currentPointerSchema,
    raw,
    'canonical_living_frame_preapproval_reasoning_pointer_invalid',
  )
  const { checksumSha256, ...payload } = pointer
  if (
    pointer.scopeHashSha256 !== scopeHash(scope)
    || pointer.locatorId !== locator.serverOwnedLocatorId
    || checksumSha256 !== sha256AuthorityValue(payload)
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_reasoning_pointer_invalid',
    )
  }
  return pointer
}

function repositoryPaths(
  scope: CanonicalLivingFramePreapprovalReasoningRepositoryScope,
  locatorId: string,
) {
  const base = [
    'canonical-living-frame-preapproval-reasoning',
    'scopes',
    scopeHash(scope),
    'locators',
    sha256AuthorityValue(locatorId),
  ].join('/')
  return {
    versionDirectory: `${base}/versions`,
    currentFile: `${base}/current.json`,
    lockFile: `${base}/repository.lock`,
  }
}

function scopeHash(
  scope: CanonicalLivingFramePreapprovalReasoningRepositoryScope,
): string {
  return sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
  })
}

function validateScope(
  scope: CanonicalLivingFramePreapprovalReasoningRepositoryScope,
): void {
  if (
    !scope.localStorageRoot.trim()
    || !safeIdentitySchema.safeParse(scope.ownerUserId).success
    || !safeIdentitySchema.safeParse(scope.workspaceId).success
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_reasoning_scope_invalid',
    )
  }
}

function parseJson<T extends z.ZodTypeAny>(
  schema: T,
  value: string,
  code: string,
): z.infer<T> {
  try {
    return schema.parse(JSON.parse(value))
  } catch {
    throw conflict(code)
  }
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical Living Frame preapproval reasoning state is stale or invalid.',
    409,
    { reason },
  )
}

function notFound(): ApiError {
  return new ApiError(
    'STORAGE_OBJECT_NOT_FOUND',
    'Canonical Living Frame preapproval reasoning state was not found.',
    404,
  )
}
