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
