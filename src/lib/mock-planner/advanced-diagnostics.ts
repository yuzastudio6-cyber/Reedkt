import { createApprovalCorePlan } from './approval-core'
import type { EditPlan, PlannerInput } from '../../types/reeditpro'

export async function createAdvancedDiagnosticsPlan(input: PlannerInput): Promise<EditPlan> {
  const basePlan = createApprovalCorePlan(input)
  const compiledIntent = basePlan.compiledIntent
  const professionalEditingDirective = basePlan.professionalEditingDirective ?? compiledIntent?.professionalEditingDirective

  if (!compiledIntent || !professionalEditingDirective || !basePlan.videoUnderstandingReport || !basePlan.adaptiveEditStrategyPlan) {
    return basePlan
  }

  const effectiveInput: PlannerInput = {
    ...input,
    ...compiledIntent.resolvedSettings,
    aspectRatioFramePlan: basePlan.aspectRatioFramePlan,
    captionVisualCueTimingPlan: basePlan.captionVisualCueTimingPlan,
    compiledIntent,
    masterTimingPlan: basePlan.masterTimingPlan,
    professionalEditingDirective,
    sourceCleanupPlan: basePlan.sourceCleanupPlan,
    sourceOrderConfirmed: input.sourceOrderConfirmed ?? true,
    soundSyncTransitionTimingPlan: basePlan.soundSyncTransitionTimingPlan,
    timingValidationPlan: basePlan.timingValidationPlan,
    trimReviewPlan: basePlan.trimReviewPlan,
    videoUnderstandingReport: basePlan.videoUnderstandingReport,
  }

  const [
    assetPlanner,
    segmentPlanner,
    layoutPlanner,
    depthPlanner,
    renderStrategyPlanner,
    toolRegistry,
    toolStrategyPlanner,
    colorPlanner,
    audioPlanner,
    mapPlanner,
    dataVizPlanner,
    characterPlanner,
    factSafetyPlanner,
    frameLayouts,
    rendererPlanner,
    promptBuilder,
    editQaPlanner,
    executionPlanner,
    reconciliationPlanner,
    agentQaPlanner,
    professionalSkills,
    schemaPlanner,
    migrationDrafts,
    migrationReview,
    productionReadiness,
    planningAudit,
  ] = await Promise.all([
    import('../story-asset-planner'),
    import('../edit-operation-planner'),
    import('../speaker-visual-layout-planner'),
    import('../depth-aware-overlay-planner'),
    import('../render-strategy-planner'),
    import('../tool-registry'),
    import('../tool-strategy-planner'),
    import('../color-pipeline-planner'),
    import('../audio-pipeline-planner'),
    import('../map-animation-planner'),
    import('../dataviz-planner'),
    import('../character-consistency'),
    import('../documentary-fact-safety'),
    import('../frame-layouts'),
    import('../remotion-renderer-planner'),
    import('../prompt-builders'),
    import('../edit-qa-planner'),
    import('../editing-agent-execution-planner'),
    import('../async-asset-reconciliation-planner'),
    import('../agent-qa-fallback-planner'),
    import('../professional-skills'),
    import('../supabase-schema-plan'),
    import('../supabase-migration-drafts'),
    import('../migration-review-plan'),
    import('../supabase-production-readiness'),
    import('../planning-system-audit'),
  ])

  const videoUnderstandingReport = basePlan.videoUnderstandingReport
  const adaptiveEditStrategyPlan = basePlan.adaptiveEditStrategyPlan
  const visualAssetPlan = assetPlanner.createVisualAssetPlan(effectiveInput, {
    adaptiveEditStrategyPlan,
    videoUnderstandingReport,
  })
  const segmentEditPlans = segmentPlanner.createSegmentEditPlans({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: effectiveInput,
    visualAssetPlan,
  })
  const speakerVisualLayoutPlan = layoutPlanner.createSpeakerVisualLayoutPlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: effectiveInput,
    segmentEditPlans,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const depthAwareOverlayPlan = depthPlanner.createDepthAwareOverlayPlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: effectiveInput,
    segmentEditPlans,
    speakerVisualLayoutPlan,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const toolRegistrySummary = toolRegistry.getToolRegistrySummary()
  const renderStrategyPlan = renderStrategyPlanner.createRenderStrategyPlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    depthAwareOverlayPlan,
    input: effectiveInput,
    segmentEditPlans,
    speakerVisualLayoutPlan,
    toolRegistrySummary,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const toolStrategyPlan = toolStrategyPlanner.createToolStrategyPlan({
    adaptiveEditStrategyPlan,
    depthAwareOverlayPlan,
    input: effectiveInput,
    renderStrategyPlan,
    segmentEditPlans,
    speakerVisualLayoutPlan,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const colorPipelinePlan = colorPlanner.createColorPipelinePlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: effectiveInput,
    professionalDirective: professionalEditingDirective,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const audioPipelinePlan = audioPlanner.createAudioPipelinePlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: effectiveInput,
    professionalDirective: professionalEditingDirective,
    segmentEditPlans,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const mapAnimationPlan = mapPlanner.createMapAnimationPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    compiledIntent,
    depthAwareOverlayPlan,
    input: effectiveInput,
    segmentEditPlans,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const dataVizPlan = dataVizPlanner.createDataVizPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    compiledIntent,
    input: effectiveInput,
    renderStrategyPlan,
    segmentEditPlans,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const characterConsistencyPlan = characterPlanner.createCharacterConsistencyPlan({
    compiledIntent,
    input: effectiveInput,
    segmentEditPlans,
    visualAssetPlan,
  })
  const documentaryFactSafetyPlan = factSafetyPlanner.createDocumentaryFactSafetyPlan({
    characterConsistencyPlan,
    compiledIntent,
    input: effectiveInput,
    visualAssetPlan,
  })
  const rendererCompositionPlan = rendererPlanner.createRendererCompositionPlan({
    aspectRatio: effectiveInput.aspectRatio,
    aspectRatioFramePlan: basePlan.aspectRatioFramePlan,
    audioPipelinePlan,
    captionVisualCueTimingPlan: basePlan.captionVisualCueTimingPlan,
    colorPipelinePlan,
    dataVizPlan,
    depthAwareOverlayPlan,
    editLevel: effectiveInput.editLevel,
    frameTemplate: frameLayouts.getDefaultFrameTemplateForAspectRatio(effectiveInput.aspectRatio),
    mapAnimationPlan,
    masterTimingPlan: basePlan.masterTimingPlan,
    renderStrategyPlan,
    soundSyncTransitionTimingPlan: basePlan.soundSyncTransitionTimingPlan,
    speakerVisualLayoutPlan,
    targetPlatform: effectiveInput.targetPlatform,
    toolStrategyPlan,
    visualAssetPlan,
  })
  const providerPromptPlans = promptBuilder.buildProviderPromptPlansForEditPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    captionVisualCueTimingPlan: basePlan.captionVisualCueTimingPlan,
    characterConsistencyPlan,
    colorPipelinePlan,
    compiledIntent,
    dataVizPlan,
    depthAwareOverlayPlan,
    documentaryFactSafetyPlan,
    input: effectiveInput,
    mapAnimationPlan,
    masterTimingPlan: basePlan.masterTimingPlan,
    professionalDirective: professionalEditingDirective,
    rendererCompositionPlan,
    renderStrategyPlan,
    segmentEditPlans,
    soundSyncTransitionTimingPlan: basePlan.soundSyncTransitionTimingPlan,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    trimReviewPlan: basePlan.trimReviewPlan,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const editQAPlan = editQaPlanner.createEditQAPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    captionVisualCueTimingPlan: basePlan.captionVisualCueTimingPlan,
    characterConsistencyPlan,
    colorPipelinePlan,
    compiledIntent,
    dataVizPlan,
    depthAwareOverlayPlan,
    documentaryFactSafetyPlan,
    input: effectiveInput,
    mapAnimationPlan,
    masterTimingPlan: basePlan.masterTimingPlan,
    rendererCompositionPlan,
    renderStrategyPlan,
    segmentEditPlans,
    soundSyncTransitionTimingPlan: basePlan.soundSyncTransitionTimingPlan,
    sourceCleanupPlan: basePlan.sourceCleanupPlan,
    speakerVisualLayoutPlan,
    timingValidationPlan: basePlan.timingValidationPlan,
    toolStrategyPlan,
    trimReviewPlan: basePlan.trimReviewPlan,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const supabaseSchemaPlan = schemaPlanner.createSupabaseSchemaPlan()
  const migrationDraftPlan = migrationDrafts.createMigrationDraftPlan()
  const migrationReviewPlan = migrationReview.createMigrationReviewPlan({
    migrationDraftPlan,
    supabaseSchemaPlan,
  })
  const supabaseProductionReadinessPlan = productionReadiness.createSupabaseProductionReadinessPlan()
  const professionalSkillPlan = professionalSkills.createProfessionalSkillPlan({
    plannerInput: effectiveInput,
  })
  const advancedPlan: EditPlan = {
    ...basePlan,
    asyncAssetReconciliationPlan: undefined,
    audioPipelinePlan,
    characterConsistencyPlan,
    colorPipelinePlan,
    dataVizPlan,
    depthAwareOverlayPlan,
    documentaryFactSafetyPlan,
    editQAPlan,
    mapAnimationPlan,
    migrationDraftPlan,
    migrationReviewPlan,
    providerPromptPlans,
    rendererCompositionPlan,
    renderStrategyPlan,
    segmentEditPlans,
    speakerVisualLayoutPlan,
    professionalSkillPlan,
    supabaseProductionReadinessPlan,
    supabaseSchemaPlan,
    toolRegistrySummary,
    toolStrategyPlan,
    visualAssetPlan,
  }
  const editingAgentExecutionPlan = executionPlanner.createEditingAgentExecutionPlan({
    plan: advancedPlan,
    approvedPlanSnapshotId: undefined,
  })
  const asyncAssetReconciliationPlan = reconciliationPlanner.createAsyncAssetReconciliationPlan({
    plan: advancedPlan,
    editingAgentExecutionPlan,
    approvedPlanSnapshotId: undefined,
  })
  const editingAgentExecutionPlanWithReconciliation = reconciliationPlanner.linkAsyncReconciliationToExecutionPlan({
    asyncAssetReconciliationPlan,
    editingAgentExecutionPlan,
  })
  const agentQAFallbackPlan = agentQaPlanner.createAgentQAFallbackPlan({
    asyncAssetReconciliationPlan,
    editingAgentExecutionPlan: editingAgentExecutionPlanWithReconciliation,
    plan: advancedPlan,
  })
  const editingAgentExecutionPlanWithAgentQA = agentQaPlanner.linkAgentQAFallbackToExecutionPlan({
    agentQAFallbackPlan,
    editingAgentExecutionPlan: editingAgentExecutionPlanWithReconciliation,
  })
  const planWithExecution: EditPlan = {
    ...advancedPlan,
    agentQAFallbackPlan,
    asyncAssetReconciliationPlan,
    editingAgentExecutionPlan: editingAgentExecutionPlanWithAgentQA,
  }

  return {
    ...planWithExecution,
    planningSystemAuditReport: planningAudit.createPlanningSystemAuditReport(planWithExecution),
  }
}

export const createMockEditPlan = createAdvancedDiagnosticsPlan
