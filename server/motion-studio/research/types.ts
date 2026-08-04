import type { MotionStudioResearchWorkspaceDto } from '../../../src/types/motion-studio'

export interface SeedMotionStudioResearchFixtureRequest {
  productionId: string
  storyUnderstandingVersionId: string
  researchPackVersionId: string
  claimLedgerVersionId: string
  visualCoverageVersionId: string
  referenceContractVersionId: string
}

export interface MotionStudioResearchFixtureReceipt {
  productionId: string
  approvedStoryUnderstandingVersionId: string
  researchPackVersionId: string
  claimLedgerVersionId: string
  visualCoverageVersionId: string
  referenceContractVersionId: string
  sourceCount: 3
  evidenceCount: 4
  claimCount: 3
  chronologyCount: 2
  visualNeedCount: 2
  candidateCount: 2
  techniqueBlueprintCount: 1
  maximumAuthorizedInternalCostMicros: 0
  externalRetrievalPerformed: false
  providerCallMade: false
  providerCostMicros: 0
  customerPricingIncluded: false
  customerCreditsIncluded: false
  localFixtureOnly: true
}

export interface MotionStudioResearchRepository {
  getWorkspace(input: {
    productionId: string
    actorUserId: string
  }): Promise<MotionStudioResearchWorkspaceDto>
  seedFixture(input: SeedMotionStudioResearchFixtureRequest & {
    actorUserId: string
    idempotencyKey: string
    requestHash: string
  }): Promise<MotionStudioResearchFixtureReceipt>
}
