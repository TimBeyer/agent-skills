#!/usr/bin/env bun
// Sixt OTP login — obtain a short-lived JWT for authenticated API access
// Token is printed to stdout only; never written to disk.

import { parse, loginOptions, type LoginValues } from "../lib/cli";
import { requestOtp, verifyOtp } from "../lib/auth";

const { values } = parse<LoginValues>(loginOptions);

if (values.help) {
  console.error(`Usage: sixt-login --email <email>

Authenticate with Sixt via email OTP to obtain a short-lived JWT.
The token is printed to stdout (never saved to disk).

Options:
  --email     Sixt account email address (required)
  -h, --help  Show this help

Flow:
  1. Requests a one-time code sent to your email
  2. You enter the 6-digit code
  3. Prints the JWT access token to stdout

Usage with other scripts:
  TOKEN=$(sixt-login --email user@example.com)
  sixt-search --pickup ... --return ... --token "$TOKEN"`);
  process.exit(0);
}

if (!values.email) {
  console.error("Error: --email is required");
  process.exit(1);
}

// Step 1+2: Request OTP
console.error(`Requesting OTP for ${values.email}...`);
try {
  await requestOtp(values.email);
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`Failed to request OTP: ${msg}`);
  process.exit(1);
}
console.error(`OTP sent to ${values.email}. Check your email.`);

// Step 3: Read OTP from stdin
process.stderr.write("Enter OTP code: ");
const otp = await new Promise<string>((resolve) => {
  let input = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk: string) => {
    input += chunk;
    if (input.includes("\n")) {
      resolve(input.trim());
    }
  });
  process.stdin.resume();
});

// Step 4: Verify OTP and get token
try {
  const result = await verifyOtp(values.email, otp);
  // Print token to stdout (agent captures this)
  console.log(result.accessToken);
  const ttl = Math.max(0, result.expiresIn - Math.floor(Date.now() / 1000));
  console.error(`Token obtained (expires in ${ttl}s)`);
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`OTP verification failed: ${msg}`);
  process.exit(1);
}
