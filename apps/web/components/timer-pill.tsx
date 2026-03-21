"use client";

import type { ChatSession } from "@frendseesion/shared";

export function TimerPill({
  state,
  label,
  source
}: {
  state: ChatSession["state"];
  label: string;
  source?: "free" | "paid";
}) {
  const palette =
    source === "paid"
      ? "bg-emerald-500/90 text-white"
      : state === "expired"
        ? "bg-rose-500/90 text-white"
        : "bg-amber-200 text-amber-900";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${palette}`}>
      <span>{source === "paid" ? "付费时长" : "免费时长"}</span>
      <span>{label}</span>
    </div>
  );
}
