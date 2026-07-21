import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error'

export const EDIT_REFERENCE_PRODUCTION_OUTPUT_FRAME_AUTHORITY_VERSION =
  'edit-reference-production-output-frame-authority-v1' as const

export type EditReferenceProductionOutputAspectRatio =
  | '9:16'
  | '16:9'
  | '1:1'
  | '4:5'
  | '4:3'

export interface EditReferenceProductionOutputFrameAuthorityInput {
  readonly repositoryAuthority: 'supabase_rls_transactional'
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly exactEditPreferenceRecordRevision: number
  readonly planningInputRevision: number
  readonly confirmationId: string
  readonly aspectRatio: EditReferenceProductionOutputAspectRatio
  readonly confirmedAt: string
}

export interface EditReferenceProductionOutputFrameAuthority
  extends EditReferenceProductionOutputFrameAuthorityInput {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_OUTPUT_FRAME_AUTHORITY_VERSION
  readonly sourceAuthority: 'canonical_exact_edit_preference_frame_confirmation'
  readonly browserSuppliedAuthorityAccepted: false
  readonly authorityDigestSha256: string
}

type AuthorityWithoutDigest = Omit<
  EditReferenceProductionOutputFrameAuthority,
  'authorityDigestSha256'
>

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const ASPECT_RATIOS = new Set<EditReferenceProductionOutputAspectRatio>([
  '9:16',
  '16:9',
  '1:1',
  '4:5',
  '4:3',
])
const INPUT_KEYS = [
  'repositoryAuthority',
  'workspaceId',
  'projectId',
  'editSessionId',
  'exactEditPreferenceRecordRevision',
  'planningInputRevision',
  'confirmationId',
  'aspectRatio',
  'confirmedAt',
] as const

/**
 * Seals the existing exact-edit frame confirmation into the value that the
 * application lifecycle RPC must compare with its own transactional re-read.
 * It does not create or replace output-frame authority.
 */
export function createEditReferenceProductionOutputFrameAuthority(
  input: EditReferenceProductionOutputFrameAuthorityInput,
): EditReferenceProductionOutputFrameAuthority {
  assertExactKeys(input, INPUT_KEYS, 'output_frame_authority_input_shape_invalid')
  validateInput(input)
  const unsigned: AuthorityWithoutDigest = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_OUTPUT_FRAME_AUTHORITY_VERSION,
    sourceAuthority: 'canonical_exact_edit_preference_frame_confirmation',
    ...input,
    browserSuppliedAuthorityAccepted: false,
  }
  return {
    ...unsigned,
    authorityDigestSha256: sha256(unsigned),
  }
}

export function validateEditReferenceProductionOutputFrameAuthority(
  authority: EditReferenceProductionOutputFrameAuthority,
): void {
  assertExactKeys(authority, [
    'schemaVersion',
    'sourceAuthority',
    ...INPUT_KEYS,
    'browserSuppliedAuthorityAccepted',
    'authorityDigestSha256',
  ], 'output_frame_authority_shape_invalid')
  const { authorityDigestSha256, ...unsigned } = authority
  validateInput(authority)
  if (
    authority.schemaVersion !== EDIT_REFERENCE_PRODUCTION_OUTPUT_FRAME_AUTHORITY_VERSION
    || authority.sourceAuthority !== 'canonical_exact_edit_preference_frame_confirmation'
    || authority.browserSuppliedAuthorityAccepted !== false
    || !SHA256_PATTERN.test(authorityDigestSha256)
    || authorityDigestSha256 !== sha256(unsigned)
  ) invalid('output_frame_authority_digest_invalid')
}

function validateInput(input: EditReferenceProductionOutputFrameAuthorityInput): void {
  if (input.repositoryAuthority !== 'supabase_rls_transactional') {
    invalid('output_frame_authority_repository_invalid')
  }
  for (const value of [
    input.workspaceId,
    input.projectId,
    input.editSessionId,
    input.confirmationId,
  ]) {
    if (!ID_PATTERN.test(value)) invalid('output_frame_authority_scope_or_confirmation_invalid')
  }
  if (
    !Number.isInteger(input.exactEditPreferenceRecordRevision)
    || input.exactEditPreferenceRecordRevision < 0
    || !Number.isInteger(input.planningInputRevision)
    || input.planningInputRevision < 0
  ) invalid('output_frame_authority_revision_invalid')
  if (!ASPECT_RATIOS.has(input.aspectRatio)) invalid('output_frame_authority_aspect_ratio_invalid')
  if (!Number.isFinite(Date.parse(input.confirmedAt))) invalid('output_frame_authority_timestamp_invalid')
}

function sha256(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) invalid('output_frame_authority_non_canonical_value')
  return serialized
}

function assertExactKeys(value: object, expectedKeys: readonly string[], reason: string): void {
  const actual = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  if (JSON.stringify(actual) !== JSON.stringify(expected)) invalid(reason)
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The production output-frame authority for this Edit Reference application is incomplete or unsafe.',
    503,
    { reason, remoteMutationAttempted: false },
  )
}
