import type {
  ApprovedPlanSnapshot,
  CreditEstimateRecord,
  EditOperationRecord,
  EditPlanSegmentRecord,
  EditPlanVersionRecord,
  FrameLayoutPlanRecord,
  JsonValue,
  QAReportRecord,
  RendererCompositionPlanRecord,
  RendererLayerRecord,
  SourceSequenceItemRecord,
  VisualAssetPlanItemRecord,
} from '../types/edit-planning-db'
import type { EditLevel, EditPlan, ProfessionalEditingDirective } from '../types/reeditpro'

type CreateApprovedPlanSnapshotParams = {
  projectId: string
  editSessionId: string
  approvedBy: string
  plan: EditPlan
}

function asJson(value: unknown): JsonValue {
  return value as JsonValue
}

function nowIso() {
  return new Date().toISOString()
}

function getEditLevel(plan: EditPlan): EditLevel {
  return plan.compiledIntent?.resolvedSettings.editLevel ?? plan.creditEstimate.editLevel ?? 'pro'
}

function getProfessionalDirective(plan: EditPlan): ProfessionalEditingDirective {
  return plan.professionalEditingDirective ??
    plan.compiledIntent?.professionalEditingDirective ?? {
      editStyle: 'custom',
      pacingStyle: 'clean_tight',
      cutIntensity: 'balanced',
      transitionFamilies: ['clean_cut_transitions'],
      colorGradeStyle: 'clean_natural',
      captionStyle: 'clean_subtitle',
      brollPolicy: 'support_key_points',
      soundStyle: 'clean_voice_only',
      mustFollowRules: [],
      avoidRules: ['No random edits.'],
      customDirectives: [],
      qaChecks: ['Approval required before generation.'],
    }
}

function createSourceSequence(projectId: string, editSessionId: string, plan: EditPlan, createdAt: string): SourceSequenceItemRecord[] {
  return plan.sourceSequenceMap.map((item) => ({
    id: `source-sequence-${item.clipId}`,
    project_id: projectId,
    edit_session_id: editSessionId,
    uploaded_clip_id: item.clipId,
    source_order: item.uploadedOrder,
    confirmed_order: item.uploadedOrder,
    user_confirmed: true,
    notes: item.detectedRole,
    created_at: createdAt,
    updated_at: createdAt,
  }))
}

function createEditPlanVersion(projectId: string, editSessionId: string, plan: EditPlan, approvedBy: string, approvedAt: string): EditPlanVersionRecord {
  const professionalDirective = getProfessionalDirective(plan)

  return {
    id: 'mock-plan-version-1',
    project_id: projectId,
    edit_session_id: editSessionId,
    intent_snapshot_id: plan.compiledIntent?.id ?? 'mock-intent-snapshot-1',
    version: 1,
    status: 'approved',
    goal_summary: plan.goalSummary,
    recommended_structure_json: plan.recommendedStructure,
    source_sequence_summary_json: asJson(plan.sourceSequenceMap),
    hook_decision_json: asJson(plan.hookDecision),
    professional_editing_directive_json: professionalDirective,
    visual_asset_plan_summary_json: asJson(plan.visualAssetPlan ?? []),
    renderer_plan_summary_json: asJson(plan.rendererCompositionPlan ?? null),
    qa_plan_summary_json: asJson(plan.editQAPlan ?? null),
    credit_estimate_id: 'mock-credit-estimate-1',
    approval_required: plan.approvalRequired,
    approved_at: approvedAt,
    approved_by: approvedBy,
    created_at: approvedAt,
    updated_at: approvedAt,
  }
}

function createSegmentRecords(plan: EditPlan): EditPlanSegmentRecord[] {
  return (plan.segmentEditPlans ?? []).map((segment) => ({
    id: segment.id,
    edit_plan_version_id: 'mock-plan-version-1',
    segment_order: segment.segmentOrder,
    role: segment.role,
    label: segment.label,
    story_purpose: segment.storyPurpose,
    source_clip_ids_json: segment.sourceClipIds,
    source_time_range_json: segment.sourceTimeRange ? asJson(segment.sourceTimeRange) : undefined,
    final_time_range_json: asJson(segment.finalTimeRange),
    spoken_text_summary: segment.spokenTextSummary,
    pacing_style: segment.pacingStyle,
    cut_intensity: segment.cutIntensity,
    must_follow_rules_json: segment.mustFollowRules,
    avoid_rules_json: segment.avoidRules,
    worker_notes_json: segment.workerNotes,
    created_at: nowIso(),
  }))
}

function createOperationRecords(plan: EditPlan): EditOperationRecord[] {
  return (plan.segmentEditPlans ?? []).flatMap((segment) =>
    segment.operations.map((operation) => ({
      id: operation.id,
      edit_plan_segment_id: segment.id,
      operation_type: operation.operationType,
      operation_order: operation.operationOrder,
      label: operation.label,
      instruction: operation.instruction,
      parameters_json: asJson(operation.parameters),
      reason: operation.reason,
      status: operation.status,
      qa_checks_json: operation.qaChecks,
      created_at: nowIso(),
    })),
  )
}

function findSegmentIdForAsset(plan: EditPlan, visualAssetPlanItemId: string) {
  return plan.segmentEditPlans?.find((segment) => segment.visualAssetPlanItemIds.includes(visualAssetPlanItemId))?.id
}

function createVisualAssetRecords(plan: EditPlan, createdAt: string): VisualAssetPlanItemRecord[] {
  return (plan.visualAssetPlan ?? []).map((asset) => ({
    id: asset.id,
    edit_plan_version_id: 'mock-plan-version-1',
    edit_plan_segment_id: findSegmentIdForAsset(plan, asset.id),
    asset_type: asset.assetType,
    signature_system: asset.signatureSystem,
    style_mode_id: asset.styleModeId,
    frame_template_type: asset.frameTemplateType,
    needs_character_consistency: asset.needsCharacterConsistency,
    needs_start_frame: asset.needsStartFrame,
    needs_end_frame: asset.needsEndFrame,
    recommended_duration_seconds: asset.recommendedDurationSeconds,
    provider_route_json: asset.providerRoute,
    prompt_plan_json: asJson({ reason: asset.reason }),
    qa_checks_json: asset.qaChecks,
    credit_impact: asset.creditImpact,
    status: 'approved',
    created_at: createdAt,
  }))
}

function createFrameLayoutRecord(plan: EditPlan): FrameLayoutPlanRecord | undefined {
  const frameTemplate = plan.rendererCompositionPlan?.frameTemplate

  if (!frameTemplate) {
    return undefined
  }

  return {
    id: 'mock-frame-layout-plan-1',
    edit_plan_version_id: 'mock-plan-version-1',
    frame_template_type: frameTemplate.templateType,
    aspect_ratio: frameTemplate.aspectRatio,
    canvas_width: frameTemplate.canvasWidth,
    canvas_height: frameTemplate.canvasHeight,
    speaker_zone_json: frameTemplate.speakerZone ? asJson(frameTemplate.speakerZone) : undefined,
    animation_zone_json: asJson(frameTemplate.animationZone),
    caption_safe_zone_json: frameTemplate.captionSafeZone ? asJson(frameTemplate.captionSafeZone) : undefined,
    safe_margin: frameTemplate.safeMargin,
    panel_background_color: frameTemplate.panelBackgroundColor,
    notes_json: frameTemplate.notes,
  }
}

function createRendererCompositionRecord(plan: EditPlan, createdAt: string): RendererCompositionPlanRecord | undefined {
  const rendererPlan = plan.rendererCompositionPlan

  if (!rendererPlan) {
    return undefined
  }

  return {
    id: rendererPlan.id,
    edit_plan_version_id: 'mock-plan-version-1',
    renderer_engine: rendererPlan.engine,
    aspect_ratio: rendererPlan.frameTemplate.aspectRatio,
    canvas_width: rendererPlan.frameTemplate.canvasWidth,
    canvas_height: rendererPlan.frameTemplate.canvasHeight,
    fps: rendererPlan.fps,
    duration_seconds: rendererPlan.durationSeconds,
    frame_template_json: rendererPlan.frameTemplate,
    caption_safe_zone_json: rendererPlan.captionSafeZone ? asJson(rendererPlan.captionSafeZone) : undefined,
    speaker_zone_json: rendererPlan.frameTemplate.speakerZone ? asJson(rendererPlan.frameTemplate.speakerZone) : undefined,
    animation_zone_json: asJson(rendererPlan.frameTemplate.animationZone),
    panel_background_color: rendererPlan.panelBackgroundColor,
    approval_required: rendererPlan.approvalRequired,
    render_ready: rendererPlan.renderReady,
    status: 'approved_mock_only',
    created_at: createdAt,
  }
}

function createRendererLayerRecords(plan: EditPlan): RendererLayerRecord[] {
  return (plan.rendererCompositionPlan?.layers ?? []).map((layer, index) => ({
    id: layer.id,
    renderer_composition_plan_id: plan.rendererCompositionPlan?.id ?? 'mock-renderer-composition-plan-1',
    visual_asset_plan_item_id: layer.assetPlanItemId,
    layer_order: index + 1,
    layer_type: layer.layerType,
    label: layer.label,
    start_time: layer.startTimeSeconds,
    end_time: layer.endTimeSeconds,
    zone_json: asJson(layer.zone),
    fit_mode: layer.fitMode,
    background_color: layer.backgroundColor,
    opacity: layer.opacity,
    motion_preset: layer.motionPreset,
    z_index: layer.zIndex,
    notes_json: layer.notes,
  }))
}

function createCreditEstimateRecord(projectId: string, plan: EditPlan, createdAt: string): CreditEstimateRecord {
  return {
    id: 'mock-credit-estimate-1',
    project_id: projectId,
    edit_plan_version_id: 'mock-plan-version-1',
    estimate_version: plan.creditEstimate.estimateVersion ?? 'mock-v1',
    edit_level: plan.creditEstimate.editLevel ?? getEditLevel(plan),
    editing_category: plan.creditEstimate.editingCategory ?? plan.compiledIntent?.resolvedSettings.editingCategory ?? 'storytelling',
    total_credits: plan.creditEstimate.total,
    fallback_allowance_credits: plan.creditEstimate.fallbackAllowanceCredits ?? 0,
    risk_level: plan.creditEstimate.riskLevel,
    approval_copy: plan.creditEstimate.approvalCopy,
    status: 'approved',
    created_at: createdAt,
  }
}

function createQAReportRecord(projectId: string, plan: EditPlan, createdAt: string): QAReportRecord | undefined {
  if (!plan.editQAPlan) {
    return undefined
  }

  return {
    id: plan.editQAPlan.id,
    project_id: projectId,
    edit_plan_version_id: 'mock-plan-version-1',
    status: plan.editQAPlan.status,
    summary: plan.editQAPlan.summary,
    created_at: createdAt,
  }
}

function modelConstraintsForLevel(editLevel: EditLevel) {
  const tierConstraint = editLevel === 'premium'
    ? 'Premium may use Veo 3.1 Lite only as final fallback/rescue.'
    : `${editLevel === 'basic' ? 'Basic' : 'Pro'} cannot use Veo.`

  return [
    tierConstraint,
    'Veo must never be primary or default.',
    'Generated video routes must not default to 1080P.',
    'Wan remains primary animation generation.',
    'Hailuo remains normal fallback/alternate animation generation.',
  ]
}

export function createApprovedPlanSnapshot(params: CreateApprovedPlanSnapshotParams): ApprovedPlanSnapshot {
  const { approvedBy, editSessionId, plan, projectId } = params
  const approvedAt = nowIso()
  const editLevel = getEditLevel(plan)
  const sourceSequence = createSourceSequence(projectId, editSessionId, plan, approvedAt)
  const editPlanVersion = createEditPlanVersion(projectId, editSessionId, plan, approvedBy, approvedAt)
  const segments = createSegmentRecords(plan)
  const operations = createOperationRecords(plan)
  const visualAssetPlan = createVisualAssetRecords(plan, approvedAt)
  const frameLayoutPlan = createFrameLayoutRecord(plan)
  const rendererCompositionPlan = createRendererCompositionRecord(plan, approvedAt)
  const rendererLayers = createRendererLayerRecords(plan)
  const creditEstimate = createCreditEstimateRecord(projectId, plan, approvedAt)
  const qaPlan = createQAReportRecord(projectId, plan, approvedAt)
  const professionalEditingDirective = getProfessionalDirective(plan)

  return {
    id: `approved-snapshot-${projectId}-${Date.now()}`,
    projectId,
    editSessionId,
    editPlanVersionId: editPlanVersion.id,
    creditEstimateId: creditEstimate.id,
    approvedAt,
    approvedBy,
    compiledIntent: plan.compiledIntent,
    professionalEditingDirective,
    settingsSnapshot: {
      id: 'mock-settings-snapshot-1',
      project_id: projectId,
      edit_session_id: editSessionId,
      intent_snapshot_id: plan.compiledIntent?.id ?? 'mock-intent-snapshot-1',
      editing_category: plan.compiledIntent?.resolvedSettings.editingCategory,
      edit_level: editLevel,
      target_platform: plan.compiledIntent?.resolvedSettings.targetPlatform,
      aspect_ratio: plan.compiledIntent?.resolvedSettings.aspectRatio,
      frame_template_type: plan.compiledIntent?.resolvedSettings.frameTemplateType,
      visual_preference: plan.compiledIntent?.resolvedSettings.visualPreference,
      mood_style: plan.compiledIntent?.resolvedSettings.moodStyle,
      credit_preference: plan.compiledIntent?.resolvedSettings.creditPreference,
      source_order_confirmed: true,
      status: 'approved',
      created_at: approvedAt,
    },
    sourceSequence,
    editPlanVersion,
    segments,
    operations,
    visualAssetPlan,
    visualAssetPlanDomain: plan.visualAssetPlan,
    videoUnderstandingReport: plan.videoUnderstandingReport,
    adaptiveEditStrategy: plan.adaptiveEditStrategy,
    adaptiveEditStrategyPlan: plan.adaptiveEditStrategyPlan,
    toolRegistrySummary: plan.toolRegistrySummary,
    toolStrategyPlan: plan.toolStrategyPlan,
    colorPipelinePlan: plan.colorPipelinePlan,
    audioPipelinePlan: plan.audioPipelinePlan,
    mapAnimationPlan: plan.mapAnimationPlan,
    dataVizPlan: plan.dataVizPlan,
    renderStrategyPlan: plan.renderStrategyPlan,
    speakerVisualLayoutPlan: plan.speakerVisualLayoutPlan,
    depthAwareOverlayPlan: plan.depthAwareOverlayPlan,
    foregroundMaskingPlan: plan.foregroundMaskingPlan,
    depthAwareLayoutValidationPlan: plan.depthAwareLayoutValidationPlan,
    workerRuntimePlan: plan.workerRuntimePlan,
    productionReadinessReport: plan.productionReadinessReport,
    frameLayoutPlan,
    frameLayoutPlanDomain: plan.rendererCompositionPlan?.frameTemplate,
    rendererCompositionPlan,
    rendererCompositionPlanDomain: plan.rendererCompositionPlan,
    rendererLayers,
    rendererLayersDomain: plan.rendererCompositionPlan?.layers,
    providerPromptPlans: plan.providerPromptPlans,
    characterConsistencyPlan: plan.characterConsistencyPlan,
    documentaryFactSafetyPlan: plan.documentaryFactSafetyPlan,
    creditEstimate,
    creditEstimateDomain: plan.creditEstimate,
    qaPlan,
    qaPlanDomain: plan.editQAPlan,
    tierConstraints: modelConstraintsForLevel(editLevel),
    modelRoutingConstraints: modelConstraintsForLevel(editLevel),
    frameBackgroundPolicy: [
      'AI-video assets use matching panel backgrounds by default.',
      'Transparent AI-video backgrounds are not the default.',
      'The final canvas belongs to ReeditPro and the planned Remotion compositor.',
    ],
    mustFollowRules: plan.compiledIntent?.mustFollowRules ?? professionalEditingDirective.mustFollowRules,
    avoidRules: plan.compiledIntent?.avoidRules ?? professionalEditingDirective.avoidRules,
    fallbackPolicy: [
      'Workers may retry or fallback only within approved route and allowance.',
      'If fallback exceeds approval, request revision or new approval.',
      editLevel === 'premium' ? 'Veo Lite remains final fallback only.' : 'Basic/Pro fallback cannot use Veo.',
    ],
    snapshotVersion: 'mock-v1',
    sourcePlan: plan,
    segmentPlansDomain: plan.segmentEditPlans,
  }
}
