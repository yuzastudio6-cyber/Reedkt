import type {
  DataVizPlanItem,
  DepthAwareOverlayPlanItem,
  EditPlan,
  MapAnimationPlanItem,
  OpenSourceToolId,
  ProviderModel,
  ProviderPromptPlan,
  RendererLayerPlan,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import type {
  EditAssetManifestItem,
  EditDependencyType,
  EditingAgentExecutionPlan,
  EditingAgentLayer,
  EditWorkDependency,
  EditWorkExpectedOutput,
  EditWorkItem,
  EditWorkItemStatus,
  EditWorkItemType,
} from '../types/editing-agent-runtime'

type CreateWorkItemParams = {
  id: string
  workItemType: EditWorkItemType
  agentLayer: EditingAgentLayer
  status?: EditWorkItemStatus
  label: string
  purpose: string
  approvedPlanSnapshotId?: string
  priority?: EditWorkItem['priority']
  canRunInParallel?: boolean
  dependencies?: EditWorkDependency[]
  expectedOutputs?: EditWorkExpectedOutput[]
  linkedSegmentIds?: string[]
  linkedVisualAssetPlanItemIds?: string[]
  linkedTimingCueIds?: string[]
  linkedProviderPromptPlanIds?: string[]
  linkedToolStrategyItemIds?: string[]
  linkedRendererLayerIds?: string[]
  maxRetries?: number
  fallbackPolicy?: string[]
  checkbackPolicy?: string[]
  qaChecks?: string[]
  notes?: string[]
}

type CreateAssetParams = {
  id: string
  label: string
  assetType: EditAssetManifestItem['assetType']
  parentWorkItemId: string
  promptPlanId?: string
  providerModel?: ProviderModel
  toolId?: OpenSourceToolId
  linkedSegmentIds?: string[]
  linkedVisualAssetPlanItemIds?: string[]
  linkedTimingCueIds?: string[]
  linkedRendererLayerIds?: string[]
  metadata?: Record<string, unknown>
  notes?: string[]
}

const providerTargets = ['gpt_image_2', 'wan', 'hailuo', 'veo']
const imagePromptTypes = ['image_prompt', 'start_frame_prompt', 'end_frame_prompt', 'still_card_prompt', 'graphic_design_prompt']
const videoPromptTypes = ['stroke_motion_video_prompt', 'real_motion_video_prompt', 'veo_fallback_prompt']
const providerWaitingStatuses: EditWorkItemStatus[] = ['waiting_provider', 'waiting_worker', 'waiting_asset', 'waiting_user_review']

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function dependency(params: {
  id: string
  dependencyType: EditDependencyType
  reason: string
  blocking: boolean
  dependsOnWorkItemId?: string
  dependsOnAssetId?: string
  fallbackIfMissing?: string
}): EditWorkDependency {
  return params
}

function expectedOutput(params: {
  id: string
  outputType: EditWorkExpectedOutput['outputType']
  linkedAssetManifestId?: string
  linkedRendererLayerId?: string
  linkedTimingCueId?: string
  notes?: string[]
}): EditWorkExpectedOutput {
  return {
    id: params.id,
    outputType: params.outputType,
    linkedAssetManifestId: params.linkedAssetManifestId,
    linkedRendererLayerId: params.linkedRendererLayerId,
    linkedTimingCueId: params.linkedTimingCueId,
    notes: params.notes ?? [],
  }
}

function createWorkItem(params: CreateWorkItemParams): EditWorkItem {
  const pendingSnapshotNote = params.approvedPlanSnapshotId
    ? `Approved snapshot ${params.approvedPlanSnapshotId} is the execution source.`
    : 'Approved snapshot ID is pending; this mock graph is frozen only after approval.'

  return {
    id: params.id,
    workItemType: params.workItemType,
    agentLayer: params.agentLayer,
    status: params.status ?? 'planned',
    label: params.label,
    purpose: params.purpose,
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    idempotencyKey: `idem-${params.id}`,
    priority: params.priority ?? 'medium',
    canRunInParallel: params.canRunInParallel ?? true,
    dependencies: params.dependencies ?? [],
    expectedOutputs: params.expectedOutputs ?? [expectedOutput({ id: `${params.id}-output`, outputType: 'none' })],
    linkedSegmentIds: unique(params.linkedSegmentIds ?? []),
    linkedVisualAssetPlanItemIds: unique(params.linkedVisualAssetPlanItemIds ?? []),
    linkedTimingCueIds: unique(params.linkedTimingCueIds ?? []),
    linkedProviderPromptPlanIds: unique(params.linkedProviderPromptPlanIds ?? []),
    linkedToolStrategyItemIds: unique(params.linkedToolStrategyItemIds ?? []),
    linkedRendererLayerIds: unique(params.linkedRendererLayerIds ?? []),
    retryCount: 0,
    maxRetries: params.maxRetries ?? 1,
    fallbackPolicy: params.fallbackPolicy ?? ['Use approved fallback policy only; request review if fallback changes scope.'],
    checkbackPolicy: params.checkbackPolicy ?? ['Future workers report status through structured events; no model memory is used.'],
    qaChecks: params.qaChecks ?? ['Verify work output against approved snapshot before merge.'],
    notes: [pendingSnapshotNote, ...(params.notes ?? [])],
  }
}

function createManifestItem(params: CreateAssetParams): EditAssetManifestItem {
  return {
    id: params.id,
    label: params.label,
    lifecycleStatus: 'planned',
    assetType: params.assetType,
    storageProvider: 'local_mock',
    storagePath: `mock/edit-assets/${params.id}`,
    parentWorkItemId: params.parentWorkItemId,
    promptPlanId: params.promptPlanId,
    providerModel: params.providerModel,
    toolId: params.toolId,
    linkedSegmentIds: unique(params.linkedSegmentIds ?? []),
    linkedVisualAssetPlanItemIds: unique(params.linkedVisualAssetPlanItemIds ?? []),
    linkedTimingCueIds: unique(params.linkedTimingCueIds ?? []),
    linkedRendererLayerIds: unique(params.linkedRendererLayerIds ?? []),
    version: 1,
    qaStatus: 'not_checked',
    qaNotes: ['Asset QA runs in future workers after the asset exists.'],
    metadata: params.metadata ?? {},
    notes: [
      'Manifest entry is mock-only; no asset has been generated, stored, or uploaded.',
      'Real storage happens later through approved backend/worker infrastructure.',
      ...(params.notes ?? []),
    ],
  }
}

function isProviderPrompt(prompt: ProviderPromptPlan) {
  return providerTargets.includes(prompt.targetProvider) && prompt.providerModel !== 'none'
}

function isImagePrompt(prompt: ProviderPromptPlan) {
  return prompt.targetProvider === 'gpt_image_2' || imagePromptTypes.includes(prompt.planType)
}

function isVideoPrompt(prompt: ProviderPromptPlan) {
  return prompt.targetProvider === 'wan' || prompt.targetProvider === 'hailuo' || prompt.targetProvider === 'veo' || videoPromptTypes.includes(prompt.planType)
}

function assetForPrompt(plan: EditPlan, prompt: ProviderPromptPlan): VisualAssetPlanItem | undefined {
  return (plan.visualAssetPlan ?? []).find((asset) => asset.id === prompt.assetPlanItemId)
}

function layerIdsForAsset(plan: EditPlan, assetId?: string) {
  if (!assetId) return []

  return (plan.rendererCompositionPlan?.layers ?? [])
    .filter((layer) => layer.assetPlanItemId === assetId)
    .map((layer) => layer.id)
}

function timingCueIdsForAsset(asset?: VisualAssetPlanItem) {
  return unique([
    ...(asset?.timingCueIds ?? []),
    ...(asset?.visualCueTimingIds ?? []),
    asset?.visualTimingItemId ?? '',
  ])
}

function controlledVisualAssetPlanItemId(item: MapAnimationPlanItem | DataVizPlanItem | DepthAwareOverlayPlanItem) {
  if ('visualAssetPlanItemId' in item && item.visualAssetPlanItemId) {
    return item.visualAssetPlanItemId
  }

  return item.assetPlanItemId
}

function controlledToolStrategyItemIds(item: MapAnimationPlanItem | DataVizPlanItem | DepthAwareOverlayPlanItem) {
  if ('toolStrategyItemId' in item && item.toolStrategyItemId) {
    return [item.toolStrategyItemId]
  }

  return []
}

function controlledFallbackPolicy(item: MapAnimationPlanItem | DataVizPlanItem | DepthAwareOverlayPlanItem) {
  if ('fallbackStrategy' in item) {
    return item.fallbackStrategy
  }

  if (item.fallbackLayoutMode) {
    return [`Use fallback layout mode ${item.fallbackLayoutMode} if mask asset cannot be produced.`]
  }

  return ['Use approved safer layout or still/card fallback if controlled asset cannot be produced.']
}

function createProviderWorkItems(params: {
  plan: EditPlan
  approvedPlanSnapshotId?: string
  validateWorkItemId: string
}) {
  const workItems: EditWorkItem[] = []
  const assets: EditAssetManifestItem[] = []
  const imageAssetByPlanItemId = new Map<string, string>()
  const imageWorkByPlanItemId = new Map<string, string>()

  for (const prompt of params.plan.providerPromptPlans ?? []) {
    if (!isProviderPrompt(prompt) || !isImagePrompt(prompt)) continue

    const visualAsset = assetForPrompt(params.plan, prompt)
    const workItemId = `work-generate-image-${slug(prompt.id)}`
    const assetId = `asset-generated-image-${slug(prompt.id)}`

    const workItem = createWorkItem({
      id: workItemId,
      workItemType: 'generate_image_asset',
      agentLayer: 'asset_generation_agent',
      status: 'planned',
      label: `Generate image asset: ${prompt.title}`,
      purpose: 'Plan future GPT-Image-2 image, card, keyframe, or still asset generation from the approved prompt.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'high',
      canRunInParallel: true,
      dependencies: [
        dependency({
          id: `${workItemId}-snapshot`,
          dependencyType: 'blocks_start',
          dependsOnWorkItemId: params.validateWorkItemId,
          reason: 'Provider work may start only after an approved snapshot exists.',
          blocking: true,
        }),
      ],
      expectedOutputs: [
        expectedOutput({
          id: `${workItemId}-image-output`,
          outputType: 'image_asset',
          linkedAssetManifestId: assetId,
          notes: ['Future provider worker writes the generated image into the asset manifest.'],
        }),
      ],
      linkedSegmentIds: [prompt.segmentId ?? ''],
      linkedVisualAssetPlanItemIds: [prompt.assetPlanItemId ?? ''],
      linkedTimingCueIds: timingCueIdsForAsset(visualAsset),
      linkedProviderPromptPlanIds: [prompt.id],
      linkedRendererLayerIds: layerIdsForAsset(params.plan, prompt.assetPlanItemId),
      maxRetries: 2,
      fallbackPolicy: prompt.tierPolicyNotes.length ? prompt.tierPolicyNotes : ['Use approved image fallback or request revision.'],
      checkbackPolicy: ['Future provider webhook or scheduled checkback updates this work item; frontend does not poll providers.'],
      qaChecks: ['Generated image must match prompt, frame background, safe margins, and approved visual purpose.'],
      notes: ['No GPT-Image-2 call is made by this mock planner.'],
    })

    workItems.push(workItem)
    assets.push(createManifestItem({
      id: assetId,
      label: `${prompt.title} image`,
      assetType: 'generated_image',
      parentWorkItemId: workItemId,
      promptPlanId: prompt.id,
      providerModel: prompt.providerModel,
      linkedSegmentIds: [prompt.segmentId ?? ''],
      linkedVisualAssetPlanItemIds: [prompt.assetPlanItemId ?? ''],
      linkedTimingCueIds: timingCueIdsForAsset(visualAsset),
      linkedRendererLayerIds: layerIdsForAsset(params.plan, prompt.assetPlanItemId),
      metadata: { promptType: prompt.planType, targetProvider: prompt.targetProvider },
    }))

    if (prompt.assetPlanItemId) {
      imageAssetByPlanItemId.set(prompt.assetPlanItemId, assetId)
      imageWorkByPlanItemId.set(prompt.assetPlanItemId, workItemId)
    }
  }

  for (const prompt of params.plan.providerPromptPlans ?? []) {
    if (!isProviderPrompt(prompt) || !isVideoPrompt(prompt)) continue

    const visualAsset = assetForPrompt(params.plan, prompt)
    const requiredStartFrameAssetId = prompt.assetPlanItemId ? imageAssetByPlanItemId.get(prompt.assetPlanItemId) : undefined
    const requiredStartFrameWorkId = prompt.assetPlanItemId ? imageWorkByPlanItemId.get(prompt.assetPlanItemId) : undefined
    const workItemId = `work-generate-ai-video-${slug(prompt.id)}`
    const assetId = `asset-ai-video-${slug(prompt.id)}`

    workItems.push(createWorkItem({
      id: workItemId,
      workItemType: 'generate_ai_video_asset',
      agentLayer: 'asset_generation_agent',
      status: requiredStartFrameAssetId ? 'waiting_asset' : 'planned',
      label: `Generate AI video asset: ${prompt.title}`,
      purpose: 'Plan future Wan/Hailuo/Premium-final-fallback video asset generation from the approved prompt.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: prompt.targetProvider === 'veo' ? 'medium' : 'high',
      canRunInParallel: !requiredStartFrameAssetId,
      dependencies: [
        dependency({
          id: `${workItemId}-snapshot`,
          dependencyType: 'blocks_start',
          dependsOnWorkItemId: params.validateWorkItemId,
          reason: 'Provider work may start only after an approved snapshot exists.',
          blocking: true,
        }),
        ...(requiredStartFrameAssetId
          ? [
              dependency({
                id: `${workItemId}-start-frame`,
                dependencyType: 'required_asset',
                dependsOnWorkItemId: requiredStartFrameWorkId,
                dependsOnAssetId: requiredStartFrameAssetId,
                reason: 'Image-to-video generation needs the approved start/keyframe image first.',
                blocking: true,
                fallbackIfMissing: 'Use approved still/card fallback or request review; do not fabricate a start frame.',
              }),
            ]
          : []),
      ],
      expectedOutputs: [
        expectedOutput({
          id: `${workItemId}-video-output`,
          outputType: 'ai_video_clip',
          linkedAssetManifestId: assetId,
          notes: ['Future provider worker writes the AI video clip into the asset manifest.'],
        }),
      ],
      linkedSegmentIds: [prompt.segmentId ?? ''],
      linkedVisualAssetPlanItemIds: [prompt.assetPlanItemId ?? ''],
      linkedTimingCueIds: timingCueIdsForAsset(visualAsset),
      linkedProviderPromptPlanIds: [prompt.id],
      linkedRendererLayerIds: layerIdsForAsset(params.plan, prompt.assetPlanItemId),
      maxRetries: prompt.targetProvider === 'veo' ? 0 : 1,
      fallbackPolicy: prompt.tierPolicyNotes.length ? prompt.tierPolicyNotes : ['Use approved Wan/Hailuo fallback policy; Veo remains Premium final fallback only.'],
      checkbackPolicy: ['Future provider webhook or scheduled checkback updates this work item; frontend does not call provider APIs.'],
      qaChecks: ['Generated clip duration and background must match timing, frame, and renderer placement notes.'],
      notes: ['No Wan, Hailuo, or Veo call is made by this mock planner.'],
    }))

    assets.push(createManifestItem({
      id: assetId,
      label: `${prompt.title} AI video`,
      assetType: 'ai_video_clip',
      parentWorkItemId: workItemId,
      promptPlanId: prompt.id,
      providerModel: prompt.providerModel,
      linkedSegmentIds: [prompt.segmentId ?? ''],
      linkedVisualAssetPlanItemIds: [prompt.assetPlanItemId ?? ''],
      linkedTimingCueIds: timingCueIdsForAsset(visualAsset),
      linkedRendererLayerIds: layerIdsForAsset(params.plan, prompt.assetPlanItemId),
      metadata: { promptType: prompt.planType, targetProvider: prompt.targetProvider, durationSeconds: prompt.durationSeconds },
    }))
  }

  return { providerAssets: assets, providerWorkItems: workItems }
}

function createControlledVisualWorkItems(params: {
  plan: EditPlan
  approvedPlanSnapshotId?: string
  validateWorkItemId: string
}) {
  const workItems: EditWorkItem[] = []
  const assets: EditAssetManifestItem[] = []

  function addControlledVisualWorkItem(config: {
    item: MapAnimationPlanItem | DataVizPlanItem | DepthAwareOverlayPlanItem
    workItemType: EditWorkItemType
    outputType: EditWorkExpectedOutput['outputType']
    assetType: EditAssetManifestItem['assetType']
    label: string
    toolId?: OpenSourceToolId
  }) {
    const workItemId = `work-${config.workItemType}-${slug(config.item.id)}`
    const assetId = `asset-${config.assetType}-${slug(config.item.id)}`

    workItems.push(createWorkItem({
      id: workItemId,
      workItemType: config.workItemType,
      agentLayer: config.workItemType === 'generate_mask_asset' ? 'tool_execution_agent' : 'asset_generation_agent',
      status: 'planned',
      label: config.label,
      purpose: 'Plan a future controlled visual/tool asset and keep its output traceable in the manifest.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: config.workItemType === 'generate_mask_asset' ? 'medium' : 'high',
      canRunInParallel: true,
      dependencies: [
        dependency({
          id: `${workItemId}-snapshot`,
          dependencyType: 'blocks_start',
          dependsOnWorkItemId: params.validateWorkItemId,
          reason: 'Tool or controlled visual work starts only from an approved snapshot.',
          blocking: true,
        }),
      ],
      expectedOutputs: [
        expectedOutput({
          id: `${workItemId}-asset-output`,
          outputType: config.outputType,
          linkedAssetManifestId: assetId,
          notes: ['Future worker produces the controlled asset and updates the manifest.'],
        }),
      ],
      linkedSegmentIds: [config.item.segmentId ?? ''],
      linkedVisualAssetPlanItemIds: [controlledVisualAssetPlanItemId(config.item) ?? ''],
      linkedToolStrategyItemIds: controlledToolStrategyItemIds(config.item),
      linkedRendererLayerIds: layerIdsForAsset(params.plan, controlledVisualAssetPlanItemId(config.item)),
      maxRetries: 1,
      fallbackPolicy: controlledFallbackPolicy(config.item),
      checkbackPolicy: ['Future worker status events update this work item; no local tool execution runs here.'],
      qaChecks: config.item.qaChecks,
      notes: ['No MapLibre, D3/ECharts, browser, mask, or media tool runs in this mock planner.'],
    }))

    assets.push(createManifestItem({
      id: assetId,
      label: config.label,
      assetType: config.assetType,
      parentWorkItemId: workItemId,
      toolId: config.toolId,
      linkedSegmentIds: [config.item.segmentId ?? ''],
      linkedVisualAssetPlanItemIds: [controlledVisualAssetPlanItemId(config.item) ?? ''],
      linkedRendererLayerIds: layerIdsForAsset(params.plan, controlledVisualAssetPlanItemId(config.item)),
      metadata: { sourcePlanItemId: config.item.id },
    }))
  }

  if (params.plan.mapAnimationPlan?.active) {
    for (const item of params.plan.mapAnimationPlan.items) {
      addControlledVisualWorkItem({
        item,
        workItemType: 'render_map_asset',
        outputType: 'map_asset',
        assetType: 'map_visual',
        label: `Render map asset: ${item.title}`,
        toolId: item.toolIds[0],
      })
    }
  }

  if (params.plan.dataVizPlan?.active) {
    for (const item of params.plan.dataVizPlan.items) {
      addControlledVisualWorkItem({
        item,
        workItemType: 'render_chart_asset',
        outputType: 'chart_asset',
        assetType: 'chart_visual',
        label: `Render chart/diagram asset: ${item.title}`,
        toolId: item.toolIds[0],
      })
    }
  }

  for (const item of params.plan.depthAwareOverlayPlan?.items ?? []) {
    if (item.maskStrategy === 'none') continue

    addControlledVisualWorkItem({
      item,
      workItemType: 'generate_mask_asset',
      outputType: 'mask_asset',
      assetType: 'mask_asset',
      label: `Prepare foreground mask asset: ${item.id}`,
      toolId: 'opencv',
    })
  }

  return { controlledAssets: assets, controlledWorkItems: workItems }
}

function toolWorkType(toolId: OpenSourceToolId): EditWorkItemType | undefined {
  if (toolId === 'audioflux') return 'run_audio_analysis'
  if (toolId === 'signalsmith_stretch') return 'run_audio_stretch'
  if (toolId === 'sharp' || toolId === 'openimageio') return 'process_image_asset'
  if (toolId === 'ffmpeg' || toolId === 'vapoursynth' || toolId === 'opencv') return 'process_video_asset'
  if (toolId === 'playwright') return 'capture_browser_asset'
  return undefined
}

function toolOutputType(workItemType: EditWorkItemType): EditWorkExpectedOutput['outputType'] {
  if (workItemType === 'run_audio_analysis' || workItemType === 'run_audio_stretch') return 'processed_audio'
  if (workItemType === 'process_image_asset') return 'image_asset'
  if (workItemType === 'capture_browser_asset') return 'browser_capture_asset'
  return 'processed_video'
}

function manifestAssetTypeForTool(workItemType: EditWorkItemType): EditAssetManifestItem['assetType'] {
  if (workItemType === 'run_audio_analysis' || workItemType === 'run_audio_stretch') return 'audio_asset'
  if (workItemType === 'process_image_asset') return 'generated_image'
  if (workItemType === 'capture_browser_asset') return 'browser_capture'
  return 'processed_video'
}

function createToolWorkItems(params: {
  plan: EditPlan
  approvedPlanSnapshotId?: string
  validateWorkItemId: string
}) {
  const workItems: EditWorkItem[] = []
  const assets: EditAssetManifestItem[] = []

  for (const item of params.plan.toolStrategyPlan?.items ?? []) {
    const toolId = item.primaryToolId
    const workItemType = toolWorkType(toolId)
    if (!workItemType) continue

    const workItemId = `work-${workItemType}-${slug(item.id)}`
    const assetId = `asset-${manifestAssetTypeForTool(workItemType)}-${slug(item.id)}`

    workItems.push(createWorkItem({
      id: workItemId,
      workItemType,
      agentLayer: 'tool_execution_agent',
      status: 'planned',
      label: `Future tool step: ${item.label}`,
      purpose: 'Plan future worker-only tool execution without running tools in the frontend.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: workItemType === 'run_audio_analysis' ? 'medium' : 'low',
      canRunInParallel: true,
      dependencies: [
        dependency({
          id: `${workItemId}-snapshot`,
          dependencyType: 'blocks_start',
          dependsOnWorkItemId: params.validateWorkItemId,
          reason: 'Worker tool execution starts only from an approved snapshot.',
          blocking: true,
        }),
      ],
      expectedOutputs: [
        expectedOutput({
          id: `${workItemId}-tool-output`,
          outputType: toolOutputType(workItemType),
          linkedAssetManifestId: assetId,
          notes: ['Future worker attaches processed output or QA report to the manifest.'],
        }),
      ],
      linkedSegmentIds: [item.segmentId ?? ''],
      linkedVisualAssetPlanItemIds: [item.assetPlanItemId ?? ''],
      linkedToolStrategyItemIds: [item.id],
      maxRetries: 1,
      fallbackPolicy: item.fallbackStrategy,
      checkbackPolicy: ['Future worker status events update this work item; no tool is launched here.'],
      qaChecks: item.qaChecks,
      notes: item.licenseNotes.length
        ? ['Tool remains worker-only and license/dependency review is required before production use.', ...item.licenseNotes]
        : ['Tool remains worker-only; this frontend plan does not execute it.'],
    }))

    assets.push(createManifestItem({
      id: assetId,
      label: `Future output for ${item.label}`,
      assetType: manifestAssetTypeForTool(workItemType),
      parentWorkItemId: workItemId,
      toolId,
      linkedSegmentIds: [item.segmentId ?? ''],
      linkedVisualAssetPlanItemIds: [item.assetPlanItemId ?? ''],
      metadata: { toolStrategyPlanItemId: item.id, workItemType },
    }))
  }

  return { toolAssets: assets, toolWorkItems: workItems }
}

function createRendererWorkItems(params: {
  plan: EditPlan
  approvedPlanSnapshotId?: string
  validateWorkItemId: string
  timingQaWorkItemId: string
  finalQaWorkItemId: string
  assetManifest: EditAssetManifestItem[]
}) {
  const workItems: EditWorkItem[] = []
  const assets: EditAssetManifestItem[] = []
  const assetByVisualPlanItem = new Map<string, EditAssetManifestItem[]>()

  for (const asset of params.assetManifest) {
    for (const visualAssetPlanItemId of asset.linkedVisualAssetPlanItemIds) {
      const existing = assetByVisualPlanItem.get(visualAssetPlanItemId) ?? []
      existing.push(asset)
      assetByVisualPlanItem.set(visualAssetPlanItemId, existing)
    }
  }

  function addLayerWork(layer: RendererLayerPlan) {
    const workItemId = `work-prepare-remotion-layer-${slug(layer.id)}`
    const linkedAssets = layer.assetPlanItemId ? assetByVisualPlanItem.get(layer.assetPlanItemId) ?? [] : []
    const dependencies: EditWorkDependency[] = [
      dependency({
        id: `${workItemId}-snapshot`,
        dependencyType: 'blocks_start',
        dependsOnWorkItemId: params.validateWorkItemId,
        reason: 'Renderer layer work is prepared from the approved snapshot.',
        blocking: true,
      }),
      ...linkedAssets.map((asset) => dependency({
        id: `${workItemId}-${asset.id}-placeholder`,
        dependencyType: 'can_use_placeholder',
        dependsOnAssetId: asset.id,
        reason: 'Browser-safe preview can reserve layer timing/placement while this asset is pending.',
        blocking: false,
        fallbackIfMissing: 'Use placeholder for preview only; final export must wait for required asset.',
      })),
    ]

    workItems.push(createWorkItem({
      id: workItemId,
      workItemType: 'prepare_remotion_layer',
      agentLayer: 'renderer_agent',
      status: linkedAssets.length ? 'waiting_asset' : 'ready',
      label: `Prepare Remotion layer: ${layer.label}`,
      purpose: 'Prepare final compositor layer timing and placement without rendering.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'medium',
      canRunInParallel: true,
      dependencies,
      expectedOutputs: [
        expectedOutput({
          id: `${workItemId}-layer-output`,
          outputType: 'remotion_layer',
          linkedRendererLayerId: layer.id,
          notes: ['Layer metadata is prepared for future Remotion composition.'],
        }),
      ],
      linkedVisualAssetPlanItemIds: [layer.assetPlanItemId ?? ''],
      linkedRendererLayerIds: [layer.id],
      checkbackPolicy: ['If linked assets finish later, reconcile manifest asset IDs into this layer before final render.'],
      qaChecks: ['Layer timing, z-index, safe zone, fit mode, and caption ordering must match the approved renderer plan.'],
      notes: ['No Remotion render is started by this work item.'],
    }))
  }

  for (const layer of params.plan.rendererCompositionPlan?.layers ?? []) {
    addLayerWork(layer)
  }

  const rendererLayerWorkIds = workItems.map((item) => item.id)
  const previewWorkItemId = 'work-render-remotion-preview'
  workItems.push(createWorkItem({
    id: previewWorkItemId,
    workItemType: 'render_remotion_preview',
    agentLayer: 'renderer_agent',
    status: 'planned',
    label: 'Prepare Remotion preview',
    purpose: 'Plan a browser-safe preview path that may use placeholders for nonblocking assets.',
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    priority: 'medium',
    canRunInParallel: false,
    dependencies: rendererLayerWorkIds.map((workItemId) => dependency({
      id: `${previewWorkItemId}-${workItemId}`,
      dependencyType: 'can_use_placeholder',
      dependsOnWorkItemId: workItemId,
      reason: 'Preview can reserve layer timing while assets are pending.',
      blocking: false,
    })),
    expectedOutputs: [expectedOutput({ id: `${previewWorkItemId}-status`, outputType: 'status_update', notes: ['Preview readiness is a future worker/browser-safe state only.'] })],
    linkedRendererLayerIds: params.plan.rendererCompositionPlan?.layers.map((layer) => layer.id) ?? [],
    checkbackPolicy: ['Preview readiness changes only through future structured worker events.'],
    qaChecks: ['Preview must clearly mark placeholders and never claim production render completion.'],
    notes: ['No browser preview rendering is executed here.'],
  }))

  const finalExportWorkItemId = 'work-render-final-export'
  const finalExportAssetId = 'asset-final-export-mock'
  const requiredAssetDependencies = params.assetManifest.map((asset) => dependency({
    id: `${finalExportWorkItemId}-${asset.id}`,
    dependencyType: 'required_asset',
    dependsOnAssetId: asset.id,
    reason: 'Final render must wait for required asset manifest entries and QA.',
    blocking: true,
    fallbackIfMissing: 'Use approved fallback or request revision before final export.',
  }))

  workItems.push(createWorkItem({
    id: finalExportWorkItemId,
    workItemType: 'render_final_export',
    agentLayer: 'renderer_agent',
    status: 'blocked',
    label: 'Render final export',
    purpose: 'Plan final Remotion export after required assets, layer preparation, and QA are complete.',
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    priority: 'critical',
    canRunInParallel: false,
    dependencies: [
      ...requiredAssetDependencies,
      ...rendererLayerWorkIds.map((workItemId) => dependency({
        id: `${finalExportWorkItemId}-${workItemId}`,
        dependencyType: 'blocks_finish',
        dependsOnWorkItemId: workItemId,
        reason: 'Final export waits for prepared Remotion layer metadata.',
        blocking: true,
      })),
      dependency({
        id: `${finalExportWorkItemId}-timing-qa`,
        dependencyType: 'qa_after',
        dependsOnWorkItemId: params.timingQaWorkItemId,
        reason: 'Final export waits for timing QA.',
        blocking: true,
      }),
      dependency({
        id: `${finalExportWorkItemId}-final-qa`,
        dependencyType: 'qa_after',
        dependsOnWorkItemId: params.finalQaWorkItemId,
        reason: 'Final export waits for final QA.',
        blocking: true,
      }),
    ],
    expectedOutputs: [
      expectedOutput({
        id: `${finalExportWorkItemId}-export-output`,
        outputType: 'final_export',
        linkedAssetManifestId: finalExportAssetId,
        notes: ['Future render worker writes the final export to storage and updates the manifest.'],
      }),
    ],
    linkedRendererLayerIds: params.plan.rendererCompositionPlan?.layers.map((layer) => layer.id) ?? [],
    maxRetries: 0,
    fallbackPolicy: ['Do not render final export until required assets and QA are complete.'],
    checkbackPolicy: ['Future render worker status events update export state; no Remotion rendering runs here.'],
    qaChecks: ['Final render must pass asset, timing, layout, audio, model-policy, and user-intent QA.'],
    notes: ['No final render is executed by this mock execution graph.'],
  }))

  assets.push(createManifestItem({
    id: finalExportAssetId,
    label: 'Final export placeholder',
    assetType: 'final_export',
    parentWorkItemId: finalExportWorkItemId,
    linkedRendererLayerIds: params.plan.rendererCompositionPlan?.layers.map((layer) => layer.id) ?? [],
    metadata: { rendererCompositionPlanId: params.plan.rendererCompositionPlan?.id },
    notes: ['Final export remains planned only; no render file exists.'],
  }))

  return { rendererAssets: assets, rendererWorkItems: workItems }
}

function createAssetQaWorkItems(params: {
  assetManifest: EditAssetManifestItem[]
  approvedPlanSnapshotId?: string
}) {
  return params.assetManifest
    .filter((asset) => asset.assetType !== 'final_export')
    .map((asset) => createWorkItem({
      id: `work-run-asset-qa-${slug(asset.id)}`,
      workItemType: 'run_asset_qa',
      agentLayer: 'qa_agent',
      status: 'planned',
      label: `QA asset: ${asset.label}`,
      purpose: 'Plan QA for a generated or processed asset after it is ready.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'medium',
      canRunInParallel: true,
      dependencies: [
        dependency({
          id: `work-run-asset-qa-${slug(asset.id)}-asset`,
          dependencyType: 'qa_after',
          dependsOnAssetId: asset.id,
          reason: 'Asset QA runs after the asset is generated or processed.',
          blocking: true,
        }),
      ],
      expectedOutputs: [expectedOutput({ id: `work-run-asset-qa-${slug(asset.id)}-report`, outputType: 'qa_report', notes: ['QA report updates asset manifest status.'] })],
      linkedSegmentIds: asset.linkedSegmentIds,
      linkedVisualAssetPlanItemIds: asset.linkedVisualAssetPlanItemIds,
      linkedTimingCueIds: asset.linkedTimingCueIds,
      linkedProviderPromptPlanIds: asset.promptPlanId ? [asset.promptPlanId] : [],
      linkedToolStrategyItemIds: [],
      linkedRendererLayerIds: asset.linkedRendererLayerIds,
      fallbackPolicy: ['If QA fails, use approved fallback relationship and create replacement manifest item.'],
      checkbackPolicy: ['QA worker posts structured result; no manual memory is used to remember asset state.'],
      qaChecks: ['Check asset exists, matches approved plan, preserves frame/layout/timing policy, and is safe to merge.'],
      notes: ['No real QA tool or media inspection runs in this mock graph.'],
    }))
}

function createCheckpoints(workItems: EditWorkItem[], assetManifest: EditAssetManifestItem[]) {
  const blockedWorkItemIds = workItems.filter((item) => item.status === 'blocked').map((item) => item.id)
  const pendingWorkItemIds = workItems.filter((item) => item.status !== 'complete' && item.status !== 'merged').map((item) => item.id)
  const readyToMergeAssetIds = assetManifest.filter((asset) => asset.lifecycleStatus === 'ready').map((asset) => asset.id)

  return [
    {
      id: 'checkpoint-setup-validated',
      label: 'Setup validated',
      completedWorkItemIds: [],
      pendingWorkItemIds: pendingWorkItemIds.slice(0, 8),
      blockedWorkItemIds: blockedWorkItemIds.slice(0, 8),
      readyToMergeAssetIds,
      currentFocus: 'Wait for approval and approved snapshot before execution.',
      nextActions: ['Freeze approved snapshot.', 'Activate ready work items from the graph.'],
      notes: ['This checkpoint is mock-only and records no completed execution.'],
    },
    {
      id: 'checkpoint-source-cleanup-ready',
      label: 'Source cleanup ready',
      completedWorkItemIds: [],
      pendingWorkItemIds: workItems.filter((item) => item.workItemType === 'prepare_source_trim' || item.workItemType === 'select_retake').map((item) => item.id),
      blockedWorkItemIds: blockedWorkItemIds.filter((id) => /source|retake|meaning/.test(id)),
      readyToMergeAssetIds,
      currentFocus: 'Resolve source cleanup and trim review dependencies before trim execution.',
      nextActions: ['Use approved trim decisions only.', 'Keep risky retake/meaning items in user review.'],
      notes: ['No real trimming or media analysis runs here.'],
    },
    {
      id: 'checkpoint-timing-ready',
      label: 'Timing ready',
      completedWorkItemIds: [],
      pendingWorkItemIds: workItems.filter((item) => item.agentLayer === 'timing_agent').map((item) => item.id),
      blockedWorkItemIds: blockedWorkItemIds.filter((id) => /timing|soundsync/.test(id)),
      readyToMergeAssetIds,
      currentFocus: 'Carry frame-accurate timing into renderer and QA work.',
      nextActions: ['Validate captions, visual cues, SoundSync, and final layer timing.'],
      notes: ['Timing validation remains structured/mock-only.'],
    },
    {
      id: 'checkpoint-asset-generation-requested',
      label: 'Asset generation requested',
      completedWorkItemIds: [],
      pendingWorkItemIds: workItems.filter((item) => item.agentLayer === 'asset_generation_agent' || item.agentLayer === 'tool_execution_agent').map((item) => item.id),
      blockedWorkItemIds: blockedWorkItemIds.filter((id) => /asset|tool|generate|render-map|render-chart/.test(id)),
      readyToMergeAssetIds,
      currentFocus: 'Track provider/tool assets through manifest entries and checkback policies.',
      nextActions: ['Continue independent layer/timing/QA preparation while assets are pending.'],
      notes: ['No provider or worker requests are created in this frontend milestone.'],
    },
    {
      id: 'checkpoint-renderer-layers-prepared',
      label: 'Renderer layers prepared',
      completedWorkItemIds: [],
      pendingWorkItemIds: workItems.filter((item) => item.workItemType === 'prepare_remotion_layer').map((item) => item.id),
      blockedWorkItemIds: blockedWorkItemIds.filter((id) => /remotion|render/.test(id)),
      readyToMergeAssetIds,
      currentFocus: 'Prepare layer metadata and wait on required final assets before export.',
      nextActions: ['Use placeholders for preview only.', 'Require real asset manifest items for final export.'],
      notes: ['No Remotion render is executed.'],
    },
    {
      id: 'checkpoint-final-export-ready-mock',
      label: 'Final export ready mock',
      completedWorkItemIds: [],
      pendingWorkItemIds: workItems.filter((item) => item.workItemType === 'render_final_export' || item.workItemType === 'run_final_qa').map((item) => item.id),
      blockedWorkItemIds: blockedWorkItemIds.filter((id) => /final|export/.test(id)),
      readyToMergeAssetIds,
      currentFocus: 'Final export remains blocked until required assets and QA pass in future workers.',
      nextActions: ['Do not render until dependencies and QA are complete.'],
      notes: ['This is a mock readiness checkpoint only.'],
    },
  ]
}

export function createEditingAgentExecutionPlan(params: {
  plan: EditPlan
  approvedPlanSnapshotId?: string
}): EditingAgentExecutionPlan {
  const validateWorkItemId = 'work-validate-approved-snapshot'
  const sourceTrimReady = params.plan.sourceCleanupPlan?.status === 'confirmed' && !params.plan.trimReviewPlan?.approvalBlocked
  const retakeNeedsReview = (params.plan.trimReviewPlan?.retakeSelectionPlan.userReviewRequiredCount ?? 0) > 0
  const meaningNeedsReview = Boolean(params.plan.trimReviewPlan?.meaningPreservationValidationPlan.userReviewRequired)
  const timingQaWorkItemId = 'work-run-timing-qa'
  const finalQaWorkItemId = 'work-run-final-qa'

  const foundationalWorkItems: EditWorkItem[] = [
    createWorkItem({
      id: validateWorkItemId,
      workItemType: 'validate_approved_snapshot',
      agentLayer: 'editing_supervisor_agent',
      status: params.approvedPlanSnapshotId ? 'ready' : 'blocked',
      label: 'Validate approved snapshot',
      purpose: 'Confirm that future workers execute an immutable approved snapshot, not raw chat.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'critical',
      canRunInParallel: false,
      expectedOutputs: [expectedOutput({ id: `${validateWorkItemId}-status`, outputType: 'status_update', notes: ['Execution source is approved snapshot only.'] })],
      fallbackPolicy: ['If no approved snapshot exists, do not start worker/provider/tool/render work.'],
      checkbackPolicy: ['Supervisor resumes from stored snapshot and work graph state.'],
      qaChecks: ['Approved snapshot includes timing, trim, prompts, credits, and fallback policy.'],
    }),
    createWorkItem({
      id: 'work-prepare-source-trim',
      workItemType: 'prepare_source_trim',
      agentLayer: 'editing_supervisor_agent',
      status: sourceTrimReady ? 'ready' : 'waiting_user_review',
      label: 'Prepare source trim decisions',
      purpose: 'Convert approved source cleanup decisions into future trim work items.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'high',
      canRunInParallel: true,
      dependencies: [
        dependency({ id: 'work-prepare-source-trim-snapshot', dependencyType: 'blocks_start', dependsOnWorkItemId: validateWorkItemId, reason: 'Trim execution needs approved cleanup decisions from the snapshot.', blocking: true }),
        ...(!sourceTrimReady ? [dependency({ id: 'work-prepare-source-trim-review', dependencyType: 'user_review_required', reason: 'Cleanup or trim review is unresolved.', blocking: true })] : []),
      ],
      expectedOutputs: [expectedOutput({ id: 'work-prepare-source-trim-output', outputType: 'status_update', notes: ['Future worker receives approved trim decisions.'] })],
      qaChecks: params.plan.sourceCleanupPlan?.qaChecks ?? ['Trim decisions must have reasons and preserve meaning.'],
      notes: ['No real trimming, FFmpeg, or VapourSynth execution runs here.'],
    }),
    createWorkItem({
      id: 'work-select-retake',
      workItemType: 'select_retake',
      agentLayer: 'editing_supervisor_agent',
      status: retakeNeedsReview ? 'waiting_user_review' : 'ready',
      label: 'Resolve retake selections',
      purpose: 'Use approved retake selection records or request review for ambiguous takes.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: retakeNeedsReview ? 'high' : 'medium',
      canRunInParallel: true,
      dependencies: retakeNeedsReview ? [dependency({ id: 'work-select-retake-review', dependencyType: 'user_review_required', reason: 'One or more retake groups require user review.', blocking: true })] : [],
      expectedOutputs: [expectedOutput({ id: 'work-select-retake-output', outputType: 'status_update', notes: ['Selected take IDs remain stored in TrimReviewPlan.'] })],
      qaChecks: ['Retake selections include reasons, confidence, selected candidates, and alternates.'],
    }),
    createWorkItem({
      id: 'work-validate-meaning-preservation',
      workItemType: 'validate_meaning_preservation',
      agentLayer: 'editing_supervisor_agent',
      status: meaningNeedsReview || params.plan.trimReviewPlan?.approvalBlocked ? 'waiting_user_review' : 'ready',
      label: 'Validate meaning preservation',
      purpose: 'Ensure future trim work does not distort claims, context, proof, tutorials, or emotional beats.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: params.plan.trimReviewPlan?.approvalBlocked ? 'critical' : 'high',
      canRunInParallel: true,
      dependencies: params.plan.trimReviewPlan?.approvalBlocked ? [dependency({ id: 'work-validate-meaning-review', dependencyType: 'user_review_required', reason: 'Meaning preservation blocks approval or requires review.', blocking: true })] : [],
      expectedOutputs: [expectedOutput({ id: 'work-validate-meaning-output', outputType: 'qa_report', notes: ['Meaning preservation status remains structured in TrimReviewPlan.'] })],
      qaChecks: params.plan.trimReviewPlan?.qaChecks ?? ['Risky cuts require review before execution.'],
    }),
    createWorkItem({
      id: 'work-prepare-caption-timing',
      workItemType: 'prepare_caption_timing',
      agentLayer: 'timing_agent',
      status: params.plan.captionVisualCueTimingPlan ? 'ready' : 'planned',
      label: 'Prepare caption timing',
      purpose: 'Carry refined caption timing into future render and QA work.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'medium',
      canRunInParallel: true,
      expectedOutputs: [expectedOutput({ id: 'work-prepare-caption-timing-output', outputType: 'status_update', notes: ['Caption timing is already represented as frame-accurate plan data.'] })],
      qaChecks: params.plan.captionVisualCueTimingPlan?.qaChecks.map((item) => item.label) ?? ['Captions must remain readable and collision-safe.'],
    }),
    createWorkItem({
      id: 'work-prepare-visual-cue-timing',
      workItemType: 'prepare_visual_cue_timing',
      agentLayer: 'timing_agent',
      status: params.plan.captionVisualCueTimingPlan ? 'ready' : 'planned',
      label: 'Prepare visual cue timing',
      purpose: 'Carry visual reveal/hold/exit cue timing into future layer work.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'medium',
      canRunInParallel: true,
      expectedOutputs: [expectedOutput({ id: 'work-prepare-visual-cue-timing-output', outputType: 'status_update', notes: ['Visual cue timing remains frame-accurate plan data.'] })],
      qaChecks: ['Visual read time and caption/visual collision rules remain protected.'],
    }),
    createWorkItem({
      id: 'work-prepare-soundsync-timing',
      workItemType: 'prepare_soundsync_timing',
      agentLayer: 'timing_agent',
      status: params.plan.soundSyncTransitionTimingPlan?.status === 'needs_audioflux_analysis' ? 'waiting_worker' : 'ready',
      label: 'Prepare SoundSync timing',
      purpose: 'Carry beat-aware transition, SFX, and ducking timing into future execution.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'medium',
      canRunInParallel: true,
      expectedOutputs: [expectedOutput({ id: 'work-prepare-soundsync-timing-output', outputType: 'status_update', notes: ['SoundSync timing remains speech-first and mock-only.'] })],
      fallbackPolicy: ['If real AudioFlux analysis is unavailable, use phrase cuts and speech-first transition timing.'],
      checkbackPolicy: ['Future AudioFlux worker posts structured beat-grid status; frontend does not run audio analysis.'],
      qaChecks: params.plan.soundSyncTransitionTimingPlan?.qaChecks.map((item) => item.label) ?? ['Music beat alignment must not override speech clarity.'],
    }),
    createWorkItem({
      id: timingQaWorkItemId,
      workItemType: 'run_timing_qa',
      agentLayer: 'qa_agent',
      status: 'planned',
      label: 'Run timing QA',
      purpose: 'Validate frame-accurate timing plans before future render work finishes.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'high',
      canRunInParallel: true,
      dependencies: [
        dependency({ id: `${timingQaWorkItemId}-caption`, dependencyType: 'qa_after', dependsOnWorkItemId: 'work-prepare-caption-timing', reason: 'Timing QA checks captions.', blocking: true }),
        dependency({ id: `${timingQaWorkItemId}-visual`, dependencyType: 'qa_after', dependsOnWorkItemId: 'work-prepare-visual-cue-timing', reason: 'Timing QA checks visual cues.', blocking: true }),
        dependency({ id: `${timingQaWorkItemId}-soundsync`, dependencyType: 'qa_after', dependsOnWorkItemId: 'work-prepare-soundsync-timing', reason: 'Timing QA checks SoundSync transition timing.', blocking: true }),
      ],
      expectedOutputs: [expectedOutput({ id: `${timingQaWorkItemId}-report`, outputType: 'qa_report', notes: ['Timing QA report remains structured plan data.'] })],
      qaChecks: params.plan.timingValidationPlan?.qaChecks ?? ['Validate timing plans before final render.'],
      notes: ['No Remotion, transcript, audio, or media inspection runs here.'],
    }),
    createWorkItem({
      id: finalQaWorkItemId,
      workItemType: 'run_final_qa',
      agentLayer: 'qa_agent',
      status: 'planned',
      label: 'Run final QA',
      purpose: 'Plan final QA gate for assets, timing, layout, model policy, audio, and user intent.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'critical',
      canRunInParallel: false,
      dependencies: [
        dependency({ id: `${finalQaWorkItemId}-timing`, dependencyType: 'qa_after', dependsOnWorkItemId: timingQaWorkItemId, reason: 'Final QA includes timing QA status.', blocking: true }),
      ],
      expectedOutputs: [expectedOutput({ id: `${finalQaWorkItemId}-report`, outputType: 'qa_report', notes: ['Final QA report is required before final export.'] })],
      fallbackPolicy: ['If QA fails, use approved fallback policy or request user revision.'],
      checkbackPolicy: ['Future QA worker writes structured findings and unblocks final export only when passed.'],
      qaChecks: params.plan.editQAPlan?.globalChecks.map((item) => item.label) ?? ['Final QA must pass before export.'],
      notes: ['No media QA tools execute in this mock graph.'],
    }),
  ]

  if ((params.plan.trimReviewPlan?.nextUserQuestions.length ?? 0) > 0) {
    foundationalWorkItems.push(createWorkItem({
      id: 'work-request-user-review',
      workItemType: 'request_user_review',
      agentLayer: 'revision_agent',
      status: 'waiting_user_review',
      label: 'Request user review',
      purpose: 'Ask for structured review when cleanup, retakes, or meaning preservation are unresolved.',
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      priority: 'critical',
      canRunInParallel: false,
      dependencies: [dependency({ id: 'work-request-user-review-trim', dependencyType: 'user_review_required', reason: 'TrimReviewPlan includes unresolved user questions.', blocking: true })],
      expectedOutputs: [expectedOutput({ id: 'work-request-user-review-output', outputType: 'status_update', notes: params.plan.trimReviewPlan?.nextUserQuestions ?? [] })],
      qaChecks: ['User review must be resolved before affected execution work continues.'],
    }))
  }

  const { providerAssets, providerWorkItems } = createProviderWorkItems({
    plan: params.plan,
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    validateWorkItemId,
  })
  const { controlledAssets, controlledWorkItems } = createControlledVisualWorkItems({
    plan: params.plan,
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    validateWorkItemId,
  })
  const { toolAssets, toolWorkItems } = createToolWorkItems({
    plan: params.plan,
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    validateWorkItemId,
  })

  const assetsBeforeRenderer = [...providerAssets, ...controlledAssets, ...toolAssets]
  const { rendererAssets, rendererWorkItems } = createRendererWorkItems({
    plan: params.plan,
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    validateWorkItemId,
    timingQaWorkItemId,
    finalQaWorkItemId,
    assetManifest: assetsBeforeRenderer,
  })

  const assetManifest = [...assetsBeforeRenderer, ...rendererAssets]
  const assetQaWorkItems = createAssetQaWorkItems({
    assetManifest,
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
  })
  const workItems = [...foundationalWorkItems, ...providerWorkItems, ...controlledWorkItems, ...toolWorkItems, ...rendererWorkItems, ...assetQaWorkItems]
  const blockingWorkItemIds = workItems.filter((item) => item.status === 'blocked').map((item) => item.id)
  const readyWorkItemIds = workItems.filter((item) => item.status === 'ready').map((item) => item.id)
  const waitingWorkItemIds = workItems.filter((item) => providerWaitingStatuses.includes(item.status)).map((item) => item.id)
  const qaWorkItemIds = workItems.filter((item) => item.agentLayer === 'qa_agent' || item.workItemType === 'run_asset_qa').map((item) => item.id)
  const parallelGroups = [
    {
      id: 'parallel-group-timing-and-trim',
      label: 'Timing and trim preparation',
      workItemIds: workItems
        .filter((item) => item.canRunInParallel && ['prepare_source_trim', 'select_retake', 'prepare_caption_timing', 'prepare_visual_cue_timing', 'prepare_soundsync_timing'].includes(item.workItemType))
        .map((item) => item.id),
      reason: 'Cleanup/timing preparation can proceed independently once approval dependencies are satisfied.',
    },
    {
      id: 'parallel-group-provider-assets',
      label: 'Independent provider assets',
      workItemIds: providerWorkItems.filter((item) => item.canRunInParallel).map((item) => item.id),
      reason: 'Independent image/video asset requests do not block unrelated planning work.',
    },
    {
      id: 'parallel-group-controlled-assets',
      label: 'Controlled tool/visual assets',
      workItemIds: [...controlledWorkItems, ...toolWorkItems].filter((item) => item.canRunInParallel).map((item) => item.id),
      reason: 'Map/chart/mask/tool specs can be prepared while provider assets are pending.',
    },
    {
      id: 'parallel-group-renderer-placeholders',
      label: 'Renderer placeholder preparation',
      workItemIds: rendererWorkItems.filter((item) => item.workItemType === 'prepare_remotion_layer' && item.canRunInParallel).map((item) => item.id),
      reason: 'Layer timing and placeholder slots can be prepared before required assets finish.',
    },
  ].filter((group) => group.workItemIds.length > 0)

  return {
    id: 'editing-agent-execution-plan-mock-v1',
    runMode: 'mock_execution_plan',
    summary: 'Mock async execution graph for approved-snapshot future workers. Independent work can continue while provider/tool assets are pending, but final render waits for required assets and QA.',
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    planningModelLabel: 'planning_model',
    editingSupervisorModelLabel: 'editing_supervisor_model',
    workItems,
    assetManifest,
    checkpoints: createCheckpoints(workItems, assetManifest),
    parallelGroups,
    blockingWorkItemIds,
    readyWorkItemIds,
    waitingWorkItemIds,
    qaWorkItemIds,
    globalRules: [
      'Workers execute approved snapshots, not raw chat.',
      'All pending jobs and assets live in work items, dependencies, manifests, checkpoints, and event logs.',
      'Independent work may continue while provider/tool jobs are pending.',
      'Required dependencies block only affected downstream work.',
      'Final render waits for required assets and QA.',
      'Provider models and open-source tools remain separate execution surfaces.',
    ],
    limitations: [
      'Mock execution graph only.',
      'No workers executed.',
      'No provider APIs called.',
      'No tools, queues, storage writes, Remotion renders, or media processing run.',
      'Real execution requires approved snapshot and future backend/worker infrastructure.',
    ],
    notes: [
      'The graph is a future-worker contract, not a runnable queue in this frontend demo.',
      'Asset manifest entries use local_mock storage to prevent context loss without writing assets.',
      'Checkback policies are structured notes for future provider webhooks, polling, or scheduled worker events.',
    ],
  }
}
