import type { PreferenceDNAConfidenceBand } from '../types/preference-dna-builder'

export type CurrentEditReferenceSupplementResourceState =
  | 'loading'
  | 'ready'
  | 'needs_retry'
  | 'not_found'
  | 'access_denied'
  | 'unavailable'
  | 'blocking_validation'

export type CurrentEditReferenceSupplementBlockReason =
  | 'source_or_brief_missing'
  | 'frame_unconfirmed'
  | 'reference_stale'
  | 'authority_mismatch'

export interface CurrentEditReferenceSupplementResource {
  state: CurrentEditReferenceSupplementResourceState
  blockReason?: CurrentEditReferenceSupplementBlockReason
}

export interface CurrentEditReferenceSupplementOption {
  id: string
  name: string
  summary: string
  approvedGuidanceVersion?: number
  evidenceConfidence?: number
  evidenceConfidenceBand?: PreferenceDNAConfidenceBand
  copySafetyBoundaryCount?: number
  layerLabels?: string[]
}

export interface CurrentEditReferenceSupplementView {
  state:
    | CurrentEditReferenceSupplementResourceState
    | 'empty'
    | 'selection_required'
    | 'locked'
  tone: 'neutral' | 'progress' | 'warning' | 'error' | 'success'
  statusLabel: string
  title: string
  description: string
  announcementRole: 'status' | 'alert'
  announcementAriaLive: 'polite' | 'assertive'
  selectionEnabled: boolean
  showRetry: boolean
  showReturnToChat: boolean
  showStudy: boolean
  selectedOption?: CurrentEditReferenceSupplementOption
}

export function createCurrentEditReferenceSupplementView(input: {
  authorityReady: boolean
  locked: boolean
  options: CurrentEditReferenceSupplementOption[]
  resource: CurrentEditReferenceSupplementResource
  selectedReferenceId?: string
}): CurrentEditReferenceSupplementView {
  const selectedOption = input.options.find((option) => option.id === input.selectedReferenceId)

  if (input.locked) {
    return {
      state: 'locked',
      tone: 'neutral',
      statusLabel: 'Read only',
      title: selectedOption ? 'Edit Reference for this edit' : 'No Edit Reference connected',
      description: selectedOption
        ? 'Approved or review work is attached. This reference decision is preserved; request any change through Chat and replanning.'
        : 'Approved or review work is attached. Add or change reference guidance through Chat and replanning.',
      announcementRole: 'status',
      announcementAriaLive: 'polite',
      selectionEnabled: false,
      showRetry: false,
      showReturnToChat: true,
      showStudy: Boolean(selectedOption && input.authorityReady),
      selectedOption,
    }
  }

  if (input.resource.state === 'loading') {
    return resourceView({
      state: 'loading',
      tone: 'progress',
      statusLabel: 'Loading',
      title: 'Edit Reference for this edit',
      description: 'ReEditPro is reading the saved reference decision and study state for this exact edit.',
    })
  }

  if (input.resource.state === 'needs_retry') {
    return resourceView({
      state: 'needs_retry',
      tone: 'error',
      statusLabel: 'Needs retry',
      title: 'Edit Reference could not be refreshed',
      description: 'Your current preference draft is preserved. Try loading the saved reference and study state again.',
      showRetry: true,
    })
  }

  if (input.resource.state === 'not_found') {
    return resourceView({
      state: 'not_found',
      tone: 'warning',
      statusLabel: 'Not found',
      title: 'Saved Edit Reference is unavailable',
      description: 'The reference previously attached to this edit could not be found. Return to Chat before choosing a replacement.',
      showReturnToChat: true,
    })
  }

  if (input.resource.state === 'access_denied') {
    return resourceView({
      state: 'access_denied',
      tone: 'error',
      statusLabel: 'Access denied',
      title: 'Edit Reference is not available here',
      description: 'Reopen this edit from the workspace that owns its saved reference and study history.',
    })
  }

  if (input.resource.state === 'unavailable') {
    return resourceView({
      state: 'unavailable',
      tone: 'warning',
      statusLabel: 'Unavailable',
      title: 'Edit Reference is unavailable right now',
      description: 'The current edit remains unchanged. Continue with the other preferences or return to Chat.',
      showReturnToChat: true,
    })
  }

  if (input.resource.state === 'blocking_validation') {
    return blockingView(input.resource.blockReason)
  }

  if (input.options.length === 0) {
    return {
      ...resourceView({
        state: 'empty',
        tone: 'neutral',
        statusLabel: 'No approved references',
        title: 'No Edit Reference is ready to use',
        description: 'Continue without one, or use Chat to create and approve reusable creative guidance.',
        showReturnToChat: true,
      }),
      selectionEnabled: false,
    }
  }

  if (!input.selectedReferenceId) {
    return {
      ...resourceView({
        state: 'selection_required',
        tone: 'neutral',
        statusLabel: 'Optional',
        title: 'Edit Reference',
        description: 'Choose approved reusable guidance only if it should influence this edit. Nothing is copied from its source video.',
      }),
      selectionEnabled: true,
    }
  }

  if (!selectedOption) {
    return blockingView('reference_stale')
  }

  if (!input.authorityReady) {
    return blockingView('source_or_brief_missing', selectedOption)
  }

  return {
    state: 'ready',
    tone: 'progress',
    statusLabel: 'Reference selected',
    title: 'Edit Reference',
    description: 'Study this exact video before the selected guidance can be adapted. Finishing the study does not apply or connect anything automatically.',
    announcementRole: 'status',
    announcementAriaLive: 'polite',
    selectionEnabled: true,
    showRetry: false,
    showReturnToChat: false,
    showStudy: true,
    selectedOption,
  }
}

function blockingView(
  reason: CurrentEditReferenceSupplementBlockReason | undefined,
  selectedOption?: CurrentEditReferenceSupplementOption,
): CurrentEditReferenceSupplementView {
  const copy = reason === 'frame_unconfirmed'
    ? {
        title: 'Confirm the output frame first',
        description: 'Target-video study must use the exact output frame planned for this edit.',
      }
    : reason === 'reference_stale'
      ? {
          title: 'Choose an available approved reference',
          description: 'The saved reference decision no longer matches an approved reference available to this edit.',
        }
      : reason === 'authority_mismatch'
        ? {
            title: 'Refresh this edit before studying it',
            description: 'The saved source, Edit Brief, instruction, or preference context changed and no longer matches the current study authority.',
          }
        : {
            title: 'Finish the source and Edit Brief first',
            description: 'Save and verify the exact uploaded source and its Edit Brief before starting whole-video study.',
          }

  return {
    state: 'blocking_validation',
    tone: 'warning',
    statusLabel: 'Action required',
    title: copy.title,
    description: copy.description,
    announcementRole: 'alert',
    announcementAriaLive: 'assertive',
    selectionEnabled: true,
    showRetry: false,
    showReturnToChat: false,
    showStudy: false,
    selectedOption,
  }
}

function resourceView(input: {
  state: CurrentEditReferenceSupplementView['state']
  tone: CurrentEditReferenceSupplementView['tone']
  statusLabel: string
  title: string
  description: string
  showRetry?: boolean
  showReturnToChat?: boolean
}): CurrentEditReferenceSupplementView {
  const assertive = input.state === 'needs_retry' || input.state === 'access_denied'
  return {
    state: input.state,
    tone: input.tone,
    statusLabel: input.statusLabel,
    title: input.title,
    description: input.description,
    announcementRole: assertive ? 'alert' : 'status',
    announcementAriaLive: assertive ? 'assertive' : 'polite',
    selectionEnabled: false,
    showRetry: input.showRetry ?? false,
    showReturnToChat: input.showReturnToChat ?? false,
    showStudy: false,
  }
}
