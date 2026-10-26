import {buildBeautyProfile,applyNaturalBeauty} from './booth2-beauty.js';
import {loadBooth2ReceiptFonts,drawBooth2Receipt} from './booth2-receipt.js';
import {boothBackgrounds,backgroundCSS,paintBackground} from './booth2-backgrounds.js';
import {layouts,mmToPx} from './layouts.js';
import {officialTemplates,loadOfficialTemplate,drawOfficialSheet} from './templates.js';
import {personMaskPixels,refineFlatBackground,greenFrameBounds} from './mask.js';
import {paintMaskStroke} from './retouch.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={step:0,furthest:0,layout:layouts[0],source:null,mask:null,face:null,sample:true,bg:0,keep:false,premiumUsed:false,brushMode:'move',brushSize:28,zoom:1,x:0,y:0,smooth:20,light:0,warm:0,compare:false,busy:false};
const colors=boothBackgrounds;
const sheet=$('#sheet'), portrait=$('#portrait');
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
let processed=null,cleanSource=null,flatBackground=null,frameCropped=false,seg=null,mesh=null,toastTimer,renderPending=false,brushRenderPending=false,generatedDate=null,generatedPrice=null;
function priceForState(){return state.premiumUsed&&!state.keep?1200:state.light!==0||state.warm!==0?1100:1000}
function priceTier(){return priceForState()===1200?'八款背景 · Premium':priceForState()===1100?'肤色调整 · 进阶':'基础美肤 · 标准'}
const loadedTemplates={};
const currentTemplate=()=>loadedTemplates[state.layout.id];
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500)}
function busy(value,t='正在准备你的照片…'){state.busy=value;$('#busy').hidden=!value;$('#busyText').textContent=t;$('#print').disabled=value||!currentTemplate()}
function go(step){if(state.busy)return;if(step===4&&!currentTemplate())return toast('官方相纸底版尚未加载，请稍候或刷新页面');if(step>=3&&!state.source)return;closeCamera();state.step=step;state.furthest=Math.max(state.furthest,step);$$('.step-panel').forEach(e=>e.hidden=+e.dataset.step!==step);portrait.hidden=step!==3;sheet.hidden=step===3;$('.drag-hint').hidden=step!==3;$('#previewLabel').textContent=step===3?'人像构图':'相纸预览';$('#orderName').textContent=state.layout.name;$('#orderDetail').textContent=state.layout.detail+'（宽 × 高）';renderSteps();render();}
function renderSteps(){const names=['样式尺寸','写真券','拍照上传','背景编辑','打印下载'];$('.steps').innerHTML='';names.forEach((n,i)=>{const b=document.createElement('button');b.innerHTML=`<i>${i<state.step?'✓':'0'+(i+1)}</i>${n}`;b.className=i===state.step?'active':i<state.step?'done':'';b.disabled=i>state.furthest;b.onclick=()=>go(i);$('.steps').append(b)})}
function mini(l){const n=l.groups.reduce((a,g)=>a+g.n,0);return `<div class="mini ${n===4?'four':n===2?'two':''}">${'<span></span>'.repeat(n)}</div>`}
function showLayouts(){const root=$('#layouts');root.innerHTML='';layouts.forEach(l=>{const b=document.createElement('button');b.className='layout'+(l.id===state.layout.id?' selected':'');b.setAttribute('aria-pressed',String(l.id===state.layout.id));b.disabled=!l.available;b.title=l.detail+'（宽 × 高）';b.innerHTML=mini(l)+`<b>${l.name}</b><span class="layout-translation">${l.zhName}</span><small>${l.tag}</small>`;b.onclick=()=>{state.layout=l;state.zoom=1;state.x=state.y=0;$('#zoom').value=100;$('#zoomValue').textContent='100%';showLayouts();render()};const option=document.createElement('div');option.className='layout-option';option.append(b);root.append(option)})}
function renderColors(){const root=$('#swatches');root.innerHTML='';colors.forEach(([name,color],i)=>{const b=document.createElement('button');b.className='swatch';b.setAttribute('aria-pressed',String(state.bg===i&&!state.keep));b.innerHTML=`<span style="background:${backgroundCSS(colors[i])}"></span>${name}`;b.onclick=()=>{if(!state.mask&&!state.sample)return toast('尚未完成背景识别，请先重试识别');state.bg=i;state.keep=false;state.premiumUsed=true;$('#keepBackground').checked=false;renderColors();render()};root.append(b)})}
function skinProcess(){if(!state.source)return;const s=state.source,w=s.width,h=s.height;const out=applyNaturalBeauty(s,state.face,state),ctx=out.getContext('2d',{willReadFrequently:true});processed=out;cleanSource=null;
 if(flatBackground&&state.mask){const original=ctx.getImageData(0,0,w,h),mask=state.mask.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
  for(let i=0;i<original.data.length;i+=4){const a=mask[i+3]/255;if(a>.02&&a<.98)for(let k=0;k<3;k++)original.data[i+k]=Math.max(0,Math.min(255,(original.data[i+k]-flatBackground[k]*(1-a))/a))}
  if(flatBackground[1]>145&&flatBackground[1]-Math.max(flatBackground[0],flatBackground[2])>80){
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;if(mask[i+3]<16)continue;
    const spill=original.data[i+1]-Math.max(original.data[i],original.data[i+2]);if(spill<7)continue;
    let edge=false;
    for(let dy=-3;dy<=3&&!edge;dy++)for(let dx=-3;dx<=3;dx++){
     const yy=y+dy,xx=x+dx;if(yy>=0&&yy<h&&xx>=0&&xx<w&&mask[(yy*w+xx)*4+3]<235){edge=true;break}
    }
    if(edge)original.data[i+1]=Math.max(original.data[i],original.data[i+2])+4;
   }
  }
  cleanSource=canvas(w,h);cleanSource.getContext('2d').putImageData(original,0,0)
 }
}
function composed(){if(!processed)return null;const c=canvas(processed.width,processed.height),ctx=c.getContext('2d');ctx.drawImage(cleanSource||processed,0,0);if(!state.keep&&(state.mask||state.sample)){if(state.mask){ctx.globalCompositeOperation='destination-in';ctx.drawImage(state.mask,0,0,c.width,c.height)}ctx.globalCompositeOperation='destination-over';paintBackground(ctx,colors[state.bg],0,0,c.width,c.height);ctx.globalCompositeOperation='source-over'}return c;}
function photo(ctx,img,x,y,w,h){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();if(img){const scale=Math.max(w/img.width,h/img.height)*state.zoom;const iw=img.width*scale,ih=img.height*scale;let dx=x+(w-iw)/2+state.x*w,dy=y+(h-ih)/2+state.y*h;dx=Math.min(x,Math.max(x+w-iw,dx));dy=Math.min(y,Math.max(y+h-ih,dy));ctx.drawImage(img,dx,dy,iw,ih)}else{paintBackground(ctx,colors[state.bg],x,y,w,h)}ctx.restore();}
function render(){const img=composed();let dimensions=null;if(currentTemplate()){dimensions=drawOfficialSheet(sheet,currentTemplate(),img,photo,generatedDate||new Date(),generatedPrice);drawBooth2Receipt(sheet,currentTemplate(),generatedDate||new Date(),generatedPrice??priceForState())}else{sheet.width=1;sheet.height=1}
 $('#ticketPrice').textContent='¥ '+priceForState().toLocaleString('ja-JP');$('#ticketTier').textContent=priceTier();$('#currentPrice').textContent=`${priceTier()} · 模拟金额 ¥ ${priceForState().toLocaleString('ja-JP')}（模拟付款）`;$('#receiptPrice').textContent='¥ '+(generatedPrice??priceForState()).toLocaleString('ja-JP');$('#layoutInfo').textContent=`版式参考 Photo ME。${state.layout.detail}（宽 × 高）。`;
 const first=state.layout.groups[0];portrait.width=420;portrait.height=Math.round(420*first.h/first.w);photo(portrait.getContext('2d'),img,0,0,portrait.width,portrait.height);$('#previewCaption').textContent=state.layout.tag+' · Photo ME 参考版式';$('#previewSize').textContent=`${first.w} × ${first.h} mm`;$('#sampleNote').hidden=!state.sample;
 if(dimensions){const date=generatedDate||new Date();$('#exportInfo').textContent=`${sheet.width} × ${sheet.height} px · 300 DPI · Photo ME 参考版式`;$('#receiptDate').textContent=`${date.getFullYear()} 年 ${date.getMonth()+1} 月 ${date.getDate()} 日`;}
 renderBrushControls();
}
function renderBrushControls(){
 const usable=!!state.mask&&!state.keep;
 $('#brushTools').hidden=!usable;
 for(const mode of ['Erase','Restore','Move'])$('#brush'+mode).setAttribute('aria-pressed',String(state.brushMode===mode.toLowerCase()));
 portrait.classList.toggle('brushing',usable&&state.brushMode!=='move');
 $('.drag-hint').textContent=state.brushMode==='erase'?'在照片上涂抹，擦掉残留背景':state.brushMode==='restore'?'在照片上涂抹，恢复人物':'拖动照片调整位置';
}
function setBrushMode(mode){if(mode!=='move'&&!state.mask)return toast('请先完成人像识别');state.brushMode=mode;if(mode!=='move'){state.keep=false;state.premiumUsed=true;$('#keepBackground').checked=false}render()}
function brushPoint(e){
 const r=portrait.getBoundingClientRect(),w=portrait.width,h=portrait.height,img=state.source;
 const scale=Math.max(w/img.width,h/img.height)*state.zoom,iw=img.width*scale,ih=img.height*scale;
 let dx=(w-iw)/2+state.x*w,dy=(h-ih)/2+state.y*h;
 dx=Math.min(0,Math.max(w-iw,dx));dy=Math.min(0,Math.max(h-ih,dy));
 return {x:((e.clientX-r.left)*w/r.width-dx)/scale,y:((e.clientY-r.top)*h/r.height-dy)/scale,radius:state.brushSize*w/r.width/scale};
}
function scheduleBrushRender(){if(brushRenderPending)return;brushRenderPending=true;requestAnimationFrame(()=>{brushRenderPending=false;render()})}
function schedule(){if(renderPending)return;renderPending=true;requestAnimationFrame(()=>{renderPending=false;skinProcess();render()})}
async function modelRun(kind){const source=state.source;return new Promise(async(resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('识别超时')),35000);try{if(kind==='seg'){if(!seg){seg=new window.SelfieSegmentation({locateFile:f=>`vendor/segmentation/${f}`});seg.setOptions({modelSelection:0,selfieMode:false})}seg.onResults(r=>{const c=canvas(source.width,source.height),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(r.segmentationMask,0,0,c.width,c.height);const pixels=ctx.getImageData(0,0,c.width,c.height);pixels.data.set(personMaskPixels(pixels.data,c.width,c.height));const input=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height);const refined=refineFlatBackground(input.data,pixels.data,c.width,c.height);flatBackground=refined?.background||null;if(refined)pixels.data.set(refined.pixels);ctx.putImageData(pixels,0,0);clearTimeout(timer);resolve(c)});await seg.send({image:source})}else{if(!mesh){mesh=new window.FaceMesh({locateFile:f=>`vendor/face/${f}`});mesh.setOptions({maxNumFaces:1,refineLandmarks:false,minDetectionConfidence:.5,minTrackingConfidence:.5})}mesh.onResults(r=>{clearTimeout(timer);resolve(r.multiFaceLandmarks?.[0]||null)});await mesh.send({image:source})}}catch(e){clearTimeout(timer);reject(e)}})}
async function analyze(){busy(true,'正在识别人像与肤质…');state.mask=null;state.face=null;flatBackground=null;cleanSource=null;state.brushMode='move';try{const result=[];for(const kind of ['seg','face']){try{result.push({status:'fulfilled',value:await modelRun(kind)})}catch(reason){result.push({status:'rejected',reason})}}for(const item of result)if(item.status==='rejected')console.warn('Portrait model:',item.reason?.message||String(item.reason));if(result[0].status==='fulfilled')state.mask=result[0].value;
 if(!state.mask){const src=state.source,w=src.width,h=src.height,input=src.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h);const refined=refineFlatBackground(input.data,new Uint8ClampedArray(input.data.length),w,h);if(refined){state.mask=canvas(w,h);state.mask.getContext('2d').putImageData(new ImageData(refined.pixels,w,h),0,0);flatBackground=refined.background}}
 if(result[1].status==='fulfilled'&&result[1].value)state.face=buildBeautyProfile(state.source,result[1].value,state.mask);state.keep=!state.mask&&!state.sample;$('#keepBackground').checked=state.keep;$('#segStatus').textContent=state.mask?flatBackground?'人像已识别；检测到纯色原背景，已细化人物边缘。可继续用画笔修补。':'人像已识别，可切换背景；复杂边缘可用画笔修补。':'背景识别暂不可用，已保留原背景。你仍可裁剪并生成相纸。';if(frameCropped)$('#segStatus').textContent+=' 已去除黑色外框。';$('#faceStatus').textContent=state.face?'已识别人脸，轻柔调整肤质与肤色，保护眼眉和嘴唇。':'未能可靠识别皮肤区域，美肌与肤色暂不可用。请尝试清晰正面照。';$('#beautyFields').disabled=!state.face;$('#retryAnalysis').hidden=!!(state.mask&&state.face);renderColors();skinProcess();render()}finally{busy(false)}}
function prepareSource(img){
 const previewScale=Math.min(1,600/Math.max(img.width,img.height)),preview=canvas(Math.max(1,Math.round(img.width*previewScale)),Math.max(1,Math.round(img.height*previewScale)));
 const pc=preview.getContext('2d',{willReadFrequently:true});pc.drawImage(img,0,0,preview.width,preview.height);
 const bounds=greenFrameBounds(pc.getImageData(0,0,preview.width,preview.height).data,preview.width,preview.height);
 const sx=bounds?bounds.x/previewScale:0,sy=bounds?bounds.y/previewScale:0,sw=bounds?bounds.w/previewScale:img.width,sh=bounds?bounds.h/previewScale:img.height;
 const scale=Math.min(1,1200/Math.max(sw,sh)),src=canvas(Math.max(1,Math.round(sw*scale)),Math.max(1,Math.round(sh*scale)));
 src.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,src.width,src.height);
 return {src,cropped:!!bounds};
}
async function loadImage(url,sample=false){busy(true);try{const img=new Image();img.src=url;await img.decode();const prepared=prepareSource(img);state.source=prepared.src;state.face=null;state.mask=null;frameCropped=prepared.cropped;state.sample=sample;flatBackground=null;cleanSource=null;state.brushMode='move';state.x=state.y=0;state.zoom=1;state.compare=false;$('#zoom').value=100;$('#zoomValue').textContent='100%';$('#compare').textContent='查看美颜前';$('#compare').setAttribute('aria-pressed','false');skinProcess();busy(false);go(3);await analyze()}catch(e){busy(false);toast('这张图片暂时无法读取，请选择 JPG、PNG 或 WebP 图片')}}
async function handleFile(file){if(!file)return;if(file.size>30*1024*1024)return toast('请选择小于 30 MB 的图片');const url=URL.createObjectURL(file);try{await loadImage(url,false)}finally{URL.revokeObjectURL(url);$('#upload').value=''}}
let stream=null,cameraRequest=0;
async function openCamera(){if(!navigator.mediaDevices?.getUserMedia)return toast('此浏览器无法打开摄像头，请选择上传照片');const ticket=++cameraRequest;try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:1600}},audio:false});if(ticket!==cameraRequest){s.getTracks().forEach(t=>t.stop());return}stream=s;$('#video').srcObject=s;$('#cameraPanel').hidden=false;await $('#video').play()}catch(e){closeCamera();toast(e.name==='NotAllowedError'?'摄像头权限未开启，可在浏览器设置允许，或直接上传照片':'摄像头暂不可用，请尝试上传照片')}}
function closeCamera(){cameraRequest++;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('#video').srcObject=null;$('#cameraPanel').hidden=true}
function capture(){const v=$('#video');if(!v.videoWidth)return toast('摄像头尚未就绪');const c=canvas(v.videoWidth,v.videoHeight),ctx=c.getContext('2d');ctx.translate(c.width,0);ctx.scale(-1,1);ctx.drawImage(v,0,0);closeCamera();loadImage(c.toDataURL('image/jpeg',.95),false)}
function crc32(bytes){let crc=-1;for(const n of bytes){crc^=n;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^-1)>>>0}
async function dpiBlob(c){const raw=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!raw)throw Error('图片导出失败');const bytes=new Uint8Array(await raw.arrayBuffer()),chunk=new Uint8Array(21),view=new DataView(chunk.buffer);view.setUint32(0,9);chunk.set([112,72,89,115],4);view.setUint32(8,11811);view.setUint32(12,11811);chunk[16]=1;view.setUint32(17,crc32(chunk.slice(4,17)));return new Blob([bytes.slice(0,33),chunk,bytes.slice(33)],{type:'image/png'})}
async function download(single){if(state.busy)return;if(!currentTemplate())return toast('官方相纸底版尚未加载，暂时无法下载');try{let c=sheet;if(single){const f=state.layout.groups[0];c=canvas(mmToPx(f.w),mmToPx(f.h));photo(c.getContext('2d'),composed(),0,0,c.width,c.height)}const blob=await dpiBlob(c),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`駅前写真室-第二亭-${single?'单张':'相纸'}-${state.layout.id}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('图片已准备下载，可在浏览器下载记录中查看')}catch(e){toast('图片保存失败，请重试')}}
$$('[data-next]').forEach(b=>b.onclick=()=>go(+b.dataset.next));$('#pay').onclick=()=>{toast('演示写真券已领取，无实际扣款');go(2)};$('#upload').onchange=e=>handleFile(e.target.files[0]);$('#openCamera').onclick=openCamera;$('#closeCamera').onclick=closeCamera;$('#capture').onclick=capture;$('#useSample').onclick=()=>loadImage('assets/sample.png',true);$('#retryAnalysis').onclick=analyze;window.addEventListener('pagehide',closeCamera);
const drop=$('#drop');for(const name of ['dragenter','dragover'])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.add('over')});for(const name of ['dragleave','drop'])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.remove('over');if(name==='drop')handleFile(e.dataTransfer.files[0])});
$$('[data-tab]').forEach(b=>b.onclick=()=>{$$('[data-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));$$('[data-tab-panel]').forEach(x=>x.hidden=x.dataset.tabPanel!==b.dataset.tab);if(b.dataset.tab!=='background')setBrushMode('move')});
for(const id of ['zoom','smooth','light','warm'])$('#'+id).oninput=e=>{state[id]=id==='zoom'?+e.target.value/100:+e.target.value;$('#'+id+'Value').textContent=e.target.value+(id==='zoom'?'%':'');schedule()};
$('#resetCrop').onclick=()=>{state.zoom=1;state.x=state.y=0;$('#zoom').value=100;$('#zoomValue').textContent='100%';render()};$('#keepBackground').onchange=e=>{state.keep=e.target.checked;if(state.keep)state.brushMode='move';if(!state.keep&&!state.mask&&!state.sample){state.keep=true;e.target.checked=true;toast('请先完成背景识别')}renderColors();render()};$('#resetBeauty').onclick=()=>{for(const id of ['smooth','light','warm']){state[id]=0;$('#'+id).value=0;$('#'+id+'Value').textContent='0'}schedule()};$('#compare').onclick=()=>{state.compare=!state.compare;$('#compare').setAttribute('aria-pressed',String(state.compare));$('#compare').textContent=state.compare?'恢复美颜效果':'查看美颜前';schedule()};
let drag=null,brushLast=null;
portrait.addEventListener('pointerdown',e=>{if(state.brushMode!=='move'&&state.mask&&!state.keep){brushLast=brushPoint(e);portrait.setPointerCapture(e.pointerId);paintMaskStroke(state.mask,brushLast,brushLast,brushLast.radius,state.brushMode==='restore');scheduleBrushRender();return}drag={px:e.clientX,py:e.clientY,x:state.x,y:state.y};portrait.setPointerCapture(e.pointerId)});
portrait.addEventListener('pointermove',e=>{if(brushLast){const next=brushPoint(e);paintMaskStroke(state.mask,brushLast,next,next.radius,state.brushMode==='restore');brushLast=next;scheduleBrushRender();return}if(!drag)return;const r=portrait.getBoundingClientRect();state.x=Math.max(-2,Math.min(2,drag.x+(e.clientX-drag.px)/r.width));state.y=Math.max(-2,Math.min(2,drag.y+(e.clientY-drag.py)/r.height));render()});
for(const event of ['pointerup','pointercancel'])portrait.addEventListener(event,()=>{drag=null;brushLast=null;render()});
$('#brushErase').onclick=()=>setBrushMode('erase');$('#brushRestore').onclick=()=>setBrushMode('restore');$('#brushMove').onclick=()=>setBrushMode('move');
$('#brushSize').oninput=e=>{state.brushSize=+e.target.value;$('#brushSizeValue').textContent=e.target.value};
$('#print').onclick=()=>{generatedDate=new Date();generatedPrice=priceForState();go(4);sheet.classList.remove('printing');void sheet.offsetWidth;sheet.classList.add('printing')};$('#downloadSheet').onclick=()=>download(false);$('#downloadPortrait').onclick=()=>download(true);
showLayouts();renderColors();renderSteps();$('#print').disabled=true;const initial=new Image();initial.src='assets/sample.png';Promise.all([Promise.all(Object.entries(officialTemplates).map(async([id,definition])=>[id,await loadOfficialTemplate(definition)])),initial.decode(),loadBooth2ReceiptFonts()]).then(([templates])=>{Object.assign(loadedTemplates,Object.fromEntries(templates));const c=canvas(initial.width,initial.height);c.getContext('2d').drawImage(initial,0,0);state.source=c;skinProcess();$('#print').disabled=false;render()}).catch(()=>toast('官网底版加载失败，请刷新后重试'));render();
