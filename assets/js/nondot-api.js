/* screenings4u Workforce NON-DOT Management Portal — backend adapter */
(()=>{
"use strict";
const cfg=()=>window.NONDOT_PORTAL_CONFIG;
async function session(){const {data,error}=await window.nondotSupabase.auth.getSession();if(error)throw error;if(!data?.session?.access_token)throw new Error('Your NON-DOT management session has expired.');return data.session}
async function invoke(fn,body={}){const s=await session();const r=await fetch(`${cfg().supabaseUrl}/functions/v1/${fn}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`,'apikey':cfg().supabaseAnonKey},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok||d?.error)throw new Error(d?.error||d?.message||`NON-DOT request failed (${r.status}).`);return d}
const read=(action,extra={})=>invoke(cfg().managementReadFunction,{action,...extra});
const write=(action,payload={})=>invoke(cfg().managementWriteFunction,{action,...payload});
const extended=(action,payload={})=>invoke(cfg().extendedWriteFunction,{action,...payload});
const portalAccess=(action,payload={})=>invoke(cfg().portalAccessFunction,{action,...payload});
window.NONDOTApi=Object.freeze({read,write,extended,portalAccess,invoke});
})();
