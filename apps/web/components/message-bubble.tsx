"use client";

import type { Message, PaymentQuote } from "@frendseesion/shared";
import { PaymentRequestCard } from "./payment-request-card";

export function MessageBubble({
  message,
  quote,
  isOwn,
  isGuest,
  onConfirmQuote,
  busy
}: {
  message: Message;
  quote?: PaymentQuote;
  isOwn: boolean;
  isGuest: boolean;
  onConfirmQuote?: (quoteId: string) => void;
  busy?: boolean;
}) {
  if (message.type === "payment_request" && quote) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[88%]">
          <PaymentRequestCard quote={quote} isGuest={isGuest} onConfirm={onConfirmQuote} busy={busy} />
        </div>
      </div>
    );
  }

  if (message.type === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-black/6 px-3 py-1 text-xs text-slate-500">{message.text}</div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2`}>
      <div
        className={`max-w-[82%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm ${
          isOwn ? "rounded-br-md bg-[#b8f58d] text-ink" : "rounded-bl-md bg-white text-ink"
        }`}
      >
        {message.type === "text" ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
        {message.type === "image" && message.mediaUrl ? (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={message.previewUrl ?? message.mediaUrl} alt="聊天媒体" className="max-h-72 w-full object-cover" />
          </a>
        ) : null}
        {message.type === "video" && message.mediaUrl ? (
          <video controls className="max-h-72 w-full rounded-2xl" src={message.mediaUrl} />
        ) : null}
        <div className="mt-2 text-[11px] text-slate-500">{new Date(message.createdAt).toLocaleTimeString("zh-CN")}</div>
      </div>
    </div>
  );
}
