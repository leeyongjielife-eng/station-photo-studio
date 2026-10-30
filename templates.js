import {loadPrintFonts,photoFrames,drawSheetArtwork} from './sheet-artwork.js?v=sync-b6fc493';
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

export async function loadOfficialTemplate(definition){
 await loadPrintFonts();return {definition};
}
export function drawOfficialSheet(canvas,template,portrait,paintPhoto,date,price,dpi=300,drawReceipt=true){
 const d=template.definition,p=d.paper,scale=(dpi/25.4)/d.pixelsPerMm;
 canvas.width=Math.round(p.w*scale);canvas.height=Math.round(p.h*scale);
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(scale,scale);
 for(const f of photoFrames(d))paintPhoto(ctx,portrait,f.x,f.y,f.w,f.h);
 drawSheetArtwork(ctx,d,date,price,{receipt:drawReceipt});ctx.restore();
 return {widthMm:p.w/d.pixelsPerMm,heightMm:p.h/d.pixelsPerMm};
}
