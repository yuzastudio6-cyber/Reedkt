# Activation Container Build Troubleshooting

Phase 20 troubleshooting is for human-run builds only. Codex reads logs and reports blockers; it does not run Docker.

| Failure | Next action |
| --- | --- |
| Docker daemon not running | Start Docker Desktop or the approved Docker runtime, then rerun the human build. |
| Network or image pull timeout | Retry after network recovery; if repeated, mirror or pin the base image through approved infrastructure. |
| npm error | Review package install output and lockfile consistency; do not change dependencies without review. |
| pip error | Check the failing package, Python version, wheels, and source-install review status. |
| apt error | Verify package names and Debian/Ubuntu base image compatibility. |
| No space left on device | Free Docker/cache disk space or move the build to a larger approved machine. |
| Package not found | Confirm package repository availability and whether the dependency is still approved. |
| CUDA base image failure | Verify the CUDA tag, registry access, and L4-first GPU image policy. |
| libvips or Sharp issue | Review native package compatibility between Node, libvips, and the base image. |
| FFmpeg package issue | Review FFmpeg package source and LGPL/commercial verification status. |
| Python package compile failure | Install approved build prerequisites or defer the package until source-install review passes. |
| GPU package source install pending | Keep GPU image deferred until source-install and model/license reviews are complete. |
| Model download attempt | Stop the build and remove the download path; model weights must be mounted later after approval. |
| Secret detected | Stop the build and rotate any exposed credential if real; no secrets belong in Dockerfiles or build logs. |
| Revideo install detected | Remove Revideo from the build path; it remains evaluation-only and not core. |
| gcloud or deploy detected | Stop the process; deployment belongs to later human-run phases. |
