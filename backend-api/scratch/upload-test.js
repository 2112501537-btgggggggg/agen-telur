const http = require('http');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:4000';

async function api(m, p, d, t) {
  return new Promise((res) => {
    const opts = { hostname: 'localhost', port: 4000, path: p, method: m, headers: {} };
    if (t) opts.headers['Authorization'] = 'Bearer ' + t;
    const b = d ? JSON.stringify(d) : null;
    if (b) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(b); }
    const r = http.request(opts, (resp) => { let da = ''; resp.on('data', c => da += c); resp.on('end', () => { try { res({ s: resp.statusCode, b: JSON.parse(da) }); } catch { res({ s: resp.statusCode, b: da }); } }); });
    r.on('error', e => res({ s: 0, b: e.message }));
    r.setTimeout(15000, () => { r.destroy(); res({ s: 0, b: 'Timeout' }); });
    if (b) r.write(b); r.end();
  });
}

async function uploadWithFile(method, url, fields, filePath, token) {
  return new Promise((res) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
    const u = new URL(url, BASE);
    
    let bodyParts = [];
    for (const [k, v] of Object.entries(fields)) {
      bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
    }
    
    if (filePath) {
      const fileName = path.basename(filePath);
      const fileData = fs.readFileSync(filePath);
      bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`));
      bodyParts.push(fileData);
      bodyParts.push(Buffer.from('\r\n'));
    }
    
    bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
    const body = Buffer.concat(bodyParts);
    
    const opts = {
      hostname: u.hostname, port: u.port, path: u.pathname, method,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    
    const r = http.request(opts, (resp) => {
      let da = '';
      resp.on('data', c => da += c);
      resp.on('end', () => { try { res({ s: resp.statusCode, b: JSON.parse(da), h: resp.headers }); } catch { res({ s: resp.statusCode, b: da, h: resp.headers }); } });
    });
    r.on('error', e => res({ s: 0, b: e.message }));
    r.setTimeout(15000, () => { r.destroy(); res({ s: 0, b: 'Timeout' }); });
    r.write(body); r.end();
  });
}

async function run() {
  // Login admin
  let r = await api('POST', '/api/auth/login', { email: 'admin@example.com', password: 'admin123' });
  const tok = r.b?.data?.accessToken;
  console.log('Admin login:', !!tok);
  if (!tok) return;

  // Get or create category
  r = await api('GET', '/api/admin/categories', null, tok);
  let catId = null;
  if (r.b?.data && Array.isArray(r.b.data) && r.b.data.length > 0) {
    catId = r.b.data[0].id;
  }
  if (!catId) {
    r = await api('POST', '/api/admin/categories', { name: 'Image Test Cat' }, tok);
    catId = r.b?.data?.id;
  }
  console.log('Category:', catId);
  
  // Generate a small test PNG (1x1 pixel)
  // PNG minimal: 8-byte signature + IHDR + IDAT + IEND
  const pngBuffer = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52, // IHDR chunk
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41, // IDAT chunk
    0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
    0x00,0x00,0x03,0x00,0x01,0x36,0x28,0x19,
    0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44, // IEND chunk
    0xAE,0x42,0x60,0x82
  ]);
  
  const imgPath = path.join(__dirname, 'test-upload.png');
  fs.writeFileSync(imgPath, pngBuffer);
  console.log('Test image created:', imgPath, '(' + pngBuffer.length + ' bytes)');
  
  // Upload with multipart
  console.log('\n═══ Uploading product with image... ═══');
  r = await uploadWithFile('POST', '/api/admin/products', 
    { name: 'Telur Test Upload', categoryId: catId, description: 'Test upload gambar' },
    imgPath, tok
  );
  
  console.log('Response status:', r.s);
  console.log('Response body:', JSON.stringify(r.b).slice(0, 300));
  
  if (r.b?.data?.imageUrl) {
    console.log('\n✅ imageUrl:', r.b.data.imageUrl);
    
    // Try to fetch the image
    const imgUrl = new URL(r.b.data.imageUrl, BASE);
    console.log(`\n═══ Fetching image from: ${imgUrl.href} ═══`);
    
    r = await api('GET', r.b.data.imageUrl, null, null);
    console.log('Image fetch status:', r.s);
    console.log('Image response type:', typeof r.b === 'string' ? 'string (binary)' : 'object');
    console.log(r.s === 200 ? '✅ Image accessible!' : '❌ Image 404');
  } else {
    console.log('❌ No imageUrl in response');
    console.log('Full response:', JSON.stringify(r.b).slice(0, 500));
  }
  
  // Cleanup test file
  fs.unlinkSync(imgPath);
}

run().catch(console.error);
