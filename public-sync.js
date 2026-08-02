(()=>{
let lastRemoteUpdate="";
let syncing=false;
let saveTimer=null;
let lastLocalChangeAt=0;

function setStatus(text,state=""){
  const el=document.getElementById("cloudStatus");
  if(!el)return;
  el.textContent=text;
  el.className=`cloud-status ${state}`.trim();
}

function mergeById(local=[],remote=[]){
  const map=new Map();
  [...local,...remote].forEach(item=>{
    if(item&&item.id)map.set(item.id,{...(map.get(item.id)||{}),...item});
  });
  return [...map.values()];
}

function mergeDailyDone(local={},remote={}){
  const merged={...local};
  for(const [date,ids] of Object.entries(remote||{})){
    merged[date]=[...new Set([...(merged[date]||[]),...(ids||[])])];
  }
  return merged;
}

function mergeInitial(local,remote){
  const merged={...local,...remote};
  merged.daily=mergeById(local.daily,remote.daily);
  merged.tasks=mergeById(local.tasks,remote.tasks);
  merged.workouts=mergeById(local.workouts,remote.workouts);
  merged.dates=mergeById(local.dates,remote.dates);
  merged.notes=mergeById(local.notes,remote.notes);
  merged.shoppingLists=mergeById(local.shoppingLists,remote.shoppingLists).map(list=>{
    const a=(local.shoppingLists||[]).find(x=>x.id===list.id);
    const b=(remote.shoppingLists||[]).find(x=>x.id===list.id);
    return {...list,items:mergeById(a?.items||[],b?.items||[])};
  });
  merged.dailyDone=mergeDailyDone(local.dailyDone,remote.dailyDone);
  return migrate(merged);
}

/* The legacy V3 polling loop still calls mergeData. Keep local Daily clicks
   from being replaced by a slightly older server copy. */
if(typeof mergeData==="function"){
  const legacyMergeData=mergeData;
  mergeData=function(local,remote){
    const out=legacyMergeData(local,remote);
    out.dailyDone=mergeDailyDone(local?.dailyDone,remote?.dailyDone);
    return out;
  };
}

async function request(method="GET",body){
  const response=await fetch("/api/state",{
    method,
    headers:{"Content-Type":"application/json"},
    body:body?JSON.stringify(body):undefined,
    cache:"no-store"
  });
  if(response.status===404)return null;
  if(!response.ok)throw new Error(`HTTP_${response.status}`);
  return response.json();
}

async function upload(){
  if(syncing)return;
  syncing=true;
  setStatus("Saving…","syncing");
  try{
    const result=await request("PUT",{data,updatedAt:new Date().toISOString()});
    lastRemoteUpdate=result?.updatedAt||new Date().toISOString();
    setStatus("Shared sync","online");
  }catch(error){
    console.error(error);
    setStatus("Sync failed","error");
  }finally{
    syncing=false;
  }
}

async function pull({initial=false}={}){
  if(syncing)return;
  /* Never let a poll replace a checkbox interaction that is still being saved. */
  if(!initial&&Date.now()-lastLocalChangeAt<1800)return;
  syncing=true;
  try{
    const remote=await request();
    if(!remote?.data){
      syncing=false;
      await upload();
      return;
    }
    if(initial){
      data=mergeInitial(data,remote.data);
      localStorage.setItem(KEY,JSON.stringify(data));
      render();
      lastRemoteUpdate=remote.updatedAt||"";
      syncing=false;
      await upload();
      return;
    }
    if(remote.updatedAt&&remote.updatedAt!==lastRemoteUpdate){
      const next=migrate(remote.data);
      next.dailyDone=mergeDailyDone(data.dailyDone,next.dailyDone);
      data=next;
      localStorage.setItem(KEY,JSON.stringify(data));
      lastRemoteUpdate=remote.updatedAt;
      render();
      if(typeof toast==="function")toast("Updated from shared dashboard");
    }
    setStatus("Shared sync","online");
  }catch(error){
    console.error(error);
    setStatus("Sync failed","error");
  }finally{
    syncing=false;
  }
}

const originalSave=save;
save=function(message){
  lastLocalChangeAt=Date.now();
  localStorage.setItem(KEY,JSON.stringify(data));
  render();
  if(message)toast(message);
  clearTimeout(saveTimer);
  saveTimer=setTimeout(upload,250);
};

const connectButton=document.getElementById("cloudSetup");
if(connectButton)connectButton.remove();
setStatus("Connecting…","syncing");
pull({initial:true});
setInterval(()=>pull(),5000);
window.addEventListener("focus",()=>pull());
window.addEventListener("online",()=>pull());
})();