import sys, json, subprocess, datetime, os
seen = os.path.join(os.path.dirname(__file__), "players-seen.md")
for line in sys.stdin:
    try: e = json.loads(line)
    except Exception: continue
    t = e.get("type")
    if t not in ("playerJoined", "playerLeft"): continue
    name = str(e.get("data", {}).get("name", "?"))
    if name == "PaiRobot": continue
    verb = "joined" if t == "playerJoined" else "left"
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    open(seen, "a").write(f"- {ts} {name} {verb}\n")
    subprocess.run([os.path.expanduser("~/.local/bin/mc-post"), f"{name} {verb} the Minecraft server."], stdout=subprocess.DEVNULL)
