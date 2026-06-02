import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import { privateWebE2EConfig } from './private-web-search-capture-e2e-policy'
import type {
  PrivateFixturePage,
  PrivateWebExtractionRecord,
  PrivateWebRawExtraction,
  PrivateWebSanitizedExtraction,
} from './private-web-search-capture-e2e-types'

const unsafeTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math', 'link', 'meta'])
const allowedTags = new Set(['article', 'section', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'blockquote', 'code', 'pre', 'time', 'span', 'br'])

export async function runPrivateReadabilityExtraction(input: {
  page: PrivateFixturePage
  sanitizedHtmlPath: string
  textPath: string
}): Promise<{
  raw: PrivateWebRawExtraction
  sanitized: PrivateWebSanitizedExtraction
  normalized: PrivateWebExtractionRecord
}> {
  const html = await readFile(input.page.fixturePath, 'utf8')
  const dom = new JSDOM(html, { url: input.page.url, resources: 'usable' })
  const parsed = new Readability(dom.window.document).parse()
  if (!parsed) throw new Error(`Readability failed to parse ${input.page.sourceId}.`)
  const raw: PrivateWebRawExtraction = {
    sourceId: input.page.sourceId,
    title: parsed.title || input.page.title,
    byline: parsed.byline || input.page.byline,
    excerpt: parsed.excerpt || input.page.excerpt,
    textContent: parsed.textContent || '',
    content: parsed.content || '',
    length: parsed.length || 0,
    siteName: parsed.siteName || 'ReeditPro Fixture',
    publishedTime: input.page.publishedDate,
    extractedAt: new Date().toISOString(),
    publicWebExtractionUsed: false,
    liveSearchUsed: false,
    paidProviderUsed: false,
    browserCaptureUsed: false,
  }
  const sanitized = sanitizeRawExtraction(raw)
  const normalized: PrivateWebExtractionRecord = {
    sourceId: input.page.sourceId,
    extractionId: createHash('sha256').update(`${input.page.sourceId}:${sanitized.title}`).digest('hex').slice(0, 16),
    title: sanitized.title,
    byline: sanitized.byline,
    excerpt: sanitized.excerpt,
    textContentPreview: sanitized.sanitizedText.slice(0, privateWebE2EConfig.textPreviewChars),
    textLength: sanitized.textLength,
    wordCount: sanitized.wordCount,
    sanitizedHtmlPath: input.sanitizedHtmlPath,
    textPath: input.textPath,
    displaySafe: true,
    generatedFixture: true,
    publicWebExtractionUsed: false,
    liveSearchUsed: false,
    paidProviderUsed: false,
  }
  return { raw, sanitized, normalized }
}

function sanitizeRawExtraction(raw: PrivateWebRawExtraction): PrivateWebSanitizedExtraction {
  const removedUnsafeTags = new Set<string>()
  const removedUnsafeAttributes = new Set<string>()
  const removedUnsafeUrls = new Set<string>()
  const dom = new JSDOM(`<article>${raw.content}</article>`)
  const document = dom.window.document
  for (const element of Array.from(document.body.querySelectorAll('*'))) {
    const tag = element.tagName.toLowerCase()
    if (unsafeTags.has(tag)) {
      removedUnsafeTags.add(tag)
      element.remove()
      continue
    }
    if (!allowedTags.has(tag)) {
      removedUnsafeTags.add(tag)
      element.replaceWith(...Array.from(element.childNodes))
      continue
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()
      if (name.startsWith('on')) {
        removedUnsafeAttributes.add(name)
        element.removeAttribute(attribute.name)
        continue
      }
      if (name === 'href') {
        if (!isSafeFixtureUrl(attribute.value)) {
          removedUnsafeUrls.add(attribute.value)
          element.removeAttribute(attribute.name)
        }
        continue
      }
      if (!['href', 'datetime', 'lang', 'dir'].includes(name)) {
        removedUnsafeAttributes.add(name)
        element.removeAttribute(attribute.name)
      }
    }
  }
  const container = document.body.querySelector('article')
  const unboundedHtml = container?.innerHTML.trim() ?? ''
  const unboundedText = normalizeWhitespace(container?.textContent ?? raw.textContent)
  const sanitizedHtml = bound(unboundedHtml, privateWebE2EConfig.maxSanitizedHtmlChars)
  const sanitizedText = bound(unboundedText, privateWebE2EConfig.maxTextChars)
  return {
    sourceId: raw.sourceId,
    title: raw.title,
    byline: raw.byline,
    excerpt: raw.excerpt,
    sanitizedHtml,
    sanitizedText,
    textLength: sanitizedText.length,
    wordCount: sanitizedText.split(/\s+/).filter(Boolean).length,
    displaySafe: true,
    rawExtractionDisplaySafe: false,
    truncated: sanitizedHtml.length < unboundedHtml.length || sanitizedText.length < unboundedText.length,
    removedUnsafeTags: Array.from(removedUnsafeTags).sort(),
    removedUnsafeAttributes: Array.from(removedUnsafeAttributes).sort(),
    removedUnsafeUrls: Array.from(removedUnsafeUrls).sort(),
  }
}

function bound(value: string, maxChars: number): string {
  return value.length > maxChars ? value.slice(0, maxChars) : value
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function isSafeFixtureUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && (url.hostname.endsWith('.test') || url.hostname.endsWith('.invalid') || url.hostname === 'fixture.local')
  } catch {
    return false
  }
}
