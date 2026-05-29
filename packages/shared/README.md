# packages/shared

`packages/shared` owns shared pure types and utilities that can be used across web, future desktop, and server code.

## Allowed

- serializable product types
- pure utilities
- validation helpers that do not require platform services
- constants that contain no secrets or private resource identifiers

## Not Allowed

- server secrets
- service-role clients
- model weights
- GCP mutation logic
- provider clients
- browser-specific heavy logic
- desktop runtime hooks
