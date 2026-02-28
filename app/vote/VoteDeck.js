"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const SWIPE_DURATION_MS = 320;

export default function VoteDeck({ initialItems = [] }) {
  const [items, setItems] = useState(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [swipeDirection, setSwipeDirection] = useState(null);
  const isSubmittingRef = useRef(false);

  const current = useMemo(() => items[0] ?? null, [items]);
  const rawCaptionText =
    current?.captionContent === null || current?.captionContent === undefined
      ? ""
      : String(current.captionContent);
  const captionText = rawCaptionText.trim();

  useEffect(() => {
    setSwipeDirection(null);
  }, [current?.captionId]);

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
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <section className="w-full max-w-[380px]">
        {initialItems.length === 0 ? (
          <div className="rounded-[20px] border border-slate-200 bg-white p-6 text-center text-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            No captions available yet.
          </div>
        ) : !current ? (
          <div className="rounded-[20px] border border-emerald-200 bg-white p-6 text-center text-emerald-700 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            You have voted on all available captions.
          </div>
        ) : (
          <>
            <article
              className={`overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out ${
                swipeDirection === "left"
                  ? "-translate-x-[120%] opacity-0"
                  : swipeDirection === "right"
                    ? "translate-x-[120%] opacity-0"
                    : "translate-x-0 opacity-100"
              }`}
            >
              <div className="h-[420px] w-full">
                {current.imageUrl ? (
                  <img
                    src={current.imageUrl}
                    alt="Caption candidate"
                    className="h-[65%] w-full rounded-t-[20px] object-cover"
                  />
                ) : (
                  <div className="flex h-[65%] w-full items-center justify-center rounded-t-[20px] bg-slate-100 text-sm text-slate-500">
                    Missing image
                  </div>
                )}
                <div className="flex h-[35%] items-center justify-center px-5 pb-5 pt-4">
                  <p className="text-center text-[18px] font-semibold leading-snug text-[#333333]">
                    {captionText || `Caption unavailable (${current.captionId})`}
                  </p>
                </div>
              </div>
            </article>

            <div className="mt-8 flex items-center justify-center gap-[60px]">
              <button
                type="button"
                onClick={() => submitVote(-1, "left")}
                disabled={isSubmitting}
                aria-label="Dislike"
                className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#FF4458] bg-white text-3xl font-bold text-[#FF4458] transition-transform duration-200 hover:scale-110 hover:bg-[#FF4458] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => submitVote(1, "right")}
                disabled={isSubmitting}
                aria-label="Like"
                className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#4CAF50] bg-white text-3xl font-bold text-[#4CAF50] transition-transform duration-200 hover:scale-110 hover:bg-[#4CAF50] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                ✓
              </button>
            </div>
          </>
        )}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
