import assert from "node:assert/strict";
import test from "node:test";
import { createToken, hashPassword, verifyPassword, verifyToken } from "./auth.js";

process.env.AUTH_SECRET = "test-secret";

test("hashPassword and verifyPassword validate scrypt hashes", () => {
  const passwordHash = hashPassword("shipin123");

  assert.equal(verifyPassword("shipin123", passwordHash), true);
  assert.equal(verifyPassword("wrong", passwordHash), false);
});

test("createToken and verifyToken round-trip a user id", () => {
  const token = createToken("user-1");
  const payload = verifyToken(token);

  assert.equal(payload?.sub, "user-1");
});

test("verifyToken rejects tampered tokens", () => {
  const token = createToken("user-1");

  assert.equal(verifyToken(`${token}x`), null);
});
