const UNSAFE_ELEMENT_PATTERN =
  /<\s*(?:script|foreignObject|iframe|object|embed|link|meta|audio|video|canvas)\b/i
const EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=/i
const UNSAFE_PROTOCOL_PATTERN = /(?:javascript:|data:|file:|vbscript:|@import\b|expression\s*\()/i
const REFERENCE_ATTRIBUTE_PATTERN =
  /\b(?:href|xlink:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
const REFERENCE_ATTRIBUTE_ASSIGNMENT_PATTERN = /\b(?:href|xlink:href|src)\s*=/i
const CSS_URL_PATTERN = /url\(\s*(["']?)(.*?)\1\s*\)/gi

export function isCanonicalStructuredSvgSafe(svg: string): boolean {
  if (
    !/^<svg\b[^>]*>/i.test(svg.trim()) ||
    !/<\/svg>\s*$/i.test(svg.trim()) ||
    UNSAFE_ELEMENT_PATTERN.test(svg) ||
    EVENT_HANDLER_PATTERN.test(svg) ||
    UNSAFE_PROTOCOL_PATTERN.test(svg)
  ) {
    return false
  }

  for (const match of svg.matchAll(REFERENCE_ATTRIBUTE_PATTERN)) {
    if (!isLocalFragmentReference(match[1] ?? match[2] ?? match[3])) return false
  }
  if (REFERENCE_ATTRIBUTE_ASSIGNMENT_PATTERN.test(svg.replace(REFERENCE_ATTRIBUTE_PATTERN, ''))) {
    return false
  }
  for (const match of svg.matchAll(CSS_URL_PATTERN)) {
    if (!isLocalFragmentReference(match[2])) return false
  }
  return true
}

function isLocalFragmentReference(reference: string | undefined): boolean {
  return typeof reference === 'string' && /^#[A-Za-z_][A-Za-z0-9_.:-]*$/.test(reference.trim())
}
