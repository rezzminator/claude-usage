# claude-gauge

> A Claude Code skill that shows your plan usage limits — reads straight from macOS Keychain, no browser required.

```
── Claude Plan Usage ──────────────────────────────
  Plan    max
  Tier    default_claude_max_20x
  Token   expires May 3, 08:27 AM

── Usage Windows ───────────────────────────────────

  5-hour window    ████░░░░░░░░░░░░░░░░░░░░░░░░  17%  resets May 3, 03:50 AM
  7-day overall    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░   5%  resets May 8, 08:00 AM
  7-day Sonnet     █░░░░░░░░░░░░░░░░░░░░░░░░░░░░   2%  resets May 8, 08:00 AM

── Extra Usage ─────────────────────────────────────
  Status   disabled

───────────────────────────────────────────────────
```

## How it works

Claude Code stores your OAuth session in the macOS Keychain under `Claude Code-credentials`. This skill reads that token using the native `security` CLI (no new permissions required) and calls `api.anthropic.com/api/oauth/usage` — the same endpoint the built-in `/usage` command uses internally.

No new auth. No stored credentials. No external services. Just what Claude Code already has on your machine.

## Requirements

- macOS (uses Keychain via `security` CLI)
- Node.js 18+ (uses native `fetch`)
- An active Claude Code OAuth session (Max or Pro plan)

## Install

Run this from the root of any Claude Code project:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/mreza0100/claude-gauge/main/install.sh)
```

Or manually:

```bash
mkdir -p .claude/skills/claude-gauge
curl -fsSL https://raw.githubusercontent.com/mreza0100/claude-gauge/main/SKILL.md  -o .claude/skills/claude-gauge/SKILL.md
curl -fsSL https://raw.githubusercontent.com/mreza0100/claude-gauge/main/usage.mjs -o .claude/skills/claude-gauge/usage.mjs
```

## Usage

After installing, just ask Claude:

> "how much of my limit is left?"
> "check my usage"
> "am I close to the limit?"

Claude will invoke the skill and run `usage.mjs` in your project.

Or run it directly anytime:

```bash
node .claude/skills/claude-gauge/usage.mjs
```

## Usage windows explained

| Window | Description |
|--------|-------------|
| **5-hour window** | Rolling 5-hour consumption — most relevant for your current session |
| **7-day overall** | Rolling 7-day total across all models |
| **7-day Sonnet** | Sonnet-specific rolling usage |
| **7-day Opus** | Opus-specific rolling usage |
| **Extra usage** | Pay-as-you-go overage (if enabled on your plan) |

Bars turn **yellow** at 70% and **red** at 90%.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Keychain read failed` | Open Claude Code and log in — no OAuth session found |
| `API error 401` | Token expired — open Claude Code to refresh |
| `API error 403` | Account doesn't support this endpoint (API-key-only accounts) |
| `fetch is not defined` | Upgrade to Node.js 18+ |

## How it's built

The implementation reverse-engineered from [OpenClaude](https://github.com/gitlawb/openclaude)'s `/usage` command:

1. `security find-generic-password -a "$USER" -w -s "Claude Code-credentials"` → JSON blob
2. Extract `claudeAiOauth.accessToken`
3. `GET https://api.anthropic.com/api/oauth/usage` with `Authorization: Bearer <token>` and `anthropic-beta: oauth-2025-04-20`
4. Render the response

## License

MIT
