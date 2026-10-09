// Fight nearby zombies/skeletons/spiders (never creepers). Run: mc-bot eval PaiRobot "$(cat .runtime/skills/fight.js)" (background).
// Tunables: set globalThis.FIGHT_MS before eval to change the time budget (default 60000).
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const MOB=/^(zombie|husk|drowned|skeleton|stray|spider|cave_spider)$/;
const STOP=Date.now()+(globalThis.FIGHT_MS||60000);
const log=[]; let kills=0; const hp0=bot.health;
const sword=()=>bot.inventory.items().find(i=>/_sword$/.test(i.name));
const eat=async()=>{ if(bot.food<=17){const f=bot.inventory.items().find(i=>/porkchop|beef|mutton|chicken|bread|apple|carrot|potato|cooked/.test(i.name)); if(f){try{await bot.equip(f,"hand");await bot.consume();log.push("ate "+f.name)}catch(e){}}}};
// only mobs >=30 from spawn (never fight/lure near spawn), within 7 blocks vertically (hunt walks to up to 40 below)
const nearest=(r,dy=7)=>Object.values(bot.entities).filter(e=>e!==bot.entity&&MOB.test(e.name||"")&&e.isValid&&e.position.distanceTo(bot.entity.position)<r&&Math.abs(e.position.y-bot.entity.position.y)<=dy&&Math.hypot(e.position.x+32,e.position.z+32)>=30).sort((a,b)=>a.position.distanceTo(bot.entity.position)-b.position.distanceTo(bot.entity.position))[0];
const creeperNear=()=>Object.values(bot.entities).find(e=>e!==bot.entity&&e.name==="creeper"&&e.position.distanceTo(bot.entity.position)<8);
async function runFrom(e,ms){const away=bot.entity.position.minus(e.position); await bot.look(Math.atan2(-away.x,-away.z),0,true); bot.setControlState("forward",true);bot.setControlState("sprint",true);bot.setControlState("jump",true); await sleep(ms); bot.clearControlStates()}
while(Date.now()<STOP&&!signal.aborted){
  const c=creeperNear(); if(c){log.push("run creeper"); await runFrom(c,1500); continue}
  await eat();
  const w=sword(); if(w&&bot.heldItem?.name!==w.name){try{await bot.equip(w,"hand")}catch(e){}}
  let t=nearest(14);
  if(!t){ // hunt: walk toward the nearest mob within 40 (pathfinder, polled)
    const far=nearest(60,40); if(!far){await sleep(500);continue}
    const {goals}=require("mineflayer-pathfinder"); bot.pathfinder.setGoal(new goals.GoalNear(far.position.x,far.position.y,far.position.z,3),true);
    const until=Date.now()+4000; while(Date.now()<until&&!nearest(10)&&!creeperNear())await sleep(200);
    bot.pathfinder.setGoal(null); continue}
  const hpStart=bot.health; let swings=0; const tId=t.id;
  while(t.isValid&&Date.now()<STOP&&!signal.aborted){
    if(creeperNear())break;
    const d=t.position.distanceTo(bot.entity.position);
    await bot.lookAt(t.position.offset(0,t.height*0.85,0),true);
    if(d>3){bot.setControlState("forward",true);bot.setControlState("sprint",d>5);await sleep(120);continue}
    bot.clearControlStates();
    // hit on cooldown, then step back so it cannot trade blows freely
    bot.attack(t); swings++; await sleep(w?650:350);
    if(bot.health<hpStart-6&&!w){bot.setControlState("back",true);await sleep(300);bot.setControlState("back",false)}
    bot.setControlState("jump",true);await sleep(60);bot.setControlState("jump",false);
  }
  bot.clearControlStates();
  if(!t.isValid&&!bot.entities[tId]){kills++; log.push(`kill ${t.name} swings ${swings} hp ${hpStart.toFixed(1)}->${bot.health.toFixed(1)}`)}
  await sleep(700); // collect drops by standing still briefly
}
bot.clearControlStates();
return JSON.stringify({kills,hp0,hp:bot.health,food:bot.food,pos:bot.entity.position.floored(),log:log.slice(-12),inv:bot.inventory.items().map(i=>i.name+i.count)});
