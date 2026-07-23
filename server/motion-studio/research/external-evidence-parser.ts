import { createHash } from 'node:crypto'

import {
  MS011B_COMMONS_METADATA_URL,
  MS011B_WIKIPEDIA_URL,
} from './external-authority'
import { parseBoundedUntrustedJson } from './bounded-json'

const ALLOWED_LICENSES = [
  /^Public domain$/,
  /^CC0(?: 1\.0)?$/,
  /^CC BY (?:2\.0|2\.5|3\.0|4\.0)$/,
  /^CC BY-SA (?:2\.0|2\.5|3\.0|4\.0)$/,
]
const DISALLOWED_RESTRICTION_TOKENS = [
  'noncommercial', 'no derivatives', 'permission required', 'fair use', 'copyrighted',
]
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /reveal\s+(?:the\s+)?(?:secret|token|credential|api\s*key)/i,
  /execute\s+(?:this|the following)\s+(?:command|instruction)/i,
  /call\s+(?:a\s+)?tool/i,
]

export interface Ms011bWikipediaEvidence {
  sourceUrl: typeof MS011B_WIKIPEDIA_URL
  canonicalUrlHash: string
  title: 'Apollo 11'
  publisher: 'Wikipedia'
  accessedAt: string
  responseDigest: string
  normalizedParaphrase:
    | 'Apollo 11 launched on July 16, 1969.'
    | 'Apollo 11 was the American spaceflight that first landed humans on the Moon.'
  claimClassification: 'widely_reported'
  claimStatus: 'needs_review'
  officialCorroborationRequired: true
  promptInjectionStatus: 'not_detected' | 'needs_review'
  promptInjectionFindings: readonly string[]
  sourceContentExecutable: false
}

export interface Ms011bWikipediaClaimContractV2 {
  contractVersion: 2
  subjectTitle: 'Apollo 11'
  requiredExtractPattern: 'first landed humans on the Moon'
  normalizedParaphrase: 'Apollo 11 was the American spaceflight that first landed humans on the Moon.'
  claimClassification: 'widely_reported'
  claimStatus: 'needs_review'
  officialCorroborationRequired: true
  sourceContentExecutable: false
}

export interface Ms011bCommonsCandidate {
  providerIndex: number
  pageId: number
  title: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'unsupported'
  width: number
  height: number
  providerSha1?: string
  thumbUrl?: string
  thumbUrlHash?: string
  licenseShortName?: string
  licenseUrl?: string
  artistOrCredit?: string
  sourceMetadata?: string
  authenticityClass: 'unknown'
  rightsStatus: 'unknown'
  technicalSuitability: 'unsuitable' | 'review_needed'
  selectionStatus: 'rejected' | 'needs_review'
  eligibleForPrivateThumbnailReview: boolean
  finalUseAllowed: false
  humanReviewRequired: true
  rejectionReasons: readonly string[]
  promptInjectionStatus: 'not_detected' | 'needs_review'
  promptInjectionFindings: readonly string[]
}

export interface Ms011bCommonsResult {
  sourceUrl: typeof MS011B_COMMONS_METADATA_URL
  sourceUrlHash: string
  accessedAt: string
  responseDigest: string
  candidates: readonly Ms011bCommonsCandidate[]
  selectedThumbnailCandidate?: Ms011bCommonsCandidate
}

export function parseMs011bWikipediaSummary(
  bytes: Buffer,
  accessedAt: string,
  claimContract?: Ms011bWikipediaClaimContractV2,
): Ms011bWikipediaEvidence {
  const value = asRecord(parseBoundedUntrustedJson(bytes, {
    maximumBytes: 524_288,
    maximumDepth: 16,
    maximumNodes: 20_000,
    maximumStringLength: 16_384,
  }))
  const title = boundedString(value.title, 200)
  if (title !== (claimContract?.subjectTitle ?? 'Apollo 11')) {
    throw new Error('Wikipedia summary title is not the exact approved subject.')
  }
  const extract = boundedString(value.extract, 16_384)
  const description = optionalBoundedString(value.description, 1_000)
  const combined = [title, description, extract].filter(Boolean).join(' ')
  const injectionFindings = detectPromptInjection(combined)
  if (claimContract && !extract.toLocaleLowerCase('en-US')
    .includes(claimContract.requiredExtractPattern.toLocaleLowerCase('en-US'))) {
    throw new Error('Wikipedia summary does not support the exact bounded moon-landing paraphrase.')
  }
  if (!claimContract && (!/July\s+16,?\s+1969/i.test(extract) || !/launch/i.test(extract))) {
    throw new Error('Wikipedia summary does not support the exact bounded launch-date paraphrase.')
  }
  return {
    sourceUrl: MS011B_WIKIPEDIA_URL,
    canonicalUrlHash: sha256(MS011B_WIKIPEDIA_URL),
    title: 'Apollo 11',
    publisher: 'Wikipedia',
    accessedAt,
    responseDigest: sha256(bytes),
    normalizedParaphrase: claimContract?.normalizedParaphrase ?? 'Apollo 11 launched on July 16, 1969.',
    claimClassification: 'widely_reported',
    claimStatus: 'needs_review',
    officialCorroborationRequired: true,
    promptInjectionStatus: injectionFindings.length ? 'needs_review' : 'not_detected',
    promptInjectionFindings: injectionFindings,
    sourceContentExecutable: false,
  }
}

export function parseMs011bCommonsMetadata(bytes: Buffer, accessedAt: string): Ms011bCommonsResult {
  const root = asRecord(parseBoundedUntrustedJson(bytes, {
    maximumBytes: 1_048_576,
    maximumDepth: 24,
    maximumNodes: 50_000,
    maximumStringLength: 16_384,
  }))
  const query = asRecord(root.query)
  const pages = Array.isArray(query.pages) ? query.pages.slice(0, 3) : []
  const candidates = pages.map((page, index) => normalizeCommonsCandidate(page, index))
  return {
    sourceUrl: MS011B_COMMONS_METADATA_URL,
    sourceUrlHash: sha256(MS011B_COMMONS_METADATA_URL),
    accessedAt,
    responseDigest: sha256(bytes),
    candidates,
    selectedThumbnailCandidate: candidates.find((candidate) => candidate.eligibleForPrivateThumbnailReview),
  }
}

export function assertImageContentMatchesMime(
  bytes: Buffer,
  expectedMime: 'image/jpeg' | 'image/png' | 'image/webp',
): void {
  const detected = detectImageMime(bytes)
  if (detected !== expectedMime) {
    throw new Error(`Image content signature ${detected ?? 'unknown'} does not match ${expectedMime}.`)
  }
}

function normalizeCommonsCandidate(value: unknown, providerIndex: number): Ms011bCommonsCandidate {
  const page = asRecord(value)
  const imageInfo = Array.isArray(page.imageinfo) ? asRecord(page.imageinfo[0]) : {}
  const extmetadata = asRecord(imageInfo.extmetadata)
  const pageId = safePositiveInteger(page.pageid) ?? providerIndex + 1
  const title = cleanProviderText(optionalBoundedString(page.title, 500) ?? `Commons candidate ${providerIndex + 1}`, 500)
  const mimeValue = optionalBoundedString(imageInfo.mime, 120)
  const mimeType = isAllowedImageMime(mimeValue) ? mimeValue : 'unsupported'
  const width = safePositiveInteger(imageInfo.width) ?? 0
  const height = safePositiveInteger(imageInfo.height) ?? 0
  const providerSha1 = optionalBoundedString(imageInfo.sha1, 160)
  const rawThumbUrl = optionalBoundedString(imageInfo.thumburl, 4_096)
  const licenseShortName = metadataValue(extmetadata, 'LicenseShortName', 240)
  const licenseUrl = metadataValue(extmetadata, 'LicenseUrl', 2_048)
  const artist = metadataValue(extmetadata, 'Artist', 2_000)
  const credit = metadataValue(extmetadata, 'Credit', 2_000)
  const sourceMetadata = credit || metadataValue(extmetadata, 'ImageDescription', 2_000)
  const restrictions = [
    metadataValue(extmetadata, 'Restrictions', 2_000),
    metadataValue(extmetadata, 'UsageTerms', 2_000),
    licenseShortName,
  ].filter(Boolean).join(' ')
  const injectionFindings = detectPromptInjection([
    title, artist, credit, sourceMetadata, restrictions,
  ].filter(Boolean).join(' '))
  const rejectionReasons: string[] = []
  if (mimeType === 'unsupported') rejectionReasons.push('unsupported_mime')
  if (width < 1_024 || height < 576) rejectionReasons.push('source_dimensions_below_minimum')
  if (!licenseShortName || !ALLOWED_LICENSES.some((pattern) => pattern.test(licenseShortName))) {
    rejectionReasons.push('license_not_allowlisted')
  }
  if (DISALLOWED_RESTRICTION_TOKENS.some((token) => restrictions.toLowerCase().includes(token))) {
    rejectionReasons.push('disallowed_rights_restriction')
  }
  if (licenseShortName?.startsWith('CC BY') && !isUnsignedHttpsUrl(licenseUrl)) {
    rejectionReasons.push('attribution_license_url_missing_or_unsafe')
  }
  if (licenseShortName?.startsWith('CC BY') && !artist && !credit) {
    rejectionReasons.push('attribution_credit_missing')
  }
  if (!sourceMetadata) rejectionReasons.push('source_metadata_missing')
  const thumbUrl = rawThumbUrl && isExactCommonsThumbnailUrl(rawThumbUrl) ? rawThumbUrl : undefined
  if (!thumbUrl) rejectionReasons.push('thumbnail_locator_not_exactly_allowed')
  if (injectionFindings.length) rejectionReasons.push('source_metadata_requires_injection_review')
  const eligible = rejectionReasons.length === 0 && mimeType !== 'unsupported' && Boolean(thumbUrl)
  return {
    providerIndex,
    pageId,
    title,
    mimeType,
    width,
    height,
    ...(providerSha1 ? { providerSha1 } : {}),
    ...(thumbUrl ? { thumbUrl, thumbUrlHash: sha256(thumbUrl) } : {}),
    ...(licenseShortName ? { licenseShortName } : {}),
    ...(licenseUrl ? { licenseUrl } : {}),
    ...(artist || credit ? { artistOrCredit: artist || credit } : {}),
    ...(sourceMetadata ? { sourceMetadata } : {}),
    authenticityClass: 'unknown',
    rightsStatus: 'unknown',
    technicalSuitability: eligible ? 'review_needed' : 'unsuitable',
    selectionStatus: eligible ? 'needs_review' : 'rejected',
    eligibleForPrivateThumbnailReview: eligible,
    finalUseAllowed: false,
    humanReviewRequired: true,
    rejectionReasons,
    promptInjectionStatus: injectionFindings.length ? 'needs_review' : 'not_detected',
    promptInjectionFindings: injectionFindings,
  }
}

function metadataValue(metadata: Record<string, unknown>, key: string, maximum: number): string | undefined {
  const record = asRecord(metadata[key])
  return cleanProviderText(optionalBoundedString(record.value, maximum) ?? '', maximum) || undefined
}

function cleanProviderText(value: string, maximum: number): string {
  return replaceAsciiControlCharacters(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximum)
}

function replaceAsciiControlCharacters(value: string): string {
  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 31 || codePoint === 127 ? ' ' : character
  }).join('')
}

function isExactCommonsThumbnailUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'upload.wikimedia.org' &&
      !url.port && !url.username && !url.password && !url.search && !url.hash &&
      url.pathname.startsWith('/wikipedia/commons/thumb/') && !url.pathname.includes('..')
  } catch {
    return false
  }
}

function isUnsignedHttpsUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash &&
      !/(?:token|signature|credential|expires)=/i.test(url.search)
  } catch {
    return false
  }
}

function detectPromptInjection(value: string): string[] {
  return PROMPT_INJECTION_PATTERNS
    .filter((pattern) => pattern.test(value))
    .map((pattern) => `untrusted_source_pattern:${pattern.source.slice(0, 80)}`)
}

function detectImageMime(bytes: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | undefined {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png'
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return undefined
}

function isAllowedImageMime(value: string | undefined): value is 'image/jpeg' | 'image/png' | 'image/webp' {
  return value === 'image/jpeg' || value === 'image/png' || value === 'image/webp'
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function boundedString(value: unknown, maximum: number): string {
  const result = optionalBoundedString(value, maximum)
  if (!result) throw new Error('Required provider string is missing or invalid.')
  return result
}

function optionalBoundedString(value: unknown, maximum: number): string | undefined {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || value.includes('\u0000')) return undefined
  return value.trim()
}

function safePositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
