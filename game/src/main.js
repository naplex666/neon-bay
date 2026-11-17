import * as THREE from 'three';
import {createWorld,vehicle,person} from './world.js';
import {Input} from './input.js';
import {HUD} from './hud.js';
import {AudioFX} from './audio.js';
import {shotOptions,stageShot} from './shots.js';

const canvas=document.querySelector('#game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,300),input=new Input(canvas),hud=new HUD(),audio=new AudioFX();
createWorld(scene);
const player=new THREE.Group(),torso=new THREE.Mesh(new THREE.BoxGeometry(.65,1.1,.42),new THREE.MeshStandardMaterial({color:0x49c8bc})),head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,10),new THREE.MeshStandardMaterial({color:0xd0a47b}));
torso.position.y=.9;head.position.y=1.65;player.add(torso,head);scene.add(player);

const cars=[],peds=[];let randomSeed=1;
function random(){randomSeed=(randomSeed*1664525+1013904223)>>>0;return randomSeed/4294967296}
function addCar(x,z,color,type='sedan',police=false){const mesh=vehicle(scene,color,type,police);mesh.position.set(x,0,z);scene.add(mesh);const c={mesh,police,speed:police?4:3,dir:random()<.5?0:Math.PI/2,hp:100,type};cars.push(c);return c}
addCar(-15,0,0xb54e57);addCar(12,-24,0xe6b23f);addCar(35,12,0x56aab0,'van');addCar(-36,30,0xe8d8a8,'van');
for(let i=0;i<20;i++){const p=person(scene,[0xe1a374,0x7dc2b9,0xc88795][i%3]);p.position.set((i%5-2)*19,0,Math.floor(i/5)*18-35);scene.add(p);peds.push(p)}

let cash=0,wanted=0,mission=0,failed=false,timeLeft=0,story='',car=null,speed=0,carHp=100,hitLock=0,lastCrime=0,clock=0,hasBag=false,tailProgress=0;
const marker=new THREE.Vector3(34,0,-44),safe=new THREE.Vector3(-72,0,-72),mapCenter=new THREE.Vector3();
const game={player,cars,peds,marker,mapCenter,get cash(){return cash},set cash(v){cash=v},get wanted(){return wanted},set wanted(v){wanted=Math.max(0,Math.min(3,v))},get mission(){return mission},set mission(v){mission=v},get failed(){return failed},set failed(v){failed=v},get timeLeft(){return timeLeft},set timeLeft(v){timeLeft=v},get story(){return story},set story(v){story=v},get car(){return car},get speed(){return speed},get carHp(){return carHp},get hasBag(){return hasBag},enterCar,policeSpawn(){if(cars.some(c=>c.police))return cars.find(c=>c.police);return addCar(player.position.x+18,player.position.z+18,0x242a30,'sedan',true)}};
function enterCar(c,stolen=true){car=c;player.visible=false;c.mesh.position.copy(player.position);if(stolen){wanted=Math.min(3,wanted+1);lastCrime=clock;audio.beep(280);hud.say('Kendaraan diambil.')}}
const params=shotOptions();
function startMission(){failed=false;timeLeft=mission===0?72:mission===1?60:90;hud.say('Job dimulai ulang.')}
function start(){document.querySelector('#start').classList.add('hidden');document.querySelector('#hud').classList.remove('hidden');audio.init();if(!timeLeft)startMission()}
document.querySelector('#start-button').addEventListener('click',start);
try{document.querySelector('#record').textContent=`SHIFT TERBAIK · $ ${Number(localStorage.getItem('neonbay.best')||0).toLocaleString()}`}catch{document.querySelector('#record').textContent='SHIFT TERBAIK · $ 0'}
if(params)stageShot(game,params);

function fail(message){if(failed)return;failed=true;hud.say(message)}
function update(dt){
  clock+=dt;
  if(input.take('KeyM'))audio.toggle();
  if(input.take('KeyP')&&!document.querySelector('#start').classList.contains('hidden'))document.querySelector('#pause').classList.toggle('hidden');
  if(input.take('KeyR')&&mission<3){failed=false;wanted=0;carHp=100;speed=0;hasBag=false;tailProgress=0;for(const c of cars.filter(c=>c.police)){scene.remove(c.mesh);cars.splice(cars.indexOf(c),1)}if(mission===0){player.position.set(0,0,0);marker.set(34,0,-44)}else if(mission===2)marker.set(60,0,60);if(car)car.mesh.position.copy(player.position);startMission()}
  const started=document.querySelector('#start').classList.contains('hidden'),paused=!document.querySelector('#pause').classList.contains('hidden');
  if(!started||paused||failed){hud.draw(game);updateCamera();return}
  if(input.take('KeyE')){if(car){player.position.copy(car.mesh.position);player.visible=true;car=null;speed=0}else{const near=cars.filter(c=>!c.police&&c.mesh.position.distanceTo(player.position)<5).sort((a,b)=>a.mesh.position.distanceTo(player.position)-b.mesh.position.distanceTo(player.position))[0];if(near)enterCar(near)}}
  if(car){const accel=(input.down('KeyW')?1:0)-(input.down('KeyS')?1:0);speed=THREE.MathUtils.damp(speed,accel*(input.down('ShiftLeft')||input.down('ShiftRight')?13:8),1.8,dt);car.mesh.rotation.y+=((input.down('KeyA')?1:0)-(input.down('KeyD')?1:0))*dt*1.9;const forward=new THREE.Vector3(Math.sin(car.mesh.rotation.y),0,Math.cos(car.mesh.rotation.y));car.mesh.position.addScaledVector(forward,speed*dt);if(input.down('Space'))speed*=.9;car.mesh.position.x=THREE.MathUtils.clamp(car.mesh.position.x,-190,190);car.mesh.position.z=THREE.MathUtils.clamp(car.mesh.position.z,-190,190);player.position.copy(car.mesh.position);audio.engine(Math.abs(speed));if(input.take('KeyF')){carHp-=9;wanted=Math.min(3,wanted+1);lastCrime=clock;hud.say('Benturan memecahkan kaca.')}}
  else{const f=(input.down('KeyW')?1:0)-(input.down('KeyS')?1:0),s=(input.down('KeyD')?1:0)-(input.down('KeyA')?1:0);player.position.x=THREE.MathUtils.clamp(player.position.x+s*6*dt,-190,190);player.position.z=THREE.MathUtils.clamp(player.position.z+f*6*dt,-190,190);if(input.take('KeyF')&&hitLock<=0){hitLock=.7;wanted=Math.min(3,wanted+1);lastCrime=clock;const victim=peds.find(p=>p.position.distanceTo(player.position)<2.5);if(victim){victim.position.x=THREE.MathUtils.clamp(victim.position.x+2,-190,190);hud.say('Pukulan mendarat.')}else hud.say('Pukulan meleset.');audio.beep(180)}}
  hitLock=Math.max(0,hitLock-dt);
  for(const c of cars){if(c===car)continue;if(c.police&&wanted){const d=player.position.clone().sub(c.mesh.position);d.y=0;const n=d.length();if(n>1)c.mesh.position.addScaledVector(d.normalize(),dt*(wanted===3?9:6));c.mesh.lookAt(player.position);if(n<3){if(car){carHp-=dt*10;speed*=.97}else fail('Tertangkap. Tekan R untuk coba lagi.')}}else if(!c.police){c.mesh.position.x+=Math.sin(c.dir)*dt*c.speed;c.mesh.position.z+=Math.cos(c.dir)*dt*c.speed;if(Math.abs(c.mesh.position.x)>188||Math.abs(c.mesh.position.z)>188)c.dir+=Math.PI/2;}}
  for(const p of peds){p.position.x+=Math.sin(clock*.7+p.position.z)*dt*.35;p.position.z+=Math.cos(clock*.6+p.position.x)*dt*.3;if(car&&Math.abs(speed)>1&&p.position.distanceTo(player.position)<2.2){wanted=Math.min(3,wanted+1);lastCrime=clock;p.position.x=THREE.MathUtils.clamp(p.position.x+4,-190,190);carHp-=8;speed*=.75}}
  const police=cars.find(c=>c.police);if(wanted&&clock-lastCrime>12&&(!police||player.position.distanceTo(police.mesh.position)>34)){wanted=Math.max(0,wanted-1);lastCrime=clock}if(wanted&&!police)game.policeSpawn();if(carHp<=0){carHp=0;fail('Kendaraan hancur. Tekan R.')}if(timeLeft>0)timeLeft=Math.max(0,timeLeft-dt);
  if(mission===0){if(timeLeft<=0)fail('Waktu paket habis. Tekan R.');else if(player.position.distanceTo(marker)<5){cash+=500;mission=1;timeLeft=60;tailProgress=0;marker.set(12,-0,-24);story='Mara: jangan dekat-dekat. Ikuti sedan emas itu tanpa menarik perhatian.';hud.say('PAKET DITERIMA · +$500');audio.beep(820)}}
  else if(mission===1){const target=cars[1],dist=target.mesh.position.distanceTo(player.position);if(dist>=12&&dist<=30)tailProgress+=dt;else tailProgress=Math.max(0,tailProgress-dt*.5);if(tailProgress>=12){cash+=850;mission=2;timeLeft=90;marker.set(60,0,60);story='Rin menemukan tas di dermaga. Sirene terdengar dari pusat kota.';hud.say('EKOR BERSIH · +$850');audio.beep(880)}else if(timeLeft<=0)fail('Target hilang. Tekan R untuk mencoba lagi.')}
  else if(mission===2){if(timeLeft<=0)fail('Waktu kabur habis. Tekan R.');if(!failed&&!hasBag&&player.position.distanceTo(marker)<5){hasBag=true;wanted=2;lastCrime=clock;marker.copy(safe);story='Tas diamankan. Polisi datang; capai titik aman.';hud.say('BARANG DIAMBIL · WANTED 2');game.policeSpawn()}else if(hasBag&&player.position.distanceTo(marker)<7){cash+=1500;mission=3;timeLeft=0;story='Mara: kita impas, Rin. Sampai jumpa di bawah lampu.';hud.say('SHIFT TUNTAS · +$1,500');try{localStorage.setItem('neonbay.best',String(Math.max(cash,Number(localStorage.getItem('neonbay.best')||0))))}catch{}}}
  mapCenter.copy(player.position);hud.draw(game);updateCamera();
}
function updateCamera(){const angle=input.yaw+(car?0:Math.PI),target=player.position;camera.position.set(target.x+Math.sin(angle)*18,target.y+9+input.pitch*8,target.z+Math.cos(angle)*18);camera.lookAt(target.x,target.y+1,target.z)}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);renderer.render(scene,camera)}
let last=performance.now();requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
window.__game=game;
