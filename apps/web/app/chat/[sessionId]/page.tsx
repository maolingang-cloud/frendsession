"use client";

import type { Message, SessionCapability, SessionSummaryResponse } from "@frendseesion/shared";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ControlPanel } from "../../../components/control-panel";
import { MessageBubble } from "../../../components/message-bubble";
import { MessageComposer } from "../../../components/message-composer";
import { QrCodeCard } from "../../../components/qr-code-card";
import { TimerPill } from "../../../components/timer-pill";
import { WebRtcPanel } from "../../../components/webrtc-panel";
import { useCountdown } from "../../../hooks/use-countdown";
import { useSessionSocket } from "../../../hooks/use-session-socket";
import { useWebRtcRoom } from "../../../hooks/use-webrtc-room";
import {
  confirmMockPayment,
  createMessage,
  createPaymentQuote,
  getSessionSummary,
  signUpload
} from "../../../lib/api";
import { readAuth, readGuestParticipant } from "../../../lib/storage";

type Presence = {
  participantId: string;
  role: "initiator" | "guest";
  displayName: string;
};

const CAPABILITY_LABELS: Record<SessionCapability, string> = {
  text: "文字聊天",
  image_message: "图片消息",
  video_message: "视频消息",
  audio_call: "音频通话",
  video_call: "视频通话"
};

const SESSION_STATE_LABELS: Record<string, string> = {
  waiting_for_guest: "等待接收端加入",
  free_text: "免费文字阶段",
  pending_payment: "等待支付",
  paid_media: "付费媒体已启用",
  free_text_return: "已回到免费文字阶段",
  expired: "会话已结束"
};

const ROLE_LABELS: Record<Presence["role"], string> = {
  initiator: "发起方",
  guest: "接收端"
};

export default function ChatPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "guest" ? "guest" : "initiator";
  const auth = readAuth();
  const guest = role === "guest" && sessionId ? readGuestParticipant(sessionId) : null;

  const [summary, setSummary] = useState<SessionSummaryResponse | null>(null);
  const [status, setStatus] = useState<string | null>("正在加载会话...");
  const [participants, setParticipants] = useState<Presence[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<SessionCapability[]>(["video_call"]);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [paymentBusyId, setPaymentBusyId] = useState<string | null>(null);
  const [messageBusy, setMessageBusy] = useState(false);
  const [activePanel, setActivePanel] = useState<"session" | "controls" | "webrtc" | null>(null);

  const loadSummary = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    try {
      const nextSummary = await getSessionSummary(sessionId);
      setSummary(nextSummary);
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "加载会话失败。");
    }
  }, [sessionId]);

  useEffect(() => {
    if (role === "initiator" && !auth) {
      router.replace("/");
      return;
    }

    if (role === "guest" && !guest) {
      setStatus("当前设备上未找到接收端身份，请重新扫码进入。");
      return;
    }

    void loadSummary();
  }, [auth, guest, loadSummary, role, router]);

  const participant = useMemo(() => {
    if (!summary) {
      return null;
    }

    if (role === "initiator" && auth) {
      return {
        participantId: auth.user.id,
        role: "initiator" as const,
        displayName: summary.session.initiatorDisplayName
      };
    }

    if (role === "guest" && guest) {
      return {
        participantId: guest.id,
        role: "guest" as const,
        displayName: guest.displayName
      };
    }

    return null;
  }, [auth, guest, role, summary]);

  const remoteParticipantId = participants.find((item) => item.participantId !== participant?.participantId)?.participantId;

  const webrtcHandlersRef = useRef<{
    handleOffer: (payload: Parameters<ReturnType<typeof useWebRtcRoom>["handleOffer"]>[0]) => Promise<void>;
    handleAnswer: (payload: Parameters<ReturnType<typeof useWebRtcRoom>["handleAnswer"]>[0]) => Promise<void>;
    handleIce: (payload: Parameters<ReturnType<typeof useWebRtcRoom>["handleIce"]>[0]) => Promise<void>;
  }>({
    handleOffer: async () => undefined,
    handleAnswer: async () => undefined,
    handleIce: async () => undefined
  });

  const socketRef = useSessionSocket(sessionId, participant, {
    onSessionState: (session) =>
      setSummary((current) => (current ? { ...current, session } : { session, messages: [], quotes: [] })),
    onTimerUpdate: (grant) =>
      setSummary((current) =>
        current
          ? {
              ...current,
              session: {
                ...current.session,
                currentWindow: {
                  kind: grant.source,
                  startsAt: grant.startsAt,
                  endsAt: grant.endsAt
                }
              }
            }
          : current
      ),
    onCapabilityUpdate: (grant) =>
      setSummary((current) =>
        current
          ? {
              ...current,
              session: {
                ...current.session,
                enabledCapabilities: grant.enabled
              }
            }
          : current
      ),
    onMessage: (message) =>
      setSummary((current) =>
        current && !current.messages.some((item) => item.id === message.id)
          ? { ...current, messages: [...current.messages, message] }
          : current
      ),
    onPaymentCreated: (quote) =>
      setSummary((current) =>
        current && !current.quotes.some((item) => item.id === quote.id)
          ? { ...current, quotes: [...current.quotes, quote] }
          : current
      ),
    onPaymentConfirmed: async () => {
      await loadSummary();
    },
    onRoomJoin: (payload) =>
      setParticipants(
        payload.participants.map((item) => ({
          participantId: item.participantId,
          role: item.role,
          displayName: item.displayName
        }))
      ),
    onRoomLeft: (payload) =>
      setParticipants(
        payload.participants.map((item) => ({
          participantId: item.participantId,
          role: item.role,
          displayName: item.displayName
        }))
      ),
    onOffer: async (payload) => {
      await webrtcHandlersRef.current.handleOffer(payload);
    },
    onAnswer: async (payload) => {
      await webrtcHandlersRef.current.handleAnswer(payload);
    },
    onIce: async (payload) => {
      await webrtcHandlersRef.current.handleIce(payload);
    }
  });

  const webrtc = useWebRtcRoom({
    sessionId,
    participantId: participant?.participantId,
    remoteParticipantId,
    socketRef
  });

  webrtcHandlersRef.current = {
    handleOffer: webrtc.handleOffer,
    handleAnswer: webrtc.handleAnswer,
    handleIce: webrtc.handleIce
  };

  const timer = useCountdown(summary?.session.currentWindow?.endsAt ?? null);
  const enabledCapabilities = summary?.session.enabledCapabilities ?? [];

  useEffect(() => {
    if (summary?.session.state === "expired") {
      webrtc.endCall();
    }

    if (summary?.session.state === "expired" && role === "guest") {
      router.replace(`/expired/${sessionId}`);
    }
  }, [role, router, sessionId, summary?.session.state, webrtc.endCall]);

  useEffect(() => {
    if (webrtc.callMode || webrtc.isConnecting) {
      setActivePanel("webrtc");
    }
  }, [webrtc.callMode, webrtc.isConnecting]);

  useEffect(() => {
    if (!webrtc.callMode) {
      return;
    }

    if (webrtc.callMode === "audio" && !enabledCapabilities.includes("audio_call")) {
      webrtc.endCall();
      setStatus("音频通话时长已结束，通话已自动断开。");
    }

    if (webrtc.callMode === "video" && !enabledCapabilities.includes("video_call")) {
      webrtc.endCall();
      setStatus("视频通话时长已结束，通话已自动断开。");
    }
  }, [enabledCapabilities, webrtc.callMode, webrtc.endCall]);

  useEffect(() => {
    if (!sessionId || !participant) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadSummary();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [loadSummary, participant, sessionId]);

  const quoteById = useMemo(() => new Map((summary?.quotes ?? []).map((quote) => [quote.id, quote])), [summary?.quotes]);

  const canUse = useCallback(
    (capability: SessionCapability) => summary?.session.enabledCapabilities.includes(capability) ?? false,
    [summary?.session.enabledCapabilities]
  );

  const capabilitySummary = useMemo(() => {
    const enabled = summary?.session.enabledCapabilities ?? [];
    if (enabled.length === 0) {
      return "当前没有启用的能力";
    }

    return enabled.map((item) => CAPABILITY_LABELS[item] ?? item).join(" / ");
  }, [summary?.session.enabledCapabilities]);
  const capabilityStatuses = useMemo(
    () =>
      ([
        "text",
        "image_message",
        "video_message",
        "audio_call",
        "video_call"
      ] as SessionCapability[]).map((capability) => ({
        capability,
        label: CAPABILITY_LABELS[capability],
        enabled: canUse(capability)
      })),
    [canUse]
  );
  const callEnabled = canUse("audio_call") || canUse("video_call");
  const immersiveCallView = activePanel === "webrtc" && (webrtc.callMode !== null || webrtc.isConnecting);

  if (!summary) {
    return (
      <main className="page-shell flex items-center justify-center">
        <div className="glass-card rounded-[28px] px-5 py-4 text-sm text-slate-600">{status ?? "正在加载..."}</div>
      </main>
    );
  }

  const messages = [...summary.messages].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const title = role === "initiator" ? summary.session.guest?.displayName ?? "等待接收端加入" : summary.session.initiatorDisplayName;
  const sessionStateLabel = SESSION_STATE_LABELS[summary.session.state] ?? summary.session.state;
  const panelTitle =
    activePanel === "session" ? "会话详情" : activePanel === "controls" ? "发起端控制台" : "实时音视频";
  const panelDescription =
    activePanel === "session"
      ? "查看当前会话阶段、能力状态和参与者信息。"
      : activePanel === "controls"
        ? "在这里配置付费能力、时长，并分享加入二维码。"
        : "音视频能力收进独立面板，避免聊天主屏被长控件占满。";

  return (
    <main className="page-shell flex items-center justify-center">
      <div className="relative h-[calc(100vh-20px)] w-full max-w-[460px] overflow-hidden rounded-[36px] border border-black/5 bg-[#e9efe3] shadow-[0_28px_80px_rgba(24,43,32,0.18)]">
        <div className="flex h-full flex-col">
          <header className="border-b border-black/5 bg-white/90 px-4 pb-4 pt-5 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  {role === "initiator" ? "发起端聊天页" : "接收端聊天页"}
                </p>
                <h1 className="mt-2 truncate text-2xl font-semibold text-ink">{title}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {sessionStateLabel} · {capabilitySummary}
                </p>
              </div>
              <TimerPill state={summary.session.state} label={timer.label} source={summary.session.currentWindow?.kind} />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {participants.length > 0 ? (
                participants.map((item) => (
                  <span
                    key={item.participantId}
                    className="whitespace-nowrap rounded-full bg-[#eef4e6] px-3 py-2 text-xs text-slate-600"
                  >
                    {item.displayName} / {ROLE_LABELS[item.role]}
                  </span>
                ))
              ) : (
                <span className="whitespace-nowrap rounded-full bg-[#eef4e6] px-3 py-2 text-xs text-slate-500">
                  正在等待房间同步...
                </span>
              )}
            </div>
          </header>

          {status ? (
            <div className="border-b border-black/5 bg-amber-50/90 px-4 py-2 text-sm text-slate-600">{status}</div>
          ) : null}

          <section className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-3">
              <div className="overflow-x-auto px-1 pb-1">
                <div className="flex gap-2">
                  {capabilityStatuses.map((item) => (
                    <CapabilityStatusChip key={item.capability} label={item.label} enabled={item.enabled} />
                  ))}
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="flex justify-center px-4 pt-8">
                  <div className="max-w-[280px] rounded-[24px] bg-white/80 px-4 py-3 text-center text-xs leading-6 text-slate-500">
                    初始仅启用 3 分钟文字聊天。图片消息、视频消息、音频通话、视频通话会根据发起方发起的付费能力和接收端支付结果动态启用或关闭。
                  </div>
                </div>
              ) : null}

              {messages.map((message: Message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  quote={message.paymentQuoteId ? quoteById.get(message.paymentQuoteId) : undefined}
                  isOwn={message.senderId === participant?.participantId}
                  isGuest={role === "guest"}
                  busy={paymentBusyId === message.paymentQuoteId}
                  onConfirmQuote={async (quoteId) => {
                    setPaymentBusyId(quoteId);
                    try {
                      const response = await confirmMockPayment({ sessionId, quoteId });
                      setSummary((current) =>
                        current
                          ? {
                              ...current,
                              session: response.session,
                              quotes: current.quotes.map((quote) => (quote.id === quoteId ? response.quote : quote))
                            }
                          : current
                      );
                    } catch (error) {
                      setStatus(error instanceof Error ? error.message : "确认支付失败。");
                    } finally {
                      setPaymentBusyId(null);
                    }
                  }}
                />
              ))}
            </div>
          </section>

          <div className="border-t border-black/5 bg-white/92 px-3 pb-3 pt-3 backdrop-blur">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              <PanelButton
                active={activePanel === "session"}
                detail={sessionStateLabel}
                onClick={() => setActivePanel(activePanel === "session" ? null : "session")}
              >
                会话
              </PanelButton>
              {role === "initiator" ? (
                <PanelButton
                  active={activePanel === "controls"}
                  detail="配置付费能力"
                  onClick={() => setActivePanel(activePanel === "controls" ? null : "controls")}
                >
                  控制
                </PanelButton>
              ) : null}
              <PanelButton
                active={activePanel === "webrtc"}
                detail={callEnabled ? "已开通通话" : "未开通通话"}
                onClick={() => setActivePanel(activePanel === "webrtc" ? null : "webrtc")}
              >
                通话
              </PanelButton>
            </div>

            <MessageComposer
              borderless
              canImage={canUse("image_message")}
              canVideo={canUse("video_message")}
              disabled={summary.session.state === "expired" || !participant || messageBusy}
              onSendText={async (text) => {
                if (!participant) {
                  return;
                }

                setMessageBusy(true);
                try {
                  await createMessage(sessionId, {
                    senderId: participant.participantId,
                    senderRole: participant.role,
                    type: "text",
                    text
                  });
                  setStatus("文字消息已发送。");
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "发送文字消息失败。");
                } finally {
                  setMessageBusy(false);
                }
              }}
              onSendFile={async (file, kind) => {
                if (!participant) {
                  return;
                }

                setMessageBusy(true);
                try {
                  const signed = await signUpload(file.name, file.type);
                  const uploadResponse = await fetch(signed.uploadUrl, {
                    method: "PUT",
                    headers: {
                      "content-type": file.type
                    },
                    body: file
                  });

                  if (!uploadResponse.ok) {
                    throw new Error("媒体上传失败，请确认本地 MinIO 服务已启动。");
                  }

                  await createMessage(sessionId, {
                    senderId: participant.participantId,
                    senderRole: participant.role,
                    type: kind,
                    mediaUrl: signed.publicUrl,
                    previewUrl: signed.publicUrl
                  });
                  setStatus(`${kind === "image" ? "图片" : "视频"}消息已发送。`);
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : `发送${kind === "image" ? "图片" : "视频"}消息失败。`);
                } finally {
                  setMessageBusy(false);
                }
              }}
            />
          </div>
        </div>

        {activePanel ? (
          <div
            className={`absolute inset-0 z-20 ${immersiveCallView ? "bg-[#08110d]" : "flex items-end bg-[rgba(12,24,17,0.24)] p-2"}`}
            onClick={() => {
              if (!immersiveCallView) {
                setActivePanel(null);
              }
            }}
          >
            <div
              className={`w-full overflow-hidden border border-black/5 bg-[#f8faf5] shadow-[0_-10px_30px_rgba(10,24,16,0.12)] ${
                immersiveCallView ? "h-full rounded-none border-0 bg-transparent shadow-none" : "max-h-[78%] rounded-[32px]"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              {immersiveCallView ? null : (
                <div className="flex items-start justify-between gap-4 border-b border-black/5 px-4 py-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">功能面板</p>
                    <h2 className="mt-2 text-xl font-semibold text-ink">{panelTitle}</h2>
                    <p className="mt-1 text-sm text-slate-500">{panelDescription}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePanel(null)}
                    className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-slate-600"
                  >
                    关闭
                  </button>
                </div>
              )}

              <div className={`${immersiveCallView ? "h-full overflow-hidden" : "max-h-[calc(78vh-96px)] space-y-4 overflow-y-auto px-4 py-4"}`}>
                {activePanel === "session" ? (
                  <>
                    <InfoCard label="会话阶段" value={sessionStateLabel} />
                    <InfoCard label="当前能力" value={capabilitySummary} />
                    <InfoCard label="会话 ID" value={summary.session.id} />

                    <section className="glass-card rounded-[28px] p-4">
                      <h3 className="text-base font-semibold text-ink">参与者</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {participants.length > 0 ? (
                          participants.map((item) => (
                            <span key={item.participantId} className="rounded-full bg-white px-3 py-2 text-xs text-slate-600">
                              {item.displayName} / {ROLE_LABELS[item.role]}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-white px-3 py-2 text-xs text-slate-500">等待房间同步...</span>
                        )}
                      </div>
                    </section>

                    {role === "initiator" ? (
                      <QrCodeCard
                        title="分享加入二维码"
                        value={summary.session.joinUrl}
                        helper="接收端扫码后会进入同一个聊天房间。当前 MVP 仅支持一个接收端加入。"
                      />
                    ) : (
                      <Link
                        href={`/expired/${sessionId}`}
                        className="inline-flex w-full items-center justify-center rounded-[28px] border border-black/10 bg-white px-4 py-4 text-sm font-semibold text-slate-600"
                      >
                        手动退出本次会话
                      </Link>
                    )}
                  </>
                ) : null}

                {activePanel === "controls" && role === "initiator" ? (
                  <>
                    <ControlPanel
                      selectedCapabilities={selectedCapabilities}
                      durationMinutes={durationMinutes}
                      busy={quoteBusy}
                      onToggle={(capability) =>
                        setSelectedCapabilities((current) =>
                          current.includes(capability)
                            ? current.filter((item) => item !== capability)
                            : [...current, capability]
                        )
                      }
                      onDurationChange={setDurationMinutes}
                      onCreateQuote={async () => {
                        if (!auth) {
                          return;
                        }

                        setQuoteBusy(true);
                        try {
                          await createPaymentQuote(auth.token, sessionId, {
                            capabilities: selectedCapabilities.filter((item) => item !== "text"),
                            durationMinutes,
                            title: "媒体权限解锁"
                          });
                          setStatus("支付请求已创建并发送到聊天区。");
                          setActivePanel(null);
                        } catch (error) {
                          setStatus(error instanceof Error ? error.message : "创建支付请求失败。");
                        } finally {
                          setQuoteBusy(false);
                        }
                      }}
                    />

                    <QrCodeCard
                      title="快速分享二维码"
                      value={summary.session.joinUrl}
                      helper="控制功能和邀请二维码都收在这里，聊天主屏保持简洁。"
                    />
                  </>
                ) : null}

                {activePanel === "webrtc" ? (
                  <WebRtcPanel
                    immersive={immersiveCallView}
                    peerLabel={title}
                    localStream={webrtc.localStream}
                    remoteStream={webrtc.remoteStream}
                    canAudio={canUse("audio_call")}
                    canVideo={canUse("video_call")}
                    callMode={webrtc.callMode}
                    isConnecting={webrtc.isConnecting}
                    permissionError={webrtc.permissionError}
                    onStartAudio={() => void webrtc.startAudioCall()}
                    onStartVideo={() => void webrtc.startVideoCall()}
                    onEndCall={webrtc.endCall}
                  />
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function PanelButton({
  active,
  detail,
  onClick,
  children
}: {
  active: boolean;
  detail: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[92px] rounded-[18px] px-4 py-2 text-left transition ${
        active ? "bg-[#1a2d22] text-white" : "bg-[#eef4e6] text-slate-600"
      }`}
    >
      <div className="text-sm font-semibold">{children}</div>
      <div className={`mt-1 text-[11px] ${active ? "text-white/75" : "text-slate-500"}`}>{detail}</div>
    </button>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="glass-card rounded-[28px] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-ink">{value}</p>
    </section>
  );
}

function CapabilityStatusChip({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div
      className={`min-w-fit rounded-full border px-3 py-2 text-xs font-medium ${
        enabled ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-black/8 bg-white/70 text-slate-400"
      }`}
    >
      {label} · {enabled ? "已启用" : "未启用"}
    </div>
  );
}
