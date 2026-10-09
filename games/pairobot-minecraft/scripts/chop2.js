// chop2: one log at a time; pathfinder fully stopped before every dig (a live goal aborts digs).
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const {Movements,goals}=pathfinder; const mv=new Movements(bot); mv.canDig=false; mv.maxDropDown=3; bot.pathfinder.setMovements(mv);
const IDS=Object.values(bot.registry.blocksByName).filter(b=>b.name.endsWith("_log")).map(b=>b.id);
const WANT=globalThis.WANT||16, MS=globalThis.MS||50000; const t0=Date.now(); const log=[]; const bad=new Set();
const count=()=>bot.inventory.items().filter(i=>i.name.endsWith("_log")).reduce((a,i)=>a+i.count,0);
const halt=async()=>{bot.pathfinder.setGoal(null);bot.pathfinder.stop();bot.clearControlStates();await sleep(150)};
while(count()<WANT&&Date.now()-t0<MS&&!signal.aborted){
  if(bot.health<6){log.push("low hp");break}
  const me=bot.entity.position;
  const cand=bot.findBlocks({matching:IDS,maxDistance:32,count:80}).filter(v=>!bad.has(v.toString())).sort((a,b)=>a.distanceTo(me)-b.distanceTo(me));
  const v=cand[0]; if(!v){log.push("no logs");break}
  let d=me.distanceTo(v.offset(0.5,0.5,0.5));
  if(d>4){ // approach
    bot.pathfinder.setGoal(new goals.GoalNear(v.x,v.y,v.z,2)); const t=Date.now();
    while(Date.now()-t<7000){await sleep(200); if(bot.entity.position.distanceTo(v.offset(0.5,0.5,0.5))<=4)break}
    await halt(); d=bot.entity.position.distanceTo(v.offset(0.5,0.5,0.5));
    if(d>4.5){bad.add(v.toString());log.push("unreachable "+v+" d"+d.toFixed(1));continue}
  }
  const b=bot.blockAt(v); if(!b||!b.name.endsWith("_log")){continue}
  try{await bot.lookAt(v.offset(0.5,0.5,0.5),true); await bot.dig(b); log.push("dug "+v)}catch(e){bad.add(v.toString());log.push("dig err "+e.message.slice(0,40))}
  await sleep(250);
  const drop=Object.values(bot.entities).find(e=>e.name==="item"&&e.position.distanceTo(bot.entity.position)<7);
  if(drop){bot.pathfinder.setGoal(new goals.GoalNear(drop.position.x,drop.position.y,drop.position.z,0.3)); await sleep(1200); await halt()}
}
await halt();
return JSON.stringify({logs:count(),log:log.slice(-10),pos:bot.entity.position.floored(),hp:bot.health,ms:Date.now()-t0});
