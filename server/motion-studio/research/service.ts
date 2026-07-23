import { motionStudioResearchWorkspaceDtoSchema } from '../../../src/lib/motion-studio/contracts'
import type { MotionStudioResearchWorkspaceDto } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { createSupabaseMotionStudioResearchRepository } from './repository'
import type {
  MotionStudioResearchFixtureReceipt,
  MotionStudioResearchRepository,
  SeedMotionStudioResearchFixtureRequest,
} from './types'

const FIXTURE_PATH = '/v1/internal/motion-studio/research-fixtures'
const LOCAL_WARNING = 'The current Research projection contains no completed external request. It performs no model/provider call, purchase, billing, customer pricing, customer-credit mutation, timeline mutation, render, or export.'
const EXTERNAL_WARNING = 'Bounded public evidence was captured by the confined server-only MS-011B route. It remains review-only, private-capture backed, final-ineligible, and does not authorize models, purchases, billing, timeline mutation, render, or export.'

export const MOTION_STUDIO_RESEARCH_EXECUTION_BOUNDARY = Object.freeze({
  externalRetrievalAllowed: false as const,
  providerCallMade: false as const,
  providerCostMicros: 0 as const,
  maximumAuthorizedInternalCostMicros: 0 as const,
  customerPricingIncluded: false as const,
  customerCreditsIncluded: false as const,
  browserResearchWriteAllowed: false as const,
  boundedExternalTransportServerOnly: true as const,
  finalAssetRegistrationAllowed: false as const,
  timelineMutationAllowed: false as const,
  sourceInstructionsExecutable: false as const,
})

export class MotionStudioResearchService {
  private readonly actorUserId: string
  private readonly repository: MotionStudioResearchRepository

  constructor(context: ServiceContext, repository?: MotionStudioResearchRepository) {
    this.actorUserId = requireVerifiedUser(context)
    this.repository = repository ?? createSupabaseMotionStudioResearchRepository(ensureAdminClient(context))
  }

  async getWorkspace(productionId: string) {
    const researchWorkspace = await this.repository.getWorkspace({
      productionId,
      actorUserId: this.actorUserId,
    })
    assertWorkspaceBoundary(researchWorkspace)
    return boundaryResult({ researchWorkspace }, researchWorkspace)
  }

  async seedFixture(
    request: SeedMotionStudioResearchFixtureRequest,
    idempotencyKey: string,
  ) {
    const requestHash = sha256CanonicalJson({ method: 'POST', path: FIXTURE_PATH, body: request })
    const fixtureReceipt = await this.repository.seedFixture({
      ...request,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    assertFixtureReceipt(request, fixtureReceipt)

    const researchWorkspace = await this.repository.getWorkspace({
      productionId: request.productionId,
      actorUserId: this.actorUserId,
    })
    assertWorkspaceBoundary(researchWorkspace)
    assertReceiptMatchesWorkspace(fixtureReceipt, researchWorkspace)
    return boundaryResult({ fixtureReceipt, researchWorkspace }, researchWorkspace)
  }
}

export function createMotionStudioResearchService(context: ServiceContext) {
  return new MotionStudioResearchService(context)
}

function boundaryResult<T extends Record<string, unknown>>(
  data: T,
  workspace: MotionStudioResearchWorkspaceDto,
) {
  return {
    data: {
      ...data,
      executionBoundary: {
        ...MOTION_STUDIO_RESEARCH_EXECUTION_BOUNDARY,
        localFixtureOnly: workspace.localFixtureOnly,
        externalRetrievalPerformed: workspace.externalRetrievalPerformed,
      },
    },
    warnings: [workspace.externalRetrievalPerformed ? EXTERNAL_WARNING : LOCAL_WARNING],
  }
}

function assertFixtureReceipt(
  request: SeedMotionStudioResearchFixtureRequest,
  receipt: MotionStudioResearchFixtureReceipt,
): void {
  if (
    receipt.productionId !== request.productionId ||
    receipt.approvedStoryUnderstandingVersionId !== request.storyUnderstandingVersionId ||
    receipt.researchPackVersionId !== request.researchPackVersionId ||
    receipt.claimLedgerVersionId !== request.claimLedgerVersionId ||
    receipt.visualCoverageVersionId !== request.visualCoverageVersionId ||
    receipt.referenceContractVersionId !== request.referenceContractVersionId
  ) internalInvalid('Research fixture receipt does not match the exact artifact-version request.')
  if (
    receipt.maximumAuthorizedInternalCostMicros !== 0 ||
    receipt.providerCostMicros !== 0 ||
    receipt.externalRetrievalPerformed ||
    receipt.providerCallMade ||
    receipt.customerPricingIncluded ||
    receipt.customerCreditsIncluded ||
    !receipt.localFixtureOnly
  ) internalInvalid('Research fixture exceeded the approved zero-cost, non-external execution boundary.')
}

function assertWorkspaceBoundary(workspace: MotionStudioResearchWorkspaceDto): void {
  const parsed = motionStudioResearchWorkspaceDtoSchema.safeParse(workspace)
  if (!parsed.success) internalInvalid('Research workspace did not satisfy the strict browser-safe contract.')
  if (
    workspace.scope.maximumAuthorizedInternalCostMicros !== 0 ||
    workspace.scope.externalRetrievalAllowed ||
    workspace.providerCallMade ||
    workspace.providerCostMicros !== 0 ||
    workspace.customerPricingIncluded ||
    workspace.customerCreditsIncluded ||
    workspace.externalEvidence.finalAssetRegistrationAllowed ||
    workspace.externalEvidence.timelineMutationAllowed ||
    workspace.externalEvidence.requestCount > 3 ||
    workspace.externalEvidence.binaryCaptureCount > 1 ||
    workspace.externalRetrievalPerformed !== !workspace.localFixtureOnly ||
    workspace.externalRetrievalPerformed !== !workspace.scope.fixtureOnly
  ) internalInvalid('Research workspace exceeded the browser-safe bounded research boundary.')
}

function assertReceiptMatchesWorkspace(
  receipt: MotionStudioResearchFixtureReceipt,
  workspace: MotionStudioResearchWorkspaceDto,
): void {
  if (
    receipt.productionId !== workspace.productionId ||
    receipt.sourceCount !== workspace.sources.length ||
    receipt.evidenceCount !== workspace.evidence.length ||
    receipt.claimCount !== workspace.claims.length ||
    receipt.chronologyCount !== workspace.chronology.length ||
    receipt.visualNeedCount !== workspace.visualNeeds.length ||
    receipt.candidateCount !== workspace.candidates.length ||
    receipt.techniqueBlueprintCount !== workspace.techniqueBlueprints.length
  ) internalInvalid('Research fixture receipt and browser-safe workspace are inconsistent.')
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Storytelling research authority requires a verified bearer identity.', 401)
  }
  return userId
}

function internalInvalid(message: string): never {
  throw new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}
