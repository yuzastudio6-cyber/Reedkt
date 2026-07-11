import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
  ProfessionalEditDecisionManifestClientModel,
} from './approved-edit-execution-package-client'
import { validateReEditProModelRoleUse } from './model-role-routing-contract'
import {
  REEDITPRO_MODEL_ROLE_IDS,
  REEDITPRO_REQUESTED_MODEL_USES,
  type ReEditProModelRoleId,
  type ReEditProRequestedModelUse,
} from '../types/model-role-routing'

export type PrivateEditDecisionManifestVerification = {
  manifestVersion: 'private-internal-edit-decision-manifest-v1'
  approvedPlanSnapshotId: string
  renderPreviewAssemblyId: string
  creditReservationId: string
  finalRenderArtifactId: string
  approvedEditContextReady: boolean
  approvedEditContext: {
    projectId: string
    editSessionId: string
    goalSummary: string
    editLevel: string | null
    editingCategory: string | null
    aspectRatio: string | null
    creditEstimateTotalCredits: number
    segmentCount: number
    operationCount: number
    professionalSkillTrace: {
      source: 'professional_skill_plan'
      status: string
      selectedSkillCount: number
      selectedFamilies: string[]
      activityGroups: Array<{
        id: string
        label: string
        selectedActivityCount: number
        readyActivityCount: number
        reviewActivityCount: number
        blockedActivityCount: number
        status: string
        userFacingSummary: string
      }>
      selectionEvidence?: Array<{
        skillId: string
        userFacingActivity: string
        sources: string[]
        summaries: string[]
      }>
      backendIntentCount?: number
      backendIntentKinds?: string[]
      backendIntents?: Array<{
        intentId: string
        intentKind: string
        executionBoundary: string
        providerRoute?: string
        providerModel?: string
        modelRoleId?: string
        requestedModelUse?: string
        generationType?: string
        outputAssetType?: string
        hiddenAdapterToolCount: number
        requiredApprovalGates: string[]
      }>
      modelRoleTrace?: {
        source: 'reeditpro_model_role_contract'
        contractVersion: string
        ok: boolean
        blocked: boolean
        checkedContractCount: number
        modelRoleIntentCount: number
        roles: Array<{
          modelRoleId: string
          providerBoundary: string
          canonicalProviderModel: string
          requestedUses: string[]
          intentIds: string[]
          userReasoningAllowed: boolean
          editPlanningAllowed: boolean
          visualUnderstandingAllowed: boolean
          toolCodeAllowed: boolean
          remotionDraftAllowed: boolean
        }>
        errors: string[]
        mockOnly: true
      }
      qaGateCount: number
      userFacingActivities: string[]
      warnings: string[]
      blockers: string[]
      editBriefOptional: true
      promptFirstPlanning: true
      noUserVisibleToolNames: true
    } | null
    planningContextTrace: {
      source: 'planning_context'
      planningContextId: string
      status: string
      editBriefReady: boolean
      editBriefDirectionCount: number
      cueUsageCount: number
      readyCueUsageCount: number
      blockedCueUsageCount: number
      unresolvedConflictCount: number
      sourceAssetCount: number
      mustUseAssetCount: number
      avoidAssetCount: number
    } | null
  }
	  sourceMediaAssetCount: number
	  clipDecisionCount: number
	  sourceOrderPreserved: boolean
	  uploadedOrderMonotonic: boolean
	  sourceMediaCoverageComplete: boolean
	  sourceChecksumCoverageComplete: boolean
	  sourceStorageIdentityCoverageComplete: boolean
	  processedPrivateArtifactTraceComplete: boolean
	  processedArtifactCount: number
	  processedArtifactIds: string[]
	  firstAppearanceSourceMediaAssetIds: string[]
	  firstAppearanceUploadedOrders: number[]
	  privateCaptionPackageAttached: boolean
	  professionalLayerCounts: {
	    reviewOverlays: number
	    captionOverlays: number
	    transitionPolish: number
	    visualPolish: number
	    finalTiming: number
	    audioQa?: number
	    audioPolish: number
	  }
	  verifiedAt: string
}

export type PrivateEditDecisionManifestVerificationInput = {
  manifest: ProfessionalEditDecisionManifestClientModel
  approvedPlanSnapshotId?: string
  renderPreviewAssemblyId?: string
  creditReservationId?: string
  finalRenderArtifactId?: string
  sourceMediaAssets?: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  now?: Date
}

export type PrivateEditDecisionManifestVerificationResult =
  | { ok: true; verification: PrivateEditDecisionManifestVerification }
  | { ok: false; message: string }

export function verifyPrivateEditDecisionManifest(
  input: PrivateEditDecisionManifestVerificationInput,
): PrivateEditDecisionManifestVerificationResult {
  const { manifest } = input

  if (manifest.manifestVersion !== 'private-internal-edit-decision-manifest-v1') {
    return failed('Private edit manifest version is not supported.')
  }

  if (manifest.source !== 'approved_snapshot_private_render_execution') {
    return failed('Private edit manifest source does not match approved snapshot execution.')
  }

  if (input.approvedPlanSnapshotId && manifest.approvedPlanSnapshotId !== input.approvedPlanSnapshotId) {
    return failed('Private edit manifest does not match the approved snapshot for this edit.')
  }

  if (input.renderPreviewAssemblyId && manifest.renderPreviewAssemblyId !== input.renderPreviewAssemblyId) {
    return failed('Private edit manifest does not match the review assembly for this edit.')
  }

  if (input.creditReservationId && manifest.creditReservationId !== input.creditReservationId) {
    return failed('Private edit manifest does not match the credit reservation trace for this edit.')
  }

  if (input.finalRenderArtifactId && manifest.finalRenderArtifactId !== input.finalRenderArtifactId) {
    return failed('Private edit manifest does not match the final review artifact.')
  }

  const approvedEditContext = manifest.approvedEditContext
  if (
    !approvedEditContext ||
    approvedEditContext.source !== 'approved_plan_snapshot' ||
    !approvedEditContext.projectId?.trim() ||
    !approvedEditContext.editSessionId?.trim() ||
    !approvedEditContext.editPlanVersionId?.trim() ||
    !approvedEditContext.creditEstimateId?.trim() ||
    !approvedEditContext.goalSummary?.trim() ||
    approvedEditContext.professionalBaseline !== true ||
    approvedEditContext.aspectRatioConfirmed !== true ||
    approvedEditContext.sourceOrderConfirmed !== true ||
    approvedEditContext.cleanupPreferenceConfirmed !== true ||
    approvedEditContext.timingBaseConfirmed !== true ||
    !Number.isFinite(approvedEditContext.creditEstimateTotalCredits) ||
    approvedEditContext.creditEstimateTotalCredits <= 0 ||
    !Number.isFinite(approvedEditContext.sourceSequenceItemCount) ||
    approvedEditContext.sourceSequenceItemCount < 1 ||
    !Number.isFinite(approvedEditContext.segmentCount) ||
    approvedEditContext.segmentCount < 1 ||
    !Number.isFinite(approvedEditContext.operationCount) ||
    approvedEditContext.operationCount < 1 ||
    !Number.isFinite(approvedEditContext.qaGateCount) ||
    approvedEditContext.qaGateCount < 1
  ) {
    return failed('Private edit manifest does not include complete approved edit context evidence.')
  }

  if (/\/tmp\/|localFilePath|https?:\/\/|api[_-]?key|service[_-]?role|token|secret|password/i.test(JSON.stringify(approvedEditContext))) {
    return failed('Private edit manifest approved edit context contains unsafe source material.')
  }

  const modelRoleTraceResult = validateApprovedEditModelRoleTrace(approvedEditContext.professionalSkillTrace?.modelRoleTrace)
  if (!modelRoleTraceResult.ok) {
    return failed(modelRoleTraceResult.message)
  }

  const modelRoleBackendIntentResult = validateApprovedEditModelRoleBackendIntents(approvedEditContext.professionalSkillTrace?.backendIntents)
  if (!modelRoleBackendIntentResult.ok) {
    return failed(modelRoleBackendIntentResult.message)
  }

  if (manifest.clipDecisionCount < 1 || manifest.decisions.length !== manifest.clipDecisionCount) {
    return failed('Private edit manifest has an invalid clip decision count.')
  }

  const trace = manifest.uploadedSourceOrderTrace
  if (
    trace.source !== 'uploaded_media_source_order' ||
    trace.sourceOrderPreserved !== true ||
    trace.sourceMediaCoverageComplete !== true ||
    trace.sourceMediaAssetIds.length !== manifest.clipDecisionCount ||
    trace.uploadedOrders.length !== manifest.clipDecisionCount
  ) {
    return failed('Private edit manifest does not prove the uploaded source-order trace.')
  }

  if (
    trace.uniqueSourceMediaAssetCount !== manifest.sourceMediaAssetCount ||
    trace.uniqueUploadedOrderCount !== manifest.sourceMediaAssetCount ||
    trace.firstAppearanceSourceMediaAssetIds.length !== manifest.sourceMediaAssetCount ||
    trace.firstAppearanceUploadedOrders.length !== manifest.sourceMediaAssetCount
  ) {
    return failed('Private edit manifest source-order counts do not match the source media count.')
  }

  const expectedSourceMediaAssetIds = new Set(
    (input.sourceMediaAssets ?? [])
      .map((asset) => asset.mediaAssetId)
      .filter(Boolean),
  )
  if (expectedSourceMediaAssetIds.size > 0) {
    if (manifest.sourceMediaAssetCount !== expectedSourceMediaAssetIds.size) {
      return failed('Private edit manifest source media count does not match the current edit sources.')
    }

    const unexpectedSourceId = trace.sourceMediaAssetIds.find((sourceMediaAssetId) => !expectedSourceMediaAssetIds.has(sourceMediaAssetId))
    if (unexpectedSourceId) {
      return failed('Private edit manifest references a source media asset outside this edit.')
    }

    const missingExpectedSourceId = [...expectedSourceMediaAssetIds].find((sourceMediaAssetId) =>
      !trace.firstAppearanceSourceMediaAssetIds.includes(sourceMediaAssetId),
    )
    if (missingExpectedSourceId) {
      return failed('Private edit manifest does not cover every uploaded source media asset in this edit.')
    }
  }

  const expectedSourceChecksumsById = new Map(
    (input.sourceMediaAssets ?? [])
      .filter((asset) => asset.checksumSha256 && /^[a-f0-9]{64}$/i.test(asset.checksumSha256))
      .map((asset) => [asset.mediaAssetId, asset.checksumSha256!.toLowerCase()] as const),
  )
  if (expectedSourceChecksumsById.size > 0) {
    const manifestSourceChecksums = trace.sourceChecksumSha256ByMediaAssetId ?? {}
    const checksumMismatchSourceId = [...expectedSourceChecksumsById].find(([sourceMediaAssetId, expectedChecksum]) =>
      manifestSourceChecksums[sourceMediaAssetId]?.toLowerCase() !== expectedChecksum,
    )?.[0]
    if (checksumMismatchSourceId) {
      return failed('Private edit manifest source checksum trace does not match the current edit sources.')
    }

    const decisionChecksumMismatch = manifest.decisions.find((decision) => {
      const expectedChecksum = expectedSourceChecksumsById.get(decision.sourceMediaAssetId)
      return Boolean(expectedChecksum) && decision.sourceChecksumSha256?.toLowerCase() !== expectedChecksum
    })
    if (decisionChecksumMismatch) {
      return failed('Private edit manifest clip decision checksum does not match the current edit source.')
    }
  }

  const expectedSourceIdentityById = new Map(
    (input.sourceMediaAssets ?? [])
      .filter((asset) => asset.mediaAssetId && asset.storageProvider && asset.storagePath && asset.fileName && asset.mimeType && Number.isFinite(asset.byteSize))
      .map((asset) => [asset.mediaAssetId, asset] as const),
  )
  const storageProviderById = trace.sourceStorageProviderByMediaAssetId ?? {}
  const storageBucketById = trace.sourceStorageBucketByMediaAssetId ?? {}
  const storagePathById = trace.sourceStoragePathByMediaAssetId ?? {}
  const fileNameById = trace.sourceFileNameByMediaAssetId ?? {}
  const mimeTypeById = trace.sourceMimeTypeByMediaAssetId ?? {}
  const byteSizeById = trace.sourceByteSizeByMediaAssetId ?? {}
  const sourceStorageIdentityCoverageComplete = expectedSourceIdentityById.size < 1 ||
    [...expectedSourceIdentityById].every(([sourceMediaAssetId, sourceAsset]) =>
      storageProviderById[sourceMediaAssetId] === sourceAsset.storageProvider &&
      (!sourceAsset.storageBucket || storageBucketById[sourceMediaAssetId] === sourceAsset.storageBucket) &&
      storagePathById[sourceMediaAssetId] === sourceAsset.storagePath &&
      fileNameById[sourceMediaAssetId] === sourceAsset.fileName &&
      mimeTypeById[sourceMediaAssetId] === sourceAsset.mimeType &&
      byteSizeById[sourceMediaAssetId] === sourceAsset.byteSize,
    )
  if (expectedSourceIdentityById.size > 0) {
    if (!sourceStorageIdentityCoverageComplete) {
      return failed('Private edit manifest source storage identity trace does not match the current edit sources.')
    }

    const decisionIdentityMismatch = manifest.decisions.find((decision) => {
      const sourceAsset = expectedSourceIdentityById.get(decision.sourceMediaAssetId)
      return Boolean(sourceAsset) && (
        decision.sourceStorageProvider !== sourceAsset?.storageProvider ||
        (sourceAsset?.storageBucket ? decision.sourceStorageBucket !== sourceAsset.storageBucket : false) ||
        decision.sourceStoragePath !== sourceAsset?.storagePath ||
        decision.sourceFileName !== sourceAsset?.fileName ||
        decision.sourceMimeType !== sourceAsset?.mimeType ||
        decision.sourceByteSize !== sourceAsset?.byteSize
      )
    })
    if (decisionIdentityMismatch) {
      return failed('Private edit manifest clip decision source identity does not match the current edit source.')
    }
  }

  const traceMatchesDecisions =
    trace.uploadedOrders.every((uploadedOrder, index) => uploadedOrder === manifest.decisions[index]?.uploadedOrder) &&
    trace.sourceMediaAssetIds.every((sourceMediaAssetId, index) => sourceMediaAssetId === manifest.decisions[index]?.sourceMediaAssetId)
  if (!traceMatchesDecisions) {
    return failed('Private edit manifest source-order trace does not match clip decisions.')
  }

  const unsafeDecision = manifest.decisions.find((decision) =>
    decision.privateArtifact !== true ||
    decision.publicArtifact !== false ||
    decision.signedUrl !== null ||
    !Number.isFinite(decision.approvedSourceRange.durationSeconds) ||
    decision.approvedSourceRange.durationSeconds <= 0,
  )
  if (unsafeDecision) {
    return failed('Private edit manifest contains an unsafe or incomplete clip decision.')
  }

  const unsafeProcessedArtifactDecision = manifest.decisions.find((decision) => {
    const processedArtifact = decision.processedArtifact

    return (
      !processedArtifact ||
      processedArtifact.storageProvider !== 'local_private' ||
      typeof processedArtifact.storageObjectPath !== 'string' ||
      processedArtifact.storageObjectPath.trim().length < 1 ||
      /\/tmp\/|https?:\/\//i.test(processedArtifact.storageObjectPath) ||
      processedArtifact.mimeType !== 'video/mp4' ||
      !/^[a-f0-9]{64}$/i.test(processedArtifact.sha256) ||
      !Number.isFinite(processedArtifact.byteSize) ||
      processedArtifact.byteSize <= 0 ||
      !Number.isFinite(processedArtifact.durationSeconds) ||
      processedArtifact.durationSeconds <= 0 ||
      processedArtifact.privateArtifact !== true ||
      processedArtifact.publicArtifact !== false ||
      processedArtifact.signedUrl !== null
    )
  })
  if (unsafeProcessedArtifactDecision) {
    return failed('Private edit manifest does not prove each processed private clip artifact.')
  }

  if (
    manifest.gateState.publicDeliveryReady !== false ||
    manifest.gateState.externalBetaReady !== false ||
    manifest.gateState.productionReady !== false ||
    manifest.blockedRuntimeScopes.publicArtifactCreated !== false ||
    manifest.blockedRuntimeScopes.signedUrlCreated !== false ||
    manifest.blockedRuntimeScopes.supabaseOrGcsWrite !== false ||
    manifest.blockedRuntimeScopes.externalBetaEnabled !== false ||
    manifest.blockedRuntimeScopes.productionEnabled !== false ||
    manifest.blockedRuntimeScopes.billingMutation !== false
  ) {
    return failed('Private edit manifest unexpectedly enables a blocked runtime scope.')
  }

  if (
    manifest.privateCaptionPackage.attached !== true ||
    manifest.privateCaptionPackage.source !== 'approved_caption_timing_private_caption_files' ||
    manifest.privateCaptionPackage.artifactCount < 1
  ) {
    return failed('Private edit manifest does not include the approved private caption package.')
  }

	  const transitionPolishRequired = manifest.clipDecisionCount > 1
	  const audioQaIntegration = manifest.audioQaIntegration
	  if (
	    manifest.professionalLayerCounts.reviewOverlays < 1 ||
	    manifest.professionalLayerCounts.captionOverlays < 1 ||
	    manifest.professionalLayerCounts.visualPolish < 1 ||
	    manifest.professionalLayerCounts.finalTiming < 1 ||
	    manifest.professionalLayerCounts.audioPolish < 1 ||
	    (transitionPolishRequired && manifest.professionalLayerCounts.transitionPolish < 1)
	  ) {
	    return failed('Private edit manifest is missing required professional edit layers.')
	  }

	  if (audioQaIntegration) {
	    if (
	      audioQaIntegration.finalMuxAllowed !== false ||
	      audioQaIntegration.productRuntimeExecuted !== false ||
	      audioQaIntegration.publicArtifact !== false ||
	      audioQaIntegration.signedUrl !== null
	    ) {
	      return failed('Private edit manifest unexpectedly enables audio runtime delivery scope.')
	    }

	    if (
	      audioQaIntegration.attached === true &&
	      (
	        audioQaIntegration.source !== 'private_uploaded_audio_execution' ||
	        audioQaIntegration.reviewCount < 1 ||
	        audioQaIntegration.qaGateCount < 1 ||
	        audioQaIntegration.blocksPreview === true ||
	        (manifest.professionalLayerCounts.audioQa ?? 0) < 1
	      )
	    ) {
	      return failed('Private edit manifest audio QA evidence is incomplete.')
	    }
	  }

  if (/\/tmp\/|localFilePath|https?:\/\//i.test(JSON.stringify(manifest))) {
    return failed('Private edit manifest contains a local path or public URL.')
  }

  return {
    ok: true,
    verification: {
      manifestVersion: 'private-internal-edit-decision-manifest-v1',
      approvedPlanSnapshotId: manifest.approvedPlanSnapshotId,
      renderPreviewAssemblyId: manifest.renderPreviewAssemblyId,
      creditReservationId: manifest.creditReservationId,
      finalRenderArtifactId: manifest.finalRenderArtifactId,
      approvedEditContextReady: true,
      approvedEditContext: {
        projectId: approvedEditContext.projectId,
        editSessionId: approvedEditContext.editSessionId,
        goalSummary: approvedEditContext.goalSummary,
        editLevel: approvedEditContext.editLevel,
        editingCategory: approvedEditContext.editingCategory,
        aspectRatio: approvedEditContext.aspectRatio,
        creditEstimateTotalCredits: approvedEditContext.creditEstimateTotalCredits,
        segmentCount: approvedEditContext.segmentCount,
        operationCount: approvedEditContext.operationCount,
        professionalSkillTrace: parseProfessionalSkillTrace(approvedEditContext.professionalSkillTrace),
        planningContextTrace: parsePlanningContextTrace(approvedEditContext.planningContextTrace),
      },
      sourceMediaAssetCount: manifest.sourceMediaAssetCount,
      clipDecisionCount: manifest.clipDecisionCount,
      sourceOrderPreserved: trace.sourceOrderPreserved,
      uploadedOrderMonotonic: trace.uploadedOrderMonotonic,
      sourceMediaCoverageComplete: trace.sourceMediaCoverageComplete,
      sourceChecksumCoverageComplete: expectedSourceChecksumsById.size < 1 ||
        [...expectedSourceChecksumsById].every(([sourceMediaAssetId, expectedChecksum]) =>
          trace.sourceChecksumSha256ByMediaAssetId?.[sourceMediaAssetId]?.toLowerCase() === expectedChecksum,
        ),
      sourceStorageIdentityCoverageComplete,
      processedPrivateArtifactTraceComplete: true,
      processedArtifactCount: manifest.decisions.length,
      processedArtifactIds: manifest.decisions.map((decision) => decision.processedArtifactId),
      firstAppearanceSourceMediaAssetIds: [...trace.firstAppearanceSourceMediaAssetIds],
      firstAppearanceUploadedOrders: [...trace.firstAppearanceUploadedOrders],
      privateCaptionPackageAttached: manifest.privateCaptionPackage.attached,
      professionalLayerCounts: { ...manifest.professionalLayerCounts },
      verifiedAt: (input.now ?? new Date()).toISOString(),
    },
  }
}

function parsePlanningContextTrace(value: unknown): PrivateEditDecisionManifestVerification['approvedEditContext']['planningContextTrace'] {
  if (!value || typeof value !== 'object') return null
  const trace = value as Partial<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['planningContextTrace']>>
  if (
    trace.source !== 'planning_context' ||
    typeof trace.planningContextId !== 'string' ||
    typeof trace.status !== 'string'
  ) {
    return null
  }

  return {
    source: 'planning_context',
    planningContextId: trace.planningContextId,
    status: trace.status,
    editBriefReady: trace.editBriefReady === true,
    editBriefDirectionCount: safeCount(trace.editBriefDirectionCount),
    cueUsageCount: safeCount(trace.cueUsageCount),
    readyCueUsageCount: safeCount(trace.readyCueUsageCount),
    blockedCueUsageCount: safeCount(trace.blockedCueUsageCount),
    unresolvedConflictCount: safeCount(trace.unresolvedConflictCount),
    sourceAssetCount: safeCount(trace.sourceAssetCount),
    mustUseAssetCount: safeCount(trace.mustUseAssetCount),
    avoidAssetCount: safeCount(trace.avoidAssetCount),
  }
}

function parseProfessionalSkillTrace(value: unknown): PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace'] {
  if (!value || typeof value !== 'object') return null
  const trace = value as Partial<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>>
  if (
    trace.source !== 'professional_skill_plan' ||
    typeof trace.status !== 'string' ||
    trace.noUserVisibleToolNames !== true
  ) {
    return null
  }

  return {
    source: 'professional_skill_plan',
    status: trace.status,
    selectedSkillCount: safeCount(trace.selectedSkillCount),
    selectedFamilies: Array.isArray(trace.selectedFamilies)
      ? trace.selectedFamilies.filter((family): family is string => typeof family === 'string')
      : [],
    activityGroups: parseProfessionalSkillActivityGroups(trace.activityGroups),
    selectionEvidence: parseProfessionalSkillSelectionEvidence(trace.selectionEvidence),
    backendIntentCount: safeCount(trace.backendIntentCount),
    backendIntentKinds: parseStringArray(trace.backendIntentKinds),
    backendIntents: parseProfessionalSkillBackendIntents(trace.backendIntents),
    modelRoleTrace: parseProfessionalSkillModelRoleTrace(trace.modelRoleTrace),
    qaGateCount: safeCount(trace.qaGateCount),
    userFacingActivities: Array.isArray(trace.userFacingActivities)
      ? trace.userFacingActivities.filter((activity): activity is string => typeof activity === 'string')
      : [],
    warnings: Array.isArray(trace.warnings)
      ? trace.warnings.filter((warning): warning is string => typeof warning === 'string')
      : [],
    blockers: Array.isArray(trace.blockers)
      ? trace.blockers.filter((blocker): blocker is string => typeof blocker === 'string')
      : [],
    editBriefOptional: true,
    promptFirstPlanning: true,
    noUserVisibleToolNames: true,
  }
}

function parseProfessionalSkillModelRoleTrace(
  value: unknown,
): NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['modelRoleTrace'] | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['modelRoleTrace']>>
  if (
    record.source !== 'reeditpro_model_role_contract' ||
    typeof record.contractVersion !== 'string' ||
    typeof record.ok !== 'boolean' ||
    typeof record.blocked !== 'boolean' ||
    record.mockOnly !== true
  ) {
    return undefined
  }

  return {
    source: 'reeditpro_model_role_contract',
    contractVersion: record.contractVersion,
    ok: record.ok,
    blocked: record.blocked,
    checkedContractCount: safeCount(record.checkedContractCount),
    modelRoleIntentCount: safeCount(record.modelRoleIntentCount),
    roles: Array.isArray(record.roles)
      ? record.roles.flatMap((role) => {
          if (!role || typeof role !== 'object') return []
          const roleRecord = role as Partial<NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['modelRoleTrace']>['roles'][number]>
          if (
            typeof roleRecord.modelRoleId !== 'string' ||
            typeof roleRecord.providerBoundary !== 'string' ||
            typeof roleRecord.canonicalProviderModel !== 'string' ||
            typeof roleRecord.userReasoningAllowed !== 'boolean' ||
            typeof roleRecord.editPlanningAllowed !== 'boolean' ||
            typeof roleRecord.visualUnderstandingAllowed !== 'boolean' ||
            typeof roleRecord.toolCodeAllowed !== 'boolean' ||
            typeof roleRecord.remotionDraftAllowed !== 'boolean'
          ) {
            return []
          }

          return [{
            modelRoleId: roleRecord.modelRoleId,
            providerBoundary: roleRecord.providerBoundary,
            canonicalProviderModel: roleRecord.canonicalProviderModel,
            requestedUses: parseStringArray(roleRecord.requestedUses),
            intentIds: parseStringArray(roleRecord.intentIds),
            userReasoningAllowed: roleRecord.userReasoningAllowed,
            editPlanningAllowed: roleRecord.editPlanningAllowed,
            visualUnderstandingAllowed: roleRecord.visualUnderstandingAllowed,
            toolCodeAllowed: roleRecord.toolCodeAllowed,
            remotionDraftAllowed: roleRecord.remotionDraftAllowed,
          }]
        })
      : [],
    errors: parseStringArray(record.errors),
    mockOnly: true,
  }
}

function validateApprovedEditModelRoleTrace(
  trace: NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['modelRoleTrace'],
): { ok: true } | { ok: false; message: string } {
  if (!trace || trace.source !== 'reeditpro_model_role_contract') {
    return { ok: false, message: 'Private edit manifest approved edit context is missing model-role trace evidence.' }
  }

  if (trace.ok !== true || trace.blocked !== false || trace.mockOnly !== true || trace.errors.length > 0) {
    return { ok: false, message: 'Private edit manifest model-role trace did not pass validation.' }
  }

  const roles = trace.roles ?? []
  const qwenMainRole = roles.find((role) => role.modelRoleId === 'qwen_3_7_main_edit_agent')
  if (
    !qwenMainRole ||
    !qwenMainRole.requestedUses.includes('edit_planning') ||
    qwenMainRole.providerBoundary !== 'qwen_3_7_provider_boundary' ||
    qwenMainRole.canonicalProviderModel !== 'qwen-3.7-max' ||
    qwenMainRole.userReasoningAllowed !== true ||
    qwenMainRole.editPlanningAllowed !== true ||
    qwenMainRole.visualUnderstandingAllowed !== false ||
    qwenMainRole.toolCodeAllowed !== false
  ) {
    return { ok: false, message: 'Private edit manifest model-role trace does not preserve Qwen 3.7 as the main edit planning role.' }
  }

  const visualRole = roles.find((role) => role.modelRoleId === 'qwen2_5_vl_visual_understanding')
  if (
    !visualRole ||
    !visualRole.requestedUses.includes('visual_understanding') ||
    visualRole.providerBoundary !== 'qwen2_5_vl_7b_instruct_provider_boundary' ||
    visualRole.canonicalProviderModel !== 'qwen2.5-vl-7b-instruct' ||
    visualRole.userReasoningAllowed !== false ||
    visualRole.editPlanningAllowed !== false ||
    visualRole.visualUnderstandingAllowed !== true ||
    visualRole.toolCodeAllowed !== false
  ) {
    return { ok: false, message: 'Private edit manifest model-role trace does not preserve Qwen2.5-VL as visual-understanding only.' }
  }

  const invalidDeepSeekRole = roles.find((role) =>
    role.modelRoleId === 'deepseek_v4_tool_code_agent' &&
    (
      role.userReasoningAllowed !== false ||
      role.editPlanningAllowed !== false ||
      role.canonicalProviderModel !== 'deepseek-v4-pro' ||
      role.toolCodeAllowed !== true ||
      role.remotionDraftAllowed !== true ||
      role.requestedUses.some((use) => use === 'user_reasoning' || use === 'edit_planning' || use === 'visual_understanding')
    )
  )
  if (invalidDeepSeekRole) {
    return { ok: false, message: 'Private edit manifest model-role trace uses DeepSeek outside tool-code or Remotion draft scope.' }
  }

  return { ok: true }
}

function validateApprovedEditModelRoleBackendIntents(
  intents: NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['backendIntents'],
): { ok: true } | { ok: false; message: string } {
  const modelRoleIntents = (intents ?? []).filter((intent) => intent.intentKind === 'model_role')

  if (modelRoleIntents.length === 0) {
    return { ok: false, message: 'Private edit manifest approved edit context is missing model-role backend intent evidence.' }
  }

  for (const intent of modelRoleIntents) {
    if (!isReEditProModelRoleId(intent.modelRoleId)) {
      return { ok: false, message: `Private edit manifest model-role backend intent ${intent.intentId} has an invalid modelRoleId.` }
    }

    if (!isReEditProRequestedModelUse(intent.requestedModelUse)) {
      return { ok: false, message: `Private edit manifest model-role backend intent ${intent.intentId} has an invalid requestedModelUse.` }
    }

    if (!intent.providerRoute?.trim() || !intent.providerModel?.trim()) {
      return { ok: false, message: `Private edit manifest model-role backend intent ${intent.intentId} is missing provider route or provider model evidence.` }
    }

    const validation = validateReEditProModelRoleUse({
      modelRoleId: intent.modelRoleId,
      providerRoute: intent.providerRoute,
      providerModel: intent.providerModel,
      requestedUse: intent.requestedModelUse,
    })

    if (!validation.ok) {
      return {
        ok: false,
        message: `Private edit manifest model-role backend intent ${intent.intentId} failed provider-model validation: ${validation.errors.join(' ')}`,
      }
    }
  }

  return { ok: true }
}

function isReEditProModelRoleId(value: string | undefined): value is ReEditProModelRoleId {
  return REEDITPRO_MODEL_ROLE_IDS.includes(value as ReEditProModelRoleId)
}

function isReEditProRequestedModelUse(value: string | undefined): value is ReEditProRequestedModelUse {
  return REEDITPRO_REQUESTED_MODEL_USES.includes(value as ReEditProRequestedModelUse)
}

function parseProfessionalSkillSelectionEvidence(
  value: unknown,
): NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['selectionEvidence']> {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['selectionEvidence']> => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (
      typeof record.skillId !== 'string' ||
      typeof record.userFacingActivity !== 'string' ||
      !Array.isArray(record.sources)
    ) {
      return []
    }

    return [{
      skillId: record.skillId,
      userFacingActivity: record.userFacingActivity,
      sources: record.sources.filter((source): source is string => typeof source === 'string'),
      summaries: Array.isArray(record.summaries)
        ? record.summaries.filter((summary): summary is string => typeof summary === 'string')
        : [],
    }]
  })
}

function parseProfessionalSkillActivityGroups(
  value: unknown,
): NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['activityGroups'] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['activityGroups'] => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (
      typeof record.id !== 'string' ||
      typeof record.label !== 'string' ||
      typeof record.status !== 'string' ||
      typeof record.userFacingSummary !== 'string'
    ) {
      return []
    }

    return [{
      id: record.id,
      label: record.label,
      selectedActivityCount: safeCount(record.selectedActivityCount),
      readyActivityCount: safeCount(record.readyActivityCount),
      reviewActivityCount: safeCount(record.reviewActivityCount),
      blockedActivityCount: safeCount(record.blockedActivityCount),
      status: record.status,
      userFacingSummary: record.userFacingSummary,
    }]
  }).slice(0, 12)
}

function parseProfessionalSkillBackendIntents(
  value: unknown,
): NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['backendIntents']> {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): NonNullable<NonNullable<PrivateEditDecisionManifestVerification['approvedEditContext']['professionalSkillTrace']>['backendIntents']> => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (
      typeof record.intentId !== 'string' ||
      typeof record.intentKind !== 'string' ||
      typeof record.executionBoundary !== 'string'
    ) {
      return []
    }

    const optionalString = (field: unknown) => typeof field === 'string' && field.trim()
      ? field.trim()
      : undefined

    return [{
      intentId: record.intentId.trim(),
      intentKind: record.intentKind.trim(),
      executionBoundary: record.executionBoundary.trim(),
      providerRoute: optionalString(record.providerRoute),
      providerModel: optionalString(record.providerModel),
      modelRoleId: optionalString(record.modelRoleId),
      requestedModelUse: optionalString(record.requestedModelUse),
      generationType: optionalString(record.generationType),
      outputAssetType: optionalString(record.outputAssetType),
      hiddenAdapterToolCount: safeCount(record.hiddenAdapterToolCount),
      requiredApprovalGates: parseStringArray(record.requiredApprovalGates),
    }]
  }).slice(0, 64)
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim())
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
}

function failed(message: string): PrivateEditDecisionManifestVerificationResult {
  return { ok: false, message }
}
