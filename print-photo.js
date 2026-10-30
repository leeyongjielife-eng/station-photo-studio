function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
// Preview RGB corrections are enlarged as a delta, never as the exported photograph.
// This retains the original's fine detail while matching the existing beauty/edge edits.
export function printPortrait(original,rect,source,processed,mask,keep){
 const r=rect||{x:0,y:0,w:original.width,h:original.height};
 const scale=Math.min(1,4096/Math.max(r.w,r.h),Math.sqrt(12000000/(r.w*r.h)));
 const out=canvas(Math.max(1,Math.round(r.w*scale)),Math.max(1,Math.round(r.h*scale))),ctx=out.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(original,r.x,r.y,r.w,r.h,0,0,out.width,out.height);
 if(processed!==source){
  const w=source.width,h=source.height,base=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,changed=processed.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
  const delta=canvas(w,h),dx=delta.getContext('2d'),data=dx.createImageData(w,h);
  for(let i=0;i<data.data.length;i+=4){for(let k=0;k<3;k++)data.data[i+k]=128+(changed[i+k]-base[i+k])/2;data.data[i+3]=255}
  dx.putImageData(data,0,0);const field=canvas(out.width,Math.min(256,out.height)),fx=field.getContext('2d',{willReadFrequently:true});
  // Apply in strips so phones do not need two additional full-resolution pixel buffers.
  for(let y=0;y<out.height;y+=field.height){
   const rows=Math.min(field.height,out.height-y);fx.clearRect(0,0,field.width,field.height);fx.drawImage(delta,0,-y,out.width,out.height);
   const correction=fx.getImageData(0,0,out.width,rows).data,pixels=ctx.getImageData(0,y,out.width,rows);
   for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3])for(let k=0;k<3;k++)pixels.data[i+k]+=(correction[i+k]-128)*2;
   ctx.putImageData(pixels,0,y);
  }
 }
 if(mask&&!keep){ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0,out.width,out.height);ctx.globalCompositeOperation='source-over'}
 return out;
}
