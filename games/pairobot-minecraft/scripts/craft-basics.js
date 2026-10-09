// logs -> planks -> crafting table (placed) -> sticks -> wooden sword + pickaxe
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const log=[];
const id=n=>bot.registry.itemsByName[n].id;
const have=n=>bot.inventory.items().filter(i=>i.name===n).reduce((a,i)=>a+i.count,0);
async function craft(name,count,table){
  const rs=bot.recipesFor(id(name),null,1,table||null);
  if(!rs.length){log.push("no recipe "+name);return false}
  try{await bot.craft(rs[0],count,table||undefined);log.push("crafted "+name+" x"+count);return true}catch(e){log.push("craft err "+name+" "+e.message);return false}
}
// planks from every log type we hold
for(const it of bot.inventory.items().filter(i=>i.name.endsWith("_log"))){
  const plank=it.name.replace("_log","_planks"); if(bot.registry.itemsByName[plank]) await craft(plank,it.count);
}
const planks=bot.inventory.items().find(i=>i.name.endsWith("_planks"));
// place crafting table on the ground next to us
let table=bot.findBlock({matching:bot.registry.blocksByName.crafting_table.id,maxDistance:4});
if(!table){
  if(!have("crafting_table")) await craft("crafting_table",1);
  const t=bot.inventory.items().find(i=>i.name==="crafting_table");
  if(t){ await bot.equip(t,"hand");
    const me=bot.entity.position.floored(); let placed=false;
    const spots=[]; for(const dy of [0,-1,1]) for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1],[2,0],[-2,0],[0,2],[0,-2]]) spots.push([dx,dz,dy]);
    for(const [dx,dz,dy] of spots){
      const ref=bot.blockAt(me.offset(dx,dy-1,dz)), a1=bot.blockAt(me.offset(dx,dy,dz)), a2=bot.blockAt(me.offset(dx,dy+1,dz));
      if(ref&&ref.boundingBox==="block"&&a1&&a1.name==="air"&&a2&&a2.name==="air"){
        try{await bot.lookAt(ref.position.offset(0.5,1,0.5),true); await bot.placeBlock(ref,{x:0,y:1,z:0}); log.push("placed table on "+ref.position); placed=true; break}catch(e){log.push("place err "+e.message)}
      }
    }
    if(!placed) log.push("no spot for table");
    await sleep(500); table=bot.findBlock({matching:bot.registry.blocksByName.crafting_table.id,maxDistance:5});
  }
}
if(have("stick")<3) await craft("stick",1);
if(table){ if(!have("wooden_sword")) await craft("wooden_sword",1,table); if(!have("wooden_pickaxe")) await craft("wooden_pickaxe",1,table); }
return JSON.stringify({log,inv:bot.inventory.items().map(i=>i.name+i.count),table:table?.position,hp:bot.health});
