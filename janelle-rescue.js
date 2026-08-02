(()=>{
'use strict';

const TARGETS={
 dailyList:'div',dailyProgress:'i',dailyCount:'span',openCount:'span',priority:'div',
 dateList:'div',nextDate:'div',nextCountdown:'div',homeDaysSince:'div',
 totalWorkouts:'b',monthWorkouts:'b',monthCount:'b',latestWeight:'b',workoutList:'div',
 chartExercise:'select',exerciseChart:'canvas',homeProgressChart:'canvas',
 shoppingLists:'div',noteList:'div',incomeTotal:'b',expenseTotal:'b',budgetBalance:'b',budgetList:'div',
 statisticsGrid:'div',habitStats:'div',snusDays:'b',snusSince:'p',today:'p',title:'h1',
 cloudStatus:'span',toast:'div',cutList:'div',exerciseRows:'div'
};

function makeTarget(id,tag){
 const el=document.createElement(tag||'div');
 el.id=id;
 el.hidden=true;
 el.setAttribute('aria-hidden','true');
 el.dataset.janelleCompat='true';
 if(tag==='canvas'){el.width=2;el.height=2}
 document.body.appendChild(el);
 return el;
}

function ensureTargets(){
 for(const [id,tag] of Object.entries(TARGETS)){
  if(!document.getElementById(id))makeTarget(id,tag);
 }
}

function revealActivePage(){
 const activeNav=document.querySelector('aside .nav.active[data-page]');
 const pageId=activeNav?.dataset.page||'dashboard';
 const page=document.getElementById(pageId);
 if(page){
  document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el===page));
  page.style.removeProperty('display');
  page.hidden=false;
 }
}

function safeRender(){
 ensureTargets();
 try{if(typeof window.render==='function')window.render()}catch(error){console.warn('Janelle rescue render:',error)}
 try{if(typeof window.apply==='function')window.apply()}catch(error){console.warn('Janelle rescue apply:',error)}
 revealActivePage();
}

ensureTargets();
const observer=new MutationObserver(()=>ensureTargets());
observer.observe(document.documentElement,{childList:true,subtree:true});
window.__janelleRescueObserver=observer;

window.addEventListener('error',event=>{
 const message=String(event?.error?.message||event?.message||'');
 if(message.includes('null')||message.includes('undefined'))setTimeout(safeRender,0);
});

setTimeout(safeRender,40);
setTimeout(safeRender,350);
setTimeout(safeRender,1200);
})();
