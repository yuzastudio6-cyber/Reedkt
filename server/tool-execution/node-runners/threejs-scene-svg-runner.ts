import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  EdgesGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three'

import { createOfflineNodeRunnerResult } from './offline-node-runner-artifacts'
import {
  createOfflineNodeRunnerDeadline,
  escapeXml,
  validateThreeSceneInput,
} from './offline-node-runner-security'
import type { OfflineNodeRunnerResult } from './offline-node-runner-types'

export async function runOfflineThreeJsSceneOperation(input: unknown): Promise<OfflineNodeRunnerResult> {
  const deadline = createOfflineNodeRunnerDeadline()
  const request = validateThreeSceneInput(input)
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, request.width / request.height, 0.1, 100)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
  const geometry = new BoxGeometry(2, 2, 2, 1, 1, 1)
  const material = new MeshStandardMaterial({ color: 0x4f6fe8, roughness: 0.6, metalness: 0.1 })
  const cube = new Mesh(geometry, material)
  const ambient = new AmbientLight(0xffffff, 1.2)
  const directional = new DirectionalLight(0xffffff, 2.0)
  directional.position.set(3, 4, 5)
  scene.add(ambient, directional, cube)
  const edges = new EdgesGeometry(geometry, 1)
  const positions = edges.getAttribute('position')
  const sampleFrames = [0, Math.round(request.durationFrames / 2), request.durationFrames]
  const frameGroups = sampleFrames.map((frame, sampleIndex) => {
    const progress = frame / request.durationFrames
    cube.rotation.set(progress * Math.PI * 0.55, progress * Math.PI * 0.8, progress * Math.PI * 0.15)
    scene.updateMatrixWorld(true)
    camera.updateMatrixWorld(true)
    const segments: string[] = []
    for (let index = 0; index < positions.count; index += 2) {
      const from = projectPoint(new Vector3().fromBufferAttribute(positions, index), cube, camera, request)
      const to = projectPoint(new Vector3().fromBufferAttribute(positions, index + 1), cube, camera, request)
      segments.push(`M${from.x} ${from.y}L${to.x} ${to.y}`)
    }
    deadline.assertWithin('Three.js scene world transform and camera projection')
    return `<g data-frame="${frame}" opacity="${[0.28, 0.55, 1][sampleIndex]}"><path d="${segments.join('')}" fill="none" stroke="${['#aeb8dd', '#7f91d8', '#4f6fe8'][sampleIndex]}" stroke-width="${sampleIndex + 1}"/></g>`
  })
  const svg = [
    `<svg width="${request.width}" height="${request.height}" viewBox="0 0 ${request.width} ${request.height}" xmlns="http://www.w3.org/2000/svg" data-reeditpro-library="three.Scene" data-scene-profile="${request.sceneProfileId}">`,
    '<rect width="100%" height="100%" fill="#ffffff"/>',
    `<text x="24" y="32" fill="#17191d" font-size="18" font-weight="700">${escapeXml(request.title)}</text>`,
    `<text x="24" y="52" fill="#646b76" font-size="11">Three.js camera projection · ${request.fps} fps · ${request.durationFrames} frames</text>`,
    ...frameGroups,
    '</svg>',
  ].join('')
  geometry.dispose()
  edges.dispose()
  material.dispose()
  deadline.assertWithin('Three.js SVG scene proof construction')
  return createOfflineNodeRunnerResult({
    toolId: 'three_js',
    packageName: 'three',
    invokedEntrypoints: [
      'three.Scene', 'three.BoxGeometry', 'three.EdgesGeometry',
      'three.PerspectiveCamera', 'three.Vector3.project', 'three.Object3D.updateMatrixWorld',
    ],
    sourceInput: request,
    svg,
    elapsedMilliseconds: deadline.elapsedMilliseconds(),
    normalizedForDeterminism: true,
    expectedWidth: request.width,
    expectedHeight: request.height,
    minimumTextElements: 2,
    minimumPathElements: 3,
    minimumRectElements: 1,
    minimumGroupElements: 3,
  })
}

function projectPoint(
  local: Vector3,
  cube: Mesh,
  camera: PerspectiveCamera,
  request: { width: number; height: number },
): { x: number; y: number } {
  const projected = local.applyMatrix4(cube.matrixWorld).project(camera)
  return {
    x: round((projected.x * 0.5 + 0.5) * request.width),
    y: round((-projected.y * 0.5 + 0.5) * request.height),
  }
}

function round(value: number): number {
  return Number(value.toFixed(6))
}
