
const defaultState = {
  settings:{startWeight:83.5,startWaist:100,goalWeight:79,goalWaist:95,startDate:new Date().toISOString().slice(0,10)},
  metrics:[], completions:{}, habits:{}, pain:{}, theme:"light"
};
let state = JSON.parse(localStorage.getItem("mfc_state")||"null") || defaultState;
const save=()=>localStorage.setItem("mfc_state",JSON.stringify(state));
const today=()=>new Date().toISOString().slice(0,10);
const dayNames=["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

const strengthA=[
 {n:"Mobilität",d:"Cat-Cow 10×, Beckenkippen 15×, Hüftbeuger sanft 45 s/Seite",m:8},
 {n:"Glute Bridge",d:"3×12–15 · Gesäß aktiv, kein Hohlkreuz",m:6},
 {n:"Bird Dog",d:"3×6–8 je Seite · langsam, Becken stabil",m:6},
 {n:"Kurzhantelrudern",d:"3×10–12 · Brust gestützt, wenn möglich",m:7},
 {n:"Schulterdrücken",d:"3×8–10 · nur schmerzfrei",m:5},
 {n:"Dead Bug",d:"2×6–10 · Bewegung verkleinern, wenn es schnappt",m:5},
 {n:"Cardio",d:"10–15 Min locker: Gehen oder Ergometer",m:12}
];
const strengthB=[
 {n:"Mobilität",d:"Beckenkippen, Hüftrotation, Gesäßdehnung sanft",m:8},
 {n:"Kniebeuge zur Bank",d:"3×10–12 · kontrolliert, schmerzfrei",m:6},
 {n:"Step-ups",d:"3×8 je Seite · niedrige Stufe",m:6},
 {n:"Liegestütz erhöht",d:"3×8–12",m:6},
 {n:"Rudern",d:"3×10–12",m:6},
 {n:"Side Plank kurz",d:"2×15–25 s je Seite",m:5},
 {n:"Cardio",d:"10–15 Min locker",m:12}
];
const recovery=[
 {n:"Lockeres Gehen",d:"20–35 Min, ohne Tempozwang",m:30},
 {n:"Mobilität",d:"Beckenkippen 15×, Cat-Cow 8×, sanfte Hüftbewegung",m:8}
];
const cardio=[
 {n:"Ausdauer",d:"45–60 Min E-Bike ECO, Ergometer oder zügiges Gehen",m:50},
 {n:"Kurz-Stretch",d:"Hüftbeuger und Gesäß je 45 s, nicht in Schmerz hinein",m:6}
];

function workoutFor(dateStr,pain){
 const d=new Date(dateStr+"T12:00:00").getDay();
 if(pain>=7) return [{n:"Akut-Tag",d:"Nur kurze schmerzarme Spaziergänge und sanfte Beckenkippung. Kein Krafttraining.",m:15}];
 if(pain>=4) return recovery;
 if(d===1||d===5) return strengthA;
 if(d===3) return strengthB;
 if(d===2||d===6) return cardio;
 return recovery;
}
function weekNo(){
 const s=new Date(state.settings.startDate+"T12:00:00"), n=new Date();
 return Math.max(1,Math.min(12,Math.floor((n-s)/(7*86400000))+1));
}
function renderToday(){
 document.getElementById("todayLabel").textContent=new Intl.DateTimeFormat("de-DE",{weekday:"long",day:"2-digit",month:"long"}).format(new Date());
 const p=state.pain[today()]??0;
 document.getElementById("painRange").value=p;
 document.getElementById("painValue").textContent=p;
 const adv=document.getElementById("painAdvice");
 adv.textContent=p>=7?"Heute keine Belastung erzwingen. Bei Warnzeichen oder deutlicher Verschlechterung abklären.":p>=4?"Heute reduziertes Programm: Bewegung ja, aber kein stechender Schmerz.":"Normales Programm möglich, solange die Übungen schmerzarm bleiben.";
 const w=workoutFor(today(),p), box=document.getElementById("todayWorkout"); box.innerHTML="";
 let total=0;
 w.forEach(x=>{total+=x.m;box.innerHTML+=`<div class="workout-item"><h4>${x.n}</h4><p>${x.d}</p></div>`});
 document.getElementById("durationBadge").textContent=`ca. ${total} Min`;
 document.getElementById("completeWorkout").textContent=state.completions[today()]?"✓ Training erledigt":"Training abschließen";
 document.querySelectorAll("[data-habit]").forEach(el=>el.checked=!!(state.habits[today()]||{})[el.dataset.habit]);
 const wn=weekNo(); document.getElementById("weekText").textContent=`Woche ${wn}`;
 document.getElementById("progressRing").style.background=`conic-gradient(var(--accent) ${wn/12*360}deg,#d1d5db 0deg)`;
}
function renderWeek(w){
 document.querySelectorAll(".week-btn").forEach(b=>b.classList.toggle("active",+b.dataset.w===w));
 let html="";
 const start=new Date(state.settings.startDate+"T12:00:00"); start.setDate(start.getDate()+(w-1)*7);
 for(let i=0;i<7;i++){
   const dt=new Date(start);dt.setDate(start.getDate()+i);const ds=dt.toISOString().slice(0,10);
   const p=state.pain[ds]??0; const items=workoutFor(ds,p).map(x=>x.n).join(", ");
   html+=`<div class="day-row"><strong>${dayNames[dt.getDay()]}</strong><span>${items}</span></div>`;
 }
 document.getElementById("weekPlan").innerHTML=html;
}
function setupWeekSelector(){
 const el=document.getElementById("weekSelector"); el.innerHTML="";
 for(let i=1;i<=12;i++) el.innerHTML+=`<button class="week-btn" data-w="${i}">W${i}</button>`;
 el.onclick=e=>{if(e.target.dataset.w)renderWeek(+e.target.dataset.w)};
 renderWeek(weekNo());
}
function drawChart(id,key,label){
 const c=document.getElementById(id),ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);
 const arr=state.metrics.filter(x=>x[key]!=null).slice(-20);
 ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue("--line");ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted");ctx.font="14px sans-serif";
 for(let i=0;i<5;i++){let y=30+i*50;ctx.beginPath();ctx.moveTo(45,y);ctx.lineTo(580,y);ctx.stroke();}
 if(!arr.length){ctx.fillText("Noch keine Daten",220,145);return}
 const vals=arr.map(x=>+x[key]),min=Math.min(...vals)-1,max=Math.max(...vals)+1;
 ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue("--accent");ctx.lineWidth=3;ctx.beginPath();
 arr.forEach((x,i)=>{let px=50+i*(520/Math.max(1,arr.length-1));let py=230-(+x[key]-min)/(max-min)*180;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.stroke();
 ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--text");ctx.fillText(`${label}: ${vals[vals.length-1]}`,45,20);
}
function renderHistory(){
 const rows=[...state.metrics].sort((a,b)=>b.date.localeCompare(a.date));
 document.getElementById("historyTable").innerHTML=rows.length?`<table><tr><th>Datum</th><th>Gewicht</th><th>Bauch</th></tr>${rows.map(r=>`<tr><td>${r.date}</td><td>${r.weight??"–"}</td><td>${r.waist??"–"}</td></tr>`).join("")}</table>`:"Noch keine Einträge.";
 drawChart("weightChart","weight","kg");drawChart("waistChart","waist","cm");
}
function loadSettings(){
 ["startWeight","startWaist","goalWeight","goalWaist","startDate"].forEach(k=>document.getElementById(k).value=state.settings[k]);
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab,.tab-panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active");if(b.dataset.tab==="progress")renderHistory()});
document.getElementById("painRange").oninput=e=>{state.pain[today()]=+e.target.value;save();renderToday()};
document.getElementById("completeWorkout").onclick=()=>{state.completions[today()]=!state.completions[today()];save();renderToday()};
document.querySelectorAll("[data-habit]").forEach(el=>el.onchange=()=>{state.habits[today()]=state.habits[today()]||{};state.habits[today()][el.dataset.habit]=el.checked;save()});
document.getElementById("saveMetrics").onclick=()=>{const w=parseFloat(document.getElementById("weightInput").value),wa=parseFloat(document.getElementById("waistInput").value);let r=state.metrics.find(x=>x.date===today());if(!r){r={date:today()};state.metrics.push(r)}if(!isNaN(w))r.weight=w;if(!isNaN(wa))r.waist=wa;save();alert("Gespeichert")};
document.getElementById("saveSettings").onclick=()=>{["startWeight","startWaist","goalWeight","goalWaist"].forEach(k=>state.settings[k]=parseFloat(document.getElementById(k).value));state.settings.startDate=document.getElementById("startDate").value;save();setupWeekSelector();renderToday();alert("Einstellungen gespeichert")};
document.getElementById("themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";save();applyTheme()};
function applyTheme(){document.body.classList.toggle("dark",state.theme==="dark")}
document.getElementById("exportBtn").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="michael-fitness-daten.json";a.click()};
document.getElementById("importInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{state=JSON.parse(r.result);save();location.reload()};r.readAsText(f)};
document.getElementById("resetBtn").onclick=()=>{if(confirm("Wirklich alle Daten löschen?")){localStorage.removeItem("mfc_state");location.reload()}};
applyTheme();loadSettings();setupWeekSelector();renderToday();renderHistory();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

// Version 2 daily tracking
state.daily=state.daily||{};
state.settings={waterGoal:2500,proteinGoal:160,stepsGoal:8000,bikeGoal:45,sleepGoal:7,...state.settings};
function dayLog(){const d=today();state.daily[d]=state.daily[d]||{water:0,proteinEntries:[],bikeMinutes:0,steps:0,sleep:0,workoutDone:{}};return state.daily[d]}
function pct(v,g){return g?Math.min(100,Math.round(v/g*100)):0}
const oldRenderToday=renderToday;
renderToday=function(){
 oldRenderToday(); const log=dayLog(); const p=state.pain[today()]??0; const w=workoutFor(today(),p); const box=document.getElementById('todayWorkout'); box.innerHTML=''; let total=0,done=0;
 w.forEach((x,i)=>{total+=x.m;const key=(x.n+'-'+i);const ok=!!log.workoutDone[key];if(ok)done++;box.innerHTML+=`<div class="workout-item ${ok?'task-done':''}"><div><h4>${x.n}</h4><p>${x.d}</p></div><button class="task-btn" data-task="${key}">${ok?'✓ Erledigt':'Abschließen'}</button></div>`});
 document.getElementById('durationBadge').textContent=`ca. ${total} Min`;document.getElementById('trainingProgressText').textContent=`${done}/${w.length} erledigt`;document.getElementById('trainingProgressBar').style.width=pct(done,w.length)+'%';
 document.getElementById('waterGoalText').textContent=state.settings.waterGoal.toLocaleString('de-DE')+' ml';document.getElementById('waterTotal').textContent=log.water.toLocaleString('de-DE')+' ml';document.getElementById('waterBar').style.width=pct(log.water,state.settings.waterGoal)+'%';
 const protein=log.proteinEntries.reduce((a,b)=>a+Number(b.value||0),0);document.getElementById('proteinGoalText').textContent=state.settings.proteinGoal+' g';document.getElementById('proteinTotal').textContent=protein+' g';document.getElementById('proteinBar').style.width=pct(protein,state.settings.proteinGoal)+'%';document.getElementById('proteinEntries').innerHTML=log.proteinEntries.map((e,i)=>`<span class="entry-chip">${e.value} g <button data-del-protein="${i}">×</button></span>`).join('');
 document.getElementById('bikeMinutes').value=log.bikeMinutes||'';document.getElementById('stepsInput').value=log.steps||'';const move=Math.round((pct(log.bikeMinutes,state.settings.bikeGoal)+pct(log.steps,state.settings.stepsGoal))/2);document.getElementById('movementScore').textContent=move+' %';document.getElementById('movementBar').style.width=move+'%';
 document.getElementById('sleepGoalText').textContent=state.settings.sleepGoal+' Stunden';document.getElementById('sleepTotal').textContent=(log.sleep||0)+' h';document.getElementById('sleepBar').style.width=pct(log.sleep,state.settings.sleepGoal)+'%';document.getElementById('sleepInput').value=log.sleep||'';save();
}
document.getElementById('todayWorkout').onclick=e=>{const k=e.target.dataset.task;if(!k)return;const l=dayLog();l.workoutDone[k]=!l.workoutDone[k];save();renderToday()};
document.querySelectorAll('[data-water]').forEach(b=>b.onclick=()=>{const l=dayLog();l.water=Math.max(0,(l.water||0)+Number(b.dataset.water));save();renderToday()});
document.getElementById('addProtein').onclick=()=>{const v=parseFloat(document.getElementById('proteinInput').value);if(!(v>0))return;dayLog().proteinEntries.push({value:v});document.getElementById('proteinInput').value='';save();renderToday()};
document.getElementById('proteinEntries').onclick=e=>{const i=e.target.dataset.delProtein;if(i===undefined)return;dayLog().proteinEntries.splice(Number(i),1);save();renderToday()};
document.getElementById('saveMovement').onclick=()=>{const l=dayLog();l.bikeMinutes=Math.max(0,parseInt(document.getElementById('bikeMinutes').value||0));l.steps=Math.max(0,parseInt(document.getElementById('stepsInput').value||0));save();renderToday()};
document.getElementById('saveSleep').onclick=()=>{dayLog().sleep=Math.max(0,parseFloat(document.getElementById('sleepInput').value||0));save();renderToday()};
renderToday();
