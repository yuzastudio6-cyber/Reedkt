import type {
  LocalWorkerSidecarArtifactScopeValidationRequest,
  LocalWorkerSidecarArtifactScopeValidationResponse,
} from './localWorkerSidecarTypes'

const APPROVED_PRIVATE_PREFIXES = [
  'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/',
  'gs://reeditpro-staging-reeditpro-worker-temp/track-b/',
]

export function validateLocalWorkerArtifactScope(
  request: LocalWorkerSidecarArtifactScopeValidationRequest,
): LocalWorkerSidecarArtifactScopeValidationResponse {
  const blockedReasons: string[] = []
  if (!request.artifactScopeId) blockedReasons.push('missing_artifact_scope_id')
  if (!request.artifactClasses?.length) blockedReasons.push('missing_artifact_classes')
  if (!request.privateGcsPrefix) blockedReasons.push('missing_private_gcs_prefix')
  if (request.privateGcsPrefix && !APPROVED_PRIVATE_PREFIXES.some((prefix) => request.privateGcsPrefix?.startsWith(prefix))) {
    blockedReasons.push('arbitrary_gcs_prefix_blocked')
  }
  if (!request.localTempScope) blockedReasons.push('missing_local_temp_scope')
  if (request.publicOutputRequested) blockedReasons.push('public_artifact_blocked')
  if (request.arbitraryPathRequested) blockedReasons.push('arbitrary_path_blocked')
  if (request.signedUrlAsSourceOfTruth) blockedReasons.push('signed_url_source_of_truth_blocked')
  if (request.committedPrivatePayloadRequested) blockedReasons.push('committed_private_payload_blocked')
  if (request.broadMediaBucketRequested) blockedReasons.push('broad_media_bucket_blocked')

  return {
    type: 'artifact_scope_validate_response',
    accepted: blockedReasons.length === 0,
    blockedReasons,
    redactedScope: {
      artifactScopeId: request.artifactScopeId,
      privateGcsPrefixBucket: request.privateGcsPrefix?.split('/').slice(0, 3).join('/'),
      localTempScopePolicy: 'ephemeral_only',
    },
  }
}
