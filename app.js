'use strict';
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('de-DE');
const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
const shuffle = list => {const a=[...list];for(let i=a.length-1;i>0;i--){const j=rand(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
const definitions = [
 {id:'pairs',icon:'10',name:'Verliebte Zahlen',desc:'Welche Zahlen ergeben zusammen 10?',tag:'VOR DEM START'},
 {id:'place',icon:'T H Z E',name:'Zahlen verstehen',desc:'Tausender, Hunderter, Zehner und Einer.',tag:'VOR DEM START'},
 {id:'exchange',icon:'10 → 1',name:'Tausch-Werkstatt',desc:'Lege Zahlen. Rechne weiter. Tausche 10 gegen 1.',tag:'SEHEN UND TAUSCHEN'},
 {id:'ten',icon:'↗ 10',name:'Über den Zehner',desc:'Erst bis 10. Dann den Rest rechnen.',tag:'KLEINE BRÜCKE'},
 {id:'hundred',icon:'↗ 100',name:'Über den Hunderter',desc:'Erst bis 100. Dann den Rest rechnen.',tag:'MITTLERE BRÜCKE'},
 {id:'thousand',icon:'↗ 1.000',name:'Über den Tausender',desc:'Erst bis 1.000. Dann den Rest rechnen.',tag:'GROSSE BRÜCKE'},
 {id:'double',icon:'7 + 7',name:'Doppelt hilft',desc:'Verdoppeln und Fast-Verdoppeln üben.',tag:'NOCH EINE RECHEN-IDEE'},
 {id:'written',icon:'T | H | Z | E',name:'Schriftlich rechnen',desc:'Überträge und Entbündeln verstehen.',tag:'ZUSATZ MIT DEINER LEHRKRAFT'}
];
let stars={};try{stars=JSON.parse(localStorage.getItem('zahlenbruecke-stars-v1')||'{}')||{};}catch{}
function saveStar(id){stars[id]=true;try{localStorage.setItem('zahlenbruecke-stars-v1',JSON.stringify(stars));}catch{}renderTiles();}
function renderTiles(){$('tiles').innerHTML=definitions.map(d=>`<button class="tile ${d.id==='thousand'?'accent':''}" data-tile="${d.id}"><span class="num">${d.icon}</span>${stars[d.id]?'<span class="star" aria-label="Schon geübt">★</span>':''}<h3>${d.name}</h3><p>${d.desc}</p><span class="go">${d.id==='exchange'?'Ausprobieren':'Los geht’s'} →</span></button>`).join('');}
function view(id){for(const name of ['home','lesson','exchange','practice','boss'])$(name).hidden=name!==id;$('main').focus();window.scrollTo({top:0,behavior:'instant'});}
function home(){view('home');}
$('homeBtn').onclick=home;document.querySelectorAll('[data-home]').forEach(b=>b.onclick=home);
$('tiles').onclick=e=>{const tile=e.target.closest('[data-tile]');if(!tile)return;if(tile.dataset.tile==='exchange'){view('exchange');renderBlocks();}else start(tile.dataset.tile);};
$('showBridge').onclick=()=>{view('lesson');renderDemo();};
$('bossIntro').onclick=()=>view('boss');
// All generated transition tasks cross the chosen boundary strictly.
function transition(base,op='mix'){
 const sign=op==='mix'?(rand(0,1)?'+':'−'):(op==='plus'?'+':'−');
 const cap=base===10?4:base===100?25:90;
 let distance=rand(1,cap),rest=rand(1,cap);
 const a=sign==='+'?base-distance:base+rest;
 const b=distance+rest;
 const first=sign==='+'?distance:rest,second=sign==='+'?rest:distance;
 return {kind:'transition',base,a,b,sign,first,second,answer:sign==='+'?a+b:a-b,prompt:`${fmt(a)} ${sign} ${fmt(b)} = ?`};
}
function makeTask(id){
 if(['ten','hundred','thousand'].includes(id))return transition({ten:10,hundred:100,thousand:1000}[id],$('operation').value);
 if(id==='pairs'){const a=rand(1,9);return{kind:'pairs',a,answer:10-a,prompt:`${a} + ? = 10`};}
 if(id==='place'){const digits=[rand(1,3),rand(0,9),rand(0,9),rand(0,9)],col=rand(0,3),names=['Tausender','Hunderter','Zehner','Einer'];const a=digits[0]*1000+digits[1]*100+digits[2]*10+digits[3];return{kind:'place',a,digits,col,answer:digits[col],prompt:`Wie viele ${names[col]} stehen in ${fmt(a)}?`};}
 if(id==='double'){const a=rand(5,9),extra=rand(0,1),b=a+extra;return{kind:'double',a,b,extra,answer:a+b,prompt:`${a} + ${b} = ?`};}
 const pool=[{a:998,b:5,sign:'+'},{a:786,b:458,sign:'+'},{a:1998,b:7,sign:'+'},{a:1003,b:5,sign:'−'},{a:2004,b:127,sign:'−'},{a:3002,b:458,sign:'−'}];
 const t=pool[rand(0,pool.length-1)];return{kind:'written',...t,answer:t.sign==='+'?t.a+t.b:t.a-t.b,prompt:`${fmt(t.a)} ${t.sign} ${fmt(t.b)} = ?`};
}
function makeRound(id){const result=[],seen=new Set();let tries=0;while(result.length<10&&tries++<300){const t=makeTask(id);if(!seen.has(t.prompt)){seen.add(t.prompt);result.push(t);}}while(result.length<10)result.push(makeTask(id));return result;}
function bossRound(){const tasks=[],seen=new Set();[10,10,100,100,100,1000,1000,1000,1000,1000].forEach((base,i)=>{let t;do{t=transition(base,i%2===0?'plus':'minus');}while(seen.has(t.prompt));seen.add(t.prompt);tasks.push(t);});return shuffle(tasks);}
let session=null;
function start(id,boss=false){
 session={id,boss,tasks:boss?bossRound():makeRound(id),index:0,correct:0,attempted:false,resolved:false,misses:[]};
 const def=definitions.find(d=>d.id===id);
 $('practiceTitle').textContent=boss?'Der Brückenwächter':def.name;
 $('practiceTitle').innerHTML=boss?'<span class="monster battle-monster" aria-hidden="true"><span>• •</span><b>⌣</b></span>Der Brückenwächter':def.name;
 $('practiceTag').textContent=boss?'10 AUFGABEN · MINDESTENS 8 RICHTIG':def.tag;
 $('practiceSettings').hidden=boss;
 const isTransition=['ten','hundred','thousand'].includes(id);
 $('operation').parentElement.hidden=!isTransition;$('guided').parentElement.hidden=!isTransition;
 $('roundResult').hidden=true;view('practice');renderTask();
}
$('startBoss').onclick=()=>start('boss',true);
$('newRound').onclick=()=>start(session.id);
$('operation').onchange=()=>{if(session&&!session.boss)start(session.id);};
$('guided').onchange=()=>{if(session&&!session.boss)start(session.id);};
function current(){return session.tasks[session.index];}
function field(id,label){return `<label class="answer-label" for="${id}">${label}<input id="${id}" name="${id}" inputmode="numeric" autocomplete="off" maxlength="7" aria-describedby="feedback"></label>`;}
function renderTask(){
 const t=current();session.attempted=false;session.resolved=false;
 session.jumpStage=0;
 $('counter').textContent=`Aufgabe ${session.index+1} von 10`;
 $('score').textContent=session.boss?`${session.correct} richtig`:`${session.correct} beim ersten Mal richtig`;
 $('progress').value=session.index;$('question').textContent=t.prompt;
 $('feedback').textContent='';$('feedback').className='feedback';$('hint').hidden=true;$('hint').innerHTML='';$('next').hidden=true;
 $('answerForm').hidden=false;$('check').disabled=false;$('hintBtn').hidden=session.boss;
 $('taskVisual').innerHTML=t.kind==='pairs'?`<div class="tenfield" aria-label="Zehnerfeld: ${t.a} von 10 Plätzen sind belegt.">${Array.from({length:10},(_,i)=>`<i class="${i<t.a?'filled':''}"></i>`).join('')}</div>`:'';
 const guided=t.kind==='transition'&&!session.boss&&$('guided').checked;
 if(t.kind==='transition'&&!session.boss)renderNumberLine();
 $('fields').innerHTML=(guided?`<p class="fields-hint">Zerlege die ${fmt(t.b)}. Rechne in zwei Schritten.</p>${field('part1',`${fmt(t.a)} ${t.sign} ? = ${fmt(t.base)}`)}${field('part2','Wie viel bleibt vom Rechen-Paket übrig?')}`:'')+field('answer','Mein Ergebnis:');
 const input=$('part1')||$('answer');input.focus({preventScroll:true});
}
function expected(){const t=current();return $('part1')?[['part1',t.first],['part2',t.second],['answer',t.answer]]:[['answer',t.answer]];}
function numberLineSVG(t,stage){
 const low=Math.min(t.a,t.answer), x=n=>80+600*(n-low)/t.b;
 const start=x(t.a),stop=x(t.base),end=x(t.answer);
 const arc=(a,b,h,color,label,y)=>`<path d="M ${a} 210 Q ${(a+b)/2} ${210-h*2} ${b} 210" fill="none" stroke="${color}" stroke-width="3" marker-end="url(#jumpArrow)"/><text x="${(a+b)/2}" y="${y}" text-anchor="middle" fill="${color}" font-size="25" font-weight="bold" paint-order="stroke" stroke="#fff" stroke-width="9" stroke-linejoin="round">${label}</text>`;
 return `<svg viewBox="0 0 760 305" role="img" aria-label="${t.sign==='+'?'Sprünge nach rechts':'Sprünge nach links'}. Ganzes Paket: ${t.sign} ${t.b}. Stopp bei ${fmt(t.base)}.${stage>=1?` Erst ${t.sign} ${t.first} bis ${fmt(t.base)}.`:''}${stage>=2?` Dann ${t.sign} ${t.second}.`:''}${stage>=3?` Ergebnis ${fmt(t.answer)}.`:''}" style="width:100%;min-width:480px;display:block;font-family:Arial,sans-serif"><defs><marker id="jumpArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#216c52"/></marker></defs><path d="M 25 210 H 735 l -10 -6 m 10 6 l -10 6" fill="none" stroke="#163d39" stroke-width="2"/>${arc(start,end,160,'#526863',`${t.sign} ${t.b} insgesamt`,35)}${stage>=1?arc(start,stop,75,'#216c52',`${t.sign} ${t.first}`,125):''}${stage>=2?arc(stop,end,75,'#9b4b15',`${t.sign} ${t.second}`,155):''}${[start,stop,end].map(v=>`<path d="M ${v} 203 v 14" stroke="#163d39" stroke-width="2"/>`).join('')}<text x="${start}" y="244" text-anchor="middle" font-size="25" font-weight="bold">${fmt(t.a)}</text><rect x="${Math.max(2,Math.min(568,stop-95))}" y="254" width="190" height="43" rx="10" fill="#d8ed8d"/><path d="M ${stop} 210 V 254" stroke="#216c52" stroke-width="3" stroke-dasharray="4 4"/><circle cx="${stop}" cy="210" r="7" fill="#216c52"/><text x="${Math.max(97,Math.min(663,stop))}" y="280" text-anchor="middle" font-size="23" fill="#216c52">${fmt(t.base)} · STOPP</text><text x="${end}" y="244" text-anchor="middle" font-size="25" font-weight="bold">${stage>=3?fmt(t.answer):'?'}</text></svg>`;
}
function renderNumberLine(){
 const t=current(),s=session.jumpStage;
 const words=[`Das ganze Paket ist ${t.sign} ${t.b}. Dein Stopp liegt bei ${fmt(t.base)}.`, `Erstes Paket: ${t.sign} ${t.first}. ${fmt(t.a)} ${t.sign} ${t.first} = ${fmt(t.base)}.`, `Zweites Paket: ${t.sign} ${t.second}. Denn ${t.b} = ${t.first} + ${t.second}. Rechne jetzt das Ergebnis.`, `${fmt(t.base)} ${t.sign} ${t.second} = ${fmt(t.answer)}. Beide Pakete zusammen: ${t.sign} ${t.b}.`];
 $('taskVisual').innerHTML=`<section aria-label="Rechnen mit Sprüngen" style="background:#f4f7ee;padding:16px;border-radius:12px"><strong>Deine Sprünge auf dem Zahlenstrahl</strong><div style="overflow-x:auto;background:white;border-radius:10px;margin-top:12px" tabindex="0" aria-label="Zahlenstrahl, auf kleinen Bildschirmen seitlich verschiebbar">${numberLineSVG(t,s)}</div><p role="status" aria-live="polite" style="margin:12px 0">${words[s]}</p><div class="toolbar wrap"><button id="jumpBack" class="quiet" type="button" ${s===0?'disabled':''}>Ein Schritt zurück</button><button id="jumpNext" class="primary" type="button" ${s===3?'disabled':''}>${['1. Sprung zeigen','2. Sprung zeigen','Ergebnis zeigen','Alle Sprünge sichtbar'][s]}</button></div></section>`;
 $('jumpBack').onclick=()=>{if(session.jumpStage>0)session.jumpStage--;renderNumberLine();};
 $('jumpNext').onclick=()=>{if(session.jumpStage<3)session.jumpStage++;renderNumberLine();};
}
function feedback(message,error=false){$('feedback').textContent=message;$('feedback').className=`feedback ${error?'error':'ok'}`;}
$('answerForm').onsubmit=e=>{
 e.preventDefault();if(!session||session.resolved)return;
 const fields=expected();const values=fields.map(([id])=>$(id).value.trim());
 if(values.some(v=>!/^\d+$/.test(v))){feedback('Trage in jedes Feld eine ganze Zahl ein. Ohne Punkt und ohne Komma.',true);const invalid=fields.find(([id])=>!/^\d+$/.test($(id).value.trim()));$(invalid[0]).focus();return;}
 const ok=fields.every(([id,value])=>Number($(id).value.trim())===value);
 fields.forEach(([id,value])=>$(id).setAttribute('aria-invalid',String(Number($(id).value.trim())!==value)));
 if(ok){if(!session.attempted)session.correct++;session.resolved=true;feedback(session.attempted?'Jetzt stimmt es. Gut weitergerechnet!':'Richtig! Du hast die Aufgabe geschafft.');finishAnswer();}
 else if(session.boss){session.attempted=true;session.resolved=true;session.misses.push(current());feedback(`Diese Antwort stimmt noch nicht. Richtig ist ${fmt(current().answer)}. Schau dir den Rechenweg an.`,true);$('hint').innerHTML=hintFor(current());$('hint').hidden=false;finishAnswer();}
 else{session.attempted=true;feedback('Das stimmt noch nicht. Schau auf die Hilfe und versuche es noch einmal.',true);$('hint').innerHTML=hintFor(current());$('hint').hidden=false;}
};
function finishAnswer(){$('check').disabled=true;expected().forEach(([id])=>$(id).disabled=true);$('hintBtn').hidden=true;$('score').textContent=`${session.correct} beim ersten Mal richtig`;$('progress').value=session.index+1;$('next').textContent=session.index===9?'Ergebnis ansehen →':'Weiter →';$('next').hidden=false;$('next').focus({preventScroll:true});}
$('hintBtn').onclick=()=>{$('hint').innerHTML=hintFor(current());$('hint').hidden=false;};
$('next').onclick=()=>{if(!session.resolved)return;session.index++;if(session.index===10)endRound();else renderTask();};
function bridgeHTML(t,stage=3){return `<div class="bridge" aria-label="${fmt(t.a)}, ${t.sign} ${t.first} bis ${fmt(t.base)}, dann ${t.sign} ${t.second} bis ${fmt(t.answer)}"><strong>${fmt(t.a)}</strong><span class="jump">${stage>=1?t.sign+' '+fmt(t.first):'?'}<small> →</small></span><strong class="stop">${fmt(t.base)}<small style="display:block;font-size:12px">STOPP</small></strong><span class="jump">${stage>=2?t.sign+' '+fmt(t.second):'?'}<small> →</small></span><strong>${stage>=2?fmt(t.answer):'?'}</strong></div>`;}
function hintFor(t){
 if(t.kind==='transition')return `<strong>Erst zur ${fmt(t.base)}. Dann den Rest.</strong>${bridgeHTML(t)}<p>Ich zerlege ${fmt(t.b)} in ${fmt(t.first)} und ${fmt(t.second)}.<br>${fmt(t.a)} ${t.sign} ${fmt(t.first)} = ${fmt(t.base)}<br>${fmt(t.base)} ${t.sign} ${fmt(t.second)} = ${fmt(t.answer)}</p>`;
 if(t.kind==='pairs')return `<p>Im Zehnerfeld sind ${t.a} Punkte.<br>Zähle die freien Plätze. Es sind ${t.answer}.<br>${t.a} + ${t.answer} = 10.</p>`;
 if(t.kind==='place')return `<p>Die Spalten heißen T, H, Z, E.<br>${fmt(t.a)} hat ${t.digits[0]} T, ${t.digits[1]} H, ${t.digits[2]} Z und ${t.digits[3]} E.<br>Gesucht ist die Ziffer in der passenden Spalte.</p>`;
 if(t.kind==='double')return `<p>Verdopple zuerst: ${t.a} + ${t.a} = ${t.a*2}.<br>${t.extra?`Die zweite Zahl ist um 1 größer.<br>Rechne noch + 1: ${t.a*2} + 1 = ${t.answer}.`:'Die beiden Zahlen sind gleich.'}</p>`;
 return writtenHint(t);
}
function writtenHint(t){
 let text='';
 if(t.sign==='+'){
 let carry=0;const steps=[];for(let k=0;k<4;k++){const a=Math.floor(t.a/10**k)%10,b=Math.floor(t.b/10**k)%10,sum=a+b+carry;steps.push(`${['E','Z','H','T'][k]}: ${a} + ${b}${carry?' + 1 (Übertrag)':''} = ${sum}. Schreibe ${sum%10}.${sum>=10?' Tausche 10 gegen 1 in der nächsten Spalte. Merke 1.':''}`);carry=Math.floor(sum/10);}text=steps.join('<br>');
 }else{
 let top=String(t.a).padStart(4,'0').split('').map(Number),sub=String(t.b).padStart(4,'0').split('').map(Number);const steps=[];
 for(let k=3;k>=0;k--){if(top[k]<sub[k]){let j=k-1;while(j>=0&&top[j]===0)j--;top[j]--;for(let m=j+1;m<k;m++)top[m]=9;top[k]+=10;steps.push(`Tausche von links nach rechts bis zur Spalte ${['T','H','Z','E'][k]}. Jetzt liegen da: ${top[0]} T | ${top[1]} H | ${top[2]} Z | ${top[3]} E.`);}steps.push(`${['T','H','Z','E'][k]}: ${top[k]} − ${sub[k]} = ${top[k]-sub[k]}.`);}text=steps.join('<br>');
 }
 const digits=n=>String(n).padStart(4,' ').split('').map(v=>`<td>${v}</td>`).join('');
 return `<p>Schreibe die Stellen genau untereinander.<br>Rechne von rechts nach links: E → Z → H → T.</p><table class="written"><thead><tr><th></th><th>T</th><th>H</th><th>Z</th><th>E</th></tr></thead><tbody><tr><td></td>${digits(t.a)}</tr><tr><td>${t.sign}</td>${digits(t.b)}</tr><tr><td>=</td>${digits(t.answer)}</tr></tbody></table><p>${text}</p><p><strong>Ergebnis: ${fmt(t.answer)}</strong></p>`;
}
function endRound(){
 $('answerForm').hidden=true;$('next').hidden=true;$('hint').hidden=true;$('feedback').textContent='';$('question').textContent='Die Runde ist fertig.';$('counter').textContent='10 von 10 Aufgaben bearbeitet';
 const s=session,passed=s.correct>=8;if(!s.boss||passed)saveStar(s.id);
 $('roundResult').hidden=false;
 $('roundResult').innerHTML=`<span class="eyebrow">${s.boss?'DER BRÜCKENWÄCHTER':'DEIN ERGEBNIS'}</span><h2>${s.boss?(passed?'Geschafft! Der Weg ist frei.':'Eine neue Runde wartet auf dich.'):'Gut geübt!'}</h2><p><strong>${s.correct} von 10 Aufgaben</strong> waren beim ersten Mal richtig.</p><p>${s.boss?(passed?'Du hast mindestens 8 geschafft. Du hast den Endboss besiegt!':'Zum Bestehen brauchst du mindestens 8. Schau dir die Hilfen an. Übe weiter und versuche es noch einmal.'):'Du hast einen Übungsstern gesammelt. Du kannst dieselbe Kachel noch einmal üben.'}</p>${s.boss&&s.misses.length?`<details><summary>Diese Aufgaben übe ich noch</summary>${s.misses.map(t=>`<div class="panel"><h3>${t.prompt}</h3>${hintFor(t)}</div>`).join('')}</details>`:''}<div class="toolbar wrap"><button id="again" class="primary">${s.boss&&!passed?'Neue 10 Aufgaben':'Noch eine Runde'}</button><button id="returnTiles" class="quiet">Zu den Kacheln</button></div>`;
 $('again').onclick=()=>start(s.id,s.boss);$('returnTiles').onclick=home;$('roundResult').scrollIntoView({block:'start',behavior:'instant'});$('again').focus({preventScroll:true});
}
const demos=[{a:8,b:5,base:10,sign:'+',first:2,second:3,answer:13},{a:98,b:5,base:100,sign:'+',first:2,second:3,answer:103},{a:998,b:5,base:1000,sign:'+',first:2,second:3,answer:1003},{a:1003,b:5,base:1000,sign:'−',first:3,second:2,answer:998}];
let demoIndex=2,demoStage=0;
$('examples').innerHTML=demos.map((t,i)=>`<button data-demo="${i}" aria-pressed="${i===demoIndex}">${fmt(t.a)} ${t.sign} ${t.b}</button>`).join('');
$('examples').onclick=e=>{const b=e.target.closest('[data-demo]');if(!b)return;demoIndex=Number(b.dataset.demo);demoStage=0;renderDemo();};
function renderDemo(){const t=demos[demoIndex];$('examples').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===demoIndex)));$('demo').innerHTML=`<span class="step-count">Schritt ${demoStage+1} von 4</span><h2>${fmt(t.a)} ${t.sign} ${t.b}</h2>${bridgeHTML(t,Math.min(demoStage,2))}<div class="step-text" role="status" aria-live="polite">${[
 `Wo ist mein Stopp? Bei ${fmt(t.base)}.<br>Wie weit ist es bis dahin?`,
 `${fmt(t.a)} ${t.sign} ${t.first} = ${fmt(t.base)}.<br>Stopp! Ich habe ${t.first} von ${t.b} verrechnet.`,
 `Vom Rechen-Paket bleiben ${t.second} übrig.<br>${fmt(t.base)} ${t.sign} ${t.second} = ${fmt(t.answer)}.`,
 `Ich zerlege ${t.b} in ${t.first} und ${t.second}.<br><strong>${fmt(t.a)} ${t.sign} ${t.b} = ${fmt(t.answer)}.</strong>`][demoStage]}</div>`;$('demoPrev').disabled=demoStage===0;$('demoNext').disabled=demoStage===3;}
$('demoPrev').onclick=()=>{if(demoStage>0)demoStage--;renderDemo();};$('demoNext').onclick=()=>{if(demoStage<3)demoStage++;renderDemo();};
const workshopTasks=[{a:8,b:5},{a:18,b:6},{a:98,b:5},{a:198,b:7},{a:998,b:5},{a:1998,b:6}];
let workshopIndex=0,workshopPhase='lay',added=0,blocks=[0,0,0,0];
const blockNames=['Einer','Zehner','Hunderter','Tausender'];
function blockValue(){return blocks.reduce((sum,n,i)=>sum+n*10**i,0);}
function normalized(){return blocks.every(n=>n<10);}
function exchangeMsg(s){$('exchangeMsg').textContent=s;}
function renderBlocks(){
 const t=workshopTasks[workshopIndex];
 $('workshopTask').textContent=`Aufgabe ${workshopIndex+1} von ${workshopTasks.length}: ${fmt(t.a)} + ${t.b}`;
 $('workshopInstruction').textContent=workshopPhase==='lay'?`1. Lege zuerst ${fmt(t.a)}. Nutze die Plus- und Minus-Tasten unter den Spalten.`:workshopPhase==='add'?`2. Lege ${t.b} Einer dazu. Schon dazugelegt: ${added} von ${t.b}. Tausche dann immer 10 gegen 1.`:workshopIndex===workshopTasks.length-1?'Alle Aufgaben geschafft! Du hast deinen Übungsstern verdient.':'Geschafft! Du kannst zur nächsten Aufgabe gehen.';
 $('placeBoard').innerHTML=[3,2,1,0].map(i=>`<div class="place-col"><h2>${['E','Z','H','T'][i]}</h2><small>${blockNames[i]}</small><strong>${blocks[i]}</strong><div class="dots" aria-label="${blocks[i]} ${blockNames[i]}">${Array.from({length:blocks[i]},()=>'<i class="dot" aria-hidden="true"></i>').join('')}</div>${workshopPhase==='lay'?`<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center"><button class="quiet" data-place="${i}" data-change="-1" aria-label="1 ${blockNames[i]} weg" ${blocks[i]===0?'disabled':''}>−</button><button class="quiet" data-place="${i}" data-change="1" aria-label="1 ${blockNames[i]} dazu" ${blocks[i]>=9?'disabled':''}>+</button></div>`:''}</div>`).join('');
 $('addUnit').hidden=workshopPhase!=='add';$('addUnit').disabled=added>=t.b;
 $('bundle').disabled=workshopPhase!=='add'||!blocks.slice(0,3).some(n=>n>=10);
 $('unbundle').disabled=workshopPhase!=='add'||!blocks.slice(1).some(n=>n>0);
 $('checkBlocks').hidden=workshopPhase==='done';$('checkBlocks').textContent=workshopPhase==='lay'?'Gelegte Zahl prüfen':'Ergebnis prüfen';
 $('nextBlocks').hidden=workshopPhase!=='done';$('nextBlocks').textContent=workshopIndex===workshopTasks.length-1?'Alle Aufgaben noch einmal':'Nächste Aufgabe →';
}
$('placeBoard').onclick=e=>{const b=e.target.closest('[data-place]');if(!b||workshopPhase!=='lay')return;const i=Number(b.dataset.place),n=blocks[i]+Number(b.dataset.change);if(n<0||n>9)return;blocks[i]=n;renderBlocks();exchangeMsg('');};
$('addUnit').onclick=()=>{if(workshopPhase!=='add'||added>=workshopTasks[workshopIndex].b)return;blocks[0]++;added++;renderBlocks();exchangeMsg('Ein Einer ist dazugekommen.');};
$('bundle').onclick=()=>{if(workshopPhase!=='add')return;const i=blocks.findIndex((n,i)=>i<3&&n>=10);if(i<0)return;blocks[i]-=10;blocks[i+1]++;renderBlocks();exchangeMsg(`10 ${blockNames[i]} werden 1 ${blockNames[i+1]}. Der Wert bleibt gleich.`);};
$('unbundle').onclick=()=>{if(workshopPhase!=='add')return;const i=blocks.findIndex((n,i)=>i>0&&n>0);if(i<1)return;if(blocks[i-1]+10>25){exchangeMsg('Tausche zuerst wieder 10 gegen 1.');return;}blocks[i]--;blocks[i-1]+=10;renderBlocks();exchangeMsg(`1 ${blockNames[i]} wird zu 10 ${blockNames[i-1]}. Der Wert bleibt gleich.`);};
$('checkBlocks').onclick=()=>{
 const t=workshopTasks[workshopIndex];
 if(workshopPhase==='lay'){if(blockValue()!==t.a){exchangeMsg(`Noch nicht ganz. Lege ${fmt(t.a)}. Prüfe die Spalten T, H, Z und E.`);return;}workshopPhase='add';renderBlocks();exchangeMsg(`Richtig gelegt! Jetzt kommen ${t.b} Einer dazu.`);return;}
 if(workshopPhase!=='add')return;
 if(added!==t.b){exchangeMsg(`Lege noch ${t.b-added} Einer dazu.`);return;}
 if(!normalized()){exchangeMsg('Tausche noch: In jeder Spalte dürfen höchstens 9 Plättchen liegen.');return;}
 if(blockValue()!==t.a+t.b){exchangeMsg('Prüfe deine Plättchen noch einmal.');return;}
 workshopPhase='done';if(workshopIndex===workshopTasks.length-1)saveStar('exchange');renderBlocks();exchangeMsg(`Richtig! ${fmt(t.a)} + ${t.b} = ${fmt(t.a+t.b)}.`);
};
function resetWorkshop(){blocks=[0,0,0,0];added=0;workshopPhase='lay';renderBlocks();exchangeMsg('');}
$('nextBlocks').onclick=()=>{if(workshopPhase!=='done')return;workshopIndex=(workshopIndex+1)%workshopTasks.length;resetWorkshop();};
$('resetBlocks').onclick=resetWorkshop;
renderTiles();

