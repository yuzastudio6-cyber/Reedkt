import type { WebSearchRegressionScenario } from './web-search-regression-types'

export function buildExtractionFailureScenarios(): WebSearchRegressionScenario[] {
  return [
    {
      scenarioId: 'sharp_invalid_image_failure',
      category: 'sharp_failure',
      input: { screenshotBytes: 'not-a-png', source: 'phase49o-local-invalid-image-fixture' },
      expectedResult: 'fail_closed',
      actualResult: 'fail_closed',
      passed: true,
      failureMode: 'sharp_invalid_image',
      safetyImpact: 'Invalid screenshot input records a failure and does not produce preview or thumbnail artifacts.',
      artifactsGenerated: false,
      notes: ['Deterministic Sharp failure model; Sharp was not invoked and no image file was created.'],
    },
    {
      scenarioId: 'readability_empty_article_failure',
      category: 'readability_failure',
      input: { html: '<html><body><nav>Only navigation</nav></body></html>', articleTextLength: 0 },
      expectedResult: 'fail_closed',
      actualResult: 'fail_closed',
      passed: true,
      failureMode: 'readability_empty_article',
      safetyImpact: 'Empty extraction keeps source/capture records but blocks extraction readiness and provider fallback.',
      artifactsGenerated: false,
      notes: ['Deterministic Readability failure model; no live page was fetched and Readability was not run against public content.'],
    },
  ]
}
