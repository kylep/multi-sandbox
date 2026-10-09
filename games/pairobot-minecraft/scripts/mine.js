// mine: collect N of a drop by digging nearby blocks. Set globalThis.BLOCKS=["stone"], DROP="cobblestone", WANT, MS before the script.
// Halts the pathfinder before EVERY dig (a live goal aborts digs). Never digs down; avoids blocks with lava/water neighbours.
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const {Movements,goals}=pathfinder; const mv=new Movements(bot); mv.canDig=false; mv.maxDropDown=2; bot.pathfinder.setMovements(mv);
const NAMES=globalThis.BLOCKS||["stone"], DROP=globalThis.DROP||"cobblestone", WANT=globalThis.WANT||64, MS=globalThis.MS||50000, t0=Date.now(); const log=[]; const bad=new Set();
const IDS=NAMES.map(n=>bot.registry.blocksByName[n].id);
const count=()=>bot.inventory.items().filter(i=>i.name===DROP).reduce((a,i)=>a+i.count,0);
const halt=async()=>{bot.pathfinder.setGoal(null);bot.pathfinder.stop();bot.clearControlStates();await sleep(150)};
const unsafe=(v)=>{for(const o of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]]){const n=bot.blockAt(v.offset(...o))?.name; if(n==="lava"||n==="water")return true} return false};
const COVER=['dirt','grass_block','coarse_dirt','podzol','snow','gravel','sand','rooted_dirt','moss_block'];
const capped=(v)=>COVER.includes(bot.blockAt(v.offset(0,1,0))?.name);
const exposed=(v)=>capped(v)||[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]].some(o=>{const n=bot.blockAt(v.offset(...o))?.name;return n==="air"||n==="cave_air"});
const pick=bot.inventory.items().find(i=>/_pickaxe$/.test(i.name)); if(pick) await bot.equip(pick,"hand");
while(count()<WANT&&Date.now()-t0<MS&&!signal.aborted){
  if(bot.health<6){log.push("low hp");break}
  const me=bot.entity.position;
  const v=bot.findBlocks({matching:IDS,maxDistance:30,count:200}).filter(v=>!bad.has(v.toString())&&exposed(v)&&!unsafe(v)&&v.y>=me.y-5&&!(v.x===Math.floor(me.x)&&v.z===Math.floor(me.z)&&v.y<me.y)).sort((a,b)=>a.distanceTo(me)-b.distanceTo(me))[0];
  if(!v){log.push("none exposed");break}
  let d=me.distanceTo(v.offset(0.5,0.5,0.5));
  if(d>4){bot.pathfinder.setGoal(new goals.GoalNear(v.x,v.y,v.z,2));const t=Date.now();while(Date.now()-t<7000){await sleep(200);if(bot.entity.position.distanceTo(v.offset(0.5,0.5,0.5))<=4)break}await halt();d=bot.entity.position.distanceTo(v.offset(0.5,0.5,0.5)); if(d>4.5){bad.add(v.toString());log.push("unreachable "+v);continue}}
  const cap=bot.blockAt(v.offset(0,1,0)); if(cap&&COVER.includes(cap.name)&&bot.entity.position.distanceTo(cap.position.offset(0.5,0.5,0.5))<=4.8){try{await bot.lookAt(cap.position.offset(0.5,0.5,0.5),true);await bot.dig(cap);log.push('cap '+cap.position);await sleep(150)}catch(e){log.push('cap err');bad.add(v.toString());continue}}
  const b=bot.blockAt(v); if(!b||!NAMES.includes(b.name))continue;
  try{await bot.lookAt(v.offset(0.5,0.5,0.5),true);await bot.dig(b);log.push("dug "+v)}catch(e){bad.add(v.toString());log.push("dig err "+e.message.slice(0,40))}
  await sleep(200);
  const drop=Object.values(bot.entities).find(e=>e.name==="item"&&e.position.distanceTo(bot.entity.position)<7);
  if(drop){bot.pathfinder.setGoal(new goals.GoalNear(drop.position.x,drop.position.y,drop.position.z,0.3));await sleep(1000);await halt()}
}
await halt();
return JSON.stringify({[DROP]:count(),log:log.slice(-6),pos:bot.entity.position.floored(),hp:bot.health,ms:Date.now()-t0});
