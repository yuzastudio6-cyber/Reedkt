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
  CANONICAL_SOURCE_SPEECH_EVIDENCE_LOCATOR_VERSION,
  canonicalSourceSpeechEvidenceLocatorSchema,
  canonicalSourceSpeechEvidencePackageSchema,
  type CanonicalSourceSpeechEvidenceLocator,
  type CanonicalSourceSpeechEvidencePackage,
  verifyCanonicalSourceSpeechEvidencePackage,
} from './canonical-source-speech-evidence-contract'

const PACKAGE_ENVELOPE_VERSION =
  'private-canonical-source-speech-evidence-envelope-v1' as const
const LATEST_ENVELOPE_VERSION =
  'private-canonical-source-speech-evidence-latest-v1' as const
const RECORD_SOURCE =
  'private_canonical_source_speech_evidence_repository' as const
const MAX_PACKAGE_BYTES = 8 * 1024 * 1024
const MAX_POINTER_BYTES = 32 * 1024

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)

const packageEnvelopeSchema = z.object({
  recordVersion: z.literal(PACKAGE_ENVELOPE_VERSION),
  source: z.literal(RECORD_SOURCE),
  scopeHashSha256: digestSchema,
  locatorId: safeIdentitySchema,
  package: canonicalSourceSpeechEvidencePackageSchema,
  checksumSha256: digestSchema,
}).strict()

const latestEnvelopeSchema = z.object({
  recordVersion: z.literal(LATEST_ENVELOPE_VERSION),
  source: z.literal(RECORD_SOURCE),
  scopeHashSha256: digestSchema,
  locatorId: safeIdentitySchema,
  packageDigestSha256: digestSchema,
  evidenceSnapshotId: safeIdentitySchema,
  evidenceRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  checksumSha256: digestSchema,
}).strict()

export interface CanonicalSourceSpeechEvidenceRepositoryScope {
  readonly localStorageRoot: string
  readonly ownerUserId: string
  readonly workspaceId: string
}

export interface CanonicalSourceSpeechEvidencePersistenceResult {
  readonly locator: CanonicalSourceSpeechEvidenceLocator
  readonly packageDigestSha256: string
  readonly disposition: 'created' | 'idempotent_replay' | 'advanced_latest'
  readonly persistence: 'backend_local_private_content_addressed'
  readonly rawMediaPersisted: false
  readonly browserPayloadPersisted: false
  readonly signedUrlPersisted: false
  readonly credentialPersisted: false
  readonly customerCreditsMutated: false
  readonly remoteMutationMade: false
}

export class PrivateCanonicalSourceSpeechEvidenceRepository {
  readonly persistence = 'backend_local_private_content_addressed' as const

  async save(input: {
    readonly scope: CanonicalSourceSpeechEvidenceRepositoryScope
    readonly package: CanonicalSourceSpeechEvidencePackage
  }): Promise<CanonicalSourceSpeechEvidencePersistenceResult> {
    validateScope(input.scope)
    const evidence = verifyCanonicalSourceSpeechEvidencePackage(input.package)
    if (evidence.workspaceId !== input.scope.workspaceId) {
      throw conflict('canonical_source_speech_evidence_workspace_mismatch')
    }
    const locator = deriveCanonicalSourceSpeechEvidenceLocator(evidence)
    const paths = repositoryPaths(input.scope, locator.serverOwnedLocatorId)
    return withPrivateCooperativeFileLockWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: paths.lockFile,
      operation: async () => {
        const envelopePayload = {
          recordVersion: PACKAGE_ENVELOPE_VERSION,
          source: RECORD_SOURCE,
          scopeHashSha256: scopeHash(input.scope),
          locatorId: locator.serverOwnedLocatorId,
          package: evidence,
        }
        const envelope = packageEnvelopeSchema.parse({
          ...envelopePayload,
          checksumSha256: sha256AuthorityValue(envelopePayload),
        })
        const versionFile = `${paths.versionDirectory}/${evidence.contractDigestSha256}.json`
        const versionBytes = Buffer.from(
          `${stableAuthorityStringify(envelope)}\n`,
          'utf8',
        )
        if (versionBytes.byteLength > MAX_PACKAGE_BYTES) {
          throw conflict('canonical_source_speech_evidence_package_too_large')
        }
        const currentPointer = await readLatestPointer(input.scope, locator)
        if (
          currentPointer
          && (
            evidence.evidenceRevision < currentPointer.evidenceRevision
            || (
              evidence.evidenceRevision === currentPointer.evidenceRevision
              && currentPointer.packageDigestSha256 !==
                evidence.contractDigestSha256
            )
          )
        ) {
          throw conflict(
            'canonical_source_speech_evidence_historical_replay_forbidden',
          )
        }
        const createResult = await writePrivateFileCreateOnlyWithinRoot({
          rootPath: input.scope.localStorageRoot,
          relativePath: versionFile,
          content: versionBytes,
        })
        const disposition =
          currentPointer?.packageDigestSha256 ===
            evidence.contractDigestSha256
            ? 'idempotent_replay'
            : currentPointer
              ? 'advanced_latest'
              : createResult.created
                ? 'created'
                : 'idempotent_replay'
        const pointerPayload = {
          recordVersion: LATEST_ENVELOPE_VERSION,
          source: RECORD_SOURCE,
          scopeHashSha256: scopeHash(input.scope),
          locatorId: locator.serverOwnedLocatorId,
          packageDigestSha256: evidence.contractDigestSha256,
          evidenceSnapshotId: evidence.evidenceSnapshotId,
          evidenceRevision: evidence.evidenceRevision,
        }
        const pointer = latestEnvelopeSchema.parse({
          ...pointerPayload,
          checksumSha256: sha256AuthorityValue(pointerPayload),
        })
        const pointerText = `${stableAuthorityStringify(pointer)}\n`
        if (Buffer.byteLength(pointerText, 'utf8') > MAX_POINTER_BYTES) {
          throw conflict('canonical_source_speech_evidence_pointer_too_large')
        }
        await writePrivateTextFileAtomicWithinRoot({
          rootPath: input.scope.localStorageRoot,
          relativePath: paths.latestFile,
          content: pointerText,
        })
        return {
          locator,
          packageDigestSha256: evidence.contractDigestSha256,
          disposition,
          persistence: this.persistence,
          rawMediaPersisted: false,
          browserPayloadPersisted: false,
          signedUrlPersisted: false,
          credentialPersisted: false,
          customerCreditsMutated: false,
          remoteMutationMade: false,
        }
      },
    })
  }

  async readByServerOwnedLocator(input: {
    readonly scope: CanonicalSourceSpeechEvidenceRepositoryScope
    readonly locator: unknown
  }): Promise<CanonicalSourceSpeechEvidencePackage> {
    validateScope(input.scope)
    const locator = canonicalSourceSpeechEvidenceLocatorSchema.parse(
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
        const pointer = await readLatestPointer(input.scope, locator)
        if (!pointer) throw notFound()
        const versionFile =
          `${paths.versionDirectory}/${pointer.packageDigestSha256}.json`
        const rawEnvelope = await readPrivateTextFileIfExistsWithinRoot({
          rootPath: input.scope.localStorageRoot,
          relativePath: versionFile,
        })
        if (
          !rawEnvelope
          || Buffer.byteLength(rawEnvelope, 'utf8') > MAX_PACKAGE_BYTES
        ) throw notFound()
        const envelope = parseJson(
          packageEnvelopeSchema,
          rawEnvelope,
          'canonical_source_speech_evidence_envelope_invalid',
        )
        const { checksumSha256, ...payload } = envelope
        if (
          envelope.scopeHashSha256 !== scopeHash(input.scope)
          || envelope.locatorId !== locator.serverOwnedLocatorId
          || envelope.package.contractDigestSha256 !==
            pointer.packageDigestSha256
          || envelope.package.evidenceSnapshotId !==
            pointer.evidenceSnapshotId
          || envelope.package.evidenceRevision !== pointer.evidenceRevision
          || checksumSha256 !== sha256AuthorityValue(payload)
        ) {
          throw conflict('canonical_source_speech_evidence_envelope_invalid')
        }
        const evidence = verifyCanonicalSourceSpeechEvidencePackage(
          envelope.package,
        )
        if (
          evidence.workspaceId !== input.scope.workspaceId
          || deriveCanonicalSourceSpeechEvidenceLocator(evidence)
            .serverOwnedLocatorId !== locator.serverOwnedLocatorId
        ) {
          throw notFound()
        }
        return evidence
      },
    })
  }
}

export function deriveCanonicalSourceSpeechEvidenceLocator(
  evidence: Pick<
    CanonicalSourceSpeechEvidencePackage,
    | 'workspaceId'
    | 'projectId'
    | 'editSessionId'
    | 'sourceSequenceDigestSha256'
  >,
): CanonicalSourceSpeechEvidenceLocator {
  return canonicalSourceSpeechEvidenceLocatorSchema.parse({
    schemaVersion: CANONICAL_SOURCE_SPEECH_EVIDENCE_LOCATOR_VERSION,
    serverOwnedLocatorId: `source-speech-${sha256AuthorityValue({
      workspaceId: evidence.workspaceId,
      projectId: evidence.projectId,
      editSessionId: evidence.editSessionId,
      sourceSequenceDigestSha256: evidence.sourceSequenceDigestSha256,
    })}`,
  })
}

async function readLatestPointer(
  scope: CanonicalSourceSpeechEvidenceRepositoryScope,
  locator: CanonicalSourceSpeechEvidenceLocator,
) {
  const paths = repositoryPaths(scope, locator.serverOwnedLocatorId)
  const raw = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.latestFile,
  })
  if (!raw) return undefined
  if (Buffer.byteLength(raw, 'utf8') > MAX_POINTER_BYTES) {
    throw conflict('canonical_source_speech_evidence_pointer_invalid')
  }
  const pointer = parseJson(
    latestEnvelopeSchema,
    raw,
    'canonical_source_speech_evidence_pointer_invalid',
  )
  const { checksumSha256, ...payload } = pointer
  if (
    pointer.scopeHashSha256 !== scopeHash(scope)
    || pointer.locatorId !== locator.serverOwnedLocatorId
    || checksumSha256 !== sha256AuthorityValue(payload)
  ) throw conflict('canonical_source_speech_evidence_pointer_invalid')
  return pointer
}

function repositoryPaths(
  scope: CanonicalSourceSpeechEvidenceRepositoryScope,
  locatorId: string,
) {
  const base = [
    'canonical-source-speech-evidence',
    'scopes',
    scopeHash(scope),
    'locators',
    sha256AuthorityValue(locatorId),
  ].join('/')
  return {
    versionDirectory: `${base}/versions`,
    latestFile: `${base}/latest.json`,
    lockFile: `${base}/repository.lock`,
  }
}

function scopeHash(scope: CanonicalSourceSpeechEvidenceRepositoryScope) {
  return sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
  })
}

function validateScope(
  scope: CanonicalSourceSpeechEvidenceRepositoryScope,
): void {
  if (
    !scope.localStorageRoot.trim()
    || !safeIdentitySchema.safeParse(scope.ownerUserId).success
    || !safeIdentitySchema.safeParse(scope.workspaceId).success
  ) throw conflict('canonical_source_speech_evidence_scope_invalid')
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
    'Canonical source speech evidence is stale or invalid.',
    409,
    { reason },
  )
}

function notFound(): ApiError {
  return new ApiError(
    'STORAGE_OBJECT_NOT_FOUND',
    'Canonical source speech evidence was not found.',
    404,
  )
}
