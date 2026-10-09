// sweep: walk onto every dropped item within R blocks (items must be walked over to be picked up)
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const {Movements,goals}=pathfinder; const mv=new Movements(bot); mv.canDig=false; bot.pathfinder.setMovements(mv);
const R=globalThis.R||14, t0=Date.now(); const before=bot.inventory.items().length; let n=0;
while(Date.now()-t0<30000&&!signal.aborted){
  const d=Object.values(bot.entities).filter(e=>e.name==="item"&&e.position.distanceTo(bot.entity.position)<R).sort((a,b)=>a.position.distanceTo(bot.entity.position)-b.position.distanceTo(bot.entity.position))[0];
  if(!d)break; n++;
  bot.pathfinder.setGoal(new goals.GoalNear(d.position.x,d.position.y,d.position.z,0.3)); const t=Date.now();
  while(Date.now()-t<4000&&d.isValid){await sleep(150)}
  bot.pathfinder.setGoal(null);bot.pathfinder.stop();bot.clearControlStates(); await sleep(150);
}
const logs=bot.inventory.items().filter(i=>i.name.endsWith("_log")).reduce((a,i)=>a+i.count,0);
return JSON.stringify({visited:n,logs,left:Object.values(bot.entities).filter(e=>e.name==="item"&&e.position.distanceTo(bot.entity.position)<R).length,pos:bot.entity.position.floored(),inv:bot.inventory.items().map(i=>i.name+i.count)});
