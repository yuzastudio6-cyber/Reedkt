import type {
  ProjectEditSessionMemoryExtraction,
  ProjectEditSessionMemorySafetyStatus,
} from '../../types/project-edit-session-memory'

const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /service[_-]?role/i,
  /secret/i,
  /password/i,
  /token/i,
  /sk-[a-z0-9_-]+/i,
  /postgres(ql)?:\/\//i,
]

const IDENTITY_PATTERNS = [
  /biometric/i,
  /face\s*id/i,
  /identify\s+(this|that|the)\s+(person|speaker|creator|celebrity)/i,
  /who\s+is\s+(this|that)\s+(person|speaker|creator|celebrity)/i,
  /creator\s+identity/i,
  /celebrity\s+identity/i,
]

const UNRELATED_PERSONAL_PATTERNS = [
  /social security/i,
  /\bssn\b/i,
  /home address/i,
  /medical record/i,
  /credit card/i,
]

function includesPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value))
}

function sensitiveReason(value: string): string | undefined {
  if (includesPattern(value, SECRET_PATTERNS)) return 'secret-like value'
  if (includesPattern(value, IDENTITY_PATTERNS)) return 'identity or biometric guess'
  if (includesPattern(value, UNRELATED_PERSONAL_PATTERNS)) return 'unrelated personal data'
  return undefined
}

export function classifyProjectEditSessionMemorySafety(input: {
  text?: string
  facts?: string[]
  preferences?: string[]
  warnings?: string[]
  requiresModel?: boolean
}): ProjectEditSessionMemorySafetyStatus {
  const values = [
    input.text,
    ...(input.facts ?? []),
    ...(input.preferences ?? []),
    ...(input.warnings ?? []),
  ].filter((value): value is string => Boolean(value))

  if (input.requiresModel) return 'blocked_model_required'
  if (values.some((value) => sensitiveReason(value))) return 'blocked_sensitive'
  return 'safe_mock_update'
}

export function shouldPersistProjectEditSessionMemoryExtraction(
  extraction: ProjectEditSessionMemoryExtraction,
): boolean {
  return extraction.mockOnly
    && extraction.safetyStatus === 'safe_mock_update'
    && extraction.targetLayers.length > 0
    && (
      extraction.extractedFacts.length > 0
      || extraction.extractedPreferences.length > 0
      || extraction.extractedWarnings.length > 0
      || Boolean(extraction.proposedSummary)
    )
}

export function filterSensitiveMemoryFacts(values: string[]): {
  safeValues: string[]
  blockedValues: string[]
  warnings: string[]
} {
  const safeValues: string[] = []
  const blockedValues: string[] = []
  const warnings: string[] = []

  for (const value of values) {
    const reason = sensitiveReason(value)
    if (reason) {
      blockedValues.push(value)
      warnings.push(`Blocked ${reason} from mock memory.`)
    } else {
      safeValues.push(value)
    }
  }

  return { safeValues, blockedValues, warnings }
}

export function createProjectEditSessionMemoryPolicySummary(): {
  summary: string
  blockedCategories: string[]
  mockOnly: true
} {
  return {
    summary: 'Project Edit Session memory uses deterministic mock extraction and blocks secrets, identity guesses, unrelated personal data, and model-required updates.',
    blockedCategories: ['secret-like values', 'identity or biometric guesses', 'unrelated personal data', 'model-required memory'],
    mockOnly: true,
  }
}
