import { buildAiGraphicsCrossOwnerCoordinationPacket } from '../tool-registry/ai-graphics-cross-owner-coordination'

const packet = buildAiGraphicsCrossOwnerCoordinationPacket()

console.log(JSON.stringify(packet, null, 2))
