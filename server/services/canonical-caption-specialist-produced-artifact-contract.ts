import {
  CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION,
  type CanonicalCaptionSpecialistExecutionReceipt,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CAPTIONS_CAP_01_ARTIFACT_TYPE,
  CAPTIONS_CROSS_SYSTEM_COORDINATION_JOB_TYPE,
  CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES,
  CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES,
  CAPTIONS_SUPPORT_JOB_TYPES,
  type CaptionsSupportJobType,
} from '../../src/types/captions-specialist'
import {
  CAPTION_CROSS_SYSTEM_COORDINATION_PLAN_ARTIFACT_TYPE,
  CAPTION_CROSS_SYSTEM_HANDOFF_ARTIFACT_TYPE,
  CAPTION_CROSS_SYSTEM_OUTBOUND_PAYLOAD_ARTIFACT_TYPE,
} from '../../src/types/caption-cross-system-coordination'
import type { SkillArtifactRef } from
  '../../src/types/orchestra-skill-contracts'
import { sha256AuthorityValue } from './private-edit-authority-store'

const AGGREGATE_CROSS_SYSTEM_RECEIVER_COUNT = 8

export function canonicalCaptionProducedArtifactRefsDigest(
  refs: readonly SkillArtifactRef[],
): string {
  return sha256AuthorityValue(refs)
}

/**
 * Verifies the exact artifact multiplicity admitted by the Caption runtime.
 * This is intentionally stricter than the capability manifest's set of
 * artifact types: the manifest cannot express repeated aggregate handoffs.
 */
export function assertCanonicalCaptionCompletedProducedArtifacts(input: {
  readonly receipt: CanonicalCaptionSpecialistExecutionReceipt
  readonly producedArtifactRefs: readonly SkillArtifactRef[]
}): void {
  const refs = input.producedArtifactRefs
  const receipt = input.receipt
  if (receipt.resultDisposition !== 'completed'
    || refs.some((ref) => ref.producerSkillKey !== 'captions'
      || ref.privateArtifact !== true
      || ref.byteFreeRef !== true)
    || new Set(refs.map((ref) => ref.id)).size !== refs.length) {
    throw new Error(
      'Canonical Caption completed artifact identity or authority is invalid.',
    )
  }

  const expectedCounts = new Map<string, number>([
    [CAPTIONS_CAP_01_ARTIFACT_TYPE, 1],
  ])
  const supportJob = (CAPTIONS_SUPPORT_JOB_TYPES as readonly string[])
    .includes(receipt.captionJobType)
  const crossSystemJob = (
    CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES as readonly string[])
    .includes(receipt.captionJobType)
  if (supportJob) {
    expectedCounts.set(CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES[
      receipt.captionJobType as CaptionsSupportJobType], 1)
  }

  const v2 = receipt.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION
  const hasCrossSystemInput = v2
    && receipt.crossSystemExecutionInputRef !== null
  if (hasCrossSystemInput !== crossSystemJob) {
    throw new Error(
      'Canonical Caption cross-system receipt and job are inconsistent.',
    )
  }
  if (hasCrossSystemInput) {
    const aggregate = receipt.captionJobType ===
      CAPTIONS_CROSS_SYSTEM_COORDINATION_JOB_TYPE
    expectedCounts.set(
      CAPTION_CROSS_SYSTEM_COORDINATION_PLAN_ARTIFACT_TYPE,
      aggregate ? 1 : 0,
    )
    expectedCounts.set(
      CAPTION_CROSS_SYSTEM_OUTBOUND_PAYLOAD_ARTIFACT_TYPE,
      aggregate ? AGGREGATE_CROSS_SYSTEM_RECEIVER_COUNT : 1,
    )
    expectedCounts.set(
      CAPTION_CROSS_SYSTEM_HANDOFF_ARTIFACT_TYPE,
      aggregate ? AGGREGATE_CROSS_SYSTEM_RECEIVER_COUNT : 1,
    )
  }

  const actualCounts = new Map<string, number>()
  for (const ref of refs) {
    actualCounts.set(ref.artifactType,
      (actualCounts.get(ref.artifactType) ?? 0) + 1)
  }
  const normalizedExpected = [...expectedCounts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
  const normalizedActual = [...actualCounts.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
  if (JSON.stringify(normalizedActual) !== JSON.stringify(normalizedExpected)) {
    throw new Error(
      'Canonical Caption completed artifacts do not match the exact job contract.',
    )
  }

  const baseRef = refs.find((ref) =>
    ref.artifactType === CAPTIONS_CAP_01_ARTIFACT_TYPE)
  const nonBaseRefs = refs.filter((ref) =>
    ref.artifactType !== CAPTIONS_CAP_01_ARTIFACT_TYPE)
  const sourceRequestRefs = nonBaseRefs.map((ref) =>
    ref.sourceSupportRequestRef)
  if (baseRef?.sourceSupportRequestRef !== null
    || (supportJob && sourceRequestRefs.some((ref) => ref === null))
    || (!supportJob && sourceRequestRefs.some((ref) => ref !== null))) {
    throw new Error(
      'Canonical Caption produced artifacts crossed support-request lineage.',
    )
  }
  if (supportJob) {
    const first = sourceRequestRefs[0]!
    if (sourceRequestRefs.some((ref) => ref === null
      || ref.id !== first?.id
      || ref.version !== first?.version
      || ref.contentHash !== first?.contentHash)) {
      throw new Error(
        'Canonical Caption support artifacts do not share one exact request.',
      )
    }
  }

  if (v2) {
    if (receipt.producedArtifactCount !== refs.length
      || receipt.producedArtifactRefsDigestSha256 !==
        canonicalCaptionProducedArtifactRefsDigest(refs)
      || receipt.exactProducedArtifactRefsBound !== true
      || receipt.crossSystemExecutionInputPersistedCreateOnlyAndReread !==
        (receipt.crossSystemExecutionInputRef !== null)) {
      throw new Error(
        'Canonical Caption V2 receipt does not bind its exact artifacts.',
      )
    }
  } else if (refs.length !== 1 || crossSystemJob || supportJob) {
    throw new Error(
      'Canonical Caption V1 receipt cannot admit a multi-artifact job.',
    )
  }
}
