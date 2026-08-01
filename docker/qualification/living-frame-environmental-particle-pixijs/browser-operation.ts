import {
  Application,
  Graphics,
} from 'pixi.js'

interface ParticleSample {
  readonly order: number
  readonly xNormalized: number
  readonly yNormalized: number
  readonly radiusNormalized: number
  readonly opacity: number
}

interface FrameSample {
  readonly order: number
  readonly absoluteFrame: number
  readonly particles: readonly ParticleSample[]
}

interface EnvironmentalParticleBrowserPayload {
  readonly widthPixels: number
  readonly heightPixels: number
  readonly colorHex: string
  readonly blendMode: 'normal' | 'screen' | 'multiply'
  readonly frameSamples: readonly FrameSample[]
}

declare global {
  interface Window {
    __reeditproRenderLivingFrameEnvironmentalParticles?: (
      payload: EnvironmentalParticleBrowserPayload,
    ) => Promise<{
      readonly entrypoint: 'Application.init'
      readonly rendererType: number
      readonly stageRendered: true
      readonly transparentCanvasRequested: true
      readonly frameDataUrls: readonly string[]
    }>
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('ROOT_MISSING')

window.__reeditproRenderLivingFrameEnvironmentalParticles =
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
    const color = Number.parseInt(
      payload.colorHex.slice(1),
      16,
    )
    const frameDataUrls: string[] = []
    for (const frame of payload.frameSamples) {
      const graphics = new Graphics()
      graphics.blendMode = payload.blendMode
      for (const particle of frame.particles) {
        graphics
          .circle(
            particle.xNormalized * payload.widthPixels,
            particle.yNormalized * payload.heightPixels,
            Math.max(
              0.5,
              particle.radiusNormalized
              * Math.min(
                payload.widthPixels,
                payload.heightPixels,
              ),
            ),
          )
          .fill({
            color,
            alpha: particle.opacity,
          })
      }
      app.stage.addChild(graphics)
      app.render()
      await twoAnimationFrames()
      frameDataUrls.push(
        app.canvas.toDataURL('image/png'),
      )
      app.stage.removeChild(graphics)
      graphics.destroy()
    }
    const rendererType = app.renderer.type
    app.destroy(true, {
      children: true,
      texture: true,
      textureSource: true,
    })
    return {
      entrypoint: 'Application.init',
      rendererType,
      stageRendered: true,
      transparentCanvasRequested: true,
      frameDataUrls,
    }
  }

function twoAnimationFrames(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())))
}
