export const CANONICAL_GOOGLE_SECRET_MANAGER_REFERENCE_VERSION =
  'canonical-google-secret-manager-reference-v1' as const

export type CanonicalGoogleSecretManagerReferenceStatus =
  | 'accepted_pinned_positive_version'
  | 'blocked_missing_reference'
  | 'blocked_latest_alias'
  | 'blocked_short_or_name_only_reference'
  | 'blocked_nonpositive_version'
  | 'blocked_malformed_reference'

export interface CanonicalGoogleSecretManagerReference {
  readonly contractVersion: typeof CANONICAL_GOOGLE_SECRET_MANAGER_REFERENCE_VERSION
  readonly status: 'accepted_pinned_positive_version'
  readonly resourceName: string
  readonly projectId: string
  readonly secretId: string
  readonly version: string
  readonly pinnedPositiveVersionVerified: true
}

export type CanonicalGoogleSecretManagerReferenceParseResult =
  | {
      readonly ok: true
      readonly status: 'accepted_pinned_positive_version'
      readonly reference: CanonicalGoogleSecretManagerReference
    }
  | {
      readonly ok: false
      readonly status: Exclude<
        CanonicalGoogleSecretManagerReferenceStatus,
        'accepted_pinned_positive_version'
      >
    }

const PROJECT_SEGMENT = '[A-Za-z0-9][A-Za-z0-9._:-]{0,127}'
const SECRET_SEGMENT = '[A-Za-z0-9][A-Za-z0-9_-]{0,254}'
const EXACT_REFERENCE_PATTERN = new RegExp(
  `^projects/(${PROJECT_SEGMENT})/secrets/(${SECRET_SEGMENT})/versions/([^/]+)$`,
)

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Parses configuration metadata only. It never resolves, reads, hashes, or
 * otherwise handles a Secret Manager payload.
 */
export function parseCanonicalGoogleSecretManagerReference(
  value: string | undefined,
): CanonicalGoogleSecretManagerReferenceParseResult {
  const cleaned = clean(value)
  if (!cleaned) return { ok: false, status: 'blocked_missing_reference' }
  if (/\/versions\/latest$/i.test(cleaned)) {
    return { ok: false, status: 'blocked_latest_alias' }
  }
  if (
    !cleaned.includes('/')
    || /^projects\/[^/]+\/secrets\/[^/]+$/i.test(cleaned)
  ) {
    return { ok: false, status: 'blocked_short_or_name_only_reference' }
  }

  const match = EXACT_REFERENCE_PATTERN.exec(cleaned)
  if (!match) return { ok: false, status: 'blocked_malformed_reference' }
  const [, projectId, secretId, version] = match
  if (!/^[1-9][0-9]*$/.test(version)) {
    return {
      ok: false,
      status: /^[0-9]+$/.test(version)
        ? 'blocked_nonpositive_version'
        : 'blocked_malformed_reference',
    }
  }

  return {
    ok: true,
    status: 'accepted_pinned_positive_version',
    reference: Object.freeze({
      contractVersion: CANONICAL_GOOGLE_SECRET_MANAGER_REFERENCE_VERSION,
      status: 'accepted_pinned_positive_version',
      resourceName: cleaned,
      projectId,
      secretId,
      version,
      pinnedPositiveVersionVerified: true,
    }),
  }
}

export function projectCanonicalGoogleSecretManagerReferenceForPublicDiagnostics(
  reference: CanonicalGoogleSecretManagerReference,
): {
  readonly secretId: '[REDACTED_SECRET_ID]'
  readonly version: string
  readonly pinnedPositiveVersionVerified: true
} {
  return Object.freeze({
    secretId: '[REDACTED_SECRET_ID]',
    version: reference.version,
    pinnedPositiveVersionVerified: true,
  })
}
