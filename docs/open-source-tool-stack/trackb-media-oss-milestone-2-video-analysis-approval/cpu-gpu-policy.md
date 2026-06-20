# CPU/GPU Policy

Milestone 2 is CPU-first. No GPU execution or GPU runtime approval is granted in this phase.

OpenCV may justify a later GPU review for heavy CV, high-volume frame processing, tracking, segmentation, or beta-quality latency. PyAV hardware acceleration is not approved here. PySceneDetect does not require GPU for the first proof; any later acceleration belongs to a separate decode/frame pipeline review.

Future execution must record latency and memory, but slow CPU proof does not automatically enable GPU.
