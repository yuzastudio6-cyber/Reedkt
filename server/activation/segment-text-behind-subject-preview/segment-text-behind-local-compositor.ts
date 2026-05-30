import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { deflateSync, inflateSync } from 'node:zlib'
import type { SegmentTextBehindSubjectPreviewCompositionPlan } from './segment-text-behind-subject-preview-types'

interface PngImage {
  width: number
  height: number
  data: Uint8ClampedArray
}

interface PngDecodeState {
  width: number
  height: number
  bitDepth: number
  colorType: number
  idat: Buffer[]
  palette?: Buffer
  transparency?: Buffer
}

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
let crcTable: number[] | undefined

export async function composeSegmentTextBehindSubjectPreviewFrame(input: {
  framePath: string
  maskPath: string
  outputPath: string
  plan: SegmentTextBehindSubjectPreviewCompositionPlan
}): Promise<{
  width: number
  height: number
  maskNonZeroPixels: number
  textPixelsPainted: number
  sha256: string
  sizeBytes: number
}> {
  const frame = decodePng(await readFile(input.framePath))
  const mask = decodePng(await readFile(input.maskPath))
  if (frame.width !== input.plan.frameWidth || frame.height !== input.plan.frameHeight) {
    throw new Error(`Unexpected frame dimensions ${frame.width}x${frame.height}; expected ${input.plan.frameWidth}x${input.plan.frameHeight}.`)
  }
  if (mask.width !== frame.width || mask.height !== frame.height) {
    throw new Error(`Mask dimensions ${mask.width}x${mask.height} do not match frame dimensions ${frame.width}x${frame.height}.`)
  }

  const textFrame = new Uint8ClampedArray(frame.data)
  const textPixelsPainted = drawTextLayer(textFrame, frame.width, frame.height, input.plan)
  const output = new Uint8ClampedArray(frame.data.length)
  let maskNonZeroPixels = 0
  for (let pixel = 0; pixel < frame.width * frame.height; pixel += 1) {
    const offset = pixel * 4
    const maskValue = Math.max(mask.data[offset], mask.data[offset + 1], mask.data[offset + 2]) * (mask.data[offset + 3] / 255)
    const alpha = Math.max(0, Math.min(1, maskValue / 255))
    if (alpha > 0.01) maskNonZeroPixels += 1
    for (let channel = 0; channel < 3; channel += 1) {
      output[offset + channel] = Math.round(frame.data[offset + channel] * alpha + textFrame[offset + channel] * (1 - alpha))
    }
    output[offset + 3] = 255
  }

  const encoded = encodePng({ width: frame.width, height: frame.height, data: output })
  await writeFile(input.outputPath, encoded)
  return {
    width: frame.width,
    height: frame.height,
    maskNonZeroPixels,
    textPixelsPainted,
    sha256: sha256(encoded),
    sizeBytes: encoded.byteLength,
  }
}

function drawTextLayer(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  plan: SegmentTextBehindSubjectPreviewCompositionPlan,
): number {
  const glyphs = getBlockGlyphs()
  const scale = plan.textStyle.blockScale
  const text = plan.text
  let painted = 0
  let cursorX = plan.position.x
  for (const char of text) {
    const glyph = glyphs[char]
    if (!glyph) {
      cursorX += 6 * scale
      continue
    }
    painted += drawGlyphStroke(pixels, width, height, glyph, cursorX, plan.position.y, scale, plan.textStyle.strokeColor, 2, 0.82)
    painted += drawGlyph(pixels, width, height, glyph, cursorX, plan.position.y, scale, plan.textStyle.fillColor, plan.textStyle.opacity)
    cursorX += 6 * scale
  }
  return painted
}

function drawGlyphStroke(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  glyph: string[],
  x: number,
  y: number,
  scale: number,
  color: string,
  radius: number,
  opacity: number,
): number {
  let painted = 0
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (dx === 0 && dy === 0) continue
      painted += drawGlyph(pixels, width, height, glyph, x + dx, y + dy, scale, color, opacity)
    }
  }
  return painted
}

function drawGlyph(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  glyph: string[],
  x: number,
  y: number,
  scale: number,
  color: string,
  opacity: number,
): number {
  const rgb = parseHexColor(color)
  let painted = 0
  for (let row = 0; row < glyph.length; row += 1) {
    for (let column = 0; column < glyph[row].length; column += 1) {
      if (glyph[row][column] !== '1') continue
      for (let yy = 0; yy < scale; yy += 1) {
        for (let xx = 0; xx < scale; xx += 1) {
          const px = x + column * scale + xx
          const py = y + row * scale + yy
          if (px < 0 || py < 0 || px >= width || py >= height) continue
          blendPixel(pixels, width, px, py, rgb, opacity)
          painted += 1
        }
      }
    }
  }
  return painted
}

function blendPixel(
  pixels: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  rgb: [number, number, number],
  opacity: number,
): void {
  const offset = (y * width + x) * 4
  for (let channel = 0; channel < 3; channel += 1) {
    pixels[offset + channel] = Math.round(rgb[channel] * opacity + pixels[offset + channel] * (1 - opacity))
  }
  pixels[offset + 3] = 255
}

function getBlockGlyphs(): Record<string, string[]> {
  return {
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  }
}

function decodePng(buffer: Buffer): PngImage {
  if (!buffer.subarray(0, 8).equals(pngSignature)) throw new Error('Invalid PNG signature.')
  const state: PngDecodeState = {
    width: 0,
    height: 0,
    bitDepth: 0,
    colorType: 0,
    idat: [],
  }
  let offset = 8
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      state.width = data.readUInt32BE(0)
      state.height = data.readUInt32BE(4)
      state.bitDepth = data[8]
      state.colorType = data[9]
      if (data[12] !== 0) throw new Error('Interlaced PNGs are not supported.')
    } else if (type === 'PLTE') {
      state.palette = Buffer.from(data)
    } else if (type === 'tRNS') {
      state.transparency = Buffer.from(data)
    } else if (type === 'IDAT') {
      state.idat.push(Buffer.from(data))
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }
  if (state.bitDepth !== 8) throw new Error(`Unsupported PNG bit depth ${state.bitDepth}; only 8-bit PNG is supported.`)
  const channels = pngChannels(state.colorType)
  const inflated = inflateSync(Buffer.concat(state.idat))
  const stride = state.width * channels
  const raw = Buffer.alloc(state.height * stride)
  let inputOffset = 0
  for (let y = 0; y < state.height; y += 1) {
    const filter = inflated[inputOffset]
    inputOffset += 1
    const row = inflated.subarray(inputOffset, inputOffset + stride)
    inputOffset += stride
    unfilterRow(filter, row, raw, y, stride, channels)
  }
  return convertRawToRgba(raw, state, channels)
}

function encodePng(image: PngImage): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(image.width, 0)
  ihdr.writeUInt32BE(image.height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const stride = image.width * 4
  const raw = Buffer.alloc(image.height * (stride + 1))
  for (let y = 0; y < image.height; y += 1) {
    const rowOffset = y * (stride + 1)
    raw[rowOffset] = 0
    Buffer.from(image.data.buffer, image.data.byteOffset + y * stride, stride).copy(raw, rowOffset + 1)
  }
  return Buffer.concat([
    pngSignature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChannels(colorType: number): number {
  if (colorType === 0) return 1
  if (colorType === 2) return 3
  if (colorType === 3) return 1
  if (colorType === 4) return 2
  if (colorType === 6) return 4
  throw new Error(`Unsupported PNG color type ${colorType}.`)
}

function unfilterRow(filter: number, row: Buffer, raw: Buffer, y: number, stride: number, bytesPerPixel: number): void {
  const outputOffset = y * stride
  const previousOffset = outputOffset - stride
  for (let x = 0; x < stride; x += 1) {
    const left = x >= bytesPerPixel ? raw[outputOffset + x - bytesPerPixel] : 0
    const up = y > 0 ? raw[previousOffset + x] : 0
    const upperLeft = y > 0 && x >= bytesPerPixel ? raw[previousOffset + x - bytesPerPixel] : 0
    let value: number
    if (filter === 0) value = row[x]
    else if (filter === 1) value = row[x] + left
    else if (filter === 2) value = row[x] + up
    else if (filter === 3) value = row[x] + Math.floor((left + up) / 2)
    else if (filter === 4) value = row[x] + paeth(left, up, upperLeft)
    else throw new Error(`Unsupported PNG filter ${filter}.`)
    raw[outputOffset + x] = value & 255
  }
}

function convertRawToRgba(raw: Buffer, state: PngDecodeState, channels: number): PngImage {
  const output = new Uint8ClampedArray(state.width * state.height * 4)
  for (let pixel = 0; pixel < state.width * state.height; pixel += 1) {
    const inputOffset = pixel * channels
    const outputOffset = pixel * 4
    if (state.colorType === 0) {
      output[outputOffset] = raw[inputOffset]
      output[outputOffset + 1] = raw[inputOffset]
      output[outputOffset + 2] = raw[inputOffset]
      output[outputOffset + 3] = 255
    } else if (state.colorType === 2) {
      output[outputOffset] = raw[inputOffset]
      output[outputOffset + 1] = raw[inputOffset + 1]
      output[outputOffset + 2] = raw[inputOffset + 2]
      output[outputOffset + 3] = 255
    } else if (state.colorType === 3) {
      const index = raw[inputOffset]
      output[outputOffset] = state.palette?.[index * 3] ?? 0
      output[outputOffset + 1] = state.palette?.[index * 3 + 1] ?? 0
      output[outputOffset + 2] = state.palette?.[index * 3 + 2] ?? 0
      output[outputOffset + 3] = state.transparency?.[index] ?? 255
    } else if (state.colorType === 4) {
      output[outputOffset] = raw[inputOffset]
      output[outputOffset + 1] = raw[inputOffset]
      output[outputOffset + 2] = raw[inputOffset]
      output[outputOffset + 3] = raw[inputOffset + 1]
    } else {
      output[outputOffset] = raw[inputOffset]
      output[outputOffset + 1] = raw[inputOffset + 1]
      output[outputOffset + 2] = raw[inputOffset + 2]
      output[outputOffset + 3] = raw[inputOffset + 3]
    }
  }
  return { width: state.width, height: state.height, data: output }
}

function paeth(left: number, up: number, upperLeft: number): number {
  const p = left + up - upperLeft
  const pa = Math.abs(p - left)
  const pb = Math.abs(p - up)
  const pc = Math.abs(p - upperLeft)
  if (pa <= pb && pa <= pc) return left
  if (pb <= pc) return up
  return upperLeft
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function crc32(buffer: Buffer): number {
  const table = crcTable ?? buildCrcTable()
  crcTable = table
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function buildCrcTable(): number[] {
  const table: number[] = []
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
}

function parseHexColor(color: string): [number, number, number] {
  const match = color.match(/^#([0-9a-f]{6})$/i)
  if (!match) throw new Error(`Unsupported color ${color}.`)
  const value = Number.parseInt(match[1], 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}
