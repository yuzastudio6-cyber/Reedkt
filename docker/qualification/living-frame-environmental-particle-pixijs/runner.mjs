import {
  createHash,
} from 'node:crypto'
import {
  readFile,
} from 'node:fs/promises'

import {
  chromium,
} from 'playwright'
import {
  PNG,
} from 'pngjs'

const PROTOCOL =
  'living-frame-environmental-particle-pixijs-internal-request-v1'
const CONTAINER_PROTOCOL =
  'living-frame-environmental-particle-pixijs-internal-container-v1'
const OPERATION =
  'tool.pixijs.render_living_frame_environmental_particles.v1'
const MAXIMUM_REQUEST_BYTES = 16 * 1024 * 1024
const MAXIMUM_OUTPUT_BYTES = 256 * 1024 * 1024
const MAXIMUM_FRAME_COUNT = 600
const MAXIMUM_PARTICLES_PER_FRAME = 128
const MAXIMUM_DIMENSION = 8_192
const MAXIMUM_PIXEL_COUNT = 16_777_216
const SHA256 = /^[a-f0-9]{64}$/u
const COLOR_HEX = /^#[A-F0-9]{6}$/u
const SAFE_DIAGNOSTIC_CODES = new Set([
  'ROOT_MISSING',
  'BROWSER_OPERATION_MISSING',
  'FRAME_OUTPUT_INVALID',
  'FRAME_ALPHA_INVALID',
  'PACKAGE_IDENTITY_INVALID',
  'BROWSER_IDENTITY_INVALID',
  'NETWORK_ATTEMPTED',
  'EXECUTION_FAILED',
])

const chunks = []
let requestByteLength = 0
for await (const chunk of process.stdin) {
  requestByteLength += chunk.byteLength
  if (requestByteLength > MAXIMUM_REQUEST_BYTES) {
    process.exit(2)
  }
  chunks.push(chunk)
}

try {
  const request = validateRequest(
    JSON.parse(
      Buffer.concat(chunks).toString('utf8'),
    ),
  )
  const result = await execute(request)
  process.stdout.write(JSON.stringify({
    schemaVersion: CONTAINER_PROTOCOL,
    ok: true,
    status:
      'actual_private_internal_pixijs_particle_sequence_completed',
    toolId: 'pixijs',
    operationId: OPERATION,
    requestDigestSha256:
      request.requestDigestSha256,
    packageIdentity: {
      packageName: 'pixi.js',
      packageVersion: '8.19.0',
      packageEntrypoint: 'Application.init',
    },
    renderIdentity: {
      widthPixels: request.renderCanvas.widthPixels,
      heightPixels:
        request.renderCanvas.heightPixels,
      fps: request.renderCanvas.fps,
      startFrame: request.renderCanvas.startFrame,
      endFrameExclusive:
        request.renderCanvas.endFrameExclusive,
      frameImageCount: result.frames.length,
      logicalBundleCount: 1,
      frameImageContentType: 'image/png',
      alphaMode: 'straight_alpha',
      finalVideoCanvas: false,
    },
    frames: result.frames,
    semanticEvidence: {
      actualPackageEntrypointExecuted: true,
      entrypoint: 'Application.init',
      stageRendered: true,
      transparentCanvasRequested: true,
      exactFrameDimensionsVerified: true,
      rgbaColorTypeVerified: true,
      firstFrameFullyTransparent: true,
      lastFrameFullyTransparent: true,
      activeFrameAlphaVerified: true,
      activeFrameCount: result.activeFrameCount,
      uniqueFrameDigestCount:
        result.uniqueFrameDigestCount,
      zeroNetworkVerified: true,
      oneRequestOneAttemptVerified: true,
      privatePngSequenceProduced: true,
    },
    networkRequestCount: 0,
    readiness: {
      privateInternalQualificationOnly: true,
      operationRegistered: false,
      canonicalDispatchIntegrated: false,
      artifactPersisted: false,
      qaApproved: false,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
  }))
} catch (error) {
  const code = error instanceof Error
    ? [...SAFE_DIAGNOSTIC_CODES].find((candidate) =>
      error.message.includes(candidate))
      ?? 'EXECUTION_FAILED'
    : 'EXECUTION_FAILED'
  process.stderr.write(
    'Living Frame private internal PixiJS qualification failed.\n',
  )
  process.stdout.write(JSON.stringify({
    ok: false,
    code,
  }))
  process.exit(3)
}

async function execute(request) {
  const installed = JSON.parse(
    await readFile(
      '/app/node_modules/pixi.js/package.json',
      'utf8',
    ),
  )
  if (
    installed.name !== 'pixi.js'
    || installed.version !== '8.19.0'
  ) throw new Error('PACKAGE_IDENTITY_INVALID')
  const browserPath = (
    await readFile('/app/browser-path.txt', 'utf8')
  ).trim()
  if (
    !browserPath.startsWith(
      '/app/node_modules/.remotion/chrome-headless-shell/',
    )
  ) throw new Error('BROWSER_IDENTITY_INVALID')
  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader',
    ],
  })
  let networkRequestCount = 0
  try {
    const context = await browser.newContext({
      viewport: {
        width: request.renderCanvas.widthPixels,
        height: request.renderCanvas.heightPixels,
      },
      deviceScaleFactor: 1,
      javaScriptEnabled: true,
      serviceWorkers: 'block',
      acceptDownloads: false,
      hasTouch: false,
      locale: 'en-US',
      timezoneId: 'UTC',
    })
    await context.route('**/*', async (route) => {
      networkRequestCount += 1
      await route.abort('blockedbyclient')
    })
    const page = await context.newPage()
    const bundle = await readFile(
      '/app/living-frame-environmental-particle-browser-operation.bundle.js',
      'utf8',
    )
    await page.setContent(
      `<div id="root"></div><script>${bundle}</script>`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 20_000,
      },
    )
    const operationEvidence =
      await page.evaluate(async (payload) => {
        if (
          !window
            .__reeditproRenderLivingFrameEnvironmentalParticles
        ) {
          throw new Error('BROWSER_OPERATION_MISSING')
        }
        return window
          .__reeditproRenderLivingFrameEnvironmentalParticles(
            payload,
          )
      }, {
        widthPixels: request.renderCanvas.widthPixels,
        heightPixels:
          request.renderCanvas.heightPixels,
        colorHex: request.approvedAppearance.colorHex,
        blendMode:
          request.approvedAppearance.blendMode,
        frameSamples: request.frameSamples,
      })
    if (
      networkRequestCount !== 0
      || operationEvidence.entrypoint !==
        'Application.init'
      || operationEvidence.stageRendered !== true
      || operationEvidence
        .transparentCanvasRequested !== true
      || !Array.isArray(
        operationEvidence.frameDataUrls,
      )
      || operationEvidence.frameDataUrls.length !==
        request.renderCanvas.durationFrames
    ) throw new Error('NETWORK_ATTEMPTED')
    const frames = []
    let activeFrameCount = 0
    let totalOutputBytes = 0
    for (
      const [
        order,
        dataUrl,
      ] of operationEvidence.frameDataUrls.entries()
    ) {
      if (
        typeof dataUrl !== 'string'
        || !dataUrl.startsWith(
          'data:image/png;base64,',
        )
      ) throw new Error('FRAME_OUTPUT_INVALID')
      const bytes = Buffer.from(
        dataUrl.slice(
          'data:image/png;base64,'.length,
        ),
        'base64',
      )
      totalOutputBytes += bytes.byteLength
      if (
        totalOutputBytes > MAXIMUM_OUTPUT_BYTES
        || bytes.byteLength < 45
        || bytes.subarray(0, 8).toString('hex') !==
          '89504e470d0a1a0a'
        || bytes.readUInt32BE(16) !==
          request.renderCanvas.widthPixels
        || bytes.readUInt32BE(20) !==
          request.renderCanvas.heightPixels
        || bytes[25] !== 6
      ) throw new Error('FRAME_OUTPUT_INVALID')
      const decoded = PNG.sync.read(bytes, {
        checkCRC: true,
      })
      if (
        decoded.width !==
          request.renderCanvas.widthPixels
        || decoded.height !==
          request.renderCanvas.heightPixels
        || decoded.data.byteLength !==
          decoded.width * decoded.height * 4
      ) throw new Error('FRAME_OUTPUT_INVALID')
      let nonTransparentPixelCount = 0
      for (
        let pixel = 3;
        pixel < decoded.data.byteLength;
        pixel += 4
      ) {
        if (decoded.data[pixel] > 0) {
          nonTransparentPixelCount += 1
        }
      }
      const expectedActive =
        request.frameSamples[order].particles.length > 0
      if (
        expectedActive
          ? (
            nonTransparentPixelCount < 1
            || nonTransparentPixelCount >=
              decoded.width * decoded.height
          )
          : nonTransparentPixelCount !== 0
      ) throw new Error('FRAME_ALPHA_INVALID')
      if (expectedActive) activeFrameCount += 1
      frames.push({
        order,
        absoluteFrame:
          request.frameSamples[order].absoluteFrame,
        bytesBase64: bytes.toString('base64'),
        byteLength: bytes.byteLength,
        sha256:
          createHash('sha256')
            .update(bytes)
            .digest('hex'),
        nonTransparentPixelCount,
      })
    }
    await context.close()
    if (
      activeFrameCount < 2
      || frames[0].nonTransparentPixelCount !== 0
      || frames.at(-1)
        .nonTransparentPixelCount !== 0
    ) throw new Error('FRAME_ALPHA_INVALID')
    return {
      frames,
      activeFrameCount,
      uniqueFrameDigestCount:
        new Set(frames.map((frame) => frame.sha256))
          .size,
    }
  } finally {
    await browser.close()
  }
}

function validateRequest(value) {
  const request = exact(value, [
    'schemaVersion',
    'requestClass',
    'toolId',
    'operationId',
    'requestDigestSha256',
    'renderCanvas',
    'approvedAppearance',
    'frameSamples',
    'policy',
  ], 'request')
  if (
    request.schemaVersion !== PROTOCOL
    || request.requestClass !==
      'server_derived_private_internal_particle_runtime_request'
    || request.toolId !== 'pixijs'
    || request.operationId !== OPERATION
    || typeof request.requestDigestSha256 !== 'string'
    || !SHA256.test(request.requestDigestSha256)
  ) throw new Error('request identity is unsupported')
  const renderCanvas =
    validateRenderCanvas(request.renderCanvas)
  const approvedAppearance =
    validateAppearance(request.approvedAppearance)
  const frameSamples = validateFrames(
    request.frameSamples,
    renderCanvas,
  )
  const policy = validatePolicy(request.policy)
  const draft = {
    schemaVersion: PROTOCOL,
    requestClass:
      'server_derived_private_internal_particle_runtime_request',
    toolId: 'pixijs',
    operationId: OPERATION,
    renderCanvas,
    approvedAppearance,
    frameSamples,
    policy,
  }
  if (
    request.requestDigestSha256 !==
      sha256Canonical(draft)
  ) throw new Error('request digest is invalid')
  return {
    ...draft,
    requestDigestSha256:
      request.requestDigestSha256,
  }
}

function validateRenderCanvas(value) {
  const canvas = exact(value, [
    'widthPixels',
    'heightPixels',
    'fps',
    'startFrame',
    'endFrameExclusive',
    'durationFrames',
    'backgroundMode',
    'alphaMode',
    'finalVideoCanvas',
  ], 'renderCanvas')
  for (const key of [
    'widthPixels',
    'heightPixels',
    'fps',
    'startFrame',
    'endFrameExclusive',
    'durationFrames',
  ]) integer(canvas[key], key)
  if (
    canvas.widthPixels < 1
    || canvas.heightPixels < 1
    || canvas.widthPixels > MAXIMUM_DIMENSION
    || canvas.heightPixels > MAXIMUM_DIMENSION
    || canvas.widthPixels * canvas.heightPixels >
      MAXIMUM_PIXEL_COUNT
    || canvas.fps < 1
    || canvas.fps > 120
    || canvas.startFrame < 0
    || canvas.endFrameExclusive <= canvas.startFrame
    || canvas.durationFrames !==
      canvas.endFrameExclusive - canvas.startFrame
    || canvas.durationFrames < 2
    || canvas.durationFrames > MAXIMUM_FRAME_COUNT
    || canvas.backgroundMode !== 'transparent'
    || canvas.alphaMode !== 'straight_alpha_png'
    || canvas.finalVideoCanvas !== false
  ) throw new Error('renderCanvas is unsupported')
  return canvas
}

function validateAppearance(value) {
  const appearance = exact(value, [
    'colorHex',
    'blendMode',
  ], 'approvedAppearance')
  if (
    typeof appearance.colorHex !== 'string'
    || !COLOR_HEX.test(appearance.colorHex)
    || !['normal', 'screen', 'multiply']
      .includes(appearance.blendMode)
  ) throw new Error('approvedAppearance is invalid')
  return appearance
}

function validateFrames(value, canvas) {
  if (
    !Array.isArray(value)
    || value.length !== canvas.durationFrames
  ) throw new Error('frameSamples are invalid')
  let activeFrameCount = 0
  const frames = value.map((frameValue, order) => {
    const frame = exact(frameValue, [
      'order',
      'absoluteFrame',
      'particles',
    ], 'frameSample')
    if (
      frame.order !== order
      || frame.absoluteFrame !==
        canvas.startFrame + order
      || !Array.isArray(frame.particles)
      || frame.particles.length >
        MAXIMUM_PARTICLES_PER_FRAME
    ) throw new Error('frameSample is invalid')
    const seen = new Set()
    const particles = frame.particles.map(
      (particleValue) => {
        const particle = exact(particleValue, [
          'order',
          'xNormalized',
          'yNormalized',
          'radiusNormalized',
          'opacity',
        ], 'particle')
        integer(particle.order, 'particle.order')
        if (
          particle.order < 0
          || particle.order >=
            MAXIMUM_PARTICLES_PER_FRAME
          || seen.has(particle.order)
          || !unit(particle.xNormalized)
          || !unit(particle.yNormalized)
          || typeof particle.radiusNormalized !==
            'number'
          || !Number.isFinite(
            particle.radiusNormalized,
          )
          || particle.radiusNormalized <= 0
          || particle.radiusNormalized > 0.25
          || typeof particle.opacity !== 'number'
          || !Number.isFinite(particle.opacity)
          || particle.opacity <= 0
          || particle.opacity > 1
        ) throw new Error('particle is invalid')
        seen.add(particle.order)
        return particle
      },
    )
    if (particles.length > 0) activeFrameCount += 1
    return {
      order,
      absoluteFrame: frame.absoluteFrame,
      particles,
    }
  })
  if (
    frames[0].particles.length !== 0
    || frames.at(-1).particles.length !== 0
    || activeFrameCount < 2
  ) throw new Error('frameSamples endpoints are invalid')
  return frames
}

function validatePolicy(value) {
  const policy = exact(value, [
    'serverOwnedTemplateId',
    'packageName',
    'packageVersion',
    'packageEntrypoint',
    'oneRequestOneAttempt',
    'networkAllowed',
    'callerCodeAllowed',
    'callerAssetsAllowed',
    'arbitrarySaveOrPreviewAllowed',
    'logicalBundleCount',
    'frameImageContentType',
    'remotionOwnsFinalComposition',
    'operationRegistered',
    'dispatchAuthority',
    'artifactAuthority',
    'costAuthority',
    'billingAuthority',
    'productionReady',
  ], 'policy')
  const expected = {
    serverOwnedTemplateId:
      'living_frame_environmental_particles_v1',
    packageName: 'pixi.js',
    packageVersion: '8.19.0',
    packageEntrypoint: 'Application.init',
    oneRequestOneAttempt: true,
    networkAllowed: false,
    callerCodeAllowed: false,
    callerAssetsAllowed: false,
    arbitrarySaveOrPreviewAllowed: false,
    logicalBundleCount: 1,
    frameImageContentType: 'image/png',
    remotionOwnsFinalComposition: true,
    operationRegistered: false,
    dispatchAuthority: false,
    artifactAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    productionReady: false,
  }
  for (const [key, expectedValue] of Object.entries(
    expected,
  )) {
    if (policy[key] !== expectedValue) {
      throw new Error(`policy.${key} is unsupported`)
    }
  }
  return policy
}

function exact(value, keys, label) {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
  ) throw new Error(`${label} must be an object`)
  if (
    Object.keys(value).sort().join('|') !==
      [...keys].sort().join('|')
  ) throw new Error(`${label} contains unsupported fields`)
  return value
}

function integer(value, label) {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be an integer`)
  }
}

function unit(value) {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
}

function sha256Canonical(value) {
  return createHash('sha256')
    .update(canonicalStringify(value))
    .digest('hex')
}

function canonicalStringify(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(',')}]`
  }
  if (typeof value === 'object') {
    return `{${
      Object.keys(value).sort().map((key) =>
        `${JSON.stringify(key)}:${
          canonicalStringify(value[key])
        }`).join(',')
    }}`
  }
  return JSON.stringify(value)
}
