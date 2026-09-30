export async function onRequestGet({request,env}){
  try{
    const id=new URL(request.url).searchParams.get('id');
    if(!id)return json({error:'Missing id.'},400);
    if(!env.APPS_SCRIPT_URL)return json({error:'Backend is not configured.'},500);
    const secret=env.API_SHARED_SECRET?`&token=${encodeURIComponent(env.API_SHARED_SECRET)}`:'';
    const r=await fetch(`${env.APPS_SCRIPT_URL}?action=status&id=${encodeURIComponent(id)}${secret}`);
    const text=await r.text();
    let body;try{body=JSON.parse(text)}catch{body=null}
    const status=body?.error?(body.error==='Investigation not found.'?404:400):r.status;
    return new Response(text,{status,headers:{'content-type':'application/json'}});
  }catch(e){return json({error:'Unable to retrieve investigation.'},500)}
}
function json(o,s=200){return new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}})}