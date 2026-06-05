import type {
  NoopRouteArtifactScope,
  NoopRouteFailureFixture,
  NoopRouteFailureFixtureResult,
  NoopRoutePlanSnapshot,
} from './noopRouteDryRunTypes'
import { buildNoopRouteSecretPayloadGuard } from './noopRouteSecretGuard'
import { validateNoopArtifactScope } from './validateNoopArtifactScope'
import { validateNoopPlanSnapshot } from './validateNoopPlanSnapshot'

export const NOOP_ROUTE_DRY_RUN_FAILURE_FIXTURES: NoopRouteFailureFixture[] = [
  {
    fixtureId: 'fixture-secret-payload-requested',
    mutation: 'secret',
    expectedBlockedReason: 'unexpected_secret_payload_access_required',
    secretRequest: { serviceRoleSecretAccessRequested: true },
  },
  {
    fixtureId: 'fixture-raw-chat-execution-requested',
    mutation: 'plan',
    expectedBlockedReason: 'raw_chat_execution_blocked',
    planPatch: { rawChatExecution: true },
  },
  {
    fixtureId: 'fixture-route-execution-allowed-true',
    mutation: 'plan',
    expectedBlockedReason: 'route_execution_allowed_true_blocked',
    planPatch: { routeExecutionAllowed: true },
  },
  {
    fixtureId: 'fixture-runtime-execution-allowed-true',
    mutation: 'plan',
    expectedBlockedReason: 'runtime_execution_allowed_true_blocked',
    planPatch: { runtimeExecutionAllowed: true },
  },
  {
    fixtureId: 'fixture-real-tool-id-requested',
    mutation: 'plan',
    expectedBlockedReason: 'real_tool_id_requested',
    planPatch: { toolId: 'duckdb' },
  },
  {
    fixtureId: 'fixture-demucs-requested',
    mutation: 'plan',
    expectedBlockedReason: 'demucs_route_blocked',
    planPatch: { toolId: 'demucs' },
  },
  {
    fixtureId: 'fixture-vlm-requested',
    mutation: 'plan',
    expectedBlockedReason: 'vlm_route_blocked',
    planPatch: { toolId: 'qwen3_vl' },
  },
  {
    fixtureId: 'fixture-provider-call-requested',
    mutation: 'plan',
    expectedBlockedReason: 'provider_calls_blocked',
    planPatch: { providerCallsAllowed: true },
  },
  {
    fixtureId: 'fixture-public-output-requested',
    mutation: 'artifact',
    expectedBlockedReason: 'public_output_blocked',
    artifactPatch: { publicOutputAllowed: true },
  },
  {
    fixtureId: 'fixture-arbitrary-path-requested',
    mutation: 'artifact',
    expectedBlockedReason: 'arbitrary_path_blocked',
    artifactPatch: { arbitraryPathAllowed: true },
  },
  {
    fixtureId: 'fixture-media-artifact-requested',
    mutation: 'artifact',
    expectedBlockedReason: 'media_artifact_blocked',
    artifactPatch: { noMediaInput: false, artifactClasses: ['media_file'] },
  },
  {
    fixtureId: 'fixture-signed-url-source-requested',
    mutation: 'artifact',
    expectedBlockedReason: 'signed_url_source_blocked',
    artifactPatch: { signedUrlSourceOfTruthAllowed: true },
  },
]

export function runNoopRouteFailureFixtures(input: {
  planSnapshot: NoopRoutePlanSnapshot
  artifactScope: NoopRouteArtifactScope
}): NoopRouteFailureFixtureResult[] {
  return NOOP_ROUTE_DRY_RUN_FAILURE_FIXTURES.map((fixture) => {
    const blockedReasons =
      fixture.mutation === 'secret'
        ? buildNoopRouteSecretPayloadGuard(fixture.secretRequest).blockedReasons
        : fixture.mutation === 'plan'
          ? validateNoopPlanSnapshot({ ...input.planSnapshot, ...fixture.planPatch }).blockedReasons
          : validateNoopArtifactScope({ ...input.artifactScope, ...fixture.artifactPatch }).blockedReasons

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
