import type {
  EditLevel,
  OpenSourceToolId,
  SpeakerVisualLayoutMode,
  ToolCategory,
  ToolExecutionMode,
  ToolProfile,
  ToolRegistrySummary,
  ToolStrategyHint,
  ToolStrategyHintDetail,
} from '../types/reeditpro'
import {
  audioAnalysisSettings,
  audioFluxSettings,
  commonToolSettings,
  d3Settings,
  eChartsSettings,
  ffmpegLgplSettings,
  lottieSettings,
  mapLibreSettings,
  openColorIOSettings,
  openCVSettings,
  playwrightSettings,
  remotionSettings,
  sharpLibvipsSettings,
  sharpSettings,
  signalsmithStretchSettings,
  threeSettings,
  toolPresets,
  turfSettings,
  vapourSynthSettings,
} from './tool-settings-catalog'

const planningOnlyNote = 'Planning only; not installed and not executed in this frontend mock.'
const approvalNote = 'Future execution must happen only in approved worker flows from approved plan snapshots.'

type ProfileParams = Omit<ToolProfile, 'licenseNotes' | 'productionNotes' | 'tierAvailability'> & {
  licenseNotes?: string[]
  productionNotes?: string[]
  tierAvailability?: ToolProfile['tierAvailability']
}

function allTiers() {
  return { basic: true, pro: true, premium: true }
}

function proPremium() {
  return { basic: false, pro: true, premium: true }
}

function premiumOnly() {
  return { basic: false, pro: false, premium: true }
}

function profile(params: ProfileParams): ToolProfile {
  return {
    ...params,
    licenseNotes: params.licenseNotes ?? ['Track license notes before production use.'],
    productionNotes: params.productionNotes ?? [planningOnlyNote, approvalNote],
    tierAvailability: params.tierAvailability ?? allTiers(),
  }
}

export const openSourceToolProfiles: ToolProfile[] = [
  profile({
    id: 'remotion',
    label: 'Remotion',
    category: 'renderer_compositor',
    adoptionStage: 'launch_core',
    executionMode: 'inside_remotion',
    description: 'Final canvas, layer, caption, panel, card, and motion composition planner.',
    bestFor: ['Final canvas planning', 'Layer timing', 'Captions', 'Panels', 'Cards', 'Motion design'],
    avoidFor: ['Provider media generation', 'Backend execution in this frontend mock'],
    inputTypes: ['frame_layout', 'generated_image', 'ai_video_clip', 'json_data'],
    outputTypes: ['renderer_layer', 'json_spec'],
    settingDefinitions: remotionSettings,
    defaultPresets: ['clean_social_caption_layout', 'premium_lower_panel', 'documentary_evidence_board'],
    remotionIntegration: 'Remotion owns final layout/composition and receives layer/motion briefs.',
    qaChecks: ['Captions stay in safe zones.', 'AI assets fit assigned panels.', 'Final canvas is composed by Remotion, not provider models.'],
  }),
  profile({
    id: 'ffmpeg',
    label: 'FFmpeg LGPL Configuration',
    category: 'video_processing',
    adoptionStage: 'launch_core',
    executionMode: 'worker_postprocess',
    description: 'Planned video/audio processing for trim, color, loudness, transcode, and export later.',
    bestFor: ['Trim planning', 'Transcode', 'Encoding', 'LUT/color filters', 'Audio normalization', 'Export processing'],
    avoidFor: ['Creative planning decisions', 'Frontend media processing'],
    inputTypes: ['source_video', 'audio'],
    outputTypes: ['processed_video', 'processed_audio'],
    settingDefinitions: ffmpegLgplSettings,
    defaultPresets: ['clean_natural_color_pass', 'premium_clean_color_pass', 'documentary_neutral_color_pass', 'voice_cleanup_basic'],
    remotionIntegration: 'Future workers can prepare source or final files before/after Remotion composition.',
    qaChecks: ['No FFmpeg execution in frontend.', 'Approved export settings match plan.', 'LGPL-safe build assumptions remain explicit.'],
    licenseNotes: ['Use LGPL-safe configuration only until legal/build review. Avoid GPL/nonfree flags unless approved.'],
    productionNotes: [
      planningOnlyNote,
      approvalNote,
      'Required worker/export candidate. Needs configure flag, codec, patent, and commercial review.',
    ],
  }),
  profile({
    id: 'opencolorio',
    label: 'OpenColorIO',
    category: 'color_management',
    adoptionStage: 'planned',
    executionMode: 'future_worker',
    description: 'Professional color management planning for ACES/display transforms and asset matching.',
    bestFor: ['ACES-style color pipeline', 'Display transforms', 'Look transforms', 'Generated asset color matching'],
    avoidFor: ['Frontend execution', 'Unreviewed color pipeline claims'],
    inputTypes: ['source_video', 'image', 'generated_image'],
    outputTypes: ['processed_video', 'image_asset'],
    settingDefinitions: openColorIOSettings,
    defaultPresets: ['premium_clean_color_pass', 'documentary_neutral_color_pass'],
    tierAvailability: proPremium(),
    remotionIntegration: 'Can provide color-managed assets or notes for Remotion composition later.',
    qaChecks: ['Color-space assumptions are explicit.', 'Generated assets match source look where required.'],
  }),
  profile({
    id: 'openimageio',
    label: 'OpenImageIO',
    category: 'image_processing',
    adoptionStage: 'planned',
    executionMode: 'future_worker',
    description: 'Advanced still-image and VFX-style image pipeline planning.',
    bestFor: ['Image conversion', 'Image QA', 'VFX-style image handling', 'Professional still pipeline'],
    avoidFor: ['Frontend bundling', 'Simple thumbnails where Sharp is enough'],
    inputTypes: ['image', 'generated_image'],
    outputTypes: ['image_asset', 'qa_report'],
    settingDefinitions: [...sharpSettings, ...commonToolSettings],
    defaultPresets: [],
    tierAvailability: proPremium(),
    remotionIntegration: 'Future workers can prepare image assets for Remotion layers.',
    qaChecks: ['Use Sharp for launch-simple image prep unless advanced pipeline is justified.'],
  }),
  profile({
    id: 'opencv',
    label: 'OpenCV',
    category: 'visual_analysis',
    adoptionStage: 'launch_core',
    executionMode: 'qa_only',
    description: 'Visual QA and future analysis planning for safe zones, blur, crop, masks, and tracking.',
    bestFor: ['Face/object safe zones', 'Crop/framing QA', 'Blur checks', 'Panel background consistency', 'Future masks/tracking analysis'],
    avoidFor: ['Claiming real detection in frontend mock', 'Provider generation'],
    inputTypes: ['source_video', 'image', 'generated_image', 'frame_layout'],
    outputTypes: ['qa_report', 'json_spec'],
    settingDefinitions: openCVSettings,
    defaultPresets: ['foreground_safe_zone_qa', 'panel_background_match_qa'],
    remotionIntegration: 'Can validate planned Remotion zones and future rendered frames in worker QA.',
    qaChecks: ['No real OpenCV processing in this task.', 'Safe-zone checks remain mock/planned.'],
  }),
  profile({
    id: 'sharp',
    label: 'Sharp + libvips',
    category: 'image_processing',
    adoptionStage: 'launch_core',
    executionMode: 'worker_preprocess',
    description: 'Image/asset worker planning for thumbnails, resize, watermarking, overlay prep, and simple composites.',
    bestFor: ['Generated image preparation', 'Thumbnails', 'Resize/crop', 'Overlay assets', 'Watermarks'],
    avoidFor: ['Final video composition', 'Real frontend processing in this task'],
    inputTypes: ['image', 'generated_image'],
    outputTypes: ['image_asset'],
    settingDefinitions: sharpLibvipsSettings,
    defaultPresets: ['browser_dashboard_capture', 'panel_background_match_qa'],
    remotionIntegration: 'Can prepare image assets before Remotion places them into planned zones.',
    qaChecks: ['Prepared assets preserve safe margins.', 'Panel background color stays consistent.', 'Untrusted image handling remains worker/backend-only.'],
    licenseNotes: ['Sharp Apache 2.0 working assumption; libvips LGPL working assumption.'],
    productionNotes: [
      planningOnlyNote,
      approvalNote,
      'Asset/image worker candidate. Review libvips optional dependencies and untrusted image handling.',
    ],
  }),
  profile({
    id: 'maplibre',
    label: 'MapLibre',
    category: 'maps_geospatial',
    adoptionStage: 'launch_core',
    executionMode: 'planning_only',
    description: 'Map visual planning for route reveals, pins, camera moves, and location context.',
    bestFor: ['Map animation', 'Pins', 'Routes', 'Fly/zoom camera', 'Travel/real estate/documentary geography'],
    avoidFor: ['AI-video map labels', 'Unverified geography'],
    inputTypes: ['geojson', 'json_data'],
    outputTypes: ['map_visual', 'renderer_layer'],
    settingDefinitions: mapLibreSettings,
    defaultPresets: ['map_route_reveal', 'real_estate_neighborhood_map'],
    remotionIntegration: 'Map layers can be planned for Remotion composition; library is not installed here.',
    qaChecks: ['Map labels remain readable.', 'Route/location claims are user-approved or source-aware.'],
  }),
  profile({
    id: 'turf',
    label: 'Turf',
    category: 'maps_geospatial',
    adoptionStage: 'launch_core',
    executionMode: 'planning_only',
    description: 'Geospatial math planning for bounds, distances, routes, and geometry prep.',
    bestFor: ['Bounding boxes', 'Routes', 'Distances', 'Geometry prep'],
    avoidFor: ['Rendering maps', 'Unverified location calculations in frontend mock'],
    inputTypes: ['geojson', 'json_data'],
    outputTypes: ['json_spec'],
    settingDefinitions: turfSettings,
    defaultPresets: ['map_route_reveal', 'real_estate_neighborhood_map'],
    remotionIntegration: 'Prepares geometry specs for MapLibre/Remotion map layouts later.',
    qaChecks: ['Distance/route labels should be verified before production.'],
  }),
  profile({
    id: 'd3',
    label: 'D3',
    category: 'charts_dataviz',
    adoptionStage: 'launch_core',
    executionMode: 'planning_only',
    description: 'Custom chart, diagram, money-flow, network, and timeline planning.',
    bestFor: ['Custom diagrams', 'Money flows', 'Network diagrams', 'Timelines', 'SVG/data motion'],
    avoidFor: ['Random decorative charts', 'Frontend execution before installation'],
    inputTypes: ['json_data'],
    outputTypes: ['svg_visual', 'chart_visual', 'json_spec'],
    settingDefinitions: d3Settings,
    defaultPresets: ['money_flow_diagram'],
    remotionIntegration: 'D3-style specs can become SVG/visual layers inside Remotion later.',
    qaChecks: ['Exact labels/arrows remain controlled.', 'Data visuals avoid AI-video routing.'],
  }),
  profile({
    id: 'echarts',
    label: 'ECharts',
    category: 'charts_dataviz',
    adoptionStage: 'launch_core',
    executionMode: 'planning_only',
    description: 'Standard business, finance, dashboard, and fast chart-card planning.',
    bestFor: ['Business charts', 'Finance charts', 'Dashboard visuals', 'Bar/line/pie charts'],
    avoidFor: ['Highly custom money-flow diagrams where D3 is better'],
    inputTypes: ['json_data'],
    outputTypes: ['chart_visual', 'json_spec'],
    settingDefinitions: eChartsSettings,
    defaultPresets: ['money_flow_diagram', 'product_feature_callout'],
    remotionIntegration: 'ECharts specs can be rendered as controlled chart layers later.',
    qaChecks: ['Chart text remains readable.', 'Exact data is not routed to AI video.'],
  }),
  profile({
    id: 'vega_lite',
    label: 'Vega-Lite',
    category: 'charts_dataviz',
    adoptionStage: 'planned',
    executionMode: 'planning_only',
    description: 'Declarative chart-spec planning for repeatable structured charts.',
    bestFor: ['Structured chart specs', 'AI-friendly declarative charts', 'Repeatable charts'],
    avoidFor: ['Launch execution before registry review'],
    inputTypes: ['json_data'],
    outputTypes: ['json_spec', 'chart_visual'],
    settingDefinitions: eChartsSettings,
    defaultPresets: [],
    remotionIntegration: 'Can produce structured chart specs for future renderer layers.',
    qaChecks: ['Spec remains deterministic and source-aware.'],
  }),
  profile({
    id: 'playwright',
    label: 'Playwright',
    category: 'browser_capture',
    adoptionStage: 'launch_core',
    executionMode: 'worker_preprocess',
    description: 'Browser/app/dashboard screenshot and visual-regression planning for approved pages.',
    bestFor: ['Website captures', 'App/dashboard screenshots', 'Browser capture', 'Visual regression', 'UI QA'],
    avoidFor: ['Unapproved private pages', 'Running browser capture in this frontend demo'],
    inputTypes: ['url', 'html', 'css'],
    outputTypes: ['screenshot_asset', 'qa_report'],
    settingDefinitions: playwrightSettings,
    defaultPresets: ['browser_dashboard_capture'],
    remotionIntegration: 'Future screenshots can become Remotion visual layers or screen-capture panels.',
    qaChecks: ['Only approved URLs/pages are captured.', 'No Playwright execution in this task.'],
  }),
  profile({
    id: 'lottie',
    label: 'Lottie',
    category: 'vector_animation',
    adoptionStage: 'planned',
    executionMode: 'planning_only',
    description: 'Reusable vector animation planning for icons, status motion, and UI-style visual accents.',
    bestFor: ['Reusable animation packs', 'Icons/checkmarks', 'Status animations', 'Non-AI vector motion'],
    avoidFor: ['Realistic generated motion', 'Decorative motion without story purpose'],
    inputTypes: ['json_data'],
    outputTypes: ['renderer_layer'],
    settingDefinitions: lottieSettings,
    defaultPresets: [],
    remotionIntegration: 'Future Lottie layers can be placed inside Remotion panels.',
    qaChecks: ['Motion supports the segment meaning.', 'Animation stays inside assigned zone.'],
  }),
  profile({
    id: 'three_js',
    label: 'Three.js',
    category: 'three_d_visuals',
    adoptionStage: 'planned',
    executionMode: 'planning_only',
    description: '3D product, icon, chart, and abstract explainer planning.',
    bestFor: ['3D product mockups', '3D icons', '3D charts', 'Abstract 3D explainers'],
    avoidFor: ['Simple diagrams where flat tools are clearer'],
    inputTypes: ['json_data', 'image'],
    outputTypes: ['renderer_layer', 'image_asset'],
    settingDefinitions: threeSettings,
    defaultPresets: [],
    tierAvailability: proPremium(),
    remotionIntegration: 'Future 3D visuals can be rendered or embedded as Remotion layers after install/review.',
    qaChecks: ['3D does not obscure captions or speaker zones.'],
  }),
  profile({
    id: 'pixijs',
    label: 'PixiJS',
    category: 'canvas_graphics',
    adoptionStage: 'planned',
    executionMode: 'planning_only',
    description: 'High-performance 2D effects, particles, glow, and sprite animation planning.',
    bestFor: ['2D effects', 'Particles/glows', 'Sprite animation'],
    avoidFor: ['Random decorative effects', 'Exact data visualizations'],
    inputTypes: ['image', 'json_data'],
    outputTypes: ['renderer_layer'],
    settingDefinitions: commonToolSettings,
    defaultPresets: [],
    tierAvailability: proPremium(),
    remotionIntegration: 'Future canvas layers may be rendered into Remotion scenes after review.',
    qaChecks: ['Effects remain restrained and purposeful.'],
  }),
  profile({
    id: 'konva',
    label: 'Konva',
    category: 'canvas_graphics',
    adoptionStage: 'planned',
    executionMode: 'planning_only',
    description: 'Editable 2D canvas graphic and future design-editor interaction planning.',
    bestFor: ['Editable canvas graphics', '2D shapes', 'Object manipulation', 'Future design editor interactions'],
    avoidFor: ['Final full-video rendering'],
    inputTypes: ['json_data'],
    outputTypes: ['json_spec', 'renderer_layer'],
    settingDefinitions: commonToolSettings,
    defaultPresets: [],
    tierAvailability: proPremium(),
    remotionIntegration: 'Future canvas specs can feed Remotion layers or editor interactions.',
    qaChecks: ['Canvas graphics stay within approved layout zones.'],
  }),
  profile({
    id: 'audioflux',
    label: 'AudioFlux',
    category: 'audio_analysis',
    adoptionStage: 'launch_core',
    executionMode: 'future_worker',
    description: 'Launch audio analysis candidate for onset, rhythm, audio feature, beat/drop, and SoundSync timing maps.',
    bestFor: ['Audio feature analysis', 'Onset/rhythm analysis', 'SoundSync cue planning', 'Beat/drop/rhythm support'],
    avoidFor: ['Final audio mixing by itself', 'Real-time frontend execution', 'Replacing voice cleanup/export processing'],
    inputTypes: ['audio'],
    outputTypes: ['timing_map', 'qa_report', 'json_spec'],
    settingDefinitions: audioFluxSettings,
    defaultPresets: ['soundsync_subtle_premium'],
    remotionIntegration: 'Provides timing/audio features that Remotion can use for visual and caption cue alignment.',
    qaChecks: ['AudioFlux analysis remains mock-only until worker implementation.', 'BPM/beat-drop accuracy needs benchmark before production.'],
    licenseNotes: ['MIT working assumption; production use requires dependency/compliance review.'],
    productionNotes: [
      planningOnlyNote,
      approvalNote,
      'Worker-only candidate. Needs accuracy benchmark for BPM/beat-drop/SoundSync use cases.',
    ],
  }),
  profile({
    id: 'essentia',
    label: 'Essentia',
    category: 'audio_analysis',
    adoptionStage: 'needs_license_review',
    executionMode: 'future_worker',
    description: 'Future/evaluation-only audio analysis option; not selected for launch SoundSync planning.',
    bestFor: ['Future research evaluation', 'Alternative audio feature analysis after review'],
    avoidFor: ['Launch defaults', 'Frontend real audio analysis', 'Music generation'],
    inputTypes: ['audio'],
    outputTypes: ['timing_map', 'qa_report'],
    settingDefinitions: audioAnalysisSettings,
    defaultPresets: [],
    tierAvailability: premiumOnly(),
    remotionIntegration: 'Future timing maps can inform Remotion motion and edit timing.',
    qaChecks: ['Not selected for launch.', 'Generated music still needs Music QA.', 'Legal/product review required before production use.'],
    licenseNotes: ['Not selected for launch. Requires legal review before production use.'],
    productionNotes: [
      planningOnlyNote,
      approvalNote,
      'Future evaluation only; replaced by AudioFlux for launch audio analysis planning.',
    ],
  }),
  profile({
    id: 'librosa',
    label: 'librosa',
    category: 'audio_analysis',
    adoptionStage: 'future',
    executionMode: 'future_worker',
    description: 'Python audio analysis/prototyping planning for research and worker evaluation.',
    bestFor: ['Music/audio features', 'Audio research', 'Prototype analysis'],
    avoidFor: ['Frontend bundling', 'Launch-core worker assumption'],
    inputTypes: ['audio'],
    outputTypes: ['timing_map', 'qa_report'],
    settingDefinitions: audioAnalysisSettings,
    defaultPresets: [],
    tierAvailability: premiumOnly(),
    remotionIntegration: 'Could provide future timing maps for Remotion motion timing.',
    qaChecks: ['Keep as future worker/evaluation tool.'],
  }),
  profile({
    id: 'whisper_cpp',
    label: 'whisper.cpp',
    category: 'transcription',
    adoptionStage: 'future',
    executionMode: 'future_worker',
    description: 'Local/offline transcription prototype planning for future transcript and timing experiments.',
    bestFor: ['Offline transcription prototypes', 'Transcript timing experiments'],
    avoidFor: ['Claiming current transcript generation', 'Frontend execution'],
    inputTypes: ['audio', 'source_video'],
    outputTypes: ['json_spec', 'timing_map'],
    settingDefinitions: audioAnalysisSettings,
    defaultPresets: [],
    tierAvailability: proPremium(),
    remotionIntegration: 'Future transcript timings can drive captions in Remotion.',
    qaChecks: ['Current video understanding remains mock-only.'],
  }),
  profile({
    id: 'deck_gl',
    label: 'deck.gl',
    category: 'maps_geospatial',
    adoptionStage: 'planned',
    executionMode: 'planning_only',
    description: 'Advanced geospatial/data visualization planning for arcs, heatmaps, and point clouds.',
    bestFor: ['Animated arcs', 'Heatmaps', 'Point clouds', 'Advanced geospatial data visuals'],
    avoidFor: ['Simple route maps that MapLibre can handle'],
    inputTypes: ['geojson', 'json_data'],
    outputTypes: ['map_visual', 'renderer_layer'],
    settingDefinitions: [...mapLibreSettings, ...turfSettings],
    defaultPresets: [],
    tierAvailability: premiumOnly(),
    remotionIntegration: 'Future advanced map visuals can become Remotion layers after review.',
    qaChecks: ['Use only when advanced data visualization improves the edit.'],
  }),
  profile({
    id: 'cesium_js',
    label: 'CesiumJS',
    category: 'maps_geospatial',
    adoptionStage: 'future',
    executionMode: 'future_worker',
    description: '3D globe/map visualization planning for premium world/location visuals.',
    bestFor: ['3D globe maps', 'Premium location reveals', 'World-scale visualizations'],
    avoidFor: ['Launch-core simple maps', 'Unneeded spectacle'],
    inputTypes: ['geojson', 'json_data'],
    outputTypes: ['map_visual', 'renderer_layer'],
    settingDefinitions: mapLibreSettings,
    defaultPresets: [],
    tierAvailability: premiumOnly(),
    remotionIntegration: 'Future rendered map assets may be placed by Remotion.',
    qaChecks: ['Use only when geography clarity requires 3D/world context.'],
  }),
  profile({
    id: 'vapoursynth',
    label: 'VapourSynth',
    category: 'video_processing',
    adoptionStage: 'planned',
    executionMode: 'future_worker',
    description: 'Worker-only frame/native video pipeline candidate for future scripted processing and Python-native frame flows.',
    bestFor: ['Frame-level video processing', 'Python-native frame pipeline planning', 'Scripted worker preprocessing'],
    avoidFor: ['Frontend work', 'Unreviewed plugin use', 'Provider/model routing'],
    inputTypes: ['source_video'],
    outputTypes: ['processed_video'],
    settingDefinitions: vapourSynthSettings,
    defaultPresets: [],
    tierAvailability: proPremium(),
    remotionIntegration: 'Could prepare source or processed clips for Remotion after worker review.',
    qaChecks: ['Keep worker-only unless a milestone explicitly activates it.', 'Plugins require separate review.'],
    licenseNotes: ['LGPL v2.1 working assumption; plugins require separate review.'],
    productionNotes: [
      planningOnlyNote,
      approvalNote,
      'Worker-only frame pipeline candidate. Needs LGPL compliance review and plugin review.',
    ],
  }),
  profile({
    id: 'signalsmith_stretch',
    label: 'Signalsmith Stretch',
    category: 'audio_analysis',
    adoptionStage: 'launch_core',
    executionMode: 'future_worker',
    description: 'Launch music time-stretch and pitch-adjustment candidate for fitting music beds to scene length.',
    bestFor: ['Time-stretching music', 'Pitch adjustment', 'Fitting music beds to scene length'],
    avoidFor: ['Extreme stretch ratios without QA', 'Frontend execution', 'Replacing full mix/mastering'],
    inputTypes: ['audio'],
    outputTypes: ['processed_audio'],
    settingDefinitions: signalsmithStretchSettings,
    defaultPresets: [],
    tierAvailability: proPremium(),
    remotionIntegration: 'Future adjusted music can be aligned with Remotion timing after approval and Music QA.',
    qaChecks: ['Stretch quality needs benchmark for common ratios.', 'QA listen/review required for audible artifacts.'],
    licenseNotes: ['MIT working assumption; production use requires compliance and quality review.'],
    productionNotes: [
      planningOnlyNote,
      approvalNote,
      'Worker-only candidate. Benchmark quality for common stretch ranges.',
    ],
  }),
  profile({
    id: 'rubber_band',
    label: 'Rubber Band',
    category: 'audio_analysis',
    adoptionStage: 'needs_license_review',
    executionMode: 'future_worker',
    description: 'Future/evaluation-only tempo and pitch tool; not selected for launch because Signalsmith Stretch is the launch candidate.',
    bestFor: ['Future stretch/pitch evaluation after review'],
    avoidFor: ['Launch defaults', 'Production use before commercial license review', 'Frontend processing'],
    inputTypes: ['audio'],
    outputTypes: ['processed_audio'],
    settingDefinitions: audioAnalysisSettings,
    defaultPresets: [],
    tierAvailability: premiumOnly(),
    remotionIntegration: 'Future adjusted audio can be aligned with Remotion timing after approval.',
    qaChecks: ['Not selected for launch.', 'License review is required before commercial production use.'],
    licenseNotes: ['Not selected for launch. Requires legal/commercial review before production use.'],
    productionNotes: [planningOnlyNote, approvalNote, 'Future evaluation only; replaced by Signalsmith Stretch for launch stretch/pitch planning.'],
  }),
]

export { toolPresets }

export function getToolProfile(toolId: OpenSourceToolId) {
  return openSourceToolProfiles.find((tool) => tool.id === toolId)
}

export function getToolsByCategory(category: ToolCategory) {
  return openSourceToolProfiles.filter((tool) => tool.category === category)
}

export function getToolsByExecutionMode(mode: ToolExecutionMode) {
  return openSourceToolProfiles.filter((tool) => tool.executionMode === mode)
}

export function getLaunchCoreTools() {
  return openSourceToolProfiles.filter((tool) => tool.adoptionStage === 'launch_core')
}

export function getToolsNeedingLicenseReview() {
  return openSourceToolProfiles.filter((tool) =>
    tool.adoptionStage === 'needs_license_review' ||
    tool.licenseNotes.some((note) => /license review required|needs license review/i.test(note)),
  )
}

export function getToolRegistrySummary(): ToolRegistrySummary {
  const categories = Array.from(new Set(openSourceToolProfiles.map((tool) => tool.category))).sort()

  return {
    launchCoreToolCount: getLaunchCoreTools().length,
    plannedToolCount: openSourceToolProfiles.filter((tool) => tool.adoptionStage === 'planned').length,
    futureToolCount: openSourceToolProfiles.filter((tool) =>
      tool.adoptionStage === 'future' ||
      tool.adoptionStage === 'experimental' ||
      tool.adoptionStage === 'needs_license_review',
    ).length,
    needsLicenseReviewCount: getToolsNeedingLicenseReview().length,
    categories,
    notes: [
      'Open-source tool registry is planning-only; no packages are installed or executed in this frontend mock.',
      'Provider models such as GPT-Image-2, Wan, Hailuo, and Veo remain separate from OpenSourceToolId entries.',
      'The registry does not enable Veo, change model policy, or bypass plan and credit approval.',
      'Remotion remains the final compositor; tools can provide assets, data, screenshots, maps, charts, processing, or QA in future approved workers.',
    ],
  }
}

export function getPresetsForTool(toolId: OpenSourceToolId) {
  return toolPresets.filter((preset) => preset.toolIds.includes(toolId))
}

export function getPreset(presetId: string) {
  return toolPresets.find((preset) => preset.id === presetId)
}

function settingsForPresetIds(presetIds: string[]) {
  return presetIds.reduce<Record<string, unknown>>((settings, presetId) => {
    const preset = getPreset(presetId)
    return { ...settings, ...(preset?.settings ?? {}) }
  }, { planningOnly: true })
}

function detail(
  toolId: OpenSourceToolId,
  reason: string,
  suggestedPresetIds: string[],
  fallbackToolIds: OpenSourceToolId[] = [],
  qaChecks: string[] = [],
): ToolStrategyHintDetail[] {
  const tool = getToolProfile(toolId)

  if (!tool) {
    return []
  }

  return [{
    toolId,
    reason,
    expectedInputTypes: tool.inputTypes,
    expectedOutputTypes: tool.outputTypes,
    suggestedPresetIds,
    settings: settingsForPresetIds(suggestedPresetIds),
    fallbackToolIds,
    qaChecks: [
      ...tool.qaChecks.slice(0, 2),
      ...qaChecks,
      'Planning only; no tool execution or package installation in this demo.',
    ],
  }]
}

export function getToolStrategyDetailsForHint(
  hint: ToolStrategyHint,
  params: {
    editLevel?: EditLevel
    layoutMode?: SpeakerVisualLayoutMode
  } = {},
): ToolStrategyHintDetail[] {
  const lowerPanelPreferred = params.layoutMode === 'lower_visual_panel' || params.editLevel === 'premium'

  switch (hint) {
    case 'remotion_layout':
      return detail(
        'remotion',
        'Remotion should plan exact zones, captions, layers, and final composition.',
        [lowerPanelPreferred ? 'premium_lower_panel' : 'clean_social_caption_layout'],
      )
    case 'map_tool':
      return [
        ...detail('maplibre', 'Map visuals need controlled routes, pins, labels, and camera planning.', ['map_route_reveal'], ['remotion']),
        ...detail('turf', 'Geospatial math should prepare bounds, route distances, and geometry for the map.', ['map_route_reveal'], ['maplibre']),
        ...detail('remotion', 'Remotion should composite the planned map visual into the final canvas.', ['map_route_reveal']),
      ]
    case 'chart_tool':
      return [
        ...detail('d3', 'Exact labels, arrows, money flows, and custom diagrams should use controlled chart specs.', ['money_flow_diagram'], ['echarts']),
        ...detail('echarts', 'Standard business charts can fall back to a structured ECharts-style card.', ['money_flow_diagram'], ['d3']),
        ...detail('remotion', 'Remotion should place chart layers and preserve caption safe zones.', ['money_flow_diagram']),
      ]
    case 'browser_capture_tool':
      return [
        ...detail('playwright', 'Approved websites, apps, or dashboards should be captured with browser tooling later.', ['browser_dashboard_capture'], ['remotion']),
        ...detail('sharp', 'Captured screenshots may need resize/crop/format preparation before composition.', ['browser_dashboard_capture']),
        ...detail('remotion', 'Remotion should frame and highlight captured browser assets.', ['browser_dashboard_capture']),
      ]
    case 'color_pipeline':
      return detail(
        'ffmpeg',
        'Color processing should be deterministic and planned as a worker pipeline, not generative AI.',
        [params.editLevel === 'premium' ? 'premium_clean_color_pass' : 'clean_natural_color_pass'],
        params.editLevel === 'premium' ? ['opencolorio'] : [],
      )
    case 'audio_pipeline':
      return [
        ...detail('ffmpeg', 'Voice cleanup and loudness planning should use deterministic audio processing later.', ['voice_cleanup_basic'], ['audioflux']),
        ...(params.editLevel === 'premium'
          ? detail('audioflux', 'Premium SoundSync can plan beat/onset/energy cues for future workers.', ['soundsync_subtle_premium'], ['ffmpeg'])
          : []),
      ]
    case 'qa_vision_tool':
      return detail('opencv', 'Visual QA should check safe zones, crop risks, and panel background matching later.', ['foreground_safe_zone_qa', 'panel_background_match_qa'])
    case 'gpt_image_asset':
    case 'wan_animation':
    case 'hailuo_fallback':
    case 'veo_premium_fallback_only':
    case 'none':
      return []
  }
}
