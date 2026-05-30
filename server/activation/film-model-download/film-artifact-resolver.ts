import {
  FILM_EXPECTED_MODEL_FILE_PATHS,
  FILM_GOOGLE_DRIVE_ROOT_FOLDER_ID,
  FILM_SELECTED_ARTIFACT_ROOT,
} from './film-model-download-policy'
import type { FilmDriveEntry, FilmDriveFile, FilmResolvedDriveTree } from './film-model-download-types'

const USER_AGENT = 'Mozilla/5.0 (compatible; ReeditPro Phase38B FILM artifact verifier)'

export async function resolveOfficialFilmDriveTree(): Promise<FilmResolvedDriveTree> {
  const rootEntries = await listPublicDriveFolder(FILM_GOOGLE_DRIVE_ROOT_FOLDER_ID)
  const filmNetFolder = requireFolder(rootEntries, 'film_net')
  const rejectedRootFolders = rootEntries.filter((entry) => entry.kind === 'folder' && entry.name !== 'film_net').map((entry) => entry.name)
  if (rejectedRootFolders.some((name) => name !== 'vgg')) {
    throw new Error(`Official FILM root folder contains unexpected sibling folder(s): ${rejectedRootFolders.join(', ')}`)
  }

  const filmNetEntries = await listPublicDriveFolder(filmNetFolder.id)
  const styleFolder = requireFolder(filmNetEntries, 'Style')
  const rejectedFilmNetFolders = filmNetEntries
    .filter((entry) => entry.kind === 'folder' && entry.name !== 'Style')
    .map((entry) => entry.name)
  const unexpectedFilmNetFolders = rejectedFilmNetFolders.filter((name) => !['L1', 'VGG'].includes(name))
  if (unexpectedFilmNetFolders.length > 0) {
    throw new Error(`Official FILM film_net folder contains unexpected sibling folder(s): ${unexpectedFilmNetFolders.join(', ')}`)
  }

  const styleEntries = await listPublicDriveFolder(styleFolder.id)
  const savedModelFolder = requireFolder(styleEntries, 'saved_model')
  const styleUnexpected = styleEntries.filter((entry) => !(entry.kind === 'folder' && entry.name === 'saved_model'))
  if (styleUnexpected.length > 0) {
    throw new Error(`Official FILM Style folder contains unexpected entries outside saved_model: ${styleUnexpected.map((entry) => entry.name).join(', ')}`)
  }

  const savedModelEntries = await listPublicDriveFolder(savedModelFolder.id)
  const assetsFolder = requireFolder(savedModelEntries, 'assets')
  const variablesFolder = requireFolder(savedModelEntries, 'variables')
  const savedModelFiles = requiredFiles(savedModelEntries, [
    'keras_metadata.pb',
    'saved_model.pb',
  ], `${FILM_SELECTED_ARTIFACT_ROOT}/`)

  const assetsEntries = await listPublicDriveFolder(assetsFolder.id, { allowEmpty: true })
  if (assetsEntries.length > 0) {
    throw new Error(`Official FILM assets folder was expected to be empty but contains: ${assetsEntries.map((entry) => entry.name).join(', ')}`)
  }

  const variablesEntries = await listPublicDriveFolder(variablesFolder.id)
  const variableFiles = requiredFiles(variablesEntries, [
    'variables.data-00000-of-00001',
    'variables.index',
  ], `${FILM_SELECTED_ARTIFACT_ROOT}/variables/`)

  const files = [...savedModelFiles, ...variableFiles].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const expected = [...FILM_EXPECTED_MODEL_FILE_PATHS].sort()
  const actual = files.map((file) => file.relativePath).sort()
  const missing = expected.filter((path) => !actual.includes(path))
  const unexpected = actual.filter((path) => !expected.includes(path as typeof FILM_EXPECTED_MODEL_FILE_PATHS[number]))
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(`Resolved FILM artifact tree mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`)
  }

  return {
    rootFolderId: FILM_GOOGLE_DRIVE_ROOT_FOLDER_ID,
    filmNetFolderId: filmNetFolder.id,
    styleFolderId: styleFolder.id,
    savedModelFolderId: savedModelFolder.id,
    assetsFolderId: assetsFolder.id,
    variablesFolderId: variablesFolder.id,
    files,
    rejectedSiblingFolders: [...rejectedRootFolders, ...rejectedFilmNetFolders].sort(),
    resolvedAt: new Date().toISOString(),
  }
}

export async function listPublicDriveFolder(folderId: string, options: { allowEmpty?: boolean } = {}): Promise<FilmDriveEntry[]> {
  const html = await fetchText(`https://drive.google.com/drive/folders/${folderId}?usp=sharing`)
  const entries: FilmDriveEntry[] = []
  const entryPattern = /data-id="([^"]+)"[^>]*data-tooltip="([^"]+)"/g
  for (const match of html.matchAll(entryPattern)) {
    const id = decodeHtml(match[1])
    const tooltip = decodeHtml(match[2])
    if (tooltip.endsWith(' Shared folder')) {
      entries.push({ id, name: tooltip.replace(/ Shared folder$/, ''), kind: 'folder', sourceFolderId: folderId })
    } else if (tooltip.endsWith(' Binary')) {
      entries.push({ id, name: tooltip.replace(/ Binary$/, ''), kind: 'file', sourceFolderId: folderId })
    }
  }
  if (entries.length === 0 && !options.allowEmpty) {
    throw new Error(`Could not resolve public Google Drive folder ${folderId}; public non-authenticated folder listing may be blocked.`)
  }
  return entries
}

function requireFolder(entries: FilmDriveEntry[], name: string): FilmDriveEntry {
  const folder = entries.find((entry) => entry.kind === 'folder' && entry.name === name)
  if (!folder) throw new Error(`Expected Google Drive folder ${name} was not found.`)
  return folder
}

function requiredFiles(entries: FilmDriveEntry[], names: string[], relativeRoot: string): FilmDriveFile[] {
  const files: FilmDriveFile[] = []
  for (const name of names) {
    const entry = entries.find((candidate) => candidate.kind === 'file' && candidate.name === name)
    if (!entry) throw new Error(`Expected Google Drive file ${relativeRoot}${name} was not found.`)
    files.push({
      fileId: entry.id,
      fileName: name,
      relativePath: `${relativeRoot}${name}`,
      sourceUrl: `https://drive.google.com/uc?export=download&id=${entry.id}`,
    })
  }
  const unexpected = entries.filter((entry) => entry.kind === 'file' && !names.includes(entry.name))
  if (unexpected.length > 0) {
    throw new Error(`Unexpected Google Drive file(s) under ${relativeRoot}: ${unexpected.map((entry) => entry.name).join(', ')}`)
  }
  return files
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } })
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  return response.text()
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}
