(()=>{
'use strict';

const LEGACY_STORAGE_KEY='janelle_daily_routine_custom_v1';
const SHARED_KEY='sharedDailyRoutine';
const TIME_ZONE='Asia/Manila';
let lastDate='';
let lastSignature='';
let persistTimer=null;

function localDate(now=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
function blank(){return{date:localDate(),items:[],history:{},updatedAt:''}}
function readLegacy(){
 try{
  const parsed=JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
  return parsed&&typeof parsed==='object'?parsed:null;
 }catch{return null}
}
function sharedState(){
 if(typeof data!=='object'||!data)return blank();
 if(!data[SHARED_KEY]||typeof data[SHARED_KEY]!=='object'){
  const legacy=readLegacy();
  data[SHARED_KEY]=legacy&&Array.isArray(legacy.items)&&legacy.items.length?legacy:blank();
 }
 return data[SHARED_KEY];
}
function normalize(){
 const state=sharedState();
 const today=localDate();
 state.items=Array.isArray(state.items)?state.items.filter(x=>x&&x.id&&x.title).map(x=>({...x,done:Boolean(x.done)})):[];
 state.history=state.history&&typeof state.history==='object'?state.history:{};
 if(state.date!==today){
  if(state.date)state.history[state.date]=state.items.filter(x=>x.done).map(x=>x.id);
  state.date=today;
  state.items=state.items.map(x=>({...x,done:false}));
  state.updatedAt=new Date().toISOString();
 }
 lastDate=today;
 data[SHARED_KEY]=state;
 return state;
}
function signature(){
 try{return JSON.stringify(sharedState())}catch{return''}
}
function persist(message='Daily routine updated'){
 const state=normalize();
 state.updatedAt=new Date().toISOString();
 data[SHARED_KEY]=state;
 try{localStorage.setItem(LEGACY_STORAGE_KEY,JSON.stringify(state))}catch{}
 clearTimeout(persistTimer);
 persistTimer=setTimeout(()=>{
  try{
   if(typeof save==='function')save(message);
   else localStorage.setItem(typeof KEY==='string'?KEY:'janelle_dashboard_v1',JSON.stringify(data));
  }catch(error){console.warn('Daily routine sync save failed',error)}
 },40);
 lastSignature=signature();
}

function ensureLegacyTargets(){
 for(const [id,tag] of [['dailyList','div'],['dailyProgress','i']]){
  const existing=document.getElementById(id);
  if(existing&&existing.dataset.legacyDaily==='true')continue;
  if(existing)existing.removeAttribute('id');
  const hidden=document.createElement(tag);hidden.id=id;hidden.hidden=true;hidden.dataset.legacyDaily='true';hidden.setAttribute('aria-hidden','true');document.body.appendChild(hidden);
 }
}
function findCard(){
 return document.querySelector('.daily-routine-v3-card')||[...document.querySelectorAll('#dashboard article.card')].find(card=>card.querySelector('h3')?.textContent.trim().toLowerCase().includes('daily'));
}
function buildWidget(){
 const card=findCard();if(!card)return false;
 card.classList.add('daily-routine-v3-card');
 card.innerHTML=`
  <div class="head"><div><small>ROUTINE</small><h3>Daily Routine</h3></div><b id="dailyRoutineV3Count" class="daily-routine-count">0/0</b></div>
  <div class="daily-routine-v3-progress"><i id="dailyRoutineV3Progress"></i></div>
  <form id="dailyRoutineV3Form" class="daily-routine-v3-add">
   <input name="title" maxlength="80" placeholder="Add a new routine…" autocomplete="off" required>
   <button class="primary" type="submit">Add routine</button>
  </form>
  <div id="dailyRoutineV3List"></div>
  <div class="daily-routine-v2-date">Shared across devices · Resets at midnight Philippines time</div>`;
 return true;
}
function installStyles(){
 if(document.getElementById('daily-routine-v3-style'))return;
 const s=document.createElement('style');s.id='daily-routine-v3-style';s.textContent=`
 .daily-routine-v3-progress{height:8px;border-radius:999px;overflow:hidden;margin:4px 0 14px;padding:2px}
 .daily-routine-v3-progress i{display:block;height:100%;width:0;border-radius:999px;transition:width .18s ease}
 #dailyRoutineV3List{display:grid;gap:9px}
 .daily-routine-v3-item{width:100%;display:flex;align-items:center;gap:11px;padding:11px 12px;border:1px solid;border-radius:14px;text-align:left;cursor:pointer;touch-action:manipulation}
 .daily-routine-v3-check{width:22px;height:22px;border:1px solid;border-radius:8px;display:grid;place-items:center;flex:0 0 22px;font-weight:700}
 .daily-routine-v3-title{flex:1;min-width:0}
 .daily-routine-v3-item.done .daily-routine-v3-title{text-decoration:line-through;opacity:.62}
 `;document.head.appendChild(s);
}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]))}
function render(){
 const state=normalize();ensureLegacyTargets();
 if(!document.getElementById('dailyRoutineV3List')&&!buildWidget())return;
 const list=document.getElementById('dailyRoutineV3List');if(!list)return;
 list.innerHTML=state.items.length?state.items.map(item=>`<div class="daily-routine-v3-item ${item.done?'done':''}" data-routine-row="${item.id}"><span class="daily-routine-v3-check" data-routine-toggle="${item.id}">${item.done?'✓':''}</span><span class="daily-routine-v3-title" data-routine-toggle="${item.id}">${escapeHtml(item.title)}</span><button type="button" class="daily-routine-v3-delete" data-routine-delete="${item.id}" aria-label="Delete ${escapeHtml(item.title)}">×</button></div>`).join(''):'<div class="daily-routine-empty">No routines yet. Add the first one above.</div>';
 const done=state.items.filter(x=>x.done).length,total=state.items.length;
 const count=document.getElementById('dailyRoutineV3Count');if(count)count.textContent=`${done}/${total}`;
 const progress=document.getElementById('dailyRoutineV3Progress');if(progress)progress.style.width=total?`${done/total*100}%`:'0%';
 bindForm();lastSignature=signature();
}
function bindForm(){
 const form=document.getElementById('dailyRoutineV3Form');if(!form||form.dataset.bound)return;
 form.dataset.bound='true';
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const input=form.elements.title,title=input.value.trim();if(!title)return;
  const state=normalize();state.items.push({id:crypto.randomUUID(),title,done:false});
  input.value='';persist('Routine added');render();input.focus();
 });
}
function toggle(id){const state=normalize(),item=state.items.find(x=>x.id===id);if(!item)return;item.done=!item.done;persist();render()}
function remove(id){const state=normalize();state.items=state.items.filter(x=>x.id!==id);persist('Routine deleted');render()}

function start(){
 installStyles();ensureLegacyTargets();
 const hadShared=typeof data==='object'&&data&&data[SHARED_KEY];
 normalize();
 if(!hadShared&&readLegacy()?.items?.length)persist('Daily routine migrated');
 else lastSignature=signature();
 render();
 document.addEventListener('click',event=>{
  const del=event.target.closest('[data-routine-delete]');if(del){event.preventDefault();event.stopImmediatePropagation();remove(del.dataset.routineDelete);return}
  const target=event.target.closest('[data-routine-toggle]');if(target){event.preventDefault();event.stopImmediatePropagation();toggle(target.dataset.routineToggle)}
 },true);
 const observer=new MutationObserver(()=>{ensureLegacyTargets();if(!document.getElementById('dailyRoutineV3List'))render()});
 observer.observe(document.body,{childList:true,subtree:true});
 setInterval(()=>{
  if(localDate()!==lastDate){normalize();persist('Daily routine reset');render();return}
  const next=signature();if(next!==lastSignature)render();
 },1000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
 window.addEventListener('focus',render);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();