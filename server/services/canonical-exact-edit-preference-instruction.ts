import type {
  CanonicalExactEditPlanningAuthorityRead,
} from '../../src/types/canonical-exact-edit-planning-authority'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from './private-edit-authority-store'

const EXACT_EDIT_PREFERENCE_KEYS = [
  'editLevel',
  'workflowType',
  'cleanupPreference',
  'visualPreference',
  'moodStyle',
  'creditPreference',
  'targetPlatform',
] as const

type PreferenceValues = CanonicalExactEditPlanningAuthorityRead['values']
type PreferenceKey = (typeof EXACT_EDIT_PREFERENCE_KEYS)[number]

export interface ResolvedCanonicalExactEditPreferenceInstruction {
  source: 'current_edit_preferences' | 'explicit_chat_setup'
  effectiveValues: PreferenceValues
  overrideKeys: PreferenceKey[]
  overrides: Partial<PreferenceValues>
  instructionHash: string
}

/**
 * Resolves one exact saved preference baseline plus a bounded plan-scoped
 * structured Chat instruction.
 *
 * The instruction is planning input only. It cannot mutate Current Edit
 * Preferences, grant browser authority, or replace the server-side read.
 */
export function resolveCanonicalExactEditPreferenceInstruction(input: {
  authority: CanonicalExactEditPlanningAuthorityRead
  components: CanonicalPlanComponentsInput
}): ResolvedCanonicalExactEditPreferenceInstruction {
  const { authority, components } = input
  const instruction = components.exactEditPreferenceInstruction

  if (!instruction) {
    assertCanonicalSettingsMatchEffectiveValues(components, authority.values)
    const resolved = {
      source: 'current_edit_preferences' as const,
      effectiveValues: structuredClone(authority.values),
      overrideKeys: [] as PreferenceKey[],
      overrides: {} as Partial<PreferenceValues>,
    }
    return {
      ...resolved,
      instructionHash: sha256AuthorityValue(resolved),
    }
  }

  if (
    instruction.browserMutationAuthorityGranted !== false ||
    instruction.base.preferenceRevision !== authority.preferenceRevision ||
    instruction.base.planningInputRevision !== authority.planningInputRevision ||
    instruction.base.preferenceFingerprintSha256
      !== authority.preferenceFingerprintSha256 ||
    instruction.base.preferenceSnapshotId
      !== authority.baseline.preferenceSnapshotId
  ) {
    throw stalePreferenceInstruction(
      'The structured Chat instruction was compiled from stale Current Edit Preferences.',
    )
  }

  const expectedOverrideKeys = EXACT_EDIT_PREFERENCE_KEYS.filter(
    (key) => authority.values[key] !== instruction.effectiveValues[key],
  )
  if (
    expectedOverrideKeys.length !== instruction.overrideKeys.length ||
    expectedOverrideKeys.some((key, index) => key !== instruction.overrideKeys[index])
  ) {
    throw invalidPreferenceInstruction(
      'The structured Chat preference override keys do not match the effective plan values.',
    )
  }

  for (const key of EXACT_EDIT_PREFERENCE_KEYS) {
    const overridePresent = Object.hasOwn(instruction.overrides, key)
    const expectedOverride = expectedOverrideKeys.includes(key)
    if (
      overridePresent !== expectedOverride ||
      (expectedOverride && instruction.overrides[key] !== instruction.effectiveValues[key])
    ) {
      throw invalidPreferenceInstruction(
        'The structured Chat preference override payload is inconsistent.',
      )
    }
  }

  const expectedSource = expectedOverrideKeys.length > 0
    ? 'explicit_chat_setup'
    : 'current_edit_preferences'
  if (instruction.source !== expectedSource) {
    throw invalidPreferenceInstruction(
      'The structured Chat preference instruction source is inconsistent.',
    )
  }

  assertCanonicalSettingsMatchEffectiveValues(
    components,
    instruction.effectiveValues,
  )
  const resolved = {
    source: instruction.source,
    effectiveValues: structuredClone(instruction.effectiveValues),
    overrideKeys: [...instruction.overrideKeys],
    overrides: structuredClone(instruction.overrides),
  }
  return {
    ...resolved,
    instructionHash: sha256AuthorityValue(resolved),
  }
}

function assertCanonicalSettingsMatchEffectiveValues(
  components: CanonicalPlanComponentsInput,
  effectiveValues: PreferenceValues,
): void {
  if (
    components.confirmedSettings.editLevel !== effectiveValues.editLevel ||
    components.confirmedSettings.targetPlatform !== effectiveValues.targetPlatform ||
    components.sourceCleanupSummary.cleanupPreference
      !== effectiveValues.cleanupPreference
  ) {
    throw invalidPreferenceInstruction(
      'Canonical confirmed settings do not match the resolved Current Edit Preference and Chat instruction precedence.',
    )
  }
}

function stalePreferenceInstruction(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredFlow: 'refresh_exact_edit_then_replan',
  })
}

function invalidPreferenceInstruction(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    browserPreferenceMutationAuthorityGranted: false,
  })
}
