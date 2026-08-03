(()=>{
'use strict';

function hidePage(page){
 document.querySelectorAll(`.nav[data-page="${page}"]`).forEach(el=>el.remove());
 const section=document.getElementById(page);
 if(section){section.hidden=true;section.style.display='none';section.setAttribute('aria-hidden','true')}
}

function ensureHiddenTarget(id,tag='div'){
 let el=document.getElementById(id);
 if(el)return el;
 el=document.createElement(tag);el.id=id;el.hidden=true;el.setAttribute('aria-hidden','true');el.dataset.compatTarget='true';document.body.appendChild(el);return el;
}

function removeSnusWidget(){
 const card=document.querySelector('#dashboard .card.snus');
 if(card)card.remove();
 ensureHiddenTarget('snusDays','span');
 ensureHiddenTarget('snusSince','span');
 ensureHiddenTarget('resetSnus','button');
}

function applyBudgetCurrency(){
 const roots=[document.getElementById('budget'),document.getElementById('budgetModal')].filter(Boolean);
 for(const root of roots){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
   const next=node.nodeValue.replace(/Amount \(NOK\)/g,'Amount (PHP)').replace(/\bNOK\b/g,'PHP').replace(/(\d(?:[\d\s.,]*\d|\d)?)\s*kr\b/gi,'₱$1').replace(/\bkr\b/gi,'₱');
   if(next!==node.nodeValue)node.nodeValue=next;
  }
 }
}

function setMenuOpen(open){
 const button=document.getElementById('v8MenuBtn');
 const menu=document.getElementById('v8MobileMenu');
 if(!button||!menu)return;
 menu.classList.toggle('open',open);
 menu.style.setProperty('display',open?'grid':'none','important');
 menu.style.setProperty('visibility',open?'visible':'hidden','important');
 menu.style.setProperty('opacity',open?'1':'0','important');
 menu.style.setProperty('pointer-events',open?'auto':'none','important');
 button.textContent=open?'×':'☰';
 button.setAttribute('aria-expanded',String(open));
 button.setAttribute('aria-label',open?'Close navigation':'Open navigation');
 if(open)menu.scrollTop=0;
}

function installGlobalMenuHandler(){
 if(window.__janelleGlobalMenuHandler)return;
 window.__janelleGlobalMenuHandler=true;
 let lastPointerToggle=0;
 document.addEventListener('pointerup',event=>{
  const trigger=event.target.closest?.('#v8MenuBtn');
  if(!trigger)return;
  event.preventDefault();event.stopImmediatePropagation();
  lastPointerToggle=Date.now();
  const menu=document.getElementById('v8MobileMenu');
  setMenuOpen(!menu?.classList.contains('open'));
 },true);
 document.addEventListener('click',event=>{
  const trigger=event.target.closest?.('#v8MenuBtn');
  if(trigger){
   event.preventDefault();event.stopImmediatePropagation();
   if(Date.now()-lastPointerToggle>500){const menu=document.getElementById('v8MobileMenu');setMenuOpen(!menu?.classList.contains('open'))}
   return;
  }
  const item=event.target.closest?.('#v8MobileMenu button[data-page]');
  if(item){
   event.preventDefault();event.stopImmediatePropagation();
   const desktopButton=document.querySelector(`aside nav .nav[data-page="${item.dataset.page}"]`);
   if(desktopButton)desktopButton.click();
   setMenuOpen(false);
   setTimeout(syncMobileNavigation,30);
   return;
  }
  if(document.getElementById('v8MobileMenu')?.classList.contains('open')&&!event.target.closest?.('#v8MobileMenu'))setMenuOpen(false);
 },true);
}

function ensureMobileNavigation(){
 let button=document.getElementById('v8MenuBtn');
 let menu=document.getElementById('v8MobileMenu');
 if(!button){
  button=document.createElement('button');button.id='v8MenuBtn';button.type='button';button.textContent='☰';button.setAttribute('aria-label','Open navigation');button.setAttribute('aria-expanded','false');document.body.appendChild(button);
 }
 if(!menu){
  menu=document.createElement('nav');menu.id='v8MobileMenu';menu.setAttribute('aria-label','Mobile navigation');document.body.appendChild(menu);
 }
 button.style.setProperty('pointer-events','auto','important');
 button.style.setProperty('touch-action','manipulation','important');
 installGlobalMenuHandler();
 return {button,menu};
}

function syncMobileNavigation(){
 document.querySelectorAll('.legacy-bottom-nav,.bottom-nav,#bottomNav,.mobile-bottom-nav').forEach(el=>el.remove());
 const {menu}=ensureMobileNavigation();
 const wasOpen=menu.classList.contains('open');
 const source=[...document.querySelectorAll('aside nav .nav[data-page]')];
 const signature=source.map(x=>`${x.dataset.page}:${x.textContent.trim()}:${x.classList.contains('active')}`).join('|');
 if(menu.dataset.janelleSignature===signature)return;
 menu.dataset.janelleSignature=signature;menu.innerHTML='';
 for(const desktopButton of source){
  const item=document.createElement('button');item.type='button';item.dataset.page=desktopButton.dataset.page;item.innerHTML=desktopButton.innerHTML;item.classList.toggle('active',desktopButton.classList.contains('active'));menu.appendChild(item);
 }
 if(wasOpen)setMenuOpen(true);
}

function applyJanelleLayout(){
 hidePage('calculator');hidePage('statistics');removeSnusWidget();
 document.querySelectorAll('.v8-carousel,#backgroundSlideshow,.bg-overlay').forEach(el=>el.remove());
 document.querySelectorAll('[data-go="calculator"],[data-go="statistics"]').forEach(el=>el.remove());
 const exerciseNav=document.querySelector('.nav[data-page="training"] span');if(exerciseNav)exerciseNav.textContent='Exercise';
 const training=document.getElementById('training');if(training){const eyebrow=training.querySelector('.toolbar small'),heading=training.querySelector('.toolbar h2');if(eyebrow)eyebrow.textContent='EXERCISE';if(heading)heading.textContent='Move your body'}
 const hero=document.querySelector('#dashboard .hero h2');if(hero)hero.textContent='Welcome Janelle';
 const documentTitle=document.getElementById('title');if(documentTitle)documentTitle.textContent='';document.title='Janelle Dashboard';
 const brand=document.querySelector('.brand');if(brand&&!brand.querySelector('.janelle-monogram'))brand.innerHTML='<div class="janelle-monogram">J</div><span><strong>Janelle</strong><small>My dashboard</small></span>';
 applyBudgetCurrency();syncMobileNavigation();
}

function upsertStylesheet(id,href){let link=document.getElementById(id);if(!link){link=document.createElement('link');link.id=id;link.rel='stylesheet';document.head.appendChild(link)}link.href=href}
function installTheme(){upsertStylesheet('janelle-theme-v2','/janelle-theme-v2.css?v=4');upsertStylesheet('janelle-final-fixes','/janelle-final-fixes.css?v=5')}
installTheme();applyJanelleLayout();
const observer=new MutationObserver(()=>{clearTimeout(window.__janelleLayoutTimer);window.__janelleLayoutTimer=setTimeout(applyJanelleLayout,40)});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});window.__janelleLayoutObserver=observer;
setTimeout(applyJanelleLayout,250);setTimeout(applyJanelleLayout,1200);
})();