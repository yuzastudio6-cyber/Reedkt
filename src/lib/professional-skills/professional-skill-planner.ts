import type {
  ProfessionalSkillBackendIntent,
  ProfessionalSkillDefinition,
  ProfessionalSkillSelectionEvidence,
  ProfessionalSkillFamily,
  ProfessionalSkillModelRoleTrace,
  ProfessionalSkillPlannerInput,
  ProfessionalSkillPlan,
  ProfessionalSkillReadinessStatus,
  ProfessionalSkillSelection,
  ProfessionalSkillSelectionSource,
} from '../../types/professional-skills'
import type {
  ReEditProModelRoleId,
  ReEditProRequestedModelUse,
} from '../../types/model-role-routing'
import type {
  ReEditProIntelligenceTaskType,
} from '../../types/intelligence-orchestration'
import type { PlannerInput } from '../../types/reeditpro'
import {
  isVisualIntelligenceOwnedProviderRoute,
  PROVIDER_ROUTES,
  validateProviderGatewayRequest,
  type ProviderGenerationType,
  type ProviderRoute,
} from '../../backend/cloud/provider-gateway-contracts'
import {
  getReEditProModelRoleContract,
  REEDITPRO_MODEL_ROLE_CONTRACT_VERSION,
  validateReEditProModelRoleContracts,
  validateReEditProModelRoleUse,
} from '../model-role-routing-contract'
import {
  createReEditProIntelligenceResponsibilityPlan,
} from '../intelligence-orchestration-contract'
import {
  LIVING_FRAME_PROFESSIONAL_SKILL_ID,
  resolveLivingFrameSelectionPolicy,
} from '../living-frame/living-frame-selection-policy'
import { listProfessionalSkillDefinitions } from './professional-skill-registry'

function normalizeText(value: string | undefined) {
  return (value ?? '').toLowerCase().replace(/[_-]+/g, ' ')
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => hasKeywordPhrase(text, keyword))
}

function hasKeywordPhrase(text: string, keyword: string) {
  const normalizedKeyword = normalizeText(keyword).trim()
  if (!normalizedKeyword) return false

  const keywordParts = normalizedKeyword.split(/\s+/)
  const phrase = keywordParts
    .map((part, index) => {
      const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const optionalPlural = index === keywordParts.length - 1 && /^[a-z]{4,}$/.test(part) && !part.endsWith('s')
      return `${escaped}${optionalPlural ? 's?' : ''}`
    })
    .join('\\s+')
  return new RegExp(`(?:^|[^a-z0-9])${phrase}(?=$|[^a-z0-9])`, 'i').test(text)
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function uniqueBackendIntents(values: ProfessionalSkillBackendIntent[]): ProfessionalSkillBackendIntent[] {
  const seen = new Set<string>()
  const result: ProfessionalSkillBackendIntent[] = []

  for (const value of values) {
    if (seen.has(value.intentId)) continue
    seen.add(value.intentId)
    result.push(value)
  }

  return result
}

function providerRouteIsKnown(value: string | undefined): value is ProviderRoute {
  return PROVIDER_ROUTES.includes(value as ProviderRoute)
}

function adapterToolBundleIntent(definition: ProfessionalSkillDefinition): ProfessionalSkillBackendIntent | undefined {
  if (definition.hiddenAdapterToolNames.length === 0) return undefined

  return {
    intentId: `${definition.id}.adapter_tool_bundle`,
    intentKind: 'adapter_tool_bundle',
    userFacingActivity: definition.userFacingActivity,
    executionBoundary: 'backend_approved_after_snapshot',
    hiddenAdapterToolNames: [...definition.hiddenAdapterToolNames],
    requiredApprovalGates: [
      'approved_plan_snapshot_required',
      'approved_credit_estimate_required',
      'active_credit_reservation_required',
      'backend_worker_only',
      'idempotency_required',
    ],
  }
}

export function validateProfessionalSkillBackendIntent(intent: ProfessionalSkillBackendIntent): {
  ok: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!intent.intentId.trim()) errors.push('Backend intent must include intentId.')
  if (!intent.userFacingActivity.trim()) errors.push(`${intent.intentId} must include userFacingActivity.`)
  if (intent.requiredApprovalGates.length === 0) errors.push(`${intent.intentId} must include approval gates.`)

  if (intent.intentKind === 'adapter_tool_bundle') {
    if (intent.hiddenAdapterToolNames.length === 0) {
      errors.push(`${intent.intentId} adapter bundle must include at least one hidden adapter tool name.`)
    }
    return { ok: errors.length === 0, errors }
  }

  if (!providerRouteIsKnown(intent.providerRoute)) {
    errors.push(`${intent.intentId} must reference a canonical provider route.`)
    return { ok: false, errors }
  }

  if (intent.intentKind === 'model_role') {
    if (!intent.modelRoleId) errors.push(`${intent.intentId} model-role intent must include modelRoleId.`)
    if (!intent.requestedModelUse) errors.push(`${intent.intentId} model-role intent must include requestedModelUse.`)
    if (intent.modelRoleId || intent.providerRoute || intent.providerModel || intent.requestedModelUse) {
      const modelRoleValidation = validateReEditProModelRoleUse({
        modelRoleId: intent.modelRoleId,
        providerRoute: intent.providerRoute,
        providerModel: intent.providerModel,
        requestedUse: intent.requestedModelUse,
      })
      errors.push(...modelRoleValidation.errors.map((error) => `${intent.intentId}: ${error}`))
    }
  }

  if (intent.intentKind === 'provider_asset') {
    if (!intent.generationType) errors.push(`${intent.intentId} provider-asset intent must include generationType.`)
    if (!intent.outputAssetType) errors.push(`${intent.intentId} provider-asset intent must include outputAssetType.`)
  }

  if (errors.length > 0) return { ok: false, errors }

  if (isVisualIntelligenceOwnedProviderRoute(intent.providerRoute)) {
    const visualIntelligenceContract = getReEditProModelRoleContract(
      'visual_intelligence_gemini_pro_high',
    )
    if (
      intent.intentKind !== 'model_role'
      || intent.modelRoleId !== visualIntelligenceContract.modelRoleId
      || intent.providerRoute !== visualIntelligenceContract.providerBoundary
      || intent.providerModel !== visualIntelligenceContract.canonicalProviderModel
      || intent.requestedModelUse !== 'visual_understanding'
    ) {
      errors.push(
        `${intent.intentId} must bind the exact lifecycle-owned Visual Intelligence role, provider boundary, Gemini model, and visual-understanding use.`,
      )
    }
    return { ok: errors.length === 0, errors }
  }

  const gatewayValidation = validateProviderGatewayRequest({
    generationRequestId: `${intent.intentId}.generation`,
    jobId: `${intent.intentId}.job`,
    workspaceId: 'workspace-professional-skill-intent-validation',
    projectId: 'project-professional-skill-intent-validation',
    approvedPlanSnapshotId: 'approved-snapshot-professional-skill-intent-validation',
    editPlanId: 'edit-plan-professional-skill-intent-validation',
    creditReservationId: 'credit-reservation-professional-skill-intent-validation',
    providerRoute: intent.providerRoute,
    providerModel: intent.providerModel,
    modelRoleId: intent.modelRoleId,
    requestedModelUse: intent.requestedModelUse,
    signatureSystem: 'professional_skill_planner',
    generationType: (intent.generationType ?? 'none') as ProviderGenerationType,
    qualityLevel: 'draft',
    modelTier: 'premium',
    inputAssetIds: [],
    outputRequirements: {
      durationSeconds: intent.intentKind === 'provider_asset' ? 1 : undefined,
      outputAssetType: intent.outputAssetType ?? 'none',
    },
    safetyConstraints: {
      routeRole: intent.modelRoleId &&
        getReEditProModelRoleContract(intent.modelRoleId).reasoningRouteRole === 'primary'
        ? 'primary'
        : 'fallback',
    },
    idempotencyKey: `${intent.intentId}.idempotency`,
    metadata: {
      mockOnly: true,
      professionalSkillBackendIntent: true,
    },
  })

  errors.push(...gatewayValidation.errors.map((error) => `${intent.intentId}: ${error}`))

  return { ok: errors.length === 0, errors }
}

function createModelRoleTrace(backendIntents: ProfessionalSkillBackendIntent[]): ProfessionalSkillModelRoleTrace {
  const contractValidation = validateReEditProModelRoleContracts()
  const modelRoleIntents = backendIntents.filter((intent) => intent.intentKind === 'model_role')
  const errors = [...contractValidation.errors]
  const roleIntentMap = new Map<ReEditProModelRoleId, ProfessionalSkillBackendIntent[]>()

  for (const intent of modelRoleIntents) {
    const validation = validateReEditProModelRoleUse({
      modelRoleId: intent.modelRoleId,
      providerRoute: intent.providerRoute,
      providerModel: intent.providerModel,
      requestedUse: intent.requestedModelUse,
    })
    errors.push(...validation.errors.map((error) => `${intent.intentId}: ${error}`))

    if (!intent.modelRoleId) continue
    roleIntentMap.set(intent.modelRoleId, [...(roleIntentMap.get(intent.modelRoleId) ?? []), intent])
  }

  if (!roleIntentMap.has('kimi_k3_main_edit_agent')) {
    errors.push('Professional skill planning must carry the Kimi K3 primary edit-agent role intent.')
  }

  if (!roleIntentMap.has('gpt_5_6_terra_fallback_edit_agent')) {
    errors.push('Professional skill planning must carry the GPT-5.6 Terra first-fallback role intent.')
  }

  if (!roleIntentMap.has('deepseek_v4_tool_code_agent')) {
    errors.push('Professional skill planning must carry the DeepSeek V4 Pro final-fallback role intent.')
  }

  if (!roleIntentMap.has('visual_intelligence_gemini_pro_high')) {
    errors.push('Professional skill planning must carry the provider-neutral Visual Intelligence role intent.')
  }

  const roles = Array.from(roleIntentMap.entries()).map(([modelRoleId, intents]) => {
    const contract = getReEditProModelRoleContract(modelRoleId)
    const requestedUses = unique(
      intents
        .map((intent) => intent.requestedModelUse)
        .filter((requestedUse): requestedUse is ReEditProRequestedModelUse => Boolean(requestedUse)),
    )

    return {
      modelRoleId,
      providerBoundary: contract.providerBoundary,
      canonicalProviderModel: contract.canonicalProviderModel,
      requestedUses,
      intentIds: unique(intents.map((intent) => intent.intentId)),
      reasoningRouteRole: contract.reasoningRouteRole,
      reasoningRoutePriority: contract.reasoningRoutePriority,
      fallbackOnly: contract.fallbackOnly,
      userReasoningAllowed: contract.userReasoningAllowed,
      editPlanningAllowed: contract.editPlanningAllowed,
      creativeStrategyAllowed: contract.creativeStrategyAllowed,
      editQaReasoningAllowed: contract.editQaReasoningAllowed,
      visualUnderstandingAllowed: contract.visualUnderstandingAllowed,
      toolCodeAllowed: contract.toolCodeAllowed,
      remotionDraftAllowed: contract.remotionDraftAllowed,
    }
  })

  const uniqueErrors = unique(errors)

  return {
    source: 'reeditpro_model_role_contract',
    contractVersion: REEDITPRO_MODEL_ROLE_CONTRACT_VERSION,
    ok: uniqueErrors.length === 0,
    blocked: uniqueErrors.length > 0,
    checkedContractCount: contractValidation.checkedContractCount,
    modelRoleIntentCount: modelRoleIntents.length,
    roles,
    errors: uniqueErrors,
    mockOnly: true,
  }
}

function createIntelligenceResponsibilityPlan(input: {
  backendIntents: ProfessionalSkillBackendIntent[]
  selectedSkills: ProfessionalSkillSelection[]
}) {
  const availableModelRoleIds = unique(
    input.backendIntents.flatMap((intent) => intent.modelRoleId ? [intent.modelRoleId] : []),
  )
  const requestedTasks: ReEditProIntelligenceTaskType[] = [
    'creative_blueprint',
    'tool_graph_compilation',
  ]
  if (availableModelRoleIds.includes('visual_intelligence_gemini_pro_high')) {
    requestedTasks.push('source_visual_analysis')
  }
  if (input.selectedSkills.some((skill) => skill.family === 'qa_review')) {
    requestedTasks.push('technical_visual_qa', 'rough_cut_creative_review')
  }
  return createReEditProIntelligenceResponsibilityPlan({
    availableModelRoleIds,
    requestedTasks,
  })
}

function addSelectionSource(
  current: ProfessionalSkillSelectionSource[],
  source: ProfessionalSkillSelectionSource,
) {
  return current.includes(source) ? current : [...current, source]
}

const familyLabels: Record<ProfessionalSkillFamily, string> = {
  intent_direction: 'Intent and direction',
  source_structure: 'Source structure',
  captions: 'Captions',
  audio_cleanup: 'Audio cleanup',
  music_sound: 'Music and sound',
  visual_graphics: 'Visual layers',
  data_visuals: 'Charts and diagrams',
  motion_design: 'Motion design',
  color_image: 'Color and image',
  mask_enhancement: 'Masking and enhancement',
  render_packaging: 'Private review package',
  qa_review: 'Review checks',
}

function explicitUserPromptForInput(input: ProfessionalSkillPlannerInput) {
  const instructionHistory = input.plannerInput.userInstructionHistory
  const source = Array.isArray(instructionHistory)
    ? instructionHistory.join(' ')
    : input.plannerInput.customInstructions
  return normalizeText(source)
}

function editCueTextForInput(input: ProfessionalSkillPlannerInput) {
  return normalizeText(
    input.planningContext?.cueUsages
      .map((cue) => `${cue.title} ${cue.explanation}`)
      .join(' ') ?? '',
  )
}

function baselineSkillIds(input: ProfessionalSkillPlannerInput) {
  const ids = [
    'intent.compile_prompt_direction',
    'source.review_sequence_and_structure',
    'qa.private_review_readiness',
  ]

  const prompt = normalizeText(input.plannerInput.customInstructions)
  const compiledGoal = normalizeText(input.plannerInput.compiledIntent?.goalSummary)

  if (!prompt && !compiledGoal) {
    return ids
  }

  return ids
}

function fieldDrivenSkillIds(input: ProfessionalSkillPlannerInput): string[] {
  const ids: string[] = []
  const { plannerInput } = input
  const directive = plannerInput.professionalEditingDirective ?? plannerInput.compiledIntent?.professionalEditingDirective
  const captionStyle = normalizeText(directive?.captionStyle)
  const soundStyle = normalizeText(directive?.soundStyle)
  const colorStyle = normalizeText(directive?.colorGradeStyle)
  const visualPreference = normalizeText(plannerInput.visualPreference)
  const workflow = normalizeText(plannerInput.workflowType)
  const category = normalizeText(plannerInput.editingCategory)

  if (captionStyle && !captionStyle.includes('none') && !captionStyle.includes('no captions')) {
    ids.push('captions.clean_readable_captions')
  }

  if (soundStyle && !soundStyle.includes('none')) {
    ids.push('audio.clean_voice', 'audio.loudness_delivery_check')
    if (!soundStyle.includes('voice only')) {
      ids.push('music.timing_and_energy_cues')
    }
  }

  if (colorStyle || workflow.includes('cinematic') || category.includes('documentary')) {
    ids.push('color.image_consistency')
  }

  if (
    visualPreference.includes('visual') &&
    !visualPreference.includes('no extra') &&
    !visualPreference.includes('minimal')
  ) {
    ids.push('graphics.visual_explain_layer')
  }

  if (category.includes('education') || category.includes('business') || workflow.includes('education') || workflow.includes('product')) {
    ids.push('graphics.visual_explain_layer')
  }

  if (plannerInput.editLevel === 'premium') {
    ids.push('qa.private_review_readiness')
  }

  return ids
}

function briefDrivenSource(input: ProfessionalSkillPlannerInput): ProfessionalSkillSelectionSource | null {
  const brief = input.planningContext?.editBrief
  if (!brief) return null

  return brief.ready ? 'edit_brief' : 'edit_brief'
}

function reasonsForSkill(definition: ProfessionalSkillDefinition, sources: ProfessionalSkillSelectionSource[]) {
  if (sources.includes('user_prompt')) return `Selected because the edit request asks for ${definition.userFacingName.toLowerCase()}.`
  if (sources.includes('edit_brief')) return `Selected from optional Edit Brief direction for ${definition.userFacingName.toLowerCase()}.`
  if (sources.includes('workflow_profile')) return `Selected because this workflow commonly needs ${definition.userFacingName.toLowerCase()}.`
  if (sources.includes('edit_level')) return `Selected because this edit level benefits from ${definition.userFacingName.toLowerCase()}.`
  if (sources.includes('source_context')) return `Selected because uploaded source context supports ${definition.userFacingName.toLowerCase()}.`
  return `Baseline professional edit planning includes ${definition.userFacingName.toLowerCase()}.`
}

const selectionEvidenceLabels: Record<ProfessionalSkillSelectionSource, string> = {
  baseline: 'Professional baseline',
  compiled_intent: 'Structured intent',
  edit_brief: 'Edit Brief direction',
  edit_cue: 'Edit cue',
  edit_level: 'Edit level',
  source_context: 'Source context',
  user_prompt: 'User request',
  workflow_profile: 'Workflow context',
}

function evidenceSummaryForSource(
  source: ProfessionalSkillSelectionSource,
  definition: ProfessionalSkillDefinition,
): string {
  const activity = definition.userFacingActivity.toLowerCase()

  switch (source) {
    case 'baseline':
      return `Included as a baseline professional planning step for ${activity}.`
    case 'compiled_intent':
      return `Matched the structured edit intent for ${activity}.`
    case 'edit_brief':
      return `Uses optional Edit Brief direction for ${activity}.`
    case 'edit_cue':
      return `Uses a saved edit cue for ${activity}.`
    case 'edit_level':
      return `Fits the selected edit level for ${activity}.`
    case 'source_context':
      return `Uses uploaded source context for ${activity}.`
    case 'user_prompt':
      return `Matched the user's edit request for ${activity}.`
    case 'workflow_profile':
      return `Fits the workflow context for ${activity}.`
  }
}

function selectionEvidenceForSkill(
  definition: ProfessionalSkillDefinition,
  sources: ProfessionalSkillSelectionSource[],
): ProfessionalSkillSelectionEvidence[] {
  return sources.map((source) => ({
    source,
    label: selectionEvidenceLabels[source],
    summary: evidenceSummaryForSource(source, definition),
  }))
}

function readinessForSkill(
  definition: ProfessionalSkillDefinition,
  input: ProfessionalSkillPlannerInput,
): Pick<ProfessionalSkillSelection, 'blockers' | 'readiness'> {
  const blockers: string[] = []
  const sourceReady = Boolean(
    input.planningContext?.cleanAssembly.durationMs ||
    input.plannerInput.clips.length > 0,
  )
  const hasApprovedSnapshot = definition.requiredInputs.includes('approved_snapshot')
  const hasPrivateManifest = definition.requiredInputs.includes('private_artifact_manifest')

  if (definition.requiredInputs.includes('source_video') && !sourceReady) {
    blockers.push('Upload and finalize source video before this skill can run.')
  }

  if (hasApprovedSnapshot) {
    blockers.push('Approved plan snapshot is required before private review packaging.')
  }

  if (hasPrivateManifest) {
    blockers.push('Private artifact manifest is required before private review packaging.')
  }

  if (definition.executionModes.includes('blocked_until_model_weight_ready')) {
    blockers.push('Model/checkpoint approval is required before this skill can execute.')
  }

  if (blockers.length > 0) {
    return {
      blockers,
      readiness: hasApprovedSnapshot || hasPrivateManifest || definition.executionModes.includes('blocked_until_model_weight_ready')
        ? 'needs_review'
        : 'blocked',
    }
  }

  return {
    blockers: [],
    readiness: 'ready_for_plan',
  }
}

function statusFromSelections(selections: ProfessionalSkillSelection[]): ProfessionalSkillReadinessStatus {
  if (selections.some((selection) => selection.readiness === 'blocked')) return 'blocked'
  if (selections.some((selection) => selection.readiness === 'needs_review')) return 'needs_review'
  return 'ready_for_plan'
}

function createSelection(
  definition: ProfessionalSkillDefinition,
  sources: ProfessionalSkillSelectionSource[],
  input: ProfessionalSkillPlannerInput,
): ProfessionalSkillSelection {
  const readiness = readinessForSkill(definition, input)
  const adapterIntent = adapterToolBundleIntent(definition)
  const backendIntents = uniqueBackendIntents([
    ...(definition.backendIntents ?? []),
    ...(adapterIntent ? [adapterIntent] : []),
  ])

  return {
    skillId: definition.id,
    family: definition.family,
    userFacingName: definition.userFacingName,
    userFacingActivity: definition.userFacingActivity,
    selectionSources: sources,
    selectionEvidence: selectionEvidenceForSkill(definition, sources),
    reason: reasonsForSkill(definition, sources),
    requiredInputs: definition.requiredInputs,
    outputArtifacts: definition.outputArtifacts,
    hiddenAdapterToolNames: definition.hiddenAdapterToolNames,
    backendIntents,
    qaGates: definition.qaGates,
    executionModes: definition.executionModes,
    readiness: readiness.readiness,
    blockers: readiness.blockers,
  }
}

function selectSkillIds(input: ProfessionalSkillPlannerInput) {
  const definitions = listProfessionalSkillDefinitions()
  const explicitUserPrompt = explicitUserPromptForInput(input)
  const editCueText = editCueTextForInput(input)
  let explicitEditBriefDirectives = ''
  const selected = new Map<string, ProfessionalSkillSelectionSource[]>()

  for (const skillId of baselineSkillIds(input)) {
    selected.set(skillId, addSelectionSource(selected.get(skillId) ?? [], 'baseline'))
  }

  for (const skillId of fieldDrivenSkillIds(input)) {
    selected.set(skillId, addSelectionSource(selected.get(skillId) ?? [], 'workflow_profile'))
  }

  const briefSource = briefDrivenSource(input)
  if (briefSource && input.planningContext?.editBrief) {
    const briefText = normalizeText([
      input.planningContext.editBrief.goal,
      input.planningContext.editBrief.styleKeywords.join(' '),
      input.planningContext.editBrief.captionPreference,
      input.planningContext.editBrief.musicPreference,
      input.planningContext.editBrief.bRollPreference,
      input.planningContext.editBrief.brandNotes,
      input.planningContext.editBrief.specialInstructions,
    ].filter(Boolean).join(' '))
    explicitEditBriefDirectives = briefText

    for (const definition of definitions) {
      if (hasAny(briefText, definition.triggerKeywords)) {
        selected.set(definition.id, addSelectionSource(selected.get(definition.id) ?? [], briefSource))
      }
    }
  }

  for (const definition of definitions) {
    if (definition.supportedEditLevels.includes(input.plannerInput.editLevel) && hasAny(explicitUserPrompt, definition.triggerKeywords)) {
      selected.set(definition.id, addSelectionSource(selected.get(definition.id) ?? [], 'user_prompt'))
    }
    if (definition.supportedEditLevels.includes(input.plannerInput.editLevel) && hasAny(editCueText, definition.triggerKeywords)) {
      selected.set(definition.id, addSelectionSource(selected.get(definition.id) ?? [], 'edit_cue'))
    }
  }

  const livingFrameDecision = resolveLivingFrameSelectionPolicy({
    explicitUserIntent: explicitUserPrompt,
    explicitEditBriefDirectives,
    explicitEditCueDirectives: editCueText,
  })
  if (livingFrameDecision.selected && livingFrameDecision.selectionSource) {
    selected.set(
      LIVING_FRAME_PROFESSIONAL_SKILL_ID,
      addSelectionSource(
        selected.get(LIVING_FRAME_PROFESSIONAL_SKILL_ID) ?? [],
        livingFrameDecision.selectionSource,
      ),
    )
  } else {
    selected.delete(LIVING_FRAME_PROFESSIONAL_SKILL_ID)
  }

  if (selected.has('audio.clean_voice')) {
    selected.set(
      'audio.loudness_delivery_check',
      addSelectionSource(selected.get('audio.loudness_delivery_check') ?? [], 'user_prompt'),
    )
  }

  if (input.planningContext?.cleanAssembly.durationMs) {
    selected.set(
      'source.review_sequence_and_structure',
      addSelectionSource(selected.get('source.review_sequence_and_structure') ?? [], 'source_context'),
    )
  }

  if (input.plannerInput.editLevel === 'premium') {
    for (const skillId of ['motion.controlled_2d_motion', 'color.image_consistency']) {
      const current = selected.get(skillId)
      if (current) selected.set(skillId, addSelectionSource(current, 'edit_level'))
    }
  }

  return selected
}

function buildSummary(selections: ProfessionalSkillSelection[]) {
  const activities = selections
    .filter((selection) => selection.readiness !== 'blocked')
    .map((selection) => selection.userFacingActivity)
    .slice(0, 5)

  if (activities.length === 0) {
    return 'ReEditPro has the uploaded source and will prepare a safe planning draft before anything runs.'
  }

  return `ReEditPro will ${activities.join('; ').toLowerCase()}. Nothing runs until the plan and credits are approved.`
}

function buildActivityGroupSummary(input: {
  label: string
  selectedActivityCount: number
  readyActivityCount: number
  reviewActivityCount: number
  blockedActivityCount: number
}) {
  if (input.blockedActivityCount > 0) {
    return `${input.label} has ${input.selectedActivityCount} planned activit${input.selectedActivityCount === 1 ? 'y' : 'ies'}, with ${input.blockedActivityCount} waiting for required source or approval evidence.`
  }
  if (input.reviewActivityCount > 0) {
    return `${input.label} has ${input.selectedActivityCount} planned activit${input.selectedActivityCount === 1 ? 'y' : 'ies'}, with ${input.readyActivityCount} ready for planning and ${input.reviewActivityCount} held for review before execution.`
  }
  return `${input.label} has ${input.readyActivityCount} planned activit${input.readyActivityCount === 1 ? 'y' : 'ies'} ready for plan review.`
}

function buildActivityGroups(selections: ProfessionalSkillSelection[]): ProfessionalSkillPlan['activityGroups'] {
  const familyOrder = new Map<ProfessionalSkillFamily, number>()
  for (const selection of selections) {
    if (!familyOrder.has(selection.family)) familyOrder.set(selection.family, familyOrder.size)
  }

  return Array.from(familyOrder.keys()).map((family) => {
    const groupSelections = selections.filter((selection) => selection.family === family)
    const readyActivityCount = groupSelections.filter((selection) => selection.readiness === 'ready_for_plan').length
    const reviewActivityCount = groupSelections.filter((selection) => selection.readiness === 'needs_review').length
    const blockedActivityCount = groupSelections.filter((selection) => selection.readiness === 'blocked').length
    const status: ProfessionalSkillReadinessStatus = blockedActivityCount > 0
      ? 'blocked'
      : reviewActivityCount > 0
        ? 'needs_review'
        : 'ready_for_plan'
    const label = familyLabels[family]

    return {
      id: family,
      label,
      selectedActivityCount: groupSelections.length,
      readyActivityCount,
      reviewActivityCount,
      blockedActivityCount,
      status,
      userFacingSummary: buildActivityGroupSummary({
        label,
        selectedActivityCount: groupSelections.length,
        readyActivityCount,
        reviewActivityCount,
        blockedActivityCount,
      }),
    }
  })
}

export function createProfessionalSkillPlan(input: ProfessionalSkillPlannerInput): ProfessionalSkillPlan {
  const definitions = listProfessionalSkillDefinitions()
  const selectedIds = selectSkillIds(input)
  const selectedSkills = Array.from(selectedIds.entries())
    .flatMap(([skillId, sources]) => {
      const definition = definitions.find((item) => item.id === skillId)
      return definition ? [createSelection(definition, sources, input)] : []
    })
    .sort((left, right) => {
      const familyOrder = definitions.findIndex((definition) => definition.id === left.skillId) -
        definitions.findIndex((definition) => definition.id === right.skillId)
      return familyOrder
    })
  const backendIntents = uniqueBackendIntents(selectedSkills.flatMap((selection) => selection.backendIntents))
  const modelRoleTrace = createModelRoleTrace(backendIntents)
  const intelligenceResponsibilityPlan = createIntelligenceResponsibilityPlan({
    backendIntents,
    selectedSkills,
  })
  const backendIntentValidationErrors = unique(backendIntents.flatMap((intent) =>
    validateProfessionalSkillBackendIntent(intent).errors
  ))
  const selectionStatus = statusFromSelections(selectedSkills)
  const roleValidationErrors = unique([
    ...modelRoleTrace.errors,
    ...intelligenceResponsibilityPlan.blockers,
  ])
  const status = backendIntentValidationErrors.length > 0 || roleValidationErrors.length > 0 ? 'blocked' : selectionStatus
  const blockers = unique([
    ...selectedSkills.flatMap((selection) => selection.blockers),
    ...backendIntentValidationErrors,
    ...roleValidationErrors,
  ])
  const warnings = [
    input.planningContext?.editBrief && !input.planningContext.editBrief.ready
      ? 'Edit Brief is draft and will be treated as optional direction until marked ready.'
      : '',
    !input.planningContext?.editBrief
      ? 'No Edit Brief was provided; planning continues from prompt and source context.'
      : '',
  ].filter(Boolean)

  return {
    id: `${input.plannerInput.projectName || 'project'}-professional-skill-plan`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status,
    source: 'professional_skill_planner',
    selectedSkillCount: selectedSkills.length,
    selectedFamilies: unique(selectedSkills.map((selection) => selection.family)),
    selectedSkills,
    activityGroups: buildActivityGroups(selectedSkills),
    userFacingSummary: buildSummary(selectedSkills),
    userFacingActivities: unique(selectedSkills.map((selection) => selection.userFacingActivity)),
    hiddenAdapterToolNames: unique(selectedSkills.flatMap((selection) => selection.hiddenAdapterToolNames)),
    backendIntents,
    modelRoleTrace,
    intelligenceResponsibilityPlan,
    qaGateSummary: unique(selectedSkills.flatMap((selection) => selection.qaGates)),
    blockers,
    warnings,
    editBriefUsed: Boolean(input.planningContext?.editBrief?.ready),
    editBriefOptional: true,
    promptFirstPlanning: true,
    noUserVisibleToolNames: true,
  }
}

export function createProfessionalSkillPlanFromPlannerInput(plannerInput: PlannerInput): ProfessionalSkillPlan {
  return createProfessionalSkillPlan({ plannerInput })
}
