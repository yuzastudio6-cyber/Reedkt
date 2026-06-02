import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import { isAllowedCaptureDomain } from './allowlisted-capture-policy'
import { controlledLiveSearchConfig } from './controlled-live-search-capture-policy'
import type {
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchExtractionRecord,
  ControlledLiveSearchRawExtraction,
  ControlledLiveSearchSanitizedExtraction,
} from './controlled-live-search-capture-types'

const unsafeTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math', 'link', 'meta'])
const allowedTags = new Set(['article', 'section', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'blockquote', 'code', 'pre', 'time', 'span', 'br'])

export async function runLiveReadabilityExtraction(input: {
  capture: ControlledLiveSearchCaptureRecord
}): Promise<{
  raw: ControlledLiveSearchRawExtraction
  sanitized: ControlledLiveSearchSanitizedExtraction
  normalized: ControlledLiveSearchExtractionRecord
}> {
  if (!isAllowedCaptureDomain(input.capture.finalDomain)) throw new Error(`Readability extraction target is not allowlisted: ${input.capture.finalUrl}`)
  const html = await readFile(input.capture.htmlPath, 'utf8')
  const dom = new JSDOM(html, { url: input.capture.finalUrl })
  const parsed = new Readability(dom.window.document).parse()
  if (!parsed) throw new Error(`Readability failed to parse ${input.capture.sourceId}.`)
  const raw: ControlledLiveSearchRawExtraction = {
    sourceId: input.capture.sourceId,
    title: parsed.title || input.capture.pageTitle,
    byline: parsed.byline || undefined,
    excerpt: parsed.excerpt || undefined,
    textContent: parsed.textContent || '',
    content: parsed.content || '',
    length: parsed.length || 0,
    siteName: parsed.siteName || input.capture.finalDomain,
    extractedAt: new Date().toISOString(),
    sourceUrl: input.capture.finalUrl,
  }
  const sanitized = sanitizeExtraction(raw)
  const extractionDir = path.join(path.dirname(path.dirname(path.dirname(input.capture.htmlPath))), 'extraction', input.capture.sourceId)
  await mkdir(extractionDir, { recursive: true })
  const sanitizedJsonPath = path.join(extractionDir, 'extracted-article-sanitized.json')
  const textPath = path.join(extractionDir, 'extracted-article-text.txt')
  const metadataPath = path.join(extractionDir, 'extraction-metadata.json')
  const normalized: ControlledLiveSearchExtractionRecord = {
    sourceId: input.capture.sourceId,
    extractionId: createHash('sha256').update(`${input.capture.sourceId}:${sanitized.title}:${sanitized.textLength}`).digest('hex').slice(0, 16),
    sourceUrl: input.capture.finalUrl,
    title: sanitized.title,
    byline: sanitized.byline,
    excerpt: sanitized.excerpt,
    textContentPreview: sanitized.sanitizedText.slice(0, controlledLiveSearchConfig.textPreviewChars),
    textLength: sanitized.textLength,
    wordCount: sanitized.wordCount,
    sanitizedJsonPath,
    textPath,
    metadataPath,
    displaySafe: true,
    sourceAllowlisted: true,
    paidProviderUsed: false,
    publicSearxngUsed: false,
  }
  await writeFile(sanitizedJsonPath, `${JSON.stringify(sanitized, null, 2)}\n`, 'utf8')
  await writeFile(textPath, `${sanitized.sanitizedText}\n`, 'utf8')
  await writeFile(metadataPath, `${JSON.stringify({ raw, normalized, rawExtractionDisplaySafe: false }, null, 2)}\n`, 'utf8')
  return { raw, sanitized, normalized }
}

function sanitizeExtraction(raw: ControlledLiveSearchRawExtraction): ControlledLiveSearchSanitizedExtraction {
  const removedUnsafeTags = new Set<string>()
  const removedUnsafeAttributes = new Set<string>()
  const removedUnsafeUrls = new Set<string>()
  const dom = new JSDOM(`<article>${raw.content}</article>`, { url: raw.sourceUrl })
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
        if (!isSafeHref(attribute.value, raw.sourceUrl)) {
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
  const sanitizedHtml = bound(unboundedHtml, controlledLiveSearchConfig.maxSanitizedHtmlChars)
  const sanitizedText = bound(unboundedText, controlledLiveSearchConfig.maxTextChars)
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

function isSafeHref(value: string, baseUrl: string): boolean {
  try {
    const url = new URL(value, baseUrl)
    return ['http:', 'https:'].includes(url.protocol) && isAllowedCaptureDomain(url.hostname)
  } catch {
    return false
  }
}

function bound(value: string, maxChars: number): string {
  return value.length > maxChars ? value.slice(0, maxChars) : value
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
