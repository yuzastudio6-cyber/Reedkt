# Production OpenImageIO Execution Policy

OpenImageIO is reserved for image/frame color pipeline support, still asset transforms, and future frame-level color QA.

M15B adds only skip-safe adapter scaffolding. It validates safe frame paths, prepares transform metadata, and skips when the tool or frame evidence is unavailable. It does not install packages, process arbitrary media, or final export.
