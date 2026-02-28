"use client";

import { useState } from "react";
import VoteDeck from "./VoteDeck";
import UploadPanel from "./UploadPanel";

export default function VoteWorkspace({ initialItems = [], userEmail = "" }) {
  const [mode, setMode] = useState("vote");

  return (
    <main className="min-h-screen">
      <aside className="sidebar w-[var(--sidebar-width)] px-3 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">FunnyOrNot</h1>
          {userEmail ? (
            <p className="mt-2 truncate text-xs font-medium uppercase tracking-wide text-slate-400">
              {userEmail}
            </p>
          ) : null}
        </div>

        <nav className="space-y-3">
          <button
            type="button"
            onClick={() => setMode("vote")}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-white/40"
          >
            <span className={`sidebar-icon ${mode === "vote" ? "active" : ""}`}>🗳️</span>
            <span className="hidden text-xs font-medium uppercase tracking-wide text-slate-500 md:inline">
              Voting
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-white/40"
          >
            <span className={`sidebar-icon ${mode === "upload" ? "active" : ""}`}>⬆️</span>
            <span className="hidden text-xs font-medium uppercase tracking-wide text-slate-500 md:inline">
              Uploading
            </span>
          </button>
        </nav>

        <form action="/auth/signout" method="post" className="mt-8">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-white/40"
          >
            <span className="sidebar-icon">↩</span>
            <span className="hidden text-xs font-medium uppercase tracking-wide text-slate-500 md:inline">
              Sign Out
            </span>
          </button>
        </form>
      </aside>

      <section className="main-content">
        <div className="mx-auto w-full max-w-[400px]">
          {mode === "vote" ? <VoteDeck initialItems={initialItems} /> : <UploadPanel />}
        </div>
      </section>
    </main>
  );
}
