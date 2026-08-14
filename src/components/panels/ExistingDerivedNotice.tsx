import type { DerivedAssetRead } from "../../types/derivedAsset";

interface ExistingDerivedNoticeProps {
  existing: Pick<DerivedAssetRead, "id" | "product_key"> | null;
  onViewInResults: () => void;
  regenerateHint?: string;
}

/** Non-blocking notice when a derived product is already catalogued. */
export default function ExistingDerivedNotice({
  existing,
  onViewInResults,
  regenerateHint = "Podés regenerar para sobrescribir el producto.",
}: ExistingDerivedNoticeProps) {
  if (!existing) {
    return null;
  }

  return (
    <div className="results-existing-notice" role="status">
      <p className="aoi-hint" title={regenerateHint}>
        Ya existe <code>{existing.product_key}</code>.
      </p>
      <button
        type="button"
        className="results-link-button"
        onClick={onViewInResults}
      >
        Ver en Resultados
      </button>
    </div>
  );
}
