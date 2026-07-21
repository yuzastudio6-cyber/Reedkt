import type {
  PreferenceDNAConfidenceBand,
  PreferenceDNAEvidenceRef,
  PreferenceDNALayerRecord,
} from '../../types/preference-dna-builder'

export function classifyPreferenceDNAConfidenceBand(confidence: number): PreferenceDNAConfidenceBand {
  if (confidence >= 0.88) return 'very_high'
  if (confidence >= 0.72) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

export function scorePreferenceDNAEvidence(evidenceRef: PreferenceDNAEvidenceRef): number {
  const transferabilityAdjustment = evidenceRef.transferability === 'do_not_copy' ? 0.04 : 0
  const warningAdjustment = Math.min(evidenceRef.warnings.length * 0.01, 0.04)
  return Math.max(0, Math.min(1, evidenceRef.confidence + transferabilityAdjustment - warningAdjustment))
}

export function calculateLayerConfidence(evidenceRefs: PreferenceDNAEvidenceRef[]): number {
  if (!evidenceRefs.length) return 0.35
  const total = evidenceRefs.reduce((sum, evidenceRef) => sum + scorePreferenceDNAEvidence(evidenceRef), 0)
  return Number((total / evidenceRefs.length).toFixed(2))
}

export function calculateOverallDNAConfidence(layers: PreferenceDNALayerRecord[]): number {
  if (!layers.length) return 0
  const weighted = layers.reduce((sum, layer) => {
    const layerWeight = layer.layerId === 'do_not_copy_rules' || layer.layerId === 'qa_confidence' ? 1.25 : 1
    return sum + layer.confidence * layerWeight
  }, 0)
  const totalWeight = layers.reduce((sum, layer) => (
    sum + (layer.layerId === 'do_not_copy_rules' || layer.layerId === 'qa_confidence' ? 1.25 : 1)
  ), 0)
  return Number((weighted / totalWeight).toFixed(2))
}

export function createPreferenceDNAEvidenceScoringSummary(layers: PreferenceDNALayerRecord[]): string {
  const confidence = calculateOverallDNAConfidence(layers)
  return `Overall Preference DNA confidence is ${confidence} (${classifyPreferenceDNAConfidenceBand(confidence)}) across ${layers.length} layer(s).`
}
