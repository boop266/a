// カスタムロボ見本：エラーなく動くか／CPU同士で決着がつくか／描く速さ
//   node robo/tests/mock_check.js
const path=require('path');const{execSync}=require('child_process');
const{chromium}=require(path.join(execSync('npm root -g').toString().trim(),'playwright'));
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];
 p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+path.resolve(__dirname,'..','mock.html')+'?test&demo&seed=7');await p.waitForTimeout(300);
 const res=await p.evaluate(()=>{
  const M=window.ROBO;M.pause(true);const out=[];
  for(let m=0;m<8;m++){M.restart();let t=0,downs=0,prev=['act','act'],kinds={};
   while(M.G.phase!=='end'&&t<180){M.step(0.05);t+=0.05;
    M.R.forEach((r,i)=>{if(r.state==='down'&&prev[i]!=='down')downs++;prev[i]=r.state;});
    for(const q of M.P)kinds[q.kind]=1;}
   out.push({t:+t.toFixed(1),res:M.G.result,hp:M.R.map(r=>r.hp),downs,load:[M.R[0].ld,M.R[1].ld].map(l=>Object.values(l).join('/')),kinds:Object.keys(kinds).join(',')});}
  const views={};for(const v of['A','B','C']){M.setView(v);const t0=performance.now();for(let i=0;i<60;i++)M.render(1/60);views[v]=+((performance.now()-t0)/60).toFixed(2);}
  return{out,views};
 });
 console.log(JSON.stringify(res,null,1));
 console.log(errs.length?'エラー:\n'+errs.join('\n'):'エラーなし');
 await b.close();process.exit(errs.length?1:0);
})();
