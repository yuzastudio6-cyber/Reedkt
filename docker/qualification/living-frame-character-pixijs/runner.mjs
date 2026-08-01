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
  'living-frame-character-pixijs-internal-request-v1'
const CONTAINER_PROTOCOL =
  'living-frame-character-pixijs-internal-container-v1'
const OPERATION =
  'tool.pixijs.render_pixi_scene.v1'
const MAXIMUM_REQUEST_BYTES = 16 * 1024 * 1024
const MAXIMUM_OUTPUT_BYTES = 256 * 1024 * 1024
const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const PNG_PREFIX = 'data:image/png;base64,'

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
      'actual_private_internal_pixijs_character_rigid_cutout_sequence_completed',
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
      widthPixels:
        request.renderCanvas.widthPixels,
      heightPixels:
        request.renderCanvas.heightPixels,
      fps: request.renderCanvas.fps,
      startFrame:
        request.renderCanvas.startFrame,
      endFrameExclusive:
        request.renderCanvas.endFrameExclusive,
      frameImageCount: result.frames.length,
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
      rigidPivotApplied: true,
      exactFrameDimensionsVerified: true,
      rgbaColorTypeVerified: true,
      everyFrameContainsComponentPixels: true,
      sourcePoseRestoredExactly: true,
      temporalVariationPresent: true,
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
} catch {
  process.stderr.write(
    'Living Frame private internal character PixiJS qualification failed.\n',
  )
  process.stdout.write(JSON.stringify({
    ok: false,
    code: 'EXECUTION_FAILED',
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
      '/app/living-frame-character-pixijs-browser-operation.bundle.js',
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
            .__reeditproRenderLivingFrameCharacterRigidCutout
        ) {
          throw new Error('BROWSER_OPERATION_MISSING')
        }
        return window
          .__reeditproRenderLivingFrameCharacterRigidCutout(
            payload,
          )
      }, {
        widthPixels:
          request.renderCanvas.widthPixels,
        heightPixels:
          request.renderCanvas.heightPixels,
        componentPngBase64:
          request.componentAsset.pngBase64,
        componentWidthPixels:
          request.componentAsset.widthPixels,
        componentHeightPixels:
          request.componentAsset.heightPixels,
        componentPivotXPixels:
          request.componentAsset.pivotXPixels,
        componentPivotYPixels:
          request.componentAsset.pivotYPixels,
        frameSamples: request.frameSamples,
      })
    if (
      networkRequestCount !== 0
      || operationEvidence.entrypoint !==
        'Application.init'
      || operationEvidence.stageRendered !== true
      || operationEvidence
        .transparentCanvasRequested !== true
      || operationEvidence
        .rigidPivotApplied !== true
      || !Array.isArray(
        operationEvidence.frameDataUrls,
      )
      || operationEvidence.frameDataUrls.length !==
        request.renderCanvas.durationFrames
    ) throw new Error('BROWSER_OPERATION_INVALID')

    const frames = []
    let totalOutputBytes = 0
    for (
      const [
        order,
        dataUrl,
      ] of operationEvidence.frameDataUrls.entries()
    ) {
      if (
        typeof dataUrl !== 'string'
        || !dataUrl.startsWith(PNG_PREFIX)
      ) throw new Error('FRAME_OUTPUT_INVALID')
      const bytes = Buffer.from(
        dataUrl.slice(PNG_PREFIX.length),
        'base64',
      )
      totalOutputBytes += bytes.byteLength
      if (
        totalOutputBytes > MAXIMUM_OUTPUT_BYTES
        || bytes.byteLength < 67
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
      if (
        nonTransparentPixelCount < 1_000
        || nonTransparentPixelCount >=
          decoded.width * decoded.height
      ) throw new Error('FRAME_ALPHA_INVALID')
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
    const uniqueFrameDigestCount =
      new Set(frames.map((frame) =>
        frame.sha256)).size
    if (
      frames.length !== 120
      || frames[0].sha256 !==
        frames.at(-1).sha256
      || uniqueFrameDigestCount < 8
    ) throw new Error('FRAME_SEQUENCE_INVALID')
    return {
      frames,
      uniqueFrameDigestCount,
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
    'sourceBindings',
    'renderCanvas',
    'componentAsset',
    'protectedRegions',
    'frameSamples',
    'policy',
    'requestDigestSha256',
  ], 'request')
  if (
    request.schemaVersion !== PROTOCOL
    || request.requestClass !==
      'server_derived_private_internal_character_rigid_cutout_request'
    || request.toolId !== 'pixijs'
    || request.operationId !== OPERATION
    || typeof request.requestDigestSha256 !==
      'string'
    || !SHA256.test(
      request.requestDigestSha256,
    )
  ) throw new Error('REQUEST_IDENTITY_INVALID')
  const sourceBindings =
    validateSourceBindings(
      request.sourceBindings,
    )
  const renderCanvas =
    validateRenderCanvas(request.renderCanvas)
  const componentAsset =
    validateComponentAsset(
      request.componentAsset,
      renderCanvas,
    )
  const protectedRegions =
    validateProtectedRegions(
      request.protectedRegions,
    )
  const frameSamples =
    validateFrameSamples(
      request.frameSamples,
      renderCanvas,
    )
  const policy = validatePolicy(request.policy)
  const draft = {
    schemaVersion: PROTOCOL,
    requestClass:
      'server_derived_private_internal_character_rigid_cutout_request',
    toolId: 'pixijs',
    operationId: OPERATION,
    sourceBindings,
    renderCanvas,
    componentAsset,
    protectedRegions,
    frameSamples,
    policy,
  }
  if (
    request.requestDigestSha256 !==
      sha256Canonical(draft)
  ) throw new Error('REQUEST_DIGEST_INVALID')
  return {
    ...draft,
    requestDigestSha256:
      request.requestDigestSha256,
  }
}

function validateSourceBindings(value) {
  const bindings = exact(value, [
    'sceneId',
    'componentId',
    'sourceArtifactId',
    'sourceArtifactDigestSha256',
    'characterAnimationRouteDecisionDigestSha256',
  ], 'sourceBindings')
  if (
    !SAFE_ID.test(bindings.sceneId)
    || !SAFE_ID.test(bindings.componentId)
    || !SAFE_ID.test(
      bindings.sourceArtifactId,
    )
    || !SHA256.test(
      bindings.sourceArtifactDigestSha256,
    )
    || !SHA256.test(
      bindings
        .characterAnimationRouteDecisionDigestSha256,
    )
  ) throw new Error('SOURCE_BINDINGS_INVALID')
  return bindings
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
  const expected = {
    widthPixels: 640,
    heightPixels: 360,
    fps: 30,
    startFrame: 0,
    endFrameExclusive: 120,
    durationFrames: 120,
    backgroundMode: 'transparent',
    alphaMode: 'straight_alpha_png',
    finalVideoCanvas: false,
  }
  exactValues(canvas, expected)
  return canvas
}

function validateComponentAsset(value, canvas) {
  const component = exact(value, [
    'artifactId',
    'contentType',
    'widthPixels',
    'heightPixels',
    'byteLength',
    'sha256',
    'pngBase64',
    'pivotXPixels',
    'pivotYPixels',
  ], 'componentAsset')
  if (
    !SAFE_ID.test(component.artifactId)
    || component.contentType !== 'image/png'
    || component.widthPixels !==
      canvas.widthPixels
    || component.heightPixels !==
      canvas.heightPixels
    || component.pivotXPixels !== 320
    || component.pivotYPixels !== 180
    || !Number.isSafeInteger(
      component.byteLength,
    )
    || component.byteLength < 67
    || component.byteLength >
      8 * 1024 * 1024
    || !SHA256.test(component.sha256)
    || typeof component.pngBase64 !== 'string'
  ) throw new Error('COMPONENT_ASSET_INVALID')
  const bytes = Buffer.from(
    component.pngBase64,
    'base64',
  )
  if (
    bytes.byteLength !== component.byteLength
    || bytes.toString('base64') !==
      component.pngBase64
    || createHash('sha256')
      .update(bytes)
      .digest('hex') !== component.sha256
    || bytes.subarray(0, 8).toString('hex') !==
      '89504e470d0a1a0a'
    || bytes.readUInt32BE(16) !==
      canvas.widthPixels
    || bytes.readUInt32BE(20) !==
      canvas.heightPixels
    || bytes[25] !== 6
  ) throw new Error('COMPONENT_BYTES_INVALID')
  return component
}

function validateProtectedRegions(value) {
  if (
    !Array.isArray(value)
    || value.length !== 1
  ) throw new Error('PROTECTED_REGIONS_INVALID')
  const region = exact(value[0], [
    'regionId',
    'role',
    'x',
    'y',
    'width',
    'height',
  ], 'protectedRegion')
  exactValues(region, {
    regionId: 'musashi.face',
    role: 'face',
    x: 390,
    y: 42,
    width: 86,
    height: 90,
  })
  return [region]
}

function validateFrameSamples(value, canvas) {
  if (
    !Array.isArray(value)
    || value.length !== canvas.durationFrames
  ) throw new Error('FRAME_SAMPLES_INVALID')
  return value.map((candidate, order) => {
    const frame = exact(candidate, [
      'order',
      'absoluteFrame',
      'pivotPositionXPixels',
      'pivotPositionYPixels',
      'rotationDegrees',
      'scale',
      'opacity',
    ], 'frameSample')
    if (
      frame.order !== order
      || frame.absoluteFrame !==
        canvas.startFrame + order
      || frame.pivotPositionXPixels !== 320
      || frame.pivotPositionYPixels !== 180
      || !finiteRange(
        frame.rotationDegrees,
        -1,
        1,
      )
      || frame.scale !== 1
      || frame.opacity !== 1
    ) throw new Error('FRAME_SAMPLE_INVALID')
    return frame
  })
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
    'serverBoundComponentAsset',
    'arbitrarySaveOrPreviewAllowed',
    'generateNewPixels',
    'remotionOwnsFinalComposition',
    'selectedSceneAdmissionAllowed',
    'operationRegistered',
    'dispatchAuthority',
    'artifactAuthority',
    'costAuthority',
    'billingAuthority',
    'productionReady',
  ], 'policy')
  exactValues(policy, {
    serverOwnedTemplateId:
      'living_frame_character_rigid_cutout_v1',
    packageName: 'pixi.js',
    packageVersion: '8.19.0',
    packageEntrypoint: 'Application.init',
    oneRequestOneAttempt: true,
    networkAllowed: false,
    callerCodeAllowed: false,
    callerAssetsAllowed: false,
    serverBoundComponentAsset: true,
    arbitrarySaveOrPreviewAllowed: false,
    generateNewPixels: false,
    remotionOwnsFinalComposition: true,
    selectedSceneAdmissionAllowed:
      true,
    operationRegistered: false,
    dispatchAuthority: false,
    artifactAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    productionReady: false,
  })
  return policy
}

function exactValues(value, expected) {
  for (
    const [
      key,
      expectedValue,
    ] of Object.entries(expected)
  ) {
    if (value[key] !== expectedValue) {
      throw new Error(`${key} is unsupported`)
    }
  }
}

function finiteRange(value, minimum, maximum) {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= minimum
    && value <= maximum
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
