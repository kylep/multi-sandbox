// Danger watchdog. Run via: mc-bot eval PaiRobot "$(cat .runtime/skills/guard.js)" (background, long-lived)
// Flees from creepers/hostiles and logs hurt events. Stops itself after 10 min or on signal abort.
const sleep = ms => new Promise(r => setTimeout(r, ms));
const HOSTILE = /zombie|skeleton|creeper|spider|witch|pillager|vindicator|phantom|drowned|husk|stray|slime|evoker|ravager|bogged|breeze/;
const log = [];
const t0 = Date.now();
async function flee(from) {
  const me = bot.entity.position;
  const away = me.minus(from.position); away.y = 0;
  const yaw = Math.atan2(-away.x, -away.z);
  await bot.look(yaw, 0, true);
  bot.setControlState('forward', true); bot.setControlState('sprint', true); bot.setControlState('jump', true);
  await sleep(1500);
  bot.clearControlStates();
}
while (Date.now() - t0 < 600000 && !signal.aborted) {
  const me = bot.entity.position;
  const near = Object.values(bot.entities)
    .filter(e => e !== bot.entity && HOSTILE.test(e.name || '') && e.position.distanceTo(me) < 12)
    .sort((a, b) => a.position.distanceTo(me) - b.position.distanceTo(me));
  const creeper = near.find(e => e.name === 'creeper' && e.position.distanceTo(me) < 8);
  if (creeper) { log.push('flee creeper'); await flee(creeper); continue; }
  if (bot.health < 10 && near[0]) { log.push('flee ' + near[0].name + ' hp ' + bot.health); await flee(near[0]); continue; }
  await sleep(250);
}
return JSON.stringify({log: log.slice(-20), hp: bot.health});
