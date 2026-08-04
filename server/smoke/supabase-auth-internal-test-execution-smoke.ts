import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { readFile, rm } from 'node:fs/promises'
import { relative, join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import type { RuntimeClients } from '../types'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { PlannerInput } from '../../src/types/reeditpro'
import type { PrivateInternalTestRunJsonResponse } from './private-internal-test-run-smoke-types'

const localStorageRoot = '/tmp/reeditpro-supabase-auth-internal-test-execution-smoke'
await rm(localStorageRoot, { force: true, recursive: true })

const verifiedToken = 'internal-test-supabase-auth-token'
let authVerificationCount = 0
let adminPersistenceAttemptCount = 0

const fakeClients: RuntimeClients = {
  public: {
    auth: {
      async getUser(token: string) {
        authVerificationCount += 1
        if (token !== verifiedToken) {
          return {
            data: { user: null },
            error: { message: 'Invalid token for internal test smoke.' },
          }
        }

        return {
          data: {
            user: {
              id: 'supabase-user-internal-test',
              email: 'internal-tester@reeditpro.local',
              app_metadata: {},
              user_metadata: { display_name: 'Internal Tester' },
              aud: 'authenticated',
              created_at: new Date(0).toISOString(),
            },
          },
          error: null,
        }
      },
    },
  } as unknown as SupabaseClient,
  admin: {
    from(tableName: string) {
      adminPersistenceAttemptCount += 1
      throw new Error(`Unexpected Supabase admin persistence attempt against ${tableName}.`)
    },
  } as unknown as SupabaseClient,
}

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: 'https://supabase-auth-internal-test.reeditpro.local',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
})
assert.equal(env.mockOnly, false, 'Supabase-configured local runtime should not be globally mock-only.')
assert.equal(env.allowInternalTestExecutionWithSupabase, true)

const sourceFixture = await createSyntheticMp4Fixture({
  localStorageRoot,
  outputPath: join(localStorageRoot, 'fixtures', 'signed-in-source.mp4'),
  durationSeconds: 1,
  width: 160,
  height: 90,
})
assert.equal(sourceFixture.available, true, `Synthetic signed-in source fixture should be available: ${sourceFixture.warnings.join('; ')}`)
assert.ok(sourceFixture.outputPath, 'Synthetic signed-in source fixture should expose its local file path.')

const sourceBytes = await readFile(sourceFixture.outputPath)
const sourceChecksumSha256 = createHash('sha256').update(sourceBytes).digest('hex')
const sourceStoragePath = relative(localStorageRoot, sourceFixture.outputPath).split('/').join('/')

const plannerInput: PlannerInput = {
  projectName: 'Signed-in internal edit test',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'storytelling',
  workflowType: 'custom_let_ai_decide',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'clean',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Create a clean private internal edit for a signed-in tester.',
  creditPreference: 'balanced',
  clips: [
    {
      id: 'signed-in-source-clip',
      fileName: 'signed-in-source.mp4',
      duration: '1s',
      detectedType: 'Talking head source',
      notes: 'Uploaded private local source used by a signed-in internal tester.',
      previewLabel: 'Signed-in source clip',
      thumbnailHint: 'Synthetic signed-in private source',
      sourceRole: 'main_story',
      uploadedOrder: 1,
    },
  ],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
}

const plan = createMockEditPlan(plannerInput)
const snapshot = createApprovedPlanSnapshot({
  approvedBy: 'supabase-user-internal-test',
  editSessionId: 'edit-session-signed-in-internal-test',
  projectId: 'project-signed-in-internal-test',
  plan,
})
const compactSnapshot = {
  id: snapshot.id,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  editPlanVersionId: snapshot.editPlanVersionId,
  creditEstimateId: snapshot.creditEstimateId,
  approvedAt: snapshot.approvedAt,
  approvedBy: snapshot.approvedBy,
  compiledIntent: snapshot.compiledIntent,
  sourceSequence: snapshot.sourceSequence,
  segments: snapshot.segments,
  operations: snapshot.operations,
  rendererLayers: snapshot.rendererLayers,
  masterTimingPlan: snapshot.masterTimingPlan,
  captionVisualCueTimingPlan: snapshot.captionVisualCueTimingPlan,
  sourceCleanupPlan: snapshot.sourceCleanupPlan,
  sourcePlan: {
    goalSummary: snapshot.sourcePlan.goalSummary,
  },
  creditEstimate: snapshot.creditEstimate,
  colorPipelinePlan: snapshot.colorPipelinePlan,
  editingAgentExecutionPlan: snapshot.editingAgentExecutionPlan,
  asyncAssetReconciliationPlan: snapshot.asyncAssetReconciliationPlan,
  agentQAFallbackPlan: snapshot.agentQAFallbackPlan,
  qaPlan: snapshot.qaPlan,
  toolStrategyPlan: snapshot.toolStrategyPlan,
}

const app = createReeditProApiApp(env, { clients: fakeClients })
const server = await listen(createServer(app))

try {
  const baseUrl = `http://127.0.0.1:${addressPort(server)}`
  const unauthenticatedResponse = await fetch(
    `${baseUrl}/v1/edit-executions/private-internal-test-runs`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    },
  )
  assert.equal(unauthenticatedResponse.status, 401, 'The legacy catch-all must authenticate before returning its closed-gate status.')
  assert.equal(authVerificationCount, 0, 'A request without a bearer token must fail before Supabase token verification.')

  const response = await postJson(
    `${baseUrl}/v1/edit-executions/private-internal-test-runs`,
    {
      workspaceId: 'workspace-signed-in-internal-test',
      projectId: snapshot.projectId,
      approvedPlanSnapshotId: snapshot.id,
      approvedSnapshot: compactSnapshot,
      creditReservationId: 'credit-reservation-signed-in-internal-test',
      requestedAdapterToolNames: ['d3', 'three', 'sam3_1'],
      packageReadyToolIds: ['d3', 'three', 'sam3_1'],
      modelWeightApprovedToolIds: ['sam3_1'],
      internalTestRunOnly: true,
      sourceMediaAssets: [
        {
          mediaAssetId: 'signed-in-local-media-asset-001',
          sourceSequenceItemId: snapshot.sourceSequence[0]?.id,
          uploadedClipId: 'signed-in-source-clip',
          uploadedOrder: 1,
          storageProvider: 'local_private',
          storagePath: sourceStoragePath,
          fileName: 'signed-in-source.mp4',
          mimeType: 'video/mp4',
          byteSize: sourceBytes.byteLength,
          checksumSha256: sourceChecksumSha256,
          privateArtifact: true,
          publicUrl: null,
          signedUrl: null,
        },
      ],
      maxDurationSeconds: 2,
      targetWidth: 320,
      targetHeight: 568,
      fps: 24,
      reviewerNote: 'Signed-in smoke approves the private preview for final-render readiness.',
    },
    'signed-in-private-internal-test-run',
    verifiedToken,
  )
  assert.equal(
    response.status,
    503,
    `Legacy caller-authored execution must stay disabled for signed-in Supabase users: ${JSON.stringify(response.json)}`,
  )
  assert.equal(response.json.error?.code, 'TOOL_NOT_READY')
  assert.deepEqual(response.json.error?.details, {
    requiredGate: 'canonical_browser_consumption_of_planning_handoff',
  })
  assert.equal(authVerificationCount, 1, 'The fail-closed route must still verify the bearer token through Supabase auth.')
  assert.equal(adminPersistenceAttemptCount, 0, 'The disabled legacy route must not write to Supabase persistence tables.')
  assert.equal(response.json.data?.internalTestRun, undefined, 'The disabled route must not create an internal test run.')

  console.log(JSON.stringify({
    ok: true,
    status: 'blocked_by_canonical_browser_consumption_of_planning_handoff',
    checks: [
      'unauthenticated_legacy_route_request_rejected',
      'supabase_bearer_auth_verified_before_legacy_route_rejection',
      'supabase_configured_runtime_not_globally_mock_only',
      'legacy_caller_authored_execution_route_fails_closed',
      'no_supabase_admin_write_execution_artifact_or_delivery_side_effect',
    ],
    authVerificationCount,
    nextRequiredGate: 'canonical_browser_consumption_of_planning_handoff',
  }))
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await rm(localStorageRoot, { force: true, recursive: true })
}

function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function addressPort(server: Server): number {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected server to listen on a TCP port.')
  return address.port
}

async function postJson(
  url: string,
  body: unknown,
  idempotencyKey: string,
  token: string,
): Promise<{ status: number; json: PrivateInternalTestRunJsonResponse }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })
  return {
    status: response.status,
    json: await response.json() as PrivateInternalTestRunJsonResponse,
  }
}
