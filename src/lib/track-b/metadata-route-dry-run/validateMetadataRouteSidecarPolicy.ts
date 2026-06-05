import {
  buildExecutionBlockedResponse,
  validateLocalWorkerArtifactScope,
  validateLocalWorkerPlanSnapshot,
} from '../local-worker-sidecar'
import type {
  MetadataRouteArtifactScope,
  MetadataRoutePlanSnapshot,
  MetadataRouteSidecarValidationReport,
} from './metadataRouteDryRunTypes'

export function validateMetadataRouteSidecarPolicy(input: {
  planSnapshot: MetadataRoutePlanSnapshot
  artifactScope: MetadataRouteArtifactScope
  auditRef: string
}): MetadataRouteSidecarValidationReport {
  const planResponse = validateLocalWorkerPlanSnapshot({
    type: 'plan_snapshot_validate_request',
    planSnapshotId: input.planSnapshot.planSnapshotId,
    routeId: input.planSnapshot.routeId,
    toolId: 'duckdb',
    capabilityId: input.planSnapshot.capabilityId,
    inputArtifactScopeId: input.planSnapshot.inputArtifactScopeId,
    outputArtifactScopeId: input.planSnapshot.outputArtifactScopeId,
    requestedAction: 'validate_only',
    confirmationPhase: 'Phase 44O metadata dry-run validation only',
    sourcePhase: '44O',
    routeManifestVersion: input.planSnapshot.routeManifestVersion,
    routeExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    publicOutputAllowed: false,
    broadMediaAllowed: false,
    arbitraryMediaAllowed: false,
    providerCallsAllowed: false,
    maxRuntimeBounds: {
      maxDurationSeconds: 0,
      maxInputCount: 0,
      maxOutputSizeBytes: 0,
    },
    auditReportPath: input.auditRef,
  })
  const artifactResponse = validateLocalWorkerArtifactScope({
    type: 'artifact_scope_validate_request',
    artifactScopeId: input.artifactScope.outputArtifactScopeId,
    artifactClasses: ['metadata_json', 'safe_markdown_report'],
    privateGcsPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase44o/metadata-route-dry-run/',
    localTempScope: 'phase44o-ephemeral-validation-only',
    publicOutputRequested: false,
    arbitraryPathRequested: false,
    signedUrlAsSourceOfTruth: false,
    committedPrivatePayloadRequested: false,
    broadMediaBucketRequested: false,
  })
  const blockedReasons = [...planResponse.blockedReasons, ...artifactResponse.blockedReasons]
  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  const passed = uniqueBlockedReasons.length === 0
  return {
    status: passed ? 'passed' : 'blocked',
    passed,
    blockedReasons: uniqueBlockedReasons,
    warnings: ['sidecar_policy_validation_only_execution_response_remains_blocked'],
    sidecarValidationStatus: passed ? 'passed' : 'blocked',
    planSnapshotAccepted: planResponse.accepted,
    artifactScopeAccepted: artifactResponse.accepted,
    executionBlockedResponse: buildExecutionBlockedResponse(input.auditRef),
    sidecarProcessStarted: false,
  }
}
