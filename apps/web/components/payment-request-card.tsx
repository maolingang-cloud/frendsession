"use client";

import type { PaymentQuote } from "@frendseesion/shared";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

const CAPABILITY_LABELS: Record<string, string> = {
  image_message: "图片消息",
  video_message: "视频消息",
  audio_call: "音频通话",
  video_call: "视频通话"
};

export function PaymentRequestCard({
  quote,
  isGuest,
  onConfirm,
  busy
}: {
  quote: PaymentQuote;
  isGuest: boolean;
  onConfirm?: (quoteId: string) => void;
  busy?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-900">媒体权限支付请求</p>
          <p className="mt-1 text-xs text-emerald-700">
            {quote.durationMinutes} 分钟 / {quote.capabilities.map((item) => CAPABILITY_LABELS[item] ?? item).join(" / ")}
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-900">￥{(quote.amountCents / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-white p-2">
          <QRCodeSVG value={quote.qrPayload} size={86} includeMargin fgColor="#17482f" />
        </div>
      </div>
      <div className="mt-3 text-xs leading-5 text-emerald-800 break-all">{quote.qrPayload}</div>
      <div className="mt-4 flex gap-2">
        <Link
          href={quote.qrPayload}
          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-900"
        >
          打开支付页
        </Link>
        {isGuest ? (
          <button
            type="button"
            disabled={busy || quote.status === "paid"}
            onClick={() => onConfirm?.(quote.id)}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {quote.status === "paid" ? "已支付" : busy ? "处理中..." : "确认模拟支付"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
