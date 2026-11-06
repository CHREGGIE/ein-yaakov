const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for (const [f,w,h,o] of [['banner',2560,1440,'jpeg'],['avatar',800,800,'png'],['avatar-photo',800,800,'jpeg'],['watermark',300,300,'png']]){
 const p=await b.newPage({viewport:{width:w,height:h}});await p.goto('file://'+process.cwd()+'/'+f+'.html');await p.evaluate(()=>document.fonts.ready);
 await p.screenshot({path:`out/${f}.${o}`,type:o,omitBackground:o==='png',...(o==='jpeg'?{quality:92}:{})});}
await b.close();})();
