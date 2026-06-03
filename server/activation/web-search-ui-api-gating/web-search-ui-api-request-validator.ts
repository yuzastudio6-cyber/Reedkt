import { z } from 'zod'
import type { WebSearchUiApiRequest, WebSearchUiApiValidationResult } from './web-search-ui-api-gating-types'

export const webSearchUiApiRequestSchema = z.object({
  workspaceId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  query: z.string().min(3).max(160).default('ReeditPro web search/capture internal gating fixture'),
  providerMode: z.literal('private_fixture_provider').default('private_fixture_provider'),
  maxResults: z.number().int().min(1).max(3).default(3),
  maxCapturePages: z.literal(0).default(0),
  mockOnly: z.literal(true).default(true),
  rawPromptExecution: z.literal(false).default(false),
  paidProvidersAllowed: z.literal(false).default(false),
  publicSearxngAllowed: z.literal(false).default(false),
  arbitraryUrlCaptureAllowed: z.literal(false).default(false),
  broadCrawlingAllowed: z.literal(false).default(false),
  publicArtifactAllowed: z.literal(false).default(false),
  signedUrlSourceOfTruthAllowed: z.literal(false).default(false),
  productionReadyAllowed: z.literal(false).default(false),
  externalBetaAllowed: z.literal(false).default(false),
  paidProductionAllowed: z.literal(false).default(false),
  broadMediaAllowed: z.literal(false).default(false),
  frontendExecutionRequested: z.literal(false).default(false),
  browserExecutionRequested: z.literal(false).default(false),
  liveSearchRequested: z.literal(false).default(false),
  captureRequested: z.literal(false).default(false),
  extractionRequested: z.literal(false).default(false),
}).strict()

export function validateWebSearchUiApiRequest(value: unknown): WebSearchUiApiValidationResult {
  const result = webSearchUiApiRequestSchema.safeParse(value ?? {})
  if (!result.success) {
    return {
      ok: false,
      blockers: result.error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`),
      warnings: [],
    }
  }

  return validateParsedWebSearchUiApiRequest(result.data as WebSearchUiApiRequest)
}

function validateParsedWebSearchUiApiRequest(request: WebSearchUiApiRequest): WebSearchUiApiValidationResult {
  const blockers = [
    request.providerMode !== 'private_fixture_provider' ? 'Only providerMode=private_fixture_provider is accepted in Phase 49I.' : '',
    request.maxResults > 3 ? 'maxResults must be <= 3 in Phase 49I.' : '',
    request.maxCapturePages !== 0 ? 'maxCapturePages must be 0 in Phase 49I.' : '',
    request.mockOnly !== true ? 'mockOnly=true is required in Phase 49I.' : '',
    request.rawPromptExecution ? 'rawPromptExecution must be false.' : '',
    request.paidProvidersAllowed ? 'paidProvidersAllowed must be false.' : '',
    request.publicSearxngAllowed ? 'publicSearxngAllowed must be false.' : '',
    request.arbitraryUrlCaptureAllowed ? 'arbitraryUrlCaptureAllowed must be false.' : '',
    request.broadCrawlingAllowed ? 'broadCrawlingAllowed must be false.' : '',
    request.publicArtifactAllowed ? 'publicArtifactAllowed must be false.' : '',
    request.signedUrlSourceOfTruthAllowed ? 'signedUrlSourceOfTruthAllowed must be false.' : '',
    request.productionReadyAllowed ? 'productionReadyAllowed must be false.' : '',
    request.externalBetaAllowed ? 'externalBetaAllowed must be false.' : '',
    request.paidProductionAllowed ? 'paidProductionAllowed must be false.' : '',
    request.broadMediaAllowed ? 'broadMediaAllowed must be false.' : '',
    request.frontendExecutionRequested ? 'frontendExecutionRequested must be false.' : '',
    request.browserExecutionRequested ? 'browserExecutionRequested must be false.' : '',
    request.liveSearchRequested ? 'liveSearchRequested must be false.' : '',
    request.captureRequested ? 'captureRequested must be false.' : '',
    request.extractionRequested ? 'extractionRequested must be false.' : '',
  ].filter(Boolean)

  return {
    ok: blockers.length === 0,
    request,
    blockers,
    warnings: ['Phase 49I accepts this request as an internal gate-only contract; no live search, capture, extraction, or upload is performed by the API route.'],
  }
}
