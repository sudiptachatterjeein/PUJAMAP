// Admin API. Netlify env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL
// (optional) SUPABASE_ANON_KEY. The browser sends a Supabase Auth access token; we verify it with Supabase Auth.
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization"};
const json=(status,body)=>({statusCode:status,headers,body:JSON.stringify(body)});
// Public anon key (safe to be public; same value as in admin.html). Used only to identify the project when verifying a login.
const PUBLIC_ANON_FALLBACK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icnRvcHZpeHFlbXdodnphZGRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NDIxNTEsImV4cCI6MjEwNjMxODE1MX0.YC39Z36MBaQ2twujKKIcU3otvmYLbF_h1mV7pxTTKAA";
const cfg=()=>({url:String(process.env.SUPABASE_URL||'').trim().replace(/\/+$/,'').replace(/\/rest\/v1$/i,'').replace(/\/+$/,''),key:String(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim(),anon:String(process.env.SUPABASE_ANON_KEY||'').trim()||PUBLIC_ANON_FALLBACK});
const authHeaders=k=>String(k).startsWith('eyJ')?{apikey:k,Authorization:'Bearer '+k}:{apikey:k};
async function sb(path){const c=cfg();if(!c.url||!c.key)throw Error('Supabase is not configured');const r=await fetch(c.url+'/rest/v1/'+path,{headers:{...authHeaders(c.key),'Content-Type':'application/json'}});if(!r.ok)throw Error(await r.text());return r.json()}
exports.handler=async(event)=>{
 if(event.httpMethod==='OPTIONS')return {statusCode:204,headers};
 try{
  const c=cfg();if(!c.url||!c.key)return json(500,{error:'Supabase not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify, then redeploy)'});
  const token=((event.headers||{}).authorization||'').replace(/^Bearer\s+/i,'');if(!token)return json(401,{error:'Login required'});
  const me=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.anon,Authorization:'Bearer '+token}});if(!me.ok)return json(401,{error:'Invalid session - sign in again'});
  const user=await me.json();
  const allowed=String(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
  if(!allowed)return json(500,{error:'ADMIN_EMAIL is not set in Netlify environment variables'});
  if(String(user.email||'').toLowerCase()!==allowed)return json(403,{error:'Not an admin (signed in as '+String(user.email||'?')+')'});
  const body=event.body?JSON.parse(event.body):{};
  if(body.action==='summary'){
    const since=new Date(Date.now()-90*1000).toISOString();
    const live=await sb(`visitors?last_seen=gte.${encodeURIComponent(since)}&select=visitor_code,first_seen,last_seen,current_page,device_type,user_agent,ip_address,audio_playing,location_permission,latitude,longitude&order=last_seen.desc&limit=500`);
    const total=await sb('visitors?select=visitor_code&limit=10000');
    return json(200,{live,totalCount:total.length,serverTime:new Date().toISOString()});
  }
  return json(400,{error:'Unknown action'});
 }catch(e){return json(500,{error:e.message||'Server error'});}
};
