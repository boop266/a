// 黄泉還：描く土台。3Dは低い解像度で描いて、ディザをかけて拡大（初代の頃の手ざわり）
const GLC = document.getElementById('gl'), UIC = document.getElementById('ui'), UX = UIC.getContext('2d');
const VW = { x: 0, y: 0, w: 640, h: 480, W: 640, H: 480, dpr: 1, portrait: false, side: 0, iw: 400, ih: 300 };
// 文字や画面（メニュー）を描く枠。横持ち・パソコンでは絵と同じ4:3。縦持ちでは横幅いっぱい・縦に長く（文字を読める大きさに）
const UB = { x: 0, y: 0, w: 640, h: 480, u: 4.8 };
const OPT = Object.assign({ ctrl: 'easy', door: 'normal', gfx: 'retro', bgm: 0.7, sfx: 0.9, bright: 2 }, (() => { try { return JSON.parse(localStorage.getItem('yomi_opt') || '{}'); } catch (e) { return {}; } })());
function saveOpt() { try { localStorage.setItem('yomi_opt', JSON.stringify(OPT)); } catch (e) { } }
const RD = { r: null, rt: null, post: null, pcam: null, pscene: null, U: null };
function initRender() {
  const r = new THREE.WebGLRenderer({ canvas: GLC, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: TEST, alpha: false });
  r.setPixelRatio(1); r.toneMapping = THREE.NoToneMapping; r.outputColorSpace = THREE.LinearSRGBColorSpace; r.autoClear = true;
  RD.r = r;
  RD.rt = new THREE.WebGLRenderTarget(400, 300, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  RD.U = { tex: { value: RD.rt.texture }, res: { value: new THREE.Vector2(400, 300) }, fade: { value: 0 }, red: { value: 0 }, time: { value: 0 }, flash: { value: 0 }, grainAmt: { value: 0.035 }, levels: { value: 32 }, gray: { value: 0 }, vig: { value: 0.9 }, gam: { value: 0.8 } };
  RD.post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: RD.U, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `uniform sampler2D tex;uniform vec2 res;uniform float fade,red,time,flash,grainAmt,levels,gray,vig,gam;varying vec2 vUv;
float b2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}
float b4(vec2 a){return b2(.5*a)*.25+b2(a);}
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 c=texture2D(tex,vUv).rgb;
 c=mix(c*12.92,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));
 c=pow(max(c,vec3(0.)),vec3(gam));
 vec2 q=vUv-.5;c*=1.-dot(q,q)*vig;
 c+=(h(floor(vUv*res)+fract(time)*61.)-.5)*grainAmt;
 float l=dot(c,vec3(.299,.587,.114));c=mix(c,vec3(l),gray);
 c=mix(c,vec3(.55,0.,0.)+c*.35,red);
 c+=flash;
 if(levels>1.){float d=b4(gl_FragCoord.xy)-.5;c=floor(c*(levels-1.)+.5+d*.9)/(levels-1.);}
 c*=1.-fade;gl_FragColor=vec4(clamp(c,0.,1.),1.);}`
  }));
  RD.pscene = new THREE.Scene(); RD.pscene.add(RD.post); RD.pcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
}
function layout() {
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  VW.W = W; VW.H = H; VW.dpr = dpr; VW.portrait = H > W * 1.05;
  if (W / H > 4 / 3) { VW.h = H; VW.w = Math.floor(H * 4 / 3); VW.x = Math.floor((W - VW.w) / 2); VW.y = 0; }
  else { VW.w = W; VW.h = Math.floor(W * 3 / 4); VW.x = 0; VW.y = VW.portrait ? Math.max(0, Math.floor(H * 0.06)) : Math.floor((H - VW.h) / 2); }
  VW.side = VW.x;
  if (VW.portrait) { const u = W / 96; UB.x = 0; UB.y = VW.y; UB.w = W; UB.h = Math.min(H - VW.y - 6, Math.round(u * 150)); UB.u = u; }
  else { UB.x = VW.x; UB.y = VW.y; UB.w = VW.w; UB.h = VW.h; UB.u = VW.h / 100; }
  const crisp = OPT.gfx === 'crisp';
  VW.iw = crisp ? Math.min(1280, Math.round(VW.w * dpr)) : 400; VW.ih = Math.round(VW.iw * 3 / 4);
  GLC.style.left = VW.x + 'px'; GLC.style.top = VW.y + 'px'; GLC.style.width = VW.w + 'px'; GLC.style.height = VW.h + 'px';
  GLC.style.imageRendering = crisp ? 'auto' : 'pixelated';
  if (RD.r) { RD.U.gam.value = [1.0, 0.9, 0.8, 0.72, 0.64][OPT.bright ?? 2]; RD.r.setSize(VW.iw, VW.ih, false); RD.rt.setSize(VW.iw, VW.ih); RD.U.res.value.set(VW.iw, VW.ih); RD.U.levels.value = crisp ? 0 : 32; RD.U.grainAmt.value = crisp ? 0.02 : 0.035; }
  UIC.width = Math.round(W * dpr); UIC.height = Math.round(H * dpr); UX.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (typeof layoutTouch === 'function') layoutTouch();
}
// 3Dの場面を描く（scene/camera を受け取って、後処理まで）
function draw3D(scene, camera, t) {
  RD.U.time.value = t;
  RD.r.setRenderTarget(RD.rt); RD.r.render(scene, camera);
  RD.r.setRenderTarget(null); RD.r.render(RD.pscene, RD.pcam);
}
