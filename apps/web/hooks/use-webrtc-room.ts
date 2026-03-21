"use client";

import type { SignalPayload } from "@frendseesion/shared";
import type { MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CallMode = "audio" | "video" | null;

type UseWebRtcRoomArgs = {
  sessionId?: string;
  participantId?: string;
  remoteParticipantId?: string;
  socketRef: MutableRefObject<Socket | null>;
};

export function useWebRtcRoom({ sessionId, participantId, remoteParticipantId, socketRef }: UseWebRtcRoomArgs) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callMode, setCallMode] = useState<CallMode>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const iceServers = useMemo<RTCIceServer[]>(
    () => [
      { urls: process.env.NEXT_PUBLIC_STUN_URL ?? "stun:stun.l.google.com:19302" },
      {
        urls: process.env.NEXT_PUBLIC_TURN_URL ?? "turn:localhost:3478",
        username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "demo",
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "demo"
      }
    ],
    []
  );

  const emitSignal = useCallback(
    (eventName: "webrtc:offer" | "webrtc:answer" | "webrtc:ice", payload: SignalPayload) => {
      socketRef.current?.emit(eventName, payload);
    },
    [socketRef]
  );

  const ensurePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.onicecandidate = (event) => {
      if (!event.candidate || !sessionId || !participantId) {
        return;
      }

      emitSignal("webrtc:ice", {
        sessionId,
        fromParticipantId: participantId,
        targetParticipantId: remoteParticipantId,
        candidate: event.candidate.toJSON()
      });
    };

    peerConnection.ontrack = (event) => {
      const nextStream = event.streams[0] ?? null;
      setRemoteStream(nextStream);
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      setIsConnecting(state === "connecting" || state === "new");
      if (state === "failed" || state === "closed" || state === "disconnected") {
        setRemoteStream(null);
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [emitSignal, iceServers, participantId, remoteParticipantId, sessionId]);

  const ensureLocalMedia = useCallback(
    async (mode: Exclude<CallMode, null>) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === "video"
        });

        localStreamRef.current = stream;
        setLocalStream(stream);
        setPermissionError(null);

        const peerConnection = ensurePeerConnection();
        const existingTrackIds = new Set(peerConnection.getSenders().map((sender) => sender.track?.id).filter(Boolean));
        for (const track of stream.getTracks()) {
          if (!existingTrackIds.has(track.id)) {
            peerConnection.addTrack(track, stream);
          }
        }

        return stream;
      } catch (error) {
        const message = toPermissionMessage(error);
        setPermissionError(message);
        throw error;
      }
    },
    [ensurePeerConnection]
  );

  const startCall = useCallback(
    async (mode: Exclude<CallMode, null>) => {
      if (!sessionId || !participantId || !remoteParticipantId) {
        return;
      }

      setCallMode(mode);
      setIsConnecting(true);
      const peerConnection = ensurePeerConnection();
      await ensureLocalMedia(mode);

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: mode === "video"
      });
      await peerConnection.setLocalDescription(offer);

      emitSignal("webrtc:offer", {
        sessionId,
        fromParticipantId: participantId,
        targetParticipantId: remoteParticipantId,
        sdp: offer
      });
    },
    [emitSignal, ensureLocalMedia, ensurePeerConnection, participantId, remoteParticipantId, sessionId]
  );

  const handleOffer = useCallback(
    async (payload: SignalPayload) => {
      if (!sessionId || !participantId || payload.fromParticipantId === participantId || !payload.sdp) {
        return;
      }

      const wantsVideo = payload.sdp.sdp?.includes("m=video") ?? false;
      setCallMode(wantsVideo ? "video" : "audio");
      setIsConnecting(true);

      const peerConnection = ensurePeerConnection();
      await ensureLocalMedia(wantsVideo ? "video" : "audio");
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      emitSignal("webrtc:answer", {
        sessionId,
        fromParticipantId: participantId,
        targetParticipantId: payload.fromParticipantId,
        sdp: answer
      });
    },
    [emitSignal, ensureLocalMedia, ensurePeerConnection, participantId, sessionId]
  );

  const handleAnswer = useCallback(
    async (payload: SignalPayload) => {
      if (!payload.sdp || !peerConnectionRef.current || payload.fromParticipantId === participantId) {
        return;
      }
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      setIsConnecting(false);
    },
    [participantId]
  );

  const handleIce = useCallback(
    async (payload: SignalPayload) => {
      if (!payload.candidate || !peerConnectionRef.current || payload.fromParticipantId === participantId) {
        return;
      }
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
    },
    [participantId]
  );

  const endCall = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallMode(null);
    setIsConnecting(false);
  }, []);

  useEffect(() => endCall, [endCall]);

  return {
    localStream,
    remoteStream,
    callMode,
    permissionError,
    isConnecting,
    startAudioCall: () => startCall("audio"),
    startVideoCall: () => startCall("video"),
    endCall,
    handleOffer,
    handleAnswer,
    handleIce
  };
}

function toPermissionMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "无法获取设备权限，请检查麦克风和摄像头设置。";
  }

  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "浏览器未授予麦克风或摄像头权限，请在浏览器设置中允许访问后重试。";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "未检测到可用的麦克风或摄像头设备。";
    case "NotReadableError":
    case "TrackStartError":
      return "设备当前被其他应用占用，暂时无法启用音视频。";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "当前设备不支持所需的音视频配置。";
    default:
      return error.message || "无法获取设备权限，请检查麦克风和摄像头设置。";
  }
}
