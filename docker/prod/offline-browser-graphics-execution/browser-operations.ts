import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core'
import Konva from 'konva'
import lottie from 'lottie-web'
import { Application, Graphics, Text } from 'pixi.js'

type ToolId = 'lottie' | 'pixijs' | 'konva' | 'babylon_js'

declare global {
  interface Window {
    __reeditproExecuteBrowserGraphic?: (toolId: ToolId, payload: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
}

const root = document.getElementById('root')!

window.__reeditproExecuteBrowserGraphic = async (toolId, payload) => {
  root.replaceChildren()
  if (toolId === 'lottie') return renderLottie(payload)
  if (toolId === 'pixijs') return renderPixi(payload)
  if (toolId === 'konva') return renderKonva(payload)
  return renderBabylon(payload)
}

async function renderLottie(payload: Record<string, unknown>) {
  root.style.width = `${payload.width}px`
  root.style.height = `${payload.height}px`
  root.style.background = '#f8fafc'
  const target = document.createElement('div')
  target.style.width = '100%'
  target.style.height = '100%'
  root.append(target)
  const animation = lottie.loadAnimation({
    container: target,
    renderer: 'canvas',
    loop: false,
    autoplay: false,
    animationData: {
      v: '5.12.2', fr: 30, ip: 0, op: 60, w: 640, h: 360, nm: 'Approved ReEditPro motion',
      ddd: 0, assets: [],
      layers: [{
        ddd: 0, ind: 1, ty: 1, nm: 'Approved motion card', sr: 1,
        ks: {
          o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [320, 180, 0] },
          a: { a: 0, k: [210, 95, 0] }, s: { a: 0, k: [100, 100, 100] },
        }, ao: 0, sw: 420, sh: 190, sc: '#4F46E5', ip: 0, op: 60, st: 0, bm: 0,
      }], markers: [],
    },
  })
  await new Promise<void>((resolve) => animation.addEventListener('DOMLoaded', () => resolve()))
  animation.goToAndStop(30, true)
  await twoAnimationFrames()
  const canvas = target.querySelector('canvas')
  const context = canvas?.getContext('2d', { willReadFrequently: true })
  if (!canvas || !context || canvas.width !== 640 || canvas.height !== 360) throw new Error('LOTTIE_CANVAS_MISSING')
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  let renderedPixelCount = 0
  for (let index = 0; index < pixels.length; index += 4) if (pixels[index + 3] > 0) renderedPixelCount += 1
  if (renderedPixelCount < 1_000) throw new Error('LOTTIE_PIXEL_EMPTY')
  return {
    entrypoint: 'lottie.loadAnimation', canvasRendererUsed: true, frameRendered: 30,
    renderedPixelCount, artifactDataUrl: canvas.toDataURL('image/png'),
  }
}

async function renderPixi(payload: Record<string, unknown>) {
  const app = new Application()
  await app.init({ width: Number(payload.width), height: Number(payload.height), background: '#F8FAFC', antialias: true })
  root.append(app.canvas)
  const card = new Graphics().roundRect(110, 80, 420, 200, 28).fill('#4F46E5')
  const dot = new Graphics().circle(180, 180, 34).fill('#FBBF24')
  const label = new Text({ text: 'Approved Pixi scene', style: { fill: '#FFFFFF', fontSize: 28, fontWeight: '700' } })
  label.x = 235
  label.y = 163
  app.stage.addChild(card, dot, label)
  app.render()
  return { entrypoint: 'Application.init', rendererType: app.renderer.type, stageRendered: true }
}

async function renderKonva(payload: Record<string, unknown>) {
  const textTokens = payload.reviewedCopy as Record<string, unknown>
  const container = document.createElement('div')
  root.append(container)
  const stage = new Konva.Stage({ container, width: Number(payload.width), height: Number(payload.height) })
  const layer = new Konva.Layer()
  layer.add(new Konva.Rect({ x: 0, y: 0, width: 640, height: 360, fill: '#F8FAFC' }))
  layer.add(new Konva.Rect({ x: 95, y: 70, width: 450, height: 220, cornerRadius: 30, fill: '#FFFFFF', shadowColor: '#0F172A', shadowBlur: 24, shadowOpacity: 0.15 }))
  layer.add(new Konva.Text({ x: 135, y: 125, width: 370, text: String(textTokens.title), fill: '#111827', fontSize: 32, fontStyle: 'bold', align: 'center' }))
  layer.add(new Konva.Text({ x: 150, y: 195, width: 340, text: String(textTokens.callout), fill: '#4F46E5', fontSize: 21, align: 'center' }))
  stage.add(layer)
  layer.draw()
  const dataUrl = stage.toDataURL({ pixelRatio: 1 })
  return { entrypoint: 'Stage.toDataURL', dataUrlVerified: dataUrl.startsWith('data:image/png;base64,'), stageRendered: true }
}

async function renderBabylon(payload: Record<string, unknown>) {
  let stage = 'BABYLON_ENGINE_FAILED'
  try {
    const canvas = document.createElement('canvas')
    canvas.width = Number(payload.width)
    canvas.height = Number(payload.height)
    root.append(canvas)
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    stage = 'BABYLON_SCENE_FAILED'
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.97, 0.98, 0.99, 1)
    const camera = new ArcRotateCamera('approved-camera', Math.PI / 4, Math.PI / 3, 6, Vector3.Zero(), scene)
    scene.activeCamera = camera
    camera.attachControl(canvas, false)
    new HemisphericLight('approved-light', new Vector3(0, 1, 0), scene).intensity = 1.2
    const box = MeshBuilder.CreateBox('approved-product', { size: 2 }, scene)
    box.rotation.y = Math.PI / 5
    const material = new StandardMaterial('approved-material', scene)
    material.diffuseColor = new Color3(0.31, 0.27, 0.9)
    material.emissiveColor = new Color3(0.08, 0.06, 0.3)
    box.material = material
    stage = 'BABYLON_RENDER_FAILED'
    await scene.whenReadyAsync()
    await new Promise<void>((resolve) => {
      engine.runRenderLoop(() => {
        scene.render()
        engine.stopRenderLoop()
        resolve()
      })
    })
    scene.render()
    await twoAnimationFrames()
    let pixels
    try {
      pixels = await engine.readPixels(0, 0, 640, 360, true, true)
    } catch {
      throw new Error('BABYLON_READBACK_FAILED')
    }
    if (!pixels || pixels.byteLength !== 640 * 360 * 4) throw new Error('BABYLON_READBACK_MISSING')
    const sourcePixels = new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.byteLength)
    let renderedPixelCount = 0
    for (let index = 0; index < sourcePixels.length; index += 4) {
      if (sourcePixels[index] < 220 || sourcePixels[index + 1] < 220 || sourcePixels[index + 2] < 220) renderedPixelCount += 1
    }
    if (renderedPixelCount < 1_000) throw new Error('BABYLON_PIXEL_EMPTY')
    stage = 'BABYLON_OUTPUT_FAILED'
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = 640
    outputCanvas.height = 360
    const outputContext = outputCanvas.getContext('2d')
    if (!outputContext) throw new Error('BABYLON_OUTPUT_CANVAS_MISSING')
    const flippedPixels = new Uint8ClampedArray(sourcePixels.length)
    const rowLength = 640 * 4
    for (let row = 0; row < 360; row += 1) {
      flippedPixels.set(sourcePixels.subarray(row * rowLength, (row + 1) * rowLength), (359 - row) * rowLength)
    }
    try {
      outputContext.putImageData(new ImageData(flippedPixels, 640, 360), 0, 0)
    } catch {
      throw new Error('BABYLON_IMAGE_DATA_FAILED')
    }
    const canvasDataUrl = outputCanvas.toDataURL('image/png')
    return {
      entrypoint: 'Engine.runRenderLoop', sceneRendered: true, meshCount: scene.meshes.length,
      framebufferReadbackVerified: true, framebufferPngLength: canvasDataUrl.length, renderedPixelCount,
      artifactDataUrl: canvasDataUrl,
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('BABYLON_')) throw error
    throw new Error(stage, { cause: error })
  }
}

function twoAnimationFrames() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}
