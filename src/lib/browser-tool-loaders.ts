import type { OpenSourceToolId } from '../types/reeditpro'

export type BrowserToolLoadStatus =
  | 'not_checked'
  | 'available'
  | 'failed'

export interface BrowserToolInstallCheck {
  toolId: OpenSourceToolId
  label: string
  packageName: string
  status: BrowserToolLoadStatus
  message: string
}

type BrowserToolDefinition = {
  toolId: OpenSourceToolId
  label: string
  packageName: string
  loader: () => Promise<unknown>
}

async function loadBrowserTool<T>(label: string, loader: () => Promise<T>): Promise<T> {
  try {
    return await loader()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${label} lazy import failed: ${message}`, { cause: error })
  }
}

export function loadD3() {
  return loadBrowserTool('D3', () => import('d3'))
}

export function loadECharts() {
  return loadBrowserTool('ECharts', () => import('echarts'))
}

export function loadMapLibre() {
  return loadBrowserTool('MapLibre GL', () => import('maplibre-gl'))
}

export function loadTurf() {
  return loadBrowserTool('Turf', () => import('@turf/turf'))
}

export function loadLottieWeb() {
  return loadBrowserTool('lottie-web', () => import('lottie-web'))
}

const browserToolDefinitions: BrowserToolDefinition[] = [
  { toolId: 'd3', label: 'D3', packageName: 'd3', loader: loadD3 },
  { toolId: 'echarts', label: 'ECharts', packageName: 'echarts', loader: loadECharts },
  { toolId: 'maplibre', label: 'MapLibre GL', packageName: 'maplibre-gl', loader: loadMapLibre },
  { toolId: 'turf', label: 'Turf', packageName: '@turf/turf', loader: loadTurf },
  { toolId: 'lottie', label: 'lottie-web', packageName: 'lottie-web', loader: loadLottieWeb },
]

export async function checkBrowserToolInstallations(): Promise<BrowserToolInstallCheck[]> {
  const checks = await Promise.all(browserToolDefinitions.map(async (tool) => {
    try {
      await tool.loader()
      return {
        toolId: tool.toolId,
        label: tool.label,
        packageName: tool.packageName,
        status: 'available' as const,
        message: `${tool.packageName} lazy import is available. No render, DOM work, or network access was executed.`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        toolId: tool.toolId,
        label: tool.label,
        packageName: tool.packageName,
        status: 'failed' as const,
        message,
      }
    }
  }))

  return checks
}
