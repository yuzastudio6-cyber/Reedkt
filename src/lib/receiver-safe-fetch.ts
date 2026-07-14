/**
 * Resolve the browser/runtime Fetch API without detaching a host method from
 * its global receiver. Chromium rejects an unbound Window.fetch with
 * `Illegal invocation`, while injected transports are already plain callables
 * and must keep their original identity for deterministic tests.
 */
export function resolveReceiverSafeFetch(fetchImpl?: typeof fetch): typeof fetch {
  if (fetchImpl) return fetchImpl

  const runtimeFetch = globalThis.fetch
  if (typeof runtimeFetch !== 'function') {
    throw new Error('The Fetch API is unavailable in this runtime.')
  }

  return runtimeFetch.bind(globalThis)
}
