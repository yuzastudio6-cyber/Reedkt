import type {
  SFXQAReportRecord,
  SFXReplacementDecisionRecord,
} from '../../types'
import type { RunSFXQARequest } from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'

type ReplacementInput = RunSFXQARequest & {
  qaReport: SFXQAReportRecord
}

function content(input: ReplacementInput): string {
  return [
    input.mockOutputSummary,
    input.sfxEventPlan.sceneContext,
    input.sfxEventPlan.videoTone,
    input.sfxPromptPlan?.prompt,
    input.sfxPromptPlan?.librarySearchTags.join(' '),
  ].join(' ').toLowerCase()
}

export function createSFXLibraryReplacementReason(input: ReplacementInput): string {
  const issueTypes = input.qaReport.issues.map((issue) => issue.issueType)

  if (issueTypes.includes('wrong_style') || issueTypes.includes('cartoonish_when_should_be_premium')) {
    return 'A common approved library cue would be safer than another generation attempt for this style mismatch.'
  }
  if (issueTypes.includes('too_quiet') || issueTypes.includes('too_loud')) {
    return 'A known balanced library cue could reduce mix risk for this edit moment.'
  }
  if (content(input).includes('library replacement')) {
    return 'The mock scenario marks this as a common cue suitable for future internal library replacement.'
  }

  return 'Internal library replacement is only a future option until approved reusable SFX exist.'
}

export function createSFXReplacementSearchTags(input: ReplacementInput): string[] {
  const tags = [
    input.sfxEventPlan.targetLayer.replaceAll('_', '-'),
    input.sfxEventPlan.useCase.replaceAll('_', '-'),
    input.sfxEventPlan.volumeProfile.replaceAll('_', '-'),
    input.sfxEventPlan.videoTone.includes('luxury') ? 'premium' : undefined,
    input.sfxEventPlan.videoTone.includes('travel') ? 'travel' : undefined,
    input.sfxEventPlan.targetLayer === 'transition' ? 'whoosh' : undefined,
    input.sfxEventPlan.targetLayer === 'stroke_motion' ? 'stroke-motion' : undefined,
    input.sfxEventPlan.targetLayer === 'real_motion' ? 'room-matched' : undefined,
    input.sfxEventPlan.targetLayer === 'ambient_bridge' ? 'ambient-bridge' : undefined,
    ...(input.sfxPromptPlan?.librarySearchTags ?? []),
  ].filter((tag): tag is string => Boolean(tag))

  return Array.from(new Set(tags))
}

export function createSFXReplacementSummary(params: {
  shouldReplaceWithLibrary: boolean
  libraryAvailable: boolean
}): string {
  if (params.shouldReplaceWithLibrary && params.libraryAvailable) {
    return 'I recommend replacing this generated SFX with an approved internal library cue.'
  }
  if (params.shouldReplaceWithLibrary) {
    return 'This is a good future library replacement candidate, but no approved reusable library asset is assumed yet.'
  }

  return 'No internal library replacement is recommended for this mock QA result.'
}

export function decideIfSFXShouldUseLibraryReplacement(
  db: MockDatabase,
  input: ReplacementInput,
): SFXReplacementDecisionRecord {
  const text = content(input)
  const issueTypes = input.qaReport.issues.map((issue) => issue.issueType)
  const libraryAvailable = /library available|approved library|library match/.test(text)
  const commonCue = input.sfxEventPlan.targetLayer === 'transition' ||
    input.sfxEventPlan.targetLayer === 'title_card' ||
    input.sfxEventPlan.targetLayer === 'chapter_card' ||
    input.sfxEventPlan.targetLayer === 'cta_reveal'
  const styleOrMixIssue = issueTypes.some((issueType) =>
    ['wrong_style', 'cartoonish_when_should_be_premium', 'too_loud', 'too_quiet'].includes(issueType),
  )
  const shouldReplaceWithLibrary = (libraryAvailable && commonCue && styleOrMixIssue) ||
    input.qaReport.recommendedAction === 'replace_with_library' ||
    /library replacement/.test(text)

  return insertMockRecord(db, 'sfxReplacementDecisions', {
    id: createMockId('sfx-replacement-decision'),
    projectId: input.sfxEventPlan.projectId,
    editPlanId: input.sfxEventPlan.editPlanId,
    sfxEventPlanId: input.sfxEventPlan.id,
    sfxQAReportId: input.qaReport.id,
    shouldReplaceWithLibrary,
    recommendedAction: shouldReplaceWithLibrary && libraryAvailable ? 'replace_with_library' : input.qaReport.recommendedAction,
    replacementReason: createSFXLibraryReplacementReason(input),
    searchTags: createSFXReplacementSearchTags(input),
    libraryAvailable,
    userFacingSummary: createSFXReplacementSummary({ shouldReplaceWithLibrary, libraryAvailable }),
    notes: [
      'Mock replacement decision only; RP-SFX-09 will model library candidate growth.',
      libraryAvailable ? 'Mock scenario allows an approved library match.' : 'No approved internal SFX library is assumed at launch.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noLibraryPromotion: true },
  })
}
