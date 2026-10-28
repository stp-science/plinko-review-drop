'use strict';
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const colours=['#f5bd4d','#63daca','#b9a2ff','#ff91ad','#77bbff','#ff9c61'];
let selected=0,busy=false,drops=0,wins=0,sound=false,audio=null,epoch=0;
function randomInt(n){const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}
// One unbiased random bit decides the outcome independently of colour or history.
function makePath(){const win=randomInt(2)===0;let moves;
 do{moves=Array(6).fill(1).concat(Array(4).fill(-1));for(let i=9;i>0;i--){const j=randomInt(i+1);[moves[i],moves[j]]=[moves[j],moves[i]]}let x=0;if(moves.every(m=>{x+=m;return Math.abs(x)<=5}))break}while(true);
 let k=0;const points=[{x:400,y:54}];for(let i=0;i<10;i++){points.push({x:400+k*56,y:88+i*44});k+=moves[i]*(win?-1:1);points.push({x:400+k*56,y:110+i*44})}points.push({x:400+k*56,y:575});return {win,points}}
function svg(tag,attrs,parent){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);parent.append(el);return el}
for(let row=0;row<10;row++)for(let col=-5;col<=5;col++)if(Math.abs(col)%2===row%2)svg('circle',{cx:400+col*56,cy:88+row*44,r:5,fill:'#b1cadc',stroke:'#e8f8ff','stroke-width':1},$('pegs'));
colours.forEach((c,i)=>{const b=document.createElement('button');b.className='choice';b.style.setProperty('--disc',c);b.textContent=i+1;b.setAttribute('aria-label',`Choose disc ${i+1}`);b.onclick=()=>{if(!busy){selected=i;renderChoice();tone(330+i*60,.08)}};$('choices').append(b)});
function position(x,y){$('disc').setAttribute('transform',`translate(${x} ${y})`)}
function renderChoice(){[...$('choices').children].forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===selected));b.disabled=busy});$('disc').children[0].setAttribute('fill',colours[selected]);$('disc').querySelector('text').textContent=selected+1;$('drop').textContent=busy?'Disc dropping…':`Drop disc ${selected+1} ↓`;$('drop').disabled=busy;$('reset').disabled=busy}
function tone(freq,duration=.05){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
function message(title,sub,type=''){$('message').className='message '+type;$('message').replaceChildren(document.createTextNode(title));const s=document.createElement('small');s.textContent=sub;$('message').append(s)}
function score(){$('drops').textContent=drops;$('wins').textContent=wins;$('losses').textContent=drops-wins}
$('drop').onclick=()=>{if(busy)return;busy=true;const token=++epoch,{win,points}=makePath();$('confetti').replaceChildren();renderChoice();message(`Disc ${selected+1} is on its way…`,'Follow the bounce!');let start,previous=-1;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?900:4400;
 function frame(t){if(token!==epoch)return;start??=t;const p=Math.min((t-start)/duration,1),s=p*(points.length-1),i=Math.min(Math.floor(s),points.length-2),f=p===1?1:s-i,a=points[i],b=points[i+1];position(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f-(i%2===1?Math.sin(f*Math.PI)*9:0));if(i!==previous){if(i%2)tone(450+i*22);previous=i}if(p<1){requestAnimationFrame(frame);return}drops++;if(win)wins++;score();busy=false;renderChoice();message(win?'WIN! Nicely done!':'LOSE! Next drop, new chance.',win?'A correct answer and a lucky landing.':'Keep the questions coming. Every drop starts fresh.',win?'win':'lose');if(win){[523,659,784].forEach((n,i)=>setTimeout(()=>tone(n,.22),i*130));for(let j=0;j<35;j++)svg('rect',{x:90+randomInt(620),y:180+randomInt(300),width:5+randomInt(5),height:10,rx:2,fill:colours[j%6],class:'spark'},$('confetti'))}else tone(200,.25)}requestAnimationFrame(frame)};
$('reset').onclick=()=>{if(busy)return;epoch++;drops=wins=0;selected=0;score();renderChoice();position(400,54);$('confetti').replaceChildren();message("Who's feeling lucky?",'Choose a disc, then press Drop.')};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent='Sound: '+(sound?'On':'Off');$('sound').setAttribute('aria-pressed',String(sound));tone(660,.12)};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{message('Full screen unavailable','You can still play in this window.')}};
document.addEventListener('fullscreenchange',()=>{$('full').textContent=document.fullscreenElement?'Exit full screen':'Full screen'});
position(400,54);renderChoice();
