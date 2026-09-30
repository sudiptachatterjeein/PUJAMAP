// Netlify Function: server-side AI concierge proxy.
// Required environment variable: ANTHROPIC_API_KEY
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type"};
const json=(status,body)=>({statusCode:status,headers,body:JSON.stringify(body)});
exports.handler=async(event)=>{
 if(event.httpMethod==='OPTIONS')return {statusCode:204,headers};
 try{
  const key=process.env.ANTHROPIC_API_KEY;if(!key)return json(503,{error:'AI not configured'});
  const b=event.body?JSON.parse(event.body):{};const prompt=String(b.prompt||'').slice(0,1000);const region=String(b.region||'Kolkata').slice(0,100);const places=Array.isArray(b.selected)?b.selected.slice(0,25):[];
  const system=`You are a practical Kolkata Durga Puja route concierge. Use only the supplied place list as factual place data. Do not invent live crowd conditions, weather, fares, opening hours, accessibility or official links. Clearly label suggestions as suggestions. Keep the answer concise and mobile-friendly. User region: ${region}. Places: ${JSON.stringify(places)}`;
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:600,system,messages:[{role:'user',content:prompt}]})});
  if(!r.ok)return json(r.status,{error:'AI provider error'});const d=await r.json();const answer=(d.content||[]).map(x=>x.text||'').join('\n').trim();return json(200,{answer});
 }catch(e){return json(500,{error:e.message||'Server error'});}
};
