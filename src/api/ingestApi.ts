import { apiRequest } from "./client";
import type {
  LocalSceneIngestRequest,
  LocalSceneIngestResult,
} from "../types/ingest";

export function ingestLocalScene(
  payload: LocalSceneIngestRequest,
): Promise<LocalSceneIngestResult> {
  return apiRequest<LocalSceneIngestResult>("/api/v1/ingest/local-scene", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
