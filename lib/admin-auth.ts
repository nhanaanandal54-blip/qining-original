import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { NextRequest, NextResponse } from "next/server";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "qining_admin_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isAdminRequest(request: NextRequest) {
  const secret = sessionSecret();
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!secret || !token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(data.expiresAt) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function verifyAdminPassword(password: string) {
  const encoded = process.env.ADMIN_PASSWORD_HASH || "";
  const [algorithm, salt, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;

  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_AGE_SECONDS,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

