export function shotOptions(){const query=new URLSearchParams(location.search);if(!query.has('shot'))return null;const parsed=Number(query.get('seed')||1);return{mode:query.get('shot'),seed:Number.isFinite(parsed)?parsed:1}}

export function stageShot(game,shot){
  if(!shot)return;
  const start=document.querySelector('#start'),hud=document.querySelector('#hud');
  if(shot.mode==='start'){start.classList.remove('hidden');hud.classList.add('hidden');return}
  if(!['drive','chase','mission'].includes(shot.mode))return;
  start.classList.add('hidden');hud.classList.remove('hidden');game.timeLeft=72;
  if(shot.mode==='drive'){
    game.player.position.set(-15,0,-16);game.cars[0].mesh.position.copy(game.player.position);game.enterCar(game.cars[0],false);game.story='Sedan / shift malam';
  }else if(shot.mode==='chase'){
    game.player.position.set(-15,0,-16);game.cars[0].mesh.position.copy(game.player.position);game.enterCar(game.cars[0],false);game.wanted=2;game.policeSpawn();game.story='Unit patroli mengunci rute.';
  }else{
    game.mission=0;game.timeLeft=72;game.marker.set(34,0,-44);game.story='Mara: paket ini harus sampai sebelum lampu dermaga padam.';
  }
}
