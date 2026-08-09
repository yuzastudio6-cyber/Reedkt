import { isAbsolute } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  compileBrollCanonicalWorkGraph,
  compileBrollPlan,
  createBrollAssignment,
  createBrollPlanningContext,
  projectBrollCanonicalWorkItems,
} from '../edit-skills/b-roll'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { loadBrollGeneratedQualificationReceiptForCurrentSource } from '../edit-skills/b-roll/b-roll-qualification-evidence'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/internal-fixture-runtime'
import { persistCanonicalBrollPlanComponent } from '../services/canonical-broll-plan-component-service'
import {
  BROLL_PROVIDER_ROUTE_ID,
  brollProviderExecutionPackageV5Schema,
  buildBrollProviderRequestPackageV5,
  createBrollGeminiSecretResolver,
  createBrollOwnerMachineGcloudSecretLoader,
  createBrollProviderWorkAuthorizationV5,
  executeBrollGeminiRestTransport,
} from '../providers/google/gemini-omni-broll'

const SAFE_FIXTURE_ID = 'b-roll-safe-illustrative-workflow-v1' as const
const confirmation = process.env.REEDITPRO_CONFIRM_GEMINI_OMNI_BROLL_EXECUTE
const fixtureId = process.env.REEDITPRO_GEMINI_OMNI_BROLL_SAFE_FIXTURE_ID
const secretReference = process.env.GOOGLE_SECRET_GEMINI_API_KEY_NAME?.trim()
const localStorageRoot = process.env.REEDITPRO_GEMINI_OMNI_BROLL_PRIVATE_ROOT?.trim()
const maximumProviderCostMicros = exactPositiveInteger(
  process.env.REEDITPRO_GEMINI_OMNI_BROLL_MAX_COST_MICROS,
)
const rateMicrosPerGeneratedSecond = exactPositiveInteger(
  process.env.REEDITPRO_GEMINI_OMNI_BROLL_RATE_MICROS_PER_SECOND,
)

const missing = [
  confirmation === 'true' ? undefined : 'REEDITPRO_CONFIRM_GEMINI_OMNI_BROLL_EXECUTE=true',
  fixtureId === SAFE_FIXTURE_ID
    ? undefined
    : `REEDITPRO_GEMINI_OMNI_BROLL_SAFE_FIXTURE_ID=${SAFE_FIXTURE_ID}`,
  secretReference ? undefined : 'GOOGLE_SECRET_GEMINI_API_KEY_NAME=<pinned numeric Secret Manager version>',
  localStorageRoot && isAbsolute(localStorageRoot)
    ? undefined
    : 'REEDITPRO_GEMINI_OMNI_BROLL_PRIVATE_ROOT=<absolute private path>',
  maximumProviderCostMicros ? undefined : 'REEDITPRO_GEMINI_OMNI_BROLL_MAX_COST_MICROS=<positive integer>',
  rateMicrosPerGeneratedSecond
    ? undefined
    : 'REEDITPRO_GEMINI_OMNI_BROLL_RATE_MICROS_PER_SECOND=<positive integer>',
].filter((value): value is string => Boolean(value))

if (missing.length > 0) {
  console.log(JSON.stringify({
    status: 'blocked_external_prerequisites',
    canaryExecuted: false,
    providerRequestCount: 0,
    fixtureId: SAFE_FIXTURE_ID,
    missing,
    productionQualified: false,
  }, null, 2))
  process.exit(0)
}

if (rateMicrosPerGeneratedSecond! * 3 > maximumProviderCostMicros!) {
  throw new Error('Gemini B-roll canary rate times three seconds exceeds the explicit maximum cost ceiling.')
}

const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const masterRange = { startFrameInclusive: 0, endFrameExclusive: 240, fps: 24 }
const authorizedRange = { startFrameInclusive: 24, endFrameExclusive: 96, fps: 24 }
const assignment = createBrollAssignment({
  schemaVersion: 'b_roll_assignment_v1',
  assignmentId: 'gemini-omni-b-roll-canary-assignment',
  orchestrationRunId: 'gemini-omni-b-roll-canary-run',
  ownerUserId: 'internal-canary-owner',
  workspaceId: 'internal-canary-workspace',
  projectId: 'internal-canary-project',
  editSessionId: 'internal-canary-session',
  editPlanVersion: 1,
  masterTimingHash: hashSkillValue(masterRange),
  masterTimingRange: masterRange,
  segmentIds: ['canary-segment'],
  sourceSequenceIds: [],
  readContextAuthority: { wholeVideoReadOnly: true, adjacentScenesReadOnly: true, contextArtifactRefs: [] },
  writeRangeAuthority: { authorizedRange, outsideAuthorizedRangeModified: false },
  reason: 'Generate the approved minimal private illustrative B-roll canary.',
  pointToProveClarifyCoverOrSupport: 'Illustrate a hand placing one blank card into a simple workflow tray.',
  expectedViewerBenefit: 'Verify a safe single-action B-roll generation path.',
  requestedVisualOwnership: 'primary',
  forbiddenInterpretations: [
    'No people, faces, brands, text, metrics, customer proof, private data, or recognizable property.',
  ],
  permittedSourceRoutes: ['generate_with_gemini_omni', 'use_no_broll'],
  providerPermission: 'approved_within_ceiling',
  maximumInitialCandidates: 1,
  maximumRefinements: 1,
  maximumTimeSeconds: 600,
  maximumCredits: 100,
  requiredOutputTypes: ['b_roll_result_receipt_v1'],
  manifestRef,
})
const context = createBrollPlanningContext({
  schemaVersion: 'b_roll_context_manifest_v1',
  ownerUserId: assignment.ownerUserId,
  workspaceId: assignment.workspaceId,
  projectId: assignment.projectId,
  assignmentId: assignment.assignmentId,
  baseFootageStrength: 0.1,
  speakerEmotionImportance: 0,
  meaningfulVisualNeed: 1,
  userVisualPreference: 'minimal',
  claimSensitivity: 'none',
  generatedMediaWouldMislead: false,
  captionReservedZoneCount: 0,
  trackingRequired: false,
  sourceCandidates: [],
  priorConceptKeys: [],
  confirmedAspectRatio: '16:9',
  uploadedVideoEditRegionEligible: false,
  referenceDnaDoNotCopyRules: [],
})
const compiled = compileBrollPlan({
  assignment,
  context,
  manifest: BROLL_CAPABILITY_MANIFEST,
  estimators: editSkillEstimatorRegistry,
  qa: editSkillQaRegistry,
})
if (compiled.plan.decision !== 'generate_with_gemini_omni') {
  throw new Error('Gemini B-roll safe canary did not compile the expected generated route.')
}
const workGraph = compileBrollCanonicalWorkGraph({ assignment, plan: compiled.plan })
const canonicalWorkItems = projectBrollCanonicalWorkItems({
  assignment,
  plan: compiled.plan,
  workGraph,
})
const providerWorkItem = canonicalWorkItems.find((item) =>
  item.approvedProviderRoute === BROLL_PROVIDER_ROUTE_ID)
if (!providerWorkItem) throw new Error('Gemini B-roll safe canary provider work item is missing.')
const persisted = await persistCanonicalBrollPlanComponent({
  localStorageRoot: localStorageRoot!,
  assignment,
  context,
  plan: compiled.plan,
  planningQaReport: compiled.planningQaReport,
  workGraph,
  qualificationReceipt: loadBrollGeneratedQualificationReceiptForCurrentSource(BROLL_CAPABILITY_MANIFEST),
})
const componentRef = persisted.componentRefs.bRollSkill
const requestPackage = buildBrollProviderRequestPackageV5({ assignment, context, plan: compiled.plan })
const executionPackage = brollProviderExecutionPackageV5Schema.parse({
  packageRecordId: 'gemini-omni-b-roll-canary-package',
  packageHash: hashSkillValue({ package: SAFE_FIXTURE_ID }),
  workspaceId: assignment.workspaceId,
  projectId: assignment.projectId,
  editSessionId: assignment.editSessionId,
  approvedPlanSnapshotId: 'gemini-omni-b-roll-canary-snapshot',
  snapshotHash: hashSkillValue({ snapshot: SAFE_FIXTURE_ID }),
  reservationId: 'gemini-omni-b-roll-canary-reservation',
  reservationStatus: 'reserved',
  workGraphHash: workGraph.workGraphHash,
  componentRefs: { bRollSkill: componentRef },
  approvedMaximumCredits: 100,
  remainingReservedCredits: 100,
  approvedProviderRoutes: [BROLL_PROVIDER_ROUTE_ID],
  approvedWorkItems: [{ id: 'gemini-omni-b-roll-canary-work', ...providerWorkItem }],
  status: 'canonical_authority_packaged_runtime_blocked',
})
const now = new Date()
const authorizedAt = new Date(now.getTime() - 30_000).toISOString()
const expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString()
const rateExpiresAt = new Date(now.getTime() + 60 * 60_000).toISOString()
const authorization = createBrollProviderWorkAuthorizationV5({
  ownerUserId: assignment.ownerUserId,
  executionPackage,
  component: persisted.component,
  componentRef,
  assignment,
  context,
  plan: compiled.plan,
  workGraph,
  requestPackage,
  providerRateAuthority: {
    schemaVersion: 'b_roll_provider_rate_authority_v1',
    snapshotId: `owner-confirmed-canary-rate-${now.toISOString().slice(0, 10)}`,
    snapshotDigest: hashSkillValue({
      rateMicrosPerGeneratedSecond,
      maximumProviderCostMicros,
      confirmedAt: now.toISOString(),
    }),
    evidenceClass: 'owner_confirmed_canary_ceiling_unqualified',
    currency: 'USD',
    costMicrosPerGeneratedSecond: rateMicrosPerGeneratedSecond!,
    effectiveAt: authorizedAt,
    expiresAt: rateExpiresAt,
    serviceFeeIncluded: false,
    productionQualified: false,
  },
  maximumAuthorizedProviderCostMicros: maximumProviderCostMicros!,
  maximumAuthorizedInfrastructureCostMicros: 100_000,
  idempotencyKey: `gemini-omni-b-roll-canary-${now.toISOString()}`,
  authorizedAt,
  expiresAt,
  authorityClass: 'private_owner_confirmed_canary',
})
const secretResolver = createBrollGeminiSecretResolver({
  pinnedSecretVersionReference: secretReference!,
  loader: createBrollOwnerMachineGcloudSecretLoader(),
})
const result = await executeBrollGeminiRestTransport({
  localStorageRoot: localStorageRoot!,
  authorization,
  requestPackage,
  secretResolver,
  externalNetworkEnabled: true,
  explicitExecutionConfirmed: true,
  approvedSafeFixture: true,
  privateOutputDestinationConfirmed: true,
  publicArtifactAllowed: false,
  timelineMutationAllowed: false,
  automaticRetryAllowed: false,
  fallbackProviderAllowed: false,
  delivery: 'inline',
})
console.log(JSON.stringify({
  status: result.state.status,
  canaryExecuted: true,
  fixtureId: SAFE_FIXTURE_ID,
  configuredModelAlias: result.state.configuredModelAlias,
  acceptedRuntimeModel: result.state.acceptedRuntimeModel,
  providerRevisionStatus: result.state.providerRevisionStatus,
  requestCounts: result.state.requestCounts,
  providerCost: result.state.providerCost,
  privateOutput: result.state.output ? {
    sha256: result.state.output.sha256,
    byteLength: result.state.output.byteLength,
    privateObjectIdentityHash: result.state.output.privateObjectIdentityHash,
  } : null,
  productionQualified: false,
}, null, 2))

function exactPositiveInteger(value: string | undefined): number | undefined {
  if (!value || !/^[1-9][0-9]{0,15}$/u.test(value)) return undefined
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : undefined
}
