import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../../Card'
import {
  archiveProjectEditBriefMarkerViaApi,
  confirmProjectEditBriefMarkerViaApi,
  createProjectEditBriefMarkerDraftForUI,
  createProjectEditBriefMarkerFormModel,
  saveProjectEditBriefMarkerViaApi,
  updateProjectEditBriefMarkerViaApi,
  type ProjectEditBriefMarkerDraftForUI,
} from '../../../lib/project-edit-brief-marker-flow-ui-adapter'
import {
  createProjectEditBriefTimelineUIModel,
  loadProjectEditBriefWorkspaceForUI,
  PROJECT_EDIT_BRIEF_UI_BOUNDARY,
  type ProjectEditBriefWorkspaceModel,
} from '../../../lib/project-edit-brief-ui-adapter'
import { createProjectSourceVideoBackendUploadConfig } from '../../../lib/project-source-video-backend-upload'
import {
  createProjectSourceVideoLocalPreviewFromFile,
  isBrowserVideoMimeTypeAllowed,
  revokeProjectSourceVideoLocalPreview,
} from '../../../lib/project-source-video-local-preview'
import {
  createProjectSourceVideoExportRecommendationInput,
  createProjectSourceVideoMetadataSummary,
  inferProjectSourceVideoAspectRatio,
} from '../../../lib/project-source-video-metadata-mappers'
import type { PreferenceApplicationDownstreamContext } from '../../../types/edit-reference-integration'
import type {
  ProjectSourceVideoLocalPreview,
  ProjectSourceVideoMetadataUpdate,
} from '../../../types/project-source-video'
import { createDefaultMockProjectEditBriefApiClient } from '../../../lib/project-edit-brief-api-client'
import { ProjectEditBriefBoundaryNotice } from './ProjectEditBriefBoundaryNotice'
import { ProjectEditBriefEmptyState } from './ProjectEditBriefEmptyState'
import { ProjectEditBriefExportSettingsSummary } from './ProjectEditBriefExportSettingsSummary'
import { ProjectEditBriefHeader } from './ProjectEditBriefHeader'
import { ProjectEditBriefMarkerDetailPanel } from './ProjectEditBriefMarkerDetailPanel'
import { ProjectEditBriefMarkerDrawer } from './ProjectEditBriefMarkerDrawer'
import { ProjectEditBriefPlanBridgePanel } from './ProjectEditBriefPlanBridgePanel'
import { ProjectEditBriefQASummaryCard } from './ProjectEditBriefQASummaryCard'
import { ProjectEditBriefSummaryPanel } from './ProjectEditBriefSummaryPanel'
import { ProjectEditBriefSourceVideoPicker } from './ProjectEditBriefSourceVideoPicker'
import { ProjectEditBriefSourceVideoSummary } from './ProjectEditBriefSourceVideoSummary'
import { ProjectEditBriefTimeline } from './ProjectEditBriefTimeline'
import { ProjectEditBriefVideoShell } from './ProjectEditBriefVideoShell'
import { ProjectEditBriefPreferenceApplicationCard } from './ProjectEditBriefPreferenceApplicationCard'
import {
  clearPreferenceApplicationContextFromProjectEditBrief,
  readPreferenceApplicationContextFromEditBrief,
  syncPreferenceApplicationContextToProjectEditBrief,
} from '../../../lib/project-edit-brief-preference-application-ui-adapter'

type ProjectEditReferenceBriefWorkspaceProps = {
  editSessionId: string
  editSessionTitle?: string
  projectId: string
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
}

export function ProjectEditReferenceBriefWorkspace({
  editSessionId,
  editSessionTitle,
  projectId,
  preferenceApplicationContext,
}: ProjectEditReferenceBriefWorkspaceProps) {
  const client = useMemo(() => createDefaultMockProjectEditBriefApiClient({
    projectId,
    preserveMockSession: true,
  }), [projectId])
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | undefined>()
  const [playheadSeconds, setPlayheadSeconds] = useState(0)
  const [autoSelectFirstMarker, setAutoSelectFirstMarker] = useState(true)
  const [drawerDraft, setDrawerDraft] = useState<ProjectEditBriefMarkerDraftForUI | undefined>()
  const [model, setModel] = useState<ProjectEditBriefWorkspaceModel | undefined>()
  const [localSourceVideo, setLocalSourceVideo] = useState<ProjectSourceVideoLocalPreview | undefined>()
  const [sourceVideoError, setSourceVideoError] = useState<string | undefined>()
  const [sourceVideoPlaying, setSourceVideoPlaying] = useState(false)
  const [sourceVideoSeekRequest, setSourceVideoSeekRequest] = useState<{ requestId: number; seconds: number } | undefined>()
  const [sourceVideoElement, setSourceVideoElement] = useState<HTMLVideoElement | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [preferenceContextRevision, setPreferenceContextRevision] = useState(0)
  const [isDrawerBusy, setIsDrawerBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Loading mock Edit Brief shell.')
  const preserveStatusMessageRef = useRef(false)
  const backendUploadConfig = useMemo(() => createProjectSourceVideoBackendUploadConfig(import.meta.env), [])

  useEffect(() => {
    const objectUrl = localSourceVideo?.objectUrl
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [localSourceVideo?.objectUrl])

  useEffect(() => {
    let cancelled = false
    loadProjectEditBriefWorkspaceForUI({
      autoSelectFirstMarker,
      client,
      editSessionId,
      projectId,
      selectedMarkerId,
    }).then((nextModel) => {
      if (cancelled) return
      setModel(nextModel)
      if (preserveStatusMessageRef.current) {
        preserveStatusMessageRef.current = false
      } else {
        setStatusMessage((current) => (
          current === 'Loading mock Edit Brief shell.'
            ? nextModel.statusMessage
            : current
        ))
      }
      if (!selectedMarkerId && nextModel.timeline.selectedMarkerId) {
        setSelectedMarkerId(nextModel.timeline.selectedMarkerId)
        setPlayheadSeconds(nextModel.timeline.playheadSeconds)
      }
    }).catch(() => {
      if (cancelled) return
      setStatusMessage('Mock Edit Brief shell failed safely without production side effects.')
    })
    return () => {
      cancelled = true
    }
  }, [autoSelectFirstMarker, client, editSessionId, projectId, refreshIndex, selectedMarkerId])

  useEffect(() => {
    if (!model?.brief) return
    let cancelled = false
    const operation = preferenceApplicationContext
      ? syncPreferenceApplicationContextToProjectEditBrief({
          brief: model.brief,
          client,
          context: preferenceApplicationContext,
        })
      : readPreferenceApplicationContextFromEditBrief(model.brief)
        ? clearPreferenceApplicationContextFromProjectEditBrief({ brief: model.brief, client })
        : undefined
    if (!operation) return
    operation.then((result) => {
      if (cancelled || !result.changed || !result.brief) return
      setModel((current) => current ? { ...current, brief: result.brief } : current)
      setPreferenceContextRevision((current) => current + 1)
      setStatusMessage(preferenceApplicationContext
        ? 'Target-adapted Edit Reference guidance synchronized to this Edit Brief.'
        : 'Inactive Edit Reference guidance was removed from this Edit Brief while its history was preserved.')
    }).catch(() => {
      if (!cancelled) setStatusMessage('Edit Reference guidance could not be updated; no production side effect occurred.')
    })
    return () => {
      cancelled = true
    }
  }, [client, model?.brief, preferenceApplicationContext])

  const selectedMarkerRecord = selectedMarkerId
    ? model?.bundle?.markers.find((marker) => marker.id === selectedMarkerId)
    : undefined

  const sourceVideoSummary = useMemo(() => (
    createProjectSourceVideoMetadataSummary(localSourceVideo)
  ), [localSourceVideo])

  const displayTimeline = useMemo(() => {
    if (!model) return undefined
    return createProjectEditBriefTimelineUIModel({
      timelineMarkers: model.timeline.markers,
      exportSettings: model.exportSettings?.record,
      selectedMarkerId: model.timeline.selectedMarkerId,
      playheadSeconds,
      autoSelectFirstMarker: false,
      durationSeconds: localSourceVideo?.durationSeconds,
    })
  }, [localSourceVideo?.durationSeconds, model, playheadSeconds])

  const displayVideo = useMemo(() => {
    if (!model || !displayTimeline) return undefined
    return {
      ...model.video,
      durationSeconds: displayTimeline.durationSeconds,
      currentTimeSeconds: displayTimeline.playheadSeconds,
      currentTimeLabel: displayTimeline.playheadLabel,
      durationLabel: displayTimeline.durationLabel,
      aspectLabel: localSourceVideo?.inferredAspectRatio ?? model.video.aspectLabel,
      mockPosterLabel: localSourceVideo ? 'Local browser preview' : model.video.mockPosterLabel,
    }
  }, [displayTimeline, localSourceVideo, model])

  const sourceVideoExportRecommendationInput = useMemo(() => {
    if (!localSourceVideo || !model?.exportSettings?.record) return undefined
    return createProjectSourceVideoExportRecommendationInput({
      projectId,
      editSessionId,
      preview: localSourceVideo,
      existingSettings: model.exportSettings.record,
    })
  }, [editSessionId, localSourceVideo, model, projectId])

  const handleVideoElementReady = useCallback((element?: HTMLVideoElement) => {
    setSourceVideoElement(element ?? null)
  }, [])

  const markerFormModel = drawerDraft ? createProjectEditBriefMarkerFormModel(drawerDraft) : undefined
  const canAddMarker = Boolean(
    model?.brief
      && model.brief.status !== 'not_created'
      && model.brief.status !== 'archived'
      && model.brief.availability !== 'optional_not_opened',
  )
  const addMarkerDisabledReason = model?.brief
    ? 'Open an active mock Brief before adding markers.'
    : 'No mock Brief record is available for this Edit Chat.'

  function refreshAfterMarkerAction(message: string) {
    preserveStatusMessageRef.current = true
    setStatusMessage(message)
    setRefreshIndex((current) => current + 1)
  }

  async function openOptionalBrief() {
    if (!model) return
    const response = model.brief
      ? await client.brief.update({
        briefId: model.brief.id,
        editSessionId,
        projectId,
        patch: {
          availability: 'optional_opened',
          lastOpenedAt: new Date().toISOString(),
        },
      })
      : await client.brief.create({
        editSessionId,
        projectId,
        title: `${editSessionTitle ?? 'Edit Chat'} Brief`,
        summary: 'Mock/local Edit Brief opened explicitly from the target Edit Chat.',
        metadata: {
          openedFromEditSession: true,
          noPlannerExecution: true,
        },
      })
    if (!response.ok) {
      setStatusMessage(response.error?.message ?? 'Edit Brief could not be opened safely.')
      return
    }
    refreshAfterMarkerAction('Edit Brief opened in mock/local mode. No planner, provider, worker, render, or credit action started.')
  }

  async function refreshDrawerDraftFromMarker(markerId: string): Promise<void> {
    const response = await client.markers.get<{ marker: NonNullable<typeof selectedMarkerRecord> }>(markerId)
    const marker = response.data?.marker
    if (!marker) return
    setDrawerDraft(createProjectEditBriefMarkerDraftForUI({
      briefId: marker.briefId,
      editSessionId: marker.editSessionId,
      marker,
      projectId: marker.projectId,
    }))
  }

  function openAddMarkerDrawer() {
    if (!model?.brief || !canAddMarker || !displayTimeline) {
      setStatusMessage(addMarkerDisabledReason)
      return
    }
    const draft = createProjectEditBriefMarkerDraftForUI({
      briefId: model.brief.id,
      editSessionId,
      durationSeconds: displayTimeline.durationSeconds,
      playheadSeconds: displayTimeline.playheadSeconds,
      projectId,
    })
    setDrawerDraft(draft)
    setSelectedMarkerId(undefined)
    setAutoSelectFirstMarker(false)
    preserveStatusMessageRef.current = true
    setStatusMessage('Add Marker drawer opened in mock/local mode.')
  }

  function openEditMarkerDrawer(markerId: string) {
    const marker = model?.bundle?.markers.find((candidate) => candidate.id === markerId)
    const timelineMarker = model?.timeline.markers.find((candidate) => candidate.markerId === markerId)
    setSelectedMarkerId(markerId)
    setAutoSelectFirstMarker(false)
    preserveStatusMessageRef.current = true
    if (timelineMarker) setPlayheadSeconds(timelineMarker.startTimeSeconds)
    if (!marker) {
      setStatusMessage('Marker selected; drawer metadata is still loading safely.')
      return
    }
    setDrawerDraft(createProjectEditBriefMarkerDraftForUI({
      briefId: marker.briefId,
      editSessionId: marker.editSessionId,
      marker,
      projectId: marker.projectId,
    }))
    setStatusMessage('Edit Marker drawer opened in mock/local mode.')
  }

  function movePlayhead(seconds: number) {
    const durationSeconds = displayTimeline?.durationSeconds ?? model?.timeline.durationSeconds ?? seconds
    const nextSeconds = Math.max(0, Math.min(durationSeconds, seconds))
    preserveStatusMessageRef.current = true
    setPlayheadSeconds(nextSeconds)
    if (localSourceVideo) {
      setSourceVideoSeekRequest((current) => ({
        requestId: (current?.requestId ?? 0) + 1,
        seconds: nextSeconds,
      }))
    }
    setSelectedMarkerId(undefined)
    setDrawerDraft(undefined)
    setAutoSelectFirstMarker(false)
    setStatusMessage(`Playhead moved to ${Math.max(0, Math.round(nextSeconds))}s. No marker was created.`)
  }

  function selectLocalSourceVideo(file: File) {
    if (!isBrowserVideoMimeTypeAllowed(file.type)) {
      setSourceVideoError('Select a browser-supported video file. Nothing was uploaded or processed.')
      return
    }
    try {
      const preview = createProjectSourceVideoLocalPreviewFromFile(file)
      setLocalSourceVideo(preview)
      setSourceVideoError(undefined)
      setSourceVideoPlaying(false)
      setSelectedMarkerId(undefined)
      setDrawerDraft(undefined)
      setAutoSelectFirstMarker(false)
      setPlayheadSeconds(0)
      setSourceVideoSeekRequest((current) => ({
        requestId: (current?.requestId ?? 0) + 1,
        seconds: 0,
      }))
      preserveStatusMessageRef.current = true
      setStatusMessage('Local browser source video selected. No upload, processing, or storage write occurred.')
    } catch {
      setSourceVideoError('Local video preview could not be created safely. Nothing was uploaded or processed.')
    }
  }

  function clearLocalSourceVideo() {
    revokeProjectSourceVideoLocalPreview(localSourceVideo)
    setLocalSourceVideo(undefined)
    setSourceVideoError(undefined)
    setSourceVideoPlaying(false)
    setSourceVideoElement(null)
    setPlayheadSeconds(model?.timeline.playheadSeconds ?? 0)
    preserveStatusMessageRef.current = true
    setStatusMessage('Local source video cleared. Brief returned to mock timeline preview.')
  }

  function updateLocalSourceVideoMetadata(metadata: ProjectSourceVideoMetadataUpdate) {
    setLocalSourceVideo((current) => {
      if (!current) return current
      const durationSeconds = metadata.durationSeconds ?? current.durationSeconds
      const videoWidth = metadata.videoWidth ?? current.videoWidth
      const videoHeight = metadata.videoHeight ?? current.videoHeight
      return {
        ...current,
        durationSeconds,
        videoWidth,
        videoHeight,
        inferredAspectRatio: inferProjectSourceVideoAspectRatio({ videoWidth, videoHeight }),
        metadataLoaded: true,
      }
    })
    if (typeof metadata.durationSeconds === 'number' && Number.isFinite(metadata.durationSeconds)) {
      setPlayheadSeconds((current) => Math.max(0, Math.min(current, metadata.durationSeconds ?? current)))
    }
    preserveStatusMessageRef.current = true
    setStatusMessage('Browser video metadata loaded locally. Timeline duration and export recommendation can use it.')
  }

  async function saveDrawerMarker() {
    if (!drawerDraft || !markerFormModel?.canSave) return
    setIsDrawerBusy(true)
    try {
      const response = drawerDraft.markerId
        ? await updateProjectEditBriefMarkerViaApi(drawerDraft, client)
        : await saveProjectEditBriefMarkerViaApi(drawerDraft, client)
      if (response.marker) {
        setSelectedMarkerId(response.marker.id)
        setAutoSelectFirstMarker(false)
        setPlayheadSeconds(response.marker.startTimeSeconds)
        setDrawerDraft(drawerDraft.markerId
          ? createProjectEditBriefMarkerDraftForUI({
            briefId: response.marker.briefId,
            editSessionId: response.marker.editSessionId,
            marker: response.marker,
            projectId: response.marker.projectId,
          })
          : undefined)
        refreshAfterMarkerAction(drawerDraft.markerId
          ? 'Marker update saved in mock/local metadata.'
          : 'Marker created in mock/local metadata.')
      } else {
        setStatusMessage('Marker save failed safely without production side effects.')
      }
    } finally {
      setIsDrawerBusy(false)
    }
  }

  async function confirmDrawerMarker() {
    if (!drawerDraft?.markerId) return
    setIsDrawerBusy(true)
    try {
      const response = await confirmProjectEditBriefMarkerViaApi(drawerDraft.markerId, drawerDraft.title, client)
      if (response.marker) {
        setSelectedMarkerId(response.marker.id)
        setPlayheadSeconds(response.marker.startTimeSeconds)
        setDrawerDraft(createProjectEditBriefMarkerDraftForUI({
          briefId: response.marker.briefId,
          editSessionId: response.marker.editSessionId,
          marker: response.marker,
          projectId: response.marker.projectId,
        }))
        refreshAfterMarkerAction('Marker confirmed in mock/local metadata.')
      } else {
        setStatusMessage('Marker confirmation failed safely without production side effects.')
      }
    } finally {
      setIsDrawerBusy(false)
    }
  }

  async function archiveDrawerMarker() {
    if (!drawerDraft?.markerId) return
    setIsDrawerBusy(true)
    try {
      await archiveProjectEditBriefMarkerViaApi(drawerDraft.markerId, client)
      setDrawerDraft(undefined)
      setSelectedMarkerId(undefined)
      setAutoSelectFirstMarker(true)
      refreshAfterMarkerAction('Marker archived in mock/local metadata and hidden from the active timeline.')
    } finally {
      setIsDrawerBusy(false)
    }
  }

  if (!model) {
    return (
      <section className="project-edit-brief-workspace" data-testid="project-edit-brief-workspace">
        <ProjectEditBriefBoundaryNotice boundary={PROJECT_EDIT_BRIEF_UI_BOUNDARY} />
        <Card className="project-edit-brief-loading" data-testid="project-edit-brief-loading">
          <span className="section-eyebrow">Edit Brief</span>
          <h2>Loading mock Brief shell</h2>
          <p>{statusMessage}</p>
        </Card>
      </section>
    )
  }

  return (
    <section className="project-edit-brief-workspace" data-testid="project-edit-brief-workspace">
      <ProjectEditBriefHeader editSessionTitle={editSessionTitle} model={model} />
      <ProjectEditBriefBoundaryNotice boundary={model.boundary} />
      <div className="project-edit-brief-status" data-testid="project-edit-brief-status" role="status">
        {statusMessage}
      </div>
      {preferenceApplicationContext ? <ProjectEditBriefPreferenceApplicationCard context={preferenceApplicationContext} /> : null}
      <div className="project-edit-brief-workspace__layout">
        <main className="project-edit-brief-main" data-testid="project-edit-brief-main">
          <ProjectEditBriefSourceVideoPicker
            backendUploadConfig={backendUploadConfig}
            backendUploadStatus="unavailable"
            error={sourceVideoError}
            localPreview={localSourceVideo}
            onClear={clearLocalSourceVideo}
            onSelectFile={selectLocalSourceVideo}
            onUploadToBackend={() => undefined}
          />
          <ProjectEditBriefSourceVideoSummary localPreview={localSourceVideo} summary={sourceVideoSummary} />
          {displayVideo ? (
            <ProjectEditBriefVideoShell
              localPreview={localSourceVideo}
              onMetadataLoaded={updateLocalSourceVideoMetadata}
              onPlayStateChange={setSourceVideoPlaying}
              onTimeUpdate={setPlayheadSeconds}
              onVideoElementReady={handleVideoElementReady}
              playing={sourceVideoPlaying}
              seekRequest={sourceVideoSeekRequest}
              video={displayVideo}
            />
          ) : null}
          <ProjectEditBriefTimeline
            addMarkerDisabledReason={addMarkerDisabledReason}
            canAddMarker={canAddMarker}
            onAddMarker={openAddMarkerDrawer}
            onMovePlayhead={movePlayhead}
            onSelectMarker={openEditMarkerDrawer}
            timeline={displayTimeline ?? model.timeline}
            timelineEyebrow={localSourceVideo ? 'Source video timeline' : 'Mock timeline'}
          />
          {model.emptyState ? (
            <ProjectEditBriefEmptyState
              emptyState={model.emptyState}
              onOpenBrief={model.emptyState.kind === 'not_opened' || model.emptyState.kind === 'not_found'
                ? () => void openOptionalBrief()
                : undefined}
            />
          ) : null}
        </main>
        <aside className="project-edit-brief-side-panel" data-testid="project-edit-brief-side-panel">
          <ProjectEditBriefSummaryPanel model={model} />
          <ProjectEditBriefQASummaryCard
            client={client}
            editSessionId={editSessionId}
            key={`brief-qa-reference-${preferenceContextRevision}`}
            onRan={refreshAfterMarkerAction}
            projectId={projectId}
            preferenceApplicationContext={preferenceApplicationContext}
          />
          <ProjectEditBriefPlanBridgePanel
            client={client}
            editSessionId={editSessionId}
            key={`brief-plan-reference-${preferenceContextRevision}`}
            onPrepared={refreshAfterMarkerAction}
            projectId={projectId}
            preferenceApplicationContext={preferenceApplicationContext}
          />
          {markerFormModel && drawerDraft ? (
            <ProjectEditBriefMarkerDrawer
              marker={drawerDraft.markerId && drawerDraft.markerId === selectedMarkerRecord?.id ? model.selectedMarker : undefined}
              markerRecord={drawerDraft.markerId && drawerDraft.markerId === selectedMarkerRecord?.id ? selectedMarkerRecord : undefined}
              form={markerFormModel}
              busy={isDrawerBusy}
              client={client}
              onArchive={archiveDrawerMarker}
              onAttachmentsChanged={async (message) => {
                if (drawerDraft.markerId) {
                  setSelectedMarkerId(drawerDraft.markerId)
                  setAutoSelectFirstMarker(false)
                  await refreshDrawerDraftFromMarker(drawerDraft.markerId)
                }
                refreshAfterMarkerAction(message)
              }}
              onClose={() => {
                setDrawerDraft(undefined)
                setStatusMessage('Marker drawer closed without saving.')
              }}
              onChange={setDrawerDraft}
              onConfirm={confirmDrawerMarker}
              onMarkerChatApplied={(message) => {
                if (drawerDraft.markerId) {
                  setSelectedMarkerId(drawerDraft.markerId)
                  setAutoSelectFirstMarker(false)
                }
                refreshAfterMarkerAction(message)
              }}
              onMarkerQARan={(message) => {
                if (drawerDraft.markerId) {
                  setSelectedMarkerId(drawerDraft.markerId)
                  setAutoSelectFirstMarker(false)
                }
                refreshAfterMarkerAction(message)
              }}
              onVisualContextUpdated={(message) => {
                if (drawerDraft.markerId) {
                  setSelectedMarkerId(drawerDraft.markerId)
                  setAutoSelectFirstMarker(false)
                }
                refreshAfterMarkerAction(message)
              }}
              onSave={saveDrawerMarker}
              sourceVideoDurationSeconds={localSourceVideo?.durationSeconds}
              sourceVideoElement={sourceVideoElement}
              sourceVideoLabel={localSourceVideo?.fileName}
              preferenceApplicationContext={preferenceApplicationContext}
            />
          ) : null}
          <ProjectEditBriefMarkerDetailPanel marker={model.selectedMarker} />
          <ProjectEditBriefExportSettingsSummary
            client={client}
            exportSettings={model.exportSettings}
            onSaved={refreshAfterMarkerAction}
            sourceVideoRecommendationInput={sourceVideoExportRecommendationInput}
            sourceVideoSummary={localSourceVideo ? sourceVideoSummary : undefined}
          />
        </aside>
      </div>
    </section>
  )
}
