import type { ModelProviderDryRunCase, NormalizedProviderResponse, ProviderCallResult } from './model-provider-dry-run-types'

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null
  } catch {
    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    if (firstBrace < 0 || lastBrace <= firstBrace) return null
    try {
      const parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1)) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null
    } catch {
      return null
    }
  }
}

export function normalizeProviderResponse(
  dryRunCase: ModelProviderDryRunCase,
  result: ProviderCallResult,
): NormalizedProviderResponse {
  if (result.status !== 'passed' || !result.rawContent) {
    return {
      caseId: dryRunCase.caseId,
      providerId: dryRunCase.providerId,
      modelId: dryRunCase.modelId,
      schemaId: dryRunCase.schemaId,
      status: 'blocked',
      parsed: null,
      normalized: null,
      blocker: result.blocker ?? 'provider_result_missing_content',
    }
  }
  const parsed = parseJsonObject(result.rawContent)
  if (!parsed) {
    return {
      caseId: dryRunCase.caseId,
      providerId: dryRunCase.providerId,
      modelId: dryRunCase.modelId,
      schemaId: dryRunCase.schemaId,
      status: 'blocked',
      parsed: null,
      normalized: null,
      blocker: 'invalid_json_response',
    }
  }

  return {
    caseId: dryRunCase.caseId,
    providerId: dryRunCase.providerId,
    modelId: dryRunCase.modelId,
    schemaId: dryRunCase.schemaId,
    status: 'passed',
    parsed,
    normalized: {
      ...parsed,
      caseId: String(parsed.caseId ?? dryRunCase.caseId),
      blockedActions: Array.isArray(parsed.blockedActions) ? parsed.blockedActions : dryRunCase.blockedActions,
      executionAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      routeExecutionAllowed: false,
      publicArtifactsAllowed: false,
      signedUrlsAllowed: false,
      rawPromptExecutionAllowed: false,
    },
  }
}

export function buildNormalizedResponseReport(responses: NormalizedProviderResponse[]) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: responses.every((response) => response.status === 'passed') ? 'passed' : 'blocked',
    rawProviderResponsesCommitted: false,
    normalizedResponseCount: responses.length,
    responses: responses.map((response) => ({
      caseId: response.caseId,
      providerId: response.providerId,
      modelId: response.modelId,
      schemaId: response.schemaId,
      status: response.status,
      blocker: response.blocker,
      normalizedKeys: response.normalized ? Object.keys(response.normalized).sort() : [],
      executionAllowed: false,
      rawProviderResponseIncluded: false,
    })),
    blockers: responses.flatMap((response) => response.blocker ? [`${response.caseId}:${response.blocker}`] : []),
  }
}
