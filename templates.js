// Pixel coordinates measured on the official Photo ME samples.
export const officialTemplates={
 resume:{src:'assets/templates/resume-official.jpg',referenceWidth:875,referenceHeight:1245,paper:{x:49,y:23,w:804,h:1199,radius:46},photos:[
  {x:89,y:52,w:235,h:313,widthMm:30,heightMm:40},{x:334,y:52,w:235,h:313,widthMm:30,heightMm:40},{x:579,y:52,w:235,h:313,widthMm:30,heightMm:40},
  {x:89,y:375,w:235,h:313,widthMm:30,heightMm:40},{x:334,y:375,w:235,h:313,widthMm:30,heightMm:40},{x:579,y:375,w:235,h:313,widthMm:30,heightMm:40},
  {x:109,y:698,w:197,h:235,widthMm:25,heightMm:30},{x:353,y:698,w:197,h:235,widthMm:25,heightMm:30},{x:597,y:698,w:198,h:235,widthMm:25,heightMm:30}],date:{year:{x:305,y:1014},month:{x:379,y:1014},day:{x:442,y:1014},fontSize:22},price:{x:205,y:1014,fontSize:22},pixelsPerMm:235/30},
 passport:{src:'assets/templates/passport-official.jpg',referenceWidth:672,referenceHeight:1001,paper:{x:0,y:0,w:672,h:1001},photos:[
  {x:32,y:73,w:231,h:295,widthMm:35,heightMm:45},{x:410,y:73,w:230,h:295,widthMm:35,heightMm:45},
  {x:62,y:453,w:230,h:294,widthMm:35,heightMm:45},{x:381,y:453,w:230,h:294,widthMm:35,heightMm:45}],date:{year:{x:211,y:827},month:{x:271,y:827},day:{x:324,y:827},fontSize:16},price:{x:124,y:827,fontSize:16},pixelsPerMm:230/35},
 medium:{src:'assets/templates/medium-official.jpg',referenceWidth:672,referenceHeight:1001,paper:{x:0,y:0,w:672,h:1001},photos:[
  {x:67,y:72,w:227,h:291,widthMm:35,heightMm:45},{x:378,y:72,w:227,h:291,widthMm:35,heightMm:45},
  {x:81,y:446,w:198,h:263,widthMm:30,heightMm:40},{x:393,y:446,w:198,h:263,widthMm:30,heightMm:40}],date:{year:{x:211,y:827},month:{x:271,y:827},day:{x:324,y:827},fontSize:16},price:{x:124,y:827,fontSize:16},pixelsPerMm:227/35},
 large:{src:'assets/templates/large-official.jpg',referenceWidth:672,referenceHeight:453,paper:{x:0,y:0,w:672,h:453},photos:[
  {x:51,y:99,w:196,h:239,widthMm:45,heightMm:55},{x:285,y:75,w:215,h:302,widthMm:50,heightMm:70}],date:{year:{x:549,y:309},month:{x:549,y:260},day:{x:549,y:228},fontSize:10,rotation:-Math.PI/2},price:{x:549,y:384,fontSize:10,rotation:-Math.PI/2},pixelsPerMm:215/50}
};

let fontReady;
export async function loadOfficialTemplate(definition){
 const image=new Image();image.src=definition.src;await image.decode();
 if(image.naturalWidth!==definition.referenceWidth||image.naturalHeight!==definition.referenceHeight)throw new Error('官方底版尺寸与定位数据不一致');
 if(!fontReady)fontReady=(async()=>{const font=new FontFace('ReceiptDigits','url(assets/fonts/receipt-digits.otf?v=serif-1)');await font.load();document.fonts.add(font)})();
 await fontReady;
 let squareBackground=null;
 if(definition.paper.radius){
  const original=document.createElement('canvas');original.width=image.width;original.height=image.height;const oc=original.getContext('2d');oc.drawImage(image,0,0);
  const column=oc.getImageData(definition.paper.x+definition.paper.w-22,0,1,image.height);
  squareBackground=document.createElement('canvas');squareBackground.width=1;squareBackground.height=definition.paper.h;
  const bc=squareBackground.getContext('2d'),pixels=bc.createImageData(1,definition.paper.h);
  for(let y=0;y<definition.paper.h;y++){const sy=Math.max(80,Math.min(image.height-80,definition.paper.y+y));for(let k=0;k<4;k++)pixels.data[y*4+k]=column.data[sy*4+k]}
  bc.putImageData(pixels,0,0);
 }
 return {definition,image,squareBackground};
}

export function drawOfficialSheet(canvas,template,portrait,paintPhoto,date,price){
 const d=template.definition,p=d.paper,scale=(300/25.4)/d.pixelsPerMm;
 canvas.width=Math.round(p.w*scale);canvas.height=Math.round(p.h*scale);
 const ctx=canvas.getContext('2d');ctx.save();ctx.scale(scale,scale);
 if(template.squareBackground){
  ctx.drawImage(template.squareBackground,0,0,1,p.h,0,0,p.w,p.h);
  ctx.save();ctx.beginPath();ctx.rect(p.radius+1,3,p.w-2*(p.radius+1),p.h-6);ctx.rect(3,p.radius+1,p.w-6,p.h-2*(p.radius+1));ctx.clip();ctx.drawImage(template.image,-p.x,-p.y);ctx.restore();
 }else ctx.drawImage(template.image,-p.x,-p.y);
 for(const f of d.photos){
  const x=f.x-p.x,y=f.y-p.y;ctx.fillStyle='#ffffff';ctx.fillRect(x-1.5,y-1.5,f.w+3,f.h+3);
  if(d===officialTemplates.resume){const w=f.widthMm*d.pixelsPerMm,h=f.heightMm*d.pixelsPerMm;paintPhoto(ctx,portrait,x+(f.w-w)/2,y+(f.h-h)/2,w,h)}
  else paintPhoto(ctx,portrait,x-1,y-1,f.w+2,f.h+2);
 }
 ctx.fillStyle='#141414';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.font=`${d.date.fontSize}px ReceiptDigits`;
 const values={year:String(date.getFullYear()),month:String(date.getMonth()+1),day:String(date.getDate())};
 for(const part of ['year','month','day']){const pos=d.date[part];ctx.save();ctx.translate(pos.x-p.x,pos.y-p.y);if(d.date.rotation)ctx.rotate(d.date.rotation);ctx.fillText(values[part],0,0);ctx.restore()}
 if(price!=null){ctx.save();ctx.font=`${d.price.fontSize}px ReceiptDigits`;ctx.translate(d.price.x-p.x,d.price.y-p.y);if(d.price.rotation)ctx.rotate(d.price.rotation);ctx.fillText(String(price),0,0);ctx.restore()}
 ctx.restore();return {widthMm:p.w/d.pixelsPerMm,heightMm:p.h/d.pixelsPerMm};
}
