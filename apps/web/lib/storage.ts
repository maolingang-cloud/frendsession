import type { ChatSession, GuestParticipant, LoginResponse } from "@frendseesion/shared";

const AUTH_KEY = "frendseesion.auth";

export type AuthSnapshot = Pick<LoginResponse, "token" | "user">;

export function readAuth(): AuthSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_KEY);
  return raw ? (JSON.parse(raw) as AuthSnapshot) : null;
}

export function writeAuth(auth: AuthSnapshot) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_KEY);
  }
}

export function writeGuestParticipant(sessionId: string, guest: GuestParticipant) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(`frendseesion.guest.${sessionId}`, JSON.stringify(guest));
  }
}

export function readGuestParticipant(sessionId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(`frendseesion.guest.${sessionId}`);
  return raw ? (JSON.parse(raw) as GuestParticipant) : null;
}

export function clearGuestParticipant(sessionId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(`frendseesion.guest.${sessionId}`);
  }
}

export function buildChatHref(session: ChatSession, role: "initiator" | "guest") {
  return `/chat/${session.id}?role=${role}`;
}
