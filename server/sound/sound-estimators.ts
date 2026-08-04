export const SOUND_TIME_ESTIMATOR_KEY = 'sound.time.v2' as const
export const SOUND_CREDIT_ESTIMATOR_KEY = 'sound.credit.v2' as const

export function estimateStandaloneSoundTime(input: {
  durationSeconds: number
  localOperationCount: number
  providerRequested: boolean
}) {
  const expectedSeconds = Math.max(1, Math.ceil(
    30 + input.durationSeconds * 0.25 + input.localOperationCount * 15 +
    (input.providerRequested ? 240 : 0),
  ))
  return {
    minimumSeconds: Math.max(1, Math.floor(expectedSeconds * 0.5)),
    expectedSeconds,
    maximumSeconds: expectedSeconds * 3,
    evidence: ['duration', 'local_operation_count', input.providerRequested ? 'provider_route' : 'local_or_no_sound_route'],
  }
}

export function estimateStandaloneSoundCredits(input: {
  providerDurationSeconds: number
  candidateCount: number
  localOperationCount: number
}) {
  const expectedCredits = input.providerDurationSeconds > 0
    ? Math.ceil(input.providerDurationSeconds * input.candidateCount)
    : Math.max(0, input.localOperationCount)
  return {
    minimumCredits: expectedCredits === 0 ? 0 : 1,
    expectedCredits,
    maximumCredits: input.providerDurationSeconds > 0 ? expectedCredits * 2 : expectedCredits,
    internalToolCostOnly: true,
    evidence: ['provider_duration', 'candidate_count', 'local_operation_count'],
  }
}
