"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { confirmMockPayment } from "../../../lib/api";

export default function MockPaymentPage() {
  return (
    <Suspense fallback={<MockPaymentFallback />}>
      <MockPaymentClient />
    </Suspense>
  );
}

function MockPaymentFallback() {
  return (
    <main className="page-shell flex items-center justify-center">
      <section className="glass-card w-full max-w-md rounded-[32px] p-6 text-center text-sm text-slate-600">
        正在准备支付页面...
      </section>
    </main>
  );
}

function MockPaymentClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const quoteId = searchParams.get("quoteId");
  const [status, setStatus] = useState("正在准备模拟支付...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!sessionId || !quoteId) {
      setStatus("缺少支付参数，请返回聊天页重新生成支付请求。");
      return;
    }

    setStatus("可以确认本次模拟支付。");
  }, [quoteId, sessionId]);

  return (
    <main className="page-shell flex items-center justify-center">
      <section className="glass-card w-full max-w-md rounded-[32px] p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">模拟支付</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">确认媒体权限解锁</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          本页用于模拟支付确认。确认后，聊天会话会解锁对应媒体能力，并启动付费倒计时。
        </p>
        <div className="mt-6 rounded-[24px] bg-white/85 p-4 text-sm text-slate-600">
          <div>sessionId: {sessionId ?? "-"}</div>
          <div className="mt-2 break-all">quoteId: {quoteId ?? "-"}</div>
        </div>
        <p className="mt-4 text-sm text-slate-600">{status}</p>
        <button
          type="button"
          disabled={!sessionId || !quoteId || done}
          onClick={async () => {
            if (!sessionId || !quoteId) {
              return;
            }
            setStatus("正在处理支付...");
            try {
              await confirmMockPayment({ sessionId, quoteId });
              setDone(true);
              setStatus("支付成功，请返回聊天页使用已解锁功能。");
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "支付失败。");
            }
          }}
          className="mt-6 w-full rounded-2xl bg-[#8dde61] px-4 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {done ? "已完成" : "确认模拟支付"}
        </button>
        {sessionId ? (
          <Link
            href={`/chat/${sessionId}?role=guest`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
          >
            返回聊天
          </Link>
        ) : null}
      </section>
    </main>
  );
}
