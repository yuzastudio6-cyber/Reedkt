const activityLabels: Record<string, string> = {
  animejs: 'motion timing',
  audioread: 'audio file reading',
  audioflux: 'audio rhythm analysis',
  babylonjs: '3D scene rendering',
  birefnet: 'subject cutout',
  d3: 'data graphic rendering',
  deck_gl: 'map rendering',
  deepfilternet: 'voice cleanup',
  echarts: 'data graphic rendering',
  ebu_r128_pyloudnorm: 'broadcast loudness check',
  faster_whisper: 'speech transcription',
  ffmpeg: 'media assembly',
  ffprobe: 'media inspection',
  gpac_mp4box_packaging_validation: 'delivery packaging check',
  gstreamer: 'stream pipeline check',
  hyperframe: 'frame metadata support',
  kornia: 'image analysis',
  konva: 'canvas composition',
  libass: 'caption rendering',
  librosa: 'audio analysis',
  lottie_web: 'motion graphic playback',
  lottie: 'motion graphic playback',
  maplibre: 'map rendering',
  mido: 'MIDI timing',
  mir_eval: 'audio QA',
  mkvtoolnix_container_validation: 'container packaging check',
  music21: 'music structure analysis',
  noisereduce: 'noise cleanup',
  opencv: 'visual analysis',
  opencolorio: 'color management',
  openimageio: 'image inspection',
  pedalboard: 'audio effects',
  pixi_js: 'canvas rendering',
  pixijs: 'canvas rendering',
  pretty_midi: 'MIDI arrangement',
  pyscenedetect: 'scene detection',
  pydub: 'audio editing',
  pydub_effects: 'audio effects',
  real_esrgan: 'image upscaling',
  rembg: 'background removal',
  remotion: 'composition renderer',
  resampy: 'audio resampling',
  rnnoise: 'noise cleanup',
  satori: 'graphic layout rendering',
  scipy: 'signal analysis',
  streamer_render_pipeline_support: 'stream render check',
  svg_js: 'vector graphic rendering',
  three: '3D scene rendering',
  three_js: '3D scene rendering',
  babylon_js: '3D scene rendering',
  torch_torchvision: 'vision model support',
  transformers: 'model inference support',
  turf: 'route and geometry planning',
  vega: 'data graphic rendering',
  vega_lite: 'data graphic rendering',
  viz_js: 'diagram rendering',
  whisper_cpp: 'speech transcription',
}

export function userFacingActivityLabel(value: string | undefined): string {
  if (!value) return 'editing activity'
  const normalized = value.trim().toLowerCase()
  if (activityLabels[normalized]) return activityLabels[normalized]
  if (normalized.includes('audio')) return 'audio processing'
  if (normalized.includes('color') || normalized.includes('image')) return 'visual polish'
  if (normalized.includes('map') || normalized.includes('route')) return 'map/location rendering'
  if (normalized.includes('chart') || normalized.includes('data') || normalized.includes('diagram')) return 'data graphic rendering'
  if (normalized.includes('render') || normalized.includes('composition')) return 'composition rendering'
  if (normalized.includes('caption')) return 'caption preparation'
  if (normalized.includes('qa') || normalized.includes('review')) return 'quality review'
  return 'editing activity'
}

export function userFacingActivityList(values: Array<string | undefined>, fallback = 'editing activity'): string {
  const labels = [...new Set(values.map(userFacingActivityLabel).filter(Boolean))]
  return labels.length ? labels.join(', ') : fallback
}

export function userFacingActivityCount(count: number, singular = 'activity', plural = 'activities'): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function hideInternalToolNamesInCopy(value: string): string {
  return value
    .replace(/\bStroke Motion\b/gi, 'story animation')
    .replace(/\bGraphic Design\s*\/\s*VisualExplain\b|\bVisualExplain\b/gi, 'visual explanation')
    .replace(/\bReal Motion\b/gi, 'premium motion')
    .replace(/\bSoundSync\b/gi, 'sound timing')
    .replace(/\bRemotion\b|\bremotion\b/g, 'the composition renderer')
    .replace(/\bFFmpeg\b|\bffmpeg\b/g, 'the media assembly worker')
    .replace(/\bFFprobe\b|\bffprobe\b/g, 'the media inspection worker')
    .replace(/\bAudioFlux\b|\baudioflux\b/g, 'audio rhythm analysis')
    .replace(/\blibrosa\b/g, 'audio analysis')
    .replace(/\baudioread\b/g, 'audio file reading')
    .replace(/\bpydub effects\b|\bpydub_effects\b/g, 'audio effects')
    .replace(/\bpydub\b/g, 'audio editing')
    .replace(/\bscipy\b/g, 'signal analysis')
    .replace(/\bresampy\b/g, 'audio resampling')
    .replace(/\bpyloudnorm\b/g, 'loudness check')
    .replace(/\bmusic21\b/g, 'music structure analysis')
    .replace(/\bpretty_midi\b/g, 'MIDI arrangement')
    .replace(/\bmido\b/g, 'MIDI timing')
    .replace(/\bnoisereduce\b/g, 'noise cleanup')
    .replace(/\bpedalboard\b/g, 'audio effects')
    .replace(/\bmir_eval\b/g, 'audio QA')
    .replace(/\bebu_r128_pyloudnorm\b/g, 'broadcast loudness check')
    .replace(/\bOpenColorIO\b|\bopencolorio\b/g, 'color management')
    .replace(/\bOpenImageIO\b|\bopenimageio\b/g, 'image inspection')
    .replace(/\bMapLibre\b|\bmaplibre\b/g, 'map rendering')
    .replace(/\bdeck\.gl\b|\bdeck_gl\b/g, 'map rendering')
    .replace(/\bTurf\b|\bturf\b/g, 'route geometry')
    .replace(/\bD3\b|\bd3\b/g, 'data graphic rendering')
    .replace(/\bECharts\b|\becharts\b/g, 'data graphic rendering')
    .replace(/\bVega-Lite\b|\bvega_lite\b|\bvega lite\b/g, 'data graphic rendering')
    .replace(/\bVega\b|\bvega\b/g, 'data graphic rendering')
    .replace(/\bViz\.js\b|\bviz_js\b/g, 'diagram rendering')
    .replace(/\bSatori\b|\bsatori\b/g, 'graphic layout rendering')
    .replace(/\bSVG\.js\b|\bsvg_js\b/g, 'vector graphic rendering')
    .replace(/\bLottie\b|\blottie_web\b/g, 'motion graphic playback')
    .replace(/\bAnime\.js\b|\banimejs\b/g, 'motion timing')
    .replace(/\bThree\.js\b|\bthree_js\b|\bthree\b/g, '3D scene rendering')
    .replace(/\bBabylon\.js\b|\bbabylonjs\b|\bbabylon_js\b/g, '3D scene rendering')
    .replace(/\bPixiJS\b|\bpixi_js\b|\bpixijs\b/g, 'canvas rendering')
    .replace(/\bKonva\b|\bkonva\b/g, 'canvas composition')
    .replace(/\bKornia\b|\bkornia\b/g, 'image analysis')
    .replace(/\bOpenCV\b|\bopencv\b/g, 'visual analysis')
    .replace(/\bPySceneDetect\b|\bpyscenedetect\b/g, 'scene detection')
    .replace(/\bPyTorch \+ TorchVision\b|\btorch_torchvision\b/g, 'vision runtime support')
    .replace(/\bTransformers\b|\btransformers\b/g, 'model runtime support')
    .replace(/\bSAM(?:\s*|[-_.])?3(?:\.|[-_])?1\b|\bsam3_1\b/gi, 'subject segmentation support')
    .replace(/\bSAM 2\b|\bsam2\b/g, 'subject segmentation support')
    .replace(/\bBiRefNet\b|\bbirefnet\b/g, 'subject cutout support')
    .replace(/\brembg\b/g, 'background removal support')
    .replace(/\btransparent-background\b|\btransparent_background\b/g, 'background removal support')
    .replace(/\bReal-ESRGAN\b|\breal_esrgan\b/g, 'image enhancement support')
    .replace(/\bLyria(?:\s+Pro)?\b|\blyria(?:[-_ ]?3[-_ ]?pro[-_ ]?preview)?\b/gi, 'music asset service')
    .replace(/\bMirelo(?:\s+SFX\s+V?1\.?5)?\b|\bmirelo_sfx_v1_5\b/gi, 'production-quality sound route')
    .replace(/\bMMAudio(?:\s+V?2)?\b|\bmmaudio_v2\b|\bmmaudio_v\b/gi, 'draft sound route')
    .replace(/\bGPT[-_ ]?Image[-_ ]?2\b|\bgpt_image_2\b/gi, 'AI image route')
    .replace(/\bWan\b|\bwan(?:[-_ ][a-z0-9.]+)?\b/gi, 'AI video route')
    .replace(/\bHailuo\b|\bhailuo(?:[-_ ][a-z0-9.]+)?\b/gi, 'AI video route')
    .replace(/\bVeo(?:\s+(?:3\.1\s+)?Lite)?\b|\bveo_3_1_lite\b/gi, 'premium video fallback')
    .replace(/\bQwen(?:\s*3\.7(?:\s*Max)?|\s*2\.5[-_ ]?VL)?\b|\bqwen(?:[-_a-z0-9.]*)?\b/gi, 'planning intelligence')
    .replace(/\bDeepSeek(?:\s*V?4\s*Pro)?\b|\bdeepseek(?:[-_a-z0-9.]*)?\b/gi, 'technical planning support')
    .replace(/\btool[-_ ]?code\b/gi, 'technical assembly')
    .replace(/\bsource[-_ ]?truth\b/gi, 'review record')
    .replace(/\bgpac_mp4box_packaging_validation\b|\bGPAC\b|\bgpac\b/g, 'delivery packaging')
    .replace(/\bMP4Box\b|\bmp4box\b/g, 'delivery packaging check')
    .replace(/\bmkvtoolnix_container_validation\b|\bMKVToolNix\b|\bmkvtoolnix\b/g, 'container packaging check')
    .replace(/\bstreamer_render_pipeline_support\b|\bGStreamer\b|\bgstreamer\b/g, 'stream pipeline check')
    .replace(/\bVapourSynth\b|\bvapoursynth\b/g, 'frame pipeline processing')
    .replace(/\bSharp\b|\bsharp\b/g, 'image preparation')
    .replace(/\bPlaywright\b|\bplaywright\b/g, 'browser capture')
    .replace(/\blibass\b/g, 'caption rendering')
    .replace(/\bFaster[-_ ]?Whisper\b|\bfaster_whisper\b/g, 'speech transcription')
    .replace(/\bWhisper\.cpp\b|\bwhisper_cpp\b/g, 'speech transcription')
    .replace(/\bDeepFilterNet\b|\bdeepfilternet\b/g, 'voice cleanup')
    .replace(/\bRNNoise\b|\brnnoise\b/g, 'noise cleanup')
    .replace(/\bHyperframe\b|\bhyperframe\b/g, 'frame metadata support')
    .replace(/\blibvips\b/g, 'image processing dependency')
    .replace(/\bEssentia\b|\bessentia\b/g, 'legacy audio analysis')
    .replace(/\bRubber Band\b|\brubber_band\b/g, 'legacy music stretch')
    .replace(/\bSignalsmith Stretch\b|\bsignalsmith_stretch\b/g, 'music stretch')
    .replace(/\bmock\b/gi, 'local test')
    .replace(/\bexternal service required\b/gi, 'AI service approval required')
    .replace(/\bbackend required\b/gi, 'private processing required')
    .replace(/\bbackend\b/gi, 'private processing')
    .replace(/\bprovider calls?\b/gi, 'AI asset preparation')
    .replace(/\bprovider work\b/gi, 'AI asset preparation')
    .replace(/\bprovider request\b/gi, 'AI asset request')
    .replace(/\bprovider\b/gi, 'AI asset service')
    .replace(/\bworkers?\b/gi, 'approved processing steps')
    .replace(/\btools?\b(?!-)/gi, 'activities')
}
