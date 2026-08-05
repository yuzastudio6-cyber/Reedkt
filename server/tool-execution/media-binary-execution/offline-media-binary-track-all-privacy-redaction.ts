import {
  OFFLINE_TRACK_ALL_PRIVACY_REDACTION_PROFILE,
  validateOfflineFfmpegPlanningPayload,
  type OfflineFfmpegTrackAllPrivacyRedactionPlanningPayload,
} from './offline-media-binary-protocol'

/**
 * Compiles only the fixed Track All privacy recipe. The caller supplies bounded
 * numeric mask regions; it cannot supply a filter, executable, path, URL, codec,
 * color, retry policy, or output destination.
 */
export function compileOfflineTrackAllPrivacyRedactionFfmpegCommand(
  value: OfflineFfmpegTrackAllPrivacyRedactionPlanningPayload,
): string[] {
  const payload = validateOfflineFfmpegPlanningPayload({
    recipeProfileId: value.recipeProfileId,
    timestampPolicy: value.timestampPolicy,
    overwriteExistingArtifact: value.overwriteExistingArtifact,
    allowUnreviewedCodec: value.allowUnreviewedCodec,
    trimStartFrame: value.trimStartFrame,
    trimEndFrameExclusive: value.trimEndFrameExclusive,
    frameRate: value.frameRate,
    treatment: value.treatment,
    sourceWidth: value.sourceWidth,
    sourceHeight: value.sourceHeight,
    maskRegions: value.maskRegions,
    uncertaintyPolicy: value.uncertaintyPolicy,
    privacyFailClosed: value.privacyFailClosed,
    flattenedPrivatePreview: value.flattenedPrivatePreview,
    outputContainer: value.outputContainer,
    outputCodec: value.outputCodec,
    constantQuality: value.constantQuality,
    outputPixelFormat: value.outputPixelFormat,
    preserveAudio: value.preserveAudio,
    metadataPolicy: value.metadataPolicy,
    publicArtifact: value.publicArtifact,
  })
  if (payload.recipeProfileId !== OFFLINE_TRACK_ALL_PRIVACY_REDACTION_PROFILE) {
    throw new Error('Track All privacy command compilation requires its exact approved recipe.')
  }
  const durationFrames = payload.trimEndFrameExclusive - payload.trimStartFrame
  const durationSeconds = durationFrames / payload.frameRate
  const base = [
    `fps=fps=${payload.frameRate}:round=near`,
    `select='gte(n,${payload.trimStartFrame})*lt(n,${payload.trimEndFrameExclusive})'`,
    `setpts=N/(${payload.frameRate}*TB)`,
    'format=yuv420p',
    'split=2[privacy_base][privacy_effect_source]',
  ].join(',')
  const effect = privacyEffectFilter(payload)
  const mask = privacyMaskFilter(payload, durationFrames, durationSeconds)
  const filterComplex = [
    `[0:v]${base}`,
    `[privacy_effect_source]${effect}[privacy_effect]`,
    mask,
    '[privacy_base][privacy_effect][privacy_mask]maskedmerge,' +
      'format=yuv420p,' +
      'setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709' +
      '[privacy_output]',
  ].join(';')
  return [
    '-hide_banner',
    '-loglevel',
    'error',
    '-nostdin',
    '-i',
    'pipe:0',
    '-filter_complex',
    filterComplex,
    '-map',
    '[privacy_output]',
    '-an',
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    '0',
    '-crf',
    '12',
    '-deadline',
    'good',
    '-cpu-used',
    '4',
    '-row-mt',
    '1',
    '-threads',
    '2',
    '-tile-columns',
    '0',
    '-frame-parallel',
    '0',
    '-g',
    '240',
    '-lag-in-frames',
    '0',
    '-auto-alt-ref',
    '0',
    '-pix_fmt',
    'yuv420p',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-colorspace',
    'bt709',
    '-color_range',
    'tv',
    '-fflags',
    '+bitexact',
    '-flags:v',
    '+bitexact',
    '-map_metadata',
    '-1',
    '-metadata',
    'creation_time=1970-01-01T00:00:00Z',
    '-f',
    'matroska',
    'pipe:1',
  ]
}

function privacyEffectFilter(
  payload: OfflineFfmpegTrackAllPrivacyRedactionPlanningPayload,
): string {
  switch (payload.treatment) {
    case 'gaussian_blur':
      return 'gblur=sigma=18:steps=3,format=yuv420p'
    case 'pixelate': {
      const width = evenDimension(Math.max(2, Math.floor(payload.sourceWidth / 12)))
      const height = evenDimension(Math.max(2, Math.floor(payload.sourceHeight / 12)))
      return (
        `scale=${width}:${height}:flags=neighbor,` +
        `scale=${payload.sourceWidth}:${payload.sourceHeight}:flags=neighbor,format=yuv420p`
      )
    }
    case 'mosaic': {
      const width = evenDimension(Math.max(2, Math.floor(payload.sourceWidth / 24)))
      const height = evenDimension(Math.max(2, Math.floor(payload.sourceHeight / 24)))
      return (
        `scale=${width}:${height}:flags=neighbor,` +
        `scale=${payload.sourceWidth}:${payload.sourceHeight}:flags=neighbor,format=yuv420p`
      )
    }
    case 'solid_fill':
      return 'drawbox=x=0:y=0:w=iw:h=ih:color=black@1:t=fill,format=yuv420p'
  }
}

function privacyMaskFilter(
  payload: OfflineFfmpegTrackAllPrivacyRedactionPlanningPayload,
  durationFrames: number,
  durationSeconds: number,
): string {
  const duration = durationSeconds.toFixed(9).replace(/0+$/u, '').replace(/\.$/u, '')
  const filters = payload.maskRegions.map((region) => {
    const start = region.startFrameInclusive - payload.trimStartFrame
    const endInclusive = region.endFrameExclusive - payload.trimStartFrame - 1
    return (
      `drawbox=x=${region.x}:y=${region.y}:w=${region.width}:h=${region.height}:` +
      `color=white@1:t=fill:enable='between(n,${start},${endInclusive})'`
    )
  })
  return (
    `color=c=black:s=${payload.sourceWidth}x${payload.sourceHeight}:` +
    `r=${payload.frameRate}:d=${duration},trim=end_frame=${durationFrames},` +
    `setpts=N/(${payload.frameRate}*TB),${filters.join(',')},` +
    'format=gray,setparams=range=tv,scale=in_range=tv:out_range=pc[privacy_mask]'
  )
}

function evenDimension(value: number): number {
  return value % 2 === 0 ? value : Math.max(2, value - 1)
}
