import {
  Application,
  Sprite,
  Texture,
} from 'pixi.js'

interface CharacterFrameSample {
  readonly order: number
  readonly absoluteFrame: number
  readonly pivotPositionXPixels: number
  readonly pivotPositionYPixels: number
  readonly rotationDegrees: number
  readonly scale: number
  readonly opacity: number
}

interface CharacterRigidCutoutBrowserPayload {
  readonly widthPixels: number
  readonly heightPixels: number
  readonly componentPngBase64: string
  readonly componentWidthPixels: number
  readonly componentHeightPixels: number
  readonly componentPivotXPixels: number
  readonly componentPivotYPixels: number
  readonly frameSamples:
    readonly CharacterFrameSample[]
}

declare global {
  interface Window {
    __reeditproRenderLivingFrameCharacterRigidCutout?: (
      payload: CharacterRigidCutoutBrowserPayload,
    ) => Promise<{
      readonly entrypoint: 'Application.init'
      readonly stageRendered: true
      readonly transparentCanvasRequested: true
      readonly rigidPivotApplied: true
      readonly frameDataUrls: readonly string[]
    }>
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('ROOT_MISSING')

window.__reeditproRenderLivingFrameCharacterRigidCutout =
  async (payload) => {
    root.replaceChildren()
    const app = new Application()
    await app.init({
      width: payload.widthPixels,
      height: payload.heightPixels,
      backgroundAlpha: 0,
      antialias: true,
      autoStart: false,
      sharedTicker: false,
      preference: 'webgl',
      preserveDrawingBuffer: true,
    })
    root.append(app.canvas)

    const sourceImage = new Image()
    sourceImage.src =
      `data:image/png;base64,${payload.componentPngBase64}`
    await sourceImage.decode()
    if (
      sourceImage.naturalWidth !==
        payload.componentWidthPixels
      || sourceImage.naturalHeight !==
        payload.componentHeightPixels
    ) {
      throw new Error('COMPONENT_DIMENSIONS_INVALID')
    }
    const texture = Texture.from(sourceImage)
    const sprite = new Sprite(texture)
    sprite.pivot.set(
      payload.componentPivotXPixels,
      payload.componentPivotYPixels,
    )
    app.stage.addChild(sprite)

    const frameDataUrls: string[] = []
    for (const frame of payload.frameSamples) {
      sprite.position.set(
        frame.pivotPositionXPixels,
        frame.pivotPositionYPixels,
      )
      sprite.rotation =
        frame.rotationDegrees * Math.PI / 180
      sprite.scale.set(frame.scale)
      sprite.alpha = frame.opacity
      app.render()
      await twoAnimationFrames()
      frameDataUrls.push(
        app.canvas.toDataURL('image/png'),
      )
    }
    app.stage.removeChild(sprite)
    sprite.destroy({
      children: true,
      texture: false,
      textureSource: false,
    })
    texture.destroy(true)
    app.destroy(true, {
      children: true,
      texture: true,
      textureSource: true,
    })
    return {
      entrypoint: 'Application.init',
      stageRendered: true,
      transparentCanvasRequested: true,
      rigidPivotApplied: true,
      frameDataUrls,
    }
  }

function twoAnimationFrames(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        resolve())))
}
