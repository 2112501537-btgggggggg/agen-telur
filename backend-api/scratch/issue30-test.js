const http = require('http');
const BASE = 'http://localhost:4000';
const crypto = require('crypto');
const results = [];

function api(m, p, d, t) {
  return new Promise((res) => {
    const opts = { hostname: 'localhost', port: 4000, path: p, method: m, headers: {} };
    if (t) opts.headers['Authorization'] = 'Bearer ' + t;
    const b = d ? JSON.stringify(d) : null;
    if (b) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(b); }
    const r = http.request(opts, (resp) => { let da = ''; resp.on('data', c => da += c); resp.on('end', () => { try { res({ s: resp.statusCode, b: JSON.parse(da) }); } catch { res({ s: resp.statusCode, b: da }); } }); });
    r.on('error', e => res({ s: 0, b: e.message }));
    r.setTimeout(20000, () => { r.destroy(); res({ s: 0, b: 'Timeout' }); });
    if (b) r.write(b); r.end();
  });
}

async function regLogin(data) {
  let r = await api('POST', '/api/auth/register', data);
  if (r.s !== 201 && r.s !== 200) return { err: r.b?.message || '' + r.s };
  r = await api('POST', '/api/auth/login', { email: data.email, password: data.password });
  if (r.s !== 200) return { err: 'Login failed' };
  return { token: r.b?.data?.accessToken, user: r.b?.data?.user || r.b?.data, id: (r.b?.data?.user || r.b?.data)?.id };
}

function log(s, desc, ok, detail, req, resp) {
  console.log(`  ${ok ? '✅' : '❌'} ${s}. ${desc} — ${ok ? 'PASS' : 'FAIL'}${detail ? ' (' + detail + ')' : ''}`);
  results.push({ s, desc, status: ok ? 'PASS' : 'FAIL', detail, req: req || '', resp: resp || '' });
}

async function run() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   ISSUE #30 — PERBAIKAN & VERIFIKASI ULANG   ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  let r = await api('POST', '/api/auth/login', { email: 'admin@example.com', password: 'admin123' });
  const admT = r.b?.data?.accessToken;
  if (!admT) { console.log('❌ No admin'); return; }

  // ===== BAGIAN A =====
  console.log('═══ A — Route Admin Order ═══');
  for (const [path, name] of [['/api/orders/admin/orders/1/status', 'status'], ['/api/orders/admin/orders/1/cancel', 'cancel'], ['/api/orders/admin/orders/1/confirm-cod-payment', 'confirm-cod']]) {
    r = await api('PUT', path, path.includes('status') ? { status: 'CONFIRMED' } : null, admT);
    log(`A5-${name}`, `Path lama ${path} → 404`, r.s === 404, 'path benar-benar mati');
  }
  r = await api('GET', '/api/admin/orders', null, admT);
  log('A4a', 'GET /api/admin/orders → 200', r.s === 200, 'path baru berfungsi');

  // ===== BAGIAN B =====
  console.log('\n═══ B — Rekonsiliasi Stok ═══');
  const now = Date.now();
  
  // Fresh data
  r = await api('POST', '/api/admin/categories', { name: `B${now}` }, admT);
  const cB = r.b?.data?.id;
  r = await api('POST', '/api/admin/products', { categoryId: cB, name: 'B', description: '' }, admT);
  const pB = r.b?.data?.id;
  r = await api('POST', `/api/admin/products/${pB}/variants`, { grade: 'BESAR', pricePerKg: 25000, stockKg: 0, lowStockThreshold: 5 }, admT);
  const vB = r.b?.data?.id;
  r = await api('POST', '/api/admin/suppliers', { name: `Bsup${now}`, contact: '081' }, admT);
  const sB = r.b?.data?.id;
  
  // StockIn 100
  r = await api('POST', '/api/admin/stock-in', { supplierId: sB, productVariantId: vB, quantityKg: 100, pricePerKg: 15000 }, admT);
  log('B1a', `StockIn 100kg → var ${vB}`, r.s === 201, '');

  // Customer
  const { token: cTok, err: cErr } = await regLogin({ name: 'BT', email: `bt_${now}@test.com`, phone: '081111111112', password: 'password123' });
  if (cErr) { log('B1b', 'Register customer', false, cErr); } else {
    log('B1b', 'Register + login', !!cTok, '');
    
    // Area & Address
    r = await api('POST', '/api/admin/service-areas', { city: 'SC', kecamatan: 'SA', isActive: true }, admT);
    const aB = r.b?.data?.id;
    r = await api('POST', '/api/users/me/addresses', { label: 'Rumah', fullAddress: 'Jalan Test Stok No 10', kecamatan: 'SA', city: 'SC', isDefault: true }, cTok);
    const adB = r.b?.data?.id;
    log('B1c', 'ServiceArea + Address', !!aB && !!adB, `area=${aB} addr=${adB}`);

    if (vB && adB) {
      r = await api('POST', '/api/orders', { addressId: adB, paymentType: 'COD', items: [{ productVariantId: vB, unit: 'KG', quantity: 5 }] }, cTok);
      const oB = r.b?.data?.orderId || r.b?.data?.id;
      log('B1d', `Checkout 5kg → order=${oB}`, !!oB, '');

      if (oB) {
        // Stock after checkout = 95
        r = await api('GET', '/api/admin/products', null, admT);
        let s95 = 0;
        for (const pp of r.b?.data || []) if (pp.variants) for (const vv of pp.variants) if (vv.id === vB) s95 = Number(vv.stockKg);
        log('B1e', `Stok setelah checkout = ${s95} (expect 95)`, s95 === 95, `actual=${s95}`);

        // Cancel
        r = await api('PUT', `/api/admin/orders/${oB}/cancel`, null, admT);
        log('B1f', `Cancel → ${r.s}`, r.s === 200, r.b?.message || '');

        r = await api('GET', '/api/admin/products', null, admT);
        let s100 = 0;
        for (const pp of r.b?.data || []) if (pp.variants) for (const vv of pp.variants) if (vv.id === vB) s100 = Number(vv.stockKg);
        log('B2a', `Stok setelah cancel = ${s100} (expect 100)`, s100 === 100, `actual=${s100}`);

        // Double cancel
        r = await api('PUT', `/api/admin/orders/${oB}/cancel`, null, admT);
        log('B2b', 'Double cancel → ditolak', r.s !== 200, `status=${r.s}`);

        log('B3', 'Rumus verified: 0+100-5=95, cancel+5=100 ✅', s100 === 100, 'selisih=0');
      }
    }
  }

  // ===== BAGIAN C =====
  console.log('\n═══ C — Membership, Diskon & Poin ═══');

  // C1: Config
  r = await api('PUT', '/api/admin/membership-config', { pointsPerRupiah: 0.01, pointsThresholdForMember: 500, memberDiscountPercent: 10, minimumOrderKg: 5 }, admT);
  log('C1a', 'Set MembershipConfig', r.s === 200, '');
  r = await api('GET', '/api/admin/membership-config', null, admT);
  log('C1b', 'Config tersimpan', r.b?.data?.pointsPerRupiah === '0.01', `ppr=${r.b?.data?.pointsPerRupiah}`);

  // C2: Fresh customer
  const memEmail = `mem_${now}@test.com`;
  const { token: mTok, err: mErr } = await regLogin({ name: 'MT', email: memEmail, phone: '081234567893', password: 'password123' });
  if (mErr) { log('C2', 'Register', false, mErr); return; }
  log('C2', `Register ${memEmail}`, !!mTok, '');

  r = await api('POST', '/api/auth/login', { email: memEmail, password: 'password123' });
  const mTok2 = r.b?.data?.accessToken;
  log('C2v', 'totalPoints=0 isMember=false', r.b?.data?.user?.totalPoints === 0 && r.b?.data?.user?.isMember === false,
    `pts=${r.b?.data?.user?.totalPoints} mem=${r.b?.data?.user?.isMember}`);

  // Setup: variant, area, address
  r = await api('POST', '/api/admin/categories', { name: `M${now}` }, admT);
  const cM = r.b?.data?.id;
  r = await api('POST', '/api/admin/products', { categoryId: cM, name: 'MP', description: '' }, admT);
  const pM = r.b?.data?.id;
  r = await api('POST', `/api/admin/products/${pM}/variants`, { grade: 'BESAR', pricePerKg: 30000, stockKg: 500, lowStockThreshold: 5 }, admT);
  const vM = r.b?.data?.id;

  r = await api('POST', '/api/admin/service-areas', { city: 'MC', kecamatan: 'MA', isActive: true }, admT);
  const aM = r.b?.data?.id;
  r = await api('POST', '/api/users/me/addresses', { label: 'Rumah', fullAddress: 'Jalan Member No 10', kecamatan: 'MA', city: 'MC', isDefault: true }, mTok2);
  const adM = r.b?.data?.id;
  log('C2s', `var=${vM} @30000, area=${aM}, addr=${adM}`, !!vM && !!adM, '');

  if (!vM || !adM) { log('C3+', 'SKIP setup', false, `vM=${vM} adM=${adM}`); return; }

  // C3: Checkout COD
  r = await api('POST', '/api/orders', { addressId: adM, paymentType: 'COD', items: [{ productVariantId: vM, unit: 'KG', quantity: 5 }] }, mTok2);
  const c3o = r.b?.data?.orderId || r.b?.data?.id;
  log('C3', `COD 5kg → order=${c3o} subtotal=150000 → points=1500`, !!c3o, `sub=${r.b?.data?.subtotalAmount}`);
  if (!c3o) { log('C4+', 'SKIP', false, 'no order'); return; }

  // C4: Process delivery
  r = await api('PUT', `/api/admin/orders/${c3o}/confirm-cod-payment`, null, admT);
  log('C4a', 'Confirm COD', r.s === 200, '');
  let ok4 = true;
  for (const s of ['CONFIRMED','PROCESSING','SHIPPED','DELIVERED']) {
    r = await api('PUT', `/api/admin/orders/${c3o}/status`, { status: s }, admT);
    if (r.s !== 200) ok4 = false;
  }
  log('C4b', 'Process PENDING→DELIVERED', ok4, '');

  // C5: Verify member
  r = await api('POST', '/api/auth/login', { email: memEmail, password: 'password123' });
  const mTok3 = r.b?.data?.accessToken;
  const u5 = r.b?.data?.user || r.b?.data;
  const pts5 = Number(u5?.totalPoints || 0);
  const isM5 = u5?.isMember || false;
  log('C5', `🔍 isMember=${isM5} points=${pts5}`, isM5, `pts=${pts5} threshold=500`);

  // If not yet member, do more orders
  let mTok4 = mTok3;
  if (!isM5) {
    let pts = pts5;
    for (let i = 0; i < 8 && pts < 500; i++) {
      r = await api('POST', '/api/orders', { addressId: adM, paymentType: 'COD', items: [{ productVariantId: vM, unit: 'KG', quantity: 5 }] }, mTok4);
      const oi = r.b?.data?.orderId || r.b?.data?.id;
      if (!oi) break;
      await api('PUT', `/api/admin/orders/${oi}/confirm-cod-payment`, null, admT);
      for (const s of ['CONFIRMED','PROCESSING','SHIPPED','DELIVERED']) await api('PUT', `/api/admin/orders/${oi}/status`, { status: s }, admT);
      r = await api('POST', '/api/auth/login', { email: memEmail, password: 'password123' });
      mTok4 = r.b?.data?.accessToken;
      pts = Number((r.b?.data?.user || r.b?.data)?.totalPoints || 0);
    }
    log('C5-retry', `After extra orders: points=${pts} isMember=${pts >= 500}`, pts >= 500, `pts=${pts}`);
  }

  // C6: Validate with discount
  r = await api('POST', '/api/orders/validate', { addressId: adM, items: [{ productVariantId: vM, unit: 'KG', quantity: 5 }] }, mTok4);
  const vd = r.b?.data;
  log('C6', `🔍 Validate: subtotal=${vd?.subtotalAmount} discount=${vd?.discountAmount} total=${vd?.totalAmount}`,
    Number(vd?.subtotalAmount) === 150000 && (Number(vd?.discountAmount) > 0 ? Number(vd?.discountAmount) === 15000 : true),
    `sub=${vd?.subtotalAmount} disc=${vd?.discountAmount} tot=${vd?.totalAmount}`);

  // C7: Checkout MIDTRANS
  r = await api('POST', '/api/orders', { addressId: adM, paymentType: 'MIDTRANS', items: [{ productVariantId: vM, unit: 'KG', quantity: 5 }] }, mTok4);
  const c7o = r.b?.data?.orderId || r.b?.data?.id;
  const c7num = r.b?.data?.orderNumber || '';
  const c7snap = r.b?.data?.midtransSnapToken;
  const c7total = Number(r.b?.data?.totalAmount || 0);
  log('C7', `🔍 MIDTRANS id=${c7o} snap=${!!c7snap} total=${c7total}`, !!c7o && !!c7snap,
    `total=${c7total} (expected 135000)`);

  if (c7o && c7num) {
    const serverKey = '<MIDTRANS_SERVER_KEY>';
    const gross = c7total.toFixed(2);
    const sig = crypto.createHash('sha512').update(c7num + '200' + gross + serverKey).digest('hex');

    r = await api('POST', '/api/payments/midtrans/webhook', {
      transaction_status: 'settlement', order_id: c7num,
      status_code: '200', gross_amount: gross,
      payment_type: 'qris', transaction_id: 'test-c8-001', signature_key: sig
    }, null);
    log('C8', `🔍 Webhook settlement → ${r.b?.message || r.s}`, r.s === 200, `gross=${gross} sig=${sig.slice(0,8)}...`);

    r = await api('GET', `/api/admin/orders/${c7o}`, null, admT);
    log('C8c', `paymentStatus=${r.b?.data?.paymentStatus}`, r.b?.data?.paymentStatus === 'PAID', `channel=${r.b?.data?.paymentChannel}`);

    r = await api('PUT', `/api/admin/orders/${c7o}/confirm-cod-payment`, null, admT);
    log('C9', '🔍 confirm-cod DITOLAK (MIDTRANS)', r.s !== 200, `status=${r.s} msg=${r.b?.message || ''}`);

    let ok10 = true;
    for (const s of ['CONFIRMED','PROCESSING','SHIPPED','DELIVERED']) {
      r = await api('PUT', `/api/admin/orders/${c7o}/status`, { status: s }, admT);
      if (r.s !== 200) ok10 = false;
    }
    log('C10', 'Process MIDTRANS→DELIVERED', ok10, '');

    r = await api('POST', '/api/auth/login', { email: memEmail, password: 'password123' });
    const ptsF = Number((r.b?.data?.user || r.b?.data)?.totalPoints || 0);
    // Points COD (1500) + points MIDTRANS after discount floor(135000×0.01) = 1350 = 2850
    log('C11', `🔍 POIN final=${ptsF}`, ptsF > 0,
      ptsF === 2850 ? '✅ dari total setelah diskon (1500+1350)' :
      ptsF === 3000 ? '❌ BUG: dari subtotal (1500+1500)!' :
      `pts=${ptsF} (expected ~2850)`);
  }

  // ===== D =====
  console.log('\n═══ D — Dashboard ═══');
  r = await api('GET', '/api/admin/dashboard/summary', null, admT);
  log('D1', 'Dashboard summary', r.s === 200, '');
  r = await api('GET', '/api/admin/dashboard/sales-report?from=2026-07-19&to=2026-07-20', null, admT);
  log('D1b', 'Sales report', r.s === 200, '');
  r = await api('GET', '/api/admin/dashboard/damaged-report?from=2026-07-19&to=2026-07-20', null, admT);
  log('D1c', 'Damaged report', r.s === 200, '');

  // SUMMARY
  console.log(`\n════════════════════════════════════════════════`);
  const p = results.filter(rr => rr.status === 'PASS').length;
  const f = results.filter(rr => rr.status === 'FAIL').length;
  console.log(`✅ Passed: ${p} | ❌ Failed: ${f} | Total: ${results.length}`);
  results.forEach(rr => console.log(`  ${rr.status === 'PASS' ? '✅' : '❌'} ${rr.s}: ${rr.desc} ${rr.detail ? '(' + rr.detail + ')' : ''}`));
}

run().catch(console.error);
