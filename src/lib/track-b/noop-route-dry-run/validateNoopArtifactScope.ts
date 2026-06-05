import type {
  NoopRouteArtifactScope,
  NoopRouteValidationResult,
} from './noopRouteDryRunTypes'

const BLOCKED_ARTIFACT_CLASS_PATTERNS = [
  'media',
  'audio',
  'video',
  'model',
  'ocr',
  'vlm',
  'provider',
  'public',
]

export function validateNoopArtifactScope(artifactScope: NoopRouteArtifactScope): NoopRouteValidationResult {
  const blockedReasons: string[] = []
  if (!artifactScope.inputArtifactScopeId) blockedReasons.push('missing_input_artifact_scope_id')
  if (!artifactScope.outputArtifactScopeId) blockedReasons.push('missing_output_artifact_scope_id')
  if (artifactScope.noMediaInput !== true) blockedReasons.push('media_artifact_blocked')
  if (artifactScope.noAudioInput !== true) blockedReasons.push('audio_artifact_blocked')
  if (artifactScope.noModelInput !== true) blockedReasons.push('model_artifact_blocked')
  if (artifactScope.noProviderOutput !== true) blockedReasons.push('provider_output_blocked')
  if (artifactScope.privateMetadataOnlyReportScope !== true) blockedReasons.push('metadata_only_scope_required')
  if (artifactScope.publicOutputAllowed) blockedReasons.push('public_output_blocked')
  if (artifactScope.signedUrlSourceOfTruthAllowed) blockedReasons.push('signed_url_source_blocked')
  if (artifactScope.arbitraryPathAllowed) blockedReasons.push('arbitrary_path_blocked')
  if (artifactScope.broadMediaAllowed) blockedReasons.push('broad_media_blocked')
  if (artifactScope.payloadUploadInPhase44L) blockedReasons.push('payload_upload_not_part_of_noop_dry_run')
  if (artifactScope.validatorCompatibility?.result?.accepted !== true) blockedReasons.push('artifact_scope_validator_rejected')
  for (const artifactClass of artifactScope.artifactClasses ?? []) {
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
