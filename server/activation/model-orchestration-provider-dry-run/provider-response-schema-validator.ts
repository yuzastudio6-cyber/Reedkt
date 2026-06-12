import type { NormalizedProviderResponse, ValidationResult } from './model-provider-dry-run-types'

const REQUIRED_FIELDS: Record<string, string[]> = {
  agent_findings_v1: [
    'caseId',
    'findings',
    'editIntents',
    'blockedDecisions',
    'professionalEditScores',
    'confidence',
    'risks',
    'blockedActions',
    'executionAllowed',
  ],
  coding_spec_proposal_v1: [
    'caseId',
    'proposalSummary',
    'implementationNotes',
    'testsSuggested',
    'riskLevel',
    'blockers',
    'blockedActions',
    'executionAllowed',
  ],
}

function validateResponse(response: NormalizedProviderResponse): ValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (response.status !== 'passed' || !response.normalized) {
    blockers.push(response.blocker ?? 'normalized_response_missing')
  } else {
    for (const field of REQUIRED_FIELDS[response.schemaId] ?? []) {
      if (!(field in response.normalized)) blockers.push(`missing_required_field:${field}`)
    }
    for (const flag of [
      'executionAllowed',
      'toolExecutionAllowed',
      'workerExecutionAllowed',
      'routeExecutionAllowed',
      'publicArtifactsAllowed',
      'signedUrlsAllowed',
      'rawPromptExecutionAllowed',
    ]) {
      if (response.normalized[flag] !== false) blockers.push(`unsafe_boolean_not_false:${flag}`)
    }
    if (!Array.isArray(response.normalized.blockedActions)) blockers.push('blockedActions_not_array')
  }
  return {
    caseId: response.caseId,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    blockers,
    warnings,
  }
}

export function validateProviderResponseSchemas(responses: NormalizedProviderResponse[]): ValidationResult[] {
  return responses.map(validateResponse)
}

export function buildSchemaValidationReport(results: ValidationResult[]) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: results.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
    validationErrorsFailClosed: true,
    results,
    blockers: results.flatMap((result) => result.blockers.map((blocker) => `${result.caseId ?? 'unknown'}:${blocker}`)),
  }
}
