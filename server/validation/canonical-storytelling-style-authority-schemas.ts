import { z } from 'zod'

export const CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY =
  'motionStudioStorytellingStyleAuthority' as const
export const CANONICAL_STORYTELLING_STYLE_AUTHORITY_VERSION =
  'canonical-storytelling-style-authority-v1' as const

export const CANONICAL_STORYTELLING_STYLE_SCENARIO_KINDS = [
  'style_led_motion',
  'character_continuity',
  'strict_first_last_frame',
  'reference_heavy',
  'exact_text_data',
] as const

const safeIdentity = z.string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const costMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

const versionReferenceSchema = z.object({
  artifactId: safeIdentity,
  versionId: safeIdentity,
  versionNumber: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  contentDigest: digest,
}).strict()

const styleProfileReferenceSchema = z.object({
  styleProfileId: z.enum([
    'storytelling_style.editorial_collage',
    'storytelling_style.cinematic_realist_documentary',
    'storytelling_style.paper_diorama_documentary',
    'storytelling_style.technical_blueprint',
  ]),
  styleProfileVersion: safeIdentity,
  styleProfileDigest: digest,
}).strict()

const motionLanguageReferenceSchema = z.object({
  motionLanguageId: safeIdentity,
  motionLanguageVersion: safeIdentity,
  motionLanguageDigest: digest,
}).strict()

const styleSelectionSchema = z.object({
  schemaVersion: z.literal('motion-studio.storytelling-style-selection.v1'),
  id: safeIdentity,
  state: z.literal('selected_for_plan'),
  selectionDigest: digest,
  styleProfile: styleProfileReferenceSchema,
  motionLanguage: motionLanguageReferenceSchema,
  motionDnaVersion: versionReferenceSchema,
  referenceContractVersions: z.array(versionReferenceSchema).max(32),
  sourceAuditDigests: z.array(digest).max(32),
}).strict().superRefine((value, context) => {
  requireUnique(
    value.referenceContractVersions.map((reference) =>
      `${reference.artifactId}\u001f${reference.versionId}\u001f${reference.versionNumber}`),
    context,
    ['referenceContractVersions'],
    'Reference Contract versions',
  )
  requireUnique(
    value.sourceAuditDigests,
    context,
    ['sourceAuditDigests'],
    'source-audit digests',
  )
})

const calibrationPlanSchema = z.object({
  schemaVersion: z.literal('motion-studio.style-calibration-plan.v1'),
  id: safeIdentity,
  planDigest: digest,
  styleSelectionDigest: digest,
  routePolicyId: z.enum([
    'motion_studio_generation_route_policy_v1',
    'motion_studio_generation_route_policy_v2',
  ]),
  scenarioIds: z.array(safeIdentity).length(5),
  scenarioKinds: z.array(z.enum(CANONICAL_STORYTELLING_STYLE_SCENARIO_KINDS)).length(5),
  estimatedInternalCostRangeMicros: z.object({
    minimum: costMicros,
    maximum: costMicros,
  }).strict(),
  approvalState: z.literal('planning_only'),
  automaticFallbackAllowed: z.literal(false),
  fallbackRequiresNewApproval: z.literal(true),
  bulkGenerationAllowed: z.literal(false),
}).strict().superRefine((value, context) => {
  requireUnique(value.scenarioIds, context, ['scenarioIds'], 'calibration scenario IDs')
  requireUnique(value.scenarioKinds, context, ['scenarioKinds'], 'calibration scenario kinds')
  const expectedKinds = [...CANONICAL_STORYTELLING_STYLE_SCENARIO_KINDS].sort()
  const actualKinds = [...value.scenarioKinds].sort()
  if (JSON.stringify(actualKinds) !== JSON.stringify(expectedKinds)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scenarioKinds'],
      message: 'Storytelling calibration must bind the exact five-scenario authority set.',
    })
  }
  if (value.estimatedInternalCostRangeMicros.minimum >
      value.estimatedInternalCostRangeMicros.maximum) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['estimatedInternalCostRangeMicros'],
      message: 'Storytelling calibration internal-cost range is inverted.',
    })
  }
})

const internalCostEnvelopeSchema = z.object({
  schemaVersion: z.literal('motion-studio-storytelling-style-internal-cost-envelope-v1'),
  estimateId: safeIdentity,
  estimateDigest: digest,
  unit: z.literal('usd_micros'),
  minimumEstimatedInternalProductionCostMicros: costMicros,
  maximumEstimatedInternalProductionCostMicros: costMicros,
  approvalState: z.literal('estimate_only_pending_plan_approval'),
  internalProductionCostOnly: z.literal(true),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
}).strict()

export const canonicalStorytellingStyleAuthoritySchema = z.object({
  schemaVersion: z.literal(CANONICAL_STORYTELLING_STYLE_AUTHORITY_VERSION),
  sourceSchemaVersion: z.literal('motion-studio.storytelling-style-plan-review-input.v1'),
  sourceAuthority: z.literal('motion_studio_storytelling_style_planning_service'),
  evidenceClass: z.literal('controlled_local_browser_relayed_server_prepared_content_addressed'),
  sourceRepositoryReverified: z.literal(false),
  workspaceId: safeIdentity,
  projectId: safeIdentity,
  editSessionId: safeIdentity,
  productionId: safeIdentity,
  styleSelection: styleSelectionSchema,
  calibrationPlan: calibrationPlanSchema,
  internalCostEnvelope: internalCostEnvelopeSchema,
  decisionAuthority: z.literal('existing_plan_review'),
  planReviewIsSoleApprovalAuthority: z.literal(true),
  changedStyleRequiresFreshPlanAndEstimate: z.literal(true),
  historicalApprovedSnapshotRemainsImmutable: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  productionReady: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.calibrationPlan.styleSelectionDigest !== value.styleSelection.selectionDigest) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['calibrationPlan', 'styleSelectionDigest'],
      message: 'Storytelling calibration must bind the exact selected style digest.',
    })
  }
  const range = value.calibrationPlan.estimatedInternalCostRangeMicros
  const envelope = value.internalCostEnvelope
  if (
    envelope.minimumEstimatedInternalProductionCostMicros !== range.minimum ||
    envelope.maximumEstimatedInternalProductionCostMicros !== range.maximum
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['internalCostEnvelope'],
      message: 'Storytelling internal-cost envelope must match the exact calibration plan range.',
    })
  }
})

export type CanonicalStorytellingStyleAuthority =
  z.infer<typeof canonicalStorytellingStyleAuthoritySchema>

export function canonicalStorytellingStyleAuthorityMatchesScope(
  authority: CanonicalStorytellingStyleAuthority | undefined,
  expected: {
    workspaceId: string
    projectId: string
    editSessionId: string
  },
): boolean {
  return authority === undefined || (
    authority.workspaceId === expected.workspaceId &&
    authority.projectId === expected.projectId &&
    authority.editSessionId === expected.editSessionId
  )
}

function requireUnique(
  values: readonly string[],
  context: z.RefinementCtx,
  path: Array<string | number>,
  label: string,
): void {
  if (new Set(values).size !== values.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: `Storytelling ${label} must be unique.`,
    })
  }
}
