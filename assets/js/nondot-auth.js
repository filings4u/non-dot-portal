/* screenings4u Workforce NON-DOT Management Portal — staff auth */
(()=>{
"use strict";
const CACHE_KEY='s4u-nondot-auth-context-v1',CACHE_MS=60*60*1000;
const client=()=>{if(!window.nondotSupabase?.auth)throw new Error('NON-DOT Supabase client is unavailable.');return window.nondotSupabase};
function readCache(uid){try{const x=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');return x&&x.userId===uid&&Date.now()-x.savedAt<CACHE_MS?x.state:null}catch{return null}}
function writeCache(s){try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({userId:s.user.id,savedAt:Date.now(),state:{user:s.user,profile:s.profile||null,roles:s.roles||[],permissions:s.permissions||[]}}))}catch{}}
function clearCache(){try{sessionStorage.removeItem(CACHE_KEY)}catch{}}
async function remote(session){const {data,error}=await client().functions.invoke(window.NONDOT_PORTAL_CONFIG.staffContextFunction,{body:{action:'context'}});if(error||data?.error)throw new Error(data?.error||error?.message||'Unable to verify staff access.');const active=data?.profile?.employment_status==='active'||data?.profile?.status==='active'||data?.profile?.employment_status==null;if(!active)throw new Error('Active screenings4u staff access is required.');const s={session,user:session.user,profile:data.profile||null,roles:data.role_codes||[],permissions:data.permissions||[]};writeCache(s);return s}
function publish(s){document.documentElement.classList.remove('nd-auth-pending');window.NONDOT_AUTH_STATE=s;window.dispatchEvent(new CustomEvent('nondot:authenticated',{detail:s}))}
async function requireAuth(){try{const {data,error}=await client().auth.getSession();if(error)throw error;const session=data?.session;if(!session?.access_token){clearCache();location.replace('nondot-login.html');return null}const cached=readCache(session.user.id);const s=cached?{...cached,session,user:session.user}:await remote(session);publish(s);return s}catch(e){console.error('[NON-DOT Auth]',e);clearCache();location.replace('nondot-login.html');return null}}
async function signOut(){clearCache();try{await client().auth.signOut({scope:'local'})}finally{location.replace('nondot-login.html')}}
window.NONDOTAuth=Object.freeze({requireAuth,signOut,clearCache});
})();
