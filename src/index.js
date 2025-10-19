export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Access�� �ٿ��ִ� ����� �̸��� ���
    const email = request.headers.get('Cf-Access-Authenticated-User-Email') || 'unknown';

    // ���� ����(Cloudflare�� ���̴� 2���� �ڵ�)
    const cfCountry = (request.headers.get('CF-IPCountry') || 'ZZ').toUpperCase();

    const ts = new Date().toISOString();

    // /secure => HTML
    if (path === '/secure' || path === '/secure/') {
      const body = `<!doctype html><meta charset="utf-8">
<body style="font-family:system-ui,sans-serif;padding:24px">
  <h1>${escapeHtml(email)} authenticated at ${ts} from 
    <a href="/secure/${cfCountry}">${cfCountry}</a>
  </h1>
  <p>Click the country code to view the flag served from a private R2 bucket.</p>
</body>`;
      return new Response(body, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }

    // /secure/{COUNTRY} => R2���� PNG �о� ��ȯ
    if (path.startsWith('/secure/')) {
      const code = (path.split('/')[2] || '').toUpperCase();
      if (!/^[A-Z]{2}$/.test(code)) return new Response('Invalid country code', { status: 400 });

      const key = `${code}.png`; // US.png, KR.png
      const obj = await env.FLAGS.get(key);
      if (!obj) return new Response('Not found', { status: 404 });

      const ct = (obj.httpMetadata && obj.httpMetadata.contentType) || 'image/png';
      return new Response(obj.body, { headers: { 'Content-Type': ct } });
    }

    return new Response('Not found', { status: 404 });
  }
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
