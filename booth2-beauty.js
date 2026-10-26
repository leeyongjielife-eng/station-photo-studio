// Continuous, adaptive skin weights. No landmark polygon is painted or filled.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const median=a=>{a.sort((x,y)=>x-y);return a[a.length>>1]};
const chroma=(r,g,b)=>[128-.168736*r-.331264*g+.5*b,128+.5*r-.418688*g-.081312*b];
const luminance=(r,g,b)=>.2126*r+.7152*g+.0722*b;
const linear=Float32Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
const encode=v=>255*(v<=.0031308?12.92*v:1.055*Math.max(0,v)**(1/2.4)-.055);
function soften(input,w,h,r){
 const temp=new Float32Array(input.length),out=new Float32Array(input.length),d=2*r+1;
 for(let y=0;y<h;y++){
  const row=y*w;let sum=0;for(let k=-r;k<=r;k++)sum+=input[row+clamp(k,0,w-1)];
  for(let x=0;x<w;x++){temp[row+x]=sum/d;sum+=input[row+clamp(x+r+1,0,w-1)]-input[row+clamp(x-r,0,w-1)]}
 }
 for(let x=0;x<w;x++){
  let sum=0;for(let k=-r;k<=r;k++)sum+=temp[clamp(k,0,h-1)*w+x];
  for(let y=0;y<h;y++){out[y*w+x]=sum/d;sum+=temp[clamp(y+r+1,0,h-1)*w+x]-temp[clamp(y-r,0,h-1)*w+x]}
 }
 return out;
}
function bilateral(data,weights,w,h,r){
 let source=Float32Array.from(data);const spatial=Array.from({length:2*r+1},(_,i)=>Math.exp(-((i-r)**2)/(2*(r*.65)**2)));
 for(const vertical of [false,true]){
  const out=new Float32Array(source);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const p=y*w+x,i=p*4;if(weights[p]<.005)continue;
   let total=0,red=0,green=0,blue=0;
   for(let k=-r;k<=r;k++){
    const xx=vertical?x:clamp(x+k,0,w-1),yy=vertical?clamp(y+k,0,h-1):y,j=(yy*w+xx)*4;
    if(data[j+3]<data[i+3]*.8)continue;
    const delta=((source[i]-source[j])**2+(source[i+1]-source[j+1])**2+(source[i+2]-source[j+2])**2)/3;
    const a=spatial[k+r]*Math.exp(-delta/(2*16**2));
    total+=a;red+=a*source[j];green+=a*source[j+1];blue+=a*source[j+2];
   }
   if(total){out[i]=red/total;out[i+1]=green/total;out[i+2]=blue/total}
  }
  source=out;
 }
 return source;
}
export function buildBeautyProfile(source,landmarks,personMask){
 if(!landmarks||!personMask)return null;
 const w=source.width,h=source.height,base=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h),data=base.data;
 const foreground=personMask.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
 const pt=i=>({x:landmarks[i].x*w,y:landmarks[i].y*h});
 const left=pt(234),right=pt(454),top=pt(10),chin=pt(152);
 const fw=Math.hypot(right.x-left.x,right.y-left.y),fh=Math.hypot(chin.x-top.x,chin.y-top.y);
 if(fw<24||fh<30)return null;
 const ux=(right.x-left.x)/fw,uy=(right.y-left.y)/fw;
 const cx=(top.x+chin.x)/2,cy=(top.y+chin.y)/2;
 const cb=[],cr=[],ys=[],radius=Math.max(1,Math.round(fw*.025));
 for(const id of [50,101,205,280,330,425,4,151]){
  const p=pt(id);
  for(let yy=Math.round(p.y)-radius;yy<=p.y+radius;yy+=2)for(let xx=Math.round(p.x)-radius;xx<=p.x+radius;xx+=2){
   if(xx<0||yy<0||xx>=w||yy>=h)continue;const i=(yy*w+xx)*4;if(data[i+3]<230||foreground[i+3]<230)continue;
   const y=luminance(data[i],data[i+1],data[i+2]);if(y<12||y>245)continue;
   const c=chroma(data[i],data[i+1],data[i+2]);cb.push(c[0]);cr.push(c[1]);ys.push(y);
  }
 }
 if(cb.length<12)return null;
 const centerCb=median(cb),centerCr=median(cr),centerY=median(ys);
 const sdCb=clamp(median(cb.map(v=>Math.abs(v-centerCb)))*2.5,9,17),sdCr=clamp(median(cr.map(v=>Math.abs(v-centerCr)))*2.5,9,17);
 const features=[[33,133],[362,263],[61,291],[70,107],[336,300]].map(([a,b],i)=>{
  const p=pt(a),q=pt(b),length=Math.hypot(p.x-q.x,p.y-q.y);
  return {x:(p.x+q.x)/2,y:(p.y+q.y)/2,sx:Math.max(3,length*(i===2?.47:.55)),sy:Math.max(3,length*(i===2?.28:.34))};
 });
 const weights=new Float32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=y*w+x,i=p*4;if(data[i+3]===0||foreground[i+3]===0)continue;
  const dx=x-cx,dy=y-cy,xx=dx*ux+dy*uy,yy=-dx*uy+dy*ux;
  const face=Math.exp(-.5*((xx/(fw*.48))**2+(yy/(fh*.56))**2));
  const neck=.45*Math.exp(-.5*((xx/(fw*.32))**2+((yy-fh*.65)/(fh*.29))**2));
  const c=chroma(data[i],data[i+1],data[i+2]);
  const color=Math.exp(-.5*(((c[0]-centerCb)/sdCb)**2+((c[1]-centerCr)/sdCr)**2));
  const l=luminance(data[i],data[i+1],data[i+2]);
  let a=(1-(1-face)*(1-neck))*color*smooth(centerY*.18,centerY*.65,l)*(1-smooth(235,255,l))*foreground[i+3]/255;
  for(const feature of features){const fx=(x-feature.x)*ux+(y-feature.y)*uy,fy=-(x-feature.x)*uy+(y-feature.y)*ux;a*=1-Math.exp(-1.5*((fx/feature.sx)**2+(fy/feature.sy)**2))}
  weights[p]=a;
 }
 // Feather in proportion to the actual face size, rather than a fixed 3px edge.
 const soft=soften(soften(weights,w,h,Math.max(2,Math.round(fw*.018))),w,h,Math.max(2,Math.round(fw*.018)));
 let total=0;
 for(let p=0;p<soft.length;p++)total+=soft[p]
 if(total<fw*fh*.025)return null;
 return {width:w,height:h,base,weights:soft,smoothed:bilateral(data,soft,w,h,clamp(Math.round(fw*.012),2,6))};
}
export function applyNaturalBeauty(source,profile,{smooth:strength=0,light=0,warm=0,compare=false}={}){
 if(!profile||compare||(!strength&&!light&&!warm)||profile.width!==source.width||profile.height!==source.height)return source;
 const out=document.createElement('canvas');out.width=source.width;out.height=source.height;const ctx=out.getContext('2d');
 const {base,weights,smoothed}=profile,result=ctx.createImageData(out.width,out.height);result.data.set(base.data);
 const exposure=2**(clamp(light,-50,50)/50*.32),temperature=clamp(warm,-50,50)/50*.055,amount=clamp(strength/100)*.35;
 for(let p=0;p<weights.length;p++){
  const a=weights[p],i=p*4;if(a<.001||base.data[i+3]===0)continue;
  for(let k=0;k<3;k++){
   const original=base.data[i+k],soft=original+(smoothed[i+k]-original)*amount;
   const lo=Math.floor(soft),hi=Math.min(255,lo+1),value=linear[lo]+(linear[hi]-linear[lo])*(soft-lo);
   const tint=Math.exp(k===0?temperature:k===2?-temperature:0);
   // Exposure in linear light preserves relative shading; roll off highlights smoothly.
   const gain=exposure*tint,rolled=gain>1?value*gain/(1+value*(gain-1)):value*gain;
   result.data[i+k]=clamp(original+(encode(rolled)-original)*a,0,255);
  }
 }
 ctx.putImageData(result,0,0);return out;
}
