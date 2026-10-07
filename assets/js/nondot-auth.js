/* screenings4u Workforce NON-DOT Management Portal — staff auth */
(()=>{
"use strict";
const CACHE_KEY='s4u-nondot-auth-context-v1',CACHE_MS=2*60*1000;
const client=()=>{if(!window.nondotSupabase?.auth)throw new Error('NON-DOT Supabase client is unavailable.');return window.nondotSupabase};
function readCache(uid){try{const x=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');return x&&x.userId===uid&&Date.now()-x.savedAt<CACHE_MS?x.state:null}catch{return null}}
function writeCache(s){try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({userId:s.user.id,savedAt:Date.now(),state:{user:s.user,profile:s.profile||null,roles:s.roles||[],permissions:s.permissions||[]}}))}catch{}}
function clearCache(){try{sessionStorage.removeItem(CACHE_KEY)}catch{}}
function showLoading(){let el=document.getElementById('nd-auth-loading');if(!el){el=document.createElement('div');el.id='nd-auth-loading';el.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#163b6d"><div style="text-align:center"><strong style="display:block;font-size:18px;margin-bottom:8px">Workforce NON-DOT Management</strong><span style="color:#6b7f99">Loading your management workspace…</span></div></div>';document.body.appendChild(el)}}
function showError(msg){document.documentElement.classList.remove('nd-auth-pending');document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#163b6d;padding:24px"><div style="width:min(560px,100%);background:#fff;border:1px solid #d9e3ef;border-radius:14px;padding:28px"><strong style="display:block;font-size:20px;margin-bottom:8px">Unable to load management portal</strong><p style="margin:0 0 18px;color:#5f738d">'+String(msg||'Your management session could not be verified.')+'</p><a href="nondot-login.html" style="display:inline-block;background:#f05a00;color:#fff;text-decoration:none;font-weight:800;padding:11px 16px;border-radius:8px">Return to Login</a></div></div>'}
async function remote(session){
  const call=()=>client().functions.invoke(window.NONDOT_PORTAL_CONFIG.staffContextFunction,{body:{action:'context'}});
  let out=await call();
  if(out.error||out.data?.error){
    const refreshed=await client().auth.refreshSession();
    if(!refreshed.error&&refreshed.data?.session?.access_token){session=refreshed.data.session;out=await call()}
  }
  const {data,error}=out;
  if(error||data?.error)throw new Error(data?.error||error?.message||'Unable to verify staff access.');
  const active=data?.profile?.employment_status==='active'||data?.profile?.status==='active'||data?.profile?.employment_status==null;
  if(!active)throw new Error('Active screenings4u staff access is required.');
  const state={session,user:session.user,profile:data.profile||null,roles:data.role_codes||[],permissions:data.permissions||[]};writeCache(state);return state
}
function publish(s){document.getElementById('nd-auth-loading')?.remove();document.documentElement.classList.remove('nd-auth-pending');window.NONDOT_AUTH_STATE=s;window.dispatchEvent(new CustomEvent('nondot:authenticated',{detail:s}))}
async function requireAuth(){showLoading();try{let {data,error}=await client().auth.getSession();if(error)throw error;let session=data?.session;if(!session?.access_token){clearCache();location.replace('nondot-login.html');return null}const cached=readCache(session.user.id);const s=cached?{...cached,session,user:session.user}:await remote(session);publish(s);return s}catch(e){console.error('[NON-DOT Auth]',e);clearCache();showError(e?.message||'Unable to verify your management session.');return null}}
async function revalidate(){try{const {data,error}=await client().auth.getSession();if(error||!data?.session?.access_token)throw error||new Error('Session expired.');const s=await remote(data.session);publish(s);return s}catch(e){clearCache();throw e}}
async function signOut(){clearCache();try{localStorage.setItem('s4u-nondot-admin-logout-v1',JSON.stringify({at:Date.now(),reason:'manual'}))}catch{}try{await client().auth.signOut({scope:'local'})}finally{location.replace('nondot-login.html')}}
window.NONDOTAuth=Object.freeze({requireAuth,revalidate,signOut,clearCache});
})();
