import React from 'react'
import {
  AbsoluteFill,
  Audio,
  Html5Video,
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
    | 'approved_4k_composition_chunk_merge_final_v1'
    | 'approved_long_form_delivery_h264_video_chunk_v1'
    | 'motion_studio_scene_preview_v1'
    | 'motion_studio_native_layered_scene_v1'
    | 'motion_studio_prepared_script_animatic_v1'
    | 'motion_studio_deterministic_route_draw_v1'
    | 'caption_direction_creative_scene_group_v1'
    | 'caption_direction_real_source_scene_group_v2'
    | 'caption_direction_real_source_multi_output_scene_group_v3'
  deliveryProfileId?: 'uhd_2160'
  sourceStartFrame?: number
  sourceEndFrameExclusive?: number
  sourceFit?: 'contain'
  audioPolicy?:
    | 'preserve_source'
    | 'preserve_source_sequence'
    | 'replace_with_approved_voice_tracks'
  captionOverlayPolicy?: 'approved_full_frame_rgba' | 'approved_timed_full_frame_rgba_track'
  sourceMediaPolicy?:
    | 'approved_professional_color_intermediate_v1'
    | 'approved_b_roll_qa_normalized_preview_proxy_v1'
  brollPreviewLayer?: {
    displayTreatment:
      | 'full_frame_takeover'
      | 'full_frame_cutaway'
      | 'inset'
      | 'picture_in_picture'
      | 'split_screen'
      | 'partial_overlay'
      | 'background_layer'
    position: 'absolute'
    crop: 'contain'
    xPercent: 0 | 50 | 55 | 60 | 65
    yPercent: 0 | 6 | 8 | 45
    widthPercent: 30 | 34 | 40 | 50 | 100
    heightPercent: 30 | 34 | 45 | 100
    scale: 1
    opacity: 0.45 | 1
    layerOrder: 0 | 10
  }
  sourceMimeType?: 'video/mp4' | 'video/x-matroska'
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
  livingFrameOverlayPolicy?: 'approved_rgba_over_source_below_captions_v1'
  livingFrameOverlays?: Array<{
    sceneId: string
    layerId: string
    manifestOutputKey: string
    componentOutputKey: string
    startFrame: number
    endFrameExclusive: number
    fit: 'fill'
    opacity: 1
    livingFrameOverlayInternalUrl: string
  }>
  controlledVisualOverlayPolicy?:
    'approved_structured_svg_below_captions_v1'
  controlledVisualOverlays?: Array<{
    outputKey: string
    rendererLayerId: string
    toolId: 'd3' | 'echarts'
    startFrame: number
    endFrameExclusive: number
    x: number
    y: number
    width: number
    height: number
    fit: 'contain'
    opacity: 1
    sourceConfidence: 'verified' | 'mock' | 'fictional'
    safeWording:
      | 'verified data'
      | 'mock demo data'
      | 'fictional story data'
    controlledVisualOverlayInternalUrl: string
  }>
  sourceSegments?: Array<{
    sourceSequenceItemId: string
    sourceStartFrame: number
    sourceEndFrameExclusive: number
    timelineStartFrame: number
    timelineEndFrameExclusive: number
  }>
  transitionPolicy?:
    | 'approved_hard_cuts_only'
    | 'approved_bounded_source_transitions_v1'
  hardCutTransitions?: Array<{
    transitionTimingItemId: string
    refinedTransitionTimingItemId: string
    fromSegmentId: string
    toSegmentId: string
    fromSourceSequenceItemId: string
    toSourceSequenceItemId: string
    boundaryFrame: number
  }>
  sourceTransitions?: Array<{
    transitionTimingItemId: string
    refinedTransitionTimingItemId: string
    fromSegmentId: string
    toSegmentId: string
    fromSourceSequenceItemId: string
    toSourceSequenceItemId: string
    boundaryFrame: number
    transitionType: 'hard_cut' | 'smooth_panel_dip'
    startFrame: number
    endFrameExclusive: number
    durationFrames: number
    visualCurve: 'none' | 'linear_dip_to_panel'
    audioPolicy: 'hard_cut_at_boundary'
  }>
  sourceInternalUrls?: Array<{
    sourceSequenceItemId: string
    sourceInternalUrl: string
  }>
  voiceTrackInternalUrls?: Array<{
    sourceSequenceItemId: string
    outputKey: string
    durationFrames: number
    sourceStartFrame?: number
    sourceEndFrameExclusive?: number
    voiceTrackInternalUrl: string
  }>
  supplementalAudioTracks?: Array<{
    outputKey: string
    attachmentId: string
    markerId: string
    markerType: 'music' | 'sfx'
    startFrame: number
    endFrameExclusive: number
    fillPolicy: 'loop_or_trim_to_window' | 'trim_without_loop'
    mixProfileId:
      | 'speech_safe_uploaded_music_bed_v1'
      | 'narration_protected_uploaded_sfx_v1'
    supplementalAudioInternalUrl: string
  }>
  chunkSegments?: Array<{
    outputKey: string
    chunkIndex: number
    globalStartFrame: number
    globalEndFrameExclusive: number
    durationFrames: number
  }>
  chunkInternalUrls?: Array<{
    outputKey: string
    chunkIndex: number
    chunkInternalUrl: string
  }>
  sceneId?: string
  sceneStartFrame?: number
  sceneEndFrame?: number
  semanticPurpose?: string
  productionMode?:
    | 'generative_first'
    | 'layered_first'
    | 'native_graphics_first'
    | 'footage_first'
    | 'hybrid_directed'
  layerType?:
    | 'image'
    | 'source_footage'
    | 'generated_video'
    | 'text'
    | 'caption'
    | 'map'
    | 'chart'
    | 'mask'
    | 'audio'
    | 'effect'
  layerManifestDigest?: string
  depthModel?: 'semantic_planes_v1'
  planes?: readonly {
    planeId: 'background-plane' | 'headline-plane' | 'subject-plane' | 'caption-plane'
    role: 'background' | 'headline' | 'subject' | 'caption'
    zIndex: 0 | 10 | 20 | 30
    sourceKind: 'remotion_native' | 'approved_cutout_slot'
    motionToken: 'ambient_drift' | 'headline_reveal' | 'subject_parallax' | 'caption_hold'
  }[]
  headline?: string
  panelHighlight?: string
  headlineColor?: string
  captionColor?: string
  horizontalSafePercent?: 8
  verticalSafePercent?: 8
  captionBottomPercent?: 9
  captionAboveMask?: true
  contactObjectPresent?: false
  maskRisk?: 'low_fixture_only'
  subjectSha256?: string
  subjectInternalUrl?: string
  scenes?: readonly {
    order: number
    sceneId: string
    startFrame: number
    endFrame: number
    title: string
    visualDescription: string
  }[]
  narrationMimeType?: 'audio/wav' | 'audio/mpeg' | 'audio/mp3'
  narrationByteLength?: number
  narrationSha256?: string
  narrationBytesBase64?: string
  narrationInternalUrl?: string
  keyframeSha256?: string
  keyframeInternalUrl?: string
  routePresetId?: 'abstract_three_district_route_v1'
  routeRevealStartFrame?: 18
  routeRevealEndFrame?: 140
  waypointFrames?: readonly [18, 82, 140]
  routeCoverColor?: '#081426'
  routeColor?: '#FFB23D'
  routeGlowColor?: '#FF7A1A'
  sceneGroupId?: string
  sceneGroupDigestSha256?: string
  motionLockDigestSha256?: string
  storyTimingResolutionDigestSha256?: string
  confirmedOutputWidth?: number
  confirmedOutputHeight?: number
  confirmedAspectRatioNumerator?: number
  confirmedAspectRatioDenominator?: number
  privateReviewScaleNumerator?: 1
  privateReviewScaleDenominator?: 3
  reducedMotion?: boolean
  subjectMaskFixturePolicy?:
    | 'none'
    | 'deterministic_private_fixture_only_not_track_all_evidence'
  backgroundStyle?:
    | 'editorial_night_sky_v1'
    | 'real_source_video_v1'
    | 'real_source_editorial_split_v1'
  captionCreativeLayers?: Array<{
    layerId: string
    nodeId: string
    trackId: string
    phraseId: string
    trackRole:
      | 'verbatim_speech' | 'semantic_phrase' | 'active_word'
      | 'hero_typography' | 'persistent_topic_list' | 'quote'
      | 'speaker_attribution' | 'caption_to_visual'
      | 'accessible_sidecar' | 'localized_accessible'
    presentationKind:
      | 'stable_accessible_caption' | 'semantic_phrase_card'
      | 'hero_typography' | 'persistent_topic_list'
      | 'environmental_label' | 'object_anchor_label'
      | 'caption_to_visual_bridge'
    text: string
    exactSourceWordIds: string[]
    frameRange: { startFrame: number; endFrameExclusive: number }
    stableReadRange: { startFrame: number; endFrameExclusive: number }
    depthPlane:
      | 'far_background' | 'environmental_background' | 'behind_subject'
      | 'speaker_adjacent' | 'object_attached' | 'in_front_of_subject'
      | 'foreground_hero' | 'full_screen' | 'safe_accessible'
    zIndex: number
    layoutBasisPoints: { x: number; y: number; width: number; height: number }
    typography: {
      fontFamilyToken: 'approved_caption_sans_fixture_v1'
      fontWeight: 600 | 700 | 800
      fontSizeBasisPointsOfFrameHeight: number
      lineHeightMilli: number
      textColor: '#F8FAFC' | '#DFF7FF' | '#09111F'
      accentColor: '#6EE7F9' | '#A78BFA' | '#FBBF24'
      plateStyle: 'none' | 'soft_dark' | 'soft_light' | 'outline_dark'
      textAlign: 'left' | 'center'
    }
    motion: {
      primitive:
        | 'reveal' | 'fade' | 'scale' | 'slide' | 'wipe' | 'tracked_move'
        | 'depth_transition' | 'emphasis_pulse' | 'brush_reveal'
        | 'list_append' | 'hero_expansion' | 'handoff_morph'
        | 'stable_hold' | 'cut'
      easing: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'spring_restrained'
      travelBasisPoints: { x: number; y: number }
      startScaleBasisPoints: number
      endScaleBasisPoints: number
      startOpacityBasisPoints: number
      endOpacityBasisPoints: number
      overshootBasisPoints: number
      staggerFrames: number
    }
    reducedMotion: {
      primitive: 'fade' | 'stable_hold' | 'cut'
      frameRange: { startFrame: number; endFrameExclusive: number }
    }
    accessibilityCounterpartNodeId: string | null
    maskSequenceRef: { id: string; version: string; contentHash: string } | null
    objectAnchorRef: { id: string; version: string; contentHash: string } | null
    trackManifestRef: { id: string; version: string; contentHash: string } | null
    dependencyDisposition:
      | 'not_applicable' | 'admitted_exact_private_evidence'
      | 'declared_safe_fallback'
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
    props.compositionProfileId ===
      'approved_long_form_delivery_h264_video_chunk_v1' &&
    props.sourceInternalUrl
  ) {
    return <ApprovedDeliveryH264ChunkComposition {...props} />
  }
  if (
    props.compositionProfileId === 'approved_4k_composition_chunk_merge_final_v1' &&
    hasApprovedChunkMergeInput(props)
  ) {
    return <ApprovedChunkMergeComposition {...props} />
  }
  if (
    ['approved_source_caption_final_v1', 'approved_source_caption_track_final_v1']
      .includes(props.compositionProfileId ?? '') &&
    props.sourceInternalUrl && hasApprovedCaptionInput(props) &&
    hasApprovedAudioInput(props, 1) && hasApprovedSupplementalAudioInput(props) &&
    hasApprovedLivingFrameInput(props) &&
    hasApprovedControlledVisualInput(props)
  ) {
    return <ApprovedSourceCaptionComposition {...props} />
  }
  if (
    ['approved_source_sequence_caption_final_v1', 'approved_source_sequence_caption_track_final_v1']
      .includes(props.compositionProfileId ?? '') &&
    props.sourceSegments && props.sourceInternalUrls && hasApprovedCaptionInput(props) &&
    hasApprovedAudioInput(props, props.sourceSegments.length) &&
    hasApprovedSourceTransitionInput(props) &&
    hasApprovedSupplementalAudioInput(props) &&
    hasApprovedLivingFrameInput(props) &&
    hasApprovedControlledVisualInput(props)
  ) {
    return <ApprovedSourceSequenceCaptionComposition {...props} />
  }
  if (props.compositionProfileId === 'motion_studio_scene_preview_v1') {
    return <MotionStudioScenePreviewComposition {...props} />
  }
  if (
    props.compositionProfileId === 'motion_studio_native_layered_scene_v1' &&
    props.subjectInternalUrl
  ) {
    return <MotionStudioNativeLayeredComposition {...props} />
  }
  if (props.compositionProfileId === 'motion_studio_prepared_script_animatic_v1') {
    return <MotionStudioPreparedAnimaticComposition {...props} />
  }
  if (
    props.compositionProfileId === 'motion_studio_deterministic_route_draw_v1' &&
    props.keyframeInternalUrl
  ) {
    return <MotionStudioDeterministicRouteDrawComposition {...props} />
  }
  if (
    [
      'caption_direction_real_source_scene_group_v2',
      'caption_direction_real_source_multi_output_scene_group_v3',
    ].includes(props.compositionProfileId ?? '') &&
    props.sourceInternalUrl && props.captionCreativeLayers &&
    props.captionCreativeLayers.length >= 2
  ) {
    return <CaptionRealSourceSceneGroupComposition {...props} />
  }
  if (
    props.compositionProfileId === 'caption_direction_creative_scene_group_v1' &&
    props.captionCreativeLayers && props.captionCreativeLayers.length >= 2
  ) {
    return <CaptionCreativeSceneGroupComposition {...props} />
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

type CaptionCreativeLayer = NonNullable<
  ApprovedCompositionProps['captionCreativeLayers']
>[number]

const captionPlateStyle = (
  layer: CaptionCreativeLayer,
): React.CSSProperties => {
  if (layer.typography.plateStyle === 'soft_dark') return {
    background: 'rgba(3, 10, 22, 0.88)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.34)',
    backdropFilter: 'blur(8px)',
  }
  if (layer.typography.plateStyle === 'soft_light') return {
    background: 'rgba(244, 248, 252, 0.94)',
    border: '1px solid rgba(255,255,255,0.88)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.22)',
  }
  if (layer.typography.plateStyle === 'outline_dark') return {
    background: 'rgba(6, 17, 32, 0.68)',
    border: `1px solid ${layer.typography.accentColor}66`,
    boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(5px)',
  }
  return {}
}

const CaptionCreativeLayerView: React.FC<{
  layer: CaptionCreativeLayer
  globalFrame: number
  reducedMotion: boolean
  realSourcePresentation?: boolean
}> = ({ layer, globalFrame, reducedMotion, realSourcePresentation = false }) => {
  const { width, height } = useVideoConfig()
  if (
    globalFrame < layer.frameRange.startFrame ||
    globalFrame >= layer.frameRange.endFrameExclusive
  ) return null
  const localFrame = globalFrame - layer.frameRange.startFrame
  const duration = layer.frameRange.endFrameExclusive - layer.frameRange.startFrame
  const enterFrames = Math.min(7, Math.max(1, duration - 1))
  const exitFrames = Math.min(5, Math.max(1, duration - enterFrames))
  const enter = interpolate(localFrame, [0, enterFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const exit = interpolate(
    localFrame,
    [Math.max(0, duration - exitFrames), Math.max(1, duration - 1)],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  const stableReduced = reducedMotion &&
    ['stable_hold', 'cut'].includes(layer.reducedMotion.primitive)
  const reducedFade = reducedMotion && layer.reducedMotion.primitive === 'fade'
  const rawProgress = stableReduced ? 1 : enter
  const easedProgress = layer.motion.easing === 'ease_in_out'
    ? rawProgress * rawProgress * (3 - 2 * rawProgress)
    : layer.motion.easing === 'ease_in'
      ? rawProgress * rawProgress
      : layer.motion.easing === 'ease_out'
        ? 1 - (1 - rawProgress) * (1 - rawProgress)
        : rawProgress
  const travelX = reducedMotion ? 0
    : layer.motion.travelBasisPoints.x / 10_000 * width * (1 - easedProgress)
  const travelY = reducedMotion ? 0
    : layer.motion.travelBasisPoints.y / 10_000 * height * (1 - easedProgress)
  const startScale = layer.motion.startScaleBasisPoints / 10_000
  const endScale = layer.motion.endScaleBasisPoints / 10_000
  const scale = reducedMotion ? 1 : startScale + (endScale - startScale) * easedProgress
  const startOpacity = layer.motion.startOpacityBasisPoints / 10_000
  const endOpacity = layer.motion.endOpacityBasisPoints / 10_000
  const motionOpacity = stableReduced ? 1
    : reducedFade ? enter : startOpacity + (endOpacity - startOpacity) * easedProgress
  const opacity = Math.max(0, Math.min(1, motionOpacity * exit))
  const layout = layer.layoutBasisPoints
  const isHero = layer.presentationKind === 'hero_typography'
  const isList = layer.presentationKind === 'persistent_topic_list'
  const isAccessible = layer.presentationKind === 'stable_accessible_caption'
  const reviewScale = Math.min(width / 640, height / 360)
  const px = (value: number) => Math.max(1, Math.round(value * reviewScale))
  const paddingY = isHero ? 0 : isAccessible ? px(10) : px(12)
  const paddingX = isHero ? 0 : isAccessible ? px(18) : px(16)
  const fontSize = Math.round(
    height * layer.typography.fontSizeBasisPointsOfFrameHeight / 10_000,
  )
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: layer.zIndex,
        left: `${layout.x / 100}%`,
        top: `${layout.y / 100}%`,
        width: `${layout.width / 100}%`,
        height: `${layout.height / 100}%`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: layer.typography.textAlign === 'center' ? 'center' : 'flex-start',
        opacity,
        transform: `translate(${travelX}px, ${travelY}px) scale(${scale})`,
        transformOrigin: layer.typography.textAlign === 'center'
          ? 'center center' : 'left center',
      }}
    >
      <div
        style={{
          ...captionPlateStyle(layer),
          width: isAccessible ? '100%' : 'auto',
          maxWidth: '100%',
          borderRadius: isAccessible ? px(14) : isList ? px(18) : px(12),
          padding: `${paddingY}px ${paddingX}px`,
          color: realSourcePresentation && isHero
            ? layer.typography.accentColor : layer.typography.textColor,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize,
          fontWeight: layer.typography.fontWeight,
          lineHeight: layer.typography.lineHeightMilli / 1_000,
          letterSpacing: isHero
            ? realSourcePresentation ? '-0.025em' : '-0.045em'
            : '-0.018em',
          textAlign: layer.typography.textAlign,
          textShadow: layer.typography.plateStyle === 'none'
            ? realSourcePresentation
              ? '0 2px 2px rgba(0,0,0,0.82), 0 8px 24px rgba(0,0,0,0.48)'
              : '0 3px 18px rgba(0,0,0,0.48)'
            : 'none',
          overflowWrap: 'normal',
          wordBreak: 'keep-all',
          hyphens: 'none',
        }}
      >
        {isList ? (
          <div style={{ display: 'flex', gap: px(10), alignItems: 'flex-start' }}>
            <span
              style={{
                flex: '0 0 auto', width: px(23), height: px(23), borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                background: layer.typography.accentColor,
                color: '#09111F', fontSize: px(11), fontWeight: 800,
              }}
            >01</span>
            <span>{layer.text}</span>
          </div>
        ) : (
          <>
            {!isAccessible && !isHero ? (
              <span
                style={{
                  display: 'block', width: px(34), height: px(4), borderRadius: 999,
                  marginBottom: px(9), background: layer.typography.accentColor,
                }}
              />
            ) : null}
            {layer.text}
          </>
        )}
      </div>
    </div>
  )
}

const CaptionRealSourceSceneGroupComposition:
React.FC<ApprovedCompositionProps> = (props) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const editorialSplit = props.compositionProfileId ===
    'caption_direction_real_source_multi_output_scene_group_v3'
  if (editorialSplit) {
    const square = width === height
    const panelRight = square ? width * 0.03 : width * 0.035
    const panelTop = height * 0.04
    const panelWidth = square ? width * 0.47 : width * 0.4
    const panelHeight = height * 0.92
    const radius = Math.max(12, Math.round(Math.min(width, height) * 0.045))
    return (
      <AbsoluteFill
        style={{
          background: '#06111C',
          color: '#F8FAFC',
          fontFamily: 'Arial, Helvetica, sans-serif',
          overflow: 'hidden',
        }}
      >
        <OffthreadVideo
          src={props.sourceInternalUrl!}
          startFrom={props.sourceStartFrame ?? 0}
          endAt={props.sourceEndFrameExclusive ?? props.durationFrames}
          style={{
            position: 'absolute',
            inset: '-8%',
            width: '116%',
            height: '116%',
            objectFit: 'cover',
            filter: 'blur(24px) brightness(0.3) saturate(0.72)',
            opacity: 0.72,
          }}
          volume={0}
        />
        <AbsoluteFill
          style={{
            zIndex: 20,
            background: square
              ? 'linear-gradient(90deg, rgba(3,10,20,0.98) 0%, rgba(3,10,20,0.9) 45%, rgba(3,10,20,0.28) 72%, rgba(3,10,20,0.5) 100%)'
              : 'linear-gradient(90deg, rgba(3,10,20,0.99) 0%, rgba(3,10,20,0.94) 45%, rgba(3,10,20,0.3) 68%, rgba(3,10,20,0.54) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            zIndex: 100,
            right: panelRight,
            top: panelTop,
            width: panelWidth,
            height: panelHeight,
            overflow: 'hidden',
            borderRadius: radius,
            background: 'rgba(2, 8, 16, 0.82)',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 18px 55px rgba(0,0,0,0.46)',
          }}
        >
          <OffthreadVideo
            src={props.sourceInternalUrl!}
            startFrom={props.sourceStartFrame ?? 0}
            endAt={props.sourceEndFrameExclusive ?? props.durationFrames}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            volume={1}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            zIndex: 130,
            left: '5%',
            top: '12%',
            width: Math.max(28, Math.round(width * 0.08)),
            height: Math.max(3, Math.round(height * 0.009)),
            borderRadius: 999,
            background: 'linear-gradient(90deg, #6EE7F9, rgba(110,231,249,0.08))',
          }}
        />
        {(props.captionCreativeLayers ?? []).map((layer) => (
          <CaptionCreativeLayerView
            key={layer.layerId}
            layer={layer}
            globalFrame={frame}
            reducedMotion={props.reducedMotion === true}
            realSourcePresentation
          />
        ))}
      </AbsoluteFill>
    )
  }
  return (
    <AbsoluteFill
      style={{
        background: '#090D12',
        color: '#F8FAFC',
        fontFamily: 'Arial, Helvetica, sans-serif',
        overflow: 'hidden',
      }}
    >
      <OffthreadVideo
        src={props.sourceInternalUrl!}
        startFrom={props.sourceStartFrame ?? 0}
        endAt={props.sourceEndFrameExclusive ?? props.durationFrames}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        volume={1}
      />
      <AbsoluteFill
        style={{
          zIndex: 120,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(2,6,12,0) 48%, rgba(2,6,12,0.08) 60%, rgba(2,6,12,0.46) 100%)',
        }}
      />
      {(props.captionCreativeLayers ?? []).map((layer) => (
        <CaptionCreativeLayerView
          key={layer.layerId}
          layer={layer}
          globalFrame={frame}
          reducedMotion={props.reducedMotion === true}
          realSourcePresentation
        />
      ))}
    </AbsoluteFill>
  )
}

const CaptionCreativeSceneGroupComposition:
React.FC<ApprovedCompositionProps> = (props) => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const progress = frame / Math.max(1, durationInFrames - 1)
  const subjectX = interpolate(progress, [0, 1], [width * 0.58, width * 0.6])
  const subjectY = interpolate(progress, [0, 1], [height * 0.1, height * 0.08])
  return (
    <AbsoluteFill
      style={{
        background: '#07111F',
        color: '#F8FAFC',
        fontFamily: 'Arial, Helvetica, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 0,
          background:
            `radial-gradient(circle at ${20 + progress * 12}% 18%, rgba(25,115,144,0.42), transparent 38%), radial-gradient(circle at 78% 80%, rgba(95,63,168,0.25), transparent 38%), linear-gradient(145deg, #07111F 0%, #0B2136 54%, #091421 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0, opacity: 0.2,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          transform: `translateY(${progress * -8}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute', zIndex: 400,
          left: subjectX, top: subjectY,
          width: width * 0.34, height: height * 0.88,
          filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.38))',
        }}
      >
        <div
          style={{
            position: 'absolute', left: '34%', top: '3%', width: '32%',
            aspectRatio: '1', borderRadius: '50%',
            background: 'linear-gradient(145deg, #294B63, #152C40)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute', left: '9%', right: '9%', top: '27%', bottom: '0',
            borderRadius: '48% 48% 18% 18% / 30% 30% 12% 12%',
            background: 'linear-gradient(145deg, #24475F 0%, #10263A 68%, #0A1C2C 100%)',
            border: '1px solid rgba(255,255,255,0.11)',
          }}
        />
        <div
          style={{
            position: 'absolute', left: '21%', right: '21%', top: '42%', height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(110,231,249,0.54), transparent)',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute', zIndex: 420, left: width * 0.64, top: height * 0.19,
          width: width * 0.23, height: height * 0.55,
          borderRadius: '48% 48% 18% 18% / 30% 30% 12% 12%',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }}
      />
      {(props.captionCreativeLayers ?? []).map((layer) => (
        <CaptionCreativeLayerView
          key={layer.layerId}
          layer={layer}
          globalFrame={frame}
          reducedMotion={props.reducedMotion === true}
        />
      ))}
      <div
        style={{
          position: 'absolute', zIndex: 1_100,
          left: 22, right: 22, top: 18, height: 1,
          background: 'linear-gradient(90deg, rgba(110,231,249,0.65), rgba(167,139,250,0.15), transparent)',
        }}
      />
    </AbsoluteFill>
  )
}

const MotionStudioDeterministicRouteDrawComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const frame = useCurrentFrame()
  const { durationInFrames, width, height } = useVideoConfig()
  const revealStart = props.routeRevealStartFrame ?? 18
  const revealEnd = props.routeRevealEndFrame ?? 140
  const rawReveal = interpolate(frame, [revealStart, revealEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const reveal = rawReveal * rawReveal * (3 - 2 * rawReveal)
  const projectProgress = frame / Math.max(1, durationInFrames - 1)
  const cameraScale = interpolate(projectProgress, [0, 1], [1.006, 1.026])
  const cameraX = interpolate(projectProgress, [0, 1], [-4, 2])
  const cameraY = interpolate(projectProgress, [0, 1], [2, -2])
  const waypointFrames = props.waypointFrames ?? [18, 82, 140]
  const routePath = 'M 286 318 C 338 318 386 332 420 352 C 447 380 458 400 490 405 C 535 411 570 394 600 411 C 626 425 642 443 668 432 C 704 449 738 433 760 408 C 778 385 786 367 805 364 C 836 351 858 356 880 370 C 920 392 960 391 1027 380'
  const waypointCoordinates = [
    { x: 286, y: 316 },
    { x: 668, y: 432 },
    { x: 1027, y: 380 },
  ] as const
  const coverColor = props.routeCoverColor ?? '#081426'
  const routeColor = props.routeColor ?? '#FFB23D'
  const glowColor = props.routeGlowColor ?? '#FF7A1A'

  return (
    <AbsoluteFill style={{ backgroundColor: '#081426', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${cameraX}px, ${cameraY}px) scale(${cameraScale})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={props.keyframeInternalUrl!}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `brightness(${0.72 + reveal * 0.22}) saturate(${0.65 + reveal * 0.3})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#030B19',
            opacity: interpolate(reveal, [0, 1], [0.34, 0.06], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        />
        <svg
          viewBox="0 0 1280 720"
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          <defs>
            <filter id="route-cover-soft" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
            <filter id="route-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <path
            d={routePath}
            fill="none"
            stroke={coverColor}
            strokeWidth={28}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.28}
            filter="url(#route-cover-soft)"
          />
          <path
            d={routePath}
            fill="none"
            stroke={coverColor}
            strokeWidth={19}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.96}
          />
          {waypointCoordinates.map((point, index) => (
            <circle
              key={`cover-${index}`}
              cx={point.x}
              cy={point.y}
              r={index === 2 ? 23 : 20}
              fill={coverColor}
              opacity={0.92}
            />
          ))}
          <path
            d={routePath}
            pathLength={1}
            fill="none"
            stroke={glowColor}
            strokeWidth={17}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1}
            strokeDashoffset={1 - reveal}
            opacity={0.48}
            filter="url(#route-glow)"
          />
          <path
            d={routePath}
            pathLength={1}
            fill="none"
            stroke={routeColor}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1}
            strokeDashoffset={1 - reveal}
          />
          {waypointCoordinates.map((point, index) => {
            const markerProgress = interpolate(
              frame,
              [waypointFrames[index]!, waypointFrames[index]! + 10],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            )
            const pulse = index === 2 && frame >= waypointFrames[index]!
              ? 1 + Math.sin((frame - waypointFrames[index]!) * 0.18) * 0.05
              : 1
            return (
              <g
                key={`waypoint-${index}`}
                opacity={markerProgress}
                transform={`translate(${point.x} ${point.y}) scale(${markerProgress * pulse}) translate(${-point.x} ${-point.y})`}
              >
                <circle cx={point.x} cy={point.y} r={index === 2 ? 17 : 14} fill={coverColor} stroke={routeColor} strokeWidth={4} />
                <circle cx={point.x} cy={point.y} r={index === 2 ? 6 : 4} fill="#FFF2C7" />
              </g>
            )
          })}
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 52% 48%, transparent 48%, rgba(1, 8, 20, 0.25) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  )
}

const MotionStudioNativeLayeredComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const frame = useCurrentFrame()
  const { durationInFrames, width, height } = useVideoConfig()
  const progress = durationInFrames <= 1 ? 1 : frame / (durationInFrames - 1)
  const enter = interpolate(frame, [0, Math.min(14, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const headlineEnter = interpolate(frame, [2, Math.min(18, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const captionEnter = interpolate(
    frame,
    [Math.min(8, durationInFrames - 1), Math.min(20, durationInFrames - 1)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  const unit = Math.min(width, height)
  const compact = width < height
  const zIndex = (role: 'background' | 'headline' | 'subject' | 'caption', fallback: number) =>
    props.planes?.find((plane) => plane.role === role)?.zIndex ?? fallback
  const safeX = Math.round(width * ((props.horizontalSafePercent ?? 8) / 100))
  const safeY = Math.round(height * ((props.verticalSafePercent ?? 8) / 100))
  const subjectWidth = compact ? width * 0.9 : width * 0.59
  const subjectHeight = compact ? height * 0.61 : height * 0.88
  const subjectX = interpolate(
    progress,
    [0, 1],
    [compact ? width * 0.04 : width * 0.42, compact ? width * 0.07 : width * 0.38],
  )
  const subjectY = interpolate(
    progress,
    [0, 1],
    [compact ? height * 0.27 : height * 0.08, compact ? height * 0.24 : height * 0.04],
  )
  const accentX = interpolate(progress, [0, 1], [width * 0.67, width * 0.55])

  return (
    <AbsoluteFill
      style={{
        backgroundColor: props.panelBackground,
        color: props.captionColor,
        fontFamily: 'Arial, Helvetica, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: zIndex('background', 0), background: `radial-gradient(circle at ${28 + progress * 18}% 24%, ${props.panelHighlight} 0%, transparent 43%), linear-gradient(142deg, ${props.panelBackground} 0%, ${props.panelHighlight} 100%)` }} />
      <div style={{ position: 'absolute', zIndex: zIndex('background', 0) + 1, left: accentX, top: height * 0.08, width: unit * 0.45, height: unit * 0.45, borderRadius: '50%', border: `${Math.max(2, Math.round(unit * 0.009))}px solid ${props.accentColor}88`, opacity: 0.42, transform: `scale(${0.86 + progress * 0.14})` }} />
      <div style={{ position: 'absolute', zIndex: zIndex('background', 0) + 2, left: safeX, right: safeX, top: safeY, bottom: safeY, border: '1px solid rgba(224,242,254,0.16)', borderRadius: Math.round(unit * 0.035) }} />

      <div style={{ position: 'absolute', zIndex: zIndex('headline', 10), left: safeX, right: compact ? safeX : width * 0.32, top: compact ? height * 0.12 : height * 0.19, opacity: headlineEnter, transform: `translateY(${(1 - headlineEnter) * 24}px)` }}>
        <div style={{ width: Math.round(unit * 0.12), height: Math.max(5, Math.round(unit * 0.014)), borderRadius: 999, backgroundColor: props.accentColor, marginBottom: Math.round(unit * 0.055) }} />
        <div style={{ color: props.headlineColor, fontSize: Math.max(28, Math.round(unit * (compact ? 0.083 : 0.094))), fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.95, maxWidth: compact ? '100%' : '83%' }}>
          {props.headline}
        </div>
        <div style={{ color: 'rgba(224,242,254,0.58)', fontSize: Math.max(9, Math.round(unit * 0.021)), letterSpacing: '0.13em', marginTop: Math.round(unit * 0.04), textTransform: 'uppercase' }}>
          Native planes · exact approved scene
        </div>
      </div>

      <div style={{ position: 'absolute', zIndex: zIndex('subject', 20), left: subjectX, top: subjectY, width: subjectWidth, height: subjectHeight, opacity: enter, transform: `translateY(${(1 - enter) * 20}px) scale(${0.96 + enter * 0.04})`, filter: 'drop-shadow(0 22px 30px rgba(0,0,0,0.36))' }}>
        <Img src={props.subjectInternalUrl!} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto' }} />
      </div>

      <div style={{ position: 'absolute', zIndex: zIndex('caption', 30), left: safeX, right: safeX, bottom: `${props.captionBottomPercent ?? 9}%`, opacity: captionEnter, display: 'flex', justifyContent: compact ? 'center' : 'flex-start' }}>
        <div style={{ maxWidth: compact ? '100%' : '72%', background: 'rgba(2,6,23,0.88)', border: '1px solid rgba(248,250,252,0.18)', borderLeft: `4px solid ${props.accentColor}`, borderRadius: Math.round(unit * 0.025), boxShadow: '0 16px 38px rgba(0,0,0,0.28)', color: props.captionColor, fontSize: Math.max(13, Math.round(unit * 0.03)), fontWeight: 700, lineHeight: 1.3, padding: `${Math.round(unit * 0.032)}px ${Math.round(unit * 0.045)}px` }}>
          {props.caption}
        </div>
      </div>

      <div style={{ position: 'absolute', zIndex: zIndex('caption', 30) + 1, right: safeX, top: safeY, color: 'rgba(248,250,252,0.5)', fontSize: Math.max(8, Math.round(unit * 0.018)), letterSpacing: '0.09em', textTransform: 'uppercase' }}>
        mask verified · {props.layerManifestDigest?.slice(0, 10)}
      </div>
    </AbsoluteFill>
  )
}

const MotionStudioPreparedAnimaticComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const frame = useCurrentFrame()
  const { durationInFrames, width, height } = useVideoConfig()
  const scenes = props.scenes ?? []
  const scene = scenes.find((candidate) => frame >= candidate.startFrame && frame < candidate.endFrame) ?? scenes.at(-1)
  const sceneFrame = scene ? frame - scene.startFrame : 0
  const sceneDuration = scene ? scene.endFrame - scene.startFrame : 1
  const sceneProgress = Math.max(0, Math.min(1, sceneFrame / Math.max(1, sceneDuration - 1)))
  const projectProgress = Math.max(0, Math.min(1, frame / Math.max(1, durationInFrames - 1)))
  const compact = width < height
  const unit = Math.min(width, height)
  const enter = interpolate(
    sceneFrame,
    [0, Math.min(10, Math.max(1, sceneDuration - 1))],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  const exit = interpolate(
    sceneFrame,
    [Math.max(0, sceneDuration - 9), Math.max(1, sceneDuration - 1)],
    [1, 0.72],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  const barCount = compact ? 18 : 28
  const bars = Array.from({ length: barCount }, (_, index) => {
    const wave = 0.28 + Math.abs(Math.sin(index * 1.73 + frame * 0.075)) * 0.72
    return {
      index,
      height: Math.round((12 + wave * unit * 0.075) * (index / barCount <= projectProgress ? 1 : 0.45)),
    }
  })

  return (
    <AbsoluteFill style={{ backgroundColor: props.panelBackground, color: '#F8FAFC', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      {props.narrationInternalUrl ? <Audio src={props.narrationInternalUrl} volume={1} /> : null}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${20 + sceneProgress * 56}% 26%, ${props.accentColor}46 0%, transparent 37%), linear-gradient(145deg, #0B0C10 0%, #171920 55%, #0D0F14 100%)` }} />
      <div style={{ position: 'absolute', inset: Math.round(unit * 0.045), border: '1px solid rgba(255,255,255,0.12)', borderRadius: Math.round(unit * 0.035) }} />
      <div style={{ position: 'absolute', left: Math.round(unit * 0.08), right: Math.round(unit * 0.08), top: Math.round(unit * 0.075), display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#A7AAB3', fontSize: Math.max(10, Math.round(unit * 0.024)), letterSpacing: '0.11em', textTransform: 'uppercase' }}>
        <span>Motion Studio · Animatic</span>
        <span style={{ color: '#F4B740' }}>Timing review · Placeholder</span>
      </div>
      <div style={{ position: 'absolute', left: Math.round(unit * 0.08), right: Math.round(unit * 0.08), top: compact ? Math.round(height * 0.23) : Math.round(height * 0.25), opacity: enter * exit, transform: `translateY(${(1 - enter) * 24}px)` }}>
        <div style={{ color: '#A7AAB3', fontSize: Math.max(11, Math.round(unit * 0.025)), letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: Math.round(unit * 0.035) }}>
          Scene {(scene?.order ?? 0) + 1} of {Math.max(1, scenes.length)} · {scene?.startFrame ?? 0}–{scene?.endFrame ?? durationInFrames}f
        </div>
        <div style={{ maxWidth: compact ? '100%' : '74%', fontSize: Math.max(28, Math.round(unit * (compact ? 0.074 : 0.082))), lineHeight: 1.02, fontWeight: 760, letterSpacing: '-0.045em' }}>
          {scene?.title ?? 'Prepared animatic'}
        </div>
        <div style={{ maxWidth: compact ? '100%' : '72%', marginTop: Math.round(unit * 0.045), color: '#C9CBD2', fontSize: Math.max(14, Math.round(unit * 0.032)), lineHeight: 1.4 }}>
          {scene?.visualDescription ?? 'Approved narration timing with deterministic review panels.'}
        </div>
      </div>
      <div style={{ position: 'absolute', left: Math.round(unit * 0.08), right: Math.round(unit * 0.08), bottom: Math.round(unit * 0.085) }}>
        <div style={{ height: Math.round(unit * 0.13), display: 'flex', gap: Math.max(3, Math.round(unit * 0.008)), alignItems: 'center', opacity: 0.92 }}>
          {bars.map((bar) => <div key={bar.index} style={{ flex: 1, height: bar.height, minHeight: 4, borderRadius: 999, backgroundColor: bar.index / bars.length <= projectProgress ? props.accentColor : 'rgba(255,255,255,0.17)' }} />)}
        </div>
        <div style={{ height: Math.max(3, Math.round(unit * 0.008)), borderRadius: 999, background: 'rgba(255,255,255,0.13)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.max(1.5, projectProgress * 100)}%`, background: props.accentColor }} />
        </div>
        <div style={{ marginTop: Math.round(unit * 0.022), display: 'flex', justifyContent: 'space-between', color: '#8A8D97', fontSize: Math.max(10, Math.round(unit * 0.022)) }}>
          <span>{scene?.sceneId ?? 'prepared-animatic'}</span><span>{frame + 1}/{durationInFrames} frames</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const MotionStudioScenePreviewComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const frame = useCurrentFrame()
  const { durationInFrames, fps, width, height } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 130, mass: 0.9 } })
  const progress = durationInFrames <= 1 ? 1 : frame / (durationInFrames - 1)
  const layerLabel = (props.layerType ?? 'image').replaceAll('_', ' ')
  const routeLabel = (props.productionMode ?? 'hybrid_directed').replaceAll('_', ' ')
  const compact = width < height
  const unit = Math.min(width, height)

  return (
    <AbsoluteFill style={{ backgroundColor: props.panelBackground, color: '#F7F7F8', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${22 + progress * 34}% 28%, ${props.accentColor}38 0, transparent 38%), linear-gradient(145deg, #111216 0%, #181A20 62%, #0D0E12 100%)` }} />
      <div style={{ position: 'absolute', inset: Math.round(unit * 0.055), border: '1px solid rgba(255,255,255,0.11)', borderRadius: Math.round(unit * 0.035) }} />
      <div style={{ position: 'absolute', left: Math.round(unit * 0.09), right: Math.round(unit * 0.09), top: Math.round(unit * 0.095), display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: Math.max(11, Math.round(unit * 0.026)), letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A9ABB3' }}>
        <span>Motion Studio · private preview</span>
        <span>{props.sceneStartFrame}–{props.sceneEndFrame}f</span>
      </div>
      <div style={{ position: 'absolute', left: Math.round(unit * 0.09), right: Math.round(unit * 0.09), top: compact ? Math.round(height * 0.25) : Math.round(height * 0.28), opacity: enter, transform: `translateY(${(1 - enter) * 28}px)` }}>
        <div style={{ width: Math.round(unit * 0.12), height: Math.max(4, Math.round(unit * 0.012)), borderRadius: 999, backgroundColor: props.accentColor, marginBottom: Math.round(unit * 0.055) }} />
        <div style={{ maxWidth: compact ? '100%' : '78%', fontSize: Math.max(25, Math.round(unit * (compact ? 0.068 : 0.075))), lineHeight: 1.08, fontWeight: 720, letterSpacing: '-0.035em' }}>
          {props.semanticPurpose}
        </div>
        <div style={{ marginTop: Math.round(unit * 0.07), display: 'flex', gap: Math.round(unit * 0.025), flexWrap: 'wrap' }}>
          {[routeLabel, layerLabel].map((label) => <span key={label} style={{ padding: `${Math.round(unit * 0.018)}px ${Math.round(unit * 0.034)}px`, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.13)', fontSize: Math.max(12, Math.round(unit * 0.029)), textTransform: 'capitalize', color: '#D8D9DE' }}>{label}</span>)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: Math.round(unit * 0.09), right: Math.round(unit * 0.09), bottom: Math.round(unit * 0.09) }}>
        <div style={{ height: Math.max(3, Math.round(unit * 0.008)), borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.max(2, progress * 100)}%`, background: props.accentColor }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: Math.round(unit * 0.026), color: '#858891', fontSize: Math.max(10, Math.round(unit * 0.023)) }}>
          <span>{props.sceneId}</span><span>{frame + 1}/{durationInFrames}</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const ApprovedDeliveryH264ChunkComposition:
React.FC<ApprovedCompositionProps> = (props) => (
  <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
    <Html5Video
      src={props.sourceInternalUrl!}
      startFrom={0}
      endAt={props.durationFrames}
      style={{ width: '100%', height: '100%', objectFit: 'fill' }}
      volume={0}
      delayRenderTimeoutInMilliseconds={180_000}
      delayRenderRetries={1}
    />
  </AbsoluteFill>
)

const ApprovedChunkMergeComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const urlByOutputKey = new Map(
    props.chunkInternalUrls!.map((chunk) => [chunk.outputKey, chunk.chunkInternalUrl]),
  )
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      {props.chunkSegments!.map((chunk) => (
        <Sequence
          key={chunk.outputKey}
          from={chunk.globalStartFrame}
          durationInFrames={chunk.durationFrames}
          name={`Approved composition chunk ${chunk.chunkIndex}`}
        >
          <Html5Video
            src={urlByOutputKey.get(chunk.outputKey)!}
            startFrom={0}
            endAt={chunk.durationFrames}
            style={{ width: '100%', height: '100%', objectFit: 'fill' }}
            volume={1}
            delayRenderTimeoutInMilliseconds={180_000}
            delayRenderRetries={1}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

const TechnicalQaPreviewLabel: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 12,
      left: '50%',
      zIndex: 1_000,
      maxWidth: 'calc(100% - 24px)',
      transform: 'translateX(-50%)',
      border: '1px solid rgba(251, 191, 36, 0.9)',
      borderRadius: 999,
      background: 'rgba(17, 24, 39, 0.92)',
      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.36)',
      color: '#FDE68A',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.08em',
      lineHeight: 1,
      overflow: 'hidden',
      padding: '7px 11px',
      pointerEvents: 'none',
      textOverflow: 'ellipsis',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}
  >
    Technical QA preview · not final Caption design
  </div>
)

const ApprovedSourceCaptionComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const replaceVoice = props.audioPolicy === 'replace_with_approved_voice_tracks'
  const broll = props.brollPreviewLayer
  const technicalQaPreview = props.sourceMediaPolicy ===
    'approved_b_roll_qa_normalized_preview_proxy_v1'
  const sourceStyle: React.CSSProperties = broll
    ? {
        position: 'absolute',
        left: `${broll.xPercent}%`,
        top: `${broll.yPercent}%`,
        width: `${broll.widthPercent}%`,
        height: `${broll.heightPercent}%`,
        objectFit: broll.crop,
        transform: `scale(${broll.scale})`,
        transformOrigin: 'center center',
        opacity: broll.opacity,
        zIndex: broll.layerOrder,
      }
    : { width: '100%', height: '100%', objectFit: 'contain' }
  return (
    <AbsoluteFill style={{ backgroundColor: props.panelBackground, overflow: 'hidden' }}>
      <OffthreadVideo
        src={props.sourceInternalUrl!}
        startFrom={props.sourceStartFrame!}
        endAt={props.sourceEndFrameExclusive!}
        style={sourceStyle}
        volume={replaceVoice ? 0 : 1}
      />
      {replaceVoice && (
        <Audio
          src={props.voiceTrackInternalUrls![0]!.voiceTrackInternalUrl}
          startFrom={props.voiceTrackInternalUrls![0]!.sourceStartFrame}
          endAt={props.voiceTrackInternalUrls![0]!.sourceEndFrameExclusive}
        />
      )}
      <ApprovedSupplementalAudioTracks {...props} />
      <ApprovedLivingFrameOverlays {...props} />
      <ApprovedControlledVisualOverlays {...props} />
      <ApprovedCaptionOverlays {...props} />
      {technicalQaPreview && <TechnicalQaPreviewLabel />}
    </AbsoluteFill>
  )
}

type ApprovedSourceSequenceSegment =
  NonNullable<ApprovedCompositionProps['sourceSegments']>[number]

const ApprovedSourceSequenceVisual: React.FC<{
  props: ApprovedCompositionProps
  segment: ApprovedSourceSequenceSegment
  segmentIndex: number
  sourceInternalUrl: string
  replaceVoice: boolean
}> = ({ props, segment, segmentIndex, sourceInternalUrl, replaceVoice }) => {
  const localFrame = useCurrentFrame()
  const globalFrame = segment.timelineStartFrame + localFrame
  const transitions = props.transitionPolicy ===
    'approved_bounded_source_transitions_v1'
    ? props.sourceTransitions ?? []
    : []
  const incoming = transitions[segmentIndex - 1]
  const outgoing = transitions[segmentIndex]
  const incomingOpacity = incoming?.transitionType === 'smooth_panel_dip'
    ? interpolate(
        globalFrame,
        [incoming.boundaryFrame, incoming.endFrameExclusive],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
    : 1
  const outgoingOpacity = outgoing?.transitionType === 'smooth_panel_dip'
    ? interpolate(
        globalFrame,
        [outgoing.startFrame, outgoing.boundaryFrame],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
    : 1
  const opacity = Math.min(incomingOpacity, outgoingOpacity)
  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  }
  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <OffthreadVideo
        src={sourceInternalUrl}
        startFrom={segment.sourceStartFrame}
        endAt={segment.sourceEndFrameExclusive}
        style={videoStyle}
        volume={replaceVoice ? 0 : 1}
      />
    </div>
  )
}

const ApprovedSourceSequenceCaptionComposition: React.FC<ApprovedCompositionProps> = (props) => {
  const sourceUrlById = new Map(
    props.sourceInternalUrls!.map((source) => [source.sourceSequenceItemId, source.sourceInternalUrl]),
  )
  const voiceTrackBySourceId = new Map(
    (props.voiceTrackInternalUrls ?? []).map((track) => [
      track.sourceSequenceItemId,
      track,
    ]),
  )
  const replaceVoice = props.audioPolicy === 'replace_with_approved_voice_tracks'
  return (
    <AbsoluteFill style={{ backgroundColor: props.panelBackground, overflow: 'hidden' }}>
      {props.sourceSegments!.map((segment, segmentIndex) => (
        <Sequence
          key={segment.sourceSequenceItemId}
          from={segment.timelineStartFrame}
          durationInFrames={segment.timelineEndFrameExclusive - segment.timelineStartFrame}
          name={`Approved source ${segment.sourceSequenceItemId}`}
        >
          <ApprovedSourceSequenceVisual
            props={props}
            segment={segment}
            segmentIndex={segmentIndex}
            sourceInternalUrl={sourceUrlById.get(segment.sourceSequenceItemId)!}
            replaceVoice={replaceVoice}
          />
          {replaceVoice && (() => {
            const voiceTrack = voiceTrackBySourceId.get(segment.sourceSequenceItemId)!
            return (
              <Audio
                src={voiceTrack.voiceTrackInternalUrl}
                startFrom={voiceTrack.sourceStartFrame}
                endAt={voiceTrack.sourceEndFrameExclusive}
              />
            )
          })()}
        </Sequence>
      ))}
      <ApprovedSupplementalAudioTracks {...props} />
      <ApprovedLivingFrameOverlays {...props} />
      <ApprovedControlledVisualOverlays {...props} />
      <ApprovedCaptionOverlays {...props} />
    </AbsoluteFill>
  )
}

const ApprovedSupplementalAudioTracks: React.FC<ApprovedCompositionProps> = (props) => (
  <>
    {(props.supplementalAudioTracks ?? []).map((track) => (
      <Sequence
        key={track.outputKey}
        from={track.startFrame}
        durationInFrames={track.endFrameExclusive - track.startFrame}
        name={`Approved ${track.markerType} ${track.markerId}`}
      >
        <Audio
          src={track.supplementalAudioInternalUrl}
          loop={track.fillPolicy === 'loop_or_trim_to_window'}
          volume={track.markerType === 'music' ? 0.18 : 0.42}
        />
      </Sequence>
    ))}
  </>
)

const captionOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 900,
  width: '100%',
  height: '100%',
  objectFit: 'fill',
}

const ApprovedLivingFrameOverlays: React.FC<ApprovedCompositionProps> = (props) => (
  <>
    {(props.livingFrameOverlays ?? []).map((overlay) => (
      <Sequence
        key={overlay.layerId}
        from={overlay.startFrame}
        durationInFrames={overlay.endFrameExclusive - overlay.startFrame}
        name={`Approved Living Frame ${overlay.sceneId} ${overlay.layerId}`}
      >
        <Img
          src={overlay.livingFrameOverlayInternalUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: overlay.fit,
            opacity: overlay.opacity,
          }}
        />
      </Sequence>
    ))}
  </>
)

const ApprovedControlledVisualOverlays: React.FC<ApprovedCompositionProps> = (props) => (
  <>
    {(props.controlledVisualOverlays ?? []).map((overlay) => (
      <Sequence
        key={overlay.rendererLayerId}
        from={overlay.startFrame}
        durationInFrames={overlay.endFrameExclusive - overlay.startFrame}
        name={`Approved ${overlay.toolId} visual ${overlay.rendererLayerId}`}
      >
        <div
          style={{
            position: 'absolute',
            left: overlay.x,
            top: overlay.y,
            width: overlay.width,
            height: overlay.height,
            opacity: overlay.opacity,
            overflow: 'hidden',
          }}
        >
          <Img
            src={overlay.controlledVisualOverlayInternalUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: overlay.fit,
            }}
          />
        </div>
      </Sequence>
    ))}
  </>
)

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

function hasApprovedLivingFrameInput(props: ApprovedCompositionProps): boolean {
  const overlays = props.livingFrameOverlays
  if (overlays === undefined) {
    return props.livingFrameOverlayPolicy === undefined
  }
  if (
    props.livingFrameOverlayPolicy !==
      'approved_rgba_over_source_below_captions_v1' ||
    overlays.length < 1 ||
    overlays.length > 16
  ) return false
  const sceneIds = new Set<string>()
  const layerIds = new Set<string>()
  const manifestOutputKeys = new Set<string>()
  const componentOutputKeys = new Set<string>()
  let previousStartFrame = -1
  let previousLayerId = ''
  return overlays.every((overlay) => {
    const valid =
      overlay.startFrame >= 0 &&
      overlay.endFrameExclusive > overlay.startFrame &&
      overlay.endFrameExclusive <= props.durationFrames &&
      overlay.startFrame >= previousStartFrame &&
      (
        overlay.startFrame !== previousStartFrame ||
        overlay.layerId.localeCompare(previousLayerId) > 0
      ) &&
      overlay.fit === 'fill' &&
      overlay.opacity === 1 &&
      /^http:\/\/127\.0\.0\.1:\d+\/living-frame\/\d+\.png$/.test(
        overlay.livingFrameOverlayInternalUrl,
      ) &&
      !sceneIds.has(overlay.sceneId) &&
      !layerIds.has(overlay.layerId) &&
      !manifestOutputKeys.has(overlay.manifestOutputKey) &&
      !componentOutputKeys.has(overlay.componentOutputKey)
    previousStartFrame = overlay.startFrame
    previousLayerId = overlay.layerId
    sceneIds.add(overlay.sceneId)
    layerIds.add(overlay.layerId)
    manifestOutputKeys.add(overlay.manifestOutputKey)
    componentOutputKeys.add(overlay.componentOutputKey)
    return valid
  })
}

function hasApprovedControlledVisualInput(
  props: ApprovedCompositionProps,
): boolean {
  const overlays = props.controlledVisualOverlays
  if (overlays === undefined) {
    return props.controlledVisualOverlayPolicy === undefined
  }
  if (
    props.controlledVisualOverlayPolicy !==
      'approved_structured_svg_below_captions_v1' ||
    overlays.length < 1 ||
    overlays.length > 4
  ) return false
  const outputKeys = new Set<string>()
  const rendererLayerIds = new Set<string>()
  let previousStartFrame = -1
  let previousRendererLayerId = ''
  return overlays.every((overlay) => {
    const expectedSafeWording = overlay.sourceConfidence === 'verified'
      ? 'verified data'
      : overlay.sourceConfidence === 'mock'
        ? 'mock demo data'
        : 'fictional story data'
    const valid =
      ['d3', 'echarts'].includes(overlay.toolId) &&
      ['verified', 'mock', 'fictional'].includes(overlay.sourceConfidence) &&
      overlay.safeWording === expectedSafeWording &&
      overlay.startFrame >= 0 &&
      overlay.endFrameExclusive > overlay.startFrame &&
      overlay.endFrameExclusive <= props.durationFrames &&
      overlay.startFrame >= previousStartFrame &&
      (
        overlay.startFrame !== previousStartFrame ||
        overlay.rendererLayerId.localeCompare(previousRendererLayerId) > 0
      ) &&
      overlay.x >= 0 &&
      overlay.y >= 0 &&
      overlay.width > 0 &&
      overlay.height > 0 &&
      overlay.x + overlay.width <= props.width &&
      overlay.y + overlay.height <= props.height &&
      overlay.fit === 'contain' &&
      overlay.opacity === 1 &&
      /^http:\/\/127\.0\.0\.1:\d+\/controlled-visual\/\d+\.svg$/.test(
        overlay.controlledVisualOverlayInternalUrl,
      ) &&
      !outputKeys.has(overlay.outputKey) &&
      !rendererLayerIds.has(overlay.rendererLayerId)
    previousStartFrame = overlay.startFrame
    previousRendererLayerId = overlay.rendererLayerId
    outputKeys.add(overlay.outputKey)
    rendererLayerIds.add(overlay.rendererLayerId)
    return valid
  })
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
  const expectedDurationBySourceId = new Map(
    props.sourceSegments
      ? props.sourceSegments.map((segment) => [
          segment.sourceSequenceItemId,
          segment.timelineEndFrameExclusive - segment.timelineStartFrame,
        ] as const)
      : [[props.voiceTrackInternalUrls[0]!.sourceSequenceItemId, props.durationFrames] as const],
  )
  if (!props.voiceTrackInternalUrls.every((track) => {
    const sourceSliceProvided =
      track.sourceStartFrame !== undefined ||
      track.sourceEndFrameExclusive !== undefined
    const expectedDuration = expectedDurationBySourceId.get(track.sourceSequenceItemId)
    return (
      Number.isSafeInteger(track.durationFrames) &&
      track.durationFrames > 0 &&
      expectedDuration !== undefined &&
      (
        sourceSliceProvided
          ? (
              Number.isSafeInteger(track.sourceStartFrame) &&
              Number.isSafeInteger(track.sourceEndFrameExclusive) &&
              track.sourceStartFrame! >= 0 &&
              track.sourceEndFrameExclusive! > track.sourceStartFrame! &&
              track.sourceEndFrameExclusive! <= track.durationFrames &&
              track.sourceEndFrameExclusive! - track.sourceStartFrame! ===
                expectedDuration
            )
          : track.durationFrames === expectedDuration
      )
    )
  })) return false
  if (!props.sourceSegments) return sourceCount === 1
  return props.sourceSegments.every((segment) => sourceIds.has(segment.sourceSequenceItemId))
}

function hasApprovedSupplementalAudioInput(
  props: ApprovedCompositionProps,
): boolean {
  const tracks = props.supplementalAudioTracks
  if (tracks === undefined) return true
  if (tracks.length < 1 || tracks.length > 16) return false
  const outputKeys = new Set<string>()
  const attachmentIds = new Set<string>()
  const markerIds = new Set<string>()
  let previousStartFrame = -1
  return tracks.every((track, index) => {
    const policyMatches = track.markerType === 'music'
      ? (
          track.fillPolicy === 'loop_or_trim_to_window' &&
          track.mixProfileId === 'speech_safe_uploaded_music_bed_v1'
        )
      : (
          track.markerType === 'sfx' &&
          track.fillPolicy === 'trim_without_loop' &&
          track.mixProfileId === 'narration_protected_uploaded_sfx_v1'
        )
    const valid =
      index < 16 &&
      track.startFrame >= 0 &&
      track.endFrameExclusive > track.startFrame &&
      track.endFrameExclusive <= props.durationFrames &&
      track.startFrame >= previousStartFrame &&
      /^http:\/\/127\.0\.0\.1:\d+\/supplemental\/\d+\.wav$/.test(
        track.supplementalAudioInternalUrl,
      ) &&
      !outputKeys.has(track.outputKey) &&
      !attachmentIds.has(track.attachmentId) &&
      !markerIds.has(track.markerId) &&
      policyMatches
    previousStartFrame = track.startFrame
    outputKeys.add(track.outputKey)
    attachmentIds.add(track.attachmentId)
    markerIds.add(track.markerId)
    return valid
  })
}

function hasApprovedSourceTransitionInput(
  props: ApprovedCompositionProps,
): boolean {
  if (props.transitionPolicy === 'approved_hard_cuts_only') {
    return hasApprovedHardCutInput(props)
  }
  if (
    props.transitionPolicy !== 'approved_bounded_source_transitions_v1' ||
    !props.sourceSegments || !props.sourceTransitions ||
    props.sourceTransitions.length !== props.sourceSegments.length - 1
  ) return false
  const timingIds = new Set<string>()
  const refinedIds = new Set<string>()
  let previousEndFrameExclusive = 0
  let panelDipCount = 0
  const valid = props.sourceTransitions.every((transition, index) => {
    const fromSource = props.sourceSegments![index]
    const toSource = props.sourceSegments![index + 1]
    const expectedPanelDurationFrames = Math.round(props.fps * 0.4)
    const expectedPanelStartFrame =
      transition.boundaryFrame - Math.floor(expectedPanelDurationFrames / 2)
    const hardCutValid =
      transition.transitionType === 'hard_cut' &&
      transition.startFrame === transition.boundaryFrame &&
      transition.endFrameExclusive === transition.boundaryFrame &&
      transition.durationFrames === 0 &&
      transition.visualCurve === 'none'
    const panelDipValid =
      transition.transitionType === 'smooth_panel_dip' &&
      transition.startFrame === expectedPanelStartFrame &&
      transition.endFrameExclusive === expectedPanelStartFrame +
        expectedPanelDurationFrames &&
      transition.durationFrames === expectedPanelDurationFrames &&
      transition.visualCurve === 'linear_dip_to_panel' &&
      transition.startFrame >= (fromSource?.timelineStartFrame ?? -1) &&
      transition.endFrameExclusive <=
        (toSource?.timelineEndFrameExclusive ?? -1)
    const transitionValid = Boolean(
      fromSource && toSource &&
      !timingIds.has(transition.transitionTimingItemId) &&
      !refinedIds.has(transition.refinedTransitionTimingItemId) &&
      transition.fromSourceSequenceItemId === fromSource.sourceSequenceItemId &&
      transition.toSourceSequenceItemId === toSource.sourceSequenceItemId &&
      transition.boundaryFrame === fromSource.timelineEndFrameExclusive &&
      transition.boundaryFrame === toSource.timelineStartFrame &&
      transition.audioPolicy === 'hard_cut_at_boundary' &&
      (hardCutValid || panelDipValid) &&
      transition.startFrame >= previousEndFrameExclusive
    )
    timingIds.add(transition.transitionTimingItemId)
    refinedIds.add(transition.refinedTransitionTimingItemId)
    previousEndFrameExclusive = transition.endFrameExclusive
    if (transition.transitionType === 'smooth_panel_dip') panelDipCount += 1
    return transitionValid
  })
  return valid && panelDipCount > 0
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

function hasApprovedChunkMergeInput(props: ApprovedCompositionProps): boolean {
  if (
    !props.chunkSegments || !props.chunkInternalUrls ||
    props.chunkSegments.length < 2 ||
    props.chunkSegments.length !== props.chunkInternalUrls.length
  ) return false
  const urls = new Map(
    props.chunkInternalUrls.map((chunk) => [chunk.outputKey, chunk]),
  )
  let expectedStart = 0
  for (const [index, chunk] of props.chunkSegments.entries()) {
    const url = urls.get(chunk.outputKey)
    if (
      !url || chunk.chunkIndex !== index + 1 || url.chunkIndex !== chunk.chunkIndex ||
      chunk.globalStartFrame !== expectedStart ||
      chunk.globalEndFrameExclusive <= chunk.globalStartFrame ||
      chunk.durationFrames !== chunk.globalEndFrameExclusive - chunk.globalStartFrame
    ) return false
    expectedStart = chunk.globalEndFrameExclusive
  }
  return expectedStart === props.durationFrames && urls.size === props.chunkSegments.length
}
