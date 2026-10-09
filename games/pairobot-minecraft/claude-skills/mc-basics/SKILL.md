---
name: mc-basics
description: Use when controlling the Minecraft bot with mc-bot eval: starting/reconnecting, centering on blocks, safe pathfinding with timeouts, digging, and diagnosing a stuck or rubber-banding bot.
---

# Minecraft bot basics (mineflayer via mc-bot)

## Start / reconnect
- Start: `. .runtime/notes/private.env; MC_ALLOW="$MC_ALLOW" mc-bot start PaiRobot --host $MC_HOST --port $MC_PORT --auth microsoft` (cached Microsoft login, no prompt). `MC_ALLOW` is read at start; changing it needs a restart.
- Reconnect when the bot is stuck/hovering/rubber-banding: `mc-bot stop PaiRobot` then start. It clears client/server block desync.
- The join/leave watcher (posts to Discord) dies when the bot restarts: relaunch `mc-bot tail PaiRobot | python3 .runtime/notes/join-watch.py`.
- Post updates to Discord #minecraft with `mc-post "text"` (never print the token file).

## Diagnosing "stuck"
- Many `forcedMove` events + server resending `position` teleports each tick = client believes a block is air that the server has solid (or vice versa). Reconnect.
- `blockAt(pos.offset(0,-1,0))` lies when the bot straddles two blocks (x or z on a .0 boundary). Center first: walk to (floor(x)+0.5, floor(z)+0.5).

## Pathfinder
- ALWAYS race `pathfinder.goto(...)` against a timeout and call `pathfinder.stop()` after. Without it a failed goto hangs for minutes.
- Never run a manual dig loop while a goto is still active; stop it first.
- `canDig=false` + default drop height cannot leave a tall canopy ("No path to the goal!"). Walk off an edge with forward+jump held instead, mind fall damage (checks in mc-safety).

## Digging / placing
- `bot.dig(block)` resolves even when the server ignored it (spawn protection). Verify with the server's truth: after a reconnect or a `blockUpdate` for that position, or check inventory delta.
- Mineflayer finish-dig status for 26.3 is 3 (action enum gained change_destroy_direction); unverified until tested outside spawn protection.
- Items must be walked over to be picked up; wait ~1s.

## Verify everything
Every script should end with `return JSON.stringify({...})` including position, health, onGround, and what changed.

## Lessons from the first run (see wiki 'Lessons: the crafting table incident')
- `pathfinder.goto()` fails instantly here ("Path was stopped..."). Use `setGoal(goal)` + poll distance with a timeout, then `setGoal(null)`. Reference: `.runtime/skills/chop.js` (`goto` helper).
- Digging works outside spawn protection with the default finish-dig status; spawn protection was the real blocker earlier.
- Do not `placeBlock` into the cell you stand in; use a neighbor with 2 air blocks above (see `.runtime/skills/craft-basics.js`).
- Scripts must be idempotent: check `have(item)` before each craft; a re-run once made a 2nd crafting table and ate all the planks.
- Use `findBlocks({matching: idList})` not a `matching` callback that reads `block.position` (it is null there).
- Never send eval output to /dev/null; run evals with output going to a file so failures are debuggable.
- Reusable scripts: `.runtime/skills/{chop,craft-basics,guard}.js` (run: `mc-bot eval PaiRobot "$(cat file)"`, in background).
