"use client";

import type { SessionCapability } from "@frendseesion/shared";

const CAPABILITY_LABELS: Array<{ value: Exclude<SessionCapability, "text">; label: string }> = [
  { value: "image_message", label: "图片消息" },
  { value: "video_message", label: "视频消息" },
  { value: "audio_call", label: "音频通话" },
  { value: "video_call", label: "视频通话" }
];

export function ControlPanel({
  selectedCapabilities,
  durationMinutes,
  busy,
  onToggle,
  onDurationChange,
  onCreateQuote
}: {
  selectedCapabilities: SessionCapability[];
  durationMinutes: number;
  busy?: boolean;
  onToggle: (capability: Exclude<SessionCapability, "text">) => void;
  onDurationChange: (minutes: number) => void;
  onCreateQuote: () => Promise<void> | void;
}) {
  return (
    <div className="glass-card rounded-[28px] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">发起方控制栏</h3>
          <p className="mt-1 text-xs text-slate-500">选择媒体能力和时长，为接收端生成支付请求。</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {CAPABILITY_LABELS.map((capability) => {
          const selected = selectedCapabilities.includes(capability.value);
          return (
            <button
              key={capability.value}
              type="button"
              onClick={() => onToggle(capability.value)}
              className={`rounded-2xl border px-3 py-3 text-sm font-medium ${
                selected
                  ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                  : "border-black/10 bg-white/70 text-slate-600"
              }`}
            >
              {capability.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>时长</span>
          <select
            value={durationMinutes}
            onChange={(event) => onDurationChange(Number(event.target.value))}
            className="rounded-2xl border border-black/10 bg-white px-3 py-2 outline-none"
          >
            {[5, 10, 15, 30].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} 分钟
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={busy || selectedCapabilities.length === 0}
          onClick={() => void onCreateQuote()}
          className="rounded-2xl bg-[#1a2d22] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "处理中..." : "生成支付请求"}
        </button>
      </div>
    </div>
  );
}
