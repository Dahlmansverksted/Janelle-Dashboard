(()=>{
'use strict';

const COLORS=['#d94f98','#9d6bd8','#ef9a67'];

function normalizeName(value){return String(value||'').trim().replace(/\s+/g,' ')}
function library(){
 data.exerciseLibrary=Array.isArray(data.exerciseLibrary)?data.exerciseLibrary.map(normalizeName).filter(Boolean):[];
 data.exerciseLibrary=[...new Set(data.exerciseLibrary)];
 return data.exerciseLibrary;
}
function persistLibrary(names){
 const current=library();
 let changed=false;
 for(const raw of names){
  const name=normalizeName(raw);
  if(name&&!current.some(x=>x.toLowerCase()===name.toLowerCase())){current.push(name);changed=true}
 }
 if(changed){
  data.exerciseLibrary=current.sort((a,b)=>a.localeCompare(b));
  try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}
 }
 updateDatalist();
}
function updateDatalist(){
 let list=document.getElementById('janelleExerciseLibrary');
 if(!list){list=document.createElement('datalist');list.id='janelleExerciseLibrary';document.body.appendChild(list)}
 list.innerHTML=library().map(name=>`<option value="${esc(name)}"></option>`).join('');
}
function createExerciseCard(){
 updateDatalist();
 const card=document.createElement('div');
 card.className='exercise-card janelle-exercise-card';
 card.innerHTML=`<div class="exercise-head"><label class="custom-exercise-field"><span>Exercise name</span><input class="exercise-name" list="janelleExerciseLibrary" placeholder="Type a new exercise or choose a saved one" autocomplete="off" required></label><button type="button" class="delete remove-exercise" aria-label="Remove exercise">×</button></div><p class="exercise-library-hint">New names are saved automatically for future workouts.</p><div class="sets-v3"></div><div class="exercise-actions"><button type="button" class="outline add-set-v3">+ Set</button></div>`;
 document.getElementById('exerciseRows')?.appendChild(card);
 if(typeof addSet==='function')addSet(card.querySelector('.sets-v3'));
 card.querySelector('.exercise-name')?.focus();
 return card;
}

function metric(exercise,bodyweight){
 if(typeof workoutMetric==='function')return workoutMetric(exercise,bodyweight);
 const values=(exercise.sets||[]).map(set=>{
  const weight=String(set.weight).toUpperCase()==='BW'?(+bodyweight||0):(+set.weight||0);
  const reps=+set.reps||0;
  return weight&&reps?weight*(1+reps/30):0;
 }).filter(Boolean);
 return values.length?Math.max(...values):0;
}
function topSeries(){
 const counts=new Map();
 for(const workout of data.workouts||[])for(const exercise of workout.exercises||[]){
  const name=normalizeName(exercise.name);if(name)counts.set(name,(counts.get(name)||0)+1);
 }
 return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3).map(([name,count])=>({
  name,count,points:(data.workouts||[]).flatMap(workout=>(workout.exercises||[]).filter(exercise=>normalizeName(exercise.name)===name).map(exercise=>({date:workout.date,value:metric(exercise,workout.bodyweight)}))).filter(point=>point.value>0).sort((a,b)=>a.date.localeCompare(b.date))
 })).filter(series=>series.points.length);
}
function drawDetailedChart(canvas,series){
 if(!canvas)return;
 const dpr=window.devicePixelRatio||1;
 const width=Math.max(520,canvas.clientWidth||760),height=Math.max(330,canvas.clientHeight||360);
 canvas.width=width*dpr;canvas.height=height*dpr;
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 const left=66,right=24,top=42,bottom=64,plotW=width-left-right,plotH=height-top-bottom;
 const all=series.flatMap(s=>s.points.map(p=>p.value));
 if(!all.length){ctx.fillStyle='#9b7287';ctx.font='14px Nunito, sans-serif';ctx.textAlign='center';ctx.fillText('Log workouts to see progress here',width/2,height/2);return}
 const max=Math.max(...all),min=Math.min(0,...all),range=Math.max(1,max-min),ticks=5;
 ctx.font='11px Nunito, sans-serif';ctx.lineWidth=1;
 for(let i=0;i<=ticks;i++){
  const y=top+plotH*i/ticks,value=max-range*i/ticks;
  ctx.strokeStyle='rgba(217,79,152,.13)';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();
  ctx.fillStyle='#9b7287';ctx.textAlign='right';ctx.fillText(Math.round(value).toString(),left-10,y+4);
 }
 const dates=[...new Set(series.flatMap(s=>s.points.map(p=>p.date)))].sort();
 const xFor=date=>left+(dates.length===1?plotW/2:plotW*dates.indexOf(date)/(dates.length-1));
 const yFor=value=>top+plotH*(max-value)/range;
 const labelStep=Math.max(1,Math.ceil(dates.length/6));
 dates.forEach((date,index)=>{if(index%labelStep&&index!==dates.length-1)return;const x=xFor(date);ctx.fillStyle='#9b7287';ctx.textAlign='center';ctx.fillText(new Date(date+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric'}),x,height-34)});
 series.forEach((item,index)=>{
  const color=COLORS[index%COLORS.length];ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
  item.points.forEach((point,i)=>{const x=xFor(point.date),y=yFor(point.value);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
  item.points.forEach(point=>{const x=xFor(point.date),y=yFor(point.value);ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6a3850';ctx.font='10px Nunito, sans-serif';ctx.textAlign='center';ctx.fillText(Math.round(point.value).toString(),x,y-9);ctx.fillStyle=color});
 });
 ctx.font='12px Nunito, sans-serif';let lx=left;series.forEach((item,index)=>{ctx.fillStyle=COLORS[index];ctx.beginPath();ctx.arc(lx+5,17,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6a3850';ctx.textAlign='left';const label=`${item.name} (${item.count} logs)`;ctx.fillText(label,lx+16,21);lx+=Math.min(220,ctx.measureText(label).width+48)});
 ctx.fillStyle='#9b7287';ctx.textAlign='left';ctx.fillText('Estimated strength (e1RM)',left,top-12);
}
function renderTopThreeCharts(){
 const series=topSeries();
 const select=document.getElementById('chartExercise');if(select)select.style.display='none';
 const chart=document.getElementById('exerciseChart');
 const card=chart?.closest('.card');
 if(card){const heading=card.querySelector('.head h3');if(heading)heading.textContent='Top 3 exercise progress';const eyebrow=card.querySelector('.head small');if(eyebrow)eyebrow.textContent='MOST USED EXERCISES'}
 drawDetailedChart(chart,series);
 drawDetailedChart(document.getElementById('homeProgressChart'),series);
}
function removeRadar(){const card=document.getElementById('muscleGroupCard');if(card)card.style.display='none'}
function installStyles(){
 if(document.getElementById('janelle-exercise-style'))return;
 const style=document.createElement('style');style.id='janelle-exercise-style';style.textContent=`
 #muscleGroupCard{display:none!important}
 .custom-exercise-field{display:grid;gap:6px;flex:1;margin:0!important}.custom-exercise-field span{font-size:11px;color:#a84b7a}.custom-exercise-field input{width:100%}
 .janelle-exercise-card .exercise-head{display:flex;align-items:end;gap:10px}.exercise-library-hint{margin:7px 0 12px;color:#9b7287;font-size:11px}
 #exerciseChart{min-height:360px!important}
 @media(max-width:700px){.janelle-exercise-card .exercise-head{align-items:stretch}.janelle-exercise-card .remove-exercise{align-self:end}}
 `;document.head.appendChild(style);
}

function start(){
 installStyles();library();updateDatalist();removeRadar();
 try{addExercise=createExerciseCard}catch{}window.addExercise=createExerciseCard;
 try{renderCharts=renderTopThreeCharts}catch{}window.renderCharts=renderTopThreeCharts;
 const form=document.getElementById('workoutForm');
 form?.addEventListener('submit',()=>persistLibrary([...document.querySelectorAll('#exerciseRows .exercise-name')].map(input=>input.value)),true);
 document.addEventListener('change',event=>{if(event.target.matches('#exerciseRows .exercise-name'))persistLibrary([event.target.value])},true);
 const observer=new MutationObserver(()=>{removeRadar();if(document.getElementById('training')?.classList.contains('active'))requestAnimationFrame(renderTopThreeCharts)});
 observer.observe(document.body,{childList:true,subtree:true});
 renderTopThreeCharts();setTimeout(renderTopThreeCharts,500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
