"use client";

import type { ChatSession } from "@frendseesion/shared";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCodeCard } from "../../components/qr-code-card";
import { useSessionSocket } from "../../hooks/use-session-socket";
import { createSession, getSessionSummary } from "../../lib/api";
import { buildChatHref, clearAuth, readAuth } from "../../lib/storage";

const SESSION_STATE_LABELS: Record<string, string> = {
  waiting_for_guest: "等待接收端加入",
  free_text: "免费文字阶段",
  pending_payment: "等待支付",
  paid_media: "付费媒体已启用",
  free_text_return: "已回到免费文字阶段",
  expired: "会话已结束"
};

export default function CreateSessionPage() {
  const router = useRouter();
  const auth = readAuth();
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const participant = useMemo(() => {
    if (!auth || !session) {
      return null;
    }

    return {
      participantId: auth.user.id,
      role: "initiator" as const,
      displayName: session.initiatorDisplayName
    };
  }, [auth, session]);

  useEffect(() => {
    if (!auth) {
      router.replace("/");
      return;
    }

    if (!displayName) {
      setDisplayName(auth.user.displayName);
    }
  }, [auth, displayName, router]);

  useSessionSocket(session?.id, participant, {
    onSessionState: (nextSession) => {
      setSession(nextSession);
      if (nextSession.guest) {
        router.push(buildChatHref(nextSession, "initiator"));
      }
    },
    onRoomJoin: (payload) => {
      const guestJoined = payload.participants.some((item) => item.role === "guest");
      if (guestJoined && session) {
        router.push(buildChatHref(session, "initiator"));
      }
    }
  });

  useEffect(() => {
    if (!session || session.guest) {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const summary = await getSessionSummary(session.id);
        setSession(summary.session);
        if (summary.session.guest) {
          router.push(buildChatHref(summary.session, "initiator"));
        }
      } catch {
        // 忽略轮询错误，继续等待下一次轮询或 socket 推送。
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [router, session]);

  if (!auth) {
    return null;
  }

  return (
    <main className="page-shell mx-auto max-w-xl space-y-4">
      <section className="glass-card rounded-[32px] p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">当前登录手机号：{auth.user.phone}</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">创建聊天会话</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAuth();
              router.replace("/");
            }}
            className="rounded-2xl border border-black/10 px-4 py-2 text-sm text-slate-600"
          >
            退出登录
          </button>
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm text-slate-600">发起方显示名称</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 outline-none"
          />
        </label>

        {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}

        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setStatus("正在生成或恢复会话...");
            try {
              const created = await createSession(auth.token, displayName);
              setSession(created);
              if (created.guest) {
                setStatus("接收端已加入，正在进入聊天界面...");
                router.push(buildChatHref(created, "initiator"));
              } else {
                setStatus("二维码已生成，等待接收端加入。");
              }
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "创建会话失败。");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-6 w-full rounded-2xl bg-[#1a2d22] px-4 py-3 text-sm font-semibold text-white"
        >
          {busy ? "处理中..." : session ? "恢复当前会话" : "创建会话并生成二维码"}
        </button>
      </section>

      {session ? (
        <>
          <QrCodeCard
            title="接收端加入二维码"
            value={session.joinUrl}
            helper="将二维码或链接发给接收端。对方加入后，本页会自动跳转到聊天界面。"
          />

          <section className="glass-card rounded-[28px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">会话状态</h2>
                <p className="mt-1 text-sm text-slate-500">会话 ID：{session.id}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-2 text-xs text-slate-500">
                {SESSION_STATE_LABELS[session.state] ?? session.state}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(session.joinUrl);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  } catch {
                    setStatus("当前浏览器无法复制加入链接。");
                  }
                }}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink"
              >
                {copied ? "已复制" : "复制加入链接"}
              </button>

              <Link
                href={buildChatHref(session, "initiator")}
                className="inline-flex items-center justify-center rounded-2xl bg-[#8dde61] px-4 py-3 text-sm font-semibold text-ink shadow-sm"
              >
                打开发起方聊天页
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
