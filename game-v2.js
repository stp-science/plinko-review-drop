'use strict';
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const colours=['#f5bd4d','#63daca','#b9a2ff','#ff91ad','#77bbff','#ff9c61'];
const used=new Set();
let selected=0,busy=false,drops=0,wins=0,sound=true,audio=null,epoch=0;
function randomInt(n){const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}
function makePath(){
  // Ten fair bounces, then a weighted final bounce between opposite results.
  // Three of ten equally likely final draws win; seven lose on every route.
  let x=400;const points=[{x,y:54}];
  for(let row=0;row<11;row++){points.push({x,y:88+row*39});if(row<10)x+=randomInt(2)===0?-28:28;else {const leftSlot=(x-28-92)/56,wantsWin=randomInt(10)<3; x+=(leftSlot%2===0)===wantsWin?-28:28;}points.push({x,y:108+row*39})}
  const slot=(x-92)/56;points.push({x,y:586});return {win:slot%2===0,slot,points};
}
function svg(tag,attrs,parent){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);parent.append(el);return el}
for(let row=0;row<11;row++)for(let col=-row;col<=row;col+=2)svg('circle',{cx:400+col*28,cy:88+row*39,r:5,fill:'#b1cadc',stroke:'#e8f8ff','stroke-width':1},$('pegs'));
for(let slot=0;slot<12;slot++){
 const win=slot%2===0,x=64+slot*56,group=svg('g',{id:`slot-${slot}`},$('slots'));
 svg('rect',{x:x+2,y:532,width:52,height:78,rx:5,fill:win?'#12523e':'#632f43',stroke:'#526d89','stroke-width':2},group);
 svg('text',{x:x+28,y:631,'text-anchor':'middle',fill:win?'#89ffc2':'#ffb4c1','font-family':'system-ui','font-size':13,'font-weight':900},group).textContent=win?'WIN':'LOSE';
}
colours.forEach((c,i)=>{const b=document.createElement('button');b.className='choice';b.style.setProperty('--disc',c);b.textContent=i+1;b.setAttribute('aria-label',`Choose disc ${i+1}`);b.onclick=()=>{if(busy||used.has(i))return;selected=i;position(400,54);clearLanding();renderChoice();message(`Disc ${i+1} is ready!`,'Press Drop for the next student.');tone(330+i*60,.09)};$('choices').append(b)});
function position(x,y){$('disc').setAttribute('transform',`translate(${x} ${y})`)}
function clearLanding(){$('confetti').replaceChildren();document.querySelectorAll('.landed').forEach(el=>el.classList.remove('landed'))}
function renderChoice(){[...$('choices').children].forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===selected));b.disabled=busy||used.has(i);b.classList.toggle('used',used.has(i));b.textContent=used.has(i)?'':i+1;b.setAttribute('aria-label',used.has(i)?`Disc ${i+1} used`:`Choose disc ${i+1}`);b.title=used.has(i)?'Used — select New Game to unlock':''});$('disc').children[0].setAttribute('fill',colours[selected]);$('disc').querySelector('text').textContent=selected+1;$('drop').textContent=busy?'Disc dropping…':used.size===6?'All discs used':used.has(selected)?'Choose an unused disc':`Drop disc ${selected+1} ↓`;$('drop').disabled=busy||used.has(selected);$('reset').disabled=busy}
function unlockAudio(){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{})}catch{}}
function tone(freq,duration=.07,type='sine',delay=0,volume=.12,endFreq=freq){
 if(!sound)return;unlockAudio();if(!audio)return;
 const start=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,start);o.frequency.exponentialRampToValueAtTime(endFreq,start+duration);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(volume,start+.005);g.gain.exponentialRampToValueAtTime(.001,start+duration);o.connect(g);g.connect(audio.destination);o.onended=()=>{o.disconnect();g.disconnect()};o.start(start);o.stop(start+duration+.01);
}
function resultSound(win){
 tone(170,.18,'triangle',0,.25,65);
 if(win)[523,659,784,1047].forEach((n,i)=>tone(n,.3,'triangle',.18+i*.13,.16));
 else [330,277,220,147].forEach((n,i)=>tone(n,.26,'sawtooth',.18+i*.17,.065,n*.8));
}
function message(title,sub,type=''){$('message').className='message '+type;$('message').replaceChildren(document.createTextNode(title));const s=document.createElement('small');s.textContent=sub;$('message').append(s)}
function score(){$('drops').textContent=drops;$('wins').textContent=wins;$('losses').textContent=drops-wins}
$('drop').onclick=()=>{
 if(busy||used.has(selected))return;used.add(selected);unlockAudio();tone(600,.16,'sine',0,.12,350);busy=true;
 const token=++epoch,{win,slot,points}=makePath();clearLanding();position(400,54);renderChoice();message(`Disc ${selected+1} is on its way…`,'It can all change on the final bounce!');let start,previous=-1;
 // Keep the full drop duration on all devices; reduced motion only suppresses confetti.
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=4900;
 function frame(t){
  if(token!==epoch)return;start??=t;const p=Math.min((t-start)/duration,1),s=p*(points.length-1),i=Math.min(Math.floor(s),points.length-2),f=p===1?1:s-i,a=points[i],b=points[i+1];
  position(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f-(i%2===1?Math.sin(f*Math.PI)*8:0));
  if(i!==previous){if(i%2===1){tone(750+randomInt(450),.065,'triangle',0,.16,380);tone(180,.045,'sine',0,.08)}previous=i}
  if(p<1){requestAnimationFrame(frame);return}
  drops++;if(win)wins++;score();busy=false;renderChoice();$(`slot-${slot}`).classList.add('landed');resultSound(win);
  message(win?'WIN! Nicely done!':'LOSE! Next drop, new chance.',used.size===6?'All six discs used. Press New Game to play again.':'Choose an unused disc for the next student.',win?'win':'lose');
  if(win&&!reduced)for(let j=0;j<35;j++)svg('rect',{x:90+randomInt(620),y:180+randomInt(300),width:5+randomInt(5),height:10,rx:2,fill:colours[j%6],class:'spark'},$('confetti'));
 }requestAnimationFrame(frame);
};
$('reset').onclick=()=>{if(busy)return;epoch++;used.clear();drops=wins=0;selected=0;score();renderChoice();position(400,54);clearLanding();message("Who's feeling lucky?",'Choose a disc, then press Drop.')};
$('sound').onclick=()=>{sound=!sound;if(!sound&&audio)audio.suspend().catch(()=>{});$('sound').textContent='Sound: '+(sound?'On':'Off');$('sound').setAttribute('aria-pressed',String(sound));tone(660,.12)};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{message('Full screen unavailable','You can still play in this window.')}};
document.addEventListener('fullscreenchange',()=>{$('full').textContent=document.fullscreenElement?'Exit full screen':'Full screen'});
position(400,54);renderChoice();