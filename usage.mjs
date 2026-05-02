#!/usr/bin/env node
// Reads Claude OAuth token from macOS keychain and fetches plan usage.
// Usage: node usage.mjs

import { execSync } from "node:child_process";
import os from "node:os";

const SERVICE_NAME = "Claude Code-credentials";
const USERNAME = process.env.USER || os.userInfo().username;
const USAGE_URL = "https://api.anthropic.com/api/oauth/usage";

function readTokenFromKeychain() {
  try {
    const raw = execSync(
      `security find-generic-password -a "${USERNAME}" -w -s "${SERVICE_NAME}"`,
      { stdio: ["pipe", "pipe", "pipe"] }
    ).toString().trim();
    const data = JSON.parse(raw);
    const token = data?.claudeAiOauth?.accessToken;
    const expiresAt = data?.claudeAiOauth?.expiresAt;
    if (!token) throw new Error("No accessToken found in keychain entry");
    if (expiresAt && Date.now() > expiresAt) {
      console.warn("⚠️  Token is expired — open Claude Code to refresh it");
    }
    return { token, meta: data.claudeAiOauth };
  } catch (err) {
    throw new Error(`Keychain read failed: ${err.message}`);
  }
}

async function fetchUsage(accessToken) {
  const res = await fetch(USAGE_URL, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "anthropic-beta": "oauth-2025-04-20",
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function bar(pct, width = 28) {
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * width);
  const empty = width - filled;
  const color = pct >= 90 ? "\x1b[31m" : pct >= 70 ? "\x1b[33m" : "\x1b[32m";
  return `${color}${"█".repeat(filled)}\x1b[90m${"░".repeat(empty)}\x1b[0m`;
}

async function main() {
  const { token, meta } = readTokenFromKeychain();

  console.log("\n\x1b[1m── Claude Plan Usage ──────────────────────────────\x1b[0m");
  console.log(`  Plan    ${meta.subscriptionType ?? "unknown"}`);
  console.log(`  Tier    ${meta.rateLimitTier ?? "unknown"}`);
  console.log(`  Token   expires ${formatDate(new Date(meta.expiresAt).toISOString())}`);

  let usage;
  try {
    usage = await fetchUsage(token);
  } catch (err) {
    console.error(`\n\x1b[31m  ${err.message}\x1b[0m\n`);
    process.exit(1);
  }

  const windows = [
    { key: "five_hour",            label: "5-hour window   " },
    { key: "seven_day",            label: "7-day overall   " },
    { key: "seven_day_sonnet",     label: "7-day Sonnet    " },
    { key: "seven_day_opus",       label: "7-day Opus      " },
    { key: "seven_day_oauth_apps", label: "7-day OAuth apps" },
  ];

  console.log("\n\x1b[1m── Usage Windows ───────────────────────────────────\x1b[0m\n");
  let anyData = false;
  for (const { key, label } of windows) {
    const w = usage[key];
    if (!w || w.utilization == null) continue;
    anyData = true;
    const pct = w.utilization;
    const resets = w.resets_at ? `  resets ${formatDate(w.resets_at)}` : "";
    console.log(`  ${label}  ${bar(pct)} ${String(pct).padStart(3)}%${resets}`);
  }
  if (!anyData) console.log("  No active usage windows found.");

  const ex = usage.extra_usage;
  if (ex) {
    console.log("\n\x1b[1m── Extra Usage ─────────────────────────────────────\x1b[0m");
    const enabled = ex.is_enabled ? "\x1b[32menabled\x1b[0m" : "\x1b[90mdisabled\x1b[0m";
    console.log(`  Status   ${enabled}`);
    if (ex.is_enabled && ex.used_credits != null) {
      console.log(`  Used     ${ex.used_credits} ${ex.currency ?? ""}`);
      if (ex.monthly_limit) console.log(`  Limit    ${ex.monthly_limit} ${ex.currency ?? ""}`);
    }
  }

  console.log("\n\x1b[90m───────────────────────────────────────────────────\x1b[0m\n");
}

main().catch((err) => {
  console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
  process.exit(1);
});
