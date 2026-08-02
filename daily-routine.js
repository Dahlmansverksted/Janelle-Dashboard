(()=>{
'use strict';

const STORAGE_KEY='janelle_daily_routine_custom_v1';
const TIME_ZONE='Asia/Manila';
let state;
let lastDate='';

function localDate(now=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
function blank(){return{date:localDate(),items:[],history:{}}}
function load(){
 try{
  const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY));
  return parsed&&typeof parsed==='object'?parsed:blank();
 }catch{return blank()}
}
function normalize(){
 const today=localDate();
 state=state&&typeof state==='object'?state:load();
 state.items=Array.isArray(state.items)?state.items.filter(x=>x&&x.id&&x.title).map(x=>({...x,done:Boolean(x.done)})):[];
 state.history=state.history&&typeof state.history==='object'?state.history:{};
 if(state.date!==today){
  if(state.date)state.history[state.date]=state.items.filter(x=>x.done).map(x=>x.id);
  state.date=today;
  state.items=state.items.map(x=>({...x,done:false}));
 }
 lastDate=today;
 return state;
}
function save(){normalize();localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}

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
  <div class="daily-routine-v2-date">Resets at midnight · Philippines time</div>`;
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
function render(){
 normalize();ensureLegacyTargets();
 if(!document.getElementById('dailyRoutineV3List')&&!buildWidget())return;
 const list=document.getElementById('dailyRoutineV3List');
 if(!list)return;
 list.innerHTML=state.items.length?state.items.map(item=>`<div class="daily-routine-v3-item ${item.done?'done':''}" data-routine-row="${item.id}"><span class="daily-routine-v3-check" data-routine-toggle="${item.id}">${item.done?'✓':''}</span><span class="daily-routine-v3-title" data-routine-toggle="${item.id}">${escapeHtml(item.title)}</span><button type="button" class="daily-routine-v3-delete" data-routine-delete="${item.id}" aria-label="Delete ${escapeHtml(item.title)}">×</button></div>`).join(''):'<div class="daily-routine-empty">No routines yet. Add the first one above.</div>';
 const done=state.items.filter(x=>x.done).length,total=state.items.length;
 const count=document.getElementById('dailyRoutineV3Count');if(count)count.textContent=`${done}/${total}`;
 const progress=document.getElementById('dailyRoutineV3Progress');if(progress)progress.style.width=total?`${done/total*100}%`:'0%';
 bindForm();
}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function bindForm(){
 const form=document.getElementById('dailyRoutineV3Form');if(!form||form.dataset.bound)return;
 form.dataset.bound='true';
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const input=form.elements.title,title=input.value.trim();if(!title)return;
  state.items.push({id:crypto.randomUUID(),title,done:false});
  input.value='';save();render();input.focus();
 });
}
function toggle(id){const item=state.items.find(x=>x.id===id);if(!item)return;item.done=!item.done;save();render()}
function remove(id){state.items=state.items.filter(x=>x.id!==id);save();render()}

function start(){
 installStyles();ensureLegacyTargets();state=load();normalize();save();render();
 document.addEventListener('click',event=>{
  const del=event.target.closest('[data-routine-delete]');if(del){event.preventDefault();event.stopImmediatePropagation();remove(del.dataset.routineDelete);return}
  const toggleTarget=event.target.closest('[data-routine-toggle]');if(toggleTarget){event.preventDefault();event.stopImmediatePropagation();toggle(toggleTarget.dataset.routineToggle)}
 },true);
 const observer=new MutationObserver(()=>{ensureLegacyTargets();if(!document.getElementById('dailyRoutineV3List'))render()});
 observer.observe(document.body,{childList:true,subtree:true});
 setInterval(()=>{if(localDate()!==lastDate){normalize();save();render()}},10000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){normalize();save();render()}});
 window.addEventListener('focus',()=>{normalize();save();render()});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();