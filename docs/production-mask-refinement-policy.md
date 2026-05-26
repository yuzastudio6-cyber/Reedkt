# Production Mask Refinement Policy

OpenCV and Kornia are refinement candidates for edge cleanup, hole fill, morphology, temporal smoothing metadata, and mask QA support.

M15C may plan refinement, but it must not claim refinement ran unless a controlled local-dev execution actually happens. If OpenCV or Kornia is unavailable, adapters return structured skip reasons.

Video masks require temporal consistency checks before future preview or final render. BiRefNet alone is not treated as enough for professional video masks.
