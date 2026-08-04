import type {
  EditCueAnchor,
  EditCueAnchorOption,
  EditCueAnchorType,
} from '../../../types'

type EditCueAnchorPickerProps = {
  value: EditCueAnchor
  options: EditCueAnchorOption[]
  onChange?: (anchor: EditCueAnchor) => void
}

const anchorTypeOptions: Array<{ label: string; value: EditCueAnchorType }> = [
  { label: 'Global rule', value: 'global' },
  { label: 'Clean Assembly time', value: 'time_range' },
  { label: 'Transcript', value: 'transcript_range' },
  { label: 'Scene', value: 'scene' },
  { label: 'Asset', value: 'asset' },
]

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function optionsForType(options: EditCueAnchorOption[], type: EditCueAnchorType) {
  return options.filter((option) => option.type === type)
}

function firstOption(options: EditCueAnchorOption[], type: EditCueAnchorType) {
  return optionsForType(options, type)[0]
}

function createAnchorFromOption(type: EditCueAnchorType, option?: EditCueAnchorOption): EditCueAnchor {
  if (type === 'time_range') {
    return {
      type,
      timebase: 'clean_assembly',
      range: option?.timeRange ?? { startMs: 0, endMs: 5000 },
    }
  }

  if (type === 'transcript_range') {
    return {
      type,
      transcriptSegmentIds: option ? [option.id] : [],
      quotedText: option?.transcriptText,
      cleanAssemblyRange: option?.timeRange,
    }
  }

  if (type === 'scene') {
    return {
      type,
      sceneSegmentId: option?.sceneSegmentId ?? option?.id ?? '',
      cleanAssemblyRange: option?.timeRange,
    }
  }

  if (type === 'asset') {
    return {
      type,
      mediaAssetId: option?.mediaAssetId ?? '',
    }
  }

  return { type: 'global' }
}

function selectedOptionId(anchor: EditCueAnchor, options: EditCueAnchorOption[]) {
  if (anchor.type === 'global') return 'global'
  if (anchor.type === 'asset') return options.find((option) => option.mediaAssetId === anchor.mediaAssetId)?.id ?? ''
  if (anchor.type === 'scene') return options.find((option) => option.sceneSegmentId === anchor.sceneSegmentId)?.id ?? anchor.sceneSegmentId
  if (anchor.type === 'transcript_range') return anchor.transcriptSegmentIds[0] ?? ''

  return options.find((option) => (
    option.type === 'time_range'
    && option.timeRange?.startMs === anchor.range.startMs
    && option.timeRange?.endMs === anchor.range.endMs
  ))?.id ?? ''
}

function secondsFromMs(ms?: number) {
  if (ms === undefined) return ''
  return String(Math.round(ms / 100) / 10)
}

function msFromSeconds(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 1000)) : 0
}

export function EditCueAnchorPicker({
  onChange,
  options,
  value,
}: EditCueAnchorPickerProps) {
  const typedOptions = optionsForType(options, value.type)

  function handleTypeChange(nextType: EditCueAnchorType) {
    onChange?.(createAnchorFromOption(nextType, firstOption(options, nextType)))
  }

  function handleOptionChange(optionId: string) {
    const selected = typedOptions.find((option) => option.id === optionId)
    onChange?.(createAnchorFromOption(value.type, selected))
  }

function updateTimeRange(next: Partial<{ startMs: number; endMs: number }>) {
    const currentRange = value.type === 'time_range' ? value.range : { startMs: 0, endMs: 5000 }
    onChange?.({
      type: 'time_range',
      timebase: value.type === 'time_range' ? value.timebase : 'clean_assembly',
      range: {
        ...currentRange,
        ...next,
      },
    })
  }

  function updateTimebase(timebase: 'raw_source' | 'clean_assembly') {
    const currentRange = value.type === 'time_range' ? value.range : { startMs: 0, endMs: 5000 }
    onChange?.({
      type: 'time_range',
      timebase,
      range: currentRange,
    })
  }

  return (
    <section className="edit-cue-section edit-cue-anchor-picker">
      <div>
        <strong>Anchor</strong>
        <p className="inline-helper">Attach this cue to a moment, transcript line, scene, asset, or global rule.</p>
      </div>

      <div className="edit-cue-field-grid">
        <label className="edit-cue-field">
          <span>Anchor type</span>
          <select onChange={(event) => handleTypeChange(event.target.value as EditCueAnchorType)} value={value.type}>
            {anchorTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        {value.type !== 'global' && (
          <label className="edit-cue-field">
            <span>{formatLabel(value.type)}</span>
            <select onChange={(event) => handleOptionChange(event.target.value)} value={selectedOptionId(value, typedOptions)}>
              <option value="">Choose {formatLabel(value.type)}</option>
              {typedOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}{option.description ? ` - ${option.description}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {value.type === 'time_range' && (
        <div className="edit-cue-field-grid">
          <label className="edit-cue-field">
            <span>Timebase</span>
            <select onChange={(event) => updateTimebase(event.target.value as 'raw_source' | 'clean_assembly')} value={value.timebase === 'raw_source' ? 'raw_source' : 'clean_assembly'}>
              <option value="clean_assembly">Clean Assembly</option>
              <option value="raw_source">Raw Source</option>
            </select>
          </label>
          <label className="edit-cue-field">
            <span>Start seconds</span>
            <input
              min="0"
              onChange={(event) => updateTimeRange({ startMs: msFromSeconds(event.target.value) })}
              type="number"
              value={secondsFromMs(value.range.startMs)}
            />
          </label>
          <label className="edit-cue-field">
            <span>End seconds</span>
            <input
              min="0"
              onChange={(event) => updateTimeRange({ endMs: msFromSeconds(event.target.value) })}
              type="number"
              value={secondsFromMs(value.range.endMs)}
            />
          </label>
        </div>
      )}
    </section>
  )
}
