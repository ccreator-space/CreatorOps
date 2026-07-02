import crypto from "node:crypto";

type TokenPayload = {
  sub: string;
  exp: number;
};

const tokenTtlMs = 1000 * 60 * 60 * 24 * 7;

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }

  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split("$");

  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const hash = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");

  return stored.length === hash.length && crypto.timingSafeEqual(stored, hash);
}

export function createToken(userId: string) {
  const payload: TokenPayload = {
    sub: userId,
    exp: Date.now() + tokenTtlMs
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || sign(encodedPayload) !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload;

    if (!payload.sub || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  avatarUrl: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl
  };
}
