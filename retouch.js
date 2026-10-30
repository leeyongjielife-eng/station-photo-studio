// Keep only Alpha snapshots: at most 20 entries shared by undo and redo.
export class MaskHistory{
 constructor(limit=20){this.limit=limit;this.clear()}
 clear(){this.past=[];this.future=[];this.pending=null;this.owner=null}
 get canUndo(){return this.past.length>0}
 get canRedo(){return this.future.length>0}
 snapshot(mask){const data=mask.getContext('2d',{willReadFrequently:true}).getImageData(0,0,mask.width,mask.height).data,alpha=new Uint8Array(mask.width*mask.height);for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];return alpha}
 begin(mask){if(this.owner!==mask){this.clear();this.owner=mask}if(!this.pending)this.pending=this.snapshot(mask)}
 commit(mask){
  if(this.owner!==mask){this.clear();return}
  if(!this.pending)return;
  const before=this.pending;this.pending=null;const after=this.snapshot(mask);
  if(before.every((a,i)=>a===after[i]))return;
  this.past.push(before);if(this.past.length>this.limit)this.past.shift();this.future=[];
 }
 swap(mask,from,to){
  if(this.owner!==mask){this.clear();return false}
  if(!from.length||this.pending)return false;
  const saved=from.pop();to.push(this.snapshot(mask));
  const ctx=mask.getContext('2d',{willReadFrequently:true}),pixels=ctx.createImageData(mask.width,mask.height);
  for(let i=0;i<saved.length;i++){pixels.data[i*4]=pixels.data[i*4+1]=pixels.data[i*4+2]=255;pixels.data[i*4+3]=saved[i]}
  ctx.putImageData(pixels,0,0);return true;
 }
 undo(mask){return this.swap(mask,this.past,this.future)}
 redo(mask){return this.swap(mask,this.future,this.past)}
}

// Apply a soft, continuous stroke to the foreground alpha mask.
export function paintMaskStroke(mask,from,to,radius,restore=false){
 const ctx=mask.getContext('2d'),length=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(length/Math.max(1,radius*.3)));
 ctx.save();ctx.globalCompositeOperation=restore?'source-over':'destination-out';
 for(let i=0;i<=steps;i++){
  const x=from.x+(to.x-from.x)*i/steps,y=from.y+(to.y-from.y)*i/steps;
  const gradient=ctx.createRadialGradient(x,y,radius*.55,x,y,radius);
  gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
