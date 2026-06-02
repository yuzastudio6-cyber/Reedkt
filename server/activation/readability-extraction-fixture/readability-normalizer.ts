import { readabilityExtractionConfig } from './readability-extraction-policy'
import type {
  NormalizedReadabilityExtractionRecord,
  RawReadabilityExtraction,
  SanitizedReadabilityExtraction,
} from './readability-extraction-types'

export function normalizeReadabilityExtraction(input: {
  runId: string
  rawExtraction: RawReadabilityExtraction
  sanitizedExtraction: SanitizedReadabilityExtraction
  sanitizedHtmlPath: string
  textPath: string
}): NormalizedReadabilityExtractionRecord {
  return {
    extractionId: `phase49d-extraction-${input.runId}`,
    sourceId: 'phase49d-generated-local-article-source',
    fixtureMode: readabilityExtractionConfig.fixtureMode,
    title: input.sanitizedExtraction.title,
    byline: input.sanitizedExtraction.byline,
    excerpt: input.sanitizedExtraction.excerpt,
    textContentPreview: input.sanitizedExtraction.sanitizedText.slice(0, readabilityExtractionConfig.textPreviewChars),
    textLength: input.sanitizedExtraction.textLength,
    wordCount: input.sanitizedExtraction.wordCount,
    language: input.rawExtraction.lang ?? 'en',
    publishedTime: input.rawExtraction.publishedTime,
    sanitizedHtmlPath: input.sanitizedHtmlPath,
    textPath: input.textPath,
    displaySafe: true,
    generatedFixture: true,
    publicWebExtractionUsed: false,
    liveSearchUsed: false,
    paidProviderUsed: false,
  }
}
