import type { ModelProviderDryRunCase, NormalizedProviderResponse, ValidationResult } from './model-provider-dry-run-types'

const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\/[^ \n"'`]+/i,
  /service[_-]?role[_-]?key/i,
  /jwt[_-]?secret/i,
  /sk-[A-Za-z0-9_-]{20,}/,
  /sbp_[A-Za-z0-9_-]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /BEGIN PRIVATE KEY/,
  /x-goog-signature=/i,
  /X-Amz-Signature=/i,
]

const FORBIDDEN_EXECUTION_PATTERNS = [
  /supabase\s+link/i,
  /supabase\s+db\s+push/i,
  /supabase\s+db\s+reset/i,
  /\bpsql\b/i,
  /gcloud\s+run/i,
  /gcloud\s+builds/i,
  /create(?:d)?\s+signed\s+url/i,
  /signed\s+url(?:s)?\s+(?:approved|enabled|as\s+source\s+of\s+truth)/i,
  /public\s+artifact(?:s)?\s+(?:approved|enabled|created)/i,
  /worker\s+execution\s+approved/i,
  /production\s+approved/i,
  /external\s+beta\s+approved/i,
]

function scanText(text: string): string[] {
  const blockers: string[] = []
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) blockers.push(`secret_like_pattern:${pattern.source}`)
  }
  for (const pattern of FORBIDDEN_EXECUTION_PATTERNS) {
    if (pattern.test(text)) blockers.push(`unsafe_execution_claim:${pattern.source}`)
  }
  return blockers
}

export function validateDryRunRequestRedaction(cases: ModelProviderDryRunCase[]): ValidationResult {
  const blockers = cases.flatMap((dryRunCase) => [
    ...scanText(dryRunCase.systemPrompt).map((blocker) => `${dryRunCase.caseId}:system:${blocker}`),
    ...scanText(dryRunCase.userPrompt).map((blocker) => `${dryRunCase.caseId}:user:${blocker}`),
  ])
  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    blockers,
    warnings: [],
  }
}

export function validateDryRunResponseRedaction(responses: NormalizedProviderResponse[]): ValidationResult[] {
  return responses.map((response) => {
    const text = JSON.stringify(response.normalized ?? response.parsed ?? {})
    const blockers = scanText(text)
    return {
      caseId: response.caseId,
      status: blockers.length === 0 ? 'passed' : 'blocked',
      blockers,
      warnings: [],
    }
  })
}

export function buildRequestRedactionReport(result: ValidationResult) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: result.status,
    promptsSyntheticOnly: true,
    userDataAllowed: false,
    rawMediaAllowed: false,
    signedUrlsAllowed: false,
    privateUrlsAllowed: false,
    blockers: result.blockers,
  }
}

export function buildResponseRedactionReport(results: ValidationResult[]) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: results.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
    rawProviderResponsesCommitted: false,
    normalizedSyntheticResponsesOnly: true,
    results,
    blockers: results.flatMap((result) => result.blockers.map((blocker) => `${result.caseId ?? 'unknown'}:${blocker}`)),
  }
}
