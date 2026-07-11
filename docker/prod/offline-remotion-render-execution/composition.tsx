import React from 'react'
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
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
  compositionProfileId?: 'approved_source_caption_final_v1'
  sourceFit?: 'contain'
  audioPolicy?: 'preserve_source'
  captionOverlayPolicy?: 'approved_full_frame_rgba'
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
    props.compositionProfileId === 'approved_source_caption_final_v1' &&
    props.sourceInternalUrl && props.captionOverlayInternalUrl
  ) {
    return <ApprovedSourceCaptionComposition {...props} />
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

const ApprovedSourceCaptionComposition: React.FC<ApprovedCompositionProps> = (props) => (
  <AbsoluteFill style={{ backgroundColor: props.panelBackground, overflow: 'hidden' }}>
    <OffthreadVideo
      src={props.sourceInternalUrl!}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      volume={1}
    />
    <Img
      src={props.captionOverlayInternalUrl!}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
    />
  </AbsoluteFill>
)
