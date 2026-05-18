import type {
  LyriaGenerateMusicRequest,
  LyriaIntegrationMode,
  LyriaProviderResult,
} from './lyria-provider-contracts'
import { getLyriaProviderConfig } from './lyria-config'
import { generateMockLyriaMusic } from './lyria-mock-client'
import { generateRealLyriaMusicPlaceholder } from './lyria-real-client-placeholder'

export function generateLyriaMusic(
  request: LyriaGenerateMusicRequest,
  options: { mode?: LyriaIntegrationMode } = {},
): LyriaProviderResult {
  const config = getLyriaProviderConfig({
    mode: options.mode,
    modelName: request.model,
    outputMimeType: request.outputMimeType,
  })

  if (config.mode === 'disabled') {
    return {
      ok: false,
      error: {
        code: 'LYRIA_INTEGRATION_DISABLED',
        message: 'Lyria integration disabled.',
      },
      warnings: ['No mock or real generation was attempted.'],
    }
  }

  if (config.mode === 'real') {
    return generateRealLyriaMusicPlaceholder(request, config)
  }

  return generateMockLyriaMusic(request)
}
