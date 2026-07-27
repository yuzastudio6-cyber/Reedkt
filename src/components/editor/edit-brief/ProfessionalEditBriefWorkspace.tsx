import {
  AudioLines,
  Check,
  CircleAlert,
  Film,
  Flag,
  LockKeyhole,
  MessageSquareText,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useCanonicalEditBriefAuthority } from '../../../hooks/useCanonicalEditBriefAuthority'
import {
  createProjectSourceVideoLocalPreviewFromFile,
  revokeProjectSourceVideoLocalPreview,
} from '../../../lib/project-source-video-local-preview'
import type { CanonicalEditBriefScope } from '../../../lib/edit-brief-authority-client'
import { saveEditBriefLocalPreviewFile } from '../../../lib/edit-brief-local-preview-session'
import {
  uploadEditBriefAudioAttachment,
  validateEditBriefAudioAttachmentFile,
  type EditBriefAudioAttachmentUploadStage,
} from '../../../lib/edit-brief-audio-attachment-upload-client'
import type { EditBrief } from '../../../types'
import type {
  CanonicalEditBriefAuthority,
  CanonicalEditBriefAudioPlanningInput,
  CanonicalEditBriefMarker,
  CanonicalEditBriefMarkerDraft,
  CanonicalEditBriefMarkerPriority,
  CanonicalEditBriefMarkerType,
} from '../../../types/edit-brief-authority'
import type { ClipSource } from '../../../types/reeditpro'
import type { ProjectSourceVideoLocalPreview } from '../../../types/project-source-video'
import { Button, IconButton } from '../../Button'

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

type MarkerPopoverPosition = {
  arrowX: number
  left: number
  placement: 'above' | 'below'
  top: number
  width: number
}

type AudioAttachmentState = {
  stage?: EditBriefAudioAttachmentUploadStage
  message?: string
  error?: string
}

type AudioPlanningProjection = {
  inputs: CanonicalEditBriefAudioPlanningInput[]
  message: string
  ready: boolean
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
    editBriefAudioPlanningInputs: CanonicalEditBriefAudioPlanningInput[]
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
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const markerNoteRef = useRef<HTMLTextAreaElement | null>(null)
  const timelineScrollRef = useRef<HTMLDivElement | null>(null)
  const [loadedDuration, setLoadedDuration] = useState<number>()
  const [timelineZoom, setTimelineZoom] = useState(1)
  const [markerPopoverPosition, setMarkerPopoverPosition] =
    useState<MarkerPopoverPosition>()
  const [pendingAudioFile, setPendingAudioFile] = useState<File>()
  const [uploadedAudioAssetId, setUploadedAudioAssetId] = useState<string>()
  const [audioAttachmentState, setAudioAttachmentState] =
    useState<AudioAttachmentState>({})
  const audioPlanningProjection = useMemo(
    () => projectConfirmedAudioPlanningInputs(canonical.authority),
    [canonical.authority],
  )

  useEffect(() => {
    onPlanningAuthorityReadyChange?.({
      editBriefAudioPlanningInputs: audioPlanningProjection.inputs,
      message: audioPlanningProjection.ready
        ? canonical.message
        : audioPlanningProjection.message,
      ready: canonical.planningReady && audioPlanningProjection.ready,
      status: canonical.status,
    })
  }, [
    audioPlanningProjection.inputs,
    audioPlanningProjection.message,
    audioPlanningProjection.ready,
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
  const selectedAudioAttachment = useMemo(
    () => canonical.authority?.attachments?.find(
      (attachment) => (
        attachment.markerId === markerEditor?.markerId
        && attachment.kind === 'audio'
      ),
    ),
    [canonical.authority?.attachments, markerEditor?.markerId],
  )
  const timelineDuration = Math.max(
    1,
    loadedDuration
      ?? combinedClipDuration(sourceClips)
      ?? Math.max(60, latestMarkerEnd(markers) + 5),
  )
  const confirmedCount = markers.filter((marker) => marker.status === 'confirmed').length
  const markerLayout = useMemo(
    () => layoutTimelineMarkerRows(markers, timelineDuration),
    [markers, timelineDuration],
  )

  useEffect(() => {
    if (selectedMarkerId && !selectedMarker) {
      const frame = window.requestAnimationFrame(() => {
        setSelectedMarkerId(undefined)
        setMarkerEditor(undefined)
      })
      return () => window.cancelAnimationFrame(frame)
    }
  }, [selectedMarker, selectedMarkerId])

  const markerStartSeconds = markerEditor?.startSeconds

  useLayoutEffect(() => {
    const timelineScroll = timelineScrollRef.current
    if (markerStartSeconds === undefined || !timelineScroll) {
      setMarkerPopoverPosition(undefined)
      return
    }
    const activeMarkerStartSeconds = markerStartSeconds
    const activeTimelineScroll = timelineScroll

    function positionPopover() {
      const bounds = activeTimelineScroll.getBoundingClientRect()
      const workspaceBounds = activeTimelineScroll
        .closest<HTMLElement>('.professional-edit-brief')
        ?.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const margin = 12
      const width = Math.min(388, viewportWidth - margin * 2)
      const height = Math.min(410, viewportHeight - margin * 2)
      const markerX = bounds.left
        - activeTimelineScroll.scrollLeft
        + timePercent(activeMarkerStartSeconds, timelineDuration) / 100
          * activeTimelineScroll.scrollWidth
      const fitsInsideWorkspace = Boolean(
        workspaceBounds && workspaceBounds.width >= width + margin * 2,
      )
      const minimumLeft = fitsInsideWorkspace
        ? Math.max(margin, (workspaceBounds?.left ?? 0) + margin)
        : margin
      const maximumLeft = fitsInsideWorkspace
        ? Math.min(
            viewportWidth - width - margin,
            (workspaceBounds?.right ?? viewportWidth) - width - margin,
          )
        : viewportWidth - width - margin
      const left = Math.max(
        minimumLeft,
        Math.min(maximumLeft, markerX - width / 2),
      )
      const placement = bounds.top >= height + margin * 2 ? 'above' : 'below'
      const preferredTop = placement === 'above'
        ? Math.max(margin, bounds.top - height - 8)
        : Math.min(viewportHeight - height - margin, bounds.top + 34)
      const top = Math.max(
        margin,
        Math.min(Math.max(margin, viewportHeight - height - margin), preferredTop),
      )
      setMarkerPopoverPosition({
        arrowX: Math.max(16, Math.min(width - 16, markerX - left)),
        left,
        placement,
        top,
        width,
      })
    }

    positionPopover()
    activeTimelineScroll.addEventListener('scroll', positionPopover)
    window.addEventListener('resize', positionPopover)
    window.addEventListener('scroll', positionPopover, true)
    return () => {
      activeTimelineScroll.removeEventListener('scroll', positionPopover)
      window.removeEventListener('resize', positionPopover)
      window.removeEventListener('scroll', positionPopover, true)
    }
  }, [markerStartSeconds, timelineDuration, timelineZoom])

  function selectMarker(marker: CanonicalEditBriefMarker) {
    resetPendingAudio()
    setSelectedMarkerId(marker.id)
    setMarkerEditor(editorStateFromMarker(marker))
    seek(marker.startSeconds)
  }

  function beginMarkerAt(startSeconds: number) {
    resetPendingAudio()
    const safeStart = roundTime(startSeconds)
    setSelectedMarkerId(undefined)
    setMarkerEditor({
      markerType: 'note',
      timeKind: 'point',
      startSeconds: safeStart,
      priority: 'normal',
      title: '',
      note: '',
    })
    window.requestAnimationFrame(() => markerNoteRef.current?.focus())
  }

  function beginMarker() {
    beginMarkerAt(playheadSeconds)
  }

  function chooseMarkerType(markerType: CanonicalEditBriefMarkerType) {
    if (markerType !== 'music' && markerType !== 'sfx') resetPendingAudio()
    setMarkerEditor((current) => current ? { ...current, markerType } : current)
  }

  function closeMarkerEditor({ returnFocus = true } = {}) {
    resetPendingAudio()
    setMarkerEditor(undefined)
    setSelectedMarkerId(undefined)
    if (returnFocus) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-testid="edit-brief-add-direction"]')?.focus()
      })
    }
  }

  async function saveMarker() {
    if (!markerEditor?.note.trim()) return
    const safeDraft = normalizeMarkerDraft(markerEditor, timelineDuration)
    const existingMarkerId = markerEditor.markerId
    if (!existingMarkerId) onTimelineStarted?.()
    let targetMarkerId = existingMarkerId
    const saved = existingMarkerId
      ? await canonical.updateMarker(existingMarkerId, {
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
    if (!saved) return
    if (!targetMarkerId && typeof saved !== 'boolean') {
      targetMarkerId = saved.id
      setSelectedMarkerId(saved.id)
      setMarkerEditor(editorStateFromMarker(saved))
    }
    if (pendingAudioFile && targetMarkerId) {
      if (!await attachPendingAudio(targetMarkerId, pendingAudioFile)) return
    }
    if (!existingMarkerId) {
      closeMarkerEditor()
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

  function seekFromTimeline(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    seek(timelineSecondsFromClientX(event.currentTarget, event.clientX, timelineDuration))
  }

  function beginMarkerFromTimeline(event: MouseEvent<HTMLDivElement>) {
    if (readOnly || (event.target as HTMLElement).closest('button')) return
    const startSeconds = timelineSecondsFromClientX(
      event.currentTarget,
      event.clientX,
      timelineDuration,
    )
    seek(startSeconds)
    beginMarkerAt(startSeconds)
  }

  function handleMarkerEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    closeMarkerEditor()
  }

  function handleMarkerPromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== 'Enter'
      || (!event.metaKey && !event.ctrlKey)
      || readOnly
      || canonical.status === 'saving'
      || !markerEditor?.note.trim()
    ) {
      return
    }
    event.preventDefault()
    void saveMarker()
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

  function chooseMarkerAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    const validation = validateEditBriefAudioAttachmentFile(file)
    if (!validation.ok) {
      setAudioAttachmentState({ error: validation.message })
      return
    }
    setPendingAudioFile(file)
    setUploadedAudioAssetId(undefined)
    setAudioAttachmentState({
      message: 'Ready to attach when this direction is saved.',
    })
  }

  async function attachPendingAudio(markerId: string, file: File): Promise<boolean> {
    try {
      let privateAssetId = uploadedAudioAssetId
      if (!privateAssetId) {
        const uploaded = await uploadEditBriefAudioAttachment({
          editSessionId: scope.editSessionId,
          file,
          projectId: scope.projectId,
          workspaceId: scope.workspaceId,
          onStageChange: (stage) => {
            setAudioAttachmentState({
              stage,
              message: audioUploadStageLabel(stage),
            })
          },
          onProgress: (progress) => {
            if ('fraction' in progress) {
              setAudioAttachmentState({
                stage: 'uploading',
                message: `Uploading privately · ${Math.round(progress.fraction * 100)}%`,
              })
            }
          },
        })
        privateAssetId = uploaded.mediaAssetId
        setUploadedAudioAssetId(privateAssetId)
      }
      setAudioAttachmentState({
        stage: 'finalizing',
        message: 'Binding verified audio to this direction…',
      })
      if (!await canonical.addAudioAttachment(markerId, privateAssetId)) {
        throw new Error(
          'The audio is stored privately, but it could not be attached yet. Save again to retry.',
        )
      }
      setPendingAudioFile(undefined)
      setUploadedAudioAssetId(undefined)
      setAudioAttachmentState({ message: 'Private audio attached.' })
      return true
    } catch (error) {
      setAudioAttachmentState({
        error: error instanceof Error
          ? error.message
          : 'Private audio could not be attached.',
      })
      return false
    }
  }

  function resetPendingAudio() {
    setPendingAudioFile(undefined)
    setUploadedAudioAssetId(undefined)
    setAudioAttachmentState({})
  }

  return (
    <section
      aria-label="Edit Brief timeline workspace"
      className="professional-edit-brief"
      data-testid="professional-edit-brief-workspace"
      id="professional-edit-brief-workspace"
      tabIndex={-1}
    >
      <div className="professional-edit-brief__preview">
        <div className="professional-edit-brief__player">
          <div className="professional-edit-brief__toolbar">
            <div className="professional-edit-brief__source-identity">
              <Film aria-hidden="true" size={16} />
              <span>{localPreview?.fileName ?? sourceClips[0]?.fileName ?? 'Private source'}</span>
              <strong>{formatTime(playheadSeconds)} / {formatTime(timelineDuration)}</strong>
            </div>
            <div className="professional-edit-brief__toolbar-actions">
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
                variant="ghost"
              >
                {localPreview ? 'Change playback file' : 'Open source playback'}
              </Button>
            </div>
          </div>

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
              <strong>Open the source for timeline playback</strong>
              <span>
                The existing private source stays authoritative. Reopening the same file here is
                browser-local and never uploads, replaces, or starts editing.
              </span>
              <Button
                onClick={() => previewInputRef.current?.click()}
                size="sm"
                variant="secondary"
              >
                Open source playback
              </Button>
            </div>
          )}
        </div>
      </div>

      <section className="professional-edit-brief__timeline" aria-label="Edit direction timeline">
        <div className="professional-edit-brief__timeline-toolbar">
          <div>
            <strong>Timeline</strong>
            <span className="professional-edit-brief__timeline-summary">
              {markers.length} direction{markers.length === 1 ? '' : 's'} · {confirmedCount} confirmed
            </span>
            <span
              className="professional-edit-brief__timeline-hint"
              id="edit-brief-timeline-interaction-hint"
            >
              Click to move the playhead · double-click to add a direction
            </span>
          </div>
          <div className="professional-edit-brief__timeline-actions">
            <div aria-label="Timeline zoom" className="professional-edit-brief__zoom">
              <IconButton
                disabled={timelineZoom <= 1}
                icon={Minus}
                label="Zoom timeline out"
                onClick={() => setTimelineZoom((current) => Math.max(1, current - 0.5))}
              />
              <span>{Math.round(timelineZoom * 100)}%</span>
              <IconButton
                disabled={timelineZoom >= 4}
                icon={Plus}
                label="Zoom timeline in"
                onClick={() => setTimelineZoom((current) => Math.min(4, current + 0.5))}
              />
            </div>
            <Button
              disabled={readOnly}
              data-testid="edit-brief-add-direction"
              icon={Plus}
              onClick={beginMarker}
              size="sm"
              variant="primary"
            >
              Add direction
            </Button>
          </div>
        </div>

        <div className="professional-edit-brief__timeline-grid">
          <div aria-hidden="true" className="professional-edit-brief__track-label professional-edit-brief__track-label-ruler">
            Time
          </div>
          <div className="professional-edit-brief__timeline-scroll" ref={timelineScrollRef}>
            <div
              aria-describedby="edit-brief-timeline-interaction-hint"
              className="professional-edit-brief__timeline-content"
              data-testid="edit-brief-marker-lane"
              onDoubleClick={beginMarkerFromTimeline}
              onPointerDown={seekFromTimeline}
              style={{
                '--edit-brief-timeline-width': `${timelineZoom * 100}%`,
              } as CSSProperties}
            >
              <div className="professional-edit-brief__ruler" aria-hidden="true">
                {timelineTicks(timelineDuration, timelineZoom).map((tick) => (
                  <span key={tick.seconds} style={{ left: `${tick.percent}%` }}>
                    {formatRulerTime(tick.seconds, timelineDuration, timelineZoom)}
                  </span>
                ))}
              </div>
              <div
                aria-hidden="true"
                className="professional-edit-brief__playhead"
                style={{ left: `${timePercent(playheadSeconds, timelineDuration)}%` }}
              />
              <div className="professional-edit-brief__source-track" data-testid="edit-brief-source-track">
                {timelineClipSegments(sourceClips).map((clip) => (
                  <div
                    className="professional-edit-brief__source-clip"
                    key={clip.id}
                    style={{ width: `${clip.widthPercent}%` }}
                  >
                    <Film aria-hidden="true" size={13} />
                    <span>{clip.label}</span>
                  </div>
                ))}
              </div>
              <div
                className="professional-edit-brief__marker-track"
                style={{ minHeight: Math.max(76, 12 + markerLayout.rowCount * 48) }}
              >
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
                      onClick={(event) => {
                        event.stopPropagation()
                        selectMarker(marker)
                        window.requestAnimationFrame(() => markerNoteRef.current?.focus())
                      }}
                      style={{
                        left: `${start}%`,
                        top: 6 + (markerLayout.rowByMarkerId.get(marker.id) ?? 0) * 48,
                        width: marker.timeKind === 'range'
                          ? `${Math.max(1.5, end - start)}%`
                          : 'clamp(42px, 10%, 150px)',
                      }}
                      type="button"
                    >
                      <Flag aria-hidden="true" size={12} />
                      <span>{marker.title}</span>
                    </button>
                  )
                })}
              </div>

              {markerEditor && markerPopoverPosition && typeof document !== 'undefined' ? createPortal((
                <div
                  aria-label={markerEditor.markerId ? 'Edit timeline direction' : 'Add timeline direction'}
                  aria-modal="false"
                  className="professional-edit-brief__marker-popover"
                  data-placement={markerPopoverPosition.placement}
                  data-testid="edit-brief-marker-popover"
                  onKeyDown={handleMarkerEditorKeyDown}
                  role="dialog"
                  style={{
                    '--edit-brief-popover-arrow-x': `${markerPopoverPosition.arrowX}px`,
                    left: markerPopoverPosition.left,
                    top: markerPopoverPosition.top,
                    width: markerPopoverPosition.width,
                  } as CSSProperties}
                >
                  <div className="professional-edit-brief__marker-popover-heading">
                    <div>
                      <span>{markerEditor.markerId ? 'Edit direction' : 'New direction'}</span>
                      <strong>{formatTime(markerEditor.startSeconds)}</strong>
                    </div>
                    {readOnly ? (
                      <LockKeyhole aria-label="Locked with approved plan" size={18} />
                    ) : (
                      <IconButton icon={X} label="Close marker popover" onClick={() => closeMarkerEditor()} />
                    )}
                  </div>

                  <label className="professional-edit-brief__marker-prompt">
                    <span>What should happen here?</span>
                    <textarea
                      disabled={readOnly}
                      maxLength={8_000}
                      onChange={(event) => {
                        const note = event.currentTarget.value
                        setMarkerEditor((current) => current ? { ...current, note } : current)
                      }}
                      onKeyDown={handleMarkerPromptKeyDown}
                      placeholder="Tell ReeditPro in your own words…"
                      ref={markerNoteRef}
                      rows={4}
                      value={markerEditor.note}
                    />
                    {!readOnly ? (
                      <small>One clear direction is enough. Press Ctrl or ⌘ + Enter to add it.</small>
                    ) : null}
                  </label>

                  {!readOnly ? (
                    <div aria-label="Direction shortcuts" className="professional-edit-brief__marker-shortcuts">
                      {[
                        ['keep', 'Keep this'],
                        ['cut', 'Tighten this'],
                        ['broll', 'Add B-roll'],
                        ['caption', 'Add text'],
                        ['music', 'Music'],
                        ['sfx', 'Sound effect'],
                      ].map(([value, label]) => (
                        <button
                          aria-pressed={markerEditor.markerType === value}
                          key={value}
                          onClick={() => chooseMarkerType(value as CanonicalEditBriefMarkerType)}
                          type="button"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {markerEditor.markerType === 'music' || markerEditor.markerType === 'sfx' ? (
                    <div
                      className="professional-edit-brief__audio-attachment"
                      data-state={audioAttachmentState.error
                        ? 'error'
                        : selectedAudioAttachment
                          ? 'attached'
                          : pendingAudioFile
                            ? 'pending'
                            : 'empty'}
                    >
                      <input
                        accept=".aac,.mp3,.wav,audio/aac,audio/mpeg,audio/wav,audio/x-wav"
                        hidden
                        onChange={chooseMarkerAudio}
                        ref={audioInputRef}
                        type="file"
                      />
                      <AudioLines aria-hidden="true" size={18} />
                      <span>
                        <strong>
                          {selectedAudioAttachment?.label
                            ?? pendingAudioFile?.name
                            ?? (markerEditor.markerType === 'music'
                              ? 'Use your own soundtrack'
                              : 'Use your own sound effect')}
                        </strong>
                        <small>
                          {selectedAudioAttachment
                            ? `${formatOptionalDuration(selectedAudioAttachment.durationSeconds)} · Private attachment`
                            : audioAttachmentState.error
                              ?? audioAttachmentState.message
                              ?? 'Optional. ReeditPro can also plan the sound from your direction alone.'}
                        </small>
                      </span>
                      {!readOnly && !selectedAudioAttachment ? (
                        <Button
                          disabled={Boolean(audioAttachmentState.stage)}
                          icon={Upload}
                          onClick={() => audioInputRef.current?.click()}
                          size="sm"
                          variant="ghost"
                        >
                          {pendingAudioFile ? 'Change' : 'Choose audio'}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  <details className="professional-edit-brief__marker-options">
                    <summary>More options</summary>
                    <fieldset className="professional-edit-brief__marker-form" disabled={readOnly}>
                      <legend className="sr-only">Advanced marker direction</legend>
                      <label>
                        <span>Type</span>
                        <select
                          onChange={(event) => {
                            const markerType = event.currentTarget.value as CanonicalEditBriefMarkerType
                            chooseMarkerType(markerType)
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
                            setMarkerEditor((current) => current ? { ...current, priority } : current)
                          }}
                          value={markerEditor.priority}
                        >
                          {PRIORITIES.map((priority) => (
                            <option key={priority.value} value={priority.value}>{priority.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="professional-edit-brief__marker-title">
                        <span>Short label (optional)</span>
                        <input
                          maxLength={240}
                          onChange={(event) => {
                            const title = event.currentTarget.value
                            setMarkerEditor((current) => current ? { ...current, title } : current)
                          }}
                          placeholder="Created automatically if left empty"
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
                              setMarkerEditor((current) => current ? { ...current, startSeconds } : current)
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
                                setMarkerEditor((current) => current ? { ...current, endSeconds } : current)
                              }}
                              step={0.01}
                              type="number"
                              value={markerEditor.endSeconds ?? markerEditor.startSeconds + 3}
                            />
                          </label>
                        ) : null}
                      </div>
                    </fieldset>
                  </details>

                  <div className="professional-edit-brief__marker-actions">
                    <Button
                      disabled={
                        readOnly
                        || canonical.status === 'saving'
                        || Boolean(audioAttachmentState.stage)
                        || !markerEditor.note.trim()
                      }
                      icon={Save}
                      onClick={() => void saveMarker()}
                      size="sm"
                      variant="primary"
                    >
                      {markerEditor.markerId ? 'Save direction' : 'Add direction'}
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
                    ) : (
                      <Button onClick={() => closeMarkerEditor()} size="sm" variant="ghost">
                        Cancel
                      </Button>
                    )}
                  </div>

                  {selectedMarker ? (
                    <details className="professional-edit-brief__marker-chat">
                      <summary>
                        <MessageSquareText aria-hidden="true" size={16} />
                        Follow-up notes
                      </summary>
                      <div className="professional-edit-brief__messages" aria-live="polite">
                        {markerMessages.length > 0 ? markerMessages.map((message) => (
                          <p data-role={message.role} key={message.id}>
                            <strong>{message.role === 'user' ? 'You' : 'ReeditPro'}</strong>
                            <span>{message.content}</span>
                          </p>
                        )) : (
                          <span>No follow-up notes yet.</span>
                        )}
                      </div>
                      <label>
                        <span className="sr-only">Add marker direction</span>
                        <textarea
                          disabled={readOnly}
                          onChange={(event) => setMarkerMessage(event.currentTarget.value)}
                          placeholder="Clarify this moment…"
                          rows={2}
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
                    </details>
                  ) : null}
                </div>
              ), document.body) : null}
            </div>
          </div>

          <div className="professional-edit-brief__track-label professional-edit-brief__track-label-source">
            <Film aria-hidden="true" size={14} />
            <span>Source</span>
          </div>
          <div className="professional-edit-brief__track-label professional-edit-brief__track-label-direction">
            <Flag aria-hidden="true" size={14} />
            <span>Direction</span>
          </div>
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
      </section>

      {canonical.status === 'unavailable'
        || canonical.status === 'stale'
        || canonical.status === 'invalid'
        || canonical.status === 'access_denied' ? (
        <div className="professional-edit-brief__notice" role="status">
          <p>{canonical.message}</p>
          {canonical.retryable ? (
            <Button icon={RefreshCw} onClick={() => void canonical.refresh()} size="sm" variant="ghost">
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

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

function projectConfirmedAudioPlanningInputs(
  authority: CanonicalEditBriefAuthority | undefined,
): AudioPlanningProjection {
  const empty: AudioPlanningProjection = {
    inputs: [],
    message: 'The exact Edit Brief audio directions are ready for planning.',
    ready: true,
  }
  if (!authority) return empty

  const markers = new Map(authority.markers.map((marker) => [marker.id, marker]))
  const seenMarkers = new Set<string>()
  const inputs: CanonicalEditBriefAudioPlanningInput[] = []

  for (const attachment of authority.attachments) {
    if (attachment.kind !== 'audio') continue
    const marker = markers.get(attachment.markerId)
    if (!marker) return invalidAudioPlanningProjection()
    if (marker.status === 'archived') continue
    if (
      marker.status !== 'confirmed'
      || (marker.markerType !== 'music' && marker.markerType !== 'sfx')
      || seenMarkers.has(marker.id)
      || !isEditBriefAudioMimeType(attachment.mimeType)
      || !Number.isFinite(attachment.durationSeconds)
      || Number(attachment.durationSeconds) <= 0
    ) {
      return invalidAudioPlanningProjection()
    }
    seenMarkers.add(marker.id)
    inputs.push({
      attachmentId: attachment.id,
      markerId: marker.id,
      markerType: marker.markerType,
      markerTimeKind: marker.timeKind,
      privateAssetId: attachment.privateAssetId,
      startSeconds: marker.startSeconds,
      ...(marker.endSeconds === undefined ? {} : { endSeconds: marker.endSeconds }),
      durationSeconds: attachment.durationSeconds!,
      mimeType: attachment.mimeType,
    })
  }

  inputs.sort((left, right) =>
    left.startSeconds - right.startSeconds
    || left.markerId.localeCompare(right.markerId)
    || left.attachmentId.localeCompare(right.attachmentId)
  )
  return { ...empty, inputs }
}

function invalidAudioPlanningProjection(): AudioPlanningProjection {
  return {
    inputs: [],
    message: 'Review and reconfirm each private Music or Sound effect attachment before creating the plan.',
    ready: false,
  }
}

function isEditBriefAudioMimeType(
  value: string | undefined,
): value is CanonicalEditBriefAudioPlanningInput['mimeType'] {
  return value === 'audio/aac'
    || value === 'audio/mpeg'
    || value === 'audio/wav'
    || value === 'audio/x-wav'
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
    title: marker.title.trim() || deriveMarkerTitle(marker.note, startSeconds),
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

function layoutTimelineMarkerRows(
  markers: readonly CanonicalEditBriefMarker[],
  duration: number,
): {
  rowByMarkerId: Map<string, number>
  rowCount: number
} {
  const rowEndPercentages: number[] = []
  const rowByMarkerId = new Map<string, number>()
  const orderedMarkers = [...markers].sort((left, right) => (
    left.startSeconds - right.startSeconds
    || (left.endSeconds ?? left.startSeconds) - (right.endSeconds ?? right.startSeconds)
    || left.id.localeCompare(right.id)
  ))

  for (const marker of orderedMarkers) {
    const start = timePercent(marker.startSeconds, duration)
    const exactEnd = timePercent(marker.endSeconds ?? marker.startSeconds, duration)
    const visualEnd = Math.max(start + 18, exactEnd)
    let row = rowEndPercentages.findIndex((rowEnd) => rowEnd + 1 <= start)
    if (row < 0) {
      row = rowEndPercentages.length
      rowEndPercentages.push(visualEnd)
    } else {
      rowEndPercentages[row] = visualEnd
    }
    rowByMarkerId.set(marker.id, row)
  }

  return {
    rowByMarkerId,
    rowCount: rowEndPercentages.length,
  }
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

function formatRulerTime(value: number, duration: number, zoom: number): string {
  const tickCount = Math.max(6, Math.round(6 * zoom))
  const tickSpacingSeconds = duration / Math.max(1, tickCount - 1)
  if (tickSpacingSeconds >= 1) return formatTime(value)

  const precision = tickSpacingSeconds < 0.1 ? 2 : 1
  const scale = 10 ** precision
  const totalUnits = Math.round(Math.max(0, value) * scale)
  const totalSeconds = Math.floor(totalUnits / scale)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const fractionalSeconds = String(totalUnits % scale).padStart(precision, '0')
  const clock = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`
  return `${clock}.${fractionalSeconds}`
}

function formatMarkerTime(marker: CanonicalEditBriefMarker): string {
  return marker.timeKind === 'range' && marker.endSeconds !== undefined
    ? `${formatTime(marker.startSeconds)}–${formatTime(marker.endSeconds)}`
    : formatTime(marker.startSeconds)
}

function formatOptionalDuration(value: number | undefined): string {
  return value === undefined ? 'Duration verified' : formatTime(value)
}

function audioUploadStageLabel(stage: EditBriefAudioAttachmentUploadStage): string {
  if (stage === 'preparing') return 'Preparing a private upload…'
  if (stage === 'uploading') return 'Uploading privately…'
  return 'Verifying the audio file…'
}

function roundTime(value: number): number {
  return Math.round(value * 100) / 100
}

function timePercent(seconds: number, duration: number): number {
  return Math.max(0, Math.min(100, (seconds / Math.max(1, duration)) * 100))
}

function timelineSecondsFromClientX(
  element: HTMLDivElement,
  clientX: number,
  duration: number,
): number {
  const bounds = element.getBoundingClientRect()
  if (bounds.width <= 0) return 0
  return Math.max(
    0,
    Math.min(duration, ((clientX - bounds.left) / bounds.width) * duration),
  )
}

function timelineTicks(duration: number, zoom: number) {
  const count = Math.max(6, Math.round(6 * zoom))
  return Array.from({ length: count }, (_, index) => {
    const seconds = (duration / (count - 1)) * index
    return { seconds, percent: (index / (count - 1)) * 100 }
  })
}

function timelineClipSegments(clips: ClipSource[]): Array<{
  id: string
  label: string
  widthPercent: number
}> {
  if (clips.length === 0) {
    return [{ id: 'private-source', label: 'Private source', widthPercent: 100 }]
  }
  const durations = clips.map((clip) => parseDuration(clip.duration))
  const durationTotal = durations.every((duration) => duration !== undefined)
    ? durations.reduce<number>((total, duration) => total + (duration ?? 0), 0)
    : 0
  return clips.map((clip, index) => ({
    id: clip.id,
    label: clip.fileName || `Source ${index + 1}`,
    widthPercent: durationTotal > 0
      ? ((durations[index] ?? 0) / durationTotal) * 100
      : 100 / clips.length,
  }))
}

function deriveMarkerTitle(note: string, startSeconds: number): string {
  const normalized = note.trim().replace(/\s+/g, ' ')
  if (!normalized) return `Direction at ${formatTime(startSeconds)}`
  const words = normalized.split(' ')
  const concise = words.slice(0, 7).join(' ')
  return `${concise}${words.length > 7 ? '…' : ''}`
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
