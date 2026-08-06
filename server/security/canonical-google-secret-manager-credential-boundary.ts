import {
  parseCanonicalGoogleSecretManagerReference,
  projectCanonicalGoogleSecretManagerReferenceForPublicDiagnostics,
  type CanonicalGoogleSecretManagerReferenceStatus,
} from '../../src/types/canonical-google-secret-manager-reference'

export const CANONICAL_GOOGLE_SECRET_MANAGER_CREDENTIAL_BOUNDARY_VERSION =
  'canonical-google-secret-manager-credential-boundary-v1' as const

export type CanonicalServerCredentialPurpose =
  | 'supabase_service_role_key'
  | 'provider_model_key'
  | 'internal_service_token'
  | 'webhook_signing_secret'
  | 'signing_private_key'
  | 'equivalent_server_secret'

export type CanonicalCredentialReferenceAuthoritySource =
  | 'server_process_configuration'
  | 'browser_body'
  | 'browser_header'
  | 'browser_query'
  | 'job_payload'
  | 'database_row'
  | 'github_secret'
  | 'direct_env_value'
  | 'service_account_json'

export type CanonicalGoogleRuntimeAuthenticationMechanism =
  | 'application_default_credentials_workload_identity'
  | 'service_account_json'
  | 'github_oidc_without_reviewed_workload_identity'
  | 'none'

export type CanonicalCredentialBoundaryStatus =
  | 'eligible_for_server_worker_resolution_binding'
  | 'blocked_unpinned_secret_reference'
  | 'blocked_non_server_reference_authority'
  | 'blocked_noncanonical_google_identity'
  | 'blocked_service_account_json'

export interface CanonicalCredentialBoundaryEvaluation {
  readonly contractVersion: typeof CANONICAL_GOOGLE_SECRET_MANAGER_CREDENTIAL_BOUNDARY_VERSION
  readonly status: CanonicalCredentialBoundaryStatus
  readonly purpose: CanonicalServerCredentialPurpose
  readonly referenceStatus: CanonicalGoogleSecretManagerReferenceStatus
  readonly referenceAuthoritySource: CanonicalCredentialReferenceAuthoritySource
  readonly runtimeAuthenticationMechanism: CanonicalGoogleRuntimeAuthenticationMechanism
  readonly redactedSecretId?: '[REDACTED_SECRET_ID]'
  readonly secretVersion?: string
  readonly pinnedPositiveVersionVerified: boolean
  readonly eligibleForServerWorkerResolutionBinding: boolean
  readonly liveResolutionAuthorized: false
  readonly productionReady: false
  readonly secretValueAccessed: false
  readonly secretValueLengthProjected: false
  readonly secretFingerprintProjected: false
  readonly browserAuthorityAccepted: false
  readonly jobPayloadAuthorityAccepted: false
  readonly databaseSecretAuthorityAccepted: false
  readonly directEnvProductionAuthorityAccepted: false
  readonly githubSecretProductionAuthorityAccepted: false
  readonly serviceAccountJsonAccepted: false
  readonly sqlServiceRoleGrantIsCredentialStorage: false
  readonly blockers: readonly string[]
}

export interface LegacyCredentialAuthorityDisposition {
  readonly path: string
  readonly classification:
    | 'legacy_github_secret_payload_noncanonical'
    | 'legacy_latest_payload_probe_noncanonical'
    | 'legacy_deploy_time_secret_env_binding_noncanonical'
  readonly productionQualificationGranted: false
  readonly replacementAuthority:
    | 'pinned_google_secret_manager_reference_with_workload_identity'
    | 'non_payload_metadata_probe_or_retirement'
}

export const LEGACY_GITHUB_SECRET_PAYLOAD_DISPOSITIONS = Object.freeze([
  '.github/workflows/internal-tester-browser-password-bootstrap.yml',
  '.github/workflows/internal-tester-profile-workspace-provisioning.yml',
  '.github/workflows/internal-tester-sign-in-auth-readback.yml',
  '.github/workflows/qwen-beta-config-probe.yml',
  '.github/workflows/qwen-live-beta-verification.yml',
  '.github/workflows/staging-media-analysis-canary.yml',
  '.github/workflows/staging-persisted-render-job-validation.yml',
  '.github/workflows/staging-real-video-upload-preview-canary.yml',
  '.github/workflows/staging-render-infrastructure-canary.yml',
  '.github/workflows/staging-sandbox-render-execution-canary.yml',
  '.github/workflows/staging-supabase-readonly-validation.yml',
  '.github/workflows/staging-supabase-write-smoke-validation.yml',
  '.github/workflows/staging-timeline-composition-canary.yml',
].map((path): LegacyCredentialAuthorityDisposition => Object.freeze({
  path,
  classification: 'legacy_github_secret_payload_noncanonical',
  productionQualificationGranted: false,
  replacementAuthority: 'pinned_google_secret_manager_reference_with_workload_identity',
})))

export const LEGACY_LATEST_SECRET_PAYLOAD_PROBE_DISPOSITIONS = Object.freeze([
  'scripts/gcp/verify-provider-secrets.safe.sh',
  'scripts/gcp/verify-openai-key.safe.sh',
].map((path): LegacyCredentialAuthorityDisposition => Object.freeze({
  path,
  classification: 'legacy_latest_payload_probe_noncanonical',
  productionQualificationGranted: false,
  replacementAuthority: 'non_payload_metadata_probe_or_retirement',
})))

export const LEGACY_DEPLOY_TIME_SECRET_ENV_BINDING_DISPOSITIONS = Object.freeze([
  'server/config/env.ts',
  '.github/workflows/beta-readiness-api-staging-deploy.yml',
].map((path): LegacyCredentialAuthorityDisposition => Object.freeze({
  path,
  classification: 'legacy_deploy_time_secret_env_binding_noncanonical',
  productionQualificationGranted: false,
  replacementAuthority: 'pinned_google_secret_manager_reference_with_workload_identity',
})))

export function evaluateCanonicalGoogleSecretManagerCredentialBoundary(input: {
  purpose: CanonicalServerCredentialPurpose
  reference?: string
  referenceAuthoritySource: CanonicalCredentialReferenceAuthoritySource
  runtimeAuthenticationMechanism: CanonicalGoogleRuntimeAuthenticationMechanism
}): CanonicalCredentialBoundaryEvaluation {
  const parsedReference = parseCanonicalGoogleSecretManagerReference(input.reference)
  const blockers: string[] = []

  if (!parsedReference.ok) blockers.push(parsedReference.status)
  if (input.referenceAuthoritySource !== 'server_process_configuration') {
    blockers.push(`reference_authority_${input.referenceAuthoritySource}_rejected`)
  }
  if (input.runtimeAuthenticationMechanism === 'service_account_json') {
    blockers.push('stored_service_account_json_rejected')
  } else if (
    input.runtimeAuthenticationMechanism
    !== 'application_default_credentials_workload_identity'
  ) {
    blockers.push('workload_identity_or_application_default_credentials_required')
  }

  const status: CanonicalCredentialBoundaryStatus = !parsedReference.ok
    ? 'blocked_unpinned_secret_reference'
    : input.referenceAuthoritySource !== 'server_process_configuration'
      ? 'blocked_non_server_reference_authority'
      : input.runtimeAuthenticationMechanism === 'service_account_json'
        ? 'blocked_service_account_json'
        : input.runtimeAuthenticationMechanism
            !== 'application_default_credentials_workload_identity'
          ? 'blocked_noncanonical_google_identity'
          : 'eligible_for_server_worker_resolution_binding'
  const publicReference = parsedReference.ok
    ? projectCanonicalGoogleSecretManagerReferenceForPublicDiagnostics(
        parsedReference.reference,
      )
    : undefined
  const eligibleForServerWorkerResolutionBinding = blockers.length === 0

  return Object.freeze({
    contractVersion: CANONICAL_GOOGLE_SECRET_MANAGER_CREDENTIAL_BOUNDARY_VERSION,
    status,
    purpose: input.purpose,
    referenceStatus: parsedReference.status,
    referenceAuthoritySource: input.referenceAuthoritySource,
    runtimeAuthenticationMechanism: input.runtimeAuthenticationMechanism,
    redactedSecretId: publicReference?.secretId,
    secretVersion: publicReference?.version,
    pinnedPositiveVersionVerified: parsedReference.ok,
    eligibleForServerWorkerResolutionBinding,
    liveResolutionAuthorized: false,
    productionReady: false,
    secretValueAccessed: false,
    secretValueLengthProjected: false,
    secretFingerprintProjected: false,
    browserAuthorityAccepted: false,
    jobPayloadAuthorityAccepted: false,
    databaseSecretAuthorityAccepted: false,
    directEnvProductionAuthorityAccepted: false,
    githubSecretProductionAuthorityAccepted: false,
    serviceAccountJsonAccepted: false,
    sqlServiceRoleGrantIsCredentialStorage: false,
    blockers: Object.freeze(blockers),
  })
}
