import {
  ROOM_EVENT,
  WEBRTC_SIGNAL_EVENT,
  type RealtimeEnvelope,
  type SignalPayload,
  type WebRtcSignalEvent
} from "@frendseesion/shared";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

type Presence = {
  participantId: string;
  role: "initiator" | "guest";
  displayName: string;
  socketId: string;
};

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

const roomPresence = new Map<string, Map<string, Presence>>();

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "realtime",
    timestamp: new Date().toISOString()
  });
});

app.post("/internal/events", (request, response) => {
  const envelope = request.body as RealtimeEnvelope;
  io.to(envelope.sessionId).emit(envelope.type, envelope.payload);
  response.json({ ok: true });
});

io.on("connection", (socket) => {
  socket.on(
    ROOM_EVENT.JOIN,
    (payload: { sessionId: string; participantId: string; role: "initiator" | "guest"; displayName: string }) => {
      socket.join(payload.sessionId);
      socket.data.sessionId = payload.sessionId;
      socket.data.participantId = payload.participantId;
      socket.data.role = payload.role;

      const participants = roomPresence.get(payload.sessionId) ?? new Map<string, Presence>();
      participants.set(payload.participantId, {
        participantId: payload.participantId,
        role: payload.role,
        displayName: payload.displayName,
        socketId: socket.id
      });
      roomPresence.set(payload.sessionId, participants);

      io.to(payload.sessionId).emit(ROOM_EVENT.JOIN, {
        participantId: payload.participantId,
        role: payload.role,
        displayName: payload.displayName,
        participants: [...participants.values()].map((participant) => ({
          participantId: participant.participantId,
          role: participant.role,
          displayName: participant.displayName
        }))
      });
    }
  );

  socket.on(
    ROOM_EVENT.LEFT,
    (payload: { sessionId: string; participantId: string; role: "initiator" | "guest" }) => {
      handleLeave(payload.sessionId, payload.participantId, payload.role);
      socket.leave(payload.sessionId);
    }
  );

  socket.on(WEBRTC_SIGNAL_EVENT.OFFER, (payload: SignalPayload) => forwardSignal(WEBRTC_SIGNAL_EVENT.OFFER, payload));
  socket.on(WEBRTC_SIGNAL_EVENT.ANSWER, (payload: SignalPayload) =>
    forwardSignal(WEBRTC_SIGNAL_EVENT.ANSWER, payload)
  );
  socket.on(WEBRTC_SIGNAL_EVENT.ICE, (payload: SignalPayload) => forwardSignal(WEBRTC_SIGNAL_EVENT.ICE, payload));

  socket.on("disconnect", () => {
    const sessionId = socket.data.sessionId as string | undefined;
    const participantId = socket.data.participantId as string | undefined;
    const role = socket.data.role as "initiator" | "guest" | undefined;

    if (sessionId && participantId && role) {
      handleLeave(sessionId, participantId, role);
    }
  });
});

function handleLeave(sessionId: string, participantId: string, role: "initiator" | "guest") {
  const participants = roomPresence.get(sessionId);
  if (!participants) {
    return;
  }

  participants.delete(participantId);
  if (participants.size === 0) {
    roomPresence.delete(sessionId);
  }

  io.to(sessionId).emit(ROOM_EVENT.LEFT, {
    participantId,
    role,
    participants: [...participants.values()].map((participant) => ({
      participantId: participant.participantId,
      role: participant.role,
      displayName: participant.displayName
    }))
  });
}

function forwardSignal(eventName: WebRtcSignalEvent, payload: SignalPayload) {
  if (payload.targetParticipantId) {
    const target = roomPresence.get(payload.sessionId)?.get(payload.targetParticipantId);
    if (target) {
      io.to(target.socketId).emit(eventName, payload);
      return;
    }
  }

  io.to(payload.sessionId).emit(eventName, payload);
}

httpServer.listen(Number(process.env.REALTIME_PORT ?? 3302), () => {
  console.log(`Realtime service listening on ${process.env.REALTIME_PORT ?? 3302}`);
});
