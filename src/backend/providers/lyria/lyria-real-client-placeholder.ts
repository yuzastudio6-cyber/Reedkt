import type {
  LyriaGenerateMusicRequest,
  LyriaProviderConfig,
  LyriaProviderResult,
} from './lyria-provider-contracts'
import { assertLyriaRealModeAllowed } from './lyria-config'

export function generateRealLyriaMusicPlaceholder(
  request: LyriaGenerateMusicRequest,
  config: LyriaProviderConfig,
): LyriaProviderResult {
  const allowed = assertLyriaRealModeAllowed(config)

  if (!allowed.ok) {
    return {
      ...allowed,
      warnings: [
        ...(allowed.warnings ?? []),
        `Prepared request for ${request.model}, but real transport is disabled in this milestone.`,
      ],
    }
  }

  return {
    ok: false,
    error: {
      code: 'LYRIA_REAL_CLIENT_NOT_IMPLEMENTED',
      message: 'Real Lyria transport placeholder reached. No SDK import or network request is implemented.',
      details: {
        model: request.model,
        outputMimeType: request.outputMimeType,
      },
    },
    warnings: [
      'Future implementation point: instantiate backend-only Google GenAI client or REST transport here.',
      'Do not add this call to frontend code.',
    ],
  }
}
