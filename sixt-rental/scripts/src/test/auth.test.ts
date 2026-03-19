import { describe, test, expect } from "bun:test";
import { decodeJwtPayload, getUserId } from "../lib/auth";

// Build a fake JWT with the given payload (no signature verification needed)
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const sig = "fakesig";
  return `${header}.${body}.${sig}`;
}

// Build a JWT using base64url encoding (with - and _ instead of + and /)
function fakeJwtUrl(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${header}.${body}.fakesig`;
}

describe("decodeJwtPayload", () => {
  test("decodes a standard JWT payload", () => {
    const token = fakeJwt({
      user_id: "abc-123",
      mnum: "900123456",
      exp: 1700000000,
    });
    const payload = decodeJwtPayload(token);
    expect(payload.user_id).toBe("abc-123");
    expect(payload.mnum).toBe("900123456");
    expect(payload.exp).toBe(1700000000);
  });

  test("handles base64url encoding", () => {
    const token = fakeJwtUrl({
      user_id: "user+special/chars",
      exp: 1700000000,
    });
    const payload = decodeJwtPayload(token);
    expect(payload.user_id).toBe("user+special/chars");
  });

  test("throws on invalid JWT format", () => {
    expect(() => decodeJwtPayload("not.a.jwt.token.here")).toThrow("expected 3 parts");
    expect(() => decodeJwtPayload("onlyone")).toThrow("expected 3 parts");
    expect(() => decodeJwtPayload("")).toThrow("expected 3 parts");
  });

  test("preserves extra fields", () => {
    const token = fakeJwt({
      user_id: "u1",
      exp: 123,
      custom_field: "hello",
      roles: ["member"],
    });
    const payload = decodeJwtPayload(token);
    expect(payload.custom_field).toBe("hello");
    expect(payload.roles).toEqual(["member"]);
  });
});

describe("getUserId", () => {
  test("extracts user_id from token", () => {
    const token = fakeJwt({ user_id: "uid-456", exp: 123 });
    expect(getUserId(token)).toBe("uid-456");
  });

  test("throws when user_id is missing", () => {
    const token = fakeJwt({ exp: 123 });
    expect(() => getUserId(token)).toThrow("missing user_id");
  });
});
