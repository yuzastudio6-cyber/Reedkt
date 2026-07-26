import {
  Check,
  CircleAlert,
  Clock3,
  Film,
  Flag,
  LockKeyhole,
  MessageSquareText,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'
import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useCanonicalEditBriefAuthority } from '../../../hooks/useCanonicalEditBriefAuthority'
import {
  createProjectSourceVideoLocalPreviewFromFile,
  revokeProjectSourceVideoLocalPreview,
} from '../../../lib/project-source-video-local-preview'
import type { CanonicalEditBriefScope } from '../../../lib/edit-brief-authority-client'
import { saveEditBriefLocalPreviewFile } from '../../../lib/edit-brief-local-preview-session'
import type { EditBrief } from '../../../types'
import type {
  CanonicalEditBriefMarker,
  CanonicalEditBriefMarkerDraft,
  CanonicalEditBriefMarkerPriority,
  CanonicalEditBriefMarkerType,
} from '../../../types/edit-brief-authority'
import type { ClipSource } from '../../../types/reeditpro'
import type { ProjectSourceVideoLocalPreview } from '../../../types/project-source-video'
import { Button } from '../../Button'

const MARKER_TYPES: Array<{
  value: CanonicalEditBriefMarkerType
  label: string
}> = [
  { value: 'note', label: 'Direction' },
  { value: 'keep', label: 'Keep' },
  { value: 'cut', label: 'Cut / tighten' },
  { value: 'broll', label: 'B-roll' },
  { value: 'caption', label: 'Caption' },
  { value: 'graphic', label: 'Graphic' },
  { value: 'story', label: 'Story beat' },
  { value: 'music', label: 'Music' },
  { value: 'sfx', label: 'Sound effect' },
  { value: 'transition', label: 'Transition' },
  { value: 'color', label: 'Color' },
  { value: 'clarification', label: 'Needs clarification' },
  { value: 'approval', label: 'Approval note' },
]

const PRIORITIES: Array<{
  value: CanonicalEditBriefMarkerPriority
  label: string
}> = [
  { value: 'low', label: 'Optional' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Important' },
  { value: 'must_follow', label: 'Must follow' },
]

type MarkerEditorState = CanonicalEditBriefMarkerDraft & {
  markerId?: string
}

export function ProfessionalEditBriefWorkspace({
  children,
  editBrief,
  readOnly,
  scope,
  sourceClips,
  sourcePreviewFile,
  started,
  onTimelineStarted,
  onPlanningAuthorityReadyChange,
}: {
  children: ReactNode
  editBrief: EditBrief | null
  readOnly: boolean
  scope: CanonicalEditBriefScope
  sourceClips: ClipSource[]
  sourcePreviewFile?: File | null
  started: boolean
  onTimelineStarted?: () => void
  onPlanningAuthorityReadyChange?: (state: {
    message: string
    ready: boolean
    status: ReturnType<typeof useCanonicalEditBriefAuthority>['status']
  }) => void
}) {
  const canonical = useCanonicalEditBriefAuthority({
    enabled: true,
    editBrief,
    readOnly,
    scope,
    started,
  })
  const [selectedMarkerId, setSelectedMarkerId] = useState<string>()
  const [markerEditor, setMarkerEditor] = useState<MarkerEditorState>()
  const [markerMessage, setMarkerMessage] = useState('')
  const [playheadSeconds, setPlayheadSeconds] = useState(0)
  const [localPreview, setLocalPreview] = useState<ProjectSourceVideoLocalPreview>()
  const localPreviewRef = useRef<ProjectSourceVideoLocalPreview | undefined>(undefined)
  const sourcePreviewFileRef = useRef<File | undefined>(undefined)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const previewInputRef = useRef<HTMLInputElement | null>(null)
  const [loadedDuration, setLoadedDuration] = useState<number>()

  useEffect(() => {
    onPlanningAuthorityReadyChange?.({
      message: canonical.message,
      ready: canonical.planningReady,
      status: canonical.status,
    })
  }, [
    canonical.message,
    canonical.planningReady,
    canonical.status,
    onPlanningAuthorityReadyChange,
  ])

  useEffect(() => {
    localPreviewRef.current = localPreview
  }, [localPreview])

  useEffect(() => () => {
    revokeProjectSourceVideoLocalPreview(localPreviewRef.current)
  }, [])

  useEffect(() => {
    if (!sourcePreviewFile || sourcePreviewFileRef.current === sourcePreviewFile) return
    const frame = window.requestAnimationFrame(() => {
      try {
        const preview = createProjectSourceVideoLocalPreviewFromFile(sourcePreviewFile)
        revokeProjectSourceVideoLocalPreview(localPreviewRef.current)
        sourcePreviewFileRef.current = sourcePreviewFile
        setLocalPreview(preview)
        setLoadedDuration(undefined)
        setPlayheadSeconds(0)
      } catch {
        // The durable upload remains authoritative even when this browser cannot
        // decode a selected source for local-only playback.
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [sourcePreviewFile])

  const markers = useMemo(
    () => canonical.authority?.markers.filter((marker) => marker.status !== 'archived') ?? [],
    [canonical.authority?.markers],
  )
  const selectedMarker = useMemo(
    () => markers.find((marker) => marker.id === selectedMarkerId),
    [markers, selectedMarkerId],
  )
  const markerMessages = useMemo(
    () => canonical.authority?.markerMessages.filter(
      (message) => message.markerId === selectedMarkerId,
    ) ?? [],
    [canonical.authority?.markerMessages, selectedMarkerId],
  )
  const timelineDuration = Math.max(
    1,
    loadedDuration
      ?? combinedClipDuration(sourceClips)
      ?? Math.max(60, latestMarkerEnd(markers) + 5),
  )
  const confirmedCount = markers.filter((marker) => marker.status === 'confirmed').length
  const currentQa = canonical.authority?.qaReports.at(-1)
  const currentHints = canonical.authority?.planHintPackages.at(-1)

  useEffect(() => {
    const latestMarker = markers.at(-1)
    if (!selectedMarkerId && latestMarker) {
      const frame = window.requestAnimationFrame(() => {
        setSelectedMarkerId(latestMarker.id)
        setMarkerEditor(editorStateFromMarker(latestMarker))
        setPlayheadSeconds(latestMarker.startSeconds)
        if (videoRef.current) videoRef.current.currentTime = latestMarker.startSeconds
      })
      return () => window.cancelAnimationFrame(frame)
    }
    if (selectedMarkerId && !selectedMarker) {
      const frame = window.requestAnimationFrame(() => {
        setSelectedMarkerId(undefined)
        setMarkerEditor(undefined)
      })
      return () => window.cancelAnimationFrame(frame)
    }
  }, [markers, selectedMarker, selectedMarkerId])

  function selectMarker(marker: CanonicalEditBriefMarker) {
    setSelectedMarkerId(marker.id)
    setMarkerEditor(editorStateFromMarker(marker))
    seek(marker.startSeconds)
  }

  function beginMarker() {
    const safeStart = roundTime(playheadSeconds)
    setSelectedMarkerId(undefined)
    setMarkerEditor({
      markerType: 'note',
      timeKind: 'point',
      startSeconds: safeStart,
      priority: 'normal',
      title: `Direction at ${formatTime(safeStart)}`,
      note: '',
    })
  }

  async function saveMarker() {
    if (!markerEditor?.title.trim() || !markerEditor.note.trim()) return
    const safeDraft = normalizeMarkerDraft(markerEditor, timelineDuration)
    if (!markerEditor.markerId) onTimelineStarted?.()
    const saved = markerEditor.markerId
      ? await canonical.updateMarker(markerEditor.markerId, {
          markerType: safeDraft.markerType,
          timeKind: safeDraft.timeKind,
          startSeconds: safeDraft.startSeconds,
          endSeconds: safeDraft.timeKind === 'range'
            ? safeDraft.endSeconds
            : null,
          priority: safeDraft.priority,
          title: safeDraft.title,
          note: safeDraft.note,
        })
      : await canonical.createMarker(safeDraft)
    if (saved && !markerEditor.markerId) {
      setSelectedMarkerId(undefined)
      setMarkerEditor(undefined)
    }
  }

  async function sendMarkerMessage() {
    const content = markerMessage.trim()
    if (!selectedMarker || !content) return
    if (await canonical.appendMarkerMessage(selectedMarker.id, content)) {
      setMarkerMessage('')
    }
  }

  function seek(seconds: number) {
    const next = Math.max(0, Math.min(timelineDuration, seconds))
    setPlayheadSeconds(next)
    if (videoRef.current) videoRef.current.currentTime = next
  }

  function choosePreview(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    try {
      const preview = createProjectSourceVideoLocalPreviewFromFile(file)
      revokeProjectSourceVideoLocalPreview(localPreviewRef.current)
      sourcePreviewFileRef.current = undefined
      saveEditBriefLocalPreviewFile(scope, file)
      setLocalPreview(preview)
      setLoadedDuration(undefined)
      setPlayheadSeconds(0)
    } catch {
      // The file picker accept filter and visible boundary copy tell the user
      // what can be decoded; no durable source authority changes here.
    }
  }

  return (
    <section
      className="professional-edit-brief"
      data-testid="professional-edit-brief-workspace"
      id="professional-edit-brief-workspace"
      tabIndex={-1}
    >
      <header className="professional-edit-brief__header">
        <div>
          <span className="section-eyebrow">Professional Edit Brief</span>
          <h3>Direct the edit on the source timeline</h3>
          <p>
            Add exact moments, ranges, and creative constraints. Chat remains the editor;
            this workspace gives the plan frame-aware direction.
          </p>
        </div>
        <div
          className="professional-edit-brief__sync"
          data-state={canonical.status}
          data-testid="edit-brief-authority-status"
        >
          {canonical.status === 'saving' || canonical.status === 'loading'
            ? <RefreshCw aria-hidden="true" className="is-spinning" size={16} />
            : canonical.status === 'saved'
              ? <Check aria-hidden="true" size={16} />
              : <CircleAlert aria-hidden="true" size={16} />}
          <span>{syncLabel(canonical.status)}</span>
        </div>
      </header>

      <div className="professional-edit-brief__studio">
        <div className="professional-edit-brief__canvas">
          <div className="professional-edit-brief__player">
            {localPreview ? (
              <video
                aria-label="Local source preview for Edit Brief timing"
                controls
                data-testid="edit-brief-source-player"
                onLoadedMetadata={(event) => {
                  const duration = event.currentTarget.duration
                  if (Number.isFinite(duration) && duration > 0) {
                    setLoadedDuration(duration)
                  }
                }}
                onTimeUpdate={(event) => setPlayheadSeconds(event.currentTarget.currentTime)}
                playsInline
                preload="metadata"
                ref={videoRef}
                src={localPreview.objectUrl}
              />
            ) : (
              <div className="professional-edit-brief__player-empty">
                <Film aria-hidden="true" size={34} />
                <strong>Source playback is not open in this browser</strong>
                <span>
                  The uploaded source remains private. Reopen the same file for local playback;
                  this does not upload, replace, or edit it.
                </span>
              </div>
            )}
            <div className="professional-edit-brief__player-meta">
              <span>{localPreview?.fileName ?? sourceClips[0]?.fileName ?? 'Private source'}</span>
              <strong>{formatTime(playheadSeconds)} / {formatTime(timelineDuration)}</strong>
            </div>
          </div>

          <div className="professional-edit-brief__preview-actions">
            <input
              accept="video/*"
              hidden
              onChange={choosePreview}
              ref={previewInputRef}
              type="file"
            />
            <Button
              onClick={() => previewInputRef.current?.click()}
              size="sm"
              variant="secondary"
            >
              {localPreview ? 'Change local playback file' : 'Open source for playback'}
            </Button>
            <span>Browser-local preview only · no new upload or credits</span>
          </div>

          <div className="professional-edit-brief__timeline">
            <div className="professional-edit-brief__timeline-heading">
              <div>
                <Clock3 aria-hidden="true" size={17} />
                <strong>Marker timeline</strong>
                <span>{markers.length} marker{markers.length === 1 ? '' : 's'} · {confirmedCount} confirmed</span>
              </div>
              <Button
                disabled={readOnly}
                icon={Plus}
                onClick={beginMarker}
                size="sm"
                variant="primary"
              >
                Add marker at {formatTime(playheadSeconds)}
              </Button>
            </div>
            <div className="professional-edit-brief__ruler" aria-hidden="true">
              {timelineTicks(timelineDuration).map((tick) => (
                <span key={tick.seconds} style={{ left: `${tick.percent}%` }}>
                  {formatTime(tick.seconds)}
                </span>
              ))}
            </div>
            <div className="professional-edit-brief__marker-lane" data-testid="edit-brief-marker-lane">
              <div
                aria-hidden="true"
                className="professional-edit-brief__playhead"
                style={{ left: `${timePercent(playheadSeconds, timelineDuration)}%` }}
              />
              {markers.map((marker) => {
                const start = timePercent(marker.startSeconds, timelineDuration)
                const end = timePercent(
                  marker.endSeconds ?? marker.startSeconds + Math.max(0.5, timelineDuration * 0.01),
                  timelineDuration,
                )
                return (
                  <button
                    aria-label={`${marker.title}, ${formatMarkerTime(marker)}`}
                    className="professional-edit-brief__marker"
                    data-priority={marker.priority}
                    data-selected={marker.id === selectedMarkerId}
                    data-status={marker.status}
                    key={marker.id}
                    onClick={() => selectMarker(marker)}
                    style={{
                      left: `${start}%`,
                      width: marker.timeKind === 'range'
                        ? `${Math.max(1.5, end - start)}%`
                        : undefined,
                    }}
                    type="button"
                  >
                    <Flag aria-hidden="true" size={13} />
                    <span>{marker.title}</span>
                  </button>
                )
              })}
            </div>
            <label className="professional-edit-brief__scrubber">
              <span className="sr-only">Timeline playhead</span>
              <input
                aria-label="Timeline playhead"
                max={timelineDuration}
                min={0}
                onChange={(event) => seek(Number(event.currentTarget.value))}
                step={0.01}
                type="range"
                value={Math.min(playheadSeconds, timelineDuration)}
              />
            </label>
          </div>
        </div>

        <aside className="professional-edit-brief__inspector" aria-label="Edit Brief marker inspector">
          <div className="professional-edit-brief__inspector-heading">
            <div>
              <span className="section-eyebrow">Marker inspector</span>
              <h4>{markerEditor?.markerId ? 'Review marker' : markerEditor ? 'New marker' : 'Choose a marker'}</h4>
            </div>
            {readOnly ? <LockKeyhole aria-label="Locked with approved plan" size={18} /> : null}
          </div>

          {markerEditor ? (
            <>
              <fieldset className="professional-edit-brief__marker-form" disabled={readOnly}>
                <legend className="sr-only">Marker direction</legend>
                <label>
                  <span>Type</span>
                  <select
                    onChange={(event) => {
                      const markerType = event.currentTarget.value as CanonicalEditBriefMarkerType
                      setMarkerEditor((current) => current
                        ? { ...current, markerType }
                        : current)
                    }}
                    value={markerEditor.markerType}
                  >
                    {MARKER_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Priority</span>
                  <select
                    onChange={(event) => {
                      const priority = event.currentTarget.value as CanonicalEditBriefMarkerPriority
                      setMarkerEditor((current) => current
                        ? { ...current, priority }
                        : current)
                    }}
                    value={markerEditor.priority}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </label>
                <label className="professional-edit-brief__marker-title">
                  <span>Marker title</span>
                  <input
                    maxLength={240}
                    onChange={(event) => {
                      const title = event.currentTarget.value
                      setMarkerEditor((current) => current
                        ? { ...current, title }
                        : current)
                    }}
                    value={markerEditor.title}
                  />
                </label>
                <div className="professional-edit-brief__time-fields">
                  <label>
                    <span>Starts at</span>
                    <input
                      max={timelineDuration}
                      min={0}
                      onChange={(event) => {
                        const startSeconds = Number(event.currentTarget.value)
                        setMarkerEditor((current) => current
                          ? { ...current, startSeconds }
                          : current)
                      }}
                      step={0.01}
                      type="number"
                      value={markerEditor.startSeconds}
                    />
                  </label>
                  <label>
                    <span>Timing</span>
                    <select
                      onChange={(event) => {
                        const timeKind = event.currentTarget.value as 'point' | 'range'
                        setMarkerEditor((current) => current
                          ? {
                              ...current,
                              timeKind,
                              endSeconds: timeKind === 'range'
                                ? current.endSeconds ?? Math.min(timelineDuration, current.startSeconds + 3)
                                : undefined,
                            }
                          : current)
                      }}
                      value={markerEditor.timeKind}
                    >
                      <option value="point">Exact moment</option>
                      <option value="range">Time range</option>
                    </select>
                  </label>
                  {markerEditor.timeKind === 'range' ? (
                    <label>
                      <span>Ends at</span>
                      <input
                        max={timelineDuration}
                        min={markerEditor.startSeconds + 0.01}
                        onChange={(event) => {
                          const endSeconds = Number(event.currentTarget.value)
                          setMarkerEditor((current) => current
                            ? { ...current, endSeconds }
                            : current)
                        }}
                        step={0.01}
                        type="number"
                        value={markerEditor.endSeconds ?? markerEditor.startSeconds + 3}
                      />
                    </label>
                  ) : null}
                </div>
                <label className="professional-edit-brief__marker-note">
                  <span>What should happen here?</span>
                  <textarea
                    maxLength={8_000}
                    onChange={(event) => {
                      const note = event.currentTarget.value
                      setMarkerEditor((current) => current
                        ? { ...current, note }
                        : current)
                    }}
                    placeholder="Example: Keep the complete explanation, add a restrained lower-third, and protect speech clarity."
                    rows={5}
                    value={markerEditor.note}
                  />
                </label>
              </fieldset>

              <div className="professional-edit-brief__marker-actions">
                <Button
                  disabled={
                    readOnly
                    || canonical.status === 'saving'
                    || !markerEditor.title.trim()
                    || !markerEditor.note.trim()
                  }
                  icon={Save}
                  onClick={() => void saveMarker()}
                  size="sm"
                  variant="primary"
                >
                  {markerEditor.markerId ? 'Save marker' : 'Create marker'}
                </Button>
                {selectedMarker?.status === 'draft' ? (
                  <Button
                    disabled={readOnly || canonical.status === 'saving'}
                    icon={Check}
                    onClick={() => void canonical.changeMarkerStatus(selectedMarker.id, 'confirm')}
                    size="sm"
                    variant="secondary"
                  >
                    Confirm for plan
                  </Button>
                ) : null}
                {selectedMarker ? (
                  <Button
                    disabled={readOnly || canonical.status === 'saving'}
                    icon={Trash2}
                    onClick={() => void canonical.changeMarkerStatus(selectedMarker.id, 'archive')}
                    size="sm"
                    variant="ghost"
                  >
                    Archive
                  </Button>
                ) : null}
              </div>

              {selectedMarker ? (
                <section className="professional-edit-brief__marker-chat">
                  <div>
                    <MessageSquareText aria-hidden="true" size={17} />
                    <strong>Marker Chat</strong>
                  </div>
                  <div className="professional-edit-brief__messages" aria-live="polite">
                    {markerMessages.length > 0 ? markerMessages.map((message) => (
                      <p data-role={message.role} key={message.id}>
                        <strong>{message.role === 'user' ? 'You' : 'ReeditPro'}</strong>
                        <span>{message.content}</span>
                      </p>
                    )) : (
                      <span>No follow-up messages yet. The marker instruction above is already part of the Brief.</span>
                    )}
                  </div>
                  <label>
                    <span className="sr-only">Add marker direction</span>
                    <textarea
                      disabled={readOnly}
                      onChange={(event) => setMarkerMessage(event.currentTarget.value)}
                      placeholder="Clarify this exact moment…"
                      rows={3}
                      value={markerMessage}
                    />
                  </label>
                  <Button
                    disabled={readOnly || !markerMessage.trim() || canonical.status === 'saving'}
                    onClick={() => void sendMarkerMessage()}
                    size="sm"
                    variant="secondary"
                  >
                    Save follow-up
                  </Button>
                  <small>
                    User direction is durable. Model reasoning remains server-owned and is never
                    fabricated when its runtime is unavailable.
                  </small>
                </section>
              ) : null}
            </>
          ) : (
            <div className="professional-edit-brief__inspector-empty">
              <Flag aria-hidden="true" size={24} />
              <p>Move the playhead, add a marker, then describe the exact edit decision.</p>
            </div>
          )}
        </aside>
      </div>

      <div className="professional-edit-brief__status-row">
        <p aria-live="polite">{canonical.message}</p>
        {canonical.retryable ? (
          <Button icon={RefreshCw} onClick={() => void canonical.refresh()} size="sm" variant="ghost">
            Retry
          </Button>
        ) : null}
        <div>
          <span>Frame authority: {canonical.authority?.exportSettings?.confirmationStatus ?? 'sealed when the plan is created'}</span>
          <span>Marker QA: {currentQa?.status ?? 'runs at plan preparation'}</span>
          <span>Plan hints: {currentHints?.readiness?.replaceAll('_', ' ') ?? 'not created'}</span>
        </div>
      </div>

      <details className="professional-edit-brief__details" data-testid="edit-brief-direction-details">
        <summary>
          <span>
            <strong>Brief direction and creative constraints</strong>
            <small>
              {editBrief?.goal?.trim()
                ? editBrief.goal
                : 'Optional overall goal, audience, style, assets, references, and delivery constraints'}
            </small>
          </span>
          <span>{editBrief?.status === 'ready' || editBrief?.status === 'used_in_plan' ? 'Ready' : 'Review before planning'}</span>
        </summary>
        <div>{children}</div>
      </details>
    </section>
  )
}

function editorStateFromMarker(marker: CanonicalEditBriefMarker): MarkerEditorState {
  return {
    markerId: marker.id,
    markerType: marker.markerType,
    timeKind: marker.timeKind,
    startSeconds: marker.startSeconds,
    endSeconds: marker.endSeconds,
    priority: marker.priority,
    title: marker.title,
    note: marker.note,
  }
}

function normalizeMarkerDraft(
  marker: MarkerEditorState,
  duration: number,
): CanonicalEditBriefMarkerDraft {
  const clampedStart = Math.max(0, Math.min(duration, marker.startSeconds))
  const startSeconds = roundTime(
    marker.timeKind === 'range'
      ? Math.min(Math.max(0, duration - 0.01), clampedStart)
      : clampedStart,
  )
  const endSeconds = marker.timeKind === 'range'
    ? roundTime(Math.max(
        startSeconds + 0.01,
        Math.min(duration, marker.endSeconds ?? startSeconds + 3),
      ))
    : undefined
  return {
    markerType: marker.markerType,
    timeKind: marker.timeKind,
    startSeconds,
    endSeconds,
    priority: marker.priority,
    title: marker.title.trim(),
    note: marker.note.trim(),
  }
}

function combinedClipDuration(clips: ClipSource[]): number | undefined {
  const durations = clips.map((clip) => parseDuration(clip.duration))
  if (durations.some((duration) => duration === undefined)) return undefined
  const total = durations.reduce<number>((sum, duration) => sum + (duration ?? 0), 0)
  return total > 0 ? total : undefined
}

function parseDuration(value: string): number | undefined {
  const parts = value.trim().split(':').map(Number)
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return undefined
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
  return undefined
}

function latestMarkerEnd(markers: CanonicalEditBriefMarker[]): number {
  return markers.reduce(
    (maximum, marker) => Math.max(maximum, marker.endSeconds ?? marker.startSeconds),
    0,
  )
}

function formatTime(value: number): string {
  const safe = Math.max(0, Math.floor(value))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatMarkerTime(marker: CanonicalEditBriefMarker): string {
  return marker.timeKind === 'range' && marker.endSeconds !== undefined
    ? `${formatTime(marker.startSeconds)}–${formatTime(marker.endSeconds)}`
    : formatTime(marker.startSeconds)
}

function roundTime(value: number): number {
  return Math.round(value * 100) / 100
}

function timePercent(seconds: number, duration: number): number {
  return Math.max(0, Math.min(100, (seconds / Math.max(1, duration)) * 100))
}

function timelineTicks(duration: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const seconds = (duration / 5) * index
    return { seconds, percent: (index / 5) * 100 }
  })
}

function syncLabel(status: ReturnType<typeof useCanonicalEditBriefAuthority>['status']): string {
  if (status === 'loading') return 'Loading'
  if (status === 'saving') return 'Saving'
  if (status === 'saved') return 'Saved'
  if (status === 'access_denied') return 'Access blocked'
  if (status === 'stale') return 'Refresh required'
  if (status === 'invalid') return 'Needs attention'
  if (status === 'unavailable') return 'Local draft'
  return 'Not started'
}
