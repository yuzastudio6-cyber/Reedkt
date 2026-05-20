import type {
  SFXGeneratedDurationPolicy,
  SFXPromptPlanRecord,
  SFXPromptStyle,
  SFXEventPlanRecord,
  SFXProviderRouteRecord,
} from '../../types'
import type {
  CreateSFXPromptPlansForEventsRequest,
  CreateSFXPromptPlansForEventsResponse,
  SFXPromptPlanCreationResult,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { isMMAudioProviderKey, normalizeSFXProviderKey } from '../providers/sfx/sfx-provider-contracts'
import { createLibrarySearchPromptPlanFields } from './sfx-library-search-prompt-service'
import { createMMAudioPromptPlanFields } from './sfx-mmaudio-prompt-service'
import { createMireloPromptPlanFields } from './sfx-mirelo-prompt-service'
import { validateSFXPromptPlan } from './sfx-prompt-validation-service'

type PromptAdapterFields = Pick<
  SFXPromptPlanRecord,
  | 'modelName'
  | 'promptStyle'
  | 'prompt'
  | 'negativePrompt'
  | 'librarySearchTags'
  | 'textureWords'
  | 'energyWords'
  | 'styleWords'
  | 'avoidWords'
  | 'timingInstructions'
  | 'mixInstructions'
  | 'promptWarnings'
>

export function chooseSFXPromptStyle(providerRoute: SFXProviderRouteRecord): SFXPromptStyle {
  if (isMMAudioProviderKey(providerRoute.recommendedProvider)) return 'video_conditioned_short_prompt'
  if (providerRoute.recommendedProvider === 'mirelo_sfx_v1_5') return 'structured_sentence'
  if (providerRoute.recommendedProvider === 'reeditpro_internal_library') return 'library_search_tags'
  return 'short_phrase'
}

export function chooseSFXGeneratedDurationPolicy(eventPlan: SFXEventPlanRecord): SFXGeneratedDurationPolicy {
  if (eventPlan.targetLayer === 'ambient_bridge' || eventPlan.targetLayer === 'source_footage_repair') {
    return 'generate_6_to_8_seconds'
  }

  if (eventPlan.targetLayer === 'real_motion' || eventPlan.targetLayer === 'title_card' || eventPlan.targetLayer === 'chapter_card') {
    return 'generate_3_to_5_seconds'
  }

  return 'generate_2_to_3_seconds'
}

export function calculateSFXDurationNeeded(eventPlan: SFXEventPlanRecord): number {
  if (eventPlan.endTimeSeconds !== undefined && eventPlan.startTimeSeconds !== undefined) {
    return Math.max(0.3, Number((eventPlan.endTimeSeconds - eventPlan.startTimeSeconds).toFixed(2)))
  }

  if (eventPlan.targetLayer === 'ambient_bridge' || eventPlan.targetLayer === 'source_footage_repair') return 4
  if (eventPlan.targetLayer === 'real_motion' || eventPlan.targetLayer === 'title_card' || eventPlan.targetLayer === 'chapter_card') return 1.5
  return 0.5
}

export function calculateSFXDurationToGenerate(
  eventPlan: SFXEventPlanRecord,
  providerRoute?: SFXProviderRouteRecord,
): number {
  if (providerRoute?.recommendedProvider === 'reeditpro_internal_library') return 0

  const policy = chooseSFXGeneratedDurationPolicy(eventPlan)
  if (policy === 'generate_6_to_8_seconds') return 7
  if (policy === 'generate_3_to_5_seconds') return 4
  return 2.5
}

export function createSFXPromptWarnings(
  eventPlan: SFXEventPlanRecord,
  providerRoute: SFXProviderRouteRecord,
): string[] {
  const warnings = [
    'Mock prompt plan only; no provider call is made.',
    'Future generation remains blocked until plan approval and credit reservation.',
  ]

  if (providerRoute.recommendedProvider === 'reeditpro_internal_library') {
    warnings.push('Internal library search may return no match at launch.')
  }

  if (eventPlan.sourceFootagePolicy === 'edit_layer_only_default') {
    warnings.push('Prompt must stay tied to edit-layer SFX, not source-action foley.')
  }

  return warnings
}

function adapterFieldsForRoute(
  eventPlan: SFXEventPlanRecord,
  providerRoute: SFXProviderRouteRecord,
): PromptAdapterFields | undefined {
  if (isMMAudioProviderKey(providerRoute.recommendedProvider)) return createMMAudioPromptPlanFields(eventPlan)
  if (providerRoute.recommendedProvider === 'mirelo_sfx_v1_5') return createMireloPromptPlanFields(eventPlan)
  if (providerRoute.recommendedProvider === 'reeditpro_internal_library') {
    return createLibrarySearchPromptPlanFields(eventPlan)
  }

  return undefined
}

export function createSFXPromptPlan(
  db: MockDatabase,
  input: {
    sfxEventPlan: SFXEventPlanRecord
    providerRoute: SFXProviderRouteRecord
    userSFXInstructions?: string[]
    avoidSFXInstructions?: string[]
  },
): ServiceResult<SFXPromptPlanCreationResult> {
  const { sfxEventPlan, providerRoute } = input

  if (
    sfxEventPlan.decisionState === 'avoid' ||
    sfxEventPlan.decisionState === 'not_needed' ||
    providerRoute.recommendedProvider === 'no_sfx'
  ) {
    return ok({
      skippedReason: `No prompt created because SFX decision is ${sfxEventPlan.decisionState} and provider route is ${providerRoute.recommendedProvider}.`,
      warnings: ['No SFX is a valid professional choice.'],
    })
  }

  const adapterFields = adapterFieldsForRoute(sfxEventPlan, providerRoute)
  const promptProvider = normalizeSFXProviderKey(providerRoute.recommendedProvider)

  if (!adapterFields) {
    return ok({
      skippedReason: `No prompt adapter exists for provider ${providerRoute.recommendedProvider}.`,
      warnings: ['Provider route is not promptable in RP-SFX-05.'],
    })
  }

  const promptPlan: SFXPromptPlanRecord = {
    id: createMockId('sfx-prompt-plan'),
    projectId: sfxEventPlan.projectId,
    editPlanId: sfxEventPlan.editPlanId,
    sfxEventPlanId: sfxEventPlan.id,
    providerRouteId: providerRoute.id,
    provider: promptProvider,
    durationNeededSeconds: calculateSFXDurationNeeded(sfxEventPlan),
    durationToGenerateSeconds: calculateSFXDurationToGenerate(sfxEventPlan, providerRoute),
    generatedDurationPolicy: providerRoute.recommendedProvider === 'reeditpro_internal_library'
      ? 'custom'
      : chooseSFXGeneratedDurationPolicy(sfxEventPlan),
    status: 'planned',
    notes: [
      'RP-SFX-05 prompt plan only.',
      'No real provider request, generation, storage, trim, mix, or QA was executed.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noProviderCall: true },
    ...adapterFields,
    promptWarnings: [
      ...adapterFields.promptWarnings,
      ...createSFXPromptWarnings(sfxEventPlan, providerRoute),
    ],
  }
  const validation = validateSFXPromptPlan({
    promptPlan,
    sfxEventPlan,
    providerRoute,
    avoidSFXInstructions: input.avoidSFXInstructions,
  })

  promptPlan.promptWarnings = [
    ...promptPlan.promptWarnings,
    ...validation.warnings,
  ]

  return ok({
    promptPlan: insertMockRecord(db, 'sfxPromptPlans', promptPlan),
    warnings: promptPlan.promptWarnings,
  })
}

export function createSFXPromptPlanFromProviderRoute(
  db: MockDatabase,
  sfxEventPlan: SFXEventPlanRecord,
  providerRoute: SFXProviderRouteRecord,
): ServiceResult<SFXPromptPlanCreationResult> {
  return createSFXPromptPlan(db, { sfxEventPlan, providerRoute })
}

export function createSFXPromptPlansForEvents(
  db: MockDatabase,
  request: CreateSFXPromptPlansForEventsRequest,
): ServiceResult<CreateSFXPromptPlansForEventsResponse> {
  const results = request.sfxEventPlans.map((eventPlan) => {
    const route = request.providerRoutes.find((providerRoute) => providerRoute.sfxEventPlanId === eventPlan.id)

    if (!route) {
      return {
        skippedReason: `No provider route found for SFX event ${eventPlan.id}.`,
        warnings: ['Provider route missing.'],
      } satisfies SFXPromptPlanCreationResult
    }

    const creationResult = createSFXPromptPlan(db, {
      sfxEventPlan: eventPlan,
      providerRoute: route,
      userSFXInstructions: request.userSFXInstructions,
      avoidSFXInstructions: request.avoidSFXInstructions,
    })

    return creationResult.ok
      ? creationResult.data
      : {
          skippedReason: `Prompt creation failed for SFX event ${eventPlan.id}.`,
          warnings: ['Prompt creation returned a service failure.'],
        }
  })
  const sfxPromptPlans = results
    .map((result) => result.promptPlan)
    .filter((promptPlan): promptPlan is SFXPromptPlanRecord => Boolean(promptPlan))
  const skippedPromptPlans = results.filter((result) => result.skippedReason)
  const validationWarnings = results.flatMap((result) => result.warnings)

  return ok({
    sfxPromptPlans,
    skippedPromptPlans,
    validationWarnings,
    nextStep: 'create_sfx_timing_trim_alignment_plan',
    warnings: [
      'RP-SFX-05 creates prompt plans only; RP-SFX-06 handles timing, trim, and hit alignment.',
      'No provider API call was made.',
    ],
  })
}

export function createSFXPromptPlanSummary(response: CreateSFXPromptPlansForEventsResponse): string[] {
  return [
    `${response.sfxPromptPlans.length} SFX prompt plan${response.sfxPromptPlans.length === 1 ? '' : 's'} created.`,
    `${response.skippedPromptPlans.length} SFX prompt plan${response.skippedPromptPlans.length === 1 ? '' : 's'} skipped.`,
    `Next step: ${response.nextStep}.`,
    'All prompt plans are mock-only and provider-specific.',
  ]
}
