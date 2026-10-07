/* screenings4u Workforce NON-DOT Management Portal — backend adapter */
(()=>{
"use strict";
const cfg=()=>window.NONDOT_PORTAL_CONFIG;
async function session(){const {data,error}=await window.nondotSupabase.auth.getSession();if(error)throw error;if(!data?.session?.access_token)throw new Error('Your NON-DOT management session has expired.');return data.session}
async function invoke(fn,body={}){let s=await session();const send=async token=>{const r=await fetch(`${cfg().supabaseUrl}/functions/v1/${fn}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,'apikey':cfg().supabaseAnonKey},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));return {r,d}};let out=await send(s.access_token);if(out.r.status===401||out.r.status===403){const refreshed=await window.nondotSupabase.auth.refreshSession();if(!refreshed.error&&refreshed.data?.session?.access_token){s=refreshed.data.session;out=await send(s.access_token)}}if(!out.r.ok||out.d?.error)throw new Error(out.d?.error||out.d?.message||`NON-DOT request failed (${out.r.status}).`);return out.d}
const read=(action,extra={})=>invoke(cfg().managementReadFunction,{action,...extra});
const write=(action,payload={})=>invoke(cfg().managementWriteFunction,{action,...payload});
const extended=(action,payload={})=>invoke(cfg().extendedWriteFunction,{action,...payload});
const portalAccess=(action,payload={})=>invoke(cfg().portalAccessFunction,{action,...payload});
const proposals=(action,payload={})=>invoke(cfg().proposalFunction,{action,...payload});
window.NONDOTApi=Object.freeze({read,write,extended,portalAccess,proposals,invoke});
})();
