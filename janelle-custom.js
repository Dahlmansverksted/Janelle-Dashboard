(()=>{
'use strict';

function hidePage(page){
 document.querySelectorAll(`.nav[data-page="${page}"]`).forEach(el=>el.remove());
 const section=document.getElementById(page);
 if(section){section.hidden=true;section.style.display='none';section.setAttribute('aria-hidden','true')}
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
}

function installTheme(){
 const existing=document.getElementById('janelle-theme-v2');
 if(existing){existing.href='/janelle-theme-v2.css?v=3';return}
 const link=document.createElement('link');
 link.id='janelle-theme-v2';
 link.rel='stylesheet';
 link.href='/janelle-theme-v2.css?v=3';
 document.head.appendChild(link);
}

installTheme();
applyJanelleLayout();

const observer=new MutationObserver(()=>{
 clearTimeout(window.__janelleLayoutTimer);
 window.__janelleLayoutTimer=setTimeout(applyJanelleLayout,30);
});
observer.observe(document.body,{childList:true,subtree:true});
window.__janelleLayoutObserver=observer;

setTimeout(applyJanelleLayout,250);
setTimeout(applyJanelleLayout,1200);
})();