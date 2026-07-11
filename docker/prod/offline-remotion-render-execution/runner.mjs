import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'

import { renderMedia, selectComposition } from '@remotion/renderer'

const require = createRequire(import.meta.url)
const remotionVersion = require('remotion/package.json').version
const rendererVersion = require('@remotion/renderer/package.json').version
const PROTOCOL = 'offline-remotion-render-execution-v1'
const OPERATION = 'tool.remotion.render_approved_composition.v1'
const MAXIMUM_REQUEST_BYTES = 32 * 1024 * 1024
const MAXIMUM_OUTPUT_BYTES = 16 * 1024 * 1024
const FORBIDDEN_TEXT = /(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|[A-Za-z]:[\\/]|(?:^|\s)\/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:\/|\b)|\$\(|`|&&|\|\||#!)/i

const canonical = (value) => JSON.stringify(value, Object.keys(value).sort())
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

function exactObject(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  const actual = Object.keys(value).sort().join('|')
  const expected = [...keys].sort().join('|')
  if (actual !== expected) throw new Error(`${label} contains unsupported fields`)
  return value
}

function safeText(value, maximum, label) {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum || value !== value.trim()) {
    throw new Error(`${label} is invalid`)
  }
  if ([...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || FORBIDDEN_TEXT.test(value)) {
    throw new Error(`${label} is unsafe`)
  }
  return value
}

function oneOf(value, choices, label) {
  if (!choices.includes(value)) throw new Error(`${label} is unsupported`)
  return value
}

function integer(value, minimum, maximum, label) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`${label} is outside bounds`)
  return value
}

function committedBase64(payload, prefix, mimeType, minimumBytes, maximumBytes) {
  const mimeKey = `${prefix}MimeType`
  const lengthKey = `${prefix}ByteLength`
  const shaKey = `${prefix}Sha256`
  const bytesKey = `${prefix}BytesBase64`
  if (
    payload[mimeKey] !== mimeType || !Number.isSafeInteger(payload[lengthKey]) ||
    typeof payload[shaKey] !== 'string' || !/^[a-f0-9]{64}$/.test(payload[shaKey]) ||
    typeof payload[bytesKey] !== 'string'
  ) throw new Error(`${prefix} commitment is invalid`)
  const bytes = Buffer.from(payload[bytesKey], 'base64')
  if (
    bytes.byteLength !== payload[lengthKey] || bytes.byteLength < minimumBytes || bytes.byteLength > maximumBytes ||
    bytes.toString('base64') !== payload[bytesKey] || sha256(bytes) !== payload[shaKey]
  ) throw new Error(`${prefix} bytes do not match commitment`)
  return bytes
}

function validateRequest(value) {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== PROTOCOL || request.toolId !== 'remotion' || request.operationId !== OPERATION) {
    throw new Error('request identity is unsupported')
  }
  const rawPayload = request.payload
  if (rawPayload && typeof rawPayload === 'object' && rawPayload.compositionProfileId === 'approved_source_caption_final_v1') {
    const payload = exactObject(rawPayload, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames', 'sourceFit',
      'panelBackground', 'audioPolicy', 'captionOverlayPolicy',
      'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
      'captionOverlayMimeType', 'captionOverlayByteLength', 'captionOverlaySha256',
      'captionOverlayBytesBase64',
    ], 'final composition payload')
    const dimensions = `${payload.width}x${payload.height}`
    oneOf(dimensions, ['360x640', '640x360', '480x480', '480x600', '720x405', '405x720'], 'approved frame')
    const source = committedBase64(payload, 'source', 'video/mp4', 64, 16 * 1024 * 1024)
    const overlay = committedBase64(payload, 'captionOverlay', 'image/png', 1024, 8 * 1024 * 1024)
    if (source.subarray(4, 8).toString('ascii') !== 'ftyp' || overlay.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw new Error('final composition dependency signature is invalid')
    }
    if (
      payload.sourceFit !== 'contain' || payload.audioPolicy !== 'preserve_source' ||
      payload.captionOverlayPolicy !== 'approved_full_frame_rgba'
    ) throw new Error('final composition policy is unsupported')
    const color = (value, label) => {
      if (typeof value !== 'string' || !/^#[A-Fa-f0-9]{6}$/.test(value)) throw new Error(`${label} is invalid`)
      return value.toUpperCase()
    }
    return {
      schemaVersion: PROTOCOL, toolId: 'remotion', operationId: OPERATION,
      payload: {
        ...payload,
        width: integer(payload.width, 360, 720, 'width'), height: integer(payload.height, 360, 720, 'height'),
        fps: oneOf(payload.fps, [24, 30], 'fps'), durationFrames: integer(payload.durationFrames, 24, 240, 'durationFrames'),
        panelBackground: color(payload.panelBackground, 'panelBackground'),
        sourceBytesBase64: source.toString('base64'), captionOverlayBytesBase64: overlay.toString('base64'),
      },
    }
  }
  const payload = exactObject(rawPayload, [
    'width', 'height', 'fps', 'durationFrames', 'frameTemplateId',
    'panelBackground', 'accentColor', 'title', 'subtitle', 'caption',
  ], 'preview payload')
  const dimensions = `${payload.width}x${payload.height}`
  oneOf(dimensions, ['360x640', '640x360', '480x480', '480x600'], 'approved frame')
  const color = (value, label) => {
    if (typeof value !== 'string' || !/^#[A-Fa-f0-9]{6}$/.test(value)) throw new Error(`${label} is invalid`)
    return value.toUpperCase()
  }
  return {
    schemaVersion: PROTOCOL,
    toolId: 'remotion',
    operationId: OPERATION,
    payload: {
      width: integer(payload.width, 360, 640, 'width'),
      height: integer(payload.height, 360, 640, 'height'),
      fps: oneOf(payload.fps, [24, 30], 'fps'),
      durationFrames: integer(payload.durationFrames, 24, 90, 'durationFrames'),
      frameTemplateId: oneOf(payload.frameTemplateId, ['approved_full_panel_v1', 'approved_lower_panel_v1'], 'frameTemplateId'),
      panelBackground: color(payload.panelBackground, 'panelBackground'),
      accentColor: color(payload.accentColor, 'accentColor'),
      title: safeText(payload.title, 120, 'title'),
      subtitle: safeText(payload.subtitle, 180, 'subtitle'),
      caption: safeText(payload.caption, 140, 'caption'),
    },
  }
}

async function execute(request) {
  if (remotionVersion !== '4.0.487' || rendererVersion !== '4.0.487') throw new Error('Remotion package identity mismatch')
  const requestJson = JSON.stringify(request)
  const outputPath = `/tmp/reeditpro-remotion-${sha256(requestJson).slice(0, 24)}.mp4`
  const browserExecutable = (await readFile('/app/browser-path.txt', 'utf8')).trim()
  if (!browserExecutable.startsWith('/app/node_modules/.remotion/chrome-headless-shell/')) {
    throw new Error('Prepared Remotion browser identity is invalid')
  }
  const finalComposition = request.payload.compositionProfileId === 'approved_source_caption_final_v1'
  const mediaServer = finalComposition
    ? await openPrivateLoopbackMediaServer(
        Buffer.from(request.payload.sourceBytesBase64, 'base64'),
        Buffer.from(request.payload.captionOverlayBytesBase64, 'base64'),
      )
    : null
  const renderPayload = finalComposition
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        width: request.payload.width, height: request.payload.height,
        fps: request.payload.fps, durationFrames: request.payload.durationFrames,
        sourceFit: request.payload.sourceFit, panelBackground: request.payload.panelBackground,
        audioPolicy: request.payload.audioPolicy, captionOverlayPolicy: request.payload.captionOverlayPolicy,
        sourceInternalUrl: `${mediaServer.origin}/source.mp4`,
        captionOverlayInternalUrl: `${mediaServer.origin}/caption.png`,
      }
    : request.payload
  try {
    const composition = await selectComposition({
      serveUrl: '/opt/remotion-bundle',
      id: 'ReeditProApprovedComposition',
      inputProps: renderPayload,
      browserExecutable,
      chromeMode: 'headless-shell',
      logLevel: 'error',
      timeoutInMilliseconds: 30_000,
      mediaCacheSizeInBytes: 32 * 1024 * 1024,
      offthreadVideoCacheSizeInBytes: 32 * 1024 * 1024,
      offthreadVideoThreads: 1,
    })
    if (
      composition.width !== request.payload.width || composition.height !== request.payload.height ||
      composition.fps !== request.payload.fps || composition.durationInFrames !== request.payload.durationFrames
    ) throw new Error('Selected composition metadata diverged from approved frame timing')
    await renderMedia({
      serveUrl: '/opt/remotion-bundle',
      composition,
      inputProps: renderPayload,
      codec: 'h264',
      outputLocation: outputPath,
      browserExecutable,
      chromeMode: 'headless-shell',
      chromiumOptions: { enableMultiProcessOnLinux: true },
      imageFormat: 'jpeg',
      jpegQuality: 80,
      crf: 24,
      x264Preset: 'veryfast',
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      muted: !finalComposition,
      concurrency: 1,
      disallowParallelEncoding: true,
      overwrite: false,
      logLevel: 'error',
      timeoutInMilliseconds: 30_000,
      mediaCacheSizeInBytes: 32 * 1024 * 1024,
      offthreadVideoCacheSizeInBytes: 32 * 1024 * 1024,
      offthreadVideoThreads: 1,
    })
    const bytes = await readFile(outputPath)
    if (bytes.byteLength < 1_024 || bytes.byteLength > MAXIMUM_OUTPUT_BYTES || bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
      throw new Error('Rendered MP4 artifact is invalid or outside bounds')
    }
    return {
      mimeType: 'video/mp4',
      bytesBase64: bytes.toString('base64'),
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      durationFrames: composition.durationInFrames,
      durationSeconds: Number((composition.durationInFrames / composition.fps).toFixed(6)),
    }
  } finally {
    await rm(outputPath, { force: true }).catch(() => undefined)
    await mediaServer?.close()
  }
}

async function openPrivateLoopbackMediaServer(sourceBytes, overlayBytes) {
  const server = createServer((request, response) => {
    if (!request.url || !['GET', 'HEAD'].includes(request.method ?? '')) {
      response.writeHead(405).end()
      return
    }
    if (request.url === '/source.mp4') {
      serveCommittedBytes(request, response, sourceBytes, 'video/mp4')
      return
    }
    if (request.url === '/caption.png') {
      serveCommittedBytes(request, response, overlayBytes, 'image/png')
      return
    }
    response.writeHead(404).end()
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string' || !Number.isSafeInteger(address.port)) {
    server.close()
    throw new Error('private loopback media server identity is invalid')
  }
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}

function serveCommittedBytes(request, response, bytes, contentType) {
  response.setHeader('Accept-Ranges', 'bytes')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Type', contentType)
  const range = request.headers.range
  if (typeof range === 'string') {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range)
    if (!match) {
      response.writeHead(416, { 'Content-Range': `bytes */${bytes.byteLength}` }).end()
      return
    }
    const start = Number(match[1])
    const end = match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= bytes.byteLength) {
      response.writeHead(416, { 'Content-Range': `bytes */${bytes.byteLength}` }).end()
      return
    }
    response.writeHead(206, {
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${bytes.byteLength}`,
    })
    if (request.method === 'HEAD') response.end()
    else response.end(bytes.subarray(start, end + 1))
    return
  }
  response.writeHead(200, { 'Content-Length': bytes.byteLength })
  if (request.method === 'HEAD') response.end()
  else response.end(bytes)
}

const chunks = []
let byteLength = 0
for await (const chunk of process.stdin) {
  byteLength += chunk.byteLength
  if (byteLength > MAXIMUM_REQUEST_BYTES) process.exit(2)
  chunks.push(chunk)
}

try {
  const request = validateRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')))
  const artifact = await execute(request)
  process.stdout.write(JSON.stringify({
    schemaVersion: 'offline-remotion-render-execution-container-v1',
    ok: true,
    toolId: 'remotion',
    operationId: OPERATION,
    status: 'actual_remotion_media_render_completed',
    packageIdentity: { packageName: 'remotion+@remotion/renderer', version: remotionVersion },
    requestEnvelopeSha256: sha256(JSON.stringify(request)),
    artifact,
    semanticEvidence: {
      remotionSelectCompositionExecuted: true,
      remotionRenderMediaExecuted: true,
      approvedFrameAndTimingPreserved: true,
      actualMp4ArtifactProduced: true,
      callerPathsUrlsCodeAndCommandsRejected: true,
      ...(request.payload.compositionProfileId === 'approved_source_caption_final_v1'
        ? {
            approvedSourceBytesVerified: true,
            approvedCaptionOverlayBytesVerified: true,
            sourceAudioPreservationRequested: true,
            finalCompositionProfileExecuted: true,
          }
        : { boundedPreviewCompositionProfileExecuted: true }),
    },
    readiness: { privateInternalOnly: true, productReady: false, externalBetaReady: false, productionReady: false, privateInternalFinalCompositionReady: true },
  }))
} catch (error) {
  void error
  process.stderr.write('Private Remotion execution failed.\n')
  process.stdout.write(JSON.stringify({ ok: false, code: 'EXECUTION_FAILED' }))
  process.exit(3)
}
