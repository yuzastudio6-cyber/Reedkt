import { assertSFXRealModeAllowed, getSFXProviderConfig } from '../sfx-provider-config'
import type { SFXProviderResult } from '../sfx-provider-contracts'
import type { MMAudioInternalRequest } from './mmaudio-contracts'

export function generateRealMMAudioPlaceholder(request: MMAudioInternalRequest): SFXProviderResult {
  const allowed = assertSFXRealModeAllowed(getSFXProviderConfig({ mode: 'real' }), 'mmaudio_v2')

  if (!allowed.ok) {
    return {
      ...allowed,
      warnings: [
        ...(allowed.warnings ?? []),
        `Prepared MMAudio V2 request for ${request.modelName}, but real transport is disabled in this milestone.`,
      ],
    }
  }

  return {
    ok: false,
    error: {
      code: 'MMAUDIO_REAL_CLIENT_NOT_IMPLEMENTED',
      message: 'Real MMAudio V2 transport placeholder reached. No SDK import or network request is implemented.',
      details: {
        modelName: request.modelName,
        outputFormat: request.outputFormat,
      },
    },
    warnings: [
      'Future implementation point: instantiate backend-only MMAudio V2 SDK or REST transport here after official API docs are reviewed.',
      'Do not add this call to frontend code.',
    ],
  }
}
