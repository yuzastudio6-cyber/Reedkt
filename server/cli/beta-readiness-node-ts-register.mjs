import { registerHooks } from 'node:module'

const EXTENSION_CANDIDATES = ['.ts', '.tsx', '.mjs', '.js']
const INDEX_CANDIDATES = ['/index.ts', '/index.tsx', '/index.mjs', '/index.js']

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (!isResolvableMissingModuleError(error) || !shouldTryTypeScriptResolution(specifier)) {
        throw error
      }

      for (const candidate of candidateSpecifiers(specifier)) {
        try {
          return nextResolve(candidate, context)
        } catch (candidateError) {
          if (!isResolvableMissingModuleError(candidateError)) {
            throw candidateError
          }
        }
      }

      throw error
    }
  },
})

function isResolvableMissingModuleError(error) {
  return error?.code === 'ERR_MODULE_NOT_FOUND' || error?.code === 'ERR_UNSUPPORTED_DIR_IMPORT'
}

function shouldTryTypeScriptResolution(specifier) {
  if (specifier.startsWith('node:')) return false
  if (specifier.startsWith('data:')) return false
  if (specifier.startsWith('http:') || specifier.startsWith('https:')) return false

  const pathPart = specifier.startsWith('file:')
    ? new URL(specifier).pathname
    : specifier.split(/[?#]/, 1)[0] ?? specifier

  if (!specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('file:')) {
    return false
  }

  return !/\.[cm]?[jt]sx?$/.test(pathPart)
}

function candidateSpecifiers(specifier) {
  if (specifier.startsWith('file:')) {
    const url = new URL(specifier)
    return [
      ...EXTENSION_CANDIDATES.map((extension) => withFileUrlSuffix(url, extension)),
      ...INDEX_CANDIDATES.map((suffix) => withFileUrlSuffix(url, suffix)),
    ]
  }

  return [
    ...EXTENSION_CANDIDATES.map((extension) => `${specifier}${extension}`),
    ...INDEX_CANDIDATES.map((suffix) => `${specifier}${suffix}`),
  ]
}

function withFileUrlSuffix(url, suffix) {
  const nextUrl = new URL(url.href)
  nextUrl.pathname = `${nextUrl.pathname}${suffix}`
  return nextUrl.href
}
