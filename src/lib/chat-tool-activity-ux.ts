import type { ChatPlanningDisplayMode, EditPlan } from '../types/reeditpro'
import type {
  ToolCallIntent,
  ToolCallIntentCapabilityId,
  ToolCallIntentReadinessState,
} from '../types/tool-call-intents'

export type ChatToolActivityCardKind =
  | 'tool_plan'
  | 'tool_readiness'
  | 'approval_cost'
  | 'progress'
  | 'result_artifact'
  | 'blocker_next_action'
  | 'qa_summary'

export type ChatToolActivityCardStatus =
  | 'blocked'
  | 'complete'
  | 'needs_approval'
  | 'ready'
  | 'running'
  | 'waiting'
  | 'warning'

export interface ChatToolActivityArtifactInput {
  artifactType: string
  storageBucketPurpose?: string
  storageObjectPath?: string
  isPrivate?: boolean
  sourceOfTruth?: boolean
}

export interface ChatToolActivityItem {
  label: string
  detail: string
  status?: ChatToolActivityCardStatus
}

export interface ChatToolActivityDeveloperDetails {
  label: string
  values: string[]
}

export interface ChatToolActivityCard {
  kind: ChatToolActivityCardKind
  eyebrow: string
  title: string
  summary: string
  status: ChatToolActivityCardStatus
  chips: string[]
  items: ChatToolActivityItem[]
  nextAction?: string
  developerDetails?: ChatToolActivityDeveloperDetails[]
}

export interface BuildChatToolActivityCardsInput {
  approved?: boolean
  displayMode?: ChatPlanningDisplayMode
  outputArtifacts?: ChatToolActivityArtifactInput[]
  plan: EditPlan
  previewReady?: boolean
  progressStarted?: boolean
}

interface ActivityCopy {
  title: string
  detail: string
  output: string
  qa: string
}

interface ActivityGroup {
  title: string
  detail: string
  output: string
  qa: string
  capabilityIds: ToolCallIntentCapabilityId[]
  readinessStates: ToolCallIntentReadinessState[]
  expectedCredits: number
  highCredits: number
  rawToolIds: string[]
  rawLabels: string[]
}

export const chatToolActivityRawNameDenylist = [
  'audioflux',
  'd3',
  'echarts',
  'faster-whisper',
  'faster_whisper',
  'ffmpeg',
  'ffprobe',
  'gpac',
  'gpac/mp4box',
  'gstreamer',
  'libass',
  'mp4box',
  'mkvtoolnix',
  'opencv',
  'opencolorio',
  'openimageio',
  'open timeline io',
  'opentimelineio',
  'paddleocr',
  'playwright',
  'pyav',
  'remotion',
  'sharp',
  'signalsmith',
  'vapoursynth',
]

const activityCopyByCapability: Record<ToolCallIntentCapabilityId, ActivityCopy> = {
  audio: {
    title: 'Audio timing and cleanup',
    detail: 'Measure rhythm, loudness, and timing cues so speech stays clear and edits land naturally.',
    output: 'Audio timing report',
    qa: 'Checks speech clarity, rhythm fit, and music/voice balance.',
  },
  browser_capture: {
    title: 'Approved screen visual capture',
    detail: 'Prepare approved page or app visuals only after privacy and credential review.',
    output: 'Private screen visual',
    qa: 'Checks private source review, readable labels, and no credential exposure.',
  },
  chart_dataviz: {
    title: 'Exact charts and diagrams',
    detail: 'Turn approved data into precise explanatory visuals instead of guessing with generated imagery.',
    output: 'Renderer-ready visual spec',
    qa: 'Checks labels, data confidence, source notes, and safe on-screen placement.',
  },
  color: {
    title: 'Color and image consistency',
    detail: 'Check exposure, shot match, generated asset match, and frame consistency before preview.',
    output: 'Color and image QA report',
    qa: 'Checks skin tone, exposure, shot matching, and export color space.',
  },
  credit_gate: {
    title: 'Cost approval guard',
    detail: 'Verify the approved estimate and reservation before any billable edit work begins.',
    output: 'Cost event record',
    qa: 'Checks no silent billing, no overrun, and idempotent cost records.',
  },
  media_extraction: {
    title: 'Source clip preparation',
    detail: 'Prepare private source references, metadata, frames, and audio extracts for the approved edit.',
    output: 'Source preparation report',
    qa: 'Checks source order, private refs, duration, scene candidates, and media readiness.',
  },
  ocr: {
    title: 'On-screen text safety',
    detail: 'Find text-heavy areas and no-cover zones so captions and graphics do not hide important content.',
    output: 'Text and safe-zone report',
    qa: 'Checks captions, overlays, screens, labels, and safe-zone collisions.',
  },
  qwen_reasoning: {
    title: 'Structured planning intelligence',
    detail: 'Use the approved plan context to refine decisions without relying on raw chat text.',
    output: 'Structured planning record',
    qa: 'Checks approved snapshot use, prompt safety, and structured output.',
  },
  qwen_visual_understanding: {
    title: 'Visual understanding review',
    detail: 'Review approved private media context before choosing visuals, cuts, or extra support.',
    output: 'Visual understanding report',
    qa: 'Checks source privacy, scene meaning, and per-segment visual decisions.',
  },
  render: {
    title: 'Preview assembly',
    detail: 'Assemble captions, layout, visuals, audio cues, and private assets into a preview plan.',
    output: 'Preview/render manifest',
    qa: 'Checks asset readiness, layer timing, layout, duration sync, and final preview gates.',
  },
  sound_music_audio: {
    title: 'Music and sound handoff',
    detail: 'Prepare music and sound cue decisions so they support the story without covering speech.',
    output: 'Music/audio handoff report',
    qa: 'Checks cue timing, voice safety, style fit, and project-only audio handling.',
  },
  streamer_render_pipeline_support: {
    title: 'Native render pipeline support',
    detail: 'Validate container-backed render pipeline support for the approved edit without exposing raw tooling.',
    output: 'Render pipeline support report',
    qa: 'Checks private fixture scope, backend boundary, and no unrelated media probing.',
  },
  storage_runtime: {
    title: 'Private artifact handoff',
    detail: 'Keep source and generated outputs in private manifests instead of public links.',
    output: 'Private artifact manifest',
    qa: 'Checks private source-of-truth refs, no signed URL source truth, and scoped storage paths.',
  },
  timeline: {
    title: 'Edit structure handoff',
    detail: 'Convert approved cuts, timing, and segment operations into a worker-ready edit structure.',
    output: 'Timeline manifest',
    qa: 'Checks approved source order, frame timing, segment operations, and render handoff.',
  },
  track_a_container_tools: {
    title: 'Native container support review',
    detail: 'Use separately approved native-container evidence only when a planned edit needs that support.',
    output: 'Native support report',
    qa: 'Checks source approval, private fixture boundaries, and no unrelated media probing.',
  },
  mkvtoolnix_container_validation: {
    title: 'Container package validation',
    detail: 'Validate subtitle/container packaging metadata for approved private outputs.',
    output: 'Container validation report',
    qa: 'Checks private fixture policy, package metadata, and artifact cleanup.',
  },
  gpac_mp4box_packaging_validation: {
    title: 'MP4 packaging validation',
    detail: 'Validate approved MP4 packaging/source metadata before any export packaging path is allowed.',
    output: 'Packaging validation report',
    qa: 'Checks owner-approved source, package provenance, and no public delivery.',
  },
  transcript: {
    title: 'Speech and caption source prep',
    detail: 'Prepare speech timing source material for captions, trim review, and meaning preservation.',
    output: 'Transcript timing record',
    qa: 'Checks transcript alignment, caption timing, trim safety, and meaning preservation.',
  },
}

function statusLabel(status: ChatToolActivityCardStatus): string {
  return status.replaceAll('_', ' ')
}

function readinessStatus(readinessStates: ToolCallIntentReadinessState[]): ChatToolActivityCardStatus {
  if (readinessStates.some((state) =>
    state === 'blocked_by_owner_approval' ||
    state === 'blocked_by_provider_lane' ||
    state === 'blocked_by_storage_billing'
  )) {
    return 'blocked'
  }

  if (readinessStates.some((state) => state === 'dry_run_only')) {
    return 'warning'
  }

  return 'ready'
}

function groupIntents(intents: ToolCallIntent[]): ActivityGroup[] {
  const groups = new Map<string, ActivityGroup>()

  for (const intent of intents) {
    const copy = activityCopyByCapability[intent.capabilityId]
    const existing = groups.get(copy.title)
    const expectedCredits = intent.costEstimate.expectedCredits ?? intent.costEstimate.credits
    const highCredits = intent.costEstimate.highCredits ?? expectedCredits

    if (!existing) {
      groups.set(copy.title, {
        ...copy,
        capabilityIds: [intent.capabilityId],
        readinessStates: [intent.readinessState],
        expectedCredits,
        highCredits,
        rawLabels: [intent.toolLabel],
        rawToolIds: [intent.toolId],
      })
      continue
    }

    existing.capabilityIds = Array.from(new Set([...existing.capabilityIds, intent.capabilityId]))
    existing.readinessStates.push(intent.readinessState)
    existing.expectedCredits += expectedCredits
    existing.highCredits += highCredits
    existing.rawLabels = Array.from(new Set([...existing.rawLabels, intent.toolLabel]))
    existing.rawToolIds = Array.from(new Set([...existing.rawToolIds, intent.toolId]))
  }

  return Array.from(groups.values())
}

function readinessBlockerItems(intents: ToolCallIntent[]): ChatToolActivityItem[] {
  const states = new Set(intents.map((intent) => intent.readinessState))
  const items: ChatToolActivityItem[] = []

  if (states.has('blocked_by_owner_approval')) {
    items.push({
      label: 'Owner evidence still required',
      detail: 'A planned edit activity needs approved source, license, model, or owner evidence before it can move beyond planning.',
      status: 'blocked',
    })
  }

  if (states.has('blocked_by_provider_lane')) {
    items.push({
      label: 'Provider lane still gated',
      detail: 'A model-backed planning or understanding step still needs its backend approval lane before execution.',
      status: 'blocked',
    })
  }

  if (states.has('blocked_by_storage_billing')) {
    items.push({
      label: 'Storage or billing gate still required',
      detail: 'A private artifact, reservation, billing, or storage condition must be proven before execution.',
      status: 'blocked',
    })
  }

  if (states.has('dry_run_only')) {
    items.push({
      label: 'Dry-run only evidence',
      detail: 'Some work can be rehearsed safely, but cannot yet run as real edit work without a later backend approval.',
      status: 'warning',
    })
  }

  return items
}

function creditBlockerLabel(blocker: string): ChatToolActivityItem {
  const normalized = blocker.toLowerCase()

  if (normalized.includes('snapshot')) {
    return {
      label: 'Approve the edit plan snapshot',
      detail: 'Workers must use an approved immutable plan version, not raw chat text.',
      status: 'needs_approval',
    }
  }

  if (normalized.includes('estimate')) {
    return {
      label: 'Approve the credit estimate',
      detail: 'The cost must be visible and approved before billable edit work can start.',
      status: 'needs_approval',
    }
  }

  if (normalized.includes('reservation')) {
    return {
      label: 'Reserve the approved credits',
      detail: 'Execution needs a reservation so the edit cannot silently overrun the approved budget.',
      status: 'needs_approval',
    }
  }

  if (normalized.includes('budget') || normalized.includes('revised')) {
    return {
      label: 'Review the higher cost range',
      detail: 'The high estimate needs a revised approval before this edit work can continue.',
      status: 'warning',
    }
  }

  return {
    label: 'Resolve approval gate',
    detail: 'A required approval or execution prerequisite is still missing.',
    status: 'needs_approval',
  }
}

function uniqueItems(items: ChatToolActivityItem[]): ChatToolActivityItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.label}:${item.detail}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function artifactLabel(value: string | undefined): string {
  if (!value) return 'Private output'

  return value
    .replaceAll('_', ' ')
    .replace(/\bjson\b/gi, 'record')
    .replace(/\bqa\b/gi, 'QA')
}

function artifactItems(outputArtifacts: ChatToolActivityArtifactInput[]): ChatToolActivityItem[] {
  const counts = new Map<string, number>()
  for (const artifact of outputArtifacts) {
    const key = artifactLabel(artifact.artifactType)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([label, count]) => ({
    label,
    detail: `${count} private manifest entr${count === 1 ? 'y' : 'ies'} recorded for this edit.`,
    status: 'complete' as const,
  }))
}

function hasUnsafeArtifact(outputArtifacts: ChatToolActivityArtifactInput[]): boolean {
  return outputArtifacts.some((artifact) => {
    const path = artifact.storageObjectPath ?? ''
    return artifact.isPrivate === false ||
      artifact.sourceOfTruth === false ||
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      /signed|signature|x-goog-signature|token=/i.test(path)
  })
}

function developerDetailsForGroups(
  groups: ActivityGroup[],
  displayMode: ChatPlanningDisplayMode,
): ChatToolActivityDeveloperDetails[] | undefined {
  if (displayMode !== 'developer') {
    return undefined
  }

  return [{
    label: 'Developer execution identifiers',
    values: Array.from(new Set(groups.flatMap((group) => group.rawToolIds))).sort(),
  }, {
    label: 'Developer display labels',
    values: Array.from(new Set(groups.flatMap((group) => group.rawLabels))).sort(),
  }]
}

export function buildChatToolActivityCards(input: BuildChatToolActivityCardsInput): ChatToolActivityCard[] {
  const {
    approved = false,
    displayMode = 'guided',
    outputArtifacts = [],
    plan,
    previewReady = false,
    progressStarted = false,
  } = input
  const toolPlan = plan.toolCallIntentPlan
  const intents = toolPlan?.intents ?? []
  const groups = groupIntents(intents)
  const creditSummary = toolPlan?.creditGateSummary
  const readyCount = toolPlan?.readinessCounts.ready_for_backend_execution ?? 0
  const dryRunCount = toolPlan?.readinessCounts.dry_run_only ?? 0
  const blockedCount = (
    (toolPlan?.readinessCounts.blocked_by_owner_approval ?? 0) +
    (toolPlan?.readinessCounts.blocked_by_provider_lane ?? 0) +
    (toolPlan?.readinessCounts.blocked_by_storage_billing ?? 0)
  )
  const totalExpectedCredits = creditSummary?.totalExpectedCredits ?? 0
  const totalHighCredits = creditSummary?.totalHighCredits ?? 0
  const blockerItems = uniqueItems([
    ...(creditSummary?.blockers ?? []).map(creditBlockerLabel),
    ...readinessBlockerItems(intents),
  ])
  const qaChecks = plan.editQAPlan
    ? [
      ...plan.editQAPlan.globalChecks,
      ...plan.editQAPlan.tierPolicyChecks,
      ...plan.editQAPlan.approvalChecks,
      ...plan.editQAPlan.segmentChecks,
    ]
    : []
  const qaWarnings = qaChecks.filter((check) =>
    check.status === 'failed' ||
    check.status === 'blocked' ||
    check.status === 'warning' ||
    check.status === 'needs_user_review' ||
    check.severity === 'blocking' ||
    check.severity === 'high',
  ).length
  const unsafeArtifact = hasUnsafeArtifact(outputArtifacts)
  const resultItems = outputArtifacts.length > 0
    ? artifactItems(outputArtifacts)
    : groups.slice(0, 4).map((group) => ({
      label: group.output,
      detail: 'Expected as a private manifest entry after approval and execution.',
      status: 'waiting' as const,
    }))

  const progressStatus: ChatToolActivityCardStatus = previewReady
    ? 'complete'
    : progressStarted
      ? 'running'
      : approved
        ? 'ready'
        : 'waiting'

  return [
    {
      kind: 'tool_plan',
      eyebrow: 'Edit work plan',
      title: 'Planned edit work',
      summary: groups.length > 0
        ? `${groups.length} edit activit${groups.length === 1 ? 'y' : 'ies'} are planned behind the scenes. The chat shows what each activity does, not the raw execution names.`
        : 'No edit activities are planned yet.',
      status: groups.length > 0 ? 'ready' : 'waiting',
      chips: [
        `${groups.length} edit activities`,
        `${readyCount} ready after gates`,
        `${blockedCount + dryRunCount} need review`,
      ],
      items: groups.slice(0, 7).map((group) => ({
        label: group.title,
        detail: group.detail,
        status: readinessStatus(group.readinessStates),
      })),
      developerDetails: developerDetailsForGroups(groups, displayMode),
    },
    {
      kind: 'tool_readiness',
      eyebrow: 'Readiness',
      title: 'What can run after approval',
      summary: blockedCount > 0 || dryRunCount > 0
        ? 'Some planned edit work still needs approval evidence or a dry-run-to-execution gate before it can run.'
        : 'Planned edit work is ready to wait on the approved plan, private artifacts, and credit reservation.',
      status: blockedCount > 0 ? 'warning' : 'ready',
      chips: [
        `${readyCount} execution candidates`,
        `${dryRunCount} dry-run only`,
        `${blockedCount} blocked`,
      ],
      items: [
        {
          label: 'Private input checks',
          detail: 'Source clips, approved data, frame samples, and audio extracts stay private and source-of-truth scoped.',
          status: 'ready',
        },
        {
          label: 'Backend-only work',
          detail: 'The browser explains the work, but heavy processing remains behind approved backend gates.',
          status: 'ready',
        },
        ...readinessBlockerItems(intents),
      ],
    },
    {
      kind: 'approval_cost',
      eyebrow: 'Approval and cost',
      title: 'Cost gate before work starts',
      summary: `Expected range is ${totalExpectedCredits} credits, with ${totalHighCredits} credits reserved for the high estimate before execution can start.`,
      status: creditSummary?.executionAllowed ? 'ready' : 'needs_approval',
      chips: [
        `${creditSummary?.totalLowCredits ?? 0} low`,
        `${totalExpectedCredits} expected`,
        `${totalHighCredits} high`,
      ],
      items: [
        {
          label: 'Plan approval',
          detail: 'The edit plan must be approved as an immutable snapshot before work can start.',
          status: creditSummary?.approvedPlanSnapshotId ? 'complete' : 'needs_approval',
        },
        {
          label: 'Credit estimate',
          detail: 'The visible estimate must be approved before any billable edit work starts.',
          status: creditSummary?.creditEstimateId ? 'complete' : 'needs_approval',
        },
        {
          label: 'Credit reservation',
          detail: 'The high estimate must fit inside the approved reservation; no silent overages.',
          status: creditSummary?.creditReservationId ? 'complete' : 'needs_approval',
        },
      ],
      nextAction: creditSummary?.executionAllowed
        ? 'Approved work can move to backend dispatch when private inputs are ready.'
        : 'Approve the plan, estimate, and reservation before starting edit work.',
    },
    {
      kind: 'progress',
      eyebrow: 'Progress',
      title: previewReady ? 'Edit work complete for review' : progressStarted ? 'Edit work in progress' : 'Waiting to start',
      summary: previewReady
        ? 'The mock preview is ready to review. Production output would be tied to private artifact records.'
        : progressStarted
          ? 'Approved edit work is moving through private input prep, bounded execution, artifact write, and QA.'
          : 'Edit work has not started. It waits for plan approval, cost approval, private inputs, and backend gates.',
      status: progressStatus,
      chips: [
        approved ? 'plan approved' : 'approval pending',
        progressStarted ? 'working' : 'not started',
        previewReady ? 'review ready' : 'no result yet',
      ],
      items: [
        {
          label: 'Prepare private inputs',
          detail: 'Use approved source references and manifests, never raw signed URLs as source truth.',
          status: progressStarted || previewReady ? 'complete' : 'waiting',
        },
        {
          label: 'Run bounded edit work',
          detail: 'Execute only the approved work package and idempotency key for this edit.',
          status: previewReady ? 'complete' : progressStarted ? 'running' : 'waiting',
        },
        {
          label: 'Write private outputs',
          detail: 'Record outputs into the project manifest before preview or export review.',
          status: previewReady ? 'complete' : 'waiting',
        },
      ],
    },
    {
      kind: 'result_artifact',
      eyebrow: 'Results',
      title: outputArtifacts.length > 0 ? 'Private results recorded' : 'Expected private results',
      summary: outputArtifacts.length > 0
        ? `${outputArtifacts.length} private result entr${outputArtifacts.length === 1 ? 'y' : 'ies'} are available for review.`
        : 'No result artifacts exist yet. After approved execution, outputs are shown as private manifest summaries instead of public links.',
      status: unsafeArtifact ? 'blocked' : outputArtifacts.length > 0 ? 'complete' : 'waiting',
      chips: [
        outputArtifacts.length > 0 ? `${outputArtifacts.length} recorded` : `${resultItems.length} expected`,
        unsafeArtifact ? 'privacy issue' : 'private refs only',
        'no public links',
      ],
      items: resultItems,
      nextAction: unsafeArtifact
        ? 'Replace unsafe result references with private source-of-truth artifact records.'
        : outputArtifacts.length > 0
          ? 'Review the generated preview and QA summary.'
          : 'Run only after the approved backend gates pass.',
    },
    {
      kind: 'blocker_next_action',
      eyebrow: 'Blockers',
      title: blockerItems.length > 0 ? 'What still needs action' : 'No edit-work blockers found',
      summary: blockerItems.length > 0
        ? `${blockerItems.length} action${blockerItems.length === 1 ? '' : 's'} must be resolved before all planned edit work can execute.`
        : 'All planned edit work is waiting only on the normal approval and dispatch sequence.',
      status: blockerItems.some((item) => item.status === 'blocked') ? 'blocked' : blockerItems.length > 0 ? 'needs_approval' : 'ready',
      chips: [
        `${blockerItems.length} blockers`,
        'approval first',
        'backend only',
      ],
      items: blockerItems.length > 0 ? blockerItems : [{
        label: 'Ready for normal approval sequence',
        detail: 'Approve the plan and credit estimate, then dispatch through the backend gate.',
        status: 'ready',
      }],
      nextAction: blockerItems.length > 0
        ? blockerItems[0].label
        : 'Approve the edit plan and credits when you are ready.',
    },
    {
      kind: 'qa_summary',
      eyebrow: 'QA',
      title: 'Quality checks before delivery',
      summary: qaChecks.length > 0
        ? `${qaChecks.length} edit QA check${qaChecks.length === 1 ? '' : 's'} planned; ${qaWarnings} need extra attention.`
        : 'QA checks will be attached once the edit plan is ready.',
      status: qaWarnings > 0 ? 'warning' : qaChecks.length > 0 ? 'ready' : 'waiting',
      chips: [
        `${qaChecks.length} checks`,
        `${qaWarnings} high attention`,
        'delivery gated',
      ],
      items: [
        {
          label: 'Intent and source truth',
          detail: 'Check the edit against the user request, source order, approved plan, and privacy rules.',
          status: 'ready',
        },
        {
          label: 'Timing, captions, and visuals',
          detail: 'Check readability, speech clarity, safe zones, visual meaning, and frame-accurate timing.',
          status: qaWarnings > 0 ? 'warning' : 'ready',
        },
        {
          label: 'Private result review',
          detail: 'Check generated outputs through private manifest records before preview or export.',
          status: outputArtifacts.length > 0 ? 'complete' : 'waiting',
        },
      ],
    },
  ]
}

export function flattenChatToolActivityVisibleText(cards: ChatToolActivityCard[]): string {
  return cards.flatMap((card) => [
    card.eyebrow,
    card.title,
    card.summary,
    ...card.chips,
    card.nextAction ?? '',
    ...card.items.flatMap((item) => [item.label, item.detail, item.status ? statusLabel(item.status) : '']),
  ]).join('\n')
}

export function findRawToolNamesInChatToolActivityText(cards: ChatToolActivityCard[]): string[] {
  const visibleText = flattenChatToolActivityVisibleText(cards).toLowerCase()
  return chatToolActivityRawNameDenylist.filter((term) => visibleText.includes(term.toLowerCase()))
}
