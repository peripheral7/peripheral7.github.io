// progress-sync — 학습 진행사항 같은 작은 JSON 문서를 D1에 "버전별 스냅샷"으로 저장하는 최소 API.
//
//  - 문서 하나 = id(예: admin-law-25) 아래에 rev가 1씩 오르는 스냅샷들. 가장 높은 rev가 현재 값.
//  - 쓰기는 낙관적 잠금: 클라이언트가 자신이 마지막으로 본 rev(baseRev)를 보내고, 서버의 최신 rev와
//    같을 때만 저장된다. 다르면 409와 함께 서버 최신본을 돌려줘 클라이언트가 병합한 뒤 다시 보낸다.
//  - 최근 KEEP_REVS개 스냅샷을 남겨 두므로, 잘못 덮어써도 이전 리비전으로 되돌릴 수 있다.
//  - 인증: Authorization: Bearer <SYNC_TOKEN>(Worker 시크릿). 브라우저 CORS는 허용한 출처에만 열어 준다.
//
//  GET  /v1/docs/:id[?since=REV]      최신본 {rev, updatedAt, device, data} · 404 · since==rev면 204
//  PUT  /v1/docs/:id                  {baseRev, data, device?} → 200 {rev, updatedAt} · 409 {…최신본}
//  GET  /v1/docs/:id/history          최근 리비전 목록 {revs:[{rev, updatedAt, device, size}]}
//  GET  /v1/docs/:id/rev/:n           특정 리비전 스냅샷

const ALLOWED_ORIGINS = new Set([
  'https://peripheral7.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);
const DOC_ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const MAX_DATA_CHARS = 256 * 1024;
const KEEP_REVS = 60;

function corsHeaders(origin) {
  const h = {
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors },
  });
}

// 토큰 비교는 SHA-256 다이제스트끼리 상수 시간으로 한다(길이·내용이 새지 않도록).
async function authorized(request, env) {
  const secret = env.SYNC_TOKEN;
  if (!secret) return false;
  const header = request.headers.get('Authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(secret)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

function getLatest(env, id) {
  return env.DB
    .prepare('SELECT rev, updated_at AS updatedAt, device, data FROM docs WHERE id = ?1 ORDER BY rev DESC LIMIT 1')
    .bind(id)
    .first();
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request.headers.get('Origin'));
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/') {
      return new Response('progress-sync ok', { headers: { 'Content-Type': 'text/plain; charset=utf-8', ...cors } });
    }

    const m = url.pathname.match(/^\/v1\/docs\/([^/]+)(?:\/(history)|\/rev\/(\d+))?$/);
    if (!m) return json({ error: 'not_found' }, 404, cors);
    if (!(await authorized(request, env))) return json({ error: 'unauthorized' }, 401, cors);

    const id = m[1];
    if (!DOC_ID_RE.test(id)) return json({ error: 'bad_id' }, 400, cors);

    try {
      // ---- GET 최신본
      if (request.method === 'GET' && !m[2] && !m[3]) {
        const row = await getLatest(env, id);
        if (!row) return json({ error: 'not_found' }, 404, cors);
        const since = url.searchParams.get('since');
        if (since !== null && Number(since) === row.rev) return new Response(null, { status: 204, headers: cors });
        return json(row, 200, cors);
      }

      // ---- GET 리비전 목록
      if (request.method === 'GET' && m[2] === 'history') {
        const { results } = await env.DB
          .prepare('SELECT rev, updated_at AS updatedAt, device, size FROM docs WHERE id = ?1 ORDER BY rev DESC LIMIT ?2')
          .bind(id, KEEP_REVS)
          .all();
        return json({ revs: results }, 200, cors);
      }

      // ---- GET 특정 리비전
      if (request.method === 'GET' && m[3]) {
        const row = await env.DB
          .prepare('SELECT rev, updated_at AS updatedAt, device, data FROM docs WHERE id = ?1 AND rev = ?2')
          .bind(id, Number(m[3]))
          .first();
        return row ? json(row, 200, cors) : json({ error: 'not_found' }, 404, cors);
      }

      // ---- PUT 새 스냅샷(낙관적 잠금)
      if (request.method === 'PUT' && !m[2] && !m[3]) {
        const text = await request.text();
        if (text.length > MAX_DATA_CHARS + 1024) return json({ error: 'too_large' }, 413, cors);
        let body;
        try { body = JSON.parse(text); } catch (e) { return json({ error: 'bad_json' }, 400, cors); }
        if (!body || typeof body !== 'object') return json({ error: 'bad_json' }, 400, cors);

        const baseRev = body.baseRev;
        if (!Number.isInteger(baseRev) || baseRev < 0) return json({ error: 'bad_base_rev' }, 400, cors);
        const data = typeof body.data === 'string' ? body.data : JSON.stringify(body.data);
        if (typeof data !== 'string' || data.length > MAX_DATA_CHARS) return json({ error: 'too_large' }, 413, cors);
        try {
          const parsed = JSON.parse(data);
          if (parsed === null || typeof parsed !== 'object') throw new Error('not an object');
        } catch (e) {
          return json({ error: 'bad_data' }, 400, cors);
        }

        const device = typeof body.device === 'string' ? body.device.slice(0, 40) : null;
        const now = Date.now();
        const rev = baseRev + 1;
        let inserted = false;
        try {
          // 현재 최신 rev가 baseRev와 같을 때만 삽입된다(같은 문장 안에서 검사+삽입 → 경쟁 상태 없음).
          const results = await env.DB.batch([
            env.DB
              .prepare(
                'INSERT INTO docs (id, rev, updated_at, device, size, data) SELECT ?1, ?2, ?3, ?4, ?5, ?6 ' +
                'WHERE COALESCE((SELECT MAX(rev) FROM docs WHERE id = ?1), 0) = ?7'
              )
              .bind(id, rev, now, device, data.length, data, baseRev),
            env.DB.prepare('DELETE FROM docs WHERE id = ?1 AND rev <= ?2').bind(id, rev - KEEP_REVS),
          ]);
          inserted = results[0].meta.changes === 1;
        } catch (e) {
          // 같은 rev를 동시에 넣으려던 경우(PRIMARY KEY 충돌)도 충돌로 처리한다.
          if (!/UNIQUE|constraint/i.test(String(e && e.message))) throw e;
        }
        if (inserted) return json({ rev, updatedAt: now }, 200, cors);
        const latest = await getLatest(env, id);
        return json({ error: 'conflict', ...(latest || {}) }, 409, cors);
      }

      return json({ error: 'method_not_allowed' }, 405, cors);
    } catch (e) {
      return json({ error: 'server_error' }, 500, cors);
    }
  },
};
