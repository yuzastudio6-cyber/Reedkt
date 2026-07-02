import { productionHardeningCategories } from './production-hardening-policy'
import type { ProductionHardeningCategory, ProductionHardeningCheck, ProductionReadinessScorecard } from './production-hardening-types'

export function computeProductionReadinessScorecard(checks: ProductionHardeningCheck[]): ProductionReadinessScorecard {
  const blockers = checks.filter((check) => check.status === 'blocked')
  const warnings = checks.filter((check) => check.status === 'warning')
  const manualReviewCount = checks.filter((check) => check.manualReviewRequired).length
  const categoryScores = Object.fromEntries(productionHardeningCategories.map((category) => {
    const categoryChecks = checks.filter((check) => check.category === category)
    const categoryBlockers = categoryChecks.filter((check) => check.status === 'blocked').length
    const categoryWarnings = categoryChecks.filter((check) => check.status === 'warning').length
    const score = Math.max(0, 100 - categoryBlockers * 50 - categoryWarnings * 15)
    return [category, score]
  })) as Record<ProductionHardeningCategory, number>
  const readinessScore = Math.max(0, Math.round(100 - blockers.length * 8 - warnings.length * 2 - manualReviewCount))

  return {
    readinessScore,
    blockerCount: blockers.length,
    warningCount: warnings.length,
    manualReviewCount,
    categoryScores,
    productionReadyAllowed: false,
    limitedBetaAllowed: blockers.length === 0 && manualReviewCount === 0,
  }
}
