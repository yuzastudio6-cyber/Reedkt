import { z } from 'zod'

import type {
  OrchestraEvidenceRef,
  SkillCapabilityManifest,
  SkillQualificationSnapshot,
} from '../../src/types/orchestra-skill-capability'
import {
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
} from '../../src/types/orchestra-skill-capability'
import type {
  CanonicalSkillQualificationRegistry,
} from '../orchestra/canonical-skill-qualification-registry'
import {
  createSkillQualificationSnapshot,
  orchestraDigest,
  orchestraEvidenceRef,
  parseSkillCapabilityManifest,
  parseSkillQualificationSnapshot,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  createVisualIntelligenceOrchestraCapabilityManifestForQualification,
  createVisualIntelligenceOrchestraQualificationSnapshot,
  listVisualIntelligenceOrchestraJobDefinitions,
  listVisualIntelligenceOrchestraResidualBlockersAfterRuntimeRelease,
} from './visual-intelligence-orchestra-capability-manifest'
import {
  assertAdmittedVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
  type VisualIntelligenceRuntimeRelease,
} from './visual-intelligence-runtime-release'

export const VISUAL_INTELLIGENCE_ORCHESTRA_QUALIFICATION_PUBLISHER_VERSION =
  'visual-intelligence-orchestra-qualification-publisher-v1' as const
export const VISUAL_INTELLIGENCE_ORCHESTRA_QUALIFICATION_PUBLICATION_RECEIPT_VERSION =
  'visual-intelligence-orchestra-qualification-publication-receipt-v1' as const
export const VISUAL_INTELLIGENCE_ORCHESTRA_RUNTIME_QUALIFICATION_SNAPSHOT_ID =
  'visual-intelligence-orchestra-runtime-release-qualification-v1' as const

const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const receiptWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_ORCHESTRA_QUALIFICATION_PUBLICATION_RECEIPT_VERSION,
  ),
  publisherVersion: z.literal(
    VISUAL_INTELLIGENCE_ORCHESTRA_QUALIFICATION_PUBLISHER_VERSION,
  ),
  source: z.literal(
    'canonical_server_visual_intelligence_orchestra_qualification_publisher',
  ),
  evidenceClass: z.literal(
    'exact_admitted_runtime_release_and_canonical_registry_reread',
  ),
  runtimeReleaseRef: evidenceRefSchema,
  manifestRef: evidenceRefSchema,
  qualificationSnapshotRef: evidenceRefSchema,
  registryRecordRef: evidenceRefSchema,
  qualifiedJobTypes: z.array(safeId).max(256),
  blockedJobs: z.array(z.object({
    jobType: safeId,
    blockerCodes: z.array(safeId).min(1).max(32),
  }).strict()).max(256),
  disposition: z.enum(['created', 'identical_replay']),
  exactRuntimeReleaseRereadVerified: z.literal(true),
  exactCanonicalManifestQualificationCreateOnlyReread: z.literal(true),
  callerCanSelfQualify: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  gpuJobStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict().superRefine((value, context) => {
  const qualified = value.qualifiedJobTypes
  const blocked = value.blockedJobs.map((item) => item.jobType)
  const allJobs = [...qualified, ...blocked].sort(compareUtf16)
  const expectedJobs = listVisualIntelligenceOrchestraJobDefinitions()
    .map((item) => item.jobType)
  const refs = [
    value.runtimeReleaseRef,
    value.manifestRef,
    value.qualificationSnapshotRef,
    value.registryRecordRef,
  ].map(refKey)
  if (
    !orderedUnique(qualified)
    || !orderedUnique(blocked)
    || qualified.length === 0
    || blocked.length === 0
    || qualified.some((jobType) => blocked.includes(jobType))
    || value.blockedJobs.some((item) => !orderedUnique(item.blockerCodes))
    || JSON.stringify(allJobs) !== JSON.stringify(expectedJobs)
    || new Set(refs).size !== refs.length
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence publication receipt job sets are invalid.',
  })
})

const receiptSchema = receiptWithoutDigestSchema.extend({
  receiptDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceOrchestraQualificationPublicationReceipt =
  z.infer<typeof receiptSchema>

export interface VisualIntelligenceOrchestraQualificationPublisherDependencies {
  readonly qualificationRegistry: CanonicalSkillQualificationRegistry
}

/**
 * Publishes the Orchestra qualification produced by one exact admitted
 * Visual Intelligence runtime release.  The release may qualify the common
 * Gemini/native-media path, but it cannot self-qualify Track All, exact OCR,
 * complete-time deterministic QA, private review, or final approval.
 */
export function createVisualIntelligenceOrchestraQualificationPublisher(
  dependencies: VisualIntelligenceOrchestraQualificationPublisherDependencies,
) {
  assertDependencies(dependencies)
  return Object.freeze({
    publish: async (input: {
      readonly runtimeRelease: VisualIntelligenceRuntimeRelease
      readonly observedAt: string
    }): Promise<VisualIntelligenceOrchestraQualificationPublicationReceipt> => {
      const observedAt = timestamp.parse(input.observedAt)
      const runtimeRelease = assertAdmittedVisualIntelligenceRuntimeRelease(
        input.runtimeRelease,
      )
      const runtimeReleaseRef = toOrchestraRef(
        visualIntelligenceRuntimeReleaseRef(runtimeRelease),
      )
      const sourceSnapshot =
        createVisualIntelligenceOrchestraQualificationSnapshot()
      const sourceManifest =
        createVisualIntelligenceOrchestraCapabilityManifestForQualification(
          sourceSnapshot,
        )
      const jobs = listVisualIntelligenceOrchestraJobDefinitions()
      const jobQualifications = jobs.map((job) => {
        const blockerCodes =
          listVisualIntelligenceOrchestraResidualBlockersAfterRuntimeRelease(
            job,
          )
        if (blockerCodes.length > 0) return Object.freeze({
          jobType: job.jobType,
          status: 'blocked' as const,
          blockerCodes,
          qualifiedRouteIds: [],
          qualificationEvidenceRefs: [],
        })
        const qualifiedRouteIds = sourceManifest.toolRoutes
          .filter((route) => route.jobTypes.includes(job.jobType))
          .map((route) => route.routeId)
          .sort(compareUtf16)
        return Object.freeze({
          jobType: job.jobType,
          status: 'qualified' as const,
          blockerCodes: [],
          qualifiedRouteIds,
          qualificationEvidenceRefs: qualificationRefs(
            runtimeRelease,
            runtimeReleaseRef,
          ),
        })
      })
      const qualificationSnapshot = createSkillQualificationSnapshot({
        schemaVersion: ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
        snapshotId:
          VISUAL_INTELLIGENCE_ORCHESTRA_RUNTIME_QUALIFICATION_SNAPSHOT_ID,
        skillKey: sourceSnapshot.skillKey,
        skillVersion: sourceSnapshot.skillVersion,
        contractVersion: sourceSnapshot.contractVersion,
        capabilityDefinitionDigestSha256:
          sourceSnapshot.capabilityDefinitionDigestSha256,
        observedReleaseRef: runtimeReleaseRef,
        observedAt,
        overall: jobQualifications.every((item) =>
          item.status === 'qualified') ? 'qualified' : 'partially_qualified',
        jobQualifications,
        callerCanSelfQualify: false,
        qualificationOwner: 'canonical_skill_qualification_registry',
        dispatchAuthorityGranted: false,
        providerAuthorityGranted: false,
        billingAuthorityGranted: false,
        publicDeliveryAuthorityGranted: false,
        productionAuthorityGranted: false,
      })
      const manifest =
        createVisualIntelligenceOrchestraCapabilityManifestForQualification(
          qualificationSnapshot,
        )
      const persisted = await dependencies.qualificationRegistry
        .persistCreateOnly({ manifest, qualificationSnapshot })
      const reread = await dependencies.qualificationRegistry.readExact({
        manifestRef: persisted.manifestRef,
        qualificationSnapshotRef: persisted.qualificationSnapshotRef,
      })
      const exact = parsePublishedVisualIntelligenceQualification(
        reread ?? {},
      )
      if (
        exact.manifest.manifestDigestSha256 !== manifest.manifestDigestSha256
        || exact.qualificationSnapshot.snapshotDigestSha256 !==
          qualificationSnapshot.snapshotDigestSha256
        || !sameRef(exact.qualificationSnapshot.observedReleaseRef,
          runtimeReleaseRef)
      ) throw new Error(
        'Visual Intelligence Orchestra qualification exact reread failed.',
      )
      const qualifiedJobTypes = qualificationSnapshot.jobQualifications
        .filter((item) => item.status === 'qualified')
        .map((item) => item.jobType)
      const blockedJobs = qualificationSnapshot.jobQualifications
        .filter((item) => item.status === 'blocked')
        .map((item) => ({
          jobType: item.jobType,
          blockerCodes: [...item.blockerCodes],
        }))
      const payload = receiptWithoutDigestSchema.parse({
        schemaVersion:
          VISUAL_INTELLIGENCE_ORCHESTRA_QUALIFICATION_PUBLICATION_RECEIPT_VERSION,
        publisherVersion:
          VISUAL_INTELLIGENCE_ORCHESTRA_QUALIFICATION_PUBLISHER_VERSION,
        source:
          'canonical_server_visual_intelligence_orchestra_qualification_publisher',
        evidenceClass:
          'exact_admitted_runtime_release_and_canonical_registry_reread',
        runtimeReleaseRef,
        manifestRef: persisted.manifestRef,
        qualificationSnapshotRef: persisted.qualificationSnapshotRef,
        registryRecordRef: persisted.registryRecordRef,
        qualifiedJobTypes,
        blockedJobs,
        disposition: persisted.disposition,
        exactRuntimeReleaseRereadVerified: true,
        exactCanonicalManifestQualificationCreateOnlyReread: true,
        callerCanSelfQualify: false,
        providerOrModelExecuted: false,
        gpuJobStarted: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        publishedAt: observedAt,
      })
      return Object.freeze(receiptSchema.parse({
        ...payload,
        receiptDigestSha256: orchestraDigest(payload),
      }))
    },
  })
}

export function parseVisualIntelligenceOrchestraQualificationPublicationReceipt(
  value: unknown,
): VisualIntelligenceOrchestraQualificationPublicationReceipt {
  const receipt = receiptSchema.parse(value)
  const payload = { ...receipt }
  Reflect.deleteProperty(payload, 'receiptDigestSha256')
  if (receipt.receiptDigestSha256 !== orchestraDigest(payload)) {
    throw new Error(
      'Visual Intelligence Orchestra qualification receipt is invalid.',
    )
  }
  return Object.freeze(receipt)
}

export function parsePublishedVisualIntelligenceQualification(input: {
  readonly manifest?: unknown
  readonly qualificationSnapshot?: unknown
}): Readonly<{
  manifest: SkillCapabilityManifest
  qualificationSnapshot: SkillQualificationSnapshot
}> {
  const qualificationSnapshot = parseSkillQualificationSnapshot(
    input.qualificationSnapshot,
  )
  const manifest = parseSkillCapabilityManifest({
    value: input.manifest,
    qualificationSnapshot,
  })
  if (
    manifest.skillKey !== 'visual_intelligence'
    || qualificationSnapshot.skillKey !== 'visual_intelligence'
    || qualificationSnapshot.overall !== 'partially_qualified'
    || qualificationSnapshot.jobQualifications.every((item) =>
      item.status !== 'qualified')
  ) throw new Error(
    'Published Visual Intelligence qualification is not an admitted release.',
  )
  return Object.freeze({ manifest, qualificationSnapshot })
}

function qualificationRefs(
  release: VisualIntelligenceRuntimeRelease,
  runtimeReleaseRef: OrchestraEvidenceRef,
): OrchestraEvidenceRef[] {
  const refs = [
    runtimeReleaseRef,
    release.providerModelAccessQualificationRef,
    release.providerTransportQualificationRef,
    release.sourceEvidencePreparationReleaseRef,
    release.structuredOutputQualificationRef,
    release.professionalHighQualityBenchmarkRef,
    release.accountEffectivePricingAuthorityRef,
    release.accountEffectiveCostSettlementOwnerRef,
  ].map(toOrchestraRef)
  return [...new Map(refs.map((ref) => [refKey(ref), ref])).values()]
    .sort((left, right) => compareUtf16(refKey(left), refKey(right)))
}

function toOrchestraRef(input: {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}): OrchestraEvidenceRef {
  return orchestraEvidenceRef(input.id, input.contentHash, input.version)
}

function refKey(ref: OrchestraEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function sameRef(left: OrchestraEvidenceRef, right: OrchestraEvidenceRef) {
  return refKey(left) === refKey(right)
}

function orderedUnique(values: string[]): boolean {
  return values.every((value, index) => index === 0
    || compareUtf16(values[index - 1]!, value) < 0)
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function assertDependencies(
  dependencies: VisualIntelligenceOrchestraQualificationPublisherDependencies,
): void {
  if (
    dependencies.qualificationRegistry?.schemaVersion !==
      'canonical-skill-qualification-registry-v1'
    || dependencies.qualificationRegistry.evidenceClass !==
      'private_create_only_exact_reread'
    || typeof dependencies.qualificationRegistry.persistCreateOnly !==
      'function'
    || typeof dependencies.qualificationRegistry.readExact !== 'function'
  ) throw new Error(
    'Visual Intelligence qualification publisher dependency is invalid.',
  )
}
