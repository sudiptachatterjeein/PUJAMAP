// Netlify Function: Puja community + anonymous visitor presence.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type"};
const json=(status,body)=>({statusCode:status,headers,body:JSON.stringify(body)});
// Tolerant config: trims spaces/newlines and strips a trailing slash or "/rest/v1" if the URL was pasted that way.
const supabase=()=>({url:String(process.env.SUPABASE_URL||'').trim().replace(/\/+$/,'').replace(/\/rest\/v1$/i,'').replace(/\/+$/,''),key:String(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim()});
// Legacy service_role keys are JWTs (eyJ...) and go in both headers; new sb_secret_ keys go in apikey only.
const authHeaders=k=>String(k).startsWith('eyJ')?{apikey:k,Authorization:'Bearer '+k}:{apikey:k};
async function sb(path,opts={}){const s=supabase();if(!s.url||!s.key)throw new Error('Supabase is not configured');const r=await fetch(s.url+'/rest/v1/'+path,{...opts,headers:{...authHeaders(s.key),'Content-Type':'application/json',Prefer:'return=representation',...(opts.headers||{})}});if(!r.ok)throw new Error(await r.text());return r.status===204?[]:r.json()}
function clean(s,n=500){return String(s||'').trim().slice(0,n)}
function ip(event){const h=event.headers||{};return clean(h['x-nf-client-connection-ip']||h['x-forwarded-for']?.split(',')[0]||h['client-ip']||'',80)||null}
function device(ua){ua=String(ua||'');if(/ipad|tablet/i.test(ua))return 'Tablet';if(/mobi|android|iphone|ipod/i.test(ua))return 'Mobile';return 'Desktop'}
exports.handler=async(event)=>{
 if(event.httpMethod==='OPTIONS')return {statusCode:204,headers};
 if(event.httpMethod==='GET'){ // Health check: open /.netlify/functions/community in a browser. Shows booleans only, never secrets.
  const s=supabase();const out={function:'running',SUPABASE_URL:!!s.url,SUPABASE_SERVICE_ROLE_KEY:!!s.key,resolvedUrl:s.url,tables:{}};
  if(s.url&&s.key){for(const t of ['visitors','checkins','tips','photos']){try{await sb(t+'?select=*&limit=1');out.tables[t]='ok'}catch(e){out.tables[t]='ERROR: '+String(e.message).slice(0,120)}}
   try{const r=await fetch(s.url+'/storage/v1/bucket/puja-photos',{headers:authHeaders(s.key)});out.photoBucket=r.ok?'ok':'MISSING or no access (HTTP '+r.status+') - create a public bucket named puja-photos'}catch(e){out.photoBucket='ERROR: '+e.message}}
  return json(200,out);
 }
 try{
  const b=event.body?JSON.parse(event.body):{};const action=b.action;const pid=Number(b.pandalId);
  if(['pulse','checkin','checkout','feed','tip','photo'].includes(action)&&(!Number.isInteger(pid)||pid<0))return json(400,{error:'Invalid pandalId'});
  if(action==='visitor'){
    const code=clean(b.visitorCode,32);if(!/^[A-Za-z0-9]{6,32}$/.test(code))return json(400,{error:'Invalid visitorCode'});
    const ua=clean((event.headers||{})['user-agent'],1000);
    const now=new Date().toISOString();
    const lat=Number(b.latitude),lon=Number(b.longitude);const okLoc=b.locationPermission===true&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180;
    const loc=okLoc?{location_permission:true,latitude:lat,longitude:lon}:{location_permission:false,latitude:null,longitude:null};
    const rows=await sb('visitors?on_conflict=visitor_code',{method:'POST',body:JSON.stringify({visitor_code:code,last_seen:now,current_page:clean(b.page,300),device_type:device(ua),user_agent:ua,ip_address:ip(event),audio_playing:!!b.audioPlaying,...loc}) ,headers:{Prefer:'resolution=merge-duplicates,return=representation'}});
    return json(200,{ok:true,visitor:rows[0]});
  }
  if(action==='pulse'){
   const since=new Date(Date.now()-2*60*60*1000).toISOString();const rows=await sb(`checkins?pandal_id=eq.${pid}&created_at=gte.${encodeURIComponent(since)}&select=client_id`);return json(200,{count:new Set(rows.map(x=>x.client_id)).size});
  }
  if(action==='checkin'||action==='checkout'){
   const cid=clean(b.clientId,100);if(!cid)return json(400,{error:'clientId required'});
   if(action==='checkin')await sb('checkins',{method:'POST',body:JSON.stringify({pandal_id:pid,client_id:cid})});else await sb(`checkins?pandal_id=eq.${pid}&client_id=eq.${encodeURIComponent(cid)}`,{method:'DELETE'});
   return json(200,{ok:true});
  }
  if(action==='feed'){
   const tips=await sb(`tips?pandal_id=eq.${pid}&approved=eq.true&select=id,text,created_at&order=created_at.desc&limit=20`);const photos=await sb(`photos?pandal_id=eq.${pid}&approved=eq.true&select=id,url,created_at&order=created_at.desc&limit=12`);return json(200,{tips,photos});
  }
  if(action==='tip'){const text=clean(b.text,220),cid=clean(b.clientId,100);if(!text)return json(400,{error:'Tip required'});const rows=await sb('tips',{method:'POST',body:JSON.stringify({pandal_id:pid,text,client_id:cid,approved:true})});return json(200,{ok:true,tip:rows[0]});}
  if(action==='photo'){
   const data=String(b.dataUrl||'');if(data.length>4500000)return json(413,{error:'Image too large'});if(!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(data))return json(400,{error:'Unsupported image'});const base64=data.split(',')[1];const mime=data.match(/^data:(image\/[^;]+)/i)[1];const ext=mime.split('/')[1].replace('jpeg','jpg');const path=`community/${pid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;const raw=Buffer.from(base64,'base64');const ss=supabase();const up=await fetch(ss.url+'/storage/v1/object/puja-photos/'+path,{method:'POST',headers:{...authHeaders(ss.key),'Content-Type':mime,'x-upsert':'false'},body:raw});if(!up.ok)throw new Error(await up.text());const url=ss.url+'/storage/v1/object/public/puja-photos/'+path;const rows=await sb('photos',{method:'POST',body:JSON.stringify({pandal_id:pid,url,client_id:clean(b.clientId,100),approved:true})});return json(200,{ok:true,photo:rows[0]});
  }
  return json(400,{error:'Unknown action'});
 }catch(e){return json(500,{error:e.message||'Server error'});}
};
