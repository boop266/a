// 果てなき道：見せるための写真を撮る（電気を戻した夜まで）
const path=require('path');const{execSync}=require('child_process');
const{chromium}=require(path.join(execSync('npm root -g').toString().trim(),'playwright'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'..','index.html')+'?test');await p.waitForTimeout(600);const out=path.resolve(__dirname,'..','mocks');
const shot=async(n,fn)=>{await p.evaluate(fn);await p.screenshot({path:`${out}/play_${n}.png`})};
const M='const M=window.__michi,G=M.G,P=M.P,BX=M.BX,BY=M.BY;';
await shot('1_title',()=>{window.__michi.render()});
await shot('2_street',new Function(M+`G.started=true;M.tp(46.5,59.5,0);P.fx=1;P.fy=-.4;M.step(2);M.render()`));
await shot('3_lobby',new Function(M+`M.tp(BX+3.5,BY+11.5,0);P.fx=0;P.fy=-1;M.step(1.5);M.render()`));
await shot('4_b1',new Function(M+`M.tp(BX+9.5,BY+7,-1);P.fx=0;P.fy=-1;M.step(1.5);M.render()`));
await shot('5_stairs',new Function(M+`M.tp(BX+11.5,BY+7.5,5);G.inpW=[-1,0];for(let i=0;i<40;i++)M.update(1/60);G.inpW=null;M.step(.6);M.render()`));
await shot('6_deck',new Function(M+`G.gen.fuel=100;G.gen.run=true;G.breaker=true;G.t=18*60+10;M.tp(BX+4.5,BY+12.5,8);P.fx=-.6;P.fy=.8;M.step(1);M.interact();M.step(3);M.render()`));
await shot('7_night',new Function(M+`G.t=19*60+40;G.sit=false;M.tp(46.5,62.5,0);P.fx=1;P.fy=-1;M.step(2.5);M.render()`));
await shot('8_top',new Function(M+`M.tp(BX+9.5,BY+7.5,10);M.step(2);M.render()`));
console.log('errors',errs);await b.close()})();
