import type {
  StorageClientStatus,
  StorageOperationResult,
  UploadPlan,
  UploadRuntimeMode,
} from '../../types/upload'
import { getSupabaseClient, getSupabaseClientStatus } from '../supabase/supabase-client'

export type UploadFileBody = Blob | ArrayBuffer | Uint8Array | string

function storageMode(configured: boolean): UploadRuntimeMode {
  return configured ? 'supabase_frontend' : 'mock'
}

function notConfiguredResult(message = 'Supabase Storage is not configured.'): StorageOperationResult {
  return {
    ok: false,
    mode: 'mock',
    status: 'not_configured',
    message,
    warnings: ['Storage helpers are in safe not-configured mode; no upload or storage mutation was attempted.'],
  }
}

export function getStorageClientStatus(): StorageClientStatus {
  const status = getSupabaseClientStatus()

  return {
    configured: status.configured,
    mode: storageMode(status.configured),
    status: status.configured ? 'ready' : 'not_configured',
    missingEnvKeys: status.missingEnvKeys,
    message: status.configured
      ? 'Supabase Storage anon client is ready for RLS-limited operations.'
      : 'Supabase public env values are missing; storage remains mock-safe.',
    warnings: status.configured
      ? []
      : ['Add frontend-safe public Supabase env values before live storage operations.'],
  }
}

export async function uploadFileToSupabaseStorage(
  file: UploadFileBody,
  uploadPlan: UploadPlan,
): Promise<StorageOperationResult> {
  const client = getSupabaseClient()

  if (!client) return notConfiguredResult('Supabase Storage upload is not configured.')

  const { error } = await client.storage
    .from(uploadPlan.bucketName)
    .upload(uploadPlan.objectPath, file, {
      cacheControl: '3600',
      contentType: uploadPlan.mimeType,
      upsert: false,
    })

  if (error) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'error',
      bucketName: uploadPlan.bucketName,
      objectPath: uploadPlan.objectPath,
      message: error.message,
      warnings: [
        'Upload failed under the anon client. RLS or bucket policy may require backend signed upload support.',
      ],
    }
  }

  return {
    ok: true,
    mode: 'supabase_frontend',
    status: 'uploaded',
    bucketName: uploadPlan.bucketName,
    objectPath: uploadPlan.objectPath,
    message: 'File uploaded through the frontend-safe Supabase Storage client.',
    warnings: [],
  }
}

export async function createSignedDownloadUrl(
  bucketName: string,
  objectPath: string,
  expiresInSeconds = 60 * 10,
): Promise<StorageOperationResult> {
  const client = getSupabaseClient()

  if (!client) return notConfiguredResult('Supabase signed download URL creation is not configured.')

  const { data, error } = await client.storage
    .from(bucketName)
    .createSignedUrl(objectPath, expiresInSeconds)

  if (error) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'error',
      bucketName,
      objectPath,
      message: error.message,
      warnings: ['Signed URL creation failed; private delivery may need a backend route.'],
    }
  }

  return {
    ok: true,
    mode: 'supabase_frontend',
    status: 'signed_url_ready',
    bucketName,
    objectPath,
    signedUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    message: 'Created a short-lived signed download URL.',
    warnings: [],
  }
}

export function getPublicUrlIfAllowed(
  bucketName: string,
  objectPath: string,
  allowPublicUrl = false,
): StorageOperationResult {
  const client = getSupabaseClient()

  if (!client) return notConfiguredResult('Supabase public URL lookup is not configured.')

  if (!allowPublicUrl) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'blocked',
      bucketName,
      objectPath,
      message: 'Public URLs are disabled by default for ReeditPro private buckets.',
      warnings: ['Use signed URLs or a backend media delivery route for private project assets.'],
    }
  }

  const { data } = client.storage.from(bucketName).getPublicUrl(objectPath)

  return {
    ok: true,
    mode: 'supabase_frontend',
    status: 'public_url_ready',
    bucketName,
    objectPath,
    publicUrl: data.publicUrl,
    message: 'Public URL was created because the caller explicitly allowed it.',
    warnings: ['Only use public URLs for objects and buckets intentionally made public.'],
  }
}

export async function removeStorageObjectMockSafe(
  bucketName: string,
  objectPath: string,
  allowLiveDelete = false,
): Promise<StorageOperationResult> {
  const client = getSupabaseClient()

  if (!client) return notConfiguredResult('Supabase Storage delete is not configured.')

  if (!allowLiveDelete) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'blocked',
      bucketName,
      objectPath,
      message: 'Storage delete is blocked by default in the mock-safe helper.',
      warnings: ['Pass explicit live-delete permission only from reviewed UI or backend code.'],
    }
  }

  const { error } = await client.storage.from(bucketName).remove([objectPath])

  if (error) {
    return {
      ok: false,
      mode: 'supabase_frontend',
      status: 'error',
      bucketName,
      objectPath,
      message: error.message,
      warnings: ['Storage object removal failed under anon-client RLS.'],
    }
  }

  return {
    ok: true,
    mode: 'supabase_frontend',
    status: 'ready',
    bucketName,
    objectPath,
    message: 'Storage object removal completed after explicit live-delete permission.',
    warnings: [],
  }
}
