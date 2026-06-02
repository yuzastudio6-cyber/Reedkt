import { readFile } from 'node:fs/promises'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import { readabilityExtractionConfig } from './readability-extraction-policy'
import type { LocalArticleFixtureResult, RawReadabilityExtraction } from './readability-extraction-types'

export async function runReadabilityExtractionFromFixture(localFixture: LocalArticleFixtureResult): Promise<RawReadabilityExtraction> {
  const html = await readFile(localFixture.fixturePath, 'utf8')
  return runReadabilityExtractionFromHtml(html)
}

export function runReadabilityExtractionFromHtml(html: string): RawReadabilityExtraction {
  const dom = new JSDOM(html, {
    url: 'https://example.invalid/reeditpro/phase49d/source-extraction-fixture',
    contentType: 'text/html',
    includeNodeLocations: false,
    runScripts: 'outside-only',
  })
  const reader = new Readability(dom.window.document, {
    keepClasses: false,
  })
  const article = reader.parse()
  if (!article?.title || !article.textContent || !article.content) {
    throw new Error('Mozilla Readability did not return title, textContent, and content for the generated local fixture.')
  }
  return {
    title: article.title,
    byline: article.byline ?? undefined,
    dir: article.dir ?? undefined,
    lang: article.lang ?? dom.window.document.documentElement.lang ?? 'en',
    excerpt: article.excerpt ?? undefined,
    textContent: article.textContent,
    content: article.content,
    length: article.length ?? article.textContent.length,
    siteName: article.siteName ?? undefined,
    publishedTime: '2026-06-02T00:00:00.000Z',
    extractedAt: new Date().toISOString(),
    fixtureMode: readabilityExtractionConfig.fixtureMode,
    publicWebExtractionUsed: false,
    liveSearchUsed: false,
    paidProviderUsed: false,
    browserCaptureUsed: false,
  }
}
