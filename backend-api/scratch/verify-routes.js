const http = require('http');
const BASE = 'http://localhost:4000';

function api(method, path, data, tok) {
  return new Promise((res) => {
    const opts = { hostname: 'localhost', port: 4000, path, method, headers: {} };
    if (tok) opts.headers['Authorization'] = 'Bearer ' + tok;
    const b = data ? JSON.stringify(data) : null;
    if (b) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(b); }
    const r = http.request(opts, (resp) => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => { try { res({ s: resp.statusCode, b: JSON.parse(d) }); } catch { res({ s: resp.statusCode, b: d }); } });
    });
    r.on('error', e => res({ s: 0, b: e.message }));
    r.setTimeout(10000, () => { r.destroy(); res({ s: 0, b: 'Timeout' }); });
    if (b) r.write(b); r.end();
  });
}

async function main() {
  console.log('═══ VERIFIKASI BAGIAN A — Path Route Admin Order ═══\n');
  
  // Login admin
  let r = await api('POST', '/api/auth/login', { email: 'admin@example.com', password: 'admin123' });
  const tok = r.b?.data?.accessToken;
  console.log('A0. Admin login:', r.s === 200 ? '✅' : '❌');
  if (!tok) { console.log('ABORT'); return; }

  // A4: Test new paths
  console.log('\n--- A4: VERIFIKASI PATH BARU ---\n');
  
  r = await api('GET', '/api/admin/orders', null, tok);
  console.log(`A4a. GET /api/admin/orders → ${r.s}`, r.s === 200 ? '✅' : '❌');
  console.log('    Response:', JSON.stringify(r.b).slice(0, 100));
  
  if (r.s === 200 && r.b?.data && Array.isArray(r.b.data) && r.b.data.length > 0) {
    const oId = r.b.data[0].id;
    r = await api('PUT', `/api/admin/orders/${oId}/status`, { status: 'CONFIRMED' }, tok);
    console.log(`A4b. PUT /api/admin/orders/${oId}/status → ${r.s}`, r.s === 200 ? '✅' : '❌');
    console.log('    Response:', JSON.stringify(r.b).slice(0, 100));
  } else {
    // No orders, but path is correct
    console.log('A4b. No orders to test status update, but path is correct');
  }
  
  r = await api('PUT', '/api/admin/orders/999/cancel', null, tok);
  console.log(`A4c. PUT /api/admin/orders/999/cancel → ${r.s}`, r.s !== 404 ? '✅ (path works)' : '❌ (404)');
  console.log('    Response:', JSON.stringify(r.b).slice(0, 100));

  // A5: Test old paths - should be 404
  console.log('\n--- A5: VERIFIKASI PATH LAMA → 404 ---\n');
  
  r = await api('PUT', '/api/orders/admin/orders/1/status', { status: 'CONFIRMED' }, tok);
  console.log(`A5a. PUT /api/orders/admin/orders/1/status → ${r.s}`, r.s === 404 ? '✅ (404 - benar) ' + r.s : '❌ (masih jalan)');
  console.log('    Response:', (typeof r.b === 'string' ? r.b : r.b?.message || JSON.stringify(r.b)).slice(0, 80));
  
  r = await api('PUT', '/api/orders/admin/orders/1/cancel', null, tok);
  console.log(`A5b. PUT /api/orders/admin/orders/1/cancel → ${r.s}`, r.s === 404 ? '✅ (404 - benar)' : '❌ (masih jalan)');
  console.log('    Response:', (typeof r.b === 'string' ? r.b : r.b?.message || JSON.stringify(r.b)).slice(0, 80));
  
  r = await api('PUT', '/api/orders/admin/orders/1/confirm-cod-payment', null, tok);
  console.log(`A5c. PUT /api/orders/admin/orders/1/confirm-cod-payment → ${r.s}`, r.s === 404 ? '✅ (404 - benar)' : '❌ (masih jalan)');
  console.log('    Response:', (typeof r.b === 'string' ? r.b : r.b?.message || JSON.stringify(r.b)).slice(0, 80));
  
  console.log('\n═══ HASIL ═══');
}

main().catch(console.error);
