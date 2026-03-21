"use client";

import { useEffect, useRef, useState } from "react";

export function WebRtcPanel({
  localStream,
  remoteStream,
  peerLabel,
  canAudio,
  canVideo,
  callMode,
  isConnecting,
  permissionError,
  immersive,
  onStartAudio,
  onStartVideo,
  onEndCall
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerLabel?: string;
  canAudio: boolean;
  canVideo: boolean;
  callMode: "audio" | "video" | null;
  isConnecting: boolean;
  permissionError: string | null;
  immersive?: boolean;
  onStartAudio: () => void;
  onStartVideo: () => void;
  onEndCall: () => void;
}) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const [localPreviewMinimized, setLocalPreviewMinimized] = useState(false);
  const callCapabilitySummary =
    canAudio && canVideo ? "已开通音频通话和视频通话" : canAudio ? "已开通音频通话" : canVideo ? "已开通视频通话" : "当前未开通音视频通话";
  const callLabel = callMode === "video" ? "视频通话" : "音频通话";
  const remoteLabel = peerLabel?.trim() || "对方";

  useEffect(() => {
    if (localRef.current) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (callMode !== "video") {
      setLocalPreviewMinimized(false);
    }
  }, [callMode]);

  if (immersive && callMode === "video") {
    return (
      <div className="relative h-full overflow-hidden bg-[#08110d] text-white">
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          controls={false}
          className="absolute inset-0 h-full w-full bg-[#08110d] object-cover"
        />

        {!remoteStream ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(63,93,76,0.45),rgba(8,17,13,0.98))] px-8 text-center">
            <div>
              <p className="text-2xl font-semibold">{isConnecting ? "正在接通视频..." : "等待对方画面"}</p>
              <p className="mt-3 text-sm text-white/70">接收方点击视频通话后，发起方会自动进入视频状态。</p>
            </div>
          </div>
        ) : null}

        <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/55 to-transparent px-4 pb-10 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/80 backdrop-blur">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span>{isConnecting ? "正在自动连接" : "已自动接通"}</span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold">{remoteLabel}</h3>
              <p className="mt-1 text-sm text-white/75">
                {callLabel} · {isConnecting ? "正在等待双方流建立..." : "已进入沉浸式视频通话"}
              </p>
            </div>
            <button
              type="button"
              onClick={onEndCall}
              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
            >
              挂断
            </button>
          </div>
        </div>

        {localStream ? (
          localPreviewMinimized ? (
            <button
              type="button"
              onClick={() => setLocalPreviewMinimized(false)}
              className="absolute right-4 top-24 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/55 text-sm font-semibold text-white shadow-lg backdrop-blur"
            >
              我
            </button>
          ) : (
            <div className="absolute right-4 top-24 z-20 w-[96px] overflow-hidden rounded-[20px] border border-white/15 bg-black/70 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 px-2 py-1 text-[11px] text-white/70">
                <span>我</span>
                <button type="button" onClick={() => setLocalPreviewMinimized(true)} className="rounded px-1 text-white/70">
                  _
                </button>
              </div>
              <video
                ref={localRef}
                autoPlay
                playsInline
                muted
                controls={false}
                className="aspect-[3/4] w-full bg-[#223128] object-cover"
              />
            </div>
          )
        ) : null}

        {permissionError ? (
          <div className="absolute inset-x-4 bottom-24 z-10 rounded-[20px] bg-rose-500/90 px-4 py-3 text-sm text-white shadow-lg">
            {permissionError}
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-5 pt-12">
          <div className="flex items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-black/35 px-4 py-3 backdrop-blur">
            <button
              type="button"
              onClick={() => setLocalPreviewMinimized((current) => !current)}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white"
            >
              {localPreviewMinimized ? "展开我" : "收起我"}
            </button>
            <div className="text-center text-sm text-white/80">
              <div className="font-medium">{callLabel}</div>
              <div className="mt-1 text-xs text-white/60">对方全屏，本机右上角小窗</div>
            </div>
            <button
              type="button"
              onClick={onEndCall}
              className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg"
            >
              挂断
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (immersive && callMode === "audio") {
    return (
      <div className="relative h-full overflow-hidden bg-[#0d1712] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(58,92,72,0.45),rgba(13,23,18,1))]" />
        <div className="relative flex h-full flex-col justify-between px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/80 backdrop-blur">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span>{isConnecting ? "正在自动连接" : "已自动接通"}</span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold">{remoteLabel}</h3>
              <p className="mt-1 text-sm text-white/75">{isConnecting ? "正在等待对方加入语音..." : "已进入沉浸式语音通话"}</p>
            </div>
            <button
              type="button"
              onClick={onEndCall}
              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
            >
              挂断
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto h-36 w-36">
                <div className="call-pulse-ring absolute inset-0 rounded-full border border-white/12" />
                <div className="call-pulse-ring absolute inset-3 rounded-full border border-white/10 [animation-delay:0.6s]" />
                <div className="absolute inset-[22px] flex items-center justify-center rounded-full bg-white/12 text-3xl font-semibold text-white shadow-lg backdrop-blur">
                  听
                </div>
              </div>
              <p className="mt-5 text-lg font-semibold">{isConnecting ? "正在等待对方加入语音..." : "语音已接通"}</p>
              <p className="mt-2 text-sm text-white/70">接收方点击音频通话后，发起方会自动进入语音状态。</p>
            </div>
          </div>

          {permissionError ? (
            <div className="rounded-[20px] bg-rose-500/90 px-4 py-3 text-sm text-white shadow-lg">{permissionError}</div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-black/25 px-4 py-3 backdrop-blur">
              <div className="text-sm text-white/80">
                <div className="font-medium">音频通话</div>
                <div className="mt-1 text-xs text-white/60">当前仅使用麦克风通话，不会自动打开视频。</div>
              </div>
              <button
                type="button"
                onClick={onEndCall}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg"
              >
                挂断
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[28px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">实时音视频</h3>
          <p className="mt-1 text-xs text-slate-500">通话使用点对点 WebRTC。发起视频时会同时包含音频。</p>
          <p className="mt-2 text-xs font-medium text-slate-600">{callCapabilitySummary}</p>
        </div>
        {callMode ? (
          <button
            type="button"
            onClick={onEndCall}
            className="rounded-2xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white"
          >
            挂断
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="overflow-hidden rounded-[24px] bg-[#18221c]">
          <video ref={remoteRef} autoPlay playsInline controls={false} className="aspect-[3/4] w-full bg-[#18221c] object-cover" />
          <div className="px-3 py-2 text-xs text-white/70">{isConnecting ? "连接中..." : "对方画面"}</div>
        </div>
        <div className="overflow-hidden rounded-[24px] bg-[#223128]">
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="aspect-[3/4] w-full bg-[#223128] object-cover"
          />
          <div className="px-3 py-2 text-xs text-white/70">本地预览</div>
        </div>
      </div>
      {permissionError ? <p className="mt-3 text-sm text-rose-600">{permissionError}</p> : null}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onStartAudio}
          disabled={!canAudio}
          className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {canAudio ? "发起音频通话" : "音频通话未开通"}
        </button>
        <button
          type="button"
          onClick={onStartVideo}
          disabled={!canVideo}
          className="flex-1 rounded-2xl bg-[#8dde61] px-4 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {canVideo ? "发起视频通话" : "视频通话未开通"}
        </button>
      </div>
    </div>
  );
}
