(()=>{
'use strict';

function hidePage(page){
 document.querySelectorAll(`.nav[data-page="${page}"]`).forEach(el=>el.remove());
 const section=document.getElementById(page);
 if(section){section.hidden=true;section.style.display='none';section.setAttribute('aria-hidden','true')}
}

function applyBudgetCurrency(){
 const roots=[document.getElementById('budget'),document.getElementById('budgetModal')].filter(Boolean);
 for(const root of roots){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
   const next=node.nodeValue
    .replace(/Amount \(NOK\)/g,'Amount (PHP)')
    .replace(/\bNOK\b/g,'PHP')
    .replace(/(\d(?:[\d\s.,]*\d|\d)?)\s*kr\b/gi,'₱$1')
    .replace(/\bkr\b/gi,'₱');
   if(next!==node.nodeValue)node.nodeValue=next;
  }
 }
}

function applyJanelleLayout(){
 hidePage('calculator');
 hidePage('statistics');

 document.querySelectorAll('.v8-carousel,#backgroundSlideshow,.bg-overlay').forEach(el=>el.remove());
 document.querySelectorAll('[data-go="calculator"],[data-go="statistics"]').forEach(el=>el.remove());

 const exerciseNav=document.querySelector('.nav[data-page="training"] span');
 if(exerciseNav)exerciseNav.textContent='Exercise';
 const training=document.getElementById('training');
 if(training){
  const eyebrow=training.querySelector('.toolbar small');
  const heading=training.querySelector('.toolbar h2');
  if(eyebrow)eyebrow.textContent='EXERCISE';
  if(heading)heading.textContent='Move your body';
 }

 const hero=document.querySelector('#dashboard .hero h2');
 if(hero)hero.textContent='Welcome Janelle';
 const documentTitle=document.getElementById('title');
 if(documentTitle)documentTitle.textContent='';
 document.title='Janelle Dashboard';

 const brand=document.querySelector('.brand');
 if(brand&&!brand.querySelector('.janelle-monogram'))brand.innerHTML='<div class="janelle-monogram">J</div><span><strong>Janelle</strong><small>My dashboard</small></span>';

 applyBudgetCurrency();
}

function upsertStylesheet(id,href){
 let link=document.getElementById(id);
 if(!link){link=document.createElement('link');link.id=id;link.rel='stylesheet';document.head.appendChild(link)}
 link.href=href;
}

function installTheme(){
 upsertStylesheet('janelle-theme-v2','/janelle-theme-v2.css?v=4');
 upsertStylesheet('janelle-final-fixes','/janelle-final-fixes.css?v=1');
}

installTheme();
applyJanelleLayout();

const observer=new MutationObserver(()=>{
 clearTimeout(window.__janelleLayoutTimer);
 window.__janelleLayoutTimer=setTimeout(applyJanelleLayout,30);
});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});
window.__janelleLayoutObserver=observer;

setTimeout(applyJanelleLayout,250);
setTimeout(applyJanelleLayout,1200);
})();