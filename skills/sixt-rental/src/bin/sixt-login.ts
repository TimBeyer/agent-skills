#!/usr/bin/env bun
// Sixt OTP login — two-step non-interactive flow for agent use
// Token is printed to stdout only; never written to disk.

import { parse, loginOptions, type LoginValues } from "../lib/cli";
import { createSession, encodeSession, decodeSession, requestOtp, verifyOtp } from "../lib/auth";

const { values } = parse<LoginValues>(loginOptions);

if (values.help) {
  console.error(`Usage: sixt-login --email <email> [--otp <code> --session <handle>]

Authenticate with Sixt via email OTP. Two-step non-interactive flow:

  Step 1 — Request OTP (outputs session handle):
    SESSION=$(sixt-login --email user@example.com)

  Step 2 — Verify OTP (outputs JWT):
    TOKEN=$(sixt-login --email user@example.com --otp 123456 --session "$SESSION")

  Then pass the token to other scripts:
    sixt-search --pickup ... --return ... --token "$TOKEN"

Options:
  --email     Sixt account email address (required)
  --otp       6-digit OTP code from email (triggers verify step)
  --session   Session handle from step 1 (required with --otp)
  -h, --help  Show this help`);
  process.exit(0);
}

if (!values.email) {
  console.error("Error: --email is required");
  process.exit(1);
}

if (values.otp) {
  // --- Step 2: Verify OTP ---
  if (!values.session) {
    console.error("Error: --session is required with --otp");
    process.exit(1);
  }

  let session;
  try {
    session = decodeSession(values.session);
  } catch {
    console.error("Error: invalid --session handle");
    process.exit(1);
  }

  try {
    const result = await verifyOtp(values.email, values.otp, session);
    console.log(result.accessToken);
    const ttl = Math.max(0, result.expiresIn - Math.floor(Date.now() / 1000));
    console.error(`Token obtained (expires in ${ttl}s)`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`OTP verification failed: ${msg}`);
    process.exit(1);
  }
} else {
  // --- Step 1: Request OTP ---
  const session = createSession();

  console.error(`Requesting OTP for ${values.email}...`);
  try {
    await requestOtp(values.email, session);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Failed to request OTP: ${msg}`);
    process.exit(1);
  }

  console.error(`OTP sent to ${values.email}. Check your email.`);
  console.log(encodeSession(session));
}
