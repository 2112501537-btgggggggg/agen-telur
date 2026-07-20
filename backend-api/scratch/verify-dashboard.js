const http = require('http');
const BASE = 'http://localhost:4000';

function api(m, p, d, t) {
  return new Promise((res) => {
    const opts = { hostname: 'localhost', port: 4000, path: p, method: m, headers: {} };
    if (t) opts.headers['Authorization'] = 'Bearer ' + t;
    const b = d ? JSON.stringify(d) : null;
    if (b) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(b); }
    const r = http.request(opts, (resp) => {
      let da = '';
      resp.on('data', c => da += c);
      resp.on('end', () => { try { res({ s: resp.statusCode, b: JSON.parse(da) }); } catch { res({ s: resp.statusCode, b: da }); } });
    });
    r.on('error', e => res({ s: 0, b: e.message }));
    r.setTimeout(10000, () => { r.destroy(); res({ s: 0, b: 'Timeout' }); });
    if (b) r.write(b); r.end();
  });
}

async function run() {
  let r = await api('POST', '/api/auth/login', { email: 'admin@example.com', password: 'admin123' });
  const tok = r.b?.data?.accessToken;
  if (!tok) { console.log('❌ No token'); return; }

  // 1. Dashboard Summary
  console.log('═══ D1 — Dashboard Summary ═══\n');
  r = await api('GET', '/api/admin/dashboard/summary', null, tok);
  const ds = r.b?.data || r.b;
  console.log('Response:', JSON.stringify(r.b, null, 2));

  // 2. Get all PAID orders today to calculate manually
  console.log('\n═══ Manual Calculation: PAID Orders Today ═══\n');
  r = await api('GET', '/api/admin/orders', null, tok);
  const orders = r.b?.data || [];
  
  const today = new Date().toISOString().slice(0, 10); // 2026-07-20
  let paidOrders = [];
  let totalPaidAmount = 0;
  
  for (const o of orders) {
    if (o.paymentStatus === 'PAID') {
      const amt = Number(o.totalAmount || 0);
      totalPaidAmount += amt;
      paidOrders.push({ id: o.id, number: o.orderNumber, total: amt, status: o.status, paymentStatus: o.paymentStatus });
    }
  }
  
  console.log(`Today: ${today}`);
  console.log(`\nPAID orders found: ${paidOrders.length}`);
  console.log('PAID orders detail:');
  paidOrders.forEach(o => console.log(`  Order #${o.id} (${o.number}): totalAmount=${o.total} status=${o.status}`));
  console.log(`\nManual total PAID orders: ${totalPaidAmount}`);
  console.log(`Dashboard salesToday: ${ds?.salesToday || 'N/A'}`);
  
  const dashSales = Number(ds?.salesToday || 0);
  const match = dashSales === totalPaidAmount;
  console.log(`${match ? '✅' : '❌'} Match: dashboard(${dashSales}) vs manual(${totalPaidAmount})`);

  // 3. Also check today's sales from sales report
  console.log('\n═══ D1b — Sales Report ═══\n');
  r = await api('GET', `/api/admin/dashboard/sales-report?from=${today}&to=${today}`, null, tok);
  const sr = r.b?.data || r.b;
  console.log('Sales report:', JSON.stringify(r.b, null, 2).slice(0, 500));

  // 4. Damaged report
  console.log('\n═══ D1c — Damaged Report ═══\n');
  r = await api('GET', `/api/admin/dashboard/damaged-report?from=${today}&to=${today}`, null, tok);
  console.log('Damaged report:', JSON.stringify(r.b, null, 2).slice(0, 500));

  // OUTPUT for TESTING.md
  console.log('\n═══ DATA FOR TESTING.md ═══\n');
  console.log('```');
  console.log(`Dashboard Summary:`);
  console.log(JSON.stringify(ds, null, 2));
  console.log(`\nPAID Orders Manual Count:`);
  console.log(`  Total orders PAID today: ${paidOrders.length}`);
  paidOrders.forEach(o => console.log(`  - #${o.id}: Rp${o.total.toLocaleString()}`));
  console.log(`  Grand total: Rp${totalPaidAmount.toLocaleString()}`);
  console.log(`  Dashboard claims: Rp${dashSales.toLocaleString()}`);
  console.log(`  Match: ${match ? '✅ YES' : '❌ NO'}`);
  console.log('```');
}

run().catch(console.error);
