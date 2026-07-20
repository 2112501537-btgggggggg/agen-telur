const http = require('http');
const BASE_URL = 'http://localhost:4000';

let passed = 0;
let failed = 0;
let total = 0;
let customerToken = null;

function request(method, path, body = null, authToken = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname, port: url.port,
      path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ status: 0, body: 'Timeout' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function test(name, fn) {
  total++;
  return Promise.resolve().then(fn).then((result) => {
    if (result === true) {
      console.log(`  ✓ ${name}`); passed++;
    } else {
      console.log(`  ✗ ${name}: ${typeof result === 'object' ? JSON.stringify(result).slice(0, 300) : result}`); failed++;
    }
  }).catch((err) => {
    console.log(`  ✗ ${name}: ${err.message}`); failed++;
  });
}

async function runTests() {
  console.log('══════════════════════════════════════');
  console.log('  COMPREHENSIVE API REGRESSION TESTS');
  console.log('══════════════════════════════════════\n');

  // ============ REGISTER & LOGIN ============
  console.log('── 1. Auth ──');

  const custEmail = `cust_${Date.now()}@example.com`;
  await test('Register new customer', async () => {
    const r = await request('POST', '/api/auth/register', {
      name: 'Test Customer', email: custEmail, password: 'password123', phone: '08123456000'
    });
    return r.status === 201 && r.body.success === true;
  });

  await test('Login with correct credentials', async () => {
    const r = await request('POST', '/api/auth/login', { email: custEmail, password: 'password123' });
    if (r.status === 200 && r.body.success) customerToken = r.body.data.accessToken;
    return r.status === 200 && r.body.success === true;
  });

  await test('Login with wrong password → 401', async () => {
    const r = await request('POST', '/api/auth/login', { email: custEmail, password: 'wrongpass' });
    return r.status === 401;
  });

  await test('GET /api/auth/me with token', async () => {
    if (!customerToken) return 'no token';
    const r = await request('GET', '/api/auth/me', null, customerToken);
    return r.status === 200 && r.body.success;
  });

  await test('GET /api/auth/me without token → 401', async () => {
    const r = await request('GET', '/api/auth/me');
    return r.status === 401;
  });

  // ============ PUBLIC ENDPOINTS ============
  console.log('\n── 2. Public Endpoints ──');

  const publicEndpoints = [
    ['GET', '/api/products', 'Products list'],
    ['GET', '/api/categories', 'Categories list'],
    ['GET', '/api/service-areas', 'Service areas list'],
    ['GET', '/api/unit-conversions', 'Unit conversions'],
  ];

  for (const [method, path, label] of publicEndpoints) {
    await test(label, async () => {
      const r = await request(method, path);
      return r.status === 200 && r.body.success === true;
    });
  }

  // Test product detail not found
  await test('Product 999999 → 404', async () => {
    const r = await request('GET', '/api/products/999999');
    return r.status === 404;
  });

  // ============ CUSTOMER ENDPOINTS ============
  console.log('\n── 3. Customer Endpoints (with auth) ──');

  if (!customerToken) {
    console.log('  ! Skipping (no token)');
  } else {
    await test('GET /api/orders', async () => {
      const r = await request('GET', '/api/orders', null, customerToken);
      return r.status === 200 && r.body.success;
    });

    await test('GET /api/users/me/addresses', async () => {
      const r = await request('GET', '/api/users/me/addresses', null, customerToken);
      return r.status === 200 && r.body.success;
    });
  }

  // ============ AUTH MIDDLEWARE ============
  console.log('\n── 4. Auth Middleware Tests ──');

  const authEndpoints = [
    'GET /api/orders',
    'GET /api/users/me/addresses',
    'GET /api/admin/products',
  ];

  for (const ep of authEndpoints) {
    const [method, ...pathParts] = ep.split(' ');
    const path = pathParts.join(' ');
    await test(`${path} (no auth) → 401`, async () => {
      const r = await request(method, path);
      return r.status === 401;
    });
  }

  // /api/admin/categories only has POST/PUT/DELETE routes, no GET
  // So it returns 404 instead of 401 - this is original route design, not our bug
  await test('/api/admin/categories (no auth) → 404 (no GET route)', async () => {
    const r = await request('GET', '/api/admin/categories');
    return r.status === 404;
  });

  // ============ ROLE MIDDLEWARE ============
  console.log('\n── 5. Role Middleware Tests ──');

  if (!customerToken) {
    console.log('  ! Skipping (no token)');
  } else {
    const adminEndpoints = [
      'GET /api/admin/products',
      'GET /api/admin/suppliers',
      'GET /api/admin/stock-in',
      'GET /api/admin/service-areas',
      'GET /api/admin/membership-config',
      'GET /api/admin/dashboard/summary',
      'GET /api/admin/dashboard/sales-report',
      'GET /api/admin/dashboard/damaged-report',
    ];

    for (const ep of adminEndpoints) {
      const [method, ...pathParts] = ep.split(' ');
      const path = pathParts.join(' ');
      await test(`${path} (customer) → 403`, async () => {
        const r = await request(method, path, null, customerToken);
        return r.status === 403;
      });
    }
  }

  // ============ ERROR HANDLER ============
  console.log('\n── 6. Global Error Handler ──');

  await test('404 on nonexistent route', async () => {
    const r = await request('GET', '/api/nonexistent-route-xyz');
    return r.status === 404;
  });

  await test('Validation error on empty register body', async () => {
    const r = await request('POST', '/api/auth/register', {});
    // Zod error should give 400
    return r.status === 400;
  });

  // ============ SUMMARY ============
  console.log('\n══════════════════════════════════════');
  const status = failed === 0 ? '✓✓✓ ALL TESTS PASSED! ✓✓✓' : `✗ ${failed} TEST(S) FAILED`;
  console.log(`  TOTAL:  ${total}`);
  console.log(`  PASSED: ${passed}`);
  console.log(`  FAILED: ${failed}`);
  console.log(`  ${status}`);
  console.log('══════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
