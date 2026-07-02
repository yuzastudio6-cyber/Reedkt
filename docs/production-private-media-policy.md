# Production Private Media Policy

Public buckets are forbidden for source media, proxy media, generated artifacts, previews, and final exports. Persistent signed URLs are not allowed as source of truth.

Workers and APIs should use private storage refs and trusted server-side access. Delivery/share is a separate future policy and must not be inferred from a final export artifact.
