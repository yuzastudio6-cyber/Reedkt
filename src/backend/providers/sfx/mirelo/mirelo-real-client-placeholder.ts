import { assertSFXRealModeAllowed, getSFXProviderConfig } from '../sfx-provider-config'
import type { SFXProviderResult } from '../sfx-provider-contracts'
import type { MireloSFXInternalRequest } from './mirelo-contracts'

export function generateRealMireloSFXPlaceholder(request: MireloSFXInternalRequest): SFXProviderResult {
  const allowed = assertSFXRealModeAllowed(getSFXProviderConfig({ mode: 'real' }), 'mirelo_sfx_v1_5')

  if (!allowed.ok) {
    return {
      ...allowed,
      warnings: [
        ...(allowed.warnings ?? []),
        `Prepared Mirelo request for ${request.modelName}, but real transport is disabled in this milestone.`,
      ],
    }
  }

  return {
    ok: false,
    error: {
      code: 'MIRELO_REAL_CLIENT_NOT_IMPLEMENTED',
      message: 'Real Mirelo transport placeholder reached. No SDK import or network request is implemented.',
      details: {
        modelName: request.modelName,
        outputFormat: request.outputFormat,
      },
    },
    warnings: [
      'Future implementation point: instantiate backend-only Mirelo SDK or REST transport here after official API docs are reviewed.',
      'Do not add this call to frontend code.',
    ],
  }
}
