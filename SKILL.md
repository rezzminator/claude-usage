# claude-gauge — Claude Plan Usage Skill

A Claude Code skill that reads your Claude plan usage directly from macOS Keychain and displays it in the terminal — no browser, no settings panel, no copy-pasting tokens.

## When to invoke

Load this skill when the user asks any of the following:
- "how much of my limit is left?"
- "check my usage"
- "how much context do I have left?"
- "am I close to the limit?"
- `/gauge`, `/usage`, or any variation

## How it works

Run the script located at `.claude/skills/claude-gauge/usage.mjs`:

```bash
node .claude/skills/claude-gauge/usage.mjs
```

Then present the output to the user. Do not paraphrase — the script output is already formatted for the user.

## Platform requirement

macOS only. The script uses the `security` CLI to read from the macOS Keychain where Claude Code stores OAuth credentials. It will fail gracefully on other platforms with a clear error message.

## What the output means

| Window | What it tracks |
|--------|---------------|
| 5-hour window | Rolling 5-hour token consumption (most relevant for current session) |
| 7-day overall | Rolling 7-day total across all models |
| 7-day Sonnet | Sonnet-specific 7-day usage |
| 7-day Opus | Opus-specific 7-day usage |
| Extra usage | Whether pay-as-you-go overage is enabled and how much has been used |

Bars turn **yellow** at 70% and **red** at 90%.

## Errors

| Error | Meaning |
|-------|---------|
| `Keychain read failed` | No Claude OAuth session found — open Claude Code and log in |
| `API error 401` | Token expired — open Claude Code to refresh it |
| `API error 403` | Account doesn't support this endpoint (API-key-only accounts) |
