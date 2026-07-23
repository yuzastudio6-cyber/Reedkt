const INTERNAL_DETAIL_PATTERN = /(?:https?:\/\/|\/v\d+\/|approvedSnapshotId|contentDigest|signedUrl|provider|backend|database|supabase|gcs|cloud run|^[A-Z][A-Z0-9_]{2,}$)/iu

export function safeMotionStudioResourceMessage(
  message: string | undefined,
  fallback: string,
): string {
  if (!message || INTERNAL_DETAIL_PATTERN.test(message)) return fallback
  return message
}
