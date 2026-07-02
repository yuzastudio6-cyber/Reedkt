# Project Edit Brief API Client

RP-EDITBRIEF-04 adds a browser-safe Project Edit Brief client for future UI work. The client uses the shared `ReeditProApiRequestEnvelope` and `ReeditProApiResponseEnvelope` shapes with the same 35 route IDs as the backend mock registry.

The default client is fixture-backed and browser-local. It does not import backend repositories, route handlers, Supabase/service-role code, provider SDKs, worker modules, FFmpeg/FFprobe/Whisper/OpenCV, or media-processing tools.

Client groups:

- `brief`
- `markers`
- `attachments`
- `markerMessages`
- `intent`
- `confirmations`
- `conflicts`
- `revisions`
- `applicationLogs`
- `exportSettings`
- `timeline`
- `drawer`

All responses include false side-effect flags in the envelope and a full `data.safety` object. The client is mock/local only and is not production persistence.
