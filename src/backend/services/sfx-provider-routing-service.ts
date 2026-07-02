import type {
  SFXCostSensitivity,
  SFXProvider,
  SFXProviderRole,
  SFXProviderRouteRecord,
  SFXQualityTarget,
  SFXEventPlanRecord,
} from '../../types'
import type { EditComplexity } from '../../types/planning'
import type { EditQualityLevel } from '../../types/edit-quality'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { normalizeEditQualityLevel } from './sfx-decision-policy-service'

export interface SFXProviderRoutingInput {
  editComplexity?: EditComplexity | EditQualityLevel
  userPrompt?: string
  videoType?: string
  speechPresent?: boolean
}

interface SFXProviderRouteChoice {
  recommendedProvider: SFXProvider
  providerRole: SFXProviderRole
  fallbackProvider?: SFXProvider
  reason: string
  useInternalLibraryFirst: boolean
  useMMAudioForDraft: boolean
  useMireloForProduction: boolean
  noSfxAllowed: boolean
  costSensitivity: SFXCostSensitivity
  qualityTarget: SFXQualityTarget
  approvalRequired: boolean
  notes: string[]
}

function isImportantProductionMoment(eventPlan: SFXEventPlanRecord): boolean {
  return eventPlan.decisionState === 'needed' ||
    ['stroke_motion', 'real_motion', 'title_card', 'chapter_card', 'montage_hit'].includes(eventPlan.targetLayer)
}

export function shouldUseInternalLibraryFirst(eventPlan: SFXEventPlanRecord): boolean {
  return eventPlan.decisionState !== 'avoid' && eventPlan.decisionState !== 'not_needed'
}

export function shouldUseMMAudioDraft(
  eventPlan: SFXEventPlanRecord,
  input: SFXProviderRoutingInput = {},
): boolean {
  const level = normalizeEditQualityLevel(input.editComplexity ?? eventPlan.editLevel)

  return eventPlan.decisionState !== 'avoid' &&
    eventPlan.decisionState !== 'not_needed' &&
    (level === 'basic' || level === 'pro' || eventPlan.targetLayer === 'real_motion' || eventPlan.targetLayer === 'ambient_bridge')
}

export function shouldUseMireloProduction(
  eventPlan: SFXEventPlanRecord,
  input: SFXProviderRoutingInput = {},
): boolean {
  const level = normalizeEditQualityLevel(input.editComplexity ?? eventPlan.editLevel)

  return (level === 'signature' || level === 'premium_signature' || isImportantProductionMoment(eventPlan)) &&
    eventPlan.decisionState !== 'avoid' &&
    eventPlan.decisionState !== 'not_needed'
}

export function chooseProviderForBasicEdit(eventPlan: SFXEventPlanRecord): SFXProviderRouteChoice {
  if (eventPlan.decisionState === 'avoid' || eventPlan.decisionState === 'not_needed') {
    return createNoSFXProviderRouteChoice(eventPlan)
  }

  return {
    recommendedProvider: 'reeditpro_internal_library',
    providerRole: 'internal_library_first_choice',
    fallbackProvider: 'mmaudio_v2',
    reason: 'Basic edits use library-first SFX and cheap draft fallback only when a subtle cue is justified.',
    useInternalLibraryFirst: true,
    useMMAudioForDraft: true,
    useMireloForProduction: false,
    noSfxAllowed: true,
    costSensitivity: 'lowest_cost',
    qualityTarget: 'preview',
    approvalRequired: true,
    notes: ['Mirelo is not the default for Basic SFX planning.'],
  }
}

export function chooseProviderForProEdit(eventPlan: SFXEventPlanRecord): SFXProviderRouteChoice {
  if (eventPlan.decisionState === 'avoid' || eventPlan.decisionState === 'not_needed') {
    return createNoSFXProviderRouteChoice(eventPlan)
  }

  const important = isImportantProductionMoment(eventPlan)

  return {
    recommendedProvider: important ? 'mirelo_sfx_v1_5' : 'reeditpro_internal_library',
    providerRole: important ? 'production_final' : 'internal_library_first_choice',
    fallbackProvider: 'mmaudio_v2',
    reason: important
      ? 'Pro can plan Mirelo for clearly important production polish, with approval and credits later.'
      : 'Pro uses library-first SFX with MMAudio V2 as draft or fallback.',
    useInternalLibraryFirst: true,
    useMMAudioForDraft: true,
    useMireloForProduction: important,
    noSfxAllowed: true,
    costSensitivity: important ? 'balanced' : 'lowest_cost',
    qualityTarget: important ? 'production' : 'preview',
    approvalRequired: true,
    notes: ['Provider route is mock-only and does not call Mirelo or MMAudio.'],
  }
}

export function chooseProviderForSignatureEdit(eventPlan: SFXEventPlanRecord): SFXProviderRouteChoice {
  if (eventPlan.decisionState === 'avoid' || eventPlan.decisionState === 'not_needed') {
    return createNoSFXProviderRouteChoice(eventPlan)
  }

  return {
    recommendedProvider: shouldUseMireloProduction(eventPlan, { editComplexity: 'signature' })
      ? 'mirelo_sfx_v1_5'
      : 'reeditpro_internal_library',
    providerRole: isImportantProductionMoment(eventPlan) ? 'production_final' : 'internal_library_first_choice',
    fallbackProvider: 'mmaudio_v2',
    reason: 'Signature edits use Mirelo for key Stroke Motion, Graphic Design, Real Motion, title, and transition moments; MMAudio V2 can draft timing.',
    useInternalLibraryFirst: true,
    useMMAudioForDraft: true,
    useMireloForProduction: true,
    noSfxAllowed: true,
    costSensitivity: 'balanced',
    qualityTarget: 'production',
    approvalRequired: true,
    notes: ['No real provider request is built in RP-SFX-04.'],
  }
}

export function chooseProviderForPremiumEdit(eventPlan: SFXEventPlanRecord): SFXProviderRouteChoice {
  if (eventPlan.decisionState === 'avoid' || eventPlan.decisionState === 'not_needed') {
    return createNoSFXProviderRouteChoice(eventPlan)
  }

  return {
    recommendedProvider: 'mirelo_sfx_v1_5',
    providerRole: 'premium_signature',
    fallbackProvider: 'mmaudio_v2',
    reason: 'Premium signature edits can plan Mirelo production SFX for key moments, with library reuse for common cues and MMAudio V2 for drafts.',
    useInternalLibraryFirst: true,
    useMMAudioForDraft: true,
    useMireloForProduction: true,
    noSfxAllowed: true,
    costSensitivity: 'premium_allowed',
    qualityTarget: 'premium',
    approvalRequired: true,
    notes: ['Future production SFX still requires approval, credit estimate, and credit reservation.'],
  }
}

function createNoSFXProviderRouteChoice(eventPlan: SFXEventPlanRecord): SFXProviderRouteChoice {
  return {
    recommendedProvider: 'no_sfx',
    providerRole: 'none',
    reason: `No SFX is the professional route because this moment is ${eventPlan.decisionState}.`,
    useInternalLibraryFirst: false,
    useMMAudioForDraft: false,
    useMireloForProduction: false,
    noSfxAllowed: true,
    costSensitivity: 'lowest_cost',
    qualityTarget: 'draft',
    approvalRequired: false,
    notes: ['No SFX is a valid ReeditPro decision.'],
  }
}

export function createNoSFXProviderRoute(
  db: MockDatabase,
  eventPlan: SFXEventPlanRecord,
): ServiceResult<SFXProviderRouteRecord> {
  const choice = createNoSFXProviderRouteChoice(eventPlan)
  return ok(insertMockRecord(db, 'sfxProviderRoutes', createRouteRecord(eventPlan, choice)))
}

function chooseRouteChoice(
  eventPlan: SFXEventPlanRecord,
  input: SFXProviderRoutingInput = {},
): SFXProviderRouteChoice {
  const level = normalizeEditQualityLevel(input.editComplexity ?? eventPlan.editLevel)

  if (level === 'basic') return chooseProviderForBasicEdit(eventPlan)
  if (level === 'pro') return chooseProviderForProEdit(eventPlan)
  if (level === 'signature') return chooseProviderForSignatureEdit(eventPlan)
  return chooseProviderForPremiumEdit(eventPlan)
}

function createRouteRecord(
  eventPlan: SFXEventPlanRecord,
  choice: SFXProviderRouteChoice,
): SFXProviderRouteRecord {
  return {
    id: createMockId('sfx-provider-route'),
    projectId: eventPlan.projectId,
    editPlanId: eventPlan.editPlanId,
    sfxEventPlanId: eventPlan.id,
    recommendedProvider: choice.recommendedProvider,
    providerRole: choice.providerRole,
    fallbackProvider: choice.fallbackProvider,
    reason: choice.reason,
    useInternalLibraryFirst: choice.useInternalLibraryFirst,
    useMMAudioForDraft: choice.useMMAudioForDraft,
    useMireloForProduction: choice.useMireloForProduction,
    noSfxAllowed: choice.noSfxAllowed,
    costSensitivity: choice.costSensitivity,
    qualityTarget: choice.qualityTarget,
    approvalRequired: choice.approvalRequired,
    notes: choice.notes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noProviderCall: true },
  }
}

export function chooseSFXProviderRoute(
  db: MockDatabase,
  eventPlan: SFXEventPlanRecord,
  input: SFXProviderRoutingInput = {},
): ServiceResult<SFXProviderRouteRecord> {
  const choice = chooseRouteChoice(eventPlan, input)

  return ok(insertMockRecord(db, 'sfxProviderRoutes', createRouteRecord(eventPlan, choice)))
}
