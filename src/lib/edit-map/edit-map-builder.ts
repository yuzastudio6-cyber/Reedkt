import type {
  CleanAssembly,
  EditDocument,
  EditElement,
  EditElementSource,
  EditGroup,
  EditMapSelectablePreviewElement,
  EditMapState,
  EditMapSummary,
  EditScope,
  EditSystem,
  EditSystemKind,
  EditVersion,
  EditCuesState,
  MockPreviewJob,
  PlanningContext,
  ProfessionalIntegrationState,
  ProfessionalQaState,
  SourceLibraryState,
  WorkflowTimeRange,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

export type BuildEditMapStateInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  previewJob?: MockPreviewJob | null
  planningContext?: PlanningContext | null
  professionalIntegrationState?: ProfessionalIntegrationState | null
  professionalQaState?: ProfessionalQaState | null
  editCuesState?: EditCuesState | null
  sourceLibraryState?: SourceLibraryState | null
  cleanAssembly?: CleanAssembly | null
}

type GroupDraft = {
  id: string
  systemId: string
  name: string
  type: string
  defaultEditScope?: EditScope
  linkedByDefault?: boolean
  allowInstanceOverrides?: boolean
  stylePresetId?: string
}

type ElementDraft = {
  id: string
  systemId: string
  groupId: string
  label: string
  timeRange?: WorkflowTimeRange
  visualBounds?: { x: number; y: number; width: number; height: number }
  source: EditElementSource
  properties?: Record<string, unknown>
  dependencyIds?: string[]
}

const SYSTEMS: Array<{
  idSuffix: string
  kind: EditSystemKind
  name: string
  globalControls: string[]
}> = [
  { idSuffix: 'story-cuts', kind: 'story_cuts', name: 'Story & Cuts', globalControls: ['structure', 'trim pacing', 'scene flow'] },
  { idSuffix: 'captions', kind: 'captions', name: 'Captions', globalControls: ['style', 'position', 'timing', 'visibility'] },
  { idSuffix: 'b-roll', kind: 'b_roll', name: 'B-roll', globalControls: ['crop', 'trim', 'placement', 'audio'] },
  { idSuffix: 'overlays', kind: 'overlays', name: 'Overlays', globalControls: ['placement', 'safe zones', 'frame style'] },
  { idSuffix: 'text-graphics', kind: 'text_graphics', name: 'Text & Graphics', globalControls: ['scale', 'style', 'safe margins'] },
  { idSuffix: 'audio', kind: 'audio', name: 'Audio', globalControls: ['music', 'SFX', 'ducking'] },
  { idSuffix: 'color-look', kind: 'color_look', name: 'Color/Look', globalControls: ['grade', 'match', 'polish'] },
  { idSuffix: 'platform-layout', kind: 'platform_layout', name: 'Platform Layout', globalControls: ['frame', 'safe zones', 'layout'] },
  { idSuffix: 'professional-integration', kind: 'professional_integration', name: 'Professional Integration', globalControls: ['treatments', 'QA traceability'] },
]

function documentId(projectId: string) {
  return `${projectId}-edit-document`
}

function systemId(projectId: string, suffix: string) {
  return `${projectId}-edit-system-${suffix}`
}

function groupId(projectId: string, suffix: string) {
  return `${projectId}-edit-group-${suffix}`
}

function elementId(projectId: string, suffix: string) {
  return `${projectId}-edit-element-${suffix}`
}

function groupSuffixFromLabel(label: string, fallback: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || fallback
}

function sourceAssetLabel(mediaAssetId: string | undefined, sourceLibraryState?: SourceLibraryState | null) {
  if (!mediaAssetId) return undefined
  return sourceLibraryState?.assets.find((asset) => asset.mediaAssetId === mediaAssetId)?.label
}

function rangeForIndex(index: number, durationMs: number, fallbackLengthMs = 3500): WorkflowTimeRange {
  const startMs = Math.min(durationMs - 500, Math.max(0, index * 6000))
  return {
    startMs,
    endMs: Math.min(durationMs, startMs + fallbackLengthMs),
  }
}

function visibleStateForDocument(input: BuildEditMapStateInput, status: EditMapState['status']): EditMapState {
  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    status,
    editDocument: null,
    systems: [],
    groups: [],
    elements: [],
    versions: [],
    operations: [],
    defaultScope: 'group',
    previewJobId: input.previewJob?.id,
    planningContextId: input.planningContext?.id,
    professionalIntegrationPlanId: input.professionalIntegrationState?.professionalIntegrationPlan?.id,
    qaReportId: input.professionalQaState?.report?.id,
    updatedAt: MOCK_CREATED_AT,
  }
}

function buildCaptionGroups(projectId: string): GroupDraft[] {
  const captionsSystemId = systemId(projectId, 'captions')
  return [
    {
      id: groupId(projectId, 'hook-captions'),
      systemId: captionsSystemId,
      name: 'Hook Captions',
      type: 'caption_group',
      defaultEditScope: 'group',
      linkedByDefault: true,
      allowInstanceOverrides: true,
      stylePresetId: 'caption-hook-bold',
    },
    {
      id: groupId(projectId, 'main-captions'),
      systemId: captionsSystemId,
      name: 'Main Captions',
      type: 'caption_group',
      defaultEditScope: 'group',
      linkedByDefault: true,
      allowInstanceOverrides: true,
      stylePresetId: 'caption-main-readable',
    },
    {
      id: groupId(projectId, 'cta-captions'),
      systemId: captionsSystemId,
      name: 'CTA Captions',
      type: 'caption_group',
      defaultEditScope: 'group',
      linkedByDefault: true,
      allowInstanceOverrides: true,
      stylePresetId: 'caption-cta-clear',
    },
  ]
}

function buildBaseGroups(projectId: string): GroupDraft[] {
  return [
    {
      id: groupId(projectId, 'story-beats'),
      systemId: systemId(projectId, 'story-cuts'),
      name: 'Story Beats',
      type: 'story_group',
      defaultEditScope: 'scene',
    },
    ...buildCaptionGroups(projectId),
    {
      id: groupId(projectId, 'music-bed'),
      systemId: systemId(projectId, 'audio'),
      name: 'Music Bed',
      type: 'audio_group',
      defaultEditScope: 'group',
    },
    {
      id: groupId(projectId, 'sfx'),
      systemId: systemId(projectId, 'audio'),
      name: 'SFX',
      type: 'audio_group',
      defaultEditScope: 'single_element',
      allowInstanceOverrides: true,
    },
    {
      id: groupId(projectId, 'color-polish'),
      systemId: systemId(projectId, 'color-look'),
      name: 'Color Polish',
      type: 'color_group',
      defaultEditScope: 'whole_video',
    },
    {
      id: groupId(projectId, 'platform-layout'),
      systemId: systemId(projectId, 'platform-layout'),
      name: 'Platform Layout',
      type: 'layout_group',
      defaultEditScope: 'whole_video',
    },
    {
      id: groupId(projectId, 'professional-treatment-decisions'),
      systemId: systemId(projectId, 'professional-integration'),
      name: 'Professional Treatment Decisions',
      type: 'treatment_group',
      defaultEditScope: 'system',
    },
    {
      id: groupId(projectId, 'cta-text'),
      systemId: systemId(projectId, 'text-graphics'),
      name: 'CTA Text',
      type: 'text_group',
      defaultEditScope: 'group',
      allowInstanceOverrides: true,
    },
  ]
}

function buildBrollGroups(input: BuildEditMapStateInput): GroupDraft[] {
  const plans = input.professionalIntegrationState?.brollIntegrationPlans ?? []
  const brollSystemId = systemId(input.projectId, 'b-roll')
  const drafts = plans.map((plan, index) => {
    const label = sourceAssetLabel(plan.mediaAssetId, input.sourceLibraryState) ?? `B-roll ${index + 1}`
    return {
      id: groupId(input.projectId, `${groupSuffixFromLabel(label, `broll-${index + 1}`)}-b-roll-${String(index + 1).padStart(3, '0')}`),
      systemId: brollSystemId,
      name: `${label} B-roll`,
      type: 'broll_group',
      defaultEditScope: 'group' as const,
      allowInstanceOverrides: true,
    }
  })

  return drafts.length > 0
    ? drafts
    : [{
        id: groupId(input.projectId, 'kitchen-b-roll'),
        systemId: brollSystemId,
        name: 'Kitchen B-roll',
        type: 'broll_group',
        defaultEditScope: 'group',
        allowInstanceOverrides: true,
      }]
}

function buildOverlayGroups(input: BuildEditMapStateInput): GroupDraft[] {
  const plans = input.professionalIntegrationState?.overlayCompositionPlans ?? []
  const overlaySystemId = systemId(input.projectId, 'overlays')
  const drafts = plans.map((plan, index) => {
    const label = sourceAssetLabel(plan.mediaAssetId, input.sourceLibraryState) ?? `Overlay ${index + 1}`
    return {
      id: groupId(input.projectId, `${groupSuffixFromLabel(label, `overlay-${index + 1}`)}-overlay-${String(index + 1).padStart(3, '0')}`),
      systemId: overlaySystemId,
      name: `${label} Overlay`,
      type: 'overlay_group',
      defaultEditScope: 'group' as const,
      allowInstanceOverrides: true,
    }
  })

  return drafts.length > 0
    ? drafts
    : [{
        id: groupId(input.projectId, 'dashboard-proof-overlay'),
        systemId: overlaySystemId,
        name: 'Dashboard Proof Overlay',
        type: 'overlay_group',
        defaultEditScope: 'group',
        allowInstanceOverrides: true,
      }]
}

function buildCaptionElements(projectId: string, durationMs: number): ElementDraft[] {
  const captionsSystemId = systemId(projectId, 'captions')
  return [
    {
      id: elementId(projectId, 'caption-hook-001'),
      systemId: captionsSystemId,
      groupId: groupId(projectId, 'hook-captions'),
      label: 'Hook caption: Stop scrolling for this',
      timeRange: rangeForIndex(0, durationMs, 2200),
      visualBounds: { x: 0.12, y: 0.72, width: 0.76, height: 0.08 },
      source: { kind: 'caption_plan' as const, notes: 'Hook caption line from preview.' },
      properties: { text: 'Stop scrolling for this', role: 'hook_caption' },
    },
    ...['This is a major investment.', 'The kitchen is the proof point.', 'The backyard makes it feel private.'].map((text, index) => ({
      id: elementId(projectId, `caption-${String(index + 1).padStart(3, '0')}`),
      systemId: captionsSystemId,
      groupId: groupId(projectId, 'main-captions'),
      label: `Main caption ${index + 1}: ${text}`,
      timeRange: rangeForIndex(index + 1, durationMs, 3200),
      visualBounds: { x: 0.1, y: 0.78, width: 0.8, height: 0.08 },
      source: { kind: 'caption_plan' as const, notes: 'Connected main caption line.' },
      properties: { text, role: 'main_caption' },
    })),
    {
      id: elementId(projectId, 'caption-cta-001'),
      systemId: captionsSystemId,
      groupId: groupId(projectId, 'cta-captions'),
      label: 'CTA caption: Book the private tour',
      timeRange: rangeForIndex(5, durationMs, 2800),
      visualBounds: { x: 0.12, y: 0.72, width: 0.76, height: 0.08 },
      source: { kind: 'caption_plan' as const, notes: 'CTA caption line from preview.' },
      properties: { text: 'Book the private tour', role: 'cta_caption' },
    },
  ]
}

function buildBrollElements(input: BuildEditMapStateInput, brollGroups: GroupDraft[], durationMs: number): ElementDraft[] {
  const plans = input.professionalIntegrationState?.brollIntegrationPlans ?? []
  if (plans.length === 0) {
    return [{
      id: elementId(input.projectId, 'kitchen-broll-001'),
      systemId: systemId(input.projectId, 'b-roll'),
      groupId: groupId(input.projectId, 'kitchen-b-roll'),
      label: 'Kitchen B-roll moment',
      timeRange: rangeForIndex(2, durationMs, 5000),
      visualBounds: { x: 0, y: 0, width: 1, height: 1 },
      source: { kind: 'manual_revision', notes: 'Fallback local B-roll preview element.' },
      properties: { treatment: 'full-frame safe crop', keepMainAudio: true },
    }]
  }

  return plans.map((plan, index) => ({
    id: elementId(input.projectId, `broll-${String(index + 1).padStart(3, '0')}`),
    systemId: systemId(input.projectId, 'b-roll'),
    groupId: brollGroups[index]?.id ?? brollGroups[0].id,
    label: `${sourceAssetLabel(plan.mediaAssetId, input.sourceLibraryState) ?? `B-roll ${index + 1}`} moment`,
    timeRange: plan.targetCleanAssemblyRange ?? rangeForIndex(index + 2, durationMs, 4500),
    visualBounds: { x: 0, y: 0, width: 1, height: 1 },
    source: {
      kind: 'professional_integration',
      editCueId: plan.editCueId,
      professionalIntegrationPlanId: plan.professionalIntegrationPlanId,
      mediaAssetId: plan.mediaAssetId,
      notes: plan.reasoning,
    },
    properties: {
      cropMode: plan.cropMode,
      colorMatch: plan.colorMatch,
      stabilize: plan.stabilize,
      keepMainAudio: plan.keepMainAudio,
      muteAssetAudio: plan.muteAssetAudio,
    },
  }))
}

function placementBounds(placement: string | undefined) {
  if (placement === 'left') return { x: 0.08, y: 0.2, width: 0.36, height: 0.28 }
  if (placement === 'center') return { x: 0.18, y: 0.26, width: 0.64, height: 0.28 }
  if (placement === 'lower_third') return { x: 0.1, y: 0.62, width: 0.8, height: 0.16 }
  if (placement === 'top' || placement === 'upper_third') return { x: 0.12, y: 0.14, width: 0.76, height: 0.18 }
  return { x: 0.54, y: 0.22, width: 0.36, height: 0.26 }
}

function buildOverlayElements(input: BuildEditMapStateInput, overlayGroups: GroupDraft[], durationMs: number): ElementDraft[] {
  const plans = input.professionalIntegrationState?.overlayCompositionPlans ?? []
  if (plans.length === 0) {
    return [{
      id: elementId(input.projectId, 'dashboard-overlay-001'),
      systemId: systemId(input.projectId, 'overlays'),
      groupId: groupId(input.projectId, 'dashboard-proof-overlay'),
      label: 'Dashboard Proof Overlay',
      timeRange: rangeForIndex(3, durationMs, 4200),
      visualBounds: { x: 0.54, y: 0.22, width: 0.36, height: 0.26 },
      source: { kind: 'manual_revision', notes: 'Fallback local overlay preview element.' },
      properties: { frameStyle: 'rounded_card', safeZoneAware: true },
    }]
  }

  return plans.map((plan, index) => ({
    id: elementId(input.projectId, `overlay-${String(index + 1).padStart(3, '0')}`),
    systemId: systemId(input.projectId, 'overlays'),
    groupId: overlayGroups[index]?.id ?? overlayGroups[0].id,
    label: `${sourceAssetLabel(plan.mediaAssetId, input.sourceLibraryState) ?? `Overlay ${index + 1}`} card`,
    timeRange: plan.targetRange ?? rangeForIndex(index + 3, durationMs, 4200),
    visualBounds: plan.boundingBox ?? placementBounds(plan.placement),
    source: {
      kind: 'professional_integration',
      editCueId: plan.editCueId,
      professionalIntegrationPlanId: plan.professionalIntegrationPlanId,
      mediaAssetId: plan.mediaAssetId,
      notes: plan.treatmentSummary,
    },
    properties: {
      placement: plan.placement,
      safeZoneAware: plan.safeZoneAware,
      avoidFaces: plan.avoidFaces,
      avoidCaptions: plan.avoidCaptions,
      frameStyle: plan.frameStyle,
      readableOnMobile: plan.readableOnMobile,
    },
  }))
}

function buildBaseElements(input: BuildEditMapStateInput, durationMs: number): ElementDraft[] {
  return [
    {
      id: elementId(input.projectId, 'story-beat-001'),
      systemId: systemId(input.projectId, 'story-cuts'),
      groupId: groupId(input.projectId, 'story-beats'),
      label: 'Hook to proof story beat',
      timeRange: rangeForIndex(0, durationMs, 6500),
      source: { kind: 'cut_decision', notes: 'Local story/cut element from the preview structure.' },
      properties: { storyPurpose: 'hook_to_proof' },
    },
    {
      id: elementId(input.projectId, 'cta-text-001'),
      systemId: systemId(input.projectId, 'text-graphics'),
      groupId: groupId(input.projectId, 'cta-text'),
      label: 'CTA text card',
      timeRange: rangeForIndex(6, durationMs, 3500),
      visualBounds: { x: 0.14, y: 0.16, width: 0.72, height: 0.14 },
      source: { kind: 'render_input', notes: 'Local CTA graphic text element.' },
      properties: { text: 'Schedule a private showing', style: 'premium_card' },
    },
    {
      id: elementId(input.projectId, 'music-bed-001'),
      systemId: systemId(input.projectId, 'audio'),
      groupId: groupId(input.projectId, 'music-bed'),
      label: 'Music Bed',
      timeRange: { startMs: 0, endMs: durationMs },
      source: { kind: 'sound_plan', notes: 'Local mock music bed element.' },
      properties: { duckUnderSpeech: true, mood: 'warm premium' },
    },
    {
      id: elementId(input.projectId, 'sfx-001'),
      systemId: systemId(input.projectId, 'audio'),
      groupId: groupId(input.projectId, 'sfx'),
      label: 'Soft whoosh SFX',
      timeRange: rangeForIndex(1, durationMs, 700),
      source: { kind: 'sound_plan', notes: 'Local mock SFX element.' },
      properties: { voiceSafe: true, transitionSupport: true },
    },
    {
      id: elementId(input.projectId, 'color-polish-001'),
      systemId: systemId(input.projectId, 'color-look'),
      groupId: groupId(input.projectId, 'color-polish'),
      label: 'Color Polish',
      timeRange: { startMs: 0, endMs: durationMs },
      source: { kind: 'render_input', notes: 'Local color/look edit element.' },
      properties: { look: 'natural premium', skinToneSafe: true },
    },
    {
      id: elementId(input.projectId, 'platform-layout-001'),
      systemId: systemId(input.projectId, 'platform-layout'),
      groupId: groupId(input.projectId, 'platform-layout'),
      label: 'Platform Layout',
      timeRange: { startMs: 0, endMs: durationMs },
      visualBounds: { x: 0.06, y: 0.06, width: 0.88, height: 0.88 },
      source: { kind: 'render_input', notes: 'Local safe-zone and frame layout element.' },
      properties: { frame: 'vertical safe-zone aware', aspect: '9:16' },
    },
    {
      id: elementId(input.projectId, 'professional-treatment-001'),
      systemId: systemId(input.projectId, 'professional-integration'),
      groupId: groupId(input.projectId, 'professional-treatment-decisions'),
      label: 'Professional treatment decisions',
      timeRange: { startMs: 0, endMs: durationMs },
      source: {
        kind: 'professional_integration',
        professionalIntegrationPlanId: input.professionalIntegrationState?.professionalIntegrationPlan?.id,
        notes: 'Traceable local professional treatment decision element.',
      },
      properties: {
        treatmentCount: input.professionalIntegrationState
          ? input.professionalIntegrationState.assetTreatmentPlans.length +
            input.professionalIntegrationState.brollIntegrationPlans.length +
            input.professionalIntegrationState.overlayCompositionPlans.length
          : 0,
      },
    },
  ]
}

function createSystemRecords(input: BuildEditMapStateInput, groups: GroupDraft[]): EditSystem[] {
  const docId = documentId(input.projectId)
  return SYSTEMS.map((system) => {
    const id = systemId(input.projectId, system.idSuffix)
    const groupIds = groups.filter((group) => group.systemId === id).map((group) => group.id)
    return {
      id,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      createdAt: MOCK_CREATED_AT,
      updatedAt: MOCK_CREATED_AT,
      editDocumentId: docId,
      kind: system.kind,
      name: system.name,
      visible: true,
      locked: false,
      defaultGroupId: groupIds[0],
      groupIds,
      globalControls: system.globalControls,
    }
  })
}

function createGroupRecords(input: BuildEditMapStateInput, groups: GroupDraft[], elements: ElementDraft[]): EditGroup[] {
  const docId = documentId(input.projectId)
  return groups.map((group) => ({
    id: group.id,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    editDocumentId: docId,
    systemId: group.systemId,
    name: group.name,
    type: group.type,
    visible: true,
    locked: false,
    stylePresetId: group.stylePresetId,
    elementIds: elements.filter((element) => element.groupId === group.id).map((element) => element.id),
    defaultEditScope: group.defaultEditScope ?? 'group',
    linkedByDefault: group.linkedByDefault ?? false,
    allowInstanceOverrides: group.allowInstanceOverrides ?? false,
  }))
}

function createElementRecords(input: BuildEditMapStateInput, elements: ElementDraft[]): EditElement[] {
  const docId = documentId(input.projectId)
  return elements.map((element) => ({
    id: element.id,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    editDocumentId: docId,
    systemId: element.systemId,
    groupId: element.groupId,
    label: element.label,
    timeRange: element.timeRange,
    visualBounds: element.visualBounds,
    visible: true,
    locked: false,
    source: element.source,
    properties: element.properties ?? {},
    dependencyIds: element.dependencyIds,
  }))
}

function selectedLabel(state: EditMapState) {
  const selection = state.activeSelection
  if (!selection) return undefined
  if (selection.elementId) return state.elements.find((element) => element.id === selection.elementId)?.label
  if (selection.groupId) return state.groups.find((group) => group.id === selection.groupId)?.name
  if (selection.systemId) return state.systems.find((system) => system.id === selection.systemId)?.name
  return undefined
}

export function buildEditMapState(input: BuildEditMapStateInput): EditMapState {
  if (input.previewJob?.status !== 'completed') {
    return visibleStateForDocument(input, 'not_created')
  }

  const durationMs = input.cleanAssembly?.durationMs ??
    input.planningContext?.cleanAssembly.durationMs ??
    60000
  const docId = documentId(input.projectId)
  const brollGroups = buildBrollGroups(input)
  const overlayGroups = buildOverlayGroups(input)
  const groupDrafts = [
    ...buildBaseGroups(input.projectId),
    ...brollGroups,
    ...overlayGroups,
  ]
  const elementDrafts = [
    ...buildCaptionElements(input.projectId, durationMs),
    ...buildBrollElements(input, brollGroups, durationMs),
    ...buildOverlayElements(input, overlayGroups, durationMs),
    ...buildBaseElements(input, durationMs),
  ]
  const systems = createSystemRecords(input, groupDrafts)
  const groups = createGroupRecords(input, groupDrafts, elementDrafts)
  const elements = createElementRecords(input, elementDrafts)
  const selection = {
    elementId: elementId(input.projectId, 'caption-001'),
    groupId: groupId(input.projectId, 'main-captions'),
    systemId: systemId(input.projectId, 'captions'),
    activeScope: 'group' as const,
  }
  const editDocument: EditDocument = {
    id: docId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    renderId: input.previewJob.id,
    previewId: input.previewJob.previewId,
    cleanAssemblyId: input.cleanAssembly?.id ?? input.planningContext?.cleanAssembly.cleanAssemblyId,
    professionalIntegrationPlanId: input.professionalIntegrationState?.professionalIntegrationPlan?.id,
    durationMs,
    version: 1,
    systemIds: systems.map((system) => system.id),
    groupIds: groups.map((group) => group.id),
    elementIds: elements.map((element) => element.id),
    activeSelection: selection,
  }
  const versions: EditVersion[] = [{
    id: `${input.projectId}-edit-version-001`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    editDocumentId: docId,
    version: 1,
    operationIds: [],
    renderId: input.previewJob.id,
    notes: 'Initial local Edit Map from private review readiness.',
  }]

  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    status: 'ready',
    editDocument,
    systems,
    groups,
    elements,
    versions,
    operations: [],
    activeSelection: selection,
    defaultScope: 'group',
    previewJobId: input.previewJob.id,
    planningContextId: input.planningContext?.id,
    professionalIntegrationPlanId: input.professionalIntegrationState?.professionalIntegrationPlan?.id,
    qaReportId: input.professionalQaState?.report?.id,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function summarizeEditMapState(state: EditMapState): EditMapSummary {
  const nextRecommendedActions: string[] = []
  if (!state.editDocument) nextRecommendedActions.push('Create Edit Map')
  if (state.activeSelection) nextRecommendedActions.push('Adjust selected scope')
  if (state.operations.length > 0) nextRecommendedActions.push('Review local operation history')
  if (state.operations.length === 0 && state.editDocument) nextRecommendedActions.push('Select a preview element')

  return {
    status: state.status,
    systemCount: state.systems.length,
    groupCount: state.groups.length,
    elementCount: state.elements.length,
    visibleSystemCount: state.systems.filter((system) => system.visible).length,
    hiddenGroupCount: state.groups.filter((group) => !group.visible).length,
    hiddenElementCount: state.elements.filter((element) => !element.visible).length,
    lockedGroupCount: state.groups.filter((group) => group.locked).length,
    lockedElementCount: state.elements.filter((element) => element.locked).length,
    operationCount: state.operations.length,
    selectedLabel: selectedLabel(state),
    nextRecommendedActions,
  }
}

export function getSelectablePreviewElements(state: EditMapState): EditMapSelectablePreviewElement[] {
  return state.elements.flatMap((element) => {
    if (!element.visualBounds) return []
    const group = state.groups.find((candidate) => candidate.id === element.groupId)
    const system = state.systems.find((candidate) => candidate.id === element.systemId)
    if (!group || !system) return []
    const visible = element.visible && group.visible && system.visible
    if (!visible) return []

    return [{
      id: `${element.id}-preview-target`,
      elementId: element.id,
      groupId: group.id,
      systemId: system.id,
      label: element.label,
      kind: system.kind,
      bounds: element.visualBounds,
      timeRange: element.timeRange,
      visible,
      locked: element.locked || group.locked || system.locked,
    }]
  })
}
