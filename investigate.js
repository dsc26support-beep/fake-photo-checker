export async function onRequestPost({request, env}) {
  try {
    const body = await request.json();
    if (!body || !body.image) return json({error:'Image is required.'},400);
    if (!['image/jpeg','image/png','image/webp'].includes(body.mimeType)) return json({error:'Unsupported image type.'},400);
    if (String(body.image).length > 7000000) return json({error:'Image is too large.'},400);
    if (!env.APPS_SCRIPT_URL) return json({error:'Backend is not configured.'},500);

    const secret = env.API_SHARED_SECRET ? `&token=${encodeURIComponent(env.API_SHARED_SECRET)}` : '';
    const url = `${env.APPS_SCRIPT_URL}?action=create${secret}`;
    const r = await fetch(url, {
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(body)
    });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = {error:'Backend returned invalid JSON.'}; }
    if (!r.ok || data.error) return json({error:data.error || 'Unable to create investigation.'}, r.ok ? 400 : r.status);
    return json(data,200);
  } catch (e) {
    return json({error:e.message || 'Unable to create investigation.'},500);
  }
}
function json(o,s=200){return new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}})}