import type {
  CleanAssembly,
  EditCue,
  EditCueConflictRecord,
  EditCueConflictSummary,
  EditCueConflictKind,
  EditCueConflictSeverity,
  EditCueRemapResult,
  SourceLibraryState,
  SourceTimeMapping,
  WorkflowTimeRange,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { getCueTimeRange } from './edit-cue-remapping'

type DetectEditCueConflictsInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  cues: EditCue[]
  sourceLibraryState?: SourceLibraryState | null
  cleanAssembly?: CleanAssembly | null
  sourceTimeMappings?: SourceTimeMapping[]
  remapResults?: EditCueRemapResult[]
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

const visualDurationRoles = new Set<EditCue['role']>([
  'b_roll',
  'overlay',
  'picture_in_picture',
  'split_screen',
  'insert_clip',
  'text_overlay',
  'graphic',
])

const shortDurationRoles = new Set<EditCue['role']>([
  'overlay',
  'text_overlay',
  'graphic',
  'sound_effect',
])

const audioRoles = new Set<EditCue['role']>([
  'sound_effect',
  'music',
])

function conflictId(projectId: string, index: number) {
  return `${projectId}-edit-cue-conflict-${String(index).padStart(3, '0')}`
}

function rangesOverlap(first?: WorkflowTimeRange, second?: WorkflowTimeRange) {
  if (!first || !second) return false
  return first.startMs < second.endMs && second.startMs < first.endMs
}

function sourceAssetIsDoNotUse(mediaAssetId: string, sourceLibraryState?: SourceLibraryState | null) {
  const sourceAsset = sourceLibraryState?.assets.find((asset) => asset.mediaAssetId === mediaAssetId)
  return sourceAsset?.userRole === 'do_not_use' || sourceAsset?.priority === 'do_not_use'
}

function createConflict(
  input: DetectEditCueConflictsInput,
  index: number,
  conflict: {
    editCueIds: string[]
    kind: EditCueConflictKind
    severity: EditCueConflictSeverity
    message: string
    suggestedResolution?: string
  },
): EditCueConflictRecord {
  return {
    id: conflictId(input.projectId, index),
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    editCueIds: conflict.editCueIds,
    kind: conflict.kind,
    severity: conflict.severity,
    status: 'open',
    message: conflict.message,
    suggestedResolution: conflict.suggestedResolution,
    resolutionType: 'unresolved',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

function addConflict(
  conflicts: EditCueConflictRecord[],
  input: DetectEditCueConflictsInput,
  conflict: Parameters<typeof createConflict>[2],
) {
  conflicts.push(createConflict(input, conflicts.length + 1, conflict))
}

function duration(range?: WorkflowTimeRange) {
  return range ? range.endMs - range.startMs : undefined
}

function sharedAssets(first: EditCue, second: EditCue) {
  const secondAssetIds = new Set(second.assetRefs.map((asset) => asset.mediaAssetId))
  return first.assetRefs.filter((asset) => secondAssetIds.has(asset.mediaAssetId))
}

function globalConflict(first: EditCue, second: EditCue) {
  if (first.anchor.type !== 'global' || second.anchor.type !== 'global') return false
  if (sharedAssets(first, second).length === 0) return false

  const firstAvoids = first.role === 'avoid' || first.priority === 'avoid' || first.priority === 'do_not_use'
  const secondAvoids = second.role === 'avoid' || second.priority === 'avoid' || second.priority === 'do_not_use'
  const firstRequires = first.priority === 'must_follow'
  const secondRequires = second.priority === 'must_follow'

  return (firstAvoids && secondRequires) || (secondAvoids && firstRequires)
}

export function detectEditCueConflicts(input: DetectEditCueConflictsInput): EditCueConflictRecord[] {
  const conflicts: EditCueConflictRecord[] = []

  input.remapResults?.forEach((result) => {
    if (result.status === 'removed_source') {
      addConflict(conflicts, input, {
        editCueIds: [result.editCueId],
        kind: 'cue_points_to_removed_footage',
        severity: 'blocking',
        message: 'This cue points to raw source footage that was removed from the Clean Assembly.',
        suggestedResolution: 'Remap the cue, choose a different anchor, or let AI decide.',
      })
    }
    if (result.status === 'failed') {
      addConflict(conflicts, input, {
        editCueIds: [result.editCueId],
        kind: 'cue_points_to_removed_footage',
        severity: 'blocking',
        message: 'This cue could not be mapped to the Clean Assembly.',
        suggestedResolution: 'Choose a Clean Assembly anchor or let AI decide.',
      })
    }
  })

  input.cues.forEach((cue) => {
    cue.assetRefs.forEach((asset) => {
      if (sourceAssetIsDoNotUse(asset.mediaAssetId, input.sourceLibraryState)) {
        addConflict(conflicts, input, {
          editCueIds: [cue.id],
          kind: 'asset_marked_do_not_use',
          severity: 'blocking',
          message: 'This cue uses an asset marked do-not-use in the Source Library.',
          suggestedResolution: 'Remove the asset, choose another asset, or change the cue priority.',
        })
      }
    })

    const range = getCueTimeRange(cue)
    if (cue.anchor.type === 'time_range' && cue.anchor.timebase === 'clean_assembly' && input.cleanAssembly) {
      const endMs = cue.anchor.range.endMs ?? cue.anchor.range.startMs
      if (cue.anchor.range.startMs < 0 || endMs > input.cleanAssembly.durationMs) {
        addConflict(conflicts, input, {
          editCueIds: [cue.id],
          kind: 'timing_outside_clean_assembly',
          severity: 'blocking',
          message: 'This cue is outside the Clean Assembly duration.',
          suggestedResolution: 'Adjust the timing or remap the cue.',
        })
      }
    }

    const cueDuration = duration(range)
    if (cueDuration !== undefined && cueDuration < 500 && visualDurationRoles.has(cue.role)) {
      addConflict(conflicts, input, {
        editCueIds: [cue.id],
        kind: 'duration_too_short',
        severity: 'warning',
        message: 'This visual cue is shorter than 0.5 seconds.',
        suggestedResolution: 'Lengthen the cue or let AI decide the timing.',
      })
    }

    if (cueDuration !== undefined && cueDuration > 30000 && shortDurationRoles.has(cue.role)) {
      addConflict(conflicts, input, {
        editCueIds: [cue.id],
        kind: 'duration_too_long',
        severity: 'warning',
        message: 'This cue may be too long for an overlay, text, graphic, or SFX instruction.',
        suggestedResolution: 'Shorten the cue or let AI decide how to integrate it.',
      })
    }

    if (rolesThatPreferAssets.has(cue.role) && cue.assetRefs.length === 0) {
      addConflict(conflicts, input, {
        editCueIds: [cue.id],
        kind: 'missing_asset',
        severity: 'warning',
        message: 'This cue role usually needs a Source Library asset.',
        suggestedResolution: 'Attach an asset or change the cue role.',
      })
    }

    if (cue.role === 'reference_only' && cue.priority === 'must_follow') {
      addConflict(conflicts, input, {
        editCueIds: [cue.id],
        kind: 'ambiguous_role',
        severity: 'warning',
        message: 'Reference-only cues should not usually be marked must-follow.',
        suggestedResolution: 'Change the priority to prefer or optional.',
      })
    }
  })

  input.cues.forEach((firstCue, firstIndex) => {
    input.cues.slice(firstIndex + 1).forEach((secondCue) => {
      const firstRange = getCueTimeRange(firstCue)
      const secondRange = getCueTimeRange(secondCue)
      const overlaps = rangesOverlap(firstRange, secondRange)

      if (overlaps && firstCue.priority === 'must_follow' && secondCue.priority === 'must_follow') {
        addConflict(conflicts, input, {
          editCueIds: [firstCue.id, secondCue.id],
          kind: 'overlapping_must_follow',
          severity: 'blocking',
          message: 'Two must-follow cues overlap in Clean Assembly timing.',
          suggestedResolution: 'Use one cue, make one optional, split timing, or let AI decide.',
        })
      }

      if (overlaps && sharedAssets(firstCue, secondCue).length > 0 && firstCue.priority === 'must_follow' && secondCue.priority === 'must_follow') {
        addConflict(conflicts, input, {
          editCueIds: [firstCue.id, secondCue.id],
          kind: 'duplicate_asset_usage',
          severity: firstCue.timingFlexibility === 'exact' && secondCue.timingFlexibility === 'exact' ? 'blocking' : 'warning',
          message: 'The same asset is attached to overlapping must-follow cues.',
          suggestedResolution: 'Use one cue, make one optional, or let AI decide.',
        })
      }

      if (overlaps && firstCue.priority === 'must_follow' && secondCue.priority === 'must_follow' && audioRoles.has(firstCue.role) && audioRoles.has(secondCue.role)) {
        addConflict(conflicts, input, {
          editCueIds: [firstCue.id, secondCue.id],
          kind: 'audio_conflict',
          severity: 'warning',
          message: 'Two must-follow audio cues overlap.',
          suggestedResolution: 'Make one optional or let AI decide the mix.',
        })
      }

      if (globalConflict(firstCue, secondCue)) {
        addConflict(conflicts, input, {
          editCueIds: [firstCue.id, secondCue.id],
          kind: 'global_rule_conflict',
          severity: 'warning',
          message: 'Global cue rules conflict for the same asset.',
          suggestedResolution: 'Keep one rule, make one optional, or let AI decide.',
        })
      }
    })
  })

  return conflicts
}

export function summarizeEditCueConflicts(
  conflicts: EditCueConflictRecord[],
  remapResults: EditCueRemapResult[],
): EditCueConflictSummary {
  return {
    totalConflicts: conflicts.length,
    openConflicts: conflicts.filter((conflict) => conflict.status === 'open').length,
    resolvedConflicts: conflicts.filter((conflict) => conflict.status === 'resolved').length,
    ignoredConflicts: conflicts.filter((conflict) => conflict.status === 'ignored').length,
    blockingConflicts: conflicts.filter((conflict) => conflict.status === 'open' && conflict.severity === 'blocking').length,
    warningConflicts: conflicts.filter((conflict) => conflict.status === 'open' && conflict.severity === 'warning').length,
    infoConflicts: conflicts.filter((conflict) => conflict.status === 'open' && conflict.severity === 'info').length,
    remapPendingCount: remapResults.filter((result) => result.status === 'pending').length,
    remapFailedCount: remapResults.filter((result) => result.status === 'failed').length,
    removedSourceCueCount: remapResults.filter((result) => result.status === 'removed_source').length,
  }
}

export function hasBlockingCueConflicts(conflicts: EditCueConflictRecord[]) {
  return conflicts.some((conflict) => conflict.status === 'open' && conflict.severity === 'blocking')
}

export function getConflictsForCue(conflicts: EditCueConflictRecord[], cueId: string) {
  return conflicts.filter((conflict) => conflict.editCueIds.includes(cueId))
}
