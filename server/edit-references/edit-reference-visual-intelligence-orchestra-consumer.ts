import type {
  EditReferenceStudyGoal,
  PreferenceEvidenceCategory,
} from '../../src/types/edit-reference'
import type {
  OrchestraEvidenceRef,
  OrchestraSkillJobResult,
} from '../../src/types/orchestra-skill-capability'
import type {
  VisualIntelligenceFinding,
  VisualIntelligenceFrameRange,
  VisualIntelligenceReport,
} from '../../src/types/visual-intelligence'
import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
} from '../../src/types/visual-intelligence'
import {
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillJobResult,
} from '../orchestra/orchestra-skill-capability-contract'
import { parseVisualIntelligenceReport } from
  '../visual-intelligence/visual-intelligence-contract'
import { hasEditReferenceNegationNear } from './edit-reference-copy-safety'
import {
  EDIT_REFERENCE_VISUAL_INTELLIGENCE_BRIDGE_ID,
  EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID,
} from './edit-reference-semantic-study-contract'

export const EDIT_REFERENCE_VISUAL_INTELLIGENCE_STUDY_VERSION =
  'edit-reference-visual-intelligence-study-v1' as const

export interface EditReferenceVisualIntelligenceExpectedScope {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly sourceArtifactRef: OrchestraEvidenceRef
}

export interface EditReferenceVisualIntelligenceEvidenceItem {
  readonly evidenceId: string
  readonly category: PreferenceEvidenceCategory
  readonly title: string
  readonly summary: string
  readonly evidenceRefs: readonly OrchestraEvidenceRef[]
  readonly confidenceBasisPoints: number
  readonly requiresUserReview: true
  readonly exactReferenceLayoutTransferAllowed: false
  readonly exactVisibleTextTransferAllowed: false
  readonly exactCameraPathTransferAllowed: false
  readonly creatorIdentityTransferAllowed: false
  readonly copyrightedAssetTransferAllowed: false
  readonly targetAdaptationRequired: true
}

export interface EditReferenceVisualIntelligenceStudy {
  readonly schemaVersion:
    typeof EDIT_REFERENCE_VISUAL_INTELLIGENCE_STUDY_VERSION
  readonly studyDigestSha256: string
  readonly sourceEvidenceId: string
  readonly privateAssetId: string
  readonly scope: VisualIntelligenceReport['scope']
  readonly sourceArtifactRef: OrchestraEvidenceRef
  readonly orchestraCallRef: OrchestraEvidenceRef
  readonly orchestraResultRef: OrchestraEvidenceRef
  readonly manifestRef: OrchestraEvidenceRef
  readonly qualificationSnapshotRef: OrchestraEvidenceRef
  readonly reportRef: OrchestraEvidenceRef
  readonly providerReleaseRef: OrchestraEvidenceRef
  readonly costEvidenceRef: OrchestraEvidenceRef
  readonly requestedRanges: readonly VisualIntelligenceFrameRange[]
  readonly analyzedRanges: readonly VisualIntelligenceFrameRange[]
  readonly evidenceItems: readonly EditReferenceVisualIntelligenceEvidenceItem[]
  readonly coveredPreferenceCategories: readonly EditReferenceStudyGoal[]
  readonly toolIds: readonly string[]
  readonly providerAdapterId: typeof VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID
  readonly providerId: typeof VISUAL_INTELLIGENCE_PROVIDER_ID
  readonly providerModel: typeof VISUAL_INTELLIGENCE_MODEL_ID
  readonly providerModelVersion: string
  readonly thinkingLevel: 'high'
  readonly mediaResolution: 'high'
  readonly completeRequestedRangeCoverage: true
  readonly everyTimelineFrameInspected: false
  readonly completeTimePixelInspectionClaimAllowed: false
  readonly billingAccountEffectiveRateUsed: true
  readonly publicListPriceUsed: false
  readonly settledCostMicros: number
  readonly replayedFromCache: boolean
  readonly providerCallMade: boolean
  readonly immutableReportRereadRequired: true
  readonly resultReturnedThroughOrchestra: true
  readonly planningMayConsumeValidatedEvidence: true
  readonly preferenceDnaApproved: false
  readonly directTimelineMutationAllowed: false
  readonly directProviderAuthorityGranted: false
  readonly customerCreditMutationPerformed: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
}

/**
 * Converts one exact Orchestra-owned reference analysis into a provider-neutral
 * Edit Reference evidence package. It does not dispatch Visual Intelligence,
 * read media, synthesize Preference DNA, mutate credits, or approve the study.
 */
export function adaptEditReferenceVisualIntelligenceOrchestraResult(input: {
  readonly sourceEvidenceId: string
  readonly privateAssetId: string
  readonly expectedScope: EditReferenceVisualIntelligenceExpectedScope
  readonly orchestraResult: unknown
  readonly report: unknown
}): EditReferenceVisualIntelligenceStudy {
  assertSafeId(input.sourceEvidenceId, 'source evidence')
  assertSafeId(input.privateAssetId, 'private asset')
  assertExpectedScope(input.expectedScope)
  const result = parseOrchestraSkillJobResult(input.orchestraResult)
  const report = parseVisualIntelligenceReport(input.report)
  assertExactResultAndReport({
    expected: input.expectedScope,
    result,
    report,
  })

  const reportRef = orchestraEvidenceRef(
    report.reportId,
    report.reportDigestSha256,
  )
  const resultRef = orchestraEvidenceRef(
    result.resultId,
    result.resultDigestSha256,
  )
  const costEvidenceRef = report.usage.costEvidenceRef!
  const evidenceItems = createEvidenceItems(report, reportRef)
  const coveredPreferenceCategories = orderedStudyGoals(
    evidenceItems.map((item) => item.category),
  )
  const withoutDigest = {
    schemaVersion: EDIT_REFERENCE_VISUAL_INTELLIGENCE_STUDY_VERSION,
    sourceEvidenceId: input.sourceEvidenceId,
    privateAssetId: input.privateAssetId,
    scope: structuredClone(report.scope),
    sourceArtifactRef: structuredClone(input.expectedScope.sourceArtifactRef),
    orchestraCallRef: structuredClone(result.callRef),
    orchestraResultRef: resultRef,
    manifestRef: structuredClone(result.manifestRef),
    qualificationSnapshotRef: structuredClone(
      result.qualificationSnapshotRef,
    ),
    reportRef,
    providerReleaseRef: structuredClone(report.provenance.providerReleaseRef),
    costEvidenceRef: structuredClone(costEvidenceRef),
    requestedRanges: structuredClone(report.coverage.requestedRanges),
    analyzedRanges: structuredClone(report.coverage.analyzedRanges),
    evidenceItems,
    coveredPreferenceCategories,
    toolIds: orderedStrings([
      EDIT_REFERENCE_VISUAL_INTELLIGENCE_BRIDGE_ID,
      EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID,
      VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
      VISUAL_INTELLIGENCE_PROVIDER_ID,
      ...report.deterministicToolExecutions.map((item) => item.tool),
    ]),
    providerAdapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
    providerId: VISUAL_INTELLIGENCE_PROVIDER_ID,
    providerModel: VISUAL_INTELLIGENCE_MODEL_ID,
    providerModelVersion: report.usage.providerModelVersion,
    thinkingLevel: 'high' as const,
    mediaResolution: 'high' as const,
    completeRequestedRangeCoverage: true as const,
    everyTimelineFrameInspected: false as const,
    completeTimePixelInspectionClaimAllowed: false as const,
    billingAccountEffectiveRateUsed: true as const,
    publicListPriceUsed: false as const,
    settledCostMicros: report.usage.settledCostMicros!,
    replayedFromCache: report.usage.replayedFromCache,
    providerCallMade: report.usage.providerCallMade,
    immutableReportRereadRequired: true as const,
    resultReturnedThroughOrchestra: true as const,
    planningMayConsumeValidatedEvidence: true as const,
    preferenceDnaApproved: false as const,
    directTimelineMutationAllowed: false as const,
    directProviderAuthorityGranted: false as const,
    customerCreditMutationPerformed: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return deepFreeze({
    ...withoutDigest,
    studyDigestSha256: orchestraDigest(withoutDigest),
  })
}

function assertExactResultAndReport(input: {
  readonly expected: EditReferenceVisualIntelligenceExpectedScope
  readonly result: OrchestraSkillJobResult
  readonly report: VisualIntelligenceReport
}): void {
  const { expected, result, report } = input
  const reportRef = orchestraEvidenceRef(
    report.reportId,
    report.reportDigestSha256,
  )
  const source = report.sourceArtifacts[0]
  if (
    result.targetSkillKey !== 'visual_intelligence'
    || result.jobType !== 'reference_preference_analysis'
    || result.phase !== 'planning'
    || result.disposition !== 'completed'
    || result.scope.scopeType !== 'video'
    || !result.scope.completeSourceCoverageRequired
    || !sameRef(result.scope.sourceArtifactRef, expected.sourceArtifactRef)
    || result.scope.outputId !== null
    || result.proposedFollowupRanges.length !== 0
    || result.followupReasonCode !== null
    || result.estimatedAdditionalTimeRef !== null
    || result.estimatedAdditionalCreditsRef !== null
    || result.producedArtifactRefs.length !== 1
    || !sameRef(result.producedArtifactRefs[0]!, reportRef)
    || report.operation !== 'analyze_media'
    || report.profile !== 'reference_preference_dna'
    || report.scope.ownerUserId !== expected.ownerUserId
    || report.scope.workspaceId !== expected.workspaceId
    || report.scope.projectId !== expected.editReferenceId
    || report.scope.editSessionId !== expected.studySessionId
    || report.scope.approvedSnapshotId !== null
    || report.sourceArtifacts.length !== 1
    || !source
    || source.mediaKind !== 'video'
    || source.artifactId !== expected.sourceArtifactRef.id
    || source.checksumSha256
      !== expected.sourceArtifactRef.contentHash.replace(/^sha256:/u, '')
    || report.comparisonArtifacts.length !== 0
    || orchestraDigest(result.scope.authorizedRanges)
      !== orchestraDigest(report.coverage.requestedRanges)
    || orchestraDigest(report.coverage.requestedRanges)
      !== orchestraDigest(report.coverage.analyzedRanges)
    || report.coverage.incompleteRanges.length !== 0
    || report.coverage.targetedFollowupRanges.length !== 0
    || !report.coverage.completeRequestedRangeCoverage
    || report.coverage.everyTimelineFrameInspected
    || report.coverage.completeTimePixelInspectionClaimAllowed
    || !['pass', 'pass_with_warnings'].includes(report.disposition)
    || report.blockers.length !== 0
    || !report.planningMayConsumeValidatedEvidence
    || report.directTimelineMutationAllowed
    || report.renderPerformedByVisualIntelligence
    || report.exportAuthorized
    || report.deliveryAuthorized
    || report.provenance.providerAdapterId
      !== VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID
    || report.provenance.providerId !== VISUAL_INTELLIGENCE_PROVIDER_ID
    || report.provenance.exactModelId !== VISUAL_INTELLIGENCE_MODEL_ID
    || report.provenance.thinkingLevel !== 'high'
    || report.provenance.mediaResolution !== 'high'
    || report.provenance.providerToolsUsed
    || report.provenance.searchGroundingUsed
    || report.provenance.urlContextUsed
    || report.provenance.codeExecutionUsed
    || report.provenance.rawProviderPayloadPersisted
    || report.deterministicToolExecutions.some((item) => (
      item.substantiveCpuExecutionUsed !== false
      || !['l4_gpu_standard', 'a100_80gb_gpu_heavy'].includes(
        item.executionClass,
      )
    ))
    || !report.usage.billingAccountEffectiveRateUsed
    || report.usage.publicListPriceUsed
    || report.usage.duplicateSettlementPerformed
    || report.usage.settledCostMicros === null
    || report.usage.settledCostMicros <= 0
    || report.usage.costEvidenceRef === null
    || !report.usage.providerCallMade
  ) throw new TypeError(
    'Edit Reference requires an exact completed Orchestra Visual Intelligence reference report.',
  )
  assertNoDirectCopyInstruction([
    report.semanticSummary,
    ...report.segments.map((item) => item.summary),
    ...report.findings.map((item) => item.summary),
  ])
}

function createEvidenceItems(
  report: VisualIntelligenceReport,
  reportRef: OrchestraEvidenceRef,
): readonly EditReferenceVisualIntelligenceEvidenceItem[] {
  const segmentConfidence = report.segments.length === 0
    ? 5_000
    : Math.round(report.segments.reduce(
      (sum, item) => sum + item.confidenceBasisPoints,
      0,
    ) / report.segments.length)
  const summary: EditReferenceVisualIntelligenceEvidenceItem = {
    evidenceId: `${report.reportId}:semantic-summary`,
    category: 'visual_language',
    title: 'Visual Intelligence reference summary',
    summary: report.semanticSummary,
    evidenceRefs: [reportRef],
    confidenceBasisPoints: segmentConfidence,
    requiresUserReview: true,
    exactReferenceLayoutTransferAllowed: false,
    exactVisibleTextTransferAllowed: false,
    exactCameraPathTransferAllowed: false,
    creatorIdentityTransferAllowed: false,
    copyrightedAssetTransferAllowed: false,
    targetAdaptationRequired: true,
  }
  const findings = report.findings.map((finding) => ({
    evidenceId: finding.findingId,
    category: categoryFor(finding),
    title: titleFor(finding),
    summary: finding.summary,
    evidenceRefs: finding.evidenceRefs.map((item) => structuredClone(item)),
    confidenceBasisPoints: finding.confidenceBasisPoints,
    requiresUserReview: true as const,
    exactReferenceLayoutTransferAllowed: false as const,
    exactVisibleTextTransferAllowed: false as const,
    exactCameraPathTransferAllowed: false as const,
    creatorIdentityTransferAllowed: false as const,
    copyrightedAssetTransferAllowed: false as const,
    targetAdaptationRequired: true as const,
  }))
  return deepFreeze([summary, ...findings])
}

function categoryFor(
  finding: VisualIntelligenceFinding,
): EditReferenceStudyGoal {
  const category = finding.category.toLowerCase()
  if (/caption|subtitle|visible[_ -]?text|typography/u.test(category)) {
    return 'captions'
  }
  if (/color|palette|grade|contrast|luma|light/u.test(category)) return 'color'
  if (/b[_ -]?roll|cutaway|supporting[_ -]?visual/u.test(category)) {
    return 'b_roll'
  }
  if (/audio|music|sound|sfx|duck/u.test(category)) return 'audio_and_sfx'
  if (/graphic|overlay|layout|motion|animation|lower[_ -]?third/u.test(
    category,
  )) return 'graphics'
  if (/story|pacing|rhythm|sequence|continuity|cut|transition/u.test(
    category,
  )) return 'story_and_pacing'
  return 'visual_language'
}

function titleFor(finding: VisualIntelligenceFinding): string {
  return `Visual Intelligence — ${finding.category
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')}`.slice(0, 160)
}

function orderedStudyGoals(
  categories: readonly PreferenceEvidenceCategory[],
): readonly EditReferenceStudyGoal[] {
  const selected = new Set(categories)
  const order: readonly EditReferenceStudyGoal[] = [
    'visual_language',
    'story_and_pacing',
    'captions',
    'color',
    'b_roll',
    'audio_and_sfx',
    'graphics',
  ]
  return Object.freeze(order.filter((item) => selected.has(item)))
}

function assertExpectedScope(
  value: EditReferenceVisualIntelligenceExpectedScope,
): void {
  assertSafeId(value.ownerUserId, 'owner user')
  assertSafeId(value.workspaceId, 'workspace')
  assertSafeId(value.editReferenceId, 'Edit Reference')
  assertSafeId(value.studySessionId, 'study session')
  if (
    !value.sourceArtifactRef
    || !/^sha256:[a-f0-9]{64}$/u.test(value.sourceArtifactRef.contentHash)
    || !Number.isSafeInteger(value.sourceArtifactRef.version)
    || value.sourceArtifactRef.version < 1
  ) throw new TypeError('Edit Reference source artifact authority is invalid.')
  assertSafeId(value.sourceArtifactRef.id, 'source artifact')
}

function assertSafeId(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== 'string'
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)
    || value.includes('..')
  ) throw new TypeError(`Edit Reference ${label} identity is invalid.`)
}

function assertNoDirectCopyInstruction(values: readonly string[]): void {
  const pattern = /\b(?:copy|clone|replicate|recreate|shot[- ]for[- ]shot|match exactly|retain exact|preserve exact)\b/giu
  for (const value of values) {
    pattern.lastIndex = 0
    for (const match of value.matchAll(pattern)) {
      if (!hasEditReferenceNegationNear(value, match.index ?? 0)) {
        throw new TypeError(
          'Visual Intelligence reference evidence contains a direct-copy instruction.',
        )
      }
    }
  }
}

function sameRef(left: OrchestraEvidenceRef, right: OrchestraEvidenceRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function orderedStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort(compare))
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested)
    }
  }
  return value
}
