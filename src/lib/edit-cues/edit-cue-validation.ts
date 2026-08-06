import type {
  CleanAssembly,
  EditCue,
  EditCueAssetOption,
  EditCueValidationIssue,
  EditCuesState,
  SourceLibraryState,
} from '../../types'

export type EditCueValidationContext = {
  cleanAssembly?: CleanAssembly | null
  sourceLibraryState?: SourceLibraryState | null
  assetOptions?: EditCueAssetOption[]
}

const rolesThatPreferAssets = new Set<EditCue['role']>([
  'b_roll',
  'overlay',
  'picture_in_picture',
  'split_screen',
  'insert_clip',
  'sound_effect',
  'music',
])

function issueId(editCueId: string, type: EditCueValidationIssue['type'], index: number) {
  return `${editCueId}-validation-${type}-${String(index).padStart(3, '0')}`
}

function createIssue(
  cue: EditCue,
  index: number,
  issue: Omit<EditCueValidationIssue, 'id' | 'editCueId'>,
): EditCueValidationIssue {
  return {
    id: issueId(cue.id, issue.type, index),
    editCueId: cue.id,
    ...issue,
  }
}

function isAssetDoNotUse(mediaAssetId: string, context: EditCueValidationContext) {
  const sourceAsset = context.sourceLibraryState?.assets.find((asset) => asset.mediaAssetId === mediaAssetId)
  if (sourceAsset?.userRole === 'do_not_use' || sourceAsset?.priority === 'do_not_use') return true

  const option = context.assetOptions?.find((asset) => asset.mediaAssetId === mediaAssetId)
  return Boolean(option?.disabled)
}

export function validateEditCue(cue: EditCue, context: EditCueValidationContext = {}): EditCueValidationIssue[] {
  const issues: EditCueValidationIssue[] = []

  if (!cue.title.trim()) {
    issues.push(createIssue(cue, issues.length + 1, {
      severity: 'warning',
      type: 'missing_title',
      message: 'Add a short title so this cue is easy to review later.',
      suggestedFix: 'Name what this cue should do.',
    }))
  }

  if (!cue.anchor) {
    issues.push(createIssue(cue, issues.length + 1, {
      severity: 'warning',
      type: 'missing_anchor',
      message: 'Choose where this cue should apply.',
      suggestedFix: 'Pick a time, transcript line, scene, asset, or global rule.',
    }))
  }

  if (!cue.instructions.trim()) {
    issues.push(createIssue(cue, issues.length + 1, {
      severity: 'warning',
      type: cue.anchor.type === 'global' ? 'global_cue_without_instruction' : 'missing_instruction',
      message: cue.anchor.type === 'global'
        ? 'Global cues need instructions so AI knows what rule to follow.'
        : 'Add instructions describing what AI should do with this cue.',
      suggestedFix: 'Write a concise planning instruction.',
    }))
  }

  if (rolesThatPreferAssets.has(cue.role) && cue.assetRefs.length === 0) {
    issues.push(createIssue(cue, issues.length + 1, {
      severity: 'warning',
      type: 'missing_asset',
      message: 'This cue role usually works best with an attached asset.',
      suggestedFix: 'Attach a Source Library asset or change the cue role.',
    }))
  }

  cue.assetRefs.forEach((assetRef) => {
    if (isAssetDoNotUse(assetRef.mediaAssetId, context)) {
      issues.push(createIssue(cue, issues.length + 1, {
        severity: 'blocking',
        type: 'asset_marked_do_not_use',
        message: 'This cue points to an asset marked do-not-use.',
        suggestedFix: 'Remove the asset or change its Source Library role first.',
      }))
    }
  })

  if (cue.anchor.type === 'time_range') {
    const { startMs, endMs } = cue.anchor.range

    if (endMs !== undefined && endMs <= startMs) {
      issues.push(createIssue(cue, issues.length + 1, {
        severity: 'blocking',
        type: 'time_range_invalid',
        message: 'The cue time range must end after it starts.',
        suggestedFix: 'Increase the end time or lower the start time.',
      }))
    }

    if (cue.anchor.timebase === 'clean_assembly' && context.cleanAssembly) {
      const end = endMs ?? startMs
      if (startMs < 0 || end > context.cleanAssembly.durationMs) {
        issues.push(createIssue(cue, issues.length + 1, {
          severity: 'blocking',
          type: 'time_range_outside_clean_assembly',
          message: 'This cue is outside the Clean Assembly duration.',
          suggestedFix: 'Choose a time inside the Clean Assembly.',
        }))
      }
    }
  }

  if (cue.role === 'avoid' && !cue.instructions.trim()) {
    issues.push(createIssue(cue, issues.length + 1, {
      severity: 'warning',
      type: 'missing_instruction',
      message: 'Avoid cues need a short reason or instruction.',
      suggestedFix: 'Explain what AI should avoid.',
    }))
  }

  return issues
}

export function validateEditCuesState(
  state: EditCuesState,
  context: EditCueValidationContext = {},
): EditCueValidationIssue[] {
  return state.cues.flatMap((cue) => validateEditCue(cue, context))
}
