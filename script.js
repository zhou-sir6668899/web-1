// Main frontend script (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// <-- paste your firebaseConfig here -->
const firebaseConfig = {
  apiKey: "AIzaSyADOCcNc25GUmDNKiHGZxLnFcUjaq1tlOo",
  authDomain: "hawk-e6b7b.firebaseapp.com",
  projectId: "hawk-e6b7b",
  storageBucket: "hawk-e6b7b.firebasestorage.app",
  messagingSenderId: "569058504244",
  appId: "1:569058504244:web:485093c03906bd05c6a461"
};

const ADMIN_EMAIL = 'hawkzhou@123.com';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM
const emailEl = document.getElementById('email');
const pwdEl = document.getElementById('pwd');
const loginBtn = document.getElementById('loginBtn');
const regBtn = document.getElementById('regBtn');
const msgEl = document.getElementById('msg');
const wechatBtn = document.getElementById('wechatBtn');
const qqBtn = document.getElementById('qqBtn');
const weiboBtn = document.getElementById('weiboBtn');
const playToggle = document.getElementById('playToggle');
const bgm = document.getElementById('bgm');
const tipsRoot = document.getElementById('tipsRoot');
const adminBtn = document.getElementById('adminBtn');
const shareBtn = document.getElementById('shareBtn');

// click effect B
function createClickExplosion(x,y,count=28){
  for(let i=0;i<count;i++){
    const p = document.createElement('div'); p.className='particle';
    const s = 6 + Math.random()*10; p.style.width = p.style.height = s+'px';
    p.style.left = (x - s/2) + 'px'; p.style.top = (y - s/2) + 'px';
    const hue = Math.floor(Math.random()*360); p.style.background = `linear-gradient(45deg,hsl(${hue},90%,65%),hsl(${(hue+60)%360},90%,65%))`;
    p.style.transition = 'transform .9s cubic-bezier(.2,.8,.2,1), opacity .9s';
    document.body.appendChild(p);
    const dx = (Math.random()-0.5)*400; const dy = (Math.random()-0.5)*400;
    requestAnimationFrame(()=>{ p.style.transform = `translate(${dx}px,${dy}px) scale(0.2)`; p.style.opacity = '0'; });
    setTimeout(()=> p.remove(), 950);
  }
}
function createRipple(x,y){
  const r = document.createElement('div'); r.className='ripple';
  document.body.appendChild(r);
  const size = Math.max(window.innerWidth, window.innerHeight)*0.12;
  r.style.width = r.style.height = size + 'px';
  r.style.left = (x - size/2) + 'px'; r.style.top = (y - size/2) + 'px';
  r.style.transition = 'transform .6s ease, opacity .6s ease';
  r.style.transform = 'scale(0)'; r.style.opacity = '0.28';
  requestAnimationFrame(()=>{ r.style.transform = 'scale(1)'; r.style.opacity = '0'; });
  setTimeout(()=> r.remove(), 650);
}
function attachEffect(el){
  el.addEventListener('click', (ev)=>{
    const x = ev.clientX || window.innerWidth/2; const y = ev.clientY || window.innerHeight/2;
    createRipple(x,y); createClickExplosion(x,y,22);
  });
}
[loginBtn, regBtn, wechatBtn, qqBtn, weiboBtn, playToggle, adminBtn, shareBtn].forEach(attachEffect);

// play on user gesture
['click','touchstart'].forEach(ev => document.addEventListener(ev, ()=>{ bgm.play().catch(()=>{}); }, {once:true, passive:true}));

// recordLogin
async function recordLogin(email, action='login', shareId=null, provider=null){
  const ua = navigator.userAgent || '';
  let ip=null, geo=null;
  (async ()=>{
    try{ const r = await fetch('https://ipapi.co/json/'); if(r.ok){ const j = await r.json(); ip=j.ip||null; geo=j.city? (j.city + (j.region?','+j.region:'') + (j.country_name?','+j.country_name:'')) : null; } }catch(e){}
  })();
  await new Promise(res=>setTimeout(res,600));
  try{ await addDoc(collection(db,'login_logs'), { email: email||null, action, time: serverTimestamp(), ip, geo, userAgent: ua, shareId, provider }); }catch(e){ console.warn('write failed', e); }
}

// auth handlers
regBtn.addEventListener('click', ()=>{
  msgEl.textContent = '注册中...';
  const email = emailEl.value.trim(), pwd = pwdEl.value;
  if(!email || !pwd){ msgEl.textContent='请输入邮箱和密码'; return; }
  createUserWithEmailAndPassword(auth, email, pwd)
    .then(async ()=>{ msgEl.textContent='注册并登录成功'; await recordLogin(email,'register'); })
    .catch(err=>{ console.error(err); if(err.code==='auth/email-already-in-use') msgEl.textContent='该邮箱已被注册'; else msgEl.textContent = '注册失败: ' + (err.message||err.code); });
});

loginBtn.addEventListener('click', ()=>{
  msgEl.textContent = '登录中...';
  const email = emailEl.value.trim(), pwd = pwdEl.value;
  if(!email || !pwd){ msgEl.textContent='请输入邮箱和密码'; return; }
  signInWithEmailAndPassword(auth, email, pwd)
    .then(async ()=>{ msgEl.textContent='登录成功'; await recordLogin(email,'login'); })
    .catch(err=>{ console.error(err); if(err.code==='auth/user-not-found') msgEl.textContent='账号不存在，请先注册'; else if(err.code==='auth/wrong-password') msgEl.textContent='密码错误'; else msgEl.textContent = '登录失败: ' + (err.message||err.code); });
});

function socialSim(name){ msgEl.textContent = name+' 登录（模拟）...'; setTimeout(()=>{ msgEl.textContent=''; alert(name+' 登录功能正在开发中'); },400); }
wechatBtn.addEventListener('click', ()=>socialSim('微信'));
qqBtn.addEventListener('click', ()=>socialSim('QQ'));
weiboBtn.addEventListener('click', ()=>socialSim('微博'));

shareBtn.addEventListener('click', ()=>{ const shareId = Math.random().toString(36).slice(2,9); const u = auth.currentUser; recordLogin(u?u.email:'anonymous','share',shareId); const url = location.origin + location.pathname + '?share=' + shareId; prompt('复制并发给好友：', url); });

adminBtn.addEventListener('click', async ()=>{
  const u = auth.currentUser;
  if(!u){ alert('请先以管理员账号登录'); return; }
  if(u.email !== ADMIN_EMAIL){ alert('当前账户非管理员'); return; }
  try{
    const q = query(collection(db,'login_logs'), orderBy('time','desc'), limit(500));
    const snap = await getDocs(q);
    const panel = document.createElement('div'); panel.className='admin-panel';
    let html = '<div style="display:flex;justify-content:space-between;align-items:center"><h3>管理员日志（最近）</h3><div><button id="closeAdmin" class="btn">关闭</button></div></div><div class="table">';
    snap.forEach(doc=>{ const d = doc.data(); const t = d.time && d.time.toDate ? d.time.toDate().toLocaleString() : '-'; html += `<div class="row-item">[${t}] <b>${d.email||'-'}</b> — ${d.action||'-'} ${d.shareId?(' — share:'+d.shareId):''} <br/><small>ip:${d.ip||'-'} geo:${d.geo||'-'} ua:${(d.userAgent||'').slice(0,120)}</small></div>`; });
    html += '</div>'; panel.innerHTML = html; document.body.appendChild(panel); document.getElementById('closeAdmin').onclick = ()=> panel.remove();
  }catch(e){ alert('读取日志失败：' + (e.message||e)); }
});

onAuthStateChanged(auth, user=>{
  if(user){
    document.getElementById('authCard').style.display = 'none';
    bgm.play().catch(()=>{});
    initVisuals();
  } else {
    document.getElementById('authCard').style.display = 'block';
    document.getElementById('tipsRoot').innerHTML = '';
  }
});

playToggle.addEventListener('click', ()=>{ if(bgm.paused){ bgm.play().catch(()=>{}); playToggle.textContent='停止音乐'; } else { bgm.pause(); playToggle.textContent='播放/停止 音乐'; } });

// VISUALS (meteors + heart + tips) - simplified version
let canvas, ctx, bursts = [];

function initVisuals(){
  const meteorCanvas = document.getElementById('meteorCanvas');
  const mctx = meteorCanvas.getContext('2d');
  function resizeM(){ meteorCanvas.width = innerWidth; meteorCanvas.height = innerHeight; }
  addEventListener('resize', ()=>{ resizeM(); resizeMain(); });
  resizeM();
  const meteors = [];
  function spawnMeteor(){ if(meteors.length<18 && Math.random()<0.6){ meteors.push({ x:Math.random()*meteorCanvas.width, y:Math.random()*meteorCanvas.height*0.45, len:80+Math.random()*160, vx:-6-Math.random()*6, vy:2+Math.random()*2, hue:180+Math.random()*200, life:40+Math.random()*80 }); } setTimeout(spawnMeteor, 300+Math.random()*900); }
  spawnMeteor();
  function drawMeteors(){ mctx.clearRect(0,0,meteorCanvas.width,meteorCanvas.height); for(let i=meteors.length-1;i>=0;i--){ const s=meteors[i]; const grd=mctx.createLinearGradient(s.x,s.y,s.x+s.vx*s.len,s.y+s.vy*s.len); grd.addColorStop(0,`hsla(${s.hue},90%,70%,0.9)`); grd.addColorStop(1,`hsla(${s.hue},90%,60%,0)`); mctx.strokeStyle=grd; mctx.lineWidth=2; mctx.moveTo(s.x,s.y); mctx.lineTo(s.x+s.vx*s.len,s.y+s.vy*s.len); mctx.stroke(); s.x+=s.vx; s.y+=s.vy; s.life--; if(s.life<=0||s.x<-200||s.y>meteorCanvas.height+200) meteors.splice(i,1); } requestAnimationFrame(drawMeteors); }
  drawMeteors();

  canvas = document.getElementById('bgCanvas');
  ctx = canvas.getContext('2d');
  function resizeMain(){ canvas.width = innerWidth; canvas.height = innerHeight; makeHeartParticles(); }
  resizeMain();

  let heartParts = [];
  function heartFn(t){ const x=16*Math.pow(Math.sin(t),3); const y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t); return [x,y]; }
  function makeHeartParticles(){ heartParts=[]; const n=Math.max(220, Math.floor((canvas.width*canvas.height)/8000)); for(let i=0;i<n;i++){ const t=(i/n)*Math.PI*2; const [hx,hy]=heartFn(t); heartParts.push({ x:canvas.width/2+hx*10+(Math.random()-0.5)*10, y:canvas.height/2-hy*10+(Math.random()-0.5)*10, vx:0, vy:0, size:1+Math.random()*2.2, hue:Math.floor(Math.random()*360) }); } window._heartPartsRef = heartParts; }
  makeHeartParticles();

  bursts=[];
  function spawnBursts(x,y,count=28){ for(let i=0;i<count;i++) bursts.push({ x, y, vx:(Math.random()-0.5)*8, vy:(Math.random()-0.9)*8, life:60+Math.random()*80, hue:Math.floor(Math.random()*360), size:1+Math.random()*3 }); }
  window.spawnBursts = spawnBursts;

  canvas.addEventListener('click',(e)=>{ const r=canvas.getBoundingClientRect(); spawnBursts(e.clientX-r.left,e.clientY-r.top,28); createClickExplosion(e.clientX,e.clientY,18); });

  let phase=0;
  function animateMain(){ ctx.clearRect(0,0,canvas.width,canvas.height); const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height); g.addColorStop(0,'rgba(5,4,12,0.45)'); g.addColorStop(1,'rgba(2,2,10,0.45)'); ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height); for(let i=bursts.length-1;i>=0;i--){ const b=bursts[i]; b.x+=b.vx; b.y+=b.vy; b.life--; ctx.beginPath(); ctx.fillStyle=`hsl(${b.hue},80%,60%,${Math.max(0,b.life/120)})`; ctx.arc(b.x,b.y,b.size,0,Math.PI*2); ctx.fill(); if(b.life<=0) bursts.splice(i,1); } phase+=0.02; const scale = 1+0.06*Math.sin(phase*2); const heartRef = window._heartPartsRef||[]; for(let i=0;i<heartRef.length;i++){ const p=heartRef[i]; const t=(i/heartRef.length)*Math.PI*2+phase*0.04; const [hx,hy]=heartFn(t); const tx=canvas.width/2+hx*10*scale; const ty=canvas.height/2-hy*10*scale; p.vx += (tx - p.x)*0.02; p.vy += (ty - p.y)*0.02; p.vx *= 0.92; p.vy *= 0.92; p.x += p.vx; p.y += p.vy; ctx.beginPath(); ctx.fillStyle = `hsl(${p.hue},85%,60%)`; ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); } requestAnimationFrame(animateMain); }
  animateMain();

  // tips
  let tipsLaunched=false;
  const texts = [
    "坚持就是胜利","相信自己，你可以","每一步都算数","今天比昨天更靠近目标",
    "你值得被善待","失败是学习的一部分","越努力越幸运","勇敢一点，未来属于你",
    "Keep going — your future is built today","Dream big, start small","Progress > perfection","Small steps every day",
    "Stay focused. Keep moving.","Make today count."
  ];
  function launchTips(){ if(tipsLaunched) return; tipsLaunched=true; tipsRoot.innerHTML=''; const vw=innerWidth; let count=Math.min(80,Math.floor((vw*innerHeight)/90000)); if(count<20) count=20; const targets=[]; for(let i=0;i<count;i++) targets.push({tx:8+Math.random()*84, ty:6+Math.random()*88}); const sides=['top','bottom','left','right']; for(let i=0;i<count;i++){ const el=document.createElement('div'); el.className='tip'; el.textContent = texts[Math.floor(Math.random()*texts.length)]; el.style.background='#fff'; el.style.color='#111'; el.style.fontWeight='700'; el.style.borderLeft='6px solid #ff9fbf'; el.style.padding='8px 12px'; el.style.borderRadius='6px'; if(innerWidth<480){ el.style.fontSize='16px'; el.style.padding='10px 14px'; }else if(innerWidth<900){ el.style.fontSize='14px'; el.style.padding='8px 12px'; }else el.style.fontSize='13px'; const side = sides[i%4]; if(side==='top'){ el.style.left = targets[i].tx+'%'; el.style.top='-16%'; el.style.transition='all 5s cubic-bezier(.2,.8,.2,1)'; setTimeout(()=>{ el.style.left = targets[i].tx+'%'; el.style.top = targets[i].ty+'%'; el.style.opacity='1'; },50);} if(side==='bottom'){ el.style.left = targets[i].tx+'%'; el.style.top='116%'; el.style.transition='all 5s cubic-bezier(.2,.8,.2,1)'; setTimeout(()=>{ el.style.left = targets[i].tx+'%'; el.style.top = targets[i].ty+'%'; el.style.opacity='1'; },50);} if(side==='left'){ el.style.left='-28%'; el.style.top = targets[i].ty+'%'; el.style.transition='all 5s cubic-bezier(.2,.8,.2,1)'; setTimeout(()=>{ el.style.left = targets[i].tx+'%'; el.style.top = targets[i].ty+'%'; el.style.opacity='1'; },50);} if(side==='right'){ el.style.left='124%'; el.style.top = targets[i].ty+'%'; el.style.transition='all 5s cubic-bezier(.2,.8,.2,1)'; setTimeout(()=>{ el.style.left = targets[i].tx+'%'; el.style.top = targets[i].ty+'%'; el.style.opacity='1'; },50);} tipsRoot.appendChild(el); el.addEventListener('transitionend', ()=>{ el.animate([{transform:'translateY(0)'},{transform:'translateY(-6px)'},{transform:'translateY(0)'}],{duration:4000,iterations:Infinity,delay:Math.random()*1000}); }, {once:true}); } }
  setTimeout(()=>{ launchTips(); },900);

}