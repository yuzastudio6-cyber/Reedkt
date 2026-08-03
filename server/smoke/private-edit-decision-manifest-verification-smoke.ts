import assert from 'node:assert/strict'

import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
  ProfessionalEditDecisionManifestClientModel,
} from '../../src/lib/approved-edit-execution-package-client'
import { verifyPrivateEditDecisionManifest } from '../../src/lib/private-edit-decision-manifest-verification'

const sourceChecksumSha256 = 'a'.repeat(64)
const secondSourceChecksumSha256 = 'c'.repeat(64)

const sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] = [
  {
    mediaAssetId: 'source-media-001',
    sourceSequenceItemId: 'source-sequence-item-001',
    uploadedClipId: 'clip-001',
    uploadedOrder: 1,
    storageProvider: 'local_private',
    storageBucket: 'source-media',
    storagePath: 'uploads/source-media-001.mp4',
    fileName: 'source-media-001.mp4',
    mimeType: 'video/mp4',
    byteSize: 12345,
    checksumSha256: sourceChecksumSha256,
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  },
]

const secondSourceMediaAsset: ApprovedEditExecutionUploadedMediaSourceAssetClientInput = {
  mediaAssetId: 'source-media-002',
  sourceSequenceItemId: 'source-sequence-item-002',
  uploadedClipId: 'clip-002',
  uploadedOrder: 2,
  storageProvider: 'local_private',
  storageBucket: 'source-media',
  storagePath: 'uploads/source-media-002.mp4',
  fileName: 'source-media-002.mp4',
  mimeType: 'video/mp4',
  byteSize: 67890,
  checksumSha256: secondSourceChecksumSha256,
  privateArtifact: true,
  publicUrl: null,
  signedUrl: null,
}

const validManifest: ProfessionalEditDecisionManifestClientModel = {
  manifestVersion: 'private-internal-edit-decision-manifest-v1',
  source: 'approved_snapshot_private_render_execution',
  approvedPlanSnapshotId: 'approved-snapshot-001',
  approvedEditContext: {
    source: 'approved_plan_snapshot',
    projectId: 'project-001',
    editSessionId: 'edit-session-001',
    editPlanVersionId: 'edit-plan-version-001',
    creditEstimateId: 'credit-estimate-001',
    approvedAt: '2026-07-06T11:00:00.000Z',
    approvedBy: 'mock-user',
    goalSummary: 'Create a clean professional edit from uploaded clips.',
    editLevel: 'pro',
    editingCategory: 'storytelling',
    workflowType: 'custom_let_ai_decide',
    moodStyle: 'luxury',
    aspectRatio: '9:16',
    aspectRatioConfirmed: true,
    sourceOrderConfirmed: true,
    cleanupPreferenceConfirmed: true,
    timingBaseConfirmed: true,
    professionalBaseline: true,
    sourceSequenceItemCount: 1,
    segmentCount: 1,
    operationCount: 1,
    qaGateCount: 1,
    creditEstimateTotalCredits: 12,
    planningContextTrace: {
      source: 'planning_context',
      planningContextId: 'project-001-planning-context',
      status: 'ready',
      editBriefReady: true,
      editBriefDirectionCount: 3,
      cueUsageCount: 2,
      readyCueUsageCount: 1,
      blockedCueUsageCount: 0,
      unresolvedConflictCount: 0,
      sourceAssetCount: 1,
      mustUseAssetCount: 1,
      avoidAssetCount: 0,
    },
    professionalSkillTrace: {
      source: 'professional_skill_plan',
      status: 'ready_for_plan',
      selectedSkillCount: 6,
      selectedFamilies: [
        'intent_direction',
        'source_structure',
        'captions',
        'audio_cleanup',
        'qa_review',
      ],
      activityGroups: [
        {
          id: 'audio_cleanup',
          label: 'Audio cleanup',
          selectedActivityCount: 2,
          readyActivityCount: 2,
          reviewActivityCount: 0,
          blockedActivityCount: 0,
          status: 'ready_for_plan',
          userFacingSummary: 'Prepare speech clarity and loudness decisions for the edit.',
        },
        {
          id: 'captions',
          label: 'Captions',
          selectedActivityCount: 1,
          readyActivityCount: 1,
          reviewActivityCount: 0,
          blockedActivityCount: 0,
          status: 'ready_for_plan',
          userFacingSummary: 'Prepare readable captions where the edit plan needs them.',
        },
      ],
      backendIntentCount: 4,
      backendIntentKinds: ['model_role'],
      backendIntents: [
        {
          intentId: 'intent.private_manifest.kimi_primary_edit_agent',
          intentKind: 'model_role',
          executionBoundary: 'backend_approved_after_snapshot',
          providerRoute: 'kimi_k3_provider_boundary',
          providerModel: 'kimi-k3',
          modelRoleId: 'kimi_k3_main_edit_agent',
          requestedModelUse: 'edit_planning',
          hiddenAdapterToolCount: 0,
          requiredApprovalGates: [
            'approved_plan_snapshot',
            'credit_reservation',
            'idempotency_key',
            'private_artifact_policy',
          ],
        },
        {
          intentId: 'intent.private_manifest.qwen_first_fallback',
          intentKind: 'model_role',
          executionBoundary: 'backend_approved_after_snapshot',
          providerRoute: 'gpt_5_6_terra_provider_boundary',
          providerModel: 'gpt-5.6-terra',
          modelRoleId: 'gpt_5_6_terra_fallback_edit_agent',
          requestedModelUse: 'edit_planning',
          hiddenAdapterToolCount: 0,
          requiredApprovalGates: [
            'approved_plan_snapshot',
            'credit_reservation',
            'idempotency_key',
            'private_artifact_policy',
          ],
        },
        {
          intentId: 'intent.private_manifest.visual_intelligence',
          intentKind: 'model_role',
          executionBoundary: 'backend_approved_after_snapshot',
          providerRoute: 'vertex_gemini_pro_visual_intelligence_boundary',
          providerModel: 'gemini-3.1-pro-preview',
          modelRoleId: 'visual_intelligence_gemini_pro_high',
          requestedModelUse: 'visual_understanding',
          hiddenAdapterToolCount: 0,
          requiredApprovalGates: [
            'approved_plan_snapshot',
            'credit_reservation',
            'idempotency_key',
            'private_artifact_policy',
          ],
        },
        {
          intentId: 'intent.private_manifest.deepseek_final_fallback',
          intentKind: 'model_role',
          executionBoundary: 'backend_approved_after_snapshot',
          providerRoute: 'deepseek_v4_pro_tool_code_boundary',
          providerModel: 'deepseek-v4-pro',
          modelRoleId: 'deepseek_v4_tool_code_agent',
          requestedModelUse: 'edit_planning',
          hiddenAdapterToolCount: 0,
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
        contractVersion: 'reeditpro-model-role-routing-v5-visual-intelligence-gemini-pro-high',
        ok: true,
        blocked: false,
        checkedContractCount: 7,
        modelRoleIntentCount: 4,
        roles: [
          {
            modelRoleId: 'kimi_k3_main_edit_agent',
            providerBoundary: 'kimi_k3_provider_boundary',
            canonicalProviderModel: 'kimi-k3',
            requestedUses: ['edit_planning'],
            intentIds: ['intent.private_manifest.kimi_primary_edit_agent'],
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
            modelRoleId: 'gpt_5_6_terra_fallback_edit_agent',
            providerBoundary: 'gpt_5_6_terra_provider_boundary',
            canonicalProviderModel: 'gpt-5.6-terra',
            requestedUses: ['edit_planning'],
            intentIds: ['intent.private_manifest.terra_first_fallback'],
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
            modelRoleId: 'visual_intelligence_gemini_pro_high',
            providerBoundary: 'vertex_gemini_pro_visual_intelligence_boundary',
            canonicalProviderModel: 'gemini-3.1-pro-preview',
            requestedUses: ['visual_understanding'],
            intentIds: ['intent.private_manifest.visual_intelligence'],
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
          {
            modelRoleId: 'deepseek_v4_tool_code_agent',
            providerBoundary: 'deepseek_v4_pro_tool_code_boundary',
            canonicalProviderModel: 'deepseek-v4-pro',
            requestedUses: ['edit_planning'],
            intentIds: ['intent.private_manifest.deepseek_final_fallback'],
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
        ],
        errors: [],
        mockOnly: true,
      },
      qaGateCount: 5,
      userFacingActivities: [
        'Understand the edit request and convert it into structured direction.',
        'Review source order and structure before planning the edit.',
        'Prepare clean readable captions only when the plan needs them.',
        'Prepare a private review package for internal QA.',
      ],
      warnings: [
        'No Edit Brief was provided; planning continues from prompt and source context.',
      ],
      blockers: [],
      editBriefOptional: true,
      promptFirstPlanning: true,
      noUserVisibleToolNames: true,
    },
  },
  creditReservationId: 'mock-credit-reservation-approved-snapshot-001',
  renderPreviewAssemblyId: 'render_preview_assembly_001',
  finalRenderArtifactId: 'final-render-001',
  clipDecisionCount: 1,
  sourceMediaAssetCount: 1,
  uploadedSourceOrderTrace: {
    source: 'uploaded_media_source_order',
    sourceMediaAssetIds: ['source-media-001'],
    uploadedOrders: [1],
    sourceChecksumSha256ByMediaAssetId: {
      'source-media-001': sourceChecksumSha256,
    },
    sourceStorageProviderByMediaAssetId: {
      'source-media-001': 'local_private',
    },
    sourceStorageBucketByMediaAssetId: {
      'source-media-001': 'source-media',
    },
    sourceStoragePathByMediaAssetId: {
      'source-media-001': 'uploads/source-media-001.mp4',
    },
    sourceFileNameByMediaAssetId: {
      'source-media-001': 'source-media-001.mp4',
    },
    sourceMimeTypeByMediaAssetId: {
      'source-media-001': 'video/mp4',
    },
    sourceByteSizeByMediaAssetId: {
      'source-media-001': 12345,
    },
    uniqueUploadedOrderCount: 1,
    uniqueSourceMediaAssetCount: 1,
    firstAppearanceSourceMediaAssetIds: ['source-media-001'],
    firstAppearanceUploadedOrders: [1],
    sourceMediaCoverageComplete: true,
    sourceOrderPreserved: true,
    uploadedOrderMonotonic: true,
  },
  privateCaptionPackage: {
    attached: true,
    source: 'approved_caption_timing_private_caption_files',
    artifactCount: 3,
    formats: ['srt', 'webvtt', 'ass'],
  },
  adapterQaIntegration: {
    attached: false,
    adapterWorkerArtifactIntegrationId: null,
    privateMediaRunnerQaReviewId: null,
    renderIntegrationManifestArtifactId: null,
    reviewedActivityCount: 0,
    passedActivityCount: 0,
    artifactCount: 0,
    renderPreviewIntegrationReady: false,
    finalRenderDecisionManifestEligible: false,
    mediaProcessingExecuted: false,
    mediaTransformOutputEligible: false,
    productRuntimeExecuted: false,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    artifacts: [],
  },
  professionalLayerCounts: {
    reviewOverlays: 1,
    captionOverlays: 1,
    transitionPolish: 0,
    visualPolish: 1,
    finalTiming: 1,
    audioPolish: 1,
  },
  decisions: [
    {
      clipRefId: 'clip-001',
      processedArtifactId: 'processed-media-001',
      processedArtifact: {
        storageProvider: 'local_private',
        storageObjectPath: 'private/processed/processed-media-001.mp4',
        mimeType: 'video/mp4',
        sha256: 'b'.repeat(64),
        byteSize: 8192,
        durationSeconds: 1,
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
      },
      sourceMediaAssetId: 'source-media-001',
      sourceChecksumSha256,
      sourceStorageProvider: 'local_private',
      sourceStorageBucket: 'source-media',
      sourceStoragePath: 'uploads/source-media-001.mp4',
      sourceFileName: 'source-media-001.mp4',
      sourceMimeType: 'video/mp4',
      sourceByteSize: 12345,
      uploadedOrder: 1,
      segment: {
        id: 'segment-001',
        order: 1,
        label: 'Opening',
      },
      approvedSourceRange: {
        source: 'master_timing_source_range',
        clipId: 'clip-001',
        sourceSequenceItemId: 'source-sequence-item-001',
        startSeconds: 0,
        durationSeconds: 1,
        endSeconds: 1,
        requestedMaxDurationSeconds: 2,
      },
      reviewOverlay: { present: true, hasTitle: true, hasSubtitle: true, source: 'approved_segment_metadata' },
      captionOverlay: { present: true, captionTimingItemId: 'caption-001', textPresent: true, textCharacterCount: 24, source: 'approved_caption_timing' },
      transitionPolish: { present: false, transitionTimingItemIds: [], fadeInSeconds: null, fadeOutSeconds: null, source: 'single_clip_no_transition' },
      visualPolish: { present: true, colorPipelinePlanId: 'color-plan-001', colorGradeStyle: 'clean', intensity: 'subtle', operationCount: 1, source: 'approved_color_pipeline', fullColorPipelineExecuted: false },
      finalTiming: { present: true, finalTimingItemId: 'final-timing-001', startSeconds: 0, durationSeconds: 1, endSeconds: 1, fps: 24, source: 'approved_master_timing' },
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
    },
  ],
  gateState: {
    privateInternalReview: 'requires_delivery_qa',
    publicDeliveryReady: false,
    externalBetaReady: false,
    productionReady: false,
  },
  blockedRuntimeScopes: {
    publicArtifactCreated: false,
    signedUrlCreated: false,
    supabaseOrGcsWrite: false,
    externalBetaEnabled: false,
    productionEnabled: false,
    billingMutation: false,
  },
}

const validResult = verifyPrivateEditDecisionManifest({
  manifest: validManifest,
  approvedPlanSnapshotId: 'approved-snapshot-001',
  renderPreviewAssemblyId: 'render_preview_assembly_001',
  creditReservationId: 'mock-credit-reservation-approved-snapshot-001',
  finalRenderArtifactId: 'final-render-001',
  sourceMediaAssets,
  now: new Date('2026-07-06T12:00:00.000Z'),
})
assert.equal(validResult.ok, true, validResult.ok ? 'Valid private edit manifest should verify.' : validResult.message)
if (validResult.ok) {
  assert.equal(validResult.verification.sourceMediaAssetCount, 1)
  assert.equal(validResult.verification.clipDecisionCount, 1)
  assert.equal(validResult.verification.sourceOrderPreserved, true)
  assert.equal(validResult.verification.sourceMediaCoverageComplete, true)
  assert.equal(validResult.verification.sourceChecksumCoverageComplete, true)
  assert.equal(validResult.verification.sourceStorageIdentityCoverageComplete, true)
  assert.equal(validResult.verification.processedPrivateArtifactTraceComplete, true)
  assert.equal(validResult.verification.processedArtifactCount, 1)
  assert.deepEqual(validResult.verification.processedArtifactIds, ['processed-media-001'])
  assert.deepEqual(validResult.verification.firstAppearanceUploadedOrders, [1])
  assert.deepEqual(validResult.verification.firstAppearanceSourceMediaAssetIds, ['source-media-001'])
  assert.equal(validResult.verification.privateCaptionPackageAttached, true)
  assert.equal(validResult.verification.approvedEditContextReady, true)
  assert.equal(validResult.verification.approvedEditContext.goalSummary, 'Create a clean professional edit from uploaded clips.')
  assert.equal(validResult.verification.approvedEditContext.creditEstimateTotalCredits, 12)
  assert.equal(validResult.verification.approvedEditContext.planningContextTrace?.source, 'planning_context')
  assert.equal(validResult.verification.approvedEditContext.planningContextTrace?.editBriefReady, true)
  assert.equal(validResult.verification.approvedEditContext.planningContextTrace?.cueUsageCount, 2)
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.source, 'professional_skill_plan')
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.status, 'ready_for_plan')
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.selectedSkillCount, 6)
  assert.deepEqual(validResult.verification.approvedEditContext.professionalSkillTrace?.selectedFamilies, [
    'intent_direction',
    'source_structure',
    'captions',
    'audio_cleanup',
    'qa_review',
  ])
  assert.deepEqual(
    validResult.verification.approvedEditContext.professionalSkillTrace?.activityGroups?.map((group) => group.label),
    ['Audio cleanup', 'Captions'],
  )
  assert.equal(
    validResult.verification.approvedEditContext.professionalSkillTrace?.activityGroups?.[0]?.selectedActivityCount,
    2,
  )
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.qaGateCount, 5)
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.backendIntentCount, 4)
  assert.deepEqual(validResult.verification.approvedEditContext.professionalSkillTrace?.backendIntentKinds, ['model_role'])
  assert.ok(
    validResult.verification.approvedEditContext.professionalSkillTrace?.backendIntents?.some((intent) =>
      intent.providerRoute === 'kimi_k3_provider_boundary' &&
      intent.modelRoleId === 'kimi_k3_main_edit_agent' &&
      intent.requestedModelUse === 'edit_planning',
    ),
    'Private manifest verification must preserve the Kimi K3 primary edit-agent backend intent.',
  )
  assert.ok(
    validResult.verification.approvedEditContext.professionalSkillTrace?.backendIntents?.some((intent) =>
      intent.providerRoute === 'gpt_5_6_terra_provider_boundary' &&
      intent.modelRoleId === 'gpt_5_6_terra_fallback_edit_agent' &&
      intent.requestedModelUse === 'edit_planning',
    ),
    'Private manifest verification must preserve the Qwen 3.7 first-fallback backend intent.',
  )
  assert.ok(
    validResult.verification.approvedEditContext.professionalSkillTrace?.backendIntents?.some((intent) =>
      intent.providerRoute === 'vertex_gemini_pro_visual_intelligence_boundary' &&
      intent.modelRoleId === 'visual_intelligence_gemini_pro_high' &&
      intent.requestedModelUse === 'visual_understanding',
    ),
    'Private manifest verification must preserve the visual-understanding backend intent.',
  )
  assert.ok(
    validResult.verification.approvedEditContext.professionalSkillTrace?.backendIntents?.some((intent) =>
      intent.providerRoute === 'deepseek_v4_pro_tool_code_boundary' &&
      intent.modelRoleId === 'deepseek_v4_tool_code_agent' &&
      intent.requestedModelUse === 'edit_planning',
    ),
    'Private manifest verification must preserve the DeepSeek V4 Pro final-fallback backend intent.',
  )
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.modelRoleTrace?.ok, true)
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.modelRoleTrace?.blocked, false)
  assert.ok(
    validResult.verification.approvedEditContext.professionalSkillTrace?.modelRoleTrace?.roles.some((role) =>
      role.modelRoleId === 'kimi_k3_main_edit_agent' &&
      role.providerBoundary === 'kimi_k3_provider_boundary' &&
      role.canonicalProviderModel === 'kimi-k3' &&
      role.requestedUses.includes('edit_planning') &&
      role.reasoningRouteRole === 'primary' &&
      role.reasoningRoutePriority === 1 &&
      !role.fallbackOnly &&
      role.userReasoningAllowed &&
      role.editPlanningAllowed &&
      role.creativeStrategyAllowed &&
      role.editQaReasoningAllowed &&
      role.toolCodeAllowed &&
      role.remotionDraftAllowed
    ),
    'Private manifest verification must preserve Kimi K3 as the primary edit reasoning/planning/coding role.',
  )
  assert.ok(
    validResult.verification.approvedEditContext.professionalSkillTrace?.modelRoleTrace?.roles.some((role) =>
      role.modelRoleId === 'gpt_5_6_terra_fallback_edit_agent' &&
      role.providerBoundary === 'gpt_5_6_terra_provider_boundary' &&
      role.canonicalProviderModel === 'gpt-5.6-terra' &&
      role.requestedUses.includes('edit_planning') &&
      role.reasoningRouteRole === 'fallback' &&
      role.reasoningRoutePriority === 2 &&
      role.fallbackOnly &&
      role.userReasoningAllowed &&
      role.editPlanningAllowed &&
      role.creativeStrategyAllowed &&
      role.editQaReasoningAllowed &&
      role.toolCodeAllowed &&
      role.remotionDraftAllowed
    ),
    'Private manifest verification must preserve Qwen 3.7 as the first full-capability fallback.',
  )
  assert.ok(
    validResult.verification.approvedEditContext.professionalSkillTrace?.modelRoleTrace?.roles.some((role) =>
      role.modelRoleId === 'visual_intelligence_gemini_pro_high' &&
      role.providerBoundary === 'vertex_gemini_pro_visual_intelligence_boundary' &&
      role.canonicalProviderModel === 'gemini-3.1-pro-preview' &&
      role.requestedUses.includes('visual_understanding') &&
      role.reasoningRouteRole === 'specialist' &&
      role.reasoningRoutePriority === null &&
      !role.fallbackOnly &&
      role.visualUnderstandingAllowed &&
      !role.userReasoningAllowed &&
      !role.editPlanningAllowed &&
      !role.creativeStrategyAllowed &&
      !role.editQaReasoningAllowed
    ),
    'Private manifest verification must preserve Visual Intelligence as visual-understanding only.',
  )
  assert.ok(
    validResult.verification.approvedEditContext.professionalSkillTrace?.modelRoleTrace?.roles.some((role) =>
      role.modelRoleId === 'deepseek_v4_tool_code_agent' &&
      role.canonicalProviderModel === 'deepseek-v4-pro' &&
      role.requestedUses.includes('edit_planning') &&
      role.reasoningRouteRole === 'fallback' &&
      role.reasoningRoutePriority === 3 &&
      role.fallbackOnly &&
      role.userReasoningAllowed &&
      role.editPlanningAllowed &&
      role.creativeStrategyAllowed &&
      role.editQaReasoningAllowed &&
      role.toolCodeAllowed &&
      role.remotionDraftAllowed
    ),
    'Private manifest verification must preserve DeepSeek V4 Pro as the final full-capability fallback.',
  )
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.editBriefOptional, true)
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.promptFirstPlanning, true)
  assert.deepEqual(validResult.verification.approvedEditContext.professionalSkillTrace?.warnings, [
    'No Edit Brief was provided; planning continues from prompt and source context.',
  ])
  assert.deepEqual(validResult.verification.approvedEditContext.professionalSkillTrace?.blockers, [])
  assert.equal(validResult.verification.approvedEditContext.professionalSkillTrace?.noUserVisibleToolNames, true)
  assert.equal(
    /librosa|pydub|ffmpeg|gpac|mkvtoolnix|streamer_render_pipeline_support/i.test(JSON.stringify(validResult.verification.approvedEditContext.professionalSkillTrace)),
    false,
    'Verified professional skill trace must not expose internal adapter/tool names.',
  )
  assert.equal(validResult.verification.verifiedAt, '2026-07-06T12:00:00.000Z')
}

const wrongSnapshotResult = verifyPrivateEditDecisionManifest({
  manifest: validManifest,
  approvedPlanSnapshotId: 'approved-snapshot-other',
  sourceMediaAssets,
})
assert.equal(wrongSnapshotResult.ok, false, 'Manifest from a different approved snapshot should fail closed.')

const shallowManifestResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    uploadedSourceOrderTrace: {
      ...validManifest.uploadedSourceOrderTrace,
      sourceOrderPreserved: false,
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(shallowManifestResult.ok, false, 'Manifest without preserved source-order evidence should fail closed.')

const missingSourceCoverageResult = verifyPrivateEditDecisionManifest({
  manifest: validManifest,
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets: [
    ...sourceMediaAssets,
    {
      mediaAssetId: 'media-2',
      sourceSequenceItemId: 'source-item-2',
      uploadedClipId: 'clip-2',
      uploadedOrder: 2,
      storageProvider: 'local_private',
      storagePath: 'source-media/media-2.mp4',
      fileName: 'source-2.mp4',
      mimeType: 'video/mp4',
      byteSize: 2048,
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    },
  ],
})
assert.equal(missingSourceCoverageResult.ok, false, 'Manifest missing one current edit source asset should fail closed.')

const checksumMismatchResult = verifyPrivateEditDecisionManifest({
  manifest: validManifest,
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets: [
    {
      ...sourceMediaAssets[0],
      checksumSha256: 'b'.repeat(64),
    },
  ],
})
assert.equal(checksumMismatchResult.ok, false, 'Manifest with stale source checksum evidence should fail closed.')

const storageIdentityMismatchResult = verifyPrivateEditDecisionManifest({
  manifest: validManifest,
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets: [
    {
      ...sourceMediaAssets[0],
      storagePath: 'uploads/source-media-001-replaced.mp4',
    },
  ],
})
assert.equal(storageIdentityMismatchResult.ok, false, 'Manifest with stale source storage identity should fail closed.')

const missingProcessedArtifactResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    decisions: [
      {
        ...validManifest.decisions[0],
        processedArtifact: undefined,
      },
    ],
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(missingProcessedArtifactResult.ok, false, 'Manifest without processed private artifact evidence should fail closed.')

const missingApprovedContextResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    approvedEditContext: {
      ...validManifest.approvedEditContext,
      goalSummary: '',
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(missingApprovedContextResult.ok, false, 'Manifest without approved edit context evidence should fail closed.')

const validProfessionalSkillTrace = validManifest.approvedEditContext.professionalSkillTrace!
const validModelRoleTrace = validProfessionalSkillTrace.modelRoleTrace!
const validBackendIntents = validProfessionalSkillTrace.backendIntents ?? []
assert.ok(validBackendIntents.length > 0, 'Valid manifest fixture should include model-role backend intents.')

const missingModelRoleTraceResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    approvedEditContext: {
      ...validManifest.approvedEditContext,
      professionalSkillTrace: {
        ...validProfessionalSkillTrace,
        modelRoleTrace: undefined,
      },
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(missingModelRoleTraceResult.ok, false, 'Manifest without model-role trace evidence should fail closed.')

const invalidDeepSeekVisualUnderstandingTraceResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    approvedEditContext: {
      ...validManifest.approvedEditContext,
      professionalSkillTrace: {
        ...validProfessionalSkillTrace,
        modelRoleTrace: {
          ...validModelRoleTrace,
          roles: validModelRoleTrace.roles.map((role) =>
            role.modelRoleId === 'deepseek_v4_tool_code_agent'
              ? {
                  ...role,
                  requestedUses: ['visual_understanding' as const],
                  visualUnderstandingAllowed: true,
                }
              : role
          ),
        },
      },
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(
  invalidDeepSeekVisualUnderstandingTraceResult.ok,
  false,
  'invalid_deepseek_visual_understanding_trace_rejected',
)

const invalidModelRoleTraceCanonicalModelResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    approvedEditContext: {
      ...validManifest.approvedEditContext,
      professionalSkillTrace: {
        ...validProfessionalSkillTrace,
        modelRoleTrace: {
          ...validModelRoleTrace,
          roles: validModelRoleTrace.roles.map((role) =>
            role.modelRoleId === 'kimi_k3_main_edit_agent'
              ? {
                  ...role,
                  canonicalProviderModel: 'deepseek-v4-pro',
                }
              : role
          ),
        },
      },
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(
  invalidModelRoleTraceCanonicalModelResult.ok,
  false,
  'Manifest with mismatched canonical model-role trace evidence should fail closed.',
)

const invalidBackendIntentProviderModelResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    approvedEditContext: {
      ...validManifest.approvedEditContext,
      professionalSkillTrace: {
        ...validProfessionalSkillTrace,
        backendIntents: validBackendIntents.map((intent) =>
          intent.intentId === 'intent.private_manifest.kimi_primary_edit_agent'
            ? {
                ...intent,
                providerModel: 'deepseek-v4-pro',
              }
            : intent
        ),
      },
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(
  invalidBackendIntentProviderModelResult.ok,
  false,
  'Manifest that maps the main edit agent backend intent to the wrong provider model should fail closed.',
)
if (!invalidBackendIntentProviderModelResult.ok) {
  assert.match(
    invalidBackendIntentProviderModelResult.message,
    /provider-model validation|canonical provider model/,
    'Mismatched backend intent provider model should report model-role validation evidence.',
  )
}

const missingBackendIntentProviderModelResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    approvedEditContext: {
      ...validManifest.approvedEditContext,
      professionalSkillTrace: {
        ...validProfessionalSkillTrace,
        backendIntents: validBackendIntents.map((intent) =>
          intent.intentId === 'intent.private_manifest.visual_intelligence'
            ? {
                ...intent,
                providerModel: undefined,
              }
            : intent
        ),
      },
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(
  missingBackendIntentProviderModelResult.ok,
  false,
  'Manifest with missing model-role backend provider model evidence should fail closed.',
)
if (!missingBackendIntentProviderModelResult.ok) {
  assert.match(
    missingBackendIntentProviderModelResult.message,
    /missing provider route or provider model evidence/,
    'Missing backend intent provider model should report missing provider evidence.',
  )
}

const publicScopeResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    blockedRuntimeScopes: {
      ...validManifest.blockedRuntimeScopes,
      publicArtifactCreated: true as false,
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(publicScopeResult.ok, false, 'Manifest that enables public delivery scope should fail closed.')

const missingVisualPolishResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    professionalLayerCounts: {
      ...validManifest.professionalLayerCounts,
      visualPolish: 0,
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets,
})
assert.equal(missingVisualPolishResult.ok, false, 'Manifest without approved visual polish should fail closed.')

const multiClipWithoutTransitionResult = verifyPrivateEditDecisionManifest({
  manifest: {
    ...validManifest,
    clipDecisionCount: 2,
    sourceMediaAssetCount: 2,
    uploadedSourceOrderTrace: {
      ...validManifest.uploadedSourceOrderTrace,
      sourceMediaAssetIds: ['source-media-001', 'source-media-002'],
      uploadedOrders: [1, 2],
      sourceChecksumSha256ByMediaAssetId: {
        'source-media-001': sourceChecksumSha256,
        'source-media-002': secondSourceChecksumSha256,
      },
      sourceStorageProviderByMediaAssetId: {
        'source-media-001': 'local_private',
        'source-media-002': 'local_private',
      },
      sourceStorageBucketByMediaAssetId: {
        'source-media-001': 'source-media',
        'source-media-002': 'source-media',
      },
      sourceStoragePathByMediaAssetId: {
        'source-media-001': 'uploads/source-media-001.mp4',
        'source-media-002': 'uploads/source-media-002.mp4',
      },
      sourceFileNameByMediaAssetId: {
        'source-media-001': 'source-media-001.mp4',
        'source-media-002': 'source-media-002.mp4',
      },
      sourceMimeTypeByMediaAssetId: {
        'source-media-001': 'video/mp4',
        'source-media-002': 'video/mp4',
      },
      sourceByteSizeByMediaAssetId: {
        'source-media-001': 12345,
        'source-media-002': 67890,
      },
      uniqueUploadedOrderCount: 2,
      uniqueSourceMediaAssetCount: 2,
      firstAppearanceSourceMediaAssetIds: ['source-media-001', 'source-media-002'],
      firstAppearanceUploadedOrders: [1, 2],
    },
    decisions: [
      validManifest.decisions[0],
      {
        ...validManifest.decisions[0],
        clipRefId: 'clip-002',
        processedArtifactId: 'processed-media-002',
        processedArtifact: {
          ...validManifest.decisions[0].processedArtifact!,
          storageObjectPath: 'private/processed/processed-media-002.mp4',
          sha256: 'd'.repeat(64),
        },
        sourceMediaAssetId: 'source-media-002',
        sourceChecksumSha256: secondSourceChecksumSha256,
        sourceStorageProvider: 'local_private',
        sourceStorageBucket: 'source-media',
        sourceStoragePath: 'uploads/source-media-002.mp4',
        sourceFileName: 'source-media-002.mp4',
        sourceMimeType: 'video/mp4',
        sourceByteSize: 67890,
        uploadedOrder: 2,
        segment: {
          id: 'segment-002',
          order: 2,
          label: 'Second beat',
        },
        approvedSourceRange: {
          ...validManifest.decisions[0].approvedSourceRange,
          clipId: 'clip-002',
          sourceSequenceItemId: 'source-sequence-item-002',
        },
      },
    ],
    professionalLayerCounts: {
      ...validManifest.professionalLayerCounts,
      transitionPolish: 0,
    },
  },
  approvedPlanSnapshotId: 'approved-snapshot-001',
  sourceMediaAssets: [...sourceMediaAssets, secondSourceMediaAsset],
})
assert.equal(multiClipWithoutTransitionResult.ok, false, 'Multi-clip manifest without transition polish should fail closed.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_private_edit_manifest_verified',
    'wrong_snapshot_manifest_rejected',
    'missing_source_order_manifest_rejected',
    'professional_skill_trace_preserved',
    'professional_skill_trace_hides_internal_tool_names',
    'missing_current_source_asset_manifest_rejected',
    'source_checksum_mismatch_manifest_rejected',
    'source_storage_identity_mismatch_manifest_rejected',
    'missing_processed_private_artifact_manifest_rejected',
    'missing_approved_context_manifest_rejected',
    'model_role_trace_preserved',
    'missing_model_role_trace_rejected',
    'invalid_deepseek_visual_understanding_trace_rejected',
    'invalid_model_role_trace_canonical_model_rejected',
    'invalid_backend_intent_provider_model_rejected',
    'missing_backend_intent_provider_model_rejected',
    'public_scope_manifest_rejected',
    'missing_visual_polish_manifest_rejected',
    'multi_clip_missing_transition_polish_manifest_rejected',
  ],
}))
