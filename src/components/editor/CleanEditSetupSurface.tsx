import { useRef, type ChangeEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Link2, Plus, Trash2 } from 'lucide-react'
import { aspectRatioOptions } from '../../lib/aspect-ratio-frame-planner'
import type { SourceSequenceMoveDirection } from '../../lib/source-sequence'
import type {
  AspectRatio,
  CleanupPreference,
  ClipSource,
  EditLevel,
  SourceSequenceMode,
  VisualPreference,
} from '../../types/reeditpro'
import { Button, IconButton } from '../Button'

type SetupSurfaceProps = {
  step: number
  title: string
  description: string
  children: ReactNode
  aside?: ReactNode
  testId: string
}

export function SetupSurface({ aside, children, description, step, testId, title }: SetupSurfaceProps) {
  return (
    <section className="clean-edit-step" data-testid={testId}>
      <header className="clean-edit-step-header">
        <div>
          <span className="clean-edit-step-count">Setup {step} of 5</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {aside ? <div className="clean-edit-step-aside">{aside}</div> : null}
      </header>
      <div className="clean-edit-step-body">{children}</div>
    </section>
  )
}

type SourceSetupProps = {
  clips: ClipSource[]
  onAddClip: () => void
  onAttachFiles?: (files: File[]) => void
  onConfirmOrder: () => void
  onMoveClip: (id: string, direction: SourceSequenceMoveDirection) => void
  onRemoveClip: (id: string) => void
  onSetSourceSequenceMode: (mode: SourceSequenceMode) => void
  sourceSequenceMode: SourceSequenceMode
}

export function SourceSetup({
  clips,
  onAddClip,
  onAttachFiles,
  onConfirmOrder,
  onMoveClip,
  onRemoveClip,
  onSetSourceSequenceMode,
  sourceSequenceMode,
}: SourceSetupProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleAdd() {
    if (onAttachFiles) {
      inputRef.current?.click()
      return
    }
    onAddClip()
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length > 0) onAttachFiles?.(files)
  }

  return (
    <SetupSurface
      aside={<span className="clean-edit-step-meta">{clips.length} source{clips.length === 1 ? '' : 's'}</span>}
      description="Confirm the source context. ReeditPro can still recommend a stronger final story order in the plan."
      step={1}
      testId="source-summary"
      title={clips.length === 1 ? 'Use this source video' : 'Confirm source order'}
    >
      <div className="clean-source-list">
        {clips.map((clip, index) => (
          <div className="clean-source-row" key={clip.id}>
            <span className="clean-source-index">{index + 1}</span>
            <div className="clean-source-copy">
              <strong>{clip.fileName}</strong>
              <span>{[clip.duration, clip.detectedType].filter(Boolean).join(' · ') || 'Source video'}</span>
            </div>
            <div className="clean-source-actions">
              <IconButton
                disabled={index === 0 || clips.length === 1}
                icon={ArrowLeft}
                label={`Move ${clip.fileName} earlier`}
                onClick={() => onMoveClip(clip.id, 'left')}
              />
              <IconButton
                disabled={index === clips.length - 1 || clips.length === 1}
                icon={ArrowRight}
                label={`Move ${clip.fileName} later`}
                onClick={() => onMoveClip(clip.id, 'right')}
              />
              <IconButton icon={Trash2} label={`Remove ${clip.fileName}`} onClick={() => onRemoveClip(clip.id)} />
            </div>
          </div>
        ))}
      </div>

      <div className="clean-edit-step-actions clean-edit-step-actions-split">
        <div>
          {onAttachFiles ? (
            <input
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/x-matroska,video/x-msvideo,video/mp2t,application/mxf,.mxf,.mkv,.avi,.m2ts,.mts,.ts,.m4v"
              className="sr-only"
              multiple
              onChange={handleFiles}
              ref={inputRef}
              type="file"
            />
          ) : null}
          <Button icon={Plus} onClick={handleAdd} variant="ghost">Add source</Button>
          {clips.length > 1 ? (
            <Button
              onClick={() => onSetSourceSequenceMode('unordered_clips_needs_ai_help')}
              variant={sourceSequenceMode === 'unordered_clips_needs_ai_help' ? 'secondary' : 'ghost'}
            >
              Let AI suggest order
            </Button>
          ) : null}
        </div>
        <Button disabled={clips.length === 0} onClick={onConfirmOrder} variant="primary">
          {clips.length === 1 ? 'Use this source' : 'Confirm order'}
        </Button>
      </div>
    </SetupSurface>
  )
}

type FrameSetupProps = {
  onConfirm: () => void
  onSelect: (ratio: AspectRatio) => void
  selected: AspectRatio
}

export function FrameSetup({ onConfirm, onSelect, selected }: FrameSetupProps) {
  const concreteSelection = selected === 'let_ai_decide' ? undefined : selected

  return (
    <SetupSurface
      description="Choose the final canvas now so captions, visual panels, and the credit estimate are planned correctly."
      step={2}
      testId="output-frame-control"
      title="Choose the output frame"
    >
      <div aria-label="Output frame" className="clean-choice-grid clean-choice-grid-frame" role="radiogroup">
        {aspectRatioOptions.map((option) => (
          <button
            aria-checked={concreteSelection === option.id}
            className={concreteSelection === option.id ? 'clean-choice clean-choice-selected' : 'clean-choice'}
            key={option.id}
            onClick={() => onSelect(option.id)}
            role="radio"
            type="button"
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
            <small>{option.canvasWidth} × {option.canvasHeight}</small>
          </button>
        ))}
      </div>
      <div className="clean-edit-step-actions">
        <Button disabled={!concreteSelection} onClick={onConfirm} variant="primary">Confirm frame</Button>
      </div>
    </SetupSurface>
  )
}

const cleanupLabels: Record<CleanupPreference, { label: string; description: string }> = {
  preserve_natural: { label: 'Preserve natural', description: 'Keep authentic pauses and human rhythm.' },
  light_cleanup: { label: 'Light cleanup', description: 'Remove only obvious dead space and mistakes.' },
  balanced_cleanup: { label: 'Balanced', description: 'Clean filler and repeats while preserving meaning.' },
  tight_retention_cleanup: { label: 'Tight', description: 'Use quicker social pacing without losing the point.' },
  aggressive_cleanup: { label: 'Aggressive', description: 'Maximum cutdown; review meaning-sensitive cuts.' },
  documentary_faithful: { label: 'Documentary', description: 'Protect claims, proof, and surrounding context.' },
  tutorial_complete: { label: 'Tutorial complete', description: 'Keep every step required to understand the process.' },
  custom: { label: 'Custom', description: 'Follow explicit cleanup direction from chat or Edit Brief.' },
}

type CleanupSetupProps = {
  onConfirm: () => void
  onSelect: (preference: CleanupPreference) => void
  options: CleanupPreference[]
  recommended?: CleanupPreference
  selected?: CleanupPreference
}

export function CleanupSetup({ onConfirm, onSelect, options, recommended, selected }: CleanupSetupProps) {
  return (
    <SetupSurface
      description="Choose how tightly ReeditPro should clean the source. Meaning and required context always outrank pace."
      step={3}
      testId="cleanup-control"
      title="Set the cleanup level"
    >
      <div aria-label="Cleanup level" className="clean-choice-grid" role="radiogroup">
        {options.map((option) => {
          const copy = cleanupLabels[option]
          return (
            <button
              aria-checked={selected === option}
              className={selected === option ? 'clean-choice clean-choice-selected' : 'clean-choice'}
              key={option}
              onClick={() => onSelect(option)}
              role="radio"
              type="button"
            >
              <strong>{copy.label}</strong>
              <span>{copy.description}</span>
              {recommended === option ? <small>Recommended</small> : null}
            </button>
          )
        })}
      </div>
      <div className="clean-edit-step-actions">
        <Button disabled={!selected} onClick={onConfirm} variant="primary">Confirm cleanup</Button>
      </div>
    </SetupSurface>
  )
}

const editLevelOptions: Array<{ id: EditLevel; label: string; description: string }> = [
  { id: 'basic', label: 'Normal', description: 'Professional, focused editing with the lowest planning depth.' },
  { id: 'pro', label: 'Premium', description: 'More creative planning, visual options, and stronger review depth.' },
  { id: 'premium', label: 'Ultra Premium', description: 'Studio-level planning depth and the broadest premium treatment.' },
]

type EditLevelSetupProps = {
  onConfirm: () => void
  onSelect: (level: EditLevel) => void
  selected: EditLevel
}

export function EditLevelSetup({ onConfirm, onSelect, selected }: EditLevelSetupProps) {
  return (
    <SetupSurface
      description="Edit level changes planning depth and credit range—not the professional quality baseline."
      step={4}
      testId="edit-level-control"
      title="Choose the edit level"
    >
      <div aria-label="Edit level" className="clean-choice-grid clean-choice-grid-three" role="radiogroup">
        {editLevelOptions.map((option) => (
          <button
            aria-checked={selected === option.id}
            className={selected === option.id ? 'clean-choice clean-choice-selected' : 'clean-choice'}
            key={option.id}
            onClick={() => onSelect(option.id)}
            role="radio"
            type="button"
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
      <div className="clean-edit-step-actions">
        <Button onClick={onConfirm} variant="primary">Use {editLevelOptions.find((option) => option.id === selected)?.label}</Button>
      </div>
    </SetupSurface>
  )
}

const visualOptions: Array<{ id: VisualPreference; label: string; description: string }> = [
  { id: 'let_ai_decide', label: 'Let ReeditPro decide', description: 'Use the source and story to choose the right restraint.' },
  { id: 'keep_visuals_minimal', label: 'Minimal', description: 'Keep attention on the source with only essential support.' },
  { id: 'balanced_visual_mix', label: 'Balanced', description: 'Mix clean source editing with useful visual explanation.' },
  { id: 'more_stroke_motion', label: 'More story animation', description: 'Use animated explanation when it clarifies meaning.' },
  { id: 'more_graphic_design', label: 'More visual design', description: 'Use cards, diagrams, labels, and designed evidence.' },
  { id: 'real_motion_if_useful', label: 'Premium motion if useful', description: 'Allow premium motion only where the plan justifies it.' },
  { id: 'no_extra_visuals', label: 'Source only', description: 'Avoid added visual systems unless required for clarity.' },
]

type VisualSetupProps = {
  onConfirm: () => void
  onSelect: (preference: VisualPreference) => void
  selected: VisualPreference
}

export function VisualSetup({ onConfirm, onSelect, selected }: VisualSetupProps) {
  return (
    <SetupSurface
      description="Set the visual restraint. The plan will still choose treatments segment by segment instead of applying one template."
      step={5}
      testId="visual-direction-control"
      title="Choose the visual direction"
    >
      <div aria-label="Visual direction" className="clean-choice-grid" role="radiogroup">
        {visualOptions.map((option) => (
          <button
            aria-checked={selected === option.id}
            className={selected === option.id ? 'clean-choice clean-choice-selected' : 'clean-choice'}
            key={option.id}
            onClick={() => onSelect(option.id)}
            role="radio"
            type="button"
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
      <div className="clean-edit-step-actions">
        <Button onClick={onConfirm} variant="primary">Confirm direction</Button>
      </div>
    </SetupSurface>
  )
}

const referenceFocusOptions = [
  ['pacing', 'Pacing'],
  ['caption_style', 'Captions'],
  ['visual_language', 'Visual language'],
  ['sound_feel', 'Sound'],
] as const

type ReferenceSetupProps = {
  onAttach: () => void
  onChangeUrl: (value: string) => void
  onSkip: () => void
  onToggleFocus: (id: string) => void
  selectedFocus: string[]
  url: string
}

export function ReferenceSetup({ onAttach, onChangeUrl, onSkip, onToggleFocus, selectedFocus, url }: ReferenceSetupProps) {
  return (
    <section className="clean-edit-step clean-reference-step" data-testid="reference-control">
      <header className="clean-edit-step-header">
        <div>
          <span className="clean-edit-step-count">Optional</span>
          <h2>Add a reference</h2>
          <p>ReeditPro can study its pacing or visual language without copying it.</p>
        </div>
        <Link2 aria-hidden="true" size={20} />
      </header>
      <label className="clean-reference-field">
        <span>Public reference link</span>
        <input
          onChange={(event) => onChangeUrl(event.target.value)}
          placeholder="Paste a YouTube, Vimeo, or public video link"
          type="url"
          value={url}
        />
      </label>
      <div aria-label="What to study" className="clean-reference-focus">
        {referenceFocusOptions.map(([id, label]) => (
          <button
            aria-pressed={selectedFocus.includes(id)}
            className={selectedFocus.includes(id) ? 'clean-reference-chip clean-reference-chip-selected' : 'clean-reference-chip'}
            key={id}
            onClick={() => onToggleFocus(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="clean-edit-step-actions">
        <Button onClick={onSkip} variant="ghost">Skip reference</Button>
        <Button disabled={!url.trim()} onClick={onAttach} variant="primary">Use reference</Button>
      </div>
    </section>
  )
}
