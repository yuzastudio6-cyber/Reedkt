import { defaultDemoScenario } from './demo-scenario-index'

export async function loadDemoScenario(id: string) {
  if (id === defaultDemoScenario.id) {
    return defaultDemoScenario
  }

  const module = await import('./demo-scenarios')

  return module.getDemoScenarioById(id) ?? defaultDemoScenario
}
