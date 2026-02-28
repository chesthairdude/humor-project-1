"use client";

import { useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";

const API_BASE_URL = "https://api.almostcrackd.ai";
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

function readErrorMessage(payload, fallback) {
  if (payload && typeof payload === "object" && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

function getCaptionText(record) {
  if (typeof record === "string") {
    return record;
  }
  if (!record || typeof record !== "object") {
    return "";
  }

  const candidates = [
    record.content,
    record.caption,
    record.captionContent,
    record.text,
    record.generatedCaption,
  ];

  for (const value of candidates) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return "";
}

export default function UploadPanel() {
  const supabase = useMemo(() => createClient(), []);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState("");
  const [pipelineError, setPipelineError] = useState("");
  const [generatedCaptions, setGeneratedCaptions] = useState([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  async function runCaptionPipeline() {
    if (!selectedFile) {
      setPipelineError("Choose an image before generating captions.");
      return;
    }

    if (!SUPPORTED_IMAGE_TYPES.has(selectedFile.type)) {
      setPipelineError(`Unsupported file type: ${selectedFile.type || "unknown"}`);
      return;
    }

    setIsGeneratingCaptions(true);
    setPipelineError("");
    setPipelineStatus("");
    setGeneratedCaptions([]);
    setUploadedImageUrl("");

    try {
      setPipelineStatus("Getting auth session...");
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message || "Failed to read auth session");
      }

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("No access token available. Please sign in again.");
      }

      setPipelineStatus("Generating upload URL...");
      const presignResponse = await fetch(`${API_BASE_URL}/pipeline/generate-presigned-url`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: selectedFile.type,
        }),
      });

      let presignResult = {};
      try {
        presignResult = await presignResponse.json();
      } catch {
        presignResult = {};
      }

      if (!presignResponse.ok) {
        throw new Error(readErrorMessage(presignResult, "Failed to generate presigned URL"));
      }

      const presignedUrl = presignResult?.presignedUrl;
      const cdnUrl = presignResult?.cdnUrl;
      if (!presignedUrl || !cdnUrl) {
        throw new Error("Presigned URL response is missing required fields.");
      }

      setPipelineStatus("Uploading image bytes...");
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to presigned URL.");
      }

      setPipelineStatus("Registering uploaded image...");
      const registerResponse = await fetch(`${API_BASE_URL}/pipeline/upload-image-from-url`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: cdnUrl,
          isCommonUse: false,
        }),
      });

      let registerResult = {};
      try {
        registerResult = await registerResponse.json();
      } catch {
        registerResult = {};
      }

      if (!registerResponse.ok) {
        throw new Error(readErrorMessage(registerResult, "Failed to register uploaded image"));
      }

      const imageId = registerResult?.imageId;
      if (!imageId) {
        throw new Error("Image registration response is missing imageId.");
      }

      setPipelineStatus("Generating captions...");
      const captionsResponse = await fetch(`${API_BASE_URL}/pipeline/generate-captions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
        }),
      });

      let captionsResult = [];
      try {
        captionsResult = await captionsResponse.json();
      } catch {
        captionsResult = [];
      }

      if (!captionsResponse.ok) {
        throw new Error(readErrorMessage(captionsResult, "Failed to generate captions"));
      }

      const normalizedCaptions = Array.isArray(captionsResult)
        ? captionsResult
        : Array.isArray(captionsResult?.captions)
          ? captionsResult.captions
          : [];

      setUploadedImageUrl(cdnUrl);
      setGeneratedCaptions(normalizedCaptions);
      setPipelineStatus(
        normalizedCaptions.length > 0
          ? `Generated ${normalizedCaptions.length} caption${normalizedCaptions.length === 1 ? "" : "s"}.`
          : "No captions were returned for this image."
      );
    } catch (err) {
      setPipelineStatus("");
      setPipelineError(err.message || "Failed to run caption pipeline");
    } finally {
      setIsGeneratingCaptions(false);
    }
  }

  return (
    <section className="vote-card mx-auto w-full max-w-[400px] p-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Caption Pipeline
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Upload Image And Generate Captions
          </h2>
        </div>

        <div className="space-y-3">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setPipelineError("");
            }}
            className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
          />
          <button
            type="button"
            onClick={runCaptionPipeline}
            disabled={isGeneratingCaptions || !selectedFile}
            className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGeneratingCaptions ? "Generating..." : "Generate Captions"}
          </button>
        </div>

        {pipelineStatus ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            {pipelineStatus}
          </p>
        ) : null}

        {pipelineError ? (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {pipelineError}
          </p>
        ) : null}

        {uploadedImageUrl ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Uploaded Image
            </p>
            <img
              src={uploadedImageUrl}
              alt="Uploaded preview"
              className="max-h-64 w-full rounded-lg border border-slate-200 bg-white object-contain"
            />
          </div>
        ) : null}

        {generatedCaptions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Generated Captions
            </p>
            <ul className="space-y-3">
              {generatedCaptions.map((record, index) => {
                const text = getCaptionText(record);
                return (
                  <li
                    key={record?.id ?? `${index}-${text}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800"
                  >
                    {text || JSON.stringify(record)}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
