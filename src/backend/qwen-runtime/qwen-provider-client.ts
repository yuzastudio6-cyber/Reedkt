import type { QwenProviderTransportRequest, QwenProviderTransportResult } from '../../types'
import { sendQwenProviderTransportRequest } from './qwen-provider-transport'

export interface QwenProviderClient {
  sendStructuredMarkerChatRequest(input: {
    request: QwenProviderTransportRequest
    apiKey: string
  }): Promise<QwenProviderTransportResult>
}

export function createQwenProviderClient(fetchImpl?: typeof fetch): QwenProviderClient {
  return {
    sendStructuredMarkerChatRequest: (input) =>
      sendQwenProviderTransportRequest({
        request: input.request,
        apiKey: input.apiKey,
        fetchImpl,
      }),
  }
}
