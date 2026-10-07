/* screenings4u Workforce NON-DOT Management Portal — standalone configuration */
(()=>{
  "use strict";
  const config=Object.freeze({
    portalName:"screenings4u Workforce NON-DOT Management Portal",
    portalHost:"non-dot-portal.screenings4u.com",
    managedWebsite:"https://non-dot.screenings4u.com",
    supabaseUrl:"https://elpbnytpciqnbexiaebp.supabase.co",
    supabaseAnonKey:"sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC",
    staffContextFunction:"screenings4u-staff-context",
    managementReadFunction:"nondot-management-read",
    managementWriteFunction:"nondot-management-actions",
    extendedWriteFunction:"nondot-management-actions",
    portalAccessFunction:"nondot-portal-control",
    proposalFunction:"nondot-proposal-management",
    storageKey:"s4u-nondot-management-session"
  });
  window.NONDOT_PORTAL_CONFIG=config;
  if(window.supabase?.createClient){
    window.nondotSupabase=window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.sessionStorage,storageKey:config.storageKey}});
  }else console.error('[NON-DOT Portal] Supabase JS is unavailable.');
})();
