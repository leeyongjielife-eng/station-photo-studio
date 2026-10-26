// Second-booth-only receipt artwork. Original Photo ME templates remain unchanged.
export async function loadBooth2ReceiptFonts(){
 for(const weight of ['regular','bold']){
  const font=new FontFace('BoothReceipt',`url(assets/fonts/booth2-receipt-${weight}.otf)`,{weight:weight==='bold'?'700':'400'});
  await font.load();document.fonts.add(font);
 }
}

function receipt(ctx,x,y,w,h,date,price){
 ctx.save();ctx.translate(x,y);ctx.scale(w/1000,h/300);
 ctx.fillStyle='#242424';ctx.textBaseline='alphabetic';ctx.textAlign='left';
 ctx.font='700 23px BoothReceipt';ctx.fillText('PREMIUM',0,43);
 ctx.lineWidth=1;ctx.strokeStyle='#242424';ctx.beginPath();ctx.moveTo(0,52);ctx.lineTo(116,52);ctx.stroke();
 ctx.textAlign='right';ctx.font='700 30px BoothReceipt';ctx.fillText('スタジオセンター',1000,35);
 ctx.font='700 33px BoothReceipt';ctx.fillText('0100520111',1000,83);
 ctx.strokeStyle='#777';ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(0,116);ctx.lineTo(1000,116);ctx.stroke();ctx.setLineDash([]);
 ctx.textAlign='left';ctx.font='700 25px BoothReceipt';ctx.fillText('領 収 証',0,160);
 ctx.font='700 29px BoothReceipt';ctx.fillText('¥ '+Number(price??1000).toLocaleString('ja-JP'),175,160);
 ctx.font='400 18px BoothReceipt';ctx.fillText('（体験用・実際のお支払いなし）',350,159);
 ctx.textAlign='right';ctx.font='400 20px BoothReceipt';ctx.fillText(`${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`,1000,160);
 ctx.textAlign='left';ctx.font='400 21px BoothReceipt';ctx.fillText('写真サービス体験分 ／ 駅前写真室',0,207);
 ctx.font='400 18px BoothReceipt';ctx.fillText('この用紙はオンライン体験用です。実際の領収書ではありません。',0,244);
 ctx.fillText('写真はお使いの端末内で処理し、相紙・単写真を保存できます。',0,282);
 ctx.restore();
}

export function drawBooth2Receipt(canvas,template,date,price){
 const d=template.definition,p=d.paper,scale=canvas.width/p.w,ctx=canvas.getContext('2d');
 // Sample unprinted paper in the top-right margin to cover the old receipt.
 const pixel=ctx.getImageData(Math.round((p.w-8)*scale),Math.round(12*scale),1,1).data;
 ctx.save();ctx.scale(scale,scale);ctx.fillStyle=`rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
 if(d.date.rotation){
  ctx.fillRect(511,0,p.w-511,p.h);
  ctx.translate(525,430);ctx.rotate(-Math.PI/2);
  receipt(ctx,0,0,405,127,date,price);
 }else{
  const top=p.h>1100?920:755;
  ctx.fillRect(0,top,p.w,p.h-top);
  receipt(ctx,30,top+10,p.w-60,p.h-top-32,date,price);
 }
 ctx.restore();
}
