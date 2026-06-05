import type {
  MetadataRouteArtifactScope,
  MetadataRouteFailureFixture,
  MetadataRouteFailureFixtureResult,
  MetadataRoutePlanSnapshot,
} from './metadataRouteDryRunTypes'
import { buildMetadataRouteSecretPayloadGuard } from './metadataRouteSecretGuard'
import { validateMetadataRouteArtifactScope } from './validateMetadataRouteArtifactScope'
import { validateMetadataRouteCostGuard } from './validateMetadataRouteCostGuard'
import { validateMetadataRoutePlanSnapshot } from './validateMetadataRoutePlanSnapshot'

export const METADATA_ROUTE_DRY_RUN_FAILURE_FIXTURES: MetadataRouteFailureFixture[] = [
  { fixtureId: 'fixture-secret-payload-requested', mutation: 'secret', expectedBlockedReason: 'unexpected_secret_payload_access_required', secretRequest: { serviceRoleSecretAccessRequested: true } },
  { fixtureId: 'fixture-raw-chat-execution-requested', mutation: 'plan', expectedBlockedReason: 'raw_chat_execution_blocked', planPatch: { rawChatExecution: true } },
  { fixtureId: 'fixture-route-execution-allowed-true', mutation: 'plan', expectedBlockedReason: 'route_execution_allowed_true_blocked', planPatch: { routeExecutionAllowed: true } },
  { fixtureId: 'fixture-runtime-execution-allowed-true', mutation: 'plan', expectedBlockedReason: 'runtime_execution_allowed_true_blocked', planPatch: { runtimeExecutionAllowed: true } },
  { fixtureId: 'fixture-execute-tool-true', mutation: 'plan', expectedBlockedReason: 'execute_tool_true_blocked', planPatch: { executeTool: true } },
  { fixtureId: 'fixture-duckdb-runtime-requested', mutation: 'plan', expectedBlockedReason: 'duckdb_runtime_blocked', planPatch: { duckDbRuntimeExecutionAllowed: true } },
  { fixtureId: 'fixture-worker-execution-requested', mutation: 'plan', expectedBlockedReason: 'worker_execution_blocked', planPatch: { workerExecutionAllowed: true } },
  { fixtureId: 'fixture-sidecar-execution-requested', mutation: 'plan', expectedBlockedReason: 'sidecar_execution_blocked', planPatch: { sidecarExecutionAllowed: true } },
  { fixtureId: 'fixture-demucs-requested', mutation: 'plan', expectedBlockedReason: 'demucs_route_blocked', planPatch: { toolId: 'demucs' } },
  { fixtureId: 'fixture-vlm-requested', mutation: 'plan', expectedBlockedReason: 'vlm_route_blocked', planPatch: { toolId: 'qwen3_vl' } },
  { fixtureId: 'fixture-provider-call-requested', mutation: 'plan', expectedBlockedReason: 'provider_calls_blocked', planPatch: { providerCallsAllowed: true } },
  { fixtureId: 'fixture-public-output-requested', mutation: 'artifact', expectedBlockedReason: 'public_output_blocked', artifactPatch: { publicOutputAllowed: true } },
  { fixtureId: 'fixture-arbitrary-path-requested', mutation: 'artifact', expectedBlockedReason: 'arbitrary_path_blocked', artifactPatch: { arbitraryLocalPathAllowed: true } },
  { fixtureId: 'fixture-media-artifact-requested', mutation: 'artifact', expectedBlockedReason: 'media_artifact_blocked', artifactPatch: { noMediaInput: false, allowedInputArtifactClasses: ['media_payload'] } },
  { fixtureId: 'fixture-signed-url-source-requested', mutation: 'artifact', expectedBlockedReason: 'signed_url_source_blocked', artifactPatch: { signedUrlSourceOfTruthAllowed: true } },
  { fixtureId: 'fixture-cost-hard-block-requested', mutation: 'cost', expectedBlockedReason: 'cost_hard_block_requested', costPatch: { hardBlock: true } },
]

export function runMetadataRouteFailureFixtures(input: {
  planSnapshot: MetadataRoutePlanSnapshot
  artifactScope: MetadataRouteArtifactScope
}): MetadataRouteFailureFixtureResult[] {
  return METADATA_ROUTE_DRY_RUN_FAILURE_FIXTURES.map((fixture) => {
    const blockedReasons =
      fixture.mutation === 'secret'
        ? buildMetadataRouteSecretPayloadGuard(fixture.secretRequest).blockedReasons
        : fixture.mutation === 'plan'
          ? validateMetadataRoutePlanSnapshot({ ...input.planSnapshot, ...fixture.planPatch }).blockedReasons
          : fixture.mutation === 'artifact'
            ? validateMetadataRouteArtifactScope({ ...input.artifactScope, ...fixture.artifactPatch }).blockedReasons
            : validateMetadataRouteCostGuard({ costEntry: { toolId: 'duckdb', executionClass: 'metadata_only', estimateAllowed: true, costRiskClass: 'free_or_negligible' }, hardBlockRequested: fixture.costPatch?.hardBlock }).blockedReasons

    const uniqueBlockedReasons = [...new Set(blockedReasons)]
    return {
      fixtureId: fixture.fixtureId,
      status: uniqueBlockedReasons.length > 0 ? 'passed' : 'blocked',
      blocked: uniqueBlockedReasons.length > 0,
      blockedReasons: uniqueBlockedReasons,
      expectedBlockedReason: fixture.expectedBlockedReason,
      expectedBlockedReasonObserved: uniqueBlockedReasons.includes(fixture.expectedBlockedReason),
    }
  })
}
