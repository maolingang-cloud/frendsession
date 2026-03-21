"use client";

import { useRef, useState } from "react";

export function MessageComposer({
  canImage,
  canVideo,
  disabled,
  borderless,
  onSendText,
  onSendFile
}: {
  canImage: boolean;
  canVideo: boolean;
  disabled?: boolean;
  borderless?: boolean;
  onSendText: (text: string) => Promise<void> | void;
  onSendFile: (file: File, kind: "image" | "video") => Promise<void> | void;
}) {
  const [value, setValue] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className={borderless ? "" : "border-t border-black/5 bg-white/85 px-4 py-3 backdrop-blur"}>
      <div className="flex items-end gap-2">
        <button
          type="button"
          disabled={!canImage || disabled}
          onClick={() => imageInputRef.current?.click()}
          className="h-11 rounded-2xl border border-black/10 px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          图片消息
        </button>
        <button
          type="button"
          disabled={!canVideo || disabled}
          onClick={() => videoInputRef.current?.click()}
          className="h-11 rounded-2xl border border-black/10 px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          视频消息
        </button>
        <textarea
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          placeholder="输入消息"
          className="max-h-28 min-h-[44px] flex-1 resize-none rounded-[22px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
        />
        <button
          type="button"
          disabled={!value.trim() || disabled}
          onClick={async () => {
            const text = value.trim();
            if (!text) {
              return;
            }
            setValue("");
            await onSendText(text);
          }}
          className="h-11 rounded-2xl bg-[#8dde61] px-4 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          发送
        </button>
      </div>

      <input
        ref={imageInputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await onSendFile(file, "image");
            event.target.value = "";
          }
        }}
      />
      <input
        ref={videoInputRef}
        hidden
        type="file"
        accept="video/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await onSendFile(file, "video");
            event.target.value = "";
          }
        }}
      />
    </div>
  );
}
