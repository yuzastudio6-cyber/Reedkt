export function normalizeAppBasePath(value: string | undefined): string {
  const candidate = value?.trim() || '/'
  if (
    !candidate.startsWith('/')
    || candidate.startsWith('//')
    || candidate.includes('\\')
    || candidate.includes('?')
    || candidate.includes('#')
  ) {
    return '/'
  }

  const segments = candidate.split('/').filter(Boolean)
  if (segments.some((segment) => !/^[A-Za-z0-9._~-]+$/.test(segment))) {
    return '/'
  }

  return segments.length === 0 ? '/' : `/${segments.join('/')}/`
}

export function appRouterBasename(value: string | undefined): string {
  const basePath = normalizeAppBasePath(value)
  return basePath === '/' ? '/' : basePath.slice(0, -1)
}
