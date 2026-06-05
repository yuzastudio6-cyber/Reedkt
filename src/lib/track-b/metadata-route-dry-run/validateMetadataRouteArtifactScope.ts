import type {
  MetadataRouteArtifactScope,
  MetadataRouteValidationResult,
} from './metadataRouteDryRunTypes'

const BLOCKED_ARTIFACT_CLASS_PATTERNS = [
  'media_payload',
  'audio_payload',
  'video_payload',
  'model_payload',
  'provider_payload',
  'public',
  'signed_url',
]

export function validateMetadataRouteArtifactScope(artifactScope: MetadataRouteArtifactScope): MetadataRouteValidationResult {
  const blockedReasons: string[] = []
  if (!artifactScope.inputArtifactScopeId) blockedReasons.push('missing_input_artifact_scope_id')
  if (!artifactScope.outputArtifactScopeId) blockedReasons.push('missing_output_artifact_scope_id')
  if (artifactScope.noMediaInput !== true) blockedReasons.push('media_artifact_blocked')
  if (artifactScope.noAudioInput !== true) blockedReasons.push('audio_artifact_blocked')
  if (artifactScope.noModelInput !== true) blockedReasons.push('model_artifact_blocked')
  if (artifactScope.noProviderOutput !== true) blockedReasons.push('provider_output_blocked')
  if (artifactScope.publicOutputAllowed) blockedReasons.push('public_output_blocked')
  if (artifactScope.signedUrlSourceOfTruthAllowed) blockedReasons.push('signed_url_source_blocked')
  if (artifactScope.arbitraryLocalPathAllowed || artifactScope.arbitraryGcsPrefixAllowed) blockedReasons.push('arbitrary_path_blocked')
  if (artifactScope.broadMediaAllowed) blockedReasons.push('broad_media_blocked')
  if (artifactScope.committedPayloadAllowed) blockedReasons.push('committed_private_payload_blocked')

  for (const artifactClass of [...(artifactScope.allowedInputArtifactClasses ?? []), ...(artifactScope.allowedOutputArtifactClasses ?? [])]) {
    const normalized = artifactClass.toLowerCase()
    if (BLOCKED_ARTIFACT_CLASS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
      blockedReasons.push('media_artifact_blocked')
    }
  }

  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  return {
    status: uniqueBlockedReasons.length === 0 ? 'passed' : 'blocked',
    passed: uniqueBlockedReasons.length === 0,
    blockedReasons: uniqueBlockedReasons,
    warnings: [],
  }
}
