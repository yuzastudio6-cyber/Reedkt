import type {
  AdaptiveEditStrategyPlan,
  AudioPipelinePlan,
  BrollPlan,
  CaptionPlan,
  ClipSource,
  ColorGradePlan,
  ColorPipelinePlan,
  CompiledEditingIntent,
  EditLevel,
  EditOperationPlan,
  EditSegmentRole,
  FallbackStep,
  PlannerInput,
  ProfessionalEditingDirective,
  RendererCompositionPlan,
  SegmentEditPlan,
  SegmentQAPlanItem,
  SoundPlan,
  TimeRange,
  TransitionPlan,
  VisualAssetPlanItem,
} from '../types/reeditpro'

type SegmentSeed = {
  role: EditSegmentRole
  label: string
  storyPurpose: string
  spokenTextSummary: string
}

type SegmentBase = Omit<SegmentEditPlan, 'operations' | 'qaPlan'>

function clipDurationSeconds(clip: ClipSource | undefined) {
  if (!clip) {
    return 6
  }

  const parts = clip.duration.split(':').map(Number)

  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return parts[0] * 60 + parts[1]
  }

  return 6
}

function formatRange(range: TimeRange) {
  return `${range.startSeconds.toFixed(0)}-${range.endSeconds.toFixed(0)}s`
}

function fallbackActionsForLevel(editLevel: EditLevel): FallbackStep[] {
  if (editLevel === 'premium') {
    return [
      {
        action: 'try_fallback_model',
        label: 'Try Hailuo fallback',
        model: 'hailuo_2_3_fast',
        reason: 'Premium can use normal animation fallback before any rescue path.',
      },
      {
        action: 'split_scene',
        label: 'Split scene',
        reason: 'Reduce complexity before considering a final rescue.',
      },
      {
        action: 'try_fallback_model',
        label: 'Veo Lite final rescue only',
        model: 'veo_3_1_lite',
        premiumOnly: true,
        reason: 'Premium may use Veo Lite only as final fallback/rescue, never as default.',
      },
    ]
  }

  return [
    {
      action: 'simplify_prompt',
      label: 'Simplify instruction',
      reason: 'Keep the edit inside the approved tier and credit depth.',
    },
    {
      action: 'convert_to_still',
      label: 'Convert to still',
      reason: 'Use a professional lower-compute fallback instead of unavailable model routes.',
    },
    {
      action: 'convert_to_motion_design',
      label: 'Convert to motion design',
      reason: 'Use controlled editor motion when AI video is not needed.',
    },
    {
      action: 'manual_review',
      label: 'Manual review',
      reason: 'Ask for review if the requested edit cannot be completed inside the approved plan.',
    },
  ]
}

function segmentSeedsForCategory(category: PlannerInput['editingCategory']): SegmentSeed[] {
  const byCategory: Record<PlannerInput['editingCategory'], SegmentSeed[]> = {
    storytelling: [
      {
        role: 'hook',
        label: 'Hook / strongest line',
        storyPurpose: 'Open on the strongest emotional or story-relevant line.',
        spokenTextSummary: 'The most compelling line starts the edit.',
      },
      {
        role: 'setup',
        label: 'Setup context',
        storyPurpose: 'Give enough context for the viewer to understand the situation.',
        spokenTextSummary: 'Briefly establish who, where, and what is happening.',
      },
      {
        role: 'reveal',
        label: 'Reveal or turning point',
        storyPurpose: 'Use the clearest shift, conflict, or surprise beat.',
        spokenTextSummary: 'The story changes direction here.',
      },
      {
        role: 'emotional_beat',
        label: 'Reaction / consequence',
        storyPurpose: 'Let the consequence or emotional reaction land.',
        spokenTextSummary: 'The viewer understands the impact.',
      },
      {
        role: 'ending',
        label: 'Clean ending',
        storyPurpose: 'Close with a resolved final beat or next-step line.',
        spokenTextSummary: 'End cleanly without adding random effects.',
      },
    ],
    lifestyle: [
      {
        role: 'hook',
        label: 'Natural opening',
        storyPurpose: 'Start with a relaxed, watchable first moment.',
        spokenTextSummary: 'Open with the most natural creator moment.',
      },
      {
        role: 'b_roll_support',
        label: 'Atmosphere support',
        storyPurpose: 'Use uploaded atmosphere or detail footage only where it supports the moment.',
        spokenTextSummary: 'Support the mood without overproducing.',
      },
      {
        role: 'emotional_beat',
        label: 'Key lifestyle moment',
        storyPurpose: 'Highlight the useful, personal, or aspirational beat.',
        spokenTextSummary: 'Let the main moment breathe.',
      },
      {
        role: 'ending',
        label: 'Warm close',
        storyPurpose: 'End naturally with clean pacing and simple polish.',
        spokenTextSummary: 'Close without heavy effects.',
      },
    ],
    business_brand: [
      {
        role: 'hook',
        label: 'Problem opener',
        storyPurpose: 'Open on the audience problem or strongest promise.',
        spokenTextSummary: 'The problem or offer becomes clear immediately.',
      },
      {
        role: 'explanation',
        label: 'Product / service explanation',
        storyPurpose: 'Explain the offer with clean structure and no clutter.',
        spokenTextSummary: 'Show what the product or service does.',
      },
      {
        role: 'proof',
        label: 'Feature or proof point',
        storyPurpose: 'Use proof, product detail, or result-focused visuals.',
        spokenTextSummary: 'Make the value concrete.',
      },
      {
        role: 'call_to_action',
        label: 'CTA',
        storyPurpose: 'End with a clear next step.',
        spokenTextSummary: 'Close on the next action.',
      },
    ],
    education_explainer: [
      {
        role: 'title_card',
        label: 'Concept setup',
        storyPurpose: 'Name the concept and give viewers the learning frame.',
        spokenTextSummary: 'Define what will be explained.',
      },
      {
        role: 'explanation',
        label: 'Step / framework',
        storyPurpose: 'Break the idea into structured steps.',
        spokenTextSummary: 'Show the steps clearly.',
      },
      {
        role: 'visual_explainer',
        label: 'Diagram or example',
        storyPurpose: 'Use controlled visual explanation where it improves learning.',
        spokenTextSummary: 'Make the abstract idea concrete.',
      },
      {
        role: 'recap',
        label: 'Recap',
        storyPurpose: 'Summarize the takeaway with clear captions.',
        spokenTextSummary: 'Reinforce the main lesson.',
      },
    ],
    documentary_case_study: [
      {
        role: 'hook',
        label: 'Case setup',
        storyPurpose: 'Open with the case question or timeline tension.',
        spokenTextSummary: 'Set up what happened without overclaiming.',
      },
      {
        role: 'evidence_card',
        label: 'Timeline / name card',
        storyPurpose: 'Orient the viewer with neutral identity or timeline context.',
        spokenTextSummary: 'Introduce verified names, dates, or roles carefully.',
      },
      {
        role: 'proof',
        label: 'Evidence / proof moment',
        storyPurpose: 'Show the proof point with neutral visual language.',
        spokenTextSummary: 'Present evidence without random drama.',
      },
      {
        role: 'explanation',
        label: 'Explanation / reenactment',
        storyPurpose: 'Explain the event or selected action without claiming more than the footage supports.',
        spokenTextSummary: 'Clarify what the evidence suggests.',
      },
      {
        role: 'ending',
        label: 'Outcome / summary',
        storyPurpose: 'Close with the known outcome or unresolved status.',
        spokenTextSummary: 'Summarize carefully and neutrally.',
      },
    ],
  }

  return byCategory[category]
}

function clipForSegment(clips: ClipSource[], index: number) {
  if (clips.length === 0) {
    return undefined
  }

  return clips[index % clips.length]
}

function segmentDuration(editLevel: EditLevel, index: number, clip: ClipSource | undefined) {
  const clipDuration = clipDurationSeconds(clip)
  const base = editLevel === 'premium' ? 6 : editLevel === 'pro' ? 5 : 4
  return Math.max(3, Math.min(base + (index % 2), clipDuration))
}

function mapVisualAssetsToSegments(visualAssetPlan: VisualAssetPlanItem[] | undefined, segmentCount: number) {
  const mapped = Array.from({ length: segmentCount }, () => [] as string[])

  visualAssetPlan?.forEach((asset, index) => {
    mapped[index % segmentCount].push(asset.id)
  })

  return mapped
}

function mapRendererLayersToVisualAssets(rendererCompositionPlan: RendererCompositionPlan | undefined) {
  const mapped = new Map<string, string[]>()

  rendererCompositionPlan?.layers.forEach((layer) => {
    if (!layer.assetPlanItemId) {
      return
    }

    const existing = mapped.get(layer.assetPlanItemId) ?? []
    existing.push(layer.id)
    mapped.set(layer.assetPlanItemId, existing)
  })

  return mapped
}

export function getDefaultCaptionPlan(directive: ProfessionalEditingDirective, editLevel: EditLevel): CaptionPlan {
  return {
    style: directive.captionStyle,
    placement: 'Caption safe zone, face-safe and panel-safe',
    maxLines: editLevel === 'basic' ? 2 : 3,
    keywordEmphasis: editLevel !== 'basic' && directive.captionStyle !== 'clean_subtitle',
    faceSafe: true,
    animationStyle: editLevel === 'basic' ? 'simple fade' : 'subtle emphasis timed to speech',
    notes: [
      'Readable captions only.',
      'Do not cover faces, products, or AI visual panels.',
      editLevel === 'basic' ? 'Keep caption treatment simple and professional.' : 'Use style-specific emphasis where it supports meaning.',
    ],
  }
}

export function getDefaultBrollPlan(directive: ProfessionalEditingDirective, editLevel: EditLevel): BrollPlan {
  return {
    policy: directive.brollPolicy,
    sourcePriority: ['uploaded footage first', 'visual asset plan second', 'AI-generated support only after approval'],
    timingRule: editLevel === 'basic' ? 'Use only on key support moments.' : 'Place b-roll by segment meaning and pacing.',
    meaningRule: 'B-roll must support the spoken point or proof moment.',
    avoidRules: ['No random b-roll.', ...directive.avoidRules.filter((rule) => rule.toLowerCase().includes('b-roll'))],
    notes: [
      editLevel === 'basic' ? 'Prefer existing clips and stills.' : 'Plan b-roll intentionally by segment.',
      'Do not use b-roll as filler.',
    ],
  }
}

export function getDefaultColorGradePlan(directive: ProfessionalEditingDirective, editLevel: EditLevel): ColorGradePlan {
  return {
    style: directive.colorGradeStyle,
    intensity: editLevel === 'premium' ? 'strong' : editLevel === 'pro' ? 'medium' : 'light',
    operations: [
      'exposure correction',
      'white balance',
      'contrast curve',
      'skin tone protection',
      editLevel === 'basic' ? 'basic shot matching' : 'style-specific shot matching',
    ],
    skinToneProtection: true,
    shotMatching: true,
    avoidRules: ['No random LUT strength.', 'Do not damage skin tones or product colors.'],
    notes: [
      editLevel === 'basic' ? 'Clean natural correction, not low quality.' : 'Match the selected style while keeping footage believable.',
    ],
  }
}

export function getDefaultSoundPlan(directive: ProfessionalEditingDirective, editLevel: EditLevel): SoundPlan {
  return {
    style: directive.soundStyle,
    voiceCleanup: true,
    musicBed: !directive.avoidRules.some((rule) => rule.toLowerCase().includes('no music')),
    ducking: editLevel !== 'basic',
    sfx: editLevel === 'basic' ? ['subtle transition support only'] : ['subtle impact', 'transition support', 'beat marker'],
    avoidRules: ['Do not overpower the voice.', ...directive.avoidRules.filter((rule) => rule.toLowerCase().includes('music'))],
    notes: [
      'Voice remains the priority.',
      editLevel === 'premium' ? 'Advanced SoundSync is planned after approval.' : 'Keep SoundSync controlled and useful.',
    ],
  }
}

export function getDefaultTransitionPlan(directive: ProfessionalEditingDirective, editLevel: EditLevel): TransitionPlan {
  return {
    families: directive.transitionFamilies,
    preferredTransitions:
      editLevel === 'basic'
        ? ['hard cut', 'cut on word', 'cutaway']
        : ['cut on action', 'motivated cut', 'subtle slide', 'beat-synced cut'],
    intensity: editLevel === 'premium' ? 'strong' : editLevel === 'pro' ? 'balanced' : 'minimal',
    timingRule: 'Transitions must match story timing and spoken meaning.',
    avoidRules: ['No random transitions.', ...directive.avoidRules.filter((rule) => rule.toLowerCase().includes('transition'))],
    notes: [
      editLevel === 'basic' ? 'Use simple tasteful transitions.' : 'Use style-specific transitions where motivated.',
    ],
  }
}

function qaItemsForSegment(segment: SegmentBase, editLevel: EditLevel): SegmentQAPlanItem[] {
  const fallbackActions = fallbackActionsForLevel(editLevel)

  return [
    {
      id: `${segment.id}-qa-intent`,
      category: 'user_intent_match',
      label: 'Intent match',
      check: 'Segment must follow user must-follow rules and avoid requested exclusions.',
      status: 'not_checked',
      severity: 'high',
      fallbackActions,
      notes: segment.mustFollowRules.slice(0, 2),
    },
    {
      id: `${segment.id}-qa-source-cleanup`,
      category: 'source_cleanup',
      label: 'Source cleanup',
      check: 'Trim/select decisions must preserve meaning and match the confirmed cleanup preference.',
      status: segment.trimDecisionItemIds?.length ? 'not_checked' : 'needs_user_review',
      severity: segment.trimDecisionItemIds?.length ? 'medium' : 'high',
      fallbackActions,
      notes: [
        ...(segment.trimDecisionItemIds?.map((id) => `Trim decision: ${id}.`) ?? ['No source cleanup decision linked yet.']),
        'No real transcript/silence/media analysis is implied.',
      ],
    },
    {
      id: `${segment.id}-qa-caption`,
      category: 'captions',
      label: 'Caption safety',
      check: 'Captions must be readable and avoid faces, products, and AI panels.',
      status: 'not_checked',
      severity: 'medium',
      fallbackActions,
      notes: segment.captionPlan.notes,
    },
    {
      id: `${segment.id}-qa-style`,
      category: 'pacing_and_cuts',
      label: 'Pacing and cut style',
      check: 'Cuts must match the segment role, pacing style, and cut intensity.',
      status: 'not_checked',
      severity: 'medium',
      fallbackActions,
      notes: [`Pacing: ${segment.pacingStyle}.`, `Cut intensity: ${segment.cutIntensity}.`],
    },
  ]
}

export function createOperationsForSegment(segment: SegmentBase): EditOperationPlan[] {
  const trimDecisionItemIds = segment.trimDecisionItemIds ?? []
  const meaningPreservationCheckIds = segment.meaningPreservationCheckIds ?? []
  const trimNeedsReview = meaningPreservationCheckIds.length > 0
  const operations: EditOperationPlan[] = [
    {
      id: `${segment.id}-op-trim`,
      segmentId: segment.id,
      operationType: 'trim',
      operationOrder: 1,
      label: 'Trim source clip',
      instruction: `Trim source material for ${segment.label} and place it at ${formatRange(segment.finalTimeRange)}.`,
      parameters: {
        sourceClipIds: segment.sourceClipIds,
        sourceTimeRange: segment.sourceTimeRange,
        finalTimeRange: segment.finalTimeRange,
        trimDecisionItemIds,
        meaningPreservationCheckIds,
      },
      reason: `${segment.storyPurpose} Trim/select decisions must follow confirmed source cleanup preference.`,
      status: trimDecisionItemIds.length && !trimNeedsReview ? 'planned' : 'needs_review',
      qaChecks: [
        'Source order context preserved.',
        'No important line is cut accidentally.',
        'Trim operation references SourceCleanupPlan decision IDs when available.',
        'Trim operation references TrimReviewPlan meaning checks when available.',
      ],
    },
    {
      id: `${segment.id}-op-cut`,
      segmentId: segment.id,
      operationType: 'cut',
      operationOrder: 2,
      label: 'Apply cut rhythm',
      instruction: `Use ${segment.pacingStyle.replaceAll('_', ' ')} pacing with ${segment.cutIntensity.replaceAll('_', ' ')} cut intensity.`,
      parameters: {
        pacingStyle: segment.pacingStyle,
        cutIntensity: segment.cutIntensity,
        trimDecisionItemIds,
        meaningPreservationCheckIds,
      },
      reason: 'Segment pacing should match the compiled professional editing direction.',
      status: trimNeedsReview ? 'needs_review' : 'planned',
      qaChecks: ['Cuts are motivated.', 'No random timing effects.', 'Risky cuts are not finalized without trim review.'],
    },
    {
      id: `${segment.id}-op-caption`,
      segmentId: segment.id,
      operationType: 'caption',
      operationOrder: 3,
      label: 'Add caption treatment',
      instruction: `Use ${segment.captionPlan.style.replaceAll('_', ' ')} captions in the safe zone.`,
      parameters: segment.captionPlan as unknown as Record<string, unknown>,
      reason: 'Captions must stay readable and face-safe.',
      status: 'planned',
      qaChecks: ['Captions readable.', 'Captions avoid face/product/panel zones.'],
    },
    {
      id: `${segment.id}-op-color`,
      segmentId: segment.id,
      operationType: 'color_grade',
      operationOrder: 4,
      label: 'Apply color grade',
      instruction: `Apply ${segment.colorGradePlan.style.replaceAll('_', ' ')} grade with ${segment.colorGradePlan.intensity} intensity.`,
      parameters: segment.colorGradePlan as unknown as Record<string, unknown>,
      reason: 'Color grade should match the selected professional style.',
      status: 'planned',
      qaChecks: ['Skin tones protected.', 'Shots matched.'],
    },
    {
      id: `${segment.id}-op-audio`,
      segmentId: segment.id,
      operationType: 'audio_cleanup',
      operationOrder: 5,
      label: 'Clean audio',
      instruction: `Use ${segment.soundPlan.style.replaceAll('_', ' ')} sound treatment with voice cleanup.`,
      parameters: segment.soundPlan as unknown as Record<string, unknown>,
      reason: 'Speech clarity stays above music, SFX, and SoundSync.',
      status: 'planned',
      qaChecks: ['Voice clear.', 'Music and SFX do not overpower speech.'],
    },
  ]

  if (segment.brollPlan.policy !== 'none') {
    operations.push({
      id: `${segment.id}-op-broll`,
      segmentId: segment.id,
      operationType: 'b_roll',
      operationOrder: operations.length + 1,
      label: 'Place meaningful b-roll',
      instruction: `Use ${segment.brollPlan.policy.replaceAll('_', ' ')} only when it supports the segment meaning.`,
      parameters: segment.brollPlan as unknown as Record<string, unknown>,
      reason: 'B-roll must support meaning, not fill space.',
      status: 'planned',
      qaChecks: ['No random b-roll.', 'Uploaded footage prioritized where relevant.'],
    })
  }

  operations.push({
    id: `${segment.id}-op-transition`,
    segmentId: segment.id,
    operationType: 'transition',
    operationOrder: operations.length + 1,
    label: 'Apply transition rule',
    instruction: `Use ${segment.transitionPlan.intensity} transition intensity from approved transition families.`,
    parameters: segment.transitionPlan as unknown as Record<string, unknown>,
    reason: 'Transitions should match the style and story timing.',
    status: 'planned',
    qaChecks: ['Transition is motivated.', 'No random effects.'],
  })

  if (segment.visualAssetPlanItemIds.length > 0) {
    operations.push({
      id: `${segment.id}-op-visual`,
      segmentId: segment.id,
      operationType: 'visual_asset',
      operationOrder: operations.length + 1,
      label: 'Place planned visual assets',
      instruction: 'Use only visual assets from the approved visual story plan.',
      parameters: {
        visualAssetPlanItemIds: segment.visualAssetPlanItemIds,
      },
      reason: 'Visuals should support the story beat and credit estimate.',
      status: 'planned',
      qaChecks: ['AI visual supports meaning.', 'Asset stays within matching-background frame panel when animated.'],
    })
  }

  if (segment.rendererLayerIds.length > 0) {
    operations.push({
      id: `${segment.id}-op-renderer`,
      segmentId: segment.id,
      operationType: 'renderer_layer',
      operationOrder: operations.length + 1,
      label: 'Map renderer layers',
      instruction: 'Place segment visuals into Remotion-planned layers after approval.',
      parameters: {
        rendererLayerIds: segment.rendererLayerIds,
      },
      reason: 'ReeditPro owns final canvas, timing, captions, and frame layout.',
      status: 'planned',
      qaChecks: ['Renderer layer respects safe zones.', 'AI clip is not treated as final canvas.'],
    })
  }

  operations.push({
    id: `${segment.id}-op-qa`,
    segmentId: segment.id,
    operationType: 'qa_check',
    operationOrder: operations.length + 1,
    label: 'Run planned QA checks',
    instruction: 'Check segment against user intent, professional standard, tier policy, frame rules, and approval state.',
    parameters: {
      qaCheckIds: segment.id,
    },
    reason: 'QA protects the edit from random or user-mismatched output.',
    status: 'planned',
    qaChecks: segment.workerNotes,
  })

  return operations
}

export function createSegmentEditPlans(params: {
  input: PlannerInput
  compiledIntent: CompiledEditingIntent
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  rendererCompositionPlan?: RendererCompositionPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
}): SegmentEditPlan[] {
  const { adaptiveEditStrategyPlan, audioPipelinePlan, colorPipelinePlan, compiledIntent, input, rendererCompositionPlan, visualAssetPlan } = params
  const directive = compiledIntent.professionalEditingDirective
  const seeds = segmentSeedsForCategory(input.editingCategory)
  const visualAssetsBySegment = mapVisualAssetsToSegments(visualAssetPlan, seeds.length)
  const rendererLayersByAsset = mapRendererLayersToVisualAssets(rendererCompositionPlan)
  let currentStart = 0

  return seeds.map((seed, index) => {
    const clip = clipForSegment(input.clips, index)
    const duration = segmentDuration(input.editLevel, index, clip)
    const finalTimeRange = {
      startSeconds: currentStart,
      endSeconds: currentStart + duration,
      label: `${seed.label} final range`,
    }
    const sourceTimeRange = clip
      ? {
          startSeconds: 0,
          endSeconds: Math.min(duration + 1, clipDurationSeconds(clip)),
          label: `${clip.fileName} source range`,
        }
      : undefined
    const segmentId = `segment-${index + 1}`
    const adaptiveStrategy = adaptiveEditStrategyPlan?.segmentStrategies.find((strategy, strategyIndex) =>
      strategy.segmentId === segmentId ||
      Boolean(strategy.clipId && clip?.id === strategy.clipId) ||
      strategyIndex === index,
    )
    const visualAssetPlanItemIds = visualAssetsBySegment[index]
    const rendererLayerIds = visualAssetPlanItemIds.flatMap((assetId) => rendererLayersByAsset.get(assetId) ?? [])
    const trimDecisions = input.sourceCleanupPlan?.decisions.filter((decision) => clip?.id === decision.clipId) ?? []
    const trimDecisionItemIds = trimDecisions.map((decision) => decision.id)
    const meaningPreservationChecks = input.trimReviewPlan?.meaningPreservationValidationPlan.checks.filter((check) =>
      check.relatedClipIds.some((clipId) => clip?.id === clipId) ||
      check.relatedTrimDecisionItemIds.some((decisionId) => trimDecisionItemIds.includes(decisionId)),
    ) ?? []
    const retakeSelectionItems = input.trimReviewPlan?.retakeSelectionPlan.items.filter((item) =>
      item.candidates.some((candidate) => clip?.id === candidate.clipId),
    ) ?? []
    const base: SegmentBase = {
      id: segmentId,
      segmentOrder: index + 1,
      role: seed.role,
      label: seed.label,
      storyPurpose: seed.storyPurpose,
      sourceClipIds: clip ? [clip.id] : [],
      sourceTimeRange,
      finalTimeRange,
      trimDecisionItemIds,
      meaningPreservationCheckIds: meaningPreservationChecks.map((check) => check.id),
      spokenTextSummary: seed.spokenTextSummary,
      pacingStyle: directive.pacingStyle,
      cutIntensity: directive.cutIntensity,
      captionPlan: {
        ...getDefaultCaptionPlan(directive, input.editLevel),
        style: adaptiveStrategy?.recommendedCaptionStyle ?? directive.captionStyle,
        notes: [
          ...getDefaultCaptionPlan(directive, input.editLevel).notes,
          ...(adaptiveStrategy ? [`Adaptive strategy: ${adaptiveStrategy.decisionKind.replaceAll('_', ' ')} with ${adaptiveStrategy.generationRestraint.replaceAll('_', ' ')}.`] : []),
        ],
      },
      brollPlan: {
        ...getDefaultBrollPlan(directive, input.editLevel),
        policy: adaptiveStrategy?.recommendedBrollPolicy ?? directive.brollPolicy,
        notes: [
          ...getDefaultBrollPlan(directive, input.editLevel).notes,
          ...trimDecisions.filter((decision) => decision.finalUse === 'broll').map((decision) => `Source cleanup routes ${decision.clipId} as b-roll support.`),
          ...(adaptiveStrategy?.decisionKind === 'use_b_roll' ? ['Adaptive strategy explicitly recommends meaning-matched b-roll for this segment.'] : []),
        ],
      },
      colorGradePlan: {
        ...getDefaultColorGradePlan(directive, input.editLevel),
        style: colorPipelinePlan?.colorGradeStyle ?? adaptiveStrategy?.recommendedColorGrade ?? directive.colorGradeStyle,
        skinToneProtection: getDefaultColorGradePlan(directive, input.editLevel).skinToneProtection ||
          Boolean(colorPipelinePlan?.projectOperations.some((operation) => operation.operation === 'skin_tone_protection')),
        shotMatching: getDefaultColorGradePlan(directive, input.editLevel).shotMatching ||
          Boolean(colorPipelinePlan?.projectOperations.some((operation) => operation.operation === 'shot_matching')),
        notes: [
          ...getDefaultColorGradePlan(directive, input.editLevel).notes,
          ...(adaptiveStrategy ? [`Adaptive strategy intensity: ${adaptiveStrategy.creativeIntensity.replaceAll('_', ' ')}.`] : []),
          ...(colorPipelinePlan
            ? [
                `Project color pipeline: ${colorPipelinePlan.colorGradeStyle.replaceAll('_', ' ')} (${colorPipelinePlan.intensity}).`,
                'Segment grade must match the project/clip/asset color pipeline.',
              ]
            : []),
        ],
      },
      soundPlan: {
        ...getDefaultSoundPlan(directive, input.editLevel),
        style: audioPipelinePlan?.soundStyle ?? directive.soundStyle,
        musicBed: audioPipelinePlan ? audioPipelinePlan.musicBedPlan.policy !== 'none' : getDefaultSoundPlan(directive, input.editLevel).musicBed,
        ducking: audioPipelinePlan ? audioPipelinePlan.musicBedPlan.duckingEnabled : getDefaultSoundPlan(directive, input.editLevel).ducking,
        sfx: audioPipelinePlan
          ? audioPipelinePlan.sfxPlan.policy === 'none'
            ? []
            : audioPipelinePlan.sfxPlan.allowedSfxTypes
          : getDefaultSoundPlan(directive, input.editLevel).sfx,
        avoidRules: [
          ...getDefaultSoundPlan(directive, input.editLevel).avoidRules,
          ...(audioPipelinePlan?.sfxPlan.avoidRules.slice(0, 2) ?? []),
          ...(audioPipelinePlan?.musicBedPlan.avoidRules.slice(0, 2) ?? []),
        ],
        notes: [
          ...getDefaultSoundPlan(directive, input.editLevel).notes,
          ...(audioPipelinePlan
            ? [
                `Project audio pipeline: ${audioPipelinePlan.soundStyle.replaceAll('_', ' ')} (${audioPipelinePlan.audioIntensity}).`,
                'Segment sound plan must match the project/clip/timing audio pipeline.',
              ]
            : []),
        ],
      },
      transitionPlan: {
        ...getDefaultTransitionPlan(directive, input.editLevel),
        families: adaptiveStrategy?.recommendedTransitionFamilies ?? directive.transitionFamilies,
        notes: [
          ...getDefaultTransitionPlan(directive, input.editLevel).notes,
          ...(adaptiveStrategy ? ['Transition choice must support the adaptive segment strategy, not random motion.'] : []),
        ],
      },
      visualAssetPlanItemIds,
      rendererLayerIds,
      mustFollowRules: [
        ...compiledIntent.mustFollowRules.slice(0, 4),
        ...(adaptiveStrategy?.mustFollowRules.slice(0, 2) ?? []),
      ],
      avoidRules: [
        ...compiledIntent.avoidRules.slice(0, 4),
        ...(adaptiveStrategy?.avoidRules.slice(0, 2) ?? []),
      ],
      workerNotes: [
        'Execute only after plan and credit approval.',
        input.editLevel === 'premium' ? 'Premium fallback depth applies; Veo remains final fallback only.' : 'Basic/Pro route cannot use Veo.',
        'Keep captions and visuals safe inside the selected frame layout.',
        ...(adaptiveStrategy
          ? [
              `Adaptive segment strategy: ${adaptiveStrategy.decisionKind.replaceAll('_', ' ')}.`,
              `Generation restraint: ${adaptiveStrategy.generationRestraint.replaceAll('_', ' ')}.`,
            ]
          : []),
        ...(colorPipelinePlan
          ? [
              `Color pipeline planned at project/clip/asset level: ${colorPipelinePlan.colorGradeStyle.replaceAll('_', ' ')}.`,
              'Segment grade must match project color pipeline; no real color processing runs in this mock.',
            ]
          : []),
        ...(audioPipelinePlan
          ? [
              `Audio pipeline planned at project/clip/timing level: ${audioPipelinePlan.soundStyle.replaceAll('_', ' ')}.`,
              'Segment sound must match project audio pipeline; no real audio processing runs in this mock.',
            ]
          : []),
        ...(input.sourceCleanupPlan
          ? [
              `Source cleanup status: ${input.sourceCleanupPlan.status.replaceAll('_', ' ')}.`,
              ...trimDecisions.map((decision) => `Trim/select: ${decision.decision.replaceAll('_', ' ')} as ${decision.finalUse} because ${decision.reason}`),
            ]
          : []),
        ...(input.trimReviewPlan
          ? [
              `Trim review status: ${input.trimReviewPlan.approvalBlocked ? 'blocked' : 'reviewable'}.`,
              ...retakeSelectionItems.map((item) => `Retake selection: ${item.label} / ${item.confidence} confidence / ${item.reason}`),
              ...meaningPreservationChecks.map((check) => `Meaning preservation: ${check.label} is ${check.status}.`),
            ]
          : []),
      ],
    }
    const segment: SegmentEditPlan = {
      ...base,
      operations: createOperationsForSegment(base),
      qaPlan: qaItemsForSegment(base, input.editLevel),
    }

    currentStart = finalTimeRange.endSeconds
    return segment
  })
}
