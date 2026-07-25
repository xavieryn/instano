// Minimal App Store Connect API client (JWT ES256, no deps).
// Usage: node asc_api.js <GET|POST> <path> [json-body]
// Env: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const keyId = process.env.ASC_KEY_ID;
const issuer = process.env.ASC_ISSUER_ID;
const key = fs.readFileSync(process.env.ASC_KEY_PATH, 'utf8');

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
const payload = { iss: issuer, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' };
const signingInput = b64(header) + '.' + b64(payload);
const sign = crypto.createSign('SHA256');
sign.update(signingInput);
const signature = sign.sign({ key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
const jwt = signingInput + '.' + signature;

const method = process.argv[2] || 'GET';
const path = process.argv[3];
const body = process.argv[4];

const req = https.request({
  hostname: 'api.appstoreconnect.apple.com',
  path,
  method,
  headers: {
    Authorization: 'Bearer ' + jwt,
    'Content-Type': 'application/json',
  },
}, (res) => {
  let data = '';
  res.on('data', (c) => (data += c));
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(data);
  });
});
req.on('error', (e) => { console.error(e); process.exit(1); });
if (body) req.write(body);
req.end();
