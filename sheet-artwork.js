// Shared vector artwork: Canvas previews/PNG and the PDF use the same coordinates.
export async function loadPrintFonts(){
 if(!loadPrintFonts.ready)loadPrintFonts.ready=Promise.all([
  ['BoothReceipt','print-regular.ttf','400'],['BoothReceipt','print-bold.ttf','700'],['ReceiptSerif','print-serif.ttf','400']
 ].map(async([family,file,weight])=>{const font=new FontFace(family,`url(assets/fonts/${file})`,{weight});await font.load();document.fonts.add(font)}));
 return loadPrintFonts.ready;
}
export function photoFrames(d){
 const p=d.paper;
 return d.photos.map(f=>{
  if(d.paper.radius){const w=f.widthMm*d.pixelsPerMm,h=f.heightMm*d.pixelsPerMm;return {x:f.x-p.x+(f.w-w)/2,y:f.y-p.y+(f.h-h)/2,w,h}}
  return {x:f.x-p.x-1,y:f.y-p.y-1,w:f.w+2,h:f.h+2};
 });
}
function line(ctx,x,y,x2,y2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
function firstReceipt(ctx,x,y,w,h,date,price){
 ctx.save();ctx.translate(x,y);ctx.scale(w/348,h/152);
 ctx.strokeStyle='#242424';ctx.lineWidth=1.2;ctx.strokeRect(0,0,348,152);
 ctx.fillStyle='#141414';ctx.textBaseline='alphabetic';ctx.textAlign='center';ctx.font='400 27px ReceiptSerif';ctx.fillText('領　収　書',174,30);
 ctx.font='400 25px ReceiptSerif';ctx.fillText('円',150,59);line(ctx,46,63,167,63);
 ctx.font='400 18px ReceiptSerif';ctx.fillText(Number(price??1000).toLocaleString('ja-JP'),103,59);
 ctx.font='400 15px ReceiptSerif';ctx.fillText(String(date.getFullYear()),196,59);ctx.fillText('年',227,59);ctx.fillText(String(date.getMonth()+1),249,59);ctx.fillText('月',273,59);ctx.fillText(String(date.getDate()),296,59);ctx.fillText('日',324,59);
 ctx.font='700 17px BoothReceipt';ctx.fillText('証明写真代として上記正に領収致しました',174,83);
 ctx.restore();
}
function passportGuide(ctx){
 ctx.save();ctx.strokeStyle='#252525';ctx.fillStyle='#141414';ctx.lineWidth=1.2;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font='700 24px BoothReceipt';ctx.fillText('スケール',84,51);
 ctx.beginPath();ctx.moveTo(203,36);ctx.lineTo(228,36);ctx.lineTo(228,27);ctx.lineTo(250,44);ctx.lineTo(228,61);ctx.lineTo(228,52);ctx.lineTo(203,52);ctx.closePath();ctx.fill();
 for(let i=0;i<=50;i++){const x=264+i*6.4;line(ctx,x,14,x,i%10===0?62:i%5===0?54:47)}
 // Reconstructed measurement guide, with vector paths rather than a raster diagram.
 ctx.font='400 9px BoothReceipt';ctx.fillText('(単位:mm)',356,177);ctx.strokeRect(282,185,95,112);
 ctx.beginPath();ctx.moveTo(304,254);ctx.bezierCurveTo(286,208,320,186,346,196);ctx.bezierCurveTo(370,199,368,237,354,258);ctx.bezierCurveTo(345,283,319,285,304,254);ctx.stroke();
 ctx.beginPath();ctx.moveTo(308,248);ctx.bezierCurveTo(309,223,349,224,354,248);ctx.moveTo(304,220);ctx.lineTo(321,214);ctx.lineTo(317,195);ctx.moveTo(311,271);ctx.lineTo(295,291);ctx.lineTo(364,291);ctx.lineTo(348,271);ctx.stroke();
 line(ctx,275,185,275,297);line(ctx,270,185,280,185);line(ctx,270,297,280,297);line(ctx,282,317,377,317);line(ctx,282,312,282,322);line(ctx,377,312,377,322);line(ctx,385,190,385,276);line(ctx,381,190,390,190);line(ctx,381,276,390,276);
 ctx.font='400 11px BoothReceipt';ctx.fillText('35',322,326);ctx.fillText('23–36',389,241);ctx.fillText('15–19',295,310);ctx.save();ctx.translate(270,251);ctx.rotate(-Math.PI/2);ctx.fillText('45',0,0);ctx.restore();
 ctx.font='700 19px BoothReceipt';ctx.fillText('髪型などにより個人差がありますので、顔の大きさが',76,393);ctx.fillText('上の２枚は大きめ、下の２枚は小さめになっております。',76,415);
 ctx.restore();
}
export function drawSheetArtwork(ctx,d,date,price,{receipt=true}={}){
 const p=d.paper;ctx.save();ctx.strokeStyle='#888';ctx.lineWidth=1;
 if(!p.radius)ctx.strokeRect(.5,.5,p.w-1,p.h-1);
 if(d.src.includes('passport'))passportGuide(ctx);
 if(receipt){
  if(p.radius)firstReceipt(ctx,24,920,416,182,date,price);
  else if(d.date.rotation){ctx.save();ctx.translate(515,438);ctx.rotate(-Math.PI/2);firstReceipt(ctx,0,0,234,102,date,price);ctx.restore()}
  else firstReceipt(ctx,20,768,348,152,date,price);
 }
 ctx.restore();
}
