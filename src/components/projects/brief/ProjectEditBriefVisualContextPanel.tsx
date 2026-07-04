import { useEffect, useState } from 'react'
import { Badge } from '../../Badge'
import type { ProjectEditBriefApiClient } from '../../../lib/project-edit-brief-api-client'
import {
  analyzeProjectEditBriefMarkerVisualContextViaApi,
  createProjectEditBriefVisualContextFallback,
  createProjectEditBriefVisualContextSummary,
  readProjectEditBriefVisualContextFromMarker,
  saveProjectEditBriefVisualContextToMarker,
} from '../../../lib/project-edit-brief-visual-context-ui-adapter'
import { sampleProjectSourceVideoFramesForMarker } from '../../../lib/project-source-video-frame-sampler'
import type { ProjectEditBriefMarkerRecord } from '../../../types/project-edit-brief'
import type { ProjectEditBriefVisualContext } from '../../../types/project-edit-brief-visual-context'
import { ProjectEditBriefAnalyzeVisualContextButton } from './ProjectEditBriefAnalyzeVisualContextButton'
import { ProjectEditBriefVisualContextBoundaryNotice } from './ProjectEditBriefVisualContextBoundaryNotice'
import { ProjectEditBriefVisualContextSummaryCard } from './ProjectEditBriefVisualContextSummaryCard'

type ProjectEditBriefVisualContextPanelProps = {
  client?: ProjectEditBriefApiClient
  marker: ProjectEditBriefMarkerRecord
  onContextUpdated?: (message: string) => void
  sourceVideoDurationSeconds?: number
  sourceVideoElement?: HTMLVideoElement | null
  sourceVideoLabel?: string
}

function runtimeBadgeLabel(context?: ProjectEditBriefVisualContext): string {
  if (!context) return 'Unavailable'
  if (context.runtimeSource === 'qwen25vl_live') return 'Qwen2.5-VL live'
  if (context.runtimeSource === 'qwen25vl_fake') return 'Qwen2.5-VL fake'
  return 'Fallback'
}

export function ProjectEditBriefVisualContextPanel({
  client,
  marker,
  onContextUpdated,
  sourceVideoDurationSeconds,
  sourceVideoElement,
  sourceVideoLabel,
}: ProjectEditBriefVisualContextPanelProps) {
  const [contextOverride, setContextOverride] = useState<ProjectEditBriefVisualContext | undefined>()
  const [busy, setBusy] = useState(false)
  const [statusOverride, setStatusOverride] = useState<{ markerId: string; status: string } | undefined>()
  const [readiness, setReadiness] = useState(client?.qwen25VLVisualContextRuntime.readiness)
  const sourceReady = Boolean(sourceVideoElement && sourceVideoLabel)
  const metadataContext = readProjectEditBriefVisualContextFromMarker(marker)
  const context = contextOverride?.markerId === marker.id ? contextOverride : metadataContext
  const status = statusOverride?.markerId === marker.id
    ? statusOverride.status
    : createProjectEditBriefVisualContextSummary(context)

  function setMarkerStatus(statusText: string) {
    setStatusOverride({ markerId: marker.id, status: statusText })
  }

  function setMarkerContext(nextContext: ProjectEditBriefVisualContext) {
    setContextOverride(nextContext)
    setMarkerStatus(createProjectEditBriefVisualContextSummary(nextContext))
  }

  useEffect(() => {
    let cancelled = false
    client?.loadQwen25VLVisualContextReadiness().then((nextReadiness) => {
      if (!cancelled) setReadiness(nextReadiness)
    })
    return () => {
      cancelled = true
    }
  }, [client])

  async function saveFallback(reason: string, sampledFrameCount = 0) {
    const fallback = createProjectEditBriefVisualContextFallback({
      marker,
      sourceVideoLabel,
      sampledFrameCount,
      reason,
      runtimeSource: reason === 'sampling_failed' ? 'deterministic_visual_fallback' : 'blocked_missing_beta_config',
    })
    setMarkerContext(fallback)
    await saveProjectEditBriefVisualContextToMarker({ marker, visualContext: fallback, client })
    onContextUpdated?.(createProjectEditBriefVisualContextSummary(fallback))
  }

  async function analyze() {
    if (!sourceVideoElement) {
      await saveFallback('select_local_source_video_first')
      return
    }

    setBusy(true)
    setMarkerStatus('Sampling local video frames in the browser.')
    try {
      const sampled = await sampleProjectSourceVideoFramesForMarker({
        marker,
        video: sourceVideoElement,
        durationSeconds: sourceVideoDurationSeconds,
      })
      if (!sampled.ok) {
        await saveFallback('sampling_failed')
        return
      }
      setMarkerStatus('Sending sampled resized frames to the visual-context route.')
      const result = await analyzeProjectEditBriefMarkerVisualContextViaApi({
        marker,
        sampledFrames: sampled.frames,
        sourceVideoLabel,
        client,
      })
      const nextStatus = createProjectEditBriefVisualContextSummary(result.visualContext)
      setContextOverride(result.visualContext)
      setMarkerStatus(nextStatus)
      onContextUpdated?.(nextStatus)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="project-edit-brief-visual-context" data-testid="project-edit-brief-visual-context-panel">
      <div className="project-edit-brief-visual-context__header">
        <div>
          <h4>Visual Context</h4>
          <p>{readiness?.summary ?? client?.qwen25VLVisualContextRuntime.summary}</p>
        </div>
        <Badge accent={context?.runtimeSource === 'qwen25vl_live' ? 'cyan' : undefined}>
          {runtimeBadgeLabel(context)}
        </Badge>
      </div>
      <ProjectEditBriefVisualContextBoundaryNotice />
      <div className="project-edit-brief-visual-context__actions">
        <ProjectEditBriefAnalyzeVisualContextButton
          busy={busy}
          disabled={!sourceReady}
          disabledReason="Select a local source video first."
          onAnalyze={analyze}
        />
        {!sourceReady ? (
          <span data-testid="project-edit-brief-visual-context-disabled">Select local source video first.</span>
        ) : (
          <span data-testid="project-edit-brief-visual-context-source">Source: {sourceVideoLabel}</span>
        )}
      </div>
      <div className="project-edit-brief-visual-context__status" data-testid="project-edit-brief-visual-context-status" role="status">
        {status}
      </div>
      <ProjectEditBriefVisualContextSummaryCard context={context} />
    </section>
  )
}
