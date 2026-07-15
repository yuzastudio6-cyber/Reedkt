import React from 'react'
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

export interface ApprovedCompositionProps {
  width: number
  height: number
  fps: number
  durationFrames: number
  frameTemplateId: 'approved_full_panel_v1' | 'approved_lower_panel_v1'
  panelBackground: string
  accentColor: string
  title: string
  subtitle: string
  caption: string
  compositionProfileId?:
    | 'approved_source_caption_final_v1'
    | 'approved_source_sequence_caption_final_v1'
    | 'approved_source_caption_track_final_v1'
    | 'approved_source_sequence_caption_track_final_v1'
  sourceStartFrame?: number
  sourceEndFrameExclusive?: number
  sourceFit?: 'contain'
  audioPolicy?:
    | 'preserve_source'
    | 'preserve_source_sequence'
    | 'replace_with_approved_voice_tracks'
  captionOverlayPolicy?: 'approved_full_frame_rgba' | 'approved_timed_full_frame_rgba_track'
  sourceMimeType?: 'video/mp4'
  sourceByteLength?: number
  sourceSha256?: string
  sourceBytesBase64?: string
  captionOverlayMimeType?: 'image/png'
  captionOverlayByteLength?: number
  captionOverlaySha256?: string
  captionOverlayBytesBase64?: string
  sourceInternalUrl?: string
  captionOverlayInternalUrl?: string
  captionOverlayCues?: Array<{
    outputKey: string
    startFrame: number
    endFrameExclusive: number
  }>
  captionOverlayInternalUrls?: Array<{
    outputKey: string
    captionOverlayInternalUrl: string
  }>
  sourceSegments?: Array<{
    sourceSequenceItemId: string
    sourceStartFrame: number
    sourceEndFrameExclusive: number
    timelineStartFrame: number
    timelineEndFrameExclusive: number
  }>
  transitionPolicy?: 'approved_hard_cuts_only'
  hardCutTransitions?: Array<{
    transitionTimingItemId: string
    refinedTransitionTimingItemId: string
    fromSegmentId: string
    toSegmentId: string
    fromSourceSequenceItemId: string
    toSourceSequenceItemId: string
    boundaryFrame: number
  }>
  sourceInternalUrls?: Array<{
    sourceSequenceItemId: string
    sourceInternalUrl: string
  }>
  voiceTrackInternalUrls?: Array<{
    sourceSequenceItemId: string
    outputKey: string
    voiceTrackInternalUrl: string
  }>
}

export const defaultApprovedCompositionProps: ApprovedCompositionProps = {
  width: 640,
  height: 360,
  fps: 30,
  durationFrames: 60,
  frameTemplateId: 'approved_full_panel_v1',
  panelBackground: '#F7F8FA',
  accentColor: '#4F46E5',
  title: 'Approved ReEditPro composition',
  subtitle: 'Deterministic private render evidence',
  caption: 'Frame-accurate composition proof',
}

export const ApprovedComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames, width, height } = useVideoConfig()
  if (
    ['approved_source_caption_final_v1', 'approved_source_caption_track_final_v1']
      .includes(props.compositionProfileId ?? '') &&
    props.sourceInternalUrl && hasApprovedCaptionInput(props) && hasApprovedAudioInput(props, 1)
  ) {
    return <ApprovedSourceCaptionComposition {...props} />
  }
  if (
    ['approved_source_sequence_caption_final_v1', 'approved_source_sequence_caption_track_final_v1']
      .includes(props.compositionProfileId ?? '') &&
    props.sourceSegments && props.sourceInternalUrls && hasApprovedCaptionInput(props) &&
    hasApprovedAudioInput(props, props.sourceSegments.length) &&
    hasApprovedHardCutInput(props)
  ) {
    return <ApprovedSourceSequenceCaptionComposition {...props} />
  }
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 140, mass: 0.8 } })
  const exit = interpolate(
    frame,
    [Math.max(0, durationInFrames - 12), durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  const panelHeight = props.frameTemplateId === 'approved_lower_panel_v1'
    ? Math.round(height * 0.48)
    : Math.round(height * 0.72)
  const panelWidth = Math.round(width * 0.84)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: props.panelBackground,
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#111827',
        justifyContent: props.frameTemplateId === 'approved_lower_panel_v1' ? 'flex-end' : 'center',
        alignItems: 'center',
        padding: Math.round(Math.min(width, height) * 0.07),
      }}
    >
      <div
        style={{
          width: panelWidth,
          height: panelHeight,
          boxSizing: 'border-box',
          borderRadius: Math.max(16, Math.round(Math.min(width, height) * 0.055)),
          backgroundColor: '#FFFFFF',
          border: `2px solid ${props.accentColor}22`,
          boxShadow: '0 18px 55px rgba(15, 23, 42, 0.14)',
          padding: Math.round(Math.min(width, height) * 0.09),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: entrance * exit,
          transform: `translateY(${(1 - entrance) * 34}px) scale(${0.96 + entrance * 0.04})`,
        }}
      >
        <div style={{ width: Math.round(panelWidth * 0.18), height: 8, borderRadius: 999, background: props.accentColor, marginBottom: 24 }} />
        <div style={{ fontSize: Math.max(26, Math.round(width * 0.045)), fontWeight: 760, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
          {props.title}
        </div>
        <div style={{ fontSize: Math.max(15, Math.round(width * 0.022)), lineHeight: 1.35, color: '#475569', marginTop: 14 }}>
          {props.subtitle}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: Math.round(width * 0.1),
          right: Math.round(width * 0.1),
          bottom: Math.round(height * 0.045),
          textAlign: 'center',
          color: '#FFFFFF',
          background: 'rgba(15, 23, 42, 0.88)',
          borderRadius: 10,
          padding: `${Math.max(7, Math.round(height * 0.018))}px ${Math.max(12, Math.round(width * 0.025))}px`,
          fontSize: Math.max(14, Math.round(width * 0.021)),
          fontWeight: 650,
          lineHeight: 1.25,
          opacity: interpolate(frame, [6, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * exit,
        }}
      >
        {props.caption}
      </div>
    </AbsoluteFill>
  )
}

const ApprovedSourceCaptionComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const replaceVoice = props.audioPolicy === 'replace_with_approved_voice_tracks'
  return (
    <AbsoluteFill style={{ backgroundColor: props.panelBackground, overflow: 'hidden' }}>
      <OffthreadVideo
        src={props.sourceInternalUrl!}
        startFrom={props.sourceStartFrame!}
        endAt={props.sourceEndFrameExclusive!}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        volume={replaceVoice ? 0 : 1}
      />
      {replaceVoice && <Audio src={props.voiceTrackInternalUrls![0]!.voiceTrackInternalUrl} />}
      <ApprovedCaptionOverlays {...props} />
    </AbsoluteFill>
  )
}

const ApprovedSourceSequenceCaptionComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const sourceUrlById = new Map(
    props.sourceInternalUrls!.map((source) => [source.sourceSequenceItemId, source.sourceInternalUrl]),
  )
  const voiceUrlBySourceId = new Map(
    (props.voiceTrackInternalUrls ?? []).map((track) => [
      track.sourceSequenceItemId,
      track.voiceTrackInternalUrl,
    ]),
  )
  const replaceVoice = props.audioPolicy === 'replace_with_approved_voice_tracks'
  return (
    <AbsoluteFill style={{ backgroundColor: props.panelBackground, overflow: 'hidden' }}>
      {props.sourceSegments!.map((segment) => (
        <Sequence
          key={segment.sourceSequenceItemId}
          from={segment.timelineStartFrame}
          durationInFrames={segment.timelineEndFrameExclusive - segment.timelineStartFrame}
          name={`Approved source ${segment.sourceSequenceItemId}`}
        >
          <OffthreadVideo
            src={sourceUrlById.get(segment.sourceSequenceItemId)!}
            startFrom={segment.sourceStartFrame}
            endAt={segment.sourceEndFrameExclusive}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            volume={replaceVoice ? 0 : 1}
          />
          {replaceVoice && <Audio src={voiceUrlBySourceId.get(segment.sourceSequenceItemId)!} />}
        </Sequence>
      ))}
      <ApprovedCaptionOverlays {...props} />
    </AbsoluteFill>
  )
}

const captionOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'fill',
}

const ApprovedCaptionOverlays: React.FC<ApprovedCompositionProps> = (props) => {
  if (props.captionOverlayInternalUrl) {
    return <Img src={props.captionOverlayInternalUrl} style={captionOverlayStyle} />
  }
  const urlByOutputKey = new Map(
    props.captionOverlayInternalUrls!.map((overlay) => [
      overlay.outputKey,
      overlay.captionOverlayInternalUrl,
    ]),
  )
  return <>
    {props.captionOverlayCues!.map((cue) => (
      <Sequence
        key={cue.outputKey}
        from={cue.startFrame}
        durationInFrames={cue.endFrameExclusive - cue.startFrame}
        name={`Approved caption ${cue.outputKey}`}
      >
        <Img src={urlByOutputKey.get(cue.outputKey)!} style={captionOverlayStyle} />
      </Sequence>
    ))}
  </>
}

function hasApprovedCaptionInput(props: ApprovedCompositionProps): boolean {
  if (props.captionOverlayInternalUrl) return true
  if (
    !props.captionOverlayCues || !props.captionOverlayInternalUrls ||
    props.captionOverlayCues.length !== props.captionOverlayInternalUrls.length
  ) return false
  const urls = new Set(props.captionOverlayInternalUrls.map((overlay) => overlay.outputKey))
  return props.captionOverlayCues.every((cue) => urls.has(cue.outputKey))
}

function hasApprovedAudioInput(props: ApprovedCompositionProps, sourceCount: number): boolean {
  if (props.audioPolicy !== 'replace_with_approved_voice_tracks') {
    return props.voiceTrackInternalUrls === undefined
  }
  if (!props.voiceTrackInternalUrls || props.voiceTrackInternalUrls.length !== sourceCount) {
    return false
  }
  const sourceIds = new Set(props.voiceTrackInternalUrls.map((track) => track.sourceSequenceItemId))
  const outputKeys = new Set(props.voiceTrackInternalUrls.map((track) => track.outputKey))
  if (sourceIds.size !== sourceCount || outputKeys.size !== sourceCount) return false
  if (!props.sourceSegments) return sourceCount === 1
  return props.sourceSegments.every((segment) => sourceIds.has(segment.sourceSequenceItemId))
}

function hasApprovedHardCutInput(props: ApprovedCompositionProps): boolean {
  if (
    props.transitionPolicy !== 'approved_hard_cuts_only' ||
    !props.sourceSegments || !props.hardCutTransitions ||
    props.hardCutTransitions.length !== props.sourceSegments.length - 1
  ) return false
  const timingIds = new Set<string>()
  const refinedIds = new Set<string>()
  return props.hardCutTransitions.every((transition, index) => {
    const fromSource = props.sourceSegments![index]
    const toSource = props.sourceSegments![index + 1]
    const valid = Boolean(
      fromSource && toSource &&
      !timingIds.has(transition.transitionTimingItemId) &&
      !refinedIds.has(transition.refinedTransitionTimingItemId) &&
      transition.fromSourceSequenceItemId === fromSource.sourceSequenceItemId &&
      transition.toSourceSequenceItemId === toSource.sourceSequenceItemId &&
      transition.boundaryFrame === fromSource.timelineEndFrameExclusive &&
      transition.boundaryFrame === toSource.timelineStartFrame
    )
    timingIds.add(transition.transitionTimingItemId)
    refinedIds.add(transition.refinedTransitionTimingItemId)
    return valid
  })
}
