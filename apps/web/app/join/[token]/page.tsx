"use client";

import type { SessionSummaryResponse } from "@frendseesion/shared";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJoinPreview, joinSession } from "../../../lib/api";
import { buildChatHref, readGuestParticipant, writeGuestParticipant } from "../../../lib/storage";

type JoinPreview = {
  sessionId: string;
  joinToken: string;
  joinUrl: string;
  initiatorDisplayName: string;
  state: string;
  guestJoined: boolean;
};

export default function JoinPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("接收端");
  const [status, setStatus] = useState<string | null>("正在检查加入链接...");
  const [preview, setPreview] = useState<JoinPreview | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = params.token;
    if (!token) {
      return;
    }

    void getJoinPreview(token)
      .then((response) => {
        setPreview(response);

        const savedGuest = readGuestParticipant(response.sessionId);
        if (savedGuest) {
          router.replace(buildChatHref({ id: response.sessionId } as SessionSummaryResponse["session"], "guest"));
          return;
        }

        if (response.state === "expired") {
          setStatus("该会话已结束。");
          return;
        }

        if (response.guestJoined) {
          setStatus("该会话已有接收端连接。");
          return;
        }

        setStatus("二维码链接有效，请填写接收端名称并进入聊天。");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "加入链接无效。");
      });
  }, [params.token, router]);

  return (
    <main className="page-shell flex items-center justify-center">
      <section className="glass-card w-full max-w-md rounded-[32px] p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">扫码加入</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{preview?.initiatorDisplayName ?? "聊天会话"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          接收端进入后默认拥有 3 分钟免费文字聊天时间。支付解锁后，可启用图片消息、视频消息以及实时音视频通话功能。
        </p>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm text-slate-600">接收端显示名称</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 outline-none"
          />
        </label>

        {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}

        <button
          type="button"
          disabled={busy || !preview || preview.guestJoined || preview.state === "expired"}
          onClick={async () => {
            if (!preview) {
              return;
            }

            setBusy(true);
            setStatus("正在进入聊天...");
            try {
              const summary: SessionSummaryResponse = await joinSession(preview.sessionId, displayName.trim() || "接收端");
              if (summary.session.guest) {
                writeGuestParticipant(summary.session.id, summary.session.guest);
              }
              router.push(buildChatHref(summary.session, "guest"));
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "进入聊天失败。");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-6 w-full rounded-2xl bg-[#8dde61] px-4 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {preview?.guestJoined ? "接收端已连接" : preview?.state === "expired" ? "会话已结束" : "进入聊天"}
        </button>
      </section>
    </main>
  );
}
