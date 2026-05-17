import type {
  CharacterConsistencyPlan,
  CharacterImportance,
  CharacterRealityStatus,
  CharacterReferenceAssetPlan,
  CharacterReferencePack,
  CompiledEditingIntent,
  PlannerInput,
  SegmentEditPlan,
  VisualAssetPlanItem,
} from '../types/reeditpro'

type CharacterCandidate = {
  displayName: string
  roleInStory: string
  importance: CharacterImportance
  realityStatus: CharacterRealityStatus
  source: 'name' | 'role' | 'category' | 'asset'
}

const excludedNameTokens = new Set([
  'Basic',
  'Pro',
  'Premium',
  'ReeditPro',
  'GPT',
  'Wan',
  'Hailuo',
  'Veo',
  'TikTok',
  'YouTube',
  'Shorts',
  'Reels',
  'Remotion',
  'Stroke',
  'Motion',
  'Graphic',
  'Design',
  'VisualExplain',
  'Real',
  'SoundSync',
])

const rolePatterns = [
  { pattern: /\bfounder\b/i, name: 'Founder', role: 'Founder or brand subject' },
  { pattern: /\b(customer|client)\b/i, name: 'Customer', role: 'Customer or client figure' },
  { pattern: /\bteacher\b/i, name: 'Teacher', role: 'Explainer or educator figure' },
  { pattern: /\bstudent\b/i, name: 'Student', role: 'Learner or audience proxy' },
  { pattern: /\binvestigator\b/i, name: 'Investigator', role: 'Neutral investigator figure' },
  { pattern: /\bvictim\b/i, name: 'Affected person', role: 'Affected person in the story' },
  { pattern: /\bscammer\b/i, name: 'Accused party', role: 'Claimed or accused party' },
  { pattern: /\bspokesperson\b/i, name: 'Spokesperson', role: 'Narrator or speaker figure' },
  { pattern: /\bwoman\b/i, name: 'Woman', role: 'Story figure described by role' },
  { pattern: /\bman\b/i, name: 'Man', role: 'Story figure described by role' },
  { pattern: /\bnarrator\b/i, name: 'Narrator', role: 'Narrator or voice figure' },
]

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'character'
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function combinedText(input: PlannerInput, compiledIntent?: CompiledEditingIntent) {
  return [
    input.projectName,
    input.customInstructions,
    compiledIntent?.goalSummary,
    ...(compiledIntent?.mustFollowRules ?? []),
    ...(compiledIntent?.avoidRules ?? []),
  ].filter(Boolean).join(' ')
}

function isFictionalScenario(text: string) {
  return /\b(fictional|fiction|made up|hypothetical|roleplay|demo scenario|sample story)\b/i.test(text)
}

function extractCapitalizedNames(text: string) {
  const matches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) ?? []

  return uniqueStrings(matches)
    .map((match) => match.trim())
    .filter((match) => {
      const parts = match.split(/\s+/)
      return parts.some((part) => !excludedNameTokens.has(part)) && !excludedNameTokens.has(match)
    })
    .filter((match) => match.length > 2)
    .slice(0, 4)
}

function defaultCandidateForCategory(input: PlannerInput, text: string): CharacterCandidate | undefined {
  if (input.editingCategory === 'storytelling') {
    return {
      displayName: 'Main story figure',
      roleInStory: 'Primary recurring story character',
      importance: 'primary',
      realityStatus: isFictionalScenario(text) ? 'fictional' : 'unknown',
      source: 'category',
    }
  }

  if (input.editingCategory === 'documentary_case_study') {
    return {
      displayName: 'Mentioned person',
      roleInStory: 'Neutral documentary subject or named party',
      importance: 'mention_only',
      realityStatus: isFictionalScenario(text) ? 'fictional' : 'unknown',
      source: 'category',
    }
  }

  if (input.editingCategory === 'business_brand' && /\b(founder|customer|client|spokesperson|persona)\b/i.test(text)) {
    return {
      displayName: 'Brand story figure',
      roleInStory: 'Founder, customer, or product persona',
      importance: 'secondary',
      realityStatus: 'unknown',
      source: 'category',
    }
  }

  if (input.editingCategory === 'education_explainer' && /\b(teacher|student|learner|character|figure)\b/i.test(text)) {
    return {
      displayName: 'Explainer figure',
      roleInStory: 'Symbolic teaching figure',
      importance: 'symbolic',
      realityStatus: 'fictional',
      source: 'category',
    }
  }

  return undefined
}

function assetNeedsCharacterPack(asset: VisualAssetPlanItem) {
  return asset.needsCharacterConsistency ||
    asset.assetType === 'character_card' ||
    asset.assetType === 'name_card' ||
    asset.assetType === 'animated_scene'
}

function collectCandidates(params: {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  visualAssetPlan?: VisualAssetPlanItem[]
}) {
  const { compiledIntent, input, visualAssetPlan = [] } = params
  const text = combinedText(input, compiledIntent)
  const fictional = isFictionalScenario(text)
  const candidates: CharacterCandidate[] = []

  extractCapitalizedNames(text).forEach((name, index) => {
    candidates.push({
      displayName: name,
      roleInStory: input.editingCategory === 'documentary_case_study' ? 'Named person or organization in the case story' : 'Named story figure',
      importance: index === 0 ? 'primary' : 'mention_only',
      realityStatus: fictional
        ? 'fictional'
        : input.editingCategory === 'documentary_case_study'
          ? 'real_named_person'
          : 'unknown',
      source: 'name',
    })
  })

  rolePatterns.forEach((rolePattern) => {
    if (rolePattern.pattern.test(text) && !candidates.some((candidate) => candidate.displayName === rolePattern.name)) {
      candidates.push({
        displayName: rolePattern.name,
        roleInStory: rolePattern.role,
        importance: rolePattern.name === 'Accused party' || rolePattern.name === 'Affected person' ? 'mention_only' : 'secondary',
        realityStatus: input.editingCategory === 'documentary_case_study' && !fictional ? 'unknown' : 'fictional',
        source: 'role',
      })
    }
  })

  if (visualAssetPlan.some(assetNeedsCharacterPack) && candidates.length === 0) {
    candidates.push({
      displayName: input.editingCategory === 'documentary_case_study' ? 'Neutral case figure' : 'Recurring visual figure',
      roleInStory: 'Generated visual character that needs consistent treatment',
      importance: 'primary',
      realityStatus: input.editingCategory === 'documentary_case_study' && !fictional ? 'unknown' : 'fictional',
      source: 'asset',
    })
  }

  const categoryCandidate = defaultCandidateForCategory(input, text)
  if (categoryCandidate && candidates.length === 0) {
    candidates.push(categoryCandidate)
  }

  return candidates.slice(0, input.editLevel === 'basic' ? 2 : input.editLevel === 'pro' ? 4 : 6)
}

function appearsInBeatIds(candidate: CharacterCandidate, visualAssetPlan: VisualAssetPlanItem[] | undefined) {
  const assets = visualAssetPlan ?? []
  const matchingAssets = assets.filter((asset) => {
    const haystack = `${asset.beatLabel} ${asset.storyPurpose} ${asset.reason}`.toLowerCase()
    return assetNeedsCharacterPack(asset) ||
      haystack.includes(candidate.displayName.toLowerCase()) ||
      haystack.includes(candidate.roleInStory.toLowerCase().split(' ')[0])
  })

  return matchingAssets.length > 0
    ? matchingAssets.map((asset) => asset.id)
    : assets.slice(0, 2).map((asset) => asset.id)
}

function appearsInSegmentIds(candidate: CharacterCandidate, segmentEditPlans: SegmentEditPlan[] | undefined) {
  const segments = segmentEditPlans ?? []
  const matchingSegments = segments.filter((segment) => {
    const haystack = `${segment.label} ${segment.storyPurpose} ${segment.spokenTextSummary ?? ''}`.toLowerCase()
    return haystack.includes(candidate.displayName.toLowerCase()) ||
      haystack.includes(candidate.roleInStory.toLowerCase().split(' ')[0])
  })

  return matchingSegments.length > 0
    ? matchingSegments.map((segment) => segment.id)
    : segments.slice(0, 2).map((segment) => segment.id)
}

function referenceAsset(params: {
  packId: string
  assetType: CharacterReferenceAssetPlan['assetType']
  label: string
  purpose: string
  required?: boolean
  promptNotes?: string[]
}): CharacterReferenceAssetPlan {
  return {
    id: `${params.packId}-${params.assetType}`,
    assetType: params.assetType,
    label: params.label,
    purpose: params.purpose,
    providerModel: 'gpt_image_2',
    promptNotes: params.promptNotes ?? [],
    required: params.required ?? true,
  }
}

function referenceAssetsForCandidate(params: {
  candidate: CharacterCandidate
  editLevel: PlannerInput['editLevel']
  hasAnimatedAsset: boolean
  packId: string
}) {
  const { candidate, editLevel, hasAnimatedAsset, packId } = params
  const realOrUnknown = candidate.realityStatus === 'real_named_person' ||
    candidate.realityStatus === 'public_figure' ||
    candidate.realityStatus === 'user_provided_person' ||
    candidate.realityStatus === 'unknown'

  if (candidate.importance === 'mention_only' || realOrUnknown) {
    return [
      referenceAsset({
        packId,
        assetType: 'name_card',
        label: 'Neutral name card',
        purpose: 'Introduce or reference the person without implying guilt or creating a likeness.',
        promptNotes: ['Use neutral documentary card treatment.', 'Do not generate realistic likeness by default.'],
      }),
      referenceAsset({
        packId,
        assetType: realOrUnknown ? 'generic_figure' : 'character_card',
        label: realOrUnknown ? 'Generic figure option' : 'Character card',
        purpose: realOrUnknown ? 'Use a non-likeness placeholder if a visual figure is needed.' : 'Provide a simple identity anchor.',
        required: editLevel !== 'basic',
        promptNotes: ['Keep styling restrained and role-safe.'],
      }),
    ]
  }

  const assets: CharacterReferenceAssetPlan[] = [
    referenceAsset({
      packId,
      assetType: 'neutral_pose',
      label: 'Neutral pose',
      purpose: 'Set the base appearance, outfit, silhouette, and style.',
      promptNotes: ['Create the stable identity anchor used across generated assets.'],
    }),
    referenceAsset({
      packId,
      assetType: 'character_card',
      label: 'Character card',
      purpose: 'Introduce the recurring figure in a clean, reusable card.',
      promptNotes: ['Use the selected visual style mode and matching panel background.'],
    }),
  ]

  if (editLevel !== 'basic') {
    assets.push(referenceAsset({
      packId,
      assetType: 'emotional_pose',
      label: 'Emotional pose',
      purpose: 'Support emotional beats while preserving identity.',
      promptNotes: ['Keep expression range believable and consistent.'],
    }))
  }

  if (editLevel === 'premium') {
    assets.push(referenceAsset({
      packId,
      assetType: 'action_pose',
      label: 'Action pose',
      purpose: 'Support Premium scene movement and stronger story action.',
      promptNotes: ['Do not change outfit or silhouette during action.'],
    }))
  }

  if (hasAnimatedAsset && editLevel !== 'basic') {
    assets.push(
      referenceAsset({
        packId,
        assetType: 'start_frame',
        label: 'Animation start frame',
        purpose: 'Preserve identity at animation start.',
        promptNotes: ['Start frame must match the character pack exactly.'],
      }),
      referenceAsset({
        packId,
        assetType: 'end_frame',
        label: 'Animation end frame',
        purpose: 'Preserve identity at animation end.',
        promptNotes: ['End frame must resolve action without identity drift.'],
      }),
    )
  }

  return assets
}

function buildPack(params: {
  candidate: CharacterCandidate
  index: number
  input: PlannerInput
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
}): CharacterReferencePack {
  const { candidate, index, input, segmentEditPlans, visualAssetPlan = [] } = params
  const packId = `character-pack-${slug(candidate.displayName)}-${index + 1}`
  const beatIds = appearsInBeatIds(candidate, visualAssetPlan)
  const segmentIds = appearsInSegmentIds(candidate, segmentEditPlans)
  const hasAnimatedAsset = visualAssetPlan.some((asset) =>
    beatIds.includes(asset.id) &&
    ['animated_scene', 'motion_design_scene', 'real_motion_scene', 'transition_scene'].includes(asset.assetType)
  )
  const realOrUnknown = candidate.realityStatus === 'real_named_person' ||
    candidate.realityStatus === 'public_figure' ||
    candidate.realityStatus === 'user_provided_person' ||
    candidate.realityStatus === 'unknown'

  return {
    id: packId,
    displayName: candidate.displayName,
    roleInStory: candidate.roleInStory,
    importance: candidate.importance,
    realityStatus: candidate.realityStatus,
    appearance: {
      visualDescription: realOrUnknown
        ? 'Neutral documentary-safe representation; avoid realistic likeness unless a future approved workflow verifies rights and references.'
        : 'Consistent stylized ReeditPro figure with stable silhouette, outfit, and expression range.',
      outfit: realOrUnknown ? 'Neutral, non-sensational wardrobe or card-only treatment.' : 'Simple consistent outfit across all generated assets.',
      hair: realOrUnknown ? 'Avoid likeness-specific hair details by default.' : 'Consistent simplified hair shape if visible.',
      accessories: 'Only include accessories that are story-relevant and approved.',
      bodyLanguage: realOrUnknown ? 'Neutral posture; no guilt, shame, violence, or arrest implication.' : 'Body language follows the beat while preserving identity.',
      colorRules: ['Use the selected style mode palette.', 'Keep panel background matched.'],
      strokeRules: ['Preserve line weight and silhouette when Stroke Motion is used.'],
      styleModeIds: uniqueStrings(visualAssetPlan.filter((asset) => beatIds.includes(asset.id)).map((asset) => asset.styleModeId ?? '')),
    },
    expressionRange: realOrUnknown
      ? ['neutral', 'careful documentary reference']
      : input.editLevel === 'premium'
        ? ['neutral', 'concerned', 'relieved', 'determined']
        : ['neutral', 'subtle emotion'],
    poseRange: realOrUnknown
      ? ['neutral card', 'generic figure', 'silhouette']
      : hasAnimatedAsset
        ? ['neutral pose', 'emotional pose', 'simple action pose']
        : ['neutral pose', 'card pose'],
    appearsInBeatIds: beatIds,
    appearsInSegmentIds: segmentIds,
    referenceAssetsNeeded: referenceAssetsForCandidate({
      candidate,
      editLevel: input.editLevel,
      hasAnimatedAsset,
      packId,
    }),
    consistencyRules: [
      'Reuse this pack across stills, cards, keyframes, start frames, end frames, and animation prompts.',
      'Preserve outfit, silhouette, expression range, style mode, and panel background.',
      'Animation prompts must not introduce new character identity details unless the approved plan says so.',
      input.editLevel === 'premium'
        ? 'Premium may run stronger consistency QA and retries, with Veo Lite only as final fallback/rescue if routed.'
        : 'Basic/Pro consistency fallback uses retry, simplification, stills, or motion design; no Veo.',
    ],
    avoidRules: [
      'Do not change identity between scenes.',
      'Do not add unplanned characters.',
      'Do not obstruct faces, product proof, captions, or animation panels.',
      realOrUnknown ? 'Do not generate realistic likeness by default.' : 'Do not drift from the approved stylized character design.',
      realOrUnknown ? 'Do not imply guilt, arrest, criminality, violence, or shame through appearance.' : 'Do not over-sensationalize expression or pose.',
    ],
    promptNotes: [
      `Character pack importance: ${candidate.importance}.`,
      `Reality status: ${candidate.realityStatus}.`,
      'Use matching panel background and safe margins in every prompt.',
      realOrUnknown ? 'Use neutral card, silhouette, or stylized non-realistic treatment unless approved later.' : 'Use the same visual identity for all reference assets.',
    ],
    qaChecks: [
      'Recurring character preserves appearance and style across planned assets.',
      'Start and end frames use the same character pack when animation is planned.',
      'Mention-only or real/unknown people are not over-animated.',
      'Identity drift triggers retry, simplification, conversion to still, or review.',
    ],
  }
}

export function createCharacterConsistencyPlan(params: {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
}): CharacterConsistencyPlan {
  const { compiledIntent, input, segmentEditPlans, visualAssetPlan } = params
  const candidates = collectCandidates({ compiledIntent, input, visualAssetPlan })
  const packs = candidates.map((candidate, index) =>
    buildPack({
      candidate,
      index,
      input,
      segmentEditPlans,
      visualAssetPlan,
    })
  )

  return {
    id: `character-consistency-${input.editingCategory}-${input.editLevel}`,
    packs,
    globalRules: [
      'Recurring people and story figures must use a character reference pack.',
      'GPT-Image-2 creates character anchors, cards, keyframes, start frames, and end frames from the pack.',
      'Wan/Hailuo/Veo prompts must preserve pack identity and may generate clips/assets only.',
      'Real named or unknown people default to neutral cards, silhouettes, or stylized non-realistic figures.',
      input.editLevel === 'premium' ? 'Premium keeps Veo Lite final fallback only.' : 'Basic/Pro cannot use Veo for character consistency fallback.',
    ],
    qaChecks: [
      'Same character keeps consistent outfit, silhouette, stroke style, and expression range.',
      'Generated stills/start frames/end frames reuse the same pack.',
      'Mention-only people stay as cards or neutral figures unless motion is approved.',
      'Identity drift triggers retry, simplification, conversion to still, or review.',
    ],
    notes: [
      'This is mock planning only; no identity verification or media face analysis is performed.',
      packs.length > 0
        ? `${packs.length} character reference pack${packs.length === 1 ? '' : 's'} planned.`
        : 'No recurring generated character pack is needed for this mock edit.',
    ],
  }
}
