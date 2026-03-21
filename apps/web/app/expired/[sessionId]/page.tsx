"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { clearGuestParticipant } from "../../../lib/storage";

export default function ExpiredPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    clearGuestParticipant(params.sessionId);
  }, [params.sessionId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          router.replace("/");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <main className="page-shell flex items-center justify-center">
      <section className="glass-card w-full max-w-md rounded-[32px] p-6 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">会话结束</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">本次连接已关闭</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          免费文字倒计时已结束，接收端已从会话 {params.sessionId} 中自动退出，并将在 {secondsLeft} 秒后返回首页。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#1a2d22] px-4 py-3 text-sm font-semibold text-white"
        >
          返回首页
        </Link>
      </section>
    </main>
  );
}
