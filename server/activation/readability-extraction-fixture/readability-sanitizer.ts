import { JSDOM } from 'jsdom'
import { readabilityExtractionConfig } from './readability-extraction-policy'
import type { RawReadabilityExtraction, SanitizedReadabilityExtraction } from './readability-extraction-types'

const unsafeTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math', 'link', 'meta'])
const allowedTags = new Set(['article', 'section', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'blockquote', 'code', 'pre', 'time', 'span', 'br'])

export function sanitizeReadabilityExtraction(raw: RawReadabilityExtraction): SanitizedReadabilityExtraction {
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
  const sanitizedHtml = bound(unboundedHtml, readabilityExtractionConfig.maxSanitizedHtmlChars)
  const sanitizedText = bound(unboundedText, readabilityExtractionConfig.maxTextChars)
  return {
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
    if (!['https:', 'http:'].includes(url.protocol)) return false
    return url.hostname.endsWith('.test') || url.hostname.endsWith('.invalid')
  } catch {
    return false
  }
}
