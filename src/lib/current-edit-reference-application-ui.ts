import type { PreferenceApplicationDownstreamContext } from '../types/edit-reference-integration'
import type {
  EditReferenceProductionPreparedApplicationAuthority,
} from '../types/edit-reference-production-exact-edit-apply-api'
import type { CurrentEditReferenceSupplementOption } from './current-edit-reference-study-supplement'

export type CurrentEditReferenceApplicationUiState =
  | 'ready_to_apply'
  | 'applying'
  | 'needs_retry'
  | 'review_required'
  | 'applied'
  | 'invalidated'

export type CurrentEditReferenceApplicationResource =
  | {
      state: 'ready_to_apply' | 'applying' | 'needs_retry'
      selectedOption: CurrentEditReferenceSupplementOption
    }
  | {
      state: 'review_required'
      selectedOption: CurrentEditReferenceSupplementOption
      context?: PreferenceApplicationDownstreamContext
    }
  | {
      state: 'applied' | 'invalidated'
      selectedOption: CurrentEditReferenceSupplementOption
      context?: PreferenceApplicationDownstreamContext
      canonicalAuthority?: EditReferenceProductionPreparedApplicationAuthority
    }

export interface CurrentEditReferenceApplicationMappingItem {
  id: string
  title: string
  detail: string
}

interface CurrentEditReferenceApplicationMapping {
  adapted: CurrentEditReferenceApplicationMappingItem[]
  heldBack: CurrentEditReferenceApplicationMappingItem[]
  safetyBoundaries: CurrentEditReferenceApplicationMappingItem[]
}

export interface CurrentEditReferenceApplicationView {
  state: CurrentEditReferenceApplicationUiState
  tone: 'progress' | 'warning' | 'error' | 'success'
  statusLabel: string
  title: string
  description: string
  announcementRole: 'status' | 'alert'
  announcementAriaLive: 'polite' | 'assertive'
  busy: boolean
  showReturnToChat: boolean
  facts: string[]
  adapted: CurrentEditReferenceApplicationMappingItem[]
  heldBack: CurrentEditReferenceApplicationMappingItem[]
  safetyBoundaries: CurrentEditReferenceApplicationMappingItem[]
}

/**
 * Converts exact application authority into user-facing UI state. It never
 * prepares, connects, retries, invalidates, or persists an application.
 */
export function createCurrentEditReferenceApplicationView(
  resource: CurrentEditReferenceApplicationResource,
  expectedEditReferenceId = resource.selectedOption.id,
): CurrentEditReferenceApplicationView {
  if (resource.selectedOption.id !== expectedEditReferenceId) {
    return baseView({
      state: 'review_required',
      tone: 'warning',
      statusLabel: 'Review required',
      title: 'Refresh the selected reference',
      description: 'The saved application state belongs to another Edit Reference. ReEditPro will not present it beside this selection.',
      announcementRole: 'alert',
      announcementAriaLive: 'assertive',
      showReturnToChat: true,
    })
  }

  if (resource.state === 'ready_to_apply') {
    return baseView({
      state: resource.state,
      tone: 'progress',
      statusLabel: 'Ready for Apply',
      title: 'Reference guidance is ready for this edit',
      description: 'The approved guidance and whole-video study are verified. Apply to this edit will save this selection with the rest of the preference draft. No generation or credit action starts.',
    })
  }

  if (resource.state === 'applying') {
    return baseView({
      state: resource.state,
      tone: 'progress',
      statusLabel: 'Saving',
      title: 'Saving the preference draft',
      description: 'ReEditPro is saving the selected reference with the same Current Edit Preferences update. Keep this page open until the result is confirmed.',
      busy: true,
    })
  }

  if (resource.state === 'needs_retry') {
    return baseView({
      state: resource.state,
      tone: 'error',
      statusLabel: 'Needs retry',
      title: 'Reference guidance was not saved',
      description: 'Your preference draft and completed study remain safe. Use Apply to this edit again when the saved edit connection is available.',
      announcementRole: 'alert',
      announcementAriaLive: 'assertive',
    })
  }

  const context = 'context' in resource ? resource.context : undefined
  const canonicalAuthority = 'canonicalAuthority' in resource
    ? resource.canonicalAuthority
    : undefined

  if (context && context.editReferenceId !== resource.selectedOption.id) {
    return baseView({
      state: 'review_required',
      tone: 'warning',
      statusLabel: 'Review required',
      title: 'Refresh the reference mapping',
      description: 'The saved mapping belongs to a different Edit Reference. ReEditPro will not present it as active guidance for this selection.',
      announcementRole: 'alert',
      announcementAriaLive: 'assertive',
      showReturnToChat: true,
    })
  }

  if (
    resource.state === 'applied'
    && !canonicalAuthority
    && context?.integrationStatus !== 'connected_mock'
  ) {
    return invalidContextView()
  }

  if (resource.state === 'invalidated' && context?.integrationStatus !== 'invalidated') {
    return invalidContextView()
  }

  const mapping = context ? mappingFrom(context) : emptyMapping()
  const facts = canonicalAuthority
    ? [
        'Exact edit authority verified',
        `Preference DNA version ${canonicalAuthority.applicationVersionNumber}`,
        'A fresh plan and estimate are required',
      ]
    : mappingFacts(mapping)

  if (resource.state === 'review_required') {
    return {
      ...baseView({
        state: resource.state,
        tone: 'warning',
        statusLabel: 'Review required',
        title: 'Review how the guidance maps to this edit',
        description: context
          ? 'Some guidance is held back or needs a decision before it can shape a fresh plan. Review it through Chat; no approved work is changed.'
          : 'The target study is preserved, but the guidance mapping needs review before this preference draft can be applied.',
        showReturnToChat: true,
      }),
      facts,
      ...mapping,
    }
  }

  if (resource.state === 'invalidated') {
    return {
      ...baseView({
        state: resource.state,
        tone: 'warning',
        statusLabel: 'Needs replanning',
        title: 'Previous guidance is no longer active',
        description: 'The prior mapping remains in history, but it no longer guides this edit. Return to Chat to confirm the new direction and create a fresh plan.',
        showReturnToChat: true,
      }),
      facts,
      ...mapping,
    }
  }

  return {
    ...baseView({
      state: 'applied',
      tone: 'success',
      statusLabel: 'Applied',
      title: 'Guidance is saved to this edit',
      description: 'The target-aware mapping is available to the next plan. Higher-priority instructions and safety boundaries remain in control, and no generation or credit action started.',
    }),
    facts,
    ...mapping,
  }
}

function invalidContextView(): CurrentEditReferenceApplicationView {
  return baseView({
    state: 'review_required',
    tone: 'warning',
    statusLabel: 'Review required',
    title: 'Refresh the saved application state',
    description: 'The saved application state does not match its verified lifecycle. ReEditPro will not present it as applied guidance.',
    announcementRole: 'alert',
    announcementAriaLive: 'assertive',
    showReturnToChat: true,
  })
}

function mappingFrom(context: PreferenceApplicationDownstreamContext): CurrentEditReferenceApplicationMapping {
  return {
    adapted: context.guidance.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.instruction,
    })),
    heldBack: context.heldBack.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.reason,
    })),
    safetyBoundaries: context.doNotCopyRules.map((rule, index) => ({
      id: `copy-safety-${index + 1}`,
      title: `Copy-safety boundary ${index + 1}`,
      detail: rule,
    })),
  }
}

function emptyMapping(): CurrentEditReferenceApplicationMapping {
  return {
    adapted: [],
    heldBack: [],
    safetyBoundaries: [],
  }
}

function mappingFacts(mapping: CurrentEditReferenceApplicationMapping): string[] {
  if (mapping.adapted.length + mapping.heldBack.length + mapping.safetyBoundaries.length === 0) return []
  return [
    `${mapping.adapted.length} adapted`,
    `${mapping.heldBack.length} held back`,
    `${mapping.safetyBoundaries.length} safety boundar${mapping.safetyBoundaries.length === 1 ? 'y' : 'ies'}`,
  ]
}

function baseView(input: {
  state: CurrentEditReferenceApplicationUiState
  tone: CurrentEditReferenceApplicationView['tone']
  statusLabel: string
  title: string
  description: string
  announcementRole?: CurrentEditReferenceApplicationView['announcementRole']
  announcementAriaLive?: CurrentEditReferenceApplicationView['announcementAriaLive']
  busy?: boolean
  showReturnToChat?: boolean
}): CurrentEditReferenceApplicationView {
  return {
    state: input.state,
    tone: input.tone,
    statusLabel: input.statusLabel,
    title: input.title,
    description: input.description,
    announcementRole: input.announcementRole ?? 'status',
    announcementAriaLive: input.announcementAriaLive ?? 'polite',
    busy: input.busy ?? false,
    showReturnToChat: input.showReturnToChat ?? false,
    facts: [],
    ...emptyMapping(),
  }
}
