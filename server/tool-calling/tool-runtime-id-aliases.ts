import {
  isProductionToolId,
} from '../tool-registry'
import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  RuntimeIdReconciliationResult,
  RuntimeToolIdAliasDefinition,
} from './tool-capability-card-types'

export const RUNTIME_TOOL_ID_ALIASES = [
  {
    alias: 'sharp_libvips',
    runtimeToolId: 'sharp',
    reason: 'Sharp is the first-class ProductionToolId for the libvips-backed image pipeline.',
  },
  {
    alias: 'polars_nodejs_polars',
    runtimeToolId: 'polars',
    reason: 'Polars is the first-class ProductionToolId for Node.js Polars analytics usage.',
  },
  {
    alias: 'remotion_render_validation',
    runtimeToolId: 'remotion',
    reason: 'Remotion is the first-class ProductionToolId for render composition and validation planning.',
  },
  {
    alias: 'opentimelineio_timeline_validation',
    runtimeToolId: 'opentimelineio',
    reason: 'OpenTimelineIO is the first-class ProductionToolId for timeline validation planning.',
  },
  {
    alias: 'libass_caption_burnin',
    runtimeToolId: 'libass',
    reason: 'Libass is the first-class ProductionToolId for ASS subtitle burn-in planning.',
  },
  {
    alias: 'film_frame_interpolation',
    runtimeToolId: 'film',
    reason: 'FILM is the first-class ProductionToolId for frame interpolation planning.',
  },
  {
    alias: 'imagemagick_graphicsmagick',
    runtimeToolId: 'imagemagick',
    externalToolId: 'imagemagick',
    reason: 'ImageMagick/GraphicsMagick are proven external image tools but are not first-class ProductionToolId entries on this base.',
  },
  {
    alias: 'mediainfo',
    runtimeToolId: 'mediainfo',
    externalToolId: 'mediainfo',
    reason: 'MediaInfo is a proven metadata tool but is not a first-class ProductionToolId entry on this base.',
  },
  {
    alias: 'exiftool',
    runtimeToolId: 'exiftool',
    externalToolId: 'exiftool',
    reason: 'ExifTool is a proven metadata tool but is not a first-class ProductionToolId entry on this base.',
  },
  {
    alias: 'tesseract',
    runtimeToolId: 'tesseract',
    externalToolId: 'tesseract',
    reason: 'Tesseract is a proven OCR tool but is not a first-class ProductionToolId entry on this base.',
  },
  {
    alias: 'opencolorio',
    runtimeToolId: 'opencolorio',
    reason: 'OpenColorIO already resolves to the first-class ProductionToolId on this base.',
  },
  {
    alias: 'openimageio',
    runtimeToolId: 'openimageio',
    reason: 'OpenImageIO already resolves to the first-class ProductionToolId on this base.',
  },
] as const satisfies readonly RuntimeToolIdAliasDefinition[]

const aliasByInput = new Map<string, RuntimeToolIdAliasDefinition>(
  RUNTIME_TOOL_ID_ALIASES.map((definition) => [definition.alias, definition]),
)

function aliasesForRuntimeToolId(toolId: ProductionToolId): string[] {
  return RUNTIME_TOOL_ID_ALIASES
    .filter((definition) => definition.runtimeToolId === toolId)
    .map((definition) => definition.alias)
    .sort()
}

function pendingResolution(
  inputToolId: string,
  externalToolId: string,
  aliases: readonly string[],
  reason: string,
): RuntimeIdReconciliationResult {
  return {
    inputToolId,
    status: 'pending_production_tool_registry_expansion',
    externalToolId,
    aliases,
    reason,
    firstClassProductionToolId: false,
    selectableAsRuntimeTool: false,
  }
}

export function resolveRuntimeToolId(toolIdOrAlias: string): RuntimeIdReconciliationResult {
  const aliasDefinition = aliasByInput.get(toolIdOrAlias)
  if (aliasDefinition) {
    const runtimeToolId = aliasDefinition.runtimeToolId
    if (runtimeToolId && isProductionToolId(runtimeToolId)) {
      return {
        inputToolId: toolIdOrAlias,
        status: 'alias_resolved_to_production_tool_id',
        toolId: runtimeToolId,
        aliases: [aliasDefinition.alias],
        reason: aliasDefinition.reason,
        firstClassProductionToolId: true,
        selectableAsRuntimeTool: true,
      }
    }

    return pendingResolution(
      toolIdOrAlias,
      aliasDefinition.externalToolId ?? runtimeToolId ?? toolIdOrAlias,
      [aliasDefinition.alias],
      aliasDefinition.reason,
    )
  }

  if (isProductionToolId(toolIdOrAlias)) {
    return {
      inputToolId: toolIdOrAlias,
      status: 'first_class_production_tool_id',
      toolId: toolIdOrAlias,
      aliases: aliasesForRuntimeToolId(toolIdOrAlias),
      reason: 'Input is already a first-class ProductionToolId.',
      firstClassProductionToolId: true,
      selectableAsRuntimeTool: true,
    }
  }

  return pendingResolution(
    toolIdOrAlias,
    toolIdOrAlias,
    [],
    'Input is not a first-class ProductionToolId on this base.',
  )
}

export function listRuntimeIdReconciliationResults(): RuntimeIdReconciliationResult[] {
  return RUNTIME_TOOL_ID_ALIASES
    .map((definition) => resolveRuntimeToolId(definition.alias))
    .sort((left, right) => left.inputToolId.localeCompare(right.inputToolId))
}
