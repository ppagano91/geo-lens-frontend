import CollapsibleSection from "./CollapsibleSection";

interface MetadataBlockProps {
  title?: string;
  data: unknown;
  defaultOpen?: boolean;
  emptyLabel?: string;
}

function serialize(data: unknown): string {
  if (data == null) {
    return "";
  }
  if (typeof data === "string") {
    return data;
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/** Collapsed-by-default JSON / technical metadata. */
export default function MetadataBlock({
  title = "Metadata avanzada",
  data,
  defaultOpen = false,
  emptyLabel = "Sin metadata.",
}: MetadataBlockProps) {
  const json = serialize(data);
  const isEmpty =
    data == null ||
    json === "" ||
    json === "{}" ||
    json === "[]" ||
    json === "null";

  return (
    <CollapsibleSection title={title} defaultOpen={defaultOpen}>
      {isEmpty ? (
        <p className="aoi-hint">{emptyLabel}</p>
      ) : (
        <pre className="metadata-block-pre">{json}</pre>
      )}
    </CollapsibleSection>
  );
}
