// カスタムロボ見本：同じ瞬間を A/B/C の見え方で撮る
//   node robo/tests/mock_shots.js <保存先> [seed]
const path=require('path');const{execSync}=require('child_process');
const{chromium}=require(path.join(execSync('npm root -g').toString().trim(),'playwright'));
const out=process.argv[2]||require('os').tmpdir(),seed=process.argv[3]||'11';
(async()=>{
 const b=await chromium.launch();const errs=[];
 const url='file://'+path.resolve(__dirname,'..','mock.html');
 async function page(w,h,q){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
  p.on('pageerror',e=>errs.push(e.message));await p.goto(url+q);await p.waitForTimeout(200);await p.evaluate(()=>ROBO.pause(true));return p;}
 // 1) 撃ち合いのさなか（ボムが飛び、ポッドが追い、弾が走る）
 const p=await page(1280,720,`?test&demo&seed=${seed}`);
 const found=await p.evaluate(()=>{const M=ROBO;M.restart();
  for(let i=0;i<4000;i++){M.step(0.02);const k={};for(const q of M.P)k[q.kind]=(k[q.kind]||0)+1;
   const bomb=M.P.find(q=>q.kind==='bomb'&&q.age>0.25&&q.age<q.tf-0.15);
   if(bomb&&(k.seeker||k.mine||k.wave)&&(k.bullet||0)>=1&&M.G.phase==='fight')return M.G.time;}return -1;});
 for(const v of['A','B','C']){await p.evaluate(v=>{ROBO.setView(v);for(let i=0;i<40;i++)ROBO.render(1/60);},v);await p.screenshot({path:path.join(out,`mid_${v}.png`)});}
 // 2) ダウンを取った直後（決め手の跡が残る）
 const found2=await p.evaluate(()=>{const M=ROBO;for(let i=0;i<6000;i++){M.step(0.01);if(M.GH.length&&M.GH[0].life<M.GH[0].max-0.35)return M.G.time;if(M.G.phase==='end')M.restart();}return -1;});
 for(const v of['A','B','C']){await p.evaluate(v=>{ROBO.setView(v);for(let i=0;i<40;i++)ROBO.render(1/60);},v);await p.screenshot({path:path.join(out,`down_${v}.png`)});}
 // 3) スマホ縦（自分で遊ぶ画面・指のボタンつき）
 for(const v of['A','B','C']){const q=await page(390,844,`?test&touch&seed=${seed}&view=${v}`);
  await q.evaluate(()=>{const M=ROBO;M.restart();M.step(2.2);for(let i=0;i<20;i++)M.render(1/60);});
  await q.screenshot({path:path.join(out,`phone_${v}.png`)});await q.close();}
 // 4) 決着の画面（組み替え）
 const e=await page(390,844,`?test&touch&seed=${seed}`);
 await e.evaluate(()=>{const M=ROBO;M.restart();M.step(2);M.R[0].hp=0;M.G.phase='end';M.G.result='lose';M.render(1/60);});
 await e.screenshot({path:path.join(out,`phone_end.png`)});
 console.log('moments',found,found2);console.log(errs.length?'エラー:\n'+errs.join('\n'):'エラーなし');
 await b.close();
})();
