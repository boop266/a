// 果てなき道：いろいろな場所の写真を撮って、目で確かめる
//   node michi/tests/look.js [保存先] [場面,場面,...]   例） node michi/tests/look.js /tmp street,deck,night
const path=require('path');const{execSync}=require('child_process');
const{chromium}=require(path.join(execSync('npm root -g').toString().trim(),'playwright'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];
p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve(__dirname,'..','index.html')+'?test');await p.waitForTimeout(1200);
const out=process.argv[2]||require('os').tmpdir();
const list=(process.argv[3]||'title').split(',');
const S={
 title:`M.step(.5)`,
 street:`M.start();M.tp(47.5,71.6,0);M.G.t=17*60+20;M.step(2)`,
 tower:`M.start();M.tp(91,64,0);M.G.t=17*60+40;M.step(2)`,
 lobby:`M.start();M.tp(M.BX+3.5,M.BY+11.5,0);M.step(1)`,
 b1:`M.start();M.tp(M.BX+9.5,M.BY+7,-1);M.step(1)`,
 stairs:`M.start();M.tp(M.BX+11.5,M.BY+7.5,5);M.G.inpW=[-1,0];for(let i=0;i<40;i++)M.update(1/60);M.G.inpW=null;M.step(.5)`,
 deck:`M.start();M.G.t=18*60+5;M.tp(M.BX+4.5,M.BY+12.5,8);M.step(2)`,
 night:`M.start();M.G.gen={fuel:100,run:true};M.G.breaker=true;M.G.t=19*60+50;M.tp(84,68,0);M.step(2)`,
 top:`M.start();M.G.gen={fuel:100,run:true};M.G.breaker=true;M.G.t=19*60+50;M.tp(M.BX+9.5,M.BY+7.5,10);M.step(2)`,
 station:`M.start();M.G.t=16*60;M.tp(60.5,33.5,0);M.step(2)`,
 train:`M.start();M.G.t=16*60;M.tp(50.5,16.5,0);M.step(2)`,
 school:`M.start();M.G.t=15*60;M.tp(85.5,96.5,0);M.step(2)`,
 classroom:`M.start();M.G.t=15*60;M.tp(M.SX+14.5,M.SY+3.5,1);M.step(2)`,
 schoolroof:`M.start();M.G.t=18*60;M.tp(M.SX+6.5,M.SY+5.5,2);M.step(2)`,
 shrine:`M.start();M.G.t=17*60+30;M.tp(16.5,36.5,0);M.step(2)`,
 konbini:`M.start();M.G.t=14*60;M.tp(M.KX+3.5,M.KY+4.5,0);M.step(2)`,
 park:`M.start();M.G.t=18*60+30;M.tp(46.5,86.5,0);M.step(2)`,
 house:`M.start();M.G.t=13*60;M.tp(25.5,48.5,0);M.step(2)`,
 house2:`M.start();M.G.t=13*60;M.tp(25.5,46.5,1);M.step(2)`,
 river:`M.start();M.G.t=18*60+20;M.tp(124.5,69.5,0);M.step(2)`,
 river2:`M.start();M.G.t=14*60;M.tp(118.5,64.5,0);M.step(2)`,
 power:`M.start();M.G.t=18*60+40;M.G.gen={fuel:100,run:true};M.G.breaker=true;M.tp(M.BX+16.5,M.BY+7.5,-1);M.G.power=true;M.startCine('power');M.step(6.2)`,
 farlight:`M.start();M.G.t=20*60;M.G.gen={fuel:100,run:true};M.G.breaker=true;M.G.flags.deck=1;M.tp(M.BX+8.5,M.BY+15.5,8);M.startCine('farlight');M.step(6)`,
 chapter:`M.start();M.G.t=20*60;M.G.gen={fuel:100,run:true};M.G.breaker=true;M.G.flags.deck=1;M.tp(M.BX+8.5,M.BY+15.5,8);M.startCine('farlight');M.step(11);M.step(2)`,
 decknoon:`M.start();M.G.t=11*60;M.tp(M.BX+15.5,M.BY+3.5,8);M.step(2)`,
 morning:`M.start();M.G.t=6*60+20;M.tp(64.5,72.5,0);M.step(2)`,
};
for(const n of list){const t0=Date.now();await p.evaluate(src=>{const M=window.__michi;eval(src);M.frame()},S[n]);await p.screenshot({path:`${out}/m_${n}.png`});console.log(n,Date.now()-t0+'ms')}
const perf=await p.evaluate(()=>{const M=window.__michi;const ts=[];for(let i=0;i<12;i++){const t=performance.now();M.frame();ts.push(performance.now()-t)}ts.sort((a,b)=>a-b);return ts[6].toFixed(1)});
console.log('frame(last scene) ms',perf,'errors',errs.slice(0,6));await b.close()})();
