// MediaPipe's segmentation mask can encode confidence as grayscale RGB or alpha.
export function personMaskPixels(input,width,height){
 let minAlpha=255;
 for(let i=3;i<input.length;i+=4)if(input[i]<minAlpha)minAlpha=input[i];
 const useAlpha=minAlpha<250,confidence=new Uint8Array(width*height),output=new Uint8ClampedArray(input.length);
 for(let i=0;i<confidence.length;i++)confidence[i]=useAlpha?input[i*4+3]:Math.round(input[i*4]*.299+input[i*4+1]*.587+input[i*4+2]*.114);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  let low=255;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)low=Math.min(low,confidence[Math.max(0,Math.min(height-1,y+dy))*width+Math.max(0,Math.min(width-1,x+dx))]);
  const t=Math.max(0,Math.min(1,(low-145)/65)),alpha=Math.round((t*t*(3-2*t))*255),i=(y*width+x)*4;
  output[i]=output[i+1]=output[i+2]=255;output[i+3]=alpha;
 }
 return output;
}

// Screenshots can place a green-screen photo inside a solid black canvas.
// Find the actual green photo before sampling its background color.
export function greenFrameBounds(pixels,width,height){
 const corner=(x,y)=>{const i=(y*width+x)*4;return Math.max(pixels[i],pixels[i+1],pixels[i+2])<45};
 const corners=[[0,0],[width-1,0],[0,height-1],[width-1,height-1]];
 if(corners.filter(([x,y])=>corner(x,y)).length<3)return null;
 const stride=Math.max(1,Math.floor(Math.max(width,height)/600));
 let count=0,total=0,minX=width,minY=height,maxX=0,maxY=0;
 for(let y=0;y<height;y+=stride)for(let x=0;x<width;x+=stride){
  const i=(y*width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];total++;
  if(g>115&&g-r>55&&g-b>45){count++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
 }
 if(count/total<.18)return null;
 const inset=Math.max(1,stride),x=minX+inset,y=minY+inset,w=maxX-minX-2*inset+1,h=maxY-minY-2*inset+1;
 if(w<width*.45||h<height*.4||w<80||h<80)return null;
 if(x<width*.015&&y<height*.015&&x+w>width*.985&&y+h>height*.985)return null;
 return {x,y,w,h};
}

// On a genuinely uniform backdrop, recover edge coverage from the source colors.
// The semantic mask still protects the inside of the person, including similar colors.
export function refineFlatBackground(source,semantic,width,height){
 const patch=(cx,cy)=>{let sums=[0,0,0],squares=[0,0,0],count=0;
  const r=Math.max(2,Math.round(Math.min(width,height)*.015));
  for(let y=Math.max(0,cy-r);y<Math.min(height,cy+r);y++)for(let x=Math.max(0,cx-r);x<Math.min(width,cx+r);x++){
   const i=(y*width+x)*4;if(source[i+3]<250)return null;
   for(let c=0;c<3;c++){sums[c]+=source[i+c];squares[c]+=source[i+c]*source[i+c]}count++;
  }
  const mean=sums.map(v=>v/count),variance=squares.map((v,c)=>v/count-mean[c]*mean[c]);
  return variance.some(v=>v>90)?null:mean;
 };
 const left=patch(Math.round(width*.04),Math.round(height*.04)),right=patch(Math.round(width*.96),Math.round(height*.04));
 if(!left||!right||Math.hypot(...left.map((v,c)=>v-right[c]))>20)return null;
 const background=left.map((v,c)=>(v+right[c])/2),distance=(x,y)=>{const i=(y*width+x)*4;return Math.hypot(source[i]-background[0],source[i+1]-background[1],source[i+2]-background[2])};
 let matches=0,total=0;
 for(const side of [0,1])for(const fraction of [.12,.24,.36,.48,.6]){const x=side?width-1:0,y=Math.min(height-1,Math.round(height*fraction));total++;if(distance(x,y)<24)matches++}
 if(matches<total*.8)return null;
 const greenStrength=Math.min(background[1]-background[0],background[1]-background[2]);
 if(greenStrength>80&&background[1]>145){
  const raw=new Uint8Array(width*height),output=new Uint8ClampedArray(semantic),kernel=[1,2,1];
  for(let n=0;n<raw.length;n++){
   const i=n*4,excess=Math.max(0,Math.min(source[i+1]-source[i],source[i+1]-source[i+2]));
   raw[n]=Math.round(255*Math.max(0,Math.min(1,(greenStrength-excess)/(greenStrength*.82))));
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const n=y*width+x,i=n*4,excess=Math.max(0,Math.min(source[i+1]-source[i],source[i+1]-source[i+2]));
   if(excess>greenStrength*.88){output[i+3]=0;continue}
   if(excess<greenStrength*.12){output[i+3]=255;continue}
   let sum=0,weight=0;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const yy=Math.max(0,Math.min(height-1,y+dy)),xx=Math.max(0,Math.min(width-1,x+dx)),w=kernel[dy+1]*kernel[dx+1];sum+=raw[yy*width+xx]*w;weight+=w;
   }
   output[i+3]=Math.round(sum/weight);
  }
  return {pixels:output,background};
 }
 const distances=new Float32Array(width*height),raw=new Uint8Array(width*height),protectedPixels=new Uint8Array(width*height),output=new Uint8ClampedArray(semantic);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)distances[y*width+x]=distance(x,y);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const n=y*width+x,i=n*4,d=distances[n];
  let core=semantic[i+3]>=210;
  if(core)for(let yy=Math.max(0,y-2);yy<=Math.min(height-1,y+2)&&core;yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(width-1,x+2);xx++)if(semantic[(yy*width+xx)*4+3]<150){core=false;break}
  let colorCore=d>55,foreground=0,neighbors=0;
  if(colorCore)for(let yy=Math.max(0,y-2);yy<=Math.min(height-1,y+2);yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(width-1,x+2);xx++){neighbors++;if(distances[yy*width+xx]>=55)foreground++}
  colorCore=colorCore&&foreground>=neighbors*.8;
  if(core||colorCore){raw[n]=255;protectedPixels[n]=1;continue}
  if(d<14){raw[n]=0;continue}
  let nearby=0;for(let yy=Math.max(0,y-3);yy<=Math.min(height-1,y+3);yy++)for(let xx=Math.max(0,x-3);xx<=Math.min(width-1,x+3);xx++)nearby=Math.max(nearby,distances[yy*width+xx]);
  // Thin hair may never contain a fully opaque pixel in this neighborhood.
  // Keep a dark-foreground reference so its old backdrop can be unmixed.
  raw[n]=Math.round(255*Math.max(0,Math.min(1,(d-12)/Math.max(1,Math.max(nearby,200)-12))));
 }
 // A one-pixel Gaussian pass removes the staircase without blurring the portrait.
 const kernel=[1,2,1];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  let sum=0,weight=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const yy=Math.max(0,Math.min(height-1,y+dy)),xx=Math.max(0,Math.min(width-1,x+dx)),w=kernel[dy+1]*kernel[dx+1];sum+=raw[yy*width+xx]*w;weight+=w;
  }
  const n=y*width+x;output[n*4+3]=protectedPixels[n]?255:Math.round(sum/weight);
 }
 return {pixels:output,background};
}
