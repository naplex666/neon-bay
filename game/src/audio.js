export class AudioFX {
  constructor(){this.ctx=null;this.muted=false}
  init(){
    if(!this.ctx){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;this.ctx=new Ctx();this.osc=this.ctx.createOscillator();this.gain=this.ctx.createGain();this.osc.type='sawtooth';this.osc.frequency.value=48;this.gain.gain.value=this.muted?0:.012;this.osc.connect(this.gain).connect(this.ctx.destination);this.osc.start()}
    if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
  }
  engine(speed){if(this.osc&&this.ctx.state==='running')this.osc.frequency.setTargetAtTime(42+speed*3,this.ctx.currentTime,.12)}
  beep(freq=660,d=.12){if(!this.ctx||this.muted||this.ctx.state!=='running')return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.07,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+d);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+d)}
  toggle(){this.muted=!this.muted;if(this.gain)this.gain.gain.setTargetAtTime(this.muted?0:.012,this.ctx.currentTime,.02)}
}
