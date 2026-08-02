(()=>{
'use strict';

const STORAGE_KEY='janelle_daily_routine_manila_v1';
const OSLO_TZ='Asia/Manila';
const ITEMS=[
 {id:'brush-teeth',title:'Brush teeth'},
 {id:'tell-janelle',title:'Tell Janelle she is beautiful'},
 {id:'eat-protein',title:'Eat enough protein'},
 {id:'exercise',title:'Exercise'},
 {id:'productive',title:'Do something productive'},
 {id:'wash-face',title:'Wash face'}
];
let state;
let lastDate='';
let locked=false;

function osloDate(now=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:OSLO_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
function blank(date=osloDate()){return{date,done:[],history:{}}}
function load(){
 try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));return x&&typeof x==='object'?x:blank()}
 catch{return blank()}
}
function normalize(){
 const today=osloDate();
 state=state&&typeof state==='object'?state:load();
 state.done=Array.isArray(state.done)?[...new Set(state.done.filter(id=>ITEMS.some(x=>x.id===id)))]:[];
 state.history=state.history&&typeof state.history==='object'?state.history:{};
 if(state.date!==today){
  if(state.date)state.history[state.date]=[...state.done];
  state.date=today;
  state.done=[];
 }
 lastDate=today;
 return state;
}
function store(){normalize();localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function ensureLegacyTargets(){
 const ids=['dailyList','dailyProgress'];
 for(const id of ids){
  const existing=document.getElementById(id);
  if(existing&&existing.dataset.dailyLegacyTarget==='true')continue;
  if(existing)existing.removeAttribute('id');
  const target=document.createElement(id==='dailyProgress'?'i':'div');
  target.id=id;target.hidden=true;target.dataset.dailyLegacyTarget='true';target.setAttribute('aria-hidden','true');
  document.body.appendChild(target);
 }
}
function buildWidget(){
 const legacyProgress=document.querySelector('#dashboard .progress');
 const card=legacyProgress?.closest('article.card')||[...document.querySelectorAll('#dashboard article.card')].find(x=>x.querySelector('h3')?.textContent.trim()==='Daily');
 if(!card)return false;
 card.classList.add('daily-routine-v2-card');
 const head=card.querySelector(':scope>.head');
 card.innerHTML='';
 if(head){
  const copy=head.cloneNode(true);
  const small=copy.querySelector('small');if(small)small.textContent='ROUTINE';
  const title=copy.querySelector('h3');if(title)title.textContent='Daily Routine';
  card.appendChild(copy);
 }else card.insertAdjacentHTML('beforeend','<div class="head"><div><small>ROUTINE</small><h3>Daily Routine</h3></div><b id="dailyRoutineV2Count">0/6</b></div>');
 if(!card.querySelector('#dailyRoutineV2Count'))card.querySelector('.head')?.insertAdjacentHTML('beforeend','<b id="dailyRoutineV2Count" class="daily-routine-count">0/6</b>');
 card.insertAdjacentHTML('beforeend','<div class="daily-routine-v2-progress"><i id="dailyRoutineV2Progress"></i></div><div id="dailyRoutineV2List" class="daily-routine-v2-list"></div><div class="daily-routine-v2-date">Resets at midnight · Philippines time</div>');
 return true;
}
function installStyles(){
 if(document.getElementById('daily-routine-v2-style'))return;
 const s=document.createElement('style');s.id='daily-routine-v2-style';s.textContent=`
 .daily-routine-v2-card{min-height:0!important}
 .daily-routine-count{color:var(--oak);font-size:13px;font-weight:500}
 .daily-routine-v2-progress{height:8px;border-radius:999px;background:rgba(247,243,238,.08);overflow:hidden;margin:4px 0 14px;padding:2px}
 .daily-routine-v2-progress>i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--walnut),var(--oak));transition:width .18s ease}
 .daily-routine-v2-list{display:grid;gap:9px}
 .daily-routine-v2-item{appearance:none;-webkit-appearance:none;width:100%;display:grid;grid-template-columns:22px minmax(0,1fr);align-items:center;gap:11px;padding:12px;border:1px solid rgba(216,176,139,.14);border-radius:12px;background:rgba(247,243,238,.035);color:var(--text);font:inherit;text-align:left;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-tap-highlight-color:transparent}
 .daily-routine-v2-item:hover{border-color:rgba(216,176,139,.34);background:rgba(247,243,238,.065)}
 .daily-routine-v2-item:active{transform:scale(.992)}
 .daily-routine-v2-box{width:21px;height:21px;border:1px solid rgba(247,243,238,.34);border-radius:7px;display:grid;place-items:center;color:#17120f;font-size:13px;font-weight:700}
 .daily-routine-v2-item.done{color:var(--muted)}
 .daily-routine-v2-item.done .daily-routine-v2-box{background:var(--oak);border-color:var(--oak)}
 .daily-routine-v2-item.done .daily-routine-v2-title{text-decoration:line-through}
 .daily-routine-v2-date{margin-top:11px;color:var(--muted);font-size:10px;letter-spacing:.08em;text-transform:uppercase}
 `;document.head.appendChild(s);
}
function updateButton(button,done){
 button.classList.toggle('done',done);
 button.setAttribute('aria-pressed',String(done));
 const box=button.querySelector('.daily-routine-v2-box');if(box)box.textContent=done?'✓':'';
}
function updateSummary(){
 const count=state.done.length;
 const counter=document.getElementById('dailyRoutineV2Count');if(counter)counter.textContent=`${count}/${ITEMS.length}`;
 const bar=document.getElementById('dailyRoutineV2Progress');if(bar)bar.style.width=`${count/ITEMS.length*100}%`;
}
function render(){
 normalize();
 if(!document.getElementById('dailyRoutineV2List')){if(!buildWidget())return}
 const list=document.getElementById('dailyRoutineV2List');
 const done=new Set(state.done);
 list.innerHTML=ITEMS.map(item=>`<button type="button" class="daily-routine-v2-item ${done.has(item.id)?'done':''}" data-daily-routine-v2="${item.id}" aria-pressed="${done.has(item.id)}"><span class="daily-routine-v2-box">${done.has(item.id)?'✓':''}</span><span class="daily-routine-v2-title">${item.title}</span></button>`).join('');
 updateSummary();
}
function toggle(button){
 if(locked)return;
 locked=true;
 const id=button.dataset.dailyRoutineV2;
 normalize();
 const done=new Set(state.done);
 done.has(id)?done.delete(id):done.add(id);
 state.done=[...done];
 const isDone=done.has(id);
 updateButton(button,isDone);
 updateSummary();
 store();
 setTimeout(()=>{locked=false},80);
}
function start(){
 installStyles();
 ensureLegacyTargets();
 state=load();normalize();store();
 render();
 document.addEventListener('pointerup',event=>{
  const button=event.target.closest('[data-daily-routine-v2]');
  if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();toggle(button);
 },true);
 document.addEventListener('keydown',event=>{
  const button=event.target.closest('[data-daily-routine-v2]');
  if(!button||!['Enter',' '].includes(event.key))return;
  event.preventDefault();event.stopImmediatePropagation();toggle(button);
 },true);
 const observer=new MutationObserver(()=>{
  ensureLegacyTargets();
  if(!document.getElementById('dailyRoutineV2List'))render();
 });
 observer.observe(document.body,{childList:true,subtree:true});
 setInterval(()=>{if(osloDate()!==lastDate){normalize();store();render()}},10000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){normalize();store();render()}});
 window.addEventListener('focus',()=>{normalize();store();render()});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
