// Open Exchange Rates 최신 환율을 1시간마다 받아 KV에 저장하고, 환율 앱에 그대로 내주는 중계 서버
const ALLOWED_ORIGINS = ['https://manjoung86.github.io', 'http://localhost:8765'];
// 1일 그래프용으로 시간별 기록을 이만큼 보관한다
const HISTORY_HOURS = 48;

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
    const json = (body, status = 200) => new Response(body, {
      status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
    });
    try {
      const url = new URL(request.url);
      // /history?base=USD&quote=KRW → 시간별 [{t, rate}] (t는 초 단위)
      if (url.pathname === '/history') {
        const base = url.searchParams.get('base');
        const quote = url.searchParams.get('quote');
        const history = JSON.parse((await env.RATES.get('history')) ?? '[]');
        const points = history
          .map(h => ({ t: h.t, rate: cross(h.r, base, quote) }))
          .filter(p => p.rate);
        return json(JSON.stringify(points));
      }
      // 배포 직후 아직 한 번도 저장되지 않았으면 그때만 직접 받아 온다
      return json((await env.RATES.get('latest')) ?? (await refresh(env)));
    } catch (e) {
      return json(JSON.stringify({ error: String(e) }), 502);
    }
  }
};

// 응답이 USD 기준이라 두 통화의 USD 환율로 교차 환율을 구한다
function cross(rates, base, quote) {
  const b = rates[base];
  const q = rates[quote];
  return b && q ? q / b : null;
}

async function refresh(env) {
  const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${env.OXR_APP_ID}`);
  if (!res.ok) throw new Error(`OXR HTTP ${res.status}`);
  const { timestamp, base, rates } = await res.json();
  const data = JSON.stringify({ timestamp, base, rates });
  await env.RATES.put('latest', data);

  const history = JSON.parse((await env.RATES.get('history')) ?? '[]');
  if (!history.some(h => h.t === timestamp)) history.push({ t: timestamp, r: rates });
  const cutoff = timestamp - HISTORY_HOURS * 3600;
  await env.RATES.put('history', JSON.stringify(history.filter(h => h.t >= cutoff)));
  return data;
}
