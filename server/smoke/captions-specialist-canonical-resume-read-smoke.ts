import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  CanonicalSpecialistSupportResumeRecord,
} from '../../src/types/canonical-specialist-support-resume'
import type {
  OrchestraSkillCall,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import {
  CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_RECEIPT,
  createCaptionCanonicalSpecialistResumeSequence,
  parseCaptionCanonicalAuthenticatedSpecialistProjection,
  parseCaptionCanonicalSpecialistResumeReadAdapterReceipt,
  parseCaptionCanonicalSpecialistResumeSequence,
  parseCaptionCanonicalSpecialistSupportResumeRecord,
} from '../captions-specialist/caption-canonical-specialist-resume-read'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import {
  createCaptionsAuthenticatedOwnerFixture,
} from '../internal-testing/captions-specialist-authenticated-owner-fixtures'
import {
  createCaptionsHarnessCall,
  runCaptionsInternalHarnessToCompletion,
} from '../internal-testing/captions-specialist-harness'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { parseOrchestraSkillCall } from
  '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
function redigest<T extends Record<string, unknown>>(
  value: T,
  digestField: string,
): T {
  const clone = structuredClone(value)
  clone[digestField as keyof T] = calculateSkillContractDigest(
    clone, digestField) as T[keyof T]
  return clone
}
function callRef(call: OrchestraSkillCall): SkillContractRef {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}
function requestRef(request: SkillSupportRequest): SkillContractRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

const approvedSnapshotRef = {
  id: 'snapshot.resume.read.1',
  version: 'approved-plan-snapshot-v1',
  contentHash: hash('snapshot.resume.read.1'),
}
const initialCall = createCaptionsHarnessCall({
  callId: 'captions.resume.read.safe-region',
  jobType: 'resolve_subject_occluded_typography',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
  approvedSnapshotRef,
})
const authenticatedOwnerFixture = createCaptionsAuthenticatedOwnerFixture(
  initialCall)
const run = runCaptionsInternalHarnessToCompletion({
  call: initialCall,
  initialRuntimeEvidence: authenticatedOwnerFixture.initialRuntimeEvidence,
  resolveSupportRequest: authenticatedOwnerFixture.resolveSupportRequest,
})
check(run.resumeSteps.length === 2
  && run.finalResult.disposition === 'completed',
'The fixture exposes a complete two-owner sequential Caption chain.')
check(run.resumeSteps.map((step) =>
  step.selectedSupportRequest.targetSkillKey).join('|')
    === 'visual_intelligence|track_all'
  && run.finalResult.reasonCodes.includes(
    'visual_intelligence.authenticated_admission.accepted')
  && run.finalResult.reasonCodes.includes(
    'track_all.authenticated_admission.accepted'),
'The fixture admits exact Visual Intelligence then Track All evidence.')

const finalStepContext = {
  stepNumber: 2,
  currentCall: run.resumeSteps[0].resumedCall,
  currentResult: run.resumeSteps[0].resumedResult,
  selectedSupportRequest: run.resumeSteps[1].selectedSupportRequest,
}
const finalStepResolution = authenticatedOwnerFixture.resolveSupportRequest(
  finalStepContext)
const missingPromotedReread = runCaptionsSpecialistJob({
  call: run.resumeSteps[1].resumedCall,
  resumeSupportRequest: run.resumeSteps[1].selectedSupportRequest,
  canonicalTrackAllEvidenceRecord:
    finalStepResolution.runtimeEvidence.canonicalTrackAllEvidenceRecord,
})
check(missingPromotedReread.disposition === 'needs_followup'
  && missingPromotedReread.supportRequests[0]?.targetSkillKey
    === 'visual_intelligence',
'A promoted Visual Intelligence ref is not enough without its canonical reread.')
const crossedPromotedCall = structuredClone(run.resumeSteps[1].resumedCall)
const promotedVisualArtifact = crossedPromotedCall.inputArtifactRefs.find(
  (artifact) => artifact.artifactType
    === 'caption_visual_intelligence_occupancy_evidence')!
promotedVisualArtifact.contentHash = hash('crossed.promoted.visual.artifact')
crossedPromotedCall.callDigestSha256 = calculateSkillContractDigest(
  crossedPromotedCall as unknown as Record<string, unknown>,
  'callDigestSha256')
const crossedPromotedResult = runCaptionsSpecialistJob({
  call: parseOrchestraSkillCall(crossedPromotedCall),
  resumeSupportRequest: run.resumeSteps[1].selectedSupportRequest,
  ...finalStepResolution.runtimeEvidence,
})
check(crossedPromotedResult.disposition === 'blocked'
  && crossedPromotedResult.reasonCodes.includes(
    'input.visual_intelligence.promoted_evidence.mismatch'),
'Crossed promoted owner evidence fails closed after canonical reread.')

function projectionForStep(index: number):
CanonicalAuthenticatedSpecialistSupportArtifactProjection {
  const priorCall = index === 0
    ? run.initialCall : run.resumeSteps[index - 1].resumedCall
  const request = run.resumeSteps[index].selectedSupportRequest
  const resumedCall = run.resumeSteps[index].resumedCall
  const withoutDigest: Omit<
    CanonicalAuthenticatedSpecialistSupportArtifactProjection,
    'projectionDigestSha256'
  > = {
    schemaVersion:
      'canonical-authenticated-specialist-support-artifact-projection-v1',
    projectionId: `projection.resume.read.${index + 1}`,
    originalCallRef: callRef(priorCall),
    supportRequestRef: requestRef(request),
    ownerResultRef: {
      id: `owner.result.resume.read.${index + 1}`,
      version: `${request.targetSkillKey}-authenticated-result-v1`,
      contentHash: hash(`owner.result.resume.read.${index + 1}`),
    },
    ownerKey: request.targetSkillKey,
    canonicalScope: structuredClone(request.canonicalScope),
    artifactRefs: structuredClone(resumedCall.injectedSupportArtifactRefs),
    authenticatedPrincipalVerified: true,
    exactApprovedSnapshotReread: true,
    exactCanonicalScopeReread: true,
    exactOwnerResultReread: true,
    ownerResultPersistedBeforeProjection: true,
    browserLocalStateUsed: false,
    rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false,
    directPeerDispatchPerformed: false,
    timelineMutationPerformed: false,
    runtimeExecutionAuthorityGrantedToSpecialist: false,
    assetMutationAuthorityGrantedToSpecialist: false,
    costOrBillingAuthorityGrantedToSpecialist: false,
    finalQaApprovalGrantedToSpecialist: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionCanonicalAuthenticatedSpecialistProjection({
    ...withoutDigest,
    projectionDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      projectionDigestSha256: '',
    }, 'projectionDigestSha256'),
  })
}

function recordForStep(index: number): CanonicalSpecialistSupportResumeRecord {
  const priorCall = index === 0
    ? run.initialCall : run.resumeSteps[index - 1].resumedCall
  const priorResult = index === 0
    ? run.initialResult : run.resumeSteps[index - 1].resumedResult
  const step = run.resumeSteps[index]
  const withoutDigest: Omit<CanonicalSpecialistSupportResumeRecord,
    'recordDigestSha256'> = {
    schemaVersion: 'canonical-specialist-support-resume-record-v1',
    recordId: `record.resume.read.${index + 1}`,
    stepOrdinal: index + 1,
    priorCall: structuredClone(priorCall),
    priorResult: structuredClone(priorResult),
    selectedSupportRequest: structuredClone(step.selectedSupportRequest),
    authenticatedOwnerProjection: projectionForStep(index),
    resumedCall: structuredClone(step.resumedCall),
    resumedResult: structuredClone(step.resumedResult),
    promotedPriorSupportArtifactRefs:
      structuredClone(step.promotedPriorSupportArtifactRefs),
    persistedAt: `2026-08-04T00:00:0${index + 1}.000Z`,
    priorCallAndResultExactReread: true,
    selectedRequestExactResultMember: true,
    authenticatedOwnerProjectionExactReread: true,
    onlyCurrentOwnerResultInjected: true,
    priorOwnerResultsPromotedAsCanonicalInputs: true,
    exactImmediateCallAndRequestLineage: true,
    directPeerDispatchPerformed: false,
    timelineMutationPerformed: false,
    providerCallPerformedByResumeOwner: false,
    runtimeExecutionPerformedByResumeOwner: false,
    assetMutationPerformedByResumeOwner: false,
    costOrBillingMutationPerformedByResumeOwner: false,
    finalQaApprovalGrantedByResumeOwner: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionCanonicalSpecialistSupportResumeRecord({
    ...withoutDigest,
    recordDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      recordDigestSha256: '',
    }, 'recordDigestSha256'),
  })
}

const records = [recordForStep(0), recordForStep(1)]
check(records.map((record) =>
  record.authenticatedOwnerProjection.ownerKey).join('|')
    === 'visual_intelligence|track_all',
'Canonical records preserve the deterministic two-owner order.')
check(records.every((record) =>
  record.authenticatedOwnerProjection.artifactRefs.every((artifact) =>
    artifact.sourceSupportRequestRef?.contentHash
      === record.selectedSupportRequest.requestDigestSha256)),
'Every current owner artifact binds its exact selected support request.')
check(records[1].promotedPriorSupportArtifactRefs.every((artifact) =>
  artifact.sourceSupportRequestRef === null)
  && records[1].resumedCall.inputArtifactRefs.some((artifact) =>
    artifact.artifactType
      === 'caption_visual_intelligence_occupancy_evidence'),
'Prior owner evidence is promoted to canonical input before the next owner.')

const sequence = createCaptionCanonicalSpecialistResumeSequence({
  sequenceId: 'captions.resume.read.sequence.1',
  initialCall: run.initialCall,
  initialResult: run.initialResult,
  records,
})
check(sequence.stepCount === 2
  && sequence.ownerOrder.join('|') === 'visual_intelligence|track_all'
  && sequence.finalDisposition === 'completed',
'Caption consumes the exact complete canonical sequential-resume chain.')
check(parseCaptionCanonicalSpecialistResumeSequence(sequence)
  .sequenceDigestSha256 === sequence.sequenceDigestSha256,
'The Caption sequence survives closed digest reread.')
check(sequence.finalCallRef.contentHash
  === run.resumeSteps[1].resumedCall.callDigestSha256
  && sequence.finalResultRef.contentHash
    === run.finalResult.resultDigestSha256,
'The sequence binds the exact final call and completed result.')
check(!sequence.directPeerDispatchPerformed
  && !sequence.providerCallPerformedByCaption
  && !sequence.runtimeExecutionPerformedByCaption
  && !sequence.assetMutationPerformedByCaption
  && !sequence.finalQaApprovalGrantedByCaption
  && !sequence.productionAuthorityGranted,
'Consuming the canonical ledger grants Caption no execution or QA authority.')

const receipt = parseCaptionCanonicalSpecialistResumeReadAdapterReceipt(
  CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_RECEIPT)
const copiedPublicTypeSha = hash(readFileSync(new URL(
  '../../src/types/canonical-specialist-support-resume.ts', import.meta.url)))
check(copiedPublicTypeSha === receipt.backendSource.publicTypeFileSha256,
'The shared canonical resume public type is byte-for-byte identical.')
check(receipt.backendSource.sourceCommit
  === '832f56fc41c90413f6c99cc70d5cd658c8e44675'
  && receipt.canonicalResumeRecordVersion
    === 'canonical-specialist-support-resume-record-v1',
'The Caption adapter freezes the exact published backend source contract.')
check(!receipt.backendImplementationImported
  && !receipt.canonicalPersistenceReaderMounted
  && !receipt.authenticatedOwnerAdaptersMounted
  && !receipt.actualCanonicalResumeRecordConsumed,
'Source compatibility does not claim mounted backend owner results.')

const staleRecord = structuredClone(records[0])
staleRecord.stepOrdinal = 2
expectThrow(() => parseCaptionCanonicalSpecialistSupportResumeRecord(
  staleRecord))
const wrongOwnerRecord = structuredClone(records[0])
wrongOwnerRecord.authenticatedOwnerProjection.ownerKey = 'track_all'
const wrongOwnerProjection = redigest(
  wrongOwnerRecord.authenticatedOwnerProjection as unknown as
    Record<string, unknown>, 'projectionDigestSha256')
wrongOwnerRecord.authenticatedOwnerProjection =
  wrongOwnerProjection as unknown as
    CanonicalAuthenticatedSpecialistSupportArtifactProjection
expectThrow(() => parseCaptionCanonicalSpecialistSupportResumeRecord(
  redigest(wrongOwnerRecord as unknown as Record<string, unknown>,
    'recordDigestSha256')))
const crossedArtifactRecord = structuredClone(records[0])
crossedArtifactRecord.authenticatedOwnerProjection.artifactRefs[0]
  .sourceSupportRequestRef = requestRef(
    records[1].selectedSupportRequest)
crossedArtifactRecord.authenticatedOwnerProjection = redigest(
  crossedArtifactRecord.authenticatedOwnerProjection as unknown as
    Record<string, unknown>, 'projectionDigestSha256') as unknown as
      CanonicalAuthenticatedSpecialistSupportArtifactProjection
expectThrow(() => parseCaptionCanonicalSpecialistSupportResumeRecord(
  redigest(crossedArtifactRecord as unknown as Record<string, unknown>,
    'recordDigestSha256')))
const crossedRequestRecord = structuredClone(records[0])
crossedRequestRecord.selectedSupportRequest = structuredClone(
  records[1].selectedSupportRequest)
expectThrow(() => parseCaptionCanonicalSpecialistSupportResumeRecord(
  redigest(crossedRequestRecord as unknown as Record<string, unknown>,
    'recordDigestSha256')))
const overclaimRecord = structuredClone(records[0]) as unknown as
  Record<string, unknown>
overclaimRecord.runtimeExecutionPerformedByResumeOwner = true
expectThrow(() => parseCaptionCanonicalSpecialistSupportResumeRecord(
  redigest(overclaimRecord, 'recordDigestSha256')))
const missingPromotionRecord = structuredClone(records[1])
missingPromotionRecord.resumedCall.inputArtifactRefs =
  structuredClone(records[1].priorCall.inputArtifactRefs)
missingPromotionRecord.resumedCall = redigest(
  missingPromotionRecord.resumedCall as unknown as Record<string, unknown>,
  'callDigestSha256') as unknown as OrchestraSkillCall
missingPromotionRecord.resumedResult.originalCallRef =
  callRef(missingPromotionRecord.resumedCall)
missingPromotionRecord.resumedResult = redigest(
  missingPromotionRecord.resumedResult as unknown as Record<string, unknown>,
  'resultDigestSha256') as unknown as
    typeof missingPromotionRecord.resumedResult
expectThrow(() => parseCaptionCanonicalSpecialistSupportResumeRecord(
  redigest(missingPromotionRecord as unknown as Record<string, unknown>,
    'recordDigestSha256')))

expectThrow(() => createCaptionCanonicalSpecialistResumeSequence({
  sequenceId: 'captions.resume.read.sequence.reversed',
  initialCall: run.initialCall,
  initialResult: run.initialResult,
  records: [records[1], records[0]],
}))
expectThrow(() => createCaptionCanonicalSpecialistResumeSequence({
  sequenceId: 'captions.resume.read.sequence.crossed',
  initialCall: run.resumeSteps[0].resumedCall,
  initialResult: run.resumeSteps[0].resumedResult,
  records,
}))
expectThrow(() => createCaptionCanonicalSpecialistResumeSequence({
  sequenceId: 'captions.resume.read.sequence.incomplete',
  initialCall: run.initialCall,
  initialResult: run.initialResult,
  records: [records[0]],
}))
const staleSequence = structuredClone(sequence)
staleSequence.ownerOrder.reverse()
expectThrow(() => parseCaptionCanonicalSpecialistResumeSequence(staleSequence))
const unsafeRecord = structuredClone(records[0]) as unknown as
  Record<string, unknown>
unsafeRecord.recordId = '/tmp/resume-record'
expectThrow(() => parseCaptionCanonicalSpecialistSupportResumeRecord(
  redigest(unsafeRecord, 'recordDigestSha256')))
const inherited = Object.create({ productionAuthorityGranted: true })
Object.assign(inherited, structuredClone(records[0]))
expectThrow(() => parseCaptionCanonicalSpecialistSupportResumeRecord(inherited))
const cyclic = structuredClone(records[0]) as unknown as Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() => parseCaptionCanonicalSpecialistSupportResumeRecord(cyclic))

console.log(JSON.stringify({
  smoke: 'captions_specialist_canonical_resume_read',
  assertions,
  sourceCommit: receipt.backendSource.sourceCommit,
  sourcePublicTypeSha256: copiedPublicTypeSha,
  adapterVersion: receipt.schemaVersion,
  adapterDigestSha256: receipt.adapterDigestSha256,
  sequenceVersion: sequence.schemaVersion,
  sequenceDigestSha256: sequence.sequenceDigestSha256,
  ownerOrder: sequence.ownerOrder,
  authenticatedOwnerSourceFixturesInjected: true,
  strictCaptionRuntimeCompleted: run.finalResult.disposition === 'completed',
  liveProviderOrGpuRuntimeObservedByFixtureBuilder:
    authenticatedOwnerFixture.liveProviderOrGpuRuntimeObservedByFixtureBuilder,
  actualCanonicalResumeRecordConsumed: false,
  productionAuthorityGranted: false,
  result: 'passed',
}, null, 2))
