export const layouts=[
 {id:'resume',officialUrl:'https://www.me-group.jp/assets/img/individual/photome_img_10.jpg',available:true,name:'履歴書・運転免許',zhName:'简历照／驾驶证照',tag:'六大三小',detail:'30×40 mm ×6 + 25×30 mm ×3',groups:[{w:30,h:40,n:6,cols:3},{w:25,h:30,n:3,cols:3}]},
 {id:'passport',officialUrl:'https://www.me-group.jp/assets/img/individual/photome_img_11.jpg',available:true,name:'パスポート・マイナンバー',zhName:'护照／日本个人编号卡',tag:'四张同尺寸',detail:'35×45 mm ×4',groups:[{w:35,h:45,n:4,cols:2}]},
 {id:'medium',officialUrl:'https://www.me-group.jp/assets/img/individual/photome_img_12.jpg',available:true,name:'中型・在留カード',zhName:'中型照片／在留卡',tag:'两大两小',detail:'35×45 mm ×2 + 30×40 mm ×2',groups:[{w:35,h:45,n:2,cols:2},{w:30,h:40,n:2,cols:2}]},
 {id:'large',officialUrl:'https://www.me-group.jp/assets/img/individual/photome_img_13.jpg',available:true,name:'大型',zhName:'大尺寸照片',tag:'一大一小',detail:'50×70 mm ×1 + 45×55 mm ×1',groups:[{w:50,h:70,n:1,cols:1},{w:45,h:55,n:1,cols:1}]}
];
export const mmToPx=mm=>Math.round(mm/25.4*300);
