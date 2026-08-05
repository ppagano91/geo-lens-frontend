import { useCallback, useState } from "react";
import { ingestLocalScene } from "../api/ingestApi";
import {
  DEFAULT_INGEST_FORM,
  type LocalSceneIngestFormValues,
  type LocalSceneIngestResult,
} from "../types/ingest";
import {
  buildLocalSceneIngestPayload,
  formatIngestApiError,
  validateLocalSceneIngestForm,
} from "../utils/ingest";

export function useLocalSceneIngest() {
  const [form, setForm] = useState<LocalSceneIngestFormValues>(DEFAULT_INGEST_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [result, setResult] = useState<LocalSceneIngestResult | null>(null);

  const updateForm = useCallback(
    <K extends keyof LocalSceneIngestFormValues>(
      key: K,
      value: LocalSceneIngestFormValues[K],
    ) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const resetResult = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    setResult(null);
  }, []);

  const ingest = useCallback(async (): Promise<LocalSceneIngestResult | null> => {
    const validationError = validateLocalSceneIngestForm(form);
    if (validationError) {
      setError(validationError);
      setSuccessMessage(null);
      setResult(null);
      return null;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = buildLocalSceneIngestPayload(form);
      const data = await ingestLocalScene(payload);
      setResult(data);

      const overwriteNote = data.overwritten ? " (reemplazó una escena previa)" : "";
      setSuccessMessage(
        `Escena registrada correctamente${overwriteNote}.`,
      );
      return data;
    } catch (err) {
      setResult(null);
      setSuccessMessage(null);
      setError(formatIngestApiError(err));
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  return {
    form,
    updateForm,
    submitting,
    error,
    successMessage,
    result,
    ingest,
    resetResult,
  };
}
