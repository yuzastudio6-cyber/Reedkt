import assert from 'node:assert/strict'

import {
  createApprovedEditExecutionAdapterWorkerArtifactIntegrationClient,
  createApprovedEditExecutionBoundedAdapterExecutionRunClient,
  createApprovedEditExecutionBoundedAdapterSourceTruthReviewClient,
  createApprovedEditExecutionDispatchReadinessClient,
  createApprovedEditExecutionFinalDeliveryQaReviewClient,
  createApprovedEditExecutionFinalRenderExecutionClient,
  createApprovedEditExecutionFinalRenderReadinessReviewClient,
  createApprovedEditExecutionHandlerDryRunClient,
  createApprovedEditExecutionLocalWorkerOutputClient,
  createApprovedEditExecutionLocalWorkerOutputQaReviewClient,
  createApprovedEditExecutionLocalMediaProcessingExecutionClient,
  createApprovedEditExecutionMockQueueClient,
  createApprovedEditExecutionMockWorkerClaimsClient,
  createApprovedEditExecutionJobBatchPlanClient,
  createApprovedEditExecutionPackageClient,
  createApprovedEditExecutionPrivateInternalTestRunClient,
  createApprovedEditExecutionPrivateInternalDownloadDeliveryClient,
  createApprovedEditExecutionPrivateMediaArtifactQaReviewClient,
  createApprovedEditExecutionPrivateWorkerArtifactQaReviewClient,
  createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerClient,
  createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewClient,
  createApprovedEditExecutionRegisteredAdapterRunnerProbeClient,
  createApprovedEditExecutionRenderPreviewAssemblyClient,
  createApprovedEditExecutionResultReconciliationClient,
  createApprovedEditExecutionUploadedMediaWorkerExecutionClient,
  createApprovedEditExecutionUserPreviewReviewClient,
  createApprovedEditExecutionWorkflowRehearsalClient,
  createExecutionSafeApprovedSnapshotPayload,
  getApprovedEditExecutionBoundedAdapterExecutionGateClient,
} from '../../src/lib/approved-edit-execution-package-client'

const approvedSnapshot = {
  id: 'approved-snapshot-client-smoke',
  projectId: 'project-client-smoke',
  editSessionId: 'edit-session-client-smoke',
  creditEstimateId: 'credit-estimate-client-smoke',
  sourceSequence: [{ id: 'source-1' }],
  segments: [{ id: 'segment-1' }],
  operations: [{ id: 'operation-1' }],
  editingAgentExecutionPlan: {
    workItems: [{ id: 'work-validate-approved-snapshot' }],
    assetManifest: [{ id: 'asset-1', storagePath: 'mock/private/asset-1' }],
  },
  professionalSkillPlan: {
    id: 'professional-skill-plan-client-smoke',
    status: 'ready_for_plan',
    source: 'professional_skill_planner',
    selectedSkillCount: 3,
    selectedFamilies: ['audio_cleanup', 'visual_graphics'],
    selectedSkills: [],
    backendIntents: [
      {
        intentId: 'intent.client_smoke.kimi_primary_edit_agent',
        intentKind: 'model_role',
        userFacingActivity: 'Build the edit plan from the uploaded source and prompt.',
        executionBoundary: 'backend_approved_after_snapshot',
        providerRoute: 'kimi_k3_provider_boundary',
        providerModel: 'kimi-k3',
        modelRoleId: 'kimi_k3_main_edit_agent',
        requestedModelUse: 'edit_planning',
        hiddenAdapterToolNames: [],
        requiredApprovalGates: [
          'approved_plan_snapshot',
          'credit_reservation',
          'idempotency_key',
          'private_artifact_policy',
        ],
      },
      {
        intentId: 'intent.client_smoke.qwen_first_fallback',
        intentKind: 'model_role',
        userFacingActivity: 'Continue approved edit planning after an allowed primary-route failure.',
        executionBoundary: 'backend_approved_after_snapshot',
        providerRoute: 'qwen_3_7_provider_boundary',
        providerModel: 'qwen3.7-max-2026-06-08',
        modelRoleId: 'qwen_3_7_main_edit_agent',
        requestedModelUse: 'edit_planning',
        hiddenAdapterToolNames: [],
        requiredApprovalGates: [
          'approved_plan_snapshot',
          'credit_reservation',
          'idempotency_key',
          'private_artifact_policy',
        ],
      },
      {
        intentId: 'intent.client_smoke.deepseek_final_fallback',
        intentKind: 'model_role',
        userFacingActivity: 'Continue approved edit planning after both earlier routes fail safely.',
        executionBoundary: 'backend_approved_after_snapshot',
        providerRoute: 'deepseek_v4_pro_tool_code_boundary',
        providerModel: 'deepseek-v4-pro',
        modelRoleId: 'deepseek_v4_tool_code_agent',
        requestedModelUse: 'edit_planning',
        hiddenAdapterToolNames: [],
        requiredApprovalGates: [
          'approved_plan_snapshot',
          'credit_reservation',
          'idempotency_key',
          'private_artifact_policy',
        ],
      },
      {
        intentId: 'intent.client_smoke.qwen_visual_understanding',
        intentKind: 'model_role',
        userFacingActivity: 'Prepare source visual understanding notes for the edit plan.',
        executionBoundary: 'backend_approved_after_snapshot',
        providerRoute: 'qwen2_5_vl_7b_instruct_provider_boundary',
        providerModel: 'Qwen2.5-VL-7B-Instruct',
        modelRoleId: 'qwen2_5_vl_visual_understanding',
        requestedModelUse: 'visual_understanding',
        hiddenAdapterToolNames: [],
        requiredApprovalGates: [
          'approved_plan_snapshot',
          'credit_reservation',
          'idempotency_key',
          'private_artifact_policy',
        ],
      },
    ],
    modelRoleTrace: {
      source: 'reeditpro_model_role_contract',
      contractVersion: 'reeditpro-model-role-routing-v2-kimi-primary',
      ok: true,
      blocked: false,
      checkedContractCount: 4,
      modelRoleIntentCount: 4,
      roles: [
        {
          modelRoleId: 'kimi_k3_main_edit_agent',
          providerBoundary: 'kimi_k3_provider_boundary',
          canonicalProviderModel: 'kimi-k3',
          requestedUses: ['edit_planning'],
          intentIds: ['intent.client_smoke.kimi_primary_edit_agent'],
          reasoningRouteRole: 'primary',
          reasoningRoutePriority: 1,
          fallbackOnly: false,
          userReasoningAllowed: true,
          editPlanningAllowed: true,
          creativeStrategyAllowed: true,
          editQaReasoningAllowed: true,
          visualUnderstandingAllowed: false,
          toolCodeAllowed: true,
          remotionDraftAllowed: true,
        },
        {
          modelRoleId: 'qwen_3_7_main_edit_agent',
          providerBoundary: 'qwen_3_7_provider_boundary',
          canonicalProviderModel: 'qwen3.7-max-2026-06-08',
          requestedUses: ['edit_planning'],
          intentIds: ['intent.client_smoke.qwen_first_fallback'],
          reasoningRouteRole: 'fallback',
          reasoningRoutePriority: 2,
          fallbackOnly: true,
          userReasoningAllowed: true,
          editPlanningAllowed: true,
          creativeStrategyAllowed: true,
          editQaReasoningAllowed: true,
          visualUnderstandingAllowed: false,
          toolCodeAllowed: true,
          remotionDraftAllowed: true,
        },
        {
          modelRoleId: 'deepseek_v4_tool_code_agent',
          providerBoundary: 'deepseek_v4_pro_tool_code_boundary',
          canonicalProviderModel: 'deepseek-v4-pro',
          requestedUses: ['edit_planning'],
          intentIds: ['intent.client_smoke.deepseek_final_fallback'],
          reasoningRouteRole: 'fallback',
          reasoningRoutePriority: 3,
          fallbackOnly: true,
          userReasoningAllowed: true,
          editPlanningAllowed: true,
          creativeStrategyAllowed: true,
          editQaReasoningAllowed: true,
          visualUnderstandingAllowed: false,
          toolCodeAllowed: true,
          remotionDraftAllowed: true,
        },
        {
          modelRoleId: 'qwen2_5_vl_visual_understanding',
          providerBoundary: 'qwen2_5_vl_7b_instruct_provider_boundary',
          canonicalProviderModel: 'qwen2.5-vl-7b-instruct',
          requestedUses: ['visual_understanding'],
          intentIds: ['intent.client_smoke.qwen_visual_understanding'],
          reasoningRouteRole: 'specialist',
          reasoningRoutePriority: null,
          fallbackOnly: false,
          userReasoningAllowed: false,
          editPlanningAllowed: false,
          creativeStrategyAllowed: false,
          editQaReasoningAllowed: false,
          visualUnderstandingAllowed: true,
          toolCodeAllowed: false,
          remotionDraftAllowed: false,
        },
      ],
      errors: [],
      mockOnly: true,
    },
    activityGroups: [
      {
        id: 'audio_cleanup',
        label: 'Audio cleanup',
        selectedActivityCount: 2,
        readyActivityCount: 2,
        reviewActivityCount: 0,
        blockedActivityCount: 0,
        status: 'ready_for_plan',
        userFacingSummary: 'Audio cleanup is ready for private planning.',
      },
      {
        id: 'visual_graphics',
        label: 'Visual graphics',
        selectedActivityCount: 1,
        readyActivityCount: 1,
        reviewActivityCount: 0,
        blockedActivityCount: 0,
        status: 'ready_for_plan',
        userFacingSummary: 'Visual support is ready for private planning.',
      },
    ],
    userFacingSummary: 'Professional preparation is ready.',
    userFacingActivities: ['Audio cleanup', 'Visual support'],
    hiddenAdapterToolNames: ['librosa', 'pydub', 'd3'],
    qaGateSummary: ['source order check', 'private review check'],
    blockers: [],
    warnings: ['No Edit Brief was provided; planning continues from prompt and source context.'],
    editBriefUsed: false,
    editBriefOptional: true,
    promptFirstPlanning: true,
    noUserVisibleToolNames: true,
  },
}

const uploadedSourceMediaAssets = [
  {
    mediaAssetId: 'media-asset-client-source-1',
    sourceSequenceItemId: 'source-1',
    uploadedClipId: 'uploaded-clip-client-1',
    uploadedOrder: 1,
    storageProvider: 'local_private' as const,
    storagePath: 'private/source/project-client-smoke/01-uploaded-clip-client-1.mp4',
    fileName: '01-uploaded-clip-client-1.mp4',
    mimeType: 'video/mp4',
    byteSize: 1_048_576,
    checksumSha256: 'b'.repeat(64),
    privateArtifact: true as const,
    publicUrl: null,
    signedUrl: null,
  },
]

const executionSafeSnapshot = createExecutionSafeApprovedSnapshotPayload({
  ...approvedSnapshot,
  sourcePlan: {
    id: 'source-plan-client-smoke',
    supabaseSchemaPlan: {
      tables: [{ rlsPolicies: [{ name: 'service_role_can_read', actor: 'service_role' }] }],
      storageBuckets: [{ signedUrlRecommended: true }],
    },
    supabaseProductionReadinessPlan: { checks: [{ id: 'signed_url_policy' }] },
  },
  supabaseSchemaPlan: {
    tables: [{ rlsPolicies: [{ name: 'service_role_can_read', actor: 'service_role' }] }],
    storageBuckets: [{ signedUrlRecommended: true }],
  },
  supabaseProductionReadinessPlan: { checks: [{ id: 'signed_url_policy' }] },
})
const executionSafeSnapshotJson = JSON.stringify(executionSafeSnapshot)
assert.equal(executionSafeSnapshot.id, approvedSnapshot.id, 'Execution-safe snapshot should preserve approved snapshot identity.')
assert.ok(executionSafeSnapshot.sourcePlan, 'Execution-safe snapshot should preserve the source plan shell.')
assert.equal(executionSafeSnapshot.supabaseSchemaPlan, undefined, 'Execution payload should omit Supabase schema planning metadata.')
assert.equal(executionSafeSnapshot.supabaseProductionReadinessPlan, undefined, 'Execution payload should omit Supabase production readiness planning metadata.')
assert.ok(!executionSafeSnapshotJson.includes('service_role'), 'Execution payload should omit service-role planning text.')
assert.ok(!executionSafeSnapshotJson.includes('signedUrlRecommended'), 'Execution payload should omit signed URL recommendation markers.')

const blocked = await createApprovedEditExecutionPackageClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  approvedPlanSnapshotId: approvedSnapshot.id,
  approvedSnapshot,
  creditReservationId: '',
  requestedAdapterToolNames: ['d3'],
})
assert.equal(blocked.ok, false, 'Client should block without credit reservation evidence.')
assert.equal(blocked.error?.code, 'invalid_edit_execution_package_input')

const snapshotWithoutModelRoleTrace = structuredClone(approvedSnapshot)
delete (snapshotWithoutModelRoleTrace.professionalSkillPlan as { modelRoleTrace?: unknown }).modelRoleTrace
const missingModelRoleTracePackage = await createApprovedEditExecutionPackageClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  approvedPlanSnapshotId: snapshotWithoutModelRoleTrace.id,
  approvedSnapshot: snapshotWithoutModelRoleTrace,
  creditReservationId: 'credit-reservation-client-smoke',
  requestedAdapterToolNames: [],
})
assert.equal(missingModelRoleTracePackage.ok, true, 'Client should return a blocked package for missing model-role trace evidence.')
const missingModelRoleTracePackageRecord = missingModelRoleTracePackage.data?.approvedEditExecutionPackage
assert.ok(missingModelRoleTracePackageRecord, 'Missing-trace package response should include the blocked package record.')
assert.equal(
  missingModelRoleTracePackageRecord.agentCallReady,
  false,
  'Package agent handoff should block without canonical model-role trace evidence.',
)
assert.ok(
  missingModelRoleTracePackageRecord.blockers.some((blocker) => /canonical model-role trace/i.test(blocker)),
  'Package should report the missing canonical model-role trace blocker.',
)

const created = await createApprovedEditExecutionPackageClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  approvedPlanSnapshotId: approvedSnapshot.id,
  approvedSnapshot,
  creditReservationId: 'credit-reservation-client-smoke',
  requestedAdapterToolNames: ['d3', 'three', 'sam2'],
  packageReadyToolIds: ['d3', 'three', 'sam2'],
  modelWeightApprovedToolIds: ['sam2'],
})

assert.equal(created.ok, true, 'Client should create a mock-safe approved execution package.')
const executionPackage = created.data?.approvedEditExecutionPackage
assert.ok(executionPackage, 'Client response should include approvedEditExecutionPackage.')
assert.equal(executionPackage.agentCallReady, true)
assert.equal(executionPackage.liveExecutionReady, false)
assert.equal(executionPackage.resolvedAdapterToolCount, 3)
assert.deepEqual(executionPackage.packageReadyToolIds, [])
assert.deepEqual(executionPackage.modelWeightApprovedToolIds, [])
assert.equal(executionPackage.boundedAdapterExecutionReady, false)
assert.equal(executionPackage.boundedAdapterReadyToolCount, 0)
assert.equal(executionPackage.boundedAdapterBlockedToolCount, 3)
assert.ok(executionPackage.boundedAdapterBlockers.some((blocker) => /source-truth|package\/runtime readiness/i.test(blocker)))
assert.equal(executionPackage.boundedAdapterExecutionGate?.status, 'blocked')
assert.equal(executionPackage.boundedAdapterExecutionGate?.clientReadinessHintsTrusted, false)
assert.equal(executionPackage.boundedAdapterExecutionGate?.serverSourceTruthRequired, true)
assert.equal(executionPackage.boundedAdapterExecutionGate?.frontendExecutionAllowed, false)
assert.equal(executionPackage.boundedAdapterExecutionGate?.productReady, false)
assert.ok((executionPackage.boundedAdapterExecutionGate?.blockedToolCount ?? 0) > 0)
assert.equal(executionPackage.professionalSkillTrace?.source, 'approved_professional_skill_plan')
assert.equal(executionPackage.professionalSkillTrace?.editBriefOptional, true)
assert.equal(executionPackage.professionalSkillTrace?.promptFirstPlanning, true)
assert.equal(executionPackage.professionalSkillTrace?.noUserVisibleToolNames, true)
assert.deepEqual(executionPackage.professionalSkillTrace?.selectedFamilies, ['audio_cleanup', 'visual_graphics'])
assert.equal(executionPackage.professionalSkillTrace?.activityGroups[0]?.readyActivityCount, 2)
assert.equal(executionPackage.professionalSkillTrace?.backendIntentCount, 4)
assert.deepEqual(executionPackage.professionalSkillTrace?.backendIntentKinds, ['model_role'])
assert.ok(
  executionPackage.professionalSkillTrace?.backendIntents.some((intent) =>
    intent.providerRoute === 'kimi_k3_provider_boundary' &&
    intent.modelRoleId === 'kimi_k3_main_edit_agent' &&
    intent.requestedModelUse === 'edit_planning',
  ),
  'Client package skill trace must preserve the Kimi K3 primary edit-agent backend intent.',
)
assert.ok(
  executionPackage.professionalSkillTrace?.backendIntents.some((intent) =>
    intent.providerRoute === 'qwen_3_7_provider_boundary' &&
    intent.modelRoleId === 'qwen_3_7_main_edit_agent' &&
    intent.requestedModelUse === 'edit_planning',
  ),
  'Client package skill trace must preserve the Qwen 3.7 first-fallback backend intent.',
)
assert.ok(
  executionPackage.professionalSkillTrace?.backendIntents.some((intent) =>
    intent.providerRoute === 'deepseek_v4_pro_tool_code_boundary' &&
    intent.modelRoleId === 'deepseek_v4_tool_code_agent' &&
    intent.requestedModelUse === 'edit_planning',
  ),
  'Client package skill trace must preserve the DeepSeek V4 Pro final-fallback backend intent.',
)
assert.ok(
  executionPackage.professionalSkillTrace?.backendIntents.some((intent) =>
    intent.providerRoute === 'qwen2_5_vl_7b_instruct_provider_boundary' &&
    intent.modelRoleId === 'qwen2_5_vl_visual_understanding' &&
    intent.requestedModelUse === 'visual_understanding',
  ),
  'Client package skill trace must preserve the visual-understanding backend intent.',
)
assert.ok(
  executionPackage.professionalSkillTrace?.modelRoleTrace.roles.some((role) =>
    role.modelRoleId === 'kimi_k3_main_edit_agent' &&
    role.canonicalProviderModel === 'kimi-k3' &&
    role.requestedUses.includes('edit_planning') &&
    role.reasoningRouteRole === 'primary' &&
    role.reasoningRoutePriority === 1 &&
    role.fallbackOnly === false,
  ),
  'Client package skill trace must preserve the canonical Kimi K3 primary model-role trace.',
)
assert.ok(
  executionPackage.professionalSkillTrace?.modelRoleTrace.roles.some((role) =>
    role.modelRoleId === 'qwen_3_7_main_edit_agent' &&
    role.canonicalProviderModel === 'qwen3.7-max-2026-06-08' &&
    role.requestedUses.includes('edit_planning') &&
    role.reasoningRouteRole === 'fallback' &&
    role.reasoningRoutePriority === 2 &&
    role.fallbackOnly === true,
  ),
  'Client package skill trace must preserve the canonical Qwen 3.7 fallback model-role trace.',
)
assert.ok(
  executionPackage.professionalSkillTrace?.modelRoleTrace.roles.some((role) =>
    role.modelRoleId === 'qwen2_5_vl_visual_understanding' &&
    role.canonicalProviderModel === 'qwen2.5-vl-7b-instruct' &&
    role.requestedUses.includes('visual_understanding'),
  ),
  'Client package skill trace must preserve the canonical Qwen2.5-VL model-role trace.',
)
assert.ok(Array.isArray(executionPackage.professionalSkillTrace?.warnings))
assert.ok(!/librosa|pydub|d3/i.test(JSON.stringify(executionPackage.professionalSkillTrace ?? {})), 'Client package skill trace must not expose internal tool names.')
assert.equal(executionPackage.privateArtifactRefCount, 1)
assert.ok(!executionPackage.userFacingSummary.toLowerCase().includes('d3'), 'User-facing summary must not expose tool names.')
assert.ok(executionPackage.noRuntimeSideEffects.some((note) => /did not dispatch workers/i.test(note)))

const boundedGateReadback = await getApprovedEditExecutionBoundedAdapterExecutionGateClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  packageRecordId: executionPackage.packageRecordId,
})
assert.equal(boundedGateReadback.ok, true, 'Client should read the bounded adapter execution gate through the frontend-safe route.')
assert.equal(boundedGateReadback.data?.boundedAdapterExecutionGate?.status, 'blocked')
assert.equal(boundedGateReadback.data?.boundedAdapterExecutionGate?.clientReadinessHintsTrusted, false)
assert.equal(boundedGateReadback.data?.boundedAdapterExecutionGate?.serverSourceTruthRequired, true)
assert.equal(boundedGateReadback.data?.boundedAdapterExecutionGate?.frontendExecutionAllowed, false)
assert.equal(boundedGateReadback.data?.boundedAdapterExecutionGate?.productReady, false)
assert.ok(boundedGateReadback.data?.boundedAdapterExecutionGate?.noRuntimeSideEffects.some((note) => /does not execute adapters/i.test(note)))

const untrustedClientSourceTruthReview = await createApprovedEditExecutionBoundedAdapterSourceTruthReviewClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  packageRecordId: executionPackage.packageRecordId,
  creditReservationId: 'credit-reservation-client-smoke',
  packageReadinessEvidence: [
    {
      toolId: 'd3',
      status: 'passed',
      source: 'browser_client_hint' as never,
      evidenceId: 'client-untrusted-evidence-d3',
      checkedAt: '2026-07-06T00:00:00.000Z',
      summary: 'Browser/client readiness hints must not be accepted as backend source truth.',
    },
  ],
  modelWeightApprovals: [],
})
assert.equal(untrustedClientSourceTruthReview.ok, false, 'Frontend-safe client must reject unapproved source-truth evidence sources.')
assert.equal(untrustedClientSourceTruthReview.error?.code, 'unapproved_bounded_adapter_source_truth_evidence')
assert.equal(untrustedClientSourceTruthReview.statusCode, 400)

const sourceTruthReview = await createApprovedEditExecutionBoundedAdapterSourceTruthReviewClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  packageRecordId: executionPackage.packageRecordId,
  creditReservationId: 'credit-reservation-client-smoke',
  packageReadinessEvidence: [
    {
      toolId: 'd3',
      status: 'passed',
      source: 'backend_tool_readiness_worker',
      evidenceId: 'client-evidence-d3',
      checkedAt: '2026-07-06T00:00:00.000Z',
      summary: 'd3 package readiness passed in backend-owned client smoke evidence.',
    },
    {
      toolId: 'three',
      status: 'passed',
      source: 'backend_tool_readiness_worker',
      evidenceId: 'client-evidence-three',
      checkedAt: '2026-07-06T00:00:00.000Z',
      summary: 'three package readiness passed in backend-owned client smoke evidence.',
    },
  ],
  modelWeightApprovals: [],
})
assert.equal(sourceTruthReview.ok, true, 'Client should create a backend-owned bounded adapter source-truth review.')
assert.equal(sourceTruthReview.data?.sourceTruthReview?.status, 'ready_for_bounded_execution')
assert.equal(sourceTruthReview.data?.sourceTruthReview?.acceptedPackageEvidenceCount, 2)
assert.equal(sourceTruthReview.data?.sourceTruthReview?.clientReadinessHintsTrusted, false)
assert.equal(sourceTruthReview.data?.sourceTruthReview?.frontendExecutionAllowed, false)
assert.equal(sourceTruthReview.data?.sourceTruthReview?.productReady, false)
assert.ok(sourceTruthReview.data?.sourceTruthReview?.noRuntimeSideEffects.some((note) => /does not import packages/i.test(note)))
assert.equal(sourceTruthReview.data?.approvedEditExecutionPackage?.professionalSkillTrace?.source, 'approved_professional_skill_plan')
assert.equal(sourceTruthReview.data?.approvedEditExecutionPackage?.professionalSkillTrace?.editBriefOptional, true)
assert.equal(sourceTruthReview.data?.approvedEditExecutionPackage?.professionalSkillTrace?.promptFirstPlanning, true)
assert.equal(sourceTruthReview.data?.approvedEditExecutionPackage?.professionalSkillTrace?.noUserVisibleToolNames, true)
assert.deepEqual(sourceTruthReview.data?.approvedEditExecutionPackage?.professionalSkillTrace?.selectedFamilies, ['audio_cleanup', 'visual_graphics'])
assert.equal(sourceTruthReview.data?.approvedEditExecutionPackage?.professionalSkillTrace?.backendIntentCount, 4)
assert.equal(sourceTruthReview.data?.approvedEditExecutionPackage?.boundedAdapterExecutionReady, true)
assert.equal(sourceTruthReview.data?.approvedEditExecutionPackage?.boundedAdapterReadyToolCount, 2)
assert.ok(
  !/librosa|pydub|d3/i.test(JSON.stringify(sourceTruthReview.data?.approvedEditExecutionPackage?.professionalSkillTrace ?? {})),
  'Source-truth-reviewed package skill trace must not expose internal tool names.',
)

const boundedAdapterExecutionRun = await createApprovedEditExecutionBoundedAdapterExecutionRunClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  packageRecordId: executionPackage.packageRecordId,
  creditReservationId: 'credit-reservation-client-smoke',
})
assert.equal(boundedAdapterExecutionRun.ok, true, 'Client should create a bounded adapter private manifest handoff.')
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.status, 'completed_private_manifest_handoff')
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.actualToolPackageExecutionCount, 0)
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.frontendExecutionAllowed, false)
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.productReady, false)
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.sourceTruthReviewReady, true)
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.professionalSkillTrace?.source, 'approved_professional_skill_plan')
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.professionalSkillTrace?.editBriefOptional, true)
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.professionalSkillTrace?.promptFirstPlanning, true)
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.professionalSkillTrace?.noUserVisibleToolNames, true)
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.professionalSkillTrace?.backendIntentCount, 4)
assert.equal(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.activityResults.length, 2)
assert.deepEqual(
  boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.activityResults.map((activity) => activity.canonicalToolId),
  ['d3', 'three'],
)
assert.ok(
  boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.activityResults.every((activity) => !/d3|three|librosa|pydub/i.test(activity.userFacingActivity)),
  'Bounded adapter handoff user-facing activity copy must not expose implementation tool names.',
)
assert.ok(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.activityResults.every((activity) => activity.privateResultManifest.privateArtifact === true))
assert.ok(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.activityResults.every((activity) => activity.privateResultManifest.publicArtifact === false))
assert.ok(boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.noRuntimeSideEffects.some((note) => /does not import packages/i.test(note)))

const registeredRunnerProbe = await createApprovedEditExecutionRegisteredAdapterRunnerProbeClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  boundedAdapterExecutionRunId: boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.id ?? '',
})
assert.equal(registeredRunnerProbe.ok, true, 'Client should create a registered adapter runner import probe.')
assert.equal(registeredRunnerProbe.data?.registeredRunnerRun?.probeOnly, true)
assert.equal(registeredRunnerProbe.data?.registeredRunnerRun?.status, 'completed_import_probe')
assert.equal(registeredRunnerProbe.data?.registeredRunnerRun?.mediaProcessingExecuted, false)
assert.equal(registeredRunnerProbe.data?.registeredRunnerRun?.frontendExecutionAllowed, false)
assert.equal(registeredRunnerProbe.data?.registeredRunnerRun?.productReady, false)
assert.equal(registeredRunnerProbe.data?.registeredRunnerRun?.packageRecordId, executionPackage.packageRecordId)
assert.equal(registeredRunnerProbe.data?.registeredRunnerRun?.boundedAdapterExecutionRunId, boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.id)
assert.equal(registeredRunnerProbe.data?.registeredRunnerRun?.professionalSkillTrace?.source, 'approved_professional_skill_plan')
assert.equal(registeredRunnerProbe.data?.registeredRunnerRun?.requestedActivityCount, 2)
assert.deepEqual(
  registeredRunnerProbe.data?.registeredRunnerRun?.results.map((result) => result.canonicalToolId),
  ['d3', 'three'],
)
assert.ok(registeredRunnerProbe.data?.registeredRunnerRun?.results.every((result) => result.activityResultId.startsWith('mock-bounded-adapter-activity-')))
assert.ok(registeredRunnerProbe.data?.registeredRunnerRun?.noRuntimeSideEffects.some((note) => /does not process media/i.test(note)))

const privateMediaRunnerRun = await createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  registeredRunnerRunId: registeredRunnerProbe.data?.registeredRunnerRun?.id ?? '',
  creditReservationId: 'credit-reservation-client-smoke',
})
assert.equal(privateMediaRunnerRun.ok, true, 'Client should create a registered adapter private runner manifest run.')
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.status, 'private_runner_manifest_ready')
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.registeredRunnerRunId, registeredRunnerProbe.data?.registeredRunnerRun?.id)
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.creditReservationId, 'credit-reservation-client-smoke')
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.mediaProcessingExecuted, false)
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.productRuntimeExecuted, false)
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.frontendExecutionAllowed, false)
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.productReady, false)
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.packageRecordId, executionPackage.packageRecordId)
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.boundedAdapterExecutionRunId, boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.id)
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.professionalSkillTrace?.source, 'approved_professional_skill_plan')
assert.equal(privateMediaRunnerRun.data?.privateMediaRunnerRun?.activities.length, 2)
assert.deepEqual(
  privateMediaRunnerRun.data?.privateMediaRunnerRun?.activities.map((activity) => activity.canonicalToolId),
  ['d3', 'three'],
)
assert.ok(
  privateMediaRunnerRun.data?.privateMediaRunnerRun?.activities.every((activity) => !/d3|three|librosa|pydub/i.test(activity.userFacingActivity)),
  'Private runner user-facing activity copy must not expose implementation tool names.',
)
assert.ok(privateMediaRunnerRun.data?.privateMediaRunnerRun?.activities.every((activity) => activity.privateRunnerResultManifest.privateArtifact === true))
assert.ok(privateMediaRunnerRun.data?.privateMediaRunnerRun?.activities.every((activity) => activity.privateRunnerResultManifest.publicArtifact === false))
assert.ok(privateMediaRunnerRun.data?.privateMediaRunnerRun?.noRuntimeSideEffects.some((note) => /does not process media/i.test(note)))

const privateMediaRunnerQaReview = await createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  privateMediaRunnerRunId: privateMediaRunnerRun.data?.privateMediaRunnerRun?.id ?? '',
  creditReservationId: 'credit-reservation-client-smoke',
})
assert.equal(privateMediaRunnerQaReview.ok, true, 'Client should create a registered adapter private runner QA review.')
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.status, 'private_adapter_result_qa_passed_waiting_final_render_integration')
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.privateMediaRunnerRunId, privateMediaRunnerRun.data?.privateMediaRunnerRun?.id)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.creditReservationId, 'credit-reservation-client-smoke')
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.mediaProcessingExecuted, false)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.productRuntimeExecuted, false)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.frontendExecutionAllowed, false)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.productReady, false)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.packageRecordId, executionPackage.packageRecordId)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.registeredRunnerRunId, registeredRunnerProbe.data?.registeredRunnerRun?.id)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.boundedAdapterExecutionRunId, boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.id)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.professionalSkillTrace?.source, 'approved_professional_skill_plan')
assert.deepEqual(
  privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.artifacts.map((artifact) => artifact.canonicalToolId),
  ['d3', 'three'],
)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.finalRenderIntegrationReadiness.ready, false)
assert.equal(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.nextRequiredGate, 'adapter_specific_worker_artifact_integration_with_private_render')
assert.ok(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.artifacts.every((artifact) => artifact.privateArtifact === true))
assert.ok(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.artifacts.every((artifact) => artifact.publicArtifact === false))
assert.ok(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.artifacts.every((artifact) => artifact.signedUrl === null))
assert.ok(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.artifacts.every((artifact) => artifact.sha256.length === 64 && artifact.byteSize > 0))
assert.ok(privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.noRuntimeSideEffects.some((note) => /does not process media/i.test(note)))

const adapterWorkerArtifactIntegration = await createApprovedEditExecutionAdapterWorkerArtifactIntegrationClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  privateMediaRunnerQaReviewId: privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.id ?? '',
  creditReservationId: 'credit-reservation-client-smoke',
})
assert.equal(adapterWorkerArtifactIntegration.ok, true, 'Client should create adapter worker artifact integration.')
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.status, 'adapter_worker_artifact_integration_passed_ready_for_render_preview')
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.privateMediaRunnerQaReviewId, privateMediaRunnerQaReview.data?.privateMediaRunnerQaReview?.id)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.creditReservationId, 'credit-reservation-client-smoke')
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.mediaProcessingExecuted, false)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.mediaTransformOutputCount, 0)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.productRuntimeExecuted, false)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.frontendExecutionAllowed, false)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.productReady, false)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.renderPreviewIntegrationReady, true)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.finalRenderDecisionManifestEligible, true)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.mediaTransformOutputEligible, false)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.packageRecordId, executionPackage.packageRecordId)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.privateMediaRunnerRunId, privateMediaRunnerRun.data?.privateMediaRunnerRun?.id)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.registeredRunnerRunId, registeredRunnerProbe.data?.registeredRunnerRun?.id)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.boundedAdapterExecutionRunId, boundedAdapterExecutionRun.data?.boundedAdapterExecutionRun?.id)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.professionalSkillTrace?.source, 'approved_professional_skill_plan')
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integrationManifestArtifact.privateArtifact, true)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integrationManifestArtifact.publicArtifact, false)
assert.equal(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integrationManifestArtifact.signedUrl, null)
assert.deepEqual(
  adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.artifacts.map((artifact) => artifact.canonicalToolId),
  ['d3', 'three'],
)
assert.ok(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.artifacts.every((artifact) => artifact.finalRenderIntegrationEligible === true && artifact.mediaTransformOutputEligible === false))
assert.ok(adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.noRuntimeSideEffects.some((note) => /does not execute adapter media transforms/i.test(note)))

const jobBatch = await createApprovedEditExecutionJobBatchPlanClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  packageRecordId: executionPackage.packageRecordId,
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  workItems: [
    {
      id: 'work-validate-approved-snapshot',
      workItemType: 'validate_approved_snapshot',
      status: 'ready',
      idempotencyKey: 'work-validate-approved-snapshot-key',
      expectedOutputs: [{ id: 'status-output' }],
      qaChecks: ['Approved snapshot must be present.'],
    },
    {
      id: 'work-render-preview',
      workItemType: 'render_remotion_preview',
      status: 'waiting_asset',
      idempotencyKey: 'work-render-preview-key',
      dependencies: [{ dependsOnWorkItemId: 'work-validate-approved-snapshot' }],
      expectedOutputs: [{ id: 'preview-output' }],
      qaChecks: ['Preview remains mock-only.'],
    },
  ],
})

assert.equal(jobBatch.ok, true, 'Client should create a mock-safe dry-run job batch plan.')
assert.equal(jobBatch.data?.jobBatchPlan?.plannedJobCount, 2)
assert.equal(jobBatch.data?.jobBatchPlan?.readyToQueueCount, 1)
assert.equal(jobBatch.data?.jobBatchPlan?.waitingDependencyCount, 1)
assert.equal(jobBatch.data?.jobBatchPlan?.dryRunOnly, true)
assert.ok(jobBatch.data?.jobBatchPlan?.noRuntimeSideEffects.some((note) => /did not claim workers/i.test(note)))

const mockQueue = await createApprovedEditExecutionMockQueueClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  jobBatchPlanId: jobBatch.data?.jobBatchPlan?.id ?? 'missing-job-batch-plan',
  packageRecordId: executionPackage.packageRecordId,
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  plannedJobs: [
    {
      id: 'planned-job-validate',
      workItemId: 'work-validate-approved-snapshot',
      jobType: 'validate_approved_snapshot',
      workerType: 'editing_supervisor_worker',
      status: 'ready_to_queue',
      idempotencyKey: 'work-validate-approved-snapshot-key',
      expectedOutputIds: ['status-output'],
      qaChecks: ['Approved snapshot must be present.'],
    },
    {
      id: 'planned-job-preview',
      workItemId: 'work-render-preview',
      jobType: 'render_remotion_preview',
      workerType: 'render_worker',
      status: 'waiting_dependency',
      idempotencyKey: 'work-render-preview-key',
      dependencyWorkItemIds: ['work-validate-approved-snapshot'],
      expectedOutputIds: ['preview-output'],
      qaChecks: ['Preview remains mock-only.'],
    },
  ],
})

assert.equal(mockQueue.ok, true, 'Client should create a mock queue from ready planned jobs.')
assert.equal(mockQueue.data?.mockQueue?.queuedJobCount, 1)
assert.equal(mockQueue.data?.mockQueue?.workersStarted, 0)
assert.equal(mockQueue.data?.mockQueue?.workerClaimsCreated, 0)
assert.ok(mockQueue.data?.mockQueue?.noRuntimeSideEffects.some((note) => /did not claim workers/i.test(note)))

const dispatchReadiness = await createApprovedEditExecutionDispatchReadinessClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  mockQueueId: mockQueue.data?.mockQueue?.id ?? 'missing-mock-queue',
  jobBatchPlanId: jobBatch.data?.jobBatchPlan?.id ?? 'missing-job-batch-plan',
  packageRecordId: executionPackage.packageRecordId,
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  queuedJobs: [
    {
      id: 'mock-queued-edit-job-work-validate-approved-snapshot',
      workItemId: 'work-validate-approved-snapshot',
      jobType: 'validate_approved_snapshot',
      runtimeJobType: 'validate_approved_snapshot',
      workerType: 'editing_supervisor_worker',
      approvedPlanSnapshotId: approvedSnapshot.id,
      creditReservationId: 'credit-reservation-client-smoke',
      idempotencyKey: 'work-validate-approved-snapshot-key',
    },
  ],
})

assert.equal(dispatchReadiness.ok, true, 'Client should create a mock dispatch readiness audit.')
assert.equal(dispatchReadiness.data?.dispatchReadiness?.queuedJobCount, 1)
assert.equal(dispatchReadiness.data?.dispatchReadiness?.readyForClaimCount, 1)
assert.equal(dispatchReadiness.data?.dispatchReadiness?.workersStarted, 0)
assert.equal(dispatchReadiness.data?.dispatchReadiness?.workerClaimsCreated, 0)
assert.ok(dispatchReadiness.data?.dispatchReadiness?.noRuntimeSideEffects.some((note) => /did not claim workers/i.test(note)))

const mockWorkerClaims = await createApprovedEditExecutionMockWorkerClaimsClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  dispatchReadinessId: dispatchReadiness.data?.dispatchReadiness?.id ?? 'missing-dispatch-readiness',
  mockQueueId: mockQueue.data?.mockQueue?.id ?? 'missing-mock-queue',
  jobBatchPlanId: jobBatch.data?.jobBatchPlan?.id ?? 'missing-job-batch-plan',
  packageRecordId: executionPackage.packageRecordId,
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  workerInstanceId: 'client-smoke-worker-1',
  readiness: dispatchReadiness.data?.dispatchReadiness?.readiness,
})

assert.equal(mockWorkerClaims.ok, true, 'Client should create mock worker claim leases from dispatch-ready jobs.')
assert.equal(mockWorkerClaims.data?.mockWorkerClaims?.dispatchReadinessId, dispatchReadiness.data?.dispatchReadiness?.id)
assert.equal(mockWorkerClaims.data?.mockWorkerClaims?.claimCount, 1)
assert.equal(mockWorkerClaims.data?.mockWorkerClaims?.workersStarted, 0)
assert.equal(mockWorkerClaims.data?.mockWorkerClaims?.workerHandlersStarted, 0)
assert.equal(mockWorkerClaims.data?.mockWorkerClaims?.toolsExecuted, 0)
assert.equal(mockWorkerClaims.data?.mockWorkerClaims?.workerClaims?.[0]?.approvedPlanSnapshotId, approvedSnapshot.id)
assert.equal(mockWorkerClaims.data?.mockWorkerClaims?.workerClaims?.[0]?.creditReservationId, 'credit-reservation-client-smoke')
assert.equal(mockWorkerClaims.data?.mockWorkerClaims?.workerClaims?.[0]?.workerInstanceId, 'client-smoke-worker-1')
assert.ok(mockWorkerClaims.data?.mockWorkerClaims?.noRuntimeSideEffects.some((note) => /did not start handlers/i.test(note)))

const handlerDryRun = await createApprovedEditExecutionHandlerDryRunClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  mockWorkerClaimsId: mockWorkerClaims.data?.mockWorkerClaims?.id ?? 'missing-mock-worker-claims',
  dispatchReadinessId: dispatchReadiness.data?.dispatchReadiness?.id ?? 'missing-dispatch-readiness',
  mockQueueId: mockQueue.data?.mockQueue?.id ?? 'missing-mock-queue',
  jobBatchPlanId: jobBatch.data?.jobBatchPlan?.id ?? 'missing-job-batch-plan',
  packageRecordId: executionPackage.packageRecordId,
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  workerClaims: mockWorkerClaims.data?.mockWorkerClaims?.workerClaims,
})

assert.equal(handlerDryRun.ok, true, 'Client should create handler dry-run result metadata from mock claims.')
assert.equal(handlerDryRun.data?.handlerDryRun?.mockWorkerClaimsId, mockWorkerClaims.data?.mockWorkerClaims?.id)
assert.equal(handlerDryRun.data?.handlerDryRun?.workResultCount, 1)
assert.equal(handlerDryRun.data?.handlerDryRun?.qaHandoffCount, 1)
assert.equal(handlerDryRun.data?.handlerDryRun?.workersStarted, 0)
assert.equal(handlerDryRun.data?.handlerDryRun?.workerHandlersStarted, 0)
assert.equal(handlerDryRun.data?.handlerDryRun?.toolsExecuted, 0)
assert.equal(handlerDryRun.data?.handlerDryRun?.mediaArtifactsCreated, 0)
assert.equal(handlerDryRun.data?.handlerDryRun?.liveExecutionReady, false)
assert.equal(handlerDryRun.data?.handlerDryRun?.finalExportReady, false)
assert.equal(handlerDryRun.data?.handlerDryRun?.workResults?.[0]?.billableToUser, false)
assert.equal(handlerDryRun.data?.handlerDryRun?.assetManifestUpdates?.[0]?.privateArtifact, true)
assert.equal(handlerDryRun.data?.handlerDryRun?.assetManifestUpdates?.[0]?.sourceOfTruth, false)
assert.equal(handlerDryRun.data?.handlerDryRun?.qaHandoffRecords?.[0]?.blocksFinalRender, true)
assert.ok(handlerDryRun.data?.handlerDryRun?.noRuntimeSideEffects.some((note) => /did not start handlers/i.test(note)))

const resultReconciliation = await createApprovedEditExecutionResultReconciliationClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  handlerDryRunId: handlerDryRun.data?.handlerDryRun?.id ?? 'missing-handler-dry-run',
  mockWorkerClaimsId: mockWorkerClaims.data?.mockWorkerClaims?.id ?? 'missing-mock-worker-claims',
  dispatchReadinessId: dispatchReadiness.data?.dispatchReadiness?.id ?? 'missing-dispatch-readiness',
  mockQueueId: mockQueue.data?.mockQueue?.id ?? 'missing-mock-queue',
  jobBatchPlanId: jobBatch.data?.jobBatchPlan?.id ?? 'missing-job-batch-plan',
  packageRecordId: executionPackage.packageRecordId,
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  workResultCount: handlerDryRun.data?.handlerDryRun?.workResultCount,
  assetManifestUpdates: handlerDryRun.data?.handlerDryRun?.assetManifestUpdates,
  qaHandoffRecords: handlerDryRun.data?.handlerDryRun?.qaHandoffRecords,
})

assert.equal(resultReconciliation.ok, true, 'Client should create result reconciliation metadata from handler dry-run.')
assert.equal(resultReconciliation.data?.resultReconciliation?.handlerDryRunId, handlerDryRun.data?.handlerDryRun?.id)
assert.equal(resultReconciliation.data?.resultReconciliation?.workResultCount, 1)
assert.equal(resultReconciliation.data?.resultReconciliation?.manifestItemCount, 1)
assert.equal(resultReconciliation.data?.resultReconciliation?.qaGateCount, 1)
assert.equal(resultReconciliation.data?.resultReconciliation?.sourceOfTruthArtifactCount, 0)
assert.equal(resultReconciliation.data?.resultReconciliation?.liveExecutionReady, false)
assert.equal(resultReconciliation.data?.resultReconciliation?.previewReviewReady, false)
assert.equal(resultReconciliation.data?.resultReconciliation?.finalRenderReady, false)
assert.equal(resultReconciliation.data?.resultReconciliation?.finalRenderReadiness.ready, false)
assert.equal(resultReconciliation.data?.resultReconciliation?.reconciledManifestItems?.[0]?.sourceOfTruth, false)
assert.equal(resultReconciliation.data?.resultReconciliation?.reconciledManifestItems?.[0]?.finalRenderEligible, false)
assert.equal(resultReconciliation.data?.resultReconciliation?.reconciledQAGates?.[0]?.blocksFinalRender, true)
assert.equal(resultReconciliation.data?.resultReconciliation?.nextRequiredGate, 'real_worker_handler_execution_with_private_artifact_persistence')
assert.ok(resultReconciliation.data?.resultReconciliation?.noRuntimeSideEffects.some((note) => /did not start handlers/i.test(note)))

const localWorkerOutput = await createApprovedEditExecutionLocalWorkerOutputClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  resultReconciliationId: resultReconciliation.data?.resultReconciliation?.id ?? 'missing-result-reconciliation',
  handlerDryRunId: handlerDryRun.data?.handlerDryRun?.id ?? 'missing-handler-dry-run',
  mockWorkerClaimsId: mockWorkerClaims.data?.mockWorkerClaims?.id ?? 'missing-mock-worker-claims',
  dispatchReadinessId: dispatchReadiness.data?.dispatchReadiness?.id ?? 'missing-dispatch-readiness',
  mockQueueId: mockQueue.data?.mockQueue?.id ?? 'missing-mock-queue',
  jobBatchPlanId: jobBatch.data?.jobBatchPlan?.id ?? 'missing-job-batch-plan',
  packageRecordId: executionPackage.packageRecordId,
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  workResultCount: resultReconciliation.data?.resultReconciliation?.workResultCount,
  reconciledManifestItems: resultReconciliation.data?.resultReconciliation?.reconciledManifestItems,
})

assert.equal(localWorkerOutput.ok, true, 'Client should persist local worker output metadata after result reconciliation.')
assert.equal(localWorkerOutput.data?.localWorkerOutput?.resultReconciliationId, resultReconciliation.data?.resultReconciliation?.id)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.status, 'local_worker_outputs_persisted_waiting_qa')
assert.equal(localWorkerOutput.data?.localWorkerOutput?.persistedArtifactCount, 1)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.sourceOfTruthArtifactCount, 1)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.mediaArtifactCount, 0)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.workersStarted, 0)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.workerHandlersStarted, 0)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.toolsExecuted, 0)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.liveExecutionReady, false)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.internalResultReviewReady, true)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.previewReviewReady, true)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.renderPreviewReady, false)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.finalRenderReady, false)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.finalRenderReadiness.ready, false)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.persistedArtifacts?.[0]?.privateArtifact, true)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.persistedArtifacts?.[0]?.publicArtifact, false)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.persistedArtifacts?.[0]?.signedUrl, null)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.persistedArtifacts?.[0]?.sourceOfTruth, true)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.persistedArtifacts?.[0]?.mediaArtifact, false)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.persistedArtifacts?.[0]?.finalRenderEligible, false)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.persistedArtifacts?.[0]?.previewReviewEligible, true)
assert.equal(localWorkerOutput.data?.localWorkerOutput?.nextRequiredGate, 'local_worker_output_qa_review')
assert.ok(localWorkerOutput.data?.localWorkerOutput?.noRuntimeSideEffects.some((note) => /did not run tools/i.test(note)))

const localWorkerOutputQaReview = await createApprovedEditExecutionLocalWorkerOutputQaReviewClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  localWorkerOutputId: localWorkerOutput.data?.localWorkerOutput?.id ?? 'missing-local-worker-output',
  resultReconciliationId: resultReconciliation.data?.resultReconciliation?.id ?? 'missing-result-reconciliation',
  handlerDryRunId: handlerDryRun.data?.handlerDryRun?.id ?? 'missing-handler-dry-run',
  packageRecordId: executionPackage.packageRecordId,
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  persistedArtifacts: localWorkerOutput.data?.localWorkerOutput?.persistedArtifacts,
})

assert.equal(localWorkerOutputQaReview.ok, true, 'Client should review local worker output metadata.')
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.localWorkerOutputId, localWorkerOutput.data?.localWorkerOutput?.id)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.status, 'local_worker_output_qa_passed_waiting_uploaded_media_worker_execution')
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.qaReviewOnly, true)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.reviewedArtifactCount, 1)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.passedArtifactCount, 1)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.blockedArtifactCount, 0)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.sourceOfTruthArtifactCount, 1)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.mediaArtifactCount, 0)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.workersStarted, 0)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.workerHandlersStarted, 0)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.toolsExecuted, 0)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.liveExecutionReady, false)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.internalResultReviewReady, true)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.previewReviewReady, true)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.renderPreviewReady, false)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.finalRenderReady, false)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.finalRenderReadiness.ready, false)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.finalRenderReadiness.mediaArtifactCount, 0)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.qaResults?.[0]?.qaStatus, 'passed_metadata_integrity_only')
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.qaResults?.[0]?.metadataIntegrityPassed, true)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.qaResults?.[0]?.mediaQaRequired, true)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.qaResults?.[0]?.finalRenderEligible, false)
assert.equal(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.nextRequiredGate, 'uploaded_media_worker_execution_with_private_artifact_outputs')
assert.ok(localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.noRuntimeSideEffects.some((note) => /did not run tools/i.test(note)))

const workflowRehearsal = await createApprovedEditExecutionWorkflowRehearsalClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  localWorkerOutputId: localWorkerOutput.data?.localWorkerOutput?.id ?? 'missing-local-worker-output',
  localOutputQaReviewId: localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.id,
  resultReconciliationId: resultReconciliation.data?.resultReconciliation?.id ?? 'missing-result-reconciliation',
  handlerDryRunId: handlerDryRun.data?.handlerDryRun?.id ?? 'missing-handler-dry-run',
  packageRecordId: executionPackage.packageRecordId,
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  scenarioId: 'talking-head-clean-edit',
})

assert.equal(workflowRehearsal.ok, true, 'Client should run the approved edit production workflow rehearsal.')
assert.equal(workflowRehearsal.data?.workflowRehearsal?.localWorkerOutputId, localWorkerOutput.data?.localWorkerOutput?.id)
assert.equal(workflowRehearsal.data?.workflowRehearsal?.status, 'production_workflow_rehearsed_waiting_uploaded_media_worker_execution')
assert.equal(workflowRehearsal.data?.workflowRehearsal?.rehearsalOnly, true)
assert.equal(workflowRehearsal.data?.workflowRehearsal?.workflowMode, 'dry_run')
assert.equal(workflowRehearsal.data?.workflowRehearsal?.scenarioId, 'talking-head-clean-edit')
assert.ok((workflowRehearsal.data?.workflowRehearsal?.stageCount ?? 0) > 0)
assert.ok(workflowRehearsal.data?.workflowRehearsal?.workflowStages.includes('media_foundation'))
assert.ok(workflowRehearsal.data?.workflowRehearsal?.workflowStages.includes('final_render_export_execution'))
assert.equal(workflowRehearsal.data?.workflowRehearsal?.finalDeliveryAllowed, false)
assert.equal(workflowRehearsal.data?.workflowRehearsal?.productionReadyAllowed, false)
assert.equal(workflowRehearsal.data?.workflowRehearsal?.liveExecutionReady, false)
assert.equal(workflowRehearsal.data?.workflowRehearsal?.renderPreviewReady, false)
assert.equal(workflowRehearsal.data?.workflowRehearsal?.finalRenderReady, false)
assert.equal(workflowRehearsal.data?.workflowRehearsal?.localOutputQaStatus, 'passed_metadata_integrity_only')
assert.equal(workflowRehearsal.data?.workflowRehearsal?.nextRequiredGate, 'uploaded_media_worker_execution_with_private_artifact_outputs')
assert.ok(workflowRehearsal.data?.workflowRehearsal?.noRuntimeSideEffects.some((note) => /did not process uploaded media/i.test(note)))

const uploadedMediaWorkerExecution = await createApprovedEditExecutionUploadedMediaWorkerExecutionClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  workflowRehearsalId: workflowRehearsal.data?.workflowRehearsal?.id ?? 'missing-workflow-rehearsal',
  localWorkerOutputId: localWorkerOutput.data?.localWorkerOutput?.id ?? 'missing-local-worker-output',
  localWorkerOutputQaReviewId: localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.id ?? 'missing-local-output-qa',
  approvedPlanSnapshotId: approvedSnapshot.id,
  creditReservationId: 'credit-reservation-client-smoke',
  sourceMediaAssets: uploadedSourceMediaAssets,
})

assert.equal(uploadedMediaWorkerExecution.ok, true, 'Client should create uploaded-media worker execution metadata.')
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.workflowRehearsalId, workflowRehearsal.data?.workflowRehearsal?.id)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.localWorkerOutputId, localWorkerOutput.data?.localWorkerOutput?.id)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.localWorkerOutputQaReviewId, localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.id)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.status, 'uploaded_media_worker_execution_metadata_persisted_waiting_private_artifact_qa')
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.uploadedMediaExecutionOnly, true)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.workerExecutionMode, 'metadata_only_no_media_processing')
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.sourceMediaAssetCount, 1)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.privateWorkerArtifactCount, 1)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.sourceBoundArtifactCount, 1)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.mediaArtifactCount, 0)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.qaPendingCount, 1)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.workersStarted, 0)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.workerHandlersStarted, 0)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.toolsExecuted, 0)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.mediaBytesProcessed, false)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.liveExecutionReady, false)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.previewReviewReady, true)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.renderPreviewReady, false)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.finalRenderReady, false)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.finalRenderReadiness.ready, false)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.privateWorkerArtifacts?.[0]?.privateArtifact, true)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.privateWorkerArtifacts?.[0]?.publicArtifact, false)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.privateWorkerArtifacts?.[0]?.signedUrl, null)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.privateWorkerArtifacts?.[0]?.sourceMediaBound, true)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.privateWorkerArtifacts?.[0]?.mediaArtifact, false)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.privateWorkerArtifacts?.[0]?.finalRenderEligible, false)
assert.equal(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.nextRequiredGate, 'private_worker_artifact_qa_review')
assert.ok(uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.noRuntimeSideEffects.some((note) => /did not run workers/i.test(note)))

const privateWorkerArtifactQaReview = await createApprovedEditExecutionPrivateWorkerArtifactQaReviewClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  uploadedMediaWorkerExecutionId: uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.id ?? 'missing-uploaded-media-worker-execution',
  creditReservationId: 'credit-reservation-client-smoke',
})

assert.equal(privateWorkerArtifactQaReview.ok, true, 'Client should review private worker artifact metadata.')
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.uploadedMediaWorkerExecutionId, uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.id)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.status, 'private_worker_artifact_qa_passed_waiting_real_media_processing')
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.qaReviewOnly, true)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.reviewedArtifactCount, 1)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.passedArtifactCount, 1)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.blockedArtifactCount, 0)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.sourceBoundArtifactCount, 1)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.mediaArtifactCount, 0)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.workersStarted, 0)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.workerHandlersStarted, 0)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.toolsExecuted, 0)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.mediaBytesProcessed, false)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.liveExecutionReady, false)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.previewReviewReady, true)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.renderPreviewReady, false)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.finalRenderReady, false)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.finalRenderReadiness.ready, false)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.qaResults?.[0]?.metadataIntegrityPassed, true)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.qaResults?.[0]?.sourceMediaBound, true)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.qaResults?.[0]?.mediaQaRequired, true)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.qaResults?.[0]?.finalRenderEligible, false)
assert.equal(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.nextRequiredGate, 'real_media_processing_worker_execution_with_private_media_artifacts')
assert.ok(privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.noRuntimeSideEffects.some((note) => /did not run workers/i.test(note)))

const localMediaProcessingExecution = await createApprovedEditExecutionLocalMediaProcessingExecutionClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  privateWorkerArtifactQaReviewId: privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.id ?? 'missing-private-worker-artifact-qa',
  creditReservationId: 'credit-reservation-client-smoke',
  processingMode: 'bounded_preview_render',
  maxDurationSeconds: 1,
  targetWidth: 160,
  targetHeight: 90,
  fps: 8,
})

assert.equal(localMediaProcessingExecution.ok, true, 'Client should create local media processing execution metadata.')
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.privateWorkerArtifactQaReviewId, privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.id)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.status, 'local_media_processing_execution_completed_waiting_private_media_artifact_qa')
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processingExecutionOnly, true)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processingMode, 'bounded_preview_render')
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifactCount, 1)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.privateMediaArtifactCount, 1)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.mediaArtifactCount, 1)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.workersStarted, 0)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.workerHandlersStarted, 1)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.toolsExecuted, 1)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.mediaBytesProcessed, true)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.liveExecutionReady, false)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.previewReviewReady, true)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.renderPreviewReady, false)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.finalRenderReady, false)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.finalRenderReadiness.ready, false)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.privateArtifact, true)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.publicArtifact, false)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.signedUrl, null)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.mediaArtifact, true)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.processedMediaArtifact, true)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.finalRenderEligible, false)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.commandSummary.audioMode, 'copy_or_transcode')
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.commandSummary.audioSource, 'generated_silence')
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.commandSummary.fitMode, 'contain')
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.approvedSourceRange.source, 'bounded_preview_default')
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.approvedSourceRange.startSeconds, 0)
assert.ok(
  localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifacts?.[0]?.commandSummary.filters.some((filter) =>
    filter.includes('force_original_aspect_ratio=decrease') && filter.includes('pad='),
  ),
  'Local media processing should preserve source aspect ratio inside the target frame.',
)
assert.equal(localMediaProcessingExecution.data?.localMediaProcessingExecution?.nextRequiredGate, 'private_media_artifact_qa_review')
assert.ok(localMediaProcessingExecution.data?.localMediaProcessingExecution?.noRuntimeSideEffects.some((note) => /No provider call/i.test(note)))

const privateMediaArtifactQaReview = await createApprovedEditExecutionPrivateMediaArtifactQaReviewClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  localMediaProcessingExecutionId: localMediaProcessingExecution.data?.localMediaProcessingExecution?.id ?? 'missing-local-media-processing',
  creditReservationId: 'credit-reservation-client-smoke',
})

assert.equal(privateMediaArtifactQaReview.ok, true, 'Client should review private media artifact QA.')
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.localMediaProcessingExecutionId, localMediaProcessingExecution.data?.localMediaProcessingExecution?.id)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.status, 'private_media_artifact_qa_passed_waiting_render_preview_assembly')
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.qaReviewOnly, true)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.reviewedArtifactCount, 1)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.passedArtifactCount, 1)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.blockedArtifactCount, 0)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.privateMediaArtifactCount, 1)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.mediaArtifactCount, 1)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.workersStarted, 0)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.workerHandlersStarted, 0)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.toolsExecuted, 0)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.mediaBytesProcessed, false)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.liveExecutionReady, false)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.previewReviewReady, true)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.renderPreviewReady, false)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.finalRenderReady, false)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.finalRenderReadiness.ready, false)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.qaResults?.[0]?.mediaArtifactQaPassed, true)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.qaResults?.[0]?.sourceMediaBound, true)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.qaResults?.[0]?.previewReviewEligible, true)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.qaResults?.[0]?.finalRenderEligible, false)
assert.equal(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.nextRequiredGate, 'render_preview_assembly')
assert.ok(privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.noRuntimeSideEffects.some((note) => /No media processing/i.test(note)))

const renderPreviewAssembly = await createApprovedEditExecutionRenderPreviewAssemblyClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  privateMediaArtifactQaReviewId: privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.id ?? 'missing-private-media-artifact-qa',
  creditReservationId: 'credit-reservation-client-smoke',
  adapterWorkerArtifactIntegrationId: adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.id,
  privateMediaRunnerQaReviewId: adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.privateMediaRunnerQaReviewId,
})

assert.equal(renderPreviewAssembly.ok, true, 'Client should create render preview assembly.')
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.privateMediaArtifactQaReviewId, privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.id)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.status, 'render_preview_assembly_completed_waiting_user_preview_review')
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.assemblyOnly, true)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewClipCount, 1)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.privatePreviewArtifactCount, 1)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.mediaArtifactCount, 1)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.workersStarted, 0)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.workerHandlersStarted, 0)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.toolsExecuted, 0)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.mediaBytesProcessed, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.liveExecutionReady, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewReviewReady, true)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.renderPreviewReady, true)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.finalRenderReady, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.finalRenderReadiness.ready, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.finalRenderReadiness.userPreviewReviewRequired, true)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewClips?.[0]?.privateArtifact, true)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewClips?.[0]?.publicArtifact, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewClips?.[0]?.signedUrl, null)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewClips?.[0]?.finalRenderEligible, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewClips?.[0]?.approvedSourceRange.source, 'bounded_preview_default')
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewClips?.[0]?.assemblySource, 'uploaded_source_order')
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewManifestArtifact.privateArtifact, true)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewManifestArtifact.publicArtifact, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewManifestArtifact.signedUrl, null)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.previewManifestArtifact.finalRenderEligible, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.adapterWorkerArtifactIntegrationId, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.id)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.privateMediaRunnerQaReviewId, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.privateMediaRunnerQaReviewId)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.renderIntegrationManifestArtifactId, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integrationManifestArtifact.artifactId)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.reviewedActivityCount, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.reviewedArtifactCount)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.passedActivityCount, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integratedArtifactCount)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.artifactCount, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integratedArtifactCount)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.renderPreviewIntegrationReady, true)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.finalRenderDecisionManifestEligible, true)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.mediaTransformOutputEligible, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.productRuntimeExecuted, false)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.professionalSkillTrace?.source, 'approved_professional_skill_plan')
assert.deepEqual(
  renderPreviewAssembly.data?.renderPreviewAssembly?.adapterQaIntegration?.artifacts.map((artifact) => artifact.canonicalToolId),
  ['d3', 'three'],
)
assert.equal(renderPreviewAssembly.data?.renderPreviewAssembly?.nextRequiredGate, 'user_preview_review')
assert.ok(renderPreviewAssembly.data?.renderPreviewAssembly?.noRuntimeSideEffects.some((note) => /private manifest/i.test(note)))

const userPreviewReview = await createApprovedEditExecutionUserPreviewReviewClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  renderPreviewAssemblyId: renderPreviewAssembly.data?.renderPreviewAssembly?.id ?? 'missing-render-preview-assembly',
  creditReservationId: 'credit-reservation-client-smoke',
  reviewDecision: 'approved_for_final_render_readiness',
  reviewerNote: 'Client smoke approved the private preview package.',
})

assert.equal(userPreviewReview.ok, true, 'Client should create user preview review.')
assert.equal(userPreviewReview.data?.userPreviewReview?.renderPreviewAssemblyId, renderPreviewAssembly.data?.renderPreviewAssembly?.id)
assert.equal(userPreviewReview.data?.userPreviewReview?.status, 'user_preview_review_approved_waiting_final_render_readiness')
assert.equal(userPreviewReview.data?.userPreviewReview?.reviewOnly, true)
assert.equal(userPreviewReview.data?.userPreviewReview?.reviewDecision, 'approved_for_final_render_readiness')
assert.equal(userPreviewReview.data?.userPreviewReview?.previewClipCount, 1)
assert.equal(userPreviewReview.data?.userPreviewReview?.privatePreviewArtifactCount, 1)
assert.equal(userPreviewReview.data?.userPreviewReview?.mediaArtifactCount, 1)
assert.equal(userPreviewReview.data?.userPreviewReview?.workersStarted, 0)
assert.equal(userPreviewReview.data?.userPreviewReview?.workerHandlersStarted, 0)
assert.equal(userPreviewReview.data?.userPreviewReview?.toolsExecuted, 0)
assert.equal(userPreviewReview.data?.userPreviewReview?.mediaBytesProcessed, false)
assert.equal(userPreviewReview.data?.userPreviewReview?.liveExecutionReady, false)
assert.equal(userPreviewReview.data?.userPreviewReview?.previewReviewReady, true)
assert.equal(userPreviewReview.data?.userPreviewReview?.renderPreviewReady, true)
assert.equal(userPreviewReview.data?.userPreviewReview?.finalRenderReady, false)
assert.equal(userPreviewReview.data?.userPreviewReview?.finalRenderReadiness.ready, false)
assert.equal(userPreviewReview.data?.userPreviewReview?.finalRenderReadiness.previewApproved, true)
assert.equal(userPreviewReview.data?.userPreviewReview?.finalRenderReadiness.nextReviewRequired, 'final_render_readiness_review')
assert.equal(userPreviewReview.data?.userPreviewReview?.nextRequiredGate, 'final_render_readiness_review')
assert.ok(userPreviewReview.data?.userPreviewReview?.noRuntimeSideEffects.some((note) => /decision only/i.test(note)))

const finalRenderReadinessReview = await createApprovedEditExecutionFinalRenderReadinessReviewClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  userPreviewReviewId: userPreviewReview.data?.userPreviewReview?.id ?? 'missing-user-preview-review',
  creditReservationId: 'credit-reservation-client-smoke',
})

assert.equal(finalRenderReadinessReview.ok, true, 'Client should create final render readiness review.')
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.userPreviewReviewId, userPreviewReview.data?.userPreviewReview?.id)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.status, 'final_render_readiness_passed_waiting_final_render_execution')
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.readinessReviewOnly, true)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.previewApproved, true)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.previewClipCount, 1)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.privatePreviewArtifactCount, 1)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.mediaArtifactCount, 1)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.workersStarted, 0)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.workerHandlersStarted, 0)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.toolsExecuted, 0)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.mediaBytesProcessed, false)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.liveExecutionReady, false)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.previewReviewReady, true)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.renderPreviewReady, true)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.finalRenderReady, true)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.finalExportReady, false)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.finalRenderReadiness.ready, true)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.finalRenderReadiness.finalRenderExecutionRequired, true)
assert.equal(finalRenderReadinessReview.data?.finalRenderReadinessReview?.nextRequiredGate, 'final_render_execution')
assert.ok(finalRenderReadinessReview.data?.finalRenderReadinessReview?.noRuntimeSideEffects.some((note) => /readiness decision only/i.test(note)))

const finalRenderExecution = await createApprovedEditExecutionFinalRenderExecutionClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  finalRenderReadinessReviewId: finalRenderReadinessReview.data?.finalRenderReadinessReview?.id ?? 'missing-final-render-readiness',
  creditReservationId: 'credit-reservation-client-smoke',
})

assert.equal(finalRenderExecution.ok, true, 'Client should create final render execution.')
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderReadinessReviewId, finalRenderReadinessReview.data?.finalRenderReadinessReview?.id)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.status, 'final_render_execution_completed_waiting_delivery_qa')
assert.equal(finalRenderExecution.data?.finalRenderExecution?.renderExecutionOnly, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.previewClipCount, 1)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifactCount, 1)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.mediaArtifactCount, 1)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.workersStarted, 0)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.workerHandlersStarted, 1)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.toolsExecuted, 1)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.mediaBytesProcessed, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.liveExecutionReady, false)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.previewReviewReady, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.renderPreviewReady, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderReady, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalExportReady, false)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.privateArtifact, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.publicArtifact, false)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.signedUrl, null)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.finalRenderArtifact, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.deliveryQaRequired, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.finalDeliveryEligible, false)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.manifestVersion, 'private-internal-edit-decision-manifest-v1')
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.clipDecisionCount, finalRenderExecution.data?.finalRenderExecution?.previewClipCount)
assert.ok(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.decisions.every((decision) =>
  decision.processedArtifact?.storageProvider === 'local_private' &&
  decision.processedArtifact?.mimeType === 'video/mp4' &&
  /^[a-f0-9]{64}$/i.test(decision.processedArtifact?.sha256 ?? '') &&
  (decision.processedArtifact?.byteSize ?? 0) > 0 &&
  (decision.processedArtifact?.durationSeconds ?? 0) > 0 &&
  decision.processedArtifact?.privateArtifact === true &&
  decision.processedArtifact?.publicArtifact === false &&
  decision.processedArtifact?.signedUrl === null
), 'Client should receive processed private artifact proof in every edit decision.')
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.attached, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.adapterWorkerArtifactIntegrationId, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.id)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.privateMediaRunnerQaReviewId, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.privateMediaRunnerQaReviewId)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.renderIntegrationManifestArtifactId, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integrationManifestArtifact.artifactId)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.artifactCount, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integratedArtifactCount)
assert.deepEqual(
  finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.artifacts.map((artifact) => artifact.canonicalToolId),
  ['d3', 'three'],
)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifest?.blockedRuntimeScopes.signedUrlCreated, false)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifestArtifact?.manifestVersion, 'private-internal-edit-decision-manifest-v1')
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalRenderArtifact.editDecisionManifestArtifact?.privateArtifact, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalDeliveryReadiness.ready, false)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.finalDeliveryReadiness.deliveryQaRequired, true)
assert.equal(finalRenderExecution.data?.finalRenderExecution?.nextRequiredGate, 'final_delivery_qa')
assert.ok(finalRenderExecution.data?.finalRenderExecution?.noRuntimeSideEffects.some((note) => /private final-render/i.test(note)))

const finalDeliveryQaReview = await createApprovedEditExecutionFinalDeliveryQaReviewClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  finalRenderExecutionId: finalRenderExecution.data?.finalRenderExecution?.id ?? 'missing-final-render-execution',
  creditReservationId: 'credit-reservation-client-smoke',
})

assert.equal(finalDeliveryQaReview.ok, true, 'Client should create final delivery QA review.')
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderExecutionId, finalRenderExecution.data?.finalRenderExecution?.id)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.status, 'final_delivery_qa_passed_ready_for_private_internal_download')
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.qaReviewOnly, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalArtifactQaPassed, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.privateInternalDownloadReady, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.publicDeliveryReady, false)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.externalBetaReady, false)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.productionReady, false)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalExportReady, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifactCount, 1)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.mediaArtifactCount, 1)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.workersStarted, 0)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.workerHandlersStarted, 0)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.toolsExecuted, 0)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.mediaBytesProcessed, false)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.liveExecutionReady, false)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.renderPreviewReady, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderReady, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifact.privateArtifact, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifact.publicArtifact, false)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifact.signedUrl, null)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifact.finalDeliveryEligible, false)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.professionalEditQaSummary?.editDecisionManifestReady, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.professionalEditQaSummary?.editDecisionManifestArtifactReady, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.attached, true)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.adapterWorkerArtifactIntegrationId, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.id)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.artifactCount, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integratedArtifactCount)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifact.editDecisionManifest?.blockedRuntimeScopes.publicArtifactCreated, false)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.finalRenderArtifact.editDecisionManifestArtifact?.publicArtifact, false)
assert.equal(finalDeliveryQaReview.data?.finalDeliveryQaReview?.nextRequiredGate, 'private_internal_download_delivery')
assert.ok(finalDeliveryQaReview.data?.finalDeliveryQaReview?.noRuntimeSideEffects.some((note) => /private internal testing/i.test(note)))

const privateInternalDownloadDelivery = await createApprovedEditExecutionPrivateInternalDownloadDeliveryClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  finalDeliveryQaReviewId: finalDeliveryQaReview.data?.finalDeliveryQaReview?.id ?? 'missing-final-delivery-qa-review',
  creditReservationId: 'credit-reservation-client-smoke',
})

assert.equal(privateInternalDownloadDelivery.ok, true, 'Client should create private internal download delivery.')
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalDeliveryQaReviewId, finalDeliveryQaReview.data?.finalDeliveryQaReview?.id)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.status, 'private_internal_download_delivery_ready')
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.deliveryOnly, true)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.privateInternalDownloadReady, true)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.publicDeliveryReady, false)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.externalBetaReady, false)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.productionReady, false)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalExportReady, true)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalRenderArtifact.privateArtifact, true)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalRenderArtifact.publicArtifact, false)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalRenderArtifact.signedUrl, null)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalRenderArtifact.finalDeliveryEligible, false)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.professionalEditQaSummary?.editDecisionManifestReady, true)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.professionalEditQaSummary?.editDecisionManifestArtifactReady, true)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalRenderArtifact.editDecisionManifest?.manifestVersion, 'private-internal-edit-decision-manifest-v1')
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.attached, true)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.adapterWorkerArtifactIntegrationId, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.id)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration.artifactCount, adapterWorkerArtifactIntegration.data?.adapterWorkerArtifactIntegration?.integratedArtifactCount)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.finalRenderArtifact.editDecisionManifestArtifact?.manifestVersion, 'private-internal-edit-decision-manifest-v1')
assert.match(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.internalDownloadPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/.+\/file$/)
assert.match(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.internalManifestPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/.+\/manifest$/)
assert.equal(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.nextRequiredGate, 'external_beta_or_production_release_gates')
assert.ok(privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.noRuntimeSideEffects.some((note) => /authenticated private route/i.test(note)))

const privateInternalTestRunWithMockSource = await createApprovedEditExecutionPrivateInternalTestRunClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  approvedPlanSnapshotId: approvedSnapshot.id,
  approvedSnapshot,
  creditReservationId: 'credit-reservation-client-smoke',
  requestedAdapterToolNames: ['librosa', 'pydub', 'scipy'],
  packageReadyToolIds: ['librosa', 'pydub', 'scipy'],
  modelWeightApprovedToolIds: [],
  sourceMediaAssets: [
    {
      mediaAssetId: 'client-mock-source-media-1',
      sourceSequenceItemId: 'source-1',
      uploadedClipId: 'clip-client-1',
      uploadedOrder: 1,
      storageProvider: 'local_mock',
      storagePath: 'private/source/project-client-smoke/01-mock-clip-client-1.mp4',
      fileName: 'mock-clip-client-1.mp4',
      mimeType: 'video/mp4',
      byteSize: 1024,
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    },
  ] as unknown as Parameters<typeof createApprovedEditExecutionPrivateInternalTestRunClient>[0]['sourceMediaAssets'],
})
assert.equal(privateInternalTestRunWithMockSource.ok, false, 'Client should reject private internal test runs backed by demo/mock source assets.')
assert.equal(privateInternalTestRunWithMockSource.error?.code, 'invalid_private_internal_test_run_source_asset')

const privateInternalTestRunWithZeroByteSource = await createApprovedEditExecutionPrivateInternalTestRunClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  approvedPlanSnapshotId: approvedSnapshot.id,
  approvedSnapshot,
  creditReservationId: 'credit-reservation-client-smoke',
  requestedAdapterToolNames: ['librosa', 'pydub', 'scipy'],
  packageReadyToolIds: ['librosa', 'pydub', 'scipy'],
  modelWeightApprovedToolIds: [],
  sourceMediaAssets: [
    {
      mediaAssetId: 'client-zero-byte-source-media-1',
      sourceSequenceItemId: 'source-1',
      uploadedClipId: 'clip-client-1',
      uploadedOrder: 1,
      storageProvider: 'local_private',
      storagePath: 'private/source/project-client-smoke/01-zero-byte-clip-client-1.mp4',
      fileName: 'zero-byte-clip-client-1.mp4',
      mimeType: 'video/mp4',
      byteSize: 0,
      checksumSha256: 'c'.repeat(64),
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    },
  ],
})
assert.equal(privateInternalTestRunWithZeroByteSource.ok, false, 'Client should reject private internal test runs backed by zero-byte source assets.')
assert.equal(privateInternalTestRunWithZeroByteSource.error?.code, 'invalid_private_internal_test_run_source_asset')

const privateInternalTestRun = await createApprovedEditExecutionPrivateInternalTestRunClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  approvedPlanSnapshotId: approvedSnapshot.id,
  approvedSnapshot,
  creditReservationId: 'credit-reservation-client-smoke',
  requestedAdapterToolNames: ['librosa', 'pydub', 'scipy'],
  packageReadyToolIds: ['librosa', 'pydub', 'scipy'],
  modelWeightApprovedToolIds: [],
  sourceMediaAssets: [
    {
      mediaAssetId: 'client-source-media-1',
      sourceSequenceItemId: 'source-1',
      uploadedClipId: 'clip-client-1',
      uploadedOrder: 1,
      storageProvider: 'local_private',
      storagePath: 'private/source/project-client-smoke/01-clip-client-1.mp4',
      fileName: 'clip-client-1.mp4',
      mimeType: 'video/mp4',
      byteSize: 1024,
      checksumSha256: 'a'.repeat(64),
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    },
  ],
})

assert.equal(privateInternalTestRun.ok, true, 'Client should create a private internal test run.')
assert.equal(privateInternalTestRun.data?.internalTestRun?.status, 'private_internal_test_run_completed_ready_for_download')
assert.equal(privateInternalTestRun.data?.internalTestRun?.internalTestRunOnly, true)
assert.equal(privateInternalTestRun.data?.internalTestRun?.sourceMediaAssetCount, 1)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.resolvedActivityCount, 3)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.blockedActivityCount, 0)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.executionMode, 'private_internal_dry_run_and_local_fallback')
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.toolsExecutedCount, 0)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.fullToolExecutionReady, false)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.privateFallbackReviewOnly, true)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.privateRenderIntegrationStatus, 'approved_preparation_evidence_pending')
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.privateRenderIntegrationReady, false)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.privateRenderIntegratedActivityCount, 0)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.backendIntegrationPendingActivityCount, 3)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.backendIntegrationBlockedActivityCount, 3)
assert.ok(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.backendIntegrationBlockers?.some((blocker) => /Approved preparation evidence must be attached/i.test(blocker)))
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.clientReadinessHintsTrusted, false)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.serverSourceTruthRequiredForFullExecution, true)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.frontendExecutionAllowed, false)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.productReady, false)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.userFacingSummary.toLowerCase().includes('d3'), false)
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.userFacingReadinessSummary?.toLowerCase().includes('d3'), false)
assert.ok(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.userFacingReadinessSummary?.includes('approved execution evidence'))
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.activityGroups?.[0]?.label, 'Audio preparation')
assert.equal(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.activityGroups?.[0]?.status, 'blocked')
assert.equal(
  /librosa|pydub|scipy/i.test(JSON.stringify(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.activityGroups ?? [])),
  false,
  'Client adapter activity groups must keep package names hidden from user-facing readiness copy.',
)
assert.ok(privateInternalTestRun.data?.internalTestRun?.adapterGateSummary?.noRuntimeSideEffects.some((note) => /client-supplied package\/model readiness hints are ignored/i.test(note)))

const privateInternalTestRunWithMixedActivities = await createApprovedEditExecutionPrivateInternalTestRunClient({
  workspaceId: 'workspace-client-smoke',
  projectId: 'project-client-smoke',
  approvedPlanSnapshotId: approvedSnapshot.id,
  approvedSnapshot,
  creditReservationId: 'credit-reservation-client-smoke',
  requestedAdapterToolNames: [
    'librosa',
    'd3',
    'three',
    'sam2',
    'gpac_mp4box_packaging_validation',
  ],
  sourceMediaAssets: [
    {
      mediaAssetId: 'client-source-media-1',
      sourceSequenceItemId: 'source-1',
      uploadedClipId: 'clip-client-1',
      uploadedOrder: 1,
      storageProvider: 'local_private',
      storagePath: 'private/source/project-client-smoke/01-clip-client-1.mp4',
      fileName: 'clip-client-1.mp4',
      mimeType: 'video/mp4',
      byteSize: 1024,
      checksumSha256: 'a'.repeat(64),
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    },
  ],
})
const mixedActivityGroups = privateInternalTestRunWithMixedActivities.data?.internalTestRun?.adapterGateSummary?.activityGroups ?? []
assert.equal(privateInternalTestRunWithMixedActivities.ok, true, 'Client should create a mixed-activity private internal test run.')
assert.deepEqual(
  mixedActivityGroups.map((group) => group.label),
  ['Audio preparation', 'Visual layers', 'Motion graphics', 'Image cleanup', 'Private review package'],
  'Mock private internal test-run status should group mixed adapter work into human-facing edit areas.',
)
assert.equal(
  /librosa|d3|three|sam2|gpac|mp4box/i.test(JSON.stringify(mixedActivityGroups)),
  false,
  'Mixed private internal test-run activity groups must not expose exact package names.',
)
assert.equal(privateInternalTestRun.data?.internalTestRun?.privateInternalDownloadDelivery?.status, 'private_internal_download_delivery_ready')
assert.match(privateInternalTestRun.data?.internalTestRun?.privateInternalDownloadPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/.+\/file$/)
assert.match(privateInternalTestRun.data?.internalTestRun?.privateInternalManifestPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/.+\/manifest$/)
assert.equal(privateInternalTestRun.data?.internalTestRun?.publicDeliveryReady, false)
assert.equal(privateInternalTestRun.data?.internalTestRun?.externalBetaReady, false)
assert.equal(privateInternalTestRun.data?.internalTestRun?.productionReady, false)
assert.equal(privateInternalTestRun.data?.internalTestRun?.nextRequiredGate, 'backend_adapter_source_truth_evidence_before_external_beta_or_production_release')
assert.equal(privateInternalTestRun.data?.internalTestRun?.privateInternalDownloadDelivery?.professionalEditQaSummary?.editDecisionManifestReady, true)
assert.equal(privateInternalTestRun.data?.internalTestRun?.privateInternalDownloadDelivery?.professionalEditQaSummary?.editDecisionManifestArtifactReady, true)
assert.equal(privateInternalTestRun.data?.internalTestRun?.finalRenderArtifact?.editDecisionManifest?.manifestVersion, 'private-internal-edit-decision-manifest-v1')
assert.equal(privateInternalTestRun.data?.internalTestRun?.finalRenderArtifact?.editDecisionManifestArtifact?.manifestVersion, 'private-internal-edit-decision-manifest-v1')
assert.equal(privateInternalTestRun.data?.internalTestRun?.finalRenderArtifact?.editDecisionManifest?.uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId?.['client-source-media-1'], 'a'.repeat(64))
assert.equal(privateInternalTestRun.data?.internalTestRun?.finalRenderArtifact?.editDecisionManifest?.decisions?.[0]?.sourceChecksumSha256, 'a'.repeat(64))
assert.equal(privateInternalTestRun.data?.internalTestRun?.finalRenderArtifact?.editDecisionManifest?.decisions?.[0]?.processedArtifact?.storageProvider, 'local_private')
assert.match(privateInternalTestRun.data?.internalTestRun?.finalRenderArtifact?.editDecisionManifest?.decisions?.[0]?.processedArtifact?.sha256 ?? '', /^[a-f0-9]{64}$/i)
assert.ok(privateInternalTestRun.data?.internalTestRun?.noRuntimeSideEffects.some((note) => /No public artifact/i.test(note)))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'frontend_client_route_registered',
    'missing_credit_reservation_blocks',
    'missing_model_role_trace_blocks_agent_handoff',
    'approved_snapshot_package_created',
    'agent_call_ready_for_mock_package',
    'bounded_adapter_execution_gate_readback_blocks_without_server_source_truth',
    'bounded_adapter_source_truth_client_rejects_unapproved_package_evidence_source',
    'dry_run_job_batch_plan_created',
    'job_batch_plan_preserves_dependencies',
    'mock_queue_created_for_ready_jobs_only',
    'mock_queue_does_not_start_workers',
    'dispatch_readiness_created_without_claims',
    'mock_worker_claim_leases_created_without_handlers',
    'handler_dry_run_created_result_manifest_and_qa_handoff_metadata',
    'handler_dry_run_keeps_final_export_blocked',
    'result_reconciliation_created_manifest_and_qa_readiness',
    'result_reconciliation_keeps_dry_run_refs_non_final',
    'local_worker_output_persisted_private_metadata',
    'local_worker_output_unblocks_internal_review_only',
    'local_worker_output_metadata_qa_review_passed',
    'approved_edit_workflow_rehearsal_registered',
    'workflow_rehearsal_keeps_uploaded_media_worker_gate',
    'uploaded_media_worker_execution_metadata_created',
    'uploaded_media_worker_execution_binds_private_source_media',
    'uploaded_media_worker_execution_keeps_media_processing_blocked',
    'private_worker_artifact_metadata_qa_review_passed',
    'private_worker_artifact_qa_keeps_real_media_processing_gate',
    'local_media_processing_execution_contract_created',
    'local_media_processing_keeps_private_media_artifact_qa_gate',
    'private_media_artifact_qa_review_passed',
    'private_media_artifact_qa_keeps_render_preview_assembly_gate',
    'render_preview_assembly_created',
    'render_preview_assembly_keeps_user_preview_review_gate',
    'user_preview_review_approved',
    'user_preview_review_keeps_final_render_readiness_gate',
    'final_render_readiness_passed',
    'final_render_readiness_keeps_final_render_execution_gate',
    'final_render_execution_created',
    'final_render_execution_client_receives_edit_decision_manifest',
    'final_render_execution_client_receives_edit_decision_manifest_artifact',
    'final_render_execution_keeps_delivery_qa_gate',
    'final_delivery_qa_passed_private_internal_only',
    'final_delivery_qa_client_receives_edit_decision_manifest_status',
    'final_delivery_qa_client_receives_edit_decision_manifest_artifact_status',
    'final_delivery_qa_keeps_private_download_delivery_gate',
    'private_internal_download_delivery_created',
    'private_internal_download_delivery_client_preserves_edit_decision_manifest',
    'private_internal_download_delivery_client_preserves_edit_decision_manifest_artifact',
    'private_internal_download_delivery_client_exposes_edit_decision_manifest_route',
    'private_internal_download_delivery_keeps_public_beta_production_blocked',
    'private_internal_test_run_rejects_mock_source_asset',
    'private_internal_test_run_rejects_zero_byte_source_asset',
    'private_internal_test_run_client_ready',
    'private_internal_test_run_client_preserves_edit_decision_manifest',
    'private_internal_test_run_client_preserves_edit_decision_manifest_artifact',
    'private_internal_test_run_client_exposes_edit_decision_manifest_route',
    'private_internal_test_run_keeps_public_beta_production_blocked',
    'live_execution_disabled',
    'tool_names_hidden_from_user_copy',
    'no_runtime_side_effects',
  ],
  adapterToolCount: executionPackage.resolvedAdapterToolCount,
  privateArtifactRefCount: executionPackage.privateArtifactRefCount,
  plannedJobCount: jobBatch.data?.jobBatchPlan?.plannedJobCount,
  queuedJobCount: mockQueue.data?.mockQueue?.queuedJobCount,
  readyForClaimCount: dispatchReadiness.data?.dispatchReadiness?.readyForClaimCount,
  mockClaimCount: mockWorkerClaims.data?.mockWorkerClaims?.claimCount,
  handlerDryRunWorkResultCount: handlerDryRun.data?.handlerDryRun?.workResultCount,
  finalExportReady: handlerDryRun.data?.handlerDryRun?.finalExportReady,
  resultReconciliationStatus: resultReconciliation.data?.resultReconciliation?.status,
  nextRequiredGate: resultReconciliation.data?.resultReconciliation?.nextRequiredGate,
  localWorkerOutputStatus: localWorkerOutput.data?.localWorkerOutput?.status,
  previewReviewReady: localWorkerOutput.data?.localWorkerOutput?.previewReviewReady,
  localOutputNextRequiredGate: localWorkerOutput.data?.localWorkerOutput?.nextRequiredGate,
  localWorkerOutputQaStatus: localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.status,
  metadataQaPassedArtifactCount: localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.passedArtifactCount,
  localOutputQaNextRequiredGate: localWorkerOutputQaReview.data?.localWorkerOutputQaReview?.nextRequiredGate,
  workflowRehearsalStatus: workflowRehearsal.data?.workflowRehearsal?.status,
  workflowLocalOutputQaStatus: workflowRehearsal.data?.workflowRehearsal?.localOutputQaStatus,
  workflowStageCount: workflowRehearsal.data?.workflowRehearsal?.stageCount,
  workflowNextRequiredGate: workflowRehearsal.data?.workflowRehearsal?.nextRequiredGate,
  uploadedMediaWorkerExecutionStatus: uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.status,
  uploadedSourceMediaAssetCount: uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.sourceMediaAssetCount,
  privateWorkerArtifactCount: uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.privateWorkerArtifactCount,
  uploadedMediaNextRequiredGate: uploadedMediaWorkerExecution.data?.uploadedMediaWorkerExecution?.nextRequiredGate,
  privateWorkerArtifactQaStatus: privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.status,
  privateWorkerArtifactQaPassedCount: privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.passedArtifactCount,
  privateWorkerArtifactQaNextRequiredGate: privateWorkerArtifactQaReview.data?.privateWorkerArtifactQaReview?.nextRequiredGate,
  localMediaProcessingStatus: localMediaProcessingExecution.data?.localMediaProcessingExecution?.status,
  processedPrivateMediaArtifactCount: localMediaProcessingExecution.data?.localMediaProcessingExecution?.processedArtifactCount,
  localMediaProcessingNextRequiredGate: localMediaProcessingExecution.data?.localMediaProcessingExecution?.nextRequiredGate,
  privateMediaArtifactQaStatus: privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.status,
  privateMediaArtifactQaPassedCount: privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.passedArtifactCount,
  privateMediaArtifactQaNextRequiredGate: privateMediaArtifactQaReview.data?.privateMediaArtifactQaReview?.nextRequiredGate,
  renderPreviewAssemblyStatus: renderPreviewAssembly.data?.renderPreviewAssembly?.status,
  renderPreviewClipCount: renderPreviewAssembly.data?.renderPreviewAssembly?.previewClipCount,
  renderPreviewAssemblyNextRequiredGate: renderPreviewAssembly.data?.renderPreviewAssembly?.nextRequiredGate,
  userPreviewReviewStatus: userPreviewReview.data?.userPreviewReview?.status,
  userPreviewReviewNextRequiredGate: userPreviewReview.data?.userPreviewReview?.nextRequiredGate,
  finalRenderReadinessStatus: finalRenderReadinessReview.data?.finalRenderReadinessReview?.status,
  finalRenderReadinessNextRequiredGate: finalRenderReadinessReview.data?.finalRenderReadinessReview?.nextRequiredGate,
  finalRenderExecutionStatus: finalRenderExecution.data?.finalRenderExecution?.status,
  finalRenderExecutionNextRequiredGate: finalRenderExecution.data?.finalRenderExecution?.nextRequiredGate,
  finalDeliveryQaStatus: finalDeliveryQaReview.data?.finalDeliveryQaReview?.status,
  privateInternalDownloadReady: finalDeliveryQaReview.data?.finalDeliveryQaReview?.privateInternalDownloadReady,
  finalDeliveryQaNextRequiredGate: finalDeliveryQaReview.data?.finalDeliveryQaReview?.nextRequiredGate,
  privateInternalDownloadDeliveryStatus: privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.status,
  privateInternalDownloadPath: privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.internalDownloadPath,
  privateInternalDownloadNextRequiredGate: privateInternalDownloadDelivery.data?.privateInternalDownloadDelivery?.nextRequiredGate,
  privateInternalTestRunStatus: privateInternalTestRun.data?.internalTestRun?.status,
  privateInternalTestRunDownloadPath: privateInternalTestRun.data?.internalTestRun?.privateInternalDownloadPath,
}, null, 2))
