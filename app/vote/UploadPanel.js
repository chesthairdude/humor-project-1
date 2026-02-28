"use client";

import { useEffect, useMemo, useState } from "react";
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

function toFiveCaptions(records) {
  const source = Array.isArray(records) ? records.slice(0, 5) : [];
  const padded = [...source];
  while (padded.length < 5) {
    padded.push({ id: `placeholder-${padded.length}`, placeholder: true });
  }
  return padded;
}

export default function UploadPanel({ onResultsChange }) {
  const supabase = useMemo(() => createClient(), []);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState("");
  const [pipelineError, setPipelineError] = useState("");
  const [generatedCaptions, setGeneratedCaptions] = useState([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  useEffect(() => {
    if (typeof onResultsChange === "function") {
      onResultsChange(showResults);
    }
  }, [onResultsChange, showResults]);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

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
    setShowResults(false);

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
      setShowResults(true);
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
    <div
      style={{
        width: "100%",
        maxWidth: showResults ? "900px" : "480px",
        transition: "max-width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {showResults ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.65)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              overflow: "hidden",
              animation: "slideInLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            <img
              src={uploadedImageUrl || localPreviewUrl}
              alt="Uploaded"
              style={{ width: "100%", display: "block", borderRadius: "20px" }}
            />
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.65)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              padding: "28px 24px",
              animation: "slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#aaa",
                marginBottom: "16px",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              Generated Captions
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {toFiveCaptions(generatedCaptions).map((record, index) => {
                const text = getCaptionText(record);
                const isPlaceholder = Boolean(record?.placeholder);
                return (
                  <div
                    key={record?.id ?? `${index}-${text}`}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.6)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: isPlaceholder ? "#9ca3af" : "#222",
                      lineHeight: 1.5,
                      animation: `fadeInUp 0.4s ease ${index * 0.07}s both`,
                    }}
                  >
                    {isPlaceholder ? "Waiting for more captions..." : text || JSON.stringify(record)}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowResults(false);
                setSelectedFile(null);
                setGeneratedCaptions([]);
                setUploadedImageUrl("");
                setPipelineError("");
                setPipelineStatus("");
              }}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid rgba(150,150,255,0.3)",
                background: "rgba(255,255,255,0.4)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: "#666",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              ↩ Upload Another
            </button>
          </div>
        </div>
      ) : (
        <section
          style={{
            width: "100%",
            maxWidth: "480px",
            background: "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.65)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.08), 0 32px 64px rgba(0,0,0,0.06)",
            padding: "36px 32px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#aaa",
              marginBottom: "10px",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            Caption Pipeline
          </p>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#111",
              lineHeight: 1.2,
              marginBottom: "28px",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            Upload Image &amp; Generate Captions
          </h1>

          <label
            htmlFor="file-upload"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              height: "120px",
              borderRadius: "16px",
              border: "2px dashed rgba(150, 150, 200, 0.35)",
              background: "rgba(255,255,255,0.3)",
              backdropFilter: "blur(8px)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginBottom: "16px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "2px dashed rgba(100,120,255,0.5)";
              e.currentTarget.style.background = "rgba(255,255,255,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "2px dashed rgba(150,150,200,0.35)";
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
            }}
          >
            <span style={{ fontSize: "28px" }}>🖼️</span>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#888" }}>
              {selectedFile ? selectedFile.name : "Click to choose a file"}
            </span>
            <input
              id="file-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                setPipelineError("");
              }}
            />
          </label>

          <button
            type="button"
            onClick={runCaptionPipeline}
            disabled={isGeneratingCaptions || !selectedFile}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.6)",
              background:
                selectedFile && !isGeneratingCaptions
                  ? "linear-gradient(135deg, rgba(100,120,255,0.85), rgba(140,100,255,0.85))"
                  : "rgba(200,200,210,0.3)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: selectedFile && !isGeneratingCaptions ? "#fff" : "#aaa",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: selectedFile && !isGeneratingCaptions ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow:
                selectedFile && !isGeneratingCaptions
                  ? "0 4px 20px rgba(100,120,255,0.3)"
                  : "none",
            }}
            onMouseEnter={(e) => {
              if (selectedFile && !isGeneratingCaptions) {
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {isGeneratingCaptions ? "Generating..." : "Generate Captions"}
          </button>

          {isGeneratingCaptions ? (
            <div style={{ marginTop: "20px", width: "100%" }}>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#888",
                  marginBottom: "8px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Generating captions...
              </p>
              <div
                style={{
                  position: "relative",
                  height: "10px",
                  width: "100%",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.6)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: "40%",
                    borderRadius: "999px",
                    background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 50%, #4facfe 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s ease-in-out infinite",
                    boxShadow: "0 0 12px rgba(79,172,254,0.6)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "4px",
                    right: "4px",
                    height: "3px",
                    borderRadius: "999px",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                />
              </div>
            </div>
          ) : null}
        </section>
      )}

      {pipelineError ? (
        <p
          style={{
            marginTop: "12px",
            borderRadius: "12px",
            border: "1px solid rgba(252, 165, 165, 0.9)",
            background: "rgba(254, 242, 242, 0.85)",
            padding: "10px 12px",
            fontSize: "13px",
            color: "#b91c1c",
          }}
        >
          {pipelineError}
        </p>
      ) : null}
    </div>
  );
}
