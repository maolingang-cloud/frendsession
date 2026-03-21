export const REALTIME_EVENT_VALUES = [
  "session:state",
  "timer:update",
  "capability:update",
  "payment:created",
  "payment:confirmed",
  "chat:message"
] as const;

export const REALTIME_EVENTS = REALTIME_EVENT_VALUES;

export const REALTIME_EVENT = {
  SESSION_STATE: "session:state",
  TIMER_UPDATE: "timer:update",
  CAPABILITY_UPDATE: "capability:update",
  PAYMENT_CREATED: "payment:created",
  PAYMENT_CONFIRMED: "payment:confirmed",
  CHAT_MESSAGE: "chat:message"
} as const;

export const ROOM_EVENT_VALUES = ["room:join", "room:left"] as const;

export const ROOM_EVENTS = ROOM_EVENT_VALUES;

export const ROOM_EVENT = {
  JOIN: "room:join",
  LEFT: "room:left"
} as const;

export const WEBRTC_SIGNAL_EVENT_VALUES = ["webrtc:offer", "webrtc:answer", "webrtc:ice"] as const;

export const WEBRTC_SIGNAL_EVENTS = WEBRTC_SIGNAL_EVENT_VALUES;

export const WEBRTC_SIGNAL_EVENT = {
  OFFER: "webrtc:offer",
  ANSWER: "webrtc:answer",
  ICE: "webrtc:ice"
} as const;

export type RealtimeEventType = (typeof REALTIME_EVENT_VALUES)[number];
export type RoomEventType = (typeof ROOM_EVENT_VALUES)[number];
export type WebRtcSignalEvent = (typeof WEBRTC_SIGNAL_EVENT_VALUES)[number];
