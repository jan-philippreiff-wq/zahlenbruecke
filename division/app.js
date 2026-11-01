'use strict';
const $=id=>document.getElementById(id),rand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const tiles=[['share','● ● ●','Gleichmäßig verteilen','Verteile Plättchen auf gleich große Gruppen.'],['facts','24 : 6','Kleines Einsdurcheins','Die Malaufgabe hilft beim Teilen.'],['parts','84 : 2','In Teilen rechnen','Erst die Zehner. Dann die Einer.'],['learn','96 : 3','Schriftlich entdecken','Lass dir jeden Schritt zeigen.'],['guided','156 : 3','Schritt für Schritt üben','Du rechnest jeden Zwischenschritt.'],['zero','408 : 4','Eine Null im Ergebnis','Auch die Null braucht ihren Platz.'],['remainder','157 : 3','Mit Rest teilen','Was bleibt am Ende übrig?']];
$('tiles').innerHTML=tiles.map(t=>`<button class="tile" data-mode="${t[0]}"><span class="num">${t[1]}</span><h3>${t[2]}</h3><p>${t[3]}</p><span class="go">Los geht’s →</span></button>`).join('');
let mode='',tasks=[],index=0,score=0,attempted=false,locked=false,eventIndex=0,trace=null;
function home(){$('home').hidden=false;$('work').hidden=true;}
$('homeBtn').onclick=home;$('back').onclick=home;
document.addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)start(b.dataset.mode);});
function start(m){mode=m;index=0;score=0;$('home').hidden=true;$('work').hidden=false;$('title').textContent=m==='boss'?'Das Teile-Monster':tiles.find(t=>t[0]===m)[2];
 if(m==='share'){tasks=[[12,3],[15,5],[18,3],[20,4]];sharing();return;}
 if(m==='learn')tasks=[[96,3],[84,2],[156,3]];
 else if(m==='guided')tasks=[[84,2],[69,3],[96,3],[156,3],[248,4],[365,5]];
 else if(m==='zero')tasks=[[408,4],[609,3],[816,4]];
 else if(m==='remainder')tasks=[[157,3],[85,2],[98,3],[259,4]];
 else if(m==='parts')tasks=[[84,2],[69,3],[96,3],[48,2],[66,3]];
 else if(m==='boss')tasks=[[24,6],[35,5],[48,8],[84,2],[69,3],[96,3],[156,3],[248,4],[365,5],[128,4]].sort(()=>Math.random()-.5);
 else tasks=Array.from({length:10},()=>{const d=rand(2,10),q=rand(1,10);return[d*q,d];});
 render();}
function division(n,d){const digits=String(n),events=[],rows=[],q=[];let end=0,part=Number(digits[0]);while(part<d&&end<digits.length-1)part=part*10+Number(digits[++end]);
 const snap=()=>({q:q.join(''),rows:[...rows]});
 for(;;){const quotient=Math.floor(part/d),product=quotient*d,remainder=part-product;
 q.push(quotient);events.push({type:0,label:`${part} : ${d} = ? Wie oft passt ${d} hinein?`,answer:quotient,note:quotient===0?'Die Zahl ist kleiner als der Teiler. Schreibe 0 ins Ergebnis.':'Schreibe die Zahl an die nächste Stelle im Ergebnis.',...snap()});
 rows.push(' '.repeat(Math.max(0,end-String(product).length+2))+'−'+product);events.push({type:1,label:`${quotient} · ${d} = ?`,answer:product,note:'Schreibe das Produkt unter die Zahl, mit der du gerade rechnest.',...snap()});
 rows.push(' '.repeat(Math.max(0,end-String(part).length+2))+'─'.repeat(String(part).length+1));rows.push(' '.repeat(end-String(remainder).length+3)+remainder);events.push({type:2,label:`${part} − ${product} = ?`,answer:remainder,note:'Das ist der Zwischenrest.',...snap()});
 if(end===digits.length-1)break;
 end++;part=remainder*10+Number(digits[end]);rows[rows.length-1]=' '.repeat(end-String(part).length+3)+part;
 events.push({type:3,label:`Hole die nächste Ziffer ${digits[end]} herunter. Welche Zahl entsteht aus dem Zwischenrest ${remainder} und dieser Ziffer?`,answer:part,note:`${remainder} Zehner der nächsten Stelle und ${digits[end]} Einer dieser Stelle ergeben ${part}.`,...snap()});
 }
 return{n,d,events,quotient:Math.floor(n/d),remainder:n%d};}
function paper(state){return `<pre class="division-paper" aria-label="Schriftlicher Rechenweg">  ${trace.n} : ${trace.d} = ${state?.q||'…'}\n${state?.rows.join('\n')||''}</pre>`;}
function render(){attempted=false;locked=false;eventIndex=0;$('count').textContent=`Aufgabe ${index+1} von ${tasks.length}`;const [n,d]=tasks[index];
 if(['learn','guided','zero','remainder'].includes(mode)){trace=division(n,d);written();}else simple();}
function form(){return '<form id="form" novalidate><label for="answer">Meine Antwort: </label><input id="answer" inputmode="numeric" autocomplete="off"><button class="primary" style="margin:12px" type="submit">Prüfen</button></form><p id="feedback" role="status" aria-live="polite"></p><button id="next" class="primary" hidden>Weiter →</button>';}
function simple(){const[n,d]=tasks[index];let body=`<p class="question">${n} : ${d} = ?</p>`;if(mode==='parts'){const tens=Math.floor(n/10)*10,ones=n%10;body+=`<p>${n} = ${tens} + ${ones}</p><div class="steps"><span>${tens} : ${d} = ${tens/d}</span><span>${ones} : ${d} = ${ones/d}</span></div><p>Addiere die beiden Ergebnisse.</p>`;}
 $('content').innerHTML=body+form()+(mode==='boss'?'':'<button id="help" class="quiet">Hilfe: die Malaufgabe</button>');
 if($('help'))$('help').onclick=()=>{$('feedback').textContent=`Denke an ${d} · ? = ${n}. Zähle in ${d}er-Schritten.`;};
 $('form').onsubmit=e=>{e.preventDefault();if(locked)return;const s=$('answer').value.trim();if(!/^\d+$/.test(s)){$('feedback').textContent='Trage eine ganze Zahl ein.';return;}const ok=Number(s)===n/d;if(ok&&!attempted)score++;if(ok||mode==='boss'){locked=true;$('answer').disabled=true;$('next').hidden=false;$('feedback').textContent=ok?'Richtig!':`Richtig ist ${n/d}. Denn ${d} · ${n/d} = ${n}.`;}else{$('feedback').textContent=`Versuche es noch einmal. Welche Malaufgabe passt zu ${d} · ? = ${n}?`;}attempted=true;};$('next').onclick=next;}
function written(){const ev=trace.events[eventIndex];if(!ev){$('content').innerHTML=paper(trace.events.at(-1))+`<h2>${trace.n} : ${trace.d} = ${trace.quotient}${trace.remainder?' Rest '+trace.remainder:''}</h2><p>Probe: ${trace.quotient} · ${trace.d}${trace.remainder?' + '+trace.remainder:''} = ${trace.n}.</p><p>${trace.remainder?'Der Rest '+trace.remainder+' ist kleiner als '+trace.d+'.':'Es bleibt kein Rest.'}</p><button id="next" class="primary">Nächste Aufgabe →</button>`;$('next').onclick=next;return;}
 $('content').innerHTML='<div class="steps">'+['Teilen','Malnehmen','Abziehen','Herunterholen'].map((s,i)=>`<span class="${ev.type===i?'active':''}">${i+1} ${s}</span>`).join('')+'</div>'+paper(eventIndex?trace.events[eventIndex-1]:null)+`<h2>${ev.label}</h2>`+(mode==='learn'?'<button id="reveal" class="primary">Diesen Schritt zeigen →</button><p id="feedback" role="status"></p><button id="nextStep" class="primary" hidden>Weiter zum nächsten Schritt →</button>':form());
 const reveal=()=>{$('feedback').textContent=`${ev.answer}. ${ev.note}`;$('content').querySelector('pre').outerHTML=paper(ev);};
 if(mode==='learn'){$('reveal').onclick=()=>{reveal();$('reveal').disabled=true;$('nextStep').hidden=false;};$('nextStep').onclick=()=>{eventIndex++;written();};}
 else{let solved=false;$('form').onsubmit=e=>{e.preventDefault();if(solved)return;const v=$('answer').value.trim();if(!/^\d+$/.test(v)){$('feedback').textContent='Trage eine ganze Zahl ein.';return;}if(Number(v)!==ev.answer){$('feedback').textContent='Noch nicht ganz. '+(ev.type===0?`Suche die größte passende Zahl: ? · ${trace.d} darf nicht größer als die Zahl sein, die du teilst.`:'Rechne diesen kleinen Schritt noch einmal.');return;}solved=true;reveal();$('answer').disabled=true;$('next').hidden=false;};$('next').onclick=()=>{eventIndex++;written();};}}
function next(){index++;if(index<tasks.length){render();return;}const boss=mode==='boss';$('content').innerHTML=`<h2>${boss?(score>=8?'Geschafft! Du hast das Teile-Monster besiegt.':'Übe noch einmal. Du brauchst mindestens 8 richtige Antworten.'):'Gut geübt! Die Runde ist geschafft.'}</h2>${['facts','parts','boss'].includes(mode)?`<p>${score} von ${tasks.length} beim ersten Versuch richtig.</p>`:''}<button class="primary" data-mode="${mode}">Neue Runde</button>`;}
function sharing(){const[n,d]=tasks[index];let given=0;const piles=Array(d).fill(0);$('count').textContent=`Aufgabe ${index+1} von ${tasks.length}`;
 const draw=()=>{$('content').innerHTML=`<h2>Verteile ${n} Plättchen auf ${d} Gruppen.</h2><p>Jede Gruppe bekommt gleich viele. Noch übrig: ${n-given}.</p><div class="toolbar wrap">${piles.map((v,i)=>`<div class="basket"><strong>Gruppe ${i+1}</strong><p aria-label="${v} Plättchen" style="color:#216c52;letter-spacing:5px">${'●'.repeat(v)}</p></div>`).join('')}</div><button id="deal" class="primary" ${given===n?'disabled':''}>Je 1 Plättchen verteilen</button>${given===n?`<p>${n} : ${d} = ${n/d}. Jede Gruppe hat ${n/d} Plättchen.</p><p>Probe: ${d} · ${n/d} = ${n}.</p><button id="shareNext" class="primary">Weiter →</button>`:''}`;$('deal').onclick=()=>{if(given>=n)return;piles.forEach((_,i)=>piles[i]++);given+=d;draw();};if($('shareNext'))$('shareNext').onclick=()=>{index++;if(index<tasks.length)sharing();else $('content').innerHTML='<h2>Gut verteilt!</h2><button class="primary" data-mode="facts">Jetzt das kleine Einsdurcheins üben →</button>';};};draw();}

