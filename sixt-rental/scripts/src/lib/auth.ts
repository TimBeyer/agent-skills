// Sixt web-api authentication — email OTP login flow
// Tokens are held in memory only; never persisted to disk.

import type { OtpResponse, AuthTokenResponse, JwtPayload } from "./types";

const WEB_API = "https://web-api.orange.sixt.com";

/** Session IDs that tie an OTP request to its verify call */
export interface AuthSession {
  browserId: string;
  stableId: string;
  clientId: string;
}

/** Generate a fresh set of session IDs */
export function createSession(): AuthSession {
  return {
    browserId: crypto.randomUUID().replace(/-/g, ""),
    stableId: crypto.randomUUID(),
    clientId: `web-browser-${Date.now()}${Math.random().toString().slice(2, 18)}`,
  };
}

/** Encode session as an opaque base64 string for passing between commands */
export function encodeSession(session: AuthSession): string {
  return btoa(JSON.stringify(session));
}

/** Decode a session handle back to session IDs */
export function decodeSession(handle: string): AuthSession {
  return JSON.parse(atob(handle)) as AuthSession;
}

/** Build headers matching what the Sixt website sends */
function buildHeaders(session: AuthSession, token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "text/plain;charset=UTF-8",
    "sx-platform": "web-next",
    "x-client-type": "web",
    "x-sx-tenant": "6",
    "sx-browser-id": session.browserId,
    "x-client-id": session.clientId,
    "x-correlation-id": crypto.randomUUID(),
    "x-sx-e-stable-id": session.stableId,
    "x-sx-o-client-id": `${crypto.randomUUID()}:false`,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** POST to a Sixt web-api endpoint with platform headers */
export async function webApiPost<T>(
  path: string,
  body: Record<string, unknown>,
  session: AuthSession,
  token?: string,
): Promise<T> {
  const headers = buildHeaders(session, token);
  const res = await fetch(`${WEB_API}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`web-api ${path}: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

/** Step 1+2: Check auth method and request an OTP code via email */
export async function requestOtp(email: string, session: AuthSession): Promise<OtpResponse> {
  // Step 1: Confirm email uses Sixt auth (not social login etc.)
  await webApiPost("/v2/users/getAuthMethod", { username: email }, session);

  // Step 2: Request the OTP
  return webApiPost<OtpResponse>("/v1/auth/requestLoginOTP", {
    username: email,
    channels: ["email"],
  }, session);
}

/** Step 3: Verify OTP and receive access token */
export async function verifyOtp(
  email: string,
  otp: string,
  session: AuthSession,
): Promise<AuthTokenResponse> {
  return webApiPost<AuthTokenResponse>("/v1/auth/verifyLoginOTP", {
    username: email,
    otp,
  }, session);
}

/** Decode a JWT payload without verification (we only need the claims) */
export function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 parts");
  }
  // Base64url → Base64 → decode
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(base64);
  return JSON.parse(json) as JwtPayload;
}

/** Extract user_id from a JWT token */
export function getUserId(token: string): string {
  const payload = decodeJwtPayload(token);
  if (!payload.user_id) {
    throw new Error("JWT payload missing user_id");
  }
  return payload.user_id;
}
