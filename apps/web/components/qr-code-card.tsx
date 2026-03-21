"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCodeCard({ title, value, helper }: { title: string; value: string; helper?: string }) {
  return (
    <div className="glass-card rounded-[28px] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
        </div>
        <div className="rounded-[24px] bg-white p-3 shadow-sm">
          <QRCodeSVG value={value} size={128} includeMargin bgColor="#ffffff" fgColor="#19231d" />
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-white/90 p-3 text-xs leading-5 text-slate-600 break-all">{value}</div>
    </div>
  );
}
