import { useCallback, useState } from 'react'
import {
  runMockFootagePrep,
  type MockFootagePrepResult,
  type MockFootagePrepInput,
} from '../lib/footage-prep'

export interface UseMockFootagePrepResult {
  result: MockFootagePrepResult | null
  isRunning: boolean
  runPrep: (input?: MockFootagePrepInput) => MockFootagePrepResult
  resetPrep: () => void
}

export function useMockFootagePrep(): UseMockFootagePrepResult {
  const [result, setResult] = useState<MockFootagePrepResult | null>(null)

  const runPrep = useCallback((input?: MockFootagePrepInput) => {
    const nextResult = runMockFootagePrep(input)
    setResult(nextResult)

    return nextResult
  }, [])

  const resetPrep = useCallback(() => {
    setResult(null)
  }, [])

  return {
    result,
    isRunning: false,
    runPrep,
    resetPrep,
  }
}
