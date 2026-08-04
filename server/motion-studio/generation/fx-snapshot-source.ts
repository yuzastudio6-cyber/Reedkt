import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'

import {
  MOTION_STUDIO_FX_SNAPSHOT_VERSION,
  type MotionStudioCurrencyExchangeRateSnapshot,
} from '../../../src/types/motion-studio'
import {
  validateMotionStudioCurrencyExchangeRateSnapshot,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const FEDERAL_RESERVE_H10_CNY_CSV_URL =
  'https://www.federalreserve.gov/datadownload/Output.aspx?filetype=csv&from=&label=include&lastobs=10&layout=seriescolumn&rel=H10&series=60f32914ab61dfab590e0e470153e3ae&to=&type=package' as const
export const FEDERAL_RESERVE_H10_CNY_SERIES_ID = 'H10/H10/RXI_N.B.CH' as const
export const FEDERAL_RESERVE_H10_CNY_COLUMN_ID = 'RXI_N.B.CH' as const

const MAX_H10_SOURCE_BYTES = 64 * 1024
const MAX_OBSERVATION_AGE_MS = 10 * 24 * 60 * 60 * 1_000
const SNAPSHOT_TTL_MS = 30 * 60 * 1_000

export interface MotionStudioFxSourceCapture {
  snapshot: MotionStudioCurrencyExchangeRateSnapshot
  observationDate: string
  cnyPerUsdMicros: number
  sourceSeriesId: typeof FEDERAL_RESERVE_H10_CNY_SERIES_ID
  sourceColumnId: typeof FEDERAL_RESERVE_H10_CNY_COLUMN_ID
  rawEvidence: {
    bytes: Buffer
    sha256: string
    byteLength: number
    contentType: 'text/csv'
    safeToLog: false
    safeToExposeToBrowser: false
  }
}

export async function captureFederalReserveH10CnyUsdSnapshot(input: {
  capturedAt: string
  fetchImplementation?: typeof fetch
  timeoutMs?: number
}): Promise<MotionStudioFxSourceCapture> {
  const capturedAtMs = Date.parse(input.capturedAt)
  if (!Number.isFinite(capturedAtMs)) throw invalid('FX capture time must be ISO-8601.')
  const capturedAt = new Date(capturedAtMs).toISOString()
  const timeoutMs = input.timeoutMs ?? 10_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) {
    throw invalid('FX source timeout must be between 1 and 30 seconds.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await (input.fetchImplementation ?? globalThis.fetch)(FEDERAL_RESERVE_H10_CNY_CSV_URL, {
      method: 'GET',
      headers: { Accept: 'text/csv' },
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch {
    clearTimeout(timeout)
    throw blocked('The official Federal Reserve H.10 FX source could not be retrieved.')
  }
  let bytes: Buffer
  try {
    if (!response.ok) {
      throw blocked(`The official Federal Reserve H.10 FX source returned HTTP ${response.status}.`)
    }
    if (response.redirected || (response.url && response.url !== FEDERAL_RESERVE_H10_CNY_CSV_URL)) {
      throw blocked('The official Federal Reserve H.10 FX source redirected unexpectedly.')
    }
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    if (contentType !== 'text/csv') {
      throw blocked('The official Federal Reserve H.10 FX source did not return CSV evidence.')
    }
    const declaredLength = response.headers.get('content-length')
    if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_H10_SOURCE_BYTES)) {
      throw blocked('The official Federal Reserve H.10 FX evidence exceeds the bounded source size.')
    }
    try {
      bytes = await readBoundedBody(response, MAX_H10_SOURCE_BYTES)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw blocked('The official Federal Reserve H.10 FX evidence could not be read completely.')
    }
  } finally {
    clearTimeout(timeout)
  }
  if (bytes.length === 0) throw blocked('The official Federal Reserve H.10 FX evidence is empty.')
  const rawEvidenceDigest = createHash('sha256').update(bytes).digest('hex')
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw blocked('The official Federal Reserve H.10 FX evidence is not valid UTF-8.')
  }
  const observation = parseLatestH10CnyObservation(text, capturedAtMs)
  const effectiveAt = `${observation.date}T00:00:00.000Z`
  const expiresAt = new Date(capturedAtMs + SNAPSHOT_TTL_MS).toISOString()
  const identitySuffix = rawEvidenceDigest.slice(0, 16)
  const sourceReference = {
    kind: 'source_locator' as const,
    sourceLocator: {
      referenceKind: 'source_locator' as const,
      sourceId: 'federal-reserve-h10-rxi-n-b-ch',
      locatorType: 'public_https' as const,
      url: FEDERAL_RESERVE_H10_CNY_CSV_URL,
      retrievedAt: capturedAt,
    },
    evidenceVersionId: `federal-reserve-h10-${observation.date}-${identitySuffix}`,
    evidenceDigest: rawEvidenceDigest,
    capturedAt,
    sourceSystem: 'official_public_source' as const,
    provenanceClass: 'official_fx_rate' as const,
  }
  const digestInput = {
    schemaVersion: MOTION_STUDIO_FX_SNAPSHOT_VERSION,
    id: `fx-h10-cny-usd-${observation.date}-${identitySuffix}`,
    version: `h10-rxi-n-b-ch-${observation.date}-${identitySuffix}`,
    baseCurrency: 'CNY' as const,
    quoteCurrency: 'USD' as const,
    baseAmountMicros: observation.cnyPerUsdMicros,
    quoteAmountMicros: 1_000_000,
    roundingRule: 'ceil_quote_micros' as const,
    sourceReference,
    capturedAt,
    effectiveAt,
    expiresAt,
    immutable: true as const,
  }
  const snapshot: MotionStudioCurrencyExchangeRateSnapshot = {
    ...digestInput,
    contentDigest: sha256CanonicalJson(digestInput),
  }
  const validation = validateMotionStudioCurrencyExchangeRateSnapshot(snapshot)
  if (!validation.ok) {
    throw invalid(`Captured FX snapshot failed its contract: ${validation.errors.join(' ')}`)
  }

  return {
    snapshot,
    observationDate: observation.date,
    cnyPerUsdMicros: observation.cnyPerUsdMicros,
    sourceSeriesId: FEDERAL_RESERVE_H10_CNY_SERIES_ID,
    sourceColumnId: FEDERAL_RESERVE_H10_CNY_COLUMN_ID,
    rawEvidence: {
      bytes,
      sha256: rawEvidenceDigest,
      byteLength: bytes.length,
      contentType: 'text/csv',
      safeToLog: false,
      safeToExposeToBrowser: false,
    },
  }
}

function parseLatestH10CnyObservation(textValue: string, capturedAtMs: number): {
  date: string
  cnyPerUsdMicros: number
} {
  const text = textValue.replace(/^\uFEFF/, '')
  if (text.includes('\0')) throw blocked('The official Federal Reserve H.10 FX evidence contains invalid data.')
  const rows = parseCsv(text)
  const descriptionRow = findRow(rows, 'Series Description')
  const columnIndex = descriptionRow.findIndex((value, index) => index > 0 && value.trim() === 'Chinese Yuan')
  if (columnIndex < 1) throw blocked('The Federal Reserve H.10 evidence does not contain the Chinese Yuan series.')
  if (valueForLabel(rows, 'Currency:', columnIndex) !== 'CNY') {
    throw blocked('The Federal Reserve H.10 evidence has an unexpected currency identity.')
  }
  if (valueForLabel(rows, 'Unique Identifier:', columnIndex) !== FEDERAL_RESERVE_H10_CNY_SERIES_ID) {
    throw blocked('The Federal Reserve H.10 evidence has an unexpected series identity.')
  }
  const headerIndex = rows.findIndex((row) => row[0]?.trim() === 'Time Period')
  if (headerIndex < 0 || rows[headerIndex]?.[columnIndex]?.trim() !== FEDERAL_RESERVE_H10_CNY_COLUMN_ID) {
    throw blocked('The Federal Reserve H.10 evidence has an unexpected observation column.')
  }

  const observations: Array<{ date: string; time: number; cnyPerUsdMicros: number }> = []
  for (const row of rows.slice(headerIndex + 1)) {
    const date = row[0]?.trim()
    const rawValue = row[columnIndex]?.trim()
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !rawValue || rawValue === 'ND') continue
    const time = Date.parse(`${date}T00:00:00.000Z`)
    if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) {
      throw blocked('The Federal Reserve H.10 evidence contains an invalid observation date.')
    }
    observations.push({ date, time, cnyPerUsdMicros: parsePositiveDecimalMicros(rawValue) })
  }
  observations.sort((left, right) => right.time - left.time)
  const latest = observations[0]
  if (!latest) throw blocked('The Federal Reserve H.10 evidence has no current CNY observation.')
  const ageMs = capturedAtMs - latest.time
  if (ageMs < 0) throw blocked('The Federal Reserve H.10 observation is dated in the future.')
  if (ageMs > MAX_OBSERVATION_AGE_MS) throw blocked('The Federal Reserve H.10 observation is stale.')
  return latest
}

function parsePositiveDecimalMicros(value: string): number {
  const match = /^(\d{1,6})(?:\.(\d{1,6}))?$/.exec(value)
  if (!match) throw blocked('The Federal Reserve H.10 observation has an invalid decimal value.')
  const whole = BigInt(match[1]!)
  const fractionalDigits = (match[2] ?? '').padEnd(6, '0') || '0'
  const fractional = BigInt(fractionalDigits)
  const micros = whole * 1_000_000n + fractional
  if (micros <= 0n || micros > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw blocked('The Federal Reserve H.10 observation is outside the supported range.')
  }
  return Number(micros)
}

function findRow(rows: string[][], label: string): string[] {
  const row = rows.find((candidate) => candidate[0]?.trim() === label)
  if (!row) throw blocked(`The Federal Reserve H.10 evidence is missing ${label}.`)
  return row
}

function valueForLabel(rows: string[][], label: string, columnIndex: number): string {
  return findRow(rows, label)[columnIndex]?.trim() ?? ''
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!
    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += character
      }
      continue
    }
    if (character === '"') {
      if (field.length !== 0) throw blocked('The Federal Reserve H.10 CSV quoting is malformed.')
      inQuotes = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }
  if (inQuotes) throw blocked('The Federal Reserve H.10 CSV has an unterminated quoted value.')
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((value) => value.length > 0)) rows.push(row)
  }
  if (rows.length === 0) throw blocked('The Federal Reserve H.10 CSV has no rows.')
  return rows
}

async function readBoundedBody(response: Response, maximumBytes: number): Promise<Buffer> {
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = Buffer.from(value)
    total += chunk.length
    if (total > maximumBytes) {
      await reader.cancel().catch(() => undefined)
      throw blocked('The official Federal Reserve H.10 FX evidence exceeds the bounded source size.')
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks, total)
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
