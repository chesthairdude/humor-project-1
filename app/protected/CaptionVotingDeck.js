"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";

const SWIPE_DURATION_MS = 280;
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

export default function CaptionVotingDeck({ initialItems = [] }) {
  const [items, setItems] = useState(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [swipeDirection, setSwipeDirection] = useState(null);
  const isSubmittingRef = useRef(false);
  const supabase = useMemo(() => createClient(), []);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState("");
  const [pipelineError, setPipelineError] = useState("");
  const [generatedCaptions, setGeneratedCaptions] = useState([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  const current = useMemo(() => items[0] ?? null, [items]);
  const completedCount = initialItems.length - items.length;
  const rawCaptionText =
    current?.captionContent === null || current?.captionContent === undefined
      ? ""
      : String(current.captionContent);
  const captionText = rawCaptionText.trim();

  useEffect(() => {
    setSwipeDirection(null);
  }, [current?.captionId]);

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

  async function submitVote(voteValue, direction) {
    if (!current || isSubmittingRef.current) {
      return;
    }

    if (!current.captionId || typeof current.captionId !== "string") {
      setItems((previous) => previous.slice(1));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError("");
    setSwipeDirection(direction);

    try {
      await new Promise((resolve) => {
        setTimeout(resolve, SWIPE_DURATION_MS);
      });

      const response = await fetch("/api/caption-votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          captionId: current.captionId,
          voteValue,
        }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        if (
          response.status === 409 &&
          typeof result?.error === "string" &&
          result.error.toLowerCase().includes("already voted")
        ) {
          setItems((previous) => previous.slice(1));
          return;
        }
        if (response.status === 400 || response.status === 404) {
          setItems((previous) => previous.slice(1));
          return;
        }
        setSwipeDirection(null);
        throw new Error(result?.error || "Failed to submit vote");
      }

      setItems((previous) => previous.slice(1));
    } catch (err) {
      setSwipeDirection(null);
      setError(err.message || "Failed to submit vote");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-300/50 sm:p-10">
        <div className="space-y-5">
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">
              Caption Pipeline
            </p>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
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
              <p className="text-sm font-medium text-slate-700">Uploaded Image</p>
              <img
                src={uploadedImageUrl}
                alt="Uploaded preview"
                className="max-h-64 w-full rounded-lg border border-slate-200 bg-white object-contain"
              />
            </div>
          ) : null}

          {generatedCaptions.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
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

      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-300/50 sm:p-10">
        <div className="space-y-5">
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">
              Caption Rating
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Image {completedCount + 1} of {initialItems.length}
            </p>
          </div>

          {initialItems.length === 0 ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-300/50">
              <h2 className="text-2xl font-semibold text-slate-900">No captions available</h2>
              <p className="mt-2 text-slate-600">
                Add captions in the database and refresh to start rating.
              </p>
            </section>
          ) : !current ? (
            <section className="rounded-3xl border border-emerald-300 bg-emerald-50 p-8 text-center shadow-xl shadow-emerald-100">
              <h2 className="text-2xl font-semibold text-emerald-700">All done</h2>
              <p className="mt-2 text-emerald-600">
                You rated all available captions for now.
              </p>
            </section>
          ) : (
            <>
              <div
                className={`mx-auto w-full max-w-xs transition duration-300 ease-out sm:max-w-sm ${
                  swipeDirection === "right"
                    ? "translate-x-[130%] rotate-12 opacity-0"
                    : swipeDirection === "left"
                      ? "-translate-x-[130%] -rotate-12 opacity-0"
                      : "translate-x-0 rotate-0 opacity-100"
                }`}
              >
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.16)]">
                  {current.imageUrl ? (
                    <img
                      src={current.imageUrl}
                      alt="Caption image"
                      className="block max-h-[58vh] w-full rounded-2xl border-4 border-white object-contain shadow-2xl shadow-slate-400/55"
                    />
                  ) : (
                    <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                      Missing image URL
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-center">
                <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                  {captionText || `No text in captions.content (caption id: ${current.captionId})`}
                </h2>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => submitVote(-1, "left")}
                  disabled={isSubmitting}
                  aria-label="Dislike (swipe left)"
                  className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-5xl font-bold text-red-600 shadow-xl shadow-slate-300/70 transition hover:scale-105 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => submitVote(1, "right")}
                  disabled={isSubmitting}
                  aria-label="Like (swipe right)"
                  className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-5xl font-bold text-emerald-600 shadow-xl shadow-slate-300/70 transition hover:scale-105 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  ✓
                </button>
              </div>

              {isSubmitting ? (
                <p className="text-center text-sm text-slate-500">
                  {swipeDirection === "right"
                    ? "Swiping right..."
                    : swipeDirection === "left"
                      ? "Swiping left..."
                      : "Submitting vote..."}
                </p>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
