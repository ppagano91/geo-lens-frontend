import { apiRequest } from "./client";
import type {
  LocalSceneIngestRequest,
  LocalSceneIngestResult,
  UploadSceneIngestRequest,
} from "../types/ingest";

export function ingestLocalScene(
  payload: LocalSceneIngestRequest,
): Promise<LocalSceneIngestResult> {
  return apiRequest<LocalSceneIngestResult>("/api/v1/ingest/local-scene", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function uploadScene(
  payload: UploadSceneIngestRequest,
): Promise<LocalSceneIngestResult> {
  const formData = new FormData();
  for (const file of payload.files) {
    formData.append("files", file);
  }
  formData.append("source", payload.source);
  if (payload.name) {
    formData.append("name", payload.name);
  }
  formData.append("overwrite", payload.overwrite ? "true" : "false");
  if (payload.product_level) {
    formData.append("product_level", payload.product_level);
  }
  if (payload.source_product_id) {
    formData.append("source_product_id", payload.source_product_id);
  }

  return apiRequest<LocalSceneIngestResult>("/api/v1/ingest/upload-scene", {
    method: "POST",
    body: formData,
  });
}
