/* screenings4u Workforce NON-DOT Management Portal — session & browser security guard */
(()=>{
'use strict';
const IDLE_MS=10*60*1000;
const WARN_MS=60*1000;
const CHECK_MS=1000;
const ACTIVITY_KEY='s4u-nondot-admin-last-activity-v1';
const LOGOUT_KEY='s4u-nondot-admin-logout-v1';
const client=()=>window.nondotSupabase;
let warning=null,timer=null,lastWrite=0,loggingOut=false;
const now=()=>Date.now();
const readLast=()=>{const n=Number(localStorage.getItem(ACTIVITY_KEY)||0);return Number.isFinite(n)&&n>0?n:0};
const writeLast=(force=false)=>{const t=now();if(!force&&t-lastWrite<5000)return;lastWrite=t;localStorage.setItem(ACTIVITY_KEY,String(t));closeWarning()};
const fmt=s=>String(Math.max(0,Math.ceil(s))).padStart(2,'0');
function closeWarning(){if(warning){warning.remove();warning=null}}
async function logout(reason='inactive'){
  if(loggingOut)return;loggingOut=true;closeWarning();clearInterval(timer);try{sessionStorage.removeItem('s4u-nondot-auth-context-v1')}catch{}
  try{localStorage.setItem(LOGOUT_KEY,JSON.stringify({at:now(),reason,nonce:crypto.randomUUID?.()||String(Math.random())}))}catch{}
  try{await client()?.auth?.signOut({scope:'local'})}catch{}
  location.replace('nondot-login.html?reason='+encodeURIComponent(reason));
}
async function stayLoggedIn(){
  const btn=warning?.querySelector('[data-stay]');if(btn){btn.disabled=true;btn.textContent='Verifying…'}
  try{
    const {data,error}=await client().auth.refreshSession();
    if(error||!data?.session?.access_token)throw error||new Error('Session expired');
    if(window.NONDOTAuth?.revalidate)await window.NONDOTAuth.revalidate();
    writeLast(true);closeWarning();
  }catch(e){console.warn('[NON-DOT Security] Unable to extend session',e);await logout('expired')}
}
function showWarning(remainingMs){
  if(warning)return;
  warning=document.createElement('div');warning.className='nd-session-guard';warning.setAttribute('role','dialog');warning.setAttribute('aria-modal','true');warning.setAttribute('aria-labelledby','ndSessionTitle');
  warning.innerHTML=`<div class="nd-session-guard-card"><div class="nd-session-guard-brand"><img src="images/workforce-non-dot.png" alt="Workforce NON-DOT"><span>SECURE ADMIN SESSION</span></div><h2 id="ndSessionTitle">Your session is about to expire</h2><p>You have been inactive. For security, this management session will automatically sign out after 10 minutes of inactivity.</p><div class="nd-session-countdown">Signing out in <strong data-countdown>01:00</strong></div><div class="nd-session-actions"><button type="button" class="nd-btn" data-logout>Log Out Now</button><button type="button" class="nd-btn primary" data-stay>Stay Logged In</button></div></div>`;
  document.body.appendChild(warning);
  warning.querySelector('[data-stay]')?.addEventListener('click',stayLoggedIn);
  warning.querySelector('[data-logout]')?.addEventListener('click',()=>logout('manual'));
  updateCountdown(remainingMs);
  warning.querySelector('[data-stay]')?.focus();
}
function updateCountdown(ms){const el=warning?.querySelector('[data-countdown]');if(el){const sec=Math.max(0,Math.ceil(ms/1000));el.textContent=`${Math.floor(sec/60)}:${fmt(sec%60)}`}}
async function verifySession(){
  try{const {data,error}=await client().auth.getSession();if(error||!data?.session?.access_token){await logout('expired');return false}return true}catch{await logout('expired');return false}
}
function tick(){
  const last=readLast();if(!last){writeLast(true);return}
  const idle=now()-last;const remaining=IDLE_MS-idle;
  if(remaining<=0){logout('inactive');return}
  if(remaining<=WARN_MS){showWarning(remaining);updateCountdown(remaining)}else closeWarning();
}
function activity(e){if(warning)return; if(e?.isTrusted===false)return;writeLast(false)}
function bind(){
  ['pointerdown','keydown','touchstart','scroll'].forEach(ev=>window.addEventListener(ev,activity,{passive:true,capture:true}));
  window.addEventListener('mousemove',activity,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){tick();verifySession()}});
  window.addEventListener('pageshow',e=>{if(e.persisted){tick();verifySession()}});
  window.addEventListener('storage',e=>{if(e.key===LOGOUT_KEY&&e.newValue)logout('signed-out');if(e.key===ACTIVITY_KEY)tick()});
  client()?.auth?.onAuthStateChange?.((event,session)=>{if(event==='SIGNED_OUT'||(!session&&event!=='INITIAL_SESSION'))logout('expired')});
  document.addEventListener('contextmenu',()=>{}, {passive:true});
}
async function init(){
  if(!window.NONDOT_PORTAL_CONFIG||!client()?.auth)return;
  const last=readLast();if(!last)writeLast(true);
  const ok=await verifySession();if(!ok)return;
  bind();tick();timer=setInterval(tick,CHECK_MS);
}
window.NONDOTSecurity=Object.freeze({init,logout,stayLoggedIn,markActivity:()=>writeLast(true),idleTimeoutMs:IDLE_MS});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
