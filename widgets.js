(()=>{
'use strict';

const shell=document.querySelector('.shell');
let dashboardRevealed=false;
function hideDashboardDuringBoot(){
 if(!shell)return;
 shell.style.visibility='hidden';
 shell.style.opacity='0';
 shell.style.transition='opacity .18s ease';
}
function revealDashboard(){
 if(dashboardRevealed)return;
 dashboardRevealed=true;
 if(!shell)return;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  shell.style.visibility='visible';
  shell.style.opacity='1';
  setTimeout(()=>{
   shell.style.removeProperty('visibility');
   shell.style.removeProperty('opacity');
   shell.style.removeProperty('transition');
  },220);
 }));
}
hideDashboardDuringBoot();
const bootFallback=setTimeout(revealDashboard,6000);

const places={norway:{lat:59.9139,lon:10.7522,tz:'Europe/Oslo'},cebu:{lat:10.3157,lon:123.8854,tz:'Asia/Manila'}};
const labels={0:['Clear','☀️'],1:['Mostly clear','🌤️'],2:['Partly cloudy','⛅'],3:['Cloudy','☁️'],45:['Fog','🌫️'],48:['Fog','🌫️'],51:['Drizzle','🌦️'],53:['Drizzle','🌦️'],55:['Heavy drizzle','🌧️'],61:['Light rain','🌦️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],71:['Snow','🌨️'],73:['Snow','🌨️'],75:['Heavy snow','❄️'],80:['Showers','🌦️'],81:['Showers','🌧️'],82:['Heavy showers','⛈️'],95:['Thunderstorm','⛈️'],96:['Thunderstorm','⛈️'],99:['Thunderstorm','⛈️']};
function clocks(){const n=new Date();for(const [key,p] of Object.entries(places)){const el=document.getElementById(key==='norway'?'norwayClock':'cebuClock');if(el)el.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:p.tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(n)}}
async function weather(key){const p=places[key],r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code,is_day&timezone=${encodeURIComponent(p.tz)}`);if(!r.ok)throw Error('weather');const c=(await r.json()).current,[text,day]=labels[c.weather_code]||['Weather','🌡️'];const icon=c.is_day?day:(c.weather_code<=2?'🌙':day);document.getElementById(`${key}Icon`)?.replaceChildren(icon);document.getElementById(`${key}Temp`)?.replaceChildren(`${Math.round(c.temperature_2m)}°`);document.getElementById(`${key}Weather`)?.replaceChildren(text)}
async function refresh(){const s=document.getElementById('weatherUpdated');try{await Promise.all([weather('norway'),weather('cebu')]);if(s)s.textContent='Updated '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}catch{if(s)s.textContent='Weather unavailable'}}
function script(src){return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.body.appendChild(s)})}
const renderTargetIds=['dateList','nextDate','nextCountdown','homeDaysSince'];
function ensureRenderTargets(){for(const id of renderTargetIds){if(document.getElementById(id))continue;const el=document.createElement('div');el.id=id;el.hidden=true;el.setAttribute('aria-hidden','true');el.dataset.compatTarget='true';document.body.appendChild(el)}}
function watchRenderTargets(){ensureRenderTargets();const observer=new MutationObserver(()=>ensureRenderTargets());observer.observe(document.documentElement,{childList:true,subtree:true});window.__renderTargetObserver=observer}
clocks();setInterval(clocks,1000);refresh();setInterval(refresh,900000);watchRenderTargets();
(async()=>{
 try{
  await script('/janelle-rescue.js?v=1');ensureRenderTargets();
  await script('/public-sync.js?v=32');ensureRenderTargets();
  await script('/dashboard-unified.js?v=32');ensureRenderTargets();
  await script('/goals.js?v=32');ensureRenderTargets();
  await script('/dashboard-fixes.js?v=32');ensureRenderTargets();
  await script('/janelle-custom.js?v=32');ensureRenderTargets();
  await script('/daily-routine.js?v=32');ensureRenderTargets();
  await script('/janelle-exercise.js?v=2');ensureRenderTargets();
  await new Promise(resolve=>setTimeout(resolve,180));
  try{if(typeof window.render==='function')window.render()}catch(error){console.warn('Final dashboard render:',error)}
 }finally{
  clearTimeout(bootFallback);
  revealDashboard();
 }
})();
})();
