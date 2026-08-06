import { z } from 'zod'

const uuid = z.string().uuid()

export const seedMotionStudioResearchFixtureRequestSchema = z.object({
  productionId: uuid,
  storyUnderstandingVersionId: uuid,
  researchPackVersionId: uuid,
  claimLedgerVersionId: uuid,
  visualCoverageVersionId: uuid,
  referenceContractVersionId: uuid,
}).strict()
