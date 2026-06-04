# Phase 44D Web Capability Schema

Schema version: `web-capability-profile-v1`

Required profile fields:

- `schemaVersion`
- `generatedAt`
- `collectionMode`
- `privacyMode`
- `capabilityBuckets`
- `routePlanningHints`
- `blockedReasons`
- `warnings`
- `unsupportedApis`
- `sourcePolicyRefs`

Allowed collection modes are `fixture_mock`, `live_browser_local_only`, and `uploaded_private_future`. Phase 44D uses generated/mock fixtures and defines the local-only browser collector, but live upload remains blocked.

Capability categories are environment, compute, graphics, media, storage, network, and policy. Values are coarse buckets or boolean availability flags. Raw user agent, exact screen resolution, GPU adapter vendor/device identity, IP address, provider credentials, and persistent identifiers are not schema fields.
