import type { ProductionMode } from '../../../src/types/motion-studio'
import {
  PRODUCTION_TOOL_IDS,
  listProductionToolProfiles,
  type ProductionToolCategory,
  type ProductionToolId,
  type ProductionToolProfile,
} from '../../tool-registry'

export type MotionStudioToolDisposition =
  | 'reuse_existing_profile'
  | 'qa_or_readiness_only'
  | 'defer_with_preserved_contract'

export interface MotionStudioToolCapabilityMapping {
  toolId: ProductionToolId
  productionModes: ProductionMode[]
  skillDomainIds: string[]
  sceneRecipeIds: string[]
  inputArtifacts: string[]
  outputArtifacts: string[]
  registryStatus: ProductionToolProfile['productionStatus']
  executionMode: ProductionToolProfile['executionMode']
  workerType: ProductionToolProfile['workerType']
  qaRequirements: string[]
  fallbackToolIds: ProductionToolId[]
  license: {
    name: string
    family: string
    risk: string
    commercialUseStatus: string
  }
  modelWeights: {
    required: boolean
    reviewStatus: string
    commercialUseStatus: string
  }
  disposition: MotionStudioToolDisposition
  productReady: false
}

function modesForCategory(category: ProductionToolCategory): ProductionMode[] {
  if (['render_composition', 'captions', 'maps_geospatial', 'charts_dataviz', 'motion_graphics'].includes(category)) {
    return ['native_graphics_first', 'hybrid_directed']
  }
  if (['background_removal', 'segmentation_tracking', 'mask_refinement', 'image_processing', 'enhancement'].includes(category)) {
    return ['layered_first', 'hybrid_directed']
  }
  if (['audio_cleanup', 'audio_analysis', 'music_midi', 'music_separation'].includes(category)) {
    return ['footage_first', 'hybrid_directed']
  }
  if (['core_media', 'timeline', 'color_management', 'scene_detection', 'speech_transcription'].includes(category)) {
    return ['footage_first', 'native_graphics_first', 'hybrid_directed']
  }
  if (['visual_analysis', 'ocr', 'frame_interpolation'].includes(category)) {
    return ['generative_first', 'layered_first', 'hybrid_directed']
  }
  return ['hybrid_directed']
}

function domainsForCategory(category: ProductionToolCategory): string[] {
  const mapping: Partial<Record<ProductionToolCategory, string[]>> = {
    audio_analysis: ['motion_studio.domain.music', 'motion_studio.domain.synchronized_foley'],
    audio_cleanup: ['motion_studio.domain.voice', 'motion_studio.domain.editing'],
    background_removal: ['motion_studio.domain.layered_motion'],
    browser_capture: ['motion_studio.domain.visual_asset_research', 'motion_studio.domain.native_graphic_design'],
    captions: ['motion_studio.domain.editing', 'motion_studio.domain.delivery'],
    charts_dataviz: ['motion_studio.domain.native_graphic_design'],
    color_management: ['motion_studio.domain.footage_motion'],
    core_media: ['motion_studio.domain.editing', 'motion_studio.domain.delivery'],
    enhancement: ['motion_studio.domain.footage_motion'],
    frame_interpolation: ['motion_studio.domain.generative_motion'],
    image_processing: ['motion_studio.domain.layered_motion', 'motion_studio.domain.native_graphic_design'],
    maps_geospatial: ['motion_studio.domain.native_graphic_design'],
    mask_refinement: ['motion_studio.domain.layered_motion'],
    motion_graphics: ['motion_studio.domain.native_graphic_design', 'motion_studio.domain.hybrid_composition'],
    music_midi: ['motion_studio.domain.music'],
    music_separation: ['motion_studio.domain.music'],
    ocr: ['motion_studio.domain.visual_asset_research'],
    qa: ['motion_studio.domain.quality_control'],
    render_composition: ['motion_studio.domain.native_graphic_design', 'motion_studio.domain.delivery'],
    scene_detection: ['motion_studio.domain.project_understanding'],
    segmentation_tracking: ['motion_studio.domain.layered_motion'],
    speech_transcription: ['motion_studio.domain.voice', 'motion_studio.domain.story_and_script_development'],
    timeline: ['motion_studio.domain.editing', 'motion_studio.domain.delivery'],
    visual_analysis: ['motion_studio.domain.visual_asset_research', 'motion_studio.domain.reference_intelligence'],
    evaluation: ['motion_studio.domain.quality_control'],
  }
  return mapping[category] ?? ['motion_studio.domain.hybrid_composition']
}

function recipesForCategory(category: ProductionToolCategory): string[] {
  if (category === 'maps_geospatial') return ['recipe.native_map']
  if (category === 'charts_dataviz') return ['recipe.native_chart']
  if (category === 'motion_graphics' || category === 'render_composition') return ['recipe.native_motion', 'recipe.hybrid_scene']
  if (['background_removal', 'segmentation_tracking', 'mask_refinement', 'image_processing'].includes(category)) return ['recipe.layered_image_motion']
  if (['audio_cleanup', 'audio_analysis', 'music_midi', 'music_separation'].includes(category)) return ['recipe.sound_music']
  if (category === 'core_media' || category === 'timeline' || category === 'color_management') return ['recipe.footage_edit', 'recipe.delivery_package']
  return ['recipe.hybrid_scene']
}

function dispositionForProfile(profile: ProductionToolProfile): MotionStudioToolDisposition {
  if (profile.executionMode === 'qa_only' || profile.executionMode === 'readiness_check') return 'qa_or_readiness_only'
  if (['blocked', 'evaluation_only', 'needs_license_review', 'future'].includes(profile.productionStatus)) return 'defer_with_preserved_contract'
  return 'reuse_existing_profile'
}

export function listMotionStudioToolCapabilityMappings(): MotionStudioToolCapabilityMapping[] {
  return listProductionToolProfiles().map((profile) => ({
    toolId: profile.toolId,
    productionModes: modesForCategory(profile.category),
    skillDomainIds: domainsForCategory(profile.category),
    sceneRecipeIds: recipesForCategory(profile.category),
    inputArtifacts: [...profile.inputTypes],
    outputArtifacts: [...profile.outputTypes],
    registryStatus: profile.productionStatus,
    executionMode: profile.executionMode,
    workerType: profile.workerType,
    qaRequirements: [...profile.qaResponsibilities],
    fallbackToolIds: [...profile.fallbackToolIds],
    license: {
      name: profile.license,
      family: profile.licenseFamily,
      risk: profile.licenseRisk,
      commercialUseStatus: profile.commercialUseStatus,
    },
    modelWeights: {
      required: profile.modelWeightPolicy.required,
      reviewStatus: profile.modelWeightPolicy.reviewStatus,
      commercialUseStatus: profile.modelWeightPolicy.commercialUseStatus,
    },
    disposition: dispositionForProfile(profile),
    productReady: false,
  }))
}

export function motionStudioToolMappingIds(): readonly ProductionToolId[] {
  const mappings = listMotionStudioToolCapabilityMappings()
  const byId = new Map(mappings.map((mapping) => [mapping.toolId, mapping]))
  return PRODUCTION_TOOL_IDS.filter((toolId) => byId.has(toolId))
}
