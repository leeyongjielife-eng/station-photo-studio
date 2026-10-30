const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

// Ignore transparent padding and nearly invisible segmentation residue.
export function alphaBounds(pixels,width,height){
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=8){
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 return right<0?null:{x:left,y:top,w:right-left+1,h:bottom-top+1};
}

// Frame-relative coordinates are shared by preview, export and brush hit testing.
export function photoPlacement(image,w,h,state,bounds,free){
 const scale=Math.max(w/image.width,h/image.height)*state.zoom;
 const width=image.width*scale,height=image.height*scale;
 let x=(w-width)/2+state.x*w,y=(h-height)/2+state.y*h;
 if(free&&bounds){
  const visibleX=.1*Math.min(w,bounds.w*scale),visibleY=.1*Math.min(h,bounds.h*scale);
  x=clamp(x,visibleX-(bounds.x+bounds.w)*scale,w-visibleX-bounds.x*scale);
  y=clamp(y,visibleY-(bounds.y+bounds.h)*scale,h-visibleY-bounds.y*scale);
 }else{
  x=clamp(x,w-width,0);y=clamp(y,h-height,0);
 }
 return {x,y,width,height,scale};
}
