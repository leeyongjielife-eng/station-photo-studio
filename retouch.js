// Store foreground alpha only: RGB is not used when composing the mask.
// Twenty 1200 x 1200 masks take at most about 29 MB, rather than 115 MB RGBA.
export function createMaskHistory(limit=20){
 let owner=null,pending=null,entries=[],future=[];
 function read(mask){
  const data=mask.getContext('2d').getImageData(0,0,mask.width,mask.height).data;
  const alpha=new Uint8ClampedArray(mask.width*mask.height);
  for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];
  return alpha;
 }
 function clear(){owner=null;pending=null;entries=[];future=[]}
 return {
  clear,
  get canUndo(){return !pending&&entries.length>0},
  get canRedo(){return !pending&&future.length>0},
  begin(mask){
   if(owner!==mask){clear();owner=mask}
   if(pending)return;
   pending=read(mask);
  },
  commit(mask){
   if(owner!==mask){clear();return}
   if(!pending)return;
   const before=pending;pending=null;
   const after=read(mask);
   if(!before.some((a,i)=>a!==after[i]))return;
   future=[];
   entries.push(before);
   if(entries.length>limit)entries.shift();
  },
  undo(mask){
   if(owner!==mask){clear();return false}
   if(pending||!entries.length)return false;
   future.push(read(mask));
   const alpha=entries.pop(),ctx=mask.getContext('2d');
   const image=ctx.getImageData(0,0,mask.width,mask.height);
   for(let i=0;i<alpha.length;i++)image.data[i*4+3]=alpha[i];
   ctx.putImageData(image,0,0);
   return true;
  },
  redo(mask){
   if(owner!==mask){clear();return false}
   if(pending||!future.length)return false;
   entries.push(read(mask));
   const alpha=future.pop(),ctx=mask.getContext('2d');
   const image=ctx.getImageData(0,0,mask.width,mask.height);
   for(let i=0;i<alpha.length;i++)image.data[i*4+3]=alpha[i];
   ctx.putImageData(image,0,0);
   return true;
  }
 };
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
