import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '../../Button'
import type {
  EditCueAsset,
  EditCueAssetOption,
} from '../../../types'

type EditCueAssetSelectorProps = {
  selectedAssets: EditCueAsset[]
  assetOptions: EditCueAssetOption[]
  onAddAsset?: (asset: EditCueAsset) => void
  onRemoveAsset?: (mediaAssetId: string) => void
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export function EditCueAssetSelector({
  assetOptions,
  onAddAsset,
  onRemoveAsset,
  selectedAssets,
}: EditCueAssetSelectorProps) {
  const [selectedMediaAssetId, setSelectedMediaAssetId] = useState(assetOptions[0]?.mediaAssetId ?? '')

  function handleAddAsset() {
    const option = assetOptions.find((asset) => asset.mediaAssetId === selectedMediaAssetId)
    if (!option || option.disabled || selectedAssets.some((asset) => asset.mediaAssetId === option.mediaAssetId)) {
      return
    }

    onAddAsset?.({
      id: `${option.mediaAssetId}-cue-asset`,
      mediaAssetId: option.mediaAssetId,
      role: option.role,
      label: option.label,
      required: false,
    })
  }

  return (
    <div className="edit-cue-asset-selector">
      <div className="edit-cue-inline-input">
        <select onChange={(event) => setSelectedMediaAssetId(event.target.value)} value={selectedMediaAssetId}>
          {assetOptions.length === 0 && <option value="">No Source Library assets</option>}
          {assetOptions.map((option) => (
            <option disabled={option.disabled} key={option.mediaAssetId} value={option.mediaAssetId}>
              {option.label} - {formatLabel(option.role)}{option.reason ? ` (${option.reason})` : ''}
            </option>
          ))}
        </select>
        <Button disabled={!selectedMediaAssetId} icon={Plus} onClick={handleAddAsset} size="sm" variant="secondary">
          Add asset
        </Button>
      </div>

      <div className="edit-cue-selected-assets">
        {selectedAssets.map((asset) => (
          <button className="edit-cue-asset-chip" key={asset.mediaAssetId} onClick={() => onRemoveAsset?.(asset.mediaAssetId)} type="button">
            <span>{asset.label ?? asset.mediaAssetId}</span>
            <X aria-hidden="true" size={14} />
          </button>
        ))}
      </div>
    </div>
  )
}
