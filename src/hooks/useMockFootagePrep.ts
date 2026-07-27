import { useCallback, useState } from 'react'
import {
  runMockFootagePrep,
  runSourceBoundFootagePrep,
  type MockFootagePrepResult,
  type MockFootagePrepInput,
} from '../lib/footage-prep'

export interface UseMockFootagePrepResult {
  result: MockFootagePrepResult | null
  isRunning: boolean
  runPrep: (input?: MockFootagePrepInput) => MockFootagePrepResult
  runSourceBoundPrep: (input: MockFootagePrepInput) => MockFootagePrepResult
  resetPrep: () => void
}

export interface UseMockFootagePrepOptions {
  initialSourceBoundInput?: MockFootagePrepInput
}

export function useMockFootagePrep(
  options: UseMockFootagePrepOptions = {},
): UseMockFootagePrepResult {
  const [result, setResult] = useState<MockFootagePrepResult | null>(() =>
    options.initialSourceBoundInput
      ? runSourceBoundFootagePrep(options.initialSourceBoundInput)
      : null,
  )

  const runPrep = useCallback((input?: MockFootagePrepInput) => {
    const nextResult = runMockFootagePrep(input)
    setResult(nextResult)

    return nextResult
  }, [])

  const resetPrep = useCallback(() => {
    setResult(null)
  }, [])

  const runSourceBoundPrep = useCallback((input: MockFootagePrepInput) => {
    const nextResult = runSourceBoundFootagePrep(input)
    setResult(nextResult)

    return nextResult
  }, [])

  return {
    result,
    isRunning: false,
    runPrep,
    runSourceBoundPrep,
    resetPrep,
  }
}
