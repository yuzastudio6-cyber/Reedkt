import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import {
  EDIT_REFERENCE_CONTROLLED_FIXTURE_CATALOG_VERSION,
  EDIT_REFERENCE_CONTROLLED_REFERENCE_FIXTURES,
  EDIT_REFERENCE_CONTROLLED_TARGET_FIXTURES,
  EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS,
  type EditReferenceControlledReferenceFixture,
  type EditReferenceControlledTargetFixture,
} from './edit-reference-controlled-fixture-catalog'

const execFileAsync = promisify(execFile)

export const EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_VERSION =
  'edit-reference-controlled-media-fixtures-v2' as const

export type EditReferenceControlledMediaFixtureId =
  | EditReferenceControlledReferenceFixture['id']
  | EditReferenceControlledTargetFixture['id']

export type EditReferenceControlledMediaVisualMotif =
  | 'warm_story_caption_band'
  | 'voice_first_teaching'
  | 'product_ui_cards'
  | 'educational_product_demo'
  | 'portrait_talking_head'
  | 'silent_visual_montage'
  | 'software_tutorial'

export interface EditReferenceControlledMediaCue {
  readonly startSeconds: number
  readonly endSeconds: number
  readonly text: string
}

export interface EditReferenceControlledMediaFixtureDefinition {
  readonly fixtureId: EditReferenceControlledMediaFixtureId
  readonly fixtureKind: 'reference' | 'target'
  readonly rightsBasis: 'synthetic_internal'
  readonly width: number
  readonly height: number
  readonly frameRate: number
  readonly durationSeconds: number
  readonly visualMotif: EditReferenceControlledMediaVisualMotif
  readonly backgroundColors: readonly [string, string, string]
  readonly overlayColor: string
  readonly intendedHasSpeech: boolean
  readonly actualAudioMode: 'tone_cadence_proxy_not_speech' | 'silent'
  readonly audioFrequencyHz?: number
  readonly transcriptCues: readonly EditReferenceControlledMediaCue[]
  readonly captionCues: readonly EditReferenceControlledMediaCue[]
  readonly visualGroundTruth: readonly string[]
}

export interface EditReferenceControlledMediaFixtureGroundTruth {
  readonly schemaVersion: typeof EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_VERSION
  readonly catalogVersion: typeof EDIT_REFERENCE_CONTROLLED_FIXTURE_CATALOG_VERSION
  readonly fixtureId: EditReferenceControlledMediaFixtureId
  readonly fixtureKind: 'reference' | 'target'
  readonly rightsBasis: 'synthetic_internal'
  readonly media: {
    readonly width: number
    readonly height: number
    readonly frameRate: number
    readonly durationSeconds: number
    readonly visualMotif: EditReferenceControlledMediaVisualMotif
    readonly hasAudioStream: boolean
    readonly actualAudioMode: 'tone_cadence_proxy_not_speech' | 'silent'
    readonly intendedHasSpeech: boolean
    readonly semanticSpeechPresent: false
    readonly captionRepresentation: 'burned_in_bitmap_overlay_and_embedded_mov_text'
    readonly visibleCaptionPixelsPresent: true
    readonly visibleCaptionOcrCoverage: 'fixture_ready_not_executed'
  }
  readonly transcript: {
    readonly source: 'fixture_ground_truth_not_derived_from_media'
    readonly cues: readonly EditReferenceControlledMediaCue[]
  }
  readonly captions: {
    readonly source: 'fixture_ground_truth_and_embedded_timed_text'
    readonly cues: readonly EditReferenceControlledMediaCue[]
  }
  readonly visualGroundTruth: readonly string[]
  readonly expectedEvidence: unknown
  readonly blockedTransfers: typeof EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS
  readonly runtimeTruth: {
    readonly semanticRuntimeExecuted: false
    readonly providerCallMade: false
    readonly remoteMutationMade: false
    readonly productionReady: false
  }
}

export interface MaterializedEditReferenceControlledMediaFixture {
  readonly definition: EditReferenceControlledMediaFixtureDefinition
  readonly videoPath: string
  readonly subtitlePath: string
  readonly groundTruthPath: string
  readonly captionOverlayPaths: readonly string[]
  readonly videoChecksumSha256: string
  readonly subtitleChecksumSha256: string
  readonly groundTruthChecksumSha256: string
  readonly captionOverlayChecksumsSha256: readonly string[]
  readonly videoSizeBytes: number
  readonly groundTruth: EditReferenceControlledMediaFixtureGroundTruth
}

const CUE_WINDOW = {
  first: { startSeconds: 0.1, endSeconds: 0.9 },
  second: { startSeconds: 1.1, endSeconds: 1.9 },
  third: { startSeconds: 2.1, endSeconds: 2.9 },
} as const

export const EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS = [
  {
    fixtureId: 'reference_a_travel_story',
    fixtureKind: 'reference',
    rightsBasis: 'synthetic_internal',
    width: 320,
    height: 180,
    frameRate: 12,
    durationSeconds: 3,
    visualMotif: 'warm_story_caption_band',
    backgroundColors: ['D98B5F', 'CFA66B', '647C5D'],
    overlayColor: 'FFF3DF',
    intendedHasSpeech: true,
    actualAudioMode: 'tone_cadence_proxy_not_speech',
    audioFrequencyHz: 220,
    transcriptCues: [
      { ...CUE_WINDOW.first, text: 'The journey begins with a question.' },
      { ...CUE_WINDOW.second, text: 'A small detail changes the direction.' },
      { ...CUE_WINDOW.third, text: 'The final moment leaves room to reflect.' },
    ],
    captionCues: [
      { ...CUE_WINDOW.first, text: 'A new direction' },
      { ...CUE_WINDOW.second, text: 'Notice the detail' },
      { ...CUE_WINDOW.third, text: 'Leave room to reflect' },
    ],
    visualGroundTruth: [
      'Three warm-to-natural scene changes represent establishing, detail, and reflection beats.',
      'A restrained lower caption band and small context card preserve the image hierarchy.',
      'The audio stream is a synthetic cadence proxy only; it is not speech, music, ambience, or SFX evidence.',
    ],
  },
  {
    fixtureId: 'reference_b_educational_voice_first',
    fixtureKind: 'reference',
    rightsBasis: 'synthetic_internal',
    width: 320,
    height: 180,
    frameRate: 12,
    durationSeconds: 3,
    visualMotif: 'voice_first_teaching',
    backgroundColors: ['F2F4F7', 'DCE8F5', 'EDF1F4'],
    overlayColor: '315A7D',
    intendedHasSpeech: true,
    actualAudioMode: 'tone_cadence_proxy_not_speech',
    audioFrequencyHz: 330,
    transcriptCues: [
      { ...CUE_WINDOW.first, text: 'First define the problem.' },
      { ...CUE_WINDOW.second, text: 'Then inspect one clear example.' },
      { ...CUE_WINDOW.third, text: 'Finish with the practical takeaway.' },
    ],
    captionCues: [
      { ...CUE_WINDOW.first, text: 'Define the problem' },
      { ...CUE_WINDOW.second, text: 'Inspect an example' },
      { ...CUE_WINDOW.third, text: 'Apply the takeaway' },
    ],
    visualGroundTruth: [
      'A stable speaker region remains visually primary beside one restrained teaching panel.',
      'Three clean high-key scenes represent problem, example, and takeaway.',
      'The audio stream is a synthetic cadence proxy only; speech clarity must be tested later with approved spoken media.',
    ],
  },
  {
    fixtureId: 'reference_c_product_commercial',
    fixtureKind: 'reference',
    rightsBasis: 'synthetic_internal',
    width: 320,
    height: 180,
    frameRate: 12,
    durationSeconds: 3,
    visualMotif: 'product_ui_cards',
    backgroundColors: ['111A2E', '17233D', '202D4A'],
    overlayColor: '55D6E8',
    intendedHasSpeech: true,
    actualAudioMode: 'tone_cadence_proxy_not_speech',
    audioFrequencyHz: 440,
    transcriptCues: [
      { ...CUE_WINDOW.first, text: 'One repeated task slows the work.' },
      { ...CUE_WINDOW.second, text: 'The product makes the action visible.' },
      { ...CUE_WINDOW.third, text: 'The final state proves the benefit.' },
    ],
    captionCues: [
      { ...CUE_WINDOW.first, text: 'Find the friction' },
      { ...CUE_WINDOW.second, text: 'Show the feature' },
      { ...CUE_WINDOW.third, text: 'Prove the benefit' },
    ],
    visualGroundTruth: [
      'A dark product stage contains deterministic cards, a feature rail, and a proof panel.',
      'Three scenes represent problem, feature, and proof without reproducing a real product or brand.',
      'The audio stream is a synthetic cadence proxy only; it does not prove premium music or UI-SFX analysis.',
    ],
  },
  {
    fixtureId: 'target_a_educational_product_demo',
    fixtureKind: 'target',
    rightsBasis: 'synthetic_internal',
    width: 320,
    height: 180,
    frameRate: 12,
    durationSeconds: 3,
    visualMotif: 'educational_product_demo',
    backgroundColors: ['F4F7FA', 'E4EDF7', 'D8E4F2'],
    overlayColor: '2867A0',
    intendedHasSpeech: true,
    actualAudioMode: 'tone_cadence_proxy_not_speech',
    audioFrequencyHz: 550,
    transcriptCues: [
      { ...CUE_WINDOW.first, text: 'Open the generic workspace.' },
      { ...CUE_WINDOW.second, text: 'Choose the target-owned example.' },
      { ...CUE_WINDOW.third, text: 'Verify the expected result.' },
    ],
    captionCues: [
      { ...CUE_WINDOW.first, text: 'Open the workspace' },
      { ...CUE_WINDOW.second, text: 'Choose the example' },
      { ...CUE_WINDOW.third, text: 'Verify the result' },
    ],
    visualGroundTruth: [
      'A clean 16:9 demonstration canvas reserves space for target-owned screen evidence and step cards.',
      'The visual sequence represents question, action, and verified result.',
      'The cadence proxy does not prove actual narration or transcript alignment.',
    ],
  },
  {
    fixtureId: 'target_b_travel_talking_head',
    fixtureKind: 'target',
    rightsBasis: 'synthetic_internal',
    width: 180,
    height: 320,
    frameRate: 12,
    durationSeconds: 3,
    visualMotif: 'portrait_talking_head',
    backgroundColors: ['7FA4B8', 'B78A67', '6F8A71'],
    overlayColor: 'FFF6E8',
    intendedHasSpeech: true,
    actualAudioMode: 'tone_cadence_proxy_not_speech',
    audioFrequencyHz: 660,
    transcriptCues: [
      { ...CUE_WINDOW.first, text: 'I expected the place to feel familiar.' },
      { ...CUE_WINDOW.second, text: 'One quiet detail changed the trip.' },
      { ...CUE_WINDOW.third, text: 'That contrast is what I remember.' },
    ],
    captionCues: [
      { ...CUE_WINDOW.first, text: 'An unexpected place' },
      { ...CUE_WINDOW.second, text: 'One quiet detail' },
      { ...CUE_WINDOW.third, text: 'The contrast remains' },
    ],
    visualGroundTruth: [
      'A portrait speaker-safe region remains primary with only one small target-owned cutaway zone.',
      'Caption and control-safe regions are represented without a real person or location.',
      'The cadence proxy does not prove conversational speech or natural pause analysis.',
    ],
  },
  {
    fixtureId: 'target_c_silent_visual_montage',
    fixtureKind: 'target',
    rightsBasis: 'synthetic_internal',
    width: 240,
    height: 300,
    frameRate: 12,
    durationSeconds: 3,
    visualMotif: 'silent_visual_montage',
    backgroundColors: ['26354A', '8A5B50', '506C64'],
    overlayColor: 'F5D38A',
    intendedHasSpeech: false,
    actualAudioMode: 'silent',
    transcriptCues: [],
    captionCues: [
      { ...CUE_WINDOW.first, text: 'Setup' },
      { ...CUE_WINDOW.second, text: 'Contrast' },
      { ...CUE_WINDOW.third, text: 'Closing image' },
    ],
    visualGroundTruth: [
      'A 4:5 speech-free montage uses three target-owned visual groups and concise authored context cues.',
      'The MP4 intentionally has no audio stream and no transcript ground truth.',
      'Music, SFX, speech pacing, and reference caption wording must remain held back.',
    ],
  },
  {
    fixtureId: 'target_d_voice_first_software_tutorial',
    fixtureKind: 'target',
    rightsBasis: 'synthetic_internal',
    width: 320,
    height: 180,
    frameRate: 12,
    durationSeconds: 3,
    visualMotif: 'software_tutorial',
    backgroundColors: ['EFF3F7', 'E3EAF2', 'D7E2ED'],
    overlayColor: '3B68A0',
    intendedHasSpeech: true,
    actualAudioMode: 'tone_cadence_proxy_not_speech',
    audioFrequencyHz: 770,
    transcriptCues: [
      { ...CUE_WINDOW.first, text: 'Confirm the prerequisite before starting.' },
      { ...CUE_WINDOW.second, text: 'Complete the required action in order.' },
      { ...CUE_WINDOW.third, text: 'Verify the final software state.' },
    ],
    captionCues: [
      { ...CUE_WINDOW.first, text: '1. Check the prerequisite' },
      { ...CUE_WINDOW.second, text: '2. Complete the action' },
      { ...CUE_WINDOW.third, text: '3. Verify the state' },
    ],
    visualGroundTruth: [
      'A 16:9 tutorial canvas preserves a sidebar, main screen region, cursor-safe highlight, and step rail.',
      'The three scenes preserve prerequisite, action, and verification order.',
      'The cadence proxy does not prove speech recognition, word timing, or actual software semantics.',
    ],
  },
] as const satisfies readonly EditReferenceControlledMediaFixtureDefinition[]

function assertSafeOutputRoot(outputRoot: string): string {
  if (!isAbsolute(outputRoot)) {
    throw new Error('Controlled media fixture output root must be absolute.')
  }
  return resolve(outputRoot)
}

function resolveInsideRoot(root: string, ...segments: string[]): string {
  const candidate = resolve(root, ...segments)
  const relativePath = relative(root, candidate)
  if (relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath))) {
    return candidate
  }
  throw new Error('Controlled media fixture path escaped its output root.')
}

function expectedEvidenceForFixture(fixtureId: EditReferenceControlledMediaFixtureId): unknown {
  const reference = EDIT_REFERENCE_CONTROLLED_REFERENCE_FIXTURES.find((fixture) => fixture.id === fixtureId)
  if (reference) return reference.expectedEvidence
  const target = EDIT_REFERENCE_CONTROLLED_TARGET_FIXTURES.find((fixture) => fixture.id === fixtureId)
  if (target) return target.expectedUnderstanding
  throw new Error(`Unknown controlled media fixture: ${fixtureId}`)
}

function visualFilterForDefinition(definition: EditReferenceControlledMediaFixtureDefinition): string {
  const color = `0x${definition.overlayColor}`
  switch (definition.visualMotif) {
    case 'warm_story_caption_band':
      return `drawbox=x=iw*0.06:y=ih*0.08:w=iw*0.24:h=ih*0.10:color=${color}@0.78:t=fill,drawbox=x=iw*0.06:y=ih*0.76:w=iw*0.70:h=ih*0.13:color=${color}@0.88:t=fill`
    case 'voice_first_teaching':
      return `drawbox=x=iw*0.06:y=ih*0.12:w=iw*0.36:h=ih*0.68:color=${color}@0.32:t=fill,drawbox=x=iw*0.50:y=ih*0.24:w=iw*0.42:h=ih*0.12:color=${color}@0.74:t=fill,drawbox=x=iw*0.50:y=ih*0.44:w=iw*0.34:h=ih*0.12:color=${color}@0.52:t=fill`
    case 'product_ui_cards':
      return `drawbox=x=iw*0.07:y=ih*0.13:w=iw*0.58:h=ih*0.66:color=white@0.10:t=fill,drawbox=x=iw*0.71:y=ih*0.15:w=iw*0.21:h=ih*0.16:color=${color}@0.82:t=fill,drawbox=x=iw*0.71:y=ih*0.38:w=iw*0.21:h=ih*0.16:color=${color}@0.52:t=fill,drawbox=x=iw*0.71:y=ih*0.61:w=iw*0.21:h=ih*0.16:color=${color}@0.30:t=fill`
    case 'educational_product_demo':
      return `drawbox=x=iw*0.07:y=ih*0.12:w=iw*0.66:h=ih*0.68:color=white@0.82:t=fill,drawbox=x=iw*0.77:y=ih*0.16:w=iw*0.16:h=ih*0.12:color=${color}@0.82:t=fill,drawbox=x=iw*0.77:y=ih*0.36:w=iw*0.16:h=ih*0.12:color=${color}@0.56:t=fill,drawbox=x=iw*0.77:y=ih*0.56:w=iw*0.16:h=ih*0.12:color=${color}@0.32:t=fill`
    case 'portrait_talking_head':
      return `drawbox=x=iw*0.18:y=ih*0.10:w=iw*0.64:h=ih*0.52:color=${color}@0.18:t=fill,drawbox=x=iw*0.08:y=ih*0.72:w=iw*0.84:h=ih*0.09:color=${color}@0.84:t=fill,drawbox=x=iw*0.68:y=ih*0.84:w=iw*0.24:h=ih*0.08:color=${color}@0.52:t=fill`
    case 'silent_visual_montage':
      return `drawbox=x=iw*0.08:y=ih*0.09:w=iw*0.84:h=ih*0.68:color=${color}@0.16:t=fill,drawbox=x=iw*0.08:y=ih*0.82:w=iw*0.36:h=ih*0.08:color=${color}@0.74:t=fill`
    case 'software_tutorial':
      return `drawbox=x=iw*0.05:y=ih*0.10:w=iw*0.18:h=ih*0.76:color=${color}@0.28:t=fill,drawbox=x=iw*0.27:y=ih*0.10:w=iw*0.66:h=ih*0.60:color=white@0.78:t=fill,drawbox=x=iw*0.35:y=ih*0.74:w=iw*0.48:h=ih*0.10:color=${color}@0.70:t=fill`
  }
}

const CAPTION_GLYPHS: Readonly<Record<string, readonly string[]>> = {
  ' ': ['000', '000', '000', '000', '000'],
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['101', '111', '111', '111', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '111', '011'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['110', '001', '010', '100', '111'],
  '3': ['110', '001', '010', '001', '110'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '110', '001', '110'],
  '6': ['011', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '110'],
  '.': ['000', '000', '000', '000', '010'],
  ',': ['000', '000', '000', '010', '100'],
  '-': ['000', '000', '111', '000', '000'],
  ':': ['000', '010', '000', '010', '000'],
  '!': ['010', '010', '010', '000', '010'],
  '?': ['110', '001', '010', '000', '010'],
  "'": ['010', '010', '000', '000', '000'],
}

function captionOverlayPpm(
  definition: EditReferenceControlledMediaFixtureDefinition,
  cue: EditReferenceControlledMediaCue,
): Buffer {
  const bandX = Math.round(definition.width * 0.04)
  const bandY = Math.round(definition.height * 0.74)
  const bandWidth = definition.width - (bandX * 2)
  const bandHeight = Math.round(definition.height * 0.22)
  let scale = 3
  let glyphWidth = 3 * scale
  let glyphSpacing = scale
  let maxCharacters = Math.floor((bandWidth - (scale * 4)) / (glyphWidth + glyphSpacing))
  let lines = wrapCaption(cue.text.toUpperCase(), maxCharacters)
  if (lines.length > 2) {
    scale = 2
    glyphWidth = 3 * scale
    glyphSpacing = scale
    maxCharacters = Math.floor((bandWidth - (scale * 4)) / (glyphWidth + glyphSpacing))
    lines = wrapCaption(cue.text.toUpperCase(), maxCharacters)
  }
  if (lines.length > 2) throw new Error('Controlled media fixture caption exceeds the two-line readability bound.')
  const resolvedGlyphHeight = 5 * scale
  const lineHeight = resolvedGlyphHeight + scale

  const pixels = Buffer.alloc(definition.width * definition.height * 3)
  fillRgb(pixels, definition.width, 0, 0, definition.width, definition.height, [0, 255, 0])
  fillRgb(pixels, definition.width, bandX, bandY, bandWidth, bandHeight, [11, 18, 32])
  const textHeight = resolvedGlyphHeight + ((lines.length - 1) * lineHeight)
  const textStartY = bandY + Math.floor((bandHeight - textHeight) / 2)

  for (const [lineIndex, line] of lines.entries()) {
    const lineWidth = (line.length * glyphWidth) + (Math.max(0, line.length - 1) * glyphSpacing)
    const textStartX = Math.floor((definition.width - lineWidth) / 2)
    for (const [characterIndex, character] of [...line].entries()) {
      const glyph = CAPTION_GLYPHS[character] ?? CAPTION_GLYPHS['?']
      if (!glyph) throw new Error('Controlled media fixture fallback caption glyph is missing.')
      const glyphX = textStartX + (characterIndex * (glyphWidth + glyphSpacing))
      const glyphY = textStartY + (lineIndex * lineHeight)
      for (const [rowIndex, row] of glyph.entries()) {
        for (const [columnIndex, enabled] of [...row].entries()) {
          if (enabled !== '1') continue
          fillRgb(
            pixels,
            definition.width,
            glyphX + (columnIndex * scale),
            glyphY + (rowIndex * scale),
            scale,
            scale,
            [255, 255, 255],
          )
        }
      }
    }
  }

  return Buffer.concat([
    Buffer.from(`P6\n${definition.width} ${definition.height}\n255\n`, 'ascii'),
    pixels,
  ])
}

function wrapCaption(text: string, maxCharacters: number): readonly string[] {
  if (!Number.isInteger(maxCharacters) || maxCharacters < 1) {
    throw new Error('Controlled media fixture caption width must allow at least one character.')
  }
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  for (const word of words) {
    if (word.length > maxCharacters) {
      throw new Error('Controlled media fixture caption contains a word wider than the caption band.')
    }
    const current = lines.at(-1)
    if (!current || current.length + 1 + word.length > maxCharacters) {
      lines.push(word)
    } else {
      lines[lines.length - 1] = `${current} ${word}`
    }
  }
  if (lines.length <= 2) return lines
  return lines
}

function fillRgb(
  pixels: Buffer,
  canvasWidth: number,
  x: number,
  y: number,
  width: number,
  height: number,
  color: readonly [number, number, number],
): void {
  if (!Number.isInteger(canvasWidth) || canvasWidth < 1 || pixels.length % (canvasWidth * 3) !== 0) {
    throw new Error('Controlled media fixture RGB canvas dimensions are invalid.')
  }
  const canvasHeight = pixels.length / (canvasWidth * 3)
  const startRow = Math.max(0, y)
  const endRow = Math.min(canvasHeight, Math.max(0, y + height))
  const startColumn = Math.max(0, x)
  const endColumn = Math.min(canvasWidth, Math.max(0, x + width))
  for (let row = startRow; row < endRow; row += 1) {
    for (let column = startColumn; column < endColumn; column += 1) {
      const offset = ((row * canvasWidth) + column) * 3
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
    }
  }
}

function srtTimestamp(seconds: number): string {
  const milliseconds = Math.round(seconds * 1000)
  const hours = Math.floor(milliseconds / 3_600_000)
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000)
  const wholeSeconds = Math.floor((milliseconds % 60_000) / 1000)
  const remainder = milliseconds % 1000
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')},${String(remainder).padStart(3, '0')}`
}

function createSrt(cues: readonly EditReferenceControlledMediaCue[]): string {
  return cues
    .map((cue, index) => `${index + 1}\n${srtTimestamp(cue.startSeconds)} --> ${srtTimestamp(cue.endSeconds)}\n${cue.text}\n`)
    .join('\n')
}

async function checksumFile(path: string): Promise<string> {
  const bytes = await readFile(path)
  return createHash('sha256').update(bytes).digest('hex')
}

function createGroundTruth(
  definition: EditReferenceControlledMediaFixtureDefinition,
): EditReferenceControlledMediaFixtureGroundTruth {
  return {
    schemaVersion: EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_VERSION,
    catalogVersion: EDIT_REFERENCE_CONTROLLED_FIXTURE_CATALOG_VERSION,
    fixtureId: definition.fixtureId,
    fixtureKind: definition.fixtureKind,
    rightsBasis: definition.rightsBasis,
    media: {
      width: definition.width,
      height: definition.height,
      frameRate: definition.frameRate,
      durationSeconds: definition.durationSeconds,
      visualMotif: definition.visualMotif,
      hasAudioStream: definition.actualAudioMode !== 'silent',
      actualAudioMode: definition.actualAudioMode,
      intendedHasSpeech: definition.intendedHasSpeech,
      semanticSpeechPresent: false,
      captionRepresentation: 'burned_in_bitmap_overlay_and_embedded_mov_text',
      visibleCaptionPixelsPresent: true,
      visibleCaptionOcrCoverage: 'fixture_ready_not_executed',
    },
    transcript: {
      source: 'fixture_ground_truth_not_derived_from_media',
      cues: definition.transcriptCues,
    },
    captions: {
      source: 'fixture_ground_truth_and_embedded_timed_text',
      cues: definition.captionCues,
    },
    visualGroundTruth: definition.visualGroundTruth,
    expectedEvidence: expectedEvidenceForFixture(definition.fixtureId),
    blockedTransfers: EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS,
    runtimeTruth: {
      semanticRuntimeExecuted: false,
      providerCallMade: false,
      remoteMutationMade: false,
      productionReady: false,
    },
  }
}

export async function materializeEditReferenceControlledMediaFixture(input: {
  outputRoot: string
  definition: EditReferenceControlledMediaFixtureDefinition
  ffmpegBin?: string
  timeoutMs?: number
}): Promise<MaterializedEditReferenceControlledMediaFixture> {
  const outputRoot = assertSafeOutputRoot(input.outputRoot)
  const fixtureRoot = resolveInsideRoot(outputRoot, input.definition.fixtureId)
  const videoPath = resolveInsideRoot(fixtureRoot, 'fixture.mp4')
  const subtitlePath = resolveInsideRoot(fixtureRoot, 'captions.srt')
  const groundTruthPath = resolveInsideRoot(fixtureRoot, 'ground-truth.json')
  const captionOverlayPaths = input.definition.captionCues.map((_cue, index) =>
    resolveInsideRoot(fixtureRoot, `caption-overlay-${String(index + 1).padStart(2, '0')}.ppm`),
  )
  await mkdir(fixtureRoot, { recursive: true })

  if (
    input.definition.captionCues.length !== input.definition.backgroundColors.length
    || input.definition.captionCues.some((cue, index) => {
      const segmentDuration = input.definition.durationSeconds / input.definition.backgroundColors.length
      const segmentStart = index * segmentDuration
      const segmentEnd = segmentStart + segmentDuration
      return cue.startSeconds < segmentStart || cue.endSeconds > segmentEnd || cue.endSeconds <= cue.startSeconds
    })
  ) {
    throw new Error('Controlled media fixture captions must map one bounded cue to every visual segment.')
  }

  const groundTruth = createGroundTruth(input.definition)
  await Promise.all([
    writeFile(subtitlePath, createSrt(input.definition.captionCues), { encoding: 'utf8', flag: 'wx' }),
    writeFile(groundTruthPath, `${JSON.stringify(groundTruth, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' }),
    ...captionOverlayPaths.map((path, index) =>
      writeFile(path, captionOverlayPpm(input.definition, input.definition.captionCues[index]), { flag: 'wx' }),
    ),
  ])

  const segmentDuration = input.definition.durationSeconds / input.definition.backgroundColors.length
  const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y']
  for (const backgroundColor of input.definition.backgroundColors) {
    args.push(
      '-f',
      'lavfi',
      '-i',
      `color=c=0x${backgroundColor}:s=${input.definition.width}x${input.definition.height}:r=${input.definition.frameRate}:d=${segmentDuration}`,
    )
  }

  const captionOverlayInputStartIndex = input.definition.backgroundColors.length
  for (const captionOverlayPath of captionOverlayPaths) {
    args.push(
      '-loop',
      '1',
      '-framerate',
      String(input.definition.frameRate),
      '-t',
      String(segmentDuration),
      '-i',
      captionOverlayPath,
    )
  }

  const subtitleInputIndex = input.definition.backgroundColors.length + captionOverlayPaths.length
  args.push('-i', subtitlePath)
  const audioInputIndex = input.definition.actualAudioMode === 'silent' ? undefined : subtitleInputIndex + 1
  if (audioInputIndex !== undefined) {
    args.push(
      '-f',
      'lavfi',
      '-i',
      `sine=frequency=${input.definition.audioFrequencyHz ?? 440}:sample_rate=48000:duration=${input.definition.durationSeconds}`,
    )
  }

  const visualFilter = visualFilterForDefinition(input.definition)
  const segmentLabels = input.definition.backgroundColors.map((_, index) => `segment${index}`)
  const filterParts: string[] = []
  for (const [index, cue] of input.definition.captionCues.entries()) {
    const segmentStart = index * segmentDuration
    const localCueStart = cue.startSeconds - segmentStart
    const localCueEnd = cue.endSeconds - segmentStart
    filterParts.push(`[${index}:v]${visualFilter},format=yuv420p[base${index}]`)
    filterParts.push(`[${captionOverlayInputStartIndex + index}:v]format=rgba,colorkey=0x00FF00:0.01:0[caption${index}]`)
    filterParts.push(
      `[base${index}][caption${index}]overlay=enable='between(t,${localCueStart},${localCueEnd})':shortest=1,format=yuv420p[${segmentLabels[index]}]`,
    )
  }
  filterParts.push(
    `${segmentLabels.map((label) => `[${label}]`).join('')}concat=n=${segmentLabels.length}:v=1:a=0[video]`,
  )
  if (audioInputIndex !== undefined) {
    filterParts.push(`[${audioInputIndex}:a]volume=0.05[audio]`)
  }

  args.push('-filter_complex', filterParts.join(';'), '-map', '[video]')
  if (audioInputIndex !== undefined) args.push('-map', '[audio]')
  args.push('-map', `${subtitleInputIndex}:s:0`)
  args.push(
    '-c:v',
    'mpeg4',
    '-q:v',
    '5',
    '-pix_fmt',
    'yuv420p',
    '-c:s',
    'mov_text',
    '-metadata:s:s:0',
    'language=eng',
  )
  if (audioInputIndex !== undefined) args.push('-c:a', 'aac', '-b:a', '64k')
  args.push('-t', String(input.definition.durationSeconds), '-movflags', '+faststart', videoPath)

  await execFileAsync(input.ffmpegBin ?? process.env.FFMPEG_BIN ?? 'ffmpeg', args, {
    timeout: input.timeoutMs ?? 30_000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  })

  const [
    videoStat,
    videoChecksumSha256,
    subtitleChecksumSha256,
    groundTruthChecksumSha256,
    captionOverlayChecksumsSha256,
  ] = await Promise.all([
    stat(videoPath),
    checksumFile(videoPath),
    checksumFile(subtitlePath),
    checksumFile(groundTruthPath),
    Promise.all(captionOverlayPaths.map(checksumFile)),
  ])

  return {
    definition: input.definition,
    videoPath,
    subtitlePath,
    groundTruthPath,
    captionOverlayPaths,
    videoChecksumSha256,
    subtitleChecksumSha256,
    groundTruthChecksumSha256,
    captionOverlayChecksumsSha256,
    videoSizeBytes: videoStat.size,
    groundTruth,
  }
}

export async function materializeAllEditReferenceControlledMediaFixtures(input: {
  outputRoot: string
  ffmpegBin?: string
  timeoutMs?: number
}): Promise<readonly MaterializedEditReferenceControlledMediaFixture[]> {
  const results: MaterializedEditReferenceControlledMediaFixture[] = []
  for (const definition of EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS) {
    results.push(
      await materializeEditReferenceControlledMediaFixture({
        outputRoot: input.outputRoot,
        definition,
        ffmpegBin: input.ffmpegBin,
        timeoutMs: input.timeoutMs,
      }),
    )
  }
  return results
}
