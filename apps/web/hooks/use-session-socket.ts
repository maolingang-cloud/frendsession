"use client";

import type {
  ChatSession,
  Message,
  PaymentOrder,
  PaymentQuote,
  SessionCapabilityGrant,
  SignalPayload
} from "@frendseesion/shared";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type ParticipantIdentity = {
  participantId: string;
  role: "initiator" | "guest";
  displayName: string;
};

type RoomPayload = {
  participantId: string;
  role: "initiator" | "guest";
  displayName?: string;
  participants: Array<{
    participantId: string;
    role: "initiator" | "guest";
    displayName: string;
  }>;
};

type SessionSocketCallbacks = {
  onSessionState?: (session: ChatSession) => void;
  onTimerUpdate?: (grant: SessionCapabilityGrant) => void;
  onCapabilityUpdate?: (grant: SessionCapabilityGrant) => void;
  onMessage?: (message: Message) => void;
  onPaymentCreated?: (quote: PaymentQuote) => void;
  onPaymentConfirmed?: (order: PaymentOrder) => void;
  onRoomJoin?: (payload: RoomPayload) => void;
  onRoomLeft?: (payload: RoomPayload) => void;
  onOffer?: (payload: SignalPayload) => void;
  onAnswer?: (payload: SignalPayload) => void;
  onIce?: (payload: SignalPayload) => void;
};

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3302";

export function useSessionSocket(
  sessionId: string | undefined,
  participant: ParticipantIdentity | null,
  callbacks: SessionSocketCallbacks
) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!sessionId || !participant) {
      return;
    }

    const socket = io(REALTIME_URL, {
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("session:state", (payload: ChatSession) => callbacksRef.current.onSessionState?.(payload));
    socket.on("timer:update", (payload: SessionCapabilityGrant) => callbacksRef.current.onTimerUpdate?.(payload));
    socket.on("capability:update", (payload: SessionCapabilityGrant) =>
      callbacksRef.current.onCapabilityUpdate?.(payload)
    );
    socket.on("chat:message", (payload: Message) => callbacksRef.current.onMessage?.(payload));
    socket.on("payment:created", (payload: PaymentQuote) => callbacksRef.current.onPaymentCreated?.(payload));
    socket.on("payment:confirmed", (payload: PaymentOrder) =>
      callbacksRef.current.onPaymentConfirmed?.(payload)
    );
    socket.on("room:join", (payload: RoomPayload) => callbacksRef.current.onRoomJoin?.(payload));
    socket.on("room:left", (payload: RoomPayload) => callbacksRef.current.onRoomLeft?.(payload));
    socket.on("webrtc:offer", (payload: SignalPayload) => callbacksRef.current.onOffer?.(payload));
    socket.on("webrtc:answer", (payload: SignalPayload) => callbacksRef.current.onAnswer?.(payload));
    socket.on("webrtc:ice", (payload: SignalPayload) => callbacksRef.current.onIce?.(payload));

    socket.emit("room:join", {
      sessionId,
      participantId: participant.participantId,
      role: participant.role,
      displayName: participant.displayName
    });

    return () => {
      socket.emit("room:left", {
        sessionId,
        participantId: participant.participantId,
        role: participant.role
      });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [participant?.displayName, participant?.participantId, participant?.role, sessionId]);

  return socketRef;
}
