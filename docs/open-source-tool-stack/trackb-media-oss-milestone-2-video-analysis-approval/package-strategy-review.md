# Package Strategy Review

Selected future strategy: use the existing CPU worker Python requirements path.

Future package names are `opencv-python-headless`, `av`, and `scenedetect`. Central source already declares these in `docker/prod/cpu-worker/requirements.cpu.txt`, and `docker/prod/cpu-worker/Dockerfile` already installs that requirements file.

This phase does not mutate requirements, package-lock, Dockerfiles, or runtime package state. PyAV may rely on library support inside the container in a later execution phase, but this approval does not expand FFmpeg/FFprobe proof or authorize FFmpeg commands.
