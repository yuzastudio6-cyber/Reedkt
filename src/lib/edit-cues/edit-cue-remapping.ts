import type {
  EditCue,
  EditCueAnchor,
  EditCueRemapResult,
  SourceTimeMapping,
  WorkflowTimeRange,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import {
  isRawRangeRemoved,
  mapRawRangeToCleanRange,
  mapRawTimeToCleanTime,
} from '../footage-prep/source-time-mapping'

type RemapEditCueAnchorInput = {
  cue: EditCue
  sourceTimeMappings: SourceTimeMapping[]
  cleanAssemblyId?: string
}

type RemapEditCuesInput = {
  cues: EditCue[]
  sourceTimeMappings: SourceTimeMapping[]
}

function toCompleteRange(anchor: Extract<EditCueAnchor, { type: 'time_range' }>): WorkflowTimeRange {
  return {
    startMs: anchor.range.startMs,
    endMs: anchor.range.endMs ?? anchor.range.startMs,
  }
}

function rangesOverlap(first: WorkflowTimeRange, second: WorkflowTimeRange) {
  return first.startMs < second.endMs && second.startMs < first.endMs
}

function findMappingIdForRawRange(rawRange: WorkflowTimeRange, mappings: SourceTimeMapping[]) {
  return mappings.find((mapping) =>
    mapping.mappingReason !== 'removed' &&
    Boolean(mapping.cleanAssemblyRange) &&
    rangesOverlap(mapping.rawSourceRange, rawRange),
  )?.id
}

function partialMappedRange(rawRange: WorkflowTimeRange, mappings: SourceTimeMapping[]): WorkflowTimeRange | undefined {
  const mappedRanges = mappings.flatMap((mapping) => {
    if (mapping.mappingReason === 'removed' || !mapping.cleanAssemblyRange || !rangesOverlap(mapping.rawSourceRange, rawRange)) {
      return []
    }

    const overlapStart = Math.max(mapping.rawSourceRange.startMs, rawRange.startMs)
    const overlapEnd = Math.min(mapping.rawSourceRange.endMs, rawRange.endMs)
    const mappedStart = mapRawTimeToCleanTime(overlapStart, [mapping])
    const mappedEnd = mapRawTimeToCleanTime(overlapEnd, [mapping])

    return mappedStart !== undefined && mappedEnd !== undefined && mappedEnd > mappedStart
      ? [{ startMs: mappedStart, endMs: mappedEnd }]
      : []
  })

  if (mappedRanges.length === 0) {
    return undefined
  }

  return {
    startMs: Math.min(...mappedRanges.map((range) => range.startMs)),
    endMs: Math.max(...mappedRanges.map((range) => range.endMs)),
  }
}

function remappedAnchor(range: WorkflowTimeRange, sourceTimeMappingId?: string): EditCueAnchor {
  return {
    type: 'time_range',
    timebase: 'clean_assembly',
    range,
    sourceTimeMappingId,
  }
}

export function remapEditCueAnchorToCleanAssembly(input: RemapEditCueAnchorInput): EditCueRemapResult {
  const { cue, sourceTimeMappings } = input
  const originalAnchor = cue.anchor

  if (originalAnchor.type !== 'time_range') {
    return {
      editCueId: cue.id,
      status: 'not_needed',
      originalAnchor,
      message: `${getCueTimebaseLabel(originalAnchor)} cues already use planning-safe references.`,
    }
  }

  if (originalAnchor.timebase === 'clean_assembly') {
    return {
      editCueId: cue.id,
      status: 'not_needed',
      originalAnchor,
      message: 'Cue already uses Clean Assembly timing.',
    }
  }

  if (originalAnchor.timebase === 'final_edit') {
    return {
      editCueId: cue.id,
      status: 'not_needed',
      originalAnchor,
      message: 'Final edit timing is left unchanged until planning creates the final timeline.',
    }
  }

  const rawRange = toCompleteRange(originalAnchor)
  const mappedRange = mapRawRangeToCleanRange(rawRange, sourceTimeMappings)
  const sourceTimeMappingId = findMappingIdForRawRange(rawRange, sourceTimeMappings)

  if (mappedRange) {
    return {
      editCueId: cue.id,
      status: 'mapped',
      originalAnchor,
      remappedAnchor: remappedAnchor(mappedRange, sourceTimeMappingId),
      sourceTimeMappingId,
      message: 'Cue timing can be mapped to the Clean Assembly.',
    }
  }

  if (isRawRangeRemoved(rawRange, sourceTimeMappings)) {
    return {
      editCueId: cue.id,
      status: 'removed_source',
      originalAnchor,
      sourceTimeMappingId,
      message: 'This raw source range was removed from the Clean Assembly.',
    }
  }

  const partialRange = partialMappedRange(rawRange, sourceTimeMappings)
  if (partialRange) {
    return {
      editCueId: cue.id,
      status: 'partially_mapped',
      originalAnchor,
      remappedAnchor: remappedAnchor(partialRange, sourceTimeMappingId),
      sourceTimeMappingId,
      message: 'Part of this raw source cue can be mapped to the Clean Assembly.',
    }
  }

  return {
    editCueId: cue.id,
    status: 'failed',
    originalAnchor,
    message: 'This raw source cue could not be mapped to Clean Assembly timing.',
  }
}

export function remapEditCuesToCleanAssembly(input: RemapEditCuesInput): {
  cues: EditCue[]
  remapResults: EditCueRemapResult[]
} {
  const remapResults = input.cues.map((cue) =>
    remapEditCueAnchorToCleanAssembly({
      cue,
      sourceTimeMappings: input.sourceTimeMappings,
    }),
  )

  const cues = input.cues.map((cue) => {
    const remapResult = remapResults.find((result) => result.editCueId === cue.id)
    if (!remapResult?.remappedAnchor || (remapResult.status !== 'mapped' && remapResult.status !== 'partially_mapped')) {
      return cue
    }

    return {
      ...cue,
      anchor: remapResult.remappedAnchor,
      updatedAt: MOCK_CREATED_AT,
    }
  })

  return { cues, remapResults }
}

export function getCueTimeRange(cue: EditCue): WorkflowTimeRange | undefined {
  if (cue.anchor.type === 'time_range' && cue.anchor.range.endMs !== undefined) {
    return {
      startMs: cue.anchor.range.startMs,
      endMs: cue.anchor.range.endMs,
    }
  }

  if (cue.anchor.type === 'transcript_range') {
    return cue.anchor.cleanAssemblyRange
  }

  if (cue.anchor.type === 'scene') {
    return cue.anchor.cleanAssemblyRange
  }

  return undefined
}

export function getCueTimebaseLabel(anchor: EditCueAnchor) {
  if (anchor.type === 'time_range') {
    if (anchor.timebase === 'raw_source') return 'Raw source'
    if (anchor.timebase === 'clean_assembly') return 'Clean Assembly'
    return 'Final edit'
  }

  if (anchor.type === 'transcript_range') return 'Transcript'
  if (anchor.type === 'scene') return 'Scene'
  if (anchor.type === 'asset') return 'Asset'
  return 'Global'
}
