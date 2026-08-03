import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION,
  type OrchestraSkillCall,
  type OrchestraSkillJobResult,
  type SkillCapabilityManifest,
  type SkillQualificationSnapshot,
  type SkillSupportRequest,
} from '../../src/types/orchestra-skill-capability'

export const ORCHESTRA_SKILL_CAPABILITY_CONTRACT_VALIDATOR_VERSION =
  'orchestra-skill-capability-contract-validator-v1' as const

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/u
const DIGEST = /^sha256:[a-f0-9]{64}$/u
const UNSAFE_TEXT =
  /(?:https?:\/\/|file:|data:|blob:|javascript:|\/Users\/|\/Volumes\/|\/tmp\/|\\|x-goog-|api[_ -]?key|password|credential|secret|access[_ -]?token|refresh[_ -]?token|\bsk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/iu
const EXECUTABLE_TEXT =
  /(?:\b(?:curl|wget|powershell|bash|zsh|cmd\.exe)\b|\brm\s+-rf\b|\bsudo\b|<script\b|\$\([^)]*\)|`[^`]+`)/iu
const MAX_NODES = 100_000
const MAX_DEPTH = 64

const id = z.string().regex(SAFE_ID)
const version = z.string().regex(VERSION)
const digest = z.string().regex(DIGEST)
const narrative = z.string().trim().min(1).max(4_096)
  .superRefine((value, context) => {
    if (UNSAFE_TEXT.test(value) || EXECUTABLE_TEXT.test(value)) {
      context.addIssue({
        code: 'custom',
        message: 'Orchestra contract text contains unsafe serialized material.',
      })
    }
  })

const evidenceRefSchema = z.object({
  id,
  version: z.number().int().positive().max(1_000_000),
  contentHash: digest,
}).strict()

const frameRateSchema = z.object({
  numerator: z.number().int().positive().max(1_000_000),
  denominator: z.number().int().positive().max(1_000_000),
}).strict()

const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  endFrameExclusive: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  frameRate: frameRateSchema,
}).strict().superRefine((value, context) => {
  if (value.endFrameExclusive <= value.startFrame) {
    context.addIssue({ code: 'custom', message: 'Frame range must be non-empty.' })
  }
})

const videoScopeSchema = z.object({
  scopeType: z.literal('video'),
  sourceArtifactRef: evidenceRefSchema,
  authorizedRanges: z.array(frameRangeSchema).min(1).max(1_024),
  completeSourceCoverageRequired: z.boolean(),
  outputId: id.nullable(),
}).strict().superRefine((scope, context) => {
  if (!rangesAreOrderedAndNonOverlapping(scope.authorizedRanges)) {
    context.addIssue({
      code: 'custom',
      message: 'Video ranges must be ordered and non-overlapping.',
    })
  }
})

const sceneScopeSchema = z.object({
  scopeType: z.literal('scene'),
  sourceArtifactRef: evidenceRefSchema,
  sceneId: id,
  outputId: id,
  authorizedRange: frameRangeSchema,
  selectedSceneBindingRef: evidenceRefSchema,
  completeSceneCoverageRequired: z.boolean(),
}).strict()

const boundaryScopeSchema = z.object({
  scopeType: z.literal('boundary'),
  sourceArtifactRef: evidenceRefSchema,
  leftSceneId: id,
  rightSceneId: id,
  outputId: id,
  boundaryFrame: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  authorizedRange: frameRangeSchema,
  boundaryBindingRef: evidenceRefSchema,
}).strict().superRefine((scope, context) => {
  if (
    scope.leftSceneId === scope.rightSceneId
    || scope.boundaryFrame < scope.authorizedRange.startFrame
    || scope.boundaryFrame >= scope.authorizedRange.endFrameExclusive
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Boundary scope is not bound to two scenes and its exact range.',
    })
  }
})

const scopeSchema = z.discriminatedUnion('scopeType', [
  videoScopeSchema,
  sceneScopeSchema,
  boundaryScopeSchema,
])

const phaseSchema = z.enum([
  'planning',
  'preapproval',
  'approved_execution',
  'postrender_inspection',
  'revision_inspection',
  'private_review',
])

const refArray = (maximum: number) => z.array(evidenceRefSchema).max(maximum)
  .superRefine((values, context) => {
    if (!unique(values.map(refKey))) {
      context.addIssue({ code: 'custom', message: 'Evidence refs must be unique.' })
    }
  })

const orderedIds = (minimum = 0, maximum = 512) => z.array(id)
  .min(minimum).max(maximum).superRefine((values, context) => {
    if (!unique(values) || !ordered(values)) {
      context.addIssue({
        code: 'custom',
        message: 'Identifier sets must be unique and UTF-16 ordered.',
      })
    }
  })

const supportRequestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION),
  requestId: id,
  requestingSkillKey: id,
  requestingSkillJobId: id,
  parentOrchestraJobId: id,
  requiredCapability: id,
  requestedJobType: id,
  phase: phaseSchema,
  scope: scopeSchema,
  purposeCode: id,
  inputArtifactRefs: refArray(512),
  comparisonArtifactRefs: refArray(512),
  expectedOutcomeRefs: refArray(512),
  requiredEvidenceRefs: refArray(512),
  urgency: z.enum(['normal', 'blocking']),
  supportRequestOnly: z.literal(true),
  executionAuthorityGranted: z.literal(false),
  providerInvocationAuthorityGranted: z.literal(false),
  timelineMutationAuthorityGranted: z.literal(false),
  scopeExpansionAuthorityGranted: z.literal(false),
}).strict()

const supportRequestSchema = supportRequestWithoutDigestSchema.extend({
  requestDigestSha256: digest,
}).strict()

const callWithoutDigestSchema = z.object({
  schemaVersion: z.literal(ORCHESTRA_SKILL_CALL_VERSION),
  callId: id,
  orchestraPlanRef: evidenceRefSchema,
  orchestraJobRef: evidenceRefSchema,
  parentJobRef: evidenceRefSchema.nullable(),
  requestedBy: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('orchestra') }).strict(),
    z.object({
      kind: z.literal('skill'),
      skillKey: id,
      skillJobRef: evidenceRefSchema,
      supportRequestRef: evidenceRefSchema,
    }).strict(),
  ]),
  targetSkillKey: id,
  jobType: id,
  phase: phaseSchema,
  scope: scopeSchema,
  sceneContextSnapshotRef: evidenceRefSchema.nullable(),
  sourceArtifactRefs: refArray(512),
  comparisonArtifactRefs: refArray(512),
  expectedOutcomeRefs: refArray(512),
  requiredEvidenceRefs: refArray(512),
  manifestRef: evidenceRefSchema,
  qualificationSnapshotRef: evidenceRefSchema,
  timeBudgetRef: evidenceRefSchema,
  creditBudgetRef: evidenceRefSchema,
  attemptEnvelopeRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema.nullable(),
  idempotencyKey: id,
  orchestraDispatchAuthorized: z.literal(true),
  directProviderCallAllowed: z.literal(false),
  directTimelineMutationAllowed: z.literal(false),
  directArtifactMutationAllowed: z.literal(false),
  scopeExpansionAllowed: z.literal(false),
  peerSkillExecutionAuthorityAccepted: z.literal(false),
}).strict().superRefine((call, context) => {
  const approvedPhase = !['planning', 'preapproval'].includes(call.phase)
  if (
    approvedPhase !== (call.approvedSnapshotRef !== null)
    || (call.scope.scopeType !== 'video'
      && call.sceneContextSnapshotRef === null)
    || call.sourceArtifactRefs.length === 0
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Orchestra call is missing phase or bounded-scope authority.',
    })
  }
})

const callSchema = callWithoutDigestSchema.extend({
  callDigestSha256: digest,
}).strict()

const jobCapabilitySchema = z.object({
  jobType: id,
  purposeCode: id,
  supportedScopeTypes: z.array(z.enum(['video', 'scene', 'boundary']))
    .min(1).max(3).superRefine(enumSetRefinement),
  internalOperationId: id,
  requiredProfileIds: orderedIds(1, 32),
  partialResultAllowed: z.boolean(),
}).strict()

const inputRequirementSchema = z.object({
  requirementId: id,
  artifactType: id,
  requiredForJobTypes: orderedIds(1),
  minimumCount: z.number().int().nonnegative().max(512),
  maximumCount: z.number().int().positive().max(512),
  immutableRereadRequired: z.boolean(),
}).strict().superRefine((value, context) => {
  if (value.minimumCount > value.maximumCount) {
    context.addIssue({ code: 'custom', message: 'Input cardinality is invalid.' })
  }
})

const sceneContextRequirementSchema = z.object({
  requirementId: id,
  requiredForJobTypes: orderedIds(1),
  requiredAtScopeTypes: z.array(z.enum(['video', 'scene', 'boundary']))
    .min(1).max(3).superRefine(enumSetRefinement),
  exactSnapshotRequired: z.boolean(),
}).strict()

const evidenceRequirementSchema = z.object({
  requirementId: id,
  evidenceType: id,
  requiredForJobTypes: orderedIds(1),
  exactRereadRequired: z.boolean(),
}).strict()

const visualIntelligenceRequirementsSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('dependency'),
    requiredJobTypes: orderedIds(),
    optionalJobTypes: orderedIds(),
    resultMustReturnThroughOrchestra: z.literal(true),
  }).strict(),
  z.object({
    mode: z.literal('self'),
    providerNeutralConsumerContract: z.literal(true),
    internalSemanticProviderAllowed: z.literal(true),
    deterministicEvidenceRequired: z.literal(true),
    resultMustReturnThroughOrchestra: z.literal(true),
  }).strict(),
])

const trackingRequirementSchema = z.object({
  requirementId: id,
  requiredForJobTypes: orderedIds(1),
  trackingSkillKey: id,
  trackingArtifactTypes: orderedIds(1),
  optional: z.boolean(),
}).strict()

const dependencyRuleSchema = z.object({
  ruleId: id,
  otherSkillKey: id,
  appliesToJobTypes: orderedIds(1),
  conditionCode: id,
}).strict()

const conflictRuleSchema = z.object({
  ruleId: id,
  otherSkillKey: id,
  appliesToJobTypes: orderedIds(1),
  reasonCode: id,
}).strict()

const overlapRuleSchema = z.object({
  ruleId: id,
  otherSkillKey: id,
  appliesToJobTypes: orderedIds(1),
  ownershipBoundaryCode: id,
}).strict()

const toolRouteSchema = z.object({
  routeId: id,
  jobTypes: orderedIds(1),
  routeKind: z.enum([
    'deterministic_tool', 'managed_provider', 'gpu_model',
  ]),
  operationId: id,
  executionClass: z.enum([
    'managed_provider', 'l4_gpu_standard', 'a100_80gb_gpu_heavy',
  ]),
  toolOrProviderId: id,
  currentQualificationRequired: z.literal(true),
  accountEffectivePricingRequired: z.boolean(),
}).strict()

const fallbackRouteSchema = z.object({
  routeId: id,
  jobTypes: orderedIds(1),
  triggerCodes: orderedIds(1),
  routeKind: z.enum([
    'classified_gpu_fallback',
    'deterministic_only',
    'human_review',
    'return_to_orchestra',
  ]),
  targetRouteId: id.nullable(),
  qualityReductionAllowed: z.literal(false),
  newOrchestraAuthorizationRequired: z.boolean(),
}).strict().superRefine((route, context) => {
  if (
    (route.routeKind === 'classified_gpu_fallback')
      !== (route.targetRouteId !== null)
  ) context.addIssue({
    code: 'custom',
    message: 'Only a classified GPU fallback may name a target route.',
  })
})

const lowerCostRouteSchema = z.object({
  routeId: id,
  jobTypes: orderedIds(1),
  optimizationCode: id,
  qualityReductionAllowed: z.literal(false),
  newOrchestraAuthorizationRequired: z.boolean(),
}).strict()

const qaPolicySchema = z.object({
  policyId: id,
  policyVersion: version,
  requiredCheckIds: orderedIds(1),
  blockingFailureCodes: orderedIds(1),
  independentQaOwnerRequired: z.boolean(),
}).strict()

const invalidationRuleSchema = z.object({
  ruleId: id,
  changedAuthorityType: id,
  invalidatesJobTypes: orderedIds(1),
  newOrchestraCallRequired: z.literal(true),
}).strict()

const revisionRuleSchema = z.object({
  ruleId: id,
  appliesToJobTypes: orderedIds(1),
  revisionOwner: z.enum(['requesting_skill', 'orchestra', 'human_review']),
  newApprovedSnapshotRequired: z.boolean(),
  maximumAutomaticCycles: z.number().int().nonnegative().max(10),
}).strict()

const qualificationFixtureSchema = z.object({
  fixtureId: id,
  fixtureVersion: version,
  jobTypes: orderedIds(1),
  requiredEvidenceTypes: orderedIds(1),
  currentEvidenceRef: evidenceRefSchema.nullable(),
}).strict()

const jobQualificationSchema = z.object({
  jobType: id,
  status: z.enum(['qualified', 'blocked', 'disabled']),
  blockerCodes: orderedIds(),
  qualifiedRouteIds: orderedIds(),
  qualificationEvidenceRefs: refArray(64),
}).strict().superRefine((qualification, context) => {
  const qualified = qualification.status === 'qualified'
  if (
    qualified !== (qualification.blockerCodes.length === 0)
    || qualified !== (qualification.qualifiedRouteIds.length > 0)
    || qualified !== (qualification.qualificationEvidenceRefs.length > 0)
  ) context.addIssue({
    code: 'custom',
    message: 'Job qualification evidence and disposition disagree.',
  })
})

const qualificationSnapshotWithoutDigestSchema = z.object({
  schemaVersion: z.literal(ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION),
  snapshotId: id,
  skillKey: id,
  skillVersion: version,
  contractVersion: version,
  capabilityDefinitionDigestSha256: digest,
  observedReleaseRef: evidenceRefSchema,
  observedAt: z.string().datetime({ offset: true }),
  overall: z.enum(['qualified', 'partially_qualified', 'blocked', 'disabled']),
  jobQualifications: z.array(jobQualificationSchema).min(1).max(256),
  callerCanSelfQualify: z.literal(false),
  qualificationOwner: z.literal('canonical_skill_qualification_registry'),
  dispatchAuthorityGranted: z.literal(false),
  providerAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((snapshot, context) => {
  const jobTypes = snapshot.jobQualifications.map((item) => item.jobType)
  const statuses = new Set(snapshot.jobQualifications.map((item) => item.status))
  const exactOverall = snapshot.overall === (
    statuses.size === 1 && statuses.has('qualified')
      ? 'qualified'
      : statuses.size === 1 && statuses.has('blocked')
        ? 'blocked'
        : statuses.size === 1 && statuses.has('disabled')
          ? 'disabled'
          : 'partially_qualified'
  )
  if (!unique(jobTypes) || !ordered(jobTypes) || !exactOverall) {
    context.addIssue({
      code: 'custom',
      message: 'Qualification set or aggregate status is invalid.',
    })
  }
})

const qualificationSnapshotSchema =
  qualificationSnapshotWithoutDigestSchema.extend({
    snapshotDigestSha256: digest,
  }).strict()

const qualificationStatusSchema = z.object({
  overall: z.enum(['qualified', 'partially_qualified', 'blocked', 'disabled']),
  qualificationSnapshotRef: evidenceRefSchema,
  qualifiedJobTypes: orderedIds(),
  blockedJobTypes: z.array(z.object({
    jobType: id,
    blockerCodes: orderedIds(1),
  }).strict()).max(256).superRefine((values, context) => {
    const jobTypes = values.map((item) => item.jobType)
    if (!unique(jobTypes) || !ordered(jobTypes)) {
      context.addIssue({
        code: 'custom',
        message: 'Blocked qualification jobs must be unique and ordered.',
      })
    }
  }),
}).strict()

const manifestWithoutDigestsSchema = z.object({
  schemaVersion: z.literal(ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION),
  manifestId: id,
  qualificationStatus: qualificationStatusSchema,
  skillKey: id,
  skillVersion: version,
  contractVersion: version,
  skillClass: z.enum([
    'creative_owner', 'analysis_support', 'media_utility',
    'tracking_support', 'qa_support',
  ]),
  coordinationCritical: z.boolean(),
  canOwnPrimaryVisual: z.boolean(),
  canOwnPrimaryAnalysis: z.boolean(),
  canActAsSupport: z.boolean(),
  canOperateAtVideoLevel: z.boolean(),
  canOperateAtSceneLevel: z.boolean(),
  canOperateAtBoundaryLevel: z.boolean(),
  supportedJobTypes: z.array(jobCapabilitySchema).min(1).max(256),
  unsupportedJobTypes: orderedIds(),
  requiredInputs: z.array(inputRequirementSchema).max(128),
  optionalInputs: z.array(inputRequirementSchema).max(128),
  requiredSceneContext: z.array(sceneContextRequirementSchema).max(128),
  requiredSourceEvidence: z.array(evidenceRequirementSchema).max(128),
  visualIntelligenceRequirements: visualIntelligenceRequirementsSchema,
  trackingRequirements: z.array(trackingRequirementSchema).max(128),
  acceptedArtifactTypes: orderedIds(1),
  producedArtifactTypes: orderedIds(1),
  planningPhase: phaseSchema,
  allowedExecutionPhases: z.array(phaseSchema).min(1).max(6)
    .superRefine(enumSetRefinement),
  mustRunBefore: z.array(dependencyRuleSchema).max(128),
  mustRunAfter: z.array(dependencyRuleSchema).max(128),
  conflictsWith: z.array(conflictRuleSchema).max(128),
  mayOverlapWith: z.array(overlapRuleSchema).max(128),
  ownershipRequirements: z.object({
    orchestraOwnsInvocation: z.literal(true),
    orchestraOwnsWorkGraph: z.literal(true),
    skillOwnsProducedArtifacts: z.boolean(),
    skillOwnsPrimaryVisual: z.boolean(),
    skillOwnsAnalysisReport: z.boolean(),
    requestingSkillOwnsRepair: z.boolean(),
    finalQaOwnedElsewhere: z.literal(true),
  }).strict(),
  timeEstimator: z.object({
    estimatorId: id,
    estimatorVersion: version,
    inputFactors: orderedIds(1),
  }).strict(),
  creditEstimator: z.object({
    estimatorId: id,
    estimatorVersion: version,
    inputFactors: orderedIds(1),
  }).strict(),
  attemptPolicy: z.object({
    maximumPlannedPasses: z.number().int().positive().max(10),
    maximumAttemptsPerPass: z.number().int().positive().max(5),
    automaticRetryOnUnknownOutcome: z.boolean(),
    maximumAutomaticRepairCycles: z.number().int().nonnegative().max(10),
    scopeExpansionRequiresNewOrchestraCall: z.literal(true),
  }).strict(),
  toolRoutes: z.array(toolRouteSchema).min(1).max(128),
  fallbackRoutes: z.array(fallbackRouteSchema).min(1).max(128),
  lowerCostRoutes: z.array(lowerCostRouteSchema).max(128),
  planningQa: qaPolicySchema,
  outputQa: qaPolicySchema,
  integrationQa: qaPolicySchema,
  invalidationRules: z.array(invalidationRuleSchema).min(1).max(128),
  revisionRules: z.array(revisionRuleSchema).min(1).max(128),
  qualificationFixtures: z.array(qualificationFixtureSchema).min(1).max(128),
  knownLimitations: z.array(narrative).min(1).max(128),
  invocationPolicy: z.object({
    orchestraDispatchRequired: z.literal(true),
    directUserInvocationAllowed: z.literal(false),
    directPeerSkillInvocationAllowed: z.literal(false),
    peerSkillSupportRequestAllowed: z.boolean(),
    internalProviderInvocationAllowed: z.boolean(),
  }).strict(),
  resultContract: z.object({
    resultSchemaVersion: version,
    resultArtifactTypes: orderedIds(1),
    resultReturnsToOrchestra: z.literal(true),
    directMutationResultAllowed: z.literal(false),
  }).strict(),
  failureSemantics: z.object({
    failClosed: z.literal(true),
    partialResultAllowedForJobTypes: orderedIds(),
    hiddenFallbackAllowed: z.literal(false),
    unresolvedResultReturnsToOrchestra: z.literal(true),
  }).strict(),
  securityPolicyRef: evidenceRefSchema,
}).strict().superRefine((manifest, context) => {
  const jobTypes = manifest.supportedJobTypes.map((item) => item.jobType)
  const ruleCollections = [
    manifest.requiredInputs,
    manifest.optionalInputs,
    manifest.requiredSceneContext,
    manifest.requiredSourceEvidence,
    manifest.trackingRequirements,
    manifest.mustRunBefore,
    manifest.mustRunAfter,
    manifest.conflictsWith,
    manifest.mayOverlapWith,
    manifest.toolRoutes,
    manifest.fallbackRoutes,
    manifest.lowerCostRoutes,
    manifest.invalidationRules,
    manifest.revisionRules,
    manifest.qualificationFixtures,
  ] as Array<Array<Record<string, unknown>>>
  const everyRuleSetOrdered = ruleCollections.every((items) => {
    const keys = items.map((item) => String(
      item.requirementId ?? item.ruleId ?? item.routeId ?? item.fixtureId,
    ))
    return unique(keys) && ordered(keys)
  })
  const qualified = new Set(manifest.qualificationStatus.qualifiedJobTypes)
  const blocked = new Set(
    manifest.qualificationStatus.blockedJobTypes.map((item) => item.jobType),
  )
  if (
    !unique(jobTypes)
    || !ordered(jobTypes)
    || !everyRuleSetOrdered
    || jobTypes.some((jobType) => manifest.unsupportedJobTypes.includes(jobType))
    || [...qualified].some((jobType) => blocked.has(jobType))
    || [...qualified, ...blocked].some((jobType) => !jobTypes.includes(jobType))
    || manifest.ownershipRequirements.skillOwnsPrimaryVisual
      !== manifest.canOwnPrimaryVisual
  ) context.addIssue({
    code: 'custom',
    message: 'Skill manifest coverage, ordering, or ownership is invalid.',
  })
})

const manifestSchema = manifestWithoutDigestsSchema.extend({
  capabilityDefinitionDigestSha256: digest,
  manifestDigestSha256: digest,
}).strict()

const resultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(ORCHESTRA_SKILL_JOB_RESULT_VERSION),
  resultId: id,
  callRef: evidenceRefSchema,
  manifestRef: evidenceRefSchema,
  qualificationSnapshotRef: evidenceRefSchema,
  targetSkillKey: id,
  jobType: id,
  phase: phaseSchema,
  scope: scopeSchema,
  disposition: z.enum(['completed', 'needs_followup', 'blocked', 'failed']),
  producedArtifactRefs: refArray(512),
  evidenceRefs: refArray(512),
  proposedFollowupRanges: z.array(frameRangeSchema).max(1_024),
  followupReasonCode: id.nullable(),
  estimatedAdditionalTimeRef: evidenceRefSchema.nullable(),
  estimatedAdditionalCreditsRef: evidenceRefSchema.nullable(),
  resultReturnsToOrchestra: z.literal(true),
  directTimelineMutationPerformed: z.literal(false),
  directArtifactMutationPerformed: z.literal(false),
  scopeExpandedWithoutOrchestra: z.literal(false),
  providerAuthorityGrantedToCaller: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((result, context) => {
  const followup = result.disposition === 'needs_followup'
  if (
    followup !== (result.proposedFollowupRanges.length > 0)
    || followup !== (result.followupReasonCode !== null)
    || followup !== (result.estimatedAdditionalTimeRef !== null)
    || followup !== (result.estimatedAdditionalCreditsRef !== null)
    || (result.disposition === 'completed'
      && result.producedArtifactRefs.length === 0)
  ) context.addIssue({
    code: 'custom',
    message: 'Skill result disposition and follow-up evidence disagree.',
  })
})

const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: digest,
}).strict()

export type SkillCapabilityManifestDefinitionInput = Omit<
  SkillCapabilityManifest,
  | 'qualificationStatus'
  | 'capabilityDefinitionDigestSha256'
  | 'manifestDigestSha256'
>

export function createSkillSupportRequest(
  input: Omit<SkillSupportRequest, 'requestDigestSha256'>,
): SkillSupportRequest {
  assertClosedPlainJson(input, 'skill_support_request')
  const payload = supportRequestWithoutDigestSchema.parse(input)
  return supportRequestSchema.parse({
    ...payload,
    requestDigestSha256: orchestraDigest(payload),
  }) as SkillSupportRequest
}

export function parseSkillSupportRequest(value: unknown): SkillSupportRequest {
  assertClosedPlainJson(value, 'skill_support_request')
  const parsed = supportRequestSchema.parse(value)
  const { requestDigestSha256, ...payload } = parsed
  if (requestDigestSha256 !== orchestraDigest(payload)) {
    throw new TypeError('Skill support request digest is invalid.')
  }
  return structuredClone(parsed) as SkillSupportRequest
}

export function createOrchestraSkillCall(
  input: Omit<OrchestraSkillCall, 'callDigestSha256'>,
): OrchestraSkillCall {
  assertClosedPlainJson(input, 'orchestra_skill_call')
  const payload = callWithoutDigestSchema.parse(input)
  return callSchema.parse({
    ...payload,
    callDigestSha256: orchestraDigest(payload),
  }) as OrchestraSkillCall
}

export function parseOrchestraSkillCall(value: unknown): OrchestraSkillCall {
  assertClosedPlainJson(value, 'orchestra_skill_call')
  const parsed = callSchema.parse(value)
  const { callDigestSha256, ...payload } = parsed
  if (callDigestSha256 !== orchestraDigest(payload)) {
    throw new TypeError('Orchestra skill call digest is invalid.')
  }
  return structuredClone(parsed) as OrchestraSkillCall
}

export function createSkillQualificationSnapshot(
  input: Omit<SkillQualificationSnapshot, 'snapshotDigestSha256'>,
): SkillQualificationSnapshot {
  assertClosedPlainJson(input, 'skill_qualification_snapshot')
  const payload = qualificationSnapshotWithoutDigestSchema.parse(input)
  return qualificationSnapshotSchema.parse({
    ...payload,
    snapshotDigestSha256: orchestraDigest(payload),
  }) as SkillQualificationSnapshot
}

export function parseSkillQualificationSnapshot(
  value: unknown,
): SkillQualificationSnapshot {
  assertClosedPlainJson(value, 'skill_qualification_snapshot')
  const parsed = qualificationSnapshotSchema.parse(value)
  const { snapshotDigestSha256, ...payload } = parsed
  if (snapshotDigestSha256 !== orchestraDigest(payload)) {
    throw new TypeError('Skill qualification snapshot digest is invalid.')
  }
  return structuredClone(parsed) as SkillQualificationSnapshot
}

export function createSkillCapabilityManifest(input: {
  readonly definition: SkillCapabilityManifestDefinitionInput
  readonly qualificationSnapshot: SkillQualificationSnapshot
}): SkillCapabilityManifest {
  assertClosedPlainJson(input, 'skill_capability_manifest_input')
  const snapshot = parseSkillQualificationSnapshot(
    input.qualificationSnapshot,
  )
  const definitionInput = {
    ...input.definition,
    qualificationStatus: qualificationStatusFrom(snapshot),
  }
  const definitionWithStatus = manifestWithoutDigestsSchema.parse(
    definitionInput,
  )
  const capabilityDefinition = { ...definitionWithStatus }
  Reflect.deleteProperty(capabilityDefinition, 'qualificationStatus')
  const capabilityDefinitionDigestSha256 = orchestraDigest(
    capabilityDefinition,
  )
  if (
    snapshot.skillKey !== definitionWithStatus.skillKey
    || snapshot.skillVersion !== definitionWithStatus.skillVersion
    || snapshot.contractVersion !== definitionWithStatus.contractVersion
    || snapshot.capabilityDefinitionDigestSha256
      !== capabilityDefinitionDigestSha256
  ) throw new TypeError(
    'Skill qualification snapshot does not bind the capability definition.',
  )
  const withoutManifestDigest = {
    ...definitionWithStatus,
    capabilityDefinitionDigestSha256,
  }
  return manifestSchema.parse({
    ...withoutManifestDigest,
    manifestDigestSha256: orchestraDigest(withoutManifestDigest),
  }) as SkillCapabilityManifest
}

export function computeSkillCapabilityDefinitionDigest(
  definition: SkillCapabilityManifestDefinitionInput,
): string {
  assertClosedPlainJson(definition, 'skill_capability_definition')
  const temporary = manifestWithoutDigestsSchema.parse({
    ...definition,
    qualificationStatus: {
      overall: 'blocked',
      qualificationSnapshotRef: evidenceRef(
        'temporary-skill-qualification-snapshot',
        orchestraDigest({ temporary: true }),
      ),
      qualifiedJobTypes: [],
      blockedJobTypes: definition.supportedJobTypes.map((item) => ({
        jobType: item.jobType,
        blockerCodes: ['temporary_qualification_not_observed'],
      })),
    },
  })
  const capabilityDefinition = { ...temporary }
  Reflect.deleteProperty(capabilityDefinition, 'qualificationStatus')
  return orchestraDigest(capabilityDefinition)
}

export function parseSkillCapabilityManifest(input: {
  readonly value: unknown
  readonly qualificationSnapshot: unknown
}): SkillCapabilityManifest {
  assertClosedPlainJson(input.value, 'skill_capability_manifest')
  const parsed = manifestSchema.parse(input.value)
  const snapshot = parseSkillQualificationSnapshot(
    input.qualificationSnapshot,
  )
  const { manifestDigestSha256, ...withoutManifestDigest } = parsed
  if (manifestDigestSha256 !== orchestraDigest(withoutManifestDigest)) {
    throw new TypeError('Skill capability manifest digest is invalid.')
  }
  const capabilityDefinition = { ...withoutManifestDigest }
  Reflect.deleteProperty(capabilityDefinition, 'qualificationStatus')
  Reflect.deleteProperty(
    capabilityDefinition,
    'capabilityDefinitionDigestSha256',
  )
  if (
    parsed.capabilityDefinitionDigestSha256
      !== orchestraDigest(capabilityDefinition)
    || snapshot.capabilityDefinitionDigestSha256
      !== parsed.capabilityDefinitionDigestSha256
    || snapshot.skillKey !== parsed.skillKey
    || snapshot.skillVersion !== parsed.skillVersion
    || snapshot.contractVersion !== parsed.contractVersion
    || canonicalJson(parsed.qualificationStatus)
      !== canonicalJson(qualificationStatusFrom(snapshot))
  ) throw new TypeError(
    'Skill capability manifest lost its exact qualification binding.',
  )
  return structuredClone(parsed) as SkillCapabilityManifest
}

export function createOrchestraSkillJobResult(
  input: Omit<OrchestraSkillJobResult, 'resultDigestSha256'>,
): OrchestraSkillJobResult {
  assertClosedPlainJson(input, 'orchestra_skill_job_result')
  const payload = resultWithoutDigestSchema.parse(input)
  return resultSchema.parse({
    ...payload,
    resultDigestSha256: orchestraDigest(payload),
  }) as OrchestraSkillJobResult
}

export function parseOrchestraSkillJobResult(
  value: unknown,
): OrchestraSkillJobResult {
  assertClosedPlainJson(value, 'orchestra_skill_job_result')
  const parsed = resultSchema.parse(value)
  const { resultDigestSha256, ...payload } = parsed
  if (resultDigestSha256 !== orchestraDigest(payload)) {
    throw new TypeError('Orchestra skill result digest is invalid.')
  }
  return structuredClone(parsed) as OrchestraSkillJobResult
}

export function orchestraEvidenceRef(
  idValue: string,
  contentHash: string,
  refVersion = 1,
) {
  return evidenceRefSchema.parse({
    id: idValue,
    version: refVersion,
    contentHash,
  })
}

export function orchestraDigest(value: unknown): string {
  assertClosedPlainJson(value, 'orchestra_digest_value')
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`
}

function qualificationStatusFrom(snapshot: SkillQualificationSnapshot) {
  return {
    overall: snapshot.overall,
    qualificationSnapshotRef: evidenceRef(
      snapshot.snapshotId,
      snapshot.snapshotDigestSha256,
    ),
    qualifiedJobTypes: snapshot.jobQualifications
      .filter((item) => item.status === 'qualified')
      .map((item) => item.jobType),
    blockedJobTypes: snapshot.jobQualifications
      .filter((item) => item.status !== 'qualified')
      .map((item) => ({
        jobType: item.jobType,
        blockerCodes: item.blockerCodes.length > 0
          ? item.blockerCodes
          : [item.status === 'disabled'
              ? 'skill_job_type_disabled'
              : 'skill_job_type_not_qualified'],
      })),
  }
}

function evidenceRef(idValue: string, contentHash: string) {
  return {
    id: idValue,
    version: 1,
    contentHash,
  }
}

function refKey(value: z.infer<typeof evidenceRefSchema>): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function rangesAreOrderedAndNonOverlapping(
  ranges: Array<z.infer<typeof frameRangeSchema>>,
): boolean {
  return ranges.every((range, index) => index === 0
    || ranges[index - 1]!.endFrameExclusive <= range.startFrame)
}

function enumSetRefinement(
  values: string[],
  context: z.RefinementCtx,
): void {
  if (!unique(values)) {
    context.addIssue({ code: 'custom', message: 'Enum set must be unique.' })
  }
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length
}

function ordered(values: string[]): boolean {
  return values.every((value, index) => index === 0
    || utf16Compare(values[index - 1]!, value) < 0)
}

function utf16Compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`
  }
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).filter((key) =>
    record[key] !== undefined).sort(utf16Compare).map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`
}

function assertClosedPlainJson(
  value: unknown,
  label: string,
  active = new Set<object>(),
  state = { nodes: 0 },
  depth = 0,
): void {
  state.nodes += 1
  if (state.nodes > MAX_NODES || depth > MAX_DEPTH) {
    throw new TypeError(`${label} exceeds the bounded JSON envelope.`)
  }
  if (value === null || typeof value === 'string'
    || typeof value === 'boolean') return
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${label} is non-finite.`)
    return
  }
  if (typeof value !== 'object') {
    throw new TypeError(`${label} is not plain JSON.`)
  }
  const object = value as object
  if (active.has(object)) throw new TypeError(`${label} cannot be cyclic.`)
  active.add(object)
  let prototype: object | null
  let descriptors: PropertyDescriptorMap
  try {
    prototype = Object.getPrototypeOf(object)
    descriptors = Object.getOwnPropertyDescriptors(object)
  } catch {
    throw new TypeError(`${label} cannot expose hostile reflection traps.`)
  }
  if (Array.isArray(value)) {
    const keys = Reflect.ownKeys(descriptors)
    if (
      keys.some((key) => typeof key === 'symbol')
      || Object.keys(value).length !== value.length
      || keys.length !== value.length + 1
    ) throw new TypeError(`${label} cannot be sparse or hidden.`)
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)]
      if (!descriptor || descriptor.get || descriptor.set) {
        throw new TypeError(`${label} cannot contain accessors.`)
      }
      assertClosedPlainJson(
        descriptor.value,
        label,
        active,
        state,
        depth + 1,
      )
    }
  } else {
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`${label} must use a plain record prototype.`)
    }
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key !== 'string') {
        throw new TypeError(`${label} cannot contain symbol keys.`)
      }
      const descriptor = descriptors[key]!
      if (descriptor.get || descriptor.set) {
        throw new TypeError(`${label} cannot contain accessors.`)
      }
      assertClosedPlainJson(
        descriptor.value,
        label,
        active,
        state,
        depth + 1,
      )
    }
  }
  active.delete(object)
}
