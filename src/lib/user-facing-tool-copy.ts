const userFacingReplacements: Array<[RegExp, string]> = [
  [/FFmpeg LGPL Configuration/gi, 'media-processing build policy'],
  [/Signalsmith Stretch/gi, 'audio stretch support'],
  [/MapLibre\/Turf\/Remotion/gi, 'controlled map and renderer planning'],
  [/D3\/ECharts\/Vega-Lite/gi, 'controlled chart planning'],
  [/D3\/ECharts\/Remotion/gi, 'controlled chart and renderer planning'],
  [/D3\/Remotion|ECharts\/Remotion|Remotion\/ECharts/gi, 'controlled chart and renderer planning'],
  [/OpenColorIO\/OpenImageIO\/OpenCV\/Sharp/gi, 'color and image processing'],
  [/FFmpeg\/OpenColorIO\/OpenCV\/Sharp/gi, 'media, color, and image processing'],
  [/FFmpeg\/AudioFlux\/Signalsmith Stretch/gi, 'media and audio analysis'],
  [/FFmpeg\/OpenColorIO\/OpenImageIO\/OpenCV\/Sharp/gi, 'media, color, and image processing'],
  [/MapLibre\/Turf/gi, 'controlled map planning'],
  [/D3\/ECharts/gi, 'controlled chart planning'],
  [/FFmpeg/gi, 'media processing'],
  [/FFprobe/gi, 'media inspection'],
  [/VapourSynth/gi, 'advanced video processing'],
  [/OpenColorIO/gi, 'color management'],
  [/OpenImageIO/gi, 'image inspection'],
  [/OpenCV/gi, 'visual analysis'],
  [/PaddleOCR/gi, 'text recognition'],
  [/AudioFlux/gi, 'audio analysis'],
  [/Signalsmith/gi, 'audio stretch support'],
  [/D3/gi, 'controlled chart build'],
  [/ECharts/gi, 'controlled chart build'],
  [/Vega-Lite/gi, 'future chart grammar'],
  [/MapLibre/gi, 'controlled map build'],
  [/Turf/gi, 'route geometry planning'],
  [/PyAV/gi, 'media inspection'],
  [/libass/gi, 'caption rendering support'],
  [/Remotion\/editor motion/gi, 'renderer/editor motion'],
  [/Remotion-only/gi, 'renderer-only'],
  [/Remotion rendering/gi, 'renderer work'],
  [/Remotion render/gi, 'renderer work'],
  [/Remotion layer/gi, 'renderer layer'],
  [/Remotion motion/gi, 'renderer motion'],
  [/Remotion composition/gi, 'renderer composition'],
  [/Remotion handles composition/gi, 'the renderer handles composition'],
  [/Remotion/gi, 'the renderer'],
]

export function toUserFacingToolCopy(text: string | undefined): string {
  if (!text) return ''

  return userFacingReplacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  )
}
