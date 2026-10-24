// Open Exchange Rates 최신 환율을 1시간마다 받아 KV에 저장하고, 환율 앱에 그대로 내주는 중계 서버
const ALLOWED_ORIGINS = ['https://manjoung86.github.io', 'http://localhost:8765'];

export default {
  // 매시 5분에 한 번만 외부 API를 부른다 (하루 24회, 한 달 약 744회 < 무료 1,000회)
  async scheduled(event, env) {
    await refresh(env);
  },

  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Vary': 'Origin'
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Methods': 'GET' } });
    }
    try {
      // 배포 직후 아직 한 번도 저장되지 않았으면 그때만 직접 받아 온다
      const data = (await env.RATES.get('latest')) ?? (await refresh(env));
      return new Response(data, {
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function refresh(env) {
  const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${env.OXR_APP_ID}`);
  if (!res.ok) throw new Error(`OXR HTTP ${res.status}`);
  const { timestamp, base, rates } = await res.json();
  const data = JSON.stringify({ timestamp, base, rates });
  await env.RATES.put('latest', data);
  return data;
}
