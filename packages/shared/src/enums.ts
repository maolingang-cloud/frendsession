export const SESSION_STATE_VALUES = [
  "waiting_for_guest",
  "free_text",
  "pending_payment",
  "paid_media",
  "free_text_return",
  "expired"
] as const;

export const SESSION_STATES = SESSION_STATE_VALUES;

export const SESSION_STATE = {
  WAITING_FOR_GUEST: "waiting_for_guest",
  FREE_TEXT: "free_text",
  PENDING_PAYMENT: "pending_payment",
  PAID_MEDIA: "paid_media",
  FREE_TEXT_RETURN: "free_text_return",
  EXPIRED: "expired"
} as const;

export const SESSION_CAPABILITY_VALUES = ["text", "image_message", "video_message", "audio_call", "video_call"] as const;

export const SESSION_CAPABILITIES = SESSION_CAPABILITY_VALUES;

export const SESSION_CAPABILITY = {
  TEXT: "text",
  IMAGE_MESSAGE: "image_message",
  VIDEO_MESSAGE: "video_message",
  AUDIO_CALL: "audio_call",
  VIDEO_CALL: "video_call"
} as const;

export const PARTICIPANT_ROLE_VALUES = ["initiator", "guest", "system"] as const;

export const PARTICIPANT_ROLE = {
  INITIATOR: "initiator",
  GUEST: "guest",
  SYSTEM: "system"
} as const;

export const MESSAGE_TYPE_VALUES = ["text", "image", "video", "system", "payment_request"] as const;

export const MESSAGE_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  SYSTEM: "system",
  PAYMENT_REQUEST: "payment_request"
} as const;

export const PAYMENT_STATUS_VALUES = ["pending", "paid", "expired"] as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  EXPIRED: "expired"
} as const;

export const TIMER_WINDOW_KIND_VALUES = ["free", "paid"] as const;

export const TIMER_WINDOW_KIND = {
  FREE: "free",
  PAID: "paid"
} as const;

export type SessionState = (typeof SESSION_STATE_VALUES)[number];
export type SessionCapability = (typeof SESSION_CAPABILITY_VALUES)[number];
export type ParticipantRole = (typeof PARTICIPANT_ROLE_VALUES)[number];
export type MessageType = (typeof MESSAGE_TYPE_VALUES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];
export type TimerWindowKind = (typeof TIMER_WINDOW_KIND_VALUES)[number];
