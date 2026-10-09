# PaiRobot: Claude Code plays Minecraft (experiment)

Scripts, Claude skills and the loop plan for an AI-driven Minecraft bot (mineflayer, Minecraft Java 26.3), driven by Claude Code through the `mc-bot` CLI of [domdomegg/claude-code-plays-minecraft](https://github.com/domdomegg/claude-code-plays-minecraft) (MIT) with local hardening. Status notes and lessons live on the agent-platform wiki page `personas-play-minecraft`.

- `scripts/`: eval snippets run with `mc-bot eval PaiRobot "$(cat scripts/<file>.js)"` (chop2 = wood, mine = stone/coal, sweep = pick up drops, craft-basics = planks/table/tools, fight, guard).
- `claude-skills/`: `mc-basics` and `mc-safety` (Claude Code skills: gotchas, safety rules).
- `plans/`: the `/loop` plan the orchestrator follows.
- `bin/`: `mc-post` (post to a Discord channel with a bot token read from a local file) and `join-watch.py` (announce player joins).

Private values (server host/port, chat allowlist, Discord channel id) are NOT in this repo: they live in the harness's gitignored `.runtime/notes/private.env` (`MC_HOST`, `MC_PORT`, `MC_ALLOW`, `MC_DISCORD_CHANNEL`). The Discord bot token is a mode-600 file under `~/.config/`.

Key gotchas: non-ops cannot build within 16 blocks of world spawn (server silently ignores it); a live pathfinder goal aborts digs, so halt it before every dig; `pathfinder.goto()` fails here, use `setGoal` and poll; scripts must be idempotent.
