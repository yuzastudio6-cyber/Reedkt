import type { VlmRuntimeOomClassification } from './vlm-runtime-types'

export function classifyVlmRuntimeOom(text: string, enforceEager?: boolean): VlmRuntimeOomClassification {
  const lowered = text.toLowerCase()
  const isCudaOom = lowered.includes('cuda out of memory') || lowered.includes('torch.outofmemoryerror')
  const memoryMatch = text.match(/Tried to allocate ([0-9.]+) GiB\\. GPU 0 has a total capacity of ([0-9.]+) GiB of which ([0-9.]+) GiB is free\\. Process ([0-9]+) has ([0-9.]+) GiB memory in use\\. Of the allocated memory ([0-9.]+) GiB is allocated by PyTorch, and ([0-9.]+) MiB is reserved by PyTorch but unallocated/)
  let stage: VlmRuntimeOomClassification['stage'] = 'not_oom'
  if (isCudaOom) {
    if (lowered.includes('enginecoreclient.make_client') || lowered.includes('wait_for_engine_startup') || lowered.includes('llm = llm(')) stage = 'vllm_engine_initialization'
    else if (lowered.includes('cuda graph') || lowered.includes('cudagraph')) stage = 'cuda_graph_capture'
    else if (lowered.includes('kv') || lowered.includes('profile')) stage = 'scheduler_or_kv_cache_profile'
    else if (lowered.includes('llm.generate')) stage = 'generated_fixture_inference'
    else stage = 'unclassified_cuda_oom'
  }
  if (stage === 'cuda_graph_capture' && enforceEager) stage = 'vllm_engine_initialization'
  const memory = memoryMatch
    ? {
        requestedGiB: Number(memoryMatch[1]),
        gpuTotalGiB: Number(memoryMatch[2]),
        gpuFreeGiB: Number(memoryMatch[3]),
        processId: memoryMatch[4],
        processMemoryGiB: Number(memoryMatch[5]),
        torchAllocatedGiB: Number(memoryMatch[6]),
        torchReservedUnallocatedMiB: Number(memoryMatch[7]),
      }
    : undefined
  return {
    isCudaOom,
    stage,
    enforceEager,
    cudaGraphLikely: isCudaOom && !enforceEager && /cuda graph|cudagraph/i.test(text),
    fixtureInferenceReached: /llm\\.generate|fixtureResults/.test(text),
    memory,
    safeSummary: isCudaOom && memory
      ? `CUDA OOM during ${stage}: requested ${memory.requestedGiB} GiB with ${memory.gpuFreeGiB} GiB free on ${memory.gpuTotalGiB} GiB L4.`
      : isCudaOom
        ? `CUDA OOM during ${stage}; memory counters were not fully parseable.`
        : 'No CUDA OOM signature detected.',
  }
}
